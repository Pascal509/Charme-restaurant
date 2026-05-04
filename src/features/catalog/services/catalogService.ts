import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { marketCatalog, menuCatalog } from "@/data/catalog";

export type CatalogReadSource = "static" | "prisma";

export type CatalogMenuItem = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
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
  description?: string | null;
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
  description: string;
  variant: CatalogMarketVariant;
};

export type CatalogMarketCategory = {
  id: string;
  slug: string;
  name: string;
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

let staticCatalogService: StaticCatalogService | null = null;
let prismaCatalogService: PrismaCatalogService | null = null;
let configuredSource: CatalogReadSource = env.CATALOG_READ_SOURCE;
let activeSource: CatalogReadSource = env.CATALOG_READ_SOURCE;
let fallbackActive = false;
let fallbackReason: string | null = null;

function enableStaticFallback(reason: string) {
  if (!fallbackActive) {
    console.warn(`[CatalogService] Falling back to static catalog: ${reason}`);
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

export function createCatalogService(source: CatalogReadSource = env.CATALOG_READ_SOURCE) {
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
        console.info("[CatalogService] Prisma read source enabled and database reachable");
      } catch (err) {
        console.warn("[CatalogService] Prisma read source enabled but DB health check failed.", err);
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
    console.info("[CatalogService] Using StaticCatalogService (seeded catalog)");
  }

  activeSource = "static";

  return staticCatalogService;
}

export function getPrismaCatalogService() {
  if (!prismaCatalogService) {
    prismaCatalogService = new PrismaCatalogService();
    console.info("[CatalogService] Using PrismaCatalogService (DB-backed catalog)");
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

class StaticCatalogService implements CatalogService {
  private readonly menuCategories = menuCatalog.map((category, categoryIndex) => ({
    id: slugify(category.name),
    slug: slugify(category.name),
    name: category.name,
    description: category.description ?? null,
    displayOrder: categoryIndex + 1,
    isActive: true,
    items: category.items.map((item) => {
      const slug = slugify(item.title);
      return {
        id: slug,
        slug,
        name: item.title,
        description: item.description,
        priceMinor: item.baseAmountMinor,
        currency: "NGN",
        imageUrl: null,
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
    products: category.items.map((item) => {
      const slug = slugify(item.title);
      const sku = `${slug}-default`;
      return {
        id: slug,
        slug,
        title: item.title,
        description: item.description,
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
  private mapMenuCategory(category: any, idx = 0): CatalogMenuCategory {
    return {
      id: category.id ?? slugify(category.name),
      slug: category.slug ?? slugify(category.name),
      name: category.name,
      description: category.description ?? null,
      displayOrder: category.displayOrder ?? idx + 1,
      isActive: Boolean(category.isActive),
      items: (category.items ?? []).map((entry: any) => ({
        id: entry.menuItem?.slug ?? slugify(entry.menuItem?.title ?? entry.title ?? ""),
        slug: entry.menuItem?.slug ?? slugify(entry.menuItem?.title ?? entry.title ?? ""),
        name: entry.menuItem?.title ?? entry.title ?? "",
        description: entry.menuItem?.description ?? null,
        priceMinor: entry.menuItem?.baseAmountMinor ?? entry.menuItem?.baseAmountMinor ?? 0,
        currency: entry.menuItem?.baseCurrency ?? "NGN",
        imageUrl: entry.menuItem?.imageUrl ?? null,
        isAvailable: entry.menuItem?.isAvailable ?? true,
        preparationTime: entry.menuItem?.preparationTimeMins ?? null,
        averageRating: 0,
        reviewCount: 0
      }))
    };
  }

  private mapMarketProduct(link: any): CatalogMarketProduct | null {
    const product = link.product ?? link;
    const variant = (product.variants && product.variants[0]) ?? link.variant ?? null;
    if (!variant) return null;

    return {
      id: product.slug ?? slugify(product.title ?? product.name ?? ""),
      slug: product.slug ?? slugify(product.title ?? product.name ?? ""),
      title: product.title ?? product.name ?? "",
      description: product.description ?? product.title ?? "",
      variant: {
        id: variant.sku ?? variant.id,
        sku: variant.sku ?? variant.id,
        title: variant.title ?? "Standard",
        amountMinor: variant.baseAmountMinor,
        currency: variant.baseCurrency ?? "NGN",
        stockOnHand: variant.stockOnHand ?? 0
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
      console.warn(`[CatalogService] Prisma implementation error on ${label}.`, err);
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

      return categories.map((cat: any) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        products: cat.products.map((link: any) => this.mapMarketProduct(link)).filter(Boolean)
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
