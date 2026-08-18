import type { FieldConfig, TestObjectConfig, TestPlanStep } from "./types";

const uniqueSorted = (values: number[]) => [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
const fieldName = (field: FieldConfig) => field.name.trim() || "Поле";

function boundaryExamples(boundaries: number[]): string[] {
  return [...new Set(boundaries.flatMap((boundary) => [boundary - 1, boundary, boundary + 1]).map(String))];
}

function fieldBoundarySteps(field: FieldConfig, prefix: string): TestPlanStep[] {
  if (field.dataType !== "number") return [];
  const boundaries = uniqueSorted(field.intermediateBoundaries ?? []);
  if (!boundaries.length) return [];

  const knownRange = field.min !== undefined && field.max !== undefined
    ? ` Общий известный диапазон: ${field.min}…${field.max}.`
    : "";

  return [{
    id: `${prefix}-${field.id}-bva-intermediate`,
    category: "validation",
    title: `Проверь промежуточные границы: «${fieldName(field)}»`,
    action: `Для каждого указанного порога проверь значение непосредственно до него, само значение порога и значение сразу после него.${knownRange} Сравни поведение по требованиям по обе стороны порога.`,
    why: "Внутри допустимого диапазона бизнес-правило тоже может меняться. Такие точки являются границами и подвержены тем же ошибкам сравнения, что min и max.",
    technique: { ru: "Анализ граничных значений", en: "Boundary Value Analysis", short: "BVA" },
    examples: boundaryExamples(boundaries),
    expected: "Поведение меняется именно на заданной границе согласно требованиям. Мастер не предполагает, относится само граничное значение к правилу «до» или «после» — это определяется требованиями.",
  }];
}

export function buildIntermediateBoundarySteps(config: TestObjectConfig): TestPlanStep[] {
  if (!["field", "form", "auth"].includes(config.objectType)) return [];
  const fields = config.objectType === "field" ? config.fields.slice(0, 1) : config.fields;
  return fields.flatMap((field, index) => fieldBoundarySteps(field, `intermediate-${index}`));
}
