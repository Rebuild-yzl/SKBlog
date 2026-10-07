import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "@/components/markdown";
import NothingHere from "@/components/nothing-here";
import PhotoBrowser from "@/components/photo-browser";
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

  // 每张图的说明在服务端渲染成 React 节点再交给客户端组件：Markdown 那一套依赖不进程
  // 序包的客户端，遮罩打开时只负责把已经渲染好的内容放出来
  const browserAlbums = albums.map((album) => ({
    id: album.id,
    name: album.name,
    photos: album.photos.map((photo) => ({
      image: photo.image,
      caption: photo.caption ? <Markdown content={photo.caption} /> : undefined,
    })),
  }));

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

      <PhotoBrowser albums={browserAlbums} />
    </div>
  );
}
