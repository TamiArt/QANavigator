import type { TmsCase, TmsStep } from "../../domain/test-management";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r;]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
export function serializeTmsCasesCsv(cases: TmsCase[]): string {
  const headers = ["ID", "Key", "Title", "Folder", "Description", "Preconditions", "Steps", "Expected Result", "Test Data", "Postconditions", "Priority", "Type", "Tags", "Requirement IDs", "References", "Estimate Minutes", "Automation Status", "Version", "Archived"];
  const rows = cases.map((item) => [
    item.id, item.key, item.title, item.folder, item.description ?? "", item.preconditions,
    JSON.stringify(item.steps), item.expected, item.testData ?? "", item.postconditions ?? "",
    item.priority, item.type, JSON.stringify(item.tags), JSON.stringify(item.requirementIds), JSON.stringify(item.references ?? []), item.estimateMinutes ?? "", item.automationStatus ?? "not_automated",
    item.version ?? 1, item.archived,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
function parseCsv(raw: string): string[][] {
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (quoted) {
      if (char === '"' && raw[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && raw[index + 1] === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (quoted) throw new Error("CSV содержит незакрытое поле в кавычках");
  return rows;
}
function parseArray(value: string): string[] {
  if (!value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch { /* Accept common delimiter-separated export fields. */ }
  return value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
}
function parseSteps(value: string, expected: string): TmsStep[] {
  if (!value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { action: item, expected };
        if (item && typeof item === "object") {
          const step = item as Record<string, unknown>;
          return { action: String(step.action ?? step.step ?? ""), expected: String(step.expected ?? expected) };
        }
        return { action: "", expected };
      }).filter((step) => step.action.trim());
    }
  } catch { /* Treat non-JSON steps as multiline actions. */ }
  return value.split(/\r?\n/).map((action) => ({ action: action.trim(), expected })).filter((step) => step.action);
}
function normalizePriority(value: string): TmsCase["priority"] {
  const normalized = value.trim().toLowerCase();
  if (["p1", "critical", "urgent", "high", "1"].includes(normalized)) return "P1";
  if (["p3", "low", "minor", "3"].includes(normalized)) return "P3";
  return "P2";
}
export function parseTmsCasesCsv(
  raw: string,
  projectId: string,
  existingCases: TmsCase[],
  validRequirementIds: string[],
): TmsCase[] {
  const rows = parseCsv(raw.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV не содержит строк тест-кейсов");
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const column = (...aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
  const titleIndex = column("title", "name", "название", "тест-кейс", "test case");
  if (titleIndex < 0) throw new Error("В CSV не найден обязательный столбец Title / Название");
  const value = (row: string[], ...aliases: string[]) => {
    const index = column(...aliases);
    return index >= 0 ? row[index] ?? "" : "";
  };
  const validRequirements = new Set(validRequirementIds);
  let nextNumber = existingCases.reduce((max,item)=>Math.max(max,Number(/^QA-(\\d+)$/.exec(item.key)?.[1]??0)),0);
  const imported: TmsCase[] = [];
  for (const row of rows.slice(1)) {
    const title = row[titleIndex]?.trim();
    if (!title) continue;
    const expected = value(row, "expected result", "expected", "ожидаемый результат");
    const rawSteps = value(row, "steps", "test steps", "шаги", "steps to reproduce");
    const requestedRequirements = parseArray(value(row, "requirement ids", "requirementids", "references", "требования"));
    nextNumber += 1;
    imported.push({
      id: crypto.randomUUID(),
      projectId,
      key: "QA-" + String(nextNumber).padStart(3, "0"),
      title,
      folder: value(row, "folder", "section", "папка", "раздел") || "Импортированные кейсы",
      description: value(row, "description", "описание"),
      preconditions: value(row, "preconditions", "precondition", "предусловия"),
      steps: parseSteps(rawSteps, expected),
      expected,
      testData: value(row, "test data", "testdata", "тестовые данные"),
      postconditions: value(row, "postconditions", "постусловия"),
      priority: normalizePriority(value(row, "priority", "приоритет")),
      type: value(row, "type", "case type", "тип") || "Functional",
      tags: parseArray(value(row, "tags", "labels", "теги")),
      requirementIds: requestedRequirements.filter((id) => validRequirements.has(id)),
      references: parseArray(value(row, "references", "external references", "ссылки")),
      estimateMinutes: Number(value(row, "estimate minutes", "estimate", "effort", "оценка времени")) || undefined,
      automationStatus: (() => { const status=value(row,"automation status","automation type","автоматизация").toLowerCase(); return status.includes("autom") ? "automated" as const : status.includes("candidate") || status.includes("to be") ? "candidate" as const : "not_automated" as const; })(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      version: 1,
    });
  }
  if (!imported.length) throw new Error("В CSV нет строк с заполненным названием тест-кейса");
  return imported;
}
