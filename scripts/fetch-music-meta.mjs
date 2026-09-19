#!/usr/bin/env node
/*
 * 构建/开发前抓取音乐收藏的元信息（歌名/歌手/封面），缓存到 .cache/music-meta.json。
 *
 * 为什么要缓存：这些信息不该让访客每次打开页面都去请求第三方接口；而**音频地址**相反，
 * 第三方给的是带签名的临时地址，缓存下来很快就失效，所以只在播放时由浏览器现取
 * （见 src/components/music-player.tsx）。
 *
 * 失败策略与 icons 不同：这里**只警告、不阻断构建**。理由是我方有兜底——拿不到元信息就用
 * 笔记里写的显示文字，缺封面就画个占位块；音乐是锦上添花，不该因为它发不出博客。
 *
 * 环境变量：
 *   SKBLOG_MUSIC_API   解析接口地址，默认 https://api.injahow.cn/meting/
 *   SKBLOG_MUSIC_SKIP  设为 1 跳过抓取，沿用已有缓存
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { scanMusicNotes } from "../src/lib/music-notes.mjs";

const projectRoot = path.dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const apiBase =
  process.env.SKBLOG_MUSIC_API?.trim() || "https://api.injahow.cn/meting/";
const cacheFile = path.join(projectRoot, ".cache", "music-meta.json");

function log(message) {
  console.log(`[music] ${message}`);
}

function warn(message) {
  console.warn(`[music] ${message}`);
}

function notesRoot() {
  const configured = process.env.SKBLOG_NOTES_DIR?.trim();
  return configured
    ? path.resolve(projectRoot, configured)
    : path.join(projectRoot, ".notes");
}

async function fetchMetaOnce(id) {
  const url = `${apiBase}?server=netease&type=song&id=${encodeURIComponent(id)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const list = await response.json();
  const song = Array.isArray(list) ? list[0] : list;
  if (!song) throw new Error("接口没有返回这首歌");
  // 接口查不到这首歌时会返回 { error: "unknown song" }，别把它当成"成功但没有字段"
  if (song.error) throw new Error(String(song.error));
  return {
    title: song.name || song.title || undefined,
    artist: song.artist || song.author || undefined,
    cover: song.pic || song.cover || undefined,
  };
}

/** 构建时依赖第三方，抖一次就丢元信息不划算，所以失败重试两次 */
async function fetchMeta(id) {
  const attempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchMetaOnce(id);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
  throw lastError;
}

async function main() {
  if (process.env.SKBLOG_MUSIC_SKIP === "1") {
    log("SKBLOG_MUSIC_SKIP=1，跳过抓取");
    return;
  }

  const root = notesRoot();
  if (!existsSync(root)) {
    warn(`找不到笔记目录 ${root}，跳过（先跑 npm run notes:sync）`);
    return;
  }

  const playlists = scanMusicNotes(root);
  const ids = [...new Set(playlists.flatMap((p) => p.songs.map((s) => s.id)))];
  if (ids.length === 0) {
    log("没有找到 type: music 的笔记，跳过");
    return;
  }

  log(`发现 ${playlists.length} 个歌单、${ids.length} 首歌，接口 ${apiBase}`);

  const meta = {};
  const failed = [];
  for (const id of ids) {
    try {
      const info = await fetchMeta(id);
      meta[id] = info;
      log(`抓取 ${id}：${info.title ?? "（无歌名）"}`);
    } catch (error) {
      failed.push(id);
      warn(`抓取 ${id} 失败：${error.message}`);
    }
  }

  mkdirSync(path.dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  if (failed.length > 0) {
    warn(
      `有 ${failed.length} 首没抓到元信息（页面会退回笔记里的显示文字）：${failed.join(", ")}`,
    );
  }
  log(
    `完成：${Object.keys(meta).length}/${ids.length} 首 → ${path.relative(projectRoot, cacheFile)}`,
  );
}

await main();
