"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import NoteImage from "./note-image";
import type { NoteImageData } from "@/lib/note-images";

/*
 * 图片详情遮罩层（博客与照片收藏页共用）。
 *
 * 结构：大图 → 大图下方的缩略图横条（只渲染放得下的那几张，以当前图为中心）；
 * 大屏时详情在右侧、小屏时详情接在横条下面。图本身不放详情里，详情只有说明与元数据。
 * 索引由组件自己持有（左右切换不通知外部），调用方只负责「打开在第几张」与「关掉」。
 */

export type ViewerPhoto = {
  /** 稳定 key（同一个相册里同一张图可能被引用多次，所以不能只用 ref） */
  id: string;
  image: NoteImageData;
  /** 这张图自己的说明（调用方在服务端渲染好的 Markdown）；没有就不显示正文区 */
  caption?: ReactNode;
  /** 所属相册；照片页传，博客不传（博客用 sourceLabel 表达来源） */
  album?: string;
};

type Props = {
  photos: ViewerPhoto[];
  initialIndex: number;
  onClose: () => void;
  /** 详情区顶部那一行来源，例如「来自《某篇博客》」 */
  sourceLabel?: string;
};

/** 缩略图限高：宽度由「限高 × 该图宽高比」算出来，所以宽图自然更宽 */
const THUMB_HEIGHT = { small: 56, large: 72 };
/** 缩略图之间的间距，与 gap-2 对应；算窗口容量时要用同一个值 */
const THUMB_GAP = 8;

/** EXIF 分组 → 中文小标题（查表时统一转小写，exifr 有的分组名是大写） */
const EXIF_GROUP_LABELS: Record<string, string> = {
  ifd0: "图像",
  exif: "拍摄参数",
  gps: "位置",
  interop: "互操作",
  ihdr: "PNG 头",
};

function thumbWidth(image: NoteImageData, height: number): number {
  const ratio = image.width && image.height ? image.width / image.height : 1;
  return Math.round(height * ratio);
}

/**
 * 以当前图为中心，向两侧交替扩张，直到再加一张就超出容器宽度。
 * 宽度全部来自构建期清单，不测量 DOM，所以窗口随容器宽度变化是可预测的。
 */
function visibleRange(
  widths: number[],
  index: number,
  limit: number,
): { start: number; end: number } {
  let start = index;
  let end = index;
  let used = widths[index] ?? 0;
  let nextLeft = index - 1;
  let nextRight = index + 1;
  let preferLeft = true;

  while (nextLeft >= 0 || nextRight < widths.length) {
    let pick: number;
    if (preferLeft && nextLeft >= 0) pick = nextLeft;
    else if (!preferLeft && nextRight < widths.length) pick = nextRight;
    else if (nextLeft >= 0) pick = nextLeft;
    else pick = nextRight;

    if (pick === nextLeft) nextLeft -= 1;
    else nextRight += 1;
    preferLeft = !preferLeft;

    const width = widths[pick] ?? 0;
    if (used + THUMB_GAP + width > limit) break;
    used += THUMB_GAP + width;
    if (pick < start) start = pick;
    else end = pick;
  }

  return { start, end };
}

function formatBytes(bytes?: number): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** EXIF 的值格式化：常见几项说人话，其余原样显示 */
function formatExifValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (typeof value === "number") {
    if (key === "ExposureTime" && value > 0 && value < 1) {
      return `1/${Math.round(1 / value)} s`;
    }
    if (key === "FNumber") return `f/${value}`;
    if (key === "FocalLength") return `${value} mm`;
    if (key === "ISO") return `ISO ${value}`;
    if (key === "latitude" || key === "longitude") return value.toFixed(6);
    return String(Number(value.toFixed(4)));
  }
  return String(value);
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="ml-auto text-right font-mono break-all">{value}</dd>
    </div>
  );
}

function MetaSection({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {title}
      </h3>
      <dl className="flex flex-col gap-1">
        {rows.map((row) => (
          <MetaRow key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
    </section>
  );
}

/** 基础信息（不依赖 EXIF）+ exifr 的每个分组 */
function Metadata({
  photo,
  index,
  total,
}: {
  photo: ViewerPhoto;
  index: number;
  total: number;
}) {
  const { image } = photo;
  const size =
    image.width && image.height ? `${image.width} × ${image.height}` : undefined;
  const bytes = formatBytes(image.bytes);
  const basic = [
    size ? { label: "尺寸", value: size } : null,
    image.format ? { label: "格式", value: image.format.toUpperCase() } : null,
    bytes ? { label: "大小", value: bytes } : null,
    photo.album ? { label: "相册", value: photo.album } : null,
    { label: "序号", value: `${index + 1} / ${total}` },
    { label: "引用", value: image.ref },
  ].filter((row): row is { label: string; value: string } => row !== null);

  const groups = image.exif ? Object.entries(image.exif) : [];

  return (
    <div className="flex flex-col gap-4 text-xs">
      <MetaSection title="文件" rows={basic} />
      {groups.map(([group, tags]) => (
        <MetaSection
          key={group}
          title={EXIF_GROUP_LABELS[group.toLowerCase()] ?? group}
          rows={Object.entries(tags).map(([key, value]) => ({
            label: key,
            value: formatExifValue(key, value),
          }))}
        />
      ))}
    </div>
  );
}

export default function PhotoViewer({
  photos,
  initialIndex,
  onClose,
  sourceLabel,
}: Props) {
  const total = photos.length;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(total - 1, 0)),
  );
  const [stripWidth, setStripWidth] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(THUMB_HEIGHT.large);
  const stripRef = useRef<HTMLDivElement>(null);

  // 打开期间锁住页面滚动，关掉后还原
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Esc 关闭，左右方向键切图
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(0, current - 1));
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(total - 1, current + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, total]);

  // 缩略图限高随断点变（宽度由它算出来，所以高变了整个横条都要重算）
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () =>
      setThumbHeight(query.matches ? THUMB_HEIGHT.large : THUMB_HEIGHT.small);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // 横条实际能放下几张：容器宽度变了就重算窗口
  useEffect(() => {
    const element = stripRef.current;
    if (!element) return;
    const apply = () => setStripWidth(element.clientWidth);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (total === 0) return null;

  const currentIndex = Math.min(index, total - 1);
  const photo = photos[currentIndex];
  const widths = photos.map((item) =>
    stripWidth > 0
      ? Math.max(24, Math.min(thumbWidth(item.image, thumbHeight), stripWidth))
      : thumbWidth(item.image, thumbHeight),
  );
  const range = visibleRange(widths, currentIndex, stripWidth);

  const go = (step: number) =>
    setIndex((value) => Math.min(Math.max(value + step, 0), total - 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="图片详情"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="lightedge lightedge-solid relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-zinc-950"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-3 right-3 z-10 rounded-full border bg-white/80 p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-4"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            {/* 大图 */}
            <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
              <NoteImage
                image={photo.image}
                alt={photo.album ?? sourceLabel ?? ""}
                className="max-h-[50vh] w-auto max-w-full rounded-2xl object-contain lg:max-h-[70vh]"
                sizes="(min-width: 1024px) 60rem, 100vw"
              />
            </div>

            {/* 缩略图横条 */}
            <div className="flex items-center gap-2 border-t px-3 py-3 sm:px-4">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={currentIndex === 0}
                aria-label="上一张"
                className="shrink-0 rounded-full border p-1.5 transition-colors hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4"
                >
                  <path d="m14 7-5 5 5 5" />
                </svg>
              </button>

              <div
                ref={stripRef}
                className="flex min-w-0 flex-1 items-center justify-center overflow-hidden"
                style={{ gap: THUMB_GAP }}
              >
                {photos.slice(range.start, range.end + 1).map((item, offset) => {
                  const itemIndex = range.start + offset;
                  const active = itemIndex === currentIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      aria-label={`第 ${itemIndex + 1} 张`}
                      aria-current={active}
                      style={{ width: widths[itemIndex], height: thumbHeight }}
                      className={`shrink-0 overflow-hidden rounded-lg border transition-opacity ${
                        active ? "opacity-100" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <NoteImage
                        image={item.image}
                        alt=""
                        fit="cover"
                        sizes="200px"
                        className="size-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => go(1)}
                disabled={currentIndex === total - 1}
                aria-label="下一张"
                className="shrink-0 rounded-full border p-1.5 transition-colors hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4"
                >
                  <path d="m10 7 5 5-5 5" />
                </svg>
              </button>
            </div>
          </div>

          {/* 详情：说明在上、元数据在下，中间一条横线 */}
          <aside className="w-full shrink-0 overflow-y-auto p-5 lg:w-80 lg:border-l">
            {sourceLabel ? (
              <p className="text-xs tracking-wider text-zinc-500 dark:text-zinc-400">
                {sourceLabel}
              </p>
            ) : null}

            {photo.caption ? (
              <div className="prose prose-sm prose-zinc dark:prose-invert mt-2 max-w-none">
                {photo.caption}
              </div>
            ) : null}

            {sourceLabel || photo.caption ? <hr className="my-4" /> : null}

            <Metadata photo={photo} index={currentIndex} total={total} />
          </aside>
        </div>
      </div>
    </div>
  );
}
