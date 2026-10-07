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
  /** 文件字节数（构建期读，详情面板用） */
  bytes?: number;
  /** 扩展名（小写、不带点，例如 jpg）；读不出时为 undefined */
  format?: string;
  /**
   * exifr 抽出来的 EXIF，按它自己的分组（ifd0 / exif / gps / interop …）原样存着；
   * 图片没有 EXIF（例如 PNG 截图）时没有这个字段。
   */
  exif?: Record<string, Record<string, unknown>>;
};

/** 正文里的一张图 + 它下面那段说明（下一个图片引用之前的文字） */
export type NotePhoto = {
  image: NoteImageData;
  /** 图片行之后到下一张图之前的 Markdown；紧跟着下一张图或者什么都没写时是 undefined */
  caption?: string;
};

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
 * 正文里的图片（按出现顺序）+ 每张图自己的说明。
 *
 * 只有「整行就是一个图片引用」的行才算一张图（与封面规则同一套判断）；图片行之后、
 * 下一张图之前的文字就是它的说明，页面在图片详情里原样渲染这段 Markdown。
 * 第一张图之前的文字属于笔记的前言，不进相册。
 */
export function bodyPhotos(body: string): NotePhoto[] {
  const lines = body.split(/\r?\n/);
  const photos: NotePhoto[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const caption = buffer.join("\n").trim();
    const last = photos.at(-1);
    if (caption && last && !last.caption) last.caption = caption;
    buffer = [];
  };

  for (const line of lines) {
    const refs = parseImageRefs(line);
    if (refs.length === 1 && line.trim() === refs[0].raw.trim()) {
      flush();
      photos.push({ image: getNoteImage(refs[0].raw, refs[0].alt) });
      continue;
    }
    buffer.push(line);
  }
  flush();

  return photos;
}
