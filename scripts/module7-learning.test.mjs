import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 7 keeps its lesson identifiers and curriculum order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module7.ts", "utf8");
  const expected = [
    "Модели и классификация баз данных",
    "Реляционные базы данных: таблицы и ключи",
    "Нереляционные базы данных (NoSQL)",
    "Нормализация и денормализация",
    "Связи между таблицами",
    "Типы данных в SQL",
    "Основные SQL-команды: DDL и выбор базы",
    "SQL на практике: выборка, фильтрация и изменение данных",
    "CRUD: создание, чтение, изменение и удаление",
    "Продвинутый SQL: JOIN, GROUP BY, HAVING и UNION",
    "Установка MySQL Community Server",
    "Подключение к MySQL через командную строку",
  ];
  assert.equal((source.match(/id: "m7-\d{2}"/g) ?? []).length, expected.length);
  const positions = expected.map((title) => source.indexOf('title: "' + title + '"'));
  assert.ok(positions.every((position) => position >= 0), "Every lesson must have a title");
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], "Lesson order must follow the curriculum");
  }
});

test("Module 7 lesson templates contain no unescaped Markdown backticks", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module7.ts", "utf8");
  let unescapedCount = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) !== 96) continue;
    let precedingBackslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) {
      precedingBackslashes += 1;
    }
    if (precedingBackslashes % 2 === 0) unescapedCount += 1;
  }
  assert.equal(unescapedCount, 24, "Only the 12 lesson template openings and closings may use unescaped backticks");
});
test("Module 7 is registered and every SQL lesson has a dedicated visual model", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(registry, /import \{ HANDBOOK_LEARNING_MODULE_7_LESSONS \} from "\.\/handbook-learning-module7"/);
  assert.match(registry, /id: "module-7-sql"[\s\S]*?title: "Модуль 7 — SQL"[\s\S]*?lessons: HANDBOOK_LEARNING_MODULE_7_LESSONS/);
  const noSqlVisual = visuals.slice(visuals.indexOf('"m7-03": V('), visuals.indexOf('"m7-04": V('));
  assert.ok(noSqlVisual.includes("Документоориентированные"), "NoSQL infographic must use the full document-oriented model name");
  assert.ok(!noSqlVisual.includes('"Документы"'), "NoSQL infographic must not use the shortened label");
  const sqlLessonVisual = visuals.slice(visuals.indexOf('"m7-07": V('), visuals.indexOf('"m7-08": V('));
  for (const term of [
    "SQL (Structured Query Language — язык структурированных запросов)",
    "Декларативный язык для определения структуры реляционной базы",
    "Зачем SQL тестировщику",
    "SQL-запрос",
    "SELECT name FROM users WHERE status = 'active';",
    "SELECT → FROM → JOIN → ON → WHERE",
    "SELECT выбирает столбцы и выражения",
    "FROM указывает исходную таблицу",
    "JOIN присоединяет данные из другой таблицы",
    "ON задаёт условие соединения таблиц",
    "WHERE фильтрует строки по условию",
    "SELECT → FROM → WHERE",
    "BETWEEN",
    "IN",
    "INSERT INTO ... VALUES",
    "UPDATE ... SET ... WHERE",
    "DELETE FROM ... WHERE",
    "CREATE DATABASE",
    "SHOW DATABASES",
    "USE mydb",
    "DROP DATABASE",
    "CREATE TABLE",
    "DROP TABLE",
    "DESC",
    "GRANT",
    "REVOKE",
    "COMMIT",
    "ROLLBACK",
    "Транзакция",
    "списания с одного счёта",
    "Atomicity (атомарность)",
    "Consistency (согласованность)",
    "Isolation (изолированность)",
    "Durability (долговечность)",
    "PRIMARY KEY",
    "FOREIGN KEY",
    "CHECK",
    "два пользователя одновременно покупают последний товар",
    "подтверждённый заказ остаётся в базе после перезагрузки сервера",
    "банковских операций, бухгалтерии, заказов, платежей и остатков товаров",
    "SHOW DATABASES и USE — команды MySQL"
  ]) {
    assert.ok(sqlLessonVisual.includes(term), "SQL lesson infographic is missing: " + term);
  }
  assert.ok((sqlLessonVisual.match(/\\{ title:/g) ?? []).length >= 16, "SQL lesson infographic must cover all lesson sections");
  for (let i = 1; i <= 12; i += 1) {
    const id = "m7-" + String(i).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic model for " + id);
  }
});
