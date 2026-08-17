export type ArticleType = "EXTERNAL" | "ESTATEMIND";

export interface Article {
  id: number;
  title: string;
  summary: string;
  category: string;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  publishedAt: string;
  articleType: ArticleType;
}
