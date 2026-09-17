# SKBlog

NeuroSaiKou 的个人网站 —— 用来放博客、作品、项目与收藏的自我介绍型站点。

目前处于早期开发阶段：首页与 About 页有实际内容，其余页面均复用一个「建设中」占位组件。

## 技术栈

| 类别 | 选择 |
| --- | --- |
| 框架 | [Next.js](https://nextjs.org) 16.3.5（App Router） |
| UI 库 | React 19.2.8 |
| 语言 | TypeScript 5（`strict`） |
| 样式 | Tailwind CSS 4 + PostCSS（`@tailwindcss/postcss`） |
| 代码检查 | ESLint 9 + `eslint-config-next` |
| 监控 | [@vercel/analytics](https://vercel.com/docs/analytics) |
| 编译优化 | React Compiler（`next.config.ts` 中 `reactCompiler: true`） |

> [!IMPORTANT]
> 项目根目录的 `AGENTS.md`（由 `next dev` 自动写入）说明当前 Next.js 版本存在破坏性变更，要求改动代码前先阅读 `node_modules/next/dist/docs/` 下对应的指南，不要只依赖既有经验或旧文档。

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。编辑页面文件会自动热更新。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
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
│  ├─ blogs/page.tsx         # 博客
│  ├─ favorites/page.tsx     # 收藏
│  ├─ participate/page.tsx   # 参与
│  ├─ projects/page.tsx      # 项目
│  └─ works/page.tsx         # 作品
└─ components/
   ├─ navbar.tsx             # 顶部导航（客户端组件：sticky 胶囊 + 半透明模糊，<768px 折叠为汉堡菜单，z-50）
   ├─ theme-toggle.tsx       # 明暗切换按钮（切 <html> 的 .dark 类 + 写 localStorage；menu / icon 两种形态）
   ├─ notice-card.tsx        # 错误页/404 共用的提示卡片（附两个按钮样式常量）
   ├─ banner.tsx             # 横幅卡片：圆角边框，按 16:9 完整展示图片（不裁切），文字用 glass-panel 方块
   ├─ profile.tsx            # 个人名片（头像 + 名称 + 描述）
   └─ building.tsx           # 「This page is in development.」占位组件
```

## 路由一览

- [x] `/` — Home：已有内容
- [x] `/about` — About：横幅卡片 + 个人名片卡片
- [ ] `/analytics` — Analytics：仅挂载 Vercel Analytics
- [ ] `/blogs` — Blogs：占位
- [ ] `/favorites` — Favorites：占位
- [ ] `/participate` — Participate：占位
- [ ] `/projects` — Projects：占位
- [ ] `/works` — Works：占位
- [x] 404 — 未匹配路由（`not-found.tsx`）
- [x] 错误页 — 页面渲染出错（`error.tsx`）/ 根布局出错（`global-error.tsx`）

## 开发约定

- **路径别名**：`@/*` 指向 `src/*`（见 `tsconfig.json`），例如 `import Building from "@/components/building"`。
- **组件 props**：可配置的组件用带默认值的可选 props（参考 `profile.tsx`），页面里直接 `<Profile />` 即可使用。
- **组件位置**：可复用组件放在 `src/components/`，页面级代码放在 `src/app/<route>/page.tsx`。
- **样式**：Tailwind CSS 4 通过 `@import "tailwindcss"` 引入；自定义设计令牌写在 `globals.css` 的 `@theme inline` 中，不要使用 Tailwind 3 时代的 `tailwind.config.js` 写法。
- **明暗色**：由 `<html>` 上的 `.dark` 类驱动 —— `globals.css` 里用 `@custom-variant dark (&:where(.dark, .dark *))` 把它接到 Tailwind 的 `dark:` 变体，`--background` / `--foreground` / `--border` 在 `:root` 与 `.dark` 中各定义一套（同时设 `color-scheme`）。`layout.tsx` 的 `<head>` 里有一段内联脚本，在首绘前按 `localStorage.theme`（没存过则跟系统 `prefers-color-scheme`）决定要不要加 `.dark`，所以不会出现明暗闪烁；`<html>` 上的 `suppressHydrationWarning` 就是给这段脚本用的，不要删。切换按钮在 `theme-toggle.tsx`，它只负责改类名 + 写 localStorage，按钮外观完全交给 CSS 的 `dark:` 变体（因此组件不需要任何 state）。
- **页面底色只由根元素提供**：`html` 上的 `background-color: var(--background)` 会铺满整个画布（canvas），包含横向溢出出来的区域；页面容器（`page.tsx`、`about/page.tsx`、`building.tsx` 那层）**不要**再写 `bg-zinc-50 dark:bg-black` 之类的背景类。否则一旦出现横向滚动（例如小屏下导航栏溢出），溢出区露出的是根背景，就会和内容区形成两套颜色的接缝。卡片类组件（如 `profile.tsx` 的 `bg-white dark:bg-zinc-950`）不受此限，仍然要自己的背景。
- **边框色**：全局默认边框色是 `globals.css` 的 `--border`（浅色 `#e4e4e7`，深色 `#27272a`）。Tailwind 4 的 preflight 不再设置默认 `border-color`（等价于 `currentColor`），所以项目在 `@layer base` 中补回了 `border-color: var(--border)` —— 写 `border` / `border-2` 就会自动用这个颜色，不要在每个组件里重复写死 `border-zinc-200 dark:border-zinc-800`。个别元素要改用别的颜色时，用 `border-<color>` 覆盖；描边（`ring-2`）可写 `ring-border` 保持同色。
- **毛玻璃小面板**：贴在图片/背景上的文字块统一用 `glass-panel` 系列工具类（定义在 `globals.css`），尺寸与字号见下方[毛玻璃小面板](#毛玻璃小面板glass-panel)一节，不要在组件里重复写这些值。
- **字体**：使用 `next/font/google` 加载 Geist 与 Geist Mono，以 CSS 变量 `--font-geist-sans` / `--font-geist-mono` 暴露。
- **层叠顺序**：导航栏是 `sticky top-4 z-50`；排在导航之后的定位元素（`relative` / `absolute`）默认会盖住导航，改动布局时要留意。
- **图片**：`public/` 下的图片用 `<Image src="/banner.jpg" … />` 引用。Next 16 已弃用 `priority`，首屏图片改用 `loading="eager"`；不裁切地铺满容器宽度时用 `fill` + `sizes="100vw"` + 与图片同比例的外框（现有配图都是 16:9，用 `aspect-video`）。配图请控制在 **2560px 宽以内**：源图过大时，优化器首次生成某个宽度可能要几十秒（实测 10000px 源图出现超过 60s 不返回的情况），这期间浏览器拿不到图片，横幅会一直是一片空白。
- **新增页面**：在 `src/app` 下建目录 + `page.tsx`，同时别忘了在 `src/components/navbar.tsx` 顶部的 `links` 数组里补上导航链接（数组同时驱动桌面端链接行和移动端折叠菜单，只需加一条）。

### 毛玻璃样式（glass-panel / glass-bar）

定义在 `src/app/globals.css`，用 Tailwind 4 的 `@utility` 注册，写在一起是为了以后只改一处就能全局生效。

| 工具类 | 作用 | 小屏（< 640px） | ≥ 640px（`sm:`） |
| --- | --- | --- | --- |
| `glass-panel` | 面板外观 | `bg-black/30` + `backdrop-blur-sm`（`blur(8px)`）、圆角 `11px`、左右内边距 `8px`、上下 `0` | 同左（不随断点变化） |
| `lightedge` | 采样描边（通用）：只管 `::after` 画环，参数全走 `:root` 令牌 | `--lightedge-inset: -0.5px`、`--lightedge-width: 1px`、`--lightedge-tint: transparent`、滤镜链四项（见下）；mask 挖环、圆角 `inherit` | 同左 |
| `lightedge-solid` | 只把 `--lightedge-tint` 换成 `--lightedge-line`（描边色），环的其它样式一概不碰 | 与 `lightedge` 同时使用 | 同左 |
| `lightedge-<数字>` | 按元素覆盖描边宽度（`lightedge-2` = 2px，支持小数如 `lightedge-0.5`）；不写就用 `:root` 的 `--lightedge-width` | 同左 | 同左 |
| `lightedge-inset-<数字>` / `-lightedge-inset-<数字>` | 按元素覆盖环的位置：正值往内缩（`lightedge-inset-2` = 往内 2px，`lightedge-inset-0` = 压在边缘上），负值往外伸（`-lightedge-inset-5` = 往外 5px，默认骑边的 `-0.5px` 相当于 `-lightedge-inset-0.5`） | 同左 | 同左 |
| `lightedge-blur-<数字>` | 采样模糊：`lightedge-blur-4` = 4px | 同左 | 同左 |
| `lightedge-brightness-<数字>` | 提亮强度（百分比）：`lightedge-brightness-150` = 150% | 同左 | 同左 |
| `lightedge-saturate-<数字>` | 饱和度（百分比）：`lightedge-saturate-300` = 300% | 同左 | 同左 |
| `lightedge-contrast-<数字>` | 对比度（百分比）：`lightedge-contrast-120` = 120% | 同左 | 同左 |
| `glass-panel-title` | 标题字号 | `14px` / 行高 `20px` | `36px` / 行高 `40px` |
| `glass-panel-subtitle` | 副标题字号 | `10px` / 行高 `15px` | `18px` / 行高 `28px` |

用法：目标元素包进一层 `lightedge`，圆角要与目标对齐（`::after` 用 `inherit`）；目标自己没有 `backdrop-filter` 时（卡片、导航胶囊）可以直接把 `lightedge` 加在它自己身上，只有自带 `backdrop-filter` 的面板需要外套一层：

```tsx
// 面板：自带 backdrop-filter，必须外套一层（环才能采样到面板外侧的原图）
<div className="lightedge rounded-[12px]">
  <h1 className="glass-panel glass-panel-title font-semibold tracking-tight text-white">
</div>

// 卡片：内部就是图片，inset 设 0 让环压在图上；此时不要再用 border-2，否则会变成双层边
<section className="lightedge overflow-hidden rounded-3xl [--lightedge-inset:0px] …">

// 图片这类替换元素（img / video）挂不了伪元素：外套一层管定位，再单起一层覆盖层管描边。
// 覆盖层排在图片之后 + inset 0 → 环整圈压在图片上，所以只用 lightedge（纯采样）拿到高亮（头像就是这么做的）
// 负数 inset 把环往外推，可以做「脱开图片一圈」的光晕
<div className="relative h-28 w-28">
  <Image … className="h-full w-full rounded-full object-cover" />
  <div className="lightedge lightedge-3 -lightedge-inset-5 pointer-events-none absolute inset-0 rounded-full [--lightedge-tint:transparent]" />
</div>

// 纯色背景上的卡片/导航：加 lightedge-solid 让环有一条稳定的描边；想改这一处的粗细就加 lightedge-<数字>
<section className="lightedge lightedge-2 lightedge-solid rounded-3xl bg-white …">
<div className="glass-bar lightedge lightedge-solid rounded-full p-4 …">
```

**想调环的样子，只改令牌**（环本身不写死值）：

| 令牌 | 默认值 | 作用 |
| --- | --- | --- |
| `--lightedge-inset` | `-0.5px` | 环相对边缘的位置：负值骑在边上、一半采样外部；设 `0px` 则完全坐落在目标内部（可用 `lightedge-inset-<数字>` / `-lightedge-inset-<数字>` 按元素覆盖） |
| `--lightedge-width` | `1px` | 环宽（可用 `lightedge-<数字>` 按元素覆盖） |
| `--lightedge-blur` | `8px` | 采样模糊（`lightedge-blur-<数字>`） |
| `--lightedge-brightness` | `200%` | 提亮强度（`lightedge-brightness-<数字>`） |
| `--lightedge-saturate` | `200%` | 饱和度（`lightedge-saturate-<数字>`） |
| `--lightedge-contrast` | `100%` | 对比度（`lightedge-contrast-<数字>`），默认 100% 即不做处理，只为单独调它留个位置 |
| `--lightedge-filter` | 未定义（默认由上面四项在 `lightedge` 里拼出来） | 整体换掉滤镜链时设它，例如 `[--lightedge-filter:blur(2px)_invert(1)]` |
| `--lightedge-tint` | `transparent`（`lightedge-solid` 设为 `--lightedge-line`） | 环上盖的一层固定色；不透明时会把采样到的那层完全遮住 |
| `--lightedge-line` | 亮色 `var(--border)`、暗色 `color-mix(in oklab, var(--border), white 20%)` | `lightedge-solid` 用的描边色，分模式定义 |

单个位置要单独调，在元素上写任意属性覆盖即可（如 `[--lightedge-inset:0px]`）—— 令牌默认值写在 `:root`，任意属性的优先级始终更高。新位置也只需要 `lightedge` + 需要时加 `lightedge-solid`。

说明：字号类之间是互斥的（标题用 `glass-panel-title`、副标题用 `glass-panel-subtitle`）；圆角在移动端视觉上接近胶囊形，因为 `11px` 会被浏览器按面板高度的一半裁切，这是有意保留的效果。

描边不用固定颜色（纯色看着太平、像贴了一圈塑料），而是让它去**采样边缘背后的内容**并提亮：`lightedge::after` 骑在边上（`inset: -0.5px`，也能用 `[--lightedge-inset:0px]` 改成完全落在内侧，适合内部就是图片的卡片），`padding: var(--lightedge-width)` + `mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)` + `mask-composite: exclude` 挖出 1px 的一圈，滤镜链由 `--lightedge-filter` 或四项单项令牌拼成。

滤镜链按顺序作用，四项各司其职：`blur` 与目标保持一致（两边才是同一层玻璃的观感）；`brightness` 控制亮边强度；`saturate` 补回被提亮冲淡的颜色 —— 提亮会把亮部推向白色、压缩色差，不加饱和度这条边会显得发灰发白，而不是「被照亮」；`contrast` 默认 100%（不做处理），只在需要时调。背景亮则边亮、背景暗则边暗。

> **纯色背景上要加 `lightedge-solid`**：效果靠采样得来，背景是纯色时提亮等于不变 —— 深色模式下纯黑提亮仍是黑，浅色模式下 `#fafafa` 提亮成白也看不出来。所以横幅卡片、图片上的文字面板、头像直接用 `lightedge`（环都压在图片上）；个人名片卡片、导航胶囊这类背景是纯色的位置要叠 `lightedge-solid`，让环改用 `--lightedge-line` 这个固定描边色：亮色下它就是 `--border`（与原来的 1px 边框完全一致），暗色下把 `--border` 往白里提了 20%（`#27272a` → oklab L 0.27→0.42），否则黑底上会显得很暗。想要更亮就把 20% 调大，想回到原本的边框色就设成 0%。

> **`--lightedge-*` 令牌会向下继承，嵌套的环要显式重置**：`lightedge-solid` 是靠设置 `--lightedge-tint` 起作用的，而自定义属性会被子元素继承 —— 嵌在 `-solid` 元素里的另一个环（比如名片卡片里的头像）会连带拿到那条不透明描边色，采样的高亮就没了；滤镜四项（`blur/brightness/saturate/contrast`）同理。要在里面用纯采样的环，必须写 `[--lightedge-tint:transparent]` 把它重置掉。
>
> 另外，正因为会有继承，**滤镜链不能预先在 `:root` 里拼好**：自定义属性是在「声明它的那个元素」上解析的，写在 `:root` 就等于把 8px / 200% 钉死在根元素上，子元素再改单项旋钮也不会生效。所以拼接放在 `lightedge::after` 的使用处（`var(--lightedge-filter, blur(var(--lightedge-blur)) …)`）——未定义时用四项拼，定义了就用整条。

> **底层顺序：`backdrop-filter` 提亮的是环「背后」的像素，环自己的背景色是压在这层之上的**，所以色调越不透明、采样的贡献越小。完全不透明就等于一条纯色描边 —— 纯色背景上本来就没什么可采样，这正是 `lightedge-solid` 的取舍；背后真的是图片的位置就只用 `lightedge`，让色调保持 `transparent`。

> **描边要画在面板外面（那层薄外壳上），不能写成面板自己的 `::before` / `::after`**：`glass-panel` 的 `backdrop-filter` 会创造一个「backdrop root」，它内部的一切（包括伪元素）只能采样到面板内部那层已压暗、已模糊的合成结果，所以再怎么提高 `brightness()` 也亮不起来。实测：写成面板内部伪元素时，边缘亮度只有 **126**，比旁边的 **140** 还暗；移到外壳上之后，边缘明显亮于面板内部。

> 顺便说明两个概念，免得以后踩坑：`filter` 处理的是**元素自己**（内容和子元素一起被处理），`backdrop-filter` 处理的是**元素背后已经画好的内容** —— 毛玻璃靠的是后者，所以面板自己不会糊，糊的是它背后的图。而 `::before` / `::after` 是浏览器生成的**子元素**，`before` 指的是「在元素内容之前」，不是「在父元素之前」，所以伪元素永远画在自己父元素的背景之上，不可能跑到它背后。

> 这也解释了为什么早先那条「偶发给出的边缘亮线」挺好看：它不是 CSS 画的，而是 `backdrop-filter` 在合成边缘时留下的 1px 伪影，恰好也是「跟着背景亮度走」。现在的实现把这个效果变成了确定可复现的样式。

#### `glass-bar`（导航栏与折叠菜单）

导航栏胶囊和它的折叠菜单共用同一个工具类 `glass-bar`：`bg-zinc-50/70 dark:bg-black/60` + `backdrop-blur-sm` + `overflow: clip`（描边由 `lightedge lightedge-solid` 提供，就写在同一元素上）。圆角与内边距不抽离，由各自元素设置 —— 胶囊是 `rounded-full p-4`，菜单是 `rounded-3xl p-2`。

`overflow: clip` 是防溢出的保险：万一里层内容有几像素溢出（文案变长、断点临界值等），就地裁掉，而不是漏到外面把整页撑出横向滚动条（实测往胶囊里塞 2000px 宽的元素，页面 `scrollWidth` 仍等于视口宽）。用 `clip` 而不是 `hidden`，是为了不把胶囊变成可滚动容器；另外**不要**把它加到外层那个只负责 `sticky` 的容器上，否则绝对定位的折叠菜单会被一起裁掉。

> **注意 `backdrop-filter` 的 backdrop root 行为**：带 `backdrop-filter` 的元素会成为其子元素的「backdrop root」，导致子元素上的 `backdrop-blur` 只能采到该元素自身的内容，看起来就像模糊没生效。所以折叠菜单必须与胶囊本体**平级**（都放在那个只负责 `sticky` + `m-4` 的 `<nav>` 里），不能嵌在带模糊的胶囊内部。

## 部署

推荐部署到 [Vercel](https://vercel.com/new)（Next.js 官方平台，零配置）。仓库远端为 `git@github.com:Rebuild-yzl/SKBlog.git`。

部署前建议先执行 `npm run build` 和 `npm run lint` 确认无报错。

## 待办

- [ ] 用正式内容替换各页面的 `Building` 占位组件
- [x] 更新 `src/app/layout.tsx` 中的 `metadata`（当前仍是 `Create Next App` / `Generated by create next app`）
- [x] 移动端适配：导航栏在 < 768px（`md` 断点）折叠为汉堡菜单，原来 8 个链接撑出 690px 横向溢出的问题已解决（420~1280px 实测溢出均为 0）
- [x] 压缩 `public/banner.jpg`：10000×5625（15.5 MB）→ 2560×1440（536 KB），比例不变，屏幕上看得见的分辨率没有损失（原图仍在 `fcdc453` 那个提交里，`git show fcdc453:public/banner.jpg > public/banner.jpg` 可取回）
- [ ] 将 `public/` 中的 create-next-app 默认 SVG 替换为站点自有资源（`avartor.jpg` 为头像）
- [x] 桌面端明暗切换入口：导航栏右侧放了 `ThemeToggle variant="icon"`（图标形态，`sr-only` 文案做无障碍名称），小屏仍用折叠菜单底部的整行按钮
- [ ] 补充 LICENSE
