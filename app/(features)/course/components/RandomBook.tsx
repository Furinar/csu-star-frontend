import "./style.css";
import StarRating from "@/components/ui/StarRating";
import RatingBar from "@/components/ui/RatingBar";
import Link from "next/link";

export default function RandomBook() {
  return (
    <>
      <div className="random-book h-90 grid grid-cols-[3fr_2fr] p-5">
        <div className="left flex flex-col gap-4">
          <div className="course-info flex gap-2 items-center">
            <div className="course-name text-5xl font-bold hero-gradient-text">
              提瓦特大陆元素理论
            </div>
            {/*公选/非公选*/}
            <div className="course-type bg-gray-300 p-1 rounded-xl text-gray-600 text-sm">
              公选
            </div>
          </div>

          <div className="course-relate flex-1 grid grid-cols-3 gap-6 pt-4">
            {/* 关联资源卡片 */}
            <div className="resource-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <i className="uil uil-file-alt text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  关联资源
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center text-5xl font-bold text-gray-800 my-2 tracking-tight">
                24
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                  <i className="uil uil-import text-sm"></i> 1.2k
                </div>
                <Link
                  href="#"
                  className="text-xs text-[var(--first-color)] hover:text-white hover:bg-[var(--first-color)] px-2 py-1 rounded-md transition-colors font-medium"
                >
                  资源详情
                </Link>
              </div>
            </div>

            {/* 相关评价卡片 */}
            <div className="comment-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <i className="uil uil-comment-dots text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  相关评价
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center text-5xl font-bold text-gray-800 my-2 tracking-tight">
                87
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                  <i className="uil uil-users-alt text-sm"></i>
                </div>
                <Link
                  href="#"
                  className="text-xs text-[var(--first-color)] hover:text-white hover:bg-[var(--first-color)] px-2 py-1 rounded-md transition-colors font-medium"
                >
                  评价详情
                </Link>
              </div>
            </div>

            {/* 授课教师卡片 */}
            <div className="teacher-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <i className="uil uil-user-circle text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  授课教师
                </span>
              </div>

              <div className="flex flex-wrap gap-2 overflow-y-auto w-full custom-scrollbar pr-1 content-start">
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  教师A
                </Link>
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  教师B
                </Link>
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  王老吉
                </Link>
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  蔡徐坤
                </Link>
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  李四
                </Link>
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  赵六
                </Link>
                <Link
                  href="#"
                  className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                >
                  钱七
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="right bg-white p-4 rounded-[15px] shadow-lg h-80">
          <div className="course-rate flex flex-col  h-full ">
            <div className="avg-rate self-center flex justify-around w-full items-center">
              <div className="flex">
                <div className="text-6xl font-bold self-center">3.78</div>
                <div className="self-end text-gray-500">/ 5.0</div>
              </div>

              <div>
                <div className="mb-1">
                  <StarRating score={3.78} size={"18px"} />
                </div>

                <div className="text-md text-gray-500">
                  基于 <strong> 87 </strong>条评价
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-start justify-evenly gap-1 text-center w-full">
              <RatingBar
                label={"推荐指数"}
                score={3.96}
                maxScore={5.0}
                color={3}
              />
              <RatingBar
                label={"给分情况"}
                score={3.45}
                maxScore={5.0}
                color={1}
              />
              <RatingBar
                label={"任务量"}
                score={3.79}
                maxScore={5.0}
                color={0}
              />
              <RatingBar
                label={"课程收获"}
                score={4.2}
                maxScore={5.0}
                color={2}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
