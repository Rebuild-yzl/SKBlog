import type { ReactNode } from "react";

type LightedgeBlurCardProps = {
  /** 卡片本体的附加类名（内边距、布局、字号等） */
  className?: string;
  /** 外壳的类名，用来定位/限宽（sticky、absolute inset-x-0、mx-auto max-w-5xl…） */
  wrapperClassName?: string;
  /** 圆角类，卡片与假 border 必须一致，默认 rounded-3xl */
  radiusClassName?: string;
  /** 调假 border 用的类名（例如 lightedge-2 加粗、-lightedge-inset-1 让它完全落在卡片外侧） */
  borderClassName?: string;
  children: ReactNode;
};

/*
 * 毛玻璃卡片：blur-card（半透明底 + backdrop-filter）+ 一条「假 border」。
 *
 * 结构上刻意让两者平级、并且把假 border 画在卡片**下面**：
 *   <div class="relative">              只负责定位
 *     <div class="lightedge …">         假 border（先画 → 在卡片下面）
 *     <div class="blur-card …">…</div>  卡片本体
 *   </div>
 *
 * 为什么不把描边直接挂在卡片上：backdrop-filter 会创建 backdrop root，卡片内部的一切
 * （包括自己的伪元素）只能采样到「自己那层已经模糊过的合成结果」，边缘提亮会失效
 * （docs/styling.md 里有实测数据）。搬到卡片外面之后，假 border 采样到的是卡片背后的页面，
 * 再压上 --lightedge-line 的色调，才是一条跟着背景走的模拟描边。
 *
 * 画在下面而不是上面，是为了让它的采样范围里不含卡片本身。环的粗细与位置继续用现成的
 * lightedge-* 工具类调，通过 borderClassName 传进来。
 */
export default function LightedgeBlurCard({
  className = "",
  wrapperClassName = "",
  radiusClassName = "rounded-xl",
  borderClassName = "",
  children,
}: LightedgeBlurCardProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        aria-hidden
        className={`lightedge lightedge-4 pointer-events-none absolute -inset-0.5 ${radiusClassName} ${borderClassName}`}
      />
      <div className={`blur-card relative ${radiusClassName} ${className}`}>
        {children}
      </div>
    </div>
  );
}
