import type {
  CatalogReadSource,
  CatalogMenuCategory,
  CatalogMenuItem,
  CatalogMarketCategory,
  CatalogMarketProduct,
  CatalogService
} from "@/features/catalog/services/catalogService";
import { createCatalogService, slugify } from "@/features/catalog/services/catalogService";

const catalogService = createCatalogService();

export type { CatalogMenuCategory, CatalogMenuItem, CatalogMarketCategory, CatalogMarketProduct, CatalogService };

export { createCatalogService };
export type { CatalogReadSource };

export function getCatalogService() {
  return catalogService;
}

export async function buildRuntimeMenuCategories(): Promise<CatalogMenuCategory[]> {
  return catalogService.listMenuCategories();
}

export async function buildRuntimeMarketCategories(): Promise<CatalogMarketCategory[]> {
  return catalogService.listMarketCategories();
}

export function findRuntimeMenuItemBySlug(slug: string) {
  return catalogService.findMenuItemBySlug(slug);
}

export function findRuntimeMarketProductBySkuOrSlug(identifier: string) {
  return catalogService.findMarketProductBySkuOrSlug(identifier);
}

export { slugify };
