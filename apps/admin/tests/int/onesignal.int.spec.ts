import { describe, it, expect, vi, beforeEach } from "vitest";
import { oneSignalEmailAdapter } from "@/utilities/email/onesignal";

describe("OneSignal Email Adapter", () => {
  const mockArgs = {
    appId: "test-app-id",
    restApiKey: "test-api-key",
    defaultFromAddress: "test@example.com",
    defaultFromName: "Test Sender",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Mock global fetch
    global.fetch = vi.fn<typeof fetch>() as typeof fetch;
  });

  it("should call OneSignal API with correct parameters", async () => {
    const adapter = oneSignalEmailAdapter(mockArgs);
    const { sendEmail } = adapter();
    const mockFetch = vi.mocked(global.fetch);

    const mockResponse = { id: "test-notification-id" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const emailData = {
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Test Body</p>",
    };

    const result = await sendEmail(emailData);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.onesignal.com/notifications?c=email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json; charset=utf-8",
          Authorization: "Key test-api-key",
        }),
        body: JSON.stringify({
          app_id: "test-app-id",
          target_channel: "email",
          email_from_address: "test@example.com",
          email_from_name: "Test Sender",
          email_subject: "Test Subject",
          email_body: "<p>Test Body</p>",
          email_to: ["recipient@example.com"],
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw an error if OneSignal API returns an error", async () => {
    const adapter = oneSignalEmailAdapter(mockArgs);
    const { sendEmail } = adapter();
    const mockFetch = vi.mocked(global.fetch);

    const errorResponse = { errors: ["Invalid App ID"] };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    } as Response);

    await expect(
      sendEmail({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test Body</p>",
      }),
    ).rejects.toThrow("OneSignal Email Error");
  });

  it('should use provided "from" address if available', async () => {
    const adapter = oneSignalEmailAdapter(mockArgs);
    const { sendEmail } = adapter();
    const mockFetch = vi.mocked(global.fetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await sendEmail({
      to: "recipient@example.com",
      from: "custom@example.com",
      subject: "Test Subject",
      html: "<p>Test Body</p>",
    });

    const callBody = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(callBody.email_from_address).toBe("custom@example.com");
  });

  it("should parse formatted sender strings from Payload", async () => {
    const adapter = oneSignalEmailAdapter(mockArgs);
    const { sendEmail } = adapter();
    const mockFetch = vi.mocked(global.fetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await sendEmail({
      to: "recipient@example.com",
      from: '"Automatic Pallet" <custom@example.com>',
      subject: "Test Subject",
      html: "<p>Test Body</p>",
    });

    const callBody = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(callBody.email_from_address).toBe("custom@example.com");
    expect(callBody.email_from_name).toBe("Automatic Pallet");
  });
});
