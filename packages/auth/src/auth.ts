import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@workspace/db/schema/auth";
import { getAuthOptions } from "./options";

/**
 * Static auth instance for CLI autodiscovery.
 * Uses a mock database structure to satisfy Better Auth during schema generation.
 */
const mockDb = {
  _: {
    schema: {
      auth_user: schema.auth_user,
      auth_session: schema.auth_session,
      auth_account: schema.auth_account,
      auth_verification: schema.auth_verification,
    },
    tableNamesMap: {},
  },
  $client: {},
} as any;

export const auth: ReturnType<typeof betterAuth> = betterAuth(
  getAuthOptions(
    drizzleAdapter(mockDb, {
      provider: "sqlite",
      schema,
    }),
  ),
);
