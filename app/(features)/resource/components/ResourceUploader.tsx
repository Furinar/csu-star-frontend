"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import GlassCard from "@/components/ui/GlassCard";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

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

export default function ResourceUploader() {
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
    useState<CourseSuggestionItem | null>(null);
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
      const msg = e instanceof Error ? e.message : "上传过程中出错，请重试";
      setErrorMsg(msg);
      setIsUploading(false);
    }
  };

  return (
    <GlassCard className="p-8 mt-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-first mb-6">上传资源</h2>

      {uploadedResourceId ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="text-star-500 text-6xl">
            <i className="uil uil-check-circle" />
          </div>
          <h3 className="text-2xl font-semibold text-first">上传成功！</h3>
          <p className="text-second">
            您的资源已成功保存，可以前往详情页查看。
          </p>
          <div className="flex gap-4 mt-6">
            <Link href={`/resource/detail?id=${uploadedResourceId}`}>
              <button className="px-6 py-2 bg-star-500 text-white rounded-full hover:bg-star-600 transition-colors shadow-lg">
                查看详情
              </button>
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
              className="px-6 py-2 bg-ice-100 text-first rounded-full hover:bg-ice-200 transition-colors"
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-first mb-1">
                  资源标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-2 rounded-xl border border-ice-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-star-300"
                  placeholder="请输入资源标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-first mb-1">
                  类型
                </label>
                <select
                  value={resourceType}
                  onChange={(e) =>
                    setResourceType(e.target.value as ResourceType)
                  }
                  disabled={isUploading}
                  className="w-full px-4 py-2 rounded-xl border border-ice-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-star-300"
                >
                  {RESOURCE_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-first mb-1">
                  关联课程 <span className="text-red-500">*</span>
                </label>
                {selectedCourse ? (
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
                ) : (
                  <div>
                    <input
                      type="text"
                      value={courseQuery}
                      onChange={(e) => setCourseQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-ice-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-star-300"
                      placeholder="搜索课程名称..."
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
              <label className="block text-sm font-medium text-first mb-1">
                资源简介 (可选)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-2 rounded-xl border border-ice-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-star-300 h-[204px] resize-none"
                placeholder="简单介绍一下这份资料..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-first mb-2">
              上传文件 <span className="text-red-500">*</span>
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
                ${dragActive ? "border-star-400 bg-star-50/50" : "border-ice-200 hover:border-star-300 hover:bg-ice-50/50"}
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
              <p className="text-first font-medium">
                点击或将文件拖拽到这里上传
              </p>
              <p className="text-sm text-second mt-1">
                支持多文件上传，任何文件格式均可
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-first">
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
                      <div className="truncate text-sm text-first flex-1">
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
              <div className="flex justify-between text-sm font-medium text-first">
                <span>整组总进度</span>
                <span>{totalProgress}%</span>
              </div>
              <div className="h-2 w-full bg-ice-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-star-500 transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={startUpload}
              disabled={isUploading || files.length === 0}
              className={`px-8 py-3 rounded-full font-medium transition-all shadow-md flex items-center gap-2
                 ${isUploading || files.length === 0 ? "bg-ice-200 text-ice-500 cursor-not-allowed" : "bg-first text-white hover:bg-star-600 hover:shadow-lg"}
               `}
            >
              {isUploading ? (
                <>
                  <i className="uil uil-spinner-alt animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <i className="uil uil-cloud-upload" />
                  确认上传
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
