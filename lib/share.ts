import type { GeneratedFile } from "@/lib/types";

/**
 * Bare deploy (Flow 12): the generated app is small enough to live in a URL.
 * The share link carries the files themselves, compressed into the fragment —
 * the /share page rebuilds the app client-side in the same sandbox the
 * preview uses. No storage, no tokens, instant, and the link never expires
 * because there is nothing behind it to expire.
 *
 * The fragment (after #) never reaches the server, so shared apps also stay
 * out of logs.
 */

/** The HTML shell both the in-app preview and the share page run. */
export function documentFor(appSource: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <div id="root"></div>
    <div id="err" style="display:none;white-space:pre-wrap;font:12px/1.6 ui-monospace,monospace;color:#e5615a;background:#2a1513;padding:16px"></div>
    <script type="text/babel" data-presets="react">
${appSource}

      const rootEl = document.getElementById("root");
      try {
        ReactDOM.createRoot(rootEl).render(React.createElement(App));
      } catch (e) {
        const box = document.getElementById("err");
        box.style.display = "block";
        box.textContent = "Preview failed to render:\\n" + (e && e.message ? e.message : String(e));
      }
    </script>
    <script>
      window.addEventListener("error", function (e) {
        var box = document.getElementById("err");
        box.style.display = "block";
        box.textContent = "Preview error:\\n" + (e.message || String(e.error));
      });
    </script>
  </body>
</html>`;
}

/** Unicode-safe base64url. */
function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShare(idea: string, files: GeneratedFile[]): string {
  return toBase64Url(JSON.stringify({ v: 1, idea, files }));
}

export function decodeShare(
  hash: string,
): { idea: string; files: GeneratedFile[] } | null {
  try {
    const raw = fromBase64Url(hash.replace(/^#/, ""));
    const data = JSON.parse(raw) as {
      v?: number;
      idea?: string;
      files?: GeneratedFile[];
    };
    if (!Array.isArray(data.files) || data.files.length === 0) return null;
    return { idea: data.idea ?? "", files: data.files };
  } catch {
    return null;
  }
}
