"use client";

import GlobalEvaluationModal from "@/components/detail/GlobalEvaluationModal";

interface TeacherGlobalEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Thin teacher-entity wrapper around the shared global evaluation modal. */
export default function TeacherGlobalEvaluationModal({
  isOpen,
  onClose,
}: TeacherGlobalEvaluationModalProps) {
  return (
    <GlobalEvaluationModal entity="teacher" isOpen={isOpen} onClose={onClose} />
  );
}
