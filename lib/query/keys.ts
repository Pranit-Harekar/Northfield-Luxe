// Central query key registry so cache invalidation stays consistent.

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params: unknown) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  cart: {
    detail: (cartId: string) => ["cart", cartId] as const,
  },
  orders: {
    list: (userId: string) => ["orders", "list", userId] as const,
    all: ["orders", "all"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  users: {
    all: ["users", "all"] as const,
  },
  coupons: {
    all: ["coupons"] as const,
    validate: (code: string, subtotalCents: number) => ["coupons", "validate", code, subtotalCents] as const,
  },
};
