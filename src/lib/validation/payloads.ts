import { z } from "zod";

export const signInPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerPayloadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8)
});

export const addCartItemSchema = z
  .object({
    productVariantId: z.string().optional(),
    menuItemId: z.string().optional(),
    quantity: z.number().int().min(1),
    selectedOptions: z.array(z.string().min(1)).optional()
  })
  .refine((data) => data.productVariantId || data.menuItemId, {
    message: "productVariantId or menuItemId is required"
  });

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(20)
});

export const cartOwnerSchema = z
  .object({
    userId: z.string().min(1).optional(),
    guestId: z.string().min(1).optional()
  })
  .refine((data) => data.userId || data.guestId, {
    message: "userId or guestId is required"
  });

export const mergeCartSchema = z.object({
  guestId: z.string().min(1)
});

export const checkoutSchema = z.object({
  cartId: z.string().min(1),
  orderType: z.enum(["DELIVERY", "PICKUP"]),
  idempotencyKey: z.string().min(8),
  paymentProvider: z.enum(["STRIPE", "FLUTTERWAVE"]),
  addressId: z.string().min(1).optional()
});

export const cartValidationSchema = z
  .object({
    cartId: z.string().min(1).optional(),
    guestId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),
    paymentProvider: z.enum(["STRIPE", "FLUTTERWAVE"]).optional(),
    addressId: z.string().min(1).optional(),
    pickupSlotId: z.string().min(1).optional(),
    userCountry: z.string().min(2).optional(),
    billingCountry: z.string().min(2).optional(),
    ipCountry: z.string().min(2).optional(),
    loyaltyPointsToRedeem: z.number().int().min(1).optional(),
    rewardId: z.string().min(1).optional()
  })
  .refine((data) => data.cartId || data.userId || data.guestId, {
    message: "cartId or userId or guestId is required"
  });

export const checkoutSessionSchema = z
  .object({
    cartId: z.string().min(1).optional(),
    guestId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    paymentProvider: z.enum(["STRIPE", "FLUTTERWAVE"]),
    fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),
    addressId: z.string().min(1).optional(),
    pickupSlotId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(8),
    userCountry: z.string().min(2).optional(),
    billingCountry: z.string().min(2).optional(),
    ipCountry: z.string().min(2).optional(),
    loyaltyPointsToRedeem: z.number().int().min(1).optional(),
    rewardId: z.string().min(1).optional()
  })
  .refine((data) => data.cartId || data.guestId, {
    message: "cartId or guestId is required"
  });

export const loyaltyRedeemSchema = z
  .object({
    cartId: z.string().min(1).optional(),
    guestId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),
    paymentProvider: z.enum(["STRIPE", "FLUTTERWAVE"]).optional(),
    addressId: z.string().min(1).optional(),
    pickupSlotId: z.string().min(1).optional(),
    userCountry: z.string().min(2).optional(),
    billingCountry: z.string().min(2).optional(),
    ipCountry: z.string().min(2).optional(),
    loyaltyPointsToRedeem: z.number().int().min(1).optional(),
    rewardId: z.string().min(1).optional()
  })
  .refine((data) => data.cartId || data.userId || data.guestId, {
    message: "cartId or userId or guestId is required"
  })
  .refine((data) => data.loyaltyPointsToRedeem || data.rewardId, {
    message: "loyaltyPointsToRedeem or rewardId is required"
  });

export const referralApplySchema = z.object({
  code: z.string().min(4)
});

export const loyaltyConfigSchema = z.object({
  earnRateAmountMinor: z.number().int().min(1).optional(),
  earnRatePoints: z.number().int().min(1).optional(),
  pointValueMinor: z.number().int().min(1).optional(),
  expiryDays: z.number().int().min(1).optional(),
  maxRedemptionPerOrderPoints: z.number().int().min(1).optional(),
  bronzeMinSpendMinor: z.number().int().min(0).optional(),
  silverMinSpendMinor: z.number().int().min(0).optional(),
  goldMinSpendMinor: z.number().int().min(0).optional(),
  bronzeMinOrders: z.number().int().min(0).optional(),
  silverMinOrders: z.number().int().min(0).optional(),
  goldMinOrders: z.number().int().min(0).optional(),
  bronzeMultiplierBps: z.number().int().min(1).optional(),
  silverMultiplierBps: z.number().int().min(1).optional(),
  goldMultiplierBps: z.number().int().min(1).optional(),
  referralRewardPoints: z.number().int().min(0).optional()
});

export const createRewardSchema = z.object({
  type: z.enum(["DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "FREE_ITEM"]),
  label: z.string().min(1),
  description: z.string().optional(),
  costPoints: z.number().int().min(1),
  valueAmountMinor: z.number().int().min(0).optional(),
  valuePercent: z.number().int().min(1).max(100).optional(),
  menuItemId: z.string().min(1).optional(),
  minTier: z.enum(["BRONZE", "SILVER", "GOLD"]).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional()
});

export const updateRewardSchema = createRewardSchema.partial().extend({
  id: z.string().min(1)
});

export const createAddressSchema = z.object({
  userId: z.string().min(1),
  label: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(5),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(2),
  postalCode: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isDefault: z.boolean().optional()
});

export const updateAddressSchema = createAddressSchema.partial().omit({
  userId: true
});

export const setDefaultAddressSchema = z.object({
  userId: z.string().min(1)
});

export const createMenuCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().min(1).optional(),
  menuId: z.string().min(1).optional()
});

export const updateMenuCategorySchema = createMenuCategorySchema.partial();

export const createMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().min(3).optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().min(1),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().int().min(0).optional(),
  menuId: z.string().min(1).optional(),
  optionGroupIds: z.array(z.string().min(1)).optional()
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createReviewSchema = z.object({
  menuItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});
