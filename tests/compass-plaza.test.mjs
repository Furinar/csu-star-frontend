import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("compass API client exposes feed, essay, collection, course root, and path builders", () => {
  const apiPath = path.join(root, "api/compass.ts");
  const src = fs.readFileSync(apiPath, "utf8");
  for (const needle of [
    '"/compass/feed"',
    '"/compass/essays"',
    '"/compass/collections"',
    '"/compass/author/apply"',
    "/compass/pages/",
    "/compass/courses/",
    "buildCompassPagePath",
    "buildCourseCoNotePath",
    "getCompassFeed",
    "getCourseCoNoteRoot",
    "createCompassEssay",
    "createCompassCollection",
    "requestCompassEdit",
    "getCompassHistory",
  ]) {
    assert.ok(src.includes(needle), `api/compass.ts missing ${needle}`);
  }
});

test("plaza page surfaces recent/hot tabs and login gate", () => {
  const page = fs.readFileSync(
    path.join(root, "app/(features)/compass/page.tsx"),
    "utf8",
  );
  assert.ok(page.includes("最近发布"));
  assert.ok(page.includes("最热"));
  assert.ok(page.includes("登录后进入广场"));
  assert.ok(page.includes("写随笔"));
  assert.ok(page.includes("新建合集"));
  assert.ok(page.includes("getCompassFeed"));
  assert.ok(page.includes("申请成为作者"));
});

test("document workbench has tree body history comments and edit request", () => {
  const wb = fs.readFileSync(
    path.join(root, "app/(features)/compass/components/DocumentWorkbench.tsx"),
    "utf8",
  );
  // LocalNav 文案对齐原站
  assert.ok(wb.includes("菜单"));
  assert.ok(wb.includes("历史"));
  assert.ok(wb.includes("评论"));
  assert.ok(wb.includes("大纲"));
  assert.ok(wb.includes("页面导航"));
  assert.ok(wb.includes("申请编辑"));
  assert.ok(wb.includes("getCompassHistory"));
  assert.ok(wb.includes("updateCompassPage"));
  assert.ok(wb.includes("requestCompassEdit"));
  assert.ok(wb.includes("addCompassComment"));
  // 默认阅读态 + 显式编辑
  assert.ok(wb.includes("isEditing"));
  assert.ok(wb.includes("MarkdownArticle"));
  assert.ok(wb.includes("编辑"));
  assert.ok(wb.includes("保存"));
  // 右栏三面板自绘 tab（非 TDesign Tabs 组件）
  assert.ok(wb.includes("cw-aside-tabs"));
  assert.ok(!/\bTabs\b/.test(wb));
  // 不叠完整 VP 顶栏菜单（主站 NavBar 负责）
  assert.ok(!wb.includes("VPNavBarMenu"));
  // VitePress 三栏壳
  assert.ok(wb.includes("wiki-doc-shell"));
  assert.ok(wb.includes("VPSidebar"));
  assert.ok(wb.includes("VPDoc"));
  assert.ok(wb.includes("has-aside"));
  assert.ok(wb.includes("compass-workbench"));
  assert.ok(wb.includes("WikiBackBar"));
  assert.ok(wb.includes("返回指北") || wb.includes("WikiBackBar"));
  // 上一篇 / 下一篇
  assert.ok(wb.includes("prev-next") || wb.includes("上一页"));
  assert.ok(wb.includes("下一页"));
  // 一级 group 树形 + 展开 class
  assert.ok(wb.includes("is-leaf") || wb.includes("is-branch"));
  assert.ok(wb.includes("level-0"));
});

test("workbench CSS lives under wiki VP shell tokens (not raw gray Feishu chrome)", () => {
  const css = fs.readFileSync(path.join(root, "app/styles/wiki.css"), "utf8");
  assert.ok(css.includes("compass-workbench"));
  assert.ok(css.includes("cw-edit-title"));
  assert.ok(css.includes("cw-aside-panel"));
  assert.ok(css.includes("cw-aside-tabs"));
  assert.ok(css.includes("cw-collab-bar"));
  // indigo brand shared with official wiki doc
  assert.ok(css.includes("--vp-c-indigo-1"));
  assert.ok(!css.includes("bg-[#f7f8fa]"));
});

test("compass workbench routes exist (query-param style for static export)", () => {
  const routes = [
    "app/(features)/compass/p/page.tsx",
    "app/(features)/compass/space/page.tsx",
    "app/(features)/compass/collection/page.tsx",
    "app/(features)/compass/me/page.tsx",
  ];
  for (const r of routes) {
    assert.ok(fs.existsSync(path.join(root, r)), `missing route ${r}`);
  }
  // no frontend wiki special-case shell
  assert.ok(
    !fs.existsSync(
      path.join(root, "app/(features)/compass/components/WikiSpaceWorkbench.tsx"),
    ),
  );
});

test("space page uses unified compass tree for all spaces including majors", () => {
  const space = fs.readFileSync(
    path.join(root, "app/(features)/compass/space/page.tsx"),
    "utf8",
  );
  assert.ok(space.includes("getCompassTree"));
  assert.ok(space.includes("DocumentWorkbench"));
  assert.ok(!space.includes("WikiSpaceWorkbench"));
  assert.ok(!space.includes("getWikiTree"));
});

test("layout keeps main NavBar on workbench and wiki doc (hybrid tabbar)", () => {
  const layout = fs.readFileSync(
    path.join(root, "app/(features)/layout.tsx"),
    "utf8",
  );
  assert.ok(layout.includes("NavBar"));
  assert.ok(!layout.includes("hideMainNav"));
  assert.ok(!layout.includes("isCompassWorkbench"));
  assert.ok(!layout.includes("isWikiDocPage"));
  // wiki brand applied on doc/workbench paths via NavBar
  const nav = fs.readFileSync(
    path.join(root, "components/layout/NavBar.tsx"),
    "utf8",
  );
  assert.ok(nav.includes("/compass/p"));
  assert.ok(nav.includes("/compass/space"));
  assert.ok(nav.includes("/compass/collection"));
  assert.ok(nav.includes("/compass/doc"));
  assert.ok(nav.includes("CSU Wiki"));
});

test("course detail enters co-note full shell path", () => {
  const page = fs.readFileSync(
    path.join(root, "app/(features)/course/detail/page.tsx"),
    "utf8",
  );
  assert.ok(page.includes("课程共笔"));
  assert.ok(page.includes("/compass/space?key=courses&courseId="));
  assert.ok(page.includes("进入共笔"));
});

test("compass API unwraps envelope once (interceptor already peels axios data)", () => {
  const src = fs.readFileSync(path.join(root, "api/compass.ts"), "utf8");
  assert.ok(src.includes("unwrapCompass"), "must use unwrapCompass");
  // forbid double-unwrap pattern that broke reads
  assert.ok(
    !src.includes("return res.data.data"),
    "must not double-unwrap res.data.data",
  );
  assert.ok(src.includes("payload.data"), "unwrap returns envelope.data");
});

test("createCompassEssay keeps snowflake IDs as strings (no Number coercion)", () => {
  const src = fs.readFileSync(path.join(root, "api/compass.ts"), "utf8");
  // Must not use Number() on collection/course/parent ids
  assert.ok(
    !/collection_id\)\s*=\s*Number\(/.test(src) &&
      !/body\.collection_id\s*=\s*Number\(/.test(src),
    "must not coerce collection_id with Number()",
  );
  assert.ok(
    src.includes("body.collection_id = String(payload.collection_id)") ||
      src.includes('body.collection_id = String(payload.collection_id)'),
    "must send collection_id as String",
  );
  assert.ok(
    src.includes("body.course_id = String(payload.course_id)") ||
      src.includes("String(payload.course_id)"),
    "must send course_id as String",
  );
  assert.ok(
    src.includes("String(payload.parent_id)"),
    "must send parent_id as String",
  );
  // Document the precision hazard in a comment or nearby
  assert.ok(
    src.includes("2^53") || src.includes("snowflake") || src.includes("precision"),
    "should document why strings are required",
  );

  // Unit-level: simulate the shipped assignment logic
  const payload = {
    collection_id: "2081794825308340224",
    course_id: "2081794825308340225",
    parent_id: "2081794825308340226",
  };
  const body = {};
  body.collection_id = String(payload.collection_id);
  body.course_id = String(payload.course_id);
  body.parent_id = String(payload.parent_id);
  assert.equal(body.collection_id, "2081794825308340224");
  assert.notEqual(body.collection_id, String(Number(payload.collection_id)));
  assert.equal(Number(payload.collection_id), 2081794825308340200); // proves Number is lossy
});

test("path builders produce in-app compass URLs (not third-party docs host)", () => {
  const src = fs.readFileSync(path.join(root, "api/compass.ts"), "utf8");
  const cleaned = src
    .split("\n")
    .filter((l) => !l.startsWith("import "))
    .join("\n")
    .replace(/: string/g, "")
    .replace(/\?: \{[^}]+\}/g, "")
    .replace(/opts\?\.space/g, "opts && opts.space")
    .replace(/opts\?\.courseId/g, "opts && opts.courseId")
    .replace(/export /g, "");
  const m1 = cleaned.match(/function buildCompassPagePath\([\s\S]*?\n\}/);
  const m2 = cleaned.match(/function buildCourseCoNotePath\([\s\S]*?\n\}/);
  const m3 = cleaned.match(/function buildCompassCollectionPath\([\s\S]*?\n\}/);
  assert.ok(m1 && m2 && m3, "could not extract path builders");
  const mod = new Function(
    `${m1[0]}\n${m2[0]}\n${m3[0]}\nreturn { buildCompassPagePath, buildCourseCoNotePath, buildCompassCollectionPath };`,
  )();

  const p = mod.buildCompassPagePath("42", { space: "plaza" });
  assert.equal(p, "/compass/p?id=42&space=plaza");
  assert.ok(!p.includes("docmost"));
  assert.ok(!p.includes("docs.csustar"));
  assert.ok(p.startsWith("/compass/"));

  const c = mod.buildCourseCoNotePath("99");
  assert.equal(c, "/compass/space?key=courses&courseId=99");
  assert.ok(c.startsWith("/compass/"));

  const col = mod.buildCompassCollectionPath("7");
  assert.equal(col, "/compass/collection?id=7");
});
