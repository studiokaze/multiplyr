import Marketing from "@/components/marketing/Marketing";

/**
 * Structured data for search: what Multiplyer is, what it runs on, and that
 * the download is free. Rendered inline because it must be in the initial
 * HTML for crawlers.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Multiplyer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  description:
    "The AI app builder that validates first: six agents brainstorm, research the live market, score the niche, simulate users, build the app, and market it.",
  url: "https://multiplyer.vercel.app",
  downloadUrl: "https://multiplyer.vercel.app/download",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/** The public site. The desktop app opens /app instead. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Marketing />
    </>
  );
}
