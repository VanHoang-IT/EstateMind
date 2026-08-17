import { API_URL, throwIfNotOk } from "@/lib/api";
import { Article, ArticleType } from "@/types/article";

interface RawArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  publishedAt: string | number;
  articleType: ArticleType;
}

function normalizeArticle(article: RawArticle): Article {
  const publishedDate = new Date(article.publishedAt);

  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    category: article.category,
    imageUrl: article.imageUrl ?? null,
    sourceName: article.sourceName ?? null,
    sourceUrl: article.sourceUrl ?? null,
    publishedAt: Number.isNaN(publishedDate.getTime())
      ? ""
      : publishedDate.toISOString(),
    articleType: article.articleType,
  };
}

async function fetchArticleList(url: string): Promise<Article[]> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  await throwIfNotOk(response);

  const data: RawArticle[] = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeArticle);
}

export const articleService = {
  async getArticles(limit = 20): Promise<Article[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);

    return fetchArticleList(`${API_URL}/articles?limit=${safeLimit}`);
  },

  async getLatestArticles(limit = 3): Promise<Article[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);

    return fetchArticleList(`${API_URL}/articles/latest?limit=${safeLimit}`);
  },

  async getArticleById(id: number): Promise<Article> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    await throwIfNotOk(response);

    const data: RawArticle = await response.json();

    return normalizeArticle(data);
  },
};
