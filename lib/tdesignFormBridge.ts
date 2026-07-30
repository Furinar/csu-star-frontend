/**
 * Pure bridges used by floating-form controls to talk to TDesign while keeping
 * the legacy synthetic ChangeEvent API. Exported so structural/unit tests can
 * drive the real shipped conversion path.
 */

export type SyntheticChangeEvent = {
  target: { value: string };
  currentTarget: { value: string };
};

/** Build a minimal change event shape expected by existing form handlers. */
export function createSyntheticChangeEvent(value: string): SyntheticChangeEvent {
  return {
    target: { value },
    currentTarget: { value },
  };
}

export type SelectOption = { label: string; value: string };

/**
 * Convert native <option> descriptors (value + label text) into TDesign Select options.
 * Callers that already parse React children pass plain descriptors here.
 */
export function toTDesignSelectOptions(
  items: Array<{ value?: string | number | null; label?: string | null }>,
): SelectOption[] {
  return items.map((item) => ({
    value: item.value == null ? "" : String(item.value),
    label: item.label == null ? "" : String(item.label),
  }));
}

/** Normalize a TDesign Input/Select/Textarea onChange value to a string. */
export function normalizeTDesignFieldValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => normalizeTDesignFieldValue(item)).join(",");
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    return normalizeTDesignFieldValue((value as { value: unknown }).value);
  }
  return String(value);
}
