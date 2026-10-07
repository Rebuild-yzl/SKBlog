#!/usr/bin/env node
/*
 * 构建/开发前把笔记引用到的图片从「附件目录」拷进 public/notes-assets/，并把解析结果写进
 * .cache/note-images.json。
 *
 * 清单的键是**原始引用字符串**（例如 ![[6a04821c315e5.jpg]]），值里是已经解析好的站内绝对
 * 地址、宽高、字节数、格式与 EXIF；找不到的引用写成 { missing: true, ref, note }，由图片控件
 * 渲染「未找到」提示。页面层因此完全不需要再做相对路径推断，也不用在运行时读原图。
 *
 * 环境变量：
 *   SKBLOG_NOTES_ATTACHMENTS  附件目录，相对笔记仓库根，默认「附件」
 *   SKBLOG_NOTES_DIR          笔记仓库位置（与 notes:sync 一致）
 *   SKBLOG_SKIP_IMAGE_SYNC    设为 1 跳过，沿用已有产物
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import exifr from "exifr";
import {
  isExternalTarget,
  parseImageRefs,
  readImageSize,
  resolveReference,
  toPublicUrl,
} from "../src/lib/note-images.mjs";

const projectRoot = path.dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const outputDir = path.join(projectRoot, "public", "notes-assets");
const manifestFile = path.join(projectRoot, ".cache", "note-images.json");

const attachmentsName = process.env.SKBLOG_NOTES_ATTACHMENTS?.trim() || "附件";

function log(message) {
  console.log(`[images] ${message}`);
}

function warn(message) {
  console.warn(`[images] ${message}`);
}

function notesRoot() {
  const configured = process.env.SKBLOG_NOTES_DIR?.trim();
  return configured
    ? path.resolve(projectRoot, configured)
    : path.join(projectRoot, ".notes");
}

function walkMarkdown(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, found);
    else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) found.push(full);
  }
  return found;
}

/*
 * exifr 的返回值里可能有二进制（缩略图、MakerNote）和超长字符串，直接写进清单会既大又没用。
 * 这里只留下能直接显示成一行文字的标量（Date 转 ISO 字符串），空分组整组丢掉。
 */
function cleanExif(groups) {
  if (!groups || typeof groups !== "object") return undefined;

  const cleaned = {};
  for (const [group, tags] of Object.entries(groups)) {
    if (!tags || typeof tags !== "object") continue;

    const kept = {};
    for (const [key, value] of Object.entries(tags)) {
      if (value === null || value === undefined) continue;
      if (ArrayBuffer.isView(value)) continue;
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) continue;
      if (typeof value === "string" && value.length > 200) continue;
      kept[key] = value instanceof Date ? value.toISOString() : value;
    }

    if (Object.keys(kept).length > 0) cleaned[group] = kept;
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/**
 * 一张图的构建期信息：宽高、字节数、格式与 EXIF。
 * EXIF 读不出来（PNG 截图、没有 EXIF 的图、格式不认识）只留基础信息，不告警也不阻断。
 */
async function readImageInfo(file) {
  const size = readImageSize(file);
  let exif;

  try {
    exif = await exifr.parse(file, {
      // 按 exifr 自己的分组返回（ifd0 / exif / gps / interop），详情面板分节显示
      mergeOutput: false,
      tiff: true,
      ifd0: true,
      exif: true,
      gps: true,
      interop: true,
      ifd1: false,
      thumbnail: false, // 缩略图是二进制，清单里用不上
      translateValues: true,
      reviveValues: true,
    });
  } catch {
    exif = undefined;
  }

  return {
    width: size?.width,
    height: size?.height,
    bytes: statSync(file).size,
    format: path.extname(file).slice(1).toLowerCase() || undefined,
    exif: cleanExif(exif),
  };
}

async function main() {
  if (process.env.SKBLOG_SKIP_IMAGE_SYNC === "1") {
    log("SKBLOG_SKIP_IMAGE_SYNC=1，跳过");
    return;
  }

  const root = notesRoot();
  if (!existsSync(root)) {
    warn(`找不到笔记目录 ${root}，跳过（先跑 npm run notes:sync）`);
    return;
  }

  const attachmentsRoot = path.resolve(root, attachmentsName);
  if (!existsSync(attachmentsRoot)) {
    warn(`附件目录不存在：${attachmentsRoot}（变量 SKBLOG_NOTES_ATTACHMENTS）`);
  }

  // 每次都重建产物目录，避免删掉的图留在站点里
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const notes = walkMarkdown(root);
  /** @type {Record<string, object>} */
  const manifest = {};
  const copied = new Map(); // 目标文件 → 站内地址，同一个文件被多处引用只拷一次
  const infoCache = new Map(); // 源文件 → 构建期信息，同一个文件被多处引用只读一次
  let referenceCount = 0;
  let missingCount = 0;

  for (const noteFile of notes) {
    const note = path.relative(root, noteFile).split(path.sep).join("/");
    const content = readFileSync(noteFile, "utf8");

    for (const ref of parseImageRefs(content)) {
      referenceCount += 1;

      if (isExternalTarget(ref.target)) {
        manifest[ref.raw] = {
          url: ref.target,
          external: true,
          alt: ref.alt,
          ref: ref.raw,
          note,
        };
        continue;
      }

      const file = resolveReference(ref, {
        notesRoot: root,
        attachmentsRoot,
        noteDir: path.dirname(noteFile),
      });

      if (!file) {
        missingCount += 1;
        manifest[ref.raw] = { missing: true, alt: ref.alt, ref: ref.raw, note };
        warn(`图片未找到：${ref.target}（来自 ${note}）`);
        continue;
      }

      const relativeToAttachments = path.relative(attachmentsRoot, file);
      const target = path.join(outputDir, relativeToAttachments);
      let url = copied.get(target);
      if (!url) {
        url = toPublicUrl(relativeToAttachments);
        mkdirSync(path.dirname(target), { recursive: true });
        copyFileSync(file, target);
        copied.set(target, url);
      }

      let info = infoCache.get(file);
      if (!info) {
        info = await readImageInfo(file);
        infoCache.set(file, info);
      }

      manifest[ref.raw] = {
        url,
        alt: ref.alt,
        ref: ref.raw,
        note,
        ...info,
      };
    }
  }

  mkdirSync(path.dirname(manifestFile), { recursive: true });
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  log(
    `扫描 ${notes.length} 篇笔记：引用 ${referenceCount} 张，拷贝 ${copied.size} 张${
      missingCount > 0 ? `，缺失 ${missingCount} 张` : ""
    }（${infoCache.size} 张带元信息）→ ${path.relative(projectRoot, outputDir)}`,
  );
}

await main();
