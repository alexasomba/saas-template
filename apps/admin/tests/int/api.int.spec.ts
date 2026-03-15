import { describe, it, beforeAll, expect, vi } from "vitest";

const getPayloadMock = vi.fn();
const findMock = vi.fn();

vi.mock("@payload-config", () => ({
  default: Promise.resolve({ collections: [] }),
}));

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

const payloadConfigPromise = (await import("@/payload.config")).default;
const { getPayload } = await import("payload");

type MockPayload = {
  find: typeof findMock;
};

let payload: MockPayload;

describe("API", () => {
  beforeAll(async () => {
    getPayloadMock.mockResolvedValue({ find: findMock });
    payload = (await getPayload({ config: await payloadConfigPromise })) as unknown as MockPayload;
  });

  it("fetches users via payload client", async () => {
    findMock.mockResolvedValueOnce({ docs: [] });

    const users = await payload.find({ collection: "users" });

    expect(findMock).toHaveBeenCalledWith({ collection: "users" });
    expect(users).toEqual({ docs: [] });
  });
});
