/**
 * Structural + pure-function tests for the component refactor.
 * Drives shipped lib/globalEvaluationCopy.ts and checks TDesign floating-form ownership.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function walkSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "out"
    ) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(full, acc);
    else if (/\.(tsx?|jsx?|css|mjs|cjs|json)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

test("no styled-components in source or package.json", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.dependencies?.["styled-components"],
    undefined,
    "styled-components must be removed from package.json dependencies",
  );

  const files = walkSourceFiles(ROOT).filter(
    (f) => !f.endsWith("pnpm-lock.yaml") && !f.endsWith(".test.mjs"),
  );
  const offenders = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (
      /styled-components/.test(text) ||
      /import\s+styled\s+from/.test(text) ||
      /from\s+['"]styled-components['"]/.test(text)
    ) {
      offenders.push(relative(ROOT, file));
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `styled-components remnants: ${offenders.join(", ")}`,
  );
});

test("tdesign-react is declared and styles/provider are wired", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(
    pkg.dependencies?.["tdesign-react"],
    "tdesign-react must be a dependency",
  );

  const layout = read("app/layout.tsx");
  assert.match(
    layout,
    /tdesign-react\/es\/style\/index\.css|tdesign-react\/dist\/tdesign\.css/,
    "root layout must import TDesign styles",
  );
  assert.match(layout, /TDesignProvider/, "root layout must mount TDesignProvider");

  const provider = read("components/ui/TDesignProvider.tsx");
  assert.match(provider, /from\s+['"]tdesign-react['"]/);
  assert.match(provider, /ConfigProvider/);
  assert.match(provider, /react-19-adapter/);
});

test("shared floating shell uses TDesign Dialog/Drawer", () => {
  const shell = read("components/ui/TDesignFloatingShell.tsx");
  assert.match(shell, /from\s+['"]tdesign-react['"]/);
  assert.match(shell, /\bDialog\b/);
  assert.match(shell, /\bDrawer\b/);
  assert.match(shell, /placement=["']bottom["']/);
  assert.match(shell, /max-width:\s*767px|max-width:\s*767px|MOBILE_MQ|767/);
  // Shell must drive close visibility via the shipped header policy helper
  assert.match(shell, /resolveFloatingShellHeader/);
  assert.match(shell, /closeBtn=\{!preventClose\}/);

  const detail = read("components/detail/DetailComposerModal.tsx");
  assert.match(detail, /TDesignFloatingShell/);
  // Must forward caller title/description/badge so Dialog mounts closeBtn header
  assert.match(detail, /title=\{title\}/);
  assert.match(detail, /description=\{description\}/);
  assert.match(detail, /badge=\{badge\}/);
  assert.ok(
    !detail.includes("fixed inset-0") && !detail.includes("backdrop-blur"),
    "DetailComposerModal must not keep the bespoke glass overlay shell",
  );
  assert.ok(
    !/eslint-disable-next-line @typescript-eslint\/no-unused-vars\s*\n\s*title,/.test(
      detail,
    ),
    "DetailComposerModal must not void title as unused",
  );
  assert.ok(
    !/eslint-disable-next-line @typescript-eslint\/no-unused-vars\s*\n\s*description,/.test(
      detail,
    ),
    "DetailComposerModal must not void description as unused",
  );
  assert.ok(
    !/eslint-disable-next-line @typescript-eslint\/no-unused-vars\s*\n\s*badge,/.test(
      detail,
    ),
    "DetailComposerModal must not void badge as unused",
  );

  const comment = read("components/detail/CommentComposerModal.tsx");
  assert.match(comment, /TDesignFloatingShell|from\s+['"]tdesign-react['"]/);
  assert.match(comment, /Textarea|from\s+['"]tdesign-react['"]/);
  assert.match(comment, /title=\{title\}/);

  const uploader = read(
    "app/(features)/resource/components/ResourceUploaderModal.tsx",
  );
  assert.match(uploader, /TDesignFloatingShell/);
  assert.match(uploader, /title=["']上传资源["']/);

  const meFloating = read("app/(features)/me/components/FloatingPanel.tsx");
  assert.match(meFloating, /TDesignFloatingShell/);
  assert.match(meFloating, /export default function FloatingPanel|function FloatingPanel/);
  assert.match(meFloating, /title=\{title\}/);
  // page composes FloatingPanel via MePanels, not as a local god-component leaf
  const mePage = read("app/(features)/me/page.tsx");
  assert.match(mePage, /MePanels|FloatingPanel/);
  assert.ok(
    !/function FloatingPanel/.test(mePage),
    "FloatingPanel leaf UI must live outside me/page.tsx after the split",
  );
});

test("resolveFloatingShellHeader keeps close affordance when title omitted (shipped)", () => {
  const modulePath = join(ROOT, "lib/tdesignFloatingShellHeader.ts");
  const runner = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
import { resolveFloatingShellHeader } from ${JSON.stringify(modulePath)};
const cases = {
  emptyOpen: resolveFloatingShellHeader({ preventClose: false }),
  titled: resolveFloatingShellHeader({
    preventClose: false,
    title: "提交举报",
    description: "补充原因",
    badge: "举报",
  }),
  locked: resolveFloatingShellHeader({ preventClose: true }),
  lockedWithTitle: resolveFloatingShellHeader({
    preventClose: true,
    title: "上传中",
  }),
  blankTitle: resolveFloatingShellHeader({
    preventClose: false,
    title: "   ",
  }),
};
console.log(JSON.stringify(cases));
`,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(runner.status, 0, runner.stderr || runner.stdout);
  const cases = JSON.parse(runner.stdout.trim().split("\n").pop());

  // Critical: empty title still shows header so Dialog can mount closeBtn
  assert.equal(cases.emptyOpen.showHeader, true);
  assert.equal(cases.emptyOpen.showCloseBtn, true);
  assert.equal(cases.emptyOpen.hasContent, false);

  assert.equal(cases.titled.showHeader, true);
  assert.equal(cases.titled.showCloseBtn, true);
  assert.equal(cases.titled.hasContent, true);

  assert.equal(cases.locked.showHeader, false);
  assert.equal(cases.locked.showCloseBtn, false);

  assert.equal(cases.lockedWithTitle.showHeader, true);
  assert.equal(cases.lockedWithTitle.showCloseBtn, false);

  // Whitespace-only title is not content, but close still forces header
  assert.equal(cases.blankTitle.hasContent, false);
  assert.equal(cases.blankTitle.showHeader, true);
  assert.equal(cases.blankTitle.showCloseBtn, true);
});

test("floating form fields use TDesign via AdvancedFormControls", () => {
  const controls = read("components/ui/AdvancedFormControls.tsx");
  assert.match(controls, /from\s+['"]tdesign-react['"]/);
  assert.match(controls, /\bInput\b/);
  assert.match(controls, /\bSelect\b/);
  assert.match(controls, /\bTextarea\b/);
  assert.ok(
    !controls.includes("styles.inputGroup") &&
      !controls.includes("styles.userLabel"),
    "AdvancedFormControls must not rely on the old floating-label CSS stack as primary UI",
  );

  const floatingFormFiles = [
    "components/report/ReportDialog.tsx",
    "components/supplement/SupplementRequestModal.tsx",
    "components/detail/ResourceEditModal.tsx",
    "components/detail/GlobalEvaluationModal.tsx",
    "components/detail/EvaluationComposerForm.tsx",
    "components/detail/RelationLinkModal.tsx",
    "app/(features)/me/components/panels/ProfilePanel.tsx",
    "app/(features)/me/components/panels/PasswordPanel.tsx",
    "app/(features)/me/components/panels/EmailPanel.tsx",
    "app/(features)/me/components/panels/FeedbackPanel.tsx",
    "app/(features)/resource/components/ResourceUploader.tsx",
  ];

  for (const rel of floatingFormFiles) {
    const src = read(rel);
    assert.ok(
      src.includes("AdvancedFormControls") ||
        src.includes("tdesign-react") ||
        src.includes("TDesignFloatingShell"),
      `${rel} must use TDesign-backed form controls or shell`,
    );
    assert.ok(
      !/from\s+['"]@\/app\/\(features\)\/resource\/components\/AdvancedFormControls['"]/.test(
        src,
      ),
      `${rel} still imports old resource AdvancedFormControls path`,
    );
  }
});

test("shared form controls live under components/ui", () => {
  assert.ok(
    existsSync(join(ROOT, "components/ui/AdvancedFormControls.tsx")),
    "AdvancedFormControls must live under components/ui",
  );
  assert.ok(
    existsSync(join(ROOT, "components/ui/TDesignFloatingShell.tsx")),
    "TDesignFloatingShell must live under components/ui",
  );
  assert.ok(
    !existsSync(
      join(ROOT, "app/(features)/resource/components/AdvancedFormControls.tsx"),
    ),
    "old resource AdvancedFormControls path must be gone",
  );

  const files = walkSourceFiles(ROOT).filter((f) => /\.(tsx?|jsx?)$/.test(f));
  const bad = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (
      text.includes(
        "@/app/(features)/resource/components/AdvancedFormControls",
      )
    ) {
      bad.push(relative(ROOT, file));
    }
  }
  assert.deepEqual(
    bad,
    [],
    `cross-feature resource form imports remain: ${bad.join(", ")}`,
  );
});

test("single shared GlobalEvaluationModal; course/teacher are thin wrappers", () => {
  assert.ok(
    existsSync(join(ROOT, "components/detail/GlobalEvaluationModal.tsx")),
  );
  const course = read(
    "app/(features)/course/components/CourseGlobalEvaluationModal.tsx",
  );
  const teacher = read(
    "app/(features)/teacher/components/TeacherGlobalEvaluationModal.tsx",
  );
  assert.match(course, /entity=["']course["']/);
  assert.match(teacher, /entity=["']teacher["']/);
  assert.match(course, /GlobalEvaluationModal/);
  assert.match(teacher, /GlobalEvaluationModal/);
  assert.ok(!course.includes("searchCourseSuggestions"));
  assert.ok(!teacher.includes("searchTeacherSuggestions"));
  assert.ok(!course.includes("createCourseEvaluation"));
  assert.ok(!teacher.includes("createTeacherEvaluation"));
});

test("getGlobalEvaluationCopy differentiates course vs teacher (shipped module)", () => {
  const modulePath = join(ROOT, "lib/globalEvaluationCopy.ts");
  const runner = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
import { getGlobalEvaluationCopy, RATING_MODULE_ROLES } from ${JSON.stringify(modulePath)};
const course = getGlobalEvaluationCopy('course');
const teacher = getGlobalEvaluationCopy('teacher');
const out = {
  courseEval: course.evaluationType,
  teacherEval: teacher.evaluationType,
  courseAccent: course.accent,
  teacherAccent: teacher.accent,
  courseTitle: course.selectedTitle('线代'),
  teacherTitle: teacher.selectedTitle('张三'),
  courseBadge: course.badge,
  teacherBadge: teacher.badge,
  roles: [
    RATING_MODULE_ROLES.displayOnly.exportName,
    RATING_MODULE_ROLES.interactiveForm.exportName,
    RATING_MODULE_ROLES.progressBar.exportName,
  ],
};
console.log(JSON.stringify(out));
`,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(runner.status, 0, runner.stderr || runner.stdout);
  const out = JSON.parse(runner.stdout.trim().split("\n").pop());
  assert.equal(out.courseEval, "course");
  assert.equal(out.teacherEval, "teacher");
  assert.equal(out.courseAccent, "course");
  assert.equal(out.teacherAccent, "teacher");
  assert.equal(out.courseTitle, "评价 · 线代");
  assert.equal(out.teacherTitle, "评价 · 张三");
  assert.notEqual(out.courseBadge, out.teacherBadge);
  assert.deepEqual(out.roles, ["StarRating", "RatingStar", "RatingBar"]);
  assert.equal(new Set(out.roles).size, 3);
});

test("rating modules have unique default export names; RatingStarItem removed", () => {
  const starRating = read("components/ui/StarRating.tsx");
  const ratingStar = read("components/ui/RatingStar.tsx");
  const ratingBar = read("components/ui/RatingBar.tsx");
  assert.match(starRating, /export default function StarRating/);
  assert.match(ratingStar, /export default function RatingStar/);
  assert.match(
    ratingBar,
    /export default function RatingBar|export default RatingBar/,
  );
  assert.ok(
    !existsSync(join(ROOT, "components/ui/RatingStarItem.tsx")),
    "misnamed RatingStarItem (exported as RatingStar) must be removed",
  );
});

test("migrated widgets export defaults and use CSS modules without styled-components", () => {
  const widgets = [
    "ActionSubmitButton",
    "DownloadButton",
    "ModernCheckbox",
    "RatingStar",
  ];
  for (const name of widgets) {
    assert.ok(existsSync(join(ROOT, `components/ui/${name}.tsx`)));
    assert.ok(existsSync(join(ROOT, `components/ui/${name}.module.css`)));
    const src = read(`components/ui/${name}.tsx`);
    assert.ok(
      !src.includes("styled-components") && !/import\s+styled\b/.test(src),
      `${name} still uses styled-components`,
    );
    assert.match(src, /export default/);
  }
  assert.ok(
    existsSync(join(ROOT, "components/ui/AdvancedFormControls.module.css")),
  );
});

/**
 * Drives the real option-extraction path used by AdvancedSelect when converting
 * native <option> children into TDesign Select options — without re-implementing it.
 */
test("AdvancedFormControls ships TDesign Select wiring (source contracts)", () => {
  const src = read("components/ui/AdvancedFormControls.tsx");
  // Must import real TDesign primitives (not a re-implementation)
  assert.match(src, /import\s*\{[^}]*\bSelect\b[^}]*\}\s*from\s*['"]tdesign-react['"]/);
  assert.match(src, /import\s*\{[^}]*\bInput\b[^}]*\}\s*from\s*['"]tdesign-react['"]/);
  assert.match(src, /import\s*\{[^}]*\bTextarea\b[^}]*\}\s*from\s*['"]tdesign-react['"]/);
  // Must convert children options into TDesign options array via shipped bridge
  assert.match(src, /toTDesignSelectOptions|from\s+['"]@\/lib\/tdesignFormBridge['"]/);
  assert.match(src, /createSyntheticChangeEvent|normalizeTDesignFieldValue/);
});

test("tdesignFormBridge converts field values and select options (shipped module)", () => {
  const modulePath = join(ROOT, "lib/tdesignFormBridge.ts");
  const runner = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
import {
  createSyntheticChangeEvent,
  normalizeTDesignFieldValue,
  toTDesignSelectOptions,
} from ${JSON.stringify(modulePath)};

const options = toTDesignSelectOptions([
  { value: "copyright", label: "侵权" },
  { value: 0, label: "零值" },
  { value: null, label: null },
]);
const event = createSyntheticChangeEvent("hello");
const out = {
  options,
  eventValue: event.target.value,
  current: event.currentTarget.value,
  empty: normalizeTDesignFieldValue(null),
  number: normalizeTDesignFieldValue(42),
  nested: normalizeTDesignFieldValue({ value: "nested" }),
  list: normalizeTDesignFieldValue(["a", "b"]),
};
console.log(JSON.stringify(out));
`,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(runner.status, 0, runner.stderr || runner.stdout);
  const out = JSON.parse(runner.stdout.trim().split("\n").pop());
  assert.deepEqual(out.options, [
    { label: "侵权", value: "copyright" },
    { label: "零值", value: "0" },
    { label: "", value: "" },
  ]);
  assert.equal(out.eventValue, "hello");
  assert.equal(out.current, "hello");
  assert.equal(out.empty, "");
  assert.equal(out.number, "42");
  assert.equal(out.nested, "nested");
  assert.equal(out.list, "a,b");
});
