"use strict";

/**
 * electron-builder `afterPack` hook — a boot smoke test for the packaged app.
 *
 * The app runs Next's standalone server as a child process, so anything the
 * server needs must physically exist inside resources/. A missing piece does
 * not fail the build: the installer packages happily and then dies on launch
 * with "Cannot find module 'next'", which is invisible until a user hits it.
 * These assertions turn that into a build failure.
 */

const fs = require("node:fs");
const path = require("node:path");

const REQUIRED = [
  ["server/server.js", "the Next standalone server entry"],
  ["server/node_modules/next", "the server's own copy of Next"],
  ["server/node_modules/react", "React, required by the server runtime"],
  ["server/.next/static", "client JS and CSS (the app renders blank without it)"],
  ["server/.next/server/app/api/agents", "the agent API routes"],
];

module.exports = async function afterPack(context) {
  const resources = path.join(
    context.appOutDir,
    context.packager.platform.name === "mac"
      ? `${context.packager.appInfo.productFilename}.app/Contents/Resources`
      : "resources",
  );

  const missing = REQUIRED.filter(
    ([rel]) => !fs.existsSync(path.join(resources, rel)),
  );

  if (missing.length > 0) {
    const detail = missing
      .map(([rel, why]) => `  - ${rel}  (${why})`)
      .join("\n");
    throw new Error(
      `Refusing to ship: the packaged app is missing pieces it needs to boot.\n${detail}\n` +
        `Checked under: ${resources}`,
    );
  }

  console.log(`  • boot smoke test passed  ${REQUIRED.length} paths verified`);
};
