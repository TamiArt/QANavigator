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

const projectDomain = await loadModule("src/app/domain/project.ts");
const validators = await loadModule("src/app/core/storage-validators.ts");

test("project domain creates normalized project records", () => {
  const project = projectDomain.createProject(
    {
      name: "  Shop  ",
      description: "  Storefront  ",
      productType: "web",
      environment: "  Staging  ",
      risks: [" auth ", "", " payments "],
    },
    "project-1",
    "2026-09-30T00:00:00.000Z",
  );

  assert.deepEqual(project, {
    id: "project-1",
    name: "Shop",
    description: "Storefront",
    productType: "web",
    environment: "Staging",
    risks: ["auth", "payments"],
    createdAt: "2026-09-30T00:00:00.000Z",
  });
});

test("project domain preserves immutable identity and creation time on update", () => {
  const projects = [{
    id: "project-1",
    name: "Shop",
    description: "",
    productType: "web",
    environment: "Staging",
    risks: [],
    createdAt: "2026-09-30T00:00:00.000Z",
  }];

  const updated = projectDomain.updateProject(projects, "project-1", {
    name: "Shop 2",
    environment: "Preprod",
  });

  assert.deepEqual(updated[0], {
    ...projects[0],
    name: "Shop 2",
    environment: "Preprod",
  });
  assert.equal(updated[0].id, projects[0].id);
  assert.equal(updated[0].createdAt, projects[0].createdAt);
});

test("project removal resolves active project to the first remaining project", () => {
  const projects = [
    { id: "project-1", name: "One", description: "", productType: "web", environment: "", risks: [], createdAt: "2026-09-30" },
    { id: "project-2", name: "Two", description: "", productType: "api", environment: "", risks: [], createdAt: "2026-09-30" },
  ];

  const remaining = projectDomain.removeProject(projects, "project-1");

  assert.deepEqual(remaining.map((project) => project.id), ["project-2"]);
  assert.equal(projectDomain.resolveActiveProjectId(remaining, "project-1"), "project-2");
  assert.equal(projectDomain.resolveActiveProjectId(remaining, "project-2"), "project-2");
  assert.equal(projectDomain.resolveActiveProjectId([], "project-2"), "");
});

test("project persistence validators accept current data and reject malformed data", () => {
  assert.equal(validators.isProjectsStorageValue({
    version: 1,
    data: [{
      id: "project-1",
      name: "Shop",
      description: "",
      productType: "web",
      environment: "Staging",
      risks: ["auth"],
      createdAt: "2026-09-30T00:00:00.000Z",
    }],
  }), true);
  assert.equal(validators.isActiveProjectStorageValue({ version: 1, data: "project-1" }), true);
  assert.equal(validators.isActiveProjectStorageValue({ version: 2, data: "project-1" }), false);
  assert.equal(validators.isProjectsStorageValue({
    version: 1,
    data: [{ id: "project-1", name: "Broken", productType: "unknown" }],
  }), false);
});
