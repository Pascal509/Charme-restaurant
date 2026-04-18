export type MenuOption = {
  id: string;
  name: string;
  priceMinor?: number;
  currency?: string;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: MenuOption[];
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  preparationTime?: number | null;
  modifierGroups?: MenuOptionGroup[];
  averageRating?: number;
  reviewCount?: number;
};

export type SelectedMap = Record<string, string[]>;
