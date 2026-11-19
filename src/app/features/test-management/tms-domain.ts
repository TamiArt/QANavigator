import type { TmsCase, TmsCaseSnapshot, TmsPlan, TmsRun, TmsRunResult, TmsSharedStep, TmsSharedStepVersion } from "../../domain/test-management";

export type TmsCaseEditableFields = Pick<TmsCase,
  "title" | "folder" | "preconditions" | "steps" | "expected" | "priority" |
  "description" | "testData" | "postconditions" | "automationStatus" | "references" | "estimateMinutes" | "sharedStepIds" | "tags" | "requirementIds"
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

export function snapshotTmsCase(item: TmsCase, sharedSteps: TmsSharedStep[] = []): TmsCaseSnapshot {
  return {
    id: item.id,
    key: item.key,
    title: item.title,
    folder: item.folder,
    preconditions: item.preconditions,
    steps: [...item.steps.map((step) => ({ ...step })), ...sharedSteps.filter((shared)=>item.sharedStepIds?.includes(shared.id)).flatMap((shared)=>shared.steps.map((step)=>({action:"["+shared.key+"] "+step.action,expected:step.expected})))],
    expected: item.expected,
    priority: item.priority,
    type: item.type,
    tags: [...item.tags],
    requirementIds: [...item.requirementIds],
    version: item.version ?? 1,
    description: item.description,
    testData: item.testData,
    postconditions: item.postconditions,
    automationStatus: item.automationStatus,
    references: item.references ?? [],
    estimateMinutes: item.estimateMinutes,
    sharedStepIds: [...(item.sharedStepIds ?? [])],
  };
}

export function createTmsRunSnapshot(
  id: string,
  projectId: string,
  plan: TmsPlan,
  cases: TmsCase[],
  startedAt: string,
  displayName: string,
  sharedSteps: import("../../domain/test-management").TmsSharedStep[] = [],
): TmsRun {
  const caseSnapshots = Object.fromEntries(plan.caseIds.flatMap((caseId) => {
    const item = cases.find((candidate) => candidate.id === caseId);
    return item ? [[caseId, snapshotTmsCase(item, sharedSteps)]] : [];
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

export function createTmsRerun(
  source: TmsRun,
  id: string,
  startedAt: string,
  displayName: string,
): TmsRun | null {
  const retryEntries = Object.entries(source.results).filter(([, result]) =>
    result.status === "failed" || result.status === "blocked");
  if (!retryEntries.length) return null;
  const results: TmsRun["results"] = {};
  const caseSnapshots: NonNullable<TmsRun["caseSnapshots"]> = {};
  for (const [caseId, result] of retryEntries) {
    const snapshot = source.caseSnapshots?.[caseId];
    results[caseId] = {
      status: "not_run",
      actual: "",
      comment: "",
      stepResults: (result.stepResults ?? snapshot?.steps.map(() => ({ status: "not_run" as const, actual: "", comment: "" })) ?? [])
        .map(() => ({ status: "not_run", actual: "", comment: "" })),
    };
    if (snapshot) caseSnapshots[caseId] = snapshot;
  }
  return {
    id,
    projectId: source.projectId,
    planId: source.planId,
    name: displayName,
    startedAt,
    rerunOf: source.id,
    caseSnapshots,
    results,
  };
}

export function reviseTmsSharedStep(
  existing: TmsSharedStep,
  name: string,
  steps: TmsSharedStep["steps"],
  savedAt: string,
): TmsSharedStep {
  const version: TmsSharedStepVersion = {
    version: existing.version,
    savedAt,
    name: existing.name,
    steps: existing.steps.map((step) => ({ ...step })),
  };
  return {
    ...existing,
    name,
    steps: steps.map((step) => ({ ...step })),
    version: existing.version + 1,
    updatedAt: savedAt,
    versions: [...(existing.versions ?? []), version],
  };
}
