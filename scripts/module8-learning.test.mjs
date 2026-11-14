import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const modulePath = "src/app/features/handbook/handbook-learning-module8.ts";
const expected = [
  "База мобильного тестирования и сенсоры (Touchscreen)",
  "Виды мобильных приложений и WebView",
  "Push-уведомления и их тестирование",
  "Android vs iOS: особенности платформ",
  "Снифферы: Charles Proxy и Proxyman",
  "Git: установка и начальная настройка",
  "Инструменты мобильного QA: ADB и Firebase",
  "Вопросы с собеседований по мобильному тестированию",
];

test("Module 8 contains eight Mobile QA lessons in the approved order", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.equal((source.match(/id: "m8-\d{2}"/g) ?? []).length, 8);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let i = 1; i < positions.length; i += 1) assert.ok(positions[i - 1] < positions[i]);
  for (const term of [
    "Touchscreen", "Interrupt Testing", "Native", "Hybrid", "PWA", "WebView",
    "Push", "Android", "iOS", "Charles Proxy", "Proxyman", "SSL Proxying",
    "git clone", "git pull", "git reset", "ADB", "logcat", "Crashlytics",
    "Developer Options", "Activity", "Service Worker", "certificate pinning",
    "adb push", "adb pull",
  ]) assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing Mobile QA concept: " + term);
});

test("Module 8 is registered after SQL and every lesson has a semantic infographic", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const sql = registry.indexOf('id: "module-7-sql"');
  const mobile = registry.indexOf('id: "module-8-mobile-testing"');
  assert.ok(sql >= 0 && mobile > sql);
  assert.ok(registry.includes('import { HANDBOOK_LEARNING_MODULE_8_LESSONS } from "./handbook-learning-module8";'));
  assert.ok(registry.includes('title: "Модуль 8 — Мобильное тестирование"'));
  assert.ok(registry.includes("lessons: HANDBOOK_LEARNING_MODULE_8_LESSONS"));
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  for (let i = 1; i <= 8; i += 1) {
    const id = "m8-" + String(i).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic for " + id);
  }
});
