type NothingHereProps = {
  /** 主文案 */
  title?: string;
  /** 补充说明 */
  description?: string;
};

/*
 * 空态占位：只做居中排版，不套卡片（卡片式提示见 notice-card.tsx）。
 * 给还没有内容的页面用（blogs / works / participate / favorites / projects），
 * 文案需要各自定制时传 title / description 即可。
 */
export default function NothingHere({
  title = "Nothing here yet",
  description = "This page is still in development.",
}: NothingHereProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center font-sans">
      {/* 空箱子图标：线框画法，颜色跟着 currentColor 走 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-10 text-zinc-400 dark:text-zinc-600"
        aria-hidden="true"
      >
        <path d="M12 3.5 20.5 8v8L12 20.5 3.5 16V8z" />
        <path d="M3.5 8 12 12.5 20.5 8" />
        <path d="M12 12.5v8" />
      </svg>

      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
