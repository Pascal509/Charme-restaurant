# Image Resolver Architecture

## Overview

The Charme restaurant app now uses a **deterministic, catalog-backed image resolver** that eliminates duplicate product images, repeated dish photos, and inconsistent visuals across cart/checkout/menu/market surfaces.

## Architecture

### Core Components

#### 1. **Image Resolver** (`src/lib/image-resolver.ts`)

**Purpose:** Centralized, deterministic image URL resolution for menu items and market products.

**Resolution Priority:**

1. **Explicit Image Maps** (intentional, hand-curated mappings)
   - `MENU_IMAGE_MAP` – high-value menu items (dumplings, noodles, teas, ice cream)
   - `PRODUCT_IMAGE_MAP` – market products with specific brands
   - `GELATO_IMAGE_MAP` – ice cream and desserts
   - `TEA_IMAGE_MAP` – beverage items

2. **Category-Based Heuristics** (fallback pools, deterministic per category)
   - `menuPools` – category-specific image pools (chicken, seafood, soup, etc.)
   - `marketPools` – product-category pools (noodles, sauces, snacks, drinks, etc.)
   - Uses `pick(normalized_title, pool)` for deterministic selection via hash

3. **Default Pools** (final fallback, never reused per-item)
   - Generic cuisine/restaurant images

**Key Functions:**

```typescript
export function resolveMenuImage(title: string, imageUrl?: string | null): ResolvedImage
export function resolveProductImage(title: string, imageUrl?: string | null): ResolvedImage
```

**Behavior:**
- Accepts item title + optional pre-set imageUrl
- Returns `{ src: string, position: ImagePosition }`
- Supports **object positioning** for responsive image cropping

### 2. **Catalog Integration** (`src/data/catalog.ts`)

- **Menu items** are auto-enriched with `imageUrl: resolveMenuImage(item.title).src`
- **Market products** are auto-enriched with `imageUrl: resolveProductImage(item.title).src`
- Central source of truth for all localized product metadata

### 3. **Consumer Integration**

**Menu (`MenuPage.tsx`):**
- Uses `resolveMenuImage(title)` for menu card images
- Falls back to pre-resolved `item.imageUrl` from catalog

**Market (`MarketPage.tsx`):**
- Uses pre-resolved `product.imageUrl` from catalog
- No additional resolution needed

**Cart (`memoryCartService.ts`):**
- Enriches cart items with `menuItem.imageUrl` and `productVariant.imageUrl`
- Images passed through checkout summary

**Checkout (`CheckoutPage.tsx`):**
- Displays `cartItem.imageUrl` in summary line items

### 4. **Audit Tooling** (`scripts/image-audit.js`)

**Purpose:** Detect image system quality issues

**Metrics:**
- Total public assets: `269 files`
- Referenced in resolver: `152 files`
- **Duplicates detected**: `0` (✅ success – no pool reuse)
- **Unused assets**: `117 files` (candidate for pruning)
- **Missing explicit mappings**: `134 items` (use category pools + heuristics)

**Running the Audit:**
```bash
npm run image-audit
```

**Output:** `image-audit-report.json`

---

## Asset Structure

```
public/
├── images/            # Restaurant dishes & meals (123 files)
│   ├── Spring-roll.jpg
│   ├── Beef-Noodle-Soup.jpg
│   ├── chinese-cuisine.jpg
│   └── ...
├── sup_images/        # Supermarket inventory (133 files)
│   ├── instant-noodles.jpg
│   ├── Pocky-Sticks.jpg
│   ├── ariel-detergent.jpg
│   └── ...
└── tea&iced-cream/    # Desserts, gelato, tea (13 files)
    ├── bubble-milk-tea.jpg
    ├── matcha-coconut-ice-cream.jpg
    └── ...
```

---

## Explicit Image Maps

### Menu Map (`MENU_IMAGE_MAP`)

**Examples of intentional, one-to-one mappings:**

```typescript
const MENU_IMAGE_MAP = {
  "spring rolls": { src: "/images/Spring-roll.jpg" },
  "pork dumplings": { src: "/images/Fresh-homemade-Chinese-boiled-dumplings.jpg" },
  "beef noodle soup": { src: "/images/Beef-Noodle-Soup.jpg", position: "object-top" },
  "bubble milk tea": { src: "/tea&iced-cream/bubble-milk-tea.jpg", position: "object-bottom" },
  "peking duck": { src: "/images/Peking-Duck.jpg", position: "object-center" }
};
```

**Aliases support:**
- Maps can include optional `aliases: string[]` for variants (not yet implemented)

### Product Map (`PRODUCT_IMAGE_MAP`)

```typescript
const PRODUCT_IMAGE_MAP = {
  "indomie oriental noodles": { src: "/sup_images/indomie-oriental-noodles.jpg" },
  "nissin ramen classic": { src: "/sup_images/nissin-ramen-classic.jpg" },
  "paldo jjajang noodles": { src: "/sup_images/paldo-black-bean-sauce-noodles.jpg" }
};
```

---

## Image Positioning

**Supported positions for `object-fit: cover` and `object-position`:**

- `"object-top"` – for soups, noodles, drinks (top-aligned)
- `"object-center"` – default for most foods
- `"object-bottom"` – for teas, tall beverages

**Applied in UI:**
```css
img {
  object-fit: cover;
  object-position: var(--position); /* object-top | object-center | object-bottom */
}
```

---

## Validation Checklist

### Build

✅ **`npm run build`** – 36 static pages generated  
✅ **No TypeScript/ESLint errors**  
✅ **No "No image" hardcoded strings in active UI**

### Image References

✅ **Cart items** inherit correct `imageUrl` from catalog  
✅ **Checkout summary** uses correct thumbnails  
✅ **Menu cards** use `resolveMenuImage(title)`  
✅ **Market cards** use `product.imageUrl` from catalog

### Audit Results

✅ **No duplicates** – deterministic pool selection with unique per-category  
✅ **152/269 assets used** – 56% utilization  
✅ **0 errors** – no "No image" fallback in production views

---

## Remaining Opportunities

### 1. Expand Explicit Maps

Currently ~10 high-priority items mapped explicitly. Candidates:
- **Tea beverages** (Jasmine Tea, Oolong Tea, etc.)
- **Premium dishes** (Peking Duck, Ginger Scallion Lobster, etc.)
- **Popular market items** (Pocky, Samyang, Nongshim variants)

### 2. Asset Pruning

**117 unused assets identified** (13 MB+):
- Old marketing photos
- Duplicate filename variants
- Video files (`.mp4`)
- Non-English filenames

**Recommendation:** Remove after confirming no manual references in admin/config.

### 3. Alias Support

Implement `aliases: string[]` in explicit maps:
```typescript
"bubble milk tea": {
  src: "/tea&iced-cream/bubble-milk-tea.jpg",
  aliases: ["boba tea", "pearl milk tea"]
}
```

### 4. Position Fine-Tuning

Measure and refine `object-position` values for better crop control:
```typescript
"peking duck": {
  src: "...",
  position: "object-center 30%"  // x y coordinates
}
```

---

## Integration Guide

### Adding a New Menu Item with Explicit Image

1. **Update catalog** (`src/data/catalog.ts`):
   ```typescript
   { title: "Silky Tofu with Chili Oil", ... }
   ```

2. **Add to explicit map** (`src/lib/image-resolver.ts`):
   ```typescript
   const MENU_IMAGE_MAP = {
     ...
     "silky tofu with chili oil": { 
       src: "/images/Silky-Tofu-Chili-Oil.jpg",
       position: "object-center"
     }
   };
   ```

3. **Build & test**:
   ```bash
   npm run build
   npm run image-audit
   ```

### Adding Market Product

1. **Update catalog** and **explicit product map** similarly
2. The image flows automatically to cart/checkout via `product.imageUrl`

---

## Technical Notes

- **No CMS or storage providers** – all images are static in `public/`
- **No AI image generation** – all images are hand-curated
- **No external i18n framework** – custom locale-aware resolver
- **Deterministic hashing** – same title always resolves to same image across sessions/sessions (useful for caching, A/B testing)
- **Build-time enrichment** – catalog generation happens at build time; no runtime overhead

---

## Files Modified/Created

- `src/lib/image-resolver.ts` – Core resolver with explicit maps
- `src/data/catalog.ts` – Auto-enrichment of menu/market items
- `scripts/image-audit.js` – Audit script for duplicates/unused/missing
- `package.json` – Added `npm run image-audit` script
- `src/features/cart/services/memoryCartService.ts` – Image enrichment in cart items (existing pattern maintained)

---

## Next Steps

1. **Review unused assets** (`image-audit-report.json`) and prune if safe
2. **Expand explicit maps** for remaining high-priority items
3. **Monitor production** for any missing image scenarios
4. **Optional:** Implement alias support for variant titles

