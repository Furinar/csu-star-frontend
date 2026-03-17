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
  placeholder = "Search",
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
        className={`relative flex items-center w-full max-w-full sm:max-w-md md:max-w-xl lg:max-w-2xl bg-[var(--container-color)] rounded-[24px] transition-all duration-300 mx-auto overflow-hidden group focus-within:border-[var(--first-color)] ${className}`}
        style={{
          boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.2), -6px -6px 12px rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="pl-3 sm:pl-4 pr-2 text-[var(--text-color-light)] shrink-0">
          <svg
            width="18"
            height="18"
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
          className="flex-1 min-w-0 h-[42px] bg-transparent border-none outline-none text-[14px] sm:text-[15px] text-[var(--text-color)] placeholder:text-[var(--card-foreground)]"
          {...props}
        />

        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-color-light)] hover:text-[var(--first-color)] hover:bg-[var(--first-color-lighter)] transition-colors mr-1 cursor-pointer outline-none"
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
          className="h-[42px] w-[56px] sm:w-auto sm:px-6 bg-[var(--first-color)] hover:bg-[var(--first-color-alt)] text-white font-medium transition-colors cursor-pointer outline-none flex items-center justify-center shrink-0"
          style={{
            boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.5)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sm:hidden"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
}
