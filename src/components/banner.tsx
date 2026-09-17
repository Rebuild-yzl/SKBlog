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
    // 卡片描边也走采样描边：inset:0 让环压在图片上（所以不要再用 border-2，否则会变成双层边）。
    // 卡片自己没有 backdrop-filter，::after 直接采样卡片内部的图片即可，不用外套一层壳。
    <section
      className={`lightedge relative isolate flex w-full items-end overflow-hidden rounded-3xl shadow-sm [--lightedge-inset:0px] ${sizeClass}`}
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

      {/* 文字各自装在半透明毛玻璃方块里：glass-panel 是面板本体，
          面板自带 backdrop-filter，所以描边必须由外面那层 lightedge 画 */}
      <div className="relative flex flex-col items-start gap-1 px-3 pb-3 sm:gap-2 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        <div className="lightedge rounded-[12px]">
          <h1 className="glass-panel glass-panel-title font-semibold tracking-tight text-white">
            {title}
          </h1>
        </div>
        {subtitle ? (
          <div className="lightedge rounded-[12px]">
            <p className="glass-panel glass-panel-subtitle text-white/80">
              {subtitle}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
