import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import { Module } from "node:module";

async function loadModule(path) {
  const source = await readFile(join(process.cwd(), path), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const testModule = new Module(path);
  testModule.filename = join(process.cwd(), path);
  testModule.paths = Module._nodeModulePaths(process.cwd());
  testModule._compile(compiled, testModule.filename);
  return testModule.exports;
}

const { migrateProjectCollections, selectProjectRecords, replaceProjectRecords } =
  await loadModule("src/app/domain/project-data.ts");

const project = (id) => ({
  id, name: id, description: "", productType: "web", environment: "Staging",
  risks: [], createdAt: "2026-11-16T00:00:00.000Z",
});

test("legacy records receive the active project ID without changing stable record IDs", () => {
  const result = migrateProjectCollections({
    projects: [project("p1"), project("p2")],
    activeProjectId: "p2",
    checklists: [{ id: "cl-1", text: "legacy" }],
    testCases: [{ id: "tc-1", title: "legacy" }],
    bugReports: [{ id: "bug-1", title: "legacy" }],
  }, "recovery", "2026-11-16T00:00:00.000Z");

  assert.equal(result.changed, true);
  assert.equal(result.activeProjectId, "p2");
  assert.equal(result.checklists[0].id, "cl-1");
  assert.equal(result.checklists[0].projectId, "p2");
  assert.equal(result.testCases[0].projectId, "p2");
  assert.equal(result.bugReports[0].projectId, "p2");
  assert.equal(result.projects.length, 2);
});

test("legacy data without projects is preserved in a generated recovery project", () => {
  const result = migrateProjectCollections({
    projects: [],
    activeProjectId: "",
    checklists: [{ id: "cl-1" }],
    testCases: [],
    bugReports: [],
  }, "recovery-1", "2026-11-16T00:00:00.000Z");

  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].id, "recovery-1");
  assert.equal(result.activeProjectId, "recovery-1");
  assert.equal(result.checklists[0].projectId, "recovery-1");
});

test("migration is idempotent and preserves records already assigned to other projects", () => {
  const input = {
    projects: [project("p1"), project("p2")],
    activeProjectId: "p1",
    checklists: [{ id: "cl-1", projectId: "p2" }, { id: "cl-2" }],
    testCases: [],
    bugReports: [],
  };
  const first = migrateProjectCollections(input, "recovery", "2026-11-16T00:00:00.000Z");
  const second = migrateProjectCollections(first, "another-id", "2026-11-17T00:00:00.000Z");

  assert.equal(first.checklists[0].projectId, "p2");
  assert.equal(first.checklists[1].projectId, "p1");
  assert.equal(second.changed, false);
  assert.equal(second.projects[0].id, "p1");
});

test("project selection and replacement never expose or overwrite another project's records", () => {
  const records = [
    { id: "one", projectId: "p1" },
    { id: "two", projectId: "p2" },
  ];
  assert.deepEqual(selectProjectRecords(records, "p1").map((record) => record.id), ["one"]);

  const updated = replaceProjectRecords(records, "p1", [{ id: "three" }]);
  assert.deepEqual(updated, [
    { id: "two", projectId: "p2" },
    { id: "three", projectId: "p1" },
  ]);
});
