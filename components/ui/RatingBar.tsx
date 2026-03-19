interface RatingBarProps {
    label: string;
    score: number;
    maxScore?: number;
    color: number;
}

const COLOR_PRESETS = [
    "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
    "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
    "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
    "linear-gradient(90deg, #a855f7 0%, #c084fc 100%)",
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function RatingBar({ label, score, maxScore = 5, color }: RatingBarProps) {
    const safeMaxScore = maxScore > 0 ? maxScore : 5;
    const safeScore = clamp(Number.isFinite(score) ? score : 0, 0, safeMaxScore);
    const colorIndex = ((Math.floor(color) % COLOR_PRESETS.length) + COLOR_PRESETS.length) % COLOR_PRESETS.length;
    const width = `${(safeScore / safeMaxScore) * 100}%`;
    const displayLabel = label.trim() || "未命名";

    return (
        <div className="flex w-full items-center gap-3 py-1">
            <span className="w-20 truncate text-sm font-medium text-gray-600 dark:text-gray-300">{displayLabel}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200/90 dark:bg-zinc-700/80">
                <div
                    className="h-full rounded-full transition-[width] duration-300 ease-out"
                    style={{ width, background: COLOR_PRESETS[colorIndex] }}
                />
            </div>
            <span className="w-11 text-right text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-100">
                {safeScore.toFixed(2)}
            </span>
        </div>
    );
}