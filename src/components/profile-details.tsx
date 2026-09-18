import Image from "next/image";
import type { ReactNode } from "react";
import toolIcons from "@/lib/tool-icons.json";

type ToolIcon = {
  slug: string;
  label: string;
};

type ProfileDetailsProps = {
  /** 当前状态，例如「在校」 */
  status?: string;
  /** 状态右侧小胶囊里的文字，例如「2029届」 */
  cohort?: string;
  /** 所在地，精确到市 */
  location?: string;
  /** 联系邮箱，渲染成 mailto 链接 */
  email?: string;
  /** 工具图标清单，默认取 src/lib/tool-icons.json（也就是抓取脚本用的那份） */
  tools?: ToolIcon[];
};

/*
 * 名片的补充信息：现在（状态 + 地点）、联系（邮箱）、工具（图标行）。
 *
 * 刻意不套 lightedge / 卡片边框：它排在 Banner 与 Profile 两张卡片下面，
 * 作为普通内容区出现，靠小标题和间距分组，与博客那种描边卡片区分开。
 *
 * 两个 UI 小图标用内联线框 SVG（与 nothing-here.tsx 同一套画法：24 网格、
 * fill none、stroke currentColor、1.5 线宽），颜色跟着 currentColor 走，
 * 明暗两种主题都自适应；工具图标则是 skillicons 的固定品牌色。
 */
export default function ProfileDetails({
  status = "在校",
  cohort = "2029届",
  location = "中国 · 山东 · 聊城",
  email = "3065441861@qq.com",
  tools = toolIcons,
}: ProfileDetailsProps) {
  return (
    <section className="flex flex-col gap-6">
      <DetailGroup title="现在">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            {status}
            <span className="rounded-full lightedge px-1 py-0 text-xs">
              {cohort}
            </span>
          </span>
          <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <MapPinIcon />
            {location}
          </span>
        </div>
      </DetailGroup>

      <DetailGroup title="联系">
        <a
          href={`mailto:${email}`}
          className="flex w-fit items-center gap-2 text-sm hover:underline"
        >
          <MailIcon />
          {email}
        </a>
      </DetailGroup>

      <DetailGroup title="工具">
        {/* 图标行：窄屏自动换行；title 给鼠标悬停时的名称，alt 给读屏 */}
        <div className="flex flex-wrap items-center">
        <div className="lightedge flex rounded-md p-0.5">
            <ul className="flex flex-wrap items-center gap-1">
              {tools.map(({ slug, label }) => (
                <li key={slug} title={label}>
                  <Image
                    src={`/icons/toolchain/${slug}.svg`}
                    alt={label}
                    width={24}
                    height={24}
                    unoptimized
                    className="size-8"
                  />
                </li>
              ))}
            </ul>
            </div>
        </div>
      </DetailGroup>
      <DetailGroup title="关于我">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          我是一个热爱技术的开发者，喜欢探索新技术和解决问题。平时喜欢阅读技术文章和参与开源项目，希望不断提升自己的技能。
        </p>
      </DetailGroup>
      <DetailGroup title="关于本站">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          这个网站是我的个人博客和作品展示平台，记录了我的学习和工作经历。希望通过分享我的经验和见解，能够帮助到更多的人。
        </p>
        <div className="ml-2 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
          <DetailGroup title="本站技术栈">
            <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li>框架：Next.js 16（App Router，文章在构建时预渲染成静态页）</li>
              <li>语言 / UI：TypeScript（strict）+ React 19</li>
              <li>样式：Tailwind CSS 4，高亮边框为自研的 lightedge 工具类</li>
              <li>
                内容：写在自己的笔记仓库里（Obsidian + Git），构建时同步，只发布
                frontmatter 标了 publish: true 的笔记
              </li>
              <li>部署：Vercel</li>
            </ul>
          </DetailGroup>
          <DetailGroup title="本站开源">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              本站的
              <a
                href="https://github.com/Rebuild-yzl/SKBlog"
                rel="repo"
                className="underline"
              >
                源码
              </a>
              已开源，欢迎大家访问我的 GitHub 仓库，提出建议或贡献代码。
            </p>
          </DetailGroup>
        </div>
      </DetailGroup>
    </section>
  );
}

/*
 * 一组补充信息：小标题 + 内容。
 *
 * 想加一组就再写一个 <DetailGroup title="…">…</DetailGroup>（内容里怎么排都行，
 * 比如再套一层 flex 或 ul）。小标题的样式只写在这个函数里，改一处就全局生效。
 */
function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-md font-semibold tracking-wider text-zinc-500 dark:text-zinc-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* 定位图标（Feather 风格的线框画法），颜色走 currentColor */
function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/* 信封图标，同上 */
function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
      aria-hidden="true"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
