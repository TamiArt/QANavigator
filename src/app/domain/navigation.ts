import type { Module } from "./types";

export interface AppNavigationItem {
  id: Module;
  label: string;
}

export const APP_NAVIGATION: readonly AppNavigationItem[] = [
  { id: "workspace", label: "Рабочее пространство" },
  { id: "beginner-wizard", label: "Мастер для новичка" },
  { id: "requirements", label: "Анализ требований" },
  { id: "test-design", label: "Тест-дизайн" },
  { id: "test-execution", label: "Выполнение тестов" },
  { id: "automation", label: "Автотесты" },
  { id: "release-report", label: "Релизный отчёт" },
  { id: "test-data", label: "Генератор данных" },
  { id: "handbook", label: "База знаний QA" },
  { id: "documentation", label: "Документация" },
  { id: "settings", label: "Настройки" },
];

export const APP_NAVIGATION_IDS = APP_NAVIGATION.map((item) => item.id);
