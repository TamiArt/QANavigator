export interface RTMRequirement {
  id: string;
  reqId: string;
  title: string;
  priority: "high" | "medium" | "low";
}

export interface RTMTestCase {
  id: string;
  tcId: string;
  title: string;
}

export interface RTMCoverageRow {
  reqId: string;
  total: number;
  covered: number;
}

function linkKey(reqId: string, tcId: string): string {
  return reqId + ":" + tcId;
}

export function calculateRTMCoverage(
  requirements: RTMRequirement[],
  testCases: RTMTestCase[],
  links: Set<string>,
): RTMCoverageRow[] {
  return requirements.map((req) => ({
    reqId: req.reqId,
    total: testCases.length,
    covered: testCases.filter((tc) => links.has(linkKey(req.reqId, tc.tcId))).length,
  }));
}

function csvCell(value: string): string {
  return '"' + value.replaceAll('"', '""') + '"';
}

export function buildRTMCsv(
  requirements: RTMRequirement[],
  testCases: RTMTestCase[],
  links: Set<string>,
): string {
  return [
    ["Требование", "Описание", "Приоритет", ...testCases.map((tc) => tc.tcId), "Покрытие"].join(","),
    ...requirements.map((req) => {
      const covCount = testCases.filter((tc) => links.has(linkKey(req.reqId, tc.tcId))).length;
      const cells = testCases.map((tc) => links.has(linkKey(req.reqId, tc.tcId)) ? "✓" : "");
      return [
        csvCell(req.reqId),
        csvCell(req.title),
        req.priority,
        ...cells,
        covCount > 0 ? "Покрыто" : "Не покрыто",
      ].join(",");
    }),
  ].join("\n");
}
