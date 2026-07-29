"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  extractWikiOutlineTreeFromContainer,
  type OutlineNode,
} from "@/lib/wikiDoc";

export function WikiOutlineLinks({
  nodes,
  activeId,
  linkRefs,
  onNavigate,
}: {
  nodes: OutlineNode[];
  activeId: string;
  linkRefs?: RefObject<Map<string, HTMLAnchorElement>>;
  onNavigate?: () => void;
}) {
  return (
    <ul className="VPDocOutlineItem root">
      {nodes.map((node) => (
        <li key={node.id}>
          <a
            href={`#${node.id}`}
            title={node.text}
            ref={(el) => {
              if (!linkRefs?.current) return;
              if (el) linkRefs.current.set(node.id, el);
              else linkRefs.current.delete(node.id);
            }}
            className={`outline-link${activeId === node.id ? " active" : ""}`}
            onClick={onNavigate}
          >
            {node.text}
          </a>
          {node.children.length > 0 ? (
            <ul className="VPDocOutlineItem nested">
              {node.children.map((child) => (
                <li key={child.id}>
                  <a
                    href={`#${child.id}`}
                    title={child.text}
                    ref={(el) => {
                      if (!linkRefs?.current) return;
                      if (el) linkRefs.current.set(child.id, el);
                      else linkRefs.current.delete(child.id);
                    }}
                    className={`outline-link${
                      activeId === child.id ? " active" : ""
                    }`}
                    onClick={onNavigate}
                  >
                    {child.text}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * 对齐 VitePress VPDocAsideOutline：
 * 树形 h2/h3 + outline-marker 跟随 active。
 */
export default function WikiToc({
  articleRef,
  contentKey,
  onOutlineChange,
}: {
  articleRef: RefObject<HTMLDivElement | null>;
  contentKey: string;
  onOutlineChange?: (nodes: OutlineNode[]) => void;
}) {
  const [nodes, setNodes] = useState<OutlineNode[]>([]);
  const [activeId, setActiveId] = useState("");
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [markerTop, setMarkerTop] = useState(32);

  useEffect(() => {
    const article = articleRef.current;
    const tree = extractWikiOutlineTreeFromContainer(article);
    setNodes(tree);
    onOutlineChange?.(tree);

    const flatIds: string[] = [];
    const walk = (list: OutlineNode[]) => {
      for (const n of list) {
        flatIds.push(n.id);
        walk(n.children);
      }
    };
    walk(tree);
    setActiveId(flatIds[0] ?? "");

    if (!article || flatIds.length === 0) return;

    const headings = Array.from(article.querySelectorAll("h2, h3")).filter(
      (el): el is HTMLElement => Boolean(el.id),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [articleRef, contentKey, onOutlineChange]);

  useEffect(() => {
    if (!activeId) return;
    const el = linkRefs.current.get(activeId);
    if (!el) return;
    setMarkerTop(el.offsetTop + (el.offsetHeight - 18) / 2);
  }, [activeId, nodes]);

  if (nodes.length === 0) return null;

  return (
    <nav
      className="VPDocAsideOutline has-outline"
      aria-labelledby="doc-outline-aria-label"
    >
      <div className="content">
        <div
          className={`outline-marker${activeId ? " is-visible" : ""}`}
          style={{ top: markerTop }}
          aria-hidden
        />
        <div
          className="outline-title"
          id="doc-outline-aria-label"
          role="heading"
          aria-level={2}
        >
          页面导航
        </div>
        <WikiOutlineLinks
          nodes={nodes}
          activeId={activeId}
          linkRefs={linkRefs}
        />
      </div>
    </nav>
  );
}
