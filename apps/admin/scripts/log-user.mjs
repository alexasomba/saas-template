import path from "node:path";
import { fileURLToPath } from "node:url";
import payload from "payload";

const scriptUrl = new URL(import.meta.url);
scriptUrl.search = "";
const dirname = path.dirname(fileURLToPath(scriptUrl));

const envPath = path.resolve(dirname, "../.env.local");
await import("dotenv").then(({ config }) => config({ path: envPath }));

const payloadConfig = (await import(path.resolve(dirname, "../src/payload.config.ts"))).default;

await payload.init({
  config: payloadConfig,
  secret: process.env.PAYLOAD_SECRET,
});

const user = await payload.findByID({
  collection: "users",
  id: 1,
  overrideAccess: true,
  showHiddenFields: true,
});

console.log(JSON.stringify(user, null, 2));

process.exit(0);
