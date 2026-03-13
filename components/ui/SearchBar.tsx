"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBarProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  delay?: number;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceOnChange?: boolean;
  className?: string;
  wrapperClassName?: string;
  allowClear?: boolean;
}

export default function SearchBar({
  value: propValue,
  defaultValue = "",
  placeholder = "搜索",
  delay = 500,
  onSearch,
  onChange,
  debounceOnChange = true,
  className = "",
  wrapperClassName = "",
  allowClear = true,
  ...props
}: SearchBarProps) {
  const isControlled = propValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = isControlled ? propValue : internalValue;
  const debouncedValue = useDebounce(value, delay);

  const isInitialMount = useRef(true);

  // 防抖后的变更处理
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceOnChange && onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, debounceOnChange, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }

    // 如果不使用防抖，则直接触发onChange
    if (!debounceOnChange && onChange) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch?.(value);
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
    onSearch?.("");
  };

  return (
    <div
      className={`flex justify-center w-full z-10 transition-all duration-300 pointer-events-auto px-4 sm:px-0 ${wrapperClassName}`}
    >
      <div
        className={`relative flex items-center w-full max-w-full sm:max-w-md md:max-w-xl lg:max-w-2xl bg-[var(--container-color)] border border-[var(--border)] rounded-[24px] shadow-sm hover:shadow-md hover:border-[var(--first-color)] transition-all duration-300 mx-auto overflow-hidden group focus-within:ring-2 focus-within:ring-[var(--first-color-lighter)] focus-within:border-[var(--first-color)] ${className}`}
      >
        <div className="pl-4 pr-2 text-[var(--text-color-light)]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors group-focus-within:text-[var(--first-color)]"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 h-[42px] bg-transparent border-none outline-none text-[15px] text-[var(--text-color)] placeholder:text-[var(--card-foreground)]"
          {...props}
        />

        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-color-light)] hover:text-[var(--first-color)] hover:bg-[var(--first-color-lighter)] transition-colors mr-1 cursor-pointer outline-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSearch?.(value)}
          className="h-[42px] px-5 sm:px-6 bg-[var(--first-color)] hover:bg-[var(--first-color-alt)] text-white text-sm sm:text-base font-medium transition-colors cursor-pointer outline-none flex items-center justify-center shrink-0"
        >
          <span>搜索</span>
        </button>
      </div>
    </div>
  );
}
