import { AlertTriangle, BookOpen } from "lucide-react";
import type { TestPlanCategory, TestPlanStep } from "../types";

interface Props {
  steps: TestPlanStep[];
  onOpenKnowledge?: (query: string) => void;
}

interface PlanGroup {
  id: string;
  title: string;
  subtitle: string;
  why: string;
  categories: TestPlanCategory[];
}

const GROUPS: PlanGroup[] = [
  {
    id: "requirements",
    title: "Сначала уточни пробелы в требованиях",
    subtitle: "Не тестируй по догадкам",
    why: "Если ограничение, формат или правило неизвестны, сначала зафиксируй вопрос. Иначе ожидаемый результат будет выдуманным.",
    categories: ["requirements"],
  },
  {
    id: "positive",
    title: "Позитивные проверки",
    subtitle: "Вводим валидные данные и проверяем основной сценарий",
    why: "Сначала подтверждаем, что функция работает в штатном сценарии и принимает корректные данные.",
    categories: ["positive"],
  },
  {
    id: "negative",
    title: "Негативные проверки",
    subtitle: "Вводим невалидные, пустые и неподходящие данные",
    why: "Система должна не только принимать правильные данные, но и предсказуемо отклонять неправильные без падений и потери данных.",
    categories: ["negative"],
  },
  {
    id: "validation",
    title: "Валидация и техники тест-дизайна",
    subtitle: "Форматы, классы эквивалентности и границы",
    why: "Техники тест-дизайна помогают выбрать небольшое, но эффективное количество тестовых данных вместо случайного перебора.",
    categories: ["validation"],
  },
  {
    id: "logic",
    title: "Бизнес-логика, комбинации и состояния",
    subtitle: "Проверяем зависимости между условиями и частями системы",
    why: "Многие дефекты возникают не в одном поле, а при сочетании нескольких условий, ролей, состояний или компонентов.",
    categories: ["combinations", "state", "integration"],
  },
  {
    id: "quality",
    title: "Удобство, доступность и совместимость",
    subtitle: "Проверяем, удобно ли пользоваться функцией в реальных условиях",
    why: "Функция может быть технически правильной, но неудобной, недоступной с клавиатуры или сломанной в поддерживаемой среде.",
    categories: ["ux", "accessibility", "compatibility"],
  },
  {
    id: "security",
    title: "Безопасность",
    subtitle: "Проверяем безопасную обработку ввода и доступов",
    why: "Пользовательский ввод и права доступа должны проверяться на доверенной стороне системы, а ошибки не должны раскрывать лишние данные.",
    categories: ["security"],
  },
  {
    id: "reliability",
    title: "Устойчивость и деструктивные проверки",
    subtitle: "Прерываем, повторяем и проверяем восстановление",
    why: "Сбои сети, повторные клики и прерывания не должны создавать дубликаты, частично сохранённые данные или необратимые ошибки.",
    categories: ["reliability", "destructive"],
  },
  {
    id: "exploratory",
    title: "Исследовательские проверки",
    subtitle: "Проверяем реалистичные ошибки, которые не покрыты формальными правилами",
    why: "После основных проверок тестировщик уже понимает слабые места функции и может целенаправленно искать нестандартные дефекты.",
    categories: ["exploratory"],
  },
  {
    id: "regression",
    title: "Retest и Regression",
    subtitle: "После исправлений проверяем дефект и связанные сценарии повторно",
    why: "Retest подтверждает конкретное исправление, а Regression помогает убедиться, что изменение не сломало соседнее поведение.",
    categories: ["regression"],
  },
];

const techniqueKnowledge: Record<string, string> = {
  "Happy Path": "Happy Path и Smoke Testing",
  "Positive Testing": "Позитивное тестирование",
  "Negative Testing": "Негативное тестирование",
  "Equivalence Partitioning": "Эквивалентное разбиение",
  "Boundary Value Analysis": "Анализ граничных значений",
  "Decision Table Testing": "Таблицы решений",
  "State Transition Testing": "Переходы состояний",
  "Pairwise Testing": "Pairwise",
  "Error Guessing": "Error Guessing и исследовательское тестирование",
  "Exploratory Testing": "Исследовательское тестирование",
  "Regression Testing": "Регрессионное тестирование",
  "Retesting": "Retest",
};

function CheckItem({ step, onOpenKnowledge }: { step: TestPlanStep; onOpenKnowledge?: (query: string) => void }) {
  const knowledge = step.technique ? techniqueKnowledge[step.technique.en] : undefined;
  return <div className="rounded-lg border border-border bg-card p-3 space-y-2">
    <div>
      <p className="text-sm font-semibold text-foreground">{step.title}</p>
      <p className="mt-1 text-sm text-muted-foreground leading-6"><span className="font-medium text-foreground">Как проверить: </span>{step.action}</p>
    </div>

    {step.technique && <p className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Техника: </span>
      {step.technique.ru} / {step.technique.en}{step.technique.short ? ` (${step.technique.short})` : ""}
    </p>}

    {!!step.examples?.length && <div className="flex flex-wrap gap-1.5">
      {step.examples.map((example) => <code key={example} className="rounded border border-border bg-muted px-2 py-1 text-xs">{example}</code>)}
    </div>}

    {step.expected && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Ожидаем: </span>{step.expected}</p>}
    {step.warning && <div className="flex gap-2 rounded-md bg-amber-500/10 p-2 text-xs"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500"/><span>{step.warning}</span></div>}

    {knowledge && <button
      type="button"
      onClick={() => onOpenKnowledge?.(knowledge)}
      className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:cursor-default disabled:no-underline"
      disabled={!onOpenKnowledge}
    >
      <BookOpen className="h-3.5 w-3.5"/>
      <span>В Базе знаний: {knowledge}</span>
    </button>}
  </div>;
}

export function TestPlanOverview({ steps, onOpenKnowledge }: Props) {
  const groups = GROUPS.map((group) => ({
    ...group,
    steps: steps.filter((step) => group.categories.includes(step.category)),
  })).filter((group) => group.steps.length > 0);

  return <div className="space-y-4">
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <h3 className="font-semibold">План проверки</h3>
      <p className="mt-1 text-sm text-muted-foreground">Иди сверху вниз. Внутри каждого раздела выполняй только те проверки, которые относятся к известным требованиям твоего объекта.</p>
    </div>

    {groups.map((group, index) => <section key={group.id} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
          <div>
            <h3 className="font-semibold">{group.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{group.subtitle}</p>
            <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Зачем: </span>{group.why}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {group.steps.map((step) => <CheckItem key={step.id} step={step} onOpenKnowledge={onOpenKnowledge}/>) }
      </div>
    </section>)}
  </div>;
}
