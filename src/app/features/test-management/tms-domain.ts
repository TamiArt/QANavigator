import type { TmsCase, TmsCaseSnapshot, TmsPlan, TmsRun, TmsRunResult } from "../../domain/test-management";

export type TmsCaseEditableFields = Pick<TmsCase,
  "title" | "folder" | "preconditions" | "steps" | "expected" | "priority" |
  "description" | "testData" | "postconditions" | "tags" | "requirementIds"
>;

export function reviseTmsCase(
  existing: TmsCase,
  changes: TmsCaseEditableFields,
  savedAt: string,
): TmsCase {
  const { versions = [], ...snapshot } = existing;
  const previousVersion = existing.version ?? 1;
  return {
    ...existing,
    ...changes,
    updatedAt: savedAt,
    version: previousVersion + 1,
    versions: [...versions, { version: previousVersion, savedAt, snapshot }],
  };
}

export function snapshotTmsCase(item: TmsCase): TmsCaseSnapshot {
  return {
    id: item.id,
    key: item.key,
    title: item.title,
    folder: item.folder,
    preconditions: item.preconditions,
    steps: item.steps.map((step) => ({ ...step })),
    expected: item.expected,
    priority: item.priority,
    type: item.type,
    tags: [...item.tags],
    requirementIds: [...item.requirementIds],
    version: item.version ?? 1,
    description: item.description,
    testData: item.testData,
    postconditions: item.postconditions,
  };
}

export function createTmsRunSnapshot(
  id: string,
  projectId: string,
  plan: TmsPlan,
  cases: TmsCase[],
  startedAt: string,
  displayName: string,
): TmsRun {
  const caseSnapshots = Object.fromEntries(plan.caseIds.flatMap((caseId) => {
    const item = cases.find((candidate) => candidate.id === caseId);
    return item ? [[caseId, snapshotTmsCase(item)]] : [];
  }));
  const results: Record<string, TmsRunResult> = Object.fromEntries(
    Object.entries(caseSnapshots).map(([caseId, snapshot]) => [caseId, {
      status: "not_run" as const,
      actual: "",
      comment: "",
      stepResults: snapshot.steps.map(() => ({ status: "not_run" as const, actual: "", comment: "" })),
    }]),
  );
  return {
    id,
    projectId,
    planId: plan.id,
    name: displayName,
    startedAt,
    caseSnapshots,
    results,
  };
}
