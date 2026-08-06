import type { MetadataRoute } from "next";

const SITE = "https://multiplyer.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The workspace, onboarding and admin are app surfaces, not pages.
        disallow: ["/admin", "/app", "/auth", "/builder", "/share", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
