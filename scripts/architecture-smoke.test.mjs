import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("repository quality gates pass", () => {
  execFileSync(process.execPath, ["scripts/check-conflicts.mjs"], { cwd: root, stdio: "pipe" });
  execFileSync(process.execPath, ["scripts/check-module-size.mjs"], { cwd: root, stdio: "pipe" });
});

test("CI workflow does not require a missing npm lockfile", () => {
  const workflow = read(".github/workflows/verify.yml");
  assert.match(workflow, /npm install --no-audit --no-fund/);
  assert.doesNotMatch(workflow, /cache:\s*npm/);
});

test("TypeScript entrypoint uses extensionless local import", () => {
  assert.doesNotMatch(read("src/main.tsx"), /import\(["'][^"']+\.tsx["']\)/);
});

test("Vite config is ESM-safe and typed", () => {
  const config = read("vite.config.ts");
  assert.match(config, /from ['"]node:path['"]/);
  assert.match(config, /resolveId\(id: string\)/);
  assert.doesNotMatch(config, /__dirname/);
});

test("application modules expose the imports consumed by App", () => {
  const app = read("src/app/App.tsx");
  const required = [
    ["TestDesignModule", "src/app/features/test-design/TestDesignModule.tsx"],
    ["TestExecutionModule", "src/app/features/test-execution/TestExecutionModule.tsx"],
    ["RequirementsModule", "src/app/features/requirements/RequirementsModule.tsx"],
    ["AutomationModule", "src/app/features/automation/AutomationModule.tsx"],
    ["ReleaseReportModule", "src/app/features/release-report/ReleaseReportModule.tsx"],
    ["TestDataModule", "src/app/features/test-data/TestDataModule.tsx"],
    ["HandbookModule", "src/app/features/handbook/HandbookModule.tsx"],
    ["DocumentationModule", "src/app/features/documentation/DocumentationModule.tsx"],
    ["SettingsModule", "src/app/features/settings/SettingsModule.tsx"],
  ];
  for (const [name, file] of required) {
    assert.match(app, new RegExp(`\\bimport\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["']`));
    assert.match(read(file), new RegExp(`\\bexport\\s+(?:default\\s+)?(?:function|const|class)\\s+${name}\\b`));
  }
});

test("handbook hierarchy has unique section and topic identifiers", () => {
  const hierarchy = read("src/app/handbook-hierarchy.ts");
  const sections = [...hierarchy.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  const topicArrays = [...hierarchy.matchAll(/topicIds:\s*\[([\s\S]*?)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
  );
  assert.ok(sections.length >= 12);
  assert.equal(new Set(sections).size, sections.length);
  assert.ok(topicArrays.length > 0);
  assert.equal(new Set(topicArrays).size, topicArrays.length);
});

test("critical localStorage contracts remain present", () => {
  const app = read("src/app/App.tsx");
  for (const key of [
    "qa_nav_theme",
    "qa_nav_apikeys",
    "qa_navigator_checklists",
    "qa_navigator_testcases",
    "qa_navigator_bugreports",
    "qa_navigator_bookmarks",
    "qa_navigator_req_text",
    "qa_navigator_req_result",
  ]) {
    assert.match(app, new RegExp(key));
  }
});
