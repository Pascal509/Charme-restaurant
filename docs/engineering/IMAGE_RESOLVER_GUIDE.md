# Image Resolver - Developer Quick Reference

## Overview

The enhanced image resolver provides deterministic, category-aware image resolution with comprehensive audit trail support. All menu and market items are intelligently routed to appropriate images with fallback handling.

## Basic Usage

### Menu Items

```typescript
import { resolveMenuImage } from '@/lib/image-resolver';

// Resolve menu item image
const image = resolveMenuImage("Kung Pao Chicken");
// → { src: "/images/Kongpao-Chicken.jpg", position: "object-center", explicit: true }

// With URL override
const image = resolveMenuImage("Custom Dish", "/custom-image.jpg");
// → { src: "/custom-image.jpg", position: "object-center", explicit: true }
```

### Market Products

```typescript
import { resolveProductImage } from '@/lib/image-resolver';

// Resolve product image
const image = resolveProductImage("Samyang Hot Chicken Ramen");
// → { src: "/sup_images/samyang-hot-chicken-ramen.jpg", position: "object-top", explicit: true }

// Product with generic fallback
const image = resolveProductImage("Unknown Snack Brand");
// → Uses category-aware pool, returns relevant snack image
```

## Supported Position Values

```typescript
type ImagePosition = "object-top" | "object-center" | "object-bottom";
```

**When to Use:**
- `object-top`: Soups, noodles, bowls (focus on ingredients)
- `object-center`: Desserts, sauces, small plates (balanced focus)
- `object-bottom`: Beverages, tea, drinks (focus on liquid/detail)

## Explicit Mappings

### Menu Items (28 Total)

| Category | Items | Examples |
|----------|-------|----------|
| Appetizers | 3 | Spring Rolls, Scallion Pancakes, Wontons |
| Dumplings | 4 | Pork, Shrimp, Xiao Long Bao |
| Noodles | 2 | Beef Noodle Soup, Dan Dan Noodles |
| Proteins | 5 | Peking Duck, Kung Pao Chicken |
| Desserts | 4 | Mango Pudding, Sesame Balls |
| Gelato | 2 | Matcha Coconut, Coconut Mochi |
| Beverages | 4 | Jasmine Tea, Bubble Milk Tea, etc. |

### Market Products (29 Total)

| Category | Items | Examples |
|----------|-------|----------|
| Ramen | 10 | Indomie, Nissin, Samyang, Paldo, Nongshim, etc. |
| Beverages | 4 | Sparkling Lychee, Barley Tea, Green Tea Latte |
| Sauces | 9 | Lee Kum Kee, Teriyaki, Gochujang, etc. |

### Alias Support

All explicit mappings support variant name matching:

```typescript
// These all resolve to the same premium image:
resolveMenuImage("Xiao Long Bao");      // Direct match
resolveMenuImage("XLB");                 // Alias match
resolveMenuImage("Soup Dumpling");       // Alias match
resolveMenuImage("Juicy Bun");           // Alias match

// All return the same result:
// { src: "/images/Xiao-Long-Bao.jpg", position: "object-center", explicit: true }
```

## Audit & Coverage Tracking

### Get Coverage Report

```typescript
import { getImageCoverageReport } from '@/lib/image-resolver';

const report = getImageCoverageReport();

console.log(report);
// {
//   explicit: { menu: 28, products: 29, ramenVariants: 9, total: 66 },
//   fallback: { 
//     count: 14,
//     byCategory: { noodle: 5, sauce: 3, beverage: 2, ... }
//   },
//   default: { count: 3 }
// }
```

### Access Audit Trail

```typescript
import { getImageAudit, clearImageAudit } from '@/lib/image-resolver';

// Get all resolutions since last clear
const entries = getImageAudit();

entries.forEach(entry => {
  console.log(`${entry.title} → ${entry.type} (${entry.category})`);
});

// Clear for new session
clearImageAudit();
```

### Audit Entry Structure

```typescript
type AuditEntry = {
  type: "explicit" | "fallback" | "default";  // Resolution method
  title: string;                               // Item name
  src: string;                                 // Image source
  category: string;                            // Category used
  pool?: string;                               // Pool name if fallback
};
```

## Category System

### Automatic Category Assignment

Items are categorized based on:

1. **Explicit Category** (if mapped)
2. **Keyword Matching**:
   - "soup", "noodle" → `noodle` (object-top)
   - "tea", "drink" → `beverage` (object-bottom)
   - "dumpling" → `dumpling` (object-center)
   - etc.

### Category Positions

```typescript
{
  "beverage": "object-bottom",
  "noodle": "object-top",
  "dumpling": "object-center",
  "dessert": "object-center",
  "sauce": "object-center",
  "appetizer": "object-center",
  "protein": "object-center"
}
```

## Fallback Behavior

When an item isn't explicitly mapped:

1. Check category-based keyword patterns
2. Use category-specific fallback pool
3. Select from pool deterministically (hash-based)
4. Record in audit trail with pool name

**Example:**
```typescript
// Not in explicit map, but matches "noodle" pattern
const image = resolveMenuImage("Stir-Fried Noodles");
// → Uses categoryFallbackPools.noodle
// → Returns one of 10 noodle images deterministically
// → Audit: { type: "fallback", category: "noodle", pool: "noodle_pool" }
```

## Usage in Components

### MenuPage Example

```typescript
import { resolveMenuImage } from '@/lib/image-resolver';

export function MenuItemCard({ item }) {
  const image = resolveMenuImage(item.title, item.imageUrl);
  
  return (
    <ImageWrapper
      src={image.src}
      alt={item.title}
      aspectRatio="menu"
      objectPositionClassName={image.position}
    />
  );
}
```

### CartPage Example

```typescript
import { resolveMenuImage, resolveProductImage } from '@/lib/image-resolver';

export function CartItem({ item }) {
  const image = item.type === 'menu'
    ? resolveMenuImage(item.name, item.image)
    : resolveProductImage(item.name, item.image);
  
  return (
    <img
      src={image.src}
      alt={item.name}
      className={`w-20 h-20 object-cover ${image.position}`}
    />
  );
}
```

### MarketPage Example

```typescript
import { resolveProductImage } from '@/lib/image-resolver';

export function ProductCard({ product }) {
  const image = resolveProductImage(product.name, product.imageUrl);
  
  return (
    <ImageWrapper
      src={image.src}
      alt={product.name}
      aspectRatio="square"
      objectPositionClassName={image.position}
    />
  );
}
```

## Testing

### Unit Test Template

```typescript
import { resolveMenuImage, resolveProductImage, getImageCoverageReport } from '@/lib/image-resolver';

describe('Image Resolver', () => {
  it('should resolve explicit menu mapping', () => {
    const image = resolveMenuImage("Xiao Long Bao");
    expect(image.src).toBe("/images/Xiao-Long-Bao.jpg");
    expect(image.explicit).toBe(true);
  });

  it('should resolve via alias', () => {
    const image1 = resolveMenuImage("Xiao Long Bao");
    const image2 = resolveMenuImage("Soup Dumpling");
    expect(image1.src).toBe(image2.src);
  });

  it('should return category-aware position', () => {
    const noodle = resolveMenuImage("Beef Noodle Soup");
    expect(noodle.position).toBe("object-top");
    
    const tea = resolveMenuImage("Bubble Milk Tea");
    expect(tea.position).toBe("object-bottom");
  });

  it('should use deterministic fallback', () => {
    const image1 = resolveMenuImage("Mystery Dish");
    const image2 = resolveMenuImage("Mystery Dish");
    expect(image1.src).toBe(image2.src);
  });

  it('should track coverage', () => {
    const report = getImageCoverageReport();
    expect(report.explicit.menu).toBeGreaterThan(0);
    expect(report.explicit.products).toBeGreaterThan(0);
  });
});
```

## Performance Notes

- **Direct mappings:** O(1) - single hash table lookup
- **Alias matching:** O(n×m) where n=mappings, m=aliases (cached on miss)
- **Fallback selection:** O(1) - deterministic hash-based pool selection
- **No network calls** - fully local resolution
- **No randomness** - hash function ensures consistent results

## Migration Guide

If migrating from an older resolver:

### Before
```typescript
// Old API
const image = getImageUrl(title);
const position = getDefaultPosition(title);
```

### After
```typescript
// New API (backward compatible)
import { resolveMenuImage } from '@/lib/image-resolver';

const resolved = resolveMenuImage(title);
const image = resolved.src;
const position = resolved.position;

// Additional benefits:
const isCurated = resolved.explicit;
const category = resolved.category;
```

## Common Issues & Troubleshooting

### Issue: Image not resolving to explicit mapping

**Solution:** Check that item name is properly normalized (lowercase, special chars removed):
```typescript
import { normalize } from '@/lib/image-resolver';
const normalized = normalize("XIAO LONG BAO!");
console.log(normalized); // "xiao long bao"
```

### Issue: Audit trail grows too large

**Solution:** Clear periodically in production:
```typescript
// In admin endpoint
import { clearImageAudit } from '@/lib/image-resolver';
clearImageAudit();

// Or query and analyze first
const report = getImageCoverageReport();
console.log(report); // Get stats before clear
```

### Issue: Fallback images not ideal for specific item

**Solution:** Add to explicit mappings:
```typescript
// Edit src/lib/image-resolver.ts MENU_IMAGE_MAP or PRODUCT_IMAGE_MAP
"your item name": {
  src: "/images/better-image.jpg",
  position: "object-center",
  category: "dessert",
  aliases: ["variant 1", "variant 2"]
}
```

## Advanced: Custom Category Pools

To add custom fallback pools for specific use cases:

```typescript
// In src/lib/image-resolver.ts
const customPools = {
  "vegetarian": ["/images/veg1.jpg", "/images/veg2.jpg"],
  "spicy": ["/images/hot1.jpg", "/images/hot2.jpg"],
  // ...
};

// Modify resolveMenuImage() to check custom pools:
if (text.includes("vegetarian") && customPools.vegetarian) {
  return { src: pick(text, customPools.vegetarian), position: "object-center" };
}
```

---

## Resources

- [Full Optimization Report](./IMAGE_OPTIMIZATION_REPORT.md)
- [Image Resolver Source](./src/lib/image-resolver.ts)
- [ImageWrapper Component](./src/components/ui/ImageWrapper.tsx)
- [Menu Usage](./src/features/menu/components/MenuPage.tsx)
- [Market Usage](./src/features/market/components/MarketPage.tsx)

## Questions?

Refer to the implementation in [src/lib/image-resolver.ts](./src/lib/image-resolver.ts) for complete type definitions and function signatures.
