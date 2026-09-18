import type { Metadata } from "next";
import Link from "next/link";
import NothingHere from "@/components/nothing-here";
import { formatDate, getAllPosts } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Blogs | NeuroSaiKou",
  description: "NeuroSaiKou 的博客文章",
};

export default function Blogs() {
  const posts = getAllPosts();

  if (posts.length === 0) {
    return (
      <NothingHere
        title="No posts yet"
        description="笔记仓库里还没有标记 publish: true 的笔记。"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 font-sans lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Blogs
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {`${posts.length} 篇，来自笔记仓库中标记了 publish: true 的笔记。`}
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blogs/${post.slug}`}
              className="lightedge lightedge-solid flex flex-col gap-2 rounded-3xl bg-white p-6 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg font-medium">{post.title}</h2>
                <time
                  dateTime={formatDate(post.date)}
                  className="font-mono text-xs text-zinc-500 dark:text-zinc-500"
                >
                  {formatDate(post.date)}
                </time>
              </div>

              {post.description ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>
              ) : null}

              {post.tags.length > 0 ? (
                <p className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
