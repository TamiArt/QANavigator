import * as React from "react";
import { useState } from "react";
import { RefreshCw, Brain, AlertCircle } from "lucide-react";
import { useApp } from "../../core/app-context";
import { CopyButton, Spinner, EmptyState, MarkdownView } from "../../components/shared";
import { callAI, QA_SYSTEM_PROMPT } from "../../core/ai";

// ══════════════════════════════════════════════════════
export function RequirementsModule() {
  const { apiKeys, requirementsText, setRequirementsText, requirementsResult, setRequirementsResult } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!requirementsText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await callAI(
        apiKeys,
        QA_SYSTEM_PROMPT,
        `Проанализируй следующие требования к функциональности, используя методологию ISTQB CTFL v4.0, ISO 25010 и Risk-Based Testing.

Требования:
${requirementsText}

Выдай структурированный анализ:

## 🔍 Выявленные неопределённости
(список конкретных пунктов, где требования неясны или неполны)

## 🕳️ Логические пробелы и противоречия
(места где требования противоречат друг другу или содержат логические дыры)

## ⚠️ Граничные случаи и риски
(потенциальные edge-cases и бизнес-риски по шкале Высокий/Средний/Низкий)

## 🛡️ Рекомендации по стратегии тестирования (Risk-Based)
(приоритеты и подходы к тестированию на основе рисков)

## ❓ Вопросы команде разработки
(конкретные вопросы, которые нужно задать до начала разработки)`
      );
      setRequirementsResult(result);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🧠 Анализ требований</h2>
        <p className="text-sm text-muted-foreground">Вставьте описание задачи из Jira или любой другой системы. AI выявит неопределённости, логические пробелы и риски.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Требования / User Story</label>
            <button onClick={() => setRequirementsText("")} className="text-xs text-muted-foreground hover:text-foreground">Очистить</button>
          </div>
          <textarea
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            placeholder="Вставьте текст требований, User Story или описание задачи из Jira...

Например:
As a user, I want to be able to register using my email and password so that I can access the application.
Acceptance Criteria:
- Email должен быть уникальным
- Пароль должен содержать минимум 8 символов"
            className="w-full h-64 bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none font-mono leading-relaxed"
          />
          <button
            onClick={analyze}
            disabled={loading || !requirementsText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Анализирую...</> : <><Brain className="w-4 h-4" /> Анализировать требования</>}
          </button>
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">{error.split("\n")[0]}</div>
                {error.includes("\n") && (
                  <pre className="mt-1 text-xs opacity-80 whitespace-pre-wrap break-all font-mono">{error.split("\n").slice(1).join("\n")}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Результат анализа</label>
            {requirementsResult && <CopyButton text={requirementsResult} label="Скопировать для Jira" />}
          </div>
          <div className="bg-card border border-border rounded-xl p-4 h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : requirementsResult ? (
              <MarkdownView content={requirementsResult} />
            ) : (
              <EmptyState icon={<Brain />} title="Ожидание анализа" desc="Вставьте требования и нажмите Анализировать" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
