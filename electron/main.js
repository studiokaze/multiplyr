"use strict";

/**
 * Electron shell for Multiplyer.
 *
 * The app's API routes need a server, so rather than statically exporting the
 * UI we run Next's standalone server as a child process on a loopback port and
 * point a BrowserWindow at it. Electron ships its own Node, so the child is
 * forked with ELECTRON_RUN_AS_NODE rather than requiring Node on the machine.
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } =
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

function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.listen(port, "127.0.0.1", () => srv.close(() => resolve(true)));
  });
}

/**
 * A STABLE port, not a random one: localStorage is scoped to the origin,
 * and a new port every launch means a new origin — which wiped the saved
 * name, past runs and preferences on every restart. Fixed candidates first,
 * random only as a last resort.
 */
async function pickPort() {
  for (const candidate of [43117, 43118, 43119]) {
    if (await portFree(candidate)) return candidate;
  }
  return freePort();
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


/** Dev only: the standalone server does not read the repo's .env.local, so
 *  provider keys are parsed here and handed to the fork — local runs then
 *  work even without the hosted API. Packaged builds skip this entirely. */
function devProviderEnv() {
  if (!isDev) return {};
  try {
    const raw = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
    const out = {};
    for (const name of ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "GROQ_API_KEY"]) {
      const m = raw.match(new RegExp("^" + name + "=(.+)$", "m"));
      if (m && m[1].trim()) out[name] = m[1].trim();
    }
    return out;
  } catch {
    return {};
  }
}

async function startServer() {
  const dir = serverDir();
  const entry = path.join(dir, "server.js");
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Missing server bundle at ${entry}. Run "npm run build:desktop" first.`,
    );
  }
  // A plain `next build` regenerates standalone WITHOUT the static assets,
  // which boots into an unstyled page. Refuse loudly instead.
  if (!fs.existsSync(path.join(dir, ".next", "static"))) {
    throw new Error(
      `Server bundle at ${dir} has no static assets — it came from a plain ` +
        `"next build". Run "npm run build:desktop" and relaunch.`,
    );
  }

  serverPort = await pickPort();

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
      ANTHROPIC_API_KEY: mockBaseUrl ? "mock-key" : "",
      ...devProviderEnv(),
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
    // Cursor-style top line: the app draws a slim bar with the mark and the
    // menus; the OS only overlays its window controls on the right.
    ...(process.platform !== "darwin"
      ? {
          titleBarStyle: "hidden",
          titleBarOverlay: {
            color: "#0b0b0d",
            symbolColor: "#f2f1ee",
            height: 36,
          },
        }
      : {}),
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

/** The title bar's HTML labels pop these real native menus. */
function menuTemplate() {
  return [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
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
        { role: process.platform === "darwin" ? "close" : "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
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
    {
      label: "Help",
      submenu: [
        {
          label: "Multiplyer website",
          click: () => shell.openExternal("https://multiplyer.vercel.app"),
        },
        {
          label: "Release notes",
          click: () =>
            shell.openExternal(
              "https://github.com/studiokaze/multiplyer/releases",
            ),
        },
        {
          label: "Report an issue",
          click: () =>
            shell.openExternal(
              "https://github.com/studiokaze/multiplyer/issues/new",
            ),
        },
      ],
    },
  ];
}

function buildMenu() {
  // Registered for accelerators even though the bar itself is hidden.
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate()));
}

// A title-bar label was clicked: pop that submenu right under it.
ipcMain.handle("menu:popup", (_event, label, x) => {
  if (!mainWindow) return;
  const entry = menuTemplate().find((m) => m.label === label);
  if (!entry) return;
  Menu.buildFromTemplate(entry.submenu).popup({
    window: mainWindow,
    x: Math.max(0, Math.round(Number(x) || 0)),
    y: 36,
  });
});

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

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
    // there is nothing to configure.
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
