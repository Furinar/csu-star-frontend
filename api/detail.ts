import {service} from "@/lib/request";
import type {
  CourseDetail,
  CourseEvaluation,
  CourseEvaluationInput,
  CourseResourceCollection,
  EvaluationReply,
  EvaluationReplyInput,
  PaginatedData,
  ResourceComment,
  ResourceCommentInput,
  ResourceDetail,
  TeacherDetail,
  TeacherEvaluation,
  TeacherEvaluationInput,
} from "@/types/detail";

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
    typeof value === "object" && value !== null;

const unwrapResponseData = (payload: unknown): unknown => {
  if (!isRecord(payload)) return undefined;

  const firstLevel = payload.data;
  if (isRecord(firstLevel) && typeof firstLevel.code === "number" && "data" in firstLevel) {
    return firstLevel.data;
  }

  return firstLevel;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toStringSafe = (value: unknown): string | null =>
    typeof value === "string" ? value : null;

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  return null;
};

const normalizePaginated = <T>(
    raw: unknown,
    normalizeItems: (items: unknown[]) => T[],
): PaginatedData<T> => {
  if (!isRecord(raw)) {
    return {total: 0, items: []};
  }

  const items = Array.isArray(raw.items) ? raw.items : [];

  return {
    total: toNumber(raw.total) ?? items.length,
    items: normalizeItems(items),
    page: toNumber(raw.page) ?? undefined,
    size: toNumber(raw.size) ?? undefined,
  };
};

const normalizeUserBrief = (raw: unknown) => {
  if (!isRecord(raw)) return null;

  return {
    id: toStringSafe(raw.id) ?? "",
    nickname: toStringSafe(raw.nickname) ?? "匿名用户",
    avatar_url: toStringSafe(raw.avatar_url),
    role: toStringSafe(raw.role),
  };
};

const normalizeTeacherBriefs = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        name: toStringSafe(item.name) ?? "未命名教师",
        title: toStringSafe(item.title),
        avatar_url: toStringSafe(item.avatar_url),
      },
    ];
  });
};

const normalizeCourseBriefs = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        name: toStringSafe(item.name) ?? "未命名课程",
      },
    ];
  });
};

const normalizeResourceBriefs = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        title: toStringSafe(item.title) ?? "未命名资料",
        resource_type: toStringSafe(item.resource_type),
        downloads: toNumber(item.downloads),
        likes: toNumber(item.likes),
        created_at: toStringSafe(item.created_at),
      },
    ];
  });
};

const normalizeEvaluationReplies = (raw: unknown): EvaluationReply[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        evaluation_id: toNumber(item.evaluation_id) ?? 0,
        user: normalizeUserBrief(item.user) ?? {
          id: "",
          nickname: "匿名用户",
          avatar_url: null,
          role: null,
        },
        content: toStringSafe(item.content) ?? "",
        reply_to_user: normalizeUserBrief(item.reply_to_user),
        reply_to_reply_id: toNumber(item.reply_to_reply_id),
        created_at: toStringSafe(item.created_at) ?? "",
      },
    ];
  });
};

const normalizeTeacherEvaluations = (raw: unknown): TeacherEvaluation[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        teacher_id: toNumber(item.teacher_id) ?? 0,
        course_id: toNumber(item.course_id),
        course_name: toStringSafe(item.course_name),
        user: normalizeUserBrief(item.user),
        rating_quality: toNumber(item.rating_quality),
        rating_grading: toNumber(item.rating_grading),
        rating_attendance: toNumber(item.rating_attendance),
        avg_rating: toNumber(item.avg_rating),
        comment: toStringSafe(item.comment),
        is_anonymous: toBoolean(item.is_anonymous) ?? false,
        likes: toNumber(item.likes),
        is_liked: toBoolean(item.is_liked),
        created_at: toStringSafe(item.created_at) ?? "",
        reply_count: toNumber(item.reply_count),
        replies: normalizeEvaluationReplies(item.replies),
      },
    ];
  });
};

const normalizeCourseEvaluations = (raw: unknown): CourseEvaluation[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        course_id: toNumber(item.course_id) ?? 0,
        teacher_id: toNumber(item.teacher_id),
        teacher_name: toStringSafe(item.teacher_name),
        user: normalizeUserBrief(item.user),
        rating_homework: toNumber(item.rating_homework),
        rating_gain: toNumber(item.rating_gain),
        rating_exam_difficulty: toNumber(item.rating_exam_difficulty),
        avg_rating: toNumber(item.avg_rating),
        comment: toStringSafe(item.comment),
        is_anonymous: toBoolean(item.is_anonymous) ?? false,
        likes: toNumber(item.likes),
        is_liked: toBoolean(item.is_liked),
        created_at: toStringSafe(item.created_at) ?? "",
        reply_count: toNumber(item.reply_count),
        replies: normalizeEvaluationReplies(item.replies),
      },
    ];
  });
};

const normalizeResourceComments = (raw: unknown): ResourceComment[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        user: normalizeUserBrief(item.user),
        resource_id: toNumber(item.resource_id) ?? 0,
        parent_id: toNumber(item.parent_id),
        reply_to_user: normalizeUserBrief(item.reply_to_user),
        reply_to_comment_id: toNumber(item.reply_to_comment_id),
        content: toStringSafe(item.content) ?? "",
        likes: toNumber(item.likes),
        is_liked: toBoolean(item.is_liked),
        children: normalizeResourceComments(item.children),
        depth: toNumber(item.depth),
        created_at: toStringSafe(item.created_at) ?? "",
      },
    ];
  });
};

const normalizeTeacherDetail = (raw: unknown): TeacherDetail => {
  const data = isRecord(raw) ? raw : {};

  return {
    id: toNumber(data.id) ?? 0,
    name: toStringSafe(data.name) ?? "未命名教师",
    title: toStringSafe(data.title),
    department_id: toNumber(data.department_id),
    department_name: toStringSafe(data.department_name),
    avatar_url: toStringSafe(data.avatar_url),
    bio: toStringSafe(data.bio),
    avg_score: toNumber(data.avg_score),
    avg_quality: toNumber(data.avg_quality),
    avg_grading: toNumber(data.avg_grading),
    avg_attendance: toNumber(data.avg_attendance),
    good_rate: toNumber(data.good_rate),
    eval_count: toNumber(data.eval_count) ?? toNumber(data.evaluation_count),
    resource_count: toNumber(data.resource_count),
    hot_score: toNumber(data.hot_score),
    courses: normalizeCourseBriefs(data.courses),
    latest_evaluations: normalizeTeacherEvaluations(data.latest_evaluations),
  };
};

const normalizeCourseDetail = (raw: unknown): CourseDetail => {
  const data = isRecord(raw) ? raw : {};

  return {
    id: toNumber(data.id) ?? 0,
    name: toStringSafe(data.name) ?? "未命名课程",
    course_type: toStringSafe(data.course_type) as CourseDetail["course_type"],
    avg_score: toNumber(data.avg_score),
    avg_homework: toNumber(data.avg_homework),
    avg_gain: toNumber(data.avg_gain),
    avg_exam_diff: toNumber(data.avg_exam_diff),
    eval_count: toNumber(data.eval_count) ?? toNumber(data.evaluation_count),
    resource_count: toNumber(data.resource_count),
    hot_score: toNumber(data.hot_score),
    download_total: toNumber(data.download_total),
    teachers: normalizeTeacherBriefs(data.teachers),
    resources_preview: normalizeResourceBriefs(data.resources_preview),
    latest_evaluations: normalizeCourseEvaluations(data.latest_evaluations),
  };
};

const normalizeResourceCollection = (raw: unknown): CourseResourceCollection => {
  const data = isRecord(raw) ? raw : {};
  const course = isRecord(data.course) ? data.course : {};

  return {
    course: {
      id: toNumber(course.id) ?? 0,
      name: toStringSafe(course.name) ?? "未命名课程",
    },
    resource_count: toNumber(data.resource_count) ?? 0,
    download_total: toNumber(data.download_total),
    like_total: toNumber(data.like_total),
    hot_score: toNumber(data.hot_score),
    evaluation_anchor: toStringSafe(data.evaluation_anchor),
    items: normalizePaginated(data.items, normalizeResourceBriefs),
  };
};

const normalizeResourceDetail = (raw: unknown): ResourceDetail => {
  const data = isRecord(raw) ? raw : {};
  const course = isRecord(data.course) ? data.course : null;
  const files = Array.isArray(data.files) ? data.files : [];

  return {
    id: toNumber(data.id) ?? 0,
    title: toStringSafe(data.title) ?? "未命名资料",
    course_id: toNumber(data.course_id) ?? 0,
    course: course
        ? {
          id: toNumber(course.id) ?? 0,
          name: toStringSafe(course.name) ?? "未命名课程",
        }
        : null,
    resource_type: toStringSafe(data.resource_type),
    size_bytes: toNumber(data.size_bytes),
    downloads: toNumber(data.downloads),
    views: toNumber(data.views),
    likes: toNumber(data.likes),
    hot_score: toNumber(data.hot_score),
    created_at: toStringSafe(data.created_at),
    description: toStringSafe(data.description),
    tags: Array.isArray(data.tags) ? data.tags.filter((item): item is string => typeof item === "string") : [],
    files: files.flatMap((item) => {
      if (!isRecord(item)) return [];

      return [
        {
          id: toStringSafe(item.id) ?? "",
          filename: toStringSafe(item.filename) ?? "未命名文件",
          mime: toStringSafe(item.mime),
          size_bytes: toNumber(item.size_bytes) ?? 0,
          sort_order: toNumber(item.sort_order),
        },
      ];
    }),
    course_resource_collection_path: toStringSafe(data.course_resource_collection_path),
    course_evaluation_anchor: toStringSafe(data.course_evaluation_anchor),
    is_favorited: toBoolean(data.is_favorited),
  };
};

export async function getTeacherDetail(id: number) {
  const response = await service.get<ApiEnvelope<unknown>>(`/teachers/${id}`);
  return normalizeTeacherDetail(unwrapResponseData(response));
}

export async function getCourseDetail(id: number) {
  const response = await service.get<ApiEnvelope<unknown>>(`/courses/${id}`);
  return normalizeCourseDetail(unwrapResponseData(response));
}

export async function getCourseResourceCollection(id: number, page = 1, size = 20) {
  const response = await service.get<ApiEnvelope<unknown>>(`/course-resource-collections/${id}`, {
    params: {page, size},
  });

  return normalizeResourceCollection(unwrapResponseData(response));
}

export async function getResourceDetail(id: number) {
  const response = await service.get<ApiEnvelope<unknown>>(`/resources/${id}`);
  return normalizeResourceDetail(unwrapResponseData(response));
}

export async function listTeacherEvaluations(teacherId: number, page = 1, size = 20) {
  const response = await service.get<ApiEnvelope<unknown>>(`/teachers/${teacherId}/evaluations`, {
    params: {page, size, sort: "created_at"},
  });

  const raw = unwrapResponseData(response);
  return normalizePaginated(raw, normalizeTeacherEvaluations);
}

export async function listCourseEvaluations(courseId: number, page = 1, size = 20) {
  const response = await service.get<ApiEnvelope<unknown>>(`/courses/${courseId}/evaluations`, {
    params: {page, size, sort: "created_at"},
  });

  const raw = unwrapResponseData(response);
  return normalizePaginated(raw, normalizeCourseEvaluations);
}

export async function createTeacherEvaluationReply(
    evaluationId: number,
    payload: EvaluationReplyInput,
) {
  const response = await service.post<ApiEnvelope<unknown>>(
      `/teachers/evaluations/${evaluationId}/replies`,
      payload,
  );

  return normalizeEvaluationReplies([unwrapResponseData(response)])[0];
}

export async function createCourseEvaluationReply(
    evaluationId: number,
    payload: EvaluationReplyInput,
) {
  const response = await service.post<ApiEnvelope<unknown>>(
      `/courses/evaluations/${evaluationId}/replies`,
      payload,
  );

  return normalizeEvaluationReplies([unwrapResponseData(response)])[0];
}

export async function createTeacherEvaluation(payload: TeacherEvaluationInput) {
  const response = await service.post<ApiEnvelope<unknown>>(
      "/teachers/evaluations",
      payload,
  );
  return normalizeTeacherEvaluations([unwrapResponseData(response)])[0];
}

export async function createCourseEvaluation(payload: CourseEvaluationInput) {
  const response = await service.post<ApiEnvelope<unknown>>(
      "/courses/evaluations",
      payload,
  );
  return normalizeCourseEvaluations([unwrapResponseData(response)])[0];
}

export async function listResourceComments(resourceId: number, page = 1, size = 20) {
  const response = await service.get<ApiEnvelope<unknown>>(`/resources/${resourceId}/comments`, {
    params: {page, size, sort: "created_at"},
  });

  const raw = unwrapResponseData(response);
  return normalizePaginated(raw, normalizeResourceComments);
}

export async function createResourceComment(resourceId: number, payload: ResourceCommentInput) {
  const response = await service.post<ApiEnvelope<unknown>>(
      `/resources/${resourceId}/comments`,
      payload,
  );
  return normalizeResourceComments([unwrapResponseData(response)])[0];
}

export async function createResourceCommentReply(commentId: number, payload: EvaluationReplyInput) {
  const response = await service.post<ApiEnvelope<unknown>>(
      `/resources/comments/${commentId}/replies`,
      payload,
  );
  return normalizeResourceComments([unwrapResponseData(response)])[0];
}

export async function addFavorite(target_type: string, target_id: number) {
  await service.post<ApiEnvelope<unknown>>("/favorites", {
    target_type,
    target_id,
  });
}

export async function removeFavorite(target_type: string, target_id: number) {
  await service.delete<ApiEnvelope<unknown>>("/favorites", {
    params: { target_type, target_id },
  });
}
