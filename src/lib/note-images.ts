import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseImageRefs } from "./note-images.mjs";

/**
 * 图片数据层（只在服务端/构建期使用）。
 *
 * 所有解析都在构建期完成：scripts/sync-note-images.mjs 把笔记里的相对引用转成站内绝对地址，
 * 写进 .cache/note-images.json（键是原始引用字符串）。这里只做查表 —— 运行时不再推断相对路径。
 */

export type NoteImageData = {
  /** 站内绝对地址；外链是原始 URL；缺失时没有 */
  url?: string;
  width?: number;
  height?: number;
  alt?: string;
  /** 构建期没找到这张图 */
  missing?: boolean;
  /** 原始引用字符串，缺失提示里会显示 */
  ref: string;
  /** 引用它的笔记（诊断用） */
  note?: string;
};

export type NoteBodyBlock =
  | { type: "text"; text: string }
  | { type: "image"; image: NoteImageData };

type Manifest = Record<string, NoteImageData>;

function readManifest(): Manifest {
  const file = path.join(process.cwd(), ".cache", "note-images.json");
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Manifest;
  } catch {
    // 清单坏了不该让页面崩：一律当作「没找到」
    return {};
  }
}

// 生产构建里内容不会变，读一次就够；开发时每次重新读，改完笔记刷新就能看到
let cachedManifest: Manifest | undefined;

function manifest(): Manifest {
  if (process.env.NODE_ENV === "production") {
    cachedManifest ??= readManifest();
    return cachedManifest;
  }
  return readManifest();
}

/** 查一张图。清单里没有这条引用时也返回对象（missing），调用方不需要判空。 */
export function getNoteImage(ref: string, alt?: string): NoteImageData {
  const entry = manifest()[ref];
  return { ...(entry ?? { missing: true }), ref, alt: alt ?? entry?.alt };
}

/**
 * 正文**第一行**整行就是一个图片引用 → 它就是这篇的封面（并从正文里去掉这一行，
 * 以及紧随其后的 `---` 分隔线）；第一行不是图片就当作「这篇没有封面」。
 */
export function firstLineImage(body: string): {
  cover: NoteImageData | null;
  rest: string;
} {
  const lines = body.split(/\r?\n/);
  const first = lines[0] ?? "";
  const refs = parseImageRefs(first);
  if (refs.length !== 1 || first.trim() !== refs[0].raw.trim()) {
    return { cover: null, rest: body };
  }

  let index = 1;
  while (index < lines.length && lines[index].trim() === "") index += 1;
  if (index < lines.length && lines[index].trim() === "---") index += 1;

  return {
    cover: getNoteImage(refs[0].raw, refs[0].alt),
    rest: lines.slice(index).join("\n").trimStart(),
  };
}

/**
 * 把正文切成「文本块 + 图片块」：整行是一个图片引用的行单独成块，其余连续行原样保留为文本块
 * （当前仍是纯文本展示，接 Markdown 渲染后这套块渲染会被替换）。
 */
export function bodyBlocks(body: string): NoteBodyBlock[] {
  const lines = body.split(/\r?\n/);
  const blocks: NoteBodyBlock[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n");
    if (text.trim()) blocks.push({ type: "text", text });
    buffer = [];
  };

  for (const line of lines) {
    const refs = parseImageRefs(line);
    if (refs.length === 1 && line.trim() === refs[0].raw.trim()) {
      flush();
      blocks.push({ type: "image", image: getNoteImage(refs[0].raw, refs[0].alt) });
      continue;
    }
    buffer.push(line);
  }
  flush();

  return blocks;
}

/** 正文里出现的全部图片（按出现顺序），照片相册等场景用 */
export function bodyImages(body: string): NoteImageData[] {
  return bodyBlocks(body)
    .filter((block): block is Extract<NoteBodyBlock, { type: "image" }> => block.type === "image")
    .map((block) => block.image);
}
