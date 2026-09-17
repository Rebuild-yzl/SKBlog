import type { ReactNode } from "react";

/** 卡片底部的主操作（按钮或链接）样式，三个状态页共用；边框颜色走全局 --border。 */
export const noticeActionPrimary =
  "rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

export const noticeActionSecondary =
  "rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10";

type NoticeCardProps = {
  /** 左上角的小标签，例如 "404"、"Error" */
  code: string;
  title: string;
  description: string;
  /** 需要用户反馈给开发者时显示的标识（错误页的 digest） */
  reference?: string;
  /** 底部操作区（按钮/链接） */
  children?: ReactNode;
};

/*
 * 错误页与 404 页共用的卡片：外观和 profile.tsx 保持一致
 * （lightedge 描边 + 卡片底色 + 圆角 + 居中排版）。
 */
export default function NoticeCard({
  code,
  title,
  description,
  reference,
  children,
}: NoticeCardProps) {
  return (
    <section className="lightedge lightedge-solid w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10 dark:bg-zinc-950">
      <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {code}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{description}</p>

      {reference ? (
        <p className="mt-3 font-mono text-xs break-all text-zinc-500 dark:text-zinc-500">
          Reference: {reference}
        </p>
      ) : null}

      {children ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      ) : null}
    </section>
  );
}
