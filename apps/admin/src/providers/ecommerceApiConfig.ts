export const ecommerceApiConfig = {
  cartsFetchQuery: {
    depth: 2,
    populate: {
      products: {
        slug: true,
        title: true,
        gallery: true,
        inventory: true,
        priceInUSD: true,
        priceInNGN: true,
        subscriptionPrice: true,
        subscriptionPriceNGN: true,
        isSubscription: true,
        meta: true,
      },
      variants: {
        title: true,
        inventory: true,
        priceInUSD: true,
        priceInNGN: true,
        options: true,
      },
    },
  },
} as const;
