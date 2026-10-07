import type { Metadata } from "next";
import Link from "next/link";
import NoteImage from "@/components/note-image";
import NothingHere from "@/components/nothing-here";
import { countPhotos, getAlbums } from "@/lib/photos";

export const metadata: Metadata = {
  title: "图片收藏 | NeuroSaiKou",
  description: "NeuroSaiKou 收藏的照片",
};

export default function PhotoFavorites() {
  const albums = getAlbums();

  if (albums.length === 0) {
    return (
      <NothingHere
        title="还没有收藏照片"
        description="在笔记仓库里给一篇笔记加上 type: photos，正文里放几张图，就会出现在这里。"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 font-sans lg:px-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/favorites"
          className="w-fit text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Favorites
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          图片收藏
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {`${albums.length} 个相册、共 ${countPhotos(albums)} 张`}
        </p>
      </header>

      {albums.map((album, albumIndex) => {
        // 格子比例取相册第一张图的比例；尺寸未知时退回 4:3
        const first = album.images[0];
        const ratio =
          first?.width && first?.height
            ? `${first.width} / ${first.height}`
            : "4 / 3";

        return (
          <section key={album.id} className="flex flex-col gap-3">
            <h2 className="flex items-baseline gap-2 text-xs tracking-wider text-zinc-500 dark:text-zinc-400">
              {album.name}
              <span className="text-zinc-400 dark:text-zinc-500">
                {`${album.images.length} 张`}
              </span>
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {album.images.map((image, index) => (
                <li
                  key={`${album.id}-${index}`}
                  style={{ aspectRatio: ratio }}
                  className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                >
                  <NoteImage
                    image={image}
                    alt={`${album.name} ${index + 1}`}
                    fit="cover"
                    className="size-full object-cover"
                    sizes="(min-width: 1024px) 20rem, 50vw"
                    // 第一张照片通常就在首屏，同样按 LCP 处理
                    loading={albumIndex === 0 && index === 0 ? "eager" : "lazy"}
                    fetchPriority={
                      albumIndex === 0 && index === 0 ? "high" : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
