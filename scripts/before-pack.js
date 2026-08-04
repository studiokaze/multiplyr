"use strict";

/**
 * electron-builder `beforePack` hook.
 *
 * `next build` regenerates .next/standalone from scratch and deliberately
 * omits static assets, so a bare `electron-builder` run after any plain
 * `next build` would package a server with no CSS or JS — an app that boots
 * and renders nothing. Re-running the prepare step here makes packaging
 * correct no matter how it was invoked, rather than depending on npm script
 * ordering that is invisible at the call site.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

module.exports = async function beforePack(context) {
  const root = context.packager.info.projectDir;

  execFileSync(
    process.execPath,
    [path.join(root, "scripts", "prepare-desktop.mjs")],
    { cwd: root, stdio: "inherit", env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } },
  );

  // Fail loudly rather than shipping an installer that renders a blank window.
  const staticDir = path.join(root, ".next", "standalone", ".next", "static");
  if (!fs.existsSync(staticDir)) {
    throw new Error(
      `Refusing to package: ${staticDir} is missing, so the app would ship without CSS or JS.`,
    );
  }
};
