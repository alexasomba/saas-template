import type { Config } from "src/payload-types";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { unstable_cache } from "next/cache.js";

type Global = keyof Config["globals"];

async function getGlobal<T extends Global>(slug: T, depth = 0) {
  const payload = await getPayload({ config: configPromise });

  try {
    const global = await payload.findGlobal({
      slug,
      depth,
    });

    return global;
  } catch (error) {
    console.error(`Error fetching global ${slug}:`, error);
    return null;
  }
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) =>
  unstable_cache(async () => getGlobal<T>(slug, depth), [slug], {
    tags: [`global_${slug}`],
  });
