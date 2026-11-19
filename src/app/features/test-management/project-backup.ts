import type { TmsData } from "../../domain/test-management";
import type { TmsAttachmentOwnerType } from "./tms-attachments";

export interface TmsProjectBackup {
  schemaVersion: 1;
  exportedAt: string;
  sourceProject: { id: string; name: string };
  testManagement: TmsData;
  attachments?: TmsAttachmentArchive[];
}
export interface TmsAttachmentArchive {
  id: string;
  projectId: string;
  ownerType: TmsAttachmentOwnerType;
  ownerId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  data: string;
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
    isString(value.createdAt) && isString(value.updatedAt) && typeof value.archived === "boolean" &&
    (value.attachmentIds === undefined || isStringArray(value.attachmentIds)) &&
    (value.version === undefined || typeof value.version === "number") &&
    (value.description === undefined || isString(value.description)) &&
    (value.testData === undefined || isString(value.testData)) &&
    (value.postconditions === undefined || isString(value.postconditions)) &&
    (value.automationStatus === undefined || ["not_automated", "automated", "candidate"].includes(String(value.automationStatus))) &&
    (value.references === undefined || isStringArray(value.references)) &&
    (value.estimateMinutes === undefined || (typeof value.estimateMinutes === "number" && value.estimateMinutes >= 0)) &&
    (value.sharedStepIds === undefined || isStringArray(value.sharedStepIds)) &&
    (value.versions === undefined || (Array.isArray(value.versions) && value.versions.every((item) => isRecord(item) && typeof item.version === "number" && isString(item.savedAt) && isRecord(item.snapshot))));
}

function isSuite(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.name) && isStringArray(value.caseIds) && isString(value.createdAt) &&
    (value.description === undefined || isString(value.description)) &&
    (value.parentId === undefined || isString(value.parentId)) &&
    (value.updatedAt === undefined || isString(value.updatedAt));
}

function isPlan(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.name) && isString(value.environment) &&
    isStringArray(value.suiteIds) && isStringArray(value.caseIds) && isString(value.createdAt) &&
    (value.milestoneId === undefined || isString(value.milestoneId)) &&
    ["release", "build", "objective", "risks", "owner", "startDate", "endDate", "entryCriteria", "exitCriteria"].every((key) => value[key] === undefined || isString(value[key]));
}

function isMilestone(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.name) && ["planned", "active", "completed"].includes(String(value.status)) &&
    isString(value.createdAt) && isString(value.updatedAt) &&
    (value.description === undefined || isString(value.description)) &&
    (value.startDate === undefined || isString(value.startDate)) &&
    (value.endDate === undefined || isString(value.endDate));
}

function isPlanSnapshot(value: unknown): boolean {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name) || !isString(value.environment) ||
    (value.milestoneId !== undefined && !isString(value.milestoneId)) ||
    (value.milestoneName !== undefined && !isString(value.milestoneName))) return false;
  const snapshot = value;
  return ["release", "build", "objective", "risks", "owner", "startDate", "endDate", "entryCriteria", "exitCriteria"]
    .every((field) => snapshot[field] === undefined || isString(snapshot[field]));
}

function isRun(value: unknown): boolean {
  if (!isRecord(value) || !isString(value.id) || !isString(value.projectId) ||
    !isString(value.planId) || !isString(value.name) || !isString(value.startedAt) ||
    !isRecord(value.results)) return false;

  const validResults = Object.values(value.results).every((result) =>
    isRecord(result) &&
    ["not_run", "in_progress", "passed", "failed", "blocked", "retest", "skipped"].includes(String(result.status)) &&
    isString(result.actual) && isString(result.comment) &&
    (result.assignee === undefined || isString(result.assignee)) &&
    (result.stepResults === undefined || (Array.isArray(result.stepResults) && result.stepResults.every((step) =>
      isRecord(step) && ["not_run", "in_progress", "passed", "failed", "blocked", "retest", "skipped"].includes(String(step.status)) &&
      isString(step.actual) && isString(step.comment)))) &&
    (result.defectId === undefined || isString(result.defectId)) &&
    (result.attachmentIds === undefined || isStringArray(result.attachmentIds)));
  const validSnapshots = value.caseSnapshots === undefined || (isRecord(value.caseSnapshots) &&
    Object.values(value.caseSnapshots).every((snapshot) => isRecord(snapshot) &&
      isString(snapshot.id) && isString(snapshot.key) && isString(snapshot.title) &&
      Array.isArray(snapshot.steps) && snapshot.steps.every((step) =>
        isRecord(step) && isString(step.action) && isString(step.expected))));
  const validPlanSnapshot = value.planSnapshot === undefined || isPlanSnapshot(value.planSnapshot);
  return validResults && validSnapshots && validPlanSnapshot;
}

function isDefect(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.key) && isString(value.title) &&
    (value.caseId === undefined || isString(value.caseId)) &&
    ["blocker", "critical", "major", "minor"].includes(String(value.severity)) &&
    isPriority(value.priority) &&
    ["new", "open", "in_progress", "fixed", "retest", "closed", "reopened", "rejected"].includes(String(value.status)) &&
    isString(value.createdAt) &&
    (value.attachmentIds === undefined || isStringArray(value.attachmentIds)) &&
    (value.labels === undefined || isStringArray(value.labels)) &&
    (value.description === undefined || isString(value.description)) &&
    (value.steps === undefined || isStringArray(value.steps)) &&
    (value.expected === undefined || isString(value.expected)) &&
    (value.actual === undefined || isString(value.actual)) &&
    (value.updatedAt === undefined || isString(value.updatedAt)) &&
    (value.assignee === undefined || isString(value.assignee)) &&
    (value.reporter === undefined || isString(value.reporter)) &&
    (value.caseIds === undefined || isStringArray(value.caseIds)) &&
    (value.runId === undefined || isString(value.runId)) &&
    (value.comments === undefined || (Array.isArray(value.comments) && value.comments.every((item) => isRecord(item) && isString(item.id) && isString(item.author) && isString(item.body) && isString(item.createdAt)))) &&
    (value.history === undefined || (Array.isArray(value.history) && value.history.every((item) => isRecord(item) && isString(item.id) && isString(item.field) && isString(item.from) && isString(item.to) && isString(item.actor) && isString(item.changedAt))));
}

function isRequirement(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    isString(value.key) && isString(value.title) && isString(value.description) &&
    isString(value.acceptanceCriteria) && isPriority(value.priority) &&
    ["draft", "approved", "implemented", "verified", "deprecated"].includes(String(value.status)) &&
    isString(value.createdAt) && isString(value.updatedAt);
}

function isSharedStep(value: unknown): boolean {
  if (!isRecord(value) || !isString(value.id) || !isString(value.projectId) ||
    !isString(value.key) || !isString(value.name) || typeof value.version !== "number" ||
    !isString(value.createdAt) || !isString(value.updatedAt) ||
    !Array.isArray(value.steps) ||
    !value.steps.every((step) => isRecord(step) && isString(step.action) && isString(step.expected))) {
    return false;
  }

  if (value.versions === undefined) return true;
  return Array.isArray(value.versions) && value.versions.every((version) =>
    isRecord(version) && typeof version.version === "number" && isString(version.savedAt) &&
    isString(version.name) && Array.isArray(version.steps) &&
    version.steps.every((step) => isRecord(step) && isString(step.action) && isString(step.expected)));
}

function isTmsData(value: unknown): value is TmsData {
  if (!isRecord(value) || value.version !== 1 ||
    !Array.isArray(value.cases) || !value.cases.every(isCase) ||
    !Array.isArray(value.suites) || !value.suites.every(isSuite) ||
    !Array.isArray(value.plans) || !value.plans.every(isPlan) ||
    !Array.isArray(value.runs) || !value.runs.every(isRun) ||
    !Array.isArray(value.defects) || !value.defects.every(isDefect) ||
    (value.milestones !== undefined && (!Array.isArray(value.milestones) || !value.milestones.every(isMilestone)))) return false;
  const validRequirements = value.requirements === undefined ||
    (Array.isArray(value.requirements) && value.requirements.every(isRequirement));
  const validSharedSteps = value.sharedSteps === undefined ||
    (Array.isArray(value.sharedSteps) && value.sharedSteps.every(isSharedStep));
  return validRequirements && validSharedSteps;
}

export function createTmsProjectBackup(
  sourceProject: { id: string; name: string },
  testManagement: TmsData,
  exportedAt: string,
  attachments: TmsAttachmentArchive[] = [],
): TmsProjectBackup {
  return { schemaVersion: 1, exportedAt, sourceProject, testManagement, attachments };
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
    !isTmsData(parsed.testManagement)) {
    throw new Error("Файл не является корректным архивом Test Management");
  }

  // Accept the first-slice archive format ({ project }) as well as the canonical format ({ sourceProject }).
  const sourceProject = isRecord(parsed.sourceProject) ? parsed.sourceProject : parsed.project;
  if (!isRecord(sourceProject) || !isString(sourceProject.id) || !isString(sourceProject.name)) {
    throw new Error("В архиве отсутствуют сведения об исходном проекте");
  }

  const data = parsed.testManagement;
  const sourceProjectId = sourceProject.id;
  const projectCollections = [...data.cases, ...data.suites, ...data.plans, ...data.runs, ...data.defects,
    ...(data.requirements ?? []), ...(data.sharedSteps ?? []), ...(data.milestones ?? [])];
  if ((data.projectId !== undefined && data.projectId !== sourceProjectId) ||
    projectCollections.some((item) => item.projectId !== sourceProjectId)) {
    throw new Error("Архив содержит записи, принадлежащие другому проекту");
  }
  const caseIds = new Set(data.cases.map((item) => item.id));
  const suiteIds = new Set(data.suites.map((item) => item.id));
  const planIds = new Set(data.plans.map((item) => item.id));
  const milestoneIds = new Set((data.milestones ?? []).map((item) => item.id));
  const defectIds = new Set(data.defects.map((item) => item.id));
  const requirementIds = new Set((data.requirements ?? []).map((item) => item.id));
  const sharedStepIds = new Set((data.sharedSteps ?? []).map((item) => item.id));

  if ((data.requirements !== undefined && data.cases.some((item) => item.requirementIds.some((id) => !requirementIds.has(id)))) ||
    (data.sharedSteps !== undefined && data.cases.some((item) => (item.sharedStepIds ?? []).some((id) => !sharedStepIds.has(id)))) ||
    data.suites.some((item) => item.caseIds.some((id) => !caseIds.has(id)) || (item.parentId !== undefined && (!suiteIds.has(item.parentId) || item.parentId === item.id))) ||
    data.plans.some((item) => item.caseIds.some((id) => !caseIds.has(id)) ||
      item.suiteIds.some((id) => !suiteIds.has(id)) ||
      (item.milestoneId !== undefined && !milestoneIds.has(item.milestoneId))) ||
    data.runs.some((item) => !planIds.has(item.planId) ||
       (item.planSnapshot?.milestoneId !== undefined && !milestoneIds.has(item.planSnapshot.milestoneId)) ||
       (item.caseSnapshots !== undefined && Object.keys(item.caseSnapshots).some((id) => !item.results[id])) ||
      Object.values(item.results).some((result) => result.defectId && !defectIds.has(result.defectId))) ||
    data.defects.some((item) => (item.caseId && !caseIds.has(item.caseId)) || (item.caseIds ?? []).some((id) => !caseIds.has(id)) || (item.runId && !data.runs.some((run) => run.id === item.runId)))) {
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
    milestones: (data.milestones ?? []).map((item) => ({ ...item, projectId: targetProjectId })),
  };
}

function isAttachmentArchive(value: unknown): value is TmsAttachmentArchive {
  return isRecord(value) && isString(value.id) && isString(value.projectId) &&
    ["case", "run-result", "defect"].includes(String(value.ownerType)) &&
    isString(value.ownerId) && isString(value.name) && isString(value.mimeType) &&
    typeof value.size === "number" && value.size > 0 && value.size <= 20 * 1024 * 1024 &&
    isString(value.createdAt) && isString(value.data) && /^[A-Za-z0-9+/]*={0,2}$/.test(value.data);
}

export function parseTmsProjectArchive(raw: string, targetProjectId: string): {
  testManagement: TmsData;
  attachments: TmsAttachmentArchive[];
} {
  const testManagement = parseTmsProjectBackup(raw, targetProjectId);
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("Некорректный архив Test Management");
  const rawAttachments = parsed.attachments === undefined ? [] : parsed.attachments;
  if (!Array.isArray(rawAttachments) || !rawAttachments.every(isAttachmentArchive)) {
    throw new Error("Архив содержит некорректные вложения");
  }
  const sourceProject = isRecord(parsed.sourceProject) ? parsed.sourceProject : parsed.project;
  if (!isRecord(sourceProject) || !isString(sourceProject.id) ||
    rawAttachments.some((item) => item.projectId !== sourceProject.id)) {
    throw new Error("Вложения архива принадлежат другому проекту");
  }
  const attachments = rawAttachments.map((item) => ({ ...item, projectId: targetProjectId }));
  const attachmentIds = new Set<string>();
  const referenced = new Map<string, string>();
  for (const item of testManagement.cases) for (const id of item.attachmentIds ?? []) referenced.set(id, "case:" + item.id);
  for (const item of testManagement.defects) for (const id of item.attachmentIds ?? []) referenced.set(id, "defect:" + item.id);
  for (const run of testManagement.runs) {
    for (const [caseId, result] of Object.entries(run.results)) {
      for (const id of result.attachmentIds ?? []) referenced.set(id, "run-result:" + run.id + ":" + caseId);
    }
  }
  for (const item of attachments) {
    if (attachmentIds.has(item.id)) throw new Error("Архив содержит повторяющийся ID вложения");
    attachmentIds.add(item.id);
    const expectedOwner = referenced.get(item.id);
    if (!expectedOwner) throw new Error("Архив содержит вложение без связанного объекта TMS");
    if (expectedOwner !== item.ownerType + ":" + item.ownerId) {
      throw new Error("Вложение связано не с тем объектом TMS");
    }
    const decodedSize = Math.floor(item.data.length * 3 / 4) - (item.data.endsWith("==") ? 2 : item.data.endsWith("=") ? 1 : 0);
    if (decodedSize !== item.size) throw new Error("Размер вложения не совпадает с содержимым архива");
  }
  if ([...referenced.keys()].some((id) => !attachmentIds.has(id))) {
    throw new Error("В архиве отсутствует файл, на который ссылается тест-кейс, прогон или дефект");
  }
  const totalBytes = attachments.reduce((sum, item) => sum + item.size, 0);
  if (totalBytes > 50 * 1024 * 1024) throw new Error("Общий размер вложений в архиве превышает 50 МБ");
  return { testManagement, attachments };
}
