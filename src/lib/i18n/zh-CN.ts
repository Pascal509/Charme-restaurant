/**
 * Simplified Chinese (zh-CN) Translation Dictionary
 * Structured with nested keys for organization
 */

import type { DictionaryType } from "./en";

export const zhCN = {
  common: {
    back: "返回",
    close: "关闭",
    cancel: "取消",
    or: "或",
    guest: "访客",
    prev: "上一页",
    next: "下一页",
    explore: "浏览",
    learnMore: "了解更多",
    viewMore: "查看更多",
    getInTouch: "联系我们",
    email: "电子邮件",
    phone: "电话",
    address: "地址",
    hours: "营业时间",
    monday: "星期一",
    tuesday: "星期二",
    wednesday: "星期三",
    thursday: "星期四",
    friday: "星期五",
    saturday: "星期六",
    sunday: "星期日",
    closed: "已关闭"
  },

  errors: {
    oops: "出错了",
    unexpectedTitle: "出了点问题",
    unexpectedBody: "加载此页面时遇到了一些问题，请重试。",
    unexpectedHelp: "如果问题持续出现，可以返回首页，稍后再试。",
    notFoundTitle: "页面不存在",
    notFoundBody: "你查找的页面可能已移动或不再存在。",
    notFoundHelp: "你可以返回首页，或者回到菜单继续浏览。",
    digestLabel: "错误摘要",
    retry: "重试",
    goHome: "返回首页"
  },

  offline: {
    title: "离线",
    body: "你当前处于离线状态。我们已为你保存了一个轻量页面，请重新连接以加载实时菜单和订单。"
  },

  auth: {
    login: {
      eyebrow: "欢迎回来",
      title: "登录",
      subtitle: "登录后可跟踪订单、管理账户并保存送餐信息。",
      email: "电子邮件",
      password: "密码",
      signIn: "登录",
      signingIn: "登录中...",
      google: "继续使用 Google",
      noAccount: "还没有账户？",
      createOne: "创建一个",
      invalidCredentials: "邮箱或密码无效"
    },
    register: {
      eyebrow: "加入 Charme",
      title: "创建账户",
      subtitle: "保存送餐信息、跟踪订单并管理个人资料。",
      name: "姓名",
      email: "电子邮件",
      password: "密码",
      createAccount: "创建账户",
      creatingAccount: "创建账户中...",
      google: "继续使用 Google",
      alreadyHaveAccount: "已经有账户？",
      signIn: "登录",
      unableToCreate: "无法创建账户",
      signInFailed: "账户已创建，但登录失败",
      minimumPassword: "至少 8 个字符"
    }
  },

  account: {
    eyebrow: "账户",
    title: "欢迎回来",
    subtitle: "管理你的资料、查看过往订单，并保留送餐信息。",
    profile: "个人资料",
    logOut: "退出登录",
    guestCustomer: "访客客户",
    noEmail: "暂无电子邮件",
    latestOrder: "最近订单",
    track: "查看",
    savedAddresses: "已保存地址",
    orderHistory: "订单历史",
    ordersCount: "{count} 个订单",
    ordersError: "无法加载订单，请重试。",
    noOrders: "尚无订单。请从菜单开始你的第一单。",
    mergeError: "合并购物车失败",
    guestCartUnavailable: "无法解析访客购物车。",
    reorderError: "重新下单失败",
    reorder: "重新下单",
    reordering: "正在重新下单..."
  },

  addressManager: {
    identityError: "无法加载会话身份",
    identityNotReady: "用户身份尚未就绪",
    loadError: "加载地址失败",
    updateError: "更新地址失败",
    saveError: "保存地址失败",
    deleteError: "删除地址失败",
    defaultError: "设置默认地址失败",
    empty: "尚无已保存地址。",
    defaultLabel: "默认",
    setDefault: "设为默认",
    edit: "编辑",
    delete: "删除"
  },

  addressForm: {
    label: "标签",
    fullName: "姓名",
    phone: "电话",
    country: "国家",
    addressLine1: "地址第1行",
    addressLine2: "地址第2行",
    city: "城市",
    state: "州/省",
    postalCode: "邮政编码",
    latitude: "纬度",
    longitude: "经度",
    optional: "（可选）",
    labelRequired: "请填写标签",
    fullNameRequired: "请填写姓名",
    phoneRequired: "请填写电话",
    addressRequired: "请填写地址",
    cityRequired: "请填写城市",
    stateRequired: "请填写州/省",
    countryRequired: "请填写国家",
    latitudeRequired: "请填写纬度",
    longitudeRequired: "请填写经度",
    mapPreview: "地图预览",
    defaultAddress: "设为默认地址",
    saving: "保存中...",
    saveAddress: "保存地址",
    labelPlaceholder: "家庭、办公室",
    fullNamePlaceholder: "收件人姓名",
    phonePlaceholder: "电话号码",
    countryPlaceholder: "国家",
    addressLine1Placeholder: "街道地址",
    addressLine2Placeholder: "公寓、套房",
    cityPlaceholder: "城市",
    statePlaceholder: "州/省",
    postalCodePlaceholder: "邮政编码",
    latitudePlaceholder: "纬度",
    longitudePlaceholder: "经度"
  },

  nav: {
    home: "首页",
    menu: "菜单",
    market: "超市",
    offers: "优惠",
    locations: "门店",
    about: "关于",
    cart: "购物车",
    account: "账户"
  },

  home: {
    hero: {
      eyebrow: "Charme 餐厅",
      title: "现代中式与台湾风味餐饮，呈现得更从容。",
      subtitle: "精致的用餐空间、精选亚洲市场，以及适合日常仪式感与特别场合的服务节奏。",
      primaryCta: "查看菜单",
      secondaryCta: "立即点餐"
    },
    signature: {
      eyebrow: "主厨精选",
      title: "平衡、层次与清晰度兼备的招牌菜式。",
      subtitle: "精炼的菜品选择，体现厨房的技艺、克制与细节把控。",
      cards: {
        dumplings: {
          title: "手工包制饺子",
          description: "细致褶皱、柔嫩馅料与干净利落的蒸制收尾。"
        },
        noodles: {
          title: "丝滑面碗",
          description: "新鲜面条配以浓郁酱汁与清亮香气。"
        },
        rice: {
          title: "锅气炒饭",
          description: "香气饱满、层次分明、口感平衡的炒饭。"
        },
        duck: {
          title: "脆皮北京烤鸭",
          description: "外皮酥脆、风味深厚、质感精致的招牌菜。"
        }
      }
    },
    dining: {
      eyebrow: "冰淇淋与甜点",
      title: "意大利手工冰淇淋与亚洲灵感甜品，在精致酒吧享用。",
      subtitle: "每日新鲜制作的手工冰淇淋，搭配手工烘焙甜点与特色甜品，融合亚洲与意大利的传统风味。",
      story: "我们的冰淇淋每日小批量制作，选用优质奶制品、当季水果与精致风味搭配；与注重茶韵的甜点并列呈现，适合慢享的精致时刻。",
      primaryCta: "探索冰淇淋菜单",
      secondaryCta: "预订甜品酒廊",
      note: "为满足对美食的渴望而设计"
    },
    market: {
      eyebrow: "餐厅与市场",
      title: "好好用餐，也好好选购。",
      subtitle: "楼上的精致餐厅与楼下精选市场相互呼应，形成完整而自然的体验。",
      primaryCta: "探索菜单",
      secondaryCta: "前往超市"
    },
    tea: {
      title: "以茶收尾，让节奏慢下来。",
      subtitle: "以平衡与用心呈现的收尾时刻，为当晚留下安静余韵。"
    }
  },

  offers: {
    title: "季节性用餐优惠",
    subtitle: "为午餐、晚餐与私人聚会精心设计的套餐与限时菜单。",
    description: "精选少量高质优惠，价值清晰、分量适中，收尾更显精致。",
    noOffers: "当前暂无可用的季节性优惠。",
    highlightText: "适合轻松午餐、晚餐预订与特别场合。",
    badges: {
      limitedTime: "限时",
      popular: "热门",
      chefsSpecial: "主厨推荐"
    },

    cards: {
      brunch: {
        title: "周日早午餐套餐",
        description: "适合2到4人分享的组合，包含饺子、现炒面、时令水果与茶。",
        details: "适合从容的早午餐、家庭来访和轻松庆祝。"
      },
      family: {
        title: "家庭欢聚套餐",
        description: "适合家庭用餐与团体接待的丰盛组合，包含米饭、鸡肉、蔬菜与甜点。",
        details: "分量充足，并为每位宾客提供一份饮品。"
      },
      tasting: {
        title: "主厨品鉴体验",
        description: "通过小份菜、时令酱汁与精致收尾，依次品尝 Charme 的经典风味。",
        details: "适合约会、私宴接待与特别庆祝。"
      },
      lunch: {
        title: "工作日午餐搭配",
        description: "轻盈而完整的午间搭配，包含主菜、汤品与茶，节奏从容。",
        details: "周一至周五午餐服务时段供应。"
      }
    },

    validUntil: "有效期至",
    minOrder: "最小订单",
    appliedAutomatically: "在结账时自动应用",
    discoverOffersTitle: "规划下一次用餐体验",
    discoverOffersSubtitle: "预订餐位，或从菜单中选择最适合你场合的菜式。",
    browseMenu: "查看菜单",
    contactTeam: "联系我们"
  },

  locations: {
    title: "我们的门店",
    subtitle: "欢迎前往阿布贾 Maitama 的 Charme，感受精致用餐、细致服务与从容节奏。",
    description: "查看我们在阿布贾 Maitama 的门店位置，轻松规划到访。",
    noLocations: "未找到任何门店",
    cities: {
      abuja: "阿布贾"
    },

    branches: {
      abujaMaitama: {
        name: "Maitama 餐厅",
        address: "尼日利亚阿布贾 Maitama，Gana Street 41 号",
        addressShort: "尼日利亚阿布贾 Maitama",
        googleMapsLabel: "在 Google 地图中打开",
        hoursWeekday: "每日：上午9:00 - 晚上9:00",
        hoursWeekend: "每日：上午9:00 - 晚上9:00",
        phone: "+234 811 120 2666",
        email: "charme.aid@gmail.com",
        label: "Maitama，阿布贾"
      }
    },

    info: {
      openingHours: "营业时间",
      reservations: "预订",
      deliveryAvailable: "提供送餐",
      parking: "停车",
      wheelchair: "轮椅无障碍",
      diningType: "用餐类型",
      dineIn: "堂食",
      takeaway: "外带",
      delivery: "送餐",
      openDaily: "每日营业"
    },

    callUs: "致电我们",
    visitUs: "访问我们",
    reserveTable: "预订餐位",
    branchFallback: "门店"
  },

  about: {
    title: "关于Charme",
    subtitle: "融合现代中式与台湾风味，并以尼日利亚式热情服务为根基。",
    brandStoryTitle: "品牌故事",
    brandStory:
      "Charme 将精致餐饮与精选市场结合为一个完整品牌。我们让每一次体验都建立在新鲜、稳定与明确的品质感之上。",
    missionTitle: "使命",
    missionStatement:
      "通过精致、可靠且值得再次到访的餐饮与零售服务，打造令人安心、舒适且有价值的日常体验。",
    valuesTitle: "价值观",
    positioningTitle: "文化定位",
    positioning:
      "Charme 融合现代设计、区域风味与本地化的温暖服务，形成一个当代而不失文化温度的高品质体验。",
    experienceTitle: "体验 Charme 标准",
    experienceSubtitle: "为日常用餐、特别场合以及介于两者之间的一切时刻而打造的现代餐厅与市场。",

    ourStory: {
      title: "我们的故事",
      content:
        "Charme 的起点很简单：把现代餐饮的精致感与社区市场的实用性结合起来。最初由家庭驱动的待客理念，如今成长为一个稳重而精致的目的地，吸引重视稳定品质与安静自信的客人反复到访。"
    },

    mission: {
      title: "我们的使命",
      content:
        "通过精心采购的食材、现代化的烹饪技术，以及不过度打扰却足够贴心的服务，持续提供稳定的食物品质、温暖的接待与清晰的价值感。"
    },
    labels: {
      mission: "使命",
      values: "价值观"
    },
    storyHighlights: {
      ingredient: "精选食材，来自可信赖的供应商",
      craft: "以技艺与传统的平衡呈现菜品",
      service: "以真诚热情提供个性化服务"
    },

    values: {
      title: "我们的价值观",
      quality: "品质 - 每一份订单都坚持新鲜食材、精细准备和稳定呈现",
      sustainability: "可持续 - 负责任采购，并做出尊重环境的实际选择",
      community: "社区 - 支持本地供应商、创造社区就业，并以服务回馈城市",
      excellence: "卓越 - 从厨房到餐桌，再到整体体验，每个细节都值得认真对待"
    },

    team: {
      title: "我们的团队",
      subtitle: "经验丰富的专业团队，致力于安静而精致的用餐体验",
      chefTitle: "行政主厨",
      pastryTitle: "甜点主厨",
      managerTitle: "总经理",
      dedication: "我们的团队将多年餐饮与款待经验带入每一次服务",
      members: {
        chefMarcusName: "Marcus主厨",
        chefMarcusSpecialization: "现代欧洲料理",
        chefAmaraName: "Amara主厨",
        chefAmaraSpecialization: "匠心甜品与烘焙",
        samuelName: "Samuel Okafor",
        samuelSpecialization: "餐厅运营与款待管理"
      }
    },

    recognition: {
      title: "荣誉",
      awards: "我们很荣幸获得宾客与行业同仁对稳定品质与细致服务的认可"
    },
    cta: {
      title: "欢迎来到Charme",
      subtitle: "体验考究的餐饮、细致的服务，以及独属于 Charme 的氛围"
    }
  },
  admin: {
    dashboard: {
      eyebrow: "管理",
      title: "餐厅运营",
      subtitle: "查看实时订单、更新状态，并维护菜单。",
      liveUpdates: "实时更新",
      liveOrders: "实时订单",
      active: "活跃",
      loadingOrders: "正在加载订单...",
      ordersError: "加载订单失败。",
      noActiveOrders: "当前没有活跃订单。",
      today: "今日",
      loadingMetrics: "正在加载数据...",
      metricsError: "加载数据失败。",
      connecting: "连接中",
      connected: "已连接",
      disconnected: "已断开",
      error: "错误",
      orders: "订单",
      revenue: "收入",
      menuManagement: "菜单管理",
      createItem: "创建商品",
      itemNamePlaceholder: "商品名称",
      descriptionPlaceholder: "描述",
      pricePlaceholder: "价格",
      currencyPlaceholder: "货币",
      prepTimePlaceholder: "准备时间（分钟）",
      categoryPlaceholder: "选择分类",
      imageUrlPlaceholder: "图片地址",
      available: "可售",
      creating: "创建中...",
      create: "创建商品",
      loadingMenu: "正在加载菜单...",
      menuError: "加载菜单失败。",
      disable: "停用",
      enable: "启用",
      edit: "编辑",
      saving: "保存中...",
      save: "保存",
      cancel: "取消",
      itemFallback: "商品",
      guestFallback: "访客",
      orderPrefix: "订单",
      itemsSuffix: "项",
      soldSuffix: "已售",
      statusLabel: "状态",
      menuCreated: "商品已创建。",
      menuUpdated: "商品已更新。",
      createError: "创建商品失败",
      updateError: "更新商品失败"
    },
    action: {
      accept: "接受",
      startPrep: "开始准备",
      ready: "准备就绪",
      outForDelivery: "外送中",
      delivered: "已送达",
      cancel: "取消"
    },
    updating: "更新中...",
    analytics: {
      eyebrow: "管理",
      title: "数据分析",
      subtitle: "查看每日收入、订单速度和畅销商品。",
      period: "最近30天",
      loading: "正在加载数据...",
      error: "加载分析数据失败。",
      dailyRevenue: "每日收入",
      noRevenueData: "暂无收入数据。",
      orderCount: "订单数",
      averageOrder: "平均订单",
      topSellingItems: "畅销商品",
      noSalesYet: "暂无销售。",
      soldSuffix: "已售",
      orderVolume: "订单量",
      noOrderData: "暂无订单数据。"
    }
  },
  mobileNav: {
    chooseExperience: "选择体验"
  },
  brand: {
    tagline: "餐厅与市场",
    description: "现代中式与台湾风味餐饮，搭配精致的社区市场。"
  },
  footer: {
    navigation: "导航",
    contact: "联系方式",
    hours: "营业时间",
    social: "社交媒体",
    restaurant: "餐厅",
    market: "超市",
    copyright: "© 2026 Charme 餐厅与超市",
    cuisineTag: "现代中式与台湾风味",
    address: "尼日利亚阿布贾 Maitama，Gana Street 41 号",
    addressShort: "Maitama，阿布贾",
    mapLinkLabel: "在 Google 地图中查看",
    phone: "+234 811 120 2666",
    email: "charme.aid@gmail.com",
    restaurantHours: "每日：上午9:00 - 晚上9:00",
    restaurantHoursWeekend: "每日：上午9:00 - 晚上9:00",
    marketHours: "每日：上午9:00 - 晚上9:00"
  },

  cart: {
    header: "我的购物车",
    title: "确认订单",
    subtitle: "检查项目、调整数量，准备好后继续。",
    empty: "购物车为空",
    emptyMessage: "从菜单或超市开始添加商品。",
    loading: "加载购物车中...",
    error: "无法加载购物车，请重试。",
    item: "商品",
    unavailable: "不可用",
    remove: "移除",
    quantity: "数量",
    price: "价格",
    total: "总计",
    subtotal: "小计",
    deliveryFee: "送餐费",
    discount: "折扣",
    tbd: "待计算",
    proceedCheckout: "前往结账",
    activePromotions: "活跃促销",
    coupon: "优惠券",
    couponPlaceholder: "输入优惠码",
    apply: "应用",
    applying: "应用中",
    clear: "清除",
    couponApplied: "优惠券已应用。",
    invalidCoupon: "无效的优惠券代码"
  },

  checkout: {
    title: "结账",
    review: "检查订单",
    address: "送餐地址",
    delivery: "送餐",
    pickup: "自取",
    payment: "支付方式",
    deliveryAddress: "送餐地址",
    addNew: "新增",
    signInAddresses: "请登录后使用已保存的地址。",
    addAddressToContinue: "请先添加地址以继续。",
    completeOrder: "完成订单",
    confirmDetails: "在提交前确认送餐、支付与订单信息。",
    stepDelivery: "送餐",
    stepPayment: "支付",
    stepReview: "检查",
    unableToLoad: "无法加载结账页面，请重试。",
    step01Heading: "履约方式",
    fulfillment: "履约方式",
    collectFromRestaurant: "请到餐厅自取你的订单。",
    bringToYou: "我们会将订单送达给你。",
    pickupSlot: "自取时段",
    pickupSlotPlaceholder: "输入你偏好的自取时间",
    step02Heading: "支付",
    provider: "支付渠道",
    comingSoon: "即将上线",
    step03Heading: "检查",
    itemsCount: "{count} 件商品",
    updatingTotals: "更新总额中...",
    attentionTitle: "请检查以下内容",
    special: "特别",
    tax: "税费",
    totalsAfterValidation: "验证完成后将显示总额。",
    deliveryRequiresLogin: "请登录后使用送餐与已保存地址。",
    signInDelivery: "请登录后使用送餐。",
    selectDeliveryAddress: "请选择一个送餐地址。",
    resolveValidation: "请先解决验证问题再继续。",
    failedToStart: "无法开始结账。",
    paymentSessionUnavailable: "支付会话不可用。",
    couponApplied: "优惠券已使用。",
    couponFailed: "优惠券使用失败。",
    startingPayment: "正在启动支付...",
    placeOrder: "提交订单",
    redirectNotice: "系统将跳转至支付页面完成付款。",
    validating: "验证总价中...",
    validatingTotals: "验证总价中...",
    loading: "加载中...",
    failed: "加载失败",
    error: "出现问题，请重试。",
    success: "订单已成功下单",
    networkError: "网络错误，请检查连接后重试。",
    requestTimedOut: "请求超时，请重试。",
    requestAborted: "请求已取消。",
    validationFailed: "验证失败，请检查订单。",
    noImage: "无图片"
  },

  menu: {
    title: "菜单",
    categories: "分类",
    searchPlaceholder: "搜索菜单项",
    allOption: "全部",
    filter: "筛选",
    price: "价格",
    priceAll: "所有价格",
    priceLow: "50元以下",
    priceMid: "50–150元",
    priceHigh: "150元以上",
    noResults: "未找到相关项",
    loading: "加载菜单中...",
    details: "详情",
    addToCart: "加入购物车",
    selected: "已选中",
    recommended: "推荐精选",
    featuredSubtitle: "精选主打菜式与宾客最爱。",    heroTitle: "精选菜品，现代风味",
    heroSubtitle: "从季节分类中挑选，组合出理想的一餐。新鲜食材、精准烹制、精心搭配。",
    emptyState: "当前没有可用菜单项。"  },

  market: {
    title: "超市",
    all: "全部",
    searchTitle: "寻找厨房必备食材",
    filtersUpdateInstantly: "筛选会即时更新",
    categories: "分类",
    searchPlaceholder: "搜索商品",
    filter: "筛选",
    price: "价格",
    minPrice: "最低价格",
    maxPrice: "最高价格",
    inStockOnly: "仅现货",
    noResults: "未找到商品",
    loading: "加载超市中...",
    adjustFilters: "请尝试调整筛选条件。",
    addToCart: "加入购物车",
    outOfStock: "缺货",
    lowStock: "库存紧张",
    inStock: "有货",
    decreaseQuantity: "减少数量",
    increaseQuantity: "增加数量",
    showingPage: "第 {current} 页，共 {total} 页"
  },

  notifications: {
    title: "通知",
    markAllRead: "全部标为已读",
    preferences: "偏好设置",
    loading: "正在加载通知...",
    loadError: "无法加载通知。",
    empty: "暂无通知。",
    update: "更新",
    newActivity: "新动态",
    email: "电子邮件",
    sms: "短信",
    push: "推送",
    orderConfirmed: "订单已确认",
    orderPreparing: "订单准备中",
    orderReady: "订单已就绪",
    orderOutForDelivery: "订单配送中",
    orderDelivered: "订单已送达",
    paymentFailed: "支付失败"
  },

  orders: {
    tracking: "订单跟踪",
    orderPrefix: "订单",
    deliveryLabel: "送餐",
    pickupLabel: "自取",
    timeline: "时间线",
    items: "商品",
    deliveryStatus: "送餐状态",
    totals: "总计",
    subtotal: "小计",
    tax: "税费",
    deliveryFee: "送餐费",
    total: "总计",
    live: "实时",
    reconnecting: "重新连接中",
    offline: "离线",
    disconnected: "已断开",
    connecting: "连接中",
    placed: "已下单",
    placedHelper: "订单已收到",
    preparing: "准备中",
    preparingHelper: "厨房正在制作",
    ready: "已就绪",
    readyHelper: "已打包完成",
    onTheWay: "配送中",
    onTheWayHelper: "配送员正在路上",
    delivered: "已送达",
    deliveredHelper: "请慢用",
    itemFallback: "商品",
    qty: "数量",
    paymentPrefix: "支付",
    statusPaid: "已支付",
    statusFailed: "失败",
    statusCancelled: "已取消",
    pickupReady: "你的订单已可自取。",
    pickupDelivered: "订单已取走，祝用餐愉快。",
    pickupWaiting: "订单准备好后我们会通知你。",
    deliveryOnWay: "配送员正在路上。",
    deliveryDelivered: "已送达，祝用餐愉快。",
    deliveryWaiting: "订单发出后我们会尽快更新。"
  },

  checkoutResult: {
    successBadge: "支付成功",
    confirmedTitle: "你的订单已确认",
    confirmedBody: "感谢你。付款已完成，厨房会立即开始处理你的订单。",
    orderId: "订单号",
    pending: "待处理",
    total: "总计",
    receiptPending: "收据稍后会显示在这里",
    detailsUnavailable: "我们无法加载最新订单详情，但你的付款已确认。",
    items: "商品",
    orderSummary: "订单摘要",
    itemEach: "每份",
    subtotal: "小计",
    deliveryFee: "送餐费",
    tax: "税费",
    nextSteps: "接下来的步骤",
    whatHappensNow: "接下来会发生什么",
    kitchenQueue: "你的订单已进入厨房队列。",
    keepBrowsing: "你可以继续浏览菜单，或随时查看订单历史。",
    keepOrderId: "如需再次核对，请保留订单号以便联系支持。",
    returnToMenu: "返回菜单",
    viewOrders: "查看订单",
    failedBadge: "支付失败",
    failedTitle: "我们无法完成你的支付",
    failedBody: "本次尝试未生成订单。你可以重新结账，或返回购物车后再试。",
    status: "状态",
    paymentDeclined: "支付被拒绝或中断",
    lastOrderAttempt: "上一次下单尝试",
    retryCheckout: "重新结账",
    backToCart: "返回购物车",
    needHelp: "需要帮助？",
    tryAgainWithConfidence: "放心重试",
    bankDebitNote: "如果银行已扣款，支付确认可能稍后才会到达。",
    checkoutSafeRetry: "我们无法加载最新订单摘要，但这次结账可以安全重试。",
    supportText: "否则，请返回购物车、检查商品后再次下单。",
    restartCheckout: "你也可以在准备好时用相同购物车重新开始结账。",
    cancelledBadge: "支付已取消",
    cancelledTitle: "结账未完成",
    cancelledBody: "你的支付未完成。你可以重新结账，或返回购物车检查商品。"
  },

  itemDetail: {
    customize: "自定义",
    selectOptions: "点击'加入购物车'后选择选项。",
    loadingReviews: "加载评价中...",
    reviews: "评价",
    noReviews: "暂无评价",
    submitReview: "提交评价",
    reviewSuccess: "感谢你的评价。",
    reviewError: "评价提交失败",
    loadReviewsError: "加载评价失败",
    from: "起价",
    modifiers: "加料选项",
    reviewSubmitted: "评价已提交",
    addReview: "添加评价",
    shareNote: "分享简短备注（可选）",
    submitting: "提交中",
    total: "总计",
    addToCart: "加入购物车"
  },

  messages: {
    failedAddCart: "加入购物车失败",
    failedRemoveItem: "移除项目失败",
    failedUpdateQuantity: "更新数量失败",
    failedApplyCoupon: "应用优惠券失败",
    noGuestId: "缺少访客ID",
    tryAgain: "重试"
  }
} as const satisfies DictionaryType;
