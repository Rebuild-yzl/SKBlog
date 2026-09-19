import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/*
 * 音乐笔记的契约（页面与抓取脚本共用这一份解析，避免两边规则走偏）：
 *
 * - frontmatter 里写 `type: music` 的笔记才算音乐笔记，也不会再当博客发布；
 * - **目录 = 歌单**：只取该目录直属的笔记（子目录自成歌单），歌单名取目录最后一段，
 *   仓库根目录下的音乐笔记归入「未分类」；
 * - 正文里每行一个网易云歌曲 ID，可以只写 ID，也可以跟在后面写显示文字：
 *     - 347230
 *     - 347230 海阔天空 - Beyond
 *   同一篇里重复的 ID 去重，非列表行忽略（方便在正文里写说明）。
 */

/** 行首是列表项、后面第一个 5 位以上的数字当作歌曲 ID */
const SONG_LINE = /^\s*[-*+]\s+(\d{5,})(?:\s+(.*))?$/;

const MD_PATTERN = /\.mdx?$/i;

function walkMarkdown(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // 跳过 .obsidian / .trash 这类隐藏目录
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, found);
    else if (entry.isFile() && MD_PATTERN.test(entry.name)) found.push(full);
  }
  return found;
}

/**
 * @param {string} notesRoot 笔记仓库根目录
 * @returns {{ id: string, name: string, songs: { id: string, note?: string }[] }[]}
 */
export function scanMusicNotes(notesRoot) {
  /** @type {Map<string, { id: string, name: string, songs: { id: string, note?: string }[] }>} */
  const playlists = new Map();

  for (const file of walkMarkdown(notesRoot)) {
    const { data, content } = matter(readFileSync(file, "utf8"));
    if (data.type !== "music") continue;

    const dirs = path
      .relative(notesRoot, path.dirname(file))
      .split(path.sep)
      .filter(Boolean);
    const id = dirs.join("/") || "root";

    let playlist = playlists.get(id);
    if (!playlist) {
      playlist = {
        id,
        name: dirs.length > 0 ? dirs[dirs.length - 1] : "未分类",
        songs: [],
      };
      playlists.set(id, playlist);
    }

    const seen = new Set(playlist.songs.map((song) => song.id));
    for (const line of content.split(/\r?\n/)) {
      const match = SONG_LINE.exec(line);
      if (!match) continue;
      const songId = match[1];
      if (seen.has(songId)) continue;
      seen.add(songId);
      playlist.songs.push({
        id: songId,
        // 顺手去掉「ID - 名字」里那个连接用的破折号/冒号，免得显示成 "- 名字"
        note: match[2]?.trim().replace(/^[-–—:：]\s*/, "") || undefined,
      });
    }
  }

  // 只保留真的有歌的歌单，并按路径排序（根目录的 root 排最前）
  return [...playlists.values()]
    .filter((playlist) => playlist.songs.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
}
