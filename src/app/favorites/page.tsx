import type { Metadata } from "next";
import Link from "next/link";
import { COLLECTIONS, type CollectionIcon } from "@/lib/collections";
import { getPlaylists } from "@/lib/music";

export const metadata: Metadata = {
  title: "Favorites | NeuroSaiKou",
  description: "NeuroSaiKou 的收藏",
};

export default function Favorites() {
  const playlists = getPlaylists();
  const total = playlists.reduce(
    (sum, playlist) => sum + playlist.songs.length,
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 font-sans lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Favorites
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          收藏都归在这里，点一个进去看。
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map((collection) => {
          const meta =
            collection.id === "music"
              ? `${playlists.length} 个歌单 · ${total} 首`
              : null;
          const clickable = Boolean(collection.href) && !collection.soon;
          const cardClass =
            "lightedge lightedge-solid flex w-full items-start gap-4 rounded-3xl bg-white p-6 text-left shadow-sm dark:bg-zinc-950";

          const body = (
            <>
              <span className="lightedge lightedge-2 lightedge-brightness-260 flex size-12 shrink-0 items-center justify-center rounded-2xl text-zinc-500 dark:text-zinc-400">
                <CollectionGlyph icon={collection.icon} />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-medium">{collection.title}</span>
                  {collection.soon ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      敬请期待
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {collection.description}
                </span>
                {meta ? (
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {meta}
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={collection.id}>
              {clickable ? (
                <Link
                  href={collection.href as string}
                  className={`${cardClass} transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900`}
                >
                  {body}
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className={`${cardClass} cursor-not-allowed opacity-60`}
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* 分类图标：与 nothing-here.tsx 同一套线框画法（24 网格 / currentColor / 1.5 线宽） */
function CollectionGlyph({ icon }: { icon: CollectionIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      {icon === "music" ? (
        <>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </>
      ) : null}
      {icon === "image" ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m4 18 5-5 4 4 3-3 4 4" />
        </>
      ) : null}
    </svg>
  );
}
