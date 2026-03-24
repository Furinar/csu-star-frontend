"use client";
import SearchBar from "@/components/ui/SearchBar";
import {useMemo, useState} from "react";

const searchConfig = [
  {
    label: "全局",
    type: "global",
    icon: "globe",
    placeholder: "探索有趣的资源、课程和教师，发现更多精彩内容..."
  },
  {
    label: "资源",
    type: "resource",
    icon: "file-alt",
    placeholder: "搜索资源所属的课程名..."
  },
  {
    label: "课程",
    type: "course",
    icon: "graduation-cap",
    placeholder: "搜索感兴趣的课程..."
  },
  {
    label: "教师",
    type: "teacher",
    icon: "users-alt",
    placeholder: "搜索感兴趣的教师..."
  },
];

export default function Search() {
  const [searchType, setSearchType] = useState("global");

  const currentSearchType = useMemo(() => {
    return searchConfig.find(option => option.type === searchType);
  }, [searchType]);
  return (
      <>
        <div className="container flex flex-col gap-10 mt-10">
          <div className="w-full flex justify-center items-center flex-col gap-3">
            <div className="hero-gradient-text text-4xl font-bold">风影情报处</div>
            <div className="text-gray-600">
              Explore freely, discover what you need.
            </div>
          </div>

          <div className="flex flex-col gap-5 items-center">
            <div className="relative flex p-1.5 bg-gray-100 rounded-full shadow-inner shadow-gray-300">
              <div
                  className="absolute top-1.5 bottom-1.5 w-28 bg-white rounded-full shadow-md z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)]"
                  style={{
                    transform: `translateX(${searchConfig.findIndex((item) => item.type === searchType) * 100}%)`,
                  }}
              />
              {searchConfig.map((item) => (
                  <span
                      key={item.type}
                      onClick={() => setSearchType(item.type)}
                      className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full cursor-pointer transition-colors duration-300 ${
                          searchType === item.type
                              ? "text-first-alt font-medium"
                              : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                            <i className={`uil uil-${item.icon} text-lg`}></i>
                    {item.label}
                          </span>
              ))}
            </div>
            <div className="w-full">
              <SearchBar placeholder={currentSearchType?.placeholder}/>
            </div>
          </div>

          <div className=" border-t border-gray-300"/>

          <div className="flex flex-col gap-5 items-center justify-center mt-15">

            <div className="text-8xl text-gray-300">
              <i className="uil uil-search"></i>
            </div>

            <div className="text-2xl text-gray-800">
              开始搜索{currentSearchType?.label}吧！
            </div>
            <div className="text-lg text-gray-500">
              使用上方的搜索工具栏，输入关键词，发现更多精彩内容！
            </div>
          </div>
        </div>
      </>
  );
}
