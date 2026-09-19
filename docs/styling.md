# 毛玻璃样式（glass-panel / blur-card / LightedgeBlurCard）

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
// 毛玻璃卡片：用组件，别自己把 lightedge 挂在 blur-card 上（原因见下文）
<LightedgeBlurCard radiusClassName="rounded-full" className="p-4 …">
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

## `blur-card` 与 `LightedgeBlurCard`（毛玻璃卡片）

`blur-card` 是毛玻璃卡片本体的工具类：半透明底 + `backdrop-filter` + `overflow: clip`，圆角、内边距、尺寸都由使用处设置。它**只管模糊，不管描边**。

要带描边的毛玻璃卡片（导航栏胶囊与折叠菜单、播放条）统一用 `LightedgeBlurCard`：

```tsx
<LightedgeBlurCard radiusClassName="rounded-full" className="p-4" wrapperClassName="sticky top-4">
  …
</LightedgeBlurCard>
```

它渲染出来的结构是「外壳 + 假 border + 卡片」，假 border 与卡片**平级**、并且画在卡片**下面**：

```
<div class="relative">            只负责定位
  <div class="lightedge …">       假 border（先画 → 在卡片下面，采样到的是卡片背后的页面）
  <div class="blur-card …">…</div> 卡片本体
</div>
```

**为什么不能把描边直接挂在 `blur-card` 上**：`backdrop-filter` 会创建「backdrop root」，它内部的一切（包括自己的伪元素）只能采样到「自己那层已经模糊过的合成结果」，边缘提亮就失效了 —— 和文档开头那条实测（126 vs 140）是同一个原因。搬到卡片外面之后，假 border 采样到的是页面，再压上 `--lightedge-line` 的色调，才是一条跟着背景走的模拟描边。画在下面而不是上面，是为了让它的采样范围里不含卡片本身。

环的粗细与位置继续用现成的 `lightedge-*` 工具类调，通过 `borderClassName` 传进来（例如 `lightedge-2`、`-lightedge-inset-1` 让整条环完全落在卡片外侧）。

`overflow: clip` 是防溢出的保险：万一里层内容有几像素溢出（文案变长、断点临界值等），就地裁掉，而不是漏到外面把整页撑出横向滚动条（实测往胶囊里塞 2000px 宽的元素，页面 `scrollWidth` 仍等于视口宽）。用 `clip` 而不是 `hidden`，是为了不把它变成可滚动容器；另外**不要**把它加到外层那个只负责 `sticky` 的容器上，否则绝对定位的折叠菜单会被一起裁掉。

> **注意 `backdrop-filter` 的 backdrop root 行为**：带 `backdrop-filter` 的元素会成为其子元素的「backdrop root」，导致子元素上的 `backdrop-blur` 只能采到该元素自身的内容，看起来就像模糊没生效。所以折叠菜单必须与胶囊本体**平级**（都放在那个只负责 `sticky` + `m-4` 的 `<nav>` 里），不能嵌在带模糊的胶囊内部。
