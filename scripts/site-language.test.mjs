import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

test("language preference is persistent and validated", () => {
  const constants = read("src/app/core/constants.ts");
  const validators = read("src/app/core/storage-validators.ts");
  const app = read("src/app/App.tsx");
  assert.match(constants, /language: "qa_nav_language"/);
  assert.match(validators, /data === "ru" \|\| data === "en"/);
  assert.match(app, /useLocalStorage<Language>\(STORAGE_KEYS\.language, "ru", isLanguageStorageValue\)/);
  assert.match(app, /setLanguage\(language === "en" \? "ru" : "en"\)/);
  assert.match(app, /language\.toUpperCase\(\)/);
  assert.match(app, /document\.documentElement\.lang = language/);
  assert.match(app, /aria-pressed=\{language === "en"\}/);
});

test("English navigation labels cover all application sections", () => {
  const navigation = read("src/app/domain/navigation.ts");
  const app = read("src/app/App.tsx");
  const navigationItems = navigation.match(/^\s*\{ id: \s*["'][^"']+["'],.*$/gm) ?? [];
  const translatedItems = navigationItems.filter((item) => /\blabelEn:\s*["'][^"']+["']/.test(item));

  assert.ok(navigationItems.length > 0, "Navigation must define at least one item");
  assert.equal(
    translatedItems.length,
    navigationItems.length,
    "Every navigation item must define a non-empty English label",
  );
  assert.match(app, /language === "en" \? item\.labelEn : item\.label/);
  assert.match(app, /language === "en" \? NAV_ITEMS\.find/);
});

test("learning mode exposes English navigation and remembers the selected locale", () => {
  const mode = read("src/app/features/handbook/HandbookLearningMode.tsx");
  const i18n = read("src/app/core/i18n.ts");
  assert.match(mode, /const \{ language \} = useApp\(\)/);
  assert.match(mode, /translate\(language, "learning\.courseProgress"\)/);
  assert.match(mode, /getModuleTitle\(language, item\.id, item\.title\)/);
  assert.match(mode, /getLearningLessonTitle\(activeLesson, language\)/);
  assert.match(i18n, /"learning\.quickNavigation": "Quick navigation"/);
  assert.match(i18n, /"module\.module-8-mobile-testing": "Module 8 — Mobile Testing"/);
});

test("Module 1 lesson 1 has an English version based on the supplied lesson text", () => {
  const i18n = read("src/app/core/i18n.ts");
  const learning = read("src/app/features/handbook/handbook-learning.ts");
  assert.match(learning, /lesson\.id === "m1-01"\) return getTestingLessonContent\(language\)/);
  for (const phrase of [
    "What is software testing?",
    "Detect inconsistencies as early as possible.",
    "Assess risks and release readiness.",
    "requirements, documentation, and design",
    "Requirement → expected result",
    "Actual result → comparison → test result / defect",
  ]) assert.ok(i18n.includes(phrase), "Missing English lesson content: " + phrase);
});

test("Module 1 lesson 1 infographic includes a visual workflow and all five testing goals", () => {
  const infographic = read("src/app/features/handbook/LearningInfographic.tsx");
  assert.match(infographic, /function TestingDefinitionDiagram/);
  assert.match(infographic, /Requirement/);
  assert.match(infographic, /Expected result/);
  assert.match(infographic, /Run the check/);
  assert.match(infographic, /Actual result/);
  assert.match(infographic, /Compare/);
  assert.match(infographic, /Find issues early/);
  assert.match(infographic, /Build confidence/);
  assert.match(infographic, /Assess release risks/);
  assert.match(infographic, /Serve users/);
  assert.match(infographic, /Review more than code/);
  assert.match(infographic, /TestingDefinitionDiagram language=\{language\}/);
});
