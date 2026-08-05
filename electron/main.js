"use strict";

/**
 * Electron shell for Multiplyer.
 *
 * The app's API routes need a server, so rather than statically exporting the
 * UI we run Next's standalone server as a child process on a loopback port and
 * point a BrowserWindow at it. Electron ships its own Node, so the child is
 * forked with ELECTRON_RUN_AS_NODE rather than requiring Node on the machine.
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, shell, safeStorage } =
  require("electron");
const { fork } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const isDev = !app.isPackaged;

/**
 * Dev-only simulated mode: MULTIPLYER_MOCK points at a local stand-in for the
 * Anthropic API (see scratchpad mock). Skips key onboarding and routes the
 * server's SDK at the mock, so the whole app can be exercised with no key.
 * Ignored in packaged builds — a shipped binary never mocks.
 */
const mockBaseUrl = isDev ? process.env.MULTIPLYER_MOCK || "" : "";

/** Where the prepared standalone bundle lives in each mode. */
function serverDir() {
  return isDev
    ? path.join(__dirname, "..", ".next", "standalone")
    : path.join(process.resourcesPath, "server");
}

// ---------------------------------------------------------------------------
// API key storage
//
// A desktop binary must never contain a vendor API key — anything shipped can
// be extracted from the package. The user supplies their own; we keep it in
// userData, encrypted with the OS keychain when that is available.
// ---------------------------------------------------------------------------

function configPath() {
  return path.join(app.getPath("userData"), "config.json");
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), "utf8"));
  } catch {
    return {};
  }
}

function loadApiKey() {
  const cfg = readConfig();
  if (cfg.apiKeyEncrypted && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(cfg.apiKeyEncrypted, "base64"));
    } catch {
      return "";
    }
  }
  return cfg.apiKey || "";
}

function saveApiKey(key) {
  const trimmed = (key || "").trim();
  const cfg = {};
  if (trimmed) {
    if (safeStorage.isEncryptionAvailable()) {
      cfg.apiKeyEncrypted = safeStorage.encryptString(trimmed).toString("base64");
    } else {
      // No OS keychain (some Linux setups). Still user-local, still not shipped.
      cfg.apiKey = trimmed;
    }
  }
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), {
    mode: 0o600,
  });
}

// ---------------------------------------------------------------------------
// Next standalone server lifecycle
// ---------------------------------------------------------------------------

let serverProcess = null;
let serverPort = 0;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error("The app server did not start in time."));
        } else {
          setTimeout(attempt, 250);
        }
      });
    };
    attempt();
  });
}

async function startServer() {
  const dir = serverDir();
  const entry = path.join(dir, "server.js");
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Missing server bundle at ${entry}. Run "npm run build:desktop" first.`,
    );
  }

  serverPort = await freePort();

  // Always capture the child's output. A packaged app that fails silently is
  // undiagnosable for the user and for us; this log is the first thing to ask
  // for in a bug report.
  const logPath = path.join(app.getPath("userData"), "server.log");
  let logFd = null;
  if (!isDev) {
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      logFd = fs.openSync(logPath, "w");
    } catch {
      logFd = null;
    }
  }

  serverProcess = fork(entry, [], {
    cwd: dir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(serverPort),
      HOSTNAME: "127.0.0.1",
      ANTHROPIC_API_KEY: mockBaseUrl ? "mock-key" : loadApiKey(),
      ...(mockBaseUrl ? { ANTHROPIC_BASE_URL: mockBaseUrl } : {}),
      // Lets the app tailor its "no key" message to the desktop flow.
      MULTIPLYER_DESKTOP: "1",
    },
    stdio: isDev
      ? "inherit"
      : logFd === null
        ? "ignore"
        : ["ignore", logFd, logFd, "ipc"],
  });

  serverProcess.on("exit", (code) => {
    serverProcess = null;
    // A crash after the window is up leaves a dead shell; surface it.
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox(
        "Multiplyer stopped",
        "The local app server exited unexpectedly. Restart the app.",
      );
    }
  });

  await waitForServer(serverPort);
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

/** The API key is read at server start, so changing it means a restart. */
async function restartServer() {
  stopServer();
  await startServer();
}

// ---------------------------------------------------------------------------
// Key validation — a key is only saved after Anthropic accepts it. Runs in
// the main process so the renderer never does anything sensitive.
// ---------------------------------------------------------------------------

async function validateKey(key) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      signal: ctrl.signal,
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) {
      return { ok: false, error: "Anthropic rejected this key. Check for a typo or a revoked key." };
    }
    return { ok: false, error: `Anthropic answered with an unexpected status (${res.status}). Try again.` };
  } catch {
    return {
      ok: false,
      error: "Could not reach api.anthropic.com. Check your connection and try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------

let mainWindow = null;

function appUrl(pathname = "/") {
  return `http://127.0.0.1:${serverPort}${pathname}`;
}

function createMainWindow(initialPath) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#0b0b0d",
    title: "Multiplyer",
    show: false,
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Keep external links in the user's browser, not in the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(appUrl(initialPath));
}

/** Onboarding doubles as the change-key screen, so there is one surface. */
function openOnboarding() {
  if (mainWindow) mainWindow.loadURL(appUrl("/welcome"));
}

function buildMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { label: "Anthropic API key…", click: openOnboarding },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        ...(process.platform === "darwin"
          ? []
          : [{ label: "Anthropic API key…", click: openOnboarding }]),
        { type: "separator" },
        { role: process.platform === "darwin" ? "close" : "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(isDev ? [{ role: "toggleDevTools" }] : []),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

ipcMain.handle("key:get", () => {
  const key = loadApiKey();
  // Never hand the full secret back to a renderer; a masked hint is enough
  // to show "a key is set" without re-exposing it.
  return key ? `${key.slice(0, 7)}…${key.slice(-4)}` : "";
});

ipcMain.handle("key:save", async (_event, key) => {
  const trimmed = String(key ?? "").trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "That does not look like an API key." };
  }

  const verdict = await validateKey(trimmed);
  if (!verdict.ok) return verdict;

  saveApiKey(trimmed);
  // The key is read at server boot, so a restart makes it live; then land
  // the user in the app proper.
  await restartServer();
  if (mainWindow) mainWindow.loadURL(appUrl("/app"));
  return { ok: true };
});

ipcMain.handle("onboarding:skip", () => {
  if (mainWindow) mainWindow.loadURL(appUrl("/app"));
});

// Agent runs execute on Multiplyer's hosted API — our provider keys never
// ship inside the binary. Mock mode keeps everything local.
ipcMain.handle("api:base", () =>
  mockBaseUrl ? "" : "https://multiplyer.vercel.app",
);

ipcMain.handle("user:name", () => {
  try {
    return require("node:os").userInfo().username || "";
  } catch {
    return "";
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

// multiplyer:// links (the web auth flow's way back into the app). On
// Windows/Linux a protocol launch arrives as a second instance's argv; on
// macOS as open-url. Either way: surface the window and land on the app.
app.setAsDefaultProtocolClient("multiplyer");

function focusApp() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  mainWindow.loadURL(appUrl("/app"));
}

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (argv.some((a) => a.startsWith("multiplyer://"))) focusApp();
    }
  });

  app.on("open-url", (event) => {
    event.preventDefault();
    focusApp();
  });

  app.whenReady().then(async () => {
    buildMenu();
    try {
      await startServer();
    } catch (err) {
      dialog.showErrorBox(
        "Multiplyer failed to start",
        `${String(err.message ?? err)}\n\nDetails were written to:\n${path.join(
          app.getPath("userData"),
          "server.log",
        )}`,
      );
      app.quit();
      return;
    }
    // Managed providers mean no key gate: everyone lands in the app. The
    // welcome screen stays reachable from the menu for own-key holdouts.
    const entryPath = () => "/app";
    createMainWindow(entryPath());

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(entryPath());
      }
    });
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
    stopServer();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
