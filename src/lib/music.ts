import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { scanMusicNotes } from "./music-notes.mjs";

/**
 * 音乐收藏的数据层（只在服务端/构建期使用）。
 *
 * 分工和博客那边一致：
 *   - 歌曲清单来自笔记仓库里 `type: music` 的笔记，解析规则见 music-notes.mjs；
 *   - 歌名/歌手/封面由 scripts/fetch-music-meta.mjs 在构建期抓取，缓存到 .cache/music-meta.json；
 *   - 音频地址**不缓存**（第三方接口给的是带签名的临时地址），播放时由浏览器直接向解析接口取。
 */

export type Song = {
  /** 网易云歌曲 ID */
  id: string;
  title: string;
  artist?: string;
  cover?: string;
  /** 笔记里跟在 ID 后面的显示文字 */
  note?: string;
};

export type Playlist = {
  /** 目录相对路径，仓库根目录下的音乐笔记是 "root" */
  id: string;
  /** 歌单名：目录最后一段，根目录下叫「未分类」 */
  name: string;
  songs: Song[];
};

export const DEFAULT_MUSIC_API = "https://api.injahow.cn/meting/";

/** 解析接口地址：默认 injahow（实测可用、CORS 开放、302 到网易云 CDN） */
export function musicApiBase(): string {
  return process.env.SKBLOG_MUSIC_API?.trim() || DEFAULT_MUSIC_API;
}

/** 网易云上的原始页面，播放失败时的兜底出口 */
export function neteaseSongPage(id: string): string {
  return `https://music.163.com/#/song?id=${id}`;
}

type Meta = Record<string, { title?: string; artist?: string; cover?: string }>;

function notesRoot(): string {
  const configured = process.env.SKBLOG_NOTES_DIR?.trim();
  if (configured) {
    // 路径来自环境变量，Turbopack 无法静态收敛（同 notes.ts 的处理）
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return path.join(process.cwd(), ".notes");
}

function metaFile(): string {
  return path.join(process.cwd(), ".cache", "music-meta.json");
}

function readMeta(): Meta {
  const file = metaFile();
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    // 缓存坏了不影响出页面：退回笔记里写的显示文字
    return {};
  }
}

export function getPlaylists(): Playlist[] {
  const root = notesRoot();
  if (!existsSync(root)) return [];

  const meta = readMeta();

  return scanMusicNotes(root).map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    songs: playlist.songs.map((song) => {
      const extra = meta[song.id];
      return {
        id: song.id,
        // 歌名优先级：构建期抓到的 > 笔记里写的显示文字 > 兜底
        title: extra?.title || song.note || `网易云 ${song.id}`,
        artist: extra?.artist,
        cover: extra?.cover,
        note: song.note,
      } satisfies Song;
    }),
  }));
}
