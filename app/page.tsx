import Header from "@/components/Header";
import "./globals.css";

export default function Welcome() {
  return (
    <>
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
      <main></main>

      {/* 页脚 */}
      <footer></footer>
    </>
  );
}
