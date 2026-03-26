"use client";

import React from "react";
import SearchResultCard from "@/app/(features)/search/components/SearchResultCard";
import type {
  SearchCourseItem,
  SearchResourceCard,
  SearchTeacherItem,
} from "@/types/search";

const mockCourse: SearchCourseItem = {
  id: 1,
  name: "计算机网络",
  course_type: "非公选",
  credits: 3.5,
  avg_score: 4.2,
  avg_homework: 3.8,
  avg_gain: 4.5,
  avg_exam_diff: 4.0,
  eval_count: 128,
  resource_count: 34,
  teachers: [
    { id: 101, name: "王文祥" },
    { id: 102, name: "李云" },
    { id: 103, name: "张明" },
    { id: 104, name: "刘星" },
  ],
  teacher_count: 4,
};

const mockPublicCourse: SearchCourseItem = {
  id: 2,
  name: "欧洲文化史",
  course_type: "公选",
  credits: 2.0,
  avg_score: 4.8,
  avg_homework: 2.1,
  avg_gain: 4.2,
  avg_exam_diff: 1.5,
  eval_count: 356,
  resource_count: 12,
  teachers: [
    { id: 105, name: "陈教授" }
  ],
  teacher_count: 1,
};

const mockTeacher: SearchTeacherItem = {
  id: 101,
  name: "王文祥",
  title: "教授",
  avg_score: 4.3,
  avg_quality: 4.6,
  avg_grading: 3.8,
  avg_attendance: 4.2,
  eval_count: 89,
  resource_count: 15,
};

const mockResource: SearchResourceCard = {
  id: 1001,
  course_id: 1,
  course_name: "计算机网络",
  course_type: "非公选",
  credits: 3.5,
  avg_score: 4.2,
  resource_count: 34,
  download_total: 1205,
  matched_resource_count: 5,
  matched_resource_types: ["ppt", "pdf", "exam"],
};

export default function TestPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">搜索卡片预览</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm text-slate-500 mb-3">1. 课程卡片 (非公选, 多位教师)</h3>
              <SearchResultCard type="course" item={mockCourse} />
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-3">2. 课程卡片 (公选, 单个教师)</h3>
              <SearchResultCard type="course" item={mockPublicCourse} />
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-3">3. 教师卡片</h3>
              <SearchResultCard type="teacher" item={mockTeacher} />
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-3">4. 资源卡片</h3>
              <SearchResultCard type="resource" item={mockResource} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
