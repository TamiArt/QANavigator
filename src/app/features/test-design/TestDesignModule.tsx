import * as React from "react";
import { useState, useMemo } from "react";
import { Zap, Check, Download, Info, X, Plus, AlertCircle, Layers } from "lucide-react";
import { CopyButton, EmptyState } from "../../components/shared";
import { uid } from "../../core/ai";
import {
  generateEquivalenceClasses,
  generateSTTests,
  ipogPairwise,
  type EPClass,
  type EPField,
  type EPFieldType,
  type STState,
  type STTestCase,
  type STTransition,
  generateBVA,
  type BVAField,
  type BVAPoint,
  generateDecisionColumns,
  normalizeDecisionActionMatrix,
  buildDecisionTableText,
  type DTCondition,
  type DTAction,
} from "./algorithms";

// ══════════════════════════════════════════════════════
// PAIRWISE ALGORITHM (IPOG)
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// PAIRWISE TAB
// ══════════════════════════════════════════════════════
type PwParam = { id: string; name: string; valuesRaw: string };

const VALUE_COLORS = [
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
];

function PairwiseTab() {
  const [params, setParams] = useState<PwParam[]>([
    { id: uid(), name: "Операционная система", valuesRaw: "Windows, macOS, Linux" },
    { id: uid(), name: "Браузер", valuesRaw: "Chrome, Firefox, Edge, Safari" },
    { id: uid(), name: "Разрешение экрана", valuesRaw: "1920×1080, 1366×768, 375×812" },
    { id: uid(), name: "Тип пользователя", valuesRaw: "Гость, Авторизованный, Администратор" },
  ]);
  const [result, setResult] = useState<Record<string, string>[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const parsedParams = useMemo(() =>
    params
      .map((p, i) => ({
        name: p.name.trim() || `Параметр ${i + 1}`,
        values: p.valuesRaw.split(",").map(v => v.trim()).filter(v => v.length > 0),
      }))
      .filter(p => p.values.length >= 1),
    [params]
  );

  const totalCombinations = useMemo(
    () => parsedParams.reduce((acc, p) => acc * p.values.length, 1),
    [parsedParams]
  );

  const colorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const p of parsedParams) {
      for (const v of p.values) {
        const k = `${p.name}:::${v}`;
        if (!map.has(k)) { map.set(k, idx % VALUE_COLORS.length); idx++; }
      }
    }
    return map;
  }, [parsedParams]);

  const generate = () => {
    setError("");
    if (parsedParams.length < 2) { setError("Нужно минимум 2 параметра с хотя бы 1 значением каждый."); return; }
    const emptyVal = parsedParams.find(p => p.values.length === 0);
    if (emptyVal) { setError(`Параметр «${emptyVal.name}» не имеет значений.`); return; }
    try {
      setResult(ipogPairwise(parsedParams));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addParam = () => setParams(p => [...p, { id: uid(), name: "", valuesRaw: "" }]);
  const removeParam = (id: string) => {
    if (params.length <= 2) return;
    setParams(p => p.filter(x => x.id !== id));
    setResult(null);
  };
  const updateParam = (id: string, field: keyof PwParam, value: string) => {
    setParams(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
    setResult(null);
  };

  const copyCSV = () => {
    if (!result) return;
    const header = parsedParams.map(p => `"${p.name}"`).join(",");
    const rows = result.map((tc, i) =>
      [`"${i + 1}"`, ...parsedParams.map(p => `"${tc[p.name]}"`)].join(",")
    );
    navigator.clipboard.writeText(["#," + header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reduction = result && totalCombinations > result.length
    ? Math.round((1 - result.length / totalCombinations) * 100)
    : 0;

  const totalPairs = useMemo(() => {
    let cnt = 0;
    for (let i = 0; i < parsedParams.length; i++)
      for (let j = i + 1; j < parsedParams.length; j++)
        cnt += parsedParams[i].values.length * parsedParams[j].values.length;
    return cnt;
  }, [parsedParams]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Попарное тестирование (Pairwise / All-Pairs)</span> — техника, при которой каждое значение каждого параметра встречается в паре с каждым значением каждого другого параметра хотя бы в одном тест-кейсе. Это позволяет охватить большинство дефектов (проявляются при взаимодействии 2 параметров), сократив количество тестов в {totalCombinations > 1 ? <><b className="text-foreground">{totalCombinations}x</b> раз</> : "несколько раз"}.
      </div>

      {/* Parameters input */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">Параметры и значения</span>
            <span className="ml-2 text-xs text-muted-foreground">Значения — через запятую</span>
          </div>
          <button
            onClick={addParam}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>

        <div className="space-y-2">
          {params.map((p, idx) => (
            <div key={p.id} className="flex gap-2 items-center">
              <span className="w-5 text-center text-xs text-muted-foreground font-mono shrink-0">{idx + 1}</span>
              <input
                value={p.name}
                onChange={e => updateParam(p.id, "name", e.target.value)}
                placeholder="Параметр"
                className="w-44 shrink-0 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                value={p.valuesRaw}
                onChange={e => updateParam(p.id, "valuesRaw", e.target.value)}
                placeholder="Значение 1, Значение 2, Значение 3"
                className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <div className="shrink-0 flex gap-1">
                {p.valuesRaw && (
                  <span className="text-xs text-muted-foreground tabular-nums py-1.5 px-2 bg-muted rounded-lg">
                    {p.valuesRaw.split(",").filter(v => v.trim()).length}
                  </span>
                )}
                <button
                  onClick={() => removeParam(p.id)}
                  disabled={params.length <= 2}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-25 rounded-lg hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <div className="text-xs text-muted-foreground space-x-3">
            <span>Параметров: <b className="text-foreground">{parsedParams.length}</b></span>
            <span>Полных комбинаций: <b className="text-foreground font-mono">{totalCombinations}</b></span>
            <span>Уникальных пар: <b className="text-foreground font-mono">{totalPairs}</b></span>
          </div>
          <div className="flex-1" />
          <button
            onClick={generate}
            disabled={parsedParams.length < 2}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Сгенерировать
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-primary tabular-nums">{result.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pairwise тест-кейсов</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-foreground tabular-nums">{totalCombinations}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Полных комбинаций</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {reduction > 0 ? `−${reduction}%` : "≈"}
              </div>
              <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Сокращение</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
              <span className="text-xs font-medium text-foreground">Таблица тест-кейсов ({result.length} строк)</span>
              <button
                onClick={copyCSV}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
              >
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Скопировано!</>
                  : <><Download className="w-3.5 h-3.5" /> Экспорт CSV</>}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10 tabular-nums">#</th>
                    {parsedParams.map(p => (
                      <th key={p.name} className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                        {p.name}
                        <span className="ml-1 font-normal text-muted-foreground">({p.values.length})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.map((tc, idx) => (
                    <tr key={idx} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono tabular-nums">{idx + 1}</td>
                      {parsedParams.map(p => {
                        const val = tc[p.name];
                        const cls = VALUE_COLORS[colorMap.get(`${p.name}:::${val}`) ?? 0];
                        return (
                          <td key={p.name} className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation */}
          <div className="flex gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <b className="text-foreground">Покрытие гарантировано:</b> каждая возможная пара значений любых двух параметров встречается хотя бы в одной строке таблицы. Алгоритм: <b className="text-foreground">IPOG</b> (In-Parameter-Order General). Всего уникальных пар: <b className="text-foreground">{totalPairs}</b>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl h-36 flex items-center justify-center">
          <EmptyState icon={<Layers />} title="Тест-кейсы появятся здесь" desc="Заполните параметры и нажмите «Сгенерировать»" />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TECHNIQUE TABS: EP, BVA, Decision Table, State Transition
// ══════════════════════════════════════════════════════

// ── Equivalence Partitioning ──────────────────────────
function EPTab() {
  const [fields, setFields] = useState<EPField[]>([
    { id: uid(), name: "Email", type: "email", required: true, min: "", max: "", minLen: "", maxLen: "" },
    { id: uid(), name: "Возраст", type: "number", required: true, min: "18", max: "120", minLen: "", maxLen: "" },
  ]);
  const [result, setResult] = useState<EPClass[] | null>(null);

  const addField = () => setFields(f => [...f, { id: uid(), name: "", type: "string" as EPFieldType, required: true, min: "", max: "", minLen: "", maxLen: "" }]);
  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));
  const updateField = (id: string, changes: Partial<EPField>) => setFields(f => f.map(x => x.id === id ? { ...x, ...changes } : x));
  const generate = () => setResult(generateEquivalenceClasses(fields.filter(f => f.name.trim())));

  const validCount = result?.filter(c => c.classType === "valid").length ?? 0;
  const invalidCount = result?.filter(c => c.classType === "invalid").length ?? 0;

  const typeLabels: Record<EPFieldType, string> = { number: "Число", string: "Строка", email: "Email", date: "Дата", phone: "Телефон" };

  const csvText = result
    ? ["Поле,Класс,Описание,Значение,Ожидаемый результат",
        ...result.map(c => `"${c.fieldName}","${c.classType === "valid" ? "Валидный" : "Невалидный"}","${c.description}","${c.testValue}","${c.expected}"`)
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">🎯 Классы эквивалентности (Equivalence Partitioning)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Разбивает входные данные на <span className="text-foreground font-medium">группы (классы)</span>, внутри которых система ведёт себя одинаково.
          Достаточно одного значения из каждого класса — это сокращает число тестов без потери покрытия.
          Применяется к полям с типами данных, форматами, диапазонами.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Валидный класс</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> Невалидный класс</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Поля для анализа</span>
          <button onClick={addField} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Добавить поле
          </button>
        </div>
        <div className="divide-y divide-border">
          {fields.map((field) => (
            <div key={field.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <input
                value={field.name}
                onChange={e => updateField(field.id, { name: e.target.value })}
                placeholder="Название поля"
                className="flex-1 min-w-[130px] bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <select
                value={field.type}
                onChange={e => updateField(field.id, { type: e.target.value as EPFieldType, min: "", max: "", minLen: "", maxLen: "" })}
                className="bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
              >
                {(Object.entries(typeLabels) as [EPFieldType, string][]).map(([t, label]) => (
                  <option key={t} value={t}>{label}</option>
                ))}
              </select>
              {field.type === "number" && (
                <div className="flex items-center gap-1.5">
                  <input value={field.min} onChange={e => updateField(field.id, { min: e.target.value })} placeholder="Мин" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input value={field.max} onChange={e => updateField(field.id, { max: e.target.value })} placeholder="Макс" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                </div>
              )}
              {field.type === "string" && (
                <div className="flex items-center gap-1.5">
                  <input value={field.minLen} onChange={e => updateField(field.id, { minLen: e.target.value })} placeholder="Мин.дл" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input value={field.maxLen} onChange={e => updateField(field.id, { maxLen: e.target.value })} placeholder="Макс.дл" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                </div>
              )}
              {!["number", "string"].includes(field.type) && <div className="w-px" />}
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="rounded accent-primary" />
                Обяз.
              </label>
              <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={generate}
            disabled={fields.filter(f => f.name.trim()).length === 0}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Сгенерировать классы эквивалентности
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Результат</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{validCount} валидных</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{invalidCount} невалидных</span>
            </div>
            <CopyButton text={csvText} label="CSV" />
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Поле</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Класс</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Описание</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Тестовое значение</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ожидаемый результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.map((cls, i) => (
                    <tr key={i} className={cls.classType === "valid" ? "bg-emerald-50/40 dark:bg-emerald-900/10" : "bg-rose-50/40 dark:bg-rose-900/10"}>
                      <td className="px-3 py-2 font-medium text-foreground">{cls.fieldName}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls.classType === "valid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}>
                          {cls.classType === "valid" ? "✓ Валидный" : "✗ Невалидный"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{cls.description}</td>
                      <td className="px-3 py-2 font-mono text-foreground">{cls.testValue}</td>
                      <td className="px-3 py-2 text-muted-foreground">{cls.expected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Boundary Value Analysis ───────────────────────────
// BVA model and generator live in the pure algorithms layer.

function BVATab() {
  const [fields, setFields] = useState<BVAField[]>([
    { id: uid(), name: "Возраст пользователя", min: "18", max: "100", step: "1", required: true, isInteger: true },
    { id: uid(), name: "Сумма перевода (руб.)", min: "10", max: "50000", step: "0.01", required: true, isInteger: false },
  ]);
  const [result, setResult] = useState<Record<string, BVAPoint[]> | null>(null);

  const addField = () => setFields(f => [...f, { id: uid(), name: "", min: "", max: "", step: "1", required: true, isInteger: true }]);
  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));
  const updateField = (id: string, changes: Partial<BVAField>) => setFields(f => f.map(x => x.id === id ? { ...x, ...changes } : x));

  const generate = () => {
    const res: Record<string, BVAPoint[]> = {};
    for (const field of fields) {
      if (!field.name.trim() || !field.min || !field.max) continue;
      const pts = generateBVA(field);
      if (pts.length) res[field.id + "|" + field.name] = pts;
    }
    setResult(res);
  };

  const allEntries = result ? Object.entries(result) : [];
  const totalCount = allEntries.reduce((s, [, pts]) => s + pts.length, 0);

  const csvText = allEntries.length
    ? ["Поле,Граничная точка,Значение,Тип,Ожидаемый результат",
        ...allEntries.flatMap(([key, pts]) => {
          const name = key.split("|").slice(1).join("|");
          return pts.map(p => `"${name}","${p.label}","${p.value}","${p.type === "valid" ? "Валидный" : "Невалидный"}","${p.expected}"`);
        })
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">📏 Граничные значения (Boundary Value Analysis)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Дополняет классы эквивалентности: большинство ошибок концентрируется <span className="text-foreground font-medium">на границах диапазонов</span>.
          Генерирует до 7 точек для каждой границы: <span className="text-foreground font-medium">min−1, min, min+1, ном., max−1, max, max+1</span>.
          Применяется к числам, датам, длинам строк.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Валидная точка</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> Невалидная точка</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Поля с диапазонами</span>
          <button onClick={addField} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Добавить поле
          </button>
        </div>
        <div className="divide-y divide-border">
          {fields.map(field => (
            <div key={field.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <input
                value={field.name}
                onChange={e => updateField(field.id, { name: e.target.value })}
                placeholder="Название поля"
                className="flex-1 min-w-[140px] bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Мин:</span>
                <input value={field.min} onChange={e => updateField(field.id, { min: e.target.value })} className="w-20 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                <span className="text-xs text-muted-foreground">Макс:</span>
                <input value={field.max} onChange={e => updateField(field.id, { max: e.target.value })} className="w-20 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                <span className="text-xs text-muted-foreground">Шаг:</span>
                <input value={field.step} onChange={e => updateField(field.id, { step: e.target.value })} className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="rounded accent-primary" /> Обяз.
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={field.isInteger} onChange={e => updateField(field.id, { isInteger: e.target.checked })} className="rounded accent-primary" /> Целые
              </label>
              <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={generate}
            disabled={fields.filter(f => f.name.trim() && f.min && f.max).length === 0}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Сгенерировать граничные значения
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Результат</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">{totalCount} тест-кейсов</span>
            </div>
            <CopyButton text={csvText} label="CSV" />
          </div>
          {allEntries.length === 0 ? (
            <div className="bg-card border border-border rounded-xl h-20 flex items-center justify-center text-sm text-muted-foreground">Заполните мин. и макс. хотя бы одного поля</div>
          ) : (
            allEntries.map(([key, pts]) => {
              const fieldName = key.split("|").slice(1).join("|");
              return (
                <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-muted/50 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{fieldName}</span>
                    <span className="text-xs text-muted-foreground">{pts.length} точек</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">#</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Граничная точка</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Значение</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Тип</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ожидаемый результат</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pts.map((p, i) => (
                          <tr key={i} className={p.type === "valid" ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "bg-rose-50/30 dark:bg-rose-900/10"}>
                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-2 text-muted-foreground">{p.label}</td>
                            <td className="px-3 py-2 font-mono font-medium text-foreground">{p.value}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === "valid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}>
                                {p.type === "valid" ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{p.expected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Decision Table Tab ────────────────────────────────
function DecisionTableTab() {
  const [conditions, setConditions] = useState<DTCondition[]>([
    { id: uid(), name: "Пользователь авторизован?" },
    { id: uid(), name: "Email подтверждён?" },
    { id: uid(), name: "Подписка активна?" },
  ]);
  const [actions, setActions] = useState<DTAction[]>([
    { id: uid(), name: "Показать контент" },
    { id: uid(), name: "Предложить подписку" },
    { id: uid(), name: "Показать страницу авторизации" },
  ]);
  const [actionMatrix, setActionMatrix] = useState<Record<string, boolean[]>>({});
  const [generated, setGenerated] = useState(false);

  const MAX_CONDITIONS = 4;
  const numCols = Math.pow(2, Math.min(conditions.length, MAX_CONDITIONS));

  const colValues = useMemo(
    () => generateDecisionColumns(conditions.length, MAX_CONDITIONS),
    [conditions.length]
  );

  const addCondition = () => {
    if (conditions.length >= MAX_CONDITIONS) return;
    setConditions(c => [...c, { id: uid(), name: "" }]);
    setGenerated(false);
    setActionMatrix({});
  };
  const removeCondition = (id: string) => { setConditions(c => c.filter(x => x.id !== id)); setGenerated(false); setActionMatrix({}); };
  const addAction = () => setActions(a => [...a, { id: uid(), name: "" }]);
  const removeAction = (id: string) => setActions(a => a.filter(x => x.id !== id));

  const generate = () => {
    setActionMatrix(normalizeDecisionActionMatrix(actions, actionMatrix, numCols));
    setGenerated(true);
  };

  const toggleAction = (actionId: string, col: number) => {
    setActionMatrix(prev => ({
      ...prev,
      [actionId]: (prev[actionId] ?? new Array(numCols).fill(false)).map((v: boolean, i: number) => i === col ? !v : v),
    }));
  };

  const tcText = buildDecisionTableText(conditions, actions, actionMatrix, colValues, MAX_CONDITIONS);

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">📊 Таблицы решений (Decision Tables)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Систематически описывают логику с <span className="text-foreground font-medium">комбинациями условий</span> и соответствующими действиями.
          Инструмент генерирует все 2ⁿ комбинаций n условий (Да/Нет) — отметьте, какие действия срабатывают для каждой.
          Максимум {MAX_CONDITIONS} условия = {Math.pow(2, MAX_CONDITIONS)} тест-кейса.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Условия (C)</span>
            <button onClick={addCondition} disabled={conditions.length >= MAX_CONDITIONS} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-border">
            {conditions.map((cond, i) => (
              <div key={cond.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">C{i + 1}</span>
                <input
                  value={cond.name}
                  onChange={e => setConditions(prev => prev.map(c => c.id === cond.id ? { ...c, name: e.target.value } : c))}
                  placeholder={"Условие " + (i + 1)}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button onClick={() => removeCondition(cond.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Действия / результаты (A)</span>
            <button onClick={addAction} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-border">
            {actions.map((action, i) => (
              <div key={action.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">A{i + 1}</span>
                <input
                  value={action.name}
                  onChange={e => setActions(prev => prev.map(a => a.id === action.id ? { ...a, name: e.target.value } : a))}
                  placeholder={"Действие " + (i + 1)}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button onClick={() => removeAction(action.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={conditions.length === 0 || actions.length === 0}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Построить таблицу решений ({numCols} комбинаций)
      </button>

      {generated && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Таблица решений</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">Т = Да</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">Ф = Нет</span>
              <CopyButton text={tcText} label="Тест-кейсы" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[200px] sticky left-0 bg-muted/50 z-10">Условие / Действие</th>
                    {colValues.map((_, col) => (
                      <th key={col} className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[48px]">ТК{col + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {conditions.slice(0, MAX_CONDITIONS).map((cond, ci) => (
                    <tr key={cond.id} className="bg-sky-50/30 dark:bg-sky-900/10">
                      <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-sky-50/50 dark:bg-sky-900/20 z-10">
                        <span className="text-muted-foreground font-mono mr-2">C{ci + 1}</span>{cond.name || "Условие " + (ci + 1)}
                      </td>
                      {colValues.map((colConds, col) => (
                        <td key={col} className="text-center px-2 py-2">
                          <span className={`font-mono font-bold text-sm ${colConds[ci] ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                            {colConds[ci] ? "Т" : "Ф"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr><td colSpan={numCols + 1} className="px-3 py-1.5 bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider font-medium">Действия</td></tr>
                  {actions.map((action, ai) => (
                    <tr key={action.id}>
                      <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-card z-10">
                        <span className="text-muted-foreground font-mono mr-2">A{ai + 1}</span>{action.name || "Действие " + (ai + 1)}
                      </td>
                      {colValues.map((_, col) => {
                        const checked = (actionMatrix[action.id] ?? [])[col] ?? false;
                        return (
                          <td key={col} className="text-center px-2 py-2">
                            <button
                              onClick={() => toggleAction(action.id, col)}
                              className={`w-6 h-6 rounded transition-all flex items-center justify-center mx-auto ${checked ? "bg-primary text-primary-foreground" : "bg-muted text-transparent hover:bg-muted/70"}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Кликайте на клетки действий, чтобы отметить, что должно происходить при каждой комбинации условий.</p>
        </div>
      )}
    </div>
  );
}

// ── State Transition Tab ──────────────────────────────
function StateTransitionTab() {
  const [states, setStates] = useState<STState[]>([
    { id: uid(), name: "Корзина пуста", isInitial: true, isFinal: false },
    { id: uid(), name: "Товары в корзине", isInitial: false, isFinal: false },
    { id: uid(), name: "Оформление заказа", isInitial: false, isFinal: false },
    { id: uid(), name: "Заказ оформлен", isInitial: false, isFinal: true },
  ]);
  const [transitions, setTransitions] = useState<STTransition[]>([]);
  const [result, setResult] = useState<STTestCase[] | null>(null);
  const [newFrom, setNewFrom] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newAction, setNewAction] = useState("");

  const addState = () => setStates(s => [...s, { id: uid(), name: "", isInitial: false, isFinal: false }]);
  const removeState = (id: string) => { setStates(s => s.filter(x => x.id !== id)); setTransitions(t => t.filter(x => x.fromId !== id && x.toId !== id)); };
  const updateState = (id: string, changes: Partial<STState>) => setStates(s => s.map(x => x.id === id ? { ...x, ...changes } : x));

  const addTransition = () => {
    if (!newFrom || !newEvent.trim() || !newTo) return;
    setTransitions(t => [...t, { id: uid(), fromId: newFrom, event: newEvent.trim(), toId: newTo, expectedAction: newAction.trim() }]);
    setNewEvent(""); setNewAction("");
  };
  const removeTransition = (id: string) => setTransitions(t => t.filter(x => x.id !== id));

  const generate = () => setResult(generateSTTests(states, transitions));

  const namedStates = states.filter(s => s.name.trim());

  const diagram = namedStates.map(state => {
    const outs = transitions.filter(t => t.fromId === state.id);
    if (!outs.length) return "[" + state.name + "]";
    return outs.map(t => {
      const to = states.find(s => s.id === t.toId);
      return "[" + state.name + "] --" + t.event + "--> [" + (to?.name ?? "?") + "]";
    }).join("\n");
  }).join("\n");

  const csvText = result
    ? ["#,Переход,Предусловие,Событие,Ожидаемый результат",
        ...result.map(tc => tc.no + ',"' + tc.title + '","' + tc.precondition + '","' + tc.trigger + '","' + tc.expected + '"')
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">🔄 Переходы состояний (State Transition Testing)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Моделирует систему как <span className="text-foreground font-medium">конечный автомат</span> — набор состояний и переходов по событиям.
          Каждый переход превращается в тест-кейс. Минимальное покрытие: <span className="text-foreground font-medium">все переходы (0-switch)</span>.
          Полное: все пары переходов (1-switch).
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Начальное</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Финальное</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" /> Промежуточное</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* States panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Состояния</span>
            <button onClick={addState} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-border">
            {states.map((state, i) => (
              <div key={state.id} className="px-4 py-2.5 flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${state.isInitial ? "bg-sky-500" : state.isFinal ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                <input
                  value={state.name}
                  onChange={e => updateState(state.id, { name: e.target.value })}
                  placeholder={"Состояние " + (i + 1)}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0">
                  <input type="radio" name="st-initial" checked={state.isInitial} onChange={() => setStates(s => s.map(x => ({ ...x, isInitial: x.id === state.id })))} className="accent-sky-500" />
                  Нач.
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0">
                  <input type="checkbox" checked={state.isFinal} onChange={e => updateState(state.id, { isFinal: e.target.checked })} className="rounded accent-emerald-500" />
                  Фин.
                </label>
                <button onClick={() => removeState(state.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Transitions panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <span className="text-sm font-medium text-foreground">Переходы ({transitions.length})</span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {transitions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-muted-foreground text-center">Добавьте переходы ниже</div>
            ) : (
              transitions.map(t => {
                const from = states.find(s => s.id === t.fromId);
                const to = states.find(s => s.id === t.toId);
                return (
                  <div key={t.id} className="px-4 py-2 flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground truncate">{from?.name ?? "?"}</span>
                    <span className="text-muted-foreground shrink-0">→</span>
                    <span className="text-primary font-medium truncate">{t.event}</span>
                    <span className="text-muted-foreground shrink-0">→</span>
                    <span className="font-medium text-foreground truncate">{to?.name ?? "?"}</span>
                    <button onClick={() => removeTransition(t.id)} className="ml-auto shrink-0 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-3 py-3 border-t border-border bg-muted/20 space-y-2">
            <div className="flex gap-2">
              <select value={newFrom} onChange={e => setNewFrom(e.target.value)} className="flex-1 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                <option value="">Из...</option>
                {namedStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={newTo} onChange={e => setNewTo(e.target.value)} className="flex-1 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                <option value="">В...</option>
                {namedStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input value={newEvent} onChange={e => setNewEvent(e.target.value)} placeholder="Событие (напр., «Добавить товар»)" onKeyDown={e => e.key === "Enter" && addTransition()} className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input value={newAction} onChange={e => setNewAction(e.target.value)} placeholder="Доп. действие (опц.)" onKeyDown={e => e.key === "Enter" && addTransition()} className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <button onClick={addTransition} disabled={!newFrom || !newEvent.trim() || !newTo} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Plus className="w-3.5 h-3.5" /> Добавить переход
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={transitions.length === 0}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Сгенерировать тест-кейсы ({transitions.length} переходов)
      </button>

      {result && result.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Тест-кейсы</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">{result.length} тестов</span>
            </div>
            <CopyButton text={csvText} label="CSV" />
          </div>
          {diagram && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Диаграмма переходов</p>
              <pre className="text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap">{diagram}</pre>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Переход</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Предусловие</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Событие</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ожидаемый результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.map(tc => (
                    <tr key={tc.no} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground font-mono">{tc.no}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{tc.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{tc.precondition}</td>
                      <td className="px-3 py-2 font-medium text-primary">{tc.trigger}</td>
                      <td className="px-3 py-2 text-muted-foreground">{tc.expected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 2: TEST DESIGN
// ══════════════════════════════════════════════════════


export function TestDesignModule() {
  const tabs = [
    { id: "pairwise", label: "Pairwise", component: <PairwiseTab /> },
    { id: "equivalence", label: "Эквивалентные классы", component: <EPTab /> },
    { id: "boundary", label: "Граничные значения", component: <BVATab /> },
    { id: "decision", label: "Таблица решений", component: <DecisionTableTab /> },
    { id: "state", label: "Переходы состояний", component: <StateTransitionTab /> },
  ];
  const [active, setActive] = useState(tabs[0]?.id ?? "pairwise");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🧪 Тест-дизайн</h2>
        <p className="text-sm text-muted-foreground">Генераторы техник тест-дизайна: Pairwise, классы эквивалентности, граничные значения, таблица решений и переходы состояний.</p>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-max">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActive(tab.id)} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (active === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {current?.component}
    </div>
  );
}
