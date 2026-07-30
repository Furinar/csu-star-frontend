import { service } from "@/lib/request";

export type CompassFeedTab = "recent" | "hot";
export type CompassContentType =
  | "all"
  | "essay"
  | "collection"
  | "guide"
  | "major"
  | "course";

export interface CompassFeedItem {
  kind: string;
  id: string;
  page_id: string;
  title: string;
  summary: string;
  owner_id: string;
  space_key: string;
  collection_id?: string | null;
  course_id?: string | null;
  published_at: string;
  hot_score: number;
  view_count: number;
  comment_count: number;
}

export interface CompassPage {
  id: string;
  space_key: string;
  parent_id?: string | null;
  owner_id: string;
  collection_id?: string | null;
  course_id?: string | null;
  content_type: string;
  title: string;
  body: string;
  sort_order: number;
  view_count: number;
  comment_count: number;
  edit_count: number;
  hot_score: number;
  published_at: string;
  updated_at: string;
}

export interface CompassTreeNode {
  id: string;
  title: string;
  parent_id?: string | null;
  children?: CompassTreeNode[];
}

export interface CompassHistoryItem {
  id: string;
  page_id: string;
  editor_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface CompassComment {
  id: string;
  page_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface CompassCollection {
  id: string;
  owner_id: string;
  root_page_id: string;
  title: string;
  description: string;
  cover_url: string;
  published_at: string;
}

export interface AuthorStatus {
  is_author: boolean;
  latest_application?: {
    id: string;
    status: string;
    reason: string;
  } | null;
}

type ApiEnvelope<T> = { code: number; msg?: string; message?: string; data: T };

/**
 * request interceptor already returns response.data (the {code,msg,data} envelope).
 * Do NOT do res.data.data — that drops the payload and breaks all reads.
 */
function unwrapCompass<T>(response: unknown, fallbackMsg: string): T {
  const payload =
    response &&
    typeof response === "object" &&
    "status" in response &&
    "data" in response
      ? (response as { data: ApiEnvelope<T> }).data
      : (response as ApiEnvelope<T>);
  if (!payload || typeof payload !== "object") {
    throw new Error(fallbackMsg);
  }
  if (payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.msg || payload.message || fallbackMsg);
  }
  return payload.data;
}

async function compassGet<T>(url: string, params?: Record<string, string | number | undefined>) {
  const res = await service.get(url, { params });
  return unwrapCompass<T>(res, "指北请求失败");
}

async function compassPost<T>(url: string, body?: unknown) {
  const res = await service.post(url, body);
  return unwrapCompass<T>(res, "指北请求失败");
}

async function compassPatch<T>(url: string, body?: unknown) {
  const res = await service.patch(url, body);
  return unwrapCompass<T>(res, "指北请求失败");
}

export function getCompassFeed(tab: CompassFeedTab, type: CompassContentType = "all", limit = 20) {
  return compassGet<{ items: CompassFeedItem[] }>("/compass/feed", { tab, type, limit });
}

export function getCompassPage(pageId: string) {
  return compassGet<{ page: CompassPage; can_write: boolean }>(`/compass/pages/${pageId}`);
}

export function updateCompassPage(pageId: string, payload: { title?: string; body?: string }) {
  return compassPatch<CompassPage>(`/compass/pages/${pageId}`, payload);
}

export function getCompassHistory(pageId: string) {
  return compassGet<{ items: CompassHistoryItem[] }>(`/compass/pages/${pageId}/history`);
}

export function getCompassComments(pageId: string) {
  return compassGet<{ items: CompassComment[] }>(`/compass/pages/${pageId}/comments`);
}

export function addCompassComment(pageId: string, body: string) {
  return compassPost<CompassComment>(`/compass/pages/${pageId}/comments`, { body });
}

export function getCompassTree(space?: string, rootPageId?: string) {
  return compassGet<{ tree: CompassTreeNode[] }>("/compass/tree", {
    space,
    root_page_id: rootPageId,
  });
}

export function createCompassEssay(payload: {
  title: string;
  body: string;
  collection_id?: string;
  course_id?: string;
  parent_id?: string;
  space_key?: string;
  content_type?: string;
}) {
  // Keep snowflake IDs as decimal strings — Number() loses precision above 2^53-1.
  const body: Record<string, unknown> = {
    title: payload.title,
    body: payload.body,
  };
  if (payload.collection_id) body.collection_id = String(payload.collection_id);
  if (payload.course_id) body.course_id = String(payload.course_id);
  if (payload.parent_id) body.parent_id = String(payload.parent_id);
  if (payload.space_key) body.space_key = payload.space_key;
  if (payload.content_type) body.content_type = payload.content_type;
  return compassPost<CompassPage>("/compass/essays", body);
}

export function createCompassCollection(payload: {
  title: string;
  description?: string;
  cover_url?: string;
}) {
  return compassPost<{ collection: CompassCollection; root_page: CompassPage }>(
    "/compass/collections",
    payload,
  );
}

export function getCompassCollection(id: string) {
  return compassGet<{ collection: CompassCollection; root_page: CompassPage }>(
    `/compass/collections/${id}`,
  );
}

export function applyCompassAuthor(reason: string) {
  return compassPost("/compass/author/apply", { reason });
}

export function getCompassAuthorMe() {
  return compassGet<AuthorStatus>("/compass/author/me");
}

export function requestCompassEdit(pageId: string, reason: string) {
  return compassPost(`/compass/pages/${pageId}/edit-requests`, { reason });
}

export function getCourseCoNoteRoot(courseId: string, title?: string) {
  return compassGet<{ page: CompassPage; page_id: string }>(
    `/compass/courses/${courseId}/root`,
    title ? { title } : undefined,
  );
}

/** Build in-app workbench path for a page (no third-party docs URL). */
export function buildCompassPagePath(pageId: string, opts?: { space?: string; courseId?: string }) {
  const q = new URLSearchParams();
  q.set("id", pageId);
  if (opts?.space) q.set("space", opts.space);
  if (opts?.courseId) q.set("courseId", opts.courseId);
  return `/compass/p?${q.toString()}`;
}

export function buildCourseCoNotePath(courseId: string) {
  return `/compass/space?key=courses&courseId=${encodeURIComponent(courseId)}`;
}

export function buildCompassSpacePath(spaceKey: string) {
  return `/compass/space?key=${encodeURIComponent(spaceKey)}`;
}

export function buildCompassCollectionPath(collectionId: string) {
  return `/compass/collection?id=${encodeURIComponent(collectionId)}`;
}
