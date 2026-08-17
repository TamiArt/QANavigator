import { VISUAL_IMAGES_BY_TOPIC, VISUAL_UNIQUE_TOPICS } from "./handbook-visual-topics";

export interface HandbookTopic {
  id: string;
  title: string;
  category: string;
  level: "beginner" | "intermediate" | "pro";
  content: string;
  tags: string[];
  images?: { src: string; thumbnailSrc?: string; alt: string }[];
}

import { HANDBOOK_PART_1 } from "./handbook-data-part-1";
import { HANDBOOK_PART_2 } from "./handbook-data-part-2";
import { HANDBOOK_PART_3 } from "./handbook-data-part-3";
import { HANDBOOK_PART_4 } from "./handbook-data-part-4";
import { HANDBOOK_PART_5 } from "./handbook-data-part-5";
import { HANDBOOK_PART_6 } from "./handbook-data-part-6";
import { HANDBOOK_PART_7 } from "./handbook-data-part-7";
import { HANDBOOK_PART_8 } from "./handbook-data-part-8";
import { HANDBOOK_PART_9 } from "./handbook-data-part-9";

// Canonical articles below replace older, narrower versions of the same subject.
// Keep the richer topic and hide the overlapping card instead of showing the same material twice.
const DUPLICATE_TOPIC_IDS = new Set([
  "f3",    // merged into f6: SDLC + STLC
  "web2",  // merged into api1: REST API testing
  "web5",  // merged into api4: authentication + authorization
  "web7",  // merged into db1: SQL for QA
  "web8",  // merged into mob1: mobile app types + strategy
  "web9",  // split into canonical git1 + tools/environment material; avoid duplicate Git card
  "web10", // covered by focused tool articles + tools1 map
]);

const CATEGORY_BY_PREFIX: Record<string, string> = {
  f: "Основы тестирования",
  td: "Техники тест-дизайна",
  tt: "Виды тестирования",
  doc: "Тестовая документация",
  auto: "Автоматизация",
  web: "Web и сети",
  api: "API",
  db: "Базы данных",
  bash: "Инструменты и DevOps",
  git: "Инструменты и DevOps",
  mob: "Mobile",
  game: "Игровое тестирование",
};

function canonicalCategory(topic: HandbookTopic): string {
  const prefix = Object.keys(CATEGORY_BY_PREFIX).find((key) => topic.id.startsWith(key));
  return prefix ? CATEGORY_BY_PREFIX[prefix] : topic.category;
}

const CORE_TOPICS = [
  ...HANDBOOK_PART_1, ...HANDBOOK_PART_2, ...HANDBOOK_PART_3, ...HANDBOOK_PART_4,
  ...HANDBOOK_PART_5, ...HANDBOOK_PART_6, ...HANDBOOK_PART_7, ...HANDBOOK_PART_8,
  ...HANDBOOK_PART_9,
];

export const HANDBOOK: HandbookTopic[] = [
  ...CORE_TOPICS
    .filter((topic) => !DUPLICATE_TOPIC_IDS.has(topic.id))
    .map((topic) => ({
      ...topic,
      category: canonicalCategory(topic),
      images: VISUAL_IMAGES_BY_TOPIC[topic.id] ?? topic.images,
    })),
  ...VISUAL_UNIQUE_TOPICS,
];
