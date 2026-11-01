import type { ReactNode } from "react";

type LightedgeBlurCardProps = {
  /** 卡片本体的附加类名（内边距、布局、字号等） */
  className?: string;
  /** 外壳的类名，用来定位/限宽（sticky、absolute inset-x-0、mx-auto max-w-5xl…） */
  wrapperClassName?: string;
  /** 圆角类，卡片与假 border 必须一致，默认 rounded-xl */
  radiusClassName?: string;
  /** 调假 border 用的类名（例如 lightedge-2 加粗、-lightedge-inset-1 让它再往外推） */
  borderClassName?: string;
  /**
   * 背板：渲染在外壳里、假 border 与玻璃层**之前**（也就是玻璃下面），自动铺满整卡并裁到圆角。
   * 玻璃层（blur-card）会把它糊成一层带色底——BackdropCard、播放条和名片的局部副本都靠它。
   */
  backdrop?: ReactNode;
  children: ReactNode;
};

/*
 * 毛玻璃卡片：外壳 + 背板 + 「假 border」+ 玻璃层 + 内容层。
 *
 * 结构上刻意把这三者拆开：
 *   <div class="relative">                只负责定位
 *     <div class="… backdrop">            背板（可选，画在玻璃下面）
 *     <div class="lightedge …">           假 border（画在玻璃外面，采样页面）
 *     <div class="blur-card absolute …">  玻璃层：背景 + backdrop-filter
 *     <div class="relative …">…</div>     内容层：文字、头像/封面环…
 *
 * 为什么假 border 不挂在玻璃层上：backdrop-filter 会创建 backdrop root，挂在玻璃层上的
 * 环只能采样到玻璃自己那层已模糊的结果，必须画在外面（docs/styling.md 有实测数据）。
 *
 * 为什么内容层和玻璃层平级：内容里的 lightedge 环（头像、封面高亮）也需要采样图片本身的
 * 边缘；如果把它们放进玻璃层里面，就同样被玻璃层的 backdrop root 挡住，亮边会消失。
 * 拆成平级后，玻璃只负责颜色和模糊，内容里的环继续工作。
 *
 * 假 border 默认 1px：环层外扩 1px、环自身 inset 0，环正好贴在卡片外缘，和 banner 的 1px
 * 亮边同宽。注意别写 Tailwind 的 -inset-0.5——它在间距刻度里是 2px，环会被推到卡片外
 * 2.5px，看着就变粗。个别位置要再调，仍可通过 borderClassName 传 lightedge-* 工具类覆盖。
 */
export default function LightedgeBlurCard({
  className = "",
  wrapperClassName = "",
  radiusClassName = "rounded-xl",
  borderClassName = "",
  backdrop,
  children,
}: LightedgeBlurCardProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      {backdrop ? (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 overflow-hidden ${radiusClassName}`}
        >
          {backdrop}
        </div>
      ) : null}
      <div
        aria-hidden
        className={`lightedge lightedge-1 pointer-events-none absolute -inset-px [--lightedge-inset:0px] ${radiusClassName} ${borderClassName}`}
      />
      <div
        aria-hidden
        className={`blur-card pointer-events-none absolute inset-0 ${radiusClassName}`}
      />
      <div
        className={`relative z-10 overflow-clip ${radiusClassName} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
