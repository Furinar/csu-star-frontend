"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSectionNode, getWikiDoc, getWikiTree } from "@/api/wiki";
import MarkdownArticle from "../components/MarkdownArticle";
import WikiBackBar from "../components/WikiBackBar";
import WikiSidebar from "../components/WikiSidebar";
import WikiToc, { WikiOutlineLinks } from "../components/WikiToc";
import { useHasMounted } from "@/hooks/useHasMounted";
import { formatDateTimeZh } from "@/lib/date";
import { buildWikiDocPath } from "@/lib/paths";
import {
  orderWikiSectionForDisplay,
  resolveAdjacentWikiDocs,
  slugifyHeading,
  type OutlineNode,
} from "@/lib/wikiDoc";
import type { WikiDocDetail, WikiSectionKey, WikiTree } from "@/types/wiki";

export default function WikiDocPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const section: WikiSectionKey | null = hasMounted
    ? searchParams.get("section")
    : null;
  const slug = hasMounted ? searchParams.get("slug") : null;

  const [tree, setTree] = useState<WikiTree | null>(null);
  const [doc, setDoc] = useState<WikiDocDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [outlineNodes, setOutlineNodes] = useState<OutlineNode[]>([]);
  const articleRef = useRef<HTMLDivElement | null>(null);

  const onOutlineChange = useCallback((nodes: OutlineNode[]) => {
    setOutlineNodes(nodes);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    getWikiTree()
      .then(setTree)
      .catch((error) => console.error("Failed to load wiki tree:", error));
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    if (!section || !slug) {
      setIsLoading(false);
      setDoc(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setLoadError(false);
    setIsDrawerOpen(false);
    setOutlineOpen(false);
    setOutlineNodes([]);

    getWikiDoc(section, slug)
      .then((detail) => {
        if (!mounted) return;
        setDoc(detail);
        document.title = `${detail.title} | 中南指北`;
      })
      .catch((error) => {
        console.error("Failed to load wiki doc:", error);
        if (!mounted) return;
        setDoc(null);
        setLoadError(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [hasMounted, section, slug]);

  useEffect(() => {
    if (!doc || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) target.scrollIntoView();
  }, [doc]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  const sectionNode = useMemo(() => {
    const raw = getSectionNode(tree, section);
    return raw ? orderWikiSectionForDisplay(raw) : null;
  }, [tree, section]);

  const { prevDoc, nextDoc } = useMemo(() => {
    if (!sectionNode || !slug) return { prevDoc: null, nextDoc: null };
    return resolveAdjacentWikiDocs(sectionNode, slug);
  }, [sectionNode, slug]);

  const titleId = doc ? slugifyHeading(doc.title) || "doc-title" : "doc-title";

  const sidebar =
    sectionNode && slug ? (
      <WikiSidebar
        section={sectionNode}
        activeSlug={slug}
        onNavigate={() => setIsDrawerOpen(false)}
      />
    ) : null;

  return (
    <div className="wiki-doc-shell Layout has-main-nav">
      <WikiBackBar
        location={[
          sectionNode?.title ??
            (section === "major"
              ? "专业指北"
              : section === "compass"
                ? "入坑指南"
                : null),
          doc?.title,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      {/* VPLocalNav：<960 菜单；960–1279 大纲下拉；≥1280 隐藏 */}
      <div className="VPLocalNav has-sidebar">
        <div className="container">
          <button
            type="button"
            className="menu"
            aria-expanded={isDrawerOpen}
            aria-controls="VPSidebarNav"
            onClick={() => setIsDrawerOpen(true)}
          >
            <span className="menu-icon" aria-hidden>
              ☰
            </span>
            <span className="menu-text">菜单</span>
          </button>

          {outlineNodes.length > 0 ? (
            <div
              className={`VPLocalNavOutlineDropdown${outlineOpen ? " open" : ""}`}
            >
              <button
                type="button"
                className={outlineOpen ? "open" : ""}
                onClick={() => setOutlineOpen((v) => !v)}
                aria-expanded={outlineOpen}
              >
                <span className="menu-text">页面导航</span>
                <span className="icon" aria-hidden>
                  ▸
                </span>
              </button>
              {outlineOpen ? (
                <div className="items">
                  <WikiOutlineLinks
                    nodes={outlineNodes}
                    activeId=""
                    onNavigate={() => setOutlineOpen(false)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isDrawerOpen ? (
        <div
          className="VPSidebar-backdrop"
          onClick={() => setIsDrawerOpen(false)}
        />
      ) : null}
      <aside
        className={`VPSidebar${isDrawerOpen ? " open" : ""}`}
        id="VPSidebarNav"
      >
        <div className="curtain" aria-hidden />
        <nav className="nav" aria-labelledby="sidebar-aria-label" tabIndex={-1}>
          <span className="visually-hidden" id="sidebar-aria-label">
            Sidebar Navigation
          </span>
          {sidebar}
        </nav>
      </aside>

      <div className="VPContent has-sidebar" id="VPContent">
        <div className="VPDoc has-sidebar has-aside">
          <div className="container">
            <div className="aside">
              <div className="aside-curtain" aria-hidden />
              <div className="aside-container">
                <div className="aside-content">
                  {doc ? (
                    <WikiToc
                      articleRef={articleRef}
                      contentKey={`${doc.section}:${doc.slug}`}
                      onOutlineChange={onOutlineChange}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content-container">
                <main className="main">
                  <div className="vp-doc">
                    {isLoading ? (
                      <div className="wiki-skeleton" aria-hidden>
                        <span />
                        <span style={{ width: "100%" }} />
                        <span style={{ width: "92%" }} />
                        <span style={{ width: "84%" }} />
                        <span style={{ width: "70%" }} />
                      </div>
                    ) : doc ? (
                      <>
                        <h1 id={titleId} tabIndex={-1}>
                          {doc.title}
                          <a
                            className="header-anchor"
                            href={`#${titleId}`}
                            aria-label={`Permalink to “${doc.title}”`}
                          >
                            ​
                          </a>
                        </h1>
                        <MarkdownArticle
                          ref={articleRef}
                          content={doc.content}
                        />
                      </>
                    ) : (
                      <div className="wiki-empty">
                        <p>
                          {loadError
                            ? "这篇文档不存在或已下架"
                            : "缺少文档参数,请从目录进入"}
                        </p>
                        <p>
                          <Link href="/compass">返回生存指北目录</Link>
                        </p>
                      </div>
                    )}
                  </div>
                </main>

                {doc ? (
                  <footer className="VPDocFooter">
                    {doc.updatedAt ? (
                      <div className="edit-info">
                        <div />
                        <div className="last-updated">
                          <p className="VPLastUpdated">
                            最后更新于:{" "}
                            <time dateTime={doc.updatedAt} lang="zh-CN">
                              {formatDateTimeZh(doc.updatedAt)}
                            </time>
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {prevDoc || nextDoc ? (
                      <nav className="prev-next" aria-label="Pager">
                        <div className="pager">
                          {prevDoc ? (
                            <Link
                              className="pager-link prev"
                              href={buildWikiDocPath(
                                prevDoc.section,
                                prevDoc.slug,
                              )}
                            >
                              <span className="desc">上一页</span>
                              <span className="title">{prevDoc.title}</span>
                            </Link>
                          ) : null}
                        </div>
                        <div className="pager">
                          {nextDoc ? (
                            <Link
                              className="pager-link next"
                              href={buildWikiDocPath(
                                nextDoc.section,
                                nextDoc.slug,
                              )}
                            >
                              <span className="desc">下一页</span>
                              <span className="title">{nextDoc.title}</span>
                            </Link>
                          ) : null}
                        </div>
                      </nav>
                    ) : null}
                  </footer>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
