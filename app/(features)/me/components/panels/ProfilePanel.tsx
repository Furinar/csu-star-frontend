"use client";

import { useState } from "react";
import { updateMyProfile } from "@/api/me";
import { AdvancedInput } from "@/app/(features)/resource/components/AdvancedFormControls";
import { feedback } from "@/store/useFeedbackStore";
import type { UserProfile } from "@/types/auth";
import type { MeDashboardData, MyProfileUpdateInput } from "@/types/me";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  getErrorMessage,
} from "../shared/helpers";

export default function ProfilePanel({
  profile,
  onClose,
  onProfileUpdated,
}: {
  profile: UserProfile;
  onClose: () => void;
  onProfileUpdated: (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => void;
}) {
  const [form, setForm] = useState({
    nickname: profile.nickname ?? "",
    avatar_url: profile.avatar_url ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const nickname = form.nickname.trim();
    const avatarUrl = form.avatar_url.trim();

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

    const payload: MyProfileUpdateInput = {
      nickname,
      avatar_url: avatarUrl || undefined,
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
        当前资料编辑仅支持真正可保存的字段：昵称和头像地址。学院、年级暂未在账号资料接口中开放修改。
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

      <AdvancedInput
        label="头像 URL"
        type="url"
        placeholder="输入新的 http/https 头像链接"
        value={form.avatar_url}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            avatar_url: event.target.value,
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
