import * as React from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { MarkdownView } from "../../components/shared";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { STORAGE_KEYS } from "../../core/constants";
import { HANDBOOK_LEARNING_MODULES, getLearningLessonContent } from "./handbook-learning";

interface LearningProgress {
  completedLessonIds: string[];
}

const INITIAL_PROGRESS: LearningProgress = { completedLessonIds: [] };

export function HandbookLearningMode({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useLocalStorage<LearningProgress>(
    STORAGE_KEYS.handbookLearningProgress,
    INITIAL_PROGRESS,
  );
  const module = HANDBOOK_LEARNING_MODULES[0];
  const [activeIndex, setActiveIndex] = React.useState(0);

  const completed = new Set(progress.completedLessonIds);
  const activeLesson = module.lessons[activeIndex];
  const completedCount = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
  const progressPercent = Math.round((completedCount / module.lessons.length) * 100);

  const markCompleted = () => {
    if (completed.has(activeLesson.id)) return;
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
          Прогресс: {completedCount}/{module.lessons.length} ({progressPercent}%)
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground">{module.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Последовательное изучение тем из Базы знаний.
        </p>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid gap-2">
        {module.lessons.map((lesson, index) => {
          const isActive = index === activeIndex;
          const isCompleted = completed.has(lesson.id);
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveIndex(index)}
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

      <article className="bg-card border border-border rounded-xl p-5">
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1">
            Урок {activeIndex + 1} из {module.lessons.length}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{activeLesson.title}</h3>
        </div>
        <MarkdownView content={getLearningLessonContent(activeLesson)} />

        <div className="flex flex-wrap justify-between gap-2 pt-5 mt-5 border-t border-border">
          <button
            onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
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
            onClick={goNext}
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
