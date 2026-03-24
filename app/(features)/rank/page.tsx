"use client";
import {useEffect, useMemo, useState} from "react";

const rankConfig = [
  {
    category: "resource",
    label: "资源",
    icon: "file-alt",
    filters: [
      {type: "download", label: "下载", icon: "import"}, // 降序
      {type: "semester", label: "学期", icon: "schedule"},
      {type: "uploadTime", label: "上传", icon: "upload"},
      {type: "hot", label: "热度", icon: "fire"},
    ],
  },
  {
    category: "course",
    label: "课程",
    icon: "graduation-cap",
    filters: [
      {type: "avg", label: "综合", icon: "award"},
      {type: "quality", label: "教学", icon: "book-open"},
      {type: "grading", label: "给分", icon: "chart-bar"},
      {type: "attendance", label: "考勤", icon: "bell-school"},
    ],
  },
  {
    category: "teacher",
    label: "教师",
    icon: "users-alt",
    filters: [
      {type: "avg", label: "综合", icon: "award"},
      {type: "homework", label: "作业", icon: "books"},
      {type: "gain", label: "收获", icon: "brain"},
      {type: "exam", label: "难度", icon: "brackets-curly"},
    ],
  },
];

export default function Rank() {
  const [rankCategory, setRankCategory] = useState("course");
  const [filterType, setFilterType] = useState("avg");
  const [sortType, setSortType] = useState("desc");

  const currentCategory = useMemo(() => {
    return (
        rankConfig.find((item) => item.category === rankCategory) || rankConfig[0]
    );
  }, [rankCategory]);

  useEffect(() => {
    setFilterType(currentCategory.filters[0].type);
  }, [currentCategory]);

  // const currentFilter = useMemo(() => {
  //     return currentCategory?.filters.find(filter => filter.type === filterType) || currentCategory.filters[0];
  // }, [filterType, currentCategory]);

  return (
      <>
        <div className="container flex flex-col gap-10 mt-10">
          <div className="flex justify-center items-center flex-col gap-3 w-full">
            <div className="hero-gradient-text text-4xl font-bold">
              天梯风云榜
            </div>
            <div className="text-gray-600">
              Rise step by step, witness the top glory.
            </div>
          </div>

          <div className="flex flex-col gap-5 items-center">
            <div className="flex gap-5">
              <div className="relative flex p-1.5 bg-gray-100 rounded-full shadow-inner shadow-gray-300 ">
                <div
                    className="absolute bg-white top-1.5 bottom-1.5 w-28 rounded-full shadow-md z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.44)]"
                    style={{
                      transform: `translateX(${rankConfig.findIndex((item) => item.category == rankCategory) * 100}%)`,
                    }}
                />

                {rankConfig.map((item) => (
                    <span
                        key={item.category}
                        onClick={() => setRankCategory(item.category)}
                        className={`relative z-10 w-28 flex justify-center items-center gap-2 py-2 rounded-full cursor-pointer transition-colors duration-300 ${rankCategory == item.category?.toLowerCase() ? "text-first-alt font-medium" : "text-gray-500 hover:text-gray-700"}`}
                    >
                  <i className={`uil uil-${item.icon}`}></i>
                      {item.label}
                </span>
                ))}
              </div>

              {/*<div*/}
              {/*  className="relative flex p-1.5 bg-gray-100 rounded-full shadow-inner shadow-gray-300 cursor-pointer"*/}
              {/*  onClick={() => setSortType(sortType === "desc" ? "asc" : "desc")}*/}
              {/*>*/}
              {/*  <div*/}
              {/*    className="absolute bg-white top-1.5 bottom-1.5 w-12 rounded-full shadow-md z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.44)]"*/}
              {/*    style={{*/}
              {/*      transform: `translateX(${sortType === "desc" ? 0 : 100}%)`,*/}
              {/*    }}*/}
              {/*  />*/}
              {/*  <span*/}
              {/*    onClick={() => setSortType("desc")}*/}
              {/*    className={`relative z-10 w-12 flex justify-center items-center py-2 transition-colors duration-300 ${sortType === "desc" ? "text-first-alt" : "text-gray-500 hover:text-gray-700"}`}*/}
              {/*  >*/}
              {/*    <i className="uil uil-sort-amount-down text-xl"></i>*/}
              {/*  </span>*/}
              {/*  <span*/}
              {/*    onClick={() => setSortType("asc")}*/}
              {/*    className={`relative z-10 w-12 flex justify-center items-center py-2 transition-colors duration-300 ${sortType === "asc" ? "text-first-alt" : "text-gray-500 hover:text-gray-700"}`}*/}
              {/*  >*/}
              {/*    <i className="uil uil-sort-amount-up text-xl"></i>*/}
              {/*  </span>*/}
              {/*</div>*/}
            </div>

            {/*<div className="flex items-center gap-5">*/}
            {/*  <div className="relative flex p-1.5 bg-gray-100 rounded-full shadow-lg shadow-gray-300">*/}
            {/*    <div*/}
            {/*        className="absolute top-1.5 bottom-1.5 w-28 bg-white rounded-full shadow-inner shadow-gray-400 z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.25)]"*/}
            {/*        style={{*/}
            {/*          transform: `translateX(${currentCategory?.filters.findIndex((item) => item.type === filterType) * 100}%)`,*/}
            {/*        }}*/}
            {/*    />*/}

            {/*    {currentCategory.filters.map((item) => (*/}
            {/*        <span*/}
            {/*            key={item.type}*/}
            {/*            onClick={() => setFilterType(item.type)}*/}
            {/*            className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full cursor-pointer transition-colors duration-300 ${*/}
            {/*                filterType === item.type*/}
            {/*                    ? "text-first-alt font-medium"*/}
            {/*                    : "text-gray-500 hover:text-gray-700"*/}
            {/*            }`}*/}
            {/*        >*/}
            {/*      <i className={`uil uil-${item.icon} text-lg`}></i>*/}
            {/*          {item.label}*/}
            {/*    </span>*/}
            {/*    ))}*/}
            {/*  </div>*/}
            {/*</div>*/}
          </div>

          <div className=" border-t border-gray-300"/>

          <div className="flex justify-between items-center">

            <div className="flex mt-5">
            <span
                onClick={() => setSortType("desc")}
                className={`relative z-10 w-12 flex justify-center items-center py-2 transition-colors duration-300 ${sortType === "desc" ? "text-first-alt" : "text-gray-500 hover:text-gray-700 cursor-pointer"}`}
            >
              <i className="uil uil-sort-amount-down text-xl"></i>
            </span>
              <label
                  className="relative inline-block w-[4em] h-[2em] text-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
                  }}
              >
                <input
                    type="checkbox"
                    className="peer opacity-0 w-0 h-0"
                    checked={sortType === "asc"}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
                    }}
                />
                <span
                    className="absolute inset-0 cursor-pointer bg-gray-200 transition-all duration-400 rounded-[0.5em] shadow-[0_0.2em_#dfd9d9]
             before:content-[''] before:absolute before:h-[1.5em] before:w-[1.4em] before:rounded-[0.3em] 
             before:left-[0.3em] before:bottom-[0.7em] before:bg-[lightsalmon] before:transition-all before:duration-400 
             before:shadow-[0_0.4em_#bcb4b4] 
             before:hover:shadow-[0_0.2em_#bcb4b4] before:hover:bottom-[0.5em] 
             peer-checked:before:translate-x-[2em] peer-checked:before:bg-[lightgreen]"
                ></span>
              </label>
              <span
                  onClick={() => setSortType("asc")}
                  className={`relative z-10 w-12 flex justify-center items-center py-2 transition-colors duration-300 ${sortType === "asc" ? "text-first-alt" : "text-gray-500 hover:text-gray-700 cursor-pointer"}`}
              >
              <i className="uil uil-sort-amount-up text-xl"></i>
            </span>
            </div>

            <div className="flex items-center gap-5 -mt-[99px]">
              <div
                  className="relative flex py-1.5 bg-white shadow-gray-300 border-t-2 border-gray-200">
                <div
                    className="absolute top-0 bottom-0 w-28 shadow-gray-400 z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55) border-t-2 border-first bg-gradient-to-b from-[var(--first-color)]/20 to-transparent"
                    style={{
                      transform: `translateX(${currentCategory?.filters.findIndex((item) => item.type === filterType) * 100}%)`,
                    }}
                />

                {currentCategory.filters.map((item) => (
                    <span
                        key={item.type}
                        onClick={() => setFilterType(item.type)}
                        className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full cursor-pointer transition-transform duration-500 text-sm ${
                            filterType === item.type
                                ? "text-first-alt font-medium scale-[1.15]"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                  <i className={`uil uil-${item.icon}`}></i>
                      {item.label}
                </span>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <button
                  className="group bg-first text-white font-inherit py-[0.35em] pl-[1.2em] pr-[3.3em] text-[17px] font-medium rounded-[0.9em] border-0 tracking-[0.05em] flex items-center shadow-[inset_0_0_1.6em_-0.6em_#714da6] overflow-hidden relative h-[2.8em] cursor-pointer">
                Get Rank
                <span
                    className="icon bg-white ml-[1em] absolute flex items-center justify-center h-[2.2em] w-[2.2em] rounded-[0.7em] shadow-[0.1em_0.1em_0.6em_0.2em_#7b52b9] right-[0.3em] transition-all duration-300 group-hover:w-[calc(100%-0.6em)] active:scale-95">
                <i
                    className="uil uil-arrow-right
                text-[1.1em] text-[#7b52b9]
                transition-transform duration-300 group-hover:translate-x-[0.1em] group-hover:scale-140"
                ></i>
              </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5 items-center justify-center mt-15">
            <div className="text-8xl text-gray-300">
              <i className="uil uil-filter"></i>
            </div>

            <div className="text-2xl text-gray-800">角逐左家垅之巅</div>
            <div className="text-lg text-gray-500">
              使用上方的排行筛选器，发现更多精彩内容！
            </div>
          </div>
        </div>
      </>
  );
}
