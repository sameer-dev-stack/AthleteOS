import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nilcard.app";

export default function robots(): MetadataRoute.Robots {
  const vercelUrl = process.env.VERCEL_URL || "";
  const isPreviewDomain = vercelUrl.includes(".vercel.app") || vercelUrl.includes("--vercel.app");

  if (isPreviewDomain) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
