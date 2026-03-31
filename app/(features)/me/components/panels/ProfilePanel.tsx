"use client";

import { useState } from "react";
import { updateMyProfile } from "@/api/me";
import { DEPARTMENTS } from "@/data/departments";
import { feedback } from "@/store/useFeedbackStore";
import type { UserProfile } from "@/types/auth";
import type {
  Department,
  MeDashboardData,
  MyProfileUpdateInput,
} from "@/types/me";
import { FORM_INPUT_CLASS_NAME, getErrorMessage } from "../shared/helpers";

export default function ProfilePanel({
  profile,
  departments,
  onClose,
  onProfileUpdated,
}: {
  profile: UserProfile;
  departments: Department[];
  onClose: () => void;
  onProfileUpdated: (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => void;
}) {
  const [form, setForm] = useState({
    nickname: profile.nickname ?? "",
    avatar_url: profile.avatar_url ?? "",
    department_id: profile.department_id ? `${profile.department_id}` : "",
    grade: profile.grade ? `${profile.grade}` : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const resolvedDepartments = departments.length > 0 ? departments : DEPARTMENTS;

  const handleSave = async () => {
    const nickname = form.nickname.trim();
    const avatarUrl = form.avatar_url.trim();
    const currentYear = new Date().getFullYear();
    const parsedGrade = form.grade.trim() ? Number(form.grade) : undefined;

    if (!nickname) {
      feedback.warning({
        title: "昵称不能为空",
        description: "请填写要展示的昵称。",
      });
      return;
    }

    if (avatarUrl) {
      try {
        const parsedUrl = new URL(avatarUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("invalid protocol");
        }
      } catch {
        feedback.warning({
          title: "头像地址无效",
          description: "请填写有效的 http/https 图片地址。",
        });
        return;
      }
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
      avatar_url: avatarUrl || undefined,
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
      <label className="block space-y-2 text-sm text-gray-600">
        <span>昵称</span>
        <input
          className={FORM_INPUT_CLASS_NAME}
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
      </label>
      <label className="block space-y-2 text-sm text-gray-600">
        <span>头像 URL</span>
        <input
          className={FORM_INPUT_CLASS_NAME}
          placeholder="输入你的新头像链接 (http/https)"
          value={form.avatar_url}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              avatar_url: event.target.value,
            }))
          }
        />
      </label>
      <label className="block space-y-2 text-sm text-gray-600">
        <span>所属学院</span>
        <select
          className={FORM_INPUT_CLASS_NAME}
          value={form.department_id}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              department_id: event.target.value,
            }))
          }
        >
          <option value="">点击选择你的学院</option>
          {resolvedDepartments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm text-gray-600">
        <span>入学年份</span>
        <input
          type="number"
          className={FORM_INPUT_CLASS_NAME}
          placeholder="例如：2022"
          min={2000}
          max={new Date().getFullYear() + 1}
          value={form.grade}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              grade: event.target.value,
            }))
          }
        />
      </label>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-xl border border-gray-200/70 bg-white/70 px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-first px-6 py-2.5 text-sm font-medium text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "正在保存..." : "保存资料"}
        </button>
      </div>
    </div>
  );
}
