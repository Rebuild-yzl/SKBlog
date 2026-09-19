"use client";

import Image from "next/image";
import { useMusicPlayer } from "@/components/music-player";
import type { Song } from "@/lib/music";

/* 收藏页里的一行：整行可点，点了就播这首（播放器在根布局里，切页不中断） */
export default function SongRow({
  song,
  playlistId,
  index,
}: {
  song: Song;
  playlistId: string;
  index: number;
}) {
  const { play, currentSongId } = useMusicPlayer();
  const active = currentSongId === song.id;

  return (
    <li>
      <button
        type="button"
        onClick={() => play(playlistId, song.id)}
        aria-label={`播放 ${song.title}`}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
          active
            ? "text-zinc-900 dark:text-zinc-50"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-400">
          {active ? "▶" : index + 1}
        </span>

        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
          {song.cover ? (
            <Image
              src={song.cover}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="size-full object-cover"
            />
          ) : null}
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{song.title}</span>
          {song.artist ? (
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {song.artist}
            </span>
          ) : null}
          {song.note && song.note !== song.title ? (
            <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">
              {song.note}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
