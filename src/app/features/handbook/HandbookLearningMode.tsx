import * as React from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, GraduationCap, List, PanelTop } from "lucide-react";
import { MarkdownView } from "../../components/shared";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { STORAGE_KEYS } from "../../core/constants";
import { isHandbookLearningProgressStorageValue } from "../../core/storage-validators";
import { HANDBOOK_LEARNING_MODULES, getLearningLessonContent } from "./handbook-learning";
import { LearningInfographic } from "./LearningInfographic";

interface LearningProgress {
  completedLessonIds: string[];
}

const INITIAL_PROGRESS: LearningProgress = { completedLessonIds: [] };

export function HandbookLearningMode({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useLocalStorage<LearningProgress>(
    STORAGE_KEYS.handbookLearningProgress,
    INITIAL_PROGRESS,
    isHandbookLearningProgressStorageValue,
  );
  const [moduleIndex, setModuleIndex] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const lessonArticleRef = React.useRef<HTMLElement | null>(null);

  const module = HANDBOOK_LEARNING_MODULES[moduleIndex] ?? HANDBOOK_LEARNING_MODULES[0];
  const completed = new Set(progress.completedLessonIds);
  const activeLesson = module.lessons[activeIndex];
  const completedCount = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
  const progressPercent = Math.round((completedCount / module.lessons.length) * 100);

  const scrollToLesson = () => {
    requestAnimationFrame(() => {
      lessonArticleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const selectModule = (index: number) => {
    setModuleIndex(index);
    setActiveIndex(0);
    scrollToLesson();
  };

  const selectLesson = (index: number) => {
    setActiveIndex(index);
    scrollToLesson();
  };

  const markCompleted = () => {
    if (!activeLesson || completed.has(activeLesson.id)) return;
    setProgress({
      completedLessonIds: [...progress.completedLessonIds, activeLesson.id],
    });
  };

  const goNext = () => {
    markCompleted();
    setActiveIndex((index) => Math.min(index + 1, module.lessons.length - 1));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> К базе знаний
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GraduationCap className="w-4 h-4" />
          Прогресс модуля: {completedCount}/{module.lessons.length} ({progressPercent}%)
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground">{module.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Последовательное изучение тем из Базы знаний.
        </p>
      </div>

      <nav
        aria-label="Навигация по модулям и темам"
        className="sticky top-2 z-20 rounded-2xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur"
      >
        <div className="flex items-center gap-2 mb-3">
          <PanelTop className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Быстрая навигация</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Модули">
          {HANDBOOK_LEARNING_MODULES.map((item, index) => {
            const isActive = index === moduleIndex;
            const itemCompleted = item.lessons.filter((lesson) => completed.has(lesson.id)).length;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="learning-module-content"
                onClick={() => selectModule(index)}
                className={isActive
                  ? "min-w-max rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-xs font-semibold text-primary"
                  : "min-w-max rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/30"}
              >
                <span className="block">{item.title.replace(/^Модуль \d+\. /, "Модуль ")}</span>
                <span className="mt-0.5 block text-[10px] opacity-80">{itemCompleted}/{item.lessons.length} изучено</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <List className="w-4 h-4 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1">
            {module.lessons.map((lesson, index) => {
              const isActive = index === activeIndex;
              const isCompleted = completed.has(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  aria-label={`Перейти к теме ${index + 1}: ${lesson.title}`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => selectLesson(index)}
                  className={isActive
                    ? "flex min-w-8 h-8 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"
                    : isCompleted
                      ? "flex min-w-8 h-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-2 text-xs font-semibold text-primary"
                      : "flex min-w-8 h-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 px-2 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"}
                  title={lesson.title}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div id="learning-module-content" className="scroll-mt-24">
        <LearningInfographic mode="module" module={module} />
      </div>

      <div className="grid gap-2">
        {module.lessons.map((lesson, index) => {
          const isActive = index === activeIndex;
          const isCompleted = completed.has(lesson.id);
          return (
            <button
              key={lesson.id}
              onClick={() => selectLesson(index)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                isActive ? "border-primary bg-primary/10" : "border-border hover:bg-muted/30"
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </span>
              <span className="text-sm text-foreground">{lesson.title}</span>
            </button>
          );
        })}
      </div>

      <article
        ref={lessonArticleRef}
        id={`learning-lesson-${activeLesson.id}`}
        className="bg-card border border-border rounded-xl p-5 scroll-mt-24"
      >
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1">
            Урок {activeIndex + 1} из {module.lessons.length}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{activeLesson.title}</h3>
        </div>
        <LearningInfographic mode="lesson" lesson={activeLesson} />
        <div className="mt-6">
          <MarkdownView content={getLearningLessonContent(activeLesson)} />
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-5 mt-5 border-t border-border">
          <button
            onClick={() => selectLesson(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>

          <button
            onClick={markCompleted}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs"
          >
            <Check className="w-4 h-4" />
            {completed.has(activeLesson.id) ? "Изучено" : "Отметить как изученное"}
          </button>

          <button
            onClick={() => { goNext(); scrollToLesson(); }}
            disabled={activeIndex === module.lessons.length - 1}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs disabled:opacity-40"
          >
            Следующая тема <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
