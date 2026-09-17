"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./globals.css";
import NoticeCard, {
  noticeActionPrimary,
  noticeActionSecondary,
} from "@/components/notice-card";

/*
 * 最外层错误边界：只在整个根布局自己挂掉时接管，并且会【替换掉根布局】——
 * 所以它必须自己渲染 <html> / <body>、自己引入全局样式、自己决定主题
 * （文档明确说了自带的 500 页不带你的全局样式与主题，这也是要自己写它的原因）。
 *
 * 它是客户端组件，因此不能用 metadata 导出，标题直接写在 <head> 里。
 * 主题这里不能像根布局那样塞 <script>：客户端组件渲染出来的 script 不会执行，
 * 只能自己读 localStorage / 系统偏好（服务端渲染时先当浅色，客户端接管时会修正）。
 * 这里也拿不到 next/font 注入的字体变量（那来自根布局），所以不写 font-sans，
 * 让 globals.css 里 body 的字体栈生效即可。
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [dark] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const theme = localStorage.getItem("theme");
      return (
        theme === "dark" ||
        (theme !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 这里可以接错误上报服务
    console.error(error);
  }, [error]);

  return (
    <html
      lang="en"
      className={`h-full antialiased${dark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <title>Something went wrong · NeuroSaiKou</title>
      </head>
      <body className="flex min-h-full flex-col items-center justify-center p-6">
        <NoticeCard
          code="Error"
          title="Something went wrong"
          description="The application failed to load. Reloading the page usually fixes it."
          reference={error.digest}
        >
          <button type="button" onClick={() => retry()} className={noticeActionPrimary}>
            Try again
          </button>
          <Link href="/" className={noticeActionSecondary}>
            Back home
          </Link>
        </NoticeCard>
      </body>
    </html>
  );
}

