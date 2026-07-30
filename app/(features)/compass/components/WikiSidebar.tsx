"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildWikiDocPath } from "@/lib/paths";
import {
  buildWikiPrimaryItems,
  ensureActiveGroupOpen,
  findActiveGroupId,
  initialOpenMajorGroups,
  toggleOpenGroup,
} from "@/lib/wikiDoc";
import type { WikiSectionNode } from "@/types/wiki";
import SidebarActiveMarker from "./SidebarActiveMarker";

interface WikiSidebarProps {
  /** 当前板块整棵子树（侧栏只渲染这一块） */
  section: WikiSectionNode;
  activeSlug: string;
  onNavigate?: () => void;
}

/** VitePress 空心 chevron */
function ChevronIcon() {
  return (
    <span className="caret-icon vpi-chevron-right" aria-hidden>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </span>
  );
}

function DocLinkItem({
  sectionKey,
  slug,
  title,
  active,
  level,
  onNavigate,
}: {
  sectionKey: string;
  slug: string;
  title: string;
  active: boolean;
  level: 0 | 1;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={`VPSidebarItem level-${level} is-link${
        active ? " is-active has-active" : ""
      }`}
    >
      <div className="item">
        <div className="indicator" />
        <Link
          className="link"
          href={buildWikiDocPath(sectionKey, slug)}
          onClick={onNavigate}
        >
          <p className="text">{title}</p>
        </Link>
      </div>
    </div>
  );
}

/**
 * 统一一级序列渲染：
 * - 根文档 / 有二级分组 走同一 primary 列表（简介永远不会被学院顶掉）
 * - 有二级：默认展开；展开时 group 带 is-open（上下分割线）；折叠 is-collapsed 无线
 * - 无二级：is-leaf，无线
 */
export default function WikiSidebar({
  section,
  activeSlug,
  onNavigate,
}: WikiSidebarProps) {
  const primary = useMemo(() => buildWikiPrimaryItems(section), [section]);

  const activeGroupId = findActiveGroupId(section, activeSlug);

  const groupIds = useMemo(
    () =>
      primary
        .filter((i) => i.type === "group")
        .map((i) => (i.type === "group" ? i.group.id : "")),
    [primary],
  );

  const [openGroups, setOpenGroups] = useState<Set<string>>(() =>
    initialOpenMajorGroups(groupIds, activeGroupId),
  );

  useEffect(() => {
    setOpenGroups((prev) => ensureActiveGroupOpen(prev, activeGroupId));
  }, [activeGroupId]);

  useEffect(() => {
    setOpenGroups(initialOpenMajorGroups(groupIds, activeGroupId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when section identity changes
  }, [section.key]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => toggleOpenGroup(prev, id));
  };

  const openLayoutKey = useMemo(
    () => [...openGroups].sort().join(","),
    [openGroups],
  );

  return (
    <SidebarActiveMarker activeKey={activeSlug} layoutKey={openLayoutKey}>
      {primary.map((item) => {
        if (item.type === "doc") {
          const { doc } = item;
          return (
            <div className="group is-leaf" key={`doc-${doc.id}`}>
              <DocLinkItem
                sectionKey={section.key}
                slug={doc.slug}
                title={doc.title}
                level={0}
                active={doc.slug === activeSlug}
                onNavigate={onNavigate}
              />
            </div>
          );
        }

        const { group } = item;
        const hasChildren = group.docs.length > 0;
        const open = hasChildren && openGroups.has(group.id);
        const groupActive = group.docs.some((d) => d.slug === activeSlug);

        // 无二级：当作 leaf 一级链接不可达时仍显示折叠头但无分割线
        if (!hasChildren) {
          return (
            <div className="group is-leaf" key={`cat-${group.id}`}>
              <div className="VPSidebarItem level-0">
                <div className="item">
                  <p className="text">{group.name}</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            className={`group is-branch${open ? " is-open" : " is-collapsed"}`}
            key={`cat-${group.id}`}
          >
            <section
              className={`VPSidebarItem level-0 collapsible${
                open ? "" : " collapsed"
              }${groupActive ? " has-active" : ""}`}
            >
              <div
                className="item"
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(group.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGroup(group.id);
                  }
                }}
              >
                <div className="indicator" />
                <p className="text">{group.name}</p>
                <div
                  className="caret"
                  role="button"
                  aria-label="toggle section"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(group.id);
                  }}
                >
                  <ChevronIcon />
                </div>
              </div>
              <div className="items">
                <div className="items-inner">
                  {group.docs.map((doc) => (
                    <DocLinkItem
                      key={doc.id}
                      sectionKey={section.key}
                      slug={doc.slug}
                      title={doc.title}
                      level={1}
                      active={doc.slug === activeSlug}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        );
      })}
    </SidebarActiveMarker>
  );
}
