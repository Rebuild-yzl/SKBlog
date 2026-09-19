import type { Metadata } from "next";
import NothingHere from "@/components/nothing-here";
import SongRow from "@/components/song-row";
import { getPlaylists } from "@/lib/music";

export const metadata: Metadata = {
  title: "Favorites | NeuroSaiKou",
  description: "NeuroSaiKou 收藏的单曲",
};

export default function Favorites() {
  const playlists = getPlaylists();
  const total = playlists.reduce(
    (sum, playlist) => sum + playlist.songs.length,
    0,
  );

  if (total === 0) {
    return (
      <NothingHere
        title="No favorites yet"
        description="在笔记仓库里给一篇笔记加上 type: music，正文每行写一个网易云歌曲 ID，就会出现在这里。"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 font-sans lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Favorites
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {`${playlists.length} 个歌单、共 ${total} 首 —— 点任意一行开始播放。`}
        </p>
      </header>

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
  );
}
