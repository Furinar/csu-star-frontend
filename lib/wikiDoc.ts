import {
  WIKI_MAJOR_DOC_ORDER,
  WIKI_MAJOR_GROUP_ORDER,
  WIKI_MAJOR_ROOT_DOC_TITLES,
} from "../data/wikiMajorOrder.mjs";
import type {
  WikiDocMeta,
  WikiGroup,
  WikiSectionKey,
  WikiSectionNode,
  WikiTree,
} from "@/types/wiki";

/** 历史/快照学院名 → majorList 规范名（仅用于排序对齐） */
const MAJOR_GROUP_NAME_ALIASES: Record<string, string> = {
  文学与新闻传播学院: "人文学院",
  基础医学院: "湘雅基础医学院",
  物理与电子学院: "物理学院",
  湘雅基础医学院: "湘雅基础医学院",
};

/**
 * 板块根文档标题别名（专业/指南简介）。
 * 这些文档必须始终排在学院分组之前，不能进 category。
 */
const ROOT_INTRO_TITLES = new Set<string>([
  ...(WIKI_MAJOR_ROOT_DOC_TITLES as readonly string[]),
  "专业简介",
  "专业指北简介",
  "指南简介",
]);

function isRootIntroTitle(title: string): boolean {
  return ROOT_INTRO_TITLES.has(title.trim());
}

function majorGroupOrderIndex(name: string): number {
  const canonical = MAJOR_GROUP_NAME_ALIASES[name] ?? name;
  const idx = (WIKI_MAJOR_GROUP_ORDER as readonly string[]).indexOf(canonical);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function sortByTitleOrder(
  docs: WikiDocMeta[],
  titleOrder: readonly string[] | undefined,
): WikiDocMeta[] {
  if (!titleOrder?.length) return docs;
  const rank = new Map(titleOrder.map((t, i) => [t, i]));
  return [...docs].sort((a, b) => {
    const ra = rank.get(a.title) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.title) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

/**
 * 展示序：规范化 docs/categories 内部序。
 * major 用 majorList；其它用 sort_order。
 * 硬约束：简介类根文档永远排在 docs 数组最前。
 */
export function orderWikiSectionForDisplay(
  section: WikiSectionNode,
): WikiSectionNode {
  // 若简介误挂在学院下：提升到板块根 docs，并从分组中剔除
  const hoisted: WikiDocMeta[] = [];
  const categoriesStripped = section.categories.map((g) => {
    const keep: WikiDocMeta[] = [];
    for (const d of g.docs) {
      if (isRootIntroTitle(d.title)) hoisted.push(d);
      else keep.push(d);
    }
    return { ...g, docs: keep };
  });
  const rootDocs = [...section.docs, ...hoisted];
  // 同 id 去重（根与误挂各一份时）
  const seen = new Set<string>();
  const uniqueRoots = rootDocs.filter((d) => {
    const k = String(d.id ?? d.slug);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (section.key === "major") {
    const rootRank = new Map(
      (WIKI_MAJOR_ROOT_DOC_TITLES as readonly string[]).map((t, i) => [t, i]),
    );
    const docs = [...uniqueRoots].sort((a, b) => {
      const aIntro = isRootIntroTitle(a.title);
      const bIntro = isRootIntroTitle(b.title);
      if (aIntro !== bIntro) return aIntro ? -1 : 1;
      const ra = rootRank.get(a.title) ?? Number.MAX_SAFE_INTEGER;
      const rb = rootRank.get(b.title) ?? Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    const categories = [...categoriesStripped]
      .map((g) => {
        const canonical = MAJOR_GROUP_NAME_ALIASES[g.name] ?? g.name;
        const orderedDocs = sortByTitleOrder(
          g.docs,
          WIKI_MAJOR_DOC_ORDER[canonical],
        );
        return { ...g, docs: orderedDocs };
      })
      .sort((a, b) => {
        const d = majorGroupOrderIndex(a.name) - majorGroupOrderIndex(b.name);
        if (d !== 0) return d;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    return { ...section, docs, categories };
  }

  // 非 major：简介类靠前，其余按 sort_order
  const docs = [...uniqueRoots].sort((a, b) => {
    const aIntro = isRootIntroTitle(a.title);
    const bIntro = isRootIntroTitle(b.title);
    if (aIntro !== bIntro) return aIntro ? -1 : 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  const categories = [...categoriesStripped]
    .map((g) => ({
      ...g,
      docs: [...g.docs].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return { ...section, docs, categories };
}

/** 侧栏一级统一序列：根文档 | 可折叠分组 */
export type WikiPrimaryItem =
  | { type: "doc"; sort: number; doc: WikiDocMeta }
  | { type: "group"; sort: number; group: WikiGroup };

/**
 * 统一一级列表。
 * 硬约束：先全部根文档、再全部分组，永不交叉排序。
 * 学院/分组永远不能排到简介等根文档前面（不依赖 sort_order 数值）。
 */
export function buildWikiPrimaryItems(
  section: WikiSectionNode,
): WikiPrimaryItem[] {
  const ordered = orderWikiSectionForDisplay(section);
  const items: WikiPrimaryItem[] = [];

  // 1) 所有根文档（简介等）
  ordered.docs.forEach((doc, i) => {
    items.push({ type: "doc", sort: i, doc });
  });

  // 2) 所有学院/分组（接在根文档之后）
  const groupBase = ordered.docs.length;
  ordered.categories.forEach((group, i) => {
    items.push({ type: "group", sort: groupBase + i, group });
  });

  return items;
}

export type FlatWikiDoc = {
  section: WikiSectionKey;
  id: string | number;
  slug: string;
  title: string;
};

function includesQuery(text: string, q: string): boolean {
  return text.toLowerCase().includes(q);
}

function filterDocsByQuery(docs: WikiDocMeta[], q: string): WikiDocMeta[] {
  if (!q) return docs;
  return docs.filter((doc) => includesQuery(doc.title, q));
}

/**
 * 按关键词过滤目录树：匹配文档标题或学院名。
 * 学院名命中时保留该学院下全部专业；仅专业命中时只保留命中专业。
 */
export function filterWikiTree(tree: WikiTree, query: string): WikiTree {
  const q = query.trim().toLowerCase();
  if (!q) return tree;

  const sections = tree.sections
    .map((sec): WikiSectionNode | null => {
      const docs = filterDocsByQuery(sec.docs, q);
      const categories = sec.categories
        .map((group): WikiGroup | null => {
          if (includesQuery(group.name, q)) {
            return {
              ...group,
              docCount: group.docs.length,
              docs: group.docs,
            };
          }
          const matchedDocs = filterDocsByQuery(group.docs, q);
          if (matchedDocs.length === 0) return null;
          return {
            ...group,
            docCount: matchedDocs.length,
            docs: matchedDocs,
          };
        })
        .filter((g): g is WikiGroup => g != null);

      if (docs.length === 0 && categories.length === 0) return null;

      const categoryDocCount = categories.reduce(
        (sum, g) => sum + g.docs.length,
        0,
      );
      return {
        ...sec,
        docs,
        categories,
        docCount: docs.length + categoryDocCount,
        categoryCount: categories.length,
      };
    })
    .filter((s): s is WikiSectionNode => s != null);

  return { sections };
}

/** 门户统计：指南数 / 学院数 / 专业数 */
export function summarizeWikiTree(tree: WikiTree | null | undefined): {
  guideCount: number;
  collegeCount: number;
  majorCount: number;
} {
  if (!tree) {
    return { guideCount: 0, collegeCount: 0, majorCount: 0 };
  }
  let guideCount = 0;
  let collegeCount = 0;
  let majorCount = 0;
  for (const sec of tree.sections) {
    if (sec.allowCategories || sec.categories.length > 0) {
      collegeCount += sec.categories.length;
      majorCount += sec.categories.reduce(
        (sum, g) => sum + g.docs.length,
        0,
      );
      majorCount += sec.docs.length;
    } else {
      guideCount += sec.docs.length;
    }
  }
  return { guideCount, collegeCount, majorCount };
}

/** 单板块扁平序：按统一一级序列（根文档 → 各分组文档，不跨板块） */
export function flattenSection(node: WikiSectionNode): FlatWikiDoc[] {
  const primary = buildWikiPrimaryItems(node);
  const out: FlatWikiDoc[] = [];
  for (const item of primary) {
    if (item.type === "doc") {
      out.push({ section: node.key, ...item.doc });
    } else {
      for (const doc of item.group.docs) {
        out.push({ section: node.key, ...doc });
      }
    }
  }
  return out;
}

/** @deprecated 跨板块扁平；请用 flattenSection */
export function flattenWikiTree(tree: WikiTree): FlatWikiDoc[] {
  return tree.sections.flatMap((sec) => flattenSection(sec));
}

/** 当前板块内上一篇 / 下一篇 */
export function resolveAdjacentWikiDocs(
  sectionNode: WikiSectionNode | null | undefined,
  slug: string,
): { prevDoc: FlatWikiDoc | null; nextDoc: FlatWikiDoc | null } {
  if (!sectionNode) return { prevDoc: null, nextDoc: null };
  const flat = flattenSection(sectionNode);
  const index = flat.findIndex((item) => item.slug === slug);
  if (index === -1) return { prevDoc: null, nextDoc: null };
  return {
    prevDoc: index > 0 ? flat[index - 1] : null,
    nextDoc: index < flat.length - 1 ? flat[index + 1] : null,
  };
}

/** 当前文档所在分组 id（用于默认展开学院） */
export function findActiveGroupId(
  sectionNode: WikiSectionNode | null | undefined,
  slug: string,
): string | undefined {
  if (!sectionNode) return undefined;
  return sectionNode.categories.find((group) =>
    group.docs.some((doc) => doc.slug === slug),
  )?.id;
}

/** @deprecated 使用 findActiveGroupId */
export function findActiveMajorGroupId(
  tree: WikiTree,
  section: WikiSectionKey,
  slug: string,
): string | undefined {
  const node = tree.sections.find((s) => s.key === section);
  return findActiveGroupId(node, slug);
}

/** 切换折叠组开合状态（不可变） */
export function toggleOpenGroup(
  openGroups: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(openGroups);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** 保证 active 分组在 open 集合中 */
export function ensureActiveGroupOpen(
  openGroups: ReadonlySet<string>,
  activeGroupId: string | undefined,
): Set<string> {
  if (!activeGroupId || openGroups.has(activeGroupId)) {
    return new Set(openGroups);
  }
  const next = new Set(openGroups);
  next.add(activeGroupId);
  return next;
}

/**
 * majorList 默认 collapsed:false → 全部展开，并保证当前学院打开。
 * 对齐 help.csustar.wiki major 侧栏初始态。
 */
export function initialOpenMajorGroups(
  groupIds: readonly string[],
  activeGroupId: string | undefined,
): Set<string> {
  return ensureActiveGroupOpen(new Set(groupIds), activeGroupId);
}

export type OutlineHeadingInput = {
  id: string;
  text: string;
  tagName: string;
};

export type OutlineItem = {
  id: string;
  text: string;
  level: number;
};

/** 对齐官方 VP 嵌套大纲：h2 节点下挂 h3 children */
export type OutlineNode = OutlineItem & {
  children: OutlineNode[];
};

/**
 * 扁平大纲（兼容旧测试 / 简单列表）。
 * 仅 h2/h3 且必须有 id。
 */
export function buildWikiOutline(
  headings: OutlineHeadingInput[],
): OutlineItem[] {
  return flattenOutlineTree(buildWikiOutlineTree(headings));
}

/**
 * 树形大纲（官方「站点配置」页：h2 → nested h3）。
 * 孤儿 h3（其前无 h2）提升为根节点。
 */
export function buildWikiOutlineTree(
  headings: OutlineHeadingInput[],
): OutlineNode[] {
  const roots: OutlineNode[] = [];
  let currentH2: OutlineNode | null = null;

  for (const h of headings) {
    if (!h.id) continue;
    if (h.tagName === "H2") {
      currentH2 = {
        id: h.id,
        text: h.text,
        level: 2,
        children: [],
      };
      roots.push(currentH2);
      continue;
    }
    if (h.tagName === "H3") {
      const node: OutlineNode = {
        id: h.id,
        text: h.text,
        level: 3,
        children: [],
      };
      if (currentH2) currentH2.children.push(node);
      else roots.push(node);
    }
  }
  return roots;
}

export function flattenOutlineTree(nodes: OutlineNode[]): OutlineItem[] {
  const out: OutlineItem[] = [];
  for (const node of nodes) {
    out.push({ id: node.id, text: node.text, level: node.level });
    if (node.children.length > 0) {
      out.push(...flattenOutlineTree(node.children));
    }
  }
  return out;
}

function readHeadingsFromContainer(
  container: ParentNode | null,
): OutlineHeadingInput[] {
  if (!container) return [];
  const headings = Array.from(container.querySelectorAll("h2, h3")).filter(
    (el): el is HTMLElement => Boolean((el as HTMLElement).id),
  );
  return headings.map((el) => {
    // 去掉 header-anchor 文本，避免大纲出现 “​”
    let text = el.textContent ?? "";
    if (typeof el.cloneNode === "function") {
      const clone = el.cloneNode(true) as HTMLElement;
      if (typeof clone.querySelectorAll === "function") {
        clone.querySelectorAll(".header-anchor").forEach((a) => a.remove());
      }
      text = clone.textContent ?? "";
    }
    return {
      id: el.id,
      text: text.trim(),
      tagName: el.tagName,
    };
  });
}

/** 从 DOM 容器提取扁平大纲 */
export function extractWikiOutlineFromContainer(
  container: ParentNode | null,
): OutlineItem[] {
  return buildWikiOutline(readHeadingsFromContainer(container));
}

/** 从 DOM 容器提取树形大纲（TOC / LocalNav 下拉） */
export function extractWikiOutlineTreeFromContainer(
  container: ParentNode | null,
): OutlineNode[] {
  return buildWikiOutlineTree(readHeadingsFromContainer(container));
}

/** 标题 id（page 注入 h1 与 header-anchor 共用） */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
