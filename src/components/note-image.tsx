import Image from "next/image";
import type { NoteImageData } from "@/lib/note-images";

/*
 * 统一的图片控件：调用方永远拿到一个能渲染的东西，不需要判空。
 *   - 正常：next/image（构建期拿到了宽高就用宽高，否则 fill 到一个带比例的框里）
 *   - 构建期没找到：渲染「图片未找到 + 原始引用」，画法与 nothing-here.tsx 一致（线框 + currentColor）
 *
 * 地址一律是构建期解析好的站内绝对路径（/notes-assets/…），这里不做任何相对路径推断。
 */
export default function NoteImage({
  image,
  alt,
  className = "",
  sizes = "100vw",
  aspectClassName = "aspect-video",
  fit = "contain",
  loading,
  fetchPriority,
  photoIndex,
}: {
  image: NoteImageData;
  alt?: string;
  /** 加在 <img>（或 fill 模式的外框）上的类名 */
  className?: string;
  sizes?: string;
  /** fill 模式下的外框比例 */
  aspectClassName?: string;
  /** fill 模式下图片怎么放进外框：contain 不裁切（默认），cover 铺满裁切 */
  fit?: "contain" | "cover";
  loading?: "eager" | "lazy";
  /** 首屏（LCP）大图配合 loading="eager" 一起用，Next 16 里它就是以前 priority 的替代 */
  fetchPriority?: "high" | "low" | "auto";
  /**
   * 这张图在「图片详情遮罩」列表里的下标；写在 <img> 上，由外层的图片层做点击委托。
   * 没有（缺图、外部图不在列表里）就不写，图片自然不可点。
   */
  photoIndex?: number;
}) {
  if (image.missing || !image.url) {
    return <MissingImage refName={image.ref} className={className} />;
  }

  const altText = alt ?? image.alt ?? "";
  const remote = /^https?:/i.test(image.url);

  if (image.width && image.height) {
    return (
      <Image
        src={image.url}
        alt={altText}
        width={image.width}
        height={image.height}
        sizes={sizes}
        unoptimized={remote}
        loading={loading}
        fetchPriority={fetchPriority}
        data-photo-index={photoIndex}
        className={className}
      />
    );
  }

  return (
    <span className={`relative block overflow-hidden ${aspectClassName} ${className}`}>
      <Image
        src={image.url}
        alt={altText}
        fill
        sizes={sizes}
        unoptimized
        loading={loading}
        fetchPriority={fetchPriority}
        data-photo-index={photoIndex}
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </span>
  );
}

/* 图片缺失时的提示：不套卡片，和 nothing-here.tsx 一个路子 */
function MissingImage({
  refName,
  className = "",
}: {
  refName: string;
  className?: string;
}) {
  return (
    <span
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-8 text-zinc-400 dark:text-zinc-600"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="m4 18 5-5 4 4 3-3 4 4" />
        <path d="M3.5 3.5l17 17" />
      </svg>
      <span className="text-sm font-medium">图片未找到</span>
      <span className="font-mono text-xs break-all text-zinc-500 dark:text-zinc-400">
        {refName}
      </span>
    </span>
  );
}
