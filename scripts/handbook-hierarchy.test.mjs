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
  const contentMatch = tt2.match(/content: `([\\s\\S]*)\\n`,\\n  \\},\\n$/);
  assert.ok(contentMatch, "tt2 content must close before the tt3 topic");
  const content = contentMatch[1];

  assert.equal(
    content.startsWith("## Архитектура и классификация видов тестирования ПО"),
    true,
    "tt2 content must start with the expected heading",
  );
  for (const anchor of [
    "## 2. По степени знания системы: уровни «ящиков»",
    "### Black-box — чёрный ящик",
    "### Gray-box — серый ящик",
    "### White-box — белый ящик",
    "## 3. По времени и цели проведения",
    "Решение о релизе",
    "## 8. По уровням тестирования: масштаб проверки",
  ]) {
    assert.equal(content.includes(anchor), true, "tt2 content must contain the complete section: " + anchor);
  }

  assert.equal(tt2.includes("content: \\`## Архитектура"), false, "tt2 must not use an escaped opening delimiter");
  assert.equal(tt2.includes("content:\\`##"), false, "tt2 content must keep a space after content:");
  assert.equal(tt2.includes("` ## Архитектура"), false, "tt2 must not have a space after the opening delimiter");
  assert.equal(tt2.includes("\u00a0"), false, "tt2 content must not contain non-breaking spaces");
  assert.equal(tt2.includes("\\`,\n  }"), false, "tt2 must not contain an escaped closing delimiter");
  assert.match(source.slice(end - 20, end + 40), /\n  \},\n  \{\n    id: "tt3"/, "tt2 must be closed before tt3");
});

test("handbook data has balanced template literals and no hidden whitespace hazards", () => {
  const source = fs.readFileSync("src/app/handbook-data-part-1.ts", "utf8");

  let unescapedBackticks = 0;
  let escaped = false;
  for (const char of source) {
    if (char === "\\") {
      escaped = !escaped;
      continue;
    }
    if (char === "`" && !escaped) unescapedBackticks += 1;
    escaped = false;
  }

  assert.equal(unescapedBackticks % 2, 0, "handbook data must have balanced unescaped template delimiters");
  assert.equal(source.includes("\u00a0"), false, "handbook data must not contain non-breaking spaces");
  assert.equal(source.includes("\r"), false, "handbook data must not contain carriage returns");
  assert.equal(source.includes("\t"), false, "handbook data must not contain tab characters");
});
