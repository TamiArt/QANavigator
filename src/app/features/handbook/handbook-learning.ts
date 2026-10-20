import { HANDBOOK } from "../../handbook-data";
import { HANDBOOK_LEARNING_MODULE_2_LESSONS } from "./handbook-learning-module2";
import { HANDBOOK_LEARNING_MODULE_3_LESSONS } from "./handbook-learning-module3";
import { HANDBOOK_LEARNING_MODULE_4_LESSONS } from "./handbook-learning-module4";
import { HANDBOOK_LEARNING_MODULE_5_LESSONS } from "./handbook-learning-module5";
import { HANDBOOK_LEARNING_MODULE_7_LESSONS } from "./handbook-learning-module7";


export interface LearningLesson {
  id: string;
  title: string;
  topicIds: string[];
  sectionStart?: string;
  sectionEnd?: string;
  content?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  lessons: readonly LearningLesson[];
}

export const HANDBOOK_LEARNING_MODULES: readonly LearningModule[] = [
  {
    id: "module-1-testing-theory",
    title: "Модуль 1 — Теория тестирования",
    lessons: [
      { id: "m1-01", title: "Что такое тестирование?", topicIds: ["fundamentals-testing"] },
      { id: "m1-02", title: "Термины: QA, QC, Testing", topicIds: ["f1"] },
      { id: "m1-03", title: "Принципы тестирования", topicIds: ["f2"] },
      { id: "m1-04", title: "Верификация и валидация", topicIds: ["f7"] },
      { id: "m1-05", title: "Требования", topicIds: ["fundamentals-requirements"] },
      { id: "m1-06", title: "SDLC: Жизненный цикл разработки ПО", topicIds: ["f6"], sectionStart: "## SDLC и STLC", sectionEnd: "**STLC (Software Testing Life Cycle)**" },
      { id: "m1-07", title: "STLC: Жизненный цикл тестирования ПО", topicIds: ["f6"], sectionStart: "**STLC (Software Testing Life Cycle)**" },
      { id: "m1-08", title: "Severity vs Priority: Серьёзность и срочность багов", topicIds: ["doc1"], sectionStart: "### Severity vs Priority:" },
      { id: "m1-09", title: "Виды тестирования: классификация с примерами", topicIds: ["fundamentals-classification"] },
      { id: "m1-10", title: "Пирамида тестирования: Уровни и их назначения", topicIds: ["auto3"], sectionStart: "## Пирамида тестирования", sectionEnd: "---\n\n## CI/CD" },
      { id: "m1-11", title: "Техники тест-дизайна: как придумывать тест-кейсы", topicIds: ["td1", "td2", "td3", "td4", "td5", "td6"] },
    ],
  },
  {
    id: "module-2-project-context",
    title: "Модуль 2 — Погружение в контекст",
    lessons: HANDBOOK_LEARNING_MODULE_2_LESSONS,
  },
  {
    id: "module-3-frontend",
    title: "Модуль 3 — Тестирование фронтенда",
    lessons: HANDBOOK_LEARNING_MODULE_3_LESSONS,
  },
  {
    id: "module-it-glossary",
    title: "Словарь IT-терминов и процессов",
    lessons: [
      { id: "it-glossary-01", title: "Основные IT-термины и жаргон", topicIds: ["it-glossary"] },
    ],
  },
  {
    id: "module-4-test-documentation",
    title: "Модуль 4 — Тестовая документация",
    lessons: HANDBOOK_LEARNING_MODULE_4_LESSONS,
  },
  {
    id: "module-5-network-api",
    title: "Модуль 5 — Сети, HTTP и тестирование API",
    lessons: HANDBOOK_LEARNING_MODULE_5_LESSONS,
  },
  {
    id: "module-6-api",
    title: "Модуль 6 — Работа с API",
    lessons: [],
  },
  {
    id: "module-7-sql",
    title: "Модуль 7 — SQL",
    lessons: HANDBOOK_LEARNING_MODULE_7_LESSONS,
  },
];

function findTopic(topicId: string) {
  return HANDBOOK.find((topic) => topic.id === topicId);
}

function extractRange(content: string, start?: string, end?: string): string {
  const startIndex = start ? content.indexOf(start) : 0;
  if (startIndex < 0) return content;
  const from = startIndex;
  const endIndex = end ? content.indexOf(end, from) : -1;
  return content.slice(from, endIndex >= 0 ? endIndex : undefined).trim();
}

export function getLearningLessonContent(lesson: LearningLesson): string {
  let content: string;

  if (lesson.content) {
    content = lesson.content;
  } else {
    const parts = lesson.topicIds
      .map(findTopic)
      .filter(Boolean)
      .map((topic) => topic!.content);

    if (lesson.sectionStart || lesson.sectionEnd) {
      const firstTopic = findTopic(lesson.topicIds[0]);
      if (!firstTopic) return "";
      content = extractRange(firstTopic.content, lesson.sectionStart, lesson.sectionEnd);
    } else {
      content = parts.join("\n\n---\n\n");
    }
  }

  // The lesson title is already shown above the content. Remove its redundant
  // opening Markdown heading so every lesson displays only one title.
  return content.replace(/^\s*#{1,6}\s+[^\n]+(?:\n+|$)/, "").trimStart();
}

export function getLearningModule(moduleId: string): LearningModule | undefined {
  return HANDBOOK_LEARNING_MODULES.find((module) => module.id === moduleId);
}
