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
  assert.equal((source.match(/id: "m1-\d{2}"/g) ?? []).length, 11);
});

test("learning lesson range configuration excludes unrelated content", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  assert.match(source, /sectionEnd: "\*\*STLC/);
  assert.match(source, /sectionStart: "### Severity vs Priority:/);
  assert.match(source, /sectionStart: "## Пирамида тестирования"/);
  assert.ok(source.includes('sectionEnd: "---\\n\\n## CI/CD"'));
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
  assert.equal((source.match(/id: "m2-\d{2}"/g) ?? []).length, 12);
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

test("learning mode contains the approved Module 3 topics in exact order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module3.ts", "utf8");
  const expected = [
    "Что такое фронтенд и бэкенд",
    "Тестовые окружения (стенды)",
    "Тестирование фронтенда",
    "Мини-гайд по тестированию GUI",
    "HTML",
    "CSS",
    "DevTools — главный инструмент",
  ];
  for (const title of expected) assert.ok(source.includes(`title: "${title}"`), title);
  assert.equal((source.match(/id: "m3-\d{2}"/g) ?? []).length, 7);
  assert.ok(source.indexOf("Что такое фронтенд и бэкенд") < source.indexOf("Тестовые окружения (стенды)"));
  assert.ok(source.indexOf("Тестовые окружения (стенды)") < source.indexOf("Тестирование фронтенда"));
  assert.ok(source.indexOf("Тестирование фронтенда") < source.indexOf("Мини-гайд по тестированию GUI"));
  assert.ok(source.indexOf("Мини-гайд по тестированию GUI") < source.indexOf("HTML"));
  assert.ok(source.indexOf("HTML") < source.indexOf("CSS"));
  assert.ok(source.indexOf("CSS") < source.indexOf("DevTools — главный инструмент"));
  assert.match(source, /Network/);
  assert.match(source, /Console/);
  assert.match(source, /Elements/);
  assert.match(source, /F12/);
  assert.match(source, /2xx/);
  assert.match(source, /5xx/);
});

test("learning mode contains the approved Module 4 topics in exact order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module4.ts", "utf8");
  const expected = [
    "Что такое тестовая документация?",
    "В чем важность тестовой документации?",
    "Тест-план (Test Plan)",
    "Тест-кейс (Test Case)",
  ];
  for (const title of expected) assert.ok(source.includes(`title: "${title}"`), title);
  assert.equal((source.match(/id: "m4-\d{2}"/g) ?? []).length, 18);
  const titleIndex = (title) => source.indexOf(`title: "${title}"`);
  assert.ok(titleIndex("Что такое тестовая документация?") < titleIndex("В чем важность тестовой документации?"));
  assert.ok(titleIndex("В чем важность тестовой документации?") < titleIndex("Тест-план (Test Plan)"));
  assert.ok(titleIndex("Тест-план (Test Plan)") < titleIndex("Тест-кейс (Test Case)"));
  assert.match(source, /Test Strategy/);
  assert.match(source, /Requirements Traceability Matrix/);
  assert.match(source, /Test Summary Report/);
  assert.match(source, /Критерии начала/);
  assert.match(source, /Критерии завершения/);
  assert.match(source, /Passed/);
  assert.match(source, /Failed/);
  assert.match(source, /Blocked/);
  assert.match(source, /Skipped/);
  assert.match(source, /Постусловия/);
});


test("learning mode contains the extended Module 4 topics in exact order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module4.ts", "utf8");
  const expected = [
    "Что такое тестовая документация?",
    "В чем важность тестовой документации?",
    "Тест-план (Test Plan)",
    "Тест-кейс (Test Case)",
    "Тест-кейсы для бэкенда и API",
    "Чек-лист (Checklist)",
    "Тест-кейсы vs Чек-листы — что и когда выбирать",
    "Баг-репорт (Bug Report)",
    "Пример отчета по тестированию (Test Summary Report)",
    "Баг, ошибка, дефект и их классификация",
    "Жизненный цикл дефекта (Bug Life Cycle)",
    "Баг vs задача на доработку (Feature Request)",
    "Основные шаги документирования дефекта",
    "Pre-release баг и Production Bug",
    "Где ведут тестовую документацию",
    "Локализация багов",
    "Работа с задачей при написании тестовой документации",
    "Лучшие практики тест-кейсов",
  ];
  for (const title of expected) assert.ok(source.includes(`title: "${title}"`), title);
  assert.equal((source.match(/id: "m4-\d{2}"/g) ?? []).length, 18);
  const titleIndex = (title) => source.indexOf(`title: "${title}"`);
  for (let i = 0; i < expected.length - 1; i += 1) {
    assert.ok(titleIndex(expected[i]) < titleIndex(expected[i + 1]));
  }
  assert.match(source, /HTTP-метод и endpoint/);
  assert.match(source, /POST \/create/);
  assert.match(source, /201 Created/);
  assert.ok(source.includes("create.payment"), "Kafka payment topic example must be documented");
  assert.match(source, /401/);
  assert.match(source, /409 Conflict/);
  assert.match(source, /Критерий/);
  assert.match(source, /Smoke/);
  assert.match(source, /Гибридный подход/);
  assert.match(source, /Баг-репорт/);
  assert.match(source, /Шаги воспроизведения/);
  assert.match(source, /Test Summary Report/);
  assert.match(source, /Цели тестирования/);
  assert.match(source, /Severity/);
  assert.match(source, /Blocker/);
  assert.match(source, /Priority/);
  assert.match(source, /High/);
  assert.match(source, /Severity и Priority/);
  assert.match(source, /Bug Life Cycle/);
  assert.match(source, /Ready for Retest/);
  assert.match(source, /Feature Request/);
  assert.match(source, /Основные шаги документирования дефекта/);
  assert.match(source, /Production Bug/);
  assert.match(source, /TestRail/);
  assert.match(source, /Локализация бага/);
  assert.match(source, /Network/);
  assert.match(source, /Уточнение требований/);
  assert.match(source, /Атомарность/);
  assert.match(source, /Что это\? → Зачем\? → Из чего состоит\? → Пример/);
  assert.match(source, /15 фраз для запоминания/);
  assert.match(source, /Супер-шпаргалка/);
});
