"use client";

import { useEffect, useState } from "react";
import { AdvancedInput, AdvancedSelect, AdvancedTextarea } from "@/app/(features)/resource/components/AdvancedFormControls";
import DetailComposerModal from "./DetailComposerModal";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import type { ResourceDetail, ResourceUpdateInput } from "@/types/detail";

const RESOURCE_TYPE_OPTIONS = [
  { value: "ppt", label: "PPT" },
  { value: "pdf", label: "PDF" },
  { value: "notes", label: "笔记" },
  { value: "exam", label: "试卷" },
  { value: "lab", label: "实验" },
  { value: "other", label: "其他" },
] as const;

export default function ResourceEditModal({
  resource,
  open,
  onClose,
  onSubmit,
}: {
  resource: ResourceDetail | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ResourceUpdateInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(resource?.title ?? "");
    setDescription(resource?.description ?? "");
    setResourceType(resource?.resource_type ?? "other");
  }, [resource]);

  return (
    <DetailComposerModal
      isOpen={open}
      onClose={onClose}
      accent="resource"
      badge="修改资源"
      title="编辑资源信息"
      description="当前仅支持修改标题、描述和资源类型。课程归属保持不变。"
    >
      {resource ? (
        <div className="space-y-4">
          <AdvancedInput
            label="资源标题"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <AdvancedSelect
            label="资源类型"
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value)}
          >
            {RESOURCE_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </AdvancedSelect>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            当前课程：<span className="font-medium text-slate-700">{resource.course?.name || `课程 #${resource.course_id}`}</span>
          </div>
          <AdvancedTextarea
            label="资源说明"
            rows={7}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              取消
            </button>
            <ActionSubmitButton
              defaultText="保存修改"
              isSent={isSubmitting}
              disabled={isSubmitting || !title.trim()}
              onClick={async () => {
                if (!resource) return;
                setIsSubmitting(true);
                try {
                  await onSubmit({
                    title: title.trim(),
                    description: description.trim(),
                    course_id: resource.course_id,
                    resource_type: resourceType,
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </DetailComposerModal>
  );
}
