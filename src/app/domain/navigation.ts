import type { Module } from "./types";

export interface AppNavigationItem {
  id: Module;
  label: string;
  labelEn: string;
}

export interface AppNavigationSection {
  label: string;
  itemIds?: readonly Module[];
  directItemId?: Module;
  collapsible?: boolean;
  labelEn?: string;
}

export const APP_NAVIGATION: readonly AppNavigationItem[] = [
  { id: "workspace", label: "Рабочее пространство", labelEn: "Workspace" },
  { id: "beginner-wizard", label: "Мастер для новичка", labelEn: "Beginner guide" },
  { id: "requirements", label: "Анализ требований", labelEn: "Requirements analysis" },
  { id: "test-design", label: "Тест-дизайн", labelEn: "Test design" },
  { id: "test-execution", label: "Выполнение тестов", labelEn: "Test execution" },
  { id: "automation", label: "Автотесты", labelEn: "Automation" },
  { id: "release-report", label: "Релизный отчёт", labelEn: "Release report" },
  { id: "test-data", label: "Генератор тестовых данных", labelEn: "Test data generator" },
  { id: "api-testing", label: "API TESTING", labelEn: "API testing" },
  { id: "database-workbench", label: "DATABASE & SQL", labelEn: "DATABASE & SQL" },
  { id: "backend-logs", label: "BACKEND & LOGS", labelEn: "Backend & logs" },
  { id: "integrations", label: "ИНТЕГРАЦИИ", labelEn: "Integrations" },
  { id: "handbook", label: "База знаний QA", labelEn: "QA knowledge base" },
  { id: "documentation", label: "Тестовая документация", labelEn: "Test documentation" },
  { id: "settings", label: "Настройки", labelEn: "Settings" },
];

export const APP_NAVIGATION_SECTIONS: readonly AppNavigationSection[] = [
  {
    label: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ",
    itemIds: ["workspace", "beginner-wizard", "requirements", "test-design", "test-execution", "automation", "release-report", "handbook", "documentation"],
  },
  { label: "API TESTING", directItemId: "api-testing" },
  { label: "DATABASE & SQL", directItemId: "database-workbench" },
  { label: "BACKEND & LOGS", directItemId: "backend-logs" },
  { label: "ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ", directItemId: "test-data" },
  { label: "ИНТЕГРАЦИИ", directItemId: "integrations" },
  { label: "НАСТРОЙКИ", directItemId: "settings" },
];

export const APP_NAVIGATION_IDS = APP_NAVIGATION.map((item) => item.id);
