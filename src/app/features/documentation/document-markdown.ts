export interface TestCaseDocument {
  tcId: string; title: string; module: string; preconditions: string; steps: string;
  expected: string; actualResult: string; priority: string; severity: string; status: string;
  author: string; date: string; testData: string;
}

export function buildTestCaseMarkdown(doc: TestCaseDocument): string {
  return [
    "# Тест-кейс " + doc.tcId, "",
    "**Название:** " + (doc.title || "—"),
    "**Модуль/Функция:** " + (doc.module || "—"),
    "**Приоритет:** " + doc.priority + " | **Серьёзность:** " + doc.severity,
    "**Статус:** " + doc.status + " | **Автор:** " + (doc.author || "—") + " | **Дата:** " + doc.date, "",
    "## Предусловия *", doc.preconditions || "—", "",
    "## Тестовые данные", doc.testData || "—", "",
    "## Шаги воспроизведения *", doc.steps || "—", "",
    "## Ожидаемый результат *", doc.expected || "—", "",
    "## Фактический результат", doc.actualResult || "Заполняется при выполнении",
  ].join("\n");
}
