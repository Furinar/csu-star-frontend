"use client";

import GlobalEvaluationModal from "@/components/detail/GlobalEvaluationModal";

interface CourseGlobalEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Thin course-entity wrapper around the shared global evaluation modal. */
export default function CourseGlobalEvaluationModal({
  isOpen,
  onClose,
}: CourseGlobalEvaluationModalProps) {
  return (
    <GlobalEvaluationModal entity="course" isOpen={isOpen} onClose={onClose} />
  );
}
