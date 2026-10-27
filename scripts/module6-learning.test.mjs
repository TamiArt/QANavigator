import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 6 contains structured API-adjacent lessons without repeating the Module 5 curriculum", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module6.ts", "utf8");
  const expected = [
    "Браузерные хранилища: Cache, Cookies, localStorage и sessionStorage",
    "User-Agent, аутентификация и авторизация",
    "Feature Flags и архитектура: монолит и микросервисы",
    "SOAP, XML, WSDL и XSD",
    "Логи, ELK-стек и уровни логирования",
    "Асинхронная обработка и брокеры сообщений",
    "Другие способы взаимодействия API: GraphQL, gRPC и WebSocket",
    "Тестирование API: инструменты, ложный 200 OK и заглушки",
  ];
  assert.equal((source.match(/id: "m6-\d{2}"/g) ?? []).length, 8);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], "Lesson order is wrong at " + expected[index]);
  }
  for (const term of ["localStorage", "sessionStorage", "HttpOnly", "User-Agent", "Basic Auth", "Bearer Token", "JWT", "OAuth 2.0", "Feature Flag", "SOAP", "WSDL", "XSD", "Elasticsearch", "Kibana", "202 Accepted", "RabbitMQ", "Kafka", "GraphQL", "gRPC", "WebSocket", "Mock", "Stub", "Fake", "CastleMock", "ложный 200"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing key concept: " + term);
  }
});

test("Module 6 is registered in Learning Mode and has a visual summary for every lesson", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(registry, /import \{ HANDBOOK_LEARNING_MODULE_6_LESSONS \} from "\.\/handbook-learning-module6"/);
  assert.match(registry, /id: "module-6-api"[\s\S]*?title: "Модуль 6 — Работа с API"[\s\S]*?lessons: HANDBOOK_LEARNING_MODULE_6_LESSONS/);
  for (let index = 1; index <= 8; index += 1) {
    const id = "m6-" + String(index).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic model for " + id);
  }
});
