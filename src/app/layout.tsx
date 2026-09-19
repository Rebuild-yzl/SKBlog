import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MusicProvider from "@/components/music-player";
import NavBar from "@/components/navbar";
import { getPlaylists, musicApiBase } from "@/lib/music";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroSaiKou",
  description: "NeuroSaiKou's personal website",
};

// 首绘前决定明暗：优先用户手动选择（localStorage），否则跟系统偏好。
// 放在 <head> 里同步执行，避免出现「先浅色再变深色」的闪烁。
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  // 歌曲清单在构建期定死（来自笔记仓库），播放器挂在根布局，切页不打断播放
  const playlists = getPlaylists();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <MusicProvider playlists={playlists} apiBase={musicApiBase()}>
          {children}
        </MusicProvider>
      </body>
    </html>
  );
}
