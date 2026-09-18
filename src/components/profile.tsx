import Image from "next/image";

type ProfileProps = {
  name?: string;
  description?: string;
  avatarSrc?: string;
  avatarAlt?: string;
};

export default function Profile({
  name = "NeuroSaiKou",
  description = "Welcome to my personal website. I write about code, projects, and things I like.",
  avatarSrc = "/avartor.jpg",
  avatarAlt = "Portrait of NeuroSaiKou",
}: ProfileProps) {
  return (
    <section className="lightedge lightedge-solid w-full rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        {/* 头像描边：img 是替换元素，挂不了伪元素，所以外套一层管定位、再单起一层覆盖层管描边；
            覆盖层排在图片之后，环（inset 0）就整圈压在照片上，采样到的是照片自己的边缘像素，
            所以这里只用 lightedge（不带 -solid）—— 和横幅卡片同理，背后是图片就不需要固定描边色 */}
        <div className="relative h-28 w-28 shrink-0">
          <Image
            src={avatarSrc}
            alt={avatarAlt}
            width={280}
            height={280}
            loading="eager"
            className="h-full w-full rounded-full object-cover"
          />
          <div
            aria-hidden
            className="lightedge lightedge-3 -lightedge-inset-5 lightedge-brightness-300 pointer-events-none absolute inset-0 rounded-full [--lightedge-tint:transparent]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {name}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
      </div>
    </section>
  );
}
