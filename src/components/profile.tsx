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
    <section className="w-full max-w-2xl rounded-3xl border-2 bg-white p-6 shadow-sm sm:p-8 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <Image
          src={avatarSrc}
          alt={avatarAlt}
          width={280}
          height={280}
          priority
          className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-border"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {name}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
      </div>
    </section>
  );
}
