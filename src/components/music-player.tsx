"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import LightedgeBlurCard from "@/components/lightedge-blur-card";
import type { Playlist, Song } from "@/lib/music";

/*
 * 站内音乐播放器。
 *
 * 音频从哪来：<audio> 的 src 直接指向解析接口（type=url），浏览器自己跟随 302 去网易云
 * CDN 取音频 —— 音频既不经过我们的服务器，也不经过那个第三方服务（它只做重定向）。
 * 正因如此地址不能缓存：它是带签名的临时地址，每次播放都要现取。
 *
 * 播放器挂在根布局里（见 app/layout.tsx），所以路由切换不会打断播放；点歌之前不渲染任何
 * 界面，也不会自动播放（浏览器的自动播放策略本来也不允许）。
 */

const STORAGE_VOLUME = "music:volume";
const STORAGE_LAST = "music:last";

type MusicContextValue = {
  playlists: Playlist[];
  currentSongId: string | null;
  currentSong: Song | null;
  currentPlaylistId: string | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  failed: boolean;
  play: (playlistId: string, songId: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  close: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusicPlayer(): MusicContextValue {
  const value = useContext(MusicContext);
  if (!value) throw new Error("useMusicPlayer 必须在 <MusicProvider> 里使用");
  return value;
}

/**
 * 音乐页「当前该显示哪首」的统一规则：正在播放/选中的那首 → 上次听的那首（provider
 * 已从 localStorage 恢复）→ 第一个歌单的第一首。大播放器与整屏背景都用它，
 * 免得两处规则各写一份、改一处忘一处。
 */
export function useNowPlaying() {
  const { playlists, currentSongId, currentSong, currentPlaylistId } =
    useMusicPlayer();
  const song = currentSong ?? playlists[0]?.songs[0] ?? null;
  const playlistId = currentPlaylistId ?? playlists[0]?.id ?? "";
  return {
    song,
    playlistId,
    /** 只有"这首歌就是当前选中的那首"时，进度/时长/失败状态才属于它 */
    isCurrent: song !== null && currentSongId === song.id,
  };
}

export default function MusicProvider({
  playlists,
  apiBase,
  children,
}: {
  playlists: Playlist[];
  apiBase: string;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  /* 只有用户点了播放才 play()；恢复上次歌曲时只显示、不播 */
  const wantsPlayRef = useRef(false);

  const [current, setCurrent] = useState<{
    playlistId: string;
    songId: string;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const songById = useMemo(() => {
    const map = new Map<string, Song>();
    for (const playlist of playlists) {
      for (const song of playlist.songs) map.set(song.id, song);
    }
    return map;
  }, [playlists]);

  const currentSong = current ? songById.get(current.songId) : undefined;

  const play = useCallback((playlistId: string, songId: string) => {
    wantsPlayRef.current = true;
    setAttempt(0);
    setFailed(false);
    setCurrent({ playlistId, songId });
  }, []);

  /* 当前歌单里的上一首 / 下一首，到头循环 */
  const step = useCallback(
    (offset: number) => {
      if (!current) return;
      const playlist = playlists.find((item) => item.id === current.playlistId);
      if (!playlist || playlist.songs.length === 0) return;
      const index = playlist.songs.findIndex((song) => song.id === current.songId);
      const next =
        playlist.songs[
          (index + offset + playlist.songs.length) % playlist.songs.length
        ];
      play(playlist.id, next.id);
    },
    [current, playlists, play],
  );

  /* 供迷你条与大播放器共用的动作 */
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setFailed(true));
    else audio.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    wantsPlayRef.current = false;
    setCurrent(null);
    setPlaying(false);
    setFailed(false);
  }, []);

  /* 换歌 / 重试：设置 src，必要时开始播放 */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    const bust = attempt > 0 ? `&_=${attempt}` : "";
    audio.src = `${apiBase}?server=netease&type=url&id=${encodeURIComponent(current.songId)}${bust}`;
    if (wantsPlayRef.current) {
      wantsPlayRef.current = false;
      void audio.play().catch(() => {
        /* 被自动播放策略拦住或加载失败：交给 onError 与用户再点一次 */
      });
    }
  }, [current, attempt, apiBase]);

  /*
   * 恢复上次的音量与歌曲（只恢复显示）。
   *
   * 为什么这里非得用 effect：localStorage 在服务端不存在，直接写进 useState 的初值会让
   * 首帧与 hydration 结果不一致（React 会报 hydration mismatch）。浏览器专有状态是
   * react-hooks/set-state-in-effect 这条规则认可的例外，所以就地豁免。
   */
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_VOLUME));
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      if (Number.isFinite(saved) && saved > 0) setVolume(saved);
      const last = localStorage.getItem(STORAGE_LAST);
      if (last) {
        const parsed = JSON.parse(last) as {
          playlistId: string;
          songId: string;
        };
        if (songById.has(parsed.songId)) {
          wantsPlayRef.current = false;
          setCurrent(parsed);
        }
      }
    } catch {
      /* localStorage 不可用（隐私模式等）就当没有历史 */
    }
  }, [songById]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
    try {
      localStorage.setItem(STORAGE_VOLUME, String(volume));
    } catch {
      /* 忽略 */
    }
  }, [volume]);

  useEffect(() => {
    if (!current) return;
    try {
      localStorage.setItem(STORAGE_LAST, JSON.stringify(current));
    } catch {
      /* 忽略 */
    }
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!currentSong) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist ?? "",
      artwork: currentSong.cover ? [{ src: currentSong.cover }] : [],
    });
  }, [current, currentSong]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    session.setActionHandler("play", () => void audioRef.current?.play());
    session.setActionHandler("pause", () => audioRef.current?.pause());
    session.setActionHandler("previoustrack", () => step(-1));
    session.setActionHandler("nexttrack", () => step(1));
    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.setActionHandler("previoustrack", null);
      session.setActionHandler("nexttrack", null);
    };
  }, [step]);

  const contextValue = useMemo<MusicContextValue>(
    () => ({
      playlists,
      currentSongId: current?.songId ?? null,
      currentSong: currentSong ?? null,
      currentPlaylistId: current?.playlistId ?? null,
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
      close,
    }),
    [
      playlists,
      current,
      currentSong,
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
      close,
    ],
  );

  const pathname = usePathname();
  /* 音乐页有它自己的大播放器，那边不显示迷你条（也不留底部空白） */
  const onMusicPage = pathname.startsWith("/favorites/music");
  const visible = current !== null && !onMusicPage;

  return (
    <MusicContext.Provider value={contextValue}>
      {children}

      {/* 播放条是 fixed 的，用等高留白避免挡住页面底部 */}
      {visible ? <div aria-hidden className="h-28" /> : null}

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => step(1)}
        onError={() => {
          // 临时签名地址偶尔会失效：带时间戳重取一次，再失败就提示去平台听
          if (attempt === 0) setAttempt(1);
          else setFailed(true);
        }}
      />

      {visible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 p-2 sm:p-4">
          <div className="mx-auto w-full max-w-5xl">
            <div className="absolute overflow-hidden m-3 size-12 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              {currentSong?.cover ? (
                <Image
                  src={currentSong.cover}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <LightedgeBlurCard
              wrapperClassName="mx-auto w-full max-w-5xl"
              // radiusClassName="rounded-xl"
              className="flex items-center gap-3 p-3"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                {currentSong?.cover ? (
                  <Image
                    src={currentSong.cover}
                    alt=""
                    width={96}
                    height={96}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate text-sm font-medium">
                  {currentSong?.title ?? `网易云 ${current?.songId ?? ""}`}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {failed ? "这条临时地址失效了" : (currentSong?.artist ?? "")}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="上一首"
                  className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <PlayerIcon name="prev" />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? "暂停" : "播放"}
                  className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <PlayerIcon name={playing ? "pause" : "play"} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="下一首"
                  className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <PlayerIcon name="next" />
                </button>
              </div>

              {/* 进度与音量：range 控件天生支持键盘操作 */}
              <div className="hidden flex-1 items-center gap-2 sm:flex">
                <input
                  type="range"
                  min={0}
                  max={Number.isFinite(duration) ? duration : 0}
                  step={1}
                  value={Math.min(
                    progress,
                    Number.isFinite(duration) ? duration : 0,
                  )}
                  onChange={(event) => seek(Number(event.target.value))}
                  aria-label="播放进度"
                  className="h-1 w-full max-w-xs accent-zinc-900 dark:accent-zinc-100"
                />
                <span className="w-16 shrink-0 font-mono text-xs text-zinc-500">
                  {formatTime(progress)}/{formatTime(duration)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  aria-label="音量"
                  className="h-1 w-20 accent-zinc-900 dark:accent-zinc-100"
                />
              </div>

              {failed ? (
                <a
                  href={`https://music.163.com/#/song?id=${current?.songId ?? ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs underline"
                >
                  去平台听
                </a>
              ) : null}

              <button
                type="button"
                onClick={close}
                aria-label="关闭播放器"
                className="shrink-0 rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <PlayerIcon name="close" />
              </button>
            </LightedgeBlurCard>
          </div>
        </div>
      ) : null}
    </MusicContext.Provider>
  );
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/* 播放器图标（迷你条与大播放器共用），画法与 nothing-here.tsx 一致（线框 + currentColor） */
export function PlayerIcon({
  name,
  className = "size-4",
}: {
  name: "prev" | "play" | "pause" | "next" | "close" | "volume";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {name === "prev" ? <path d="M19 5v14L8 12zM5 5v14" /> : null}
      {name === "play" ? <path d="M7 5l12 7-12 7z" /> : null}
      {name === "pause" ? <path d="M9 5v14M15 5v14" /> : null}
      {name === "next" ? <path d="M5 5v14l11-7zM19 5v14" /> : null}
      {name === "close" ? <path d="M6 6l12 12M18 6L6 18" /> : null}
      {name === "volume" ? (
        <>
          <path d="M11 5 6.5 8.5H3v7h3.5L11 19z" />
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        </>
      ) : null}
    </svg>
  );
}
