import { describe, expect, it } from "vitest";

import { generatePreviewPath } from "@/utilities/generatePreviewPath";

describe("generatePreviewPath", () => {
  it("builds preview paths for posts using the posts route prefix", () => {
    const previewPath = generatePreviewPath({
      collection: "posts",
      slug: "payload-3-79-upgrade",
      req: {} as never,
    });

    expect(previewPath).toContain("collection=posts");
    expect(previewPath).toContain("path=%2Fposts%2Fpayload-3-79-upgrade");
  });

  it("returns null when slug is missing", () => {
    expect(
      generatePreviewPath({
        collection: "pages",
        slug: undefined as never,
        req: {} as never,
      }),
    ).toBeNull();
  });
});
