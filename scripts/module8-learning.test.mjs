import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 8 is registered after SQL and contains eight ordered Mobile QA lessons", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module8.ts", "utf8");
  const expected = [
    "База мобильного тестирования, сенсоры и окружение",
    "Виды мобильных приложений и тестирование WebView",
    "Push-уведомления: устройство работы и тестирование",
    "Android vs iOS: платформенные особенности для QA",
    "Снифферы мобильного трафика: Charles Proxy и Proxyman",
    "Установка и начальная настройка Git",
    "ADB, Firebase, Developer Options и расширенный доступ",
    "Вопросы с собеседований по мобильному тестированию",
  ];
  assert.ok(registry.includes('id: "module-8-mobile-testing"'));
  assert.ok(registry.includes('title: "Модуль 8 — Мобильное тестирование"'));
  assert.ok(registry.includes("lessons: HANDBOOK_LEARNING_MODULE_8_LESSONS"));
  assert.ok(registry.includes('from "./handbook-learning-module8"'));
  assert.equal(source.split('id: "m8-').length - 1, 8);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: "' + title + '"');
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let i = 1; i < positions.length; i += 1) assert.ok(positions[i - 1] < positions[i], "Incorrect order: " + expected[i]);
});

test("Module 8 covers the requested mobile testing concepts", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module8.ts", "utf8");
  const required = [
    "Interrupt Testing", "Pull-to-refresh", "pinch", "TestFlight", "Build Variants",
    "Native", "Hybrid", "PWA", "WebView", "APNs", "FCM", "Foreground", "Background",
    "Human Interface Guidelines", "Material Design", "фрагментация", "Charles Proxy",
    "Proxyman", "SSL Proxying", "Rewrite", "Breakpoint", "git --version",
    "git config --global", "adb logcat", "adb pull", "adb push", "Crashlytics",
    "Developer Options", "Root", "Jailbreak", "Activity", "onCreate()", "onResume()",
    "Service Worker", "offline",
  ];
  for (const term of required) assert.ok(source.toLowerCase().includes(term.toLowerCase()), "Missing Module 8 concept: " + term);
});

test("Every Module 8 lesson has its own infographic model", () => {
  const visuals = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  for (let i = 1; i <= 8; i += 1) {
    const id = "m8-" + String(i).padStart(2, "0");
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic for " + id);
  }
});

test("Module 8 lesson templates contain only the expected template delimiters", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module8.ts", "utf8");
  let unescapedCount = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) !== 96) continue;
    let precedingBackslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && source[cursor] === String.fromCharCode(92); cursor -= 1) precedingBackslashes += 1;
    if (precedingBackslashes % 2 === 0) unescapedCount += 1;
  }
  assert.equal(unescapedCount, 16, "Only eight lesson template openings and closings may use unescaped backticks");
});
