"use client";

import Image from "next/image";
import { useNowPlaying } from "@/components/music-player";

/*
 * 音乐页的整屏背景：把当前那首的封面放大、重模糊铺满视口，再压一层 scrim 保证文字可读。
 *
 * 和 MusicCard 的背板同源（都是"拿封面当底色"），区别是这里作用在页面级：fixed 铺满视口、
 * 压在内容下面 —— 所以它必须挂在音乐页那层 `relative isolate` 容器里（见 favorites/music/page.tsx）。
 *
 * 浓度由 scrim 的透明度决定：想更浓就把 bg-white/65 调低（比如 /40），想更干净就调高。
 * 这里不取色、也不需要 CORS，纯普通 <img> 铺底。
 */
export default function MusicBackdrop() {
  const { song } = useNowPlaying();
  if (!song?.cover) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* key 换成封面 URL：换歌时这一层重建，配合下面的淡入动画 */}
      <Image
        key={song.cover}
        src={song.cover}
        alt=""
        width={640}
        height={640}
        unoptimized
        className="music-backdrop-in size-full scale-150 object-cover blur-3xl saturate-150"
      />
      <div className="absolute inset-0 bg-white/65 dark:bg-black/70" />
    </div>
  );
}
