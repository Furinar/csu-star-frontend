export default function FloatingCloseButton({
  onClick,
  disabled = false,
  ariaLabel = "关闭弹层",
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/88 text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:right-4 sm:top-4 sm:h-11 sm:w-11 ${className}`.trim()}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M15 9L9 15M9 9L15 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
