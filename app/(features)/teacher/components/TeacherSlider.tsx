"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./style.css";
import RadarMap from "@/components/ui/RadarMap";
import { useEffect, useRef, useState } from "react";
import { getRandomTeacherShowcase } from "@/api/showcase";
import type { TeacherShowcaseItem } from "@/types/showcase";
import { buildTeacherPath } from "@/lib/paths";

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


export default function TeacherSlider() {
  const [teachers, setTeachers] = useState<TeacherShowcaseItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    active: boolean;
  } | null>(null);

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
  }, [teachers.length]);

  const shiftIndex = (step: number) => {
    if (teachers.length === 0) return;
    setActiveIndex((current) => (current + step + teachers.length) % teachers.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (teachers.length <= 1) return;
    const touch = event.touches[0];
    if (!touch) return;

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      active: true,
    };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStateRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;

    touchStateRef.current.currentX = touch.clientX;
    touchStateRef.current.currentY = touch.clientY;
  };

  const handleTouchEnd = () => {
    const state = touchStateRef.current;
    touchStateRef.current = null;

    if (!state?.active) return;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 48 || absX <= absY * 1.2) {
      return;
    }

    shiftIndex(deltaX < 0 ? 1 : -1);
  };

  const getPositionClass = (index: number) => {
    if (teachers.length === 0) return 'is-hidden';
    const num = teachers.length;
    const diff = (index - activeIndex + num) % num;
    // to handle small arrays
    if (diff === 0) return 'is-current';
    if (diff === 1) return 'is-next-1';
    if (diff === 2 && num >= 5) return 'is-next-2';
    if (diff === num - 1) return 'is-prev-1';
    if (diff === num - 2 && num >= 5) return 'is-prev-2';
    return 'is-hidden';
  };

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
      <div
        className="teacher-slider-container grid h-auto min-h-[250px] w-full grid-cols-[0.92fr_1.08fr] md:h-90 md:min-h-0 md:grid-cols-[5fr_3fr]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255, 228, 239, 0.94) 0%, rgba(255, 255, 255, 0.97) 42%, rgba(255, 241, 214, 0.94) 100%)",
          boxShadow:
            "12px 18px 36px rgba(236, 72, 153, 0.12), -10px -10px 24px rgba(255, 255, 255, 0.92)",
        }}
      >
        <div className="teacher-slider flex items-center justify-center">
          <div
            className="box h-auto min-h-[250px] w-full md:h-90 md:min-h-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {teachers.length > 0 ? (
              teachers.map((teacher, index) => {
                const position = getPositionClass(index);
                return (
                  <Link
                    key={teacher.id}
                    href={buildTeacherPath(teacher.id)}
                    className={`item ${position}`}
                    aria-label={`查看教师 ${teacher.name} 详情`}
                  >
                    <img
                      src={teacher.avatar_url || FALLBACK_AVATAR}
                      alt={teacher.name}
                    />
                  </Link>
                );
              })
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

        <div className="teacher-introduce-container px-2.5 py-2 md:px-0 md:pb-0 md:pt-0">
          <div className="inline-flex h-auto min-h-[250px] flex-col justify-between gap-2 py-1 md:h-80 md:min-h-0 md:gap-0 md:py-0">
            <h1 className="mt-0 text-lg font-bold leading-none md:mt-5 md:text-3xl">
              Teacher Introduction
            </h1>

            {hasError && !isLoading && teachers.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                随机教师加载失败，请稍后重试。
              </div>
            ) : (
            <div className="flex h-full items-center justify-between gap-2 md:gap-4">
              <RadarMap
                values={radarValues}
                indicator={[
                  { name: '教学质量', max: 5 },
                  { name: '考勤宽松', max: 5 },
                  { name: '给分宽松', max: 5 },
                  { name: '好评率', max: 5 }
                ]}
                width="112px"
                height="112px"
              />

              <div className="detail flex min-w-0 flex-col items-end gap-1 md:gap-2" >
                {currentTeacherPath ? (
                  <Link href={currentTeacherPath} className="name hero-gradient-text line-clamp-2 text-right text-base font-bold leading-tight md:text-2xl">
                    {currentTeacher.name}
                  </Link>
                ) : (
                  <p className="name hero-gradient-text line-clamp-2 text-right text-base font-bold leading-tight md:text-2xl">
                    {isLoading ? "教师加载中..." : "暂无教师"}
                  </p>
                )}
                <div className="flex flex-col items-end gap-0.5 text-right" >
                  <p className="title text-xs text-gray-600 md:text-base">综合评分 {formatRate(currentTeacher?.avg_score)}</p>
                  <p className="position line-clamp-1 text-[11px] text-gray-600 md:text-base">{currentTeacher?.title || "职称待补充"}</p>
                  <p className="department line-clamp-1 text-[11px] text-gray-600 md:text-base">{currentTeacher?.department_name || "院系待补充"}</p>
                  <p className="department text-[10px] text-gray-500 md:text-sm">
                    {`评价 ${currentTeacher?.eval_count ?? 0} / 收藏 ${currentTeacher?.favorite_count ?? 0}`}
                  </p>
                </div>
              </div>
            </div>
            )}

            <div className="teacher-links mb-0 flex justify-end md:mb-2">
              {currentTeacherPath ? (
                <Link
                  href={currentTeacherPath}
                  className="button button--flex group flex w-full justify-center px-2.5 py-1.5 text-xs shadow-lg md:px-5 md:py-2.5 md:text-base"
                >
                  查看当前教师
                  <i className="uil uil-message button__icon ml-1 text-xs transition-transform duration-300 group-hover:translate-x-3 md:text-base" />
                </Link>
              ) : (
                <div className="button button--flex flex w-full cursor-not-allowed justify-center px-2.5 py-1.5 text-xs shadow-lg opacity-60 md:px-5 md:py-2.5 md:text-base">
                  查看当前教师
                  <i className="uil uil-message button__icon ml-1 text-xs md:text-base" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
