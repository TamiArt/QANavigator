import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function loadModel(relativePath) {
  const sourcePath = path.resolve(relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, console });
  return module.exports;
}

const rtm = loadModel("src/app/features/documentation/rtm-model.ts");
const documents = loadModel("src/app/features/documentation/document-markdown.ts");

const requirements = [
  { id: "1", reqId: "REQ-001", title: "Login", priority: "high" },
  { id: "2", reqId: "REQ-002", title: "Password reset", priority: "medium" },
];
const testCases = [
  { id: "1", tcId: "TC-001", title: "Valid login" },
  { id: "2", tcId: "TC-002", title: "Reset password" },
];
const links = new Set(["REQ-001:TC-001", "REQ-002:TC-002"]);

test("RTM coverage counts linked test cases per requirement", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(rtm.calculateRTMCoverage(requirements, testCases, links))),
    [
      { reqId: "REQ-001", total: 2, covered: 1 },
      { reqId: "REQ-002", total: 2, covered: 1 },
    ],
  );
});

test("RTM CSV contains requirement, test-case and coverage columns", () => {
  const csv = rtm.buildRTMCsv(requirements, testCases, links);
  assert.match(csv, /Требование,Описание,Приоритет,TC-001,TC-002,Покрытие/);
  assert.match(csv, /"REQ-001","Login",high,✓,,Покрыто/);
  assert.match(csv, /"REQ-002","Password reset",medium,,✓,Покрыто/);
});

test("RTM CSV escapes commas and quotes in requirement text", () => {
  const csv = rtm.buildRTMCsv(
    [{ id: "3", reqId: "REQ-003", title: 'Login, "remember me"', priority: "low" }],
    [],
    new Set(),
  );
  assert.match(csv, /"REQ-003","Login, ""remember me""",low,,Не покрыто/);
});

test("test case Markdown preserves document fields and fallback values", () => {
  const markdown = documents.buildTestCaseMarkdown({
    tcId: "TC-010",
    title: "",
    module: "Авторизация",
    preconditions: "",
    steps: "1. Открыть /login",
    expected: "Пользователь авторизован",
    actualResult: "",
    priority: "P1",
    severity: "high",
    status: "Ready",
    author: "",
    date: "2026-09-28",
    testData: "email=test@example.com",
  });

  assert.match(markdown, /^# Тест-кейс TC-010/m);
  assert.match(markdown, /\*\*Название:\*\* —/);
  assert.match(markdown, /\*\*Модуль\/Функция:\*\* Авторизация/);
  assert.match(markdown, /## Предусловия \*/);
  assert.match(markdown, /Заполняется при выполнении/);
  assert.match(markdown, /1\. Открыть \/login/);
});

test("test case Markdown keeps multiline steps and document metadata", () => {
  const markdown = documents.buildTestCaseMarkdown({
    tcId: "TC-011",
    title: "Успешный вход",
    module: "Login",
    preconditions: "Пользователь существует",
    steps: "1. Открыть /login\n2. Ввести пароль",
    expected: "Dashboard открыт",
    actualResult: "Dashboard открыт",
    priority: "P2",
    severity: "medium",
    status: "Approved",
    author: "QA",
    date: "2026-09-28",
    testData: "user@example.com",
  });

  assert.match(markdown, /\*\*Статус:\*\* Approved \| \*\*Автор:\*\* QA \| \*\*Дата:\*\* 2026-09-28/);
  assert.match(markdown, /1\. Открыть \/login\n2\. Ввести пароль/);
  assert.match(markdown, /## Фактический результат\nDashboard открыт/);
});
