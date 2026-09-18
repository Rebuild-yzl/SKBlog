# SKBlog

NeuroSaiKou 的个人网站 —— 用来放博客、作品、项目与收藏的自我介绍型站点。

目前处于早期开发阶段：首页与 About 页有实际内容，`/blogs` 已接上笔记仓库（见 [docs/notes-sync.md](./docs/notes-sync.md)），其余页面仍复用「建设中」占位组件。

各部分的详细文档在 [docs/](./docs) 下，索引见文末[文档](#文档)一节。

## 特点

常见的博客基本是两条路：要么带一个站内后台（登录后在线写、内容进数据库），要么在本地站点项目里新建 Markdown 再构建发布。这个站点的内容真源是**你自己的笔记仓库**（Obsidian vault 的 Git 仓库），站点只是它在 Web 上的投影：

- **写作和发布是同一件事**：在 Obsidian 里写完，frontmatter 标上 `publish: true`，push 即可 —— 没有后台、没有登录、没有数据库。
- **内容与代码分离**：站点仓库只有代码，笔记仓库只有笔记；站点对笔记仓库**只读**，同步只写本地的 `.notes/` 缓存目录，不会回改你的 vault。
- **发布是白名单**：默认不发布，只有显式写了 `publish: true` 的笔记会上站，私人笔记不会因为"被扫描到"而泄露。
- **构建期成页**：文章在构建时生成静态 HTML，线上没有数据库查询；`npm run build` 之外没有任何运行时依赖。
- **本地改完刷新即见**：把 `SKBLOG_NOTES_DIR` 指向本地 vault 就不联网、不克隆，写完刷新浏览器就能预览，满意了再 push。
- **笔记仓库平台无关**：GitHub / GitLab / GitCode / Gitee 都行，push 后触发一次 Deploy Hook 就让站点重建（示例见 [cicd/](./cicd)）。

取舍也说清楚：内容不是即时的（要等一次构建），不能在网页上编辑，评论、站内搜索这类需要服务端状态的功能得另外接。

## 技术栈

| 类别 | 选择 |
| --- | --- |
| 框架 | [Next.js](https://nextjs.org) 16.3.5（App Router） |
| UI 库 | React 19.2.8 |
| 语言 | TypeScript 5（`strict`） |
| 样式 | Tailwind CSS 4 + PostCSS（`@tailwindcss/postcss`） |
| 设计系统 | Tailwind 4 的 `@theme` / `@utility`：`glass-panel`、`lightedge`（采样描边）、`glass-bar`，详见 [docs/styling.md](./docs/styling.md) |
| 内容来源 | 独立的**笔记仓库**（Obsidian vault 的 Git 仓库），构建时用 `git` 浅克隆同步，详见 [docs/notes-sync.md](./docs/notes-sync.md) |
| 内容解析 | [gray-matter](https://github.com/jonschlinkert/gray-matter)（读取笔记 frontmatter；正文当前只做纯文本展示） |
| 图标 | [skillicons.dev](https://skillicons.dev) 的图标在构建时抓取并自托管到 `public/`（访客不访问第三方 CDN） |
| 字体 / 图片 | `next/font/google`（Geist / Geist Mono）、`next/image`（SVG 用 `unoptimized`） |
| 代码检查 | ESLint 9 + `eslint-config-next` |
| 编译优化 | React Compiler（`next.config.ts` 中 `reactCompiler: true`） |
| 监控 | [@vercel/analytics](https://vercel.com/docs/analytics) |
| 部署 / 自动化 | Vercel（`prebuild` 同步笔记 + 抓图标，`vercel-build` 兜底）；笔记仓库 push 经 Deploy Hook 触发重建，四个平台的示例见 [cicd/](./cicd) |

> [!IMPORTANT]
> 项目根目录的 `AGENTS.md`（由 `next dev` 自动写入）说明当前 Next.js 版本存在破坏性变更，要求改动代码前先阅读 `node_modules/next/dist/docs/` 下对应的指南，不要只依赖既有经验或旧文档。

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。编辑页面文件会自动热更新。

博客正文存放在**独立的笔记仓库**里，本地要先指一下笔记目录才能在 `/blogs` 看到文章（`SKBLOG_NOTES_DIR` 或 `SKBLOG_NOTES_REPO`，见 [docs/notes-sync.md](./docs/notes-sync.md)；不配也能跑，只是 `/blogs` 是空态）。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run notes:sync` | 把笔记仓库同步到 `.notes/`（`dev` / `build` 通过 npm 的 pre 钩子自动调用，一般不用手动执行） |
| `npm run dev` | 启动开发服务器（默认使用 Turbopack，React Compiler 生效） |
| `npm run build` | 生产环境构建 |
| `npm start` | 运行生产构建产物 |
| `npm run lint` | 运行 ESLint |

## 目录结构

```
src/
├─ app/                      # App Router 路由
│  ├─ layout.tsx             # 根布局：字体、metadata、导航栏、明暗初始化脚本
│  ├─ page.tsx               # 首页 Home
│  ├─ globals.css            # Tailwind 入口、主题令牌、根背景、glass-panel 工具类、明暗色
│  ├─ not-found.tsx          # 404（替代 Next 自带页；在根布局内渲染，带导航栏与主题）
│  ├─ error.tsx              # 路由段错误边界（替代自带报错页，提供 Try again）
│  ├─ global-error.tsx       # 最外层错误边界：替换根布局，自带 <html>/<body>/全局样式/主题
│  ├─ about/page.tsx         # 关于
│  ├─ analytics/page.tsx     # 访问统计（Vercel Analytics）
│  ├─ blogs/page.tsx         # 博客列表（笔记仓库里 publish: true 的笔记）
│  ├─ blogs/[slug]/page.tsx  # 博客详情（构建期由 generateStaticParams 生成静态页）
│  ├─ favorites/page.tsx     # 收藏
│  ├─ participate/page.tsx   # 参与
│  ├─ projects/page.tsx      # 项目
│  └─ works/page.tsx         # 作品
├─ lib/
│  ├─ notes.ts               # 笔记读取层：遍历 .notes/、按 frontmatter 过滤、组装出 Post
│  └─ tool-icons.json        # 工具图标清单（slug + 名称），组件与抓取脚本共用
└─ components/
   ├─ navbar.tsx             # 顶部导航（客户端组件：sticky 胶囊 + 半透明模糊，<768px 折叠为汉堡菜单，z-50）
   ├─ theme-toggle.tsx       # 明暗切换按钮（切 <html> 的 .dark 类 + 写 localStorage；menu / icon 两种形态）
   ├─ notice-card.tsx        # 错误页/404 共用的提示卡片（附两个按钮样式常量）
   ├─ nothing-here.tsx       # 空态占位（图标 + 两句文案，不套卡片）
   ├─ banner.tsx             # 横幅卡片：圆角边框，按 16:9 完整展示图片（不裁切），文字用 glass-panel 方块
   ├─ profile.tsx            # 个人名片（头像 + 名称 + 描述）
   └─ profile-details.tsx    # 名片下方的补充信息：在校状态 / 地点 / 邮箱 / 工具图标（无卡片边框）

scripts/
├─ sync-notes.mjs            # 构建/开发前把笔记仓库同步到 .notes/（本地目录或 Git 两种来源）
└─ fetch-tool-icons.mjs      # 构建/开发前把工具图标抓到 public/icons/toolchain/（自托管，用户端不访问 CDN）

cicd/                        # 给「笔记仓库」用的 CI 示例（本站点自己用不到）
├─ github/workflows/notify-blog.yml
├─ gitlab/.gitlab-ci.yml
├─ gitcode/workflows/notify-blog.yml
└─ gitee/README.md

docs/                        # 详细文档（见文末[文档](#文档)一节）
├─ notes-sync.md             # 博客内容：发布规则、frontmatter、环境变量、本地预览
├─ deployment.md             # 部署到 Vercel、push 笔记触发重新部署
├─ development.md            # 开发约定
├─ styling.md                # 毛玻璃 / 采样描边的实现与调参
└─ roadmap.md                # 待办
```

## 路由一览

- [x] `/` — Home：已有内容
- [x] `/about` — About：横幅卡片 + 个人名片卡片
- [ ] `/analytics` — Analytics：仅挂载 Vercel Analytics
- [x] `/blogs` — Blogs：列表 + 详情（`/blogs/[slug]`），内容来自笔记仓库（见下节）；仓库里没有 `publish: true` 的笔记时仍是空态占位
- [ ] `/favorites` — Favorites：空态占位（`NothingHere`）
- [ ] `/participate` — Participate：空态占位（`NothingHere`）
- [ ] `/projects` — Projects：空态占位（`NothingHere`）
- [ ] `/works` — Works：空态占位（`NothingHere`）
- [x] 404 — 未匹配路由（`not-found.tsx`）
- [x] 错误页 — 页面渲染出错（`error.tsx`）/ 根布局出错（`global-error.tsx`）

## 部署

站点是标准的 Next.js 应用，推荐用 [Vercel](https://vercel.com/new)（Next.js 官方平台，零配置）：

1. 把仓库推到 GitHub，在 Vercel 里 Import 这个仓库
2. 在项目的 Environment Variables 里加 `SKBLOG_NOTES_REPO` 指向笔记仓库；笔记仓库是私有的再加 `SKBLOG_NOTES_TOKEN`（GitHub 用 Fine-grained token，只给 **Contents: Read**），Gitee 这类要「账号 + 令牌」的平台还要加 `SKBLOG_NOTES_USER`
3. 构建命令保持默认：Vercel 会执行 `package.json` 的 `build` 脚本，`prebuild` 里的同步脚本把笔记仓库拉到 `.notes/`，所以线上内容和笔记仓库保持一致
4. 想让"push 笔记"也自动触发重新部署，还要在**笔记仓库**侧加一个 Deploy Hook 调用（[cicd/](./cicd) 里有四个平台的示例）

变量清单、CI/CD 细节和排查表见 [docs/deployment.md](./docs/deployment.md)。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/notes-sync.md](./docs/notes-sync.md) | 博客内容怎么来的：发布规则、frontmatter 字段、环境变量、本地预览、对笔记仓库的要求 |
| [docs/deployment.md](./docs/deployment.md) | 部署到 Vercel、push 笔记触发重新部署、部署前自检 |
| [docs/development.md](./docs/development.md) | 开发约定：组件位置、样式与令牌、图片、新增页面 |
| [docs/styling.md](./docs/styling.md) | `glass-panel` / `lightedge` / `glass-bar` 的实现与调参 |
| [docs/roadmap.md](./docs/roadmap.md) | 待办清单 |
| [cicd/](./cicd) | 给**笔记仓库**用的 CI 示例（GitHub / GitLab / GitCode / Gitee） |
