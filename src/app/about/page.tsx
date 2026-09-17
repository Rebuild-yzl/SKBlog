import Banner from "@/components/banner";
import Profile from "@/components/profile";

export default function About() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 font-sans lg:px-8">
      <Banner imageSrc="/banner.jpg" />
      <Profile />
    </div>
  );
}
