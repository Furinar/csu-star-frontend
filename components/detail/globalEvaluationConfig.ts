import {
  createCourseEvaluation,
  createTeacherEvaluation,
  getCourseDetail,
  getTeacherDetail,
} from "@/api/detail";
import {
  searchCourseSuggestions,
  searchTeacherSuggestions,
} from "@/api/resource";
import type {
  CourseEvaluationInput,
  TeacherEvaluationInput,
} from "@/types/detail";
import type { EntityId } from "@/types/entity";
import type {
  CourseSuggestionItem,
  TeacherSuggestionItem,
} from "@/types/resource";
import type { GlobalEvaluationEntity } from "@/lib/globalEvaluationCopy";

export type { GlobalEvaluationEntity } from "@/lib/globalEvaluationCopy";
export { getGlobalEvaluationCopy, RATING_MODULE_ROLES } from "@/lib/globalEvaluationCopy";

export type GlobalEvaluationOption = {
  id: EntityId;
  name: string;
  subtitle?: string;
};

export async function searchGlobalEvaluationOptions(
  entity: GlobalEvaluationEntity,
  query: string,
): Promise<GlobalEvaluationOption[]> {
  if (entity === "course") {
    const rows = await searchCourseSuggestions(query);
    return rows.map((item: CourseSuggestionItem) => ({
      id: item.id,
      name: item.name,
      subtitle: item.course_type || undefined,
    }));
  }

  const rows = await searchTeacherSuggestions(query);
  return rows.map((item: TeacherSuggestionItem) => ({
    id: item.id,
    name: item.name,
    subtitle: item.department || undefined,
  }));
}

export async function loadRelatedItemsForEvaluation(
  entity: GlobalEvaluationEntity,
  selectedId: EntityId,
): Promise<Array<{ id: EntityId; name: string }>> {
  if (entity === "course") {
    const detail = await getCourseDetail(selectedId);
    return (detail.teachers || []).map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
    }));
  }

  const detail = await getTeacherDetail(selectedId);
  return (detail.courses || []).map((course) => ({
    id: course.id,
    name: course.name,
  }));
}

export async function submitGlobalEvaluation(
  entity: GlobalEvaluationEntity,
  selectedId: EntityId,
  payload: Record<string, unknown>,
): Promise<void> {
  if (entity === "course") {
    await createCourseEvaluation(
      selectedId,
      payload as unknown as CourseEvaluationInput,
    );
    return;
  }

  await createTeacherEvaluation(
    selectedId,
    payload as unknown as TeacherEvaluationInput,
  );
}

