"use client";

import { useEffect, useRef, useState } from "react";
import { updateMyProfile } from "@/api/me";
import {
  AdvancedInput,
} from "@/app/(features)/resource/components/AdvancedFormControls";
import { DEPARTMENTS } from "@/data/departments";
import { feedback } from "@/store/useFeedbackStore";
import type { UserProfile } from "@/types/auth";
import type {
  Department,
  MeDashboardData,
  MyProfileUpdateInput,
} from "@/types/me";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  getErrorMessage,
} from "../shared/helpers";

function DepartmentSelectField({
  value,
  departments,
  onChange,
}: {
  value: string;
  departments: Department[];
  onChange: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedDepartment =
    departments.find((department) => `${department.id}` === value) ?? null;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={`relative w-full cursor-pointer rounded-2xl border border-gray-500 bg-white px-4 pb-3 pt-6 text-left text-sm text-gray-900 transition sm:text-base ${open ? "border-first ring-2 ring-first/10" : "hover:border-gray-600"}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="absolute left-4 top-2 bg-white px-1 text-xs text-gray-500">
          所属学院
        </span>
        <span className={selectedDepartment ? "" : "text-gray-400"}>
          {selectedDepartment?.name ?? "点击选择你的学院"}
        </span>
        <i
          className={`uil uil-angle-down absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-500 transition ${open ? "rotate-180" : ""}`}
        ></i>
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-20 mt-2 max-h-[50vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.14)] sm:max-h-60"
          role="listbox"
          aria-label="所属学院"
        >
          <button
            type="button"
            className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-sm transition ${value ? "text-slate-600 hover:bg-slate-50" : "bg-sky-50 text-sky-700"}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            点击选择你的学院
          </button>

          {departments.map((department) => {
            const isSelected = `${department.id}` === value;

            return (
              <button
                key={department.id}
                type="button"
                className={`mt-1 flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-sm transition ${isSelected ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"}`}
                onClick={() => {
                  onChange(`${department.id}`);
                  setOpen(false);
                }}
              >
                {department.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function ProfilePanel({
  profile,
  departments,
  onClose,
  onOpenOAuth,
  onProfileUpdated,
}: {
  profile: UserProfile;
  departments: Department[];
  onClose: () => void;
  onOpenOAuth: () => void;
  onProfileUpdated: (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => void;
}) {
  const [form, setForm] = useState({
    nickname: profile.nickname ?? "",
    department_id: profile.department_id ? `${profile.department_id}` : "",
    grade: profile.grade ? `${profile.grade}` : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const resolvedDepartments = departments.length > 0 ? departments : DEPARTMENTS;

  const handleSave = async () => {
    const nickname = form.nickname.trim();
    const currentYear = new Date().getFullYear();
    const parsedGrade = form.grade.trim() ? Number(form.grade) : undefined;

    if (!nickname) {
      feedback.warning({
        title: "昵称不能为空",
        description: "请填写要展示的昵称。",
      });
      return;
    }

    if (
      parsedGrade != null &&
      (!Number.isInteger(parsedGrade) ||
        parsedGrade < 2000 ||
        parsedGrade > currentYear + 1)
    ) {
      feedback.warning({
        title: "入学年份无效",
        description: `请输入 2000 到 ${currentYear + 1} 之间的年份。`,
      });
      return;
    }

    const payload: MyProfileUpdateInput = {
      nickname,
      department_id: form.department_id
        ? Number(form.department_id)
        : undefined,
      grade: parsedGrade,
    };

    setIsSaving(true);
    try {
      const nextProfile = await updateMyProfile(payload);
      onProfileUpdated(nextProfile, (current) =>
        current
          ? {
              ...current,
              profile: nextProfile,
            }
          : current,
      );
      onClose();
      feedback.success({
        title: "资料已更新",
        description: "个人信息已经同步到你的主页。",
      });
    } catch (error) {
      feedback.error({
        title: "资料保存失败",
        description: getErrorMessage(error, "请稍后再试"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
        完善学院和年级后，个人中心会同步显示更完整的资料信息。
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4 text-sm leading-6 text-slate-600">
        <p>
          想换个性化头像，请绑定第三方平台账户。绑定成功后会自动切换为该平台头像，之后通过 OAuth 登录也会同步刷新头像。
        </p>
        <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={onOpenOAuth}
            className="w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-white sm:w-auto"
          >
            去绑定第三方账号
          </button>
          <span className="text-xs text-slate-500">
            当前头像地址不再在此处展示或手动编辑。
          </span>
        </div>
      </div>

      <AdvancedInput
        label="昵称"
        maxLength={30}
        placeholder="请输入想要的昵称"
        value={form.nickname}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            nickname: event.target.value,
          }))
        }
      />

      <DepartmentSelectField
        value={form.department_id}
        departments={resolvedDepartments}
        onChange={(departmentId) =>
          setForm((current) => ({
            ...current,
            department_id: departmentId,
          }))
        }
      />

      <AdvancedInput
        label="入学年份"
        type="number"
        min={2000}
        max={new Date().getFullYear() + 1}
        placeholder="例如 2022"
        value={form.grade}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            grade: event.target.value,
          }))
        }
      />

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
        >
          {isSaving ? "正在保存..." : "保存资料"}
        </button>
      </div>
    </div>
  );
}
