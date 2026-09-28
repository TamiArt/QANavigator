import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = path.resolve("src/app/features/documentation/rtm-model.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;

const module = { exports: {} };
vm.runInNewContext(compiled, {
  module,
  exports: module.exports,
  console,
});
const model = module.exports;

const requirements = [
  { id: "1", reqId: "REQ-001", title: "Login", priority: "high" },
  { id: "2", reqId: "REQ-002", title: "Password reset", priority: "medium" },
];
const testCases = [
  { id: "1", tcId: "TC-001", title: "Valid login" },
  { id: "2", tcId: "TC-002", title: "Reset password" },
];
const links = new Set(["REQ-001:TC-001", "REQ-002:TC-002"]);

test("RTM coverage counts linked test cases per requirement", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(model.calculateRTMCoverage(requirements, testCases, links))),
    [
      { reqId: "REQ-001", total: 2, covered: 1 },
      { reqId: "REQ-002", total: 2, covered: 1 },
    ],
  );
});

test("RTM CSV contains requirement, test-case and coverage columns", () => {
  const csv = model.buildRTMCsv(requirements, testCases, links);
  assert.match(csv, /Требование,Описание,Приоритет,TC-001,TC-002,Покрытие/);
  assert.match(csv, /"REQ-001","Login",high,✓,,Покрыто/);
  assert.match(csv, /"REQ-002","Password reset",medium,,✓,Покрыто/);
});
