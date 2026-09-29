import type { ApiKeys, BugReport, ChecklistItem, TestCase, TestStatus, Severity } from "../domain/types";

export type StorageValueValidator = (value: unknown) => boolean;

const TEST_STATUSES: readonly TestStatus[] = ["pending", "passed", "failed", "blocked"];
const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low"];
const PRIORITIES = ["P1", "P2", "P3"] as const;
const CHECKLIST_CATEGORIES = ["positive", "negative", "boundary", "nonfunctional"] as const;
const UNSUPPORTED_VERSION = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isTestStatus(value: unknown): value is TestStatus {
  return typeof value === "string" && TEST_STATUSES.includes(value as TestStatus);
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && SEVERITIES.includes(value as Severity);
}

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.category === "string" &&
    CHECKLIST_CATEGORIES.includes(value.category as (typeof CHECKLIST_CATEGORIES)[number]) &&
    isTestStatus(value.status) &&
    (value.testCase === undefined || isTestCase(value.testCase))
  );
}

function isTestCase(value: unknown): value is TestCase {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.preconditions === "string" &&
    isStringArray(value.steps) &&
    typeof value.expected === "string" &&
    typeof value.priority === "string" &&
    PRIORITIES.includes(value.priority as (typeof PRIORITIES)[number]) &&
    isTestStatus(value.status) &&
    (value.source === undefined || typeof value.source === "string")
  );
}

function isBugReport(value: unknown): value is BugReport {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.environment === "string" &&
    isStringArray(value.steps) &&
    typeof value.actual === "string" &&
    typeof value.expected === "string" &&
    isSeverity(value.severity) &&
    typeof value.priority === "string" &&
    PRIORITIES.includes(value.priority as (typeof PRIORITIES)[number]) &&
    typeof value.createdAt === "string" &&
    (value.testCaseRef === undefined || typeof value.testCaseRef === "string")
  );
}

function isApiKeys(value: unknown): value is ApiKeys {
  if (!isRecord(value)) return false;
  return (
    typeof value.openrouter === "string" &&
    typeof value.gemini === "string" &&
    (value.provider === "openrouter" || value.provider === "gemini")
  );
}

function unwrapCurrentStorageValue(value: unknown): unknown {
  if (!isRecord(value) || !("version" in value) || !("data" in value)) return value;
  return value.version === 1 ? value.data : UNSUPPORTED_VERSION;
}

export function isThemeStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return data === "light" || data === "dark";
}

export function isApiKeysStorageValue(value: unknown): boolean {
  return isApiKeys(unwrapCurrentStorageValue(value));
}

export function isChecklistsStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return Array.isArray(data) && data.every(isChecklistItem);
}

export function isTestCasesStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return Array.isArray(data) && data.every(isTestCase);
}

export function isBugReportsStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return Array.isArray(data) && data.every(isBugReport);
}

export function isBookmarksStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return isStringArray(data);
}

export function isTextStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return typeof data === "string";

export function isHandbookLearningProgressStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return isRecord(data) && isStringArray(data.completedLessonIds);
}
