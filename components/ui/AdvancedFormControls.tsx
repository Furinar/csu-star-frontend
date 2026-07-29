"use client";

/**
 * Presentational form controls for floating overlays.
 * Built on TDesign Input / Select / Textarea while preserving the legacy
 * label + synthetic-change-event API used across floating forms.
 */
import React, { useMemo } from "react";
import { Input, Select, Textarea } from "tdesign-react";
import type { InputValue } from "tdesign-react";
import {
  createSyntheticChangeEvent,
  normalizeTDesignFieldValue,
  toTDesignSelectOptions,
} from "@/lib/tdesignFormBridge";

function emitChange<T extends HTMLElement>(
  onChange: ((event: React.ChangeEvent<T>) => void) | undefined,
  value: unknown,
) {
  if (!onChange) return;
  const next = normalizeTDesignFieldValue(value);
  onChange(
    createSyntheticChangeEvent(next) as unknown as React.ChangeEvent<T>,
  );
}

function FieldLabel({ label }: { label: React.ReactNode }) {
  if (label == null || label === false) return null;
  return <div className="td-form-field__label mb-1.5 text-sm text-slate-600">{label}</div>;
}

function FieldShell({
  label,
  className,
  children,
}: {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={["td-form-field", className].filter(Boolean).join(" ")}>
      <FieldLabel label={label} />
      {children}
    </div>
  );
}

function extractSelectOptions(
  children: React.ReactNode,
): Array<{ label: string; value: string }> {
  const raw: Array<{ value?: string | number | null; label?: string | null }> =
    [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as {
      value?: string | number;
      children?: React.ReactNode;
      disabled?: boolean;
    };
    // Support native <option> and fragments of options.
    if (
      child.type === "option" ||
      (child.type as { displayName?: string })?.displayName === "option"
    ) {
      raw.push({
        value: props.value,
        label: extractText(props.children),
      });
      return;
    }
    if (child.type === React.Fragment) {
      raw.push(
        ...extractSelectOptions(props.children).map((item) => ({
          value: item.value,
          label: item.label,
        })),
      );
    }
  });

  return toTDesignSelectOptions(raw);
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "size" | "prefix" | "suffix"
> {
  label: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const AdvancedInput: React.FC<InputProps> = ({
  label,
  className,
  value,
  onChange,
  type,
  disabled,
  readOnly,
  placeholder,
  maxLength,
  min,
  max,
  autoComplete,
  inputMode,
  minLength,
  name,
  id,
  required,
  ...rest
}) => {
  const stringValue = value == null ? "" : String(value);
  // Native-only attrs retained for call-site compatibility.
  void rest;
  void inputMode;
  void minLength;
  void name;
  void id;
  void required;
  void min;
  void max;

  return (
    <FieldShell label={label} className={className}>
      <Input
        value={stringValue}
        type={(type as "text" | "number" | "password" | "url" | "tel" | "search") || "text"}
        disabled={disabled || readOnly}
        readonly={readOnly}
        placeholder={placeholder}
        maxlength={maxLength}
        autocomplete={autoComplete}
        onChange={(next: InputValue) => emitChange(onChange, String(next ?? ""))}
        clearable={!readOnly && !disabled}
        className="td-form-field__control w-full"
      />
    </FieldShell>
  );
};

interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "size"
> {
  label: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

export const AdvancedSelect: React.FC<SelectProps> = ({
  label,
  className,
  value,
  children,
  onChange,
  disabled,
  name,
  id,
  required,
  ...rest
}) => {
  void required;
  void rest;
  void name;
  void id;
  const options = useMemo(() => extractSelectOptions(children), [children]);
  const stringValue = value == null ? "" : String(value);

  return (
    <FieldShell label={label} className={className}>
      <Select
        value={stringValue}
        options={options}
        disabled={disabled}
        onChange={(next) => emitChange(onChange, next == null ? "" : String(next))}
        className="td-form-field__control w-full"
        popupProps={{ overlayClassName: "td-form-field__select-popup" }}
        clearable={false}
        filterable={options.length > 8}
        placeholder="请选择"
        keys={{ label: "label", value: "value" }}
      />
    </FieldShell>
  );
};

interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "size"
> {
  label: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

export const AdvancedTextarea: React.FC<TextareaProps> = ({
  label,
  className,
  value,
  onChange,
  rows = 4,
  disabled,
  readOnly,
  placeholder,
  maxLength,
  name,
  id,
  required,
  ...rest
}) => {
  void required;
  void rest;
  void name;
  void id;
  const stringValue = value == null ? "" : String(value);
  const minRows = typeof rows === "number" ? rows : 4;

  return (
    <FieldShell label={label} className={className}>
      <Textarea
        value={stringValue}
        disabled={disabled || readOnly}
        readonly={readOnly}
        placeholder={placeholder}
        maxlength={maxLength}
        onChange={(next) => emitChange(onChange, String(next ?? ""))}
        autosize={{ minRows, maxRows: Math.max(minRows + 4, 12) }}
        className="td-form-field__control w-full"
      />
    </FieldShell>
  );
};

interface UnderlineInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "size" | "prefix" | "suffix"
> {
  label: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/** Compact input used in dense toolbars (e.g. resource course bind). */
export const UnderlineInput: React.FC<UnderlineInputProps> = ({
  label,
  className,
  value,
  onChange,
  type,
  disabled,
  readOnly,
  placeholder,
  maxLength,
  autoComplete,
  name,
  id,
  ...rest
}) => {
  void rest;
  void name;
  void id;
  const stringValue = value == null ? "" : String(value);
  const placeholderText =
    placeholder ||
    (typeof label === "string" ? label : extractText(label)) ||
    undefined;

  return (
    <div className={["td-form-field td-form-field--underline", className].filter(Boolean).join(" ")}>
      <Input
        value={stringValue}
        type={(type as "text" | "number" | "password" | "search") || "text"}
        disabled={disabled || readOnly}
        readonly={readOnly}
        placeholder={placeholderText}
        maxlength={maxLength}
        autocomplete={autoComplete}
        borderless
        clearable={!readOnly && !disabled}
        onChange={(next: InputValue) => emitChange(onChange, String(next ?? ""))}
        className="td-form-field__control td-form-field__control--underline w-full"
      />
    </div>
  );
};
