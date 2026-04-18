import { prisma } from "@/lib/db";

export async function createModifierGroup(params: {
  menuId: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
}) {
  return prisma.modifierGroup.create({
    data: {
      menuId: params.menuId,
      name: params.name,
      minSelect: params.minSelect ?? 0,
      maxSelect: params.maxSelect ?? 1,
      isRequired: params.isRequired ?? false
    }
  });
}

export async function createModifierOption(params: {
  modifierGroupId: string;
  name: string;
  baseAmountMinor?: number;
  baseCurrency?: string;
}) {
  return prisma.modifierOption.create({
    data: {
      modifierGroupId: params.modifierGroupId,
      name: params.name,
      baseAmountMinor: params.baseAmountMinor ?? 0,
      baseCurrency: params.baseCurrency ?? "NGN"
    }
  });
}

export async function attachModifierGroupToMenuItem(params: {
  menuItemId: string;
  modifierGroupId: string;
  minSelectOverride?: number | null;
  maxSelectOverride?: number | null;
}) {
  return prisma.menuItemModifierGroup.create({
    data: {
      menuItemId: params.menuItemId,
      modifierGroupId: params.modifierGroupId,
      minSelectOverride: params.minSelectOverride ?? undefined,
      maxSelectOverride: params.maxSelectOverride ?? undefined
    }
  });
}
