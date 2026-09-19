/*
 * 收藏页（/favorites）的分类清单。
 *
 * 加一个新分类只要往数组里加一行：图标按 `icon` 字段选（见 app/favorites/page.tsx），
 * `soon: true` 的条目会渲染成置灰、不可点、带「敬请期待」小胶囊。
 */
export type CollectionIcon = "music" | "image";

export type Collection = {
  id: string;
  title: string;
  description: string;
  icon: CollectionIcon;
  /** 分类页要跳去哪；`soon` 的条目可以不写 */
  href?: string;
  soon?: boolean;
};

export const COLLECTIONS: Collection[] = [
  {
    id: "music",
    title: "音乐收藏",
    description: "来自笔记仓库的单曲，点开就能在站内播放",
    icon: "music",
    href: "/favorites/music",
  },
  {
    id: "images",
    title: "图片收藏",
    description: "还没做——想收的图先放笔记里也行",
    icon: "image",
    soon: true,
  },
];
