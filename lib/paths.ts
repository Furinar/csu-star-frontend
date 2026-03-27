export const buildTeacherPath = (id: number) => `/teacher/detail?id=${id}`;

export const buildCoursePath = (id: number) => `/course/detail?id=${id}`;

export const buildResourceCollectionPath = (courseId: number) =>
  `/resource/course?courseId=${courseId}`;

export const buildResourcePath = (id: number) => `/resource/detail?id=${id}`;

export const buildCourseEvaluationAnchor = (courseId: number) =>
  `${buildCoursePath(courseId)}#evaluations`;
