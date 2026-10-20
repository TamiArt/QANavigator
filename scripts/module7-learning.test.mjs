import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 7 contains the SQL and database concepts in curriculum order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module7.ts", "utf8");
  const expected = [
    "Модели и классификация баз данных",
    "Реляционные базы данных: таблицы и ключи",
    "Нереляционные базы данных (NoSQL)",
    "Нормализация и денормализация",
    "Связи между таблицами",
    "Первое знакомство с SQL",
    "Установка MySQL Community Server",
    "Подключение к MySQL через командную строку",
  ];
  assert.equal((source.match(/id: "m7-\d{2}"/g) ?? []).length, 8);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i - 1] < positions[i], "Lesson order is wrong at " + expected[i]);
  }
  for (const term of ["Primary Key", "Foreign Key", "MongoDB", "Redis", "ClickHouse", "Neo4j", "1НФ", "2НФ", "3НФ", "One-to-Many", "Many-to-Many", "SHOW DATABASES;", "mysql -u root -p", "Structured Query Language"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing key concept: " + term);
  }
});

test("Module 7 is registered and every SQL lesson has a dedicated visual model", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(registry, /import \{ HANDBOOK_LEARNING_MODULE_7_LESSONS \} from "\.\/handbook-learning-module7"/);
  assert.match(registry, /id: "module-7-sql"[\s\S]*?title: "Модуль 7 — SQL"[\s\S]*?lessons: HANDBOOK_LEARNING_MODULE_7_LESSONS/);
  for (let i = 1; i <= 8; i += 1) {
    const id = "m7-" + String(i).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic model for " + id);
  }
});
