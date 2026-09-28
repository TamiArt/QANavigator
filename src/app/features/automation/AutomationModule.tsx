import * as React from "react";
import { useState } from "react";
import { RefreshCw, Code, Terminal, AlertCircle } from "lucide-react";
import { useApp } from "../../core/app-context";
import { Spinner, EmptyState, CodeBlock, MarkdownView } from "../../components/shared";
import { STACKS } from "../../core/constants";
import { callAI, QA_SYSTEM_PROMPT, uid } from "../../core/ai";
import type { AutoStack } from "../../domain/types";

// ══════════════════════════════════════════════════════
// MODULE 4: AUTOMATION GENERATOR
// ══════════════════════════════════════════════════════
export function AutomationModule() {
  const { apiKeys, testCases, checklists } = useApp();
  const [stack, setStack] = useState<AutoStack>("python-playwright");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"code" | "guide">("code");
  const [error, setError] = useState("");

  const allItems = [
    ...testCases.map((tc) => ({ id: tc.id, text: tc.title, type: "testcase" })),
    ...checklists.filter((c) => !testCases.find((t) => t.source === c.text)).map((c) => ({ id: c.id, text: c.text, type: "checklist" })),
  ];

  const stackInfo = STACKS.find((s) => s.id === stack)!;

  const generate = async () => {
    if (!selectedItem) return;
    const item = allItems.find((i) => i.id === selectedItem);
    if (!item) return;
    setLoading(true);
    setCode("");
    setGuide("");
    setError("");

    const tc = testCases.find((t) => t.id === selectedItem);
    const steps = tc ? tc.steps.join("\n") : "";

    try {
      const [codeRes, guideRes] = await Promise.all([
        callAI(
          apiKeys,
          QA_SYSTEM_PROMPT,
          `Напиши автотест для ${stackInfo.label} с паттерном Page Object Model (POM).

Тест: "${item.text}"
${steps ? `Шаги:\n${steps}` : ""}

Требования:
- Используй ${stackInfo.label}
- Строго следуй паттерну Page Object Model
- Добавь понятные имена методов и переменных
- Добавь assertions (проверки)
- Код должен быть готов к запуску
- Файловая структура: /pages/ и /tests/
- Верни ТОЛЬКО код, без пояснений, с комментариями на русском

Верни два файла, разделённых строкой "# === pages/page.py ===" и "# === tests/test.py ===" (или аналогичные для выбранного языка)`
        ),
        callAI(
          apiKeys,
          QA_SYSTEM_PROMPT,
          `Напиши пошаговый гайд по запуску автотеста на ${stackInfo.label} для начинающего QA-инженера.

Включи:
1. Системные требования
2. Установка зависимостей (конкретные команды терминала)
3. Структура проекта
4. Команды для запуска тестов
5. Как посмотреть отчёт

Пиши чётко, с командами в code-блоках. На русском языке.`
        ),
      ]);
      setCode(codeRes);
      setGuide(guideRes);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🤖 Генератор автотестов</h2>
        <p className="text-sm text-muted-foreground">Конвертируйте тест-кейсы в готовый код автотестов с паттерном Page Object Model.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Стек технологий</label>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(["python","typescript","javascript","java","kotlin","csharp","ruby","go","swift","php"] as const).map((lang) => {
                const group = STACKS.filter((s) => s.lang === lang);
                if (!group.length) return null;
                const labels: Record<string, string> = {
                  python: "Python", typescript: "TypeScript", javascript: "JavaScript",
                  java: "Java", kotlin: "Kotlin", csharp: "C#",
                  ruby: "Ruby", go: "Go", swift: "Swift", php: "PHP",
                };
                return (
                  <div key={lang}>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 px-1">{labels[lang]}</div>
                    <div className="space-y-1">
                      {group.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStack(s.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                            stack === s.id
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span>{s.label}</span>
                            {s.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                s.badge.includes("🔥") ? "bg-orange-500/20 text-orange-400" :
                                s.badge === "API" ? "bg-blue-500/20 text-blue-400" :
                                s.badge === "Mobile" ? "bg-purple-500/20 text-purple-400" :
                                s.badge === "BDD" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                              }`}>{s.badge}</span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Выберите тест</label>
            {allItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Сначала создайте тест-кейсы в модуле Тест-дизайн</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                      selectedItem === item.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-mono text-muted-foreground mr-1.5">{item.type === "testcase" ? "TC" : "CL"}</span>
                    {item.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={generate}
            disabled={loading || !selectedItem}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><Code className="w-4 h-4" /> Сгенерировать автотест</>}
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

        <div className="xl:col-span-2">
          {loading ? (
            <div className="bg-card border border-border rounded-xl h-96 flex items-center justify-center">
              <Spinner />
            </div>
          ) : code ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {["code", "guide"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "code" ? "💻 Код автотеста" : "📖 Гайд по запуску"}
                  </button>
                ))}
              </div>
              {tab === "code" ? (
                <CodeBlock code={code} lang={stackInfo.lang} />
              ) : (
                <div className="bg-card border border-border rounded-xl p-5 max-h-96 overflow-y-auto">
                  <MarkdownView content={guide} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl h-96 flex items-center justify-center">
              <EmptyState icon={<Terminal />} title="Код появится здесь" desc="Выберите тест и стек, затем нажмите Сгенерировать" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
