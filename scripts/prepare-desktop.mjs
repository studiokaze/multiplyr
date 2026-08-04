/**
 * `next build` with output:"standalone" emits a self-contained server, but it
 * deliberately leaves out the static assets so you can host them on a CDN.
 * The desktop app has no CDN, so copy them in beside the server.
 */
import { cp, access, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(path.join(standalone, "server.js")))) {
  console.error(
    'No standalone build found. Run "next build" with output:"standalone" first.',
  );
  process.exit(1);
}

const jobs = [
  [path.join(root, ".next", "static"), path.join(standalone, ".next", "static")],
  [path.join(root, "public"), path.join(standalone, "public")],
];

for (const [from, to] of jobs) {
  if (!(await exists(from))) {
    console.log(`skip  ${path.relative(root, from)} (absent)`);
    continue;
  }
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
  console.log(`copy  ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

console.log("standalone bundle ready for packaging");
