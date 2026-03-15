import type { getPayload } from "payload";

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;
type ProductFindOptions = Parameters<PayloadInstance["find"]>[0];
type ProductWhere = NonNullable<ProductFindOptions["where"]>;

type BuildProductWhereArgs = {
  category?: string | null;
  search?: string | null;
  slug?: string | null;
};

export function buildProductWhere({ search, category, slug }: BuildProductWhereArgs): ProductWhere {
  const filters: ProductWhere[] = [
    {
      _status: {
        equals: "published",
      },
    },
  ];

  if (search) {
    filters.push({
      or: [
        {
          title: {
            like: search,
          },
        },
        {
          slug: {
            like: search,
          },
        },
      ],
    });
  }

  if (slug) {
    filters.push({
      slug: {
        equals: slug,
      },
    });
  }

  if (category) {
    filters.push({
      categories: {
        contains: category,
      },
    });
  }

  return {
    and: filters,
  };
}

export type { ProductWhere };
