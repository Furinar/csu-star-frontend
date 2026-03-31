export const buildTeacherPath = (id: number) => `/teacher/detail?id=${id}`;

export const buildCoursePath = (id: number) => `/course/detail?id=${id}`;

export const buildResourceCollectionPath = (courseId: number) =>
  `/resource/course?courseId=${courseId}`;

export const buildResourcePath = (id: number) => `/resource/detail?id=${id}`;

export const buildCourseEvaluationAnchor = (courseId: number) =>
  `${buildCoursePath(courseId)}#evaluations`;

export const buildResourceCommentsAnchor = (resourceId: number) =>
  `${buildResourcePath(resourceId)}#comments`;

export const buildCourseEvaluationComposerPath = (courseId: number) =>
  `/course/evaluate?id=${courseId}`;

export const buildTeacherEvaluationComposerPath = (teacherId: number) =>
  `/teacher/evaluate?id=${teacherId}`;

export const buildResourceCommentComposerPath = (resourceId: number) =>
  `/resource/comment?id=${resourceId}`;
