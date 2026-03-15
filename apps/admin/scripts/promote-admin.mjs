import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import payload from "payload";

const scriptUrl = new URL(import.meta.url);
scriptUrl.search = "";
const dirname = path.dirname(fileURLToPath(scriptUrl));

const envPath = path.resolve(dirname, "../.env.local");
loadEnv({ path: envPath });

const requireEnv = (value, name) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const main = async () => {
  const email = "alex@automaticpallet.com";

  const payloadConfig = (await import(path.resolve(dirname, "../src/payload.config.ts"))).default;

  await payload.init({
    config: payloadConfig,
    secret: requireEnv(process.env.PAYLOAD_SECRET, "PAYLOAD_SECRET"),
  });

  const { docs } = await payload.find({
    collection: "users",
    where: {
      email: {
        equals: email,
      },
    },
    depth: 0,
    limit: 1,
  });

  const user = docs?.[0];

  if (!user) {
    throw new Error(`No user found for ${email}`);
  }

  const updated = await payload.update({
    collection: "users",
    id: user.id,
    data: {
      roles: ["admin"],
    },
    overrideAccess: true,
  });

  console.log(`Updated roles for ${email}:`, updated?.roles ?? "(no roles returned)");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
