import type { MetadataRoute } from "next";

const SITE = "https://multiplyer.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/home`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/download`, changeFrequency: "weekly", priority: 0.9 },
  ];
}
