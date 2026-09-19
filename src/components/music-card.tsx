import Image from "next/image";
import type { ReactNode } from "react";
import LightedgeBlurCard from "@/components/lightedge-blur-card";

/*
 * 音乐卡片 = 普通毛玻璃卡片 + 一层「封面副本背板」。
 *
 * 背板走 LightedgeBlurCard 的 backdrop 插槽：它画在卡片**下面**，所以卡片的
 * backdrop-filter（blur + brightness + saturate）会把它糊成一层带专辑颜色的磨砂底 ——
 * 和小播放条那招同源，区别是这里让副本铺满整张卡，而不是只有封面那一小块。
 *
 * 副本会放大一点再模糊，免得模糊把边缘露出空隙；上面那层半透明底（scrim）是给文字
 * 兜底对比度用的，觉得太灰或太亮就调这两个透明度。
 */
export default function MusicCard({
  cover,
  className = "",
  wrapperClassName = "",
  radiusClassName = "rounded-xl",
  children,
}: {
  /** 封面地址；没有封面就退化成普通卡片，不会留一层空背板 */
  cover?: string;
  className?: string;
  wrapperClassName?: string;
  radiusClassName?: string;
  children: ReactNode;
}) {
  return (
    <LightedgeBlurCard
      className={className}
      wrapperClassName={wrapperClassName}
      radiusClassName={radiusClassName}
      backdrop={
        cover ? (
          <div className="absolute inset-0">
            <Image
              src={cover}
              alt=""
              width={640}
              height={640}
              unoptimized
              className="size-full scale-125 object-cover blur-2xl saturate-150"
            />
            <div className="absolute inset-0 bg-white/45 dark:bg-black/55" />
          </div>
        ) : null
      }
    >
      {children}
    </LightedgeBlurCard>
  );
}
