import type { MetadataRoute } from "next";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup", "/forgot-password"],
      disallow: [
        "/api/",
        "/dashboard",
        "/fuel",
        "/trips",
        "/maintenance",
        "/expenses",
        "/garage",
        "/compliance",
        "/admin",
        "/reset-password", // contains a one-time token in the query string
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
