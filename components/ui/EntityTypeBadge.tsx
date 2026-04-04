import { type EntityThemeKey, getEntityTheme } from "@/lib/entityTheme";

interface EntityTypeBadgeProps {
  type: EntityThemeKey;
  label?: string;
  className?: string;
}

export default function EntityTypeBadge({
  type,
  label,
  className = "",
}: EntityTypeBadgeProps) {
  const theme = getEntityTheme(type);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${theme.badgeBackgroundClassName} ${theme.badgeBorderClassName} ${className}`.trim()}
    >
      <div className={`h-2 w-2 rounded-full ${theme.dotClassName}`} />
      <span className={`text-[11px] font-medium ${theme.badgeTextClassName}`}>
        {label ?? theme.label}
      </span>
    </div>
  );
}
