import { expo } from "@better-auth/expo";
import { env } from "@workspace/env/server";
import type { BetterAuthOptions } from "better-auth";
import { emailOTP } from "better-auth/plugins";

export const getAuthOptions = (database: BetterAuthOptions["database"]): BetterAuthOptions => ({
  database,
  trustedOrigins: [
    env.CORS_ORIGIN,
    "my-better-t-app://",
    ...(env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "http://localhost:8081"]
      : []),
  ],
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Minimal dev implementation: log OTP to console.
        // Replace with a real email provider (Resend/Postmark/etc.) before production.
        console.log(`[better-auth][email-otp] type=${type} email=${email} otp=${otp}`);
      },
    }),
    expo(),
  ],
  user: {
    modelName: "auth_user",
  },
  session: {
    modelName: "auth_session",
  },
  verification: {
    modelName: "auth_verification",
  },
  account: {
    modelName: "auth_account",
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});
