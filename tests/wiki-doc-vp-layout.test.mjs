/**
 * VitePress 文档页复刻：驱动 shipped lib/wikiDoc.ts + 源码结构对照。
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import "./register-ts-path-alias.mjs";
import {
  buildWikiOutline,
  buildWikiOutlineTree,
  ensureActiveGroupOpen,
  extractWikiOutlineFromContainer,
  extractWikiOutlineTreeFromContainer,
  filterWikiTree,
  findActiveGroupId,
  flattenSection,
  flattenWikiTree,
  initialOpenMajorGroups,
  resolveAdjacentWikiDocs,
  slugifyHeading,
  summarizeWikiTree,
  toggleOpenGroup,
} from "../lib/wikiDoc.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WIKI_DIST_CSS = join(
  ROOT,
  "..",
  "csu-star-wiki/docs/.vitepress/dist/assets/style.kTW3RH_y.css",
);

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

const compassSection = {
  key: "compass",
  title: "入坑指南",
  allowCategories: false,
  docs: [
    { id: 1, slug: "intro", title: "简介" },
    { id: 2, slug: "club", title: "社团篇" },
  ],
  categories: [],
};

const majorSection = {
  key: "major",
  title: "专业指北",
  allowCategories: true,
  docs: [{ id: 3, slug: "major-intro", title: "专业指北简介" }],
  categories: [
    {
      id: "cs",
      name: "计算机学院",
      docs: [
        { id: 10, slug: "ds", title: "数据科学与大数据技术" },
        { id: 11, slug: "se", title: "软件工程" },
      ],
    },
    {
      id: "math",
      name: "数学学院",
      docs: [{ id: 20, slug: "math-app", title: "数学与应用数学" }],
    },
  ],
};

const sampleTree = { sections: [compassSection, majorSection] };

test("flattenSection stays within one section", () => {
  assert.deepEqual(
    flattenSection(compassSection).map((d) => `${d.section}:${d.slug}`),
    ["compass:intro", "compass:club"],
  );
  assert.deepEqual(
    flattenSection(majorSection).map((d) => `${d.section}:${d.slug}`),
    ["major:major-intro", "major:ds", "major:se", "major:math-app"],
  );
  // 全树扁平仅用于兼容，仍分段拼接
  assert.equal(flattenWikiTree(sampleTree).length, 6);
});

test("resolveAdjacentWikiDocs stays inside one section (no cross-section)", () => {
  const mid = resolveAdjacentWikiDocs(majorSection, "ds");
  assert.equal(mid.prevDoc?.slug, "major-intro");
  assert.equal(mid.nextDoc?.slug, "se");
  // 不会跳到 compass
  assert.notEqual(mid.prevDoc?.section, "compass");

  const first = resolveAdjacentWikiDocs(compassSection, "intro");
  assert.equal(first.prevDoc, null);
  assert.equal(first.nextDoc?.slug, "club");

  const last = resolveAdjacentWikiDocs(majorSection, "math-app");
  assert.equal(last.nextDoc, null);
  assert.equal(last.prevDoc?.slug, "se");

  assert.deepEqual(resolveAdjacentWikiDocs(majorSection, "nope"), {
    prevDoc: null,
    nextDoc: null,
  });
  assert.deepEqual(resolveAdjacentWikiDocs(null, "ds"), {
    prevDoc: null,
    nextDoc: null,
  });
});

test("findActiveGroupId / open-group helpers drive sidebar expand", () => {
  assert.equal(findActiveGroupId(majorSection, "se"), "cs");
  assert.equal(findActiveGroupId(compassSection, "intro"), undefined);

  const opened = ensureActiveGroupOpen(new Set(["math"]), "cs");
  assert.equal(opened.has("cs"), true);
  assert.equal(opened.has("math"), true);

  const toggled = toggleOpenGroup(opened, "cs");
  assert.equal(toggled.has("cs"), false);
  assert.equal(toggled.has("math"), true);

  const all = initialOpenMajorGroups(["cs", "math"], "math");
  assert.equal(all.has("cs"), true);
  assert.equal(all.has("math"), true);
});

test("buildWikiOutline / extractWikiOutlineFromContainer only take h2/h3 with id", () => {
  const items = buildWikiOutline([
    { id: "a", text: "A", tagName: "H2" },
    { id: "b", text: "B", tagName: "H3" },
    { id: "", text: "skip", tagName: "H2" },
    { id: "c", text: "C", tagName: "H4" },
  ]);
  assert.deepEqual(items, [
    { id: "a", text: "A", level: 2 },
    { id: "b", text: "B", level: 3 },
  ]);

  // Lightweight container mock: drives the real querySelectorAll path in
  // extractWikiOutlineFromContainer without adding a DOM dependency.
  const nodes = [
    { id: "t", tagName: "H1", textContent: "Title" },
    { id: "sec-1", tagName: "H2", textContent: "Section 1" },
    { id: "sec-1-1", tagName: "H3", textContent: "Nested" },
    { id: "", tagName: "H2", textContent: "No id" },
    { id: "skip", tagName: "H4", textContent: "Skip" },
  ];
  const container = {
    querySelectorAll(selector) {
      assert.equal(selector, "h2, h3");
      return nodes.filter((n) => n.tagName === "H2" || n.tagName === "H3");
    },
  };
  const outline = extractWikiOutlineFromContainer(container);
  assert.deepEqual(outline, [
    { id: "sec-1", text: "Section 1", level: 2 },
    { id: "sec-1-1", text: "Nested", level: 3 },
  ]);
  assert.deepEqual(extractWikiOutlineFromContainer(null), []);
});

test("buildWikiOutlineTree nests h3 under preceding h2 (official config page)", () => {
  const tree = buildWikiOutlineTree([
    { id: "overview", text: "概览", tagName: "H2" },
    { id: "resolve", text: "配置解析", tagName: "H3" },
    { id: "intel", text: "配置智能提示", tagName: "H3" },
    { id: "meta", text: "站点元数据", tagName: "H2" },
    { id: "title", text: "title", tagName: "H3" },
    { id: "orphan", text: "孤儿", tagName: "H3" }, // after h2 meta — under meta
  ]);
  // re-run with orphan before any h2
  const withOrphan = buildWikiOutlineTree([
    { id: "orphan", text: "孤儿", tagName: "H3" },
    { id: "overview", text: "概览", tagName: "H2" },
    { id: "resolve", text: "配置解析", tagName: "H3" },
  ]);
  assert.equal(withOrphan[0].id, "orphan");
  assert.equal(withOrphan[0].level, 3);
  assert.equal(withOrphan[1].id, "overview");
  assert.deepEqual(
    withOrphan[1].children.map((c) => c.id),
    ["resolve"],
  );

  assert.equal(tree[0].id, "overview");
  assert.deepEqual(
    tree[0].children.map((c) => c.text),
    ["配置解析", "配置智能提示"],
  );
  assert.equal(tree[1].id, "meta");
  assert.deepEqual(
    tree[1].children.map((c) => c.id),
    ["title", "orphan"],
  );

  const fromDom = extractWikiOutlineTreeFromContainer({
    querySelectorAll() {
      return [
        { id: "a", tagName: "H2", textContent: "A" },
        { id: "b", tagName: "H3", textContent: "B" },
      ];
    },
  });
  assert.equal(fromDom[0].children[0].id, "b");
  assert.equal(slugifyHeading("数据科学 与 大数据"), "数据科学-与-大数据");
});

test("doc page ships VP three-column skeleton without GlassCard/breadcrumb", () => {
  const page = read("app/(features)/compass/doc/page.tsx");
  assert.match(page, /wiki-doc-shell/);
  // 混合顶栏：主站 NavBar 在 layout；文档页不再叠第二套 VPNav
  assert.match(page, /has-main-nav/);
  assert.doesNotMatch(page, /VPNavBarMenu/);
  assert.match(page, /VPLocalNav/);
  assert.match(page, /VPLocalNavOutlineDropdown/);
  assert.match(page, /aside-curtain/);
  assert.match(page, /className="curtain"/);
  assert.match(page, /header-anchor/);
  assert.match(page, /VPSidebar/);
  assert.match(page, /VPContent has-sidebar/);
  assert.match(page, /VPDoc has-sidebar has-aside/);
  assert.match(page, /className="aside"/);
  assert.match(page, /aside-container/);
  assert.match(page, /vp-doc/);
  assert.match(page, /VPDocFooter/);
  assert.match(page, /pager-link/);
  assert.match(page, /prev-next/);
  assert.match(page, /VPLastUpdated/);
  assert.match(page, /<time/);
  assert.match(page, /formatDateTimeZh/);
  assert.match(page, /resolveAdjacentWikiDocs/);
  assert.doesNotMatch(page, /GlassCard/);
  assert.doesNotMatch(page, /PageBreadcrumbs/);
  assert.doesNotMatch(page, /breadcrumb/i);
});

test("layout always shows main NavBar (hybrid tabbar with wiki chrome)", () => {
  const layout = read("app/(features)/layout.tsx");
  assert.match(layout, /NavBar/);
  assert.doesNotMatch(layout, /hideMainNav/);
  assert.doesNotMatch(layout, /isWikiDocPage/);
  const nav = read("components/layout/NavBar.tsx");
  assert.match(nav, /CSU Wiki/);
  assert.match(nav, /isWikiChromePath|\/compass\/doc/);
  assert.match(nav, /FEATURE_ROUTE_NAV_ITEMS/);
});

test("sidebar uses unified primary list with open/collapsed dividers", () => {
  const sidebar = read("app/(features)/compass/components/WikiSidebar.tsx");
  assert.match(sidebar, /indicator/);
  assert.match(sidebar, /collapsed/);
  assert.match(sidebar, /is-active/);
  assert.match(sidebar, /findActiveGroupId/);
  assert.match(sidebar, /initialOpenMajorGroups/);
  assert.match(sidebar, /toggleOpenGroup/);
  assert.match(sidebar, /buildWikiPrimaryItems/);
  assert.match(sidebar, /section: WikiSectionNode/);
  assert.match(sidebar, /is-leaf/);
  assert.match(sidebar, /is-branch/);
  assert.match(sidebar, /is-open/);
  assert.match(sidebar, /is-collapsed/);
  assert.match(sidebar, /level-0 collapsible/);
  assert.match(sidebar, /level=\{0\}/);
  assert.match(sidebar, /level=\{1\}/);
  assert.match(sidebar, /items-inner/);
  assert.match(sidebar, /vpi-chevron-right/);
  assert.match(sidebar, /SidebarActiveMarker/);
  assert.doesNotMatch(sidebar, /▸/);
  assert.doesNotMatch(sidebar, />入坑指南</);
  assert.doesNotMatch(sidebar, />专业指北</);
  const marker = read(
    "app/(features)/compass/components/SidebarActiveMarker.tsx",
  );
  assert.match(marker, /cubic-bezier|is-motion/);
  const css = read("app/styles/wiki.css");
  assert.match(css, /sidebar-active-marker/);
  assert.match(css, /cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
});

test("toc label is 页面导航 and uses nested outline tree", () => {
  const toc = read("app/(features)/compass/components/WikiToc.tsx");
  assert.match(toc, /页面导航/);
  assert.match(toc, /outline-marker/);
  assert.match(toc, /extractWikiOutlineTreeFromContainer/);
  assert.match(toc, /VPDocAsideOutline/);
  assert.match(toc, /VPDocOutlineItem nested/);
});

test("MarkdownArticle ships header-anchor, external icon, code shell", () => {
  const md = read("app/(features)/compass/components/MarkdownArticle.tsx");
  assert.match(md, /header-anchor/);
  assert.match(md, /vp-external-link-icon/);
  assert.match(md, /language-\$\{lang/);
  assert.match(md, /className=\{`copy\$\{copied/);
  assert.match(md, /className="lang"/);
  assert.match(md, /clipboard\.writeText/);
});

test("wiki.css matches VP layout tokens and fixed sidebar pattern", () => {
  const css = read("app/styles/wiki.css");
  assert.match(css, /--vp-sidebar-width:\s*272px/);
  assert.match(css, /--vp-layout-max-width:\s*1440px/);
  // hybrid: nav height tracks main site header (not fixed 64px VPNav)
  assert.match(
    css,
    /--vp-nav-height:\s*calc\(var\(--header-height(?:,\s*3rem)?\)\s*\+\s*1\.5rem\)/,
  );
  assert.match(css, /\.VPSidebar\s*\{[^}]*position:\s*fixed/s);
  assert.match(
    css,
    /\.VPContent\.has-sidebar\s*\{[^}]*padding-left:\s*var\(--vp-sidebar-width\)/s,
  );
  assert.match(css, /aside-container[^}]*width:\s*224px/s);
  assert.match(css, /\.VPDoc\.has-aside \.content-container[^}]*max-width:\s*688px/s);
  assert.match(css, /\.vp-doc h2[^}]*border-top:\s*1px solid var\(--vp-c-divider\)/s);
  assert.match(css, /\.pager-link \.title[^}]*color:\s*var\(--vp-c-brand-1\)/s);
  // 原站 indigo brand，不再绑主站 page-accent
  assert.match(css, /--vp-c-brand-1:\s*var\(--vp-c-indigo-1\)/);
  assert.match(css, /--vp-c-indigo-1:\s*#3451b2/);
  assert.doesNotMatch(css, /--vp-c-brand-1:\s*var\(--page-accent/);
  assert.match(css, /--vp-font-family-base:/);
  assert.match(css, /\.header-anchor/);
  assert.match(css, /aside-curtain/);
  assert.match(css, /\.VPSidebar \.curtain/);
  assert.match(css, /VPLocalNavOutlineDropdown/);
  assert.match(css, /\.VPNavBar/);
  assert.match(css, /div\[class\*="language-"\]/);
  assert.match(css, /button\.copy/);
  assert.match(css, /vp-external-link-icon/);
  assert.match(css, /custom-block/);
  // 树形轨：官方几何 border-left 1px + padding 16px；indicator left -17px / width 2px
  // 本站 level-0.collapsible > .items 必须画杠（学院→专业），禁止 ::before 画轨
  assert.match(
    css,
    /\.VPSidebarItem\.level-0\.collapsible > \.items[^}]*border-left:\s*1px solid var\(--vp-c-divider\)/s,
  );
  assert.match(
    css,
    /\.VPSidebarItem\.level-0\.collapsible > \.items[^}]*padding-left:\s*16px/s,
  );
  assert.match(
    css,
    /\.VPSidebarItem \.indicator[^}]*left:\s*-17px/s,
  );
  assert.match(
    css,
    /\.VPSidebarItem \.indicator[^}]*width:\s*2px/s,
  );
  assert.doesNotMatch(
    css,
    /\.VPSidebarItem\.level-0\.collapsible[^{]*> \.items::before/,
  );
  // collapsed 选择器必须带 level+collapsible，否则 specificity 输给展开 1fr
  assert.match(
    css,
    /\.VPSidebarItem\.level-0\.collapsible\.collapsed > \.items[^}]*grid-template-rows:\s*0fr/s,
  );
  // 展开时不得裁切负 left 的 indicator
  assert.match(
    css,
    /\.VPSidebarItem\.level-0\.collapsible > \.items[^}]*overflow:\s*visible/s,
  );
  // 仅展开分支有分割线；首尾外侧无线；相邻 is-open 去掉双线
  assert.match(css, /\.group\.is-branch\.is-open/);
  assert.match(css, /border-top-color:\s*var\(--vp-c-divider\)/);
  assert.match(css, /\.group\.is-branch\.is-open:first-child/);
  assert.match(css, /\.group\.is-branch\.is-open:last-child/);
  assert.match(
    css,
    /\.group\.is-branch\.is-open \+ \.group\.is-branch\.is-open/,
  );
  // 侧栏落在 Nav（+ 返回栏）下方，滚动条不得穿过 tabbar
  assert.match(css, /\.VPSidebar[^{]*\{[^}]*top:\s*var\(--vp-nav-height\)/s);
  assert.match(
    css,
    /\.has-main-nav \.VPSidebar[^{]*\{[^}]*top:\s*calc\(\s*var\(--vp-nav-height\)\s*\+\s*var\(--wiki-back-bar-height\)/s,
  );
  // 返回栏：左路径 / 右操作
  assert.match(css, /\.wiki-back-bar/);
  assert.match(css, /\.wiki-back-bar-main/);
  assert.match(css, /\.wiki-back-bar-extra[^}]*margin-left:\s*auto/s);
  // LocalNav only fully hides at 1280 (mid-width keeps outline dropdown)
  assert.match(
    css,
    /@media\s*\(min-width:\s*1280px\)\s*\{\s*\.wiki-doc-shell \.VPLocalNav\s*\{\s*display:\s*none/s,
  );
  // active text brand, no soft fill on active link
  assert.match(
    css,
    /\.VPSidebarItem\.level-1\.is-active > \.item \.link > \.text[^}]*color:\s*var\(--vp-c-brand-1\)/s,
  );
  assert.doesNotMatch(
    css,
    /\.is-active[^{]*\{[^}]*background(-color)?:\s*var\(--vp-c-brand-soft\)/s,
  );

  const globals = read("app/globals.css");
  assert.match(globals, /wiki\.css/);
});

/**
 * Global unlayered `.container` (layout.css) sets max-width:1200px + padding 2rem.
 * VP skeleton reuses class name `container`; wiki.css must neutralize it or
 * VPDoc double-pads and gets non-VP width constraints.
 */
test("wiki.css neutralizes global .container on VPDoc and LocalNav", () => {
  const css = read("app/styles/wiki.css");
  const layout = read("app/styles/layout.css");
  // Prove the leak source still exists in the site stylesheet
  assert.match(layout, /\.container\s*\{[^}]*max-width:\s*1200px/s);
  assert.match(layout, /\.container\s*\{[^}]*padding-left:\s*2rem/s);

  // VPDoc container reset
  assert.match(
    css,
    /\.wiki-doc-shell \.VPDoc > \.container\s*\{[^}]*max-width:\s*none/s,
  );
  assert.match(
    css,
    /\.wiki-doc-shell \.VPDoc > \.container\s*\{[^}]*padding-left:\s*0/s,
  );
  assert.match(
    css,
    /\.wiki-doc-shell \.VPDoc > \.container\s*\{[^}]*padding-right:\s*0/s,
  );

  // LocalNav container reset
  assert.match(
    css,
    /\.wiki-doc-shell \.VPLocalNav \.container\s*\{[^}]*max-width:\s*none/s,
  );
  assert.match(
    css,
    /\.wiki-doc-shell \.VPLocalNav \.container\s*\{[^}]*padding-left:\s*0/s,
  );
  assert.match(
    css,
    /\.wiki-doc-shell \.VPLocalNav \.container\s*\{[^}]*padding-right:\s*0/s,
  );

  // Specificity: shell-scoped selectors beat bare `.container`
  assert.match(css, /\.wiki-doc-shell \.VPDoc > \.container/);
  assert.match(css, /\.wiki-doc-shell \.VPLocalNav \.container/);
  // VPNavBar 也有 container，需显式覆盖
  assert.match(css, /\.wiki-doc-shell \.VPNavBar \.container/);
});

test("VP dist CSS still exposes the metrics we ported", () => {
  assert.equal(existsSync(WIKI_DIST_CSS), true, "csu-star-wiki dist CSS missing");
  const vp = readFileSync(WIKI_DIST_CSS, "utf8");
  assert.match(vp, /--vp-sidebar-width:\s*272px/);
  assert.match(vp, /--vp-layout-max-width:\s*1440px/);
  assert.match(vp, /width:224px/);
  assert.match(vp, /max-width:688px/);
});

test("filterWikiTree matches doc title and college name", () => {
  const byDoc = filterWikiTree(sampleTree, "软件");
  assert.equal(byDoc.sections.length, 1);
  assert.equal(byDoc.sections[0].key, "major");
  assert.deepEqual(
    byDoc.sections[0].categories.map((c) => c.name),
    ["计算机学院"],
  );
  assert.deepEqual(
    byDoc.sections[0].categories[0].docs.map((d) => d.slug),
    ["se"],
  );

  const byCollege = filterWikiTree(sampleTree, "数学学院");
  assert.equal(byCollege.sections[0].categories.length, 1);
  assert.equal(byCollege.sections[0].categories[0].docs.length, 1);
  assert.equal(byCollege.sections[0].categories[0].docs[0].slug, "math-app");

  const byGuide = filterWikiTree(sampleTree, "社团");
  assert.equal(byGuide.sections.length, 1);
  assert.equal(byGuide.sections[0].key, "compass");
  assert.equal(byGuide.sections[0].docs[0].slug, "club");

  assert.equal(filterWikiTree(sampleTree, "  ").sections.length, 2);
  assert.equal(filterWikiTree(sampleTree, "不存在的词").sections.length, 0);
});

test("summarizeWikiTree counts guides colleges and majors", () => {
  const full = summarizeWikiTree(sampleTree);
  assert.equal(full.guideCount, 2);
  assert.equal(full.collegeCount, 2);
  // major root docs + category docs
  assert.equal(full.majorCount, 4);

  assert.deepEqual(summarizeWikiTree(null), {
    guideCount: 0,
    collegeCount: 0,
    majorCount: 0,
  });
});

test("buildWikiPrimaryItems keeps 简介 above 计算机学院 even if cats first in data", async () => {
  const { buildWikiPrimaryItems, orderWikiSectionForDisplay } = await import(
    "../lib/wikiDoc.ts"
  );
  const shuffled = {
    key: "major",
    title: "专业指北",
    allowCategories: true,
    docs: [{ id: "1", slug: "intro", title: "简介" }],
    categories: [
      {
        id: "b",
        name: "商学院",
        docs: [
          { id: "20", slug: "acc", title: "会计学" },
          { id: "21", slug: "fin", title: "金融学" },
        ],
      },
      {
        id: "a",
        name: "计算机学院",
        docs: [
          { id: "10", slug: "se", title: "软件工程" },
          { id: "11", slug: "cs", title: "计算机科学与技术" },
        ],
      },
    ],
  };
  const primary = buildWikiPrimaryItems(shuffled);
  assert.equal(primary[0].type, "doc");
  if (primary[0].type === "doc") {
    assert.equal(primary[0].doc.title, "简介");
  }
  assert.equal(primary[1].type, "group");
  if (primary[1].type === "group") {
    assert.equal(primary[1].group.name, "计算机学院");
  }
  // 根文档永远在分组前（结构序，不靠 sort 数值混排）
  assert.ok(primary[0].sort < primary[1].sort);
  const firstGroup = primary.findIndex((i) => i.type === "group");
  const lastDoc = primary.reduce(
    (acc, i, idx) => (i.type === "doc" ? idx : acc),
    -1,
  );
  assert.equal(firstGroup, lastDoc + 1);

  // 简介误挂学院下时：提升为根文档，并从学院文档剔除
  const misparented = {
    key: "major",
    title: "专业指北",
    allowCategories: true,
    docs: [],
    categories: [
      {
        id: "a",
        name: "计算机学院",
        docs: [
          { id: "0", slug: "index", title: "简介" },
          { id: "11", slug: "cs", title: "计算机科学与技术" },
        ],
      },
    ],
  };
  const fixed = orderWikiSectionForDisplay(misparented);
  assert.equal(fixed.docs.some((d) => d.title === "简介"), true);
  assert.equal(fixed.categories[0].docs.some((d) => d.title === "简介"), false);
  const primaryMis = buildWikiPrimaryItems(misparented);
  assert.equal(primaryMis[0].type, "doc");
  if (primaryMis[0].type === "doc") {
    assert.equal(primaryMis[0].doc.title, "简介");
  }

  const ordered = orderWikiSectionForDisplay(shuffled);
  assert.deepEqual(
    ordered.categories[0].docs.map((d) => d.title),
    ["计算机科学与技术", "软件工程"],
  );

  const compass = orderWikiSectionForDisplay(compassSection);
  assert.equal(compass.docs[0].slug, "intro");
});

test("doc page ships WikiBackBar with location not raw keys", () => {
  const page = read("app/(features)/compass/doc/page.tsx");
  assert.match(page, /WikiBackBar/);
  assert.match(page, /location=/);
  const bar = read("app/(features)/compass/components/WikiBackBar.tsx");
  assert.match(bar, /返回目录/);
  assert.match(bar, /wiki-back-bar/);
  assert.match(bar, /wiki-back-bar-main/);
  assert.match(bar, /wiki-back-bar-extra/);
  assert.doesNotMatch(bar, /sectionTitle/);
  const wb = read("app/(features)/compass/components/DocumentWorkbench.tsx");
  assert.match(wb, /humanizeSpaceKey/);
  assert.doesNotMatch(wb, /cw-space-label/);
});
