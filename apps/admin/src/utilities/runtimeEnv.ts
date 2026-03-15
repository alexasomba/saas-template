type RuntimeEnv = Record<string, string | undefined>;

const LOCAL_HOSTNAMES = new Set(["0.0.0.0", "127.0.0.1", "localhost"]);
const DEFAULT_SERVER_URL = "http://localhost:8787";

export const getConfiguredServerURL = (env: RuntimeEnv = process.env) =>
  env.NEXT_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL;

export const isLocalServerURL = (value: string) => {
  try {
    return LOCAL_HOSTNAMES.has(new URL(value).hostname);
  } catch {
    return false;
  }
};

export const shouldUseCloudflareImageLoader = (env: RuntimeEnv = process.env) =>
  !isLocalServerURL(getConfiguredServerURL(env));

export const shouldGenerateStaticParamsFromDB = (env: RuntimeEnv = process.env) => {
  const isBuild = env.NEXT_PUBLIC_IS_BUILDING === "true";

  if (!isBuild) {
    return true;
  }

  return !isLocalServerURL(getConfiguredServerURL(env));
};
