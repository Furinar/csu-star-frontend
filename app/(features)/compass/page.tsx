"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Empty, Input, Tabs, Tag } from "tdesign-react";
import {
  applyCompassAuthor,
  buildCompassCollectionPath,
  buildCompassPagePath,
  buildCompassSpacePath,
  createCompassCollection,
  createCompassEssay,
  getCompassAuthorMe,
  getCompassFeed,
  type AuthorStatus,
  type CompassContentType,
  type CompassFeedItem,
  type CompassFeedTab,
} from "@/api/compass";
import { PageLoading } from "@/components/ui/AsyncState";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";

const TYPE_FILTERS: { key: CompassContentType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "essay", label: "随笔" },
  { key: "collection", label: "合集" },
  { key: "guide", label: "指南" },
  { key: "major", label: "专业" },
  { key: "course", label: "课程" },
];

function kindLabel(kind: string) {
  switch (kind) {
    case "essay":
      return "随笔";
    case "collection":
      return "合集";
    case "guide":
      return "指南";
    case "major":
      return "专业";
    case "course":
      return "共笔";
    default:
      return kind;
  }
}

function FeedCard({ item }: { item: CompassFeedItem }) {
  const href =
    item.kind === "collection"
      ? buildCompassCollectionPath(item.id)
      : buildCompassPagePath(item.page_id, { space: item.space_key });
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white/50 p-4 transition hover:bg-white/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Tag size="small" theme="primary" variant="light">
              {kindLabel(item.kind)}
            </Tag>
            {item.course_id ? (
              <span className="text-xs text-gray-400">课 {item.course_id}</span>
            ) : null}
          </div>
          <h3 className="truncate text-base font-semibold text-gray-900">{item.title}</h3>
          {item.summary ? (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.summary}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right text-xs text-gray-400">
          <div>热度 {Math.round(item.hot_score)}</div>
          <div className="mt-1">{item.view_count} 阅读</div>
        </div>
      </div>
    </Link>
  );
}

export default function CompassPlazaPage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const isAuthenticated = Boolean(useAuthStore((s) => s.access_token));
  const [tab, setTab] = useState<CompassFeedTab>("recent");
  const [type, setType] = useState<CompassContentType>("all");
  const [items, setItems] = useState<CompassFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [author, setAuthor] = useState<AuthorStatus | null>(null);
  const [applyReason, setApplyReason] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [showNewCol, setShowNewCol] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeBody, setWriteBody] = useState("");
  const [colTitle, setColTitle] = useState("");
  const [colDesc, setColDesc] = useState("");

  const loadFeed = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getCompassFeed(tab, type, 30);
      setItems(data.items || []);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tab, type]);

  const loadAuthor = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const me = await getCompassAuthorMe();
      setAuthor(me);
    } catch {
      setAuthor(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hasMounted) return;
    void loadFeed();
    void loadAuthor();
  }, [hasMounted, loadFeed, loadAuthor]);

  const onApplyAuthor = async () => {
    try {
      await applyCompassAuthor(applyReason.trim() || "希望参与指北共建");
      feedback.success({ title: "已提交作者申请", description: "请等待审核员通过" });
      setShowApply(false);
      setApplyReason("");
      await loadAuthor();
    } catch (e: unknown) {
      feedback.error({
        title: "申请失败",
        description: e instanceof Error ? e.message : "请稍后重试",
      });
    }
  };

  const onWriteEssay = async () => {
    try {
      const page = await createCompassEssay({
        title: writeTitle.trim(),
        body: writeBody,
      });
      feedback.success({ title: "随笔已发布" });
      setShowWrite(false);
      setWriteTitle("");
      setWriteBody("");
      router.push(buildCompassPagePath(page.id, { space: page.space_key }));
    } catch (e: unknown) {
      feedback.error({
        title: "发布失败",
        description: e instanceof Error ? e.message : "需要作者身份",
      });
    }
  };

  const onCreateCollection = async () => {
    try {
      const data = await createCompassCollection({
        title: colTitle.trim(),
        description: colDesc,
      });
      feedback.success({ title: "合集已创建" });
      setShowNewCol(false);
      router.push(buildCompassCollectionPath(data.collection.id));
    } catch (e: unknown) {
      feedback.error({
        title: "创建失败",
        description: e instanceof Error ? e.message : "需要作者身份",
      });
    }
  };

  if (!hasMounted) {
    return <PageLoading text="加载指北…" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="container flex flex-col items-center gap-6 pb-16 pt-10 text-center sm:pt-14">
        <h1 className="hero-gradient-text text-3xl font-bold sm:text-4xl">中南指北 · 知识广场</h1>
        <p className="max-w-lg text-sm text-gray-600 sm:text-base">
          随笔、合集、生存指南、专业百科与课程共笔。登录后即可浏览与参与共建。
        </p>
        <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
          {[
            { t: "随笔与合集", d: "作者自由创作与连载" },
            { t: "生存指南", d: "选课绩点等结构化经验" },
            { t: "课程共笔", d: "从课程页进入协作笔记" },
          ].map((x) => (
            <div key={x.t} className="rounded-xl bg-white/40 px-3 py-4">
              <div className="font-semibold text-gray-800">{x.t}</div>
              <div className="mt-1 text-xs text-gray-500">{x.d}</div>
            </div>
          ))}
        </div>
        <Button theme="primary" size="large" onClick={() => router.push("/login")}>
          登录后进入广场
        </Button>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-6 pb-16 pt-4 sm:gap-8 sm:pt-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="hero-gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
            知识广场
          </h1>
          <p className="mt-1 text-sm text-gray-500">最近发布 · 最热 · 随笔与合集</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {author?.is_author ? (
            <>
              <Button theme="primary" onClick={() => setShowWrite(true)}>
                写随笔
              </Button>
              <Button variant="outline" onClick={() => setShowNewCol(true)}>
                新建合集
              </Button>
            </>
          ) : (
            <Button theme="primary" variant="outline" onClick={() => setShowApply(true)}>
              申请成为作者
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push("/compass/me")}>
            我的
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href={buildCompassSpacePath("guides")}
          className="rounded-2xl bg-sky-50/70 px-4 py-4 transition hover:bg-sky-100/80"
        >
          <div className="font-semibold text-sky-900">生存指南</div>
          <div className="mt-1 text-xs text-sky-700/80">选课 · 绩点 · 科研</div>
        </Link>
        <Link
          href={buildCompassSpacePath("majors")}
          className="rounded-2xl bg-violet-50/70 px-4 py-4 transition hover:bg-violet-100/80"
        >
          <div className="font-semibold text-violet-900">专业百科</div>
          <div className="mt-1 text-xs text-violet-700/80">按学院浏览专业经验</div>
        </Link>
        <Link
          href="/course"
          className="rounded-2xl bg-amber-50/70 px-4 py-4 transition hover:bg-amber-100/80"
        >
          <div className="font-semibold text-amber-900">课程共笔</div>
          <div className="mt-1 text-xs text-amber-700/80">从课程详情进入全屏共笔</div>
        </Link>
      </div>

      <div>
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as CompassFeedTab)}
          list={[
            { label: "最近发布", value: "recent" },
            { label: "最热", value: "hot" },
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="small"
              variant={type === f.key ? "base" : "outline"}
              theme={type === f.key ? "primary" : "default"}
              onClick={() => setType(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoading text="加载动态…" />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Empty title="加载失败" description="请检查登录状态或稍后重试" />
          <Button onClick={() => void loadFeed()}>重试</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-10">
          <Empty title="暂无内容" description="成为作者后发布第一篇随笔吧" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      {showApply ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">申请成为作者</h2>
            <p className="mt-1 text-sm text-gray-500">审核通过后可写随笔与建合集</p>
            <Input
              className="mt-4"
              value={applyReason}
              onChange={(v) => setApplyReason(String(v))}
              placeholder="申请理由"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApply(false)}>
                取消
              </Button>
              <Button theme="primary" onClick={() => void onApplyAuthor()}>
                提交
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showWrite ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">写随笔</h2>
            <Input
              className="mt-4"
              value={writeTitle}
              onChange={(v) => setWriteTitle(String(v))}
              placeholder="标题"
            />
            <textarea
              className="mt-3 min-h-[160px] w-full rounded-lg border border-gray-200 p-3 text-sm"
              value={writeBody}
              onChange={(e) => setWriteBody(e.target.value)}
              placeholder="正文（发布后即时可见，编辑免审）"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowWrite(false)}>
                取消
              </Button>
              <Button theme="primary" onClick={() => void onWriteEssay()}>
                发布
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showNewCol ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">新建合集</h2>
            <Input
              className="mt-4"
              value={colTitle}
              onChange={(v) => setColTitle(String(v))}
              placeholder="合集标题"
            />
            <Input
              className="mt-3"
              value={colDesc}
              onChange={(v) => setColDesc(String(v))}
              placeholder="简介（可选）"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCol(false)}>
                取消
              </Button>
              <Button theme="primary" onClick={() => void onCreateCollection()}>
                创建
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
