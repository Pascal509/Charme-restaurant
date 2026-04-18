export async function getDictionary(locale: string) {
  switch (locale) {
    case "zh-CN":
      return import("@/locales/zh-CN/common.json").then((module) => module.default);
    case "en":
    default:
      return import("@/locales/en/common.json").then((module) => module.default);
  }
}
