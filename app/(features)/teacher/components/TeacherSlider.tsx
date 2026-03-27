"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./style.css";
import RadarMap from "@/components/ui/RadarMap";
import { useEffect, useState } from "react";
import { getRandomTeacherShowcase } from "@/api/showcase";
import type { TeacherShowcaseItem } from "@/types/showcase";
import { buildTeacherPath } from "@/lib/paths";

const POSITION_CLASS = ["is-prev-2", "is-prev-1", "is-current", "is-next-1", "is-next-2"];
const FALLBACK_AVATAR =
  "https://faculty.csu.edu.cn/_resources/group1/M00/00/69/wKiylWJPi12AAlsZAALJVtHOhL4238.png";

function clampScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

function formatRate(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function getVisibleTeachers(items: TeacherShowcaseItem[], activeIndex: number) {
  if (items.length === 0) return [];

  return POSITION_CLASS.map((position, index) => {
    const offset = index - 2;
    const normalizedIndex = (activeIndex + offset + items.length) % items.length;

    return {
      position,
      teacher: items[normalizedIndex],
      key: `${position}-${items[normalizedIndex].id}-${normalizedIndex}`,
    };
  });
}

export default function TeacherSlider() {
  const [teachers, setTeachers] = useState<TeacherShowcaseItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let alive = true;

    getRandomTeacherShowcase()
      .then((items) => {
        if (!alive) return;
        setTeachers(items);
        setActiveIndex(0);
        setHasError(items.length === 0);
      })
      .catch((error) => {
        console.error(error);
        if (!alive) return;
        setHasError(true);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (teachers.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % teachers.length);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [teachers.length, activeIndex]);

  const shiftIndex = (step: number) => {
    if (teachers.length === 0) return;
    setActiveIndex((current) => (current + step + teachers.length) % teachers.length);
  };

  const visibleTeachers = getVisibleTeachers(teachers, activeIndex);
  const currentTeacher = teachers[activeIndex];
  const currentTeacherPath = currentTeacher ? buildTeacherPath(currentTeacher.id) : null;
  const radarValues = currentTeacher
    ? [
        clampScore(currentTeacher.avg_quality),
        clampScore(currentTeacher.avg_attendance),
        clampScore(currentTeacher.avg_grading),
        clampScore(
          typeof currentTeacher.good_rate === "number" && currentTeacher.good_rate <= 1
            ? currentTeacher.good_rate * 5
            : currentTeacher.good_rate,
        ),
      ]
    : [0, 0, 0, 0];

  return (
    <>
      <div className="teacher-slider-container w-full h-90 md:h-90 grid grid-cols-1 md:grid-cols-[5fr_3fr] ">
        <div className="teacher-slider flex justify-center items-center flex-col">
          <div className="box h-90 md:h-90">
            {visibleTeachers.length > 0 ? (
              visibleTeachers.map(({ position, teacher, key }) => (
                <Link
                  key={key}
                  href={buildTeacherPath(teacher.id)}
                  className={`item ${position}`}
                  aria-label={`查看教师 ${teacher.name} 详情`}
                >
                  <img
                    src={teacher.avatar_url || FALLBACK_AVATAR}
                    alt={teacher.name}
                  />
                </Link>
              ))
            ) : (
              <div className="teacher-slider-empty">暂无教师数据</div>
            )}

            <button type="button" className="slider-switch slider-switch-prev" onClick={() => shiftIndex(-1)} aria-label="查看上一位教师">
              <span></span>
            </button>
            <button type="button" className="slider-switch slider-switch-next" onClick={() => shiftIndex(1)} aria-label="查看下一位教师">
              <span></span>
            </button>
          </div>
        </div>

        <div className="teacher-introduce-container">
          <div className="inline-flex flex-col justify-evenly h-80 w-full">
            <h1 className="text-3xl md:text-3xl font-bold mt-5">
              Teacher Introduction
            </h1>

            {hasError && !isLoading && teachers.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                随机教师加载失败，请稍后重试。
              </div>
            ) : (
            <div className="flex items-center justify-between h-full">
              <RadarMap
                values={radarValues}
                indicator={[
                  { name: '教学质量', max: 5 },
                  { name: '考勤宽松', max: 5 },
                  { name: '给分宽松', max: 5 },
                  { name: '好评率', max: 5 }
                ]}
                width="200px"
                height="200px"
              />

              <div className="detail flex flex-col gap-2 items-end" >
                {currentTeacherPath ? (
                  <Link href={currentTeacherPath} className="name hero-gradient-text text-2xl font-bold">
                    {currentTeacher.name}
                  </Link>
                ) : (
                  <p className="name hero-gradient-text text-2xl font-bold">
                    {isLoading ? "教师加载中..." : "暂无教师"}
                  </p>
                )}
                <div className="flex flex-col gap-0.5 items-end " >
                  <p className="title text-gray-600">综合评分 {formatRate(currentTeacher?.avg_score)}</p>
                  <p className="position text-gray-600">{currentTeacher?.title || "职称待补充"}</p>
                  <p className="department text-gray-600">{currentTeacher?.department_name || "院系待补充"}</p>
                  <p className="department text-gray-500 text-sm">
                    {`评价 ${currentTeacher?.eval_count ?? 0} / 资源 ${currentTeacher?.resource_count ?? 0}`}
                  </p>
                </div>
              </div>
            </div>
            )}

            <div className="teacher-links flex mb-2 justify-end">
              <Link
                href="/search?type=teacher"
                className="flex justify-center button button--flex shadow-lg group w-full "
              >
                查看全部教师
                <i className="uil uil-message button__icon ml-1 transition-transform duration-300 group-hover:translate-x-3" />
              </Link>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
