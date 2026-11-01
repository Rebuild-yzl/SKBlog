import Image from "next/image";
import type { ReactNode } from "react";
import LightedgeBlurCard from "@/components/lightedge-blur-card";

type BackdropCardProps = {
  /** 背板图地址；不传（或传空）就退化成普通毛玻璃卡片，不渲染背板 */
  backgroundSrc?: string;
  /** 背板图的替代文本；背板是装饰，默认空字符串 */
  backgroundAlt?: string;
  /** 背板图自己的裁切/定位/模糊，默认铺满 + 放大 + 模糊 + 提饱和 */
  backgroundClassName?: string;
  /** 蒙层颜色（只传颜色），默认亮色白/45、暗色黑/55 */
  scrimClassName?: string;
  /** 卡片本体的附加类名（内边距、布局、字号等） */
  className?: string;
  /** 外壳的类名，用来定位/限宽 */
  wrapperClassName?: string;
  /** 圆角类，卡片、背板与假 border 必须一致，默认 rounded-xl */
  radiusClassName?: string;
  /** 调假 border 用的类名 */
  borderClassName?: string;
  children: ReactNode;
};

const DEFAULT_BACKGROUND =
  "size-full scale-125 object-cover blur-2xl saturate-150";
const DEFAULT_SCRIM = "bg-white/45 dark:bg-black/55";

/*
 * 带图片背板的毛玻璃卡片（原 MusicCard 的通用版）。
 *
 * 整张卡都铺图片背板的卡片用这个（目前是音乐卡片和名片）：背板图放大铺满卡片背面，压一层蒙层兜住对比度，
 * 再由玻璃层的 backdrop-filter 糊成带画面颜色的磨砂底；假 border 与玻璃层平级、画在
 * 玻璃外面，所以采样到的仍是卡片背后的页面。
 *
 * 迷你播放条不用整卡背板：它只要一张和卡片里封面同位置、同尺寸的小副本（见 music-player.tsx），
 * 所以那条走 LightedgeBlurCard 的 backdrop 插槽。
 *
 * 背板必须走 LightedgeBlurCard 的 backdrop 插槽（画在卡片外面、下面）：
 * 卡片带 backdrop-filter 会创建 backdrop root，把副本塞进卡片内部只会被它自己糊掉。
 *
 * 背板图是装饰性的（蒙层 + 卡片内容才是信息），默认 alt=""、外层 aria-hidden。
 */
export default function BackdropCard({
  backgroundSrc,
  backgroundAlt = "",
  backgroundClassName = DEFAULT_BACKGROUND,
  scrimClassName = DEFAULT_SCRIM,
  className = "",
  wrapperClassName = "",
  radiusClassName = "rounded-xl",
  borderClassName = "",
  children,
}: BackdropCardProps) {
  return (
    <LightedgeBlurCard
      className={className}
      wrapperClassName={wrapperClassName}
      radiusClassName={radiusClassName}
      borderClassName={borderClassName}
      backdrop={
        backgroundSrc ? (
          <div className="absolute inset-0">
            <Image
              src={backgroundSrc}
              alt={backgroundAlt}
              width={640}
              height={640}
              unoptimized
              className={backgroundClassName}
            />
            <div aria-hidden className={`absolute inset-0 ${scrimClassName}`} />
          </div>
        ) : null
      }
    >
      {children}
    </LightedgeBlurCard>
  );
}
