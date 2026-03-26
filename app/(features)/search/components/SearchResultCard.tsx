import type {
  SearchCourseItem,
  SearchResourceCard,
  SearchTeacherItem,
} from "@/types/search";

type SearchResultCardProps =
  | {
      type: "course";
      item: SearchCourseItem;
      className?: string;
    }
  | {
      type: "teacher";
      item: SearchTeacherItem;
      className?: string;
    }
  | {
      type: "resource";
      item: SearchResourceCard;
      className?: string;
    };

const TYPE_THEME = {
  course: { label: "课程", dotClass: "bg-emerald-500", textClass: "text-emerald-700" },
  teacher: { label: "教师", dotClass: "bg-sky-500", textClass: "text-sky-700" },
  resource: { label: "资源", dotClass: "bg-amber-500", textClass: "text-amber-700" },
} as const;

function clampScore(value?: number | null) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 5);
}

function formatScore(value?: number | null, digits = 1) {
  if (value === null || typeof value === "undefined") return "--";
  return value.toFixed(digits);
}

function StarRating({ value }: { value?: number | null }) {
  const score = clampScore(value);
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-0.5 text-xs">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < fullStars;
        const isHalf = i === fullStars && hasHalf;
        return (
          <span key={i} className={isFull ? "text-amber-400" : isHalf ? "text-amber-300" : "text-gray-200"}>
            <i className={isFull ? "uil uil-star" : isHalf ? "uil uil-star-half-alt" : "uil uil-star"}></i>
          </span>
        );
      })}
    </div>
  );
}

function BarRow({ label, value, colorClass = "bg-blue-500" }: { label: string; value?: number | null; colorClass?: string }) {
  const score = clampScore(value);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-500 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${(score / 5) * 100}%` }}></div>
      </div>
      <span className="w-6 text-right text-gray-600 font-medium tabular-nums">{formatScore(value)}</span>
    </div>
  );
}

export default function SearchResultCard(props: SearchResultCardProps) {
  const { type, className = "" } = props;
  const theme = TYPE_THEME[type];

  // Extraction logic depending on type
  let title = "";
  let isPublic = false;
  let subtitleIcon = "";
  let subtitleContent: React.ReactNode = null;
  
  let leftScoreTitle = "总体评分";
  let leftScoreValue: number | null = null;
  let leftScoreHint = "";
  
  let rightDetailsTitle = "";
  let rightDetailsIcon = "";
  let rightDetailsContent: React.ReactNode = null;

  let bottomStats: Array<{ icon: string; label: string; value: string | number }> = [];

  if (type === "course") {
    const item = props.item;
    title = item.name;
    isPublic = item.course_type === "公选" || item.course_type === "public";
    
    const teachers = item.teachers ?? [];
    const teacherCount = item.teacher_count ?? teachers.length;
    subtitleIcon = "uil-users-alt";
    subtitleContent = (
      <div className="flex items-center gap-1.5">
        {teachers.slice(0, 3).map((t, i) => (
          <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600">{t.name}</span>
        ))}
        {teachers.length > 3 && <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600">...</span>}
        {teacherCount > 0 ? (
          <span className="text-xs text-gray-400 ml-1">共{teacherCount}位</span>
        ) : (
          <span className="text-xs text-gray-400">暂无教师</span>
        )}
      </div>
    );
    
    leftScoreValue = item.avg_score ?? 0;
    leftScoreHint = "/ 5.0";
    
    rightDetailsTitle = "详细评分";
    rightDetailsIcon = "uil-chart-bar";
    rightDetailsContent = (
      <>
        <BarRow label="收获感" value={item.avg_gain} colorClass="bg-emerald-400" />
        <BarRow label="作业量" value={item.avg_homework} colorClass="bg-orange-400" />
        <BarRow label="考试难度" value={item.avg_exam_diff} colorClass="bg-red-400" />
      </>
    );

    bottomStats = [
      { icon: "uil-comment-alt-lines", label: "评价", value: item.eval_count ?? 0 },
      { icon: "uil-folder", label: "资源", value: item.resource_count ?? 0 },
    ];
  } else if (type === "teacher") {
    const item = props.item;
    title = item.name;
    subtitleIcon = "uil-bag";
    subtitleContent = <span className="text-xs text-gray-600">{item.title || "未录入职称"}</span>;
    
    leftScoreValue = item.avg_score ?? 0;
    leftScoreHint = "/ 5.0";
    
    rightDetailsTitle = "详细评分";
    rightDetailsIcon = "uil-chart-bar";
    rightDetailsContent = (
      <>
        <BarRow label="教学质量" value={item.avg_quality} colorClass="bg-sky-400" />
        <BarRow label="给分宽松" value={item.avg_grading} colorClass="bg-purple-400" />
        <BarRow label="考勤要求" value={item.avg_attendance} colorClass="bg-indigo-400" />
      </>
    );
    
    bottomStats = [
      { icon: "uil-comment-alt-lines", label: "评价", value: item.eval_count ?? 0 },
      { icon: "uil-folder", label: "资源", value: item.resource_count ?? 0 },
    ];
  } else if (type === "resource") {
    const item = props.item;
    title = item.course_name;
    isPublic = item.course_type === "公选" || item.course_type === "public";
    subtitleIcon = "uil-folder-check";
    subtitleContent = (
      <span className="text-xs text-gray-600">
        匹配资源类型：{item.matched_resource_types?.join(", ") || "未知"}
      </span>
    );
    
    leftScoreTitle = "关联资源";
    leftScoreValue = item.resource_count;
    leftScoreHint = "个总资源";
    
    rightDetailsTitle = "检索统计";
    rightDetailsIcon = "uil-analytics";
    rightDetailsContent = (
      <div className="flex flex-col gap-2 justify-center h-full">
         <div className="flex items-center text-xs pb-1">
           <span className="text-gray-500 w-20">匹配结果数</span>
           <span className="font-medium text-gray-700 flex-1">{item.matched_resource_count}</span>
         </div>
         <div className="flex items-center text-xs pb-1">
           <span className="text-gray-500 w-20">资源总下载</span>
           <span className="font-medium text-gray-700 flex-1">{item.download_total}</span>
         </div>
         <div className="flex items-center text-xs">
           <span className="text-gray-500 w-20">课程总评分</span>
           <span className="font-medium text-gray-700 flex-1">{formatScore(item.avg_score)}</span>
         </div>
      </div>
    );
    
    bottomStats = [
      { icon: "uil-cloud-download", label: "总下载量", value: item.download_total ?? 0 },
    ];
  }

  return (
    <div className={`relative flex flex-col h-[260px] max-w-[460px] mx-auto w-full bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer ${className}`}>
      {/* Top right label */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100">
        <div className={`w-2 h-2 rounded-full ${theme.dotClass}`} />
        <span className={`text-[11px] font-medium ${theme.textClass}`}>{theme.label}</span>
      </div>

      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4 pr-16 h-[52px]">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 line-clamp-1" title={title}>{title}</h3>
            {isPublic && (
              <span className="bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 text-[10px] font-medium rounded whitespace-nowrap">
                公选
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 truncate">
            <i className={`uil ${subtitleIcon} text-gray-400 mt-0.5`}></i>
            {subtitleContent}
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 gap-1 sm:gap-4 mt-2 mb-2 min-h-[90px]">
          {/* Left panel (Score / Main Stat) */}
          <div className="w-[100px] sm:w-[120px] flex flex-col items-center justify-center border-r border-gray-100 pr-1 sm:pr-4">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 mb-1.5">
              <i className="uil uil-chart-line"></i> {leftScoreTitle}
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums">
                {type === "resource" ? leftScoreValue : formatScore(leftScoreValue)}
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{leftScoreHint}</div>
            {type !== "resource" && (
              <div className="mt-1.5">
                <StarRating value={leftScoreValue} />
              </div>
            )}
          </div>

          {/* Right panel (Details) */}
          <div className="flex-1 flex flex-col justify-center px-2">
            <div className="text-[11px] sm:text-xs text-gray-500 mb-2 flex items-center gap-1">
              <i className={`uil ${rightDetailsIcon}`}></i> {rightDetailsTitle}
            </div>
            <div className="flex flex-col gap-2">
              {rightDetailsContent}
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-4 sm:gap-6 overflow-x-auto scroolbar-hide">
          {bottomStats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <i className={`uil ${stat.icon} text-gray-400`}></i>
              <span className="text-gray-500">{stat.label}</span>
              <span className="text-gray-800 font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
