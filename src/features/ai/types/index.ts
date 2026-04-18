export type Recommendation = {
  id: string;
  entityType: "product" | "menu";
  score: number;
};
