// DO NOT DELETE THIS FILE!!!
// This file is a good smoke test to make sure the custom server entry is working

import { setAuth } from "@workspace/auth";
import { db as drizzleDb } from "@workspace/db";
import handler from "@tanstack/react-start/server-entry";

console.log("[server-entry]: using custom server entry in 'src/server.ts'");

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    console.log(`[web-app][server-entry] Handling request: ${request.url}`);

    const defaultConfig = {
      VITE_APP_NAME: "SaaS Kit",
      VITE_GITHUB_URL: "",
      VITE_X_URL: "",
      VITE_INSTAGRAM_URL: "",
      VITE_CONTACT_PHONE: "",
      VITE_WHATSAPP_NUMBER: "",
      VITE_CONTACT_EMAIL: "",
      VITE_APP_DESCRIPTION: "The ultimate full-stack SaaS starter kit for modern web development.",
      VITE_APP_VERSION: "1.0.0",
    };

    try {
      if (!env || !env.DB) {
        console.log(
          "[web-app][server-entry] Build/Prerender detected (missing env.DB). Using minimal context.",
        );
        return handler.fetch(request, {
          context: {
            fromFetch: true,
            config: defaultConfig,
            env: env || {},
            db: null,
            auth: null,
            user: null,
            session: null,
          } as any,
        });
      }

      const authInstance = setAuth({
        db: drizzleDb,
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: (env as any).GOOGLE_CLIENT_SECRET,
            scope: ["openid", "profile", "email"],
            accessType: "offline",
            mapProfileToUser: (profile: any) => ({
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              emailVerified: profile.email_verified,
            }),
          },
        },
      } as any);

      const config = {
        VITE_APP_NAME: env.VITE_APP_NAME,
        VITE_GITHUB_URL: env.VITE_GITHUB_URL,
        VITE_X_URL: env.VITE_X_URL,
        VITE_INSTAGRAM_URL: env.VITE_INSTAGRAM_URL,
        VITE_CONTACT_PHONE: env.VITE_CONTACT_PHONE,
        VITE_WHATSAPP_NUMBER: env.VITE_WHATSAPP_NUMBER,
        VITE_CONTACT_EMAIL: env.VITE_CONTACT_EMAIL,
        VITE_APP_DESCRIPTION: env.VITE_APP_DESCRIPTION || defaultConfig.VITE_APP_DESCRIPTION,
        VITE_APP_VERSION: env.VITE_APP_VERSION,
      };

      return handler.fetch(request, {
        context: {
          fromFetch: true,
          config,
          env,
          db: drizzleDb,
          auth: authInstance,
        } as any,
      });
    } catch (e) {
      console.error("[web-app][server-entry] CRITICAL ERROR:", e);
      if (e instanceof Error) {
        console.error(e.stack);
      }
      return new Response(e instanceof Error ? e.stack || e.message : "Internal Server Error", {
        status: 500,
      });
    }
  },
};
