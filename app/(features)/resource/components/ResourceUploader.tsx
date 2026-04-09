"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import {
  abortResourceUpload,
  createResource,
  finalizeResourceUpload,
  searchCourseSuggestions,
  uploadResourceFileToCos,
} from "@/api/resource";
import {CourseSuggestionItem, MAX_RESOURCE_UPLOAD_SIZE_BYTES, ResourceType, UploadFileItem,} from "@/types/resource";
import {getResourceCategoryLabel, RESOURCE_CATEGORY_OPTIONS,} from "@/lib/resourceCategory";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import {useAuthStore} from "@/store/useAuthStore";
import {feedback} from "@/store/useFeedbackStore";
import {requireVerifiedCampusAction} from "@/lib/requireVerifiedCampusAction";
import Link from "next/link";
import {useDebounce} from "@/hooks/useDebounce";
import {AdvancedInput, AdvancedSelect, AdvancedTextarea,} from "./AdvancedFormControls";
import type {EntityId} from "@/types/entity";
import { processDataTransferItems } from "./folderZipper";

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
    return "上传失败：COS 跨域（CORS）未放行当前来源或 PUT/OPTIONS 请求。请检查存储桶 CORS 配置。";
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
    return {baseName: filename, extension: ""};
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

export interface ResourceUploaderProps {
  isModal?: boolean;
  onClose?: () => void;
  initialCourse?: { id: EntityId; name: string };
  onUploadSuccess?: () => void;
}

export default function ResourceUploader({
                                           isModal,
                                           onClose,
                                           initialCourse,
                                           onUploadSuccess,
                                         }: ResourceUploaderProps = {}) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const user = useAuthStore((state) => state.user);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("general");

  // Course search state
  const [courseQuery, setCourseQuery] = useState("");
  const [courseOptions, setCourseOptions] = useState<CourseSuggestionItem[]>(
      [],
  );
  const [selectedCourse, setSelectedCourse] =
      useState<CourseSuggestionItem | null>(initialCourse || null);
  const [isSearchingCourse, setIsSearchingCourse] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
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
            const parsedFiles = await processDataTransferItems(e.dataTransfer.items);
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
            item.local_id === localId ? {...item, filename: nextFilename} : item,
        ),
    );
    setErrorMsg("");
    cancelEditingFileName();
  };

  const debouncedCourseQuery = useDebounce(courseQuery, 500);

  useEffect(() => {
    if (!debouncedCourseQuery.trim()) {
      // 避免在首次渲染时同步触发无意义的 setState
      const timer = setTimeout(() => {
        // 我们在这里不依赖外面闭包，以防过时闭包判断。直接不管它，直接清空：
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

  const startUpload = async () => {
    if (
        !requireVerifiedCampusAction({
          isSignedIn: Boolean(accessToken),
          user,
          router,
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
      const editingTarget = files.find((item) => item.local_id === editingFileId);
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
            item.local_id === editingFileId ? {...item, filename: nextFilename} : item,
        );
        setFiles(filesForUpload);
        cancelEditingFileName();
      }
    }

    const totalSize = filesForUpload.reduce((acc, file) => acc + file.file.size, 0);
    if (totalSize > MAX_RESOURCE_UPLOAD_SIZE_BYTES) {
      setErrorMsg("总资源上传总大小不能超过 300MB");
      return;
    }

    setErrorMsg("");
    setIsUploading(true);
    setTotalProgress(0);

    // reset file progress
    setFiles((prev) =>
        prev.map((f) => ({...f, progress: 0, status: "uploading"})),
    );

    let uploadSessionId = "";

    try {
      // 1. Create resource metadata
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

      const {upload_session_id, upload_urls} = await createResource(createInput);
      uploadSessionId = upload_session_id;

      // 2. Upload files tracking total bytes
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
              // Update single file progress
              setFiles((prev) => {
                const updated = [...prev];
                const fileIndex = updated.findIndex(
                    (f) => f.local_id === fileItem.local_id,
                );
                if (fileIndex !== -1) {
                  updated[fileIndex] = {...updated[fileIndex], progress};
                }
                return updated;
              });

              // Update total progress
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

          // Mark file as success
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
          throw e; // fail the Promise.all
        }
      });

      await Promise.all(uploadPromises);
      const {resource_id} = await finalizeResourceUpload(upload_session_id);

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

  return (
      <div
          className={
            isModal
                ? "mx-auto w-full"
                : "mx-auto mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-8"
          }
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black sm:text-2xl">上传资源</h2>
        </div>

        {uploadedResourceId ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 sm:py-10">
              <div className="text-emerald-500 text-6xl">
                <i className="uil uil-check-circle"/>
              </div>
              <h3 className="text-2xl font-semibold text-black">上传成功！</h3>
              <p className="text-center text-second">
                您的资源已成功保存，可以前往详情页查看。
              </p>
              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
                <Link href={`/resource/detail?id=${uploadedResourceId}`}>
                  <button className="hidden">查看详情</button>
                </Link>
                <button
                    onClick={() => {
                      setUploadedResourceId(null);
                      setFiles([]);
                      setTitle("");
                      setDescription("");
                      setSelectedCourse(null);
                      setCourseQuery("");
                      setTotalProgress(0);
                    }}
                    className="w-full rounded-md bg-ice-100 px-6 py-2 text-black transition-colors hover:bg-ice-200 sm:w-auto"
                >
                  继续上传
                </button>
              </div>
            </div>
        ) : (
            <div className="space-y-6">
              {errorMsg && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                    {errorMsg}
                  </div>
              )}

              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="w-full space-y-4 max-w-sm">
                  <div>
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
                        placeholder=""
                    />
                  </div>

                  <div>
                    <AdvancedSelect
                        label="类型"
                        value={resourceType}
                        onChange={(e) =>
                            setResourceType(e.target.value as ResourceType)
                        }
                        disabled={isUploading}
                    >
                      {RESOURCE_CATEGORY_OPTIONS.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {getResourceCategoryLabel(rt.value)}
                          </option>
                      ))}
                    </AdvancedSelect>
                  </div>

                  <div className="relative">
                    {selectedCourse ? (
                        <>
                          <label className="block text-sm font-medium text-black mb-1">
                            关联课程 <span className="text-red-500">*</span>
                          </label>
                          <div
                              className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                            <span className="min-w-0 flex-1 break-words">{selectedCourse.name}</span>
                            {!isUploading && (
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="shrink-0 text-emerald-400 hover:text-emerald-600"
                                >
                                  <i className="uil uil-times-circle text-xl"/>
                                </button>
                            )}
                          </div>
                        </>
                    ) : (
                        <div>
                          <AdvancedInput
                              label={
                                <>
                                  搜索课程名称...{" "}
                                  <span className="text-red-500">*</span>
                                </>
                              }
                              type="text"
                              value={courseQuery}
                              maxLength={50}
                              onChange={(e) => setCourseQuery(e.target.value)}
                              placeholder=""
                          />
                          {isSearchingCourse && (
                              <div className="text-xs text-second mt-1">搜索中...</div>
                          )}
                          {courseOptions.length > 0 && !isSearchingCourse && (
                              <div
                                  className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-ice-200 bg-white shadow-lg">
                                {courseOptions.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() => {
                                          setSelectedCourse(course);
                                          setCourseOptions([]);
                                          setCourseQuery("");
                                        }}
                                        className="px-4 py-2 hover:bg-ice-50 cursor-pointer text-sm"
                                    >
                                      {course.name}
                                    </div>
                                ))}
                              </div>
                          )}
                        </div>
                    )}
                  </div>
                </div>

                <div>
                  <AdvancedTextarea
                      label="资源简介 (可选)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isUploading}
                      placeholder=""
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  上传文件 <span className="text-red-500">*</span>
                </label>
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8
                ${dragActive ? "border-emerald-400 bg-emerald-50/80" : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/70"}
                ${isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
              `}
                >
                  <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleChange}
                  />
                  <div className="mb-2 text-4xl text-emerald-400">
                    <i className="uil uil-cloud-upload"/>
                  </div>
                  <p className="font-medium text-black">
                    点击或将文件拖拽到这里上传
                  </p>
                  <p className="mt-1 text-sm text-second">
                    支持多文件上传，任何文件格式均可
                  </p>
                  <p className="pt-5 text-sm text-second">
                    文件总大小需小于300MB
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-black">
                      待上传文件 ({files.length})
                    </h4>
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1 sm:pr-2">
                      {files.map((f) => (
                          <div
                              key={f.local_id}
                              className="relative overflow-hidden rounded-xl border border-ice-100 bg-white/60 p-3"
                          >
                            {/* background progress */}
                            {f.status === "uploading" && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-emerald-100/60 transition-all duration-300 pointer-events-none"
                                    style={{width: `${f.progress}%`}}
                                />
                            )}
                            {f.status === "success" && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-green-100/40 w-full pointer-events-none"/>
                            )}

                            <div
                                className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div
                                  className="flex min-w-0 items-start gap-3 sm:max-w-[calc(100%-8rem)] sm:items-center">
                                <i className="uil uil-file-alt mt-0.5 text-xl text-emerald-400 sm:mt-0"/>
                                {editingFileId === f.local_id ? (
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
                                              saveEditedFileName(
                                                  f.local_id,
                                                  splitEditableFilename(f.filename).extension,
                                              );
                                            }
                                            if (e.key === "Escape") {
                                              e.preventDefault();
                                              cancelEditingFileName();
                                            }
                                          }}
                                          className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-black outline-none transition focus:border-emerald-400"
                                          maxLength={MAX_UPLOAD_FILENAME_LENGTH}
                                      />
                                      {splitEditableFilename(f.filename).extension ? (
                                          <span
                                              className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                                {splitEditableFilename(f.filename).extension}
                              </span>
                                      ) : null}
                                    </div>
                                ) : (
                                    <div className="flex-1 truncate text-sm text-black" title={f.filename}>
                                      {f.filename}
                                    </div>
                                )}
                                <div className="shrink-0 text-xs text-second sm:w-16 sm:text-right">
                                  {(f.file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>

                              <div
                                  className="relative z-10 flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                                {f.status === "uploading" && (
                                    <span className="w-10 text-right text-xs font-medium text-emerald-700">
                            {f.progress}%
                          </span>
                                )}
                                {f.status === "success" && (
                                    <i className="uil uil-check-circle text-green-500 text-lg"/>
                                )}
                                {f.status === "failed" && (
                                    <i
                                        className="uil uil-times-circle text-red-500 text-lg"
                                        title={f.error || ""}
                                    />
                                )}
                                {f.status === "queued" && !isUploading && (
                                    <>
                                      {editingFileId === f.local_id ? (
                                          <>
                                            <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  saveEditedFileName(
                                                      f.local_id,
                                                      splitEditableFilename(f.filename).extension,
                                                  );
                                                }}
                                                className="text-emerald-500 transition-colors hover:text-emerald-600"
                                                title="保存文件名"
                                            >
                                              <i className="uil uil-check text-lg"/>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  cancelEditingFileName();
                                                }}
                                                className="text-slate-400 transition-colors hover:text-slate-600"
                                                title="取消编辑"
                                            >
                                              <i className="uil uil-times text-lg"/>
                                            </button>
                                          </>
                                      ) : (
                                          <>
                                            <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  startEditingFileName(f.local_id, f.filename);
                                                }}
                                                className="text-ice-400 transition-colors hover:text-emerald-500"
                                                title="编辑文件名"
                                            >
                                              <i className="uil uil-edit text-lg"/>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeFile(f.local_id);
                                                }}
                                                className="text-ice-400 transition-colors hover:text-red-500"
                                                title="移除文件"
                                            >
                                              <i className="uil uil-trash-alt text-lg"/>
                                            </button>
                                          </>
                                      )}
                                    </>
                                )}
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              {isUploading && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm font-medium text-black">
                      <span>整组总进度</span>
                      <span>{totalProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-ice-100 rounded-md overflow-hidden">
                      <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{width: `${totalProgress}%`}}
                      />
                    </div>
                  </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center pt-4 sm:justify-end sm:gap-4 gap-3">
                {files.length > 0 && (
                  <span className="text-sm font-medium text-slate-400">
                    {(files.reduce((a, b) => a + b.file.size, 0) / 1024 / 1024).toFixed(2)} MB / 300 MB
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
            </div>
        )}
      </div>
  );
}
