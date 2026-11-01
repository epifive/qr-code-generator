import type { MetadataRoute } from "next";
import { SITE, TYPE_INFO } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "monthly", priority: 1 },
    ...TYPE_INFO.map((t) => ({ url: `${SITE.url}/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
