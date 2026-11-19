import type { ApiKeys, BugReport, ChecklistItem, TestCase, TestStatus, Severity } from "../domain/types";
import type { ProductType, QAProject } from "../domain/project";

export type StorageValueValidator = (value: unknown) => boolean;

const TEST_STATUSES: readonly TestStatus[] = ["pending", "passed", "failed", "blocked"];
const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low"];
const PRIORITIES = ["P1", "P2", "P3"] as const;
const CHECKLIST_CATEGORIES = ["positive", "negative", "boundary", "nonfunctional"] as const;
const PRODUCT_TYPES: readonly ProductType[] = ["web", "api", "mobile", "desktop"];
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

function isProject(value: unknown): value is QAProject {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.productType === "string" &&
    PRODUCT_TYPES.includes(value.productType as ProductType) &&
    typeof value.environment === "string" &&
    isStringArray(value.risks) &&
    typeof value.createdAt === "string"
  );
}

function unwrapCurrentStorageValue(value: unknown): unknown {
  if (!isRecord(value) || !("version" in value) || !("data" in value)) return value;
  return value.version === 1 ? value.data : UNSUPPORTED_VERSION;
}

export function isLanguageStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return data === "ru" || data === "en";
}

export function isThemeStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return data === "light" || data === "dark";
}

export function isApiKeysStorageValue(value: unknown): boolean {
  return isApiKeys(unwrapCurrentStorageValue(value));
}

export function isProjectsStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return Array.isArray(data) && data.every(isProject);
}

export function isActiveProjectStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return typeof data === "string";
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
}

export function isHandbookLearningProgressStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  return isRecord(data) && isStringArray(data.completedLessonIds);
}

export function isApiWorkbenchStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
  return Array.isArray(data) && data.length <= 50 && data.every((item) => {
    if (!isRecord(item)) return false;
    return (
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.method === "string" &&
      methods.includes(item.method) &&
      typeof item.url === "string" &&
      typeof item.body === "string" &&
      typeof item.savedAt === "string" &&
      Array.isArray(item.headers) &&
      item.headers.every((header) => isRecord(header) &&
        typeof header.id === "string" &&
        typeof header.key === "string" &&
        typeof header.value === "string")
    );
  });
}

function isTmsCase(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.projectId === "string" &&
    typeof value.key === "string" && typeof value.title === "string" && typeof value.folder === "string" &&
    typeof value.preconditions === "string" && Array.isArray(value.steps) &&
    value.steps.every((step) => isRecord(step) && typeof step.action === "string" && typeof step.expected === "string") &&
    typeof value.expected === "string" && PRIORITIES.includes(value.priority as (typeof PRIORITIES)[number]) &&
    typeof value.type === "string" && isStringArray(value.tags) && isStringArray(value.requirementIds) &&
    typeof value.createdAt === "string" && typeof value.updatedAt === "string" &&
    typeof value.archived === "boolean" &&
    (value.attachmentIds === undefined || isStringArray(value.attachmentIds)) &&
    (value.version === undefined || typeof value.version === "number") &&
    (value.description === undefined || typeof value.description === "string") &&
    (value.testData === undefined || typeof value.testData === "string") &&
    (value.postconditions === undefined || typeof value.postconditions === "string") &&
    (value.automationStatus === undefined || ["not_automated", "automated", "candidate"].includes(String(value.automationStatus))) &&
    (value.references === undefined || isStringArray(value.references)) &&
    (value.estimateMinutes === undefined || (typeof value.estimateMinutes === "number" && value.estimateMinutes >= 0)) &&
    (value.sharedStepIds === undefined || isStringArray(value.sharedStepIds)) &&
    (value.versions === undefined || (Array.isArray(value.versions) && value.versions.every((version) =>
      isRecord(version) && typeof version.version === "number" && typeof version.savedAt === "string" &&
      isRecord(version.snapshot))));
}

function isTmsRunResult(value: unknown): boolean {
  return isRecord(value) && ["not_run", "in_progress", "passed", "failed", "blocked", "retest", "skipped"].includes(String(value.status)) &&
    typeof value.actual === "string" && typeof value.comment === "string" &&
    (value.stepResults === undefined || (Array.isArray(value.stepResults) && value.stepResults.every((step) => isRecord(step) && ["not_run", "in_progress", "passed", "failed", "blocked", "retest", "skipped"].includes(String(step.status)) && typeof step.actual === "string" && typeof step.comment === "string"))) &&
    (value.defectId === undefined || typeof value.defectId === "string") &&
    (value.attachmentIds === undefined || isStringArray(value.attachmentIds));
}

function isTmsSharedStep(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.projectId !== "string" ||
    typeof value.key !== "string" || typeof value.name !== "string" ||
    typeof value.version !== "number" || typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" || !Array.isArray(value.steps) ||
    !value.steps.every((step) => isRecord(step) && typeof step.action === "string" && typeof step.expected === "string")) {
    return false;
  }
  if (value.versions === undefined) return true;
  return Array.isArray(value.versions) && value.versions.every((version) =>
    isRecord(version) && typeof version.version === "number" &&
    typeof version.savedAt === "string" && typeof version.name === "string" &&
    Array.isArray(version.steps) &&
    version.steps.every((step) => isRecord(step) && typeof step.action === "string" && typeof step.expected === "string"));
}

function isTmsProject(value: unknown): boolean {
  if (!isRecord(value) || value.version !== 1 || typeof value.projectId !== "string") return false;
  if (!Array.isArray(value.cases) || !value.cases.every(isTmsCase) ||
    (value.requirements !== undefined && (!Array.isArray(value.requirements) || !value.requirements.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.projectId === "string" && typeof item.key === "string" && typeof item.title === "string" && typeof item.description === "string" && typeof item.acceptanceCriteria === "string" && PRIORITIES.includes(item.priority as (typeof PRIORITIES)[number]) && ["draft", "approved", "implemented", "verified", "deprecated"].includes(String(item.status)) && typeof item.createdAt === "string" && typeof item.updatedAt === "string"))) ||
    (value.sharedSteps !== undefined && (!Array.isArray(value.sharedSteps) || !value.sharedSteps.every(isTmsSharedStep))) ||
    !Array.isArray(value.suites) || !Array.isArray(value.plans) ||
    !Array.isArray(value.runs) || !Array.isArray(value.defects)) return false;
  const hasUniqueField = (items: unknown[], field: string) => new Set(items.map((item) => (item as Record<string, unknown>)[field])).size === items.length;
  if (!hasUniqueField(value.cases, "id") || !hasUniqueField(value.cases, "key") ||
    !hasUniqueField(value.suites, "id") || !hasUniqueField(value.plans, "id") ||
    !hasUniqueField(value.defects, "id") || !hasUniqueField(value.defects, "key") ||
    (Array.isArray(value.sharedSteps) && (!hasUniqueField(value.sharedSteps, "id") || !hasUniqueField(value.sharedSteps, "key"))) ||
    (Array.isArray(value.requirements) && (!hasUniqueField(value.requirements, "id") || !hasUniqueField(value.requirements, "key")))) return false;
  const projectId = value.projectId;
  const projectScopedCollections = [value.cases, value.suites, value.plans, value.runs, value.defects,
    ...(Array.isArray(value.requirements) ? [value.requirements] : []),
    ...(Array.isArray(value.sharedSteps) ? [value.sharedSteps] : [])];
  if (projectScopedCollections.some((items) => items.some((item) =>
    !isRecord(item) || item.projectId !== projectId))) return false;
  const caseIds = new Set(value.cases.map((item) => (item as Record<string, unknown>).id));
  const suiteIds = new Set(value.suites.map((item) => (item as Record<string, unknown>).id));
  const planIds = new Set(value.plans.map((item) => (item as Record<string, unknown>).id));
  const defectIds = new Set(value.defects.map((item) => (item as Record<string, unknown>).id));
  const runs = value.runs as unknown[];
  const requirementIds = new Set(Array.isArray(value.requirements) ? value.requirements.map((item) => (item as Record<string, unknown>).id) : []);
  const sharedStepIds = new Set(Array.isArray(value.sharedSteps) ? value.sharedSteps.map((item) => (item as Record<string, unknown>).id) : []);
  if (value.sharedSteps !== undefined && value.cases.some((item) => Array.isArray((item as Record<string, unknown>).sharedStepIds) && ((item as Record<string, unknown>).sharedStepIds as string[]).some((id) => !sharedStepIds.has(id)))) return false;
  if (value.requirements !== undefined && value.cases.some((item) => (item as Record<string, unknown>).requirementIds instanceof Array && ((item as Record<string, unknown>).requirementIds as string[]).some((id) => !requirementIds.has(id)))) return false;
  if (!value.suites.every((item) => isRecord(item) && typeof item.id === "string" &&
    typeof item.projectId === "string" && typeof item.name === "string" &&
    (item.description === undefined || typeof item.description === "string") &&
    (item.parentId === undefined || typeof item.parentId === "string") &&
    (item.updatedAt === undefined || typeof item.updatedAt === "string") && isStringArray(item.caseIds) &&
    item.caseIds.every((id) => caseIds.has(id)) &&
    (item.parentId === undefined || (suiteIds.has(item.parentId) && item.parentId !== item.id)))) return false;
  if (!value.plans.every((item) => isRecord(item) && typeof item.id === "string" &&
    typeof item.projectId === "string" && typeof item.name === "string" && typeof item.environment === "string" &&
    ["release", "build", "objective", "risks", "owner", "startDate", "endDate", "entryCriteria", "exitCriteria"].every((key) => item[key] === undefined || typeof item[key] === "string") &&
    isStringArray(item.suiteIds) && item.suiteIds.every((id) => suiteIds.has(id)) &&
    isStringArray(item.caseIds) && item.caseIds.every((id) => caseIds.has(id)))) return false;
  if (!value.runs.every((item) => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.projectId !== "string" ||
      typeof item.planId !== "string" || !planIds.has(item.planId) || !isRecord(item.results) ||
      (item.caseSnapshots !== undefined && !isRecord(item.caseSnapshots))) return false;
    return Object.entries(item.results).every(([caseId, result]) => {
      if (!isRecord(result) || !isTmsRunResult(result)) return false;
      const runResult = result as Record<string, unknown>;
      return (runResult.defectId === undefined || (typeof runResult.defectId === "string" && defectIds.has(runResult.defectId))) &&
        (caseIds.has(caseId) || (isRecord(item.caseSnapshots) && caseId in item.caseSnapshots));
    });
  })) return false;
  return value.defects.every((item) => isRecord(item) && typeof item.id === "string" &&
    typeof item.projectId === "string" && typeof item.key === "string" && typeof item.title === "string" &&
    (item.caseId === undefined || caseIds.has(item.caseId)) &&
    ["blocker", "critical", "major", "minor"].includes(String(item.severity)) &&
    PRIORITIES.includes(item.priority as (typeof PRIORITIES)[number]) &&
    ["new", "open", "in_progress", "fixed", "retest", "closed", "reopened", "rejected"].includes(String(item.status)) &&
    typeof item.createdAt === "string" &&
    (item.attachmentIds === undefined || isStringArray(item.attachmentIds)) &&
    (item.labels === undefined || isStringArray(item.labels)) &&
    (item.caseIds === undefined || (isStringArray(item.caseIds) && item.caseIds.every((id) => caseIds.has(id)))) &&
    (item.runId === undefined || runs.some((run) => isRecord(run) && run.id === item.runId)) &&
    (item.comments === undefined || (Array.isArray(item.comments) && item.comments.every((comment) => isRecord(comment) && typeof comment.id === "string" && typeof comment.author === "string" && typeof comment.body === "string" && typeof comment.createdAt === "string"))) &&
    (item.history === undefined || (Array.isArray(item.history) && item.history.every((entry) => isRecord(entry) && typeof entry.id === "string" && typeof entry.field === "string" && typeof entry.from === "string" && typeof entry.to === "string" && typeof entry.actor === "string" && typeof entry.changedAt === "string"))));
}

/** Validates the versioned project-scoped Test Management collection and its references. */
export function isTestManagementStorageValue(value: unknown): boolean {
  const data = unwrapCurrentStorageValue(value);
  if (!Array.isArray(data) || !data.every(isTmsProject)) return false;
  return new Set(data.map((item) => (item as Record<string, unknown>).projectId)).size === data.length;
}

/** Validates the optional binary evidence section in a full workspace backup. */
export function isTmsAttachmentsBackupValue(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 500) return false;
  let totalBytes = 0;
  const ids = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.projectId !== "string" ||
      !["case", "run-result", "defect"].includes(String(item.ownerType)) ||
      typeof item.ownerId !== "string" || typeof item.name !== "string" ||
      typeof item.mimeType !== "string" || typeof item.size !== "number" ||
      item.size <= 0 || item.size > 20 * 1024 * 1024 || typeof item.createdAt !== "string" ||
      typeof item.data !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(item.data) || ids.has(item.projectId + ":" + item.id)) return false;
    const decodedSize = Math.floor(item.data.length * 3 / 4) - (item.data.endsWith("==") ? 2 : item.data.endsWith("=") ? 1 : 0);
    if (decodedSize !== item.size) return false;
    ids.add(item.projectId + ":" + item.id);
    totalBytes += item.size;
  }
  return totalBytes <= 100 * 1024 * 1024;
}
