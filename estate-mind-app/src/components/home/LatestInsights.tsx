import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

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

function SourceInfo({ article }: { article: Article }) {
  const publishedDate = formatDate(article.publishedAt);

  if (!article.sourceName && !publishedDate) {
    return null;
  }

  return (
    <p className="mt-3 text-xs text-[#8a958f]">
      {article.sourceName && <>Nguồn: {article.sourceName}</>}

      {article.sourceName && publishedDate && <span className="mx-1.5">•</span>}

      {publishedDate}
    </p>
  );
}

function ArticleAction({ article }: { article: Article }) {
  if (article.articleType === "EXTERNAL" && article.sourceUrl) {
    return (
      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand"
      >
        Xem bài gốc
        <ExternalLink size={14} />
      </a>
    );
  }

  return (
    <Link
      href={`/articles/${article.id}`}
      className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand"
    >
      Đọc bài viết
      <ArrowRight size={15} />
    </Link>
  );
}

export default async function LatestInsights() {
  let articles: Article[] = [];
  let loadError = false;

  try {
    articles = await articleService.getLatestArticles(3);
  } catch (error) {
    console.error("Không thể tải thông tin mới nhất:", error);
    loadError = true;
  }

  return (
    <section
      id="insights"
      className="mx-auto max-w-[1180px] scroll-mt-24 px-5 pb-8 sm:px-6 lg:pb-12"
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.035em] text-[#202523]">
            Thông tin mới nhất
          </h2>

          <p className="mt-2 text-sm text-[#68736d]">
            Thị trường, chính sách và công nghệ bất động sản được EstateMind
            chọn lọc và tổng hợp.
          </p>
        </div>

        <Link
          href="/articles"
          className="hidden items-center gap-1.5 text-sm font-semibold text-brand sm:inline-flex"
        >
          Xem tất cả bài viết
          <ArrowRight size={16} />
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-dashed border-[#d6ddd9] bg-white px-6 py-12 text-center text-sm text-[#7b867f]">
          Chưa thể tải thông tin mới nhất. Vui lòng thử lại sau.
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d6ddd9] bg-white px-6 py-12 text-center text-sm text-[#7b867f]">
          Chưa có bài viết nào để hiển thị.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <article className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_30px_rgba(20,40,30,0.04)]">
            <div className="grid h-full md:grid-cols-[1.15fr_1fr]">
              <div className="relative min-h-[260px]">
                <Image
                  src={articles[0].imageUrl || FALLBACK_IMAGE}
                  alt={articles[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>

              <div className="flex flex-col justify-center p-6">
                <p className="text-[11px] font-bold tracking-[0.08em] text-brand">
                  {articles[0].category}
                </p>

                <h3 className="mt-2 text-2xl font-bold leading-tight text-[#202523]">
                  {articles[0].title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#6a756f]">
                  {articles[0].summary}
                </p>

                <SourceInfo article={articles[0]} />

                <ArticleAction article={articles[0]} />
              </div>
            </div>
          </article>

          <div className="grid gap-5">
            {articles.slice(1).map((article) => (
              <article
                key={article.id}
                className="grid grid-cols-[120px_1fr] overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_30px_rgba(20,40,30,0.04)] sm:grid-cols-[155px_1fr]"
              >
                <div className="relative min-h-[150px]">
                  <Image
                    src={article.imageUrl || FALLBACK_IMAGE}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>

                <div className="flex flex-col p-5">
                  <p className="text-[10px] font-bold tracking-[0.08em] text-brand">
                    {article.category}
                  </p>

                  <h3 className="mt-2 text-lg font-bold leading-snug text-[#202523]">
                    {article.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#6a756f]">
                    {article.summary}
                  </p>

                  <SourceInfo article={article} />

                  <ArticleAction article={article} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/articles"
        className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand sm:hidden"
      >
        Xem tất cả bài viết
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
