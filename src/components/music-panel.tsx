"use client";

import Image from "next/image";
import LightedgeBlurCard from "@/components/lightedge-blur-card";
import { PlayerIcon, formatTime, useMusicPlayer } from "@/components/music-player";

/*
 * 音乐页的大播放器：和迷你条共用同一份播放状态（见 music-player.tsx 的 provider），
 * 所以这边点播放、那边切页，听到的始终是同一首。
 *
 * 空态规则：优先当前 / 上次听的那首（provider 已从 localStorage 恢复），没有才退回
 * 第一个歌单的第一首——只显示、不自动播放；播放键在这种情况下走 play() 而不是 toggle()。
 */
export default function MusicPanel({ className = "" }: { className?: string }) {
  const {
    playlists,
    currentSongId,
    currentSong,
    currentPlaylistId,
    playing,
    progress,
    duration,
    volume,
    failed,
    play,
    toggle,
    next,
    prev,
    seek,
    setVolume,
  } = useMusicPlayer();

  const fallbackSong = playlists[0]?.songs[0];
  const song = currentSong ?? fallbackSong;
  if (!song) return null;

  const playlistId = currentPlaylistId ?? playlists[0]?.id ?? "";
  const playlistName = playlists.find((item) => item.id === playlistId)?.name;
  /* 只有"这首歌就是当前选中的那首"时，进度/时长/失败状态才属于它 */
  const isCurrent = currentSongId === song.id;
  const total = isCurrent ? duration : 0;
  const elapsed = isCurrent ? progress : 0;
  const failedNow = isCurrent && failed;

  return (
    <LightedgeBlurCard
      wrapperClassName={className}
      /*
       * 窄屏与 lg（面板被挤在窄栏里）：上下堆叠。
       * md（面板占满整行）：封面占左列并跨过右侧四行，其余四块内容在右列竖排。
       */
      className="grid grid-cols-1 gap-5 p-6 md:grid-cols-[176px_minmax(0,1fr)] md:items-center md:gap-x-6 lg:grid-cols-1 lg:gap-5"
    >
      {/* 大号封面：圆形；宽度封顶，免得宽屏下变成一个巨大的圆 */}
      <div className="lightedge lightedge-4 lightedge-brightness-260 relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-full bg-zinc-100 md:col-start-1 md:row-span-4 lg:col-auto lg:row-span-1 dark:bg-zinc-900">
        {song.cover ? (
          <Image
            src={song.cover}
            alt=""
            width={640}
            height={640}
            unoptimized
            className="size-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <p className="truncate text-lg font-medium">{song.title}</p>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          {[song.artist, playlistName].filter(Boolean).join(" · ")}
        </p>
        {song.note && song.note !== song.title ? (
          <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
            {song.note}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={prev}
          aria-label="上一首"
          className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <PlayerIcon name="prev" className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => (isCurrent ? toggle() : play(playlistId, song.id))}
          aria-label={isCurrent && playing ? "暂停" : "播放"}
          className="rounded-full bg-zinc-900 p-3 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <PlayerIcon
            name={isCurrent && playing ? "pause" : "play"}
            className="size-6"
          />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="下一首"
          className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <PlayerIcon name="next" className="size-5" />
        </button>

        {failedNow ? (
          <a
            href={`https://music.163.com/#/song?id=${song.id}`}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-xs underline"
          >
            去平台听
          </a>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={Number.isFinite(total) ? total : 0}
          step={1}
          value={Math.min(elapsed, Number.isFinite(total) ? total : 0)}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="播放进度"
          className="h-1 w-full accent-zinc-900 dark:accent-zinc-100"
        />
        <span className="shrink-0 font-mono text-xs text-zinc-500">
          {formatTime(elapsed)}/{formatTime(total)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <PlayerIcon name="volume" className="size-4 shrink-0 text-zinc-500" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="音量"
          className="h-1 w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>
    </LightedgeBlurCard>
  );
}
