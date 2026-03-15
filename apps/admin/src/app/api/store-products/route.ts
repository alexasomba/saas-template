import { NextRequest } from "next/server";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { checkRole } from "@/access/utilities";

import type { Product, ProductsSelect } from "@/payload-types";
import { buildProductWhere } from "@/utilities/products/buildProductWhere";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

const selectFields = {
  title: true,
  slug: true,
  gallery: true,
  priceInUSD: true,
  priceInNGN: true,
  enableVariants: true,
  variants: true,
  categories: true,
} satisfies ProductsSelect<true>;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error("Invalid limit parameter.");
  }
  return parsed;
}

function parseCursor(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("Invalid cursor parameter.");
  }
  return parsed;
}

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  let limit: number;
  let page: number;

  try {
    limit = parseLimit(searchParams.get("limit"));
    page = parseCursor(searchParams.get("cursor"));
  } catch (error) {
    return jsonError((error as Error).message, 400);
  }

  try {
    const payload = await getPayload({ config: configPromise });
    const where = buildProductWhere({ search, category, slug });

    const result = await payload.find({
      collection: "products",
      limit,
      page,
      depth: 0,
      draft: false,
      overrideAccess: false,
      select: selectFields,
      sort: "-createdAt",
      where,
    });

    const nextCursor =
      result.hasNextPage && typeof result.nextPage === "number" ? String(result.nextPage) : null;

    return Response.json({
      items: result.docs ?? [],
      nextCursor,
    });
  } catch {
    return jsonError("Unable to fetch products.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    if (!checkRole(["admin"], user)) {
      return jsonError("Forbidden.", 403);
    }

    const data = (await request.json()) as Partial<Product>;

    const result = await payload.create({
      collection: "products",
      data: data as never,
      user,
      overrideAccess: false,
    });

    return Response.json({ doc: result });
  } catch {
    return jsonError("Unable to create product.", 500);
  }
}
