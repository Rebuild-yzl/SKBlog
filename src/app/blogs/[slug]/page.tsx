import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageZoomLayer from "@/components/image-zoom-layer";
import Markdown from "@/components/markdown";
import NoteImage from "@/components/note-image";
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

  // 遮罩里的切换范围就是这篇的正文图（封面不算），顺序与正文里出现的顺序一致
  const photos = post.images.map((image, position) => ({
    id: `${post.slug}:${position}`,
    image,
  }));

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

      {/* 封面：正文第一行整行是图片引用时才有 */}
      {post.cover ? (
        <NoteImage
          image={post.cover}
          alt={post.title}
          className="w-full rounded-3xl"
          sizes="(min-width: 1024px) 48rem, 100vw"
          loading="eager"
        />
      ) : null}

      {/* 正文：Markdown 在构建期渲染完；包一层图片层，点正文里的图会在本站内打开详情遮罩 */}
      {post.body.trim() ? (
        <ImageZoomLayer photos={photos} sourceLabel={`来自《${post.title}》`}>
          <article className="lightedge lightedge-solid prose prose-zinc dark:prose-invert max-w-none rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-950">
            <Markdown
              content={post.body}
              photoRefs={post.images.map((image) => image.ref)}
            />
          </article>
        </ImageZoomLayer>
      ) : null}
    </div>
  );
}
