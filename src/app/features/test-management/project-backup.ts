import type { TmsData } from "../../domain/test-management";

export interface TmsProjectBackup {
  schemaVersion: 1;
  exportedAt: string;
  sourceProject: { id: string; name: string };
  testManagement: TmsData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isPriority(value: unknown): boolean {
  return value === "P1" || value === "P2" || value === "P3";
}

function isCase(value: unknown): boolean {
  return isRecord(value) &&
    isString(value.id) && isString(value.projectId) && isString(value.key) &&
    isString(value.title) && isString(value.folder) && isString(value.preconditions) &&
    Array.isArray(value.steps) && value.steps.every((step) =>
      isRecord(step) && isString(step.action) && isString(step.expected)) &&
    isString(value.expected) && isPriority(value.priority) && isString(value.type) &&
    isStringArray(value.tags) && isStringArray(value.requirementIds) &&
    isString(value.createdAt) && isString(value.updatedAt) && typeof value.archived === "boolean";
}

function isSuite(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.name) && isStringArray(value.caseIds) && isString(value.createdAt);
}

function isPlan(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.name) && isString(value.environment) &&
    isStringArray(value.suiteIds) && isStringArray(value.caseIds) && isString(value.createdAt);
}

function isRun(value: unknown): boolean {
  if (!isRecord(value) || !isString(value.id) || !isString(value.projectId) ||
    !isString(value.planId) || !isString(value.name) || !isString(value.startedAt) ||
    !isRecord(value.results)) return false;

  return Object.values(value.results).every((result) =>
    isRecord(result) &&
    ["not_run", "passed", "failed", "blocked", "skipped"].includes(String(result.status)) &&
    isString(result.actual) && isString(result.comment) &&
    (result.defectId === undefined || isString(result.defectId)));
}

function isDefect(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.key) && isString(value.title) &&
    (value.caseId === undefined || isString(value.caseId)) &&
    ["blocker", "critical", "major", "minor"].includes(String(value.severity)) &&
    isPriority(value.priority) &&
    ["open", "in_progress", "fixed", "closed"].includes(String(value.status)) &&
    isString(value.createdAt);
}

function isTmsData(value: unknown): value is TmsData {
  return isRecord(value) && value.version === 1 &&
    Array.isArray(value.cases) && value.cases.every(isCase) &&
    Array.isArray(value.suites) && value.suites.every(isSuite) &&
    Array.isArray(value.plans) && value.plans.every(isPlan) &&
    Array.isArray(value.runs) && value.runs.every(isRun) &&
    Array.isArray(value.defects) && value.defects.every(isDefect);
}

export function createTmsProjectBackup(
  sourceProject: { id: string; name: string },
  testManagement: TmsData,
  exportedAt: string,
): TmsProjectBackup {
  return { schemaVersion: 1, exportedAt, sourceProject, testManagement };
}

/** Imports a project archive into the currently selected project without changing its identity. */
export function parseTmsProjectBackup(raw: string, targetProjectId: string): TmsData {
  if (!targetProjectId.trim()) throw new Error("Не выбран проект для импорта");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Файл не является корректным JSON");
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !isString(parsed.exportedAt) ||
    !isRecord(parsed.sourceProject) || !isString(parsed.sourceProject.id) ||
    !isString(parsed.sourceProject.name) || !isTmsData(parsed.testManagement)) {
    throw new Error("Файл не является корректным архивом Test Management");
  }

  const data = parsed.testManagement;
  const caseIds = new Set(data.cases.map((item) => item.id));
  const suiteIds = new Set(data.suites.map((item) => item.id));
  const planIds = new Set(data.plans.map((item) => item.id));
  const defectIds = new Set(data.defects.map((item) => item.id));

  if (data.suites.some((item) => item.caseIds.some((id) => !caseIds.has(id))) ||
    data.plans.some((item) => item.caseIds.some((id) => !caseIds.has(id)) ||
      item.suiteIds.some((id) => !suiteIds.has(id))) ||
    data.runs.some((item) => !planIds.has(item.planId) ||
      Object.values(item.results).some((result) => result.defectId && !defectIds.has(result.defectId))) ||
    data.defects.some((item) => item.caseId && !caseIds.has(item.caseId))) {
    throw new Error("Архив содержит нарушенные связи между тест-кейсами, наборами, планами и дефектами");
  }

  return {
    ...data,
    projectId: targetProjectId,
    cases: data.cases.map((item) => ({ ...item, projectId: targetProjectId })),
    suites: data.suites.map((item) => ({ ...item, projectId: targetProjectId })),
    plans: data.plans.map((item) => ({ ...item, projectId: targetProjectId })),
    runs: data.runs.map((item) => ({ ...item, projectId: targetProjectId })),
    defects: data.defects.map((item) => ({ ...item, projectId: targetProjectId })),
  };
}
