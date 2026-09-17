import Banner from "@/components/banner";
import Profile from "@/components/profile";

export default function About() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6 font-sans lg:px-8 dark:bg-black">
      <Banner imageSrc="/banner.jpg" />
      <Profile />
    </div>
  );
}
