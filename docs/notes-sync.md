# 博客内容（笔记仓库同步）

博客正文的真源在**笔记仓库**（Obsidian vault 的 Git 仓库），站点仓库只负责渲染，两者按「构建时拉取」连接，笔记仓库始终只读：

```
笔记仓库 push ──▶ npm run build（prebuild 先跑 notes:sync）
                     │  scripts/sync-notes.mjs：把仓库浅克隆到 .notes/（已 gitignore）
                     │  src/lib/notes.ts：遍历 .notes/、解析 frontmatter、只留 publish: true
                     └▶ /blogs 列表页 + /blogs/[slug] 静态页
```

## 发布规则（白名单）

只有 frontmatter 里显式写了 `publish: true` 的笔记会上站；**没写、写 `false`、类型不对的一律跳过**。私有笔记、草稿、随手记不需要额外处理，默认就是不上站。

## frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `publish` | 是 | 只有 `true` 才上站（字符串 `"true"` 也认） |
| `title` | 否 | 页面标题。缺省用文件名（**不读正文里的 `# 标题`**：正文标题是给人看的，改了不该连带动列表页与 `<title>`） |
| `date` | 否 | `YYYY-MM-DD` 或完整时间。缺省时先取文件名开头的 `YYYY-MM-DD`，最后退到文件修改时间 |
| `slug` | 否 | URL 标识。缺省由文件名推导：转小写、空格与下划线变 `-`、其它符号去掉。中文会保留，URL 里以百分号编码传输，编码前后的两种链接都能访问（`getPostBySlug` 会统一解码，因为 Next 传给页面组件的参数并不保证已解码） |
| `description` | 否 | 列表页摘要，同时用作页面的 meta description |
| `tags` | 否 | YAML 数组或逗号分隔字符串 |

```yaml
---
title: 用 Next.js 做个博客
date: 2026-03-05
tags: [Next.js, 随笔]
description: 笔记仓库与站点分离后的第一次尝试。
publish: true
---
```

> **关于 `date`**：构建时是浅克隆，文件的 mtime 就是检出时间，所以偷懒不写 `date` 会让所有笔记都显示成同一天。建议每篇都写，或让文件名以 `YYYY-MM-DD` 开头。

两篇笔记推导出同一个 slug 时构建会直接失败（而不是静默丢掉一篇），按报错提示给其中一篇加 `slug` 即可。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `SKBLOG_NOTES_REPO` | 无 | 笔记仓库地址。私有仓库用 HTTPS + `SKBLOG_NOTES_TOKEN`，或让 CI 走 SSH（`git@github.com:...`） |
| `SKBLOG_NOTES_BRANCH` | 仓库默认分支 | 只拉这个分支 |
| `SKBLOG_NOTES_TOKEN` | 无 | 注入到 HTTPS 地址里的访问令牌（日志里会打码） |
| `SKBLOG_NOTES_USER` | GitHub / GitCode / GitLab 有默认值 | 令牌对应的用户名。Gitee 必须显式填账号名（它的私有仓库 clone 要「账号 + 令牌」），其它平台填了会覆盖默认值 |
| `SKBLOG_NOTES_DIR` | 无 | 直接用本地目录当笔记仓库，设了就完全不联网（本地开发推荐；相对路径按项目根解析） |
| `SKBLOG_NOTES_CHECKOUT` | `.notes` | 缓存目录 |
| `SKBLOG_NOTES_SUBDIR` | 仓库根 | 只扫描某个子目录（例如 `Blog`），把候选范围收窄 |
| `SKBLOG_SKIP_NOTES_SYNC` | 无 | 设为 `1` 跳过拉取，沿用已有缓存 |
| `SKBLOG_NOTES_STRICT` | CI 下视为 `1` | 同步失败是否直接报错退出；本地默认只警告，方便离线调样式 |

这些变量可以写在项目根的 `.env.local`（不提交）或 `.env`（可提交，用来放默认值）里，仓库里有一份 [`.env.example`](../.env.example) 可直接复制。加载优先级是 **命令行/CI 环境变量 > `.env.local` > `.env`**。

> **为什么脚本要自己读 `.env.local`**：`npm run dev` / `npm run build` 前面的 pre 钩子是独立进程，Next 读 env 文件只发生在 `next` 自己的进程里，pre 钩子看不到。所以 `scripts/sync-notes.mjs` 启动时用 Node 内置的 `process.loadEnvFile()` 依次加载 `.env`、`.env.local`（它不覆盖已有的进程环境变量，优先级与 Next 一致），这样"写在 `.env.local` 里"两半都能读到。

## 本地开发

方式一（推荐）：写进 `.env.local`，之后一句 `npm run dev` 就够。

```bash
# .env.local
SKBLOG_NOTES_REPO=https://github.com/you/notes.git

# 想让站点直接读本地 vault（改完笔记刷新即可、完全离线）时改用这一行：
# SKBLOG_NOTES_DIR=../notes-vault
```

方式二：只是临时试一次、不想落地成文件，就在命令行里给变量。

```bash
SKBLOG_NOTES_DIR=../notes-vault npm run dev
```

PowerShell 里对应 `$env:SKBLOG_NOTES_DIR="..\notes-vault"; npm run dev`（关掉窗口就失效）。

> 第三种是写进系统环境变量 —— 不推荐：换机器、换项目时行为不透明，而且容易忘了自己设过。

三条使用须知：

- **改完 `.env.local` 要重启 dev 服务器**（env 文件只在进程启动时读一次）；改笔记内容本身不用重启。
- 用仓库模式时，新增或修改笔记要先 push，再跑一次 `npm run notes:sync` 把 `.notes/` 更新下来（之后刷新页面即可）。想省掉这一步，就用 `SKBLOG_NOTES_DIR` 指向本地 vault。
- `SKBLOG_NOTES_DIR` 优先级高于 `SKBLOG_NOTES_REPO`：两者同时存在时走本地目录，不联网、不克隆。


## 对笔记仓库的要求

- **必须是一个 Git 仓库**，托管在 GitHub / GitLab / GitCode / Gitee 等任意平台；分支名随意（示例用默认分支，GitLab 那份用 `$CI_DEFAULT_BRANCH` 自动适配）。
- **笔记是 Markdown**，frontmatter 里写 `publish: true` 才会发布；没写、写 `false`、写错字段名（例如 `public`）都不会上站。
- **Vercel 构建时必须能读到它**：公开仓库直接配 `SKBLOG_NOTES_REPO`；私有仓库用 HTTPS + `SKBLOG_NOTES_TOKEN`（**Gitee 还要配 `SKBLOG_NOTES_USER` 填账号名**，GitHub / GitCode / GitLab 可不填），或改用带凭据的地址、SSH 地址 + deploy key。
- **不需要在笔记仓库里放任何站点代码**，也不需要在里面跑构建 —— 站点是构建时来拉取它的。
- `.obsidian/` 这类隐藏目录可以照常提交（同步与读取都会跳过），但**不要把密钥写进笔记**：白名单只保证"没标 `publish` 的不上站"，标了 `publish: true` 的那篇会被原样发布。

> 部署到 Vercel、以及"push 笔记自动触发重新部署"的配置见 [deployment.md](./deployment.md)。

## 当前阶段的范围

- 正文按**纯文本**输出（保留原始换行），不做 Markdown 渲染，也不转换 Obsidian 语法 —— `[[双链]]`、`![[嵌入]]`、`> [!note]` 都原样显示。渲染依赖（remark / rehype 那一套）留到接入时再装。
- 图片与附件暂不处理，笔记里的图片引用不会出现在站点上。
- 同步只往 `.notes/` 写，不会回改笔记仓库。
