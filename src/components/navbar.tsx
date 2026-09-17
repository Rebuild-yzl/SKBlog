import Link from "next/link";

export default function NavBar() {
  return (
    // <nav className="border-2 backdrop-blur-sm m-4 rounded-full inset-x-0 p-4 bg-zinc-50 dark:bg-black fixed top-0 items-center justify-center">
    // 边框颜色不写死，统一由 globals.css 的 --border 提供
    <nav className="border-2 backdrop-blur-sm m-4 rounded-full p-4 bg-zinc-50 dark:bg-black sticky top-0 items-center justify-center">
      <div className="flex items-center justify-between gap-4">
        <p>NeuroSaiKou</p>
        <div className="flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/works">Works</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/participate">Participate</Link>
          <Link href="/favorites">Favorites</Link>
          <Link href="/about">About</Link>
          <Link href="/analytics">Analytics</Link>
        </div>
      </div>
    </nav>
  );
}
