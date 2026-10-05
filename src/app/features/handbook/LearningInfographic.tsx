import * as React from "react";
import {
  AlertTriangle, ArrowDown, ArrowRight, BookOpen, Boxes, Bug,
  CheckCircle2, ClipboardCheck, Cloud, Code2, Database, FileText, GitBranch,
  Globe, Layers3, ListChecks, Network, PlayCircle, Route, Server, ShieldCheck,
  Target, TestTube2, Users, Workflow, Zap,
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

type VisualCard = {
  title: string;
  text: string;
};

type LessonVisual = {
  kind: VisualKind;
  labels: string[];
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  cards: VisualCard[];
  callout?: string;
};

const V = (
  kind: VisualKind,
  labels: string[],
  icon: LessonVisual["icon"],
  accent: Accent,
  cards: VisualCard[],
  callout?: string,
): LessonVisual => ({ kind, labels, icon, accent, cards, callout });

/**
 * One visual model per Learning Mode lesson.
 * This is presentation metadata only: lesson source text, IDs and curriculum order stay untouched.
 */
const LESSON_VISUALS: Record<string, LessonVisual> = {
  "m1-01": V("flow", ["Цель", "Проверка", "Результат"], TestTube2, "blue", [
    { title: "Цель", text: "Получить информацию о качестве продукта." },
    { title: "Проверка", text: "Сопоставить фактическое поведение с ожидаемым." },
    { title: "Результат", text: "Найти дефекты и дать команде обратную связь." },
  ], "Тестирование — не только поиск багов, а получение информации о качестве."),
  "m1-02": V("compare", ["QA", "QC", "Testing"], ShieldCheck, "lavender", [
    { title: "QA", text: "Предотвращение проблем через процессы и практики качества." },
    { title: "QC", text: "Контроль качества результата продукта." },
    { title: "Testing", text: "Практическое исследование продукта для обнаружения проблем." },
  ], "QA — шире процесса тестирования; Testing — часть работы с качеством."),
  "m1-03": V("checklist", ["7 принципов", "Риск", "Раннее тестирование", "Контекст", "Качество"], ListChecks, "mint", [
    { title: "1. Тестирование показывает наличие дефектов, но не их отсутствие", text: "Тесты обнаруживают наличие дефектов, но не доказывают, что дефектов нет. Даже «всё зелёное» ≠ доказательство идеального продукта." },
    { title: "2. Исчерпывающее тестирование недостижимо", text: "Полный перебор входов и условий практически невозможен. Фокусируемся на рисках, приоритетах и техниках тест-дизайна." },
    { title: "3. Раннее тестирование", text: "Начинаем тестовые активности как можно раньше: ранняя проверка снижает стоимость исправлений. Shift-Left." },
    { title: "4. Скопление дефектов", text: "Небольшое число модулей часто содержит большую часть найденных дефектов. Эти зоны важны для риск-ориентированного тестирования." },
    { title: "5. Парадокс пестицида", text: "Одинаковые тесты со временем перестают находить новые дефекты. Обновляй и разнообразь набор проверок." },
    { title: "6. Тестирование зависит от контекста", text: "Нет универсального набора тестов: подход зависит от продукта, рисков, требований, среды и целей." },
    { title: "7. Заблуждение об отсутствии дефектов", text: "Отсутствие найденных дефектов не означает, что продукт полезен или соответствует потребностям. Проверяем и отсутствие дефектов, и пригодность результата." },
  ], "7 принципов — это карта решений: что проверять, когда начинать, где искать риск и почему «без багов» ещё не означает «качественно»."),
  "m1-04": V("compare", ["Верификация", "Валидация", "Продукт"], CheckCircle2, "yellow", [
    { title: "Верификация", text: "Проверяем, правильно ли создаём продукт по заданным требованиям." },
    { title: "Валидация", text: "Проверяем, подходит ли созданный продукт пользователю и его задаче." },
    { title: "Главный вопрос", text: "«Правильно ли построили?» vs «То ли построили?»" },
  ]),
  "m1-05": V("flow", ["Потребность", "Требование", "Проверка"], FileText, "blue", [
    { title: "Потребность", text: "Что нужно бизнесу или пользователю?" },
    { title: "Требование", text: "Формализуем ожидаемое поведение продукта." },
    { title: "Проверка", text: "Требование должно быть однозначным и тестируемым." },
  ], "Хорошее требование задаёт проверяемый результат."),
  "m1-06": V("cycle", ["Требования", "Дизайн", "Разработка", "Тестирование", "Релиз"], Workflow, "mint", [
    { title: "Идея → требования", text: "Определяем, что и зачем должен делать продукт." },
    { title: "Дизайн → разработка", text: "Проектируем решение и реализуем его." },
    { title: "Тестирование", text: "Проверяем реализованную функциональность." },
    { title: "Релиз", text: "Доставляем результат пользователю." },
  ], "SDLC описывает жизненный путь продукта от идеи до релиза."),
  "m1-07": V("cycle", ["Анализ", "Планирование", "Тест-дизайн", "Выполнение", "Завершение"], Route, "lavender", [
    { title: "Анализ", text: "Изучаем требования и объём тестирования." },
    { title: "Планирование", text: "Определяем подход, ресурсы, сроки и риски." },
    { title: "Тест-дизайн", text: "Готовим сценарии, данные и проверки." },
    { title: "Выполнение → завершение", text: "Запускаем тесты, работаем с дефектами и подводим итоги." },
  ], "STLC — жизненный цикл именно тестирования внутри разработки."),
  "m1-08": V("compare", ["Severity", "Priority", "Решение"], AlertTriangle, "pink", [
    { title: "Severity", text: "Насколько сильно дефект влияет на систему или пользователя." },
    { title: "Priority", text: "Насколько срочно дефект нужно исправить." },
    { title: "Решение", text: "Высокое влияние и высокая срочность не всегда совпадают." },
  ], "Severity = сила воздействия. Priority = срочность исправления."),
  "m1-09": V("network", ["Объект и цель", "Знание системы", "Момент", "Код", "Автоматизация", "Сценарий", "Формализация", "Уровень"], Layers3, "blue", [
    { title: "Что проверяем?", text: "Функциональное и нефункциональное тестирование." },
    { title: "Как знаем систему?", text: "Black-box, Gray-box, White-box." },
    { title: "Когда проверяем?", text: "Smoke, Sanity, Regression, Re-test и другие циклы." },
    { title: "Как выполняем?", text: "Static/Dynamic, Manual/Automated, Positive/Negative." },
    { title: "Как оформляем?", text: "Scripted, Exploratory, Ad hoc." },
    { title: "Какой масштаб?", text: "Unit, Integration, System, Acceptance." },
  ], "Классификации пересекаются: один тест может одновременно иметь несколько характеристик."),
  "m1-10": V("pyramid", ["Unit", "Integration", "System", "E2E"], Boxes, "mint", [
    { title: "Unit", text: "Много быстрых локальных проверок отдельных частей." },
    { title: "Integration", text: "Проверяем взаимодействие компонентов." },
    { title: "System", text: "Проверяем систему как целое." },
    { title: "E2E", text: "Проверяем полный пользовательский сценарий." },
  ], "Чем выше уровень, тем шире охват и обычно дороже проверка."),
  "m1-11": V("network", ["Эквивалентные классы", "Границы", "Pairwise", "Decision Table", "State Transition"], Target, "orange", [
    { title: "Разбить пространство", text: "Эквивалентное разбиение уменьшает число похожих проверок." },
    { title: "Проверить границы", text: "BVA концентрируется около граничных значений." },
    { title: "Сочетать параметры", text: "Pairwise покрывает пары взаимодействующих значений." },
    { title: "Моделировать правила", text: "Decision Table и State Transition переводят логику в проверяемые комбинации и переходы." },
  ], "Тест-дизайн отвечает на вопрос: какие проверки дадут максимальную ценность при разумном объёме?"),

  "m2-01": V("layers", ["Frontend", "Backend", "Middleware", "Инфраструктура"], Layers3, "blue", [
    { title: "Frontend", text: "HTML, CSS, JavaScript/TypeScript, React/Vue — то, что видит пользователь." },
    { title: "Backend", text: "Серверная логика, языки программирования, базы данных и кэш." },
    { title: "Middleware", text: "Связывает части системы; пример — Kafka." },
    { title: "Инфраструктура", text: "Git/GitLab, Jira, Docker и среда запуска." },
  ], "Стек — карта технологий, из которых собран и на которых работает проект."),
  "m2-02": V("network", ["Product", "Business Analyst", "Design", "Development", "QA", "Project"], Users, "lavender", [
    { title: "Product", text: "Ценность продукта, пользователи, цели и приоритеты." },
    { title: "Analysis & Design", text: "Потребности бизнеса, требования, UX и UI." },
    { title: "Development & QA", text: "Реализация, качество, тестирование и предотвращение дефектов." },
    { title: "Project", text: "Сроки, ресурсы, процесс и устранение блокеров." },
  ], "Product отвечает «что и зачем», Project — «как и когда»."),
  "m2-03": V("timeline", ["Waterfall", "V-Model", "Iterative", "Spiral", "Agile", "Scrum", "Kanban"], Workflow, "mint", [
    { title: "Waterfall", text: "Последовательные этапы; изменения поздно обходятся дороже." },
    { title: "V-Model", text: "Этапам разработки заранее соответствуют уровни тестирования." },
    { title: "Iterative / Spiral", text: "Повторяющиеся циклы; Spiral дополнительно фокусируется на рисках." },
    { title: "Agile", text: "Короткие циклы и адаптация к изменениям; Scrum и Kanban — подходы из этого семейства." },
  ], "Shift-Left сдвигает тестирование ближе к требованиям и дизайну."),
  "m2-04": V("cycle", ["Planning", "Daily", "Development", "Review", "Retrospective"], Workflow, "yellow", [
    { title: "Роли", text: "Product Owner, Scrum Master, Developers / cross-functional team." },
    { title: "Артефакты", text: "Product Backlog → Sprint Backlog → Increment." },
    { title: "События", text: "Planning → Daily Scrum → Review → Retrospective." },
    { title: "DoR / DoD", text: "Ready — задача подготовлена; Done — согласованные условия готовности выполнены." },
  ], "Scrum превращает работу бэклога в готовый инкремент внутри фиксированного спринта."),
  "m2-05": V("timeline", ["Planning", "Execution", "Review", "Retrospective"], Route, "blue", [
    { title: "Зачем?", text: "Цель и ценность спринта." },
    { title: "Что?", text: "Задачи, необходимые для достижения цели." },
    { title: "Как?", text: "Декомпозиция и план выполнения командой." },
    { title: "QA", text: "Учитывает тестирование, автоматизацию и Acceptance Criteria." },
  ], "Спринт заканчивается работающим и протестированным инкрементом."),
  "m2-06": V("compare", ["Сложность", "Объём", "Риск", "Оценка"], Target, "orange", [
    { title: "Story Points", text: "Относительная оценка сложности, объёма и неопределённости." },
    { title: "Planning Poker", text: "Команда независимо выбирает оценки и обсуждает расхождения." },
    { title: "Velocity", text: "Количество Story Points, выполненных командой за итерацию." },
  ], "Story Points — не часы и не дни."),
  "m2-07": V("cycle", ["Собрать факты", "Обсудить", "Выбрать улучшение", "Действовать"], PlayCircle, "mint", [
    { title: "Что было хорошо?", text: "Практики, которые стоит сохранить." },
    { title: "Что мешало?", text: "Проблемы процесса без поиска виноватых." },
    { title: "Что меняем?", text: "Конкретное улучшение на следующий цикл." },
  ], "Ретроспектива превращает опыт команды в действие."),
  "m2-08": V("flow", ["Видео", "Наблюдение", "Конспект", "Закрепление"], PlayCircle, "lavender", [
    { title: "Видео", text: "Урок содержит видеоматериал, а не текстовый конспект." },
    { title: "Наблюдение", text: "Смотри на роли, события, артефакты и реальный ход Scrum." },
    { title: "Конспект", text: "После просмотра выпиши 3–5 ключевых идей своими словами." },
    { title: "Закрепление", text: "Сверь новые наблюдения с текстовыми темами Scrum в этом модуле." },
  ], "Для этого урока визуальная шпаргалка не придумывает содержание, которого нет в текстовом источнике."),

  "m2-09": V("compare", ["Видео", "Waterfall", "Agile", "Scrum", "Kanban"], PlayCircle, "yellow", [
    { title: "Видео", text: "Урок содержит видеоматериал, а не текстовый конспект." },
    { title: "Смотри на различия", text: "Во время просмотра фиксируй: последовательность, гибкость, роли, поток работы и точки контроля." },
    { title: "Свяжи с модулем", text: "Сопоставь услышанное с Waterfall, Agile, Scrum и Kanban из текстовых тем." },
  ], "Инфографика показывает способ работы с видео, не подменяя отсутствующий текст выдуманными фактами."),

  "m2-10": V("flow", ["Backlog", "In Progress", "Done"], Route, "blue", [
    { title: "Backlog", text: "Задачи ожидают приоритизации и взятия в работу." },
    { title: "In Progress", text: "Команда выполняет ограниченное число задач." },
    { title: "Done", text: "Задача завершена по согласованным критериям." },
  ], "Kanban визуализирует поток и помогает управлять WIP."),
  "m2-11": V("compare", ["Scrum", "Kanban", "Scrumban", "Kanplan"], GitBranch, "pink", [
    { title: "Scrum", text: "Фиксированные спринты, роли и события." },
    { title: "Kanban", text: "Непрерывный поток и WIP-лимиты." },
    { title: "Scrumban", text: "Гибрид Scrum и Kanban." },
    { title: "Kanplan", text: "Kanban-поток с регулярным управлением и приоритизацией бэклога." },
  ]),
  "m2-12": V("network", ["Тип компании", "Контекст", "QA"], Globe, "orange", [
    { title: "Источник", text: "Текстового конспекта для этого урока сейчас нет." },
    { title: "Не выдумываем", text: "Инфографика не добавляет определения типов компаний, которых нет в источнике." },
    { title: "Что закреплять", text: "Используй заголовок темы как точку входа, а содержание добавляй после появления исходного материала." },
  ], "Визуальная шпаргалка должна отражать источник, а не заполнять пробелы предположениями."),

  "m3-01": V("flow", ["Клик", "Frontend", "API", "Backend", "Ответ", "UI"], Network, "blue", [
    { title: "Frontend", text: "UI собирает ввод пользователя и показывает ответ сервера: кнопки, формы, меню." },
    { title: "API", text: "Контракт обмена: Frontend отправляет запрос с данными, Backend возвращает ответ." },
    { title: "Backend", text: "Обрабатывает данные, безопасность и бизнес-логику; работает с хранилищем." },
    { title: "QA: где искать", text: "Нет запроса → Frontend; 500/Pending → Backend/инфраструктура; 200, но UI не обновился → Frontend; 400 → запрос/контракт." },
  ], "Клик → Frontend → API → Backend → ответ → обновление UI. Network помогает быстро определить слой проблемы."),

  "m3-02": V("layers", ["Dev", "QA/Stage", "Integration", "Preprod", "Prod"], Server, "lavender", [
    { title: "Dev", text: "Разработка, сборка и первичная отладка." },
    { title: "QA / Stage", text: "Основная проверка QA на выделенном стенде." },
    { title: "Integration", text: "Проверяем взаимодействие сервисов и модулей." },
    { title: "Preprod", text: "Финальная репетиция в окружении, максимально близком к Production." },
    { title: "Production", text: "Рабочая система с реальными пользователями и данными." },
    { title: "Правило QA", text: "Фиксируй стенд; учитывай различия конфигурации/данных; на Prod действуй особенно осторожно." },
  ], "Dev → QA/Stage → Integration → Preprod → Prod. Окружение меняет риск и контекст проверки."),

  "m3-03": V("compare", ["UI", "Логика", "UX", "Совместимость", "Figma"], Globe, "mint", [
    { title: "Внешний вид", text: "UI-элементы, вёрстка, адаптивность, анимации." },
    { title: "Логика", text: "Формы, валидация, навигация, роутинг и динамические элементы." },
    { title: "Работоспособность", text: "Браузеры, скорость загрузки и доступность." },
    { title: "Макет", text: "Сверяем Figma: шрифты, цвета, размеры, отступы и расположение." },
  ], "Frontend проверяем не только «красиво ли», но и работает ли пользовательский сценарий."),

  "m3-04": V("checklist", ["Элементы", "Состояния", "Визуал", "Функции", "Валидация", "Совместимость", "UX"], ClipboardCheck, "yellow", [
    { title: "Элементы + состояния", text: "Поля, чекбоксы, radio, кнопки, иконки, ссылки; active/disabled, empty/filled, visible/hidden, hover/focus." },
    { title: "Визуал", text: "Макет, единообразие, шрифты, отступы и тексты." },
    { title: "Функции", text: "Кнопки, формы, переключатели и ожидаемое взаимодействие." },
    { title: "Валидация", text: "Пустой ввод, спецсимволы, формат, длина, допустимые значения и понятные ошибки." },
    { title: "Совместимость + UX", text: "Браузеры, ОС, разные экраны, загрузка, клавиатура и предупреждения о несохранённых данных." },
    { title: "Регистрация", text: "Фокус работает; обязательные поля проверяются; повторная отправка не создаёт некорректные дубликаты/состояния." },
  ], "GUI = визуал + функциональность + валидация + совместимость + UX."),

  "m3-05": V("layers", ["HTML", "DOM", "Attributes", "DevTools"], Code2, "blue", [
    { title: "HTML", text: "Каркас страницы: заголовки, текст, изображения, формы, кнопки. Браузер строит из него DOM." },
    { title: "Input", text: "text, password, checkbox, radio, file, submit; HTML5 также email, tel, number, date, url, color, range." },
    { title: "Button / Form", text: "button: submit/reset/button; form: action/method для отправки данных." },
    { title: "Атрибуты", text: "required — обязательное поле; hidden — скрытое техническое значение." },
    { title: "QA", text: "DevTools помогает проверить реальную структуру, атрибуты, семантику и поведение элемента." },
  ], "HTML = структура. DOM = фактическое дерево. Атрибуты = свойства и поведение."),

  "m3-06": V("layers", ["Внешний вид", "Подключение", "Responsive", "States", "Accessibility"], Boxes, "lavender", [
    { title: "CSS", text: "Управляет цветами, размерами, отступами, шрифтами и расположением HTML-элементов." },
    { title: "Подключение", text: "Внешний <link>, внутренний <style> или inline-атрибут style." },
    { title: "UI-проверки", text: "Макет, шрифты, цвета, отступы, фон, изображения и отсутствие визуальных регрессий." },
    { title: "Responsive", text: "Проверяем разные ширины, адаптивность и кросс-браузерность." },
    { title: "States + доступность", text: "Hover, focus и другие состояния; читаемость и доступность; учитываем проблемы загрузки CSS." },
  ], "CSS = внешний вид и расположение. QA проверяет его влияние на UI, адаптивность, доступность и регрессии."),

  "m3-07": V("network", ["F12", "Elements", "Console", "Network", "HTTP", "Изоляция"], Globe, "orange", [
    { title: "Открыть", text: "Windows: F12 / Ctrl+Shift+I. macOS: Cmd+Option+I." },
    { title: "Elements", text: "HTML, DOM, CSS, стили и фактическое состояние элементов." },
    { title: "Console", text: "JavaScript-ошибки и диагностические сообщения." },
    { title: "Network", text: "Запросы, ответы, статусы, время и данные; 1xx info, 2xx success, 3xx redirect, 4xx client, 5xx server." },
    { title: "Локализация", text: "Кнопка не реагирует → Network → Console → Elements (DOM/CSS/перекрытие/pointer-events) → другой браузер/инкогнито." },
  ], "DevTools — основной диагностический инструмент: Network → Console → Elements → изоляция проблемы."),

  "m4-01": V("layers", ["Стратегия", "План", "Кейс", "RTM", "Данные", "Баг", "Отчёт"], FileText, "blue", [
    { title: "Что фиксирует", text: "Что и как тестировать, цели, критерии успеха, процесс, ответственность и условия завершения." },
    { title: "Основные артефакты", text: "Test Strategy, Test Plan, Test Case, Test Scenario, RTM, Test Data, Bug Report, Test Report." },
    { title: "Стратегия vs План", text: "Стратегия = общий подход «как тестируем вообще»; План = конкретно кто, что, когда, ресурсы." },
    { title: "Польза", text: "Прозрачность, распределение ответственности, воспроизводимость и контроль критериев успеха." },
  ], "Документация — карта тестирования: от общего подхода и плана до проверки, дефекта и итогового отчёта."),

  "m4-02": V("flow", ["Что", "Как", "Кто", "Успех", "Когда закончить"], ShieldCheck, "mint", [
    { title: "Что тестируем?", text: "Фиксируем объект проверки и границы." },
    { title: "Как тестируем?", text: "Сохраняем договорённости о подходе и процессе." },
    { title: "Кто отвечает?", text: "Ясно распределяем ответственность между участниками." },
    { title: "Успех и завершение", text: "Фиксируем критичность дефектов, критерии завершения и условия окончания работ." },
  ], "Документ превращает договорённости из переписки в воспроизводимый процесс."),

  "m4-03": V("timeline", ["Объект", "Цель", "Стратегия", "Entry/Exit", "Процедуры", "Ресурсы", "Риски"], ClipboardCheck, "lavender", [
    { title: "Объект + цель", text: "Что тестируем и зачем: например основные функции приложения и защита пользовательских данных." },
    { title: "Стратегия", text: "Функциональные проверки, совместимость, безопасность и выбранный подход." },
    { title: "Entry / Exit", text: "Entry: условия старта. Exit: условия завершения, например основные функции проверены и критических дефектов нет." },
    { title: "Процедуры", text: "Какие сценарии выполняем: создание, редактирование, удаление и другие проверки." },
    { title: "Ресурсы + среда", text: "Люди, устройства/ОС, симуляторы и тестовое окружение." },
    { title: "Риски", text: "Что может сорвать качество/сроки и как риск снизить дополнительными проверками." },
  ], "Test Plan отвечает: что, как, кто, где, когда начинаем и когда заканчиваем тестирование."),

  "m4-04": V("flow", ["Паспорт", "Инструкция", "Результат"], ListChecks, "yellow", [
    { title: "Паспорт", text: "ID, название, автор, Severity, Priority, тип, актуальность, ручной/авто, связи с задачами и требованиями." },
    { title: "Инструкция", text: "Preconditions → Steps → описание действия → Expected Result." },
    { title: "Результат", text: "Actual Result → Passed/Failed/Blocked/Skipped → Postconditions → Attachments → история изменений." },
    { title: "Зачем", text: "Воспроизводимость, регресс, системное покрытие и меньше риска забыть важный шаг." },
  ], "Хороший тест-кейс = паспорт + воспроизводимая инструкция + результат выполнения."),

  "m4-05": V("flow", ["Method", "Endpoint", "Request", "Response", "Business"], Network, "blue", [
    { title: "Что тестируем", text: "REST API, GraphQL, Kafka и другую серверную логику: данные, бизнес-правила, интеграции и ошибки." },
    { title: "Method + endpoint", text: "Всегда фиксируем HTTP-метод и ресурс: GET /users, POST /users, PUT /users/123." },
    { title: "Request → Response", text: "Описываем структуру запроса; проверяем ключевые поля, типы и ожидаемый HTTP-статус ответа." },
    { title: "Business + ошибки", text: "Проверяем бизнес-логику и предсказуемую обработку ошибок; например 401/409." },
  ], "API-кейс описывает контракт и бизнес-правила, а не только конкретные тестовые значения."),

  "m4-06": V("checklist", ["Пункт", "Результат", "Статус"], ListChecks, "mint", [
    { title: "Пункт", text: "Короткая формулировка проверки." },
    { title: "Результат", text: "Что получили при выполнении." },
    { title: "Статус", text: "Passed, Failed, Blocked или Skipped." },
  ], "Чек-лист удобен, когда подробные шаги не нужны."),
  "m4-07": V("compare", ["Test Case", "Checklist", "Контекст"], GitBranch, "orange", [
    { title: "Test Case", text: "Подробные шаги и ожидаемые результаты; подходит для сложных проверок." },
    { title: "Checklist", text: "Краткий список; подходит для быстрых и знакомых сценариев." },
    { title: "Контекст", text: "Выбор зависит от риска, сложности и необходимости воспроизводимости." },
  ], "Простое → чек-лист. Сложное и многошаговое → тест-кейс."),
  "m4-08": V("flow", ["Шаги", "Факт", "Ожидание", "Evidence"], Bug, "pink", [
    { title: "Шаги", text: "Позволяют воспроизвести проблему." },
    { title: "Факт vs ожидание", text: "Показываем расхождение поведения." },
    { title: "Evidence", text: "Скриншоты, видео, логи и другие доказательства." },
    { title: "Контекст", text: "Окружение, предусловия, Severity и Priority." },
  ], "Хороший Bug Report должен помочь разработчику быстро понять и воспроизвести проблему."),
  "m4-09": V("timeline", ["Цели", "Методы", "Инструменты", "Среда", "Проверки", "Результаты"], FileText, "lavender", [
    { title: "Шапка отчёта", text: "Проект, дата и ответственные." },
    { title: "Цели", text: "Что подтверждаем: создание заказов, обновление цен, генерация отчётов." },
    { title: "Методы + инструменты", text: "Функциональное, API, ручное; Postman, Jira, MySQL Workbench." },
    { title: "Среда", text: "ОС и браузеры, на которых выполнялись проверки." },
    { title: "Проверки", text: "Заказ → БД → поставщик → подтверждение; цены → БД → поставщик; отчёт → параметры → БД → генерация → экран." },
    { title: "Результат", text: "Фиксируем ожидаемый/фактический результат и статус выполнения." },
  ], "Test Summary Report собирает в одну картину цели, подход, окружение и фактический результат тестирования."),

  "m4-10": V("compare", ["Error", "Defect/Bug", "Severity", "Priority"], AlertTriangle, "pink", [
    { title: "Error", text: "Неправильное действие или решение человека: требования, дизайн, архитектура, код или тестирование." },
    { title: "Defect / Bug", text: "Изъян в продукте, из-за которого система ведёт себя не так, как требуется или ожидается." },
    { title: "Почему возникают", text: "Непонимание требований, архитектура/дизайн, код, пропущенные сценарии, внешняя среда, человеческий фактор." },
    { title: "Severity vs Priority", text: "Severity = сила влияния на продукт. Priority = срочность исправления. Уровни и правила зависят от команды." },
  ], "Error → Defect/Bug → наблюдаемое неверное поведение; Severity показывает влияние, Priority — срочность."),

  "m4-11": V("cycle", ["New", "Open", "Assigned", "In Progress", "Fixed", "Retest", "Closed"], Workflow, "blue", [
    { title: "Основной путь", text: "New → Open → Assigned → In Progress → Fixed → Ready for Retest → Retesting → Closed." },
    { title: "Если не исправлено", text: "Reopened возвращает дефект в работу после неуспешного ретеста или повторного воспроизведения." },
    { title: "Альтернативные исходы", text: "Rejected — невалиден/ожидаемое поведение; Deferred — исправление позже; Duplicate — уже есть основной баг." },
    { title: "Важно", text: "Набор статусов и переходов зависит от компании: этапы могут объединяться, пропускаться или называться иначе." },
  ], "Bug Life Cycle отслеживает состояние и ответственность от регистрации до закрытия или альтернативного исхода."),

  "m4-12": V("compare", ["Bug", "Feature Request", "Acceptance"], GitBranch, "orange", [
    { title: "Bug", text: "Непредвиденное поведение существующего функционала; цель — восстановить корректность по спецификации." },
    { title: "Feature Request", text: "Новая функция, улучшение или изменение продукта; цель — расширить/улучшить возможности." },
    { title: "Приоритет", text: "Bug — зависит от влияния дефекта; Feature Request — от целей продукта и потребностей пользователей." },
    { title: "Правило", text: "Не соответствует согласованным требованиям → может быть баг. Нового поведения не было в спецификации → доработка." },
  ], "Главный вопрос: «Так должно было работать по согласованным требованиям?»"),

  "m4-13": V("flow", ["Заголовок", "Среда", "Шаги", "Ожидание", "Факт", "Evidence", "Severity/Priority"], Route, "mint", [
    { title: "1. Заголовок", text: "Кратко и точно: что произошло и где." },
    { title: "2. Окружение + предусловие", text: "ОС, браузер, устройство и версии; состояние, из которого стартуем." },
    { title: "3. Воспроизведение", text: "Последовательность действий, достаточная для повторения проблемы." },
    { title: "4. Expected vs Actual", text: "Что должно было произойти и что происходит фактически." },
    { title: "5. Evidence", text: "Скриншоты, видео, логи и другие доказательства." },
    { title: "6. Severity + Priority", text: "Насколько сильно влияет и насколько срочно исправлять." },
  ], "Качественный баг-репорт позволяет быстро понять проблему и воспроизвести её."),

  "m4-14": V("compare", ["Pre-release", "Production", "Impact"], Cloud, "yellow", [
    { title: "Pre-release", text: "Баг найден до релиза; часто фиксируется в контексте текущей задачи." },
    { title: "Production", text: "Баг найден после релиза и может затрагивать реальных пользователей." },
    { title: "Impact", text: "Для production важны полное описание, окружение, evidence и процесс приоритизации." },
  ]),
  "m4-15": V("network", ["Test Management", "Tasks", "Wiki", "Files", "Git"], Database, "lavender", [
    { title: "Test Management", text: "TestRail, Zephyr, TestLink, Xray, PractiTest." },
    { title: "Tasks", text: "Jira, YouTrack, Redmine, Azure DevOps." },
    { title: "Wiki / Files", text: "Confluence, SharePoint, Google Docs/Sheets, Word/Excel." },
    { title: "Git / CI", text: "Документация и результаты автоматизации могут быть связаны с кодом и pipeline." },
  ], "Инструмент выбирается под процессы и размер команды."),
  "m4-16": V("network", ["UI", "Network", "Backend", "DB", "Logs"], Network, "blue", [
    { title: "UI", text: "Проверяем DOM, CSS и состояние интерфейса." },
    { title: "Network", text: "Есть ли запрос? Какой метод, тело и HTTP-статус?" },
    { title: "Backend / DB", text: "Проверяем серверную обработку и наличие ожидаемых данных." },
    { title: "Logs", text: "Ищем ошибки интеграций и цепочку событий в системе мониторинга." },
  ], "Последовательность: воспроизвести → Console/Network → сервер → БД → интерфейс → логи."),
  "m4-17": V("flow", ["Уточнить", "Тест-дизайн", "Написать", "Ревью"], Target, "orange", [
    { title: "Уточнить", text: "Требования, User Journey, данные, затронутые модули." },
    { title: "Тест-дизайн", text: "Техники, приоритеты, регресс и теги." },
    { title: "Написать", text: "Кейсы с понятным названием, предусловиями и тестовыми данными." },
    { title: "Ревью", text: "Проверить полноту, логику и воспроизводимость." },
  ], "Документация создаётся как часть работы над задачей, а не после неё."),
  "m4-18": V("checklist", ["Что?", "Зачем?", "Из чего?", "Пример"], CheckCircle2, "mint", [
    { title: "Название", text: "Где + что проверяем + как, если это нужно." },
    { title: "Шаги", text: "Другой QA должен воспроизвести проверку без лишних вопросов." },
    { title: "Данные и дизайн", text: "Ссылки вместо дублирования секретов; утверждённый макет — в предусловиях." },
    { title: "Атомарность", text: "Один тест-кейс = одна проверка или одна логическая цепочка." },
  ], "Формула ответа: что это → зачем → из чего состоит → пример."),
};

const ACCENT_STYLES: Record<Accent, { marker: string; card: string; badge: string; line: string }> = {
  blue: { marker: "bg-blue-600 text-white", card: "bg-sky-50/90", badge: "border-sky-200", line: "border-sky-300" },
  lavender: { marker: "bg-violet-600 text-white", card: "bg-violet-50/90", badge: "border-violet-200", line: "border-violet-300" },
  mint: { marker: "bg-emerald-600 text-white", card: "bg-emerald-50/90", badge: "border-emerald-200", line: "border-emerald-300" },
  yellow: { marker: "bg-amber-500 text-white", card: "bg-amber-50/90", badge: "border-amber-200", line: "border-amber-300" },
  pink: { marker: "bg-pink-600 text-white", card: "bg-pink-50/90", badge: "border-pink-200", line: "border-pink-300" },
  orange: { marker: "bg-orange-600 text-white", card: "bg-orange-50/90", badge: "border-orange-200", line: "border-orange-300" },
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
  return LESSON_VISUALS[lesson.id] ?? V("flow", ["Тема", "Проверка", "Результат"], BookOpen, "blue", [
    { title: "Тема", text: lesson.title },
    { title: "Проверка", text: "Сопоставить ключевые понятия урока." },
    { title: "Результат", text: "Закрепить материал." },
  ]);
}

function Card({ card, index, visual }: { card: VisualCard; index: number; visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  const Icon = visual.icon;
  return (
    <div className={`flex min-h-[104px] flex-col rounded-[18px] border-2 p-3.5 shadow-[2px_3px_0_rgba(30,64,175,0.07)] ${styles.card} ${styles.badge} ${index % 2 === 0 ? "rotate-[-0.35deg]" : "rotate-[0.35deg]"}`}>
      <div className="flex items-start gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${styles.marker}`}>{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-white/80 ${styles.badge}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-xs font-extrabold text-blue-950 dark:text-black">{card.title}</span>
          </div>
          <p className="text-[11px] leading-[1.45] text-slate-700 dark:text-black">{card.text}</p>
        </div>
      </div>
    </div>
  );
}

function DiagramLabelStrip({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  return (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5" aria-label="Ключевые элементы темы">
      {visual.labels.map((label, index) => (
        <React.Fragment key={label}>
          <span className={`rounded-full border-2 bg-white px-2.5 py-1 text-[10px] font-extrabold text-blue-950 dark:text-black ${styles.badge}`}>
            {label}
          </span>
          {index < visual.labels.length - 1 && (
            <ArrowRight className="h-3 w-3 text-blue-300" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FlowDiagram({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  return (
    <div aria-label="Последовательность процесса">
      <DiagramLabelStrip visual={visual} />
      <div className="grid gap-2 sm:grid-cols-3">
        {visual.cards.map((card, index) => (
          <React.Fragment key={card.title}>
            <Card card={card} index={index} visual={visual} />
            {index < visual.cards.length - 1 && (
              <ArrowRight className="hidden self-center justify-self-center text-blue-300 sm:block" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className={`mt-3 rounded-xl border-2 border-dashed bg-white/80 px-3 py-2 text-center text-[10px] font-semibold text-blue-900 dark:text-black ${styles.badge}`}>
        Последовательность показывает, как элементы связаны между собой.
      </div>
    </div>
  );
}

function TimelineDiagram({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  return (
    <div aria-label="Временная последовательность">
      <DiagramLabelStrip visual={visual} />
      <div className="relative grid gap-3 md:grid-cols-2">
        <div className="absolute left-5 top-5 bottom-5 hidden w-0.5 bg-blue-200 md:block" aria-hidden="true" />
        {visual.cards.map((card, index) => (
          <div key={card.title} className="relative flex gap-3">
            <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${styles.marker}`}>
              {index + 1}
            </span>
            <Card card={card} index={index} visual={visual} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistDiagram({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  return (
    <div aria-label="Чек-лист ключевых проверок">
      <DiagramLabelStrip visual={visual} />
      <div className="space-y-2">
        {visual.cards.map((card, index) => (
          <div key={card.title} className={`flex items-start gap-3 rounded-2xl border-2 bg-white p-3 ${styles.badge}`}>
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.marker}`}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-blue-950 dark:text-black">{card.title}</div>
              <p className="mt-1 text-[11px] leading-[1.45] text-slate-700 dark:text-black">{card.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareDiagram({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  return (
    <div aria-label="Сравнительная таблица понятий">
      <DiagramLabelStrip visual={visual} />
      <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-white">
        <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] border-b-2 border-blue-100 bg-sky-50/60 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-blue-900 dark:text-black">
          <span>Понятие</span>
          <span>Что важно помнить</span>
        </div>
        {visual.cards.map((card, index) => (
          <div key={card.title} className={`grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 border-b border-blue-50 px-3 py-3 last:border-b-0 ${index % 2 ? "bg-violet-50/30" : "bg-white"}`}>
            <div className="flex items-start gap-2">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${styles.marker}`}>{index + 1}</span>
              <span className="text-[11px] font-extrabold leading-4 text-blue-950 dark:text-black">{card.title}</span>
            </div>
            <p className="text-[11px] leading-[1.45] text-slate-700 dark:text-black">{card.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkDiagram({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  return (
    <div aria-label="Карта взаимосвязанных понятий">
      <DiagramLabelStrip visual={visual} />
      <div className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visual.cards.map((card, index) => (
          <div key={card.title} className="relative">
            <Card card={card} index={index} visual={visual} />
            {index < visual.cards.length - 1 && (
              <span className={`absolute -right-1 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full border-2 bg-white lg:block ${styles.badge}`} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {visual.labels.slice(0, 6).map((label) => (
          <span key={label} className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-semibold text-slate-600 dark:text-black">{label}</span>
        ))}
      </div>
    </div>
  );
}

function VisualMotif({ visual }: { visual: LessonVisual }) {
  const styles = ACCENT_STYLES[visual.accent];
  const symbols = {
    flow: ["→", "→", "→"],
    layers: ["▰", "▰", "▰"],
    cycle: ["↻", "↻", "↻"],
    compare: ["≠", "⇄", "≠"],
    checklist: ["✓", "✓", "✓"],
    network: ["●", "↔", "●"],
    timeline: ["1", "2", "3"],
    pyramid: ["▲", "◆", "■"],
  }[visual.kind];
  return (
    <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
      {symbols.map((symbol, index) => (
        <React.Fragment key={index}>
          <span className={`flex h-7 min-w-7 items-center justify-center rounded-full border-2 bg-white px-1 text-[10px] font-black ${styles.badge} text-blue-700 dark:text-black`}>
            {symbol}
          </span>
          {index < symbols.length - 1 && (
            <span className="text-[10px] font-black text-blue-300">•</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function VisualDiagram({ visual }: { visual: LessonVisual }) {
  if (visual.kind === "pyramid") {
    const styles = ACCENT_STYLES[visual.accent];
    return (
      <div aria-label="Пирамида уровней">
        <DiagramLabelStrip visual={visual} />
        <div className="flex flex-col items-center gap-2 py-2">
          {visual.cards.map((card, index) => (
            <div
              key={card.title}
              className={`flex min-h-14 items-center gap-3 rounded-[18px] border-2 px-3 py-2 ${styles.card} ${styles.badge}`}
              style={{ width: `${96 - index * 14}%` }}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${styles.marker}`}>{index + 1}</span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-blue-950 dark:text-black">{card.title}</div>
                <div className="text-[10px] leading-4 text-slate-600 dark:text-black">{card.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.kind === "cycle") {
    return (
      <div aria-label="Циклическая схема">
        <DiagramLabelStrip visual={visual} />
        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visual.cards.map((card, index) => (
            <div key={card.title} className="relative">
              <Card card={card} index={index} visual={visual} />
              {index < visual.cards.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-blue-300 lg:block" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
        <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border-2 border-dashed border-blue-200 bg-white px-3 py-1.5 text-[10px] font-bold text-blue-800 dark:text-black">
          ↻ цикл повторяется
        </div>
      </div>
    );
  }

  if (visual.kind === "flow") return <FlowDiagram visual={visual} />;
  if (visual.kind === "timeline") return <TimelineDiagram visual={visual} />;
  if (visual.kind === "checklist") return <ChecklistDiagram visual={visual} />;
  if (visual.kind === "compare") return <CompareDiagram visual={visual} />;
  if (visual.kind === "network") return <NetworkDiagram visual={visual} />;

  if (visual.kind === "layers") {
    const styles = ACCENT_STYLES[visual.accent];
    return (
      <div aria-label="Слои модели">
        <DiagramLabelStrip visual={visual} />
        <div className="space-y-2.5">
          {visual.cards.map((card, index) => (
            <div key={card.title} className={`flex items-start gap-3 rounded-[18px] border-2 p-3.5 ${styles.card} ${styles.badge}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${styles.marker}`}>{index + 1}</span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-blue-950 dark:text-black">{card.title}</div>
                <div className="mt-1 text-[11px] leading-[1.45] text-slate-700 dark:text-black">{card.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div aria-label={KIND_LABELS[visual.kind]}>
      <DiagramLabelStrip visual={visual} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visual.cards.map((card, index) => <Card key={card.title} card={card} index={index} visual={visual} />)}
      </div>
    </div>
  );
}
function PdfDownloadButton({ targetId }: { targetId: string }) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const downloadPdf = async () => {
    const target = document.getElementById(targetId);
    if (!target || isGenerating) return;
    setIsGenerating(true);
    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvasModule.default(target, {
        backgroundColor: "#ffffff",
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
        ignoreElements: (element) => element.hasAttribute("data-pdf-ignore"),
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const image = canvas.toDataURL("image/png", 1);
      if (imageHeight <= pageHeight) {
        pdf.addImage(image, "PNG", 0, 0, imageWidth, imageHeight);
      } else {
        let sourceY = 0;
        const pagePixelHeight = Math.floor((pageHeight / imageWidth) * canvas.width);
        let pageIndex = 0;
        while (sourceY < canvas.height) {
          const sliceHeight = Math.min(pagePixelHeight, canvas.height - sourceY);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          pageCanvas.getContext("2d")?.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          if (pageIndex > 0) pdf.addPage();
          const sliceMmHeight = (sliceHeight * imageWidth) / canvas.width;
          pdf.addImage(pageCanvas.toDataURL("image/png", 1), "PNG", 0, 0, imageWidth, sliceMmHeight);
          sourceY += sliceHeight;
          pageIndex += 1;
        }
      }
      pdf.save("qa-navigator-visual-cheatsheet.pdf");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      data-pdf-ignore
      onClick={downloadPdf}
      disabled={isGenerating}
      aria-label="Скачать визуальную шпаргалку в PDF"
      title="Скачать PDF"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 text-[10px] font-bold text-blue-800 shadow-sm transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{isGenerating ? "PDF…" : "PDF"}</span>
    </button>
  );
}
function LessonInfographic({ lesson }: { lesson: LearningLesson }) {
  const visual = getVisual(lesson);
  const Icon = visual.icon;
  const styles = ACCENT_STYLES[visual.accent];
  const lessonNumber = lesson.id.match(/-(\d+)$/)?.[1] ?? "01";
  const isTestingPrinciples = lesson.id === "m1-03";
  const infographicId = `learning-infographic-${lesson.id}`;

  return (
    <section
      id={infographicId}
      className="overflow-hidden rounded-[28px] border-2 border-blue-100 bg-white shadow-[0_8px_30px_rgba(30,64,175,0.08)]"
      aria-label={`Инфографика урока: ${lesson.title}`}
    >
      {isTestingPrinciples ? (
        <div className="flex items-center justify-between gap-3 border-b-2 border-blue-100 bg-gradient-to-br from-white via-sky-50/60 to-violet-50/40 px-4 py-3 sm:px-5">
          <h4 className="text-base font-extrabold leading-6 text-blue-950 dark:text-black sm:text-lg">7 принципов тестирования</h4>
          <PdfDownloadButton targetId={infographicId} />
        </div>
      ) : (
        <div className={`border-b-2 border-blue-100 bg-gradient-to-br from-white via-sky-50/60 to-violet-50/40 px-4 py-5 sm:px-6 ${styles.card}`}>
          <div className="relative flex items-start gap-3 sm:gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-white text-3xl font-black shadow-[3px_4px_0_rgba(30,64,175,0.12)] ${styles.marker}`}>
              {lessonNumber}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">Визуальная шпаргалка</span>
                <span className={`rounded-full border bg-white/80 px-2.5 py-1 text-[10px] font-bold text-blue-800 dark:text-black ${styles.badge}`}>{KIND_LABELS[visual.kind]}</span>
              </div>
              <h4 className="text-base font-extrabold leading-6 text-blue-950 dark:text-black sm:text-lg">{lesson.title}</h4>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-1.5 w-10 rounded-full ${styles.marker}`} />
                <span className="h-1.5 w-2 rounded-full bg-blue-200" />
                <span className="h-1.5 w-2 rounded-full bg-violet-200" />
              </div>
            </div>
            <div className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 bg-white shadow-[2px_3px_0_rgba(30,64,175,0.08)] sm:flex ${styles.badge}`}>
              <Icon className="h-6 w-6 text-blue-700" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      <div className={`bg-[linear-gradient(rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:18px_18px] ${isTestingPrinciples ? "p-3 sm:p-4" : "p-4 sm:p-6"}`}>
        {!isTestingPrinciples && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-extrabold text-blue-800 dark:text-black">Суть за 10 секунд</span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-black">смотри на структуру →</span>
          </div>
        )}
        {!isTestingPrinciples && <VisualMotif visual={visual} />}
        <VisualDiagram visual={visual} />
        {visual.callout && !isTestingPrinciples && (
          <div className="mt-4 flex items-start gap-2.5 rounded-[18px] border-2 border-blue-100 bg-white/90 px-3.5 py-3 shadow-[1px_2px_0_rgba(30,64,175,0.05)]">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
            <p className="text-[11px] font-semibold leading-[1.45] text-blue-950 dark:text-black">{visual.callout}</p>
          </div>
        )}
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
            <h3 className="mt-1 text-lg font-extrabold leading-6 text-blue-950 dark:text-black">{module.title}</h3>
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
                <span className="min-w-0 pt-0.5 text-xs font-semibold leading-4 text-foreground dark:text-black">{lesson.title}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-[11px] font-medium text-muted-foreground">
          <span>01 Понять</span><ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>02 Применить</span><ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
