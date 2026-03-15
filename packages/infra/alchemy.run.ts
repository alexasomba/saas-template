import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import alchemy from "alchemy";
import { TanStackStart, Worker, D1Database } from "alchemy/cloudflare";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "../..");

config({ path: join(rootDir, ".env") });
config({ path: join(rootDir, "apps/web/.env") });
config({ path: join(rootDir, "apps/server/.env") });
config({ path: join(rootDir, "packages/infra/.env") });

const app = await alchemy("my-better-t-app", {
  password: process.env.ALCHEMY_PASSWORD,
});

const db = await D1Database("database", {
  migrationsDir: "packages/db/src/migrations",
});

export const web = await TanStackStart("web", {
  cwd: "apps/web",
  bindings: {
    VITE_SERVER_URL: alchemy.env.VITE_SERVER_URL!,
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    GOOGLE_GENERATIVE_AI_API_KEY: alchemy.secret.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  },
});

export const server = await Worker("server", {
  cwd: "apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    GOOGLE_GENERATIVE_AI_API_KEY: alchemy.secret.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  },
  dev: {
    port: 3000,
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
