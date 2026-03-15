const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8787";

export default function robots() {
  return {
    host: baseUrl,
    rules: [
      {
        userAgent: "*",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
