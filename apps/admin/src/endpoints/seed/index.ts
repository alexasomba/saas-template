import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from "payload";

import { contactFormData } from "./contact-form";
import { contactPageData } from "./contact-page";
import { productHatData } from "./product-hat";
import { productTshirtData, productTshirtVariant } from "./product-tshirt";
import { productSimpleData } from "./product-simple";
import { productGroupedData } from "./product-grouped";
import { productExternalData } from "./product-external";
import { productVirtualData } from "./product-virtual";
import { productDownloadData } from "./product-download";
import { productSubscription } from "./product-subscription";
import { homePageData } from "./home";
import { imageHatData } from "./image-hat";
import { imageTshirtBlackData } from "./image-tshirt-black";
import { imageTshirtWhiteData } from "./image-tshirt-white";
import { imageHero1Data } from "./image-hero-1";
import { image1 } from "./image-1";
import { image2 } from "./image-2";
import { image3 } from "./image-3";
import { post1 } from "./post-1";
import { post2 } from "./post-2";
import { post3 } from "./post-3";
import { Address, Category, Media, Transaction, User, VariantOption } from "@/payload-types";
import type { AppUser } from "@/types/user";

const collections: CollectionSlug[] = [
  "categories",
  "media",
  "pages",
  "posts",
  "products",
  "search",
  "form-submissions",
  "forms",
  "variants",
  "variantOptions",
  "variantTypes",
  "carts",
  "transactions",
  "addresses",
  "orders",
  "tax-classes",
  "shipping-classes",
  "shipping-zones",
];

const ecommerceCategoryTitles = ["Accessories", "T-Shirts", "Hats"] as const;
const blogCategoryTitles = [
  "Technology",
  "News",
  "Finance",
  "Design",
  "Software",
  "Engineering",
] as const;
const categoryTitles = [...new Set<string>([...ecommerceCategoryTitles, ...blogCategoryTitles])];

const sizeVariantOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "X Large", value: "xlarge" },
];

const colorVariantOptions = [
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
];

const globals: GlobalSlug[] = ["header", "footer"];

const baseAddressUSData: Transaction["billingAddress"] = {
  title: "Dr.",
  firstName: "Otto",
  lastName: "Octavius",
  phone: "1234567890",
  company: "Oscorp",
  addressLine1: "123 Main St",
  addressLine2: "Suite 100",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "US",
};

const baseAddressUKData: Transaction["billingAddress"] = {
  title: "Mr.",
  firstName: "Oliver",
  lastName: "Twist",
  phone: "1234567890",
  addressLine1: "48 Great Portland St",
  city: "London",
  postalCode: "W1W 7ND",
  country: "GB",
};

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload;
  req: PayloadRequest;
}): Promise<void> => {
  payload.logger.info("Seeding database...");

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`);

  // clear the database
  await Promise.all([
    payload.updateGlobal({
      slug: "header",
      data: {
        navItems: [],
      },
      depth: 0,
      context: {
        disableRevalidate: true,
      },
    }),
    payload.updateGlobal({
      slug: "footer",
      data: {
        navItems: [],
      },
      depth: 0,
      context: {
        disableRevalidate: true,
      },
    }),
  ]);

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} });
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} });
    }
  }

  payload.logger.info(`— Seeding users...`);

  await Promise.all([
    payload.delete({
      collection: "users",
      depth: 0,
      where: {
        email: {
          equals: "customer@example.com",
        },
      },
    }),
    payload.delete({
      collection: "users",
      depth: 0,
      where: {
        email: {
          equals: "demo-author@example.com",
        },
      },
    }),
  ]);

  const [customer, demoAuthor] = await Promise.all([
    payload.create({
      collection: "users",
      data: {
        name: "Customer",
        email: "customer@example.com",
        password: "password",
        roles: ["customer"],
      } as Partial<AppUser> & {
        email: string;
        password: string;
        roles: NonNullable<AppUser["roles"]>;
      },
    }),
    payload.create({
      collection: "users",
      data: {
        name: "Demo Author",
        email: "demo-author@example.com",
        password: "password",
        roles: ["admin"],
      } as Partial<AppUser> & {
        email: string;
        password: string;
        roles: NonNullable<AppUser["roles"]>;
      },
    }),
  ]);

  payload.logger.info(`— Seeding media...`);

  const [
    imageHatBuffer,
    imageTshirtBlackBuffer,
    imageTshirtWhiteBuffer,
    heroBuffer,
    imagePost1Buffer,
    imagePost2Buffer,
    imagePost3Buffer,
  ] = await Promise.all([
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/hat-logo.png",
    ),
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-black.png",
    ),
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-white.png",
    ),
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp",
    ),
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp",
    ),
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp",
    ),
    fetchFileByURL(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp",
    ),
  ]);

  const [
    imageHat,
    imageTshirtBlack,
    imageTshirtWhite,
    imageHero,
    imagePost1Doc,
    imagePost2Doc,
    imagePost3Doc,
  ]: [Media, Media, Media, Media, Media, Media, Media] = await Promise.all([
    payload.create({
      collection: "media",
      data: imageHatData,
      file: imageHatBuffer,
    }),
    payload.create({
      collection: "media",
      data: imageTshirtBlackData,
      file: imageTshirtBlackBuffer,
    }),
    payload.create({
      collection: "media",
      data: imageTshirtWhiteData,
      file: imageTshirtWhiteBuffer,
    }),
    payload.create({
      collection: "media",
      data: imageHero1Data,
      file: heroBuffer,
    }),
    payload.create({
      collection: "media",
      data: image1,
      file: imagePost1Buffer,
    }),
    payload.create({
      collection: "media",
      data: image2,
      file: imagePost2Buffer,
    }),
    payload.create({
      collection: "media",
      data: image3,
      file: imagePost3Buffer,
    }),
  ]);

  const categoryDocs: Category[] = await Promise.all(
    categoryTitles.map((category) =>
      payload.create({
        collection: "categories",
        data: {
          title: category,
          slug: category,
        },
      }),
    ),
  );

  const categoryMap = new Map<string, Category>(categoryDocs.map((doc) => [doc.title, doc]));
  const requireCategory = (title: string): Category => {
    const doc = categoryMap.get(title);
    if (!doc) {
      throw new Error(`Missing seeded category: ${title}`);
    }
    return doc;
  };

  const accessoriesCategory = requireCategory("Accessories");
  const tshirtsCategory = requireCategory("T-Shirts");
  const hatsCategory = requireCategory("Hats");
  const technologyCategory = requireCategory("Technology");
  const newsCategory = requireCategory("News");
  const financeCategory = requireCategory("Finance");
  const designCategory = requireCategory("Design");
  const softwareCategory = requireCategory("Software");
  const engineeringCategory = requireCategory("Engineering");

  payload.logger.info(`— Seeding variant types and options...`);

  const sizeVariantType = await payload.create({
    collection: "variantTypes",
    data: {
      name: "size",
      label: "Size",
    },
  });

  const sizeVariantOptionsResults: VariantOption[] = [];

  for (const option of sizeVariantOptions) {
    const result = await payload.create({
      collection: "variantOptions",
      data: {
        ...option,
        variantType: sizeVariantType.id,
      },
    });
    sizeVariantOptionsResults.push(result);
  }

  const [small, medium, large, xlarge] = sizeVariantOptionsResults;

  const colorVariantType = await payload.create({
    collection: "variantTypes",
    data: {
      name: "color",
      label: "Color",
    },
  });

  const [black, white] = await Promise.all(
    colorVariantOptions.map((option) => {
      return payload.create({
        collection: "variantOptions",
        data: {
          ...option,
          variantType: colorVariantType.id,
        },
      });
    }),
  );

  payload.logger.info(`— Seeding tax and shipping classes/zones...`);

  await Promise.all([
    payload.create({
      collection: "tax-classes",
      data: {
        title: "Standard",
        rate: 7.5,
      },
    }),
    payload.create({
      collection: "tax-classes",
      data: {
        title: "Zero-Rated",
        rate: 0,
      },
    }),
    payload.create({
      collection: "tax-classes",
      data: {
        title: "Exempt",
        rate: 0,
      },
    }),
  ]);

  await payload.create({
    collection: "shipping-classes",
    data: {
      title: "Standard",
      description: "Standard shipping class",
    },
  });

  await payload.create({
    collection: "shipping-zones",
    data: {
      name: "Nigeria",
      locations: [
        {
          country: "NG",
        },
      ],
      methods: [
        {
          blockType: "flatRate",
          cost: 3000,
          taxStatus: "none",
        },
        {
          blockType: "localPickup",
          cost: 0,
          taxStatus: "none",
        },
      ],
    },
  });

  payload.logger.info(`— Seeding products...`);

  const productHat = await payload.create({
    collection: "products",
    depth: 0,
    data: productHatData({
      galleryImage: imageHat,
      metaImage: imageHat,
      variantTypes: [colorVariantType],
      categories: [hatsCategory],
      relatedProducts: [],
    }),
  });

  const productTshirt = await payload.create({
    collection: "products",
    depth: 0,
    data: productTshirtData({
      galleryImages: [
        { image: imageTshirtBlack, variantOption: black },
        { image: imageTshirtWhite, variantOption: white },
      ],
      metaImage: imageTshirtBlack,
      contentImage: imageHero,
      variantTypes: [colorVariantType, sizeVariantType],
      categories: [tshirtsCategory],
      relatedProducts: [productHat],
    }),
  });

  let hoodieID: number | string = productTshirt.id;

  if (payload.db.defaultIDType === "text") {
    hoodieID = `"${hoodieID}"`;
  }

  const [
    smallTshirtHoodieVariant,
    mediumTshirtHoodieVariant,
    largeTshirtHoodieVariant,
    xlargeTshirtHoodieVariant,
  ] = await Promise.all(
    [small, medium, large, xlarge].map((variantOption) =>
      payload.create({
        collection: "variants",
        depth: 0,
        data: productTshirtVariant({
          product: productTshirt,
          variantOptions: [variantOption, white],
        }),
      }),
    ),
  );

  await Promise.all(
    [small, medium, large, xlarge].map((variantOption) =>
      payload.create({
        collection: "variants",
        depth: 0,
        data: productTshirtVariant({
          product: productTshirt,
          variantOptions: [variantOption, black],
          ...(variantOption.value === "medium" ? { inventory: 0 } : {}),
        }),
      }),
    ),
  );

  // ── Simple product (physical notebook) ───────────────────────────────────
  const productSimple = await payload.create({
    collection: "products",
    depth: 0,
    data: productSimpleData({
      galleryImage: imageHat,
      metaImage: imageHat,
      categories: [accessoriesCategory],
      relatedProducts: [productHat],
    }),
  });

  // ── Virtual product (service / consultation) ──────────────────────────────
  const productVirtual = await payload.create({
    collection: "products",
    depth: 0,
    data: productVirtualData({
      galleryImage: imageHero,
      metaImage: imageHero,
      categories: [accessoriesCategory],
    }),
  });

  // ── Subscription product ──────────────────────────────────────────────────
  await payload.create({
    collection: "products",
    depth: 0,
    data: {
      ...productSubscription,
      meta: {
        ...productSubscription.meta,
        title: productSubscription.meta?.title || "",
        description: productSubscription.meta?.description || "",
        image: imageHero.id,
      },
      categories: [accessoriesCategory.id],
    } as any,
  });

  // ── Downloadable product (digital design kit) ─────────────────────────────
  await payload.create({
    collection: "products",
    depth: 0,
    data: productDownloadData({
      galleryImage: imageHero,
      metaImage: imageHero,
      categories: [accessoriesCategory],
    }),
  });

  // ── External / affiliate product ──────────────────────────────────────────
  await payload.create({
    collection: "products",
    depth: 0,
    data: productExternalData({
      galleryImage: imageHat,
      metaImage: imageHat,
      categories: [accessoriesCategory],
    }),
  });

  // ── Grouped product (collection of simpler products) ──────────────────────
  await payload.create({
    collection: "products",
    depth: 0,
    data: productGroupedData({
      galleryImage: imageHero,
      metaImage: imageHero,
      categories: [accessoriesCategory],
      childProducts: [productHat, productSimple, productVirtual],
    }),
  });

  payload.logger.info(`— Seeding posts...`);

  const post1Doc = await payload.create({
    collection: "posts",
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post1({
      heroImage: imagePost1Doc,
      blockImage: imagePost2Doc,
      author: demoAuthor as User,
    }),
  });

  const post2Doc = await payload.create({
    collection: "posts",
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post2({
      heroImage: imagePost2Doc,
      blockImage: imagePost3Doc,
      author: demoAuthor as User,
    }),
  });

  const post3Doc = await payload.create({
    collection: "posts",
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post3({
      heroImage: imagePost3Doc,
      blockImage: imagePost1Doc,
      author: demoAuthor as User,
    }),
  });

  await payload.update({
    id: post1Doc.id,
    collection: "posts",
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
      categories: [technologyCategory.id, softwareCategory.id],
    },
  });

  await payload.update({
    id: post2Doc.id,
    collection: "posts",
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
      categories: [financeCategory.id, newsCategory.id],
    },
  });

  await payload.update({
    id: post3Doc.id,
    collection: "posts",
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
      categories: [designCategory.id, engineeringCategory.id],
    },
  });

  payload.logger.info(`— Seeding contact form...`);

  const contactForm = await payload.create({
    collection: "forms",
    depth: 0,
    data: contactFormData(),
  });

  payload.logger.info(`— Seeding pages...`);

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: "pages",
      depth: 0,
      data: homePageData({
        contentImage: imageHero,
        metaImage: imageHat,
      }),
    }),
    payload.create({
      collection: "pages",
      depth: 0,
      data: contactPageData({
        contactForm: contactForm,
      }),
    }),
  ]);

  payload.logger.info(`— Seeding addresses...`);

  const customerUSAddress = await payload.create({
    collection: "addresses",
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUSData as Address),
    },
  });

  const customerUKAddress = await payload.create({
    collection: "addresses",
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUKData as Address),
    },
  });

  payload.logger.info(`— Seeding transactions...`);

  const pendingTransaction = await payload.create({
    collection: "transactions",
    data: {
      currency: "USD",
      customer: customer.id,
      paymentMethod: "paystack",
      paystack: {
        customerID: "cus_123",
        reference: "ref_123",
      },
      status: "pending",
      billingAddress: baseAddressUSData,
    },
  });

  const succeededTransaction = await payload.create({
    collection: "transactions",
    data: {
      currency: "USD",
      customer: customer.id,
      paymentMethod: "paystack",
      paystack: {
        customerID: "cus_123",
        reference: "ref_123",
      },
      status: "succeeded",
      billingAddress: baseAddressUSData,
    },
  });

  let succeededTransactionID: number | string = succeededTransaction.id;

  if (payload.db.defaultIDType === "text") {
    succeededTransactionID = `"${succeededTransactionID}"`;
  }

  payload.logger.info(`— Seeding carts...`);

  // This cart is open as it's created now
  const openCart = await payload.create({
    collection: "carts",
    data: {
      customer: customer.id,
      currency: "USD",
      items: [
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  });

  const oldTimestamp = new Date("2023-01-01T00:00:00Z").toISOString();

  // Cart is abandoned because it was created long in the past
  const abandonedCart = await payload.create({
    collection: "carts",
    data: {
      currency: "USD",
      createdAt: oldTimestamp,
      items: [
        {
          product: productHat.id,
          quantity: 1,
        },
      ],
    },
  });

  // Cart is purchased because it has a purchasedAt date
  const completedCart = await payload.create({
    collection: "carts",
    data: {
      customer: customer.id,
      currency: "USD",
      purchasedAt: new Date().toISOString(),
      subtotal: 7499,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  });

  let completedCartID: number | string = completedCart.id;

  if (payload.db.defaultIDType === "text") {
    completedCartID = `"${completedCartID}"`;
  }

  payload.logger.info(`— Seeding orders...`);

  const orderInCompleted = await payload.create({
    collection: "orders",
    data: {
      amount: 7499,
      currency: "USD",
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: "completed",
      transactions: [succeededTransaction.id],
    },
  });

  const orderInProcessing = await payload.create({
    collection: "orders",
    data: {
      amount: 7499,
      currency: "USD",
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: "processing",
      transactions: [succeededTransaction.id],
    },
  });

  payload.logger.info(`— Seeding globals...`);

  await Promise.all([
    payload.updateGlobal({
      slug: "header",
      data: {
        navItems: [
          {
            link: {
              type: "custom",
              label: "Home",
              url: "/",
            },
          },
          {
            link: {
              type: "custom",
              label: "Shop",
              url: "/shop",
            },
          },
          {
            link: {
              type: "custom",
              label: "Posts",
              url: "/posts",
            },
          },
          {
            link: {
              type: "reference",
              label: "Contact",
              reference: {
                relationTo: "pages",
                value: contactPage.id,
              },
            },
          },
          {
            link: {
              type: "custom",
              label: "Account",
              url: "/account",
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: "footer",
      data: {
        navItems: [
          {
            link: {
              type: "custom",
              label: "Admin",
              url: "/admin",
            },
          },
          {
            link: {
              type: "custom",
              label: "Shop",
              url: "/shop",
            },
          },
          {
            link: {
              type: "custom",
              label: "Posts",
              url: "/posts",
            },
          },
          {
            link: {
              type: "custom",
              label: "Find my order",
              url: "/find-order",
            },
          },
          {
            link: {
              type: "reference",
              label: "Contact",
              reference: {
                relationTo: "pages",
                value: contactPage.id,
              },
            },
          },
        ],
      },
    }),
  ]);

  payload.logger.info("Seeded database successfully!");
};

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: "include",
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`);
  }

  const data = await res.arrayBuffer();

  return {
    name: url.split("/").pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split(".").pop()}`,
    size: data.byteLength,
  };
}
