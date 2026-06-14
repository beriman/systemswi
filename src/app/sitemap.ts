import type { MetadataRoute } from "next";

const baseUrl = "https://systemswi.vercel.app";

const publicRoutes = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/portfolio", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/products", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/upcoming-events", priority: 0.9, changeFrequency: "weekly" as const },
];

const workspaceRoutes = [
  "/dashboard",
  "/finance",
  "/events",
  "/brands",
  "/production",
  "/inventory",
  "/procurement",
  "/documents",
  "/alerts",
  "/compliance",
  "/automation",
  "/customers",
  "/scent-profile",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...publicRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...workspaceRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.4,
    })),
  ];
}