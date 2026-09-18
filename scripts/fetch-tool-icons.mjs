#!/usr/bin/env node
/*
 * 构建/开发前把工具图标从 skillicons.dev 抓到 public/icons/toolchain/。
 *
 * 为什么抓而不直接引外链：外链意味着每个访客都要访问第三方 CDN（可能被墙、被限流），
 * 页面也就依赖了一个我们控制不了的服务。抓下来自托管后用户端只访问自己的域名；
 * 图标是构建产物，所以不进仓库（见 .gitignore）。
 *
 * 清单的唯一来源是 src/lib/tool-icons.json：组件与脚本共用那一份，
 * 避免两边各写一份 slug 对不上。
 *
 * 环境变量：
 *   SKBLOG_SKIP_ICONS_FETCH  设为 1 跳过抓取，沿用已有文件
 *   SKBLOG_ICONS_STRICT      设为 1 时抓取失败即报错退出；CI（含 Vercel）默认严格
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const registryFile = path.join(projectRoot, "src", "lib", "tool-icons.json");
const outputDir = path.join(projectRoot, "public", "icons", "toolchain");
const endpoint = "https://skillicons.dev/icons";

// CI 上缺图标只会留下破图，属于静默事故，所以默认严格失败（和 notes:sync 一个思路）。
const isCI = Boolean(process.env.VERCEL || process.env.CI);
const strict = isCI || process.env.SKBLOG_ICONS_STRICT === "1";

function log(message) {
  console.log(`[icons] ${message}`);
}

function fail(message) {
  if (strict) {
    console.error(`[icons] ${message}`);
    process.exit(1);
  }
  console.warn(`[icons] ${message}（非 CI 环境，继续）`);
}

/*
 * skillicons 遇到不认识的 slug 不会报错，而是返回 200 + 一张写着 undefined 的
 * 占位图（约 256 字节；真实图标 800~4600 字节）。所以除了状态码还要校验内容，
 * 否则清单里写错一个 slug，页面上只会默默多出一个问号图标。
 */
class PlaceholderIconError extends Error {}

async function fetchIconOnce(slug) {
  const response = await fetch(`${endpoint}?i=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("svg")) {
    throw new Error(`返回类型不是 SVG：${type || "（无）"}`);
  }

  const svg = await response.text();
  if (svg.length <= 400 || svg.includes("undefined")) {
    throw new PlaceholderIconError("拿到的是占位图，slug 可能写错了");
  }
  return svg;
}

/*
 * 构建时依赖外网，网络抖动（DNS 失败、连接被重置）会让单个图标莫名其妙地缺失，
 * 所以失败重试两次再放弃；但「占位图」是 slug 写错，重试没用，直接抛出去。
 */
async function fetchIcon(slug) {
  const attempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchIconOnce(slug);
    } catch (error) {
      lastError = error;
      if (error instanceof PlaceholderIconError) break;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
  throw lastError;
}

async function main() {
  if (process.env.SKBLOG_SKIP_ICONS_FETCH === "1") {
    log("SKBLOG_SKIP_ICONS_FETCH=1，跳过抓取");
    return;
  }

  // 先校验清单结构：JSON 里少写或写错键名（典型是把 label 写成 lable）时，
  // TypeScript 只会抛一段"联合类型不能赋值"的难懂错误，这里直接点名第几项。
  const tools = JSON.parse(readFileSync(registryFile, "utf8")).filter(
    (tool, index) => {
      const hasSlug = typeof tool?.slug === "string" && tool.slug.trim() !== "";
      const hasLabel =
        typeof tool?.label === "string" && tool.label.trim() !== "";
      if (!hasSlug || !hasLabel) {
        const hint = tool?.lable ? "（是不是把 label 写成了 lable？）" : "";
        fail(
          `tool-icons.json 第 ${index + 1} 项缺少 ${hasSlug ? "label" : "slug"}${hint}`,
        );
      }
      return hasSlug && hasLabel;
    },
  );
  mkdirSync(outputDir, { recursive: true });

  const failed = [];
  for (const { slug } of tools) {
    try {
      const svg = await fetchIcon(slug);
      writeFileSync(path.join(outputDir, `${slug}.svg`), svg, "utf8");
      log(`抓取 ${slug}.svg（${svg.length} 字节）`);
    } catch (error) {
      failed.push(slug);
      fail(`抓取 ${slug} 失败：${error.message}`);
    }
  }

  if (failed.length > 0) {
    fail(`有 ${failed.length} 个图标没抓到：${failed.join(", ")}`);
    return;
  }
  log(`完成：${tools.length} 个图标 → ${path.relative(projectRoot, outputDir)}`);
}

await main();
