interface RatingBarProps {
  label?: string;
  score?: number;
  maxScore?: number;
  color?: number;
  value?: number;
  max?: number;
  colorClass?: string;
  gradient?: string;
  compact?: boolean;
}

const COLOR_PRESETS = [
    "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
    "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
    "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
    "linear-gradient(90deg, #a855f7 0%, #c084fc 100%)",
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const COLOR_CLASS_TO_INDEX: Record<string, number> = {
    "bg-emerald-500": 0,
    "bg-green-500": 0,
    "bg-sky-500": 1,
    "bg-blue-500": 1,
    "bg-amber-500": 2,
    "bg-yellow-500": 2,
    "bg-purple-500": 3,
    "bg-fuchsia-500": 3,
};

export default function RatingBar({
  label = "",
  score,
  maxScore = 5,
  color = 1,
  value,
  max,
  colorClass,
  gradient,
  compact = false,
}: RatingBarProps) {
  const resolvedMax = max ?? maxScore;
  const resolvedScore = value ?? score ?? 0;
  const safeMaxScore = resolvedMax > 0 ? resolvedMax : 5;
  const safeScore = clamp(
    Number.isFinite(resolvedScore) ? resolvedScore : 0,
    0,
    safeMaxScore,
  );
  const fallbackColor = colorClass ? (COLOR_CLASS_TO_INDEX[colorClass] ?? color) : color;
  const colorIndex =
    ((Math.floor(fallbackColor) % COLOR_PRESETS.length) + COLOR_PRESETS.length) %
    COLOR_PRESETS.length;
  const width = `${(safeScore / safeMaxScore) * 100}%`;
  const displayLabel = label.trim();
  const resolvedGradient = gradient ?? COLOR_PRESETS[colorIndex];

  return (
    <div className={`flex w-full items-center py-1 ${compact ? "gap-2" : "gap-3"}`}>
      {displayLabel ? (
        <span
          className={`truncate font-medium text-gray-600 ${
            compact ? "w-14 text-[10px]" : "w-20 text-sm"
          }`}
        >
          {displayLabel}
        </span>
      ) : null}
      <div className={`flex-1 overflow-hidden rounded-full bg-gray-200/90 ${compact ? "h-1.5" : "h-2"}`}>
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width, background: resolvedGradient }}
        />
      </div>
      <span
        className={`shrink-0 text-right font-semibold tabular-nums text-gray-500 ${
          compact ? "w-8 text-[10px]" : "w-11 text-sm"
        }`}
      >
        {safeScore.toFixed(2)}
      </span>
    </div>
  );
}
