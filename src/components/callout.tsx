import type { ReactNode } from "react";

/*
 * Obsidian callout（`> [!info]`）的渲染。
 *
 * 类型按 Obsidian 默认主题分成八组，每组一套颜色 + 一个线框图标；认不出的类型走 note 那组，
 * 所以以后 Obsidian 加新类型时最差也只是显示成蓝色 Note。
 * 折叠标记（`[!info]-` / `[!info]+`）用原生 <details>/<summary>，不需要任何客户端 JS。
 */

type CalloutGroup =
  | "note"
  | "tip"
  | "success"
  | "question"
  | "warning"
  | "failure"
  | "example"
  | "quote";

/** Obsidian 的类型别名 → 分组 */
const ALIASES: Record<string, CalloutGroup> = {
  note: "note",
  info: "note",
  todo: "note",
  important: "tip",
  tip: "tip",
  hint: "tip",
  abstract: "tip",
  summary: "tip",
  tldr: "tip",
  success: "success",
  check: "success",
  done: "success",
  question: "question",
  help: "question",
  faq: "question",
  warning: "warning",
  caution: "warning",
  attention: "warning",
  failure: "failure",
  fail: "failure",
  missing: "failure",
  danger: "failure",
  error: "failure",
  bug: "failure",
  example: "example",
  quote: "quote",
  cite: "quote",
};

type GroupStyle = {
  /** 默认标题（笔记里没写自定义标题时显示） */
  label: string;
  /** 左边那条色带：宽度 + 颜色 */
  accent: string;
  /** 底色与标题色 */
  body: string;
  icon: ReactNode;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-4 shrink-0",
};

const GROUPS: Record<CalloutGroup, GroupStyle> = {
  note: {
    label: "Note",
    accent: "border-l-4 border-l-blue-500",
    body: "bg-blue-500/5 text-blue-700 dark:text-blue-300",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" />
        <path d="M4 20v-3.5" />
      </svg>
    ),
  },
  tip: {
    label: "Tip",
    accent: "border-l-4 border-l-cyan-500",
    body: "bg-cyan-500/5 text-cyan-700 dark:text-cyan-300",
    icon: (
      <svg {...iconProps}>
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9V18h7v-4.1A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
  success: {
    label: "Success",
    accent: "border-l-4 border-l-green-500",
    body: "bg-green-500/5 text-green-700 dark:text-green-300",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.5 2.5L16 9.5" />
      </svg>
    ),
  },
  question: {
    label: "Question",
    accent: "border-l-4 border-l-amber-500",
    body: "bg-amber-500/5 text-amber-700 dark:text-amber-300",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.7" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  warning: {
    label: "Warning",
    accent: "border-l-4 border-l-orange-500",
    body: "bg-orange-500/5 text-orange-700 dark:text-orange-300",
    icon: (
      <svg {...iconProps}>
        <path d="M12 4.5 21 19.5H3z" />
        <path d="M12 10v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  failure: {
    label: "Failure",
    accent: "border-l-4 border-l-red-500",
    body: "bg-red-500/5 text-red-700 dark:text-red-300",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9.5 9.5 5 5" />
        <path d="m14.5 9.5-5 5" />
      </svg>
    ),
  },
  example: {
    label: "Example",
    accent: "border-l-4 border-l-purple-500",
    body: "bg-purple-500/5 text-purple-700 dark:text-purple-300",
    icon: (
      <svg {...iconProps}>
        <path d="M8 7h12" />
        <path d="M8 12h12" />
        <path d="M8 17h12" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    ),
  },
  quote: {
    label: "Quote",
    accent: "border-l-4 border-l-zinc-400",
    body: "bg-zinc-500/5 text-zinc-600 dark:text-zinc-300",
    icon: (
      <svg {...iconProps}>
        <path d="M9 7c-2 1-3 2.6-3 5v5h4v-5H7.5C7.5 10.7 8 9.6 9.5 9z" />
        <path d="M18 7c-2 1-3 2.6-3 5v5h4v-5h-2.5c0-1.3.5-2.4 2-3z" />
      </svg>
    ),
  },
};

export default function Callout({
  type,
  title,
  fold,
  children,
}: {
  /** 笔记里写的类型（`[!info]` 里的 info），大小写不敏感、认不出来就走 note */
  type: string;
  /** `> [!info] 自定义标题` 里的自定义标题 */
  title?: string;
  /** `-` 默认折叠、`+` 默认展开、空字符串是不可折叠 */
  fold?: string;
  children?: ReactNode;
}) {
  const group = GROUPS[ALIASES[type] ?? "note"];
  const label = title?.trim();
  const heading = (
    <>
      {group.icon}
      <span>{label || group.label}</span>
    </>
  );

  // 正文里的段落自带 prose 的上下外边距，这里收掉首尾两条，callout 才不会显得上下发胖
  const bodyClass =
    "mt-1 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0";

  if (fold === "+" || fold === "-") {
    return (
      <details
        open={fold === "+"}
        className={`group my-6 overflow-hidden rounded-r-lg ${group.accent} ${group.body}`}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 font-medium">
          <svg
            {...iconProps}
            className="size-4 shrink-0 transition-transform group-open:rotate-90"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
          {heading}
        </summary>
        <div className={`px-4 pb-3 ${bodyClass}`}>{children}</div>
      </details>
    );
  }

  return (
    <aside className={`my-6 rounded-r-lg px-4 py-3 ${group.accent} ${group.body}`}>
      <p className="flex items-center gap-2 font-medium">{heading}</p>
      <div className={bodyClass}>{children}</div>
    </aside>
  );
}
