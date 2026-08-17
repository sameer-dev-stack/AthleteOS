import type { MetadataRoute } from "next";

const _rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app";
const BASE_URL = _rawBaseUrl.startsWith("http://") || _rawBaseUrl.startsWith("https://") ? _rawBaseUrl : `https://${_rawBaseUrl}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${BASE_URL.replace(/\/$/, "")}/sitemap.xml`,
  };
}
