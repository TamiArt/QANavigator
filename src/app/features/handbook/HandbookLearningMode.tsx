import * as React from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, GraduationCap, List, PanelTop } from "lucide-react";
import { MarkdownView } from "../../components/shared";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { STORAGE_KEYS } from "../../core/constants";
import { isHandbookLearningProgressStorageValue } from "../../core/storage-validators";
import { HANDBOOK_LEARNING_MODULES, getLearningLessonContent } from "./handbook-learning";
import { LearningInfographic } from "./LearningInfographic";
import { useApp } from "../../core/app-context";
import { translate, getModuleTitle } from "../../core/i18n";
import { getLearningLessonTitle } from "./handbook-learning";

interface LearningProgress {
  completedLessonIds: string[];
}

const INITIAL_PROGRESS: LearningProgress = { completedLessonIds: [] };

export function HandbookLearningMode({ onBack }: { onBack: () => void }) {
  const { language } = useApp();
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
  const progressPercent = module.lessons.length
    ? Math.round((completedCount / module.lessons.length) * 100)
    : 0;
  const allLessons = HANDBOOK_LEARNING_MODULES.flatMap((item) => item.lessons);
  const totalCompletedCount = allLessons.filter((lesson) => completed.has(lesson.id)).length;
  const totalProgressPercent = allLessons.length
    ? Math.round((totalCompletedCount / allLessons.length) * 100)
    : 0;

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

  const isFirstLesson = moduleIndex === 0 && activeIndex === 0;
  const isLastLesson = module.lessons.length > 0
    && moduleIndex === HANDBOOK_LEARNING_MODULES.length - 1
    && activeIndex === module.lessons.length - 1;

  const markCompleted = () => {
    if (!activeLesson || completed.has(activeLesson.id)) return;
    setProgress({
      completedLessonIds: [...new Set([...progress.completedLessonIds, activeLesson.id])],
    });
  };

  const goPrevious = () => {
    if (module.lessons.length === 0) {
      const previousModuleIndex = moduleIndex - 1;
      if (previousModuleIndex >= 0) {
        setModuleIndex(previousModuleIndex);
        setActiveIndex(Math.max(0, HANDBOOK_LEARNING_MODULES[previousModuleIndex].lessons.length - 1));
      }
    } else if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (moduleIndex > 0) {
      const previousModuleIndex = moduleIndex - 1;
      setModuleIndex(previousModuleIndex);
      setActiveIndex(Math.max(0, HANDBOOK_LEARNING_MODULES[previousModuleIndex].lessons.length - 1));
    }
    scrollToLesson();
  };

  const goNext = () => {
    markCompleted();
    if (module.lessons.length === 0) {
      if (moduleIndex < HANDBOOK_LEARNING_MODULES.length - 1) {
        setModuleIndex(moduleIndex + 1);
        setActiveIndex(0);
      }
    } else if (activeIndex < module.lessons.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (moduleIndex < HANDBOOK_LEARNING_MODULES.length - 1) {
      setModuleIndex(moduleIndex + 1);
      setActiveIndex(0);
    }
    scrollToLesson();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> {translate(language, "learning.back")}
        </button>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {translate(language, "learning.courseProgress")}: {totalCompletedCount}/{allLessons.length} ({totalProgressPercent}%)
          </span>
          <span>{translate(language, "learning.moduleProgress")}: {completedCount}/{module.lessons.length} ({progressPercent}%)</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground">{getModuleTitle(language, module.id, module.title)}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {translate(language, "learning.description")}
        </p>
      </div>

      <nav
        aria-label={language === "en" ? "Module and lesson navigation" : "Навигация по модулям и темам"}
        className="sticky top-2 z-20 rounded-2xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur"
      >
        <div className="flex items-center gap-2 mb-3">
          <PanelTop className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{translate(language, "learning.quickNavigation")}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" role="group" aria-label={translate(language, "learning.moduleChoice")}>
          {HANDBOOK_LEARNING_MODULES.map((item, index) => {
            const isActive = index === moduleIndex;
            const itemCompleted = item.lessons.filter((lesson) => completed.has(lesson.id)).length;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "step" : undefined}
                aria-controls="learning-module-content"
                onClick={() => selectModule(index)}
                className={isActive
                  ? "min-w-0 w-full rounded-lg border border-primary bg-primary/10 px-2.5 py-2 text-left text-[11px] font-semibold leading-tight text-primary"
                  : "min-w-0 w-full rounded-lg border border-border px-2.5 py-2 text-left text-[11px] leading-tight text-muted-foreground hover:bg-muted/30"}
              >
                <span className="block">{getModuleTitle(language, item.id, item.title)}</span>
                <span className="mt-0.5 block text-[10px] opacity-80">{itemCompleted}/{item.lessons.length} {translate(language, "learning.studied")}</span>
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
                  aria-label={`${language === "en" ? "Go to lesson" : "Перейти к теме"} ${index + 1}: ${getLearningLessonTitle(lesson, language)}`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => selectLesson(index)}
                  className={isActive
                    ? "flex min-w-8 h-8 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"
                    : isCompleted
                      ? "flex min-w-8 h-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-2 text-xs font-semibold text-primary"
                      : "flex min-w-8 h-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 px-2 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"}
                  title={getLearningLessonTitle(lesson, language)}
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

      <article
        ref={lessonArticleRef}
        id="learning-module-content"
        data-active-lesson-id={activeLesson?.id ?? module.id}
        className="bg-card border border-border rounded-xl p-4 scroll-mt-24"
      >
        {activeLesson ? (
          <>
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">
                {translate(language, "learning.lesson")} {activeIndex + 1} {translate(language, "learning.of")} {module.lessons.length}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{getLearningLessonTitle(activeLesson, language)}</h3>
            </div>
            <div className="mt-3">
              <MarkdownView content={getLearningLessonContent(activeLesson, language)} compact extraCompactLists={activeLesson.id === "m1-01"} />
            </div>
            <div className="mt-4">
              <LearningInfographic mode="lesson" lesson={activeLesson} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{translate(language, "learning.noMaterials")}</p>
        )}

        <div className="flex flex-wrap justify-between gap-2 pt-4 mt-4 border-t border-border">
          <button
            type="button"
            onClick={goPrevious}
            disabled={isFirstLesson}
            aria-label={translate(language, "learning.goPrevious")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> {translate(language, "learning.previous")}
          </button>

          <button
            type="button"
            onClick={markCompleted}
            disabled={!activeLesson}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs"
          >
            <Check className="w-4 h-4" />
            {activeLesson && completed.has(activeLesson.id) ? translate(language, "learning.studiedLabel") : translate(language, "learning.markStudied")}
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={isLastLesson}
            aria-label={moduleIndex < HANDBOOK_LEARNING_MODULES.length - 1 && (module.lessons.length === 0 || activeIndex === module.lessons.length - 1)
              ? translate(language, "learning.goNextModule")
              : translate(language, "learning.goNextTopic")}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs disabled:opacity-40"
          >
            {(module.lessons.length === 0 || activeIndex === module.lessons.length - 1) && !isLastLesson ? translate(language, "learning.nextModule") : translate(language, "learning.nextTopic")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
