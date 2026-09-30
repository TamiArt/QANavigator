import * as React from "react";
import {
  Activity, AlertTriangle, ArrowDown, ArrowRight, BookOpen, Boxes, Bug,
  CheckCircle2, ClipboardCheck, Cloud, Code2, Database, FileText, GitBranch,
  Globe, Layers3, ListChecks, Network, PlayCircle, Route, Server, ShieldCheck,
  Target, TestTube2, Users, Workflow,
} from "lucide-react";
import type { LearningLesson, LearningModule } from "./handbook-learning";

type VisualKind = "flow" | "layers" | "cycle" | "compare" | "checklist" | "network" | "timeline" | "pyramid";
type LessonVisual = { kind: VisualKind; labels: string[]; icon: React.ComponentType<{ className?: string }> };
const V = (kind: VisualKind, labels: string[], icon: LessonVisual["icon"]): LessonVisual => ({ kind, labels, icon });

const LESSON_VISUALS: Record<string, LessonVisual> = {
  "m1-01": V("flow", ["Цель", "Проверка", "Результат"], TestTube2),
  "m1-02": V("compare", ["QA", "QC", "Testing"], ShieldCheck),
  "m1-03": V("checklist", ["Принципы", "Риски", "Проверка"], ListChecks),
  "m1-04": V("compare", ["Верификация", "Валидация", "Продукт"], CheckCircle2),
  "m1-05": V("flow", ["Потребность", "Требование", "Проверка"], FileText),
  "m1-06": V("cycle", ["Идея", "Разработка", "Тестирование", "Релиз"], Workflow),
  "m1-07": V("cycle", ["Анализ", "Планирование", "Тестирование", "Завершение"], Route),
  "m1-08": V("compare", ["Severity", "Priority", "Решение"], AlertTriangle),
  "m1-09": V("layers", ["Функциональное", "Нефункциональное", "Уровни"], Layers3),
  "m1-10": V("pyramid", ["Unit", "Integration", "System", "E2E"], Boxes),
  "m1-11": V("network", ["Классы", "Границы", "Комбинации"], Target),
  "m2-01": V("layers", ["Frontend", "Backend", "Middleware", "Инфраструктура"], Layers3),
  "m2-02": V("network", ["Product", "Development", "QA", "Project"], Users),
  "m2-03": V("flow", ["Waterfall", "V-Model", "Iterative", "Agile"], Workflow),
  "m2-04": V("cycle", ["Planning", "Daily", "Review", "Retrospective"], Workflow),
  "m2-05": V("timeline", ["Цель", "Задачи", "Разработка", "Результат"], Route),
  "m2-06": V("compare", ["Story Points", "Planning Poker", "Velocity"], Target),
  "m2-07": V("cycle", ["Что улучшить?", "Что сохранить?", "Следующий шаг"], Activity),
  "m2-08": V("flow", ["Событие", "Обсуждение", "Результат"], PlayCircle),
  "m2-09": V("compare", ["Подход", "Процесс", "Практика"], BookOpen),
  "m2-10": V("flow", ["Backlog", "In Progress", "Done"], Route),
  "m2-11": V("compare", ["Scrum", "Kanban", "Гибрид"], GitBranch),
  "m2-12": V("layers", ["Стартап", "Продуктовая", "Аутсорсинг", "Enterprise"], Globe),
  "m3-01": V("compare", ["Frontend", "API", "Backend"], Network),
  "m3-02": V("layers", ["Dev", "Test", "Stage", "Production"], Server),
  "m3-03": V("flow", ["UI", "Логика", "API", "Результат"], Globe),
  "m3-04": V("checklist", ["Layout", "Навигация", "Формы", "Состояния"], ClipboardCheck),
  "m3-05": V("layers", ["Структура", "Элементы", "Атрибуты"], Code2),
  "m3-06": V("compare", ["Стили", "Сетка", "Адаптивность"], Boxes),
  "m3-07": V("network", ["Elements", "Console", "Network"], Globe),
  "m4-01": V("layers", ["План", "Кейсы", "Чек-лист", "Отчёт"], FileText),
  "m4-02": V("flow", ["Прозрачность", "Повторяемость", "Контроль"], ShieldCheck),
  "m4-03": V("timeline", ["Цели", "Объём", "Риски", "Критерии"], ClipboardCheck),
  "m4-04": V("flow", ["Предусловия", "Шаги", "Ожидаемый результат"], ListChecks),
  "m4-05": V("network", ["Endpoint", "Request", "Response", "Status"], Network),
  "m4-06": V("checklist", ["Пункт", "Результат", "Статус"], ListChecks),
  "m4-07": V("compare", ["Test Case", "Checklist", "Контекст"], GitBranch),
  "m4-08": V("flow", ["Шаги", "Факт", "Ожидание", "Evidence"], Bug),
  "m4-09": V("layers", ["Цели", "Результаты", "Риски", "Вывод"], FileText),
  "m4-10": V("compare", ["Bug", "Error", "Defect", "Severity"], AlertTriangle),
  "m4-11": V("cycle", ["New", "In Progress", "Retest", "Closed"], Workflow),
  "m4-12": V("compare", ["Bug", "Feature Request", "Acceptance"], GitBranch),
  "m4-13": V("timeline", ["Воспроизвести", "Зафиксировать", "Изолировать", "Передать"], Route),
  "m4-14": V("compare", ["Pre-release", "Production", "Impact"], Cloud),
  "m4-15": V("layers", ["Test Management", "Tasks", "Reports", "Repository"], Database),
  "m4-16": V("network", ["UI", "Network", "Logs", "Backend"], Network),
  "m4-17": V("flow", ["Уточнить", "Спланировать", "Проверить", "Зафиксировать"], Target),
  "m4-18": V("checklist", ["Атомарность", "Повторяемость", "Читаемость", "Поддержка"], CheckCircle2),
};

function getVisual(lesson: LearningLesson): LessonVisual {
  return LESSON_VISUALS[lesson.id] ?? V("flow", ["Тема", "Проверка", "Результат"], BookOpen);
}

function VisualDiagram({ visual }: { visual: LessonVisual }) {
  const Icon = visual.icon;
  if (visual.kind === "pyramid") {
    return <div className="flex flex-col items-center gap-1.5 py-2">
      {visual.labels.map((label, index) => (
        <div key={label} className="flex items-center justify-center rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs font-medium text-foreground" style={{ width: `${92 - index * 15}%` }}>{label}</div>
      ))}
    </div>;
  }
  if (visual.kind === "cycle") {
    return <div className="grid grid-cols-2 gap-2 py-2">
      {visual.labels.map((label, index) => (
        <div key={label} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs font-medium">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{index + 1}</span>{label}
        </div>
      ))}
    </div>;
  }
  return <div className={`grid gap-2 py-2 ${visual.labels.length > 3 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
    {visual.labels.map((label, index) => <React.Fragment key={label}>
      <div className="flex min-h-16 flex-col items-center justify-center rounded-lg border border-border bg-muted/20 p-2 text-center">
        <Icon className="mb-1 h-4 w-4 text-primary" /><span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      {index < visual.labels.length - 1 && <ArrowRight className="hidden self-center text-muted-foreground sm:block" />}
    </React.Fragment>)}
  </div>;
}

export function LearningInfographic(props: { mode: "lesson"; lesson: LearningLesson } | { mode: "module"; module: LearningModule }) {
  if (props.mode === "module") {
    const { module } = props;
    return <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label={`Инфографика: ${module.title}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div>
        <div><div className="text-xs font-semibold uppercase tracking-wide text-primary">Карта модуля</div><h3 className="text-base font-semibold text-foreground">{module.title}</h3></div>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {module.lessons.map((lesson, index) => <div key={lesson.id} className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-1 flex items-center justify-between"><span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></div>
          <div className="text-xs font-medium leading-4 text-foreground">{lesson.title}</div>
        </div>)}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ArrowDown className="h-4 w-4" />Последовательно: понять → применить → закрепить</div>
    </section>;
  }
  const visual = getVisual(props.lesson);
  const Icon = visual.icon;
  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label={`Инфографика урока: ${props.lesson.title}`}>
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-wide text-primary">Визуальная шпаргалка</div><h4 className="mt-0.5 text-sm font-semibold leading-5 text-foreground">{props.lesson.title}</h4></div>
    </div>
    <VisualDiagram visual={visual} />
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <div className="rounded-lg bg-muted/30 p-2.5 text-xs"><span className="font-semibold text-foreground">Суть:</span> смотри на связь элементов</div>
      <div className="rounded-lg bg-muted/30 p-2.5 text-xs"><span className="font-semibold text-foreground">Применение:</span> используй модель при работе</div>
      <div className="rounded-lg bg-muted/30 p-2.5 text-xs"><span className="font-semibold text-foreground">Запомнить:</span> ключевые элементы темы</div>
    </div>
  </section>;
}
