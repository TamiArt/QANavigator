import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const infographic = fs.readFileSync("src/app/features/handbook/Module1LessonInfographics.tsx", "utf8");
const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
const learning = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");

test("Module 1 lessons 2–11 have dedicated source-grounded infographic layouts", () => {
  for (const id of ["m1-02", "m1-03", "m1-04", "m1-05", "m1-06", "m1-07", "m1-08", "m1-09", "m1-10", "m1-11"]) {
    assert.ok(infographic.includes('"' + id + '"'), "Missing infographic for " + id);
  }
  assert.match(renderer, /Module1LessonInfographic lessonId=\{lesson\.id\}/);
  assert.match(infographic, /SeverityPriorityMatrix/);
  assert.match(infographic, /Эквивалентное разбиение/);
  assert.match(infographic, /Верификация/);
  assert.match(infographic, /STLC/);
  assert.match(infographic, /Acceptance \/ UAT/);
  assert.match(infographic, /Shift-Left/);
  assert.match(infographic, /columns-1 gap-2\.5/);
  assert.match(infographic, /break-inside-avoid/);
  for (const title of [
    "Тестирование показывает наличие дефектов, но не их отсутствие",
    "Исчерпывающее тестирование невозможно",
    "Раннее тестирование экономит время (Shift-Left)",
    "Скопление дефектов (Defect Clustering)",
    "Парадокс пестицида",
    "Тестирование зависит от контекста",
    "Заблуждение об отсутствии дефектов",
  ]) assert.ok(infographic.includes(title), "Missing original ISTQB principle name: " + title);
});

test("all lesson infographics keep the small QA Navigator signature and shared Module 1 layout", () => {
  assert.match(infographic, />Критерий<\/div>/);
  assert.doesNotMatch(infographic, /<div[^>]*>\s*<\/div>/);
  assert.match(renderer, /Module1StyleInfographic visual=\{toModule1StyleVisual/);
  assert.match(renderer, /text-\[9px\] font-semibold tracking-wide text-slate-400">QA Navigator<\/div>/);
});


test("Module 1 lesson 11 teaches the six requested test design techniques with beginner examples", () => {
  for (const phrase of [
    "Эквивалентное разбиение (Equivalence Partitioning)",
    "Анализ граничных значений (Boundary Value Analysis)",
    "Попарное тестирование (Pairwise Testing)",
    "Таблицы принятия решений (Decision Tables)",
    "Тестирование переходов состояний (State Transition Testing)",
    "Предугадывание ошибок (Error Guessing)",
    "PICT",
    "AllPairs",
    "17",
    "66",
    "VIP",
    "недопустимые переходы",
    "двойной клик",
  ]) {
    assert.ok(learning.includes(phrase), "Lesson content is missing: " + phrase);
  }
  assert.match(learning, /id: "m1-11"[\\s\\S]*?topicIds: \\[\\],[\\s\\S]*?content:/);
  assert.match(infographic, /6 основных техник тест-дизайна/);
  assert.match(infographic, /Предугадывание ошибок \\(Error Guessing\\)/);
  assert.doesNotMatch(infographic, /Exploratory · Исследовательское/);
});
