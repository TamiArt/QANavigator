import * as React from "react";
import { useState, useRef } from "react";
import { CheckSquare, Bug, Zap, BarChart2, Check, Download, AlertTriangle, X, Plus, RefreshCw, FileText, Brain, CheckCircle, AlertCircle, Play, Upload, GraduationCap, Clipboard, Layers } from "lucide-react";
import { useApp } from "../../core/app-context";
import { CopyButton, Badge, EmptyState } from "../../components/shared";
import { PRESETS } from "../../core/constants";
import { callAI, QA_SYSTEM_PROMPT, uid } from "../../core/ai";
import type { ChecklistItem, TestCase, Module, Severity } from "../../domain/types";
import { DOCUMENT_TABS } from "./documentation-model";
import { HANDBOOK } from "../../handbook-data";
import { downloadTextFile } from "../../lib/download";
import { DocField, DocSelect, ExportCard, FieldLabel } from "./documentation-fields";

// ─── Checklist (AI + Manual) ──────────────────────────
interface ChecklistDocItem { id: string; text: string; category: "positive" | "negative" | "boundary" | "nonfunctional"; priority: "P1" | "P2" | "P3" }

function ChecklistDocSection() {
  const { apiKeys, checklists, setChecklists, testCases, setTestCases, selectedTechnique, setSelectedTechnique, setActiveModule } = useApp();
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // ── AI mode state ────────────────────────────────────
  const [preset, setPreset] = useState<string | null>(null);
  const [featureDesc, setFeatureDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  const techniqueInstructions: Record<string, string> = {
    "td1": "Используй технику Equivalence Partitioning: выдели валидные и невалидные классы для каждого поля.",
    "td2": "Используй технику Boundary Value Analysis: проверь Min-1, Min, Min+1, Max-1, Max, Max+1 для каждого поля с диапазоном.",
    "td3": "Используй технику Decision Tables: для каждой комбинации условий (true/false) определи ожидаемый результат.",
    "td4": "Используй технику State Transition: определи все состояния системы и переходы между ними.",
    "td5": "Используй технику Error Guessing: основывайся на типичных ошибках — пустые поля, спецсимволы, граничные случаи.",
  };

  const generateChecklist = async () => {
    if (!featureDesc.trim()) return;
    setLoading(true); setAiError("");
    try {
      const techniqueExtra = selectedTechnique ? techniqueInstructions[selectedTechnique] ?? "" : "";
      const result = await callAI(apiKeys, QA_SYSTEM_PROMPT,
        "Сгенерируй структурированный чек-лист тестирования на русском языке для функциональности:\n\n\"" + featureDesc + "\"\n" +
        (techniqueExtra ? "\nПрименяемая техника тест-дизайна:\n" + techniqueExtra : "") +
        "\n\nВерни ТОЛЬКО JSON (без markdown-обёртки):\n{\"items\":[{\"text\":\"текст\",\"category\":\"positive\"},{\"text\":\"текст\",\"category\":\"negative\"},{\"text\":\"текст\",\"category\":\"boundary\"},{\"text\":\"текст\",\"category\":\"nonfunctional\"}]}\n\nКатегории: positive, negative, boundary, nonfunctional. Минимум 4 проверки каждой. Итого ≥16 пунктов."
      );
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed: { items: Array<{ text: string; category: string }> } = JSON.parse(cleaned);
      setChecklists(parsed.items.map(item => ({ id: uid(), text: item.text, category: item.category as ChecklistItem["category"], status: "pending" })));
    } catch (e: any) {
      setAiError(e.message || "AI вернул неверный формат. Попробуйте ещё раз.");
    }
    setLoading(false);
  };

  const expandToTestCase = async (item: ChecklistItem) => {
    setExpandingId(item.id);
    setAiError("");
    try {
      const result = await callAI(apiKeys, QA_SYSTEM_PROMPT,
        "Разверни проверку из чек-листа в детальный тест-кейс по ISO/IEC/IEEE 29119:\n\nПроверка: \"" + item.text + "\"\nКонтекст: " + (featureDesc || "общая функциональность") +
        "\n\nВерни ТОЛЬКО JSON:\n{\"title\":\"название\",\"preconditions\":\"предусловия\",\"steps\":[\"шаг 1\",\"шаг 2\"],\"expected\":\"ожидаемый результат\",\"priority\":\"P1\"}"
      );
      const tc = JSON.parse(result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      const testCase: TestCase = { id: uid(), title: tc.title, preconditions: tc.preconditions, steps: tc.steps, expected: tc.expected, priority: tc.priority as "P1" | "P2" | "P3", status: "pending", source: item.text };
      setChecklists(checklists.map(c => c.id === item.id ? { ...c, testCase } : c));
      setTestCases([...testCases.filter(t => t.id !== testCase.id), testCase]);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Не удалось развернуть проверку в тест-кейс");
    }
    setExpandingId(null);
  };

  const catLabel: Record<string, string> = { positive: "Позитивные", negative: "Негативные", boundary: "Граничные значения", nonfunctional: "Нефункциональные" };
  const catOrder = ["positive", "negative", "boundary", "nonfunctional"];
  const grouped = catOrder.reduce((acc, cat) => { acc[cat] = checklists.filter(c => c.category === cat); return acc; }, {} as Record<string, ChecklistItem[]>);

  const aiMarkdown = checklists.length > 0
    ? ["# Чек-лист: " + (featureDesc.split("\n")[0] || "(без названия)"), "", ...catOrder.flatMap(cat => { const its = grouped[cat]; if (!its?.length) return []; return ["## " + catLabel[cat], "", ...its.map((c, i) => (i + 1) + ". " + c.text), ""]; })].join("\n")
    : "";

  // ── Manual mode state ────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [manTitle, setManTitle] = useState("");
  const [manFeature, setManFeature] = useState("");
  const [manEnv, setManEnv] = useState("");
  const [manTester, setManTester] = useState("");
  const [manDate, setManDate] = useState(today);
  const [manItems, setManItems] = useState<ChecklistDocItem[]>([
    { id: uid(), text: "", category: "positive", priority: "P2" },
    { id: uid(), text: "", category: "negative", priority: "P1" },
  ]);

  const manCatLabel: Record<string, string> = { positive: "Позитивный", negative: "Негативный", boundary: "Граничный", nonfunctional: "Нефункциональный" };
  const addManItem = () => setManItems(i => [...i, { id: uid(), text: "", category: "positive", priority: "P2" }]);
  const removeManItem = (id: string) => setManItems(i => i.filter(x => x.id !== id));
  const updMan = (id: string, ch: Partial<ChecklistDocItem>) => setManItems(i => i.map(x => x.id === id ? { ...x, ...ch } : x));

  const manGrouped = ["positive", "negative", "boundary", "nonfunctional"].map(cat => ({
    cat, label: manCatLabel[cat], items: manItems.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);

  const manMarkdown = [
    "# Чек-лист тестирования: " + (manTitle || "(без названия)"),
    "",
    "| Поле | Значение |",
    "|------|----------|",
    "| Функциональность | " + (manFeature || "—") + " |",
    "| Окружение | " + (manEnv || "—") + " |",
    "| Тестировщик | " + (manTester || "—") + " |",
    "| Дата | " + manDate + " |",
    "",
    ...manGrouped.flatMap(g => ["## " + g.label, "", "| # | Проверка | Приоритет | Статус |", "|---|----------|-----------|--------|", ...g.items.map((item, i) => "| " + (i + 1) + " | " + (item.text || "—") + " | " + item.priority + " | ☐ |"), ""]),
  ].join("\n");

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-max">
        <button onClick={() => setMode("ai")} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (mode === "ai" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Brain className="w-3.5 h-3.5" /> AI Генератор
        </button>
        <button onClick={() => setMode("manual")} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <FileText className="w-3.5 h-3.5" /> Ручной шаблон
        </button>
      </div>

      {/* ── AI mode ── */}
      {mode === "ai" && (
        <>
          {selectedTechnique && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
              <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">Активная техника: </span>
                <span className="text-sm text-primary font-mono">{HANDBOOK.find(h => h.id === selectedTechnique)?.title}</span>
              </div>
              <button onClick={() => setSelectedTechnique(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Быстрый старт — шаблоны</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => { setPreset(p.id); if (p.id !== "custom") setFeatureDesc(p.name + ": " + p.hint); else setFeatureDesc(""); }} className={"flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all " + (preset === p.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40")}>
                  <span className="text-xl">{p.icon}</span>
                  <span className="font-medium text-center leading-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-2 space-y-3">
              <textarea value={featureDesc} onChange={e => setFeatureDesc(e.target.value)} placeholder={"Опишите функциональность для тестирования...\n\nПример: Форма авторизации с полями Email и Пароль. Email обязателен, пароль минимум 8 символов. После 5 неверных попыток аккаунт блокируется на 30 минут."} className="w-full h-36 bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none" />
              <button onClick={generateChecklist} disabled={loading || !featureDesc.trim()} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><Zap className="w-4 h-4" /> Сгенерировать чек-лист</>}
              </button>
              {aiError && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {aiError}
                </div>
              )}
              {checklists.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <CopyButton text={checklists.map(c => "[" + catLabel[c.category] + "] " + c.text).join("\n")} label="Скопировать" />
                  {aiMarkdown && (
                    <button onClick={() => downloadTextFile(aiMarkdown, "checklist.md", "text/markdown;charset=utf-8")} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors">
                      <Download className="w-3.5 h-3.5" /> .md
                    </button>
                  )}
                  <button onClick={() => setActiveModule("test-execution")} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:opacity-80 transition-opacity">
                    <Play className="w-3.5 h-3.5" /> Запустить выполнение
                  </button>
                </div>
              )}
            </div>

            <div className="xl:col-span-3 space-y-3">
              {checklists.length === 0 ? (
                <div className="bg-card border border-border rounded-xl h-64 flex items-center justify-center">
                  <EmptyState icon={<CheckSquare />} title="Чек-лист появится здесь" desc="Заполните описание и нажмите Сгенерировать" />
                </div>
              ) : (
                catOrder.map(cat => grouped[cat]?.length > 0 && (
                  <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border bg-muted/50 flex items-center gap-2">
                      <Badge variant={cat as any}>{catLabel[cat]}</Badge>
                      <span className="text-xs text-muted-foreground">{grouped[cat].length} проверок</span>
                    </div>
                    <div className="divide-y divide-border">
                      {grouped[cat].map(item => (
                        <div key={item.id} className="px-4 py-3 group">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 text-sm text-foreground leading-relaxed">{item.text}</div>
                            <button onClick={() => expandToTestCase(item)} disabled={expandingId === item.id} className="shrink-0 text-xs px-2.5 py-1.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border text-muted-foreground transition-all opacity-0 group-hover:opacity-100">
                              {expandingId === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "→ Тест-кейс"}
                            </button>
                          </div>
                          {item.testCase && (
                            <div className="mt-2.5 bg-muted/60 rounded-lg p-3 text-xs space-y-1.5 border border-border">
                              <p className="font-medium text-foreground">{item.testCase.title}</p>
                              <p className="text-muted-foreground"><span className="font-medium">Предусловие:</span> {item.testCase.preconditions}</p>
                              <div className="text-muted-foreground"><span className="font-medium">Шаги:</span>
                                <ol className="ml-3 mt-0.5 space-y-0.5 list-decimal">{item.testCase.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                              </div>
                              <p className="text-muted-foreground"><span className="font-medium">Ожидаемый результат:</span> {item.testCase.expected}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <Badge variant="default">{item.testCase.priority}</Badge>
                                <CopyButton text={"ID: " + item.testCase.id + "\nTitle: " + item.testCase.title + "\nПредусловие: " + item.testCase.preconditions + "\nШаги:\n" + item.testCase.steps.map((s, i) => (i + 1) + ". " + s).join("\n") + "\nОжидаемый результат: " + item.testCase.expected + "\nПриоритет: " + item.testCase.priority} label="Jira" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Manual mode ── */}
      {mode === "manual" && (
        <>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>Поля, помеченные <span className="text-destructive font-medium">*</span>, обязательны по IEEE 829 / ISO/IEC/IEEE 29119.</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card border border-border rounded-xl p-4">
            <DocField label="Название чек-листа" required value={manTitle} onChange={setManTitle} placeholder="ЧЛ-01: Форма авторизации" />
            <DocField label="Тестируемая функциональность" required value={manFeature} onChange={setManFeature} placeholder="Авторизация пользователя" />
            <DocField label="Тестовое окружение" required value={manEnv} onChange={setManEnv} placeholder="Chrome 124, Windows 11, Staging" />
            <DocField label="Тестировщик" required value={manTester} onChange={setManTester} placeholder="Иванов Иван" />
            <div>
              <FieldLabel label="Дата составления" required />
              <input type="date" value={manDate} onChange={e => setManDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Проверки <span className="text-destructive">*</span></span>
              <button onClick={addManItem} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>
            <div className="divide-y divide-border">
              {manItems.map((item, i) => (
                <div key={item.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 shrink-0 font-mono">{i + 1}</span>
                  <input value={item.text} onChange={e => updMan(item.id, { text: e.target.value })} placeholder="Описание проверки..." className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                  <select value={item.category} onChange={e => updMan(item.id, { category: e.target.value as ChecklistDocItem["category"] })} className="bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                    {Object.entries(manCatLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={item.priority} onChange={e => updMan(item.id, { priority: e.target.value as "P1" | "P2" | "P3" })} className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                    <option>P1</option><option>P2</option><option>P3</option>
                  </select>
                  <button onClick={() => removeManItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <ExportCard text={manMarkdown} filename="checklist.md" />
        </>
      )}
    </div>
  );
}

// ─── Test Case Template ───────────────────────────────
function TestCaseDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [tcId, setTcId] = useState("TC-001");
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [preconditions, setPreconditions] = useState("");
  const [steps, setSteps] = useState("1. \n2. \n3. ");
  const [expected, setExpected] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [priority, setPriority] = useState("P2");
  const [severity, setSeverity] = useState("medium");
  const [status, setStatus] = useState("Draft");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(today);
  const [testData, setTestData] = useState("");

  const markdown = [
    "# Тест-кейс " + tcId,
    "",
    "**Название:** " + (title || "—"),
    "**Модуль/Функция:** " + (module || "—"),
    "**Приоритет:** " + priority + " | **Серьёзность:** " + severity,
    "**Статус:** " + status + " | **Автор:** " + (author || "—") + " | **Дата:** " + date,
    "",
    "## Предусловия *",
    preconditions || "—",
    "",
    "## Тестовые данные",
    testData || "—",
    "",
    "## Шаги воспроизведения *",
    steps || "—",
    "",
    "## Ожидаемый результат *",
    expected || "—",
    "",
    "## Фактический результат",
    actualResult || "Заполняется при выполнении",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Идентификация</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DocField label="ID тест-кейса" required value={tcId} onChange={setTcId} placeholder="TC-001" />
          <DocField label="Название тест-кейса" required value={title} onChange={setTitle} placeholder="Успешная авторизация с валидными данными" />
          <DocField label="Модуль / Функциональность" value={module} onChange={setModule} placeholder="Авторизация" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DocSelect label="Приоритет" required value={priority} onChange={setPriority} options={[{value:"P1",label:"P1 (Высокий)"},{value:"P2",label:"P2 (Средний)"},{value:"P3",label:"P3 (Низкий)"}]} />
          <DocSelect label="Серьёзность" required value={severity} onChange={setSeverity} options={[{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Medium"},{value:"low",label:"Low"}]} />
          <DocSelect label="Статус" value={status} onChange={setStatus} options={[{value:"Draft",label:"Draft"},{value:"Ready",label:"Ready"},{value:"Approved",label:"Approved"},{value:"Obsolete",label:"Obsolete"}]} />
          <div>
            <FieldLabel label="Дата создания" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <DocField label="Автор" required value={author} onChange={setAuthor} placeholder="Иванов Иван" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Содержание</h3>
        <DocField label="Предусловия (Preconditions)" required multiline rows={2} value={preconditions} onChange={setPreconditions} placeholder={"Пользователь не авторизован\nОткрыта страница /login\nВ БД есть активный пользователь test@example.com / password123"} />
        <DocField label="Тестовые данные (Test Data)" multiline rows={2} value={testData} onChange={setTestData} placeholder={"Email: test@example.com\nПароль: password123"} />
        <DocField label="Шаги воспроизведения (Test Steps)" required multiline rows={5} value={steps} onChange={setSteps} placeholder={"1. Открыть браузер и перейти на /login\n2. Ввести email test@example.com\n3. Ввести пароль password123\n4. Нажать кнопку «Войти»"} />
        <DocField label="Ожидаемый результат (Expected Result)" required multiline rows={3} value={expected} onChange={setExpected} placeholder={"Пользователь успешно авторизован\nПроизведён редирект на /dashboard\nОтображается имя пользователя в шапке"} />
        <DocField label="Фактический результат (Actual Result)" multiline rows={2} value={actualResult} onChange={setActualResult} placeholder="Заполняется при выполнении теста" />
      </div>

      <ExportCard text={markdown} filename={"testcase-" + tcId + ".md"} />
    </div>
  );
}

// ─── Test Plan Template ───────────────────────────────
function TestPlanDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [project, setProject] = useState("");
  const [version, setVersion] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(today);
  const [scope, setScope] = useState("");
  const [outOfScope, setOutOfScope] = useState("");
  const [testingTypes, setTestingTypes] = useState("Функциональное, Регрессионное, Smoke");
  const [team, setTeam] = useState("");
  const [environment, setEnvironment] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [entryCriteria, setEntryCriteria] = useState("");
  const [exitCriteria, setExitCriteria] = useState("");
  const [risks, setRisks] = useState("");
  const [approver, setApprover] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedContent(ev.target?.result as string);
      setUploadedName(file.name);
    };
    reader.readAsText(file);
  };

  const markdown = [
    "# Тест-план: " + (project || "(без названия)"),
    "**Версия продукта:** " + (version || "—") + " | **Автор:** " + (author || "—") + " | **Дата:** " + date,
    "**Утверждающий:** " + (approver || "—"),
    "",
    "---",
    "",
    "## 1. Цель и область тестирования *",
    "**Входит в область (In Scope):**",
    scope || "—",
    "",
    "**Не входит (Out of Scope):**",
    outOfScope || "—",
    "",
    "## 2. Виды тестирования *",
    testingTypes || "—",
    "",
    "## 3. Команда *",
    team || "—",
    "",
    "## 4. Тестовое окружение *",
    environment || "—",
    "",
    "## 5. Сроки *",
    "Начало: " + startDate + " | Окончание: " + (endDate || "—"),
    "",
    "## 6. Критерии входа *",
    entryCriteria || "—",
    "",
    "## 7. Критерии выхода *",
    exitCriteria || "—",
    "",
    "## 8. Риски",
    risks || "—",
  ].join("\n");

  return (
    <div className="space-y-5">
      {/* Upload banner */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Загрузить готовый тест-план</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Поддерживаются файлы .txt и .md</p>
          </div>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm font-medium">
            <Upload className="w-4 h-4" /> Загрузить файл
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown" className="hidden" onChange={handleUpload} />
        </div>
        {uploadedContent !== null && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" /> Загружен: <span className="font-medium">{uploadedName}</span>
              <button onClick={() => { setUploadedContent(null); setUploadedName(""); }} className="ml-auto text-muted-foreground hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto text-foreground">{uploadedContent}</pre>
            <div className="flex gap-2">
              <CopyButton text={uploadedContent} label="Скопировать" />
              <button
                onClick={() => {
                  downloadTextFile(uploadedContent, uploadedName);
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Скачать
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background text-xs text-muted-foreground px-3">или создайте новый</span></div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Заголовок</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocField label="Проект / Продукт" required value={project} onChange={setProject} placeholder="QA Navigator v2.0" />
          <DocField label="Версия / Релиз" required value={version} onChange={setVersion} placeholder="v2.0.0-release" />
          <DocField label="Автор тест-плана" required value={author} onChange={setAuthor} placeholder="Иванов Иван" />
          <DocField label="Утверждающий (Approver)" required value={approver} onChange={setApprover} placeholder="Руководитель QA" />
          <div>
            <FieldLabel label="Дата создания" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Содержание плана</h3>
        <DocField label="Область тестирования (In Scope)" required multiline rows={3} value={scope} onChange={setScope} placeholder={"- Модуль авторизации\n- Форма регистрации\n- Восстановление пароля"} />
        <DocField label="Вне области (Out of Scope)" multiline rows={2} value={outOfScope} onChange={setOutOfScope} placeholder={"- Мобильное приложение\n- Нагрузочное тестирование"} />
        <DocField label="Виды тестирования" required value={testingTypes} onChange={setTestingTypes} placeholder="Функциональное, Регрессионное, Smoke, Sanity" />
        <DocField label="Команда тестирования" required multiline rows={2} value={team} onChange={setTeam} placeholder={"QA Lead: Иванов И. — координация\nQA Engineer: Петров П. — ручное тестирование"} />
        <DocField label="Тестовое окружение" required multiline rows={2} value={environment} onChange={setEnvironment} placeholder={"Staging: https://staging.example.com\nБраузеры: Chrome 124, Firefox 125, Safari 17\nОС: Windows 11, macOS 14"} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Дата начала" required />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <FieldLabel label="Дата окончания" required />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <DocField label="Критерии входа (Entry Criteria)" required multiline rows={3} value={entryCriteria} onChange={setEntryCriteria} placeholder={"- Готова сборка для тестирования\n- Smoke-тесты пройдены\n- Тестовая среда развёрнута и доступна\n- Тест-кейсы согласованы"} />
        <DocField label="Критерии выхода (Exit Criteria)" required multiline rows={3} value={exitCriteria} onChange={setExitCriteria} placeholder={"- 100% тест-кейсов выполнено\n- Нет открытых критических/высоких багов\n- Регрессия пройдена\n- Отчёт о тестировании согласован"} />
        <DocField label="Риски и митигация" multiline rows={3} value={risks} onChange={setRisks} placeholder={"- Риск: нестабильная тестовая среда → Митигация: резервная среда\n- Риск: нехватка времени → Митигация: расстановка приоритетов"} />
      </div>

      <ExportCard text={markdown} filename="test-plan.md" />
    </div>
  );
}

// ─── Bug Report Template ──────────────────────────────
function BugReportDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [bugId, setBugId] = useState("BUG-001");
  const [titleWhere, setTitleWhere] = useState("");
  const [titleWhat, setTitleWhat] = useState("");
  const [titleCondition, setTitleCondition] = useState("");
  const [environment, setEnvironment] = useState("");
  const [severity, setSeverity] = useState("high");
  const [priority, setPriority] = useState("P2");
  const [steps, setSteps] = useState("1. \n2. \n3. ");
  const [actual, setActual] = useState("");
  const [expected, setExpected] = useState("");
  const [reporter, setReporter] = useState("");
  const [assignee, setAssignee] = useState("");
  const [date, setDate] = useState(today);
  const [attachments, setAttachments] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const composedTitle = [titleWhere, titleWhat, titleCondition].filter(Boolean).join(" — ");

  const markdown = [
    "# Баг-репорт " + bugId,
    "",
    "**Заголовок:** " + (composedTitle || "—"),
    "**Серьёзность:** " + severity + " | **Приоритет:** " + priority,
    "**Окружение:** " + (environment || "—"),
    "**Репортер:** " + (reporter || "—") + " | **Назначен:** " + (assignee || "—") + " | **Дата:** " + date,
    "",
    "## Шаги воспроизведения *",
    steps || "—",
    "",
    "## Фактический результат *",
    actual || "—",
    "",
    "## Ожидаемый результат *",
    expected || "—",
    "",
    "## Вложения",
    attachments || "—",
    "",
    "## Дополнительная информация",
    additionalInfo || "—",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Идентификация</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DocField label="ID баг-репорта" required value={bugId} onChange={setBugId} placeholder="BUG-001" />
          <DocSelect label="Серьёзность (Severity)" required value={severity} onChange={setSeverity} options={[{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Medium"},{value:"low",label:"Low"}]} />
          <DocSelect label="Приоритет" required value={priority} onChange={setPriority} options={[{value:"P1",label:"P1 (Высокий)"},{value:"P2",label:"P2 (Средний)"},{value:"P3",label:"P3 (Низкий)"}]} />
          <div>
            <FieldLabel label="Дата обнаружения" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocField label="Репортер (Reporter)" required value={reporter} onChange={setReporter} placeholder="Иванов Иван" />
          <DocField label="Назначен (Assignee)" value={assignee} onChange={setAssignee} placeholder="Разработчик" />
          <DocField label="Окружение" required value={environment} onChange={setEnvironment} placeholder="Chrome 124, Windows 11, Staging v2.0" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Заголовок баг-репорта <span className="text-destructive">*</span></h3>
          <p className="text-xs text-muted-foreground mb-3">Формула: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">[Где] — [Что произошло] — [При каком условии]</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DocField label="[Где] — место / компонент" required value={titleWhere} onChange={setTitleWhere} placeholder="Страница /login, поле «Пароль»" />
            <DocField label="[Что] — суть проблемы" required value={titleWhat} onChange={setTitleWhat} placeholder="Принимает менее 8 символов" />
            <DocField label="[Условие] — при каком условии" required value={titleCondition} onChange={setTitleCondition} placeholder="при вводе 3-символьного пароля" />
          </div>
          {composedTitle && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-foreground border border-border">
              <span className="text-xs text-muted-foreground block mb-1">Итоговый заголовок:</span>
              {composedTitle}
            </div>
          )}
        </div>
        <DocField label="Шаги воспроизведения (Steps to Reproduce)" required multiline rows={4} value={steps} onChange={setSteps} placeholder={"1. Открыть страницу /login\n2. Ввести email: test@example.com\n3. Ввести пароль: abc (3 символа)\n4. Нажать «Войти»"} />
        <DocField label="Фактический результат (Actual Result)" required multiline rows={2} value={actual} onChange={setActual} placeholder="Пользователь авторизован успешно. Пароль из 3 символов принят без ошибки." />
        <DocField label="Ожидаемый результат (Expected Result)" required multiline rows={2} value={expected} onChange={setExpected} placeholder="Отображается сообщение «Пароль должен содержать минимум 8 символов»." />
        <DocField label="Вложения (ссылки на скриншоты, видео)" value={attachments} onChange={setAttachments} placeholder="screenshot_001.png, video_reproduction.mp4" />
        <DocField label="Дополнительная информация" multiline rows={2} value={additionalInfo} onChange={setAdditionalInfo} placeholder="Воспроизводится в 100% случаев. Аналогичная проблема в поле «Подтверждение пароля»." />
      </div>

      <ExportCard text={markdown} filename={"bugreport-" + bugId + ".md"} />
    </div>
  );
}

// ─── Test Report Template ─────────────────────────────
function TestReportDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [project, setProject] = useState("");
  const [version, setVersion] = useState("");
  const [period, setPeriod] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(today);
  const [totalTests, setTotalTests] = useState("");
  const [passed, setPassed] = useState("");
  const [failed, setFailed] = useState("");
  const [blocked, setBlocked] = useState("");
  const [skipped, setSkipped] = useState("");
  const [summary, setSummary] = useState("");
  const [defectsFound, setDefectsFound] = useState("");
  const [defectsClosed, setDefectsClosed] = useState("");
  const [knownIssues, setKnownIssues] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendation, setRecommendation] = useState("Продукт готов к релизу");
  const [approver, setApprover] = useState("");

  const passRate = totalTests && passed ? Math.round(parseInt(passed) / parseInt(totalTests) * 100) : 0;

  const markdown = [
    "# Отчёт о тестировании: " + (project || "(без названия)"),
    "**Версия:** " + (version || "—") + " | **Период:** " + (period || "—"),
    "**Автор:** " + (author || "—") + " | **Дата:** " + date + " | **Утверждающий:** " + (approver || "—"),
    "",
    "---",
    "",
    "## Сводная статистика",
    "",
    "| Метрика | Значение |",
    "|---------|----------|",
    "| Всего тест-кейсов | " + (totalTests || "—") + " |",
    "| Пройдено (Passed) | " + (passed || "—") + " |",
    "| Провалено (Failed) | " + (failed || "—") + " |",
    "| Заблокировано (Blocked) | " + (blocked || "—") + " |",
    "| Пропущено (Skipped) | " + (skipped || "—") + " |",
    "| % пройденных | " + (passRate ? passRate + "%" : "—") + " |",
    "| Найдено дефектов | " + (defectsFound || "—") + " |",
    "| Закрыто дефектов | " + (defectsClosed || "—") + " |",
    "",
    "## Краткое резюме *",
    summary || "—",
    "",
    "## Известные дефекты / Открытые баги",
    knownIssues || "—",
    "",
    "## Выводы *",
    conclusion || "—",
    "",
    "## Рекомендация",
    recommendation || "—",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Заголовок отчёта</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocField label="Проект / Продукт" required value={project} onChange={setProject} placeholder="QA Navigator" />
          <DocField label="Версия / Сборка" required value={version} onChange={setVersion} placeholder="v2.0.0-rc1" />
          <DocField label="Период тестирования" required value={period} onChange={setPeriod} placeholder="01.08.2026 – 08.08.2026" />
          <DocField label="Автор отчёта" required value={author} onChange={setAuthor} placeholder="Иванов Иван" />
          <DocField label="Утверждающий" required value={approver} onChange={setApprover} placeholder="Руководитель QA" />
          <div>
            <FieldLabel label="Дата отчёта" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Статистика тестирования <span className="text-destructive">*</span></h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DocField label="Всего тест-кейсов" required type="number" value={totalTests} onChange={setTotalTests} placeholder="120" />
          <DocField label="Passed (Пройдено)" required type="number" value={passed} onChange={setPassed} placeholder="105" />
          <DocField label="Failed (Провалено)" required type="number" value={failed} onChange={setFailed} placeholder="8" />
          <DocField label="Blocked (Заблокировано)" type="number" value={blocked} onChange={setBlocked} placeholder="5" />
          <DocField label="Skipped (Пропущено)" type="number" value={skipped} onChange={setSkipped} placeholder="2" />
          <DocField label="Найдено дефектов" required type="number" value={defectsFound} onChange={setDefectsFound} placeholder="12" />
          <DocField label="Закрыто дефектов" type="number" value={defectsClosed} onChange={setDefectsClosed} placeholder="9" />
          <div className="flex items-end">
            {passRate > 0 && (
              <div className="w-full p-3 rounded-lg text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{passRate}%</div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Анализ и выводы</h3>
        <DocField label="Краткое резюме тестирования" required multiline rows={3} value={summary} onChange={setSummary} placeholder="Проведено функциональное и регрессионное тестирование модуля авторизации. Выявлено 12 дефектов, из которых 9 закрыто разработкой..." />
        <DocField label="Известные дефекты и открытые баги" multiline rows={3} value={knownIssues} onChange={setKnownIssues} placeholder={"BUG-045 (Medium): Некорректное сообщение при сбросе пароля\nBUG-047 (Low): Опечатка в тексте кнопки"} />
        <DocField label="Выводы (Conclusions)" required multiline rows={3} value={conclusion} onChange={setConclusion} placeholder="Качество продукта соответствует критериям выхода. Все критические и высокие дефекты устранены..." />
        <DocSelect label="Рекомендация" required value={recommendation} onChange={setRecommendation} options={[{value:"Продукт готов к релизу",label:"✅ Готов к релизу"},{value:"Требуются исправления перед релизом",label:"⚠️ Требуются исправления"},{value:"Релиз не рекомендован",label:"❌ Релиз не рекомендован"}]} />
      </div>

      <ExportCard text={markdown} filename={"test-report-" + (version || "v1") + ".md"} />
    </div>
  );
}

// ─── RTM (Requirement Traceability Matrix) ────────────
import { buildRTMCsv, calculateRTMCoverage } from "./rtm-model";

function RTMSection() {
  const [requirements, setRequirements] = useState<RTMRequirement[]>([
    { id: uid(), reqId: "REQ-001", title: "Пользователь может авторизоваться по email и паролю", priority: "high" },
    { id: uid(), reqId: "REQ-002", title: "После 5 неверных попыток аккаунт блокируется на 30 мин", priority: "high" },
    { id: uid(), reqId: "REQ-003", title: "Пользователь может сбросить пароль по email", priority: "medium" },
  ]);
  const [testCaseRows, setTestCaseRows] = useState<RTMTestCase[]>([
    { id: uid(), tcId: "TC-001", title: "Успешная авторизация с валидными данными" },
    { id: uid(), tcId: "TC-002", title: "Авторизация с неверным паролем" },
    { id: uid(), tcId: "TC-003", title: "Блокировка после 5 неверных попыток" },
    { id: uid(), tcId: "TC-004", title: "Сброс пароля — отправка email" },
  ]);
  const [links, setLinks] = useState<Set<string>>(new Set(["REQ-001:TC-001","REQ-001:TC-002","REQ-002:TC-003","REQ-003:TC-004"]));
  const [newReqId, setNewReqId] = useState("");
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newTcId, setNewTcId] = useState("");
  const [newTcTitle, setNewTcTitle] = useState("");

  const toggleLink = (reqId: string, tcId: string) => {
    const key = reqId + ":" + tcId;
    setLinks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const addReq = () => {
    if (!newReqId.trim() || !newReqTitle.trim()) return;
    setRequirements(r => [...r, { id: uid(), reqId: newReqId.trim(), title: newReqTitle.trim(), priority: "medium" }]);
    setNewReqId(""); setNewReqTitle("");
  };

  const addTc = () => {
    if (!newTcId.trim() || !newTcTitle.trim()) return;
    setTestCaseRows(t => [...t, { id: uid(), tcId: newTcId.trim(), title: newTcTitle.trim() }]);
    setNewTcId(""); setNewTcTitle("");
  };

  const removeReq = (id: string) => setRequirements(r => r.filter(x => x.id !== id));
  const removeTc = (id: string) => setTestCaseRows(t => t.filter(x => x.id !== id));

  const coverage = calculateRTMCoverage(requirements, testCaseRows, links);

  const totalCovered = coverage.filter(c => c.covered > 0).length;
  const coveragePercent = requirements.length > 0 ? Math.round(totalCovered / requirements.length * 100) : 0;

  const prioColor = { high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", low: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };

  const csvText = buildRTMCsv(requirements, testCaseRows, links);

  return (
    <div className="space-y-5">
      {/* Coverage summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{requirements.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Требований</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{testCaseRows.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Тест-кейсов</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${coveragePercent === 100 ? "text-emerald-500" : coveragePercent > 50 ? "text-amber-500" : "text-rose-500"}`}>{coveragePercent}%</div>
          <div className="text-xs text-muted-foreground mt-1">Покрытие требований</div>
        </div>
      </div>

      {/* Add rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 text-sm font-medium text-foreground">Требования</div>
          <div className="divide-y divide-border max-h-56 overflow-y-auto">
            {requirements.map(req => (
              <div key={req.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs font-mono text-primary shrink-0">{req.reqId}</span>
                <span className="text-xs text-foreground flex-1 truncate">{req.title}</span>
                <select value={req.priority} onChange={e => setRequirements(r => r.map(x => x.id === req.id ? { ...x, priority: e.target.value as RTMRequirement["priority"] } : x))} className="bg-input-background border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none">
                  <option value="high">High</option><option value="medium">Med</option><option value="low">Low</option>
                </select>
                <button onClick={() => removeReq(req.id)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="px-3 py-2.5 border-t border-border flex gap-2">
            <input value={newReqId} onChange={e => setNewReqId(e.target.value)} placeholder="REQ-00X" className="w-24 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addReq()} />
            <input value={newReqTitle} onChange={e => setNewReqTitle(e.target.value)} placeholder="Описание требования..." className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addReq()} />
            <button onClick={addReq} disabled={!newReqId.trim() || !newReqTitle.trim()} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 text-sm font-medium text-foreground">Тест-кейсы</div>
          <div className="divide-y divide-border max-h-56 overflow-y-auto">
            {testCaseRows.map(tc => (
              <div key={tc.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 shrink-0">{tc.tcId}</span>
                <span className="text-xs text-foreground flex-1 truncate">{tc.title}</span>
                <button onClick={() => removeTc(tc.id)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="px-3 py-2.5 border-t border-border flex gap-2">
            <input value={newTcId} onChange={e => setNewTcId(e.target.value)} placeholder="TC-00X" className="w-20 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addTc()} />
            <input value={newTcTitle} onChange={e => setNewTcTitle(e.target.value)} placeholder="Название тест-кейса..." className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addTc()} />
            <button onClick={addTc} disabled={!newTcId.trim() || !newTcTitle.trim()} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Матрица покрытия</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs">✓</span> Покрыто</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-muted border border-border inline-block" /> Нет связи</span>
            <CopyButton text={csvText} label="CSV" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[200px] sticky left-0 bg-muted/30 z-10">Требование</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[40px]">Приор.</th>
                {testCaseRows.map(tc => (
                  <th key={tc.id} className="text-center px-1 py-2 text-muted-foreground font-medium min-w-[52px]">
                    <div className="font-mono text-primary">{tc.tcId}</div>
                  </th>
                ))}
                <th className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[70px]">Покрытие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requirements.map(req => {
                const covCount = testCaseRows.filter(tc => links.has(req.reqId + ":" + tc.tcId)).length;
                return (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-card z-10">
                      <div className="font-mono text-primary text-xs">{req.reqId}</div>
                      <div className="text-foreground mt-0.5 line-clamp-2 max-w-[200px]">{req.title}</div>
                    </td>
                    <td className="text-center px-2 py-2">
                      <span className={"px-1.5 py-0.5 rounded text-xs font-medium " + prioColor[req.priority]}>{req.priority}</span>
                    </td>
                    {testCaseRows.map(tc => {
                      const linked = links.has(req.reqId + ":" + tc.tcId);
                      return (
                        <td key={tc.id} className="text-center px-1 py-2">
                          <button
                            onClick={() => toggleLink(req.reqId, tc.tcId)}
                            className={"w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all " + (linked ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60" : "bg-muted text-transparent hover:bg-muted/70 hover:text-muted-foreground")}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-center px-2 py-2">
                      <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + (covCount > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300")}>
                        {covCount}/{testCaseRows.length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          Кликайте на ячейки матрицы, чтобы связать требования с тест-кейсами
        </div>
      </div>
    </div>
  );
}

// ─── Main Documentation Module ────────────────────────
export function DocumentationModule() {
  const [activeTab, setActiveTab] = useState<DocTab>("testplan");

  const tabs = DOCUMENT_TABS.map((tab) => ({
    ...tab,
    icon:
      tab.iconName === "CheckSquare" ? <CheckSquare className="w-4 h-4" /> :
      tab.iconName === "FileText" ? <FileText className="w-4 h-4" /> :
      tab.iconName === "Clipboard" ? <Clipboard className="w-4 h-4" /> :
      tab.iconName === "Bug" ? <Bug className="w-4 h-4" /> :
      tab.iconName === "BarChart2" ? <BarChart2 className="w-4 h-4" /> :
      <Layers className="w-4 h-4" />,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">📄 Документация</h2>
        <p className="text-sm text-muted-foreground">Шаблоны тестовой документации по IEEE 829 / ISO/IEC/IEEE 29119. Поля со <span className="text-destructive font-medium">*</span> обязательны.</p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap " + (activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "checklist" && <ChecklistDocSection />}
      {activeTab === "testcase" && <TestCaseDocSection />}
      {activeTab === "testplan" && <TestPlanDocSection />}
      {activeTab === "bugreport" && <BugReportDocSection />}
      {activeTab === "testreport" && <TestReportDocSection />}
      {activeTab === "rtm" && <RTMSection />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
