"use client";

import { useEffect, useRef, useState } from "react";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import {
  getGlobalEvaluationCopy,
  loadRelatedItemsForEvaluation,
  searchGlobalEvaluationOptions,
  submitGlobalEvaluation,
  type GlobalEvaluationEntity,
  type GlobalEvaluationOption,
} from "@/components/detail/globalEvaluationConfig";
import { AdvancedInput } from "@/components/ui/AdvancedFormControls";
import { useDebounce } from "@/hooks/useDebounce";
import type { EntityId } from "@/types/entity";
import { feedback } from "@/store/useFeedbackStore";

export interface GlobalEvaluationModalProps {
  entity: GlobalEvaluationEntity;
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalEvaluationModal({
  entity,
  isOpen,
  onClose,
}: GlobalEvaluationModalProps) {
  const copy = getGlobalEvaluationCopy(entity);
  const [formVersion, setFormVersion] = useState(0);
  const [selected, setSelected] = useState<GlobalEvaluationOption | null>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<GlobalEvaluationOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [relatedItems, setRelatedItems] = useState<
    Array<{ id: EntityId; name: string }>
  >([]);
  const debouncedQuery = useDebounce(query, 300);
  const searchFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      const timer = setTimeout(() => {
        setOptions([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isActive = true;
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchGlobalEvaluationOptions(entity, debouncedQuery)
        .then((res) => {
          if (isActive) setOptions(res);
        })
        .catch((error) => {
          console.error(error);
          if (isActive) setOptions([]);
        })
        .finally(() => {
          if (isActive) setIsSearching(false);
        });
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [debouncedQuery, entity]);

  useEffect(() => {
    if (!selected) return;

    let isActive = true;
    loadRelatedItemsForEvaluation(entity, selected.id)
      .then((items) => {
        if (!isActive) return;
        setRelatedItems(items);
      })
      .catch((error) => {
        console.error(error);
        if (!isActive) return;
        setRelatedItems([]);
      });

    return () => {
      isActive = false;
    };
  }, [entity, selected]);

  // Dismiss absolute results when clicking outside the search field.
  useEffect(() => {
    if (selected || (!options.length && !isSearching)) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!searchFieldRef.current?.contains(event.target as Node)) {
        setOptions([]);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isSearching, options.length, selected]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (!selected) return;
    try {
      await submitGlobalEvaluation(entity, selected.id, payload);
      feedback.success("评价提交成功！");
      setFormVersion((prev) => prev + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "提交失败";
      feedback.error(msg);
    }
  };

  const handleClose = () => {
    setSelected(null);
    setRelatedItems([]);
    setQuery("");
    setOptions([]);
    onClose();
  };

  const clearSelection = () => {
    setSelected(null);
    setRelatedItems([]);
    setQuery("");
    setOptions([]);
  };

  const showResultsPanel = !selected && query.trim().length > 0;

  return (
    <DetailComposerModal
      isOpen={isOpen}
      onClose={handleClose}
      accent={copy.accent}
      badge={copy.badge}
      title={selected ? copy.selectedTitle(selected.name) : copy.emptyTitle}
      description={
        selected ? copy.selectedDescription : copy.emptyDescription
      }
    >
      {!selected ? (
        <div className="mx-auto w-full max-w-2xl px-1 sm:px-2">
          {/*
            Results use absolute positioning so the floating shell does not
            resize/jump when suggestions appear (previous in-flow mt-4 list).
          */}
          <div ref={searchFieldRef} className="relative">
            <AdvancedInput
              label={false}
              value={query}
              maxLength={50}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
            />
            {isSearching ? (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="uil uil-spinner-alt animate-spin text-xl" />
              </div>
            ) : null}

            {showResultsPanel ? (
              <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {isSearching && options.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-400">
                    搜索中...
                  </div>
                ) : options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelected(option);
                        setOptions([]);
                        setQuery("");
                        setRelatedItems([]);
                      }}
                      className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-none hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800">
                          {option.name}
                        </div>
                        {option.subtitle ? (
                          <div className="mt-0.5 text-xs text-slate-400">
                            {option.subtitle}
                          </div>
                        ) : null}
                      </div>
                      <span className="mt-0.5 shrink-0 text-xs font-medium text-[var(--first-color)] opacity-80">
                        选择
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-sm text-slate-400">
                    {copy.emptyResultText}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          {/* Spacer so absolute dropdown has room without growing the shell unpredictably */}
          <div className="h-2" aria-hidden />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:px-4">
            <i
              className={`uil shrink-0 text-lg ${
                entity === "course"
                  ? "uil-book-open text-sky-600"
                  : "uil-user text-rose-500"
              }`}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
              {selected.name}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
            >
              {copy.reselectLabel}
            </button>
          </div>
          <EvaluationComposerForm
            key={`${entity}-global-form-${formVersion}-${selected.id}`}
            evaluationType={copy.evaluationType}
            relatedItems={relatedItems}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </DetailComposerModal>
  );
}
