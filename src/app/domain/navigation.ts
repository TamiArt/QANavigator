import type { Module } from "./types";

export interface AppNavigationItem {
  id: Module;
  label: string;
  labelEn: string;
}

export const APP_NAVIGATION: readonly AppNavigationItem[] = [
  { id: "workspace", label: "Рабочее пространство", labelEn: "Workspace" },
  { id: "beginner-wizard", label: "Мастер для новичка", labelEn: "Beginner guide" },
  { id: "requirements", label: "Анализ требований", labelEn: "Requirements analysis" },
  { id: "test-design", label: "Тест-дизайн", labelEn: "Test design" },
  { id: "test-execution", label: "Выполнение тестов", labelEn: "Test execution" },
  { id: "automation", label: "Автотесты", labelEn: "Automation" },
  { id: "release-report", label: "Релизный отчёт", labelEn: "Release report" },
  { id: "test-data", label: "Генератор данных", labelEn: "Test data generator" },
  { id: "database-workbench", label: "Работа с БД", labelEn: "Database workbench" },
  { id: "handbook", label: "База знаний QA", labelEn: "QA knowledge base" },
  { id: "documentation", label: "Документация", labelEn: "Documentation" },
  { id: "settings", label: "Настройки", labelEn: "Settings" },
];

export const APP_NAVIGATION_IDS = APP_NAVIGATION.map((item) => item.id);
