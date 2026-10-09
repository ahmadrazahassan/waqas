import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { legalDocs } from "@/lib/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "", "/about", "/how-it-works", "/referrals", "/pricing", "/tasks",
    "/leaderboard", "/prizes", "/prizes/umrah", "/guides", "/blog", "/careers", "/contact",
    ...legalDocs.map((doc) => `/legal/${doc.slug}`),
  ];
  return pages.map((path) => ({ url: `${site.url}${path}`, priority: path === "" ? 1 : 0.6 }));
}
