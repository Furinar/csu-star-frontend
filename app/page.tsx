import Header from "@/components/welcome/Header";
import ShootingStars from "@/components/welcome/ShootingStars";
import "./globals.css";
import HomeSection from "@/components/welcome/section/HomeSection";
import AboutSection from "@/components/welcome/section/AboutSection";

export default function Welcome() {
  return (
    <div className="overflow-x-clip">
      {/* 流星背景 */}
      <ShootingStars />

      {/* 导航栏 */}
      <Header
        navItems={[
          { label: "首页", href: "#home", icon: "uil-estate" },
          { label: "关于", href: "#about", icon: "uil-user" },
          { label: "展示", href: "#portfolio", icon: "uil-scenery" },
          { label: "技术栈", href: "#skills", icon: "uil-file-alt" },
          { label: "联系", href: "#contact", icon: "uil-message" },
        ]}
      />

      {/* 主要内容 */}
      <main className="main pb-14 md:pb-0">
        {/* 首页 */}
        <div className="home">
          <HomeSection />
        </div>

        {/* 关于 */}
        <div className="about">
          <AboutSection />
        </div>
      </main>

      {/* 页脚 */}
      <footer></footer>
    </div>
  );
}
