#!/usr/bin/env node
/**
 * 把「笔记仓库」（Obsidian vault 的 Git 仓库）同步到本地缓存目录，供 Next.js 在构建时读取。
 *
 * 站点与笔记是分开的两个仓库，笔记仓库始终只读：本脚本是唯一的同步入口，
 * 由 package.json 的 prebuild / predev 钩子自动触发，结果放在 .notes/（已 gitignore）。
 *
 * 环境变量（README「博客内容：从笔记仓库同步」一节有完整说明）：
 *   SKBLOG_NOTES_REPO      笔记仓库的 Git 地址，例如 git@github.com:you/vault.git
 *   SKBLOG_NOTES_BRANCH    要拉取的分支，默认用仓库的默认分支
 *   SKBLOG_NOTES_TOKEN     HTTPS 私有仓库的访问令牌（日志里会打码）
 *   SKBLOG_NOTES_DIR       直接用本地目录当笔记仓库，设了就完全不联网（本地开发推荐）
 *   SKBLOG_NOTES_CHECKOUT  缓存目录，默认 .notes
 *   SKBLOG_SKIP_NOTES_SYNC 设为 1 时跳过同步，沿用已有缓存
 *   SKBLOG_NOTES_STRICT    设为 1 时同步失败即报错退出；CI（含 Vercel）默认就是严格模式
 *
 * 这些变量可以写在项目根的 .env / .env.local 里：npm 的 pre 钩子是独立进程，
 * 不会像 Next 那样自己读 env 文件，所以由本脚本负责加载（见 loadEnvFiles）。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);

// CI 上不配置笔记仓库是很可能被忽略的部署事故（站点会安静地变成空博客），所以默认严格失败。
const isCI = Boolean(process.env.VERCEL || process.env.CI);
const strict = isCI || process.env.SKBLOG_NOTES_STRICT === "1";

function log(message) {
  console.log(`[notes] ${message}`);
}

function fail(message) {
  if (strict) {
    console.error(`[notes] ${message}`);
    process.exit(1);
  }
  console.warn(`[notes] ${message}（非 CI 环境，继续构建）`);
}

/**
 * 加载项目根的 .env / .env.local。
 *
 * 顺序是 .env → .env.local（后者覆盖前者），而 process.loadEnvFile 不会覆盖已经存在的
 * 进程环境变量，所以最终优先级是「命令行/CI > .env.local > .env」，与 Next 自身一致。
 * 两个文件都不存在是正常情况（例如 CI 里全部用平台环境变量），静默跳过。
 */
function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const file = path.join(projectRoot, name);
    if (!existsSync(file)) continue;
    try {
      process.loadEnvFile(file);
    } catch (error) {
      fail(`读取 ${name} 失败：${error?.message ?? String(error)}`);
    }
  }
}

loadEnvFiles();

const repoUrl = process.env.SKBLOG_NOTES_REPO?.trim();
const branch = process.env.SKBLOG_NOTES_BRANCH?.trim();
const token = process.env.SKBLOG_NOTES_TOKEN?.trim();
const localDir = process.env.SKBLOG_NOTES_DIR?.trim();
const checkoutDir = path.resolve(
  projectRoot,
  process.env.SKBLOG_NOTES_CHECKOUT?.trim() || ".notes",
);

/** 统计目录下的 Markdown 文件数，只是给日志一个直观的规模提示。 */
function countMarkdown(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += countMarkdown(full);
    else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) total += 1;
  }
  return total;
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** 把令牌塞进 HTTPS 地址；日志里只打印打码后的版本。 */
function withToken(url) {
  if (!token || !url.startsWith("https://")) return url;
  const parsed = new URL(url);
  parsed.username = "x-access-token";
  parsed.password = token;
  return parsed.toString();
}

function redact(url) {
  if (!token) return url;
  return url.replace(token, "***");
}

function sync() {
  if (process.env.SKBLOG_SKIP_NOTES_SYNC === "1") {
    log("SKBLOG_SKIP_NOTES_SYNC=1，跳过同步");
    return;
  }

  // 本地开发优先用「指到本地目录」这种方式：快，而且不依赖网络和凭据。
  if (localDir) {
    const resolved = path.resolve(projectRoot, localDir);
    if (!existsSync(resolved)) {
      fail(`SKBLOG_NOTES_DIR 指向的目录不存在：${resolved}`);
      return;
    }
    log(`使用本地笔记目录 ${resolved}（${countMarkdown(resolved)} 个 Markdown 文件）`);
    return;
  }

  if (!repoUrl) {
    fail(
      "未配置笔记仓库：请设置 SKBLOG_NOTES_REPO（笔记仓库地址）或 SKBLOG_NOTES_DIR（本地目录）",
    );
    return;
  }

  const url = withToken(repoUrl);
  if (existsSync(path.join(checkoutDir, ".git"))) {
    log(`更新 ${redact(repoUrl)} → ${checkoutDir}`);
    // 缓存目录是可丢弃的产物，所以直接对齐远端；--depth 1 让它始终是浅克隆。
    git(["fetch", "--depth", "1", "origin", ...(branch ? [branch] : [])], checkoutDir);
    git(["checkout", "--force", "--detach", "FETCH_HEAD"], checkoutDir);
  } else {
    log(`克隆 ${redact(repoUrl)} → ${checkoutDir}`);
    git([
      "clone",
      "--depth",
      "1",
      "--single-branch",
      ...(branch ? ["--branch", branch] : []),
      url,
      checkoutDir,
    ]);
  }

  log(`同步完成：${checkoutDir}（${countMarkdown(checkoutDir)} 个 Markdown 文件）`);
}

try {
  sync();
} catch (error) {
  const detail =
    error?.stderr?.toString().trim() || error?.message || String(error);
  fail(`同步笔记仓库失败：${detail}`);
}
