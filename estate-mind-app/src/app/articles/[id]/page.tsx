import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { articleService } from "@/services/articleService";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=85";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

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

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const articleId = Number(id);

  if (!Number.isInteger(articleId) || articleId <= 0) {
    notFound();
  }

  let article;

  try {
    article = await articleService.getArticleById(articleId);
  } catch {
    notFound();
  }

  return (
    <main className="bg-[#f7f8f7]">
      <article className="mx-auto max-w-[900px] px-5 py-12 sm:px-6 lg:py-14">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft size={16} />
          Tất cả bài viết
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold tracking-[0.1em] text-brand">
            {article.category}
          </p>

          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.04em] text-[#202523] sm:text-5xl">
            {article.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#7a857f]">
            {article.sourceName && <span>Nguồn: {article.sourceName}</span>}

            {article.sourceName && formatDate(article.publishedAt) && (
              <span>•</span>
            )}

            {formatDate(article.publishedAt) && (
              <span>{formatDate(article.publishedAt)}</span>
            )}
          </div>
        </header>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-[#eef1ef]">
          <Image
            src={article.imageUrl || FALLBACK_IMAGE}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 900px"
          />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-white p-6 sm:p-8">
          <p className="whitespace-pre-line text-base leading-8 text-[#4f5b54]">
            {article.summary}
          </p>

          {article.articleType === "EXTERNAL" && article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Xem bài viết tại nguồn
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        {article.articleType === "ESTATEMIND" && (
          <p className="mt-5 text-xs leading-5 text-[#8a958f]">
            Đây là bản nội dung tóm tắt hiện có của EstateMind. Khi bổ sung
            trường nội dung đầy đủ cho bài viết, phần này sẽ được mở rộng thành
            bài viết hoàn chỉnh.
          </p>
        )}
      </article>
    </main>
  );
}
