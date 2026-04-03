"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import {
  createResource,
  uploadResourceFileToCos,
  searchCourseSuggestions,
} from "@/api/resource";
import {
  ResourceType,
  CourseSuggestionItem,
  UploadFileItem,
} from "@/types/resource";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import {
  AdvancedInput,
  AdvancedSelect,
  AdvancedTextarea,
} from "./AdvancedFormControls";

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "ppt", label: "PPT" },
  { value: "pdf", label: "PDF" },
  { value: "notes", label: "课堂笔记" },
  { value: "exam", label: "考试资料" },
  { value: "lab", label: "实验/作业" },
  { value: "md", label: "Markdown文件" },
  { value: "txt", label: "文本" },
  { value: "other", label: "其他" },
];

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
    return "上传失败：COS 返回 403（可能是签名过期或 CORS 拒绝）。";
  }

  return error.message || "上传过程中出错，请重试";
}

export interface ResourceUploaderProps {
  isModal?: boolean;
  onClose?: () => void;
  initialCourse?: { id: number; name: string };
}

export default function ResourceUploader({
  isModal,
  onClose,
  initialCourse,
}: ResourceUploaderProps = {}) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("other");

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
  const [uploadedResourceId, setUploadedResourceId] = useState<number | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");

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
        progress: 0,
        status: "queued" as const,
      }));
      setFiles((prev) => {
        const next = [...prev, ...mapped];
        if (!title && prev.length === 0 && mapped.length > 0) {
          setTitle(mapped[0].file.name.replace(/\.[^/.]+$/, ""));
        }
        return next;
      });
    },
    [isUploading, uploadedResourceId, title],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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
    setFiles((prev) => prev.filter((f) => f.local_id !== local_id));
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

  const startUpload = async () => {
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

    setErrorMsg("");
    setIsUploading(true);
    setTotalProgress(0);

    // reset file progress
    setFiles((prev) =>
      prev.map((f) => ({ ...f, progress: 0, status: "uploading" })),
    );

    try {
      // 1. Create resource metadata
      const createInput = {
        title,
        description,
        course_id: selectedCourse.id,
        resource_type: resourceType,
        files: files.map((f) => ({
          filename: f.file.name,
          size_bytes: f.file.size,
          mime: f.file.type || undefined,
        })),
      };

      const { resource_id, upload_urls } = await createResource(createInput);

      // 2. Upload files tracking total bytes
      const totalBytes = files.reduce((acc, f) => acc + f.file.size, 0);
      const uploadedBytesPerFile: Record<string, number> = {};

      const uploadPromises = files.map(async (fileItem, index) => {
        const urlItem = upload_urls[index];
        if (!urlItem) {
          throw new Error(`未找到文件 ${fileItem.file.name} 的上传链接`);
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
                  updated[fileIndex] = { ...updated[fileIndex], progress };
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

      setTotalProgress(100);
      setUploadedResourceId(resource_id);
      setIsUploading(false);
    } catch (e: unknown) {
      console.error(e);
      setErrorMsg(getUploadErrorMessage(e));
      setIsUploading(false);
    }
  };

  return (
    <div
      className={
        isModal
          ? "w-full mx-auto"
          : "p-6 md:p-8 mt-6 max-w-4xl mx-auto rounded-xl border border-slate-200 bg-white shadow-sm"
      }
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">上传资源</h2>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="uil uil-times text-2xl" />
          </button>
        )}
      </div>

      {uploadedResourceId ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="text-star-500 text-6xl">
            <i className="uil uil-check-circle" />
          </div>
          <h3 className="text-2xl font-semibold text-black">上传成功！</h3>
          <p className="text-second">
            您的资源已成功保存，可以前往详情页查看。
          </p>
          <div className="flex gap-4 mt-6">
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
              className="px-6 py-2 bg-ice-100 text-black rounded-md hover:bg-ice-200 transition-colors"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 max-w-sm w-full">
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
                  {RESOURCE_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
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
                    <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-star-200 bg-star-50 text-star-900">
                      <span>{selectedCourse.name}</span>
                      {!isUploading && (
                        <button
                          onClick={() => setSelectedCourse(null)}
                          className="text-star-400 hover:text-star-600"
                        >
                          <i className="uil uil-times-circle text-xl" />
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
                      onChange={(e) => setCourseQuery(e.target.value)}
                      placeholder=""
                    />
                    {isSearchingCourse && (
                      <div className="text-xs text-second mt-1">搜索中...</div>
                    )}
                    {courseOptions.length > 0 && !isSearchingCourse && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-ice-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
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
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${dragActive ? "border-[#8b5cf6] bg-[#8b5cf6]/5" : "border-gray-300 hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5"}
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
              <div className="text-star-400 text-4xl mb-2">
                <i className="uil uil-cloud-upload" />
              </div>
              <p className="text-black font-medium">
                点击或将文件拖拽到这里上传
              </p>
              <p className="text-sm text-second mt-1">
                支持多文件上传，任何文件格式均可
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-black">
                待上传文件 ({files.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {files.map((f) => (
                  <div
                    key={f.local_id}
                    className="p-3 bg-white/60 border border-ice-100 rounded-xl relative overflow-hidden flex items-center justify-between"
                  >
                    {/* background progress */}
                    {f.status === "uploading" && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-star-100/50 transition-all duration-300 pointer-events-none"
                        style={{ width: `${f.progress}%` }}
                      />
                    )}
                    {f.status === "success" && (
                      <div className="absolute left-0 top-0 bottom-0 bg-green-100/40 w-full pointer-events-none" />
                    )}

                    <div className="flex items-center gap-3 relative z-10 w-full max-w-[85%]">
                      <i className="uil uil-file-alt text-xl text-star-400" />
                      <div className="truncate text-sm text-black flex-1">
                        {f.file.name}
                      </div>
                      <div className="text-xs text-second w-16 text-right shrink-0">
                        {(f.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 shrink-0">
                      {f.status === "uploading" && (
                        <span className="text-xs font-medium text-star-600 w-10 text-right">
                          {f.progress}%
                        </span>
                      )}
                      {f.status === "success" && (
                        <i className="uil uil-check-circle text-green-500 text-lg" />
                      )}
                      {f.status === "failed" && (
                        <i
                          className="uil uil-times-circle text-red-500 text-lg"
                          title={f.error || ""}
                        />
                      )}
                      {f.status === "queued" && !isUploading && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(f.local_id);
                          }}
                          className="text-ice-400 hover:text-red-500 transition-colors"
                        >
                          <i className="uil uil-trash-alt text-lg" />
                        </button>
                      )}
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
                  className="h-full bg-star-500 transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
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
