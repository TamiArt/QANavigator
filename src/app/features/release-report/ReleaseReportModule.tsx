import * as React from "react";
import { useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { useApp } from "../../core/app-context";
import { CopyButton, MarkdownView } from "../../components/shared";
import { callAI, QA_SYSTEM_PROMPT } from "../../core/ai";

// ══════════════════════════════════════════════════════
// MODULE 5: RELEASE REPORT
// ══════════════════════════════════════════════════════
export function ReleaseReportModule() {
  const { checklists, bugReports } = useApp();
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportError, setReportError] = useState("");
  const { apiKeys } = useApp();

  const stats = {
    total: checklists.length,
    passed: checklists.filter((c) => c.status === "passed").length,
    failed: checklists.filter((c) => c.status === "failed").length,
    blocked: checklists.filter((c) => c.status === "blocked").length,
    pending: checklists.filter((c) => c.status === "pending").length,
    coverage: checklists.length ? Math.round((checklists.filter((c) => c.status !== "pending").length / checklists.length) * 100) : 0,
    passRate: checklists.length ? Math.round((checklists.filter((c) => c.status === "passed").length / checklists.length) * 100) : 0,
    critical: bugReports.filter((b) => b.severity === "critical").length,
    high: bugReports.filter((b) => b.severity === "high").length,
    medium: bugReports.filter((b) => b.severity === "medium").length,
    low: bugReports.filter((b) => b.severity === "low").length,
  };

  const verdict = stats.critical > 0 ? "🔴 NO GO" : stats.high > 2 ? "🟡 УСЛОВНЫЙ РЕЛИЗ" : stats.passRate >= 90 ? "🟢 GO" : "🟡 УСЛОВНЫЙ РЕЛИЗ";

  const generateReport = async () => {
    setLoading(true);
    setReportError("");
    try {
      const text = await callAI(
        apiKeys,
        QA_SYSTEM_PROMPT,
        `Напиши профессиональный Test Summary Report (Отчёт о тестировании) на русском языке.

Статистика:
- Всего тестов: ${stats.total}
- Passed: ${stats.passed} (${stats.passRate}%)
- Failed: ${stats.failed}
- Blocked: ${stats.blocked}
- Покрытие: ${stats.coverage}%

Баги:
- Critical: ${stats.critical}
- High: ${stats.high}
- Medium: ${stats.medium}
- Low: ${stats.low}

Вердикт: ${verdict}

Список багов:
${bugReports.map((b) => `- [${b.severity.toUpperCase()}] ${b.title}`).join("\n")}

Структура отчёта:
## 📊 Test Summary Report
### Краткое резюме
### Статистика выполнения
### Найденные дефекты
### Рекомендации команде
### Вердикт о готовности к релизу (Go/No-Go с обоснованием)`
      );
      setReportText(text);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Не удалось создать релизный отчёт");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">📊 Релизный отчёт</h2>
        <p className="text-sm text-muted-foreground">Сводка выполнения тестирования и рекомендация Go/No-Go для команды.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Всего тестов", value: stats.total, color: "text-foreground" },
          { label: "Pass Rate", value: `${stats.passRate}%`, color: stats.passRate >= 90 ? "text-emerald-500" : "text-amber-500" },
          { label: "Покрытие", value: `${stats.coverage}%`, color: "text-sky-500" },
          { label: "Critical баги", value: stats.critical, color: stats.critical > 0 ? "text-red-500" : "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Вердикт о готовности к релизу</h3>
          <span className="text-2xl font-bold">{verdict}</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[["Critical", stats.critical, "text-red-500"], ["High", stats.high, "text-orange-500"], ["Medium", stats.medium, "text-amber-500"], ["Low", stats.low, "text-muted-foreground"]].map(([l, v, c]) => (
            <div key={l} className="text-center">
              <p className={`text-xl font-bold ${c}`}>{v}</p>
              <p className="text-xs text-muted-foreground">{l} баги</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={generateReport} disabled={loading} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><FileText className="w-4 h-4" /> Сгенерировать отчёт</>}
        </button>
        {reportText && <CopyButton text={reportText} label="Скопировать отчёт" />}
      </div>
      {reportError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{reportError}</p>}

      {reportText && (
        <div className="bg-card border border-border rounded-xl p-5 max-h-96 overflow-y-auto">
          <MarkdownView content={reportText} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
