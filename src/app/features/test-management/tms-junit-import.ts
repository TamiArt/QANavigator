import type { TmsCase, TmsRunResult } from "../../domain/test-management";

export interface JUnitImportedResult {
  caseId: string;
  result: TmsRunResult;
}
export interface JUnitImportSummary {
  results: JUnitImportedResult[];
  unmatched: string[];
}
export function parseJUnitXmlResults(xml: string, cases: TmsCase[]): JUnitImportSummary {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.getElementsByTagName("parsererror").length) {
    throw new Error("JUnit XML повреждён или не является корректным XML");
  }
  const testCases = Array.from(document.getElementsByTagName("testcase"));
  if (!testCases.length) throw new Error("В JUnit XML не найдены элементы testcase");
  const results: JUnitImportedResult[] = [];
  const unmatched: string[] = [];
  for (const testCase of testCases) {
    const name = testCase.getAttribute("name") ?? "";
    const className = testCase.getAttribute("classname") ?? "";
    const candidate = cases.find((item) =>
      item.key === name || item.id === name || item.title === name ||
      item.key === className || item.title === className);
    if (!candidate) {
      unmatched.push(className ? className + " · " + name : name);
      continue;
    }
    const failure = testCase.getElementsByTagName("failure")[0];
    const error = testCase.getElementsByTagName("error")[0];
    const skipped = testCase.getElementsByTagName("skipped").length > 0;
    const failedNode = failure ?? error;
    const status: TmsRunResult["status"] = failedNode ? "failed" : skipped ? "skipped" : "passed";
    const actual = failedNode?.textContent?.trim() ||
      (skipped ? testCase.getElementsByTagName("skipped")[0]?.getAttribute("message") ?? "Skipped by automation" : "Passed by automation");
    results.push({
      caseId: candidate.id,
      result: { status, actual, comment: "Импортировано из JUnit XML", stepResults: candidate.steps.map(() => ({ status, actual, comment: "JUnit XML" })) },
    });
  }
  return { results, unmatched };
}
