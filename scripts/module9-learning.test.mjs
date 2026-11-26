import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 9 is registered after Mobile QA and contains nine ordered lessons", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module9.ts", "utf8");
  const expected = [
  "Микросервисная архитектура: путь операции и синхронная обработка",
  "Логи: уровни, типы, traceId и централизованный сбор",
  "Kibana Discover: поиск, фильтры и расследование по traceId",
  "Apache Kafka: события, топики, партиции и consumer groups",
  "Kafka: надёжность, acks, репликация, повторы и идемпотентность",
  "CI/CD и Jenkins: pipeline, build, deploy и rollback",
  "Finverse Bank: архитектура, сервисы, базы данных и API-контракты",
  "Платежи, P2P, антифрод и бизнес-правила Finverse",
  "Сквозное расследование инцидента и вопросы QA на собеседовании"
];
  assert.ok(registry.includes('id: "module-9-distributed-systems"'));
  assert.ok(registry.includes('title: "Модуль 9 — Микросервисы, Kafka, логи и расследование инцидентов"'));
  assert.ok(registry.includes("lessons: HANDBOOK_LEARNING_MODULE_9_LESSONS"));
  assert.ok(registry.includes('from "./handbook-learning-module9"'));
  assert.equal(source.split('id: "m9-').length - 1, 9);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: ' + JSON.stringify(title));
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let i = 1; i < positions.length; i += 1) assert.ok(positions[i - 1] < positions[i], "Incorrect order: " + expected[i]);
});

test("Every Module 9 lesson has its own infographic model", () => {
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  for (let i = 1; i <= 9; i += 1) {
    const id = "m9-" + String(i).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic for " + id);
  }
});

test("Module 9 covers the requested distributed-system investigation topics", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module9.ts", "utf8").toLowerCase();
  for (const term of ["reverse proxy", "jwt", "eventual consistency", "traceid", "fluent-bit", "kql", "discover", "producer", "consumer", "consumer group", "offset", "acks=0", "acks=1", "acks=all", "idempotency", "jenkins", "rollback", "swagger ui", "openapi", "antifraud", "p2p", "paymentid", "mongodb", "adminer", "glitchtip", "prometheus", "grafana", "camunda"]) {
    assert.ok(source.includes(term), "Missing topic: " + term);
  }
});

test("Module 9 lesson templates preserve all nine lesson bodies", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module9.ts", "utf8");
  assert.equal((source.match(/id: "m9-\d{2}"/g) || []).length, 9);
  assert.equal((source.match(/content: "/g) || []).length, 9);
});
