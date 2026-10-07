import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/*
 * 笔记里图片引用的解析规则（构建期用，抓取脚本与页面共用这一份）：
 *
 *   Obsidian 嵌入   ![[name.jpg]] / ![[子目录/name.png]] / ![[name.jpg|别名或宽度]]
 *   标准写法        ![alt](path)
 *   外链            http(s):// 与 data: 原样引用，不拷贝
 *
 * 只认图片扩展名；![[某文档]] 这类非图片嵌入会被忽略。
 * 「相对引用 → 站内绝对地址」的转换全部发生在构建期（见 scripts/sync-note-images.mjs），
 * 页面层只消费已经解析好的绝对地址。
 */

export const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
]);

const EMBED_RE = /!\[\[([^\]\n]+)\]\]/g;
const MARKDOWN_IMAGE_RE = /!\[([^\]\n]*)\]\(([^)\n]+)\)/g;

export function isExternalTarget(target) {
  return /^(https?:|data:)/i.test(target);
}

export function isImageTarget(target) {
  return IMAGE_EXTENSIONS.has(path.extname(target).toLowerCase());
}

/**
 * 抽出一段文本里的图片引用。
 * @param {string} text
 * @returns {{ raw: string, target: string, kind: "embed" | "markdown", alt?: string, width?: number, index: number }[]}
 */
export function parseImageRefs(text) {
  const refs = [];

  for (const match of text.matchAll(EMBED_RE)) {
    const [rawTarget, ...rest] = match[1].split("|");
    const target = rawTarget.trim();
    const alias = rest.join("|").trim();
    refs.push({
      raw: match[0],
      target,
      kind: "embed",
      // Obsidian 里 `|` 后面写数字是显示宽度，写文字是别名
      alt: alias && !/^\d+$/.test(alias) ? alias : undefined,
      width: /^\d+$/.test(alias) ? Number(alias) : undefined,
      index: match.index ?? 0,
    });
  }

  for (const match of text.matchAll(MARKDOWN_IMAGE_RE)) {
    refs.push({
      raw: match[0],
      target: match[2].trim(),
      kind: "markdown",
      alt: match[1].trim() || undefined,
      index: match.index ?? 0,
    });
  }

  return refs
    .filter((ref) => isExternalTarget(ref.target) || isImageTarget(ref.target))
    .sort((a, b) => a.index - b.index);
}

/**
 * 把引用解析成磁盘上的文件。
 * Obsidian 嵌入优先在附件目录里找；标准 Markdown 写法优先按「相对当前笔记」找
 * （那是 Markdown 的原生语义），最后都兜到仓库根。
 * @returns {string | null} 绝对路径
 */
export function resolveReference(ref, { notesRoot, attachmentsRoot, noteDir }) {
  if (isExternalTarget(ref.target)) return null;

  const candidates =
    ref.kind === "embed"
      ? [
          path.resolve(attachmentsRoot, ref.target),
          path.resolve(noteDir, ref.target),
          path.resolve(notesRoot, ref.target),
        ]
      : [
          path.resolve(noteDir, ref.target),
          path.resolve(attachmentsRoot, ref.target),
          path.resolve(notesRoot, ref.target),
        ];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** 站内绝对地址：逐段百分号编码，中文与空格都能用 */
export function toPublicUrl(relativePath) {
  const segments = relativePath.split(path.sep).map(encodeURIComponent);
  return `/notes-assets/${segments.join("/")}`;
}

/**
 * 读图片宽高（只解析文件头，不引第三方依赖）。
 * 支持 PNG / JPEG / GIF；其它格式返回 null，调用方按「无尺寸」处理。
 */
export function readImageSize(file) {
  const buffer = readFileSync(file);

  // PNG: 8 字节签名 + IHDR，宽高是紧跟在 "IHDR" 之后的两个大端 u32
  if (buffer.length > 24 && buffer.toString("ascii", 12, 16) === "IHDR") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // GIF: 6 字节签名后是两个小端 u16
  if (buffer.length > 10 && buffer.toString("ascii", 0, 3) === "GIF") {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  // JPEG: 逐段找 SOF（0xC0–0xCF，跳过 0xC4/0xC8/0xCC），段里第 5/7 字节起是高/宽
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }

  return null;
}
