import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = path.resolve("src/app/features/test-design/algorithms.ts");
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
const algorithms = module.exports;

test("IPOG covers every pair of parameter values", () => {
  const params = [
    { name: "OS", values: ["Windows", "macOS"] },
    { name: "Browser", values: ["Chrome", "Firefox", "Edge"] },
    { name: "User", values: ["Guest", "Admin"] },
  ];
  const rows = algorithms.ipogPairwise(params);
  assert.ok(rows.length > 0);
  for (let i = 0; i < params.length; i++) {
    for (let j = i + 1; j < params.length; j++) {
      for (const left of params[i].values) {
        for (const right of params[j].values) {
          assert.ok(rows.some(row => row[params[i].name] === left && row[params[j].name] === right));
        }
      }
    }
  }
});

test("equivalence partitioning generates valid and invalid classes", () => {
  const result = algorithms.generateEquivalenceClasses([{
    id: "age",
    name: "Возраст",
    type: "number",
    required: true,
    min: "18",
    max: "60",
    minLen: "",
    maxLen: "",
  }]);
  assert.ok(result.some(item => item.classType === "valid"));
  assert.ok(result.some(item => item.classType === "invalid"));
});

test("BVA includes both boundary values and outside values", () => {
  const result = algorithms.generateBVA({
    id: "age",
    name: "Возраст",
    min: "18",
    max: "60",
    step: "1",
    required: true,
    isInteger: true,
  });
  const values = result.map(item => item.value);
  assert.ok(values.includes("18"));
  assert.ok(values.includes("60"));
  assert.ok(values.includes("17"));
  assert.ok(values.includes("61"));
});

test("state transition generator ignores invalid transition references", () => {
  const result = algorithms.generateSTTests(
    [{ id: "a", name: "Авторизация", isInitial: true, isFinal: false }],
    [{ id: "t1", fromId: "a", event: "login", toId: "missing", expectedAction: "" }],
  );
  assert.deepEqual(result, []);
});
