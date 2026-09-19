# 开发约定

- **路径别名**：`@/*` 指向 `src/*`（见 `tsconfig.json`），例如 `import Profile from "@/components/profile"`。
- **组件 props**：可配置的组件用带默认值的可选 props（参考 `profile.tsx`），页面里直接 `<Profile />` 即可使用。
- **组件位置**：可复用组件放在 `src/components/`，页面级代码放在 `src/app/<route>/page.tsx`。
- **样式**：Tailwind CSS 4 通过 `@import "tailwindcss"` 引入；自定义设计令牌写在 `globals.css` 的 `@theme inline` 中，不要使用 Tailwind 3 时代的 `tailwind.config.js` 写法。
- **明暗色**：由 `<html>` 上的 `.dark` 类驱动 —— `globals.css` 里用 `@custom-variant dark (&:where(.dark, .dark *))` 把它接到 Tailwind 的 `dark:` 变体，`--background` / `--foreground` / `--border` 在 `:root` 与 `.dark` 中各定义一套（同时设 `color-scheme`）。`layout.tsx` 的 `<head>` 里有一段内联脚本，在首绘前按 `localStorage.theme`（没存过则跟系统 `prefers-color-scheme`）决定要不要加 `.dark`，所以不会出现明暗闪烁；`<html>` 上的 `suppressHydrationWarning` 就是给这段脚本用的，不要删。切换按钮在 `theme-toggle.tsx`，它只负责改类名 + 写 localStorage，按钮外观完全交给 CSS 的 `dark:` 变体（因此组件不需要任何 state）。
- **页面底色只由根元素提供**：`html` 上的 `background-color: var(--background)` 会铺满整个画布（canvas），包含横向溢出出来的区域；页面容器（`page.tsx`、`about/page.tsx`、`blogs/page.tsx` 那层）**不要**再写 `bg-zinc-50 dark:bg-black` 之类的背景类。否则一旦出现横向滚动（例如小屏下导航栏溢出），溢出区露出的是根背景，就会和内容区形成两套颜色的接缝。卡片类组件（如 `profile.tsx` 的 `bg-white dark:bg-zinc-950`）不受此限，仍然要自己的背景。
- **边框色**：全局默认边框色是 `globals.css` 的 `--border`（浅色 `#e4e4e7`，深色 `#27272a`）。Tailwind 4 的 preflight 不再设置默认 `border-color`（等价于 `currentColor`），所以项目在 `@layer base` 中补回了 `border-color: var(--border)` —— 写 `border` / `border-2` 就会自动用这个颜色，不要在每个组件里重复写死 `border-zinc-200 dark:border-zinc-800`。个别元素要改用别的颜色时，用 `border-<color>` 覆盖；描边（`ring-2`）可写 `ring-border` 保持同色。
- **毛玻璃小面板**：贴在图片/背景上的文字块统一用 `glass-panel` 系列工具类（定义在 `globals.css`），尺寸与字号见 [styling.md](./styling.md#毛玻璃小面板glass-panel)，不要在组件里重复写这些值。
- **字体**：使用 `next/font/google` 加载 Geist 与 Geist Mono，以 CSS 变量 `--font-geist-sans` / `--font-geist-mono` 暴露。
- **层叠顺序**：导航栏是 `sticky top-4 z-50`；排在导航之后的定位元素（`relative` / `absolute`）默认会盖住导航，改动布局时要留意。
- **图片**：`public/` 下的图片用 `<Image src="/banner.jpg" … />` 引用。Next 16 已弃用 `priority`，首屏图片改用 `loading="eager"`；不裁切地铺满容器宽度时用 `fill` + `sizes="100vw"` + 与图片同比例的外框（现有配图都是 16:9，用 `aspect-video`）。配图请控制在 **2560px 宽以内**：源图过大时，优化器首次生成某个宽度可能要几十秒（实测 10000px 源图出现超过 60s 不返回的情况），这期间浏览器拿不到图片，横幅会一直是一片空白。
- **第三方图标/图片**：不要在 JSX 里直接写外链——那会让每个访客去请求第三方 CDN（还可能被墙），页面也就依赖了一个我们控制不了的服务。需要外部图标时走「构建时抓取 + 自托管」：清单是唯一来源（例如工具图标放在 `src/lib/tool-icons.json`），由 `scripts/` 下的脚本在 `predev` / `prebuild` 里抓到 `public/icons/`（该目录已 gitignore），页面用 `<Image unoptimized />` 引用本地路径（Next 默认不优化 SVG）。脚本的失败策略与 `notes:sync` 一致：CI 严格失败、本地只警告，日志分别以 `[notes]` / `[icons]` 开头。
- **唯一的运行时外链例外是音乐**：音频必须由浏览器直接找平台要（第三方解析接口只做 302，音频不经过我们），所以元信息在构建期抓取缓存、**音频地址不缓存**；失败时降级成"去平台听"链接。见 `docs/notes-sync.md` 的音乐收藏一节与 `src/components/music-player.tsx`。
- **新增页面**：在 `src/app` 下建目录 + `page.tsx`，同时别忘了在 `src/components/navbar.tsx` 顶部的 `links` 数组里补上导航链接（数组同时驱动桌面端链接行和移动端折叠菜单，只需加一条）。
