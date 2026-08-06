import type { Metadata } from "next";
import { Geist, Geist_Mono, Michroma } from "next/font/google";
import TitleBar from "@/components/TitleBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Brand face. The Multiplyer lockup is set in a Eurostile-Extended-style
 * engineered face; Michroma is the licensed equivalent of those letterforms.
 * One weight exists (400) — presence comes from size and tracking.
 */
const michroma = Michroma({
  variable: "--font-brand",
  weight: "400",
  subsets: ["latin"],
});

const SITE = "https://multiplyer.vercel.app";
const DESCRIPTION =
  "The AI app builder that validates first. Six agents brainstorm, research the live market, score the niche, simulate users, build the app, and market it — in one desktop workspace.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Multiplyer — Jarvis for apps",
    template: "%s — Multiplyer",
  },
  description: DESCRIPTION,
  keywords: [
    "AI app builder",
    "idea validation",
    "market research AI",
    "build or kill verdict",
    "AI agents",
    "app idea validator",
    "niche analysis",
    "user simulation",
    "vibe coding",
    "Multiplyer",
  ],
  applicationName: "Multiplyer",
  authors: [{ name: "Multiplyer" }],
  category: "developer tools",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Multiplyer",
    title: "Multiplyer — Jarvis for apps",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Multiplyer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Multiplyer — Jarvis for apps",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${michroma.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TitleBar />
        {children}
      </body>
    </html>
  );
}
