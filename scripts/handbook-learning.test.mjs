import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("learning mode contains exactly the approved Module 1 lessons", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const expected = [
    "Что такое тестирование?",
    "Термины: QA, QC, Testing",
    "Принципы тестирования",
    "Верификация и валидация",
    "Требования",
    "SDLC: Жизненный цикл разработки ПО",
    "STLC: Жизненный цикл тестирования ПО",
    "Severity vs Priority: Серьёзность и срочность багов",
    "Виды тестирования: классификация с примерами",
    "Пирамида тестирования: Уровни и их назначения",
    "Техники тест-дизайна: как придумывать тест-кейсы",
  ];
  for (const title of expected) assert.ok(source.includes(`title: "${title}"`), title);
  assert.equal((source.match(/id: "m1-\\d{2}"/g) ?? []).length, 11);
  assert.doesNotMatch(source, /Модуль 2|Модуль 3|Модуль 4|Модуль 5/);
});

test("learning lesson range configuration excludes unrelated content", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  assert.match(source, /sectionEnd: "\*\*STLC/);
  assert.match(source, /sectionStart: "### Severity vs Priority:/);
  assert.match(source, /sectionStart: "## Пирамида тестирования"/);
  assert.match(source, /sectionEnd: "---\\\\n\\\\n## CI\\/CD"/);
});

test("learning progress uses the existing versioned local storage boundary", () => {
  const constants = fs.readFileSync("src/app/core/constants.ts", "utf8");
  assert.match(constants, /handbookLearningProgress: "qa_navigator_handbook_learning_progress"/);
});

test("learning mode contains the approved Module 2 topics in exact order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module2.ts", "utf8");
  const expected = [
    "Что такое стек проекта?",
    "Команда проекта",
    "Методологии разработки: как организовать работу над проектом",
    "Scrum",
    "Спринт",
    "Покер планирования",
    "Ретроспектива",
    "Видео мероприятий Scrum",
    "Видео о методологиях",
    "Kanban",
    "Смешанные модели",
    "Типы компаний",
  ];
  for (const title of expected) assert.ok(source.includes(`title: "${title}"`), title);
  assert.equal((source.match(/id: "m2-\\d{2}"/g) ?? []).length, 12);
  assert.ok(source.indexOf("Что такое стек проекта?") < source.indexOf("Команда проекта"));
  assert.ok(source.indexOf("Команда проекта") < source.indexOf("Методологии разработки: как организовать работу над проектом"));
  assert.ok(source.indexOf("Покер планирования") < source.indexOf("Ретроспектива"));
  assert.ok(source.indexOf("Kanban") < source.indexOf("Смешанные модели"));
  assert.match(source, /Shift-Left Testing/);
  assert.match(source, /V-Model/);
  assert.match(source, /Planning Poker/);
  assert.match(source, /Definition of Done/);
  assert.match(source, /Definition of Ready/);
  assert.match(source, /Story Points/);
  assert.match(source, /Lead Time/);
  assert.match(source, /Cycle Time/);
  assert.match(source, /Scrumban/);
  assert.match(source, /Kanplan/);
});
