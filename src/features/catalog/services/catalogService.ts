import { prisma } from "@/lib/db";
import { marketCatalog, menuCatalog } from "@/data/catalog";
import { resolveMenuImage, resolveProductImage } from "@/lib/image-resolver";

export type CatalogReadSource = "static" | "prisma";

export type CatalogMenuItem = {
  id: string;
  slug: string;
  name: string;
  nameZh?: string;
  description?: string | null;
  descriptionZh?: string | null;
  priceMinor: number;
  currency: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  preparationTime?: number | null;
  averageRating?: number;
  reviewCount?: number;
};

export type CatalogMenuCategory = {
  id: string;
  slug: string;
  name: string;
  nameZh?: string;
  description?: string | null;
  descriptionZh?: string | null;
  displayOrder: number;
  isActive: boolean;
  items: CatalogMenuItem[];
};

export type CatalogMarketVariant = {
  id: string;
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
  stockOnHand: number;
};

export type CatalogMarketProduct = {
  id: string;
  slug: string;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  imageUrl?: string | null;
  variant: CatalogMarketVariant;
};

export type CatalogMarketCategory = {
  id: string;
  slug: string;
  name: string;
  nameZh?: string;
  products: CatalogMarketProduct[];
};

export interface CatalogService {
  listMenuCategories(): Promise<CatalogMenuCategory[]>;
  listMarketCategories(): Promise<CatalogMarketCategory[]>;
  findMenuItemBySlug(slug: string): Promise<CatalogMenuItem | null>;
  findMarketProductBySkuOrSlug(identifier: string): Promise<CatalogMarketProduct | null>;
}

export type CatalogRuntimeStatus = {
  configuredSource: CatalogReadSource;
  activeSource: CatalogReadSource;
  fallbackActive: boolean;
  fallbackReason: string | null;
};

function getConfiguredCatalogSource(): CatalogReadSource {
  return process.env.CATALOG_READ_SOURCE === "prisma" ? "prisma" : "static";
}

let staticCatalogService: StaticCatalogService | null = null;
let prismaCatalogService: PrismaCatalogService | null = null;
let configuredSource: CatalogReadSource = getConfiguredCatalogSource();
let activeSource: CatalogReadSource = configuredSource;
let fallbackActive = false;
let fallbackReason: string | null = null;

function enableStaticFallback(reason: string) {
  if (!fallbackActive) {
    if (process.env.SHOW_DEMO_LOGS === "1") {
      console.warn(`[CatalogService] Falling back to static catalog: ${reason}`);
    }
  }
  fallbackActive = true;
  fallbackReason = reason;
  activeSource = "static";
}

export function getCatalogRuntimeStatus(): CatalogRuntimeStatus {
  return {
    configuredSource,
    activeSource,
    fallbackActive,
    fallbackReason
  };
}

export function createCatalogService(source: CatalogReadSource = getConfiguredCatalogSource()) {
  configuredSource = source;

  if (source === "prisma") {
    if (fallbackActive) {
      return getStaticCatalogService();
    }

    // create the prisma-backed service but keep a static fallback available
    const prismaSvc = getPrismaCatalogService();
    activeSource = "prisma";

    // background healthcheck to warn early if DB not reachable
    void (async () => {
      try {
        // simple connectivity check
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).$queryRaw`SELECT 1`;
        if (process.env.SHOW_DEMO_LOGS === "1") {
          console.info("[CatalogService] Prisma read source enabled and database reachable");
        }
      } catch (err) {
        if (process.env.SHOW_DEMO_LOGS === "1") {
          console.warn("[CatalogService] Prisma read source enabled but DB health check failed.", err);
        }
        enableStaticFallback("Prisma healthcheck failed");
      }
    })();

    return prismaSvc;
  }

  activeSource = "static";
  return getStaticCatalogService();
}

export function getStaticCatalogService() {
  if (!staticCatalogService) {
    staticCatalogService = new StaticCatalogService();
    if (process.env.SHOW_DEMO_LOGS === "1") {
      console.info("[CatalogService] Using StaticCatalogService (seeded catalog)");
    }
  }

  activeSource = "static";

  return staticCatalogService;
}

export function getPrismaCatalogService() {
  if (!prismaCatalogService) {
    prismaCatalogService = new PrismaCatalogService();
    if (process.env.SHOW_DEMO_LOGS === "1") {
      console.info("[CatalogService] Using PrismaCatalogService (DB-backed catalog)");
    }
  }

  return prismaCatalogService;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const val = obj[key];
  return typeof val === "string" ? val : undefined;
}

class StaticCatalogService implements CatalogService {
  private readonly menuCategories = menuCatalog.map((category, categoryIndex) => ({
    id: slugify(category.name),
    slug: slugify(category.name),
    name: category.name,
    nameZh: getStringField(category, "nameZh") ?? getStringField(category, "name_zh") ?? undefined,
    description: category.description ?? null,
    descriptionZh: getStringField(category, "descriptionZh") ?? getStringField(category, "description_zh") ?? undefined,
    displayOrder: categoryIndex + 1,
    isActive: true,
    items: category.items.map((item) => {
      const slug = slugify(item.title);
      return {
        id: slug,
        slug,
        name: item.title,
        nameZh: getStringField(item, "titleZh") ?? getStringField(item, "title_zh") ?? undefined,
        description: item.description,
        descriptionZh: getStringField(item, "descriptionZh") ?? getStringField(item, "description_zh") ?? undefined,
        imageUrl: item.imageUrl ?? resolveMenuImage(item.title).src,
        priceMinor: item.baseAmountMinor,
        currency: "NGN",
        isAvailable: true,
        preparationTime: null,
        averageRating: 0,
        reviewCount: 0
      };
    })
  }));

  private readonly marketCategories = marketCatalog.map((category) => ({
    id: slugify(category.name),
    slug: slugify(category.name),
    name: category.name,
    nameZh: getStringField(category, "nameZh") ?? getStringField(category, "name_zh") ?? undefined,
    products: category.items.map((item) => {
      const slug = slugify(item.title);
      const sku = `${slug}-default`;
      return {
        id: slug,
        slug,
        title: item.title,
        titleZh: getStringField(item, "titleZh") ?? getStringField(item, "title_zh") ?? undefined,
        description: item.description,
        descriptionZh: getStringField(item, "descriptionZh") ?? getStringField(item, "description_zh") ?? undefined,
        imageUrl: item.imageUrl ?? resolveProductImage(item.title).src,
        variant: {
          id: sku,
          sku,
          title: "Standard",
          amountMinor: item.baseAmountMinor,
          currency: "NGN",
          stockOnHand: item.stockOnHand ?? 0
        }
      };
    })
  }));

  async listMenuCategories() {
    return this.menuCategories;
  }

  async listMarketCategories() {
    return this.marketCategories;
  }

  async findMenuItemBySlug(slug: string) {
    const normalized = slugify(slug);
    for (const category of this.menuCategories) {
      const item = category.items.find((entry) => entry.slug === normalized);
      if (item) return item;
    }

    return null;
  }

  async findMarketProductBySkuOrSlug(identifier: string) {
    const normalized = slugify(identifier.replace(/-default$/, ""));
    for (const category of this.marketCategories) {
      const product = category.products.find(
        (entry) => entry.slug === normalized || entry.variant.sku === identifier || entry.variant.id === identifier
      );
      if (product) return product;
    }

    return null;
  }
}

class PrismaCatalogService implements CatalogService {
  // shared mapping helpers: transform prisma payloads into catalog shapes
  private mapMenuCategory(category: { id?: string; name: string; slug?: string; description?: string | null; displayOrder?: number; isActive?: boolean; items?: Array<{ menuItem?: { slug?: string; title?: string; description?: string | null; baseAmountMinor?: number; baseCurrency?: string; imageUrl?: string | null; isAvailable?: boolean; preparationTimeMins?: number | null } | null; title?: string }> }, idx = 0): CatalogMenuCategory {
    return {
      id: category.id ?? slugify(category.name),
      slug: category.slug ?? slugify(category.name),
      name: category.name,
      nameZh: getStringField(category, "nameZh") ?? getStringField(category, "name_zh") ?? undefined,
      description: category.description ?? null,
      descriptionZh: getStringField(category, "descriptionZh") ?? getStringField(category, "description_zh") ?? undefined,
      displayOrder: category.displayOrder ?? idx + 1,
      isActive: Boolean(category.isActive),
      items: (category.items ?? []).map((entry: { menuItem?: { slug?: string; title?: string; description?: string | null; baseAmountMinor?: number; baseCurrency?: string; imageUrl?: string | null; isAvailable?: boolean; preparationTimeMins?: number | null } | null; title?: string }) => ({
        id: entry.menuItem?.slug ?? slugify(entry.menuItem?.title ?? entry.title ?? ""),
        slug: entry.menuItem?.slug ?? slugify(entry.menuItem?.title ?? entry.title ?? ""),
        name: entry.menuItem?.title ?? entry.title ?? "",
        nameZh: getStringField(entry.menuItem, "titleZh") ?? getStringField(entry, "titleZh") ?? undefined,
        description: entry.menuItem?.description ?? null,
        descriptionZh: getStringField(entry.menuItem, "descriptionZh") ?? getStringField(entry, "descriptionZh") ?? undefined,
        imageUrl: entry.menuItem?.imageUrl ?? resolveMenuImage(entry.menuItem?.title ?? entry.title ?? "").src,
        priceMinor: entry.menuItem?.baseAmountMinor ?? entry.menuItem?.baseAmountMinor ?? 0,
        currency: entry.menuItem?.baseCurrency ?? "NGN",
        isAvailable: entry.menuItem?.isAvailable ?? true,
        preparationTime: entry.menuItem?.preparationTimeMins ?? null,
        averageRating: 0,
        reviewCount: 0
      }))
    };
  }

  private mapMarketProduct(link: unknown): CatalogMarketProduct | null {
    if (!isRecord(link)) return null;

    const product = isRecord(link.product) ? link.product : null;
    const variant = product && Array.isArray(product.variants) ? product.variants[0] : isRecord(link.variant) ? link.variant : null;
    if (!product || !variant) return null;

    const productSlug = typeof product.slug === "string" ? product.slug : undefined;
    const productTitle = typeof product.title === "string" ? product.title : undefined;
    const productName = typeof product.name === "string" ? product.name : undefined;
    const productDescription = typeof product.description === "string" ? product.description : undefined;
    const variantId = typeof variant.id === "string" ? variant.id : undefined;
    const variantSku = typeof variant.sku === "string" ? variant.sku : undefined;
    const variantTitle = typeof variant.title === "string" ? variant.title : undefined;
    const variantAmountMinor = typeof variant.baseAmountMinor === "number" ? variant.baseAmountMinor : 0;
    const variantCurrency = typeof variant.baseCurrency === "string" ? variant.baseCurrency : "NGN";

    return {
      id: productSlug ?? slugify(productTitle ?? productName ?? ""),
      slug: productSlug ?? slugify(productTitle ?? productName ?? ""),
      title: productTitle ?? productName ?? "",
      description: productDescription ?? productTitle ?? "",
      imageUrl: resolveProductImage(productTitle ?? productName ?? "").src,
      variant: {
        id: variantSku ?? variantId ?? "",
        sku: variantSku ?? variantId ?? "",
        title: variantTitle ?? "Standard",
        amountMinor: variantAmountMinor,
        currency: variantCurrency,
        stockOnHand: 0
      }
    };
  }

  private async fallbackOnError<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>,
    label: string
  ): Promise<T> {
    if (fallbackActive) {
      return fallback();
    }

    try {
      const result = await fn();
      activeSource = "prisma";
      return result;
    } catch (err) {
      if (process.env.SHOW_DEMO_LOGS === "1") {
        console.warn(`[CatalogService] Prisma implementation error on ${label}.`, err);
      }
      enableStaticFallback(`Prisma runtime failure on ${label}`);
      return fallback();
    }
  }

  async listMenuCategories() {
    return this.fallbackOnError(async () => {
      const menu = await prisma.menu.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
      if (!menu) return [];
      const categories = await prisma.menuCategory.findMany({
        where: { menuId: menu.id, isActive: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: {
          items: { where: { menuItem: { isAvailable: true } }, include: { menuItem: true } }
        }
      });

      return categories.map((c, i) => this.mapMenuCategory(c, i));
    }, () => getStaticCatalogService().listMenuCategories(), "listMenuCategories");
  }

  async listMarketCategories() {
    return this.fallbackOnError(async () => {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        include: { products: { include: { product: { include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } } } } } }
      });

      return categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        products: cat.products.map((link) => this.mapMarketProduct(link)).filter((product): product is CatalogMarketProduct => product !== null)
      }));
    }, () => getStaticCatalogService().listMarketCategories(), "listMarketCategories");
  }

  async findMenuItemBySlug(slug: string) {
    return this.fallbackOnError(async () => {
      const normalized = slugify(slug);
      const menuItem = await prisma.menuItem.findFirst({ where: { slug: normalized } });
      if (!menuItem) return null;
      return {
        id: menuItem.slug,
        slug: menuItem.slug,
        name: menuItem.title,
        description: menuItem.description,
        priceMinor: menuItem.baseAmountMinor,
        currency: menuItem.baseCurrency,
        imageUrl: menuItem.imageUrl,
        isAvailable: menuItem.isAvailable,
        preparationTime: menuItem.preparationTimeMins,
        averageRating: 0,
        reviewCount: 0
      };
    }, () => getStaticCatalogService().findMenuItemBySlug(slug), "findMenuItemBySlug");
  }

  async findMarketProductBySkuOrSlug(identifier: string) {
    return this.fallbackOnError(async () => {
      const normalized = slugify(identifier.replace(/-default$/, ""));
      const variant = await prisma.productVariant.findFirst({ where: { OR: [{ id: identifier }, { sku: identifier }] }, include: { product: true } });
      if (variant) {
        return {
          id: variant.product.slug,
          slug: variant.product.slug,
          title: variant.product.title,
          description: variant.product.description ?? variant.product.title,
          variant: {
            id: variant.sku,
            sku: variant.sku,
            title: variant.title ?? "Standard",
            amountMinor: variant.baseAmountMinor,
            currency: variant.baseCurrency,
            stockOnHand: variant.stockOnHand
          }
        };
      }

      const product = await prisma.product.findFirst({ where: { slug: normalized }, include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } } });
      const fallbackVariant = product?.variants[0];
      if (!product || !fallbackVariant) return null;
      return {
        id: product.slug,
        slug: product.slug,
        title: product.title,
        description: product.description ?? product.title,
        variant: {
          id: fallbackVariant.sku,
          sku: fallbackVariant.sku,
          title: fallbackVariant.title ?? "Standard",
          amountMinor: fallbackVariant.baseAmountMinor,
          currency: fallbackVariant.baseCurrency,
          stockOnHand: fallbackVariant.stockOnHand
        }
      };
    }, () => getStaticCatalogService().findMarketProductBySkuOrSlug(identifier), "findMarketProductBySkuOrSlug");
  }
}
