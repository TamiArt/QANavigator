import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("learning mode contains exactly the approved Module 1 lessons", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const expected = [
    "Что такое тестирование?",
    "Термины: QA, QC, Testing",
    "Принципы тестирования",
    "Верификация и валидация",
    "Требования",
    "SDLC: Жизненный цикл разработки ПО",
    "STLC: Жизненный цикл тестирования ПО",
    "Severity vs Priority: Серьёзность и срочность багов",
    "Виды тестирования: классификация с примерами",
    "Пирамида тестирования: Уровни и их назначения",
    "Техники тест-дизайна: как придумывать тест-кейсы",
  ];
  for (const title of expected) assert.ok(source.includes(`title: "${title}"`), title);
  assert.equal((source.match(/id: "m1-\d{2}"/g) ?? []).length, 11);
});

test("learning lesson range configuration excludes unrelated content", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  assert.match(source, /sectionEnd: "\*\*STLC/);
  assert.match(source, /sectionStart: "### Severity vs Priority:/);
  assert.match(source, /sectionStart: "## Пирамида тестирования"/);
  assert.ok(source.includes('sectionEnd: "---\\n\\n## CI/CD"'));
});

test("learning progress uses the existing versioned local storage boundary", () => {
  const constants = fs.readFileSync("src/app/core/constants.ts", "utf8");
  assert.match(constants, /handbookLearningProgress: "qa_navigator_handbook_learning_progress"/);
});

test("every module lesson and existing-image lesson uses the Module 1 infographic layout", () => {
  const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  const shared = fs.readFileSync("src/app/features/handbook/Module1LessonInfographics.tsx", "utf8");
  for (const id of ["m2-04", "m2-05", "m4-01", "m4-02", "m4-03", "m4-04", "m5-02", "m5-03", "m5-04", "m5-05", "m5-06", "m5-07", "m5-08", "m5-osi-tcp-ip", "m5-09", "m5-10", "m5-12"]) {
    assert.ok(renderer.includes('"' + id + '": V('), "Missing topic visual model: " + id);
  }
  assert.match(renderer, /Module1StyleInfographic visual=\{toModule1StyleVisual\(lessonTitle, configuredVisual\)\}/);
  assert.match(shared, /export function Module1StyleInfographic/);
  assert.doesNotMatch(renderer, /module2ImagePath|module5ImagePath|infographicImagePath|<img\s/);
  assert.match(renderer, /text-\[9px\] font-semibold tracking-wide text-slate-400">QA Navigator/);
});

test("IT glossary has its own infographic model in the shared Module 1 style", () => {
  const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(renderer, /"it-glossary-01": V\("network"/);
  assert.match(renderer, /Module1StyleInfographic visual=\{toModule1StyleVisual/);
});

test("Module 1 poster cards reserve readable text areas and avoid overflow", () => {
  const shared = fs.readFileSync("src/app/features/handbook/Module1LessonInfographics.tsx", "utf8");
  assert.match(shared, /min-w-0/);
  assert.match(shared, /rounded-\[18px\]/);
  assert.match(shared, /break-inside-avoid/);
  assert.match(shared, /text-\[10px\] leading-\[1\.55\]/);
  assert.match(shared, /p-3/);
  assert.match(shared, /rounded-\[22px\] border-2 border-blue-100/);
});
test("Handbook exposes a reachable Learning Mode from the knowledge base", () => {
  const source = fs.readFileSync("src/app/features/handbook/HandbookModule.tsx", "utf8");
  assert.match(source, /HandbookLearningMode/);
  assert.match(source, /onClick=\{\(\) => setLearningMode\(true\)\}/);
  assert.match(source, /if \(learningMode\)/);
  assert.match(source, /onBack=\{\(\) => setLearningMode\(false\)\}/);
});

test("Learning Mode renders only the active lesson infographic", () => {
  const source = fs.readFileSync("src/app/features/handbook/HandbookLearningMode.tsx", "utf8");
  assert.match(source, /LearningInfographic/);
  assert.doesNotMatch(source, /<LearningInfographic mode="module"/);
  assert.match(source, /mode="lesson"/);
});

test("Lesson infographics expose semantic diagram structure", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  for (const kind of ["FlowDiagram", "TimelineDiagram", "ChecklistDiagram", "CompareDiagram", "NetworkDiagram", "DiagramLabelStrip"]) {
    assert.match(source, new RegExp(`function ${kind}`));
  }
  assert.match(source, /aria-label="Ключевая схема"/);
  assert.match(source, /function PdfDownloadButton/);
  assert.match(source, /html2canvas/);
  assert.match(source, /jsPDF/);
  assert.match(source, /Понятие/);
  assert.match(source, /Что важно помнить/);
});

test("Learning Mode provides direct module and lesson navigation", () => {
  const source = fs.readFileSync("src/app/features/handbook/HandbookLearningMode.tsx", "utf8");
  assert.match(source, /aria-label=\{language === "en" \? "Module and lesson navigation" : "Навигация по модулям и темам"\}/);
  assert.match(source, /role="group" aria-label=\{translate\(language, "learning\.moduleChoice"\)\}/);
  assert.match(source, /aria-current=\{isActive \? "step" : undefined\}/);
  assert.doesNotMatch(source, /role="tablist"|role="tab"/);
  assert.match(source, /Перейти к теме/);
  assert.match(source, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(source, /learning-module-content/);
  assert.match(source, /id="learning-module-content"/);
  assert.match(source, /data-active-lesson-id=\{activeLesson\?\.id \?\? module\.id\}/);
});



test("Learning Mode remains directly reachable on mobile layouts", () => {
  const source = fs.readFileSync("src/app/features/handbook/HandbookModule.tsx", "utf8");
  assert.match(source, /aria-label="Открыть режим обучения"/);
  assert.match(source, /className="[^"]*w-full[^"]*sm:w-auto/);
  assert.match(source, /onClick=\{\(\) => setLearningMode\(true\)\}/);
  assert.match(source, /if \(learningMode\)/);
});


test("Infographic text contrast contract covers semantic blocks", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  for (const className of [
    "text-blue-950 dark:text-black",
    "text-slate-700 dark:text-black",
    "text-slate-600 dark:text-black",
    "text-blue-900 dark:text-black",
    "text-blue-800 dark:text-black",
  ]) assert.ok(source.includes(className), className);
});

test("Learning infographics use the illustrated QA poster visual language", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(source, /Ключевая схема/);
  assert.match(source, /Инфографика модуля/);
  assert.match(source, /Сохранить/);
  assert.match(source, /<h4 className="text-base font-extrabold leading-6 text-blue-950 dark:text-black sm:text-lg">\{lessonTitle\}<\/h4>/);
  assert.match(source, /p-3 sm:p-4/);
  assert.match(source, /rounded-\[28px\]/);
  assert.match(source, /border-2/);
  assert.match(source, /bg-sky-50/);
  assert.match(source, /shadow-\[2px_3px_0_rgba\(30,64,175,0\.07\)\]/);
});


test("Learning infographics keep the poster hierarchy and per-lesson identity", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(source, /rotate-\[-0\.35deg\]/);
  assert.match(source, /rotate-\[0\.35deg\]/);
  assert.match(source, /bg-white\/80/);
});

test("IT glossary is available in both the knowledge base and Learning Mode", () => {
  const curriculum = fs.readFileSync("src/app/handbook-curriculum.ts", "utf8");
  const learning = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  for (const term of ["Шерить", "Аппка", "Апрув", "Гейзенбаг", "Флаки-тест", "CI/CD", "WIP-лимит", "Контейнеризация", "Фишинг", "Frontend Developer", "Системный аналитик", "Project Manager"]) {
    assert.ok(curriculum.includes(term), `Glossary term missing: ${term}`);
  }
  assert.match(curriculum, /id: "it-glossary"/);
  assert.match(curriculum, /"it-glossary",/);
  assert.match(learning, /id: "module-it-glossary"/);
  assert.match(learning, /title: "Словарь IT-терминов и процессов"/);
  assert.match(learning, /topicIds: \["it-glossary"\]/);
});

test("Learning Mode opens the active lesson without repeating the full topic list", () => {
  const source = fs.readFileSync("src/app/features/handbook/HandbookLearningMode.tsx", "utf8");
  assert.ok(!source.includes('<LearningInfographic mode="module"'), "Module topic overview must not appear before every lesson");
  assert.ok(!source.includes('<span className="text-sm text-foreground">{lesson.title}</span>'), "Full lesson-title list must not be repeated before the active lesson");
  assert.match(source, /<LearningInfographic mode="lesson" lesson=\{activeLesson\} \/>/);
  assert.match(source, /<MarkdownView content=\{getLearningLessonContent\(activeLesson, language\)\} compact extraCompactLists=\{activeLesson\.id === "m1-01"\} \/>/);
});


test("Learning Mode renders lesson Markdown with compact, normalized spacing", () => {
  const renderer = fs.readFileSync("src/app/components/shared.tsx", "utf8");
  const learningMode = fs.readFileSync("src/app/features/handbook/HandbookLearningMode.tsx", "utf8");
  assert.match(renderer, /compact = false/);
  assert.ok(renderer.includes('.replace(/\\n[ \\t]*\\n(?:[ \\t]*\\n)+/g, "\\n\\n")'));
  assert.match(renderer, /compact \? "<br\/>" : "<br\/><br\/>"/);
  assert.match(renderer, /compact \? "mt-3 mb-1" : "mt-5 mb-2"/);
  assert.equal((renderer.match(/extraCompactLists \? "mb-0 leading-\[1\.05\] text-\[13px\]"/g) || []).length, 5, "All numbered, bulleted, and status lists should support extra-compact spacing");
  assert.match(learningMode, /extraCompactLists=\{activeLesson\.id === "m1-01"\}/, "Extra-compact list spacing must be limited to Lesson 1: What is testing?");
  assert.match(learningMode, /className="bg-card border border-border rounded-xl p-4 scroll-mt-24"/);
  assert.match(learningMode, /className="mt-3"[\s\S]*MarkdownView content=\{getLearningLessonContent\(activeLesson, language\)\} compact/);
});


test("Learning Mode navigation continues across module boundaries and preserves lesson progress", () => {
  const source = fs.readFileSync("src/app/features/handbook/HandbookLearningMode.tsx", "utf8");
  assert.match(source, /const isFirstLesson = moduleIndex === 0 && activeIndex === 0/);
  assert.match(source, /const isLastLesson = module\.lessons\.length > 0/);
  assert.match(source, /const previousModuleIndex = moduleIndex - 1/);
  assert.match(source, /setActiveIndex\(Math\.max\(0, HANDBOOK_LEARNING_MODULES\[previousModuleIndex\]\.lessons\.length - 1\)\)/);
  assert.match(source, /setModuleIndex\(moduleIndex \+ 1\)/);
  assert.match(source, /setActiveIndex\(0\)/);
  assert.match(source, /markCompleted\(\);[\s\S]*?if \(module\.lessons\.length === 0\)/);
  assert.match(source, /else if \(activeIndex < module\.lessons\.length - 1\)/);
  assert.match(source, /disabled=\{isFirstLesson\}/);
  assert.match(source, /disabled=\{isLastLesson\}/);
  assert.match(source, /translate\(language, "learning\.nextModule"\)/);
  assert.match(source, /aria-label=\{translate\(language, "learning\.goPrevious"\)\}/);
  assert.match(source, /aria-label=\{moduleIndex < HANDBOOK_LEARNING_MODULES\.length - 1/);
  assert.match(source, /aria-controls="learning-module-content"/);
  assert.match(source, /role="group" aria-label=\{translate\(language, "learning\.moduleChoice"\)\}/);
  assert.doesNotMatch(source, /role="tablist"|role="tab"/, "Module selector uses button semantics, not incomplete tab semantics");
  assert.match(source, /\{translate\(language, "learning\.courseProgress"\)\}: \{totalCompletedCount\}\/\{allLessons\.length\}/);
  assert.match(source, /const totalProgressPercent = allLessons\.length/);
  assert.match(source, /id="learning-module-content"/);
  assert.match(source, /data-active-lesson-id=\{activeLesson\?\.id \?\? module\.id\}/);
  assert.match(source, /<button\s+type="button"\s+onClick=\{onBack\}/);
  assert.match(source, /<button\s+type="button"\s+onClick=\{markCompleted\}/);
});

