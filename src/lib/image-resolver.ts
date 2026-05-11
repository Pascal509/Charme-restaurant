type ImagePosition = "object-top" | "object-center" | "object-bottom";
type ImageCategory = "menu" | "market" | "cart" | "hero";

type ResolvedImage = {
  src: string;
  position: ImagePosition;
  category?: ImageCategory;
  explicit?: boolean;
};

type AuditEntry = {
  type: "explicit" | "fallback" | "default";
  title: string;
  src: string;
  category: string;
  pool?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

function pick(seed: string, pool: readonly string[]) {
  return pool[hash(seed) % pool.length];
}

// Audit trail for image coverage analysis
const auditTrail: AuditEntry[] = [];

// Premium menu dish explicit mappings with category awareness
const MENU_IMAGE_MAP: Record<string, { src: string; position?: ImagePosition; aliases?: string[]; category?: string }> = {
  // Appetizers & Starters
  "spring rolls": { src: "/images/Spring-roll.jpg", category: "appetizer", aliases: ["spring roll", "fresh spring roll"] },
  "scallion pancakes": { src: "/images/Cantones-Scallion-Pancakes.jpg", category: "appetizer", aliases: ["scallion pancake", "green onion pancake"] },
  "crispy wontons": { src: "/images/Crispy-Wontons.jpg", category: "appetizer", aliases: ["wonton", "fried wonton"] },
  
  // Premium Dumplings & Dim Sum
  "pork dumplings": { src: "/images/Fresh-homemade-Chinese-boiled-dumplings.jpg", category: "dumpling", aliases: ["pork dumpling", "boiled dumpling"] },
  "shrimp dumplings": { src: "/images/Mai-Steamed-Chicken-and-shrimp-dumpling.jpg", category: "dumpling", aliases: ["prawn dumpling", "har gow"] },
  "xiao long bao": { src: "/images/Xiao-Long-Bao.jpg", category: "dumpling", aliases: ["xlb", "soup dumpling", "juicy bun"] },
  
  // Noodle Signature Dishes
  "beef noodle soup": { src: "/images/Beef-Noodle-Soup.jpg", position: "object-top", category: "noodle", aliases: ["beef noodles", "beef noodle"] },
  "dan dan noodles": { src: "/images/Dan-Dan-Noodles.jpg", position: "object-top", category: "noodle", aliases: ["dan dan", "sesame noodle"] },
  
  // Premium Proteins
  "peking duck": { src: "/images/Peking-Duck.jpg", position: "object-center", category: "protein", aliases: ["peking duck sliced"] },
  "kung pao chicken": { src: "/images/Kongpao-Chicken.jpg", position: "object-center", category: "protein", aliases: ["kung pao", "gong bao"] },
  "sweet and sour pork": { src: "/images/Sweet-&-Sour-Pineapple-Fish-available.jpg", position: "object-center", category: "protein" },
  "mapo tofu": { src: "/images/hot-&-sour-soup-(peking-soup).jpg", position: "object-center", category: "protein", aliases: ["mapo"] },
  "hot plate beef": { src: "/images/Charme-Braised-Beef-Stew.jpg", position: "object-center", category: "protein", aliases: ["sizzling beef"] },
  
  // Desserts
  "mango pudding": { src: "/images/Mango-Pudding.jpg", position: "object-center", category: "dessert", aliases: ["mango custard"] },
  "sesame balls": { src: "/images/Dessert -Eight-Jewel-Sticky-Rice.jpg", position: "object-center", category: "dessert", aliases: ["sesame ball", "fried sesame ball"] },
  "red bean pancakes": { src: "/images/Cantones-Banana-pancakes.jpg", position: "object-center", category: "dessert", aliases: ["red bean pancake"] },
  "eight treasure rice": { src: "/images/Dessert -Eight-Jewel-Sticky-Rice.jpg", position: "object-center", category: "dessert", aliases: ["eight jewel rice"] },
  
  // Gelato & Ice Cream
  "matcha coconut ice cream": { src: "/tea&iced-cream/matcha-coconut-ice-cream.jpg", position: "object-center", category: "gelato", aliases: ["matcha ice cream", "matcha coconut"] },
  "coconut mochi": { src: "/tea&iced-cream/coconut-mochi.jpg", position: "object-center", category: "gelato", aliases: ["coconut mochi ice cream"] },
  
  // Beverages & Tea
  "jasmine tea": { src: "/images/Charme-bubble-Tea-shop.jpg", position: "object-bottom", category: "beverage", aliases: ["jasmine", "jasmine green tea"] },
  "bubble milk tea": { src: "/tea&iced-cream/bubble-milk-tea.jpg", position: "object-bottom", category: "beverage", aliases: ["boba tea", "milk tea", "pearl milk tea"] },
  "osmanthus oolong": { src: "/images/Charme-bubble-Tea-shop.jpg", position: "object-bottom", category: "beverage", aliases: ["oolong", "osmanthus"] },
  "plum blossom iced tea": { src: "/tea&iced-cream/cha&tea.jpg", position: "object-bottom", category: "beverage", aliases: ["plum tea", "iced tea"] }
};

// Market product explicit mappings with aliases for variants
const PRODUCT_IMAGE_MAP: Record<string, { src: string; position?: ImagePosition; aliases?: string[]; category?: string }> = {
  // Ramen Variants - Grouped by Brand
  "indomie oriental noodles": { src: "/sup_images/indomie-oriental-noodles.jpg", category: "noodle", aliases: ["indomie", "indomie oriental"] },
  "nissin ramen classic": { src: "/sup_images/nissin-ramen-classic.jpg", category: "noodle", aliases: ["nissin", "nissin classic", "nissin regular"] },
  "samyang hot chicken ramen": { src: "/sup_images/samyang-hot-chicken-ramen.jpg", category: "noodle", aliases: ["samyang", "samyang hot chicken", "samyang spicy"] },
  "paldo jjajang noodles": { src: "/sup_images/paldo-black-bean-sauce-noodles.jpg", category: "noodle", aliases: ["paldo", "paldo jjajang", "jjajang noodles"] },
  "nongshim shin ramyun": { src: "/sup_images/nongshim-shin-ramyun.jpg", category: "noodle", aliases: ["nongshim", "shin ramyun", "shin"] },
  "nongshim udon": { src: "/sup_images/nongshim-udon-ramen.jpg", category: "noodle", aliases: ["nongshim udon", "udon noodles"] },
  "nongshim beef bone ramen": { src: "/sup_images/nongshim-beef-bone-ramen.jpg", category: "noodle", aliases: ["beef bone", "beef bone ramen"] },
  "ottogi cheese ramen": { src: "/sup_images/ottogi-cheese-ramen.jpg", category: "noodle", aliases: ["ottogi", "ottogi cheese", "cheese ramen"] },
  "koka chicken ramen": { src: "/sup_images/koka-chicken-flavor-noodles.jpg", category: "noodle", aliases: ["koka chicken", "koka"] },
  "mama tom yum noodles": { src: "/sup_images/tomyun-soup-instant-noodles.jpg", category: "noodle", aliases: ["mama tom yum", "tom yum"] },
  
  // Beverages - Categorized
  "sparkling lychee soda": { src: "/sup_images/lotte-milkis-mango-drink.jpg", category: "beverage", aliases: ["lychee soda", "sparkling lychee"] },
  "roasted barley tea": { src: "/sup_images/ovaltine-beverage.jpg", category: "beverage", aliases: ["barley tea"] },
  "green tea latte mix": { src: "/sup_images/ovaltine-cup-cafe.jpg", category: "beverage", aliases: ["matcha latte", "green tea latte"] },
  "plum blossom iced tea": { src: "/sup_images/calpis-soda-drink.jpg", category: "beverage", aliases: ["plum tea", "iced tea"] },
  
  // Sauces & Condiments
  "lee kum kee premium soy sauce": { src: "/sup_images/soy-sauce-for-dumplings.jpg", category: "sauce", aliases: ["lee kum kee soy", "premium soy sauce"] },
  "teriyaki sauce": { src: "/sup_images/teriyaki-sauce.jpg", category: "sauce", aliases: ["teriyaki"] },
  "kewpie mayonnaise": { src: "/sup_images/kewpie-mayonnaise.jpg", category: "sauce", aliases: ["kewpie", "mayo"] },
  "sesame dressing": { src: "/sup_images/kewpie-roasted-sesame-dressing.jpg", category: "sauce", aliases: ["sesame", "roasted sesame dressing"] },
  "house curry roux": { src: "/sup_images/house-kokumaro-curry.jpg", category: "sauce", aliases: ["curry roux", "house curry"] },
  "gochujang": { src: "/sup_images/sempio-guchujang-korean-chili-paste.jpg", category: "sauce", aliases: ["korean chili paste"] },
  "ssamjang": { src: "/sup_images/sempio-ssamjang-korean-soybean-dipping-paste.jpg", category: "sauce", aliases: ["korean soybean paste"] },
  "bulgogi sauce": { src: "/sup_images/sempio-korean-bbq-bulgogi-sauce.jpg", category: "sauce", aliases: ["korean bbq sauce"] },
  "tojang soybean paste": { src: "/sup_images/sempio-tojang-soybean-paste.jpg", category: "sauce", aliases: ["soybean paste"] }
};

function getDefaultPosition(title: string, category?: string): ImagePosition {
  const text = normalize(title);
  
  // Category-aware positioning
  if (category === "beverage" || category === "tea" || category === "drink") return "object-bottom";
  if (category === "noodle" || category === "soup") return "object-top";
  if (category === "dumpling" || category === "dim sum" || category === "appetizer") return "object-center";
  if (category === "gelato" || category === "dessert" || category === "sauce") return "object-center";
  if (category === "protein") return "object-center";
  
  // Content-aware positioning (legacy fallback)
  if (text.includes("soup") || text.includes("noodle") || text.includes("bowl") || text.includes("ramen")) return "object-top";
  if (text.includes("tea") || text.includes("drink") || text.includes("juice") || text.includes("coffee") || text.includes("beverage") || text.includes("soda") || text.includes("sparkling")) return "object-bottom";
  if (text.includes("dumpling") || text.includes("wonton") || text.includes("pudding") || text.includes("dessert")) return "object-center";
  
  return "object-center";
}

// Enhanced category-based fallback pools with priority
const categoryFallbackPools = {
  appetizer: [
    "/images/Spring-roll.jpg",
    "/images/Cantones-Scallion-Pancakes.jpg",
    "/images/Crispy-Wontons.jpg"
  ],
  dumpling: [
    "/images/Fresh-homemade-Chinese-boiled-dumplings.jpg",
    "/images/Asian-dumplings-with-beef-filling-and-soy-dipping-sauce.jpg",
    "/images/Mai-Steamed-Chicken-and-shrimp-dumpling.jpg",
    "/images/Xiao-Long-Bao.jpg"
  ],
  noodle: [
    "/images/Beef-Noodle-Soup.jpg",
    "/images/noodles.jpg",
    "/images/Beef-fried-noodles.jpg",
    "/images/Dan-Dan-Noodles.jpg",
    "/images/Pan-Fried-Beef-bun.jpg"
  ],
  rice: [
    "/images/beef-fried-rice..jpg",
    "/images/Braised-yellow-croaker-served-fried-rice.jpg"
  ],
  chicken: [
    "/images/Mouth-watering-Chicken.jpg",
    "/images/Crispy-Chicken-Wings.jpg",
    "/images/Chongking-spicy-chicken.jpg",
    "/images/Fish-flavored-Chicken.jpg",
    "/images/Kongpao-Chicken.jpg"
  ],
  seafood: [
    "/images/Prawns-with-Broccoli-in-Garlic-Sauce.jpg",
    "/images/Kung Fu Shrimp.jpg",
    "/images/Calamari-with-oyster-sauce-in-hot-plate.jpg",
    "/images/Spicy-Crabs.jpg",
    "/images/Boiled-fish.jpg",
    "/images/Hong-Kong-Style-Breaded-Fried-Prawns.jpg"
  ],
  beef: [
    "/images/Charme-Braised-Beef-Stew.jpg",
    "/images/Beef-ball-with-black-pepper.jpg",
    "/images/Hot-&-Sour-Soup-(Peking-Soup).jpg"
  ],
  protein: [
    "/images/Peking-Duck.jpg",
    "/images/Sweet-&-Sour-Baby-Ribs.jpg",
    "/images/Steamed-Spareribs-with-black-bean-Sauce.jpg",
    "/images/Taiwan-Crispy-Fried-Chicken.jpg"
  ],
  soup: [
    "/images/Hot-&-Sour-Soup-(Peking-Soup).jpg",
    "/images/Fish-ball-Soup.jpg",
    "/images/charme-braised-fish-stew.jpg"
  ],
  dessert: [
    "/images/Dessert -Eight-Jewel-Sticky-Rice.jpg",
    "/images/Mango-Pudding.jpg",
    "/images/cocktail.jpg",
    "/images/Cantones-Banana-pancakes.jpg"
  ],
  gelato: [
    "/tea&iced-cream/matcha-coconut-ice-cream.jpg",
    "/tea&iced-cream/coconut-mochi.jpg"
  ],
  beverage: [
    "/images/Charme-bubble-Tea-shop.jpg",
    "/tea&iced-cream/bubble-milk-tea.jpg",
    "/tea&iced-cream/cha&tea.jpg",
    "/tea&iced-cream/cha&tea2.jpg",
    "/tea&iced-cream/chat&tea1.jpg",
    "/tea&iced-cream/chat&tea3.jpg"
  ],
  default: [
    "/images/chinese-cuisine.jpg",
    "/images/chinese-cuisine1.jpg",
    "/images/best-of-Chinese-cuisine.jpg",
    "/images/specialized-Chinese-cuisine.jpg",
    "/images/Charme-restaurant.jpg"
  ]
} as const;

// Ramen/Noodle variant mappings for precise matching
const RAMEN_VARIANTS: Record<string, { src: string; position?: ImagePosition }> = {
  "cheese": { src: "/sup_images/cheese-ramen-soup.jpg", position: "object-top" },
  "beef bone": { src: "/sup_images/nongshim-beef-bone-ramen.jpg", position: "object-top" },
  "black pepper": { src: "/sup_images/koka-black-pepper-fried-noodles.jpg", position: "object-top" },
  "spicy beef": { src: "/sup_images/koka-spicy-beef-flavor-noodles.jpg", position: "object-top" },
  "chicken": { src: "/sup_images/koka-chicken-flavor-noodles.jpg", position: "object-top" },
  "jajang": { src: "/sup_images/paldo-black-bean-sauce-noodles.jpg", position: "object-top" },
  "jjajang": { src: "/sup_images/paldo-black-bean-sauce-noodles.jpg", position: "object-top" },
  "udon": { src: "/sup_images/nongshim-udon-ramen.jpg", position: "object-top" },
  "tom yum": { src: "/sup_images/tomyun-soup-instant-noodles.jpg", position: "object-top" }
};

// Market pools optimized to reduce fallback variance
const marketPools = {
  noodle: [
    "/sup_images/instant-noodles.jpg",
    "/sup_images/shim-ramyun.jpg",
    "/sup_images/nongshim-udon-ramen.jpg",
    "/sup_images/cheese-ramen-soup.jpg",
    "/sup_images/tomyun-soup-instant-noodles.jpg",
    "/sup_images/paldo-black-bean-sauce-noodles.jpg",
    "/sup_images/koka-chicken-flavor-noodles.jpg",
    "/sup_images/koka-spicy-beef-flavor-noodles.jpg",
    "/sup_images/koka-black-pepper-fried-noodles.jpg",
    "/sup_images/nongshim-beef-bone-ramen.jpg"
  ],
  sauce: [
    "/sup_images/soy-sauce-for-dumplings.jpg",
    "/sup_images/teriyaki-sauce.jpg",
    "/sup_images/kewpie-roasted-sesame-dressing.jpg",
    "/sup_images/kewpie-mayonnaise.jpg",
    "/sup_images/house-kokumaro-curry.jpg",
    "/sup_images/sempio-korean-bbq-bulgogi-sauce.jpg",
    "/sup_images/sempio-ssamjang-korean-soybean-dipping-paste.jpg",
    "/sup_images/sempio-guchujang-korean-chili-paste.jpg",
    "/sup_images/sempio-tojang-soybean-paste.jpg",
    "/sup_images/real-thai-tom-yum-soup-paste.jpg"
  ],
  snack: [
    "/sup_images/zzang-snack.jpg",
    "/sup_images/pocky-chocolate.jpg",
    "/sup_images/pocky-strawberry.jpg",
    "/sup_images/pretz-salt-butter-flavor.jpg",
    "/sup_images/salt-popcorn.jpg",
    "/sup_images/oreo-biscuits.jpg",
    "/sup_images/beatrix-potter-wafers.jpg",
    "/sup_images/calbee-hot-&-spicy-potato-chips.jpg",
    "/sup_images/garlic-shrimp-chips.jpg",
    "/sup_images/butter-garlic-shrimp-chips.jpg"
  ],
  drink: [
    "/sup_images/calpis-soda-drink.jpg",
    "/sup_images/ambasa-drink.jpg",
    "/sup_images/aqua-panna-natural-mineral-water.jpg",
    "/sup_images/binggrae-banana-flavored-milk.jpg",
    "/sup_images/maxwell-house-maxwell-coffee.jpg",
    "/sup_images/fanta-soda.jpg",
    "/sup_images/lotte-milkis-mango-drink.jpg",
    "/sup_images/pocari-sweat-drink.jpg",
    "/sup_images/milkis-soda-beverage.jpg",
    "/sup_images/sangaria-ramune-drink.jpg"
  ],
  default: [
    "/sup_images/korean-staples.jpg",
    "/sup_images/ramen-shelf.jpg",
    "/sup_images/fruits-and-veges.jpg",
    "/sup_images/ambasa-drink.jpg"
  ]
} as const;

export const EXPLICIT_MENU_KEYS = Object.keys(MENU_IMAGE_MAP);
export const EXPLICIT_PRODUCT_KEYS = Object.keys(PRODUCT_IMAGE_MAP);
export const EXPLICIT_RAMEN_VARIANTS = Object.keys(RAMEN_VARIANTS);

// Audit functions for image coverage analysis
export function getImageAudit(): AuditEntry[] {
  return [...auditTrail];
}

export function clearImageAudit(): void {
  auditTrail.length = 0;
}

export function getImageCoverageReport() {
  const menuExplicit = Object.keys(MENU_IMAGE_MAP).length;
  const productExplicit = Object.keys(PRODUCT_IMAGE_MAP).length;
  const ramenVariants = Object.keys(RAMEN_VARIANTS).length;
  
  const fallbackEntries = auditTrail.filter(e => e.type === "fallback").length;
  const defaultEntries = auditTrail.filter(e => e.type === "default").length;
  
  return {
    explicit: {
      menu: menuExplicit,
      products: productExplicit,
      ramenVariants: ramenVariants,
      total: menuExplicit + productExplicit + ramenVariants
    },
    fallback: {
      count: fallbackEntries,
      byCategory: auditTrail
        .filter(e => e.type === "fallback")
        .reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    },
    default: {
      count: defaultEntries
    }
  };
}

function recordAudit(type: "explicit" | "fallback" | "default", title: string, src: string, category: string, pool?: string) {
  auditTrail.push({ type, title, src, category, pool });
}

export function resolveMenuImage(title: string, imageUrl?: string | null): ResolvedImage {
  const text = normalize(title);
  
  if (imageUrl) {
    recordAudit("explicit", title, imageUrl, "menu");
    return { src: imageUrl, position: getDefaultPosition(title, "menu"), explicit: true };
  }

  // Priority 1: Direct explicit mapping
  const explicit = MENU_IMAGE_MAP[text];
  if (explicit) {
    recordAudit("explicit", title, explicit.src, "menu");
    return { src: explicit.src, position: explicit.position ?? getDefaultPosition(title, explicit.category), explicit: true };
  }

  // Priority 2: Check aliases
  for (const mapping of Object.values(MENU_IMAGE_MAP)) {
    if (mapping.aliases && mapping.aliases.some(alias => normalize(alias) === text)) {
      recordAudit("explicit", title, mapping.src, "menu");
      return { src: mapping.src, position: mapping.position ?? getDefaultPosition(title, mapping.category), explicit: true };
    }
  }

  // Priority 3: Category-aware fallback with keyword matching
  let category: string | undefined;
  let fallbackPool: readonly string[] | undefined;
  let fallbackPos = getDefaultPosition(title);

  if (text.includes("dumpling") || text.includes("wonton") || text.includes("siu mai") || text.includes("har gow") || text.includes("xiao long bao")) {
    category = "dumpling";
    fallbackPool = categoryFallbackPools.dumpling;
    fallbackPos = "object-center";
  } else if (text.includes("noodle") || text.includes("chow mein") || text.includes("vermicelli") || text.includes("lo mein") || text.includes("dan dan") || text.includes("beef noodle")) {
    category = "noodle";
    fallbackPool = categoryFallbackPools.noodle;
    fallbackPos = "object-top";
  } else if (text.includes("fried rice") || text.includes("rice") || text.includes("risotto")) {
    category = "rice";
    fallbackPool = categoryFallbackPools.rice;
    fallbackPos = "object-top";
  } else if (text.includes("tea") || text.includes("bubble") || text.includes("milk tea") || text.includes("oolong")) {
    category = "beverage";
    fallbackPool = categoryFallbackPools.beverage;
    fallbackPos = "object-bottom";
  } else if (text.includes("gelato") || text.includes("ice cream") || text.includes("mochi")) {
    category = "gelato";
    fallbackPool = categoryFallbackPools.gelato;
    fallbackPos = "object-center";
  } else if (text.includes("dessert") || text.includes("pudding") || text.includes("cake") || text.includes("sweet") || text.includes("pastry")) {
    category = "dessert";
    fallbackPool = categoryFallbackPools.dessert;
    fallbackPos = "object-center";
  } else if (text.includes("soup") || text.includes("hot and sour") || text.includes("broth")) {
    category = "soup";
    fallbackPool = categoryFallbackPools.soup;
    fallbackPos = "object-top";
  } else if (text.includes("duck") || text.includes("peking")) {
    category = "protein";
    fallbackPool = categoryFallbackPools.protein;
    fallbackPos = "object-center";
  } else if (text.includes("chicken")) {
    category = "chicken";
    fallbackPool = categoryFallbackPools.chicken;
    fallbackPos = getDefaultPosition(title, "chicken");
  } else if (text.includes("beef") || text.includes("pork") || text.includes("lamb")) {
    category = "protein";
    fallbackPool = categoryFallbackPools.beef;
    fallbackPos = getDefaultPosition(title, "protein");
  } else if (text.includes("shrimp") || text.includes("prawn") || text.includes("fish") || text.includes("crab") || text.includes("seafood") || text.includes("calamari") || text.includes("lobster")) {
    category = "seafood";
    fallbackPool = categoryFallbackPools.seafood;
    fallbackPos = getDefaultPosition(title, "seafood");
  } else if (text.includes("tofu") || text.includes("vegetable") || text.includes("greens") || text.includes("salad")) {
    category = "vegetable";
    fallbackPool = categoryFallbackPools.seafood;
    fallbackPos = getDefaultPosition(title, "vegetable");
  }

  if (fallbackPool) {
    const src = pick(text, fallbackPool);
    recordAudit("fallback", title, src, category || "menu", category);
    return { src, position: fallbackPos };
  }

  // Priority 4: Generic default
  const defaultSrc = pick(text, categoryFallbackPools.default);
  recordAudit("default", title, defaultSrc, "menu");
  return { src: defaultSrc, position: getDefaultPosition(title) };
}

export function resolveProductImage(title: string, imageUrl?: string | null): ResolvedImage {
  const text = normalize(title);
  
  if (imageUrl) {
    recordAudit("explicit", title, imageUrl, "market");
    return { src: imageUrl, position: getDefaultPosition(title, "market"), explicit: true };
  }

  // Priority 1: Direct explicit mapping
  const explicit = PRODUCT_IMAGE_MAP[text];
  if (explicit) {
    recordAudit("explicit", title, explicit.src, explicit.category || "market");
    return { src: explicit.src, position: explicit.position ?? getDefaultPosition(title, explicit.category), explicit: true };
  }

  // Priority 2: Check aliases
  for (const mapping of Object.values(PRODUCT_IMAGE_MAP)) {
    if (mapping.aliases && mapping.aliases.some(alias => normalize(alias) === text)) {
      recordAudit("explicit", title, mapping.src, mapping.category || "market");
      return { src: mapping.src, position: mapping.position ?? getDefaultPosition(title, mapping.category), explicit: true };
    }
  }

  // Priority 3: Ramen variant matching
  if (text.includes("noodle") || text.includes("ramen") || text.includes("ramyun") || text.includes("udon")) {
    for (const [key, mapping] of Object.entries(RAMEN_VARIANTS)) {
      if (text.includes(key)) {
        recordAudit("fallback", title, mapping.src, "noodle", "ramen_variant");
        return { src: mapping.src, position: mapping.position ?? "object-top" };
      }
    }
    // Generic ramen fallback
    const src = pick(text, marketPools.noodle);
    recordAudit("fallback", title, src, "noodle", "noodle_pool");
    return { src, position: "object-top" };
  }

  // Priority 4: Category-aware matching
  let category: string | undefined;
  let fallbackPool: readonly string[] | undefined;
  let fallbackPos = getDefaultPosition(title);

  if (text.includes("rice cake") || text.includes("tteokbokki") || text.includes("tteok")) {
    if (text.includes("cheese")) {
      recordAudit("fallback", title, "/sup_images/bibigo-cheese-tteokbokki-rice-cakes.jpg", "rice_cake", "rice_cake_variant");
      return { src: "/sup_images/bibigo-cheese-tteokbokki-rice-cakes.jpg", position: "object-center" };
    }
    recordAudit("fallback", title, "/sup_images/bibigo-original-tteokbokki-rice-cakes.jpg", "rice_cake");
    return { src: "/sup_images/bibigo-original-tteokbokki-rice-cakes.jpg", position: "object-center" };
  }

  if (text.includes("soy sauce") || text.includes("soy") || text.includes("seasoning") || text.includes("paste") || text.includes("sauce") || text.includes("marinade") || text.includes("dressing") || text.includes("curry") || text.includes("gochujang") || text.includes("ssamjang") || text.includes("teriyaki") || text.includes("sesame") || text.includes("bulgogi")) {
    category = "sauce";
    fallbackPool = marketPools.sauce;
    
    // Specific sauce variants
    if (text.includes("bulgogi")) {
      recordAudit("fallback", title, "/sup_images/sempio-korean-bbq-bulgogi-sauce.jpg", category, "sauce_variant");
      return { src: "/sup_images/sempio-korean-bbq-bulgogi-sauce.jpg", position: "object-center" };
    }
    if (text.includes("kewpie") || text.includes("mayonnaise")) {
      recordAudit("fallback", title, "/sup_images/kewpie-mayonnaise.jpg", category, "sauce_variant");
      return { src: "/sup_images/kewpie-mayonnaise.jpg", position: "object-center" };
    }
    if (text.includes("sesame")) {
      recordAudit("fallback", title, "/sup_images/kewpie-roasted-sesame-dressing.jpg", category, "sauce_variant");
      return { src: "/sup_images/kewpie-roasted-sesame-dressing.jpg", position: "object-center" };
    }
    if (text.includes("teriyaki")) {
      recordAudit("fallback", title, "/sup_images/teriyaki-sauce.jpg", category, "sauce_variant");
      return { src: "/sup_images/teriyaki-sauce.jpg", position: "object-center" };
    }
    if (text.includes("gochujang")) {
      recordAudit("fallback", title, "/sup_images/sempio-guchujang-korean-chili-paste.jpg", category, "sauce_variant");
      return { src: "/sup_images/sempio-guchujang-korean-chili-paste.jpg", position: "object-center" };
    }
    if (text.includes("ssamjang")) {
      recordAudit("fallback", title, "/sup_images/sempio-ssamjang-korean-soybean-dipping-paste.jpg", category, "sauce_variant");
      return { src: "/sup_images/sempio-ssamjang-korean-soybean-dipping-paste.jpg", position: "object-center" };
    }
    if (text.includes("curry")) {
      recordAudit("fallback", title, "/sup_images/house-kokumaro-curry.jpg", category, "sauce_variant");
      return { src: "/sup_images/house-kokumaro-curry.jpg", position: "object-center" };
    }
    if (text.includes("soybean paste") || text.includes("doenjang") || text.includes("tojang") || text.includes("deonchang")) {
      recordAudit("fallback", title, "/sup_images/sempio-tojang-soybean-paste.jpg", category, "sauce_variant");
      return { src: "/sup_images/sempio-tojang-soybean-paste.jpg", position: "object-center" };
    }
    const src = pick(text, fallbackPool);
    recordAudit("fallback", title, src, category, "sauce_pool");
    return { src, position: "object-center" };
  }

  if (text.includes("snack") || text.includes("chips") || text.includes("cracker") || text.includes("cookie") || text.includes("pocky") || text.includes("pretz") || text.includes("popcorn") || text.includes("wafers") || text.includes("biscuit") || text.includes("waffle")) {
    category = "snack";
    fallbackPool = marketPools.snack;
    fallbackPos = "object-center";
  } else if (text.includes("drink") || text.includes("soda") || text.includes("water") || text.includes("milk") || text.includes("tea") || text.includes("juice") || text.includes("coffee") || text.includes("sparkling") || text.includes("beverage")) {
    category = "beverage";
    fallbackPool = marketPools.drink;
    fallbackPos = "object-top";
  } else if (text.includes("fruit") || text.includes("vegetable") || text.includes("veges") || text.includes("dates") || text.includes("mango") || text.includes("rambutan")) {
    category = "produce";
    fallbackPool = marketPools.default;
    fallbackPos = "object-center";
  }

  if (fallbackPool) {
    const src = pick(text, fallbackPool);
    recordAudit("fallback", title, src, category || "market", category);
    return { src, position: fallbackPos };
  }

  // Priority 5: Generic default
  const defaultSrc = pick(text, marketPools.default);
  recordAudit("default", title, defaultSrc, "market");
  return { src: defaultSrc, position: "object-center" };
}
