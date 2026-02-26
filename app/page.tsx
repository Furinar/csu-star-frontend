import Header from "@/components/Header";
import ShootingStars from "@/components/ShootingStars";
import "./globals.css";
import HomeSection from "@/components/welcome/HomeSection";
import CollegeLoop from "@/components/welcome/CollegeLoop";

export default function Welcome() {
  return (
    <div className="overflow-x-hidden">
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
      <main className="main">
        {/* 首页 */}
        <HomeSection />

        {/* 跑马灯 */}
        <div
          className="container"
          style={{ overflow: "hidden", position: "relative" }}
        >
          <CollegeLoop />
        </div>
      </main>

      {/* 页脚 */}
      <footer></footer>
    </div>
  );
}
