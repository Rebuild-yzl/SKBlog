import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { bodyPhotos, type NotePhoto } from "./note-images";

/**
 * 照片收藏的数据层（只在服务端/构建期使用）。
 *
 * 规则与音乐收藏同源：frontmatter 里写 `type: photos` 的笔记就是**一个相册**，
 * 正文里的图片按顺序进相册，每张图后面那段文字就是它自己的说明（图片详情里渲染）。
 * 这类笔记不会出现在 /blogs（见 notes.ts）。
 */

export type Album = {
  /** 相对笔记仓库的路径（去掉扩展名），用于 key 与排序 */
  id: string;
  /** 相册名：frontmatter.title，缺省用文件名 */
  name: string;
  photos: NotePhoto[];
  /** 源文件相对笔记仓库的路径 */
  source: string;
};

const MD_PATTERN = /\.mdx?$/i;

function notesRoot(): string {
  const configured = process.env.SKBLOG_NOTES_DIR?.trim();
  if (configured) {
    // 路径来自环境变量，Turbopack 静态分析收敛不了（同 notes.ts 的处理）
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return path.join(process.cwd(), ".notes");
}

function walkMarkdown(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, found);
    else if (entry.isFile() && MD_PATTERN.test(entry.name)) found.push(full);
  }
  return found;
}

function collectAlbums(): Album[] {
  const root = notesRoot();
  if (!fs.existsSync(/* turbopackIgnore: true */ root)) return [];

  const albums: Album[] = [];
  for (const file of walkMarkdown(root)) {
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    if (data.type !== "photos") continue;

    const photos = bodyPhotos(content);
    if (photos.length === 0) continue;

    const relative = path.relative(root, file).split(path.sep).join("/");
    const baseName = path.basename(file, path.extname(file));
    albums.push({
      id: relative.replace(MD_PATTERN, ""),
      name: (typeof data.title === "string" && data.title.trim()) || baseName,
      photos,
      source: relative,
    });
  }

  return albums.sort((a, b) => a.id.localeCompare(b.id));
}

// 生产构建里内容不会变，读一次就够；开发时每次重新读
let cachedAlbums: Album[] | undefined;

export function getAlbums(): Album[] {
  if (process.env.NODE_ENV === "production") {
    cachedAlbums ??= collectAlbums();
    return cachedAlbums;
  }
  return collectAlbums();
}

/** 所有相册里的照片总数，收藏分类页用来显示计数 */
export function countPhotos(albums: Album[]): number {
  return albums.reduce((sum, album) => sum + album.photos.length, 0);
}
