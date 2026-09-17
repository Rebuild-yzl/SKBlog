import type { Metadata } from "next";
import Link from "next/link";
import NoticeCard, {
  noticeActionPrimary,
  noticeActionSecondary,
} from "@/components/notice-card";

export const metadata: Metadata = {
  title: "Page not found · NeuroSaiKou",
};

/*
 * 根级 404：未匹配到路由时由 Next 渲染，替换掉自带的默认页。
 * 它在根布局内部渲染，所以导航栏、页面底色、明暗主题都会自动带上。
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 font-sans">
      <NoticeCard
        code="404"
        title="Page not found"
        description="The page you are looking for does not exist, or it has moved somewhere else."
      >
        <Link href="/" className={noticeActionPrimary}>
          Back home
        </Link>
        <Link href="/about" className={noticeActionSecondary}>
          About me
        </Link>
      </NoticeCard>
    </main>
  );
}
