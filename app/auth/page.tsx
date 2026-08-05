import type { Metadata } from "next";
import Link from "next/link";
import { MarkGlyph } from "@/components/marketing/Mark";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

/**
 * The desktop app hands sign-in to this page. Accounts are not live yet, so
 * both providers walk straight to the done screen — the flow, the pages and
 * the app hand-back are real; the identity behind them arrives with billing.
 */

function ProviderIcon({ name }: { name: "google" | "github" }) {
  if (name === "google") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8H1.3v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
        />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function AuthPage() {
  return (
    <div className="marketing flex flex-1 items-center justify-center bg-void px-6 py-16">
      <div className="w-full max-w-[22rem] text-center">
        <MarkGlyph size={40} className="mx-auto text-chalk" />
        <h1 className="brand mt-6 text-[1.15rem] text-chalk">Sign in</h1>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-chalk-soft">
          One account across the app and the web.
        </p>

        <div className="mt-8 space-y-2.5">
          <Link
            href="/auth/done"
            className="flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-chalk px-4 py-3 text-[13.5px] font-medium text-void transition-opacity duration-150 hover:opacity-90"
          >
            <ProviderIcon name="google" />
            Continue with Google
          </Link>
          <Link
            href="/auth/done"
            className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-edge-strong px-4 py-3 text-[13.5px] font-medium text-chalk transition-colors duration-150 hover:border-chalk-faint"
          >
            <ProviderIcon name="github" />
            Continue with GitHub
          </Link>
        </div>

        <p className="mt-8 text-[11.5px] leading-[1.6] text-chalk-faint">
          Early access — accounts unlock credits when paid plans go live.
        </p>
      </div>
    </div>
  );
}
