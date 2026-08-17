import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

import { articleService } from "@/services/articleService";
import { Article } from "@/types/article";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=85";

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function ArticleAction({ article }: { article: Article }) {
  if (article.articleType === "EXTERNAL" && article.sourceUrl) {
    return (
      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
      >
        Xem bài gốc
        <ExternalLink size={14} />
      </a>
    );
  }

  return (
    <Link
      href={`/articles/${article.id}`}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
    >
      Đọc bài viết
      <ArrowRight size={15} />
    </Link>
  );
}

export default async function ArticlesPage() {
  let articles: Article[] = [];
  let loadError = false;

  try {
    articles = await articleService.getArticles(20);
  } catch (error) {
    console.error("Không thể tải danh sách bài viết:", error);
    loadError = true;
  }

  return (
    <main className="bg-[#f7f8f7]">
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 lg:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft size={16} />
          Về trang chủ
        </Link>

        <div className="mt-7">
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#202523]">
            Thông tin bất động sản
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68736d]">
            Tổng hợp góc nhìn thị trường, chính sách và công nghệ liên quan đến
            bất động sản từ EstateMind và các nguồn tham khảo.
          </p>
        </div>

        {loadError ? (
          <div className="mt-10 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
            Không thể tải danh sách bài viết. Vui lòng thử lại sau.
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[#ced8d2] bg-white px-6 py-16 text-center text-sm text-[#7b867f]">
            Chưa có bài viết nào để hiển thị.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_28px_rgba(25,45,35,0.04)]"
              >
                <div className="relative aspect-[16/10] bg-[#eef1ef]">
                  <Image
                    src={article.imageUrl || FALLBACK_IMAGE}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-bold tracking-[0.08em] text-brand">
                    {article.category}
                  </p>

                  <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-snug text-[#202523]">
                    {article.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#68736d]">
                    {article.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#8a958f]">
                    {article.sourceName && (
                      <span>Nguồn: {article.sourceName}</span>
                    )}

                    {article.sourceName && formatDate(article.publishedAt) && (
                      <span>•</span>
                    )}

                    {formatDate(article.publishedAt) && (
                      <span>{formatDate(article.publishedAt)}</span>
                    )}
                  </div>

                  <div className="mt-5">
                    <ArticleAction article={article} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
