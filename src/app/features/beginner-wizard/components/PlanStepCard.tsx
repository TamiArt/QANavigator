import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { TestPlanCategory, TestPlanStep } from "../types";

interface Props {
  step: TestPlanStep;
  index: number;
  total: number;
}

const categoryLabels: Record<TestPlanCategory, string> = {
  requirements: "Требования",
  positive: "Позитивная проверка",
  validation: "Валидация",
  negative: "Негативная проверка",
  combinations: "Комбинации",
  state: "Состояния",
  integration: "Интеграция",
  ux: "UX",
  accessibility: "Accessibility",
  compatibility: "Совместимость",
  security: "Безопасность",
  reliability: "Надёжность",
  destructive: "Деструктивная",
  exploratory: "Исследовательская",
  regression: "Регрессия",
};

export function PlanStepCard({ step, index, total }: Props) {
  const [showWhy, setShowWhy] = useState(false);
  const isFormatStep = step.id.endsWith("-format");
  const formatRequirement = isFormatStep ? step.examples?.[0] : undefined;

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>Шаг {index + 1} из {total}</span>
      <span className="rounded-full bg-muted px-2 py-1">{categoryLabels[step.category]}</span>
    </div>

    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-primary">Что проверить</p>
      <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
      {isFormatStep ? <div className="mt-2 space-y-2 text-sm leading-6">
        {formatRequirement && <p><span className="font-medium">Требование к формату:</span> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{formatRequirement}</code></p>}
        <p><b>1.</b> Введи одно корректное значение, которое соответствует этому формату, и отправь форму.</p>
        <p><b>2.</b> Затем меняй только одну часть значения за раз и снова отправляй форму: убери обязательный символ, добавь лишний символ, нарушь порядок или замени часть на недопустимую.</p>
        <p><b>3.</b> Сравни результат: корректное значение должно приниматься, а значение с нарушенным форматом — отклоняться согласно требованиям.</p>
      </div> : <p className="mt-2 text-sm leading-6">{step.action}</p>}
    </div>

    {step.technique && <div className="rounded-lg bg-muted/60 p-3 text-sm">
      <span className="font-medium">Техника: </span>{step.technique.ru} / {step.technique.en}{step.technique.short ? ` (${step.technique.short})` : ""}
    </div>}

    {!isFormatStep && !!step.examples?.length && <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Пример / тестовые данные</p>
      <div className="flex flex-wrap gap-2">{step.examples.map((example) => <code key={example} className="rounded-md border border-border bg-muted px-2 py-1 text-xs">{example}</code>)}</div>
    </div>}

    {step.expected && <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ожидаемый результат</p>
      <p className="mt-1 text-sm">{step.expected}</p>
    </div>}

    {step.warning && <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/><span>{step.warning}</span></div>}

    <button type="button" onClick={() => setShowWhy(!showWhy)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      Почему это нужно? {showWhy ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
    </button>
    {showWhy && <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">{step.why}</p>}
  </div>;
}
