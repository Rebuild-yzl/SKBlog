import "katex/dist/katex.min.css";
// \ce{} 这类化学式要靠 mhchem 扩展注册到 katex 上；必须在 rehype-katex 渲染前执行
import "katex/contrib/mhchem";
import type { ComponentProps } from "react";
import { MarkdownAsync, type Components, type ExtraProps } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import Callout from "./callout";
import NoteImage from "./note-image";
import { getNoteImage } from "@/lib/note-images";
import {
  remarkObsidianCallouts,
  remarkObsidianImages,
} from "@/lib/obsidian-syntax.mjs";

/*
 * 笔记正文的 Markdown 渲染（服务端组件，构建期跑完，客户端零 JS）。
 *
 * 插件链：GFM（表格/任务列表/删除线/脚注）→ 数学公式 → Obsidian 图片引用 → callout，
 * 再到 rehype 阶段渲染 KaTeX 与 Shiki 高亮。地址解析、语法转换全部发生在构建期，
 * 页面拿到的就是最终 HTML 结构。
 *
 * 刻意不做的事：不启用 rehype-raw（笔记里的原始 HTML 不解析，也就没有 HTML 注入通道）、
 * 不做标题锚点与目录、双链 [[笔记名]] 原样显示。
 */

/**
 * 代码块：深浅色各一套主题，靠 globals.css 里的 --shiki-dark* 变量随 .dark 切换。
 * 没写语言的围栏按纯文本处理（默认语言 text），这样也能拿到主题底色，而不是裸 <pre>。
 */
const SHIKI_OPTIONS = {
  themes: { light: "github-light", dark: "github-dark" },
  defaultLanguage: "text",
} as const;

/** hast 属性会被原样传成 props（例如 data-ref / data-photo-index），从 props 里取出来用 */
function extraProps(props: object): Record<string, unknown> {
  return props as Record<string, unknown>;
}

function MarkdownImage(props: ComponentProps<"img"> & ExtraProps) {
  const extra = extraProps(props);
  const ref = typeof extra["data-ref"] === "string" ? extra["data-ref"] : undefined;
  const rawIndex = extra["data-photo-index"];
  const photoIndex =
    typeof rawIndex === "string" && Number.isInteger(Number(rawIndex))
      ? Number(rawIndex)
      : undefined;
  const alt = typeof props.alt === "string" ? props.alt : undefined;

  // 构建期清单里有的引用（含外链）：url / 宽高 / 缺失状态都从清单来
  if (ref) {
    return (
      <NoteImage
        image={getNoteImage(ref, alt)}
        alt={alt}
        photoIndex={photoIndex}
        className="w-full rounded-2xl"
        sizes="(min-width: 1024px) 48rem, 100vw"
      />
    );
  }

  // 兜底：不是笔记里的引用（理论上走不到），按普通图片渲染
  const src = typeof props.src === "string" ? props.src : undefined;
  return (
    <NoteImage
      image={{ url: src, alt, ref: src ?? "" }}
      alt={alt}
      className="w-full rounded-2xl"
      sizes="(min-width: 1024px) 48rem, 100vw"
    />
  );
}

function MarkdownBlockquote({
  children,
  ...props
}: ComponentProps<"blockquote"> & ExtraProps) {
  const extra = extraProps(props);
  const type = extra["data-callout"];

  // callout 与普通引用共用 blockquote：有 data-callout 才是 callout（见 lib/obsidian-syntax.mjs）
  if (typeof type === "string" && type) {
    const title = extra["data-callout-title"];
    const fold = extra["data-callout-fold"];
    return (
      <Callout
        type={type}
        title={typeof title === "string" ? title : undefined}
        fold={typeof fold === "string" ? fold : undefined}
      >
        {children}
      </Callout>
    );
  }

  return <blockquote>{children}</blockquote>;
}

function MarkdownLink({ href, title, children }: ComponentProps<"a"> & ExtraProps) {
  // 站外链接新开标签页（笔记里的外链是用户自己点的，不是页面资源请求）
  const external = typeof href === "string" && /^https?:/i.test(href);
  if (external) {
    return (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <a href={href} title={title}>
      {children}
    </a>
  );
}

const COMPONENTS: Components = {
  img: MarkdownImage,
  blockquote: MarkdownBlockquote,
  a: MarkdownLink,
};

/*
 * 用 MarkdownAsync（而不是同步版 Markdown）：Shiki 要在第一次用到时才按需加载语法与主题，
 * 插件本身是异步的，同步的 runSync 会直接报「runSync finished async」。
 * 页面都是构建期静态渲染，异步这里没有额外代价。
 */
export default async function Markdown({
  content,
  photoRefs,
}: {
  content: string;
  /**
   * 这次内容里算作「照片」的引用，按出现顺序（博客传 post.images 的 ref 列表）。
   * 传了它，独占一行的图片会带上 data-photo-index，点开图片详情时才对得上号；
   * 不传（例如渲染相册里的图片说明）就不编号。
   */
  photoRefs?: string[];
}) {
  return (
    <MarkdownAsync
      remarkPlugins={[
        remarkGfm,
        remarkMath,
        [remarkObsidianImages, { getImage: getNoteImage, photoRefs }],
        remarkObsidianCallouts,
      ]}
      rehypePlugins={[rehypeKatex, [rehypeShiki, SHIKI_OPTIONS]]}
      components={COMPONENTS}
    >
      {content}
    </MarkdownAsync>
  );
}
