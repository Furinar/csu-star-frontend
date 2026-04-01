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
  ...props
}: SearchBarProps) {
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
      className={`flex flex-col items-center w-full z-10 transition-all duration-300 pointer-events-auto px-4 sm:px-0 relative ${wrapperClassName}`}
    >
      <div
        className={`relative flex items-center w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl bg-[var(--container-color)]/80 backdrop-blur-xl rounded-[32px] transition-all duration-500 mx-auto overflow-hidden group border border-white/20 ${
          isFocused
            ? "scale-[1.02] shadow-[6px_6px_20px_rgba(0,0,0,0.1),-6px_-6px_20px_rgba(255,255,255,0.8),inset_0_0_0_1px_var(--first-color)]"
            : "scale-100 shadow-[4px_4px_12px_rgba(0,0,0,0.25),-4px_-4px_12px_rgba(255,255,255,0.5)]"
        } ${className}`}
      >
        <div className="pl-4 sm:pl-5 pr-2 text-[var(--text-color-light)] shrink-0 transition-transform duration-500 group-focus-within:scale-110 group-focus-within:rotate-3">
          <svg
            width="18"
            height="18"
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
          className="flex-1 min-w-0 h-[56px] sm:h-[64px] pr-[70px] sm:pr-[140px] bg-transparent border-none outline-none text-[16px] sm:text-[18px] text-[var(--text-color)] placeholder:text-[var(--text-color-light)] placeholder:opacity-60 transition-all font-medium"
          {...props}
        />

        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-color-light)] hover:text-white hover:bg-[var(--first-color)] transition-all duration-300 mr-2 cursor-pointer outline-none active:scale-90"
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
          onClick={handleSearchClick}
          className={`absolute -right-[2px] -top-[2px] -bottom-[2px] w-[66px] sm:w-[134px] rounded-r-[32px] bg-[var(--first-color)] text-white text-[16px] font-medium transition-all duration-500 cursor-pointer outline-none flex items-center justify-center shrink-0 hover:shadow-[0_0_15px_var(--first-color)] hover:brightness-110 active:scale-95 ${
            isFocused
              ? "sm:w-[144px] bg-gradient-to-r from-[var(--first-color)] to-[var(--first-color-alt)]"
              : ""
          }`}
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
          <span className="hidden sm:inline tracking-wider">Search</span>
        </button>
      </div>

      {/* Search History Dropdown */}
      <div
        className={`absolute top-[70px] sm:top-[80px] w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl bg-[var(--container-color)]/90 backdrop-blur-2xl rounded-[20px] overflow-hidden transition-all duration-400 origin-top border border-white/20 z-20 ${
          isFocused
            ? "opacity-100 scale-100 translate-y-0 shadow-[0_20px_40px_rgba(0,0,0,0.15)] pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-2 shadow-none pointer-events-none"
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
