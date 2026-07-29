import type { EntityId } from "@/types/entity";

export const buildTeacherPath = (id: EntityId) => `/teacher/detail?id=${id}`;

export const buildCoursePath = (id: EntityId) => `/course/detail?id=${id}`;

export const buildResourceCollectionPath = (courseId: EntityId) =>
  `/resource/course?courseId=${courseId}`;

export const buildResourcePath = (id: EntityId) => `/resource/detail?id=${id}`;

export const buildCourseEvaluationAnchor = (courseId: EntityId) =>
  `${buildCoursePath(courseId)}#evaluations`;

export const buildResourceCommentsAnchor = (resourceId: EntityId) =>
  `${buildResourcePath(resourceId)}#comments`;

export const buildCourseEvaluationComposerPath = (courseId: EntityId) =>
  `/course/evaluate?id=${courseId}`;

export const buildTeacherEvaluationComposerPath = (teacherId: EntityId) =>
  `/teacher/evaluate?id=${teacherId}`;

export const buildResourceCommentComposerPath = (resourceId: EntityId) =>
  `/resource/comment?id=${resourceId}`;

export const buildWikiDocPath = (section: string, slug: string) =>
  `/compass/doc?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(slug)}`;
