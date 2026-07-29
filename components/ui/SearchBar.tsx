"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBarProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "size"
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
  /** compact：更矮的字号与高度，适合页头内嵌 */
  size?: "default" | "compact";
}

const SEARCH_HISTORY_KEY = "csu_star_search_history";
const SEARCH_HISTORY_EVENT = "csu-star-search-history-change";
const EMPTY_HISTORY: string[] = [];

let cachedHistoryRaw: string | null | undefined;
let cachedHistorySnapshot: string[] = EMPTY_HISTORY;

const readSearchHistory = () => {
  if (typeof window === "undefined") {
    return EMPTY_HISTORY;
  }

  const saved = window.localStorage.getItem(SEARCH_HISTORY_KEY);
  if (saved === cachedHistoryRaw) {
    return cachedHistorySnapshot;
  }

  cachedHistoryRaw = saved;

  if (!saved) {
    cachedHistorySnapshot = EMPTY_HISTORY;
    return cachedHistorySnapshot;
  }

  try {
    const parsed = JSON.parse(saved);
    cachedHistorySnapshot = Array.isArray(parsed) ? parsed : EMPTY_HISTORY;
    return cachedHistorySnapshot;
  } catch (err) {
    console.error(err);
    cachedHistorySnapshot = EMPTY_HISTORY;
    return cachedHistorySnapshot;
  }
};

const getSearchHistoryServerSnapshot = () => EMPTY_HISTORY;

const subscribeSearchHistory = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(SEARCH_HISTORY_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(SEARCH_HISTORY_EVENT, handleChange);
  };
};

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
  size = "default",
  ...props
}: SearchBarProps) {
  const isCompact = size === "compact";
  const isControlled = propValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const history = useSyncExternalStore(
    subscribeSearchHistory,
    readSearchHistory,
    getSearchHistoryServerSnapshot,
  );

  const value = isControlled ? propValue : internalValue;
  const debouncedValue = useDebounce(value, delay);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const saveHistory = useCallback((newHistory: string[]) => {
    const nextSnapshot = [...newHistory];
    const serializedHistory = JSON.stringify(nextSnapshot);

    cachedHistoryRaw = serializedHistory;
    cachedHistorySnapshot = nextSnapshot;
    window.localStorage.setItem(SEARCH_HISTORY_KEY, serializedHistory);
    window.dispatchEvent(new Event(SEARCH_HISTORY_EVENT));
  }, []);

  const addHistoryItem = useCallback(
    (item: string) => {
      if (!item.trim()) return;
      saveHistory([item, ...history.filter((h) => h !== item)].slice(0, 10)); // Keep top 10
    },
    [history, saveHistory],
  );

  const removeHistoryItem = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    saveHistory(history.filter((item) => item !== itemToRemove));
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      addHistoryItem(value);
      setIsFocused(false);
    }
  };

  const handleSearchClick = () => {
    onSearch?.(value);
    addHistoryItem(value);
    setIsFocused(false);
  };

  const handleHistorySelect = (item: string) => {
    if (!isControlled) {
      setInternalValue(item);
    }
    onChange?.(item);
    onSearch?.(item);
    addHistoryItem(item);
    setIsFocused(false);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    onChange?.("");
    onSearch?.("");
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative z-10 flex w-full flex-col items-center transition-all duration-300 pointer-events-auto ${
        isCompact ? "px-0" : "px-4 sm:px-0"
      } ${wrapperClassName}`}
    >
      <div
        className={`group relative mx-auto flex w-full items-center overflow-hidden border border-white/20 bg-[var(--container-color)]/80 backdrop-blur-xl transition-all duration-500 ${
          isCompact
            ? "max-w-full rounded-[22px]"
            : "max-w-full rounded-[32px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl"
        } ${
          isFocused
            ? isCompact
              ? "scale-[1.01] shadow-[4px_4px_14px_rgba(0,0,0,0.08),-4px_-4px_14px_rgba(255,255,255,0.75),inset_0_0_0_1px_var(--first-color)]"
              : "scale-[1.02] shadow-[6px_6px_20px_rgba(0,0,0,0.1),-6px_-6px_20px_rgba(255,255,255,0.8),inset_0_0_0_1px_var(--first-color)]"
            : isCompact
              ? "scale-100 shadow-[3px_3px_10px_rgba(0,0,0,0.18),-3px_-3px_10px_rgba(255,255,255,0.45)]"
              : "scale-100 shadow-[4px_4px_12px_rgba(0,0,0,0.25),-4px_-4px_12px_rgba(255,255,255,0.5)]"
        } ${className}`}
      >
        <div
          className={`shrink-0 pr-1.5 text-[var(--text-color-light)] transition-transform duration-500 group-focus-within:scale-110 group-focus-within:rotate-3 ${
            isCompact ? "pl-3.5" : "pl-4 pr-2 sm:pl-5"
          }`}
        >
          <svg
            width={isCompact ? 16 : 18}
            height={isCompact ? 16 : 18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-colors duration-300 ${isFocused ? "text-[var(--first-color)] drop-shadow-[0_0_8px_var(--first-color)]" : ""}`}
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
          onFocus={() => setIsFocused(true)}
          onClick={(e) => {
            setIsFocused(true);
            e.stopPropagation();
          }}
          placeholder={placeholder}
          maxLength={props.maxLength ?? 50}
          className={`min-w-0 flex-1 border-none bg-transparent font-medium text-[var(--text-color)] outline-none transition-all placeholder:text-[var(--text-color-light)] placeholder:opacity-60 ${
            isCompact
              ? "h-11 pr-[4.5rem] text-sm sm:h-12 sm:pr-[6.5rem] sm:text-[15px]"
              : "h-[46px] pr-[70px] text-[14px] sm:h-[64px] sm:pr-[140px] sm:text-[18px]"
          }`}
          {...props}
        />

        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className={`hidden cursor-pointer items-center justify-center rounded-full text-[var(--text-color-light)] outline-none transition-all duration-300 hover:bg-[var(--first-color)] hover:text-white active:scale-90 sm:flex ${
              isCompact ? "mr-1.5 h-7 w-7" : "mr-2 h-8 w-8"
            }`}
          >
            <svg
              width={isCompact ? 14 : 16}
              height={isCompact ? 14 : 16}
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
          onClick={handleSearchClick}
          className={`absolute -right-[2px] -top-[2px] -bottom-[2px] flex shrink-0 cursor-pointer items-center justify-center bg-[var(--first-color)] font-medium text-white outline-none transition-all duration-500 hover:brightness-110 hover:shadow-[0_0_15px_var(--first-color)] active:scale-95 ${
            isCompact
              ? `w-16 rounded-r-[22px] text-sm sm:w-24 ${isFocused ? "sm:w-[6.5rem] bg-gradient-to-r from-[var(--first-color)] to-[var(--first-color-alt)]" : ""}`
              : `w-[66px] rounded-r-[32px] text-[16px] sm:w-[134px] ${isFocused ? "sm:w-[144px] bg-gradient-to-r from-[var(--first-color)] to-[var(--first-color-alt)]" : ""}`
          }`}
        >
          <svg
            width={isCompact ? 17 : 20}
            height={isCompact ? 17 : 20}
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
          <span
            className={`hidden tracking-wider sm:inline ${isCompact ? "text-sm" : ""}`}
          >
            Search
          </span>
        </button>
      </div>

      {/* Search History Dropdown */}
      <div
        className={`absolute w-full overflow-hidden border border-white/20 bg-[var(--container-color)]/90 backdrop-blur-2xl transition-all duration-400 origin-top z-20 ${
          isCompact
            ? "top-[52px] max-w-full rounded-[18px] sm:top-[56px]"
            : "top-[60px] max-w-full rounded-[20px] sm:top-[80px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl"
        } ${
          isFocused
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100 shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0 shadow-none"
        }`}
      >
        {history.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/50 bg-gradient-to-b from-transparent to-black/5">
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--first-color)] to-[var(--first-color-alt)]">
                最新搜索
              </span>
              <button
                onClick={clearHistory}
                className="text-xs px-2 py-1 rounded-md text-[var(--text-color-light)] hover:text-white hover:bg-red-500/80 transition-all duration-300 flex items-center gap-1 group"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:rotate-12 transition-transform"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                清空
              </button>
            </div>
            <ul className="max-h-[250px] overflow-y-auto w-full p-2 space-y-1 custom-scrollbar">
              {history.map((item, idx) => (
                <li
                  key={idx}
                  className="group flex flex-row items-center justify-between w-full px-3 py-2.5 rounded-[12px] hover:bg-[var(--first-color)]/10 hover:shadow-sm cursor-pointer transition-all duration-300"
                  onClick={() => handleHistorySelect(item)}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center shrink-0 whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                    <div className="w-6 h-6 rounded-full bg-[var(--container-color)] border flex items-center justify-center mr-3 group-hover:bg-[var(--first-color)]/20 transition-colors shadow-sm hover:border-white">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[var(--text-color-light)] group-hover:text-[var(--first-color)] transition-colors "
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <span className="text-[14px] text-[var(--text-color)] group-hover:text-[var(--first-color)] group-hover:translate-x-1 transition-all truncate">
                      {item}
                    </span>
                  </div>
                  <button
                    onClick={(e) => removeHistoryItem(e, item)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-color-light)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all duration-300 shrink-0 transform scale-75 group-hover:scale-100"
                  >
                    <svg
                      width="14"
                      height="14"
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
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--text-color-light)] opacity-70">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 opacity-50"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span className="text-sm">暂无搜索历史记录</span>
          </div>
        )}
      </div>
    </div>
  );
}
