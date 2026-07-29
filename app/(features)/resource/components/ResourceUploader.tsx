"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  abortResourceUpload,
  createResource,
  finalizeResourceUpload,
  searchCourseSuggestions,
  uploadResourceFileToCos,
} from "@/api/resource";
import {
  CourseSuggestionItem,
  MAX_RESOURCE_UPLOAD_SIZE_BYTES,
  ResourceType,
  UploadFileItem,
} from "@/types/resource";
import {
  getResourceCategoryLabel,
  RESOURCE_CATEGORY_OPTIONS,
} from "@/lib/resourceCategory";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import {
  AdvancedInput,
  AdvancedTextarea,
} from "@/components/ui/AdvancedFormControls";
import type { EntityId } from "@/types/entity";
import { processDataTransferItems } from "./folderZipper";
import { requireAuthAction } from "@/lib/requireAuthAction";

const MAX_UPLOAD_FILENAME_LENGTH = 255;

function getUploadErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "上传过程中出错，请重试";
  }

  const status = error.response?.status;
  const code = error.code;

  // Browser blocks CORS failures as network errors, so response is often empty.
  if (
    !status &&
    (code === "ERR_NETWORK" || error.message === "Network Error")
  ) {
    return "上传失败：请在国内上传或者下载文件";
  }

  if (status === 403) {
    const requestUrl = error.config?.url ?? "";
    if (requestUrl.startsWith("http")) {
      return "上传失败：COS 返回 403（可能是签名过期或 CORS 拒绝）。";
    }
    return error.message || "当前账号已被限制，暂时无法继续上传。";
  }

  if (status === 429) {
    return error.message || "当前上传请求过于频繁，请稍后再试";
  }

  return error.message || "上传过程中出错，请重试";
}

function splitEditableFilename(filename: string) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return { baseName: filename, extension: "" };
  }

  return {
    baseName: filename.slice(0, lastDot),
    extension: filename.slice(lastDot),
  };
}

function buildEditedFilename(baseName: string, extension: string) {
  const trimmed = baseName.trim();
  if (!trimmed) return null;

  const nextFilename = `${trimmed}${extension}`;
  if (nextFilename.length > MAX_UPLOAD_FILENAME_LENGTH) {
    return null;
  }

  return nextFilename;
}

function formatSizeMb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2);
}

export interface ResourceUploaderProps {
  isModal?: boolean;
  onClose?: () => void;
  initialCourse?: { id: EntityId; name: string };
  onUploadSuccess?: () => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

export default function ResourceUploader({
  isModal,
  onClose,
  initialCourse,
  onUploadSuccess,
  onUploadingChange,
}: ResourceUploaderProps = {}) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const courseFieldRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [resourceType, setResourceType] = useState<ResourceType>("general");

  const [courseQuery, setCourseQuery] = useState("");
  const [courseOptions, setCourseOptions] = useState<CourseSuggestionItem[]>(
    [],
  );
  const [selectedCourse, setSelectedCourse] =
    useState<CourseSuggestionItem | null>(initialCourse || null);
  const [isSearchingCourse, setIsSearchingCourse] = useState(false);

  const [isUploading, setIsUploadingState] = useState(false);
  const setIsUploading = useCallback(
    (val: boolean) => {
      setIsUploadingState(val);
      onUploadingChange?.(val);
    },
    [onUploadingChange],
  );
  const [totalProgress, setTotalProgress] = useState(0);
  const [uploadedResourceId, setUploadedResourceId] = useState<EntityId | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingBaseName, setEditingBaseName] = useState("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (isUploading || uploadedResourceId) return;
      const mapped = newFiles.map((f) => ({
        local_id: Math.random().toString(36).substring(7),
        file: f,
        filename: f.name,
        progress: 0,
        status: "queued" as const,
      }));
      setFiles((prev) => {
        const next = [...prev, ...mapped];
        if (!title && prev.length === 0 && mapped.length > 0) {
          setTitle(splitEditableFilename(mapped[0].filename).baseName);
        }
        return next;
      });
    },
    [isUploading, uploadedResourceId, title],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        try {
          const parsedFiles = await processDataTransferItems(
            e.dataTransfer.items,
          );
          if (parsedFiles.length > 0) {
            addFiles(parsedFiles);
          }
        } catch (error) {
          setErrorMsg("处理文件夹时发生错误，请重试");
          console.error(error);
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // Allow re-selecting the same file path.
    e.target.value = "";
  };

  const removeFile = (local_id: string) => {
    if (isUploading || uploadedResourceId) return;
    if (editingFileId === local_id) {
      setEditingFileId(null);
      setEditingBaseName("");
    }
    setFiles((prev) => prev.filter((f) => f.local_id !== local_id));
  };

  const startEditingFileName = (localId: string, filename: string) => {
    if (isUploading || uploadedResourceId) return;
    setErrorMsg("");
    setEditingFileId(localId);
    setEditingBaseName(splitEditableFilename(filename).baseName);
  };

  const cancelEditingFileName = () => {
    setEditingFileId(null);
    setEditingBaseName("");
  };

  const saveEditedFileName = (localId: string, extension: string) => {
    const nextFilename = buildEditedFilename(editingBaseName, extension);
    if (!nextFilename) {
      setErrorMsg("文件名不能为空，且长度不能超过 255 个字符");
      return;
    }

    setFiles((prev) =>
      prev.map((item) =>
        item.local_id === localId ? { ...item, filename: nextFilename } : item,
      ),
    );
    setErrorMsg("");
    cancelEditingFileName();
  };

  const debouncedCourseQuery = useDebounce(courseQuery, 500);

  useEffect(() => {
    if (!debouncedCourseQuery.trim()) {
      const timer = setTimeout(() => {
        setCourseOptions([]);
        setIsSearchingCourse(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      setIsSearchingCourse(true);
      searchCourseSuggestions(debouncedCourseQuery)
        .then((results) => {
          if (isMounted) setCourseOptions(results);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          if (isMounted) setIsSearchingCourse(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [debouncedCourseQuery]);

  useEffect(() => {
    if (!editingFileId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [editingFileId]);

  // Close course suggestions when clicking outside.
  useEffect(() => {
    if (!courseOptions.length && !isSearchingCourse) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!courseFieldRef.current?.contains(event.target as Node)) {
        setCourseOptions([]);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [courseOptions.length, isSearchingCourse]);

  const startUpload = async () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能上传资源。",
      })
    ) {
      onClose?.();
      return;
    }

    if (files.length === 0) {
      setErrorMsg("请至少选择一个文件");
      return;
    }
    if (!title) {
      setErrorMsg("请填写资源标题");
      return;
    }
    if (!selectedCourse) {
      setErrorMsg("请选择关联课程");
      return;
    }
    let filesForUpload = files;
    if (editingFileId) {
      const editingTarget = files.find(
        (item) => item.local_id === editingFileId,
      );
      if (editingTarget) {
        const nextFilename = buildEditedFilename(
          editingBaseName,
          splitEditableFilename(editingTarget.filename).extension,
        );
        if (!nextFilename) {
          setErrorMsg("文件名不能为空，且长度不能超过 255 个字符");
          return;
        }
        filesForUpload = files.map((item) =>
          item.local_id === editingFileId
            ? { ...item, filename: nextFilename }
            : item,
        );
        setFiles(filesForUpload);
        cancelEditingFileName();
      }
    }

    const totalSize = filesForUpload.reduce(
      (acc, file) => acc + file.file.size,
      0,
    );
    if (totalSize > MAX_RESOURCE_UPLOAD_SIZE_BYTES) {
      setErrorMsg("总资源上传总大小不能超过 300MB");
      return;
    }

    setErrorMsg("");
    setIsUploading(true);
    setTotalProgress(0);

    setFiles((prev) =>
      prev.map((f) => ({ ...f, progress: 0, status: "uploading" })),
    );

    let uploadSessionId = "";

    try {
      const createInput = {
        title,
        description,
        course_id: selectedCourse.id,
        resource_type: resourceType,
        files: filesForUpload.map((f) => ({
          filename: f.filename,
          size_bytes: f.file.size,
          mime: f.file.type || undefined,
        })),
      };

      const { upload_session_id, upload_urls } =
        await createResource(createInput);
      uploadSessionId = upload_session_id;

      const totalBytes = totalSize;
      const uploadedBytesPerFile: Record<string, number> = {};

      const uploadPromises = filesForUpload.map(async (fileItem, index) => {
        const urlItem = upload_urls[index];
        if (!urlItem) {
          throw new Error(`未找到文件 ${fileItem.filename} 的上传链接`);
        }

        try {
          await uploadResourceFileToCos({
            url: urlItem.url,
            method: urlItem.method,
            file: fileItem.file,
            contentType: fileItem.file.type || "application/octet-stream",
            headers: urlItem.headers,
            onProgress: (progress, event) => {
              setFiles((prev) => {
                const updated = [...prev];
                const fileIndex = updated.findIndex(
                  (f) => f.local_id === fileItem.local_id,
                );
                if (fileIndex !== -1) {
                  updated[fileIndex] = { ...updated[fileIndex], progress };
                }
                return updated;
              });

              if (event.loaded !== undefined) {
                uploadedBytesPerFile[fileItem.local_id] = event.loaded;
                const currentTotal = Object.values(uploadedBytesPerFile).reduce(
                  (a, b) => a + b,
                  0,
                );
                const overallPercent =
                  totalBytes > 0
                    ? Math.min(
                        100,
                        Math.round((currentTotal / totalBytes) * 100),
                      )
                    : 100;
                setTotalProgress(overallPercent);
              }
            },
          });

          setFiles((prev) => {
            const updated = [...prev];
            const fileIndex = updated.findIndex(
              (f) => f.local_id === fileItem.local_id,
            );
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: "success",
                progress: 100,
              };
            }
            return updated;
          });
        } catch (e) {
          setFiles((prev) => {
            const updated = [...prev];
            const fileIndex = updated.findIndex(
              (f) => f.local_id === fileItem.local_id,
            );
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: "failed",
                error: "上传失败",
              };
            }
            return updated;
          });
          throw e;
        }
      });

      await Promise.all(uploadPromises);
      const { resource_id } = await finalizeResourceUpload(upload_session_id);

      setTotalProgress(100);
      setUploadedResourceId(resource_id);
      feedback.success({
        title: "上传成功",
        description: "资源已发布，获得 2 积分。",
      });
      onUploadSuccess?.();
      setIsUploading(false);
    } catch (e: unknown) {
      console.error(e);
      if (uploadSessionId) {
        try {
          await abortResourceUpload(uploadSessionId);
        } catch (cleanupError) {
          console.error("Failed to abort upload session:", cleanupError);
        }
      }
      setErrorMsg(getUploadErrorMessage(e));
      setIsUploading(false);
    }
  };

  const totalSizeBytes = files.reduce((a, b) => a + b.file.size, 0);
  const showCourseSuggestions =
    courseOptions.length > 0 ||
    (courseQuery.trim().length > 0 && !isSearchingCourse);

  const resetAfterSuccess = () => {
    setUploadedResourceId(null);
    setFiles([]);
    setTitle("");
    setDescription("");
    setDescExpanded(false);
    setSelectedCourse(initialCourse || null);
    setCourseQuery("");
    setTotalProgress(0);
    setErrorMsg("");
  };

  const fieldLabelClass =
    "mb-1.5 block text-sm font-medium text-slate-600";

  const typeChipClass = (active: boolean) =>
    [
      "rounded-full border px-3 py-1.5 text-sm transition-colors",
      active
        ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800"
        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700",
      isUploading ? "pointer-events-none opacity-50" : "cursor-pointer",
    ].join(" ");

  const renderFileList = (maxHeightClass: string) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-700">
          待上传文件
          <span className="ml-1.5 tabular-nums text-slate-400">
            ({files.length})
          </span>
        </h4>
        {files.length > 0 ? (
          <span className="text-xs tabular-nums text-slate-400">
            {formatSizeMb(totalSizeBytes)} MB
          </span>
        ) : null}
      </div>
      <div
        className={`min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 ${maxHeightClass}`}
      >
        {files.map((f) => {
          const { extension } = splitEditableFilename(f.filename);
          const isEditing = editingFileId === f.local_id;

          return (
            <div
              key={f.local_id}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3"
            >
              {f.status === "uploading" && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-emerald-100/70 transition-all duration-300"
                  style={{ width: `${f.progress}%` }}
                />
              )}
              {f.status === "success" && (
                <div className="pointer-events-none absolute inset-0 bg-emerald-50/50" />
              )}

              <div className="relative z-10 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <i className="uil uil-file-alt shrink-0 text-xl text-emerald-500" />
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingBaseName}
                        onChange={(e) => setEditingBaseName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEditedFileName(f.local_id, extension);
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelEditingFileName();
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                        maxLength={MAX_UPLOAD_FILENAME_LENGTH}
                      />
                      {extension ? (
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                          {extension}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      className="min-w-0 flex-1 truncate text-sm text-slate-800"
                      title={f.filename}
                    >
                      {f.filename}
                    </div>
                  )}
                  {!isEditing ? (
                    <div className="hidden shrink-0 text-xs tabular-nums text-slate-400 sm:block">
                      {formatSizeMb(f.file.size)} MB
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  {f.status === "uploading" && (
                    <span className="w-10 text-right text-xs font-medium tabular-nums text-emerald-700">
                      {f.progress}%
                    </span>
                  )}
                  {f.status === "success" && (
                    <i className="uil uil-check-circle text-lg text-emerald-500" />
                  )}
                  {f.status === "failed" && (
                    <i
                      className="uil uil-times-circle text-lg text-red-500"
                      title={f.error || ""}
                    />
                  )}
                  {f.status === "queued" && !isUploading && (
                    <>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEditedFileName(f.local_id, extension);
                            }}
                            className="text-emerald-500 transition-colors hover:text-emerald-600"
                            title="保存文件名"
                          >
                            <i className="uil uil-check text-lg" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingFileName();
                            }}
                            className="text-slate-400 transition-colors hover:text-slate-600"
                            title="取消编辑"
                          >
                            <i className="uil uil-times text-lg" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingFileName(f.local_id, f.filename);
                            }}
                            className="text-slate-400 transition-colors hover:text-emerald-600"
                            title="编辑文件名"
                          >
                            <i className="uil uil-edit text-lg" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(f.local_id);
                            }}
                            className="text-slate-400 transition-colors hover:text-red-500"
                            title="移除文件"
                          >
                            <i className="uil uil-trash-alt text-lg" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubmitBar = (stickyMobile: boolean) => (
    <div
      className={[
        "flex items-center justify-end gap-3 border-t border-slate-100 bg-white pt-3",
        stickyMobile
          ? "sticky bottom-0 z-20 -mx-4 mt-4 border-slate-200 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:mt-0 md:border-t-0 md:px-0 md:pb-0"
          : "mt-1",
      ].join(" ")}
    >
      {files.length > 0 ? (
        <span className="mr-auto text-sm tabular-nums text-slate-400">
          {formatSizeMb(totalSizeBytes)} MB / 300 MB
        </span>
      ) : (
        <span className="mr-auto text-xs text-slate-400 md:hidden">
          总大小不超过 300MB
        </span>
      )}
      <ActionSubmitButton
        onClick={startUpload}
        disabled={isUploading || files.length === 0}
        isSent={isUploading}
        defaultText="确认上传"
        sentText="上传中..."
      />
    </div>
  );

  return (
    <div
      className={
        isModal
          ? "mx-auto w-full px-4 py-3 sm:px-5 sm:py-4"
          : "mx-auto mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-8"
      }
    >
      {!isModal ? (
        <h2 className="mb-5 text-xl font-bold text-slate-900 sm:text-2xl">
          上传资源
        </h2>
      ) : null}

      {uploadedResourceId ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8 sm:py-10">
          <div className="text-6xl text-emerald-500">
            <i className="uil uil-check-circle" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900">上传成功</h3>
          <p className="text-center text-slate-500">
            资源已发布，可以前往详情页查看。
          </p>
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={`/resource/detail?id=${uploadedResourceId}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 sm:w-auto"
            >
              查看详情
            </Link>
            <button
              type="button"
              onClick={resetAfterSuccess}
              className="w-full rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              继续上传
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {errorMsg ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMsg}
            </div>
          ) : null}

          {/* 桌面：左(课程+标题) / 右(简介)；移动：单列 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr] md:items-stretch md:gap-5">
            <div className="flex min-w-0 flex-col gap-4">
              {/* ① 关联课程 */}
              <div ref={courseFieldRef} className="relative">
                <label className={fieldLabelClass}>
                  关联课程 <span className="text-red-500">*</span>
                </label>
                {selectedCourse ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
                    <i className="uil uil-book-open shrink-0 text-lg text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900">
                      {selectedCourse.name}
                    </span>
                    {!isUploading ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(null);
                          setCourseQuery("");
                          setCourseOptions([]);
                        }}
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        更换
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="relative">
                    <AdvancedInput
                      label={false}
                      type="text"
                      value={courseQuery}
                      maxLength={50}
                      onChange={(e) => setCourseQuery(e.target.value)}
                      placeholder="搜索课程名称"
                      disabled={isUploading}
                    />
                    {isSearchingCourse ? (
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="uil uil-spinner-alt animate-spin text-xl" />
                      </div>
                    ) : null}
                    {showCourseSuggestions ? (
                      <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                        {courseOptions.length > 0 ? (
                          courseOptions.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => {
                                setSelectedCourse(course);
                                setCourseOptions([]);
                                setCourseQuery("");
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              {course.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-sm text-slate-400">
                            未找到相关课程
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* ② 标题 */}
              <AdvancedInput
                label={
                  <>
                    资源标题 <span className="text-red-500">*</span>
                  </>
                }
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                placeholder="清晰概括资源内容"
              />
            </div>

            {/* ⑤ 简介：桌面占右栏；移动默认折叠 */}
            <div className="flex min-h-0 min-w-0 flex-col">
              {!descExpanded ? (
                <button
                  type="button"
                  onClick={() => setDescExpanded(true)}
                  className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600 md:hidden"
                >
                  <i className="uil uil-plus text-base" />
                  添加简介（可选）
                </button>
              ) : null}
              <div
                className={[
                  "flex min-h-0 flex-1 flex-col",
                  descExpanded ? "" : "hidden md:flex",
                ].join(" ")}
              >
                <AdvancedTextarea
                  label="简介（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  placeholder="分享点什么吧"
                  rows={4}
                  className="min-w-0 [&_.t-textarea]:w-full [&_.t-textarea__inner]:min-h-[7.5rem]"
                />
                {descExpanded ? (
                  <button
                    type="button"
                    onClick={() => setDescExpanded(false)}
                    className="mt-1 self-start text-xs text-slate-400 hover:text-slate-600 md:hidden"
                  >
                    收起简介
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* ③ 类型 chips：全宽 */}
          <div>
            <div className={fieldLabelClass}>
              类型 <span className="text-red-500">*</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_CATEGORY_OPTIONS.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  disabled={isUploading}
                  onClick={() => setResourceType(rt.value as ResourceType)}
                  className={typeChipClass(resourceType === rt.value)}
                >
                  {getResourceCategoryLabel(rt.value)}
                </button>
              ))}
            </div>
          </div>

          {/* ④ 文件 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleChange}
            />

            {/* Mobile: primary add-file button + list below */}
            <div className="space-y-3 md:hidden">
              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 ${
                  isUploading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <i className="uil uil-cloud-upload text-lg" />
                {files.length > 0 ? "继续添加文件" : "添加文件"}
                <span className="text-red-500">*</span>
              </button>
              <p className="text-center text-xs text-slate-400">
                支持多文件，总大小不超过 300MB
              </p>
              {files.length > 0 ? renderFileList("max-h-52") : null}
            </div>

            {/* Desktop: dropzone + optional side list */}
            <div
              className={
                files.length > 0
                  ? "hidden gap-5 md:grid md:grid-cols-2"
                  : "hidden md:block"
              }
            >
              <div className="flex min-h-[12rem] flex-col">
                <div className={fieldLabelClass}>
                  上传文件 <span className="text-red-500">*</span>
                </div>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() =>
                    !isUploading && fileInputRef.current?.click()
                  }
                  className={[
                    "flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8",
                    dragActive
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/60",
                    isUploading
                      ? "pointer-events-none cursor-not-allowed opacity-50"
                      : "",
                  ].join(" ")}
                >
                  <div className="mb-2 text-4xl text-emerald-500">
                    <i className="uil uil-cloud-upload" />
                  </div>
                  <p className="font-medium text-slate-800">
                    点击或拖拽文件到这里
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    支持多文件，任意格式
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    总大小不超过 300MB
                  </p>
                </div>
              </div>

              {files.length > 0 ? (
                <div className="flex min-h-[12rem] flex-col">
                  {renderFileList("max-h-64 md:max-h-none")}
                </div>
              ) : null}
            </div>
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>上传进度</span>
                <span className="tabular-nums text-emerald-700">
                  {totalProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          {renderSubmitBar(true)}
        </div>
      )}
    </div>
  );
}
