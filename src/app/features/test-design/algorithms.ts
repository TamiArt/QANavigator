export type PwAlgorithmParam = { name: string; values: string[] };

function ipogPairwise(params: { name: string; values: string[] }[]): Record<string, string>[] {
  const n = params.length;
  if (n < 2) return [];

  type Row = (number | null)[];
  const tests: Row[] = [];

  // Init: all combos of first two params
  for (let v0 = 0; v0 < params[0].values.length; v0++) {
    for (let v1 = 0; v1 < params[1].values.length; v1++) {
      const row: Row = new Array(n).fill(null);
      row[0] = v0; row[1] = v1;
      tests.push(row);
    }
  }

  for (let pi = 2; pi < n; pi++) {
    const piLen = params[pi].values.length;
    // uncovered[pj|vj] = Set of vi-indices not yet covered with (pj,vj)
    const uncovered = new Map<string, Set<number>>();
    for (let pj = 0; pj < pi; pj++) {
      for (let vj = 0; vj < params[pj].values.length; vj++) {
        const s = new Set<number>();
        for (let vi = 0; vi < piLen; vi++) s.add(vi);
        uncovered.set(`${pj}|${vj}`, s);
      }
    }

    // Step 1: extend existing rows
    for (const test of tests) {
      let bestVi = 0, bestScore = -1;
      for (let vi = 0; vi < piLen; vi++) {
        let score = 0;
        for (let pj = 0; pj < pi; pj++) {
          if (test[pj] !== null && uncovered.get(`${pj}|${test[pj]}`)?.has(vi)) score++;
        }
        if (score > bestScore) { bestScore = score; bestVi = vi; }
      }
      test[pi] = bestVi;
      for (let pj = 0; pj < pi; pj++) {
        if (test[pj] !== null) uncovered.get(`${pj}|${test[pj]}`)?.delete(bestVi);
      }
    }

    // Step 2: new rows for remaining uncovered pairs
    for (let pj = 0; pj < pi; pj++) {
      for (let vj = 0; vj < params[pj].values.length; vj++) {
        const s = uncovered.get(`${pj}|${vj}`);
        if (!s || s.size === 0) continue;
        for (const vi of [...s]) {
          if (!uncovered.get(`${pj}|${vj}`)?.has(vi)) continue;
          const newRow: Row = new Array(n).fill(null);
          newRow[pj] = vj; newRow[pi] = vi;
          for (let pk = 0; pk < pi; pk++) {
            if (pk === pj) continue;
            let bestVk = 0, bestSc = -1;
            for (let vk = 0; vk < params[pk].values.length; vk++) {
              let sc = uncovered.get(`${pk}|${vk}`)?.has(vi) ? 1 : 0;
              if (sc > bestSc) { bestSc = sc; bestVk = vk; }
            }
            newRow[pk] = bestVk;
          }
          for (let pj2 = 0; pj2 < pi; pj2++) {
            if (newRow[pj2] !== null) uncovered.get(`${pj2}|${newRow[pj2]}`)?.delete(vi);
          }
          tests.push(newRow);
        }
      }
    }
  }

  return tests.map(row => {
    const obj: Record<string, string> = {};
    for (let p = 0; p < n; p++) obj[params[p].name] = params[p].values[row[p] ?? 0];
    return obj;
  });
}

type EPFieldType = "number" | "string" | "email" | "date" | "phone";

interface EPField {
  id: string;
  name: string;
  type: EPFieldType;
  required: boolean;
  min: string;
  max: string;
  minLen: string;
  maxLen: string;
}

interface EPClass {
  fieldName: string;
  classType: "valid" | "invalid";
  description: string;
  testValue: string;
  expected: string;
}

function generateEquivalenceClasses(fields: EPField[]): EPClass[] {
  const classes: EPClass[] = [];
  for (const field of fields) {
    const fn = field.name.trim() || "Поле";
    switch (field.type) {
      case "number": {
        const minVal = field.min !== "" ? parseFloat(field.min) : null;
        const maxVal = field.max !== "" ? parseFloat(field.max) : null;
        if (minVal !== null && maxVal !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Число в диапазоне [${minVal}, ${maxVal}]`, testValue: String(Math.round((minVal + maxVal) / 2)), expected: "Значение принято" });
        } else if (minVal !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Число ≥ ${minVal}`, testValue: String(minVal + 5), expected: "Значение принято" });
        } else if (maxVal !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Число ≤ ${maxVal}`, testValue: String(maxVal - 5), expected: "Значение принято" });
        } else {
          classes.push({ fieldName: fn, classType: "valid", description: "Любое целое число", testValue: "42", expected: "Значение принято" });
        }
        if (minVal !== null) classes.push({ fieldName: fn, classType: "invalid", description: `Ниже минимума (< ${minVal})`, testValue: String(minVal - 1), expected: "Ошибка валидации" });
        if (maxVal !== null) classes.push({ fieldName: fn, classType: "invalid", description: `Выше максимума (> ${maxVal})`, testValue: String(maxVal + 1), expected: "Ошибка валидации" });
        classes.push({ fieldName: fn, classType: "invalid", description: "Текст вместо числа", testValue: "abc", expected: "Ошибка формата" });
        classes.push({ fieldName: fn, classType: "invalid", description: "Специальные символы", testValue: "!@#", expected: "Ошибка формата" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое обязательное поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "string": {
        const minL = field.minLen !== "" ? parseInt(field.minLen) : null;
        const maxL = field.maxLen !== "" ? parseInt(field.maxLen) : null;
        if (minL !== null && maxL !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Строка ${minL}–${maxL} символов`, testValue: "a".repeat(Math.round((minL + maxL) / 2)), expected: "Значение принято" });
          if (minL > 1) classes.push({ fieldName: fn, classType: "invalid", description: `Слишком коротко (< ${minL} симв.)`, testValue: "a".repeat(Math.max(0, minL - 1)), expected: "Слишком коротко" });
          classes.push({ fieldName: fn, classType: "invalid", description: `Слишком длинно (> ${maxL} симв.)`, testValue: "a".repeat(maxL + 1), expected: "Слишком длинно" });
        } else {
          classes.push({ fieldName: fn, classType: "valid", description: "Обычная строка", testValue: "Тест Тестовый", expected: "Значение принято" });
        }
        classes.push({ fieldName: fn, classType: "invalid", description: "Только пробелы", testValue: "     ", expected: "Ошибка валидации" });
        classes.push({ fieldName: fn, classType: "invalid", description: "XSS-инъекция", testValue: "<script>alert(1)</script>", expected: "Экранирование/ошибка" });
        classes.push({ fieldName: fn, classType: "invalid", description: "SQL-инъекция", testValue: "' OR '1'='1", expected: "Экранирование/ошибка" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое обязательное поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "email": {
        classes.push({ fieldName: fn, classType: "valid", description: "Корректный email", testValue: "user@example.com", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "С субдоменом", testValue: "user@sub.example.com", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "С тегом (+)", testValue: "user+tag@example.com", expected: "Принято" });
        const badEmails: [string, string][] = [
          ["userexample.com", "Без @"], ["@example.com", "Нет локальной части"],
          ["user@", "Нет домена"], ["user @example.com", "Пробел в адресе"],
          ["user@example..com", "Двойная точка"], [".user@example.com", "Начало с точки"],
        ];
        for (const [val, desc] of badEmails) classes.push({ fieldName: fn, classType: "invalid", description: desc, testValue: val, expected: "Неверный формат" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "date": {
        classes.push({ fieldName: fn, classType: "valid", description: "Обычная дата", testValue: "15.06.2025", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "29 февраля (високосный год)", testValue: "29.02.2024", expected: "Принято" });
        const badDates: [string, string][] = [
          ["29.02.2025", "29 фев в невисокосный год"], ["31.04.2025", "31 апреля"],
          ["00.01.2025", "День 00"], ["15.13.2025", "Месяц 13"],
          ["abc", "Нечисловое"], ["2025.06.15", "Неверный формат (год первый)"],
        ];
        for (const [val, desc] of badDates) classes.push({ fieldName: fn, classType: "invalid", description: desc, testValue: val, expected: "Неверная дата" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "phone": {
        classes.push({ fieldName: fn, classType: "valid", description: "+7 мобильный", testValue: "+7 (999) 123-45-67", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "8-800 бесплатный", testValue: "8 800 555-35-35", expected: "Принято" });
        const badPhones: [string, string][] = [
          ["123", "Слишком короткий"], ["12345678901234", "Слишком длинный"],
          ["abc-def-ghij", "Буквы"], ["+7 (999) 12-34", "Неполный"],
        ];
        for (const [val, desc] of badPhones) classes.push({ fieldName: fn, classType: "invalid", description: desc, testValue: val, expected: "Неверный формат" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
    }
  }
  return classes;
}

interface STState { id: string; name: string; isInitial: boolean; isFinal: boolean }
interface STTransition { id: string; fromId: string; event: string; toId: string; expectedAction: string }
interface STTestCase { no: number; title: string; precondition: string; trigger: string; expected: string }

function generateSTTests(states: STState[], transitions: STTransition[]): STTestCase[] {
  return transitions.flatMap((t, idx) => {
    const from = states.find(s => s.id === t.fromId);
    const to = states.find(s => s.id === t.toId);
    if (!from || !to) return [];
    return [{
      no: idx + 1,
      title: from.name + " → " + to.name + ' (событие: "' + t.event + '")',
      precondition: 'Система в состоянии "' + from.name + '"',
      trigger: t.event,
      expected: 'Переход в "' + to.name + '"' + (t.expectedAction ? ". " + t.expectedAction : ""),
    }];
  });
}
