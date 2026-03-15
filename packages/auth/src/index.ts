import type { db as dbType } from "@workspace/db";
import * as schema from "@workspace/db/schema/auth";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getAuthOptions } from "./options";

let authInstance: any;

export type AuthConfig = Omit<BetterAuthOptions, "database"> & {
  db: typeof dbType;
};

export function setAuth(config: AuthConfig) {
  const { db, ...rest } = config;

  const options = getAuthOptions(
    drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        auth_user: schema.auth_user,
        auth_session: schema.auth_session,
        auth_account: schema.auth_account,
        auth_verification: schema.auth_verification,
      },
    }),
  );

  authInstance = betterAuth({
    ...options,
    ...rest,
    plugins: [...(options.plugins || []), ...(rest.plugins || [])],
  });

  return authInstance;
}

export function getAuth() {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call setAuth() first.");
  }
  return authInstance;
}

export const auth = {
  get handler() {
    return getAuth().handler;
  },
  get api() {
    return getAuth().api;
  },
};
