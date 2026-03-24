import Link from "next/link";

export default function FooterSection() {
    return (
        <footer className="border-t border-border/40 py-4 md:py-5 bg-first text-[#eee]">
            <div
                className="container flex flex-col md:flex-row items-center justify-between gap-y-3 mx-auto px-5 md:px-8">
                <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight">
            ★ CSU Star
            <br/>
            <Link href="/doc/privacy"
                  className="text-[0.6rem] cursor-pointer font-light hover:underline hover:font-bold hover:scale-10">
             Privacy Policy
            </Link>
            <span className="text-[0.6rem] cursor-pointer font-light">和</span>
            <Link href="/doc/terms"
                  className="text-[0.6rem] cursor-pointer font-light hover:underline hover:font-bold hover:scale-10">
              Terms Policy
            </Link>

          </span>
                </div>

                <p className="text-[0.6rem] pb-10 md:pb-0">
                    备案号 : 赣ICP备2026004177号-1 <br/>
                    &copy; 2026 CSU Star. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
