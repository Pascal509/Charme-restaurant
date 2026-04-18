export type MenuItemSummary = {
  id: string;
  title: string;
  amountMinor: number;
  currency: string;
};

export type MenuItemAvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  locationId?: string | null;
};

export type ModifierGroupSummary = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
};
