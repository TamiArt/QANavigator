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
  assert.doesNotMatch(config, /(?:^|[^\w])__dirname(?:[^\w]|$)/);
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

test("handbook curriculum has unique ordered topic identifiers", () => {
  const curriculum = read("src/app/handbook-curriculum.ts");
  const orderBlock = curriculum.match(/CURRICULUM_ORDER[^=]*=\s*\[([\s\S]*?)\]/);
  assert.ok(orderBlock, "CURRICULUM_ORDER must exist");
  const ids = [...orderBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 20);
  assert.equal(new Set(ids).size, ids.length);
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
