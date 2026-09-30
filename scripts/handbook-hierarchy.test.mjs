import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const hierarchySource = fs.readFileSync("src/app/handbook-hierarchy.ts", "utf8");
const curriculumSource = fs.readFileSync("src/app/handbook-curriculum.ts", "utf8");

function parseQuotedIds(source, start, end) {
  const block = source.slice(start, end);
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function parseSections(source) {
  const sectionMatches = [...source.matchAll(/topicIds:\s*\[([\s\S]*?)\],/g)];
  return sectionMatches.map((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

function parseArray(source, name) {
  const start = source.indexOf(`export const ${name} = [`);
  assert.notEqual(start, -1, `${name} declaration must exist`);
  const end = source.indexOf("];", start);
  assert.notEqual(end, -1, `${name} array must be closed`);
  return parseQuotedIds(source, start, end);
}

function parseSet(source, name) {
  const start = source.indexOf(`export const ${name} = new Set([`);
  assert.notEqual(start, -1, `${name} declaration must exist`);
  const end = source.indexOf("]);", start);
  assert.notEqual(end, -1, `${name} set must be closed`);
  return parseQuotedIds(source, start, end);
}

test("handbook hierarchy covers every active curriculum topic exactly once", () => {
  const sections = parseSections(hierarchySource);
  const hierarchyIds = sections.flat();
  const curriculumIds = parseArray(curriculumSource, "CURRICULUM_ORDER");
  const mergedIds = new Set(parseSet(curriculumSource, "MERGED_TOPIC_IDS"));

  assert.equal(new Set(hierarchyIds).size, hierarchyIds.length, "topic IDs must not be duplicated across sections");

  const activeCurriculum = curriculumIds.filter((id) => !mergedIds.has(id));
  assert.deepEqual(new Set(hierarchyIds), new Set(activeCurriculum), "hierarchy must match the active curriculum exactly");
});

test("handbook section order follows curriculum order", () => {
  const sections = parseSections(hierarchySource);
  const curriculumIds = parseArray(curriculumSource, "CURRICULUM_ORDER");
  const order = new Map(curriculumIds.map((id, index) => [id, index]));

  let previous = -1;
  for (const section of sections) {
    const positions = section.map((id) => order.get(id)).filter((value) => value !== undefined);
    assert.ok(positions.length > 0, "each handbook section must contain curriculum topics");
    assert.ok(Math.min(...positions) >= previous, "handbook sections must follow curriculum order");
    previous = Math.max(...positions);
  }
});

test("merged topic IDs are not visible in the hierarchy", () => {
  const hierarchyIds = parseSections(hierarchySource).flat();
  const mergedIds = parseSet(curriculumSource, "MERGED_TOPIC_IDS");
  for (const id of mergedIds) {
    assert.equal(hierarchyIds.includes(id), false, `merged topic ${id} must not appear in visible hierarchy`);
  }
});


test("testing-types knowledge topic keeps the eight-axis classification contract", () => {
  const source = fs.readFileSync("src/app/handbook-data-part-1.ts", "utf8");
  const start = source.indexOf('id: "tt2"');
  const end = source.indexOf('id: "tt3"', start);
  assert.ok(start >= 0, "testing-types topic tt2 must exist");
  assert.ok(end > start, "testing-types topic tt2 must have a following topic boundary");

  const topic = source.slice(start, end);
  for (const anchor of [
    "По объекту и целям",
    "По степени знания системы",
    "По времени и цели проведения",
    "По запуску кода",
    "По степени автоматизации",
    "По позитивности сценариев",
    "По степени формализации",
    "По уровням тестирования",
    "Smoke",
    "Sanity",
    "Regression",
    "Re-test",
    "Black-box",
    "Gray-box",
    "White-box",
    "Unit (Модульное)",
    "Integration (Интеграционное)",
    "System (Системное)",
    "Acceptance / UAT",
    "Пирамида уровней тестирования",
    "Шпаргалка",
  ]) {
    assert.ok(topic.includes(anchor), "tt2 must preserve the testing-types anchor: " + anchor);
  }
});

test("testing types topic keeps a valid template-string boundary", () => {
  const source = fs.readFileSync("src/app/handbook-data-part-1.ts", "utf8");
  const start = source.indexOf('id: "tt2"');
  const end = source.indexOf('id: "tt3"', start);
  assert.ok(start >= 0 && end > start, "tt2/tt3 boundaries must exist");
  const tt2 = source.slice(start, end);
  assert.match(tt2, /content: \\`## Архитектура и классификация видов тестирования ПО/);
  assert.ok(!tt2.includes("content: \\\\`## Архитектура"), "tt2 content must not start with an escaped template delimiter");
  assert.ok(!tt2.includes("\\\\`,\\n  }"), "tt2 content must close with a real template delimiter");
  assert.match(tt2, /\\n`,\\n  \\},\\n  \\{\\n    id: "tt3"/, "tt2 content must be closed before the tt3 topic");
});
