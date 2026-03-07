export default function FooterSection() {
  return (
    <footer className="border-t border-border/40 py-4 md:py-5 bg-first">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-y-3 mx-auto px-5 md:px-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-title tracking-tight">
            ★ CSU Star
          </span>
        </div>

        <p className="text-[0.6rem] font-black pb-10 md:pb-0">
          &copy; 2026 CSU Star. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
