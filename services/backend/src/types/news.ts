export type NewsCategory =
  | "politics"
  | "technology"
  | "economy"
  | "health"
  | "environment"
  | "sports"
  | "culture";

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  category: NewsCategory;
  reputationScore: number;
  bias: "left" | "center" | "right" | "unknown";
  imageUrl?: string;
  publishedAt: string;
}
