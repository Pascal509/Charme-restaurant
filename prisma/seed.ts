import { PrismaClient } from "@prisma/client";

type SeedItem = {
  title: string;
  description: string;
  baseAmountMinor: number;
};

type SeedCategory = {
  name: string;
  description?: string;
  items: SeedItem[];
};

type ProductSeedItem = {
  title: string;
  description: string;
  baseAmountMinor: number;
  stockOnHand: number;
};

type ProductSeedCategory = {
  name: string;
  items: ProductSeedItem[];
};

const prisma = new PrismaClient();

const menuName = "Charme Signature Menu";

const categories: SeedCategory[] = [
  {
    name: "Appetizers",
    description: "Light starters to open the table with crisp textures and bright spice.",
    items: [
      {
        title: "Spring Rolls",
        description: "Crisp vegetable rolls with a delicate wrapper and sweet chili dip.",
        baseAmountMinor: 2800
      },
      {
        title: "Scallion Pancakes",
        description: "Flaky, pan-seared pancakes layered with fragrant scallions.",
        baseAmountMinor: 3200
      },
      {
        title: "Crispy Wontons",
        description: "Golden wontons filled with seasoned pork and a tangy soy drizzle.",
        baseAmountMinor: 3000
      },
      {
        title: "Chili Cucumber Salad",
        description: "Chilled cucumbers tossed with garlic, sesame oil, and chili heat.",
        baseAmountMinor: 2600
      },
      {
        title: "Five-Spice Peanuts",
        description: "Warm, aromatic peanuts dusted with house five-spice blend.",
        baseAmountMinor: 2500
      },
      {
        title: "Salt and Pepper Tofu",
        description: "Silky tofu lightly fried with pepper, scallions, and crisp garlic.",
        baseAmountMinor: 3400
      },
      {
        title: "Lotus Root Chips",
        description: "Thin lotus root crisps with a light mala dust and sea salt.",
        baseAmountMinor: 3000
      },
      {
        title: "Tea-Smoked Tofu Skewers",
        description: "Gently smoked tofu with soy glaze and toasted sesame.",
        baseAmountMinor: 3600
      }
    ]
  },
  {
    name: "Dumplings and Dim Sum",
    description: "Handcrafted bites folded and steamed with classic fillings.",
    items: [
      {
        title: "Pork Dumplings",
        description: "Juicy pork and chive dumplings steamed to a tender finish.",
        baseAmountMinor: 3800
      },
      {
        title: "Shrimp Dumplings",
        description: "Translucent wrappers with sweet shrimp and bamboo shoots.",
        baseAmountMinor: 4200
      },
      {
        title: "Xiao Long Bao",
        description: "Soup-filled dumplings with rich broth and savory pork.",
        baseAmountMinor: 4600
      },
      {
        title: "Chicken and Chive Dumplings",
        description: "Delicate chicken filling lifted with fresh chives and ginger.",
        baseAmountMinor: 3900
      },
      {
        title: "Vegetable Dumplings",
        description: "Garden vegetables wrapped in thin dough with sesame fragrance.",
        baseAmountMinor: 3600
      },
      {
        title: "Siu Mai",
        description: "Open-faced pork and shrimp dim sum topped with roe.",
        baseAmountMinor: 4300
      },
      {
        title: "Crab and Corn Dumplings",
        description: "Sweet crab with corn in delicate wrappers and ginger notes.",
        baseAmountMinor: 4800
      },
      {
        title: "Shiitake Truffle Dumplings",
        description: "Umami-rich mushrooms with a whisper of truffle oil.",
        baseAmountMinor: 4600
      }
    ]
  },
  {
    name: "Noodles",
    description: "Slurp-worthy bowls of wheat and rice noodles with deep broth.",
    items: [
      {
        title: "Beef Noodle Soup",
        description: "Slow-braised beef with springy noodles in a rich aromatic broth.",
        baseAmountMinor: 6500
      },
      {
        title: "Dan Dan Noodles",
        description: "Spicy sesame sauce with minced pork, scallions, and chili oil.",
        baseAmountMinor: 5200
      },
      {
        title: "Stir-fried Egg Noodles",
        description: "Wok-tossed noodles with vegetables and light soy glaze.",
        baseAmountMinor: 4800
      },
      {
        title: "Garlic Sesame Noodles",
        description: "Silky noodles coated in toasted sesame, garlic, and soy.",
        baseAmountMinor: 4400
      },
      {
        title: "Taiwanese Braised Pork Noodles",
        description: "Slow-cooked pork over noodles with star anise and soy.",
        baseAmountMinor: 5900
      },
      {
        title: "Seafood Chow Mein",
        description: "Crisp noodles with shrimp, squid, and ginger soy sauce.",
        baseAmountMinor: 6200
      },
      {
        title: "Lanzhou Hand-Pulled Beef Noodles",
        description: "Chewy hand-pulled noodles in clear beef broth with herbs.",
        baseAmountMinor: 6800
      },
      {
        title: "Sesame Peanut Cold Noodles",
        description: "Chilled noodles in a nutty sesame dressing with cucumber.",
        baseAmountMinor: 5100
      }
    ]
  },
  {
    name: "Rice Dishes",
    description: "Comforting rice plates with wok aroma and balanced seasoning.",
    items: [
      {
        title: "Yangzhou Fried Rice",
        description: "Classic fried rice with shrimp, char siu, and egg.",
        baseAmountMinor: 5200
      },
      {
        title: "Chicken Fried Rice",
        description: "Fragrant rice stir-fried with chicken, scallions, and egg.",
        baseAmountMinor: 4700
      },
      {
        title: "Shrimp Fried Rice",
        description: "Golden rice with sweet shrimp, peas, and sesame oil.",
        baseAmountMinor: 5600
      },
      {
        title: "Pork Belly Rice Bowl",
        description: "Braised pork belly over steamed rice with pickled greens.",
        baseAmountMinor: 6400
      },
      {
        title: "Mushroom Egg Fried Rice",
        description: "Earthy mushrooms with fluffy egg and a light soy finish.",
        baseAmountMinor: 4900
      },
      {
        title: "Pineapple Fried Rice",
        description: "Sweet pineapple, cashews, and savory rice in golden balance.",
        baseAmountMinor: 5800
      },
      {
        title: "Claypot Chicken Rice",
        description: "Claypot rice with soy-braised chicken and crisped edges.",
        baseAmountMinor: 6600
      },
      {
        title: "XO Sauce Fried Rice",
        description: "Wok-fried rice with XO sauce, scallions, and shrimp.",
        baseAmountMinor: 7200
      }
    ]
  },
  {
    name: "Chef's Specials",
    description: "Signature plates with bold flavors and refined technique.",
    items: [
      {
        title: "Peking Duck",
        description: "Crisp-skinned duck with pancakes, scallions, and hoisin.",
        baseAmountMinor: 12000
      },
      {
        title: "Kung Pao Chicken",
        description: "Tender chicken with peanuts, dried chili, and a glossy sauce.",
        baseAmountMinor: 7200
      },
      {
        title: "Sweet and Sour Pork",
        description: "Crisp pork with pineapple and a bright, tangy glaze.",
        baseAmountMinor: 7000
      },
      {
        title: "Mapo Tofu",
        description: "Silken tofu in spicy bean sauce with minced beef and peppercorn.",
        baseAmountMinor: 6200
      },
      {
        title: "Hot Plate Beef",
        description: "Sizzling beef strips with peppers and black pepper sauce.",
        baseAmountMinor: 7800
      },
      {
        title: "Three Cup Chicken",
        description: "Basil, soy, and rice wine sauce over tender chicken pieces.",
        baseAmountMinor: 7400
      },
      {
        title: "Crispy Aromatic Duck",
        description: "Golden duck with five-spice, served with crisp lettuce cups.",
        baseAmountMinor: 9800
      },
      {
        title: "Claypot Braised Pork Belly",
        description: "Slow-braised pork belly with star anise and soy caramel.",
        baseAmountMinor: 8600
      }
    ]
  },
  {
    name: "Soups",
    description: "Warming bowls with balanced spice and gentle depth.",
    items: [
      {
        title: "Hot and Sour Soup",
        description: "Peppery broth with tofu, mushrooms, and bamboo shoots.",
        baseAmountMinor: 3600
      },
      {
        title: "Wonton Soup",
        description: "Delicate wontons in a clear, savory chicken broth.",
        baseAmountMinor: 3900
      },
      {
        title: "Egg Drop Soup",
        description: "Silky egg ribbons in a light, fragrant stock.",
        baseAmountMinor: 3200
      },
      {
        title: "Seafood Tofu Soup",
        description: "Shrimp and fish with soft tofu in gingered broth.",
        baseAmountMinor: 4800
      },
      {
        title: "Taiwanese Beef Broth",
        description: "Slow-simmered beef stock with scallions and spice.",
        baseAmountMinor: 4200
      },
      {
        title: "Winter Melon Soup",
        description: "Lightly sweet winter melon with savory pork essence.",
        baseAmountMinor: 3500
      },
      {
        title: "Sweet Corn Chicken Soup",
        description: "Velvety corn soup with shredded chicken and scallions.",
        baseAmountMinor: 3800
      },
      {
        title: "Spinach and Silken Tofu Soup",
        description: "Delicate spinach with silken tofu in a light ginger broth.",
        baseAmountMinor: 3600
      }
    ]
  },
  {
    name: "Seafood",
    description: "Ocean-forward plates with bright aromatics and wok heat.",
    items: [
      {
        title: "Salt and Pepper Shrimp",
        description: "Crisp shrimp with pepper, scallions, and garlic.",
        baseAmountMinor: 8200
      },
      {
        title: "Garlic Butter Prawns",
        description: "Juicy prawns in garlic butter sauce with fresh herbs.",
        baseAmountMinor: 9000
      },
      {
        title: "Szechuan Fish Fillet",
        description: "Tender fish with chili oil, peppercorn, and aromatics.",
        baseAmountMinor: 8600
      },
      {
        title: "Steamed Fish with Ginger",
        description: "Whole fish steamed with ginger, scallions, and soy.",
        baseAmountMinor: 9800
      },
      {
        title: "Crispy Calamari",
        description: "Lightly battered calamari with citrus and chili salt.",
        baseAmountMinor: 7600
      },
      {
        title: "Black Pepper Crab",
        description: "Crab in bold black pepper sauce with garlic and herbs.",
        baseAmountMinor: 11500
      },
      {
        title: "Steamed Scallops with Vermicelli",
        description: "Sweet scallops on vermicelli with garlic soy drizzle.",
        baseAmountMinor: 9200
      },
      {
        title: "Ginger Scallion Lobster Tails",
        description: "Lobster tails finished with ginger-scallion butter.",
        baseAmountMinor: 13500
      }
    ]
  },
  {
    name: "Vegetarian",
    description: "Plant-forward dishes with layered flavor and clean finish.",
    items: [
      {
        title: "Buddha's Delight",
        description: "Braised vegetables and tofu in a light soy glaze.",
        baseAmountMinor: 5200
      },
      {
        title: "Stir-fried Seasonal Greens",
        description: "Crisp greens with garlic, ginger, and a light soy touch.",
        baseAmountMinor: 4200
      },
      {
        title: "Braised Eggplant",
        description: "Silky eggplant with garlic, basil, and a savory sauce.",
        baseAmountMinor: 4800
      },
      {
        title: "Garlic Broccoli",
        description: "Broccoli florets tossed in garlic oil and sesame.",
        baseAmountMinor: 4300
      },
      {
        title: "Mushroom Tofu Stir-fry",
        description: "Tofu and mushrooms with scallions in a light glaze.",
        baseAmountMinor: 5000
      },
      {
        title: "Cabbage Glass Noodles",
        description: "Soft noodles with cabbage, carrot, and umami sauce.",
        baseAmountMinor: 4500
      },
      {
        title: "Lotus Root and Snow Pea Stir-fry",
        description: "Crisp lotus root with snow peas and light ginger sauce.",
        baseAmountMinor: 5000
      },
      {
        title: "Mapo Eggplant",
        description: "Silky eggplant with chili bean paste and scallion oil.",
        baseAmountMinor: 5200
      }
    ]
  },
  {
    name: "Desserts",
    description: "Gentle, nostalgic sweets to close the meal.",
    items: [
      {
        title: "Mango Pudding",
        description: "Silky mango custard with a fresh tropical finish.",
        baseAmountMinor: 3200
      },
      {
        title: "Sesame Balls",
        description: "Crisp sesame spheres with sweet red bean filling.",
        baseAmountMinor: 3000
      },
      {
        title: "Red Bean Pancakes",
        description: "Pan-fried cakes with warm red bean and subtle sweetness.",
        baseAmountMinor: 3400
      },
      {
        title: "Eight Treasure Rice",
        description: "Sticky rice with nuts and fruit, lightly sweetened.",
        baseAmountMinor: 3600
      },
      {
        title: "Almond Jelly",
        description: "Chilled almond jelly with syrup and fresh fruit.",
        baseAmountMinor: 2800
      },
      {
        title: "Coconut Mochi",
        description: "Soft mochi with coconut cream and toasted flakes.",
        baseAmountMinor: 3000
      },
      {
        title: "Taro Sago",
        description: "Chilled taro with sago pearls and light coconut milk.",
        baseAmountMinor: 3400
      },
      {
        title: "Matcha Coconut Ice Cream",
        description: "Creamy matcha ice cream with a soft coconut finish.",
        baseAmountMinor: 3200
      }
    ]
  },
  {
    name: "Beverages",
    description: "Tea-forward refreshments brewed with care and balance.",
    items: [
      {
        title: "Jasmine Tea",
        description: "Fragrant jasmine blossoms steeped for a clean floral cup.",
        baseAmountMinor: 2500
      },
      {
        title: "Oolong Tea",
        description: "Smooth oolong with roasted notes and a crisp finish.",
        baseAmountMinor: 2800
      },
      {
        title: "Pu-erh Tea",
        description: "Earthy, aged tea with a deep, mellow aroma.",
        baseAmountMinor: 3200
      },
      {
        title: "Chrysanthemum Tea",
        description: "Light floral tea with a soothing, honeyed aroma.",
        baseAmountMinor: 2600
      },
      {
        title: "Bubble Milk Tea",
        description: "Creamy milk tea with chewy tapioca pearls.",
        baseAmountMinor: 3800
      },
      {
        title: "Honey Lemon Tea",
        description: "Warm citrus tea with gentle sweetness and fresh zest.",
        baseAmountMinor: 2700
      },
      {
        title: "Osmanthus Oolong",
        description: "Floral oolong steeped with fragrant osmanthus blossoms.",
        baseAmountMinor: 3000
      },
      {
        title: "Plum Blossom Iced Tea",
        description: "Iced black tea with a subtle plum and floral finish.",
        baseAmountMinor: 2900
      }
    ]
  }
];

const productCategories: ProductSeedCategory[] = [
  {
    name: "Instant Noodles",
    items: [
      {
        title: "Indomie Oriental Noodles",
        description: "Fragrant, quick-cook noodles with a savory spice sachet.",
        baseAmountMinor: 1400,
        stockOnHand: 180
      },
      {
        title: "Nissin Ramen Classic",
        description: "Springy ramen noodles with a rich soy broth seasoning.",
        baseAmountMinor: 1900,
        stockOnHand: 150
      },
      {
        title: "Samyang Hot Chicken Ramen",
        description: "Bold, spicy noodles with a sweet-heat finish.",
        baseAmountMinor: 2600,
        stockOnHand: 120
      },
      {
        title: "Mama Tom Yum Noodles",
        description: "Tangy tom yum broth with lemongrass and chili notes.",
        baseAmountMinor: 1700,
        stockOnHand: 160
      },
      {
        title: "Paldo Jjajang Noodles",
        description: "Chewy noodles with black bean sauce seasoning.",
        baseAmountMinor: 2400,
        stockOnHand: 140
      },
      {
        title: "Nongshim Shin Ramyun",
        description: "Classic spicy broth with garlic, chili, and mushroom.",
        baseAmountMinor: 2300,
        stockOnHand: 170
      },
      {
        title: "Instant Rice Vermicelli",
        description: "Light rice vermicelli with clear soup seasoning.",
        baseAmountMinor: 1600,
        stockOnHand: 130
      },
      {
        title: "Sapporo Ichiban Miso Ramen",
        description: "Miso broth ramen with roasted garlic and sesame notes.",
        baseAmountMinor: 2200,
        stockOnHand: 140
      },
      {
        title: "Ottogi Cheese Ramen",
        description: "Creamy ramen with a mellow cheese seasoning blend.",
        baseAmountMinor: 2500,
        stockOnHand: 125
      }
    ]
  },
  {
    name: "Sauces and Condiments",
    items: [
      {
        title: "Lee Kum Kee Premium Soy Sauce",
        description: "Aged soy sauce with balanced salinity and depth.",
        baseAmountMinor: 3500,
        stockOnHand: 90
      },
      {
        title: "Lee Kum Kee Oyster Sauce",
        description: "Rich oyster sauce for stir-fries and marinades.",
        baseAmountMinor: 3800,
        stockOnHand: 85
      },
      {
        title: "Chili Oil with Garlic",
        description: "Aromatic chili oil with crispy garlic bits.",
        baseAmountMinor: 3200,
        stockOnHand: 110
      },
      {
        title: "Black Vinegar",
        description: "Smoky, slightly sweet vinegar for dumpling dips.",
        baseAmountMinor: 3100,
        stockOnHand: 75
      },
      {
        title: "Hoisin Sauce",
        description: "Sweet-savory sauce for wraps and roasting.",
        baseAmountMinor: 2800,
        stockOnHand: 95
      },
      {
        title: "Sesame Oil",
        description: "Toasted sesame oil with a warm, nutty aroma.",
        baseAmountMinor: 3600,
        stockOnHand: 80
      },
      {
        title: "Doubanjiang Chili Bean Paste",
        description: "Fermented broad bean paste with robust spice.",
        baseAmountMinor: 3400,
        stockOnHand: 70
      },
      {
        title: "Dark Soy Sauce",
        description: "Thick, caramelized soy for color and depth.",
        baseAmountMinor: 3600,
        stockOnHand: 85
      },
      {
        title: "Sweet Chili Sauce",
        description: "Glossy chili sauce with a gentle sweet heat.",
        baseAmountMinor: 2900,
        stockOnHand: 95
      }
    ]
  },
  {
    name: "Rice and Grains",
    items: [
      {
        title: "Jasmine Rice 5kg",
        description: "Premium long-grain jasmine rice with floral aroma.",
        baseAmountMinor: 9800,
        stockOnHand: 60
      },
      {
        title: "Sticky Rice",
        description: "Glutinous rice ideal for dumplings and desserts.",
        baseAmountMinor: 6200,
        stockOnHand: 75
      },
      {
        title: "Short Grain Sushi Rice",
        description: "Tender, glossy grains for sushi or rice bowls.",
        baseAmountMinor: 7200,
        stockOnHand: 70
      },
      {
        title: "Brown Rice",
        description: "Nutty whole-grain rice with a hearty bite.",
        baseAmountMinor: 6400,
        stockOnHand: 65
      },
      {
        title: "Rice Vermicelli",
        description: "Thin rice noodles for soups and stir-fries.",
        baseAmountMinor: 2600,
        stockOnHand: 120
      },
      {
        title: "Rice Flour",
        description: "Fine rice flour for dumplings and pastries.",
        baseAmountMinor: 2800,
        stockOnHand: 90
      },
      {
        title: "Mochi Rice Cake Pack",
        description: "Soft rice cakes ready for soup or stir-fry.",
        baseAmountMinor: 3400,
        stockOnHand: 85
      },
      {
        title: "Black Rice",
        description: "Nutty black rice with a deep color and aroma.",
        baseAmountMinor: 7600,
        stockOnHand: 55
      },
      {
        title: "Job's Tears (Coix Seeds)",
        description: "Traditional grains for tea and nourishing soups.",
        baseAmountMinor: 5400,
        stockOnHand: 70
      }
    ]
  },
  {
    name: "Snacks",
    items: [
      {
        title: "Pocky Sticks",
        description: "Crisp biscuit sticks coated with chocolate cream.",
        baseAmountMinor: 2200,
        stockOnHand: 200
      },
      {
        title: "Rice Crackers",
        description: "Crunchy rice crackers with a savory soy glaze.",
        baseAmountMinor: 1800,
        stockOnHand: 160
      },
      {
        title: "Shrimp Chips",
        description: "Light, airy chips with a gentle shrimp flavor.",
        baseAmountMinor: 2100,
        stockOnHand: 150
      },
      {
        title: "Sesame Peanut Candy",
        description: "Nutty sesame brittle with roasted peanuts.",
        baseAmountMinor: 1900,
        stockOnHand: 130
      },
      {
        title: "Dried Mango Slices",
        description: "Chewy mango slices with natural sweetness.",
        baseAmountMinor: 2500,
        stockOnHand: 110
      },
      {
        title: "Honey Butter Chips",
        description: "Sweet-salty potato chips with a butter finish.",
        baseAmountMinor: 2300,
        stockOnHand: 140
      },
      {
        title: "Seaweed Snacks",
        description: "Crisp roasted seaweed sheets with light seasoning.",
        baseAmountMinor: 1700,
        stockOnHand: 170
      },
      {
        title: "Wasabi Peas",
        description: "Crunchy peas with a bright wasabi kick.",
        baseAmountMinor: 2000,
        stockOnHand: 150
      },
      {
        title: "Red Bean Dorayaki",
        description: "Soft pancakes filled with sweet red bean paste.",
        baseAmountMinor: 2400,
        stockOnHand: 120
      }
    ]
  },
  {
    name: "Frozen Dumplings",
    items: [
      {
        title: "Pork and Chive Dumplings",
        description: "Frozen dumplings with juicy pork and fresh chives.",
        baseAmountMinor: 5200,
        stockOnHand: 80
      },
      {
        title: "Shrimp Har Gow",
        description: "Classic shrimp dumplings ready to steam.",
        baseAmountMinor: 5600,
        stockOnHand: 70
      },
      {
        title: "Vegetable Gyoza",
        description: "Veggie dumplings with cabbage, carrot, and garlic.",
        baseAmountMinor: 4800,
        stockOnHand: 90
      },
      {
        title: "Chicken Potstickers",
        description: "Pan-fry ready potstickers with seasoned chicken.",
        baseAmountMinor: 5000,
        stockOnHand: 85
      },
      {
        title: "Mushroom Dumplings",
        description: "Savory mushroom dumplings with a clean finish.",
        baseAmountMinor: 4700,
        stockOnHand: 75
      },
      {
        title: "Soup Dumplings",
        description: "Frozen xiao long bao with rich, savory broth.",
        baseAmountMinor: 5800,
        stockOnHand: 65
      },
      {
        title: "Spicy Pork Dumplings",
        description: "Pork dumplings with chili, ginger, and garlic.",
        baseAmountMinor: 5300,
        stockOnHand: 70
      },
      {
        title: "Beef and Onion Dumplings",
        description: "Hearty dumplings with beef, onion, and scallion oil.",
        baseAmountMinor: 5600,
        stockOnHand: 65
      },
      {
        title: "Shrimp and Chive Dumplings",
        description: "Savory shrimp dumplings brightened with fresh chives.",
        baseAmountMinor: 5700,
        stockOnHand: 60
      }
    ]
  },
  {
    name: "Tea and Drinks",
    items: [
      {
        title: "Jasmine Tea Leaves",
        description: "Loose-leaf jasmine green tea with floral aroma.",
        baseAmountMinor: 3200,
        stockOnHand: 120
      },
      {
        title: "Oolong Tea Pack",
        description: "Roasted oolong sachets with smooth, nutty notes.",
        baseAmountMinor: 3500,
        stockOnHand: 110
      },
      {
        title: "Pu-erh Tea Bricks",
        description: "Aged pu-erh for a deep, earthy brew.",
        baseAmountMinor: 4200,
        stockOnHand: 80
      },
      {
        title: "Brown Sugar Boba Kit",
        description: "DIY boba kit with brown sugar syrup and pearls.",
        baseAmountMinor: 5200,
        stockOnHand: 90
      },
      {
        title: "Lychee Juice",
        description: "Sweet lychee nectar with a clean, fruity finish.",
        baseAmountMinor: 2600,
        stockOnHand: 140
      },
      {
        title: "Winter Melon Tea",
        description: "Refreshing tea with honeyed winter melon notes.",
        baseAmountMinor: 2800,
        stockOnHand: 130
      },
      {
        title: "Green Tea Latte Mix",
        description: "Creamy matcha mix for smooth, café-style drinks.",
        baseAmountMinor: 3900,
        stockOnHand: 100
      },
      {
        title: "Roasted Barley Tea",
        description: "Toasted barley tea with a mellow, nutty finish.",
        baseAmountMinor: 3000,
        stockOnHand: 120
      },
      {
        title: "Sparkling Lychee Soda",
        description: "Lightly sparkling lychee drink with a crisp finish.",
        baseAmountMinor: 2100,
        stockOnHand: 150
      }
    ]
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const existingMenu = await prisma.menu.findFirst({
    where: { name: menuName }
  });

  const menu =
    existingMenu ??
    (await prisma.menu.create({
      data: {
        name: menuName,
        description: "A curated Chinese and Taiwanese menu with modern classics."
      }
    }));

  for (let index = 0; index < categories.length; index += 1) {
    const category = categories[index];
    const slug = slugify(category.name);

    const menuCategory = await prisma.menuCategory.upsert({
      where: {
        menuId_slug: {
          menuId: menu.id,
          slug
        }
      },
      update: {
        name: category.name,
        description: category.description,
        displayOrder: index + 1,
        isActive: true
      },
      create: {
        menuId: menu.id,
        slug,
        name: category.name,
        description: category.description,
        displayOrder: index + 1,
        isActive: true
      }
    });

    for (const item of category.items) {
      const itemSlug = slugify(item.title);
      const menuItem = await prisma.menuItem.upsert({
        where: { slug: itemSlug },
        update: {
          menuId: menu.id,
          title: item.title,
          description: item.description,
          baseAmountMinor: item.baseAmountMinor,
          baseCurrency: "NGN",
          isAvailable: true
        },
        create: {
          menuId: menu.id,
          slug: itemSlug,
          title: item.title,
          description: item.description,
          baseAmountMinor: item.baseAmountMinor,
          baseCurrency: "NGN",
          isAvailable: true
        }
      });

      await prisma.menuItemCategory.upsert({
        where: {
          menuItemId_menuCategoryId: {
            menuItemId: menuItem.id,
            menuCategoryId: menuCategory.id
          }
        },
        update: {},
        create: {
          menuItemId: menuItem.id,
          menuCategoryId: menuCategory.id
        }
      });
    }
  }

  for (const category of productCategories) {
    const categorySlug = slugify(category.name);
    const productCategory = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: category.name },
      create: { slug: categorySlug, name: category.name }
    });

    for (const item of category.items) {
      const productSlug = slugify(item.title);
      const product = await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          title: item.title,
          description: item.description,
          isActive: true
        },
        create: {
          slug: productSlug,
          title: item.title,
          description: item.description,
          isActive: true
        }
      });

      const sku = `${productSlug}-default`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          productId: product.id,
          title: "Standard",
          baseAmountMinor: item.baseAmountMinor,
          baseCurrency: "NGN",
          stockOnHand: item.stockOnHand,
          stockReserved: 0,
          isActive: true
        },
        create: {
          productId: product.id,
          sku,
          title: "Standard",
          baseAmountMinor: item.baseAmountMinor,
          baseCurrency: "NGN",
          stockOnHand: item.stockOnHand,
          stockReserved: 0,
          isActive: true
        }
      });

      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: productCategory.id
          }
        },
        update: {},
        create: {
          productId: product.id,
          categoryId: productCategory.id
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
