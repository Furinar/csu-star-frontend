"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Empty, Input } from "tdesign-react";
import {
  addCompassComment,
  getCompassComments,
  getCompassHistory,
  getCompassPage,
  getCompassTree,
  requestCompassEdit,
  updateCompassPage,
  type CompassComment,
  type CompassHistoryItem,
  type CompassPage,
  type CompassTreeNode,
} from "@/api/compass";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import MarkdownArticle from "./MarkdownArticle";
import SidebarActiveMarker from "./SidebarActiveMarker";
import WikiBackBar from "./WikiBackBar";

type SideTab = "outline" | "comments" | "history";

/** space_key → 中文展示名，禁止在返回栏直接显示 majors 等 raw key */
function humanizeSpaceKey(key?: string | null): string {
  if (!key) return "";
  const map: Record<string, string> = {
    majors: "专业指北",
    major: "专业指北",
    compass: "入坑指南",
    plaza: "知识广场",
    courses: "课程共笔",
    collection: "合集",
    essay: "随笔",
  };
  return map[key] ?? map[key.toLowerCase()] ?? "";
}

function flattenTree(nodes: CompassTreeNode[]): CompassTreeNode[] {
  const out: CompassTreeNode[] = [];
  const walk = (list: CompassTreeNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function nodeContainsId(node: CompassTreeNode, id: string): boolean {
  if (node.id === id) return true;
  return (node.children || []).some((c) => nodeContainsId(c, id));
}

/** VitePress 空心 chevron（与 WikiSidebar 一致） */
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

/**
 * 通用树：一级独立 group（分割线）+ 二级左杠，与官方 wiki 侧栏同一套结构。
 */
function TreeList({
  nodes,
  activeId,
  onSelect,
  openIds,
  onToggle,
  depth = 0,
}: {
  nodes: CompassTreeNode[];
  activeId: string;
  onSelect: (id: string) => void;
  openIds: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  if (depth === 0) {
    return (
      <>
        {nodes.map((n) => {
          const hasChildren = Boolean(n.children?.length);
          const active = n.id === activeId;
          // 有二级默认展开（openIds 初值全开 + 含 active 祖先）
          const open = hasChildren && openIds.has(n.id);
          if (!hasChildren) {
            return (
              <div className="group is-leaf" key={n.id}>
                <div
                  className={`VPSidebarItem level-0 is-link${
                    active ? " is-active has-active" : ""
                  }`}
                >
                  <div className="item">
                    <div className="indicator" />
                    <button
                      type="button"
                      className="link cw-tree-link"
                      onClick={() => onSelect(n.id)}
                    >
                      <p className="text">{n.title}</p>
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div
              className={`group is-branch${open ? " is-open" : " is-collapsed"}`}
              key={n.id}
            >
              <section
                className={`VPSidebarItem level-0 collapsible${
                  open ? "" : " collapsed"
                }${nodeContainsId(n, activeId) ? " has-active" : ""}`}
              >
                <div className="item">
                  <div className="indicator" />
                  <button
                    type="button"
                    className="link cw-tree-link"
                    onClick={() => onSelect(n.id)}
                  >
                    <p className="text">{n.title}</p>
                  </button>
                  <div
                    className="caret"
                    role="button"
                    tabIndex={0}
                    aria-label="toggle section"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(n.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle(n.id);
                      }
                    }}
                  >
                    <ChevronIcon />
                  </div>
                </div>
                <div className="items">
                  <div className="items-inner">
                    <TreeList
                      nodes={n.children || []}
                      activeId={activeId}
                      onSelect={onSelect}
                      openIds={openIds}
                      onToggle={onToggle}
                      depth={1}
                    />
                  </div>
                </div>
              </section>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      {nodes.map((n) => {
        const hasChildren = Boolean(n.children?.length);
        const active = n.id === activeId;
        const open = openIds.has(n.id) || nodeContainsId(n, activeId);
        if (!hasChildren) {
          return (
            <div
              key={n.id}
              className={`VPSidebarItem level-1 is-link${
                active ? " is-active has-active" : ""
              }`}
            >
              <div className="item">
                <div className="indicator" />
                <button
                  type="button"
                  className="link cw-tree-link"
                  onClick={() => onSelect(n.id)}
                >
                  <p className="text">{n.title}</p>
                </button>
              </div>
            </div>
          );
        }
        return (
          <div
            key={n.id}
            className={`VPSidebarItem level-1 collapsible${
              open ? "" : " collapsed"
            }${nodeContainsId(n, activeId) ? " has-active" : ""}`}
          >
            <div className="item">
              <div className="indicator" />
              <button
                type="button"
                className="link cw-tree-link"
                onClick={() => onSelect(n.id)}
              >
                <p className="text">{n.title}</p>
              </button>
              <div
                className="caret"
                role="button"
                tabIndex={0}
                aria-label="toggle section"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(n.id);
                }}
              >
                <ChevronIcon />
              </div>
            </div>
            <div className="items">
              <div className="items-inner">
                <TreeList
                  nodes={n.children || []}
                  activeId={activeId}
                  onSelect={onSelect}
                  openIds={openIds}
                  onToggle={onToggle}
                  depth={depth + 1}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function outlineFromBody(body: string): { id: string; text: string; level: number }[] {
  const lines = body.split("\n");
  const out: { id: string; text: string; level: number }[] = [];
  lines.forEach((line, i) => {
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      out.push({ id: `h-${i}`, text: m[2], level: m[1].length });
    }
  });
  return out;
}

export interface DocumentWorkbenchProps {
  pageId: string;
  spaceKey?: string;
  rootPageId?: string;
  courseId?: string;
  titleHint?: string;
}

export default function DocumentWorkbench({
  pageId: initialPageId,
  spaceKey,
  rootPageId,
  courseId,
}: DocumentWorkbenchProps) {
  const router = useRouter();
  const isAuthenticated = Boolean(useAuthStore((s) => s.access_token));
  const [pageId, setPageId] = useState(initialPageId);
  const [page, setPage] = useState<CompassPage | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [tree, setTree] = useState<CompassTreeNode[]>([]);
  const [history, setHistory] = useState<CompassHistoryItem[]>([]);
  const [comments, setComments] = useState<CompassComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sideTab, setSideTab] = useState<SideTab>("outline");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editReason, setEditReason] = useState("");
  const [showEditReq, setShowEditReq] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  /** 有子节点的一级默认展开 */
  const [openTreeIds, setOpenTreeIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setPageId(initialPageId);
    setIsEditing(false);
  }, [initialPageId]);

  const loadPage = useCallback(async (id: string) => {
    // 保留上一篇正文，避免切文时 skeleton 替换导致高度塌缩闪烁
    setLoading(true);
    setIsEditing(false);
    try {
      const data = await getCompassPage(id);
      setPage(data.page);
      setCanWrite(data.can_write);
      setEditTitle(data.page.title);
      setEditBody(data.page.body);
      window.scrollTo(0, 0);
      const [hist, cms] = await Promise.all([
        getCompassHistory(id),
        getCompassComments(id),
      ]);
      setHistory(hist.items || []);
      setComments(cms.items || []);
    } catch {
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const treeScopeKey = `${spaceKey || page?.space_key || ""}::${rootPageId || ""}`;

  const loadTree = useCallback(async () => {
    try {
      const data = await getCompassTree(
        spaceKey || page?.space_key,
        rootPageId,
      );
      const next = data.tree || [];
      setTree(next);
      setOpenTreeIds((prev) => {
        const defaultOpen = () => {
          const open = new Set<string>();
          const collect = (nodes: CompassTreeNode[]) => {
            for (const n of nodes) {
              if (n.children?.length) {
                open.add(n.id);
                collect(n.children);
              }
            }
          };
          collect(next);
          return open;
        };

        // 空间/根变更时重新默认全开；同树内保留用户折叠
        const known = new Set(flattenTree(next).map((n) => n.id));
        const retained = [...prev].filter((id) => known.has(id));
        const base =
          retained.length > 0 && prev.size > 0
            ? new Set(retained)
            : defaultOpen();

        // 保证通往当前页的祖先展开（否则 active 二级会藏在折叠里）
        if (pageId) {
          const openPath = (
            nodes: CompassTreeNode[],
            trail: string[],
          ): boolean => {
            for (const n of nodes) {
              const path = [...trail, n.id];
              if (n.id === pageId) {
                // 祖先全部打开（不含自身若无子也可）
                trail.forEach((id) => base.add(id));
                return true;
              }
              if (n.children?.length && openPath(n.children, path)) {
                base.add(n.id);
                return true;
              }
            }
            return false;
          };
          openPath(next, []);
        }
        return base;
      });
    } catch {
      setTree([]);
    }
  }, [spaceKey, rootPageId, page?.space_key, pageId]);

  useEffect(() => {
    if (!isAuthenticated || !pageId) return;
    void loadPage(pageId);
  }, [isAuthenticated, pageId, loadPage]);

  // 切页不强制重拉整树；空间/根变化时再拉
  useEffect(() => {
    if (!isAuthenticated) return;
    void loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when tree scope changes
  }, [isAuthenticated, treeScopeKey]);

  // 当前页变化时，只保证祖先展开（不重置其它折叠）
  useEffect(() => {
    if (!pageId || !tree.length) return;
    setOpenTreeIds((prev) => {
      const nextOpen = new Set(prev);
      const openPath = (nodes: CompassTreeNode[], trail: string[]): boolean => {
        for (const n of nodes) {
          const path = [...trail, n.id];
          if (n.id === pageId) {
            trail.forEach((id) => nextOpen.add(id));
            return true;
          }
          if (n.children?.length && openPath(n.children, path)) {
            nextOpen.add(n.id);
            return true;
          }
        }
        return false;
      };
      openPath(tree, []);
      return nextOpen;
    });
  }, [pageId, tree]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  const outline = useMemo(
    () => outlineFromBody(isEditing ? editBody : page?.body || ""),
    [isEditing, editBody, page?.body],
  );

  const flatPages = useMemo(() => flattenTree(tree), [tree]);
  const { prevPage, nextPage } = useMemo(() => {
    const index = flatPages.findIndex((n) => n.id === pageId);
    if (index === -1) return { prevPage: null, nextPage: null };
    return {
      prevPage: index > 0 ? flatPages[index - 1] : null,
      nextPage: index < flatPages.length - 1 ? flatPages[index + 1] : null,
    };
  }, [flatPages, pageId]);

  const toggleTreeNode = (id: string) => {
    setOpenTreeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPage = (id: string) => {
    setPageId(id);
    setIsDrawerOpen(false);
    setIsEditing(false);
    const q = new URLSearchParams({ id });
    if (spaceKey) q.set("space", spaceKey);
    if (rootPageId) q.set("root", rootPageId);
    if (courseId) q.set("courseId", courseId);
    router.replace(`/compass/p?${q.toString()}`);
  };

  const onSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const updated = await updateCompassPage(page.id, {
        title: editTitle,
        body: editBody,
      });
      setPage(updated);
      const hist = await getCompassHistory(page.id);
      setHistory(hist.items || []);
      feedback.success({ title: "已保存", description: "改动即时生效，已写入历史" });
    } catch {
      feedback.error({ title: "保存失败", description: "请稍后重试" });
    } finally {
      setSaving(false);
    }
  };

  const onRequestEdit = async () => {
    if (!page) return;
    try {
      await requestCompassEdit(page.id, editReason.trim() || "申请协作编辑");
      setShowEditReq(false);
      setEditReason("");
      feedback.success({ title: "已提交", description: "等待管理员处理" });
    } catch {
      feedback.error({ title: "提交失败", description: "请稍后重试" });
    }
  };

  const onAddComment = async () => {
    if (!page || !commentText.trim()) return;
    try {
      await addCompassComment(page.id, commentText.trim());
      setCommentText("");
      const cms = await getCompassComments(page.id);
      setComments(cms.items || []);
    } catch {
      feedback.error({ title: "评论失败", description: "请稍后重试" });
    }
  };

  const startEditing = () => {
    if (!page) return;
    setEditTitle(page.title);
    setEditBody(page.body || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (page) {
      setEditTitle(page.title);
      setEditBody(page.body || "");
    }
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="wiki-doc-shell compass-workbench cw-gate">
        <Empty description="登录后查看与编辑协作文档" />
        <Link href="/login" className="cw-gate-link">
          去登录
        </Link>
      </div>
    );
  }

  const spaceLabel = humanizeSpaceKey(page?.space_key || spaceKey);
  const location = [spaceLabel, page?.title].filter(Boolean).join(" · ");
  const sideTabs: { id: SideTab; label: string }[] = [
    { id: "outline", label: "大纲" },
    { id: "comments", label: "评论" },
    { id: "history", label: "历史" },
  ];

  /** 右侧只放操作按钮，不再重复 space_key 文案 */
  const collabExtra = (
    <div className="cw-collab-actions">
      {canWrite ? (
        isEditing ? (
          <>
            <button
              type="button"
              className="cw-nav-btn"
              onClick={cancelEditing}
            >
              取消
            </button>
            <button
              type="button"
              className="cw-nav-btn cw-nav-btn-primary"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="cw-nav-btn cw-nav-btn-primary"
            onClick={startEditing}
            disabled={loading || !page}
          >
            编辑
          </button>
        )
      ) : (
        <>
          <span className="cw-readonly">只读</span>
          <button
            type="button"
            className="cw-nav-btn"
            onClick={() => setShowEditReq(true)}
            disabled={loading || !page}
          >
            申请编辑
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="wiki-doc-shell Layout compass-workbench has-main-nav">
      <WikiBackBar location={location} extra={collabExtra} />

      {/* VPLocalNav：窄屏打开左栏；可下拉大纲 */}
      <div className="VPLocalNav has-sidebar">
        <div className="container">
          <button
            type="button"
            className="menu"
            aria-expanded={isDrawerOpen}
            aria-controls="CWSidebarNav"
            onClick={() => setIsDrawerOpen(true)}
          >
            <span className="menu-icon" aria-hidden>
              ☰
            </span>
            <span className="menu-text">菜单</span>
          </button>

          {outline.length > 0 ? (
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
                  {outline.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`outline-link${o.level > 2 ? " nested" : ""}`}
                      onClick={() => {
                        setSideTab("outline");
                        setOutlineOpen(false);
                      }}
                    >
                      {o.text}
                    </button>
                  ))}
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
        id="CWSidebarNav"
      >
        <div className="curtain" aria-hidden />
        <nav className="nav" aria-label="文档目录" tabIndex={-1}>
          <h2 className="visually-hidden">目录</h2>
          {tree.length ? (
            <SidebarActiveMarker
              activeKey={pageId}
              layoutKey={[...openTreeIds].sort().join(",")}
            >
              <TreeList
                nodes={tree}
                activeId={pageId}
                onSelect={selectPage}
                openIds={openTreeIds}
                onToggle={toggleTreeNode}
              />
            </SidebarActiveMarker>
          ) : (
            <p className="cw-muted">暂无目录节点</p>
          )}
        </nav>
      </aside>

      <div className="VPContent has-sidebar" id="VPContent">
        <div className="VPDoc has-sidebar has-aside">
          <div className="container">
            {/* 右栏：大纲 | 评论 | 历史 */}
            <div className="aside">
              <div className="aside-curtain" aria-hidden />
              <div className="aside-container">
                <div className="aside-content">
                  <div className="VPDocAsideOutline has-outline cw-aside-panel">
                    <div className="content">
                      <div
                        className="cw-aside-tabs"
                        role="tablist"
                        aria-label="侧栏面板"
                      >
                        {sideTabs.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={sideTab === t.id}
                            className={`cw-aside-tab${sideTab === t.id ? " is-active" : ""}`}
                            onClick={() => setSideTab(t.id)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="cw-aside-body">
                        {sideTab === "outline" ? (
                          <>
                            <div
                              className="outline-title"
                              role="heading"
                              aria-level={2}
                            >
                              页面导航
                            </div>
                            {outline.length ? (
                              <ul className="VPDocOutlineItem root">
                                {outline.map((o) => (
                                  <li key={o.id}>
                                    <span
                                      className={`outline-link${
                                        o.level > 2 ? " nested" : ""
                                      }`}
                                    >
                                      {o.text}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="cw-muted">正文中用 # 标题生成大纲</p>
                            )}
                          </>
                        ) : null}

                        {sideTab === "comments" ? (
                          <div className="cw-comments">
                            <div className="cw-comments-list">
                              {comments.map((c) => (
                                <div key={c.id} className="cw-comment">
                                  <div className="cw-comment-meta">
                                    用户 {c.user_id}
                                  </div>
                                  <div className="cw-comment-body">{c.body}</div>
                                </div>
                              ))}
                              {!comments.length ? (
                                <p className="cw-muted">暂无评论</p>
                              ) : null}
                            </div>
                            <textarea
                              className="cw-comment-input"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="写评论"
                              rows={3}
                            />
                            <button
                              type="button"
                              className="cw-nav-btn cw-nav-btn-primary"
                              onClick={() => void onAddComment()}
                            >
                              发送
                            </button>
                          </div>
                        ) : null}

                        {sideTab === "history" ? (
                          <ul className="cw-history">
                            {history.map((h) => (
                              <li key={h.id} className="cw-history-item">
                                <div className="cw-history-title">{h.title}</div>
                                <div className="cw-history-meta">
                                  编辑者 {h.editor_id} ·{" "}
                                  {new Date(h.created_at).toLocaleString()}
                                </div>
                                <div className="cw-history-snippet">{h.body}</div>
                              </li>
                            ))}
                            {!history.length ? (
                              <p className="cw-muted">暂无历史</p>
                            ) : null}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 中栏正文 */}
            <div className="content">
              <div className="content-container">
                <main className="main">
                  <div
                    className={`vp-doc${loading && page ? " is-pending" : ""}`}
                    aria-busy={loading}
                  >
                    {/* 仅首屏无缓存时用 skeleton；切文保留旧正文，消除高度闪烁 */}
                    {loading && !page ? (
                      <div className="wiki-skeleton" aria-hidden>
                        <span />
                        <span style={{ width: "100%" }} />
                        <span style={{ width: "92%" }} />
                        <span style={{ width: "84%" }} />
                        <span style={{ width: "70%" }} />
                      </div>
                    ) : !page ? (
                      <div className="wiki-empty">
                        <p>文档不存在或无权访问</p>
                        <p>
                          <Link href="/compass">返回目录</Link>
                        </p>
                      </div>
                    ) : isEditing && canWrite ? (
                      <>
                        <input
                          className="cw-edit-title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          aria-label="文档标题"
                        />
                        <textarea
                          className="cw-edit-body"
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          aria-label="文档正文"
                        />
                        <p className="cw-meta">
                          更新{" "}
                          {page.updated_at
                            ? new Date(page.updated_at).toLocaleString()
                            : "—"}{" "}
                          · 阅读 {page.view_count} · 编辑 {page.edit_count}
                        </p>
                      </>
                    ) : (
                      <>
                        <h1 tabIndex={-1}>{page.title}</h1>
                        <MarkdownArticle
                          content={page.body || ""}
                          contentKey={page.id}
                        />
                        <p className="cw-meta">
                          更新{" "}
                          {page.updated_at
                            ? new Date(page.updated_at).toLocaleString()
                            : "—"}{" "}
                          · 阅读 {page.view_count} · 编辑 {page.edit_count}
                        </p>
                      </>
                    )}
                  </div>
                </main>

                {!loading && page ? (
                  <footer className="VPDocFooter">
                    {prevPage || nextPage ? (
                      <nav className="prev-next" aria-label="Pager">
                        <div className="pager">
                          {prevPage ? (
                            <button
                              type="button"
                              className="pager-link prev"
                              onClick={() => selectPage(prevPage.id)}
                            >
                              <span className="desc">上一页</span>
                              <span className="title">{prevPage.title}</span>
                            </button>
                          ) : null}
                        </div>
                        <div className="pager">
                          {nextPage ? (
                            <button
                              type="button"
                              className="pager-link next"
                              onClick={() => selectPage(nextPage.id)}
                            >
                              <span className="desc">下一页</span>
                              <span className="title">{nextPage.title}</span>
                            </button>
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

      {showEditReq ? (
        <div className="cw-modal-backdrop">
          <div
            className="cw-modal"
            role="dialog"
            aria-labelledby="cw-edit-req-title"
          >
            <h2 id="cw-edit-req-title">申请编辑权限</h2>
            <Input
              className="cw-modal-input"
              value={editReason}
              onChange={(v) => setEditReason(String(v))}
              placeholder="申请理由"
            />
            <div className="cw-modal-actions">
              <Button variant="outline" onClick={() => setShowEditReq(false)}>
                取消
              </Button>
              <Button theme="primary" onClick={() => void onRequestEdit()}>
                提交
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
