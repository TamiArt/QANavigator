import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const lessonFiles = [
  "src/app/features/handbook/handbook-learning.ts",
  "src/app/features/handbook/handbook-learning-module2.ts",
  "src/app/features/handbook/handbook-learning-module3.ts",
  "src/app/features/handbook/handbook-learning-module4.ts",
  "src/app/features/handbook/handbook-learning-module5.ts",
  "src/app/features/handbook/handbook-learning-module6.ts",
  "src/app/features/handbook/handbook-learning-module7.ts",
  "src/app/features/handbook/handbook-learning-module8.ts",
];

test("all Learning Mode lessons use the exact Module 1 infographic component", () => {
  const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  const module1 = fs.readFileSync("src/app/features/handbook/Module1LessonInfographics.tsx", "utf8");
  const rules = fs.readFileSync("docs/INFOGRAPHIC_DESIGN_PRINCIPLES.md", "utf8");
  const lessonIds = new Set();
  for (const file of lessonFiles) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/id:\s*["'`]((?:m\d+-|it-glossary-)[^"'`]+)["'`]/g)) lessonIds.add(match[1]);
  }
  const visualIds = new Set([...renderer.matchAll(/^\s*"([^"]+)": V\(/gm)].map((match) => match[1]));
  assert.equal(lessonIds.size, 91, "Expected all 91 Learning Mode lessons to be included");
  assert.deepEqual([...lessonIds].filter((id) => !visualIds.has(id)), [], "Every lesson must have its own visual model");
  assert.match(renderer, /Module1StyleInfographic visual=\{toModule1StyleVisual\(lessonTitle, configuredVisual\)\}/);
  assert.match(renderer, /Module1LessonInfographic lessonId=\{lesson\.id\}/);
  assert.doesNotMatch(renderer, /module2ImagePath|module5ImagePath|infographicImagePath|<img\s/);
  assert.match(module1, /export function Module1StyleInfographic/);
  assert.match(module1, /rounded-\[22px\] border-2 border-blue-100/);
  assert.match(module1, /columns-1 gap-2\.5/);
  assert.match(module1, /break-inside-avoid/);
  assert.match(module1, /Главное, что нужно запомнить/);
  assert.match(renderer, /text-\[9px\] font-semibold tracking-wide text-slate-400">QA Navigator/);
  assert.match(rules, /Стиль Модуля 1 применяется ко всем урокам Модулей 1–8 и IT-глоссария без исключений/);
  assert.match(rules, /Пустые ячейки-заглушки разрешены/);
});

test("Module 1 visual rules define the approved shared poster language", () => {
  const rules = fs.readFileSync("docs/INFOGRAPHIC_DESIGN_PRINCIPLES.md", "utf8");
  for (const phrase of ["вертикальный poster-формат", "светлый фон", "цветные номера секций", "тёмно-синие заголовки", "мягкую пастельную палитру", "flat-vector иллюстрации", "нижний блок", "Читаемость важнее плотности", "QA Navigator"]) {
    assert.ok(rules.includes(phrase), "Missing design rule: " + phrase);
  }
});

test("lesson infographic downloads are rendered from the same poster component", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(source, /function PdfDownloadButton/);
  assert.match(source, /html2canvas/);
  assert.match(source, /jsPDF/);
  assert.match(source, /link\.download = decodeURIComponent\(imagePath\.split\("\/"\)\.pop\(\) \|\| "infographic"\)/);
  assert.match(source, /setError\("Не удалось сохранить файл\. Попробуйте ещё раз\."\)/);
});
