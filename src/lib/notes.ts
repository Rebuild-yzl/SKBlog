import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * 笔记仓库 → 博客内容的读取层（只在服务端/构建期使用，别在客户端组件里 import）。
 *
 * 分工：scripts/sync-notes.mjs 负责把笔记仓库拉到本地（默认 .notes/），
 * 这里只负责「读文件 + 按 frontmatter 过滤」。
 *
 * 发布规则是白名单：只有 frontmatter 里显式写 publish: true 的笔记才会出现在站点上。
 * 私有笔记、草稿、随手记不需要做任何处理，默认就是不上站。
 *
 * 当前阶段正文按纯文本输出（保留原始换行），不做 Markdown 渲染，
 * 所以 [[双链]]、![[嵌入]]、> [!note] 这些都会原样显示 —— 先把内容链路打通，渲染后补。
 */

export type Post = {
  /** URL 里用的标识，来自 frontmatter.slug，缺省时由文件名推导 */
  slug: string;
  title: string;
  date: Date;
  description?: string;
  tags: string[];
  /** Markdown 正文原文（已去掉 frontmatter），当前直接当纯文本展示 */
  body: string;
  /** 源文件相对笔记仓库的路径，构建报错时方便定位 */
  source: string;
};

const MD_PATTERN = /\.mdx?$/i;

/** 笔记仓库根目录：SKBLOG_NOTES_DIR 优先，否则是同步脚本拉下来的 .notes/。 */
function notesRoot(): string {
  const configured = process.env.SKBLOG_NOTES_DIR?.trim();
  if (configured) {
    // 路径来自环境变量，Turbopack 静态分析无法收敛，会退化成「追踪整个项目」；
    // 这里按官方提示显式豁免（笔记只在构建期读取，不需要被追踪进部署产物）。
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return path.join(process.cwd(), ".notes");
}

/** 可选：只扫描笔记仓库里的某个子目录（例如 Blog），避免把整个 vault 都当成候选。 */
function notesSubdir(): string | undefined {
  return process.env.SKBLOG_NOTES_SUBDIR?.trim() || undefined;
}

function walkMarkdown(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // 跳过 .obsidian / .trash / .git 这类隐藏目录
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, found);
    else if (entry.isFile() && MD_PATTERN.test(entry.name)) found.push(full);
  }
  return found;
}

/**
 * 文件名 → URL slug。
 * 保留中日韩等 Unicode 字母与数字（浏览器会做百分号编码），
 * 其余字符统一折叠成连字符；要更漂亮的 URL 就在 frontmatter 里写 slug。
 */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** frontmatter 里的日期可能是 Date（YAML 解析结果）或字符串。 */
function coerceDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isPublished(value: unknown): boolean {
  return value === true || value === "true";
}

function readPost(file: string, root: string): Post | undefined {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  if (!isPublished(data.publish)) return undefined;

  const relative = path.relative(root, file).split(path.sep).join("/");
  const baseName = path.basename(file, path.extname(file));
  const slug =
    (typeof data.slug === "string" && data.slug.trim()
      ? slugify(data.slug)
      : "") || slugify(baseName);

  if (!slug) {
    throw new Error(`笔记缺少可用的 slug（文件名或 frontmatter.slug）：${relative}`);
  }

  // 日期优先取 frontmatter；其次是文件名开头的 YYYY-MM-DD；
  // 最后才退回文件修改时间 —— 注意深浅克隆出来的 mtime 是「检出时间」，
  // 所以在 CI 上依赖 mtime 会让所有没写 date 的笔记都挤在同一天。
  const date =
    coerceDate(data.date) ??
    coerceDate(data.created) ??
    coerceDate(baseName.match(/^\d{4}-\d{2}-\d{2}/)?.[0]) ??
    fs.statSync(file).mtime;

  return {
    slug,
    // 标题只认 frontmatter.title，缺省用文件名 —— 刻意不读正文里的 `# 标题`：
    // 正文标题是给人看的，改了不该连带动列表页、<title> 和 URL。
    title: (typeof data.title === "string" && data.title.trim()) || baseName,
    date,
    description:
      (typeof data.description === "string" && data.description.trim()) ||
      undefined,
    tags: toStringArray(data.tags),
    body: content,
    source: relative,
  };
}

function collectPosts(): Post[] {
  const subdir = notesSubdir();
  const root = subdir
    ? path.join(/* turbopackIgnore: true */ notesRoot(), subdir)
    : notesRoot();

  if (!fs.existsSync(root)) {
    const message = `找不到笔记目录：${root}。请先运行 npm run notes:sync，或设置 SKBLOG_NOTES_DIR 指向本地笔记仓库。`;
    // 生产构建里缺目录属于配置错误，直接失败（避免把空博客发上线）；
    // 开发时只警告并当作「一篇文章都没有」，不配笔记也能照常调页面样式。
    if (process.env.NODE_ENV === "production") throw new Error(message);
    console.warn(`[notes] ${message}`);
    return [];
  }

  const posts: Post[] = [];
  const bySlug = new Map<string, string>();

  for (const file of walkMarkdown(root)) {
    const post = readPost(file, root);
    if (!post) continue;

    const existing = bySlug.get(post.slug);
    if (existing) {
      // 同一个 slug 会让文章互相覆盖，属于内容错误，直接让构建失败而不是静默丢文章。
      throw new Error(
        `slug 冲突：「${post.slug}」同时来自 ${existing} 和 ${post.source}，请在 frontmatter 里指定不同的 slug。`,
      );
    }
    bySlug.set(post.slug, post.source);
    posts.push(post);
  }

  return posts.sort(
    (a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title),
  );
}

// 生产构建里内容不会变，读一次就够；开发时每次都重新读，改完笔记刷新页面即可看到。
let cachedPosts: Post[] | undefined;

export function getAllPosts(): Post[] {
  if (process.env.NODE_ENV === "production") {
    cachedPosts ??= collectPosts();
    return cachedPosts;
  }
  return collectPosts();
}

/**
 * 动态段的参数由 Next 原样透传，并不保证已解码 —— 实测同一个请求里，
 * 页面组件拿到的中文 slug 是百分号编码（`%E6%B5%8B%E8%AF%95blog`），
 * generateMetadata 拿到的却是解码后的中文，结果一边命中、一边 404。
 * 这里统一解码一次，两种形态都能查到；解码失败（不是合法编码）就按原样比较。
 */
function normalizeSlug(slug: string): string {
  if (!slug.includes("%")) return slug;
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getPostBySlug(slug: string): Post | undefined {
  const target = normalizeSlug(slug);
  return getAllPosts().find((post) => post.slug === target);
}

/** 统一用 YYYY-MM-DD，避免不同环境的本地化格式导致服务端/客户端输出不一致。 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
