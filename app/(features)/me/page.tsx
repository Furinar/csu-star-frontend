/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {useState} from "react";
import GlassCard from "@/components/ui/GlassCard";


export default function Me() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
      <div
          className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <GlassCard className="p-6 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="relative group cursor-pointer mb-4">
                  <img
                      className="w-48 h-48 rounded-full border-4 border-white/50 dark:border-white/10 shadow-lg object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      src="/furina.jpg"
                      alt="User Avatar"
                  />
                  <div
                      className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">更换头像</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Furina
                  </h1>
                  <h2 className="text-lg font-light text-gray-500 dark:text-gray-400">
                    已认证
                  </h2>
                </div>

                {/* <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                个人简介
              </p> */}

                <button
                    className="w-full py-1.5 px-4 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200/50 dark:border-gray-700/50 text-gray-800 dark:text-gray-200 font-medium transition-all shadow-sm mb-6 backdrop-blur-sm">
                  编辑个人资料
                </button>

                {/* <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    128
                  </span>{" "}
                  粉丝
                </div>
                <span>·</span>
                <div className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    42
                  </span>{" "}
                  关注
                </div>
              </div> */}

                <div className="space-y-3 w-full text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>furina@csu.edu.cn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>计算机学院</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span>2022级 本科生</span>
                  </div>
                </div>
              </GlassCard>

              {/* 积分 */}
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  STAR 积分
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black hero-gradient-text">
                    999
                  </span>
                  </div>
                  <button
                      className="px-3 py-1.5 rounded-lg bg-first text-white text-sm font-medium shadow-md transition-all">
                    每日签到
                  </button>
                </div>
              </GlassCard>
            </div>
          </aside>

          {/* 右侧主体内容 */}
          <main className="flex-1 w-full">
            {/* GitHub 式导航标签页 */}
            <div
                className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 border-b border-gray-200/50 dark:border-gray-700/50 pb-px">
              {[
                "overview",
                "resources",
                "favorites",
                "evaluations",
                "settings",
              ].map((tab) => {
                const tabNames: Record<string, string> = {
                  overview: "概览",
                  resources: "我的资源",
                  favorites: "收藏夹",
                  evaluations: "我的评价",
                  settings: "更多设置",
                };
                const isActive = activeTab === tab;
                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                            isActive
                                ? "border-first text-gray-900 dark:text-white"
                                : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200 rounded-t-lg"
                        }`}
                    >
                      {tabNames[tab]}
                      {tab === "resources" && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-xs">
                      12
                    </span>
                      )}
                      {tab === "evaluations" && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-xs">
                      8
                    </span>
                      )}
                    </button>
                );
              })}
            </div>

            {/* 标签页内容区域 */}
            <div className="space-y-6">
              {activeTab === "overview" && (
                  <>
                    <h3 className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-3"></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {[1, 2, 3, 4].map((i) => (
                          <GlassCard
                              key={i}
                              className="p-5 hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Link
                                  href="#"
                                  className="font-semibold text-first dark:text-blue-400 group-hover:underline"
                              >
                                数据结构历年期末试卷整理
                              </Link>
                              <span
                                  className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500">
                          Public
                        </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              包含了近5年的数据结构试卷及详细解析，适合期末复习使用。祝大家都能拿满绩！
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                          Resource
                        </span>
                              <span className="flex items-center gap-1">
                          <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                          >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          42
                        </span>
                              <span>Updated 2 days ago</span>
                            </div>
                          </GlassCard>
                      ))}
                    </div>

                    <h3 className="text-md font-normal text-gray-800 dark:text-gray-200 mb-3 ml-5">
                      CSU Star贡献图
                    </h3>
                    <GlassCard className="p-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                          {/* 模拟 GitHub 贡献网格 */}
                          {[...Array(20)].map((_, colIndex) => (
                              <div key={colIndex} className="flex flex-col gap-1">
                                {[...Array(7)].map((_, rowIndex) => {
                                  const intensity = Math.random();
                                  let colorClass = "bg-gray-100 dark:bg-gray-800";
                                  if (intensity > 0.8)
                                    colorClass = "bg-green-600 dark:bg-green-500";
                                  else if (intensity > 0.5)
                                    colorClass = "bg-green-400 dark:bg-green-600";
                                  else if (intensity > 0.2)
                                    colorClass = "bg-green-200 dark:bg-green-800";

                                  return (
                                      <div
                                          key={rowIndex}
                                          className={`w-3 h-3 rounded-[2px] ${colorClass}`}
                                          title={`Activity on day ${colIndex * 7 + rowIndex}`}
                                      />
                                  );
                                })}
                              </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                          <a href="#" className="hover:text-blue-500">
                            了解我们如何计算贡献度
                          </a>
                          <div className="flex items-center gap-1">
                            <span>Less</span>
                            <div className="w-3 h-3 rounded-[2px] bg-gray-100 dark:bg-gray-800"></div>
                            <div className="w-3 h-3 rounded-[2px] bg-green-200 dark:bg-green-800"></div>
                            <div className="w-3 h-3 rounded-[2px] bg-green-400 dark:bg-green-600"></div>
                            <div className="w-3 h-3 rounded-[2px] bg-green-600 dark:bg-green-500"></div>
                            <span>More</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </>
              )}

              {activeTab === "settings" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "修改密码",
                        icon: "keyhole-circle",
                        desc: "定期修改密码以保护账号安全",
                      },
                      {
                        title: "绑定校园邮箱",
                        icon: "envelope-shield",
                        desc: "完成认证可获取专属学生身份标识",
                      },
                      {
                        title: "绑定第三方账号",
                        icon: "github-alt",
                        desc: "绑定 GitHub 或微信便捷登录",
                      },
                      {
                        title: "积分流水",
                        icon: "chart-bar-alt",
                        desc: "查看你的积分获取与消耗记录",
                      },
                      {
                        title: "分享邀请码",
                        icon: "share",
                        desc: "邀请好友加入可获得额外积分奖励",
                      },
                      {
                        title: "意见反馈",
                        icon: "comment-alt-edit",
                        desc: "提交你的建议或遇到的问题",
                      },
                      {
                        title: "举报/纠错",
                        icon: "multiply",
                        desc: "维护良好的社区环境",
                      },
                    ].map((item, index) => (
                        <GlassCard
                            key={index}
                            className="p-4 flex items-center gap-4 hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-colors group"
                        >
                          <div
                              className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                            <i className={`uil uil-${item.icon}`}></i>
                          </div>
                          <div>
                            <h4 className="text-gray-900 dark:text-white font-medium">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </GlassCard>
                    ))}
                  </div>
              )}

              {(activeTab === "resources" ||
                  activeTab === "favorites" ||
                  activeTab === "evaluations") && (
                  <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed">
                    <div className="text-5xl mb-4 opacity-50">🚧</div>
                    <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                      正在建设中
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      该板块内容的数据接口还在调试中，你可以先浏览概览页或设置相关信息。
                    </p>
                  </GlassCard>
              )}
            </div>
          </main>
        </div>

        <style jsx global>{`
            .hide-scrollbar::-webkit-scrollbar {
                display: none;
            }

            .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
      </div>
  );
}
