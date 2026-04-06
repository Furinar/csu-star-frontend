import GlassCard from "@/components/ui/GlassCard";

export default function Compass() {
  return (
    <>
      <div className="container flex flex-col gap-10">
        <GlassCard className="pt-10 flex flex-col gap-20">
          <div className="flex justify-center items-center flex-col gap-3 w-full">
            <div className="hero-gradient-text text-4xl font-bold">
              中南大学生存指北
            </div>
            <div className="text-gray-600">
              Chart your course, thrive in CSU.
            </div>
          </div>

          <div className="flex flex-col gap-6 pl-4 md:pl-10">
            <div className="text-gray-800 font-bold text-2xl flex items-center gap-2">
              <i className="uil uil-compass text-blue-500"></i>
              本页宗旨
            </div>

            <div className="flex flex-col gap-4 pl-2 text-gray-600">
              <div className="flex items-start gap-2">
                <i className="uil uil-users-alt text-lg text-blue-400 mt-1"></i>
                <span className="leading-relaxed">
                  <strong className="text-gray-800">目标人群：</strong>
                  中南大学全体在读学生，其他高校如果在相近环境（985/211）或许也能从中获得启发。
                </span>
              </div>

              <div className="flex items-start gap-2">
                <i className="uil uil-capture text-lg text-green-400 mt-1"></i>
                <span className="leading-relaxed">
                  <strong className="text-gray-800">目的：</strong>
                  打破信息差。帮助大家认清专业现状与未来规划，最大化利用校园资源，减少不必要的“内卷”与焦虑，找到属于自己的大学节奏。
                </span>
              </div>

              <div className="flex items-start gap-2">
                <i className="uil uil-code-branch text-lg text-purple-400 mt-1"></i>
                <span className="leading-relaxed">
                  <strong className="text-gray-800">贡献：</strong>
                  本项目开源，如果你有任何想要分享的经验或发现错误，非常欢迎提交
                  Issue 或 PR 补充内容！薪火相传，生生不息。
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 pl-4 md:pl-10 pb-10">
            <div className="text-gray-800 font-bold text-2xl flex items-center gap-2">
              <i className="uil uil-books text-indigo-500"></i>
              生存目录
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* 模块1 */}
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="uil uil-backpack text-blue-500"></i>{" "}
                  新人科普指南
                </h3>
                <ul className="text-gray-600 flex flex-col gap-2 pl-2">
                  <li className="hover:text-blue-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 入学基础须知篇
                  </li>
                  <li className="hover:text-blue-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 转专业与分流篇
                  </li>
                  <li className="hover:text-blue-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 绩点与保研篇
                  </li>
                  <li className="hover:text-blue-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 竞赛与科研篇
                  </li>
                  <li className="hover:text-blue-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 社团与生活篇
                  </li>
                </ul>
              </div>

              {/* 模块2 */}
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="uil uil-book-reader text-orange-500"></i>{" "}
                  专业自救手册
                </h3>
                <ul className="text-gray-600 flex flex-col gap-2 pl-2">
                  <li className="hover:text-orange-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 计算机科学自救指南
                  </li>
                  <li className="hover:text-orange-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 自动化自救指南
                  </li>
                  <li className="hover:text-orange-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 冶金材料自救指南
                  </li>
                  <li className="hover:text-orange-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 基础学科生存法则
                  </li>
                </ul>
              </div>

              {/* 模块3 */}
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="uil uil-plane-departure text-green-500"></i>{" "}
                  升学与出路
                </h3>
                <ul className="text-gray-600 flex flex-col gap-2 pl-2">
                  <li className="hover:text-green-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 考研经验分享
                  </li>
                  <li className="hover:text-green-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 留学申请导论
                  </li>
                  <li className="hover:text-green-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 选调与公考篇
                  </li>
                  <li className="hover:text-green-500 cursor-pointer transition-colors">
                    <i className="uil uil-angle-right"></i> 秋招春招避坑
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
