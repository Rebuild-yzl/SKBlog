"use client";

import { useEffect } from "react";
import Link from "next/link";
import NoticeCard, {
  noticeActionPrimary,
  noticeActionSecondary,
} from "@/components/notice-card";

/*
 * 路由段级错误边界：页面渲染出错时替换成这张卡片（替换掉 Next 自带的报错页）。
 * 必须是客户端组件；Next 16 用 retry() 重新拉取并重渲染这一段的子节点。
 * 它仍然在根布局内部，所以导航栏与主题都在。
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // 这里可以接错误上报服务
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 font-sans">
      <NoticeCard
        code="Error"
        title="Something went wrong"
        description="This page failed to render. Trying again usually helps; if it keeps failing, come back later."
        reference={error.digest}
      >
        <button type="button" onClick={() => retry()} className={noticeActionPrimary}>
          Try again
        </button>
        <Link href="/" className={noticeActionSecondary}>
          Back home
        </Link>
      </NoticeCard>
    </main>
  );
}
