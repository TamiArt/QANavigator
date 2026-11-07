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
    "Типы данных в SQL",
    "Основные SQL-команды: DDL и выбор базы",
    "SQL на практике: выборка, фильтрация и изменение данных",
    "CRUD: создание, чтение, изменение и удаление",
    "Продвинутый SQL: JOIN, GROUP BY, HAVING и UNION",
    "Установка MySQL Community Server",
    "Подключение к MySQL через командную строку",
  ];
  assert.equal((source.match(/id: "m7-\d{2}"/g) ?? []).length, 12);
  for (const term of [
    "три идеализированных свойства",
    "самую свежую запись",
    "не упавшему узлу",
    "Теорема CAP (теорема Брюера)",
    "CP-системы",
    "AP-системы",
    "eventual consistency",
    "Apache Cassandra",
    "CouchDB",
    "HBase"
  ]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing CAP concept: " + term);
  }
  for (const term of [
    "База данных (БД)",
    "СУБД (система управления базами данных)",
    "Три подхода к тестированию БД",
    "Прямой доступ к БД",
    "Тестирование через API",
    "Тестирование через фронтенд",
    "Реляционная база данных (РБД)",
    "INTEGER / INT / INT4",
    "VARCHAR(n)",
    "BOOLEAN",
    "TIMESTAMP",
    "Один к одному (1:1)",
    "Один ко многим (1:N)",
    "Многие ко многим (M:N)",
    "PostgreSQL",
    "Microsoft SQL Server",
    "семь основных типов",
    "Документоориентированные",
    "Ключ — значение",
    "Графовые",
    "Колоночно-ориентированные аналитические",
    "Базы широких строк",
    "Поисковые базы данных",
    "Базы временных рядов",
    "eventual consistency"
  ]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing Module 7 foundation: " + term);
  }
  for (const term of [
    "SQL-запрос",
    "SELECT column_1",
    "SELECT *",
    "WHERE",
    "Операторы сравнения",
    "BETWEEN",
    "IN",
    "обе границы включаются",
    "тот же приоритет",
    "Приоритет операторов в WHERE — от высшего к низшему",
    "NOT",
    "AND",
    "OR",
    "LIKE",
    "% — ноль, один или несколько любых символов",
    "**_** — ровно один любой символ",
    "DISTINCT",
    "COUNT(*)",
    "COUNT(DISTINCT",
    "SUM(column)",
    "AVG(column)",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL OUTER JOIN",
    "INSERT INTO",
    "UPDATE table_1",
    "DELETE FROM",
    "AS — псевдонимы",
    "sql-ex.ru",
    "sql-academy.org",
    "W3Schools SQL"
]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing SQL practice concept: " + term);
  }
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i - 1] < positions[i], "Lesson order is wrong at " + expected[i]);
  }
  for (const term of ["Primary Key", "Foreign Key", "MongoDB", "Redis", "ClickHouse", "Neo4j", "Elasticsearch", "InfluxDB", "шардирование", "CAP-теорема", "ACID", "Atomicity", "Consistency", "Isolation", "Durability", "ROLLBACK", "COMMIT", "1НФ", "2НФ", "3НФ", "One-to-Many", "Many-to-Many", "SHOW DATABASES;", "mysql -u root -p", "Structured Query Language", "DECIMAL", "VARCHAR", "INT4", "NULL", "INSERT INTO", "UPDATE users", "INNER JOIN", "FULL OUTER JOIN", "GROUP BY", "ORDER BY", "COUNT(DISTINCT", "HAVING", "UNION ALL", "One-to-One", "LIKE", "SELECT DISTINCT", "AS", "Прямой доступ к БД", "Через API", "Через фронтенд"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing key concept: " + term);
  }
});

test("SQL reference explains both LIKE wildcard characters", () => {
  const source = fs.readFileSync("src/app/handbook-data-part-3.ts", "utf8");
  assert.ok(source.includes("% — ноль или более любых символов"), "SQL reference must explain percent wildcard");
  assert.ok(source.includes("_ — ровно один любой символ"), "SQL reference must explain underscore wildcard");
});

test("SQL knowledge base documents WHERE operator precedence", () => {
  const source = fs.readFileSync("src/app/handbook-data-part-6.ts", "utf8");
  for (const term of [
    "Приоритет операторов в WHERE — от высшего к низшему",
    "BETWEEN",
    "IN",
    "LIKE",
    "IS NULL",
    "NOT",
    "AND",
    "OR"
  ]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing SQL precedence guidance: " + term);
  }
});

test("Module 7 is registered and every SQL lesson has a dedicated visual model", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(registry, /import \{ HANDBOOK_LEARNING_MODULE_7_LESSONS \} from "\.\/handbook-learning-module7"/);
  assert.match(registry, /id: "module-7-sql"[\s\S]*?title: "Модуль 7 — SQL"[\s\S]*?lessons: HANDBOOK_LEARNING_MODULE_7_LESSONS/);
  for (let i = 1; i <= 12; i += 1) {
    const id = "m7-" + String(i).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic model for " + id);
  }
});
