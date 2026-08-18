import type { FieldConfig, TestObjectConfig, TestPlanStep } from "./types";

interface NumericRange {
  start: number;
  end: number;
  label: string;
}

const fieldName = (field: FieldConfig) => field.name.trim() || "Поле";
const unique = (values: number[]) => [...new Set(values.filter(Number.isFinite))];

function parseRanges(value?: string): { ranges: NumericRange[]; invalid: string[] } {
  if (!value?.trim()) return { ranges: [], invalid: [] };
  const parts = value.split(";").map((part) => part.trim()).filter(Boolean);
  const ranges: NumericRange[] = [];
  const invalid: string[] = [];

  parts.forEach((part) => {
    const match = part.match(/^(-?\d+(?:\.\d+)?)\s*(?:-|–|—|\.\.)\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) {
      invalid.push(part);
      return;
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      invalid.push(part);
      return;
    }
    ranges.push({ start, end, label: `${start}–${end}` });
  });

  return { ranges: ranges.sort((a, b) => a.start - b.start || a.end - b.end), invalid };
}

function overlapPairs(ranges: NumericRange[]): string[] {
  const overlaps: string[] = [];
  for (let index = 1; index < ranges.length; index += 1) {
    const previous = ranges[index - 1];
    const current = ranges[index];
    if (current.start <= previous.end) overlaps.push(`${previous.label} и ${current.label}`);
  }
  return overlaps;
}

function classRepresentative(range: NumericRange): string {
  const midpoint = (range.start + range.end) / 2;
  const representative = Number.isInteger(range.start) && Number.isInteger(range.end)
    ? Math.floor(midpoint)
    : Number(midpoint.toFixed(2));
  return `${range.label} → например ${representative}`;
}

function boundaryExamples(ranges: NumericRange[]): string[] {
  return unique(ranges.flatMap((range) => [
    range.start - 1, range.start, range.start + 1,
    range.end - 1, range.end, range.end + 1,
  ])).sort((a, b) => a - b).map(String);
}

function fieldRangeSteps(field: FieldConfig, prefix: string): TestPlanStep[] {
  if (field.dataType !== "number" || !field.hasIntermediateRanges) return [];
  const name = fieldName(field);

  if (!field.valueRanges?.trim()) return [{
    id: `${prefix}-${field.id}-ranges-missing`,
    category: "requirements",
    title: `Укажи промежуточные диапазоны: «${name}»`,
    action: "Заполни диапазоны ровно так, как они определены в требованиях. Например: 0-17; 18-59; 60-100.",
    why: "Флаг показывает, что внутри общего диапазона меняется правило, но без самих диапазонов мастер не может определить классы и границы.",
  }];

  const { ranges, invalid } = parseRanges(field.valueRanges);
  const overlaps = overlapPairs(ranges);
  const result: TestPlanStep[] = [];

  if (invalid.length) result.push({
    id: `${prefix}-${field.id}-ranges-invalid`,
    category: "requirements",
    title: `Уточни запись диапазонов: «${name}»`,
    action: `Не удалось однозначно разобрать: ${invalid.join("; ")}. Используй формат «0-17; 18-59; 60-100».`,
    why: "Мастер не должен угадывать границы по неоднозначной записи.",
  });

  if (overlaps.length) result.push({
    id: `${prefix}-${field.id}-ranges-overlap`,
    category: "requirements",
    title: `Уточни пересекающиеся диапазоны: «${name}»`,
    action: `Сейчас одно значение может относиться сразу к двум диапазонам: ${overlaps.join("; ")}. Уточни требования и запиши диапазоны без неоднозначности, например «0-17; 18-59; 60-100».`,
    why: "Если диапазоны пересекаются, мастер не может сам решить, какое правило должно применяться на общей границе.",
  });

  if (!ranges.length || overlaps.length) return result;

  result.push({
    id: `${prefix}-${field.id}-ranges-ep`,
    category: "validation",
    title: `Проверь каждый числовой диапазон: «${name}»`,
    action: "Возьми минимум по одному значению из каждого явно заданного диапазона и проверь ожидаемое правило для этой группы.",
    why: "Каждый диапазон является отдельным классом эквивалентности, если внутри него ожидается одинаковое поведение.",
    technique: { ru: "Классы эквивалентности", en: "Equivalence Partitioning", short: "EP" },
    examples: ranges.map(classRepresentative),
    expected: "Для каждого диапазона применяется именно то поведение, которое задано требованиями.",
  });

  result.push({
    id: `${prefix}-${field.id}-ranges-bva`,
    category: "validation",
    title: `Проверь границы всех диапазонов: «${name}»`,
    action: "Проверь начало и конец каждого диапазона, а также соседние целые значения непосредственно до и после границы. Значения, которые выходят за общий min/max, используй как негативные только если это соответствует требованиям.",
    why: "Ошибки часто возникают именно в точках перехода между соседними бизнес-правилами.",
    technique: { ru: "Анализ граничных значений", en: "Boundary Value Analysis", short: "BVA" },
    examples: boundaryExamples(ranges),
    expected: "Переход между правилами происходит точно на границах, указанных пользователем, без пропусков и неожиданного пересечения диапазонов.",
  });

  return result;
}

export function buildIntermediateBoundarySteps(config: TestObjectConfig): TestPlanStep[] {
  if (!["field", "form", "auth"].includes(config.objectType)) return [];
  const fields = config.objectType === "field" ? config.fields.slice(0, 1) : config.fields;
  return fields.flatMap((field, index) => fieldRangeSteps(field, `ranges-${index}`));
}
