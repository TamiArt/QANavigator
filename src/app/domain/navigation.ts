import type { Module } from "./types";

export interface AppNavigationItem {
  id: Module;
  label: string;
  labelEn: string;
  section: string;
}

export const APP_NAVIGATION: readonly AppNavigationItem[] = [
  { id: "workspace", label: "Рабочее пространство", labelEn: "Workspace", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "beginner-wizard", label: "Мастер для новичка", labelEn: "Beginner guide", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "requirements", label: "Анализ требований", labelEn: "Requirements analysis", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "test-design", label: "Тест-дизайн", labelEn: "Test design", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "test-execution", label: "Выполнение тестов", labelEn: "Test execution", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "automation", label: "Автотесты", labelEn: "Automation", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "release-report", label: "Релизный отчёт", labelEn: "Release report", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "handbook", label: "База знаний QA", labelEn: "QA knowledge base", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "documentation", label: "Тестовая документация", labelEn: "Test documentation", section: "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ" },
  { id: "database-workbench", label: "Работа с БД", labelEn: "Database workbench", section: "DATABASE & SQL" },
  { id: "test-data", label: "Генератор тестовых данных", labelEn: "Test data generator", section: "ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ" },
  { id: "settings", label: "Настройки", labelEn: "Settings", section: "НАСТРОЙКИ" },
];

export const APP_NAVIGATION_SECTIONS = [
  "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ",
  "API TESTING",
  "DATABASE & SQL",
  "BACKEND & LOGS",
  "ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ",
  "ИНТЕГРАЦИИ",
  "НАСТРОЙКИ",
] as const;

export const APP_NAVIGATION_IDS = APP_NAVIGATION.map((item) => item.id);
