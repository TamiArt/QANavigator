import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 5 contains the 13 core lessons plus OSI/TCP-IP in the intended order", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module5.ts", "utf8");
  const expected = [
    "Как работают фронтенд и бэкенд вместе",
    "Клиент-серверная архитектура",
    "Модель TCP/IP",
    "DNS и проверка доступности через ping",
    "API: принцип работы и назначение",
    "HTTP и HTTPS",
    "HTTP-методы",
    "HTTP-статус-коды",
    "Модель OSI и TCP/IP: уровни сетевого взаимодействия",
    "REST, RESTful и JSON",
    "Swagger и документация API",
    "Что происходит после ввода URL",
    "Postman: тестирование API",
    "Тестирование интеграций",
  ];
  assert.equal((source.match(/id: "m5-\d{2}"/g) ?? []).length, 13);
  assert.ok(source.indexOf('title: "Модель OSI и TCP/IP: уровни сетевого взаимодействия"') > source.indexOf('id: "m5-osi-tcp-ip"'));
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], "Lesson order is wrong at " + expected[index]);
  }
  for (const term of ["TCP", "UDP", "DNS", "ICMP", "API", "HTTPS", "TLS", "GET", "POST", "PATCH", "201 Created", "401 Unauthorized", "REST", "JSON", "OpenAPI", "Postman", "Webhook", "идемпотент"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing key concept: " + term);
  }
});

test("Module 5 is registered in Learning Mode and has a visual summary for each lesson", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(registry, /import \{ HANDBOOK_LEARNING_MODULE_5_LESSONS \} from "\.\/handbook-learning-module5"/);
  assert.match(registry, /id: "module-5-network-api"[\s\S]*?title: "Модуль 5 — Сети, HTTP и тестирование API"[\s\S]*?lessons: HANDBOOK_LEARNING_MODULE_5_LESSONS/);
  const lessonIds = Array.from({ length: 13 }, (_, index) => "m5-" + String(index + 1).padStart(2, "0"));
  lessonIds.splice(8, 0, "m5-osi-tcp-ip");
  for (const id of lessonIds) {
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic model for " + id);
  }
});
