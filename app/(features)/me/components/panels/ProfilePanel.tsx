"use client";

import {useState} from "react";
import {updateMyProfile} from "@/api/me";
import {feedback} from "@/store/useFeedbackStore";
import type {UserProfile} from "@/types/auth";
import type {Department, MeDashboardData, MyProfileUpdateInput} from "@/types/me";
import {FORM_INPUT_CLASS_NAME, getErrorMessage} from "../shared/helpers";

export default function ProfilePanel({
                                       profile,
                                       departments,
                                       onClose,
                                       onProfileUpdated,
                                     }: {
  profile: UserProfile;
  departments: Department[];
  onClose: () => void;
  onProfileUpdated: (nextProfile: UserProfile, updater: (current: MeDashboardData | null) => MeDashboardData | null) => void;
}) {
  const [form, setForm] = useState({
    nickname: profile.nickname ?? "",
    avatar_url: profile.avatar_url ?? "",
    department_id: profile.department_id ? `${profile.department_id}` : "",
    grade: profile.grade ? `${profile.grade}` : "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nickname.trim()) {
      feedback.warning({
        title: "昵称不能为空",
        description: "请填写要展示的昵称。",
      });
      return;
    }

    const payload: MyProfileUpdateInput = {
      nickname: form.nickname.trim(),
      avatar_url: form.avatar_url.trim() || undefined,
      department_id: form.department_id
          ? Number(form.department_id)
          : undefined,
      grade: form.grade ? Number(form.grade) : undefined,
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-gray-600">
          <span>昵称</span>
          <input
              className={FORM_INPUT_CLASS_NAME}
              value={form.nickname}
              onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nickname: event.target.value,
                  }))
              }
          />
        </label>
        <label className="space-y-2 text-sm text-gray-600">
          <span>头像 URL</span>
          <input
              className={FORM_INPUT_CLASS_NAME}
              value={form.avatar_url}
              onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    avatar_url: event.target.value,
                  }))
              }
          />
        </label>
        <label className="space-y-2 text-sm text-gray-600">
          <span>学院</span>
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
            <option value="">请选择学院</option>
            {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-gray-600">
          <span>入学年份</span>
          <input
              className={FORM_INPUT_CLASS_NAME}
              placeholder="例如 2022"
              value={form.grade}
              onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    grade: event.target.value,
                  }))
              }
          />
        </label>
        <div className="col-span-full mt-2 flex justify-end gap-3">
          <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "保存中..." : "保存资料"}
          </button>
        </div>
      </div>
  );
}
