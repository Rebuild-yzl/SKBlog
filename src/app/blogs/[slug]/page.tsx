import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAllPosts, getPostBySlug } from "@/lib/notes";

// 文章集合在构建时定死：不在 generateStaticParams 里的 slug 直接 404，不做按需渲染。
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Not found | NeuroSaiKou" };
  }

  return {
    title: `${post.title} | NeuroSaiKou`,
    description: post.description,
  };
}

export default async function BlogPost({ params }: PageProps<"/blogs/[slug]">) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6 font-sans lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/blogs"
          className="w-fit text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Blogs
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-500">
          <time dateTime={formatDate(post.date)} className="font-mono">
            {formatDate(post.date)}
          </time>
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* 当前只做纯文本展示：正文原样输出（保留换行与空格），不渲染 Markdown。 */}
      <article className="lightedge lightedge-solid rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-950">
        <pre className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
          {post.body.trim()}
        </pre>
      </article>
    </div>
  );
}
