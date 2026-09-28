import * as React from "react";
import { useState } from "react";
import { Bug, X, Trash2, RefreshCw, Brain, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import { useApp } from "../../core/app-context";
import { CopyButton, Badge, EmptyState } from "../../components/shared";
import { callAI, QA_SYSTEM_PROMPT, uid } from "../../core/ai";
import type { ChecklistItem, BugReport, TestStatus, Severity } from "../../domain/types";

// ══════════════════════════════════════════════════════
// MODULE 3: TEST EXECUTION
// ══════════════════════════════════════════════════════
export function TestExecutionModule() {
  const { checklists, setChecklists, bugReports, setBugReports, apiKeys } = useApp();
  const [activeBugItem, setActiveBugItem] = useState<ChecklistItem | null>(null);
  const [generatingBug, setGeneratingBug] = useState(false);
  const [pendingBug, setPendingBug] = useState<Partial<BugReport> | null>(null);
  const [env, setEnv] = useState("Chrome 124, Windows 11, Staging");
  const [bugGenerationError, setBugGenerationError] = useState("");

  const setStatus = (id: string, status: TestStatus) => {
    setChecklists(checklists.map((c) => c.id === id ? { ...c, status } : c));
    if (status === "failed") {
      const item = checklists.find((c) => c.id === id);
      if (item) setActiveBugItem(item);
    }
  };

  const generateBugReport = async () => {
    if (!activeBugItem) return;
    setGeneratingBug(true);
    setBugGenerationError("");
    try {
      const result = await callAI(
        apiKeys,
        QA_SYSTEM_PROMPT,
        `Создай стандартный баг-репорт для следующего упавшего теста:
Тест: "${activeBugItem.text}"
Окружение: ${env}

Верни ТОЛЬКО JSON:
{
  "title": "заголовок бага по формуле [Где][Что][При каком условии]",
  "steps": ["шаг 1", "шаг 2", "шаг 3"],
  "actual": "фактический результат",
  "expected": "ожидаемый результат",
  "severity": "high",
  "priority": "P2"
}`
      );
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const data = JSON.parse(cleaned);
      setPendingBug({
        ...data,
        environment: env,
        testCaseRef: activeBugItem.id,
      });
    } catch (error) {
      setBugGenerationError(error instanceof Error ? error.message : "Не удалось создать баг-репорт");
    }
    setGeneratingBug(false);
  };

  const saveBug = () => {
    if (!pendingBug) return;
    const bug: BugReport = {
      id: uid(),
      title: pendingBug.title ?? "",
      environment: pendingBug.environment ?? env,
      steps: pendingBug.steps ?? [],
      actual: pendingBug.actual ?? "",
      expected: pendingBug.expected ?? "",
      severity: pendingBug.severity as Severity ?? "medium",
      priority: pendingBug.priority as "P1" | "P2" | "P3" ?? "P2",
      createdAt: new Date().toISOString(),
      testCaseRef: pendingBug.testCaseRef,
    };
    setBugReports([...bugReports, bug]);
    setPendingBug(null);
    setActiveBugItem(null);
  };

  const stats = {
    total: checklists.length,
    passed: checklists.filter((c) => c.status === "passed").length,
    failed: checklists.filter((c) => c.status === "failed").length,
    blocked: checklists.filter((c) => c.status === "blocked").length,
    pending: checklists.filter((c) => c.status === "pending").length,
  };

  const statusConfig: Record<TestStatus, { label: string; class: string; icon: React.ReactNode }> = {
    passed: { label: "Passed", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    failed: { label: "Failed", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", icon: <XCircle className="w-3.5 h-3.5" /> },
    blocked: { label: "Blocked", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: <AlertCircle className="w-3.5 h-3.5" /> },
    pending: { label: "Pending", class: "bg-muted text-muted-foreground border-border", icon: <Play className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🚀 Выполнение тестов</h2>
        <p className="text-sm text-muted-foreground">Выполняйте тесты и отмечайте статусы. При клике на Failed автоматически создастся баг-репорт.</p>
      </div>

      {checklists.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {([["total", "Всего", "text-foreground"], ["passed", "Passed", "text-emerald-600"], ["failed", "Failed", "text-red-500"], ["blocked", "Blocked", "text-amber-500"]] as const).map(([k, l, cls]) => (
            <div key={k} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{stats[k as keyof typeof stats]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      )}

      {checklists.length === 0 ? (
        <EmptyState icon={<Play />} title="Чек-лист пуст" desc="Сначала сгенерируйте чек-лист в модуле Тест-дизайн" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Окружение:</label>
              <input
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {checklists.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Badge variant={item.category as any} />
                <span className="flex-1 text-sm text-foreground">{item.text}</span>
                <div className="flex items-center gap-1.5">
                  {(["passed", "failed", "blocked"] as TestStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(item.id, s)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                        item.status === s ? statusConfig[s].class : "bg-muted text-muted-foreground border-border hover:opacity-80"
                      }`}
                    >
                      {item.status === s && statusConfig[s].icon}
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bug report section */}
      {bugReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-500" /> Баг-репорты ({bugReports.length})
          </h3>
          <div className="space-y-2">
            {bugReports.map((bug) => (
              <div key={bug.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{bug.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={bug.severity === "critical" || bug.severity === "high" ? "failed" : bug.severity === "medium" ? "boundary" : "default"}>
                        {bug.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="default">{bug.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(bug.createdAt).toLocaleDateString("ru")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton
                      text={`**${bug.title}**\n\nОкружение: ${bug.environment}\n\nШаги воспроизведения:\n${bug.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nФактический результат: ${bug.actual}\nОжидаемый результат: ${bug.expected}\n\nSeverity: ${bug.severity}\nPriority: ${bug.priority}`}
                      label="Jira/YouTrack"
                    />
                    <button onClick={() => setBugReports(bugReports.filter((b) => b.id !== bug.id))} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto bug modal */}
      {activeBugItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setActiveBugItem(null); setPendingBug(null); }} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-foreground">Создать баг-репорт</h3>
              </div>
              <button onClick={() => { setActiveBugItem(null); setPendingBug(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                <span className="font-medium">Упавший тест:</span> {activeBugItem.text}
              </div>
              {bugGenerationError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{bugGenerationError}</p>}

              {!pendingBug ? (
                <button
                  onClick={generateBugReport}
                  disabled={generatingBug}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generatingBug ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><Brain className="w-4 h-4" /> AI: Сгенерировать баг-репорт</>}
                </button>
              ) : (
                <div className="space-y-3">
                  {[
                    ["Заголовок", "title"],
                    ["Фактический результат", "actual"],
                    ["Ожидаемый результат", "expected"],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                      <textarea
                        value={(pendingBug as any)[key] ?? ""}
                        onChange={(e) => setPendingBug({ ...pendingBug, [key]: e.target.value })}
                        rows={key === "title" ? 2 : 3}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
                      <select
                        value={pendingBug.severity ?? "medium"}
                        onChange={(e) => setPendingBug({ ...pendingBug, severity: e.target.value as Severity })}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        {["critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                      <select
                        value={pendingBug.priority ?? "P2"}
                        onChange={(e) => setPendingBug({ ...pendingBug, priority: e.target.value as "P1" | "P2" | "P3" })}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        {["P1", "P2", "P3"].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveBug} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90">
                      Сохранить баг-репорт
                    </button>
                    <button onClick={() => setPendingBug(null)} className="px-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl">
                      Перегенерировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
