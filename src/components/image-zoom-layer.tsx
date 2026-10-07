"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import PhotoViewer, { type ViewerPhoto } from "./photo-viewer";

/*
 * 博客正文的图片层：把服务端渲染好的正文包起来，用事件委托接住「点了正文里的图」。
 *
 * 这样图片数据只下发一份（不用给每张图各带一份列表），正文也仍然由服务端组件渲染；
 * 编号是构建期的 remark 插件写在 data-photo-index 上的，与传入的 photos 顺序一一对应，
 * 所以点哪张就打开在遮罩的哪一张，左右切换只在**这一篇博客的正文图**范围内。
 */
export default function ImageZoomLayer({
  photos,
  sourceLabel,
  children,
}: {
  photos: ViewerPhoto[];
  sourceLabel?: string;
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (photos.length === 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const raw = target
      .closest("[data-photo-index]")
      ?.getAttribute("data-photo-index");
    if (!raw) return;

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed >= photos.length) return;
    setIndex(parsed);
  };

  return (
    // 这一层只为委托点击而存在，contents 让它不参与布局
    <div className="contents" onClick={handleClick}>
      {children}
      {index === null ? null : (
        <PhotoViewer
          photos={photos}
          initialIndex={index}
          sourceLabel={sourceLabel}
          onClose={() => setIndex(null)}
        />
      )}
    </div>
  );
}
