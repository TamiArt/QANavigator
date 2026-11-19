import type { TmsData, TmsRun } from "../../domain/test-management";

export interface TmsOverviewMetrics {
  totalCases: number;
  activeCases: number;
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercent: number;
  automationCoveragePercent: number;
  totalRuns: number;
  passed: number;
  failed: number;
  blocked: number;
  retest: number;
  inProgress: number;
  skipped: number;
  notRun: number;
  passRate: number;
  openDefects: number;
}
function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r;]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
export function getTmsOverviewMetrics(data: TmsData): TmsOverviewMetrics {
  const requirements = data.requirements ?? [];
  const coveredRequirements = requirements.filter((requirement) =>
    data.cases.some((item) => item.requirementIds.includes(requirement.id))).length;
  const latestRun = data.runs[0];
  const results = latestRun ? Object.values(latestRun.results) : [];
  const count = (status: string) => results.filter((result) => result.status === status).length;
  const executed = results.filter((result) => !["not_run", "in_progress", "retest"].includes(result.status)).length;
  return {
    totalCases: data.cases.length,
    activeCases: data.cases.filter((item) => !item.archived).length,
    totalRequirements: requirements.length,
    coveredRequirements,
    coveragePercent: requirements.length ? Math.round(coveredRequirements / requirements.length * 100) : 0,
    automationCoveragePercent: data.cases.filter((item) => !item.archived).length ? Math.round(data.cases.filter((item) => !item.archived && item.automationStatus === "automated").length / data.cases.filter((item) => !item.archived).length * 100) : 0,
    totalRuns: data.runs.length,
    passed: count("passed"),
    failed: count("failed"),
    blocked: count("blocked"),
    retest: count("retest"),
    inProgress: count("in_progress"),
    skipped: count("skipped"),
    notRun: count("not_run"),
    passRate: executed ? Math.round(count("passed") / executed * 100) : 0,
    openDefects: data.defects.filter((item) => !["closed", "rejected"].includes(item.status)).length,
  };
}
export function createTmsTraceabilityCsv(data: TmsData): string {
  const rows = [["Requirement ID", "Requirement", "Status", "Priority", "Test Case ID", "Test Case", "Case Priority"]];
  for (const requirement of data.requirements ?? []) {
    const linked = data.cases.filter((item) => item.requirementIds.includes(requirement.id));
    if (!linked.length) rows.push([requirement.key, requirement.title, requirement.status, requirement.priority, "", "NOT COVERED", ""]);
    else for (const item of linked) rows.push([requirement.key, requirement.title, requirement.status, requirement.priority, item.key, item.title, item.priority]);
  }
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}
export function createTmsRunCsv(run: TmsRun): string {
  const rows = [["Run Environment", "Release", "Build", "Test Case ID", "Test Case", "Assignee", "Case Version", "Result", "Actual Result", "Step", "Step Result", "Step Actual"]];
  for (const [caseId, result] of Object.entries(run.results)) {
    const snapshot = run.caseSnapshots?.[caseId];
    const title = snapshot?.title ?? caseId;
    const steps = snapshot?.steps ?? [];
    if (!result.stepResults?.length) rows.push([run.planSnapshot?.environment ?? "", run.planSnapshot?.release ?? "", run.planSnapshot?.build ?? "", snapshot?.key ?? caseId, title, result.assignee ?? "", String(snapshot?.version ?? ""), result.status, result.actual, "", "", ""]);
    else result.stepResults.forEach((stepResult, index) => rows.push([
      run.planSnapshot?.environment ?? "", run.planSnapshot?.release ?? "", run.planSnapshot?.build ?? "",
      snapshot?.key ?? caseId, title, result.assignee ?? "", String(snapshot?.version ?? ""), result.status, result.actual,
      steps[index]?.action ?? String(index + 1), stepResult.status, stepResult.actual,
    ]));
  }
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}
