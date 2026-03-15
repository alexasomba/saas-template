import { getDraftModeEnabled } from "@/utilities/getDraftModeEnabled";
import { describe, expect, it } from "vitest";

describe("getDraftModeEnabled", () => {
  it("returns the draft flag when the reader succeeds", async () => {
    await expect(
      getDraftModeEnabled(async () => ({
        isEnabled: true,
      })),
    ).resolves.toBe(true);
  });

  it("falls back to false for static runtime dynamic-usage errors", async () => {
    await expect(
      getDraftModeEnabled(async () => {
        throw {
          digest: "DYNAMIC_SERVER_USAGE",
        };
      }),
    ).resolves.toBe(false);
  });
});
