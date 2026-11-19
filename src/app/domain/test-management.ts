export interface TmsStep { action: string; expected: string }
export interface TmsCase {
 id: string; projectId: string; key: string; title: string; folder: string; preconditions: string; steps: TmsStep[];
 expected: string; priority: "P1" | "P2" | "P3"; type: string; tags: string[]; requirementIds: string[];
 createdAt: string; updatedAt: string; archived: boolean; version?: number; description?: string; testData?: string; postconditions?: string; automationStatus?: "not_automated" | "automated" | "candidate"; attachmentIds?: string[]; versions?: TmsCaseVersion[];
}
export interface TmsCaseVersion { version: number; savedAt: string; snapshot: Omit<TmsCase, "versions"> }
export interface TmsSuite { id: string; projectId: string; name: string; caseIds: string[]; createdAt: string; description?: string; parentId?: string; updatedAt?: string }
export interface TmsPlan { id: string; projectId: string; name: string; environment: string; suiteIds: string[]; caseIds: string[]; createdAt: string; release?: string; build?: string; objective?: string; risks?: string; owner?: string; startDate?: string; endDate?: string; entryCriteria?: string; exitCriteria?: string }
export interface TmsRunResult { status: "not_run" | "passed" | "failed" | "blocked" | "skipped"; actual: string; comment: string; defectId?: string; attachmentIds?: string[]; stepResults?: TmsStepResult[] }
export interface TmsStepResult { status: "not_run" | "passed" | "failed" | "blocked" | "skipped"; actual: string; comment: string; attachmentIds?: string[] }
export interface TmsCaseSnapshot { id: string; key: string; title: string; folder: string; preconditions: string; steps: TmsStep[]; expected: string; priority: "P1" | "P2" | "P3"; type: string; tags: string[]; requirementIds: string[]; version?: number; description?: string; testData?: string; postconditions?: string }
export interface TmsRun { id: string; projectId: string; planId: string; name: string; startedAt: string; completedAt?: string; results: Record<string, TmsRunResult>; caseSnapshots?: Record<string, TmsCaseSnapshot>; rerunOf?: string }
export type TmsDefectStatus = "new" | "open" | "in_progress" | "fixed" | "retest" | "closed" | "reopened" | "rejected";
export interface TmsDefectComment { id: string; author: string; body: string; createdAt: string }
export interface TmsDefectHistory { id: string; field: string; from: string; to: string; actor: string; changedAt: string }
export interface TmsDefect { id: string; projectId: string; key: string; title: string; caseId?: string; caseIds?: string[]; severity: "blocker" | "critical" | "major" | "minor"; priority: "P1" | "P2" | "P3"; status: TmsDefectStatus; createdAt: string; updatedAt?: string; description?: string; steps?: string[]; expected?: string; actual?: string; environment?: string; assignee?: string; reporter?: string; labels?: string[]; attachmentIds?: string[]; runId?: string; comments?: TmsDefectComment[]; history?: TmsDefectHistory[] }
export interface TmsRequirement { id: string; projectId: string; key: string; title: string; description: string; acceptanceCriteria: string; priority: "P1" | "P2" | "P3"; status: "draft" | "approved" | "implemented" | "verified" | "deprecated"; createdAt: string; updatedAt: string }
export interface TmsData { version: 1; projectId?: string; cases: TmsCase[]; suites: TmsSuite[]; plans: TmsPlan[]; runs: TmsRun[]; defects: TmsDefect[]; requirements?: TmsRequirement[] }
export interface TmsCollection { id: string; name: string; description: string; cases: Omit<TmsCase, "id" | "projectId" | "key" | "createdAt" | "updatedAt" | "archived">[] }
const make = (title: string, folder: string, priority: TmsCase["priority"], preconditions: string, actions: string[], expected: string, tags: string[] = []): TmsCollection["cases"][number] =>
 ({ title, folder, priority, preconditions, steps: actions.map((action) => ({ action, expected })), expected, type: "Functional", tags, requirementIds: [] });
export const TMS_COLLECTIONS: TmsCollection[] = [
 { id: "smoke", name: "Smoke / критический путь", description: "Доступность приложения и основные пользовательские потоки.", cases: [
  make("Приложение открывается", "Smoke", "P1", "Сборка развернута", ["Открыть приложение", "Дождаться главного экрана"], "Главный экран загружен без критических ошибок", ["smoke"]),
  make("Основной пользовательский сценарий", "Smoke", "P1", "Есть тестовая учётная запись", ["Войти", "Выполнить ключевое действие", "Проверить результат"], "Основной сценарий завершён успешно", ["smoke"]),
  make("Выход из учётной записи", "Smoke", "P1", "Пользователь авторизован", ["Нажать «Выйти»", "Обновить страницу"], "Сессия завершена, защищённые данные недоступны", ["smoke","security"])
 ]},
 { id: "auth", name: "Авторизация и регистрация", description: "Позитивные, негативные и граничные сценарии.", cases: [
  make("Вход с корректными данными", "Авторизация", "P1", "Есть активная учётная запись", ["Ввести корректный email и пароль", "Нажать «Войти»"], "Пользователь авторизован", ["auth","positive"]),
  make("Вход с неверным паролем", "Авторизация", "P1", "Есть активная учётная запись", ["Ввести неверный пароль", "Нажать «Войти»"], "Вход отклонён, показано безопасное сообщение", ["auth","negative"]),
  make("Пустые обязательные поля", "Авторизация", "P1", "Открыта форма входа", ["Оставить поля пустыми", "Отправить форму"], "Показана валидация, запрос не отправляется", ["auth"]),
  make("Восстановление пароля", "Авторизация", "P2", "Есть зарегистрированный email", ["Открыть восстановление", "Ввести email", "Отправить"], "Показано подтверждение отправки инструкции", ["auth"])
 ]},
 { id: "forms", name: "Формы и валидация", description: "Обязательность, форматы, длины, границы и ошибки.", cases: [
  make("Обязательное поле", "Формы", "P1", "Открыта форма", ["Оставить обязательное поле пустым", "Отправить"], "Показана ошибка, запись не создана", ["forms"]),
  make("Граничная длина", "Формы", "P2", "Известны min/max длины поля", ["Ввести min", "Ввести max", "Ввести значение за границей"], "Границы обработаны согласно требованиям", ["forms","boundary"]),
  make("Данные при ошибке сервера", "Формы", "P1", "Форма заполнена", ["Сымитировать серверную ошибку", "Повторно открыть форму"], "Введённые данные не теряются либо поведение соответствует требованиям", ["forms"])
 ]},
 { id: "crud", name: "CRUD и управление данными", description: "Создание, чтение, изменение, удаление, права и целостность.", cases: [
  make("Создание записи", "CRUD", "P1", "Есть право на создание", ["Открыть форму", "Заполнить поля", "Сохранить"], "Запись создана и отображается", ["crud"]),
  make("Редактирование записи", "CRUD", "P1", "Существует запись", ["Открыть запись", "Изменить поле", "Сохранить"], "Изменения сохранены после обновления", ["crud"]),
  make("Удаление с подтверждением", "CRUD", "P1", "Есть тестовая запись", ["Нажать «Удалить»", "Подтвердить"], "Запись удалена, связанные данные обработаны", ["crud"]),
  make("Операция без прав", "CRUD", "P1", "У пользователя нет нужной роли", ["Попытаться выполнить защищённую операцию"], "Операция запрещена, данные не изменены", ["crud","security"])
 ]},
 { id: "search", name: "Поиск, фильтры и таблицы", description: "Поиск, сортировка, фильтрация, пагинация и пустые состояния.", cases: [
  make("Поиск точного значения", "Поиск", "P2", "Есть известная запись", ["Ввести точное значение"], "Отображается ожидаемая запись", ["search"]),
  make("Поиск без результатов", "Поиск", "P2", "Открыт список", ["Ввести отсутствующее значение"], "Показано корректное пустое состояние", ["search"]),
  make("Фильтрация и сортировка", "Таблицы", "P2", "Есть записи с разными значениями", ["Применить фильтр", "Изменить сортировку"], "Результат соответствует обоим условиям", ["search"]),
  make("Пагинация", "Таблицы", "P2", "Записей больше размера страницы", ["Перейти вперёд", "Вернуться назад"], "Нет пропусков и дубликатов", ["pagination"])
 ]},
 { id: "api", name: "API: базовый контракт", description: "HTTP-коды, схема ответа, авторизация и негативные проверки.", cases: [
  make("Успешный GET", "API", "P1", "Endpoint доступен", ["Отправить GET на валидный endpoint"], "Статус и тело соответствуют контракту", ["api"]),
  make("Отсутствующий токен", "API", "P1", "Endpoint защищён", ["Отправить запрос без Authorization"], "Получен ожидаемый 401/403", ["api","security"]),
  make("Невалидное тело запроса", "API", "P1", "Endpoint принимает JSON", ["Отправить неверный тип или пропустить поле"], "Возвращена документированная ошибка валидации", ["api"]),
  make("Повтор запроса", "API", "P2", "Известна семантика повторов", ["Отправить одинаковый запрос дважды"], "Нет нежелательных побочных эффектов", ["api","idempotency"])
 ]},
 { id: "mobile", name: "Мобильное приложение", description: "Жизненный цикл, сеть, прерывания, разрешения и совместимость.", cases: [
  make("Возврат из фона", "Mobile", "P1", "Открыт заполненный экран", ["Перевести приложение в фон", "Вернуться"], "Состояние восстановлено согласно требованиям", ["mobile"]),
  make("Потеря и восстановление сети", "Mobile", "P1", "Открыто приложение", ["Отключить сеть", "Выполнить действие", "Включить сеть"], "Ошибка/повтор обработаны корректно, данные не повреждены", ["mobile"]),
  make("Отказ в разрешении", "Mobile", "P2", "Функция запрашивает разрешение", ["Отклонить разрешение", "Повторить вызов"], "Показано объяснение, приложение не падает", ["mobile"])
 ]},
 { id: "security", name: "Безопасность и доступы", description: "Авторизация, доступ к данным, ввод и сессии.", cases: [
  make("Доступ к чужому объекту", "Безопасность", "P1", "Есть два пользователя", ["Войти пользователем A", "Запросить объект пользователя B"], "Доступ запрещён, данные не раскрыты", ["security"]),
  make("XSS в пользовательском вводе", "Безопасность", "P1", "Есть поле с отображением ввода", ["Ввести тестовый XSS payload", "Открыть отображение"], "Ввод экранируется, скрипт не исполняется", ["security"]),
  make("Завершение сессии", "Безопасность", "P1", "Пользователь авторизован", ["Завершить сессию", "Повторить защищённый запрос"], "Старая сессия не предоставляет доступ", ["security"])
 ]},
 { id: "accessibility", name: "Доступность и UX", description: "Клавиатура, фокус, подписи, контраст и обратная связь.", cases: [
  make("Навигация клавиатурой", "Доступность", "P2", "Открыта форма", ["Перемещаться Tab", "Активировать элементы клавиатурой"], "Фокус видим, порядок логичен", ["a11y"]),
  make("Доступные имена элементов", "Доступность", "P2", "Открыт экран с формами", ["Проверить accessibility tree"], "У элементов есть понятные доступные имена", ["a11y"]),
  make("Масштабирование до 200%", "UX", "P2", "Открыто приложение", ["Увеличить масштаб", "Проверить основные сценарии"], "Контент доступен без обрезания", ["a11y"])
 ]},
 { id: "regression", name: "Регрессионный набор", description: "Повторяемые проверки перед выпуском версии.", cases: [
  make("Регрессия основного потока", "Регрессия", "P1", "Подготовлено тестовое окружение", ["Выполнить основной сценарий"], "Ключевая функциональность работает", ["regression"]),
  make("Сохранение данных после обновления", "Регрессия", "P1", "Есть сохранённые данные", ["Обновить страницу", "Проверить данные"], "Данные сохранены без дублирования", ["regression"]),
  make("Критические интеграции", "Регрессия", "P1", "Интеграции настроены", ["Выполнить ключевой сценарий каждой интеграции"], "Обмен данными работает корректно", ["regression"])
 ]}
];
