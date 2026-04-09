"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function PageBreadcrumbs({
                                          items,
                                          backHref,
                                          backLabel = "返回上一页",
                                          className = "",
                                        }: {
  items: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  if (items.length === 0 && !backHref) {
    return null;
  }

  return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {backHref ? (
            <Link
                href={backHref}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--page-accent-text)] transition hover:opacity-80 cursor-pointer"
            >
              <i className="uil uil-arrow-left text-base"/>
              {backLabel}
            </Link>
        ) : null}

        {items.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                      {item.href && !isLast ? (
                          <Link
                              href={item.href}
                              className="transition hover:text-[var(--page-accent-text)]"
                          >
                            {item.label}
                          </Link>
                      ) : (
                          <span className={isLast ? "font-medium text-slate-600" : ""}>
                    {item.label}
                  </span>
                      )}
                      {!isLast ? <i className="uil uil-angle-right text-xs"/> : null}
                    </div>
                );
              })}
            </div>
        ) : null}
      </div>
  );
}
