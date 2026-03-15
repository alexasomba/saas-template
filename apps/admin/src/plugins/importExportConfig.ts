export const importExportCollections = [
  {
    slug: "pages",
    export: { limit: 200 },
    import: { defaultVersionStatus: "draft", limit: 100 },
  },
  {
    slug: "posts",
    export: { limit: 300 },
    import: { defaultVersionStatus: "draft", limit: 150 },
  },
  {
    slug: "categories",
    export: { limit: 200 },
    import: { limit: 100 },
  },
  {
    slug: "users",
    export: false,
    import: false,
  },
  {
    slug: "products",
    export: { limit: 500 },
    import: { defaultVersionStatus: "draft", limit: 250 },
  },
  {
    slug: "orders",
    export: { limit: 500 },
    import: false,
  },
] as const;

export const importExportLimits = {
  exportLimit: 500,
  importLimit: 250,
} as const;
