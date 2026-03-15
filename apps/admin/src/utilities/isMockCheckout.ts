export const getMockCheckoutStatus = (hostname?: string) => {
  const mockCheckoutEnv = process.env.NEXT_PUBLIC_MOCK_CHECKOUT;
  const apiKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const isDev = process.env.NODE_ENV !== "production";

  // Explicitly set to true or false via env var
  if (mockCheckoutEnv === "true") return true;
  if (mockCheckoutEnv === "false") return false;

  // Default behavior for dev: mock is enabled unless explicitly disabled (above)
  if (isDev) return true;

  // For production/preview builds or server-side:
  const currentHostname =
    hostname || (typeof window !== "undefined" ? window.location.hostname : undefined);

  if (currentHostname === "localhost") {
    if (!apiKey || apiKey.includes("placeholder")) {
      return true;
    }
  }

  return false;
};
