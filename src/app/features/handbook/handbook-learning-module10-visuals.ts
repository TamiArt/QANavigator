import { GitBranch, Github, Terminal } from "lucide-react";
import type { LessonVisual } from "./handbook-learning-visual-types";

const V = (
  kind: LessonVisual["kind"],
  labels: string[],
  icon: LessonVisual["icon"],
  accent: LessonVisual["accent"],
  cards: LessonVisual["cards"],
  callout?: string,
): LessonVisual => ({ kind, labels, icon, accent, cards, callout });

export const MODULE_10_LESSON_VISUALS: Partial<Record<string, LessonVisual>> = {
  "m10-01": V("flow", ["Working tree", "Staging", "Commit", "Remote"], GitBranch, "blue", [
    { title: "Git", text: "Распределённая система контроля версий: фиксирует историю и помогает сравнивать изменения." },
    { title: "Ежедневный цикл", text: "status → diff → add → commit → push. Сначала проверяй состояние и выбранные файлы." },
    { title: "Ветки", text: "switch, merge и rebase помогают вести параллельную разработку; конфликты решают осознанно." },
  ], "Commit сохраняет локальную историю; push отправляет коммиты на remote."),
  "m10-02": V("flow", ["Repository", "Branch", "Pull Request", "Review", "CI", "Merge"], Github, "lavender", [
    { title: "GitHub", text: "Платформа совместной работы с Git-репозиториями, задачами, review и автоматизацией." },
    { title: "Pull Request", text: "Запрос на проверку и включение изменений в целевую ветку; открытый PR ещё не означает merge." },
    { title: "QA", text: "Проверь diff, source/target branches, CI, замечания review и тестовое покрытие." },
  ], "Git управляет версиями; GitHub организует совместную работу вокруг репозитория."),
  "m10-03": V("layers", ["Навигация", "Файлы", "Поиск", "Логи", "Пайпы", "Тесты"], Terminal, "mint", [
    { title: "Навигация", text: "pwd, ls, cd, mkdir — найти проект и нужную папку." },
    { title: "Файлы и поиск", text: "cat, less, head, tail, grep, find, wc, diff — изучить файлы и логи." },
    { title: "Автоматизация", text: "Pipe, >, >>, && и код завершения помогают соединять команды и проверять результат." },
  ], "Перед изменением или удалением проверь текущую папку и аргументы команды."),
};