import type { Metadata } from "next";
import Link from "next/link";
import MusicPanel from "@/components/music-panel";
import MusicBackdrop from "@/components/music-backdrop";
import NothingHere from "@/components/nothing-here";
import SongRow from "@/components/song-row";
import { getPlaylists } from "@/lib/music";

export const metadata: Metadata = {
  title: "音乐收藏 | NeuroSaiKou",
  description: "NeuroSaiKou 收藏的单曲",
};

export default function MusicFavorites() {
  const playlists = getPlaylists();
  const total = playlists.reduce(
    (sum, playlist) => sum + playlist.songs.length,
    0,
  );

  if (total === 0) {
    return (
      <NothingHere
        title="还没有收藏单曲"
        description="在笔记仓库里给一篇笔记加上 type: music，正文每行写一个网易云歌曲 ID，就会出现在这里。"
      />
    );
  }

  return (
    /* isolate：让背景层的 -z-10 只在本页这一层生效（压在内容下、html 背景上） */
    <div className="relative isolate flex flex-1 flex-col gap-6 p-6 font-sans lg:px-8">
      <MusicBackdrop />
      <header className="flex flex-col gap-1">
        <Link
          href="/favorites"
          className="w-fit text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Favorites
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          音乐收藏
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {`${playlists.length} 个歌单、共 ${total} 首 —— 点任意一行开始播放`}
        </p>
      </header>

      {/* 大屏：左播放器（粘性）+ 右曲目列表；小屏：上下堆叠 */}
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <MusicPanel className="lg:sticky lg:top-24 lg:self-start" />

        <div className="flex flex-col gap-8">
          {playlists.map((playlist) => (
            <section key={playlist.id} className="flex flex-col gap-2">
              <h2 className="flex items-baseline gap-2 text-xs tracking-wider text-zinc-500 dark:text-zinc-400">
                {playlist.name}
                <span className="text-zinc-400 dark:text-zinc-500">
                  {`${playlist.songs.length} 首`}
                </span>
              </h2>
              <ul className="flex flex-col gap-1">
                {playlist.songs.map((song, index) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    playlistId={playlist.id}
                    index={index}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
