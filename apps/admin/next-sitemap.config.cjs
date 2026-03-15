const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  "https://example.com";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: [
    "/admin/*",
    "/api/*",
    "/checkout/*",
    "/login",
    "/logout",
    "/create-account",
    "/forgot-password",
    "/find-order",
    "/my-route",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        disallow: "/admin/*",
      },
    ],
  },
};
