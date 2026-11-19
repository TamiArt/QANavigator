import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

class FakeElement {
  constructor(name, attrs = {}, children = [], text = "") { this.name = name; this.attrs = attrs; this.children = children; this.textContent = text; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  getElementsByTagName(name) { return this.children.flatMap((child) => child.name === name ? [child] : child.getElementsByTagName(name)); }
}
class FakeDOMParser {
  parseFromString(xml) {
    if (xml === "invalid") return { getElementsByTagName: (name) => name === "parsererror" ? [{}] : [] };
    if (xml === "<empty/>") return { getElementsByTagName: () => [] };
    const cases = [
      new FakeElement("testcase", { name: "QA-001", classname: "Auth" }),
      new FakeElement("testcase", { name: "Search" }, [new FakeElement("skipped", { message: "Not in CI scope" })]),
      new FakeElement("testcase", { name: "Unknown automation case", classname: "External" }, [new FakeElement("failure", {}, [], "Assertion failed")]),
    ];
    return { getElementsByTagName: (name) => name === "testcase" ? cases : [] };
  }
}
const source = fs.readFileSync(path.resolve("src/app/features/test-management/tms-junit-import.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, DOMParser: FakeDOMParser, Array, Error, String });
const { parseJUnitXmlResults } = module.exports;

const cases = [
  { id: "c1", key: "QA-001", title: "Login", steps: [{ action: "Open", expected: "Page" }] },
  { id: "c2", key: "QA-002", title: "Search", steps: [] },
];

test("JUnit XML results map to TMS cases by key and title", () => {
  const result = parseJUnitXmlResults("<testsuites/>", cases);
  assert.equal(result.results.length, 2);
  assert.equal(result.results[0].result.status, "passed");
  assert.equal(result.results[1].result.status, "skipped");
  assert.deepEqual(Array.from(result.unmatched), ["External · Unknown automation case"]);
});

test("JUnit XML importer rejects malformed XML and empty test suites", () => {
  assert.throws(() => parseJUnitXmlResults("invalid", cases), /повреждён/);
  assert.throws(() => parseJUnitXmlResults("<empty/>", []), /не найдены/);
});
