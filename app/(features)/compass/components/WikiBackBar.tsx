"use client";

import Link from "next/link";

export interface WikiBackBarProps {
  /** 返回链接，默认指北门户 */
  backHref?: string;
  backLabel?: string;
  /**
   * 当前位置文案（已本地化的一行即可，如「专业指北 · 计算机学院」）。
   * 不要传 raw space_key（majors 等）。
   */
  location?: string | null;
  /** 右侧附加操作（仅按钮；不要再塞重复文案） */
  extra?: React.ReactNode;
}

/**
 * 主站 Nav 下的返回栏：左返回、中当前位置、右操作。
 * 单行工具条，不做「侧栏对齐的假分栏」。
 */
export default function WikiBackBar({
  backHref = "/compass",
  backLabel = "返回目录",
  location,
  extra,
}: WikiBackBarProps) {
  const place = location?.trim() || "";

  return (
    <div className="wiki-back-bar" role="navigation" aria-label="返回与位置">
      <div className="wiki-back-bar-inner">
        <Link href={backHref} className="wiki-back-bar-link">
          <span className="wiki-back-bar-arrow" aria-hidden>
            ←
          </span>
          <span>{backLabel}</span>
        </Link>
        {place ? (
          <>
            <span className="wiki-back-bar-sep" aria-hidden>
              /
            </span>
            <span className="wiki-back-bar-crumb" title={place}>
              {place}
            </span>
          </>
        ) : null}
        {extra ? <div className="wiki-back-bar-extra">{extra}</div> : null}
      </div>
    </div>
  );
}
