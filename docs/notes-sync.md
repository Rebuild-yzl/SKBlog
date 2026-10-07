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


## 音乐收藏（`type: music`）

收藏页的歌曲清单也来自笔记仓库，走的是同一套同步；区别只在 frontmatter 里写的是 `type: music`。这类笔记会被收集成歌单，并且**不会再当博客发布**（免得同一篇既进 `/blogs` 又进收藏）。

- **目录 = 歌单**：只取该目录**直属**的 `type: music` 笔记（子目录自成歌单）；歌单名取目录最后一段（`音乐/游戏/x.md` → 「游戏」），仓库根目录下的音乐笔记归入「未分类」
- **正文每行一首**：行首的列表项里，第一个 5 位以上的数字当作网易云歌曲 ID，后面的文字是可选的显示文字，例如 `- 347230` 或 `- 347230 海阔天空 - Beyond`；同一篇里重复的 ID 自动去重，非列表行会被忽略（所以可以放心在正文里写说明）
- **元信息在构建期抓**：`npm run build` / `npm run dev` 前会跑 `npm run music:meta`，把歌名、歌手、封面抓下来缓存进 `.cache/music-meta.json`（gitignore）。抓不到**只警告不阻断构建**——页面会退回你在笔记里写的显示文字，缺封面就画占位块
- **音频地址不缓存**：播放时浏览器直接向解析接口请求 `type=url`，由它 302 到网易云 CDN，所以**音频既不经过 Vercel、也不经过那个第三方服务**。代价是地址带签名、有时效，每次播放都要现取；播放失败会自动重试一次，仍失败就给"去平台听"的链接
- **播放器**：客户端组件挂在根布局，点歌后才出现、切页不打断，含进度/音量/上一首/下一首，并给移动端锁屏提供媒体信息；曲目列表在 `/favorites/music`，那一页显示的是"大播放器 + 曲目列表"（迷你条在该页隐藏），两种 UI 共用同一份播放状态；该页还铺了一层**整屏背景**——封面放大重模糊 + 一层 scrim，跟随面板当前那首（与 `MusicCard` 的背板同源，只是作用在页面级）
- **可配置**：`SKBLOG_MUSIC_API` 换解析接口（默认 `https://api.injahow.cn/meting/`），`SKBLOG_MUSIC_SKIP=1` 跳过元信息抓取

## 图片与附件（附件目录 + 图片控件）

笔记里的图片从不在站点仓库里维护，构建时从笔记仓库的**附件目录**拷进来：

- **附件目录由变量 `SKBLOG_NOTES_ATTACHMENTS` 指定**（相对笔记仓库根，默认 `附件`）；产物落在 `public/notes-assets/`，清单落在 `.cache/note-images.json`（两者都 gitignore）
- **两种引用写法都认**：Obsidian 嵌入 `![[name.jpg]]`、`![[子目录/name.png]]`、`![[name.jpg|别名或宽度]]`；标准写法 `![alt](path)`。外链（`http(s)://`、`data:`）原样引用不拷贝；非图片附件（例如 `![[某文档]]`）直接忽略
- **解析全部发生在构建期**：`npm run images:sync`（挂在 `npm run sync` 里）把相对引用解析成站内绝对地址写进清单，页面层只查表消费，运行时不再推断任何相对路径
- **封面规则**：正文**第一行整行**是一个图片引用 → 这篇的封面就是它（渲染时这一行与紧随其后的 `---` 会从正文里去掉）；第一行不是图片就当作"这篇没有封面"
- **图片控件**：`src/components/note-image.tsx` 是所有要显示图片的地方的统一入口（列表封面、详情页封面、正文图片、照片收藏），调用方不需要判空
- **找不到的图**：构建时逐条警告（点名笔记与引用）并写进清单标记；显示时由控件自己渲染「图片未找到 + 原始引用」的提示块（画法同 `NothingHere`），页面不会因此塌掉
- **只拷被引用到的图**：扫描全部 md 的引用，没被引用的附件不进站点；同一个文件被多篇引用只拷一份
- **相册**：`type: photos` 的笔记每篇 = 一个相册（不进 `/blogs`），正文图片按顺序成册，展示在 `/favorites/photos`；网格格子的比例取相册第一张图的比例，尺寸未知才退回 4:3

## 正文渲染

正文是笔记里的 Markdown，**全部在构建期渲染成 HTML**（`src/components/markdown.tsx`，页面仍是静态页，客户端不跑解析）。

| 支持 | 说明 |
| --- | --- |
| 标题 / 列表 / 引用 / 链接 / 粗斜体 / 分割线 | CommonMark 基础语法 |
| 表格 / 任务列表 / 删除线 / 脚注 | 由 `remark-gfm` 提供（脚注 `[^1]` 与 `[^1]: 说明` 成对写） |
| 数学公式 | `remark-math` + KaTeX：行内 `$x^2$`、块级 `$$…$$`；**`\ce{CO2 + C -> 2 CO}` 这类化学式也能渲染**（mhchem 扩展）。长公式在窄屏里自己横向滚动，不会把页面撑宽 |
| 代码块 | `@shikijs/rehype` 在构建期染色，浅色 `github-light` / 深色 `github-dark` 两套主题随明暗切换；没标语言的围栏按纯文本处理 |
| Obsidian callout | `> [!info]`（`>` 后面有没有空格都认）、`> [!warning]-` / `[!info]+` 默认折叠 / 展开。类型按 Obsidian 默认主题分成八组配色，支持 `> [!info] 自定义标题` |
| 图片 | 见上一节；正文里「整行就是一张图」的图点开是图片详情遮罩层 |
| 排版 | `@tailwindcss/typography` 的 `prose`，`globals.css` 只覆盖代码块、表格边框、公式滚动三处 |

**这一轮不做**：双链 `[[笔记名]]` 与非图片嵌入 `![[某文档]]` 仍按原样文本显示；不启用 `rehype-raw`，所以笔记里的原始 HTML 不会被解析（也就没有 HTML 注入通道）；没有标题锚点与目录。

## 图片详情遮罩层

`src/components/photo-viewer.tsx` 是同一个遮罩层，两个入口共用：

- **照片收藏页**（`/favorites/photos`）：全部照片按自身比例排成瀑布流（相册名标在每张图左下角），点任意一张打开，左右切换的范围是**整个收藏页的照片列表**
- **博客详情页**：正文里的图（**封面不算**）点开同一个遮罩层，切换范围只限于**这一篇博客的正文图**

遮罩层里：大图在上，下面一条缩略图横条（缩略图按原比例、限高自适应宽度，只渲染「以当前图为中心、放得下」的那几张，不滚动也不分页），横条两侧是上一张 / 下一张（到两端置灰）；大屏时右侧是详情、小屏时详情接在横条下面，详情里依次是图片自己的说明（紧跟在那张图后面的文字，按 Markdown 渲染；没写就不显示）→ 分隔线 → 元数据。

元数据 = 基础信息（尺寸 / 格式 / 文件大小 / 所属相册 / 序号 / 原始引用）+ 构建期用 `exifr` 从图片文件里抽出来的 EXIF 分组（拍摄参数、GPS、PNG 头等，没有就只显示基础信息）。关闭方式：右上角 ×、Esc、点遮罩空白处；方向键 ← → 也能切图；打开期间页面滚动被锁住，关掉后恢复。

## 对笔记仓库的要求

- **必须是一个 Git 仓库**，托管在 GitHub / GitLab / GitCode / Gitee 等任意平台；分支名随意（示例用默认分支，GitLab 那份用 `$CI_DEFAULT_BRANCH` 自动适配）。
- **笔记是 Markdown**，frontmatter 里写 `publish: true` 才会发布；没写、写 `false`、写错字段名（例如 `public`）都不会上站。
- **Vercel 构建时必须能读到它**：公开仓库直接配 `SKBLOG_NOTES_REPO`；私有仓库用 HTTPS + `SKBLOG_NOTES_TOKEN`（**Gitee 还要配 `SKBLOG_NOTES_USER` 填账号名**，GitHub / GitCode / GitLab 可不填），或改用带凭据的地址、SSH 地址 + deploy key。
- **不需要在笔记仓库里放任何站点代码**，也不需要在里面跑构建 —— 站点是构建时来拉取它的。
- `.obsidian/` 这类隐藏目录可以照常提交（同步与读取都会跳过），但**不要把密钥写进笔记**：白名单只保证"没标 `publish` 的不上站"，标了 `publish: true` 的那篇会被原样发布。

> 部署到 Vercel、以及"push 笔记自动触发重新部署"的配置见 [deployment.md](./deployment.md)。

## 当前阶段的范围

- 正文已经按 Markdown 渲染（见上面「正文渲染」一节）；还没做的只有双链 `[[笔记名]]` 与非图片嵌入 `![[某文档]]`，它们仍按原样文本显示。
- 图片已全链路接入：列表封面、详情页封面、正文图片、照片收藏瀑布流与图片详情遮罩层。
- 同步只往 `.notes/` 写，不会回改笔记仓库。
