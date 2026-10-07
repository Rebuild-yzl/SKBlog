/*
 * Obsidian 语法 → 标准 Markdown 的两个 remark 插件（只在构建期/服务端跑）。
 *
 *   remarkObsidianImages   把 ![[x.jpg]] / ![alt](path) 换成标准 image 节点，地址取构建期清单；
 *                          「整行只有一张图」的还会带上 data-photo-index，供图片详情遮罩层做点击
 *                          委托（编号与 blog 的 images 列表、相册的 photos 列表严格一一对应）
 *   remarkObsidianCallouts 把 > [!info] 这类引用块标成 callout（颜色与图标见 components/callout.tsx）
 *
 * 双链 [[笔记名]] 与非图片嵌入 ![[某文档]] 这一轮不处理，按原样文本显示。
 */
import { parseImageRefs } from "./note-images.mjs";

/**
 * 深度优先遍历有 children 的节点；visitor 返回数组时，用返回的节点替换当前节点。
 * @param {any} node
 * @param {(node: any) => any[] | undefined} visitor
 */
function walk(node, visitor) {
  const children = node?.children;
  if (!Array.isArray(children)) return;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const replacement = visitor(child);
    if (Array.isArray(replacement)) {
      children.splice(index, 1, ...replacement);
      index += replacement.length - 1;
      continue;
    }
    walk(child, visitor);
  }
}

/**
 * 图片引用插件。
 * @param {{ getImage: (ref: string, alt?: string) => any, photoRefs?: string[] }} options
 *   getImage  查构建期清单（页面传 src/lib/note-images.ts 里的 getNoteImage）
 *   photoRefs 这次内容里「算作照片」的引用，按出现顺序（blog 传 post.images 的 ref 列表）。
 *             给了它才会打 data-photo-index，下标就是它在 photoRefs 里的位置，
 *             与图片详情遮罩的列表一一对应；不给（例如渲染图片说明时）一律不编号。
 */
export function remarkObsidianImages(options = {}) {
  const { getImage, photoRefs } = options;

  return (tree, file) => {
    // 「整行只有这一张图」用源码偏移量判断，和 src/lib/note-images.ts 的 bodyPhotos 同源：
    // 列表的 "- "、引用的 "> " 都算这一行还有别的字符，两边都判定它不是照片。
    // （不能只看「这一段里只有一张图」——笔记里常见「正文\n![[图]]」，那是同一段。）
    const source = typeof file?.value === "string" ? file.value : undefined;
    const queue = Array.isArray(photoRefs) ? [...photoRefs] : undefined;
    let stamped = 0;

    const isOwnLine = (textNode, ref) => {
      const start = textNode.position?.start?.offset;
      if (typeof start !== "number" || source === undefined) return false;

      const absStart = start + ref.index;
      const absEnd = absStart + ref.raw.length;
      const lineStart = source.lastIndexOf("\n", absStart - 1) + 1;
      const rawEnd = source.indexOf("\n", absEnd);
      const lineEnd = rawEnd === -1 ? source.length : rawEnd;

      return (
        source.slice(lineStart, absStart).trim() === "" &&
        source.slice(absEnd, lineEnd).trim() === ""
      );
    };

    walk(tree, (node) => {
      if (node.type !== "text" || typeof node.value !== "string") return undefined;

      const refs = parseImageRefs(node.value);
      if (refs.length === 0) return undefined;

      const parts = [];
      let cursor = 0;

      for (const ref of refs) {
        if (ref.index > cursor) {
          parts.push({ type: "text", value: node.value.slice(cursor, ref.index) });
        }

        const image = getImage(ref.raw, ref.alt);
        const url = typeof image && typeof image.url === "string" ? image.url : undefined;
        const properties = { "data-ref": ref.raw };
        if (!url) properties["data-missing"] = "true";

        // 独占一行的图才编号，缺图、夹在句子里、写在列表或引用里的都拿不到编号（也就不进遮罩列表）
        if (queue && queue.length > 0 && queue[0] === ref.raw && isOwnLine(node, ref)) {
          properties["data-photo-index"] = String(stamped);
          stamped += 1;
          queue.shift();
        }

        parts.push({
          type: "image",
          url: url ?? "",
          alt: (image && image.alt) ?? ref.alt ?? "",
          title: null,
          data: { hProperties: properties },
        });

        cursor = ref.index + ref.raw.length;
      }

      if (cursor < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(cursor) });
      }

      return parts;
    });
  };
}

/**
 * callout 插件：识别引用块第一段的 `[!type]`（`[!type]-` / `[!type]+` 是折叠标记），
 * 把标记从正文里摘掉，类型、标题与折叠标记写到 hast 属性上，由 components/blockquote 分流渲染。
 */
export function remarkObsidianCallouts() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== "blockquote") return undefined;

      const first = node.children?.[0];
      if (!first || first.type !== "paragraph") return undefined;

      const text = first.children?.[0];
      if (!text || text.type !== "text" || typeof text.value !== "string") return undefined;

      // `> [!info]` 与 `>[!info]` 都要认：标记必须在这一段的最开头
      const match = /^\[!([^\]]+)\]([+-]?)[ \t]*([^\n]*)\n?/.exec(text.value);
      if (!match) return undefined;

      text.value = text.value.slice(match[0].length);
      if (text.value.length === 0) first.children.shift();
      if (first.children.length === 0) node.children.shift();

      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          "data-callout": match[1].trim().toLowerCase(),
          "data-callout-title": match[3].trim(),
          "data-callout-fold": match[2],
        },
      };

      return undefined;
    });
  };
}
