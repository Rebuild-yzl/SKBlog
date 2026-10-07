"use client";

import { useState, type ReactNode } from "react";
import NoteImage from "./note-image";
import PhotoViewer, { type ViewerPhoto } from "./photo-viewer";
import type { NoteImageData } from "@/lib/note-images";

/*
 * 照片收藏页的主体：一张连续的瀑布流（每张图按自己的比例，全部照片混在一起，不再按相册分组），
 * 点任意一张打开图片详情遮罩，切换范围是**整个收藏页的连续列表**。
 *
 * 相册只作为图片的来源标注：网格里每张图左下角一个小胶囊，详情元数据里也有「相册」一行。
 * 缺图仍然占一个位置（渲染「图片未找到」提示块），但不可点、不进遮罩列表。
 */
export type BrowserPhoto = {
  image: NoteImageData;
  /** 这张图自己的说明（服务端渲染好的 Markdown），没有就不显示正文区 */
  caption?: ReactNode;
};

export type BrowserAlbum = {
  id: string;
  name: string;
  photos: BrowserPhoto[];
};

export default function PhotoBrowser({ albums }: { albums: BrowserAlbum[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 遮罩用的连续列表：缺图跳过，所以格子上要记住自己对应的列表下标
  const viewerPhotos: ViewerPhoto[] = [];
  const gridPhotos = albums.flatMap((album) =>
    album.photos.map((photo, position) => {
      const exists = !photo.image.missing && Boolean(photo.image.url);
      const index = exists ? viewerPhotos.length : -1;
      if (exists) {
        viewerPhotos.push({
          id: `${album.id}:${position}`,
          image: photo.image,
          caption: photo.caption,
          album: album.name,
        });
      }
      return {
        key: `${album.id}:${position}`,
        album: album.name,
        image: photo.image,
        index,
      };
    }),
  );

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {gridPhotos.map((item) => (
          <figure key={item.key} className="relative mb-3 break-inside-avoid">
            {item.index >= 0 ? (
              <button
                type="button"
                onClick={() => setOpenIndex(item.index)}
                aria-label={`查看《${item.album}》里的这张照片`}
                className="block w-full"
              >
                <NoteImage
                  image={item.image}
                  alt={`《${item.album}》的照片`}
                  className="w-full rounded-2xl"
                  sizes="(min-width: 1024px) 20rem, 50vw"
                />
              </button>
            ) : (
              <NoteImage
                image={item.image}
                alt={`《${item.album}》的照片`}
                className="w-full rounded-2xl"
                sizes="(min-width: 1024px) 20rem, 50vw"
              />
            )}

            <span className="glass-panel pointer-events-none absolute bottom-2 left-2 text-[10px] text-white">
              {item.album}
            </span>
          </figure>
        ))}
      </div>

      {openIndex === null ? null : (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
