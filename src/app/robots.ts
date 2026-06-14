import type { MetadataRoute } from "next";

const baseUrl = "https://systemswi.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/portfolio", "/products", "/upcoming-events"],
        disallow: [
          "/api/",
          "/invite/",
          "/workspace/",
          "/sentry-test",
          "/loading-demo",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}