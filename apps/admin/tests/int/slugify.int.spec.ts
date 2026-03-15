import { describe, expect, it } from "vitest";

import { slugifyText, slugifyTextOrUndefined } from "@/utilities/slugify";

describe("slugify utilities", () => {
  it("normalizes punctuation, spacing, and casing into storefront-safe slugs", () => {
    expect(slugifyText("  Payload CMS 3.79!  ")).toBe("payload-cms-3-79");
    expect(slugifyText("Multiple    spaces___and symbols")).toBe("multiple-spaces-and-symbols");
  });

  it("removes diacritics and expands ampersands", () => {
    expect(slugifyText("Crème Brûlée & Tea")).toBe("creme-brulee-and-tea");
  });

  it("returns undefined when there is no slug-safe text to use", () => {
    expect(slugifyTextOrUndefined(undefined)).toBeUndefined();
    expect(slugifyTextOrUndefined("***")).toBeUndefined();
  });
});
