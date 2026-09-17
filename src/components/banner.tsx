import Image from "next/image";

type BannerProps = {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export default function Banner({
  title = "About",
  subtitle = "A little about me, my work, and what I'm building.",
  imageSrc,
  imageAlt = "",
}: BannerProps) {
  // 卡片 + 16:9：图片按原始比例完整展示（不裁切），渐变兜底时用固定高度的小横幅
  const sizeClass = imageSrc ? "aspect-video" : "h-40 sm:h-56 lg:h-64";

  return (
    <section
      className={`relative isolate flex w-full items-end overflow-hidden rounded-3xl border-2 shadow-sm ${sizeClass}`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="100vw"
          loading="eager"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700" />
      )}

      {/* 文字各自装在半透明毛玻璃方块里，样式统一走 globals.css 的 glass-panel */}
      <div className="relative flex flex-col items-start gap-1 px-3 pb-3 sm:gap-2 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        <h1 className="glass-panel glass-panel-title font-semibold tracking-tight text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="glass-panel glass-panel-subtitle text-white/80">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
