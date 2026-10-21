import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 6 contains the practical API testing curriculum in order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module6.ts", "utf8");
  const expected = [
    "Из чего состоит API-запрос и ответ",
    "Параметры и заголовки запроса",
    "Авторизация и права доступа",
    "JSON: типы, обязательные поля и значения",
    "Статусы и содержание ответа",
    "Негативные сценарии и граничные значения",
    "Контракт API и схема ответа",
    "Пагинация, фильтрация и сортировка",
    "Повторные запросы и идемпотентность",
    "Сквозной API-сценарий и поиск дефекта",
  ];
  assert.equal(source.split('id: "m6-').length - 1, 10);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], "Lesson order is wrong at " + expected[index]);
  }
  for (const term of ["Content-Type", "401 Unauthorized", "403 Forbidden", "JSON", "OpenAPI", "null", "Idempotency-Key", "orderId"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing key concept: " + term);
  }
});

test("Module 6 is registered and every API practice lesson has a dedicated visual model", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.ok(registry.includes('import { HANDBOOK_LEARNING_MODULE_6_LESSONS } from "./handbook-learning-module6";'));
  assert.ok(registry.includes('id: "module-6-api",\n    title: "Модуль 6 — Практика тестирования API",\n    lessons: HANDBOOK_LEARNING_MODULE_6_LESSONS,'));
  for (let index = 1; index <= 10; index += 1) {
    const id = "m6-" + String(index).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic model for " + id);
  }
});
