"use client";

const STORAGE_KEY = "theme";

/**
 * 明暗切换按钮。
 *
 * 事实来源是 <html> 上的 .dark 类：由 layout.tsx 的内联脚本在首绘前按
 * localStorage / 系统偏好设好，这里只负责切换并记住用户的选择。
 * 按钮自身的图标与文案完全交给 CSS 的 dark: 变体，所以组件不需要任何 state，
 * 也就不存在服务端渲染与客户端不一致的问题。
 *
 * variant="menu"（默认）是折叠菜单里的一整行（图标 + 文案）；
 * variant="icon" 是桌面导航栏里的紧凑图标按钮，文案改用 sr-only 提供无障碍名称。
 */
export default function ThemeToggle({
  variant = "menu",
}: {
  variant?: "menu" | "icon";
}) {
  function toggle() {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // 隐私模式等禁用 localStorage 的场景，忽略即可
    }
  }

  const isIcon = variant === "icon";

  return (
    <button
      type="button"
      className={
        isIcon
          ? "inline-flex items-center justify-center rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
          : "flex items-center gap-3 rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
      }
      onClick={toggle}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="size-4 shrink-0"
        aria-hidden="true"
      >
        {/* 月亮：浅色下显示，点击切到深色 */}
        <path
          className="dark:hidden"
          d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5Z"
        />
        {/* 太阳：深色下显示，点击切到浅色 */}
        <g className="hidden dark:block">
          <circle cx="10" cy="10" r="3.5" />
          <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" />
        </g>
      </svg>
      {isIcon ? (
        <span className="sr-only">Toggle theme</span>
      ) : (
        <>
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:block">Light mode</span>
        </>
      )}
    </button>
  );
}
