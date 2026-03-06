export default function FooterSection() {
  return (
    <footer className="bg-first-second py-4 md:py-5">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-y-3 text-white">
        <div className="flex items-center gap-2 md:flex-1">
          <h1 className="text-lg font-bold">CSU Star</h1>
          <span className="text-xs text-white/70">中南大学一站式综合平台</span>
        </div>
        <ul className="flex justify-center gap-x-6 text-sm">
          <li>
            <a href="#skills" className="text-white/80 hover:text-first-lighter transition-colors">技术栈</a>
          </li>
          <li>
            <a href="#portfolio" className="text-white/80 hover:text-first-lighter transition-colors">功能展示</a>
          </li>
          <li>
            <a href="#contact" className="text-white/80 hover:text-first-lighter transition-colors">联系我们</a>
          </li>
        </ul>
        <p className="text-xs text-white/50 md:flex-1 md:text-right">&copy; 2026 CSU Star</p>
      </div>
    </footer>
  );
}
