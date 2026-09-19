"use client";

import { useState } from "react";
import Link from "next/link";
import LightedgeBlurCard from "@/components/lightedge-blur-card";
import ThemeToggle from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/works", label: "Works" },
  { href: "/projects", label: "Projects" },
  { href: "/participate", label: "Participate" },
  { href: "/favorites", label: "Favorites" },
  { href: "/about", label: "About" },
  { href: "/analytics", label: "Analytics" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    // 外观统一来自 LightedgeBlurCard（blur-card 半透明底 + 背景模糊，外加平级的假 border）
    // z-50：页面里排在导航之后的定位元素会盖住吸顶导航，需要抬高导航层级
    // 外层只管吸顶与外边距：带 backdrop-filter 的元素会成为 backdrop root（模糊只能采到它自身的内容），
    // 所以折叠菜单必须与胶囊本体平级，不能嵌在胶囊内部
    <nav className="m-4 sticky top-4 z-50">
      {/* 胶囊本体：圆角与内边距单独设置；毛玻璃与假 border 由组件负责（假 border 在卡片外面才采得到背景） */}
      <LightedgeBlurCard radiusClassName="rounded-full" className="p-4">
        <div className="flex items-center justify-between gap-4">
          <p>NeuroSaiKou</p>

          {/* 宽度够时平铺全部链接：8 个链接 + 品牌名 + 切换按钮约需 700px，
              所以断点取 md(768px)，并在 md 档把间距收窄到 gap-2 留出余量 */}
          <div className="hidden gap-2 md:flex lg:gap-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* 大屏：图标形态的明暗切换（小屏收在折叠菜单底部） */}
          <div className="hidden md:flex">
            <ThemeToggle variant="icon" />
          </div>

          {/* 宽度不够时折叠成汉堡按钮 */}
          <button
            type="button"
            className="-mr-1 inline-flex items-center justify-center rounded-full p-1 hover:bg-black/5 md:hidden dark:hover:bg-white/10"
            aria-expanded={open}
            aria-controls="nav-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-5"
              aria-hidden="true"
            >
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </LightedgeBlurCard>

      {/* 折叠菜单：与胶囊本体平级，才能对页面内容做背景模糊；外层 div 只管定位与 aria-controls */}
      {open && (
        <div id="nav-menu" className="absolute inset-x-0 top-full mt-2 md:hidden">
          <LightedgeBlurCard
            radiusClassName="rounded-3xl"
            className="flex flex-col gap-1 p-2"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* 明暗切换：贴在菜单底部，分隔线颜色走全局 --border */}
            <div className="mt-1 border-t pt-1">
              <ThemeToggle />
            </div>
          </LightedgeBlurCard>
        </div>
      )}
    </nav>
  );
}
