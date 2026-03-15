import { generateMeta } from "@/utilities/generateMeta";
import { describe, expect, it, vi } from "vitest";

describe("generateMeta", () => {
  it("uses server url as base for relative social image paths", async () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:8787");

    const metadata = await generateMeta({
      doc: {
        title: "Contact",
        slug: "contact",
        meta: {
          image: {
            url: "/api/media/file/image-hero1.webp",
          },
        },
      } as never,
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "http://localhost:8787/api/media/file/image-hero1.webp",
      },
    ]);
  });

  it("keeps absolute social image paths unchanged", async () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:8787");

    const metadata = await generateMeta({
      doc: {
        title: "Post",
        slug: "digital-horizons",
        meta: {
          image: {
            url: "https://cdn.example.com/post.webp",
          },
        },
      } as never,
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://cdn.example.com/post.webp",
      },
    ]);
  });
});
