/**
 * English (en) Translation Dictionary
 * Structured with nested keys for organization
 */

export const en = {
  common: {
    back: "Back",
    close: "Close",
    cancel: "Cancel",
    or: "or",
    guest: "Guest",
    prev: "Prev",
    next: "Next",
    explore: "Explore",
    learnMore: "Learn More",
    viewMore: "View More",
    getInTouch: "Get in Touch",
    email: "Email",
    phone: "Phone",
    address: "Address",
    hours: "Hours",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    closed: "Closed"
  },

  errors: {
    oops: "Oops",
    unexpectedTitle: "Something went wrong",
    unexpectedBody: "We hit a snag while loading this page. Please try again.",
    unexpectedHelp: "If the problem keeps happening, return home or try again in a moment.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you were looking for may have moved or no longer exists.",
    notFoundHelp: "You can return home or head back to the menu.",
    digestLabel: "Digest",
    retry: "Try again",
    goHome: "Go home"
  },

  offline: {
    title: "Offline",
    body: "You are offline. We saved a lightweight page for you. Please reconnect to load live menus and orders."
  },

  auth: {
    login: {
      eyebrow: "Welcome back",
      title: "Sign in",
      subtitle: "Sign in to track orders, manage your account, and save delivery details.",
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      signingIn: "Signing in...",
      google: "Continue with Google",
      noAccount: "No account yet?",
      createOne: "Create one",
      invalidCredentials: "Invalid email or password"
    },
    register: {
      eyebrow: "Join Charme",
      title: "Create account",
      subtitle: "Save delivery details, track orders, and manage your profile.",
      name: "Name",
      email: "Email",
      password: "Password",
      createAccount: "Create account",
      creatingAccount: "Creating account...",
      google: "Continue with Google",
      alreadyHaveAccount: "Already have an account?",
      signIn: "Sign in",
      unableToCreate: "Unable to create account",
      signInFailed: "Account created, but sign in failed",
      minimumPassword: "Minimum 8 characters"
    }
  },

  account: {
    eyebrow: "Account",
    title: "Welcome back",
    subtitle: "Manage your details, review past orders, and keep delivery information close.",
    profile: "Profile",
    logOut: "Log out",
    guestCustomer: "Guest customer",
    noEmail: "No email on file",
    latestOrder: "Latest order",
    track: "Track",
    savedAddresses: "Saved addresses",
    orderHistory: "Order history",
    ordersCount: "{count} orders",
    ordersError: "Unable to load orders. Please try again.",
    noOrders: "No orders yet. Start your first order from the menu.",
    mergeError: "Failed to merge cart",
    guestCartUnavailable: "Unable to resolve guest cart.",
    reorderError: "Failed to reorder",
    reorder: "Reorder",
    reordering: "Reordering..."
  },

  addressManager: {
    identityError: "Unable to load session identity",
    identityNotReady: "User identity not ready",
    loadError: "Failed to load addresses",
    updateError: "Failed to update address",
    saveError: "Failed to save address",
    deleteError: "Failed to delete address",
    defaultError: "Failed to set default",
    empty: "No saved addresses yet.",
    defaultLabel: "Default",
    setDefault: "Set default",
    edit: "Edit",
    delete: "Delete"
  },

  addressForm: {
    label: "Label",
    fullName: "Full name",
    phone: "Phone",
    country: "Country",
    addressLine1: "Address line 1",
    addressLine2: "Address line 2",
    city: "City",
    state: "State",
    postalCode: "Postal code",
    latitude: "Latitude",
    longitude: "Longitude",
    optional: "(optional)",
    labelRequired: "Label is required",
    fullNameRequired: "Full name is required",
    phoneRequired: "Phone is required",
    addressRequired: "Address line is required",
    cityRequired: "City is required",
    stateRequired: "State is required",
    countryRequired: "Country is required",
    latitudeRequired: "Latitude required",
    longitudeRequired: "Longitude required",
    mapPreview: "Map preview",
    defaultAddress: "Set as default address",
    saving: "Saving...",
    saveAddress: "Save address",
    labelPlaceholder: "Home, Office",
    fullNamePlaceholder: "Recipient name",
    phonePlaceholder: "Phone number",
    countryPlaceholder: "Country",
    addressLine1Placeholder: "Street address",
    addressLine2Placeholder: "Apartment, suite",
    cityPlaceholder: "City",
    statePlaceholder: "State",
    postalCodePlaceholder: "Postal code",
    latitudePlaceholder: "Latitude",
    longitudePlaceholder: "Longitude"
  },

  nav: {
    home: "Home",
    menu: "Menu",
    market: "Market",
    offers: "Offers",
    locations: "Locations",
    about: "About",
    cart: "Cart",
    account: "Account"
  },

  home: {
    hero: {
      eyebrow: "Charme Restaurant",
      title: "Modern Chinese and Taiwanese dining, thoughtfully presented.",
      subtitle: "An elegant dining room, a curated Asian market, and a service style shaped for everyday rituals and special occasions.",
      primaryCta: "View Menu",
      secondaryCta: "Order Now"
    },
    signature: {
      eyebrow: "Chef's Specialities",
      title: "Signature dishes with balance, depth, and clarity.",
      subtitle: "A concise selection that reflects the kitchen's technique, restraint, and attention to detail.",
      cards: {
        dumplings: {
          title: "Hand-Folded Dumplings",
          description: "Delicate folds, tender fillings, and a clean steamed finish."
        },
        noodles: {
          title: "Silken Noodle Bowls",
          description: "Fresh noodles dressed in a rich sauce with bright aromatics."
        },
        rice: {
          title: "Wok-Fried Rice",
          description: "Fragrant rice with a polished, balanced savory profile."
        },
        duck: {
          title: "Crisp Peking Duck",
          description: "A refined signature with crisp skin and deep, lacquered flavor."
        }
      }
    },
    dining: {
      eyebrow: "Gelato & Desserts",
      title: "Premium Italian gelato and Asian-inspired desserts in a refined lounge.",
      subtitle: "Handcrafted gelato made fresh daily, paired with artisanal pastries and specialty desserts that bring Asian and Italian traditions together.",
      story: "Our gelato is churned in small batches each morning using fine dairy, seasonal fruit, and delicate infusions—served alongside tea-forward desserts and polished plated sweets.",
      primaryCta: "Explore Gelato Menu",
      secondaryCta: "Reserve Dessert Lounge",
      note: "Designed for moments of indulgence"
    },
    market: {
      eyebrow: "Restaurant & Market",
      title: "Dine well. Shop well.",
      subtitle: "Two complementary experiences under one roof: a polished restaurant upstairs and a carefully selected market below.",
      primaryCta: "Explore Menu",
      secondaryCta: "Visit Market"
    },
    tea: {
      title: "Tea, ritual, and a quieter pace.",
      subtitle: "A final moment of calm, served with balance and intention."
    }
  },

  offers: {
    title: "Seasonal Dining Offers",
    subtitle: "Thoughtfully composed dining sets and limited-time menus designed for lunch, dinner, and private gatherings.",
    description: "A small selection of polished offers with clear value, balanced portions, and an elegant finish.",
    noOffers: "No seasonal offers are available right now.",
    highlightText: "Curated for relaxed lunches, dinner reservations, and special occasions.",
    badges: {
      limitedTime: "Limited Time",
      popular: "Popular",
      chefsSpecial: "Chef's Special"
    },

    cards: {
      brunch: {
        title: "Sunday Brunch Table",
        description:
          "A composed sharing menu with dumplings, wok-finished noodles, seasonal fruit, and tea for two to four guests.",
        details: "Ideal for late mornings, family visits, and unhurried celebrations."
      },
      family: {
        title: "Family Celebration Bundle",
        description:
          "A generous set with rice, chicken, vegetables, and dessert designed for family dining and group hosting.",
        details: "Includes generous portions and a soft drink for each guest."
      },
      tasting: {
        title: "Chef's Tasting Experience",
        description:
          "A guided progression of Charme signatures featuring small plates, seasonal sauces, and a refined finish.",
        details: "Recommended for date nights, private hosting, and special occasions."
      },
      lunch: {
        title: "Weekday Lunch Pairing",
        description:
          "A lighter midday menu with a main course, soup, and tea designed for a polished lunch break.",
        details: "Available Monday to Friday during lunch service."
      }
    },
    validUntil: "Valid until",
    minOrder: "Minimum order",
    appliedAutomatically: "Applied automatically at checkout",
    discoverOffersTitle: "Plan your next dining experience",
    discoverOffersSubtitle: "Reserve a table or start with a menu favorite shaped for your occasion.",
    browseMenu: "View Menu",
    contactTeam: "Talk to Us"
  },

  locations: {
    title: "Our Location",
    subtitle: "Visit Charme in Maitama, Abuja for refined dining, attentive service, and a comfortable pace.",
    description: "Find our Maitama location in Abuja and plan your next visit with ease.",
    noLocations: "No locations found",
    cities: {
      abuja: "Abuja"
    },

    branches: {
      abujaMaitama: {
        name: "Maitama Dining House",
        address: "No. 41 Gana Street, Maitama, Abuja, Nigeria",
        addressShort: "No. 41 Gana Street, Maitama, Abuja",
        googleMapsLabel: "Open in Google Maps",
        hoursWeekday: "Daily: 9:00 AM - 9:00 PM",
        hoursWeekend: "Daily: 9:00 AM - 9:00 PM",
        phone: "+234 811 120 2666",
        email: "charme.aid@gmail.com",
        label: "Maitama, Abuja"
      }
    },

    info: {
      openingHours: "Opening Hours",
      reservations: "Reservations",
      deliveryAvailable: "Delivery Available",
      parking: "Parking",
      wheelchair: "Wheelchair Accessible",
      diningType: "Dining Type",
      dineIn: "Dine In",
      takeaway: "Takeaway",
      delivery: "Delivery",
      openDaily: "Open Daily"
    },

    callUs: "Call us",
    visitUs: "Visit us",
    reserveTable: "Make a Reservation",
    branchFallback: "Location"
  },

  about: {
    title: "About Charme",
    subtitle: "Modern Chinese and Taiwanese dining rooted in Nigerian hospitality and a calm, contemporary rhythm.",
    brandStoryTitle: "Brand Story",
    brandStory:
      "Charme brings together polished restaurant craft and a carefully selected market under one refined brand. Every experience is built around freshness, consistency, and a confident sense of place.",
    missionTitle: "Mission",
    missionStatement:
      "To create welcoming dining and shopping experiences that feel polished, dependable, and easy to return to, whether you are joining us for lunch, dinner, or a family gathering.",
    valuesTitle: "Values",
    positioningTitle: "Cultural Positioning",
    positioning:
      "Charme blends modern design, regional culinary influences, and warm local service. The result is a premium experience that feels contemporary without losing cultural warmth.",
    experienceTitle: "Experience the Charme standard",
    experienceSubtitle: "A modern restaurant and market created for everyday dining, special occasions, and everything in between.",

    ourStory: {
      title: "Our Story",
      content:
        "Charme began with a simple idea: pair the elegance of modern dining with the practicality of a well-curated neighborhood market. What started as a family-led hospitality concept has grown into a polished destination for guests who value consistency and quiet confidence."
    },

    mission: {
      title: "Our Mission",
      content:
        "To deliver consistent food, thoughtful hospitality, and clear value through carefully sourced ingredients, modern technique, and service that feels personal without being complicated."
    },
    labels: {
      mission: "Mission",
      values: "Values"
    },
    storyHighlights: {
      ingredient: "Premium ingredients sourced from trusted suppliers",
      craft: "Culinary precision balanced with tradition",
      service: "Personal service grounded in genuine hospitality"
    },

    values: {
      title: "Our Values",
      quality: "Quality - Fresh ingredients, careful preparation, and a consistent finish in every order",
      sustainability: "Sustainability - Responsible sourcing and practical choices that respect the environment",
      community: "Community - Local suppliers, neighborhood jobs, and service that gives back",
      excellence: "Excellence - Attention to detail in the kitchen, the dining room, and the guest journey"
    },

    team: {
      title: "Our Team",
      subtitle: "Experienced professionals dedicated to a calm, polished guest experience",
      chefTitle: "Executive Chef",
      pastryTitle: "Pastry Chef",
      managerTitle: "General Manager",
      dedication: "Our team brings years of culinary and hospitality experience to every service",
      members: {
        chefMarcusName: "Chef Marcus",
        chefMarcusSpecialization: "Modern European Cuisine",
        chefAmaraName: "Chef Amara",
        chefAmaraSpecialization: "Artisanal Desserts & Pastries",
        samuelName: "Samuel Okafor",
        samuelSpecialization: "Restaurant Operations & Hospitality"
      }
    },

    recognition: {
      title: "Recognition",
      awards: "We are honored to be recognized by guests and hospitality peers who value consistency and care"
    },
    cta: {
      title: "Join Us at Charme",
      subtitle: "Experience considered dining, attentive service, and a distinctly Charme atmosphere"
    }
  },
  admin: {
    dashboard: {
      eyebrow: "Admin",
      title: "Restaurant operations",
      subtitle: "Monitor live orders, update statuses, and maintain the menu.",
      liveUpdates: "Live updates",
      liveOrders: "Live orders",
      active: "active",
      loadingOrders: "Loading orders...",
      ordersError: "Failed to load orders.",
      noActiveOrders: "No active orders.",
      today: "Today",
      loadingMetrics: "Loading metrics...",
      metricsError: "Failed to load metrics.",
      connecting: "connecting",
      connected: "connected",
      disconnected: "disconnected",
      error: "error",
      orders: "Orders",
      revenue: "Revenue",
      menuManagement: "Menu management",
      createItem: "Create item",
      itemNamePlaceholder: "Item name",
      descriptionPlaceholder: "Description",
      pricePlaceholder: "Price",
      currencyPlaceholder: "Currency",
      prepTimePlaceholder: "Prep time (mins)",
      categoryPlaceholder: "Select category",
      imageUrlPlaceholder: "Image URL",
      available: "Available",
      creating: "Creating...",
      create: "Create item",
      loadingMenu: "Loading menu...",
      menuError: "Failed to load menu.",
      disable: "Disable",
      enable: "Enable",
      edit: "Edit",
      saving: "Saving...",
      save: "Save",
      cancel: "Cancel",
      itemFallback: "Item",
      guestFallback: "Guest",
      orderPrefix: "Order",
      itemsSuffix: "items",
      soldSuffix: "sold",
      statusLabel: "status",
      menuCreated: "Item created.",
      menuUpdated: "Item updated.",
      createError: "Failed to create item",
      updateError: "Failed to update item"
    },
    action: {
      accept: "Accept",
      startPrep: "Start prep",
      ready: "Ready",
      outForDelivery: "Out for delivery",
      delivered: "Delivered",
      cancel: "Cancel"
    },
    updating: "Updating...",
    analytics: {
      eyebrow: "Admin",
      title: "Analytics",
      subtitle: "Daily revenue, order velocity, and top selling items.",
      period: "Last 30 days",
      loading: "Loading analytics...",
      error: "Failed to load analytics.",
      dailyRevenue: "Daily revenue",
      noRevenueData: "No revenue data yet.",
      orderCount: "Order count",
      averageOrder: "Average order",
      topSellingItems: "Top selling items",
      noSalesYet: "No sales yet.",
      soldSuffix: "sold",
      orderVolume: "Order volume",
      noOrderData: "No order data yet."
    }
  },
  mobileNav: {
    chooseExperience: "Choose Experience"
  },
  brand: {
    tagline: "Restaurant & Market",
    description: "Modern Chinese and Taiwanese dining with a refined neighborhood market."
  },
  footer: {
    navigation: "Navigation",
    contact: "Contact",
    hours: "Hours",
    social: "Social",
    restaurant: "Restaurant",
    market: "Market",
    copyright: "© 2026 Charme Restaurant & Supermarket",
    cuisineTag: "Modern Chinese and Taiwanese Cuisine",
    address: "No. 41 Gana Street, Maitama, Abuja, Nigeria",
    addressShort: "Maitama, Abuja",
    mapLinkLabel: "View on Google Maps",
    phone: "+234 811 120 2666",
    email: "charme.aid@gmail.com",
    restaurantHours: "Daily: 9:00 AM - 9:00 PM",
    restaurantHoursWeekend: "Daily: 9:00 AM - 9:00 PM",
    marketHours: "Daily: 9:00 AM - 9:00 PM"
  },

  cart: {
    header: "Your cart",
    title: "Finalize your order",
    subtitle: "Review items, adjust quantities, and proceed when you are ready.",
    empty: "Your cart is empty",
    emptyMessage: "Start by adding items from our menu or market.",
    loading: "Loading cart...",
    error: "Unable to load cart. Please try again.",
    item: "Item",
    unavailable: "Unavailable",
    remove: "Remove",
    quantity: "Quantity",
    price: "Price",
    total: "Total",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    discount: "Discount",
    tbd: "TBD",
    proceedCheckout: "Proceed to Checkout",
    activePromotions: "Active promotions",
    coupon: "Coupon",
    couponPlaceholder: "Enter code",
    apply: "Apply",
    applying: "Applying",
    clear: "Clear",
    couponApplied: "Coupon applied.",
    invalidCoupon: "Invalid coupon code"
  },

  checkout: {
    title: "Checkout",
    review: "Review Order",
    address: "Delivery Address",
    delivery: "Delivery",
    pickup: "Pickup",
    payment: "Payment Method",
    deliveryAddress: "Delivery Address",
    addNew: "Add new",
    signInAddresses: "Sign in to use saved addresses.",
    addAddressToContinue: "Add an address to continue.",
    completeOrder: "Complete your order",
    confirmDetails: "Confirm delivery, payment, and review before placing the order.",
    stepDelivery: "Delivery",
    stepPayment: "Payment",
    stepReview: "Review",
    unableToLoad: "Unable to load checkout. Please try again.",
    step01Heading: "Fulfillment",
    fulfillment: "Fulfillment",
    collectFromRestaurant: "Collect your order from the restaurant.",
    bringToYou: "We will bring it to you.",
    pickupSlot: "Pickup slot",
    pickupSlotPlaceholder: "Enter your preferred pickup window",
    step02Heading: "Payment",
    provider: "Provider",
    comingSoon: "Coming soon",
    step03Heading: "Review",
    itemsCount: "{count} items",
    updatingTotals: "Updating totals...",
    attentionTitle: "Please review the following",
    special: "Special",
    tax: "Tax",
    totalsAfterValidation: "Totals will appear after validation.",
    deliveryRequiresLogin: "Sign in to use delivery and saved addresses.",
    signInDelivery: "Please sign in to use delivery.",
    selectDeliveryAddress: "Please select a delivery address.",
    resolveValidation: "Please resolve the validation issues before continuing.",
    failedToStart: "Failed to start checkout.",
    paymentSessionUnavailable: "Payment session unavailable.",
    couponApplied: "Coupon applied.",
    couponFailed: "Failed to apply coupon.",
    startingPayment: "Starting payment...",
    placeOrder: "Place order",
    redirectNotice: "You will be redirected to complete payment.",
    validating: "Validating totals...",
    validatingTotals: "Validating totals...",
    loading: "Loading...",
    failed: "Failed to load",
    error: "Something went wrong. Please try again.",
    success: "Order placed successfully",
    networkError: "Network error. Please check your connection and try again.",
    requestTimedOut: "The request timed out. Please try again.",
    requestAborted: "The request was canceled.",
    validationFailed: "Validation failed. Please review your order.",
    noImage: "No image"
  },

  menu: {
    title: "Menu",
    categories: "Categories",
    searchPlaceholder: "Search menu items",
    allOption: "All",
    filter: "Filter",
    price: "Price",
    priceAll: "All prices",
    priceLow: "Under $50",
    priceMid: "$50–$150",
    priceHigh: "$150+",
    noResults: "No items found",
    loading: "Loading menu...",
    details: "Details",
    addToCart: "Add to Cart",
    selected: "Selected",
    recommended: "Recommended",
    featuredSubtitle: "A curated selection of signature dishes and guest favorites.",
    heroTitle: "Curated dishes with modern indulgence",
    heroSubtitle: "Select from our seasonal categories and build the perfect order. Fresh ingredients, precise prep, and thoughtful pairings.",
    emptyState: "No menu items available right now."
  },

  market: {
    title: "Market",
    all: "All",
    searchTitle: "Find pantry essentials",
    filtersUpdateInstantly: "Filters update instantly",
    categories: "Categories",
    searchPlaceholder: "Search products",
    filter: "Filter",
    price: "Price",
    minPrice: "Min price",
    maxPrice: "Max price",
    inStockOnly: "In stock only",
    noResults: "No products found",
    loading: "Loading market...",
    adjustFilters: "Try adjusting your filters.",
    addToCart: "Add to Cart",
    outOfStock: "Out of Stock",
    lowStock: "Low Stock",
    inStock: "In Stock",
    decreaseQuantity: "Decrease quantity",
    increaseQuantity: "Increase quantity",
    showingPage: "Showing page {current} of {total}"
  },

  notifications: {
    title: "Notifications",
    markAllRead: "Mark all read",
    preferences: "Preferences",
    loading: "Loading notifications...",
    loadError: "Unable to load notifications.",
    empty: "No notifications yet.",
    update: "Update",
    newActivity: "New activity",
    email: "Email",
    sms: "SMS",
    push: "Push",
    orderConfirmed: "Order confirmed",
    orderPreparing: "Order preparing",
    orderReady: "Order ready",
    orderOutForDelivery: "Order out for delivery",
    orderDelivered: "Order delivered",
    paymentFailed: "Payment failed"
  },

  orders: {
    tracking: "Order tracking",
    orderPrefix: "Order",
    deliveryLabel: "Delivery",
    pickupLabel: "Pickup",
    timeline: "Timeline",
    items: "Items",
    deliveryStatus: "Delivery status",
    totals: "Totals",
    subtotal: "Subtotal",
    tax: "Tax",
    deliveryFee: "Delivery fee",
    total: "Total",
    live: "Live",
    reconnecting: "Reconnecting",
    offline: "Offline",
    disconnected: "Disconnected",
    connecting: "Connecting",
    placed: "Placed",
    placedHelper: "Order received",
    preparing: "Preparing",
    preparingHelper: "Kitchen is working",
    ready: "Ready",
    readyHelper: "Packed and ready",
    onTheWay: "On the way",
    onTheWayHelper: "Courier en route",
    delivered: "Delivered",
    deliveredHelper: "Enjoy your meal",
    itemFallback: "Item",
    qty: "Qty",
    paymentPrefix: "Payment",
    statusPaid: "Paid",
    statusFailed: "Failed",
    statusCancelled: "Cancelled",
    pickupReady: "Your order is ready for pickup.",
    pickupDelivered: "Order picked up. Enjoy.",
    pickupWaiting: "We will let you know when your order is ready to collect.",
    deliveryOnWay: "Your courier is on the way.",
    deliveryDelivered: "Delivered. Enjoy your meal.",
    deliveryWaiting: "We will update you as soon as your order is dispatched."
  },

  checkoutResult: {
    successBadge: "Payment Successful",
    confirmedTitle: "Your order is confirmed",
    confirmedBody: "Thank you. Your payment went through and the kitchen is getting started on your order right away.",
    orderId: "Order ID",
    pending: "Pending",
    total: "Total",
    receiptPending: "Your receipt will appear here shortly",
    detailsUnavailable: "We could not load the latest order details, but your payment was confirmed.",
    items: "Items",
    orderSummary: "Order summary",
    itemEach: "each",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    tax: "Tax",
    nextSteps: "Next steps",
    whatHappensNow: "What happens now",
    kitchenQueue: "Your order is now in the kitchen queue.",
    keepBrowsing: "You can keep browsing the menu or open your order history anytime.",
    keepOrderId: "If you need to double-check anything, keep the order ID handy for support.",
    returnToMenu: "Return to menu",
    viewOrders: "View orders",
    failedBadge: "Payment failed",
    failedTitle: "We couldn\u2019t complete your payment",
    failedBody: "No order was finalized from this attempt. You can retry checkout or go back to your cart and try again.",
    status: "Status",
    paymentDeclined: "Payment was declined or interrupted",
    lastOrderAttempt: "Last order attempt",
    retryCheckout: "Retry checkout",
    backToCart: "Back to cart",
    needHelp: "Need help?",
    tryAgainWithConfidence: "Try again with confidence",
    bankDebitNote: "If your bank already debited you, the payment confirmation may still arrive shortly.",
    checkoutSafeRetry: "We could not load the latest order summary, but this checkout attempt is safe to retry.",
    supportText: "Otherwise, head back to your cart, review the items, and place the order again.",
    restartCheckout: "You can also restart checkout with the same cart when you\u2019re ready.",
    cancelledBadge: "Payment cancelled",
    cancelledTitle: "Checkout not completed",
    cancelledBody: "Your payment was not completed. You can retry checkout or return to your cart to review items."
  },

  itemDetail: {
    customize: "Customize",
    selectOptions: "Select options after tapping Add to Cart.",
    loadingReviews: "Loading reviews...",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    submitReview: "Submit Review",
    reviewSuccess: "Thanks for your review.",
    reviewError: "Failed to submit review",
    loadReviewsError: "Failed to load reviews",
    from: "From",
    modifiers: "Modifiers",
    reviewSubmitted: "Review submitted",
    addReview: "Add a review",
    shareNote: "Share a quick note (optional)",
    submitting: "Submitting",
    total: "Total",
    addToCart: "Add to Cart"
  },

  messages: {
    failedAddCart: "Failed to add to cart",
    failedRemoveItem: "Failed to remove item",
    failedUpdateQuantity: "Failed to update quantity",
    failedApplyCoupon: "Failed to apply coupon",
    noGuestId: "Missing guest ID",
    tryAgain: "Try again"
  }
} as const;

type DeepStringRecord<T> = T extends string
  ? string
  : { [K in keyof T]: DeepStringRecord<T[K]> };

export type DictionaryType = DeepStringRecord<typeof en>;
