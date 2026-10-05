import * as React from "react";
import {
  AlertTriangle, ArrowDown, ArrowRight, BookOpen, Boxes, Bug, CheckCircle2,
  ClipboardCheck, Cloud, Code2, Database, FileText, GitBranch, Globe, Layers3,
  ListChecks, Network, PlayCircle, Route, Server, ShieldCheck, Target,
  TestTube2, Users, Workflow,
} from "lucide-react";
import type { LearningLesson, LearningModule } from "./handbook-learning";

type VisualKind =
  | "flow"
  | "layers"
  | "cycle"
  | "compare"
  | "checklist"
  | "network"
  | "timeline"
  | "pyramid";

type Accent = "blue" | "lavender" | "mint" | "yellow" | "pink" | "orange";

type LessonVisual = {
  kind: VisualKind;
  labels: string[];
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
};

const V = (
  kind: VisualKind,
  labels: string[],
  icon: LessonVisual["icon"],
  accent: Accent,
): LessonVisual => ({ kind, labels, icon, accent });

const LESSON_VISUALS: Record<string, LessonVisual> = {
  "m1-01": V("flow", ["Цель", "Проверка", "Результат"], TestTube2, "blue"),
  "m1-02": V("compare", ["QA", "QC", "Testing"], ShieldCheck, "lavender"),
  "m1-03": V("checklist", ["Принципы", "Риски", "Проверка"], ListChecks, "mint"),
  "m1-04": V("compare", ["Верификация", "Валидация", "Продукт"], CheckCircle2, "yellow"),
  "m1-05": V("flow", ["Потребность", "Требование", "Проверка"], FileText, "blue"),
  "m1-06": V("cycle", ["Идея", "Разработка", "Тестирование", "Релиз"], Workflow, "mint"),
  "m1-07": V("cycle", ["Анализ", "Планирование", "Тестирование", "Завершение"], Route, "lavender"),
  "m1-08": V("compare", ["Severity", "Priority", "Решение"], AlertTriangle, "pink"),
  "m1-09": V("layers", ["Функциональное", "Нефункциональное", "Уровни"], Layers3, "blue"),
  "m1-10": V("pyramid", ["Unit", "Integration", "System", "E2E"], Boxes, "mint"),
  "m1-11": V("network", ["Классы", "Границы", "Комбинации"], Target, "orange"),

  "m2-01": V("layers", ["Frontend", "Backend", "Middleware", "Инфраструктура"], Layers3, "blue"),
  "m2-02": V("network", ["Product", "Development", "QA", "Project"], Users, "lavender"),
  "m2-03": V("flow", ["Waterfall", "V-Model", "Iterative", "Agile"], Workflow, "mint"),
  "m2-04": V("cycle", ["Planning", "Daily", "Review", "Retrospective"], Workflow, "yellow"),
  "m2-05": V("timeline", ["Цель", "Задачи", "Разработка", "Результат"], Route, "blue"),
  "m2-06": V("compare", ["Story Points", "Planning Poker", "Velocity"], Target, "orange"),
  "m2-07": V("cycle", ["Что улучшить?", "Что сохранить?", "Следующий шаг"], PlayCircle, "mint"),
  "m2-08": V("flow", ["Событие", "Обсуждение", "Результат"], PlayCircle, "lavender"),
  "m2-09": V("compare", ["Подход", "Процесс", "Практика"], BookOpen, "yellow"),
  "m2-10": V("flow", ["Backlog", "In Progress", "Done"], Route, "blue"),
  "m2-11": V("compare", ["Scrum", "Kanban", "Гибрид"], GitBranch, "pink"),
  "m2-12": V("layers", ["Стартап", "Продуктовая", "Аутсорсинг", "Enterprise"], Globe, "orange"),

  "m3-01": V("compare", ["Frontend", "API", "Backend"], Network, "blue"),
  "m3-02": V("layers", ["Dev", "Test", "Stage", "Production"], Server, "lavender"),
  "m3-03": V("flow", ["UI", "Логика", "API", "Результат"], Globe, "mint"),
  "m3-04": V("checklist", ["Layout", "Навигация", "Формы", "Состояния"], ClipboardCheck, "yellow"),
  "m3-05": V("layers", ["Структура", "Элементы", "Атрибуты"], Code2, "blue"),
  "m3-06": V("compare", ["Стили", "Сетка", "Адаптивность"], Boxes, "lavender"),
  "m3-07": V("network", ["Elements", "Console", "Network"], Globe, "orange"),

  "m4-01": V("layers", ["План", "Кейсы", "Чек-лист", "Отчёт"], FileText, "blue"),
  "m4-02": V("flow", ["Прозрачность", "Повторяемость", "Контроль"], ShieldCheck, "mint"),
  "m4-03": V("timeline", ["Цели", "Объём", "Риски", "Критерии"], ClipboardCheck, "lavender"),
  "m4-04": V("flow", ["Предусловия", "Шаги", "Ожидаемый результат"], ListChecks, "yellow"),
  "m4-05": V("network", ["Endpoint", "Request", "Response", "Status"], Network, "blue"),
  "m4-06": V("checklist", ["Пункт", "Результат", "Статус"], ListChecks, "mint"),
  "m4-07": V("compare", ["Test Case", "Checklist", "Контекст"], GitBranch, "orange"),
  "m4-08": V("flow", ["Шаги", "Факт", "Ожидание", "Evidence"], Bug, "pink"),
  "m4-09": V("layers", ["Цели", "Результаты", "Риски", "Вывод"], FileText, "lavender"),
  "m4-10": V("compare", ["Bug", "Error", "Defect", "Severity"], AlertTriangle, "pink"),
  "m4-11": V("cycle", ["New", "In Progress", "Retest", "Closed"], Workflow, "blue"),
  "m4-12": V("compare", ["Bug", "Feature Request", "Acceptance"], GitBranch, "orange"),
  "m4-13": V("timeline", ["Воспроизвести", "Зафиксировать", "Изолировать", "Передать"], Route, "mint"),
  "m4-14": V("compare", ["Pre-release", "Production", "Impact"], Cloud, "yellow"),
  "m4-15": V("layers", ["Test Management", "Tasks", "Reports", "Repository"], Database, "lavender"),
  "m4-16": V("network", ["UI", "Network", "Logs", "Backend"], Network, "blue"),
  "m4-17": V("flow", ["Уточнить", "Спланировать", "Проверить", "Зафиксировать"], Target, "orange"),
  "m4-18": V("checklist", ["Атомарность", "Повторяемость", "Читаемость", "Поддержка"], CheckCircle2, "mint"),
};

const ACCENT_STYLES: Record<Accent, { marker: string; card: string; badge: string }> = {
  blue: { marker: "bg-blue-600 text-white", card: "bg-sky-50/90", badge: "border-sky-200" },
  lavender: { marker: "bg-violet-600 text-white", card: "bg-violet-50/90", badge: "border-violet-200" },
  mint: { marker: "bg-emerald-600 text-white", card: "bg-emerald-50/90", badge: "border-emerald-200" },
  yellow: { marker: "bg-amber-500 text-white", card: "bg-amber-50/90", badge: "border-amber-200" },
  pink: { marker: "bg-pink-600 text-white", card: "bg-pink-50/90", badge: "border-pink-200" },
  orange: { marker: "bg-orange-600 text-white", card: "bg-orange-50/90", badge: "border-orange-200" },
};

const KIND_LABELS: Record<VisualKind, string> = {
  flow: "Последовательность",
  layers: "Слои",
  cycle: "Цикл",
  compare: "Сравнение",
  checklist: "Чек-лист",
  network: "Связи",
  timeline: "Порядок действий",
  pyramid: "Уровни",
};

function getVisual(lesson: LearningLesson): LessonVisual {
  return LESSON_VISUALS[lesson.id] ?? V("flow", ["Тема", "Проверка", "Результат"], BookOpen, "blue");
}

function VisualDiagram({ visual }: { visual: LessonVisual }) {
  const Icon = visual.icon;
  const styles = ACCENT_STYLES[visual.accent];

  if (visual.kind === "pyramid") {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3" aria-label="Пирамида уровней">
        {visual.labels.map((label, index) => (
          <div
            key={label}
            className={`flex min-h-10 items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold ${styles.card} ${styles.badge}`}
            style={{ width: `${94 - index * 15}%` }}
          >
            <span className={`mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${styles.marker}`}>{index + 1}</span>
            {label}
          </div>
        ))}
      </div>
    );
  }

  if (visual.kind === "cycle") {
    return (
      <div className="relative grid gap-2 py-3 sm:grid-cols-2">
        {visual.labels.map((label, index) => (
          <div key={label} className={`relative flex min-h-14 items-center gap-2 rounded-xl border p-3 ${styles.card} ${styles.badge}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${styles.marker}`}>{index + 1}</span>
            <span className="text-xs font-semibold text-foreground">{label}</span>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-x-1/2 top-1/2 hidden h-1 -translate-x-1/2 -translate-y-1/2 border-t border-dashed border-muted-foreground/30 sm:block" />
      </div>
    );
  }

  const gridClass = visual.labels.length > 3
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-3";

  return (
    <div className={`grid gap-2 py-3 ${gridClass}`}>
      {visual.labels.map((label, index) => (
        <React.Fragment key={label}>
          <div className={`flex min-h-20 items-center gap-2.5 rounded-[18px] border-2 p-3 shadow-[2px_3px_0_rgba(30,64,175,0.07)] ${styles.card} ${styles.badge} ${index % 2 === 0 ? "rotate-[-0.35deg]" : "rotate-[0.35deg]"}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${styles.marker}`}>{index + 1}</span>
            <div className="min-w-0">
              <div className={`mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 ${styles.badge}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className={`block break-words text-xs font-bold leading-4 ${styles.marker.replace("bg-", "text-").replace(" text-white", "")}`}>{label}</span>
            </div>
          </div>
          {index < visual.labels.length - 1 && (
            <ArrowRight className="hidden self-center justify-self-center text-muted-foreground/60 lg:block" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function LessonInfographic({ lesson }: { lesson: LearningLesson }) {
  const visual = getVisual(lesson);
  const Icon = visual.icon;
  const styles = ACCENT_STYLES[visual.accent];
  const lessonNumber = lesson.id.match(/-(\\d+)$/)?.[1] ?? "01";

  return (
    <section
      className="overflow-hidden rounded-[28px] border-2 border-blue-100 bg-white shadow-[0_8px_30px_rgba(30,64,175,0.08)]"
      aria-label={`Инфографика урока: ${lesson.title}`}
    >
      <div className={`border-b-2 border-blue-100 bg-gradient-to-br from-white via-sky-50/60 to-violet-50/40 px-4 py-5 sm:px-6 ${styles.card}`}>
        <div className="relative flex items-start gap-3 sm:gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-white text-3xl font-black shadow-[3px_4px_0_rgba(30,64,175,0.12)] ${styles.marker}`}>
            {lessonNumber}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">Визуальная шпаргалка</span>
              <span className="rounded-full border border-blue-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-blue-800">{KIND_LABELS[visual.kind]}</span>
            </div>
            <h4 className="text-base font-extrabold leading-6 text-blue-950 sm:text-lg">{lesson.title}</h4>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-1.5 w-10 rounded-full ${styles.marker}`} />
              <span className="h-1.5 w-2 rounded-full bg-blue-200" />
              <span className="h-1.5 w-2 rounded-full bg-violet-200" />
            </div>
          </div>
          <div className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 bg-white shadow-[2px_3px_0_rgba(30,64,175,0.08)] sm:flex ${styles.badge}`}>
            <Icon className={`h-6 w-6 ${styles.marker.replace("bg-", "text-").replace(" text-white", "")}`} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="mb-[-1px] px-4 pt-3 sm:px-6">
        <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[10px] font-extrabold text-blue-800">Суть за 10 секунд → смотри на связи</div>
      </div>

      <div className="bg-[linear-gradient(rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:18px_18px] p-4 sm:p-6">
        <VisualDiagram visual={visual} />
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-blue-500">
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          Смотри на связь между элементами
        </div>
      </div>
    </section>
  );
}

function ModuleInfographic({ module }: { module: LearningModule }) {
  return (
    <section className="overflow-hidden rounded-[28px] border-2 border-blue-100 bg-white shadow-[0_8px_30px_rgba(30,64,175,0.08)]" aria-label={`Инфографика: ${module.title}`}>
      <div className="border-b-2 border-blue-100 bg-gradient-to-br from-white via-sky-50/60 to-violet-50/40 px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-white text-blue-700 shadow-[2px_3px_0_rgba(30,64,175,0.12)]">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">Карта модуля</div>
            <h3 className="mt-1 text-lg font-extrabold leading-6 text-blue-950">{module.title}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[linear-gradient(rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:18px_18px] p-4 sm:p-6">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {module.lessons.map((lesson, index) => {
            const visual = getVisual(lesson);
            const styles = ACCENT_STYLES[visual.accent];
            return (
              <li key={lesson.id} className={`flex min-w-0 items-start gap-2.5 rounded-[18px] border-2 p-3 shadow-[2px_3px_0_rgba(30,64,175,0.06)] ${styles.card} ${styles.badge}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${styles.marker}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 pt-0.5 text-xs font-semibold leading-4 text-foreground">{lesson.title}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-[11px] font-medium text-muted-foreground">
          <span>01 Понять</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>02 Применить</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>03 Закрепить</span>
        </div>
      </div>
    </section>
  );
}

export function LearningInfographic(
  props:
    | { mode: "lesson"; lesson: LearningLesson }
    | { mode: "module"; module: LearningModule },
) {
  return props.mode === "module"
    ? <ModuleInfographic module={props.module} />
    : <LessonInfographic lesson={props.lesson} />;
}
