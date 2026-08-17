import type { FieldConfig, TestObjectConfig, TestPlanStep, TestTechnique } from "./types";

const TECHNIQUES = {
  happy: { ru: "Основной успешный сценарий", en: "Happy Path" },
  positive: { ru: "Позитивное тестирование", en: "Positive Testing" },
  negative: { ru: "Негативное тестирование", en: "Negative Testing" },
  ep: { ru: "Классы эквивалентности", en: "Equivalence Partitioning", short: "EP" },
  bva: { ru: "Анализ граничных значений", en: "Boundary Value Analysis", short: "BVA" },
  decision: { ru: "Таблица принятия решений", en: "Decision Table Testing" },
  state: { ru: "Тестирование переходов состояний", en: "State Transition Testing" },
  pairwise: { ru: "Попарное тестирование", en: "Pairwise Testing" },
  scenario: { ru: "Сценарное тестирование", en: "Use Case / Scenario Testing" },
  errorGuessing: { ru: "Предугадывание ошибок", en: "Error Guessing" },
  exploratory: { ru: "Исследовательское тестирование", en: "Exploratory Testing" },
  regression: { ru: "Регрессионное тестирование", en: "Regression Testing" },
  security: { ru: "Проверки безопасности", en: "Security Testing" },
  recovery: { ru: "Тестирование восстановления", en: "Recovery Testing" },
} satisfies Record<string, TestTechnique>;

const step = (value: TestPlanStep): TestPlanStep => value;
const named = (field: FieldConfig) => field.name.trim() || "Поле";
const unique = (values: Array<string | number>) => [...new Set(values.map(String))];
const numericBoundaryValues = (min?: number, max?: number) => unique([
  ...(min === undefined ? [] : [min - 1, min, min + 1]),
  ...(max === undefined ? [] : [max - 1, max, max + 1]),
]);
const lengthBoundaryValues = (min?: number, max?: number) => unique([
  ...(min === undefined ? [] : [Math.max(0, min - 1), min, min + 1]),
  ...(max === undefined ? [] : [Math.max(0, max - 1), max, max + 1]),
]).map((value) => `${value} симв.`);

function fieldPlan(field: FieldConfig, prefix = "field"): TestPlanStep[] {
  const name = named(field);
  const result: TestPlanStep[] = [];
  result.push(step({
    id: `${prefix}-${field.id}-positive`, category: "positive", title: `Проверь корректное значение: «${name}»`,
    action: "Введи значение, которое точно соответствует известным требованиям, и выполни основное действие формы.",
    why: "Сначала нужно убедиться, что валидные данные принимаются и основной пользовательский сценарий работает.",
    technique: TECHNIQUES.positive,
    expected: "Корректное значение принимается, сохраняется или передаётся без ошибки согласно требованиям.",
  }));

  if (field.required) result.push(step({
    id: `${prefix}-${field.id}-required`, category: "negative", title: `Оставь «${name}» пустым`,
    action: "Не заполняй обязательное поле и попробуй продолжить или отправить форму.",
    why: "Обязательность должна контролироваться предсказуемо и давать понятную пользователю ошибку.",
    technique: TECHNIQUES.negative,
    examples: ["пустое значение", "только пробелы"],
    expected: "Действие блокируется или сервер отклоняет запрос; сообщение об ошибке объясняет, что требуется заполнить поле.",
  }));

  if (field.dataType === "number" && (field.min !== undefined || field.max !== undefined)) {
    const classes = [
      ...(field.min === undefined ? [] : [`< ${field.min}`]),
      ...(field.min !== undefined && field.max !== undefined ? [`${field.min}…${field.max}`] : []),
      ...(field.max === undefined ? [] : [`> ${field.max}`]),
    ];
    result.push(step({
      id: `${prefix}-${field.id}-ep-number`, category: "validation", title: `Раздели значения «${name}» на допустимые и недопустимые классы`,
      action: "Возьми по одному представителю из каждого известного диапазона и сравни результат с требованиями.",
      why: "Классы эквивалентности уменьшают число повторяющихся тестов, сохраняя покрытие разных типов входных данных.",
      technique: TECHNIQUES.ep, examples: classes,
    }));
    result.push(step({
      id: `${prefix}-${field.id}-bva-number`, category: "validation", title: `Проверь числовые границы: «${name}»`,
      action: "Проверь значения непосредственно перед границей, на границе и сразу после неё.",
      why: "Ошибки сравнения и ограничений часто возникают именно около min/max.",
      technique: TECHNIQUES.bva, examples: numericBoundaryValues(field.min, field.max),
    }));
  }

  if (field.minLength !== undefined || field.maxLength !== undefined) {
    const classes = [
      ...(field.minLength === undefined ? [] : [`короче ${field.minLength}`]),
      ...(field.minLength !== undefined && field.maxLength !== undefined ? [`${field.minLength}…${field.maxLength} символов`] : []),
      ...(field.maxLength === undefined ? [] : [`длиннее ${field.maxLength}`]),
    ];
    result.push(step({
      id: `${prefix}-${field.id}-ep-length`, category: "validation", title: `Проверь классы длины: «${name}»`,
      action: "Используй строки из каждого известного класса длины: допустимого и недопустимых.",
      why: "Это позволяет проверить правила длины без бессмысленного перебора всех возможных размеров строки.",
      technique: TECHNIQUES.ep, examples: classes,
    }));
    result.push(step({
      id: `${prefix}-${field.id}-bva-length`, category: "validation", title: `Проверь границы длины: «${name}»`,
      action: "Создай строки длиной рядом с каждым известным ограничением.",
      why: "Ограничения длины особенно подвержены ошибкам off-by-one.",
      technique: TECHNIQUES.bva, examples: lengthBoundaryValues(field.minLength, field.maxLength),
    }));
  }

  if (field.format || ["email", "phone", "date"].includes(field.dataType)) result.push(step({
    id: `${prefix}-${field.id}-format`, category: "validation", title: `Проверь формат: «${name}»`,
    action: field.format
      ? `Возьми корректное значение по формату «${field.format}», затем измени одну значимую часть формата.`
      : "Проверь корректный и заведомо некорректный формат, не придумывая дополнительные ограничения, которых нет в требованиях.",
    why: "Формат нужно проверять позитивным и негативным представителем, отдельно от длины и обязательности.",
    technique: TECHNIQUES.ep,
    examples: field.format ? [field.format, "вариант с нарушенной частью формата"] : ["корректный формат", "некорректный формат"],
  }));

  if (["text", "email", "phone", "password", "other"].includes(field.dataType)) result.push(step({
    id: `${prefix}-${field.id}-input-errors`, category: "negative", title: `Проверь необычный ввод: «${name}»`,
    action: "Попробуй пробелы в начале/конце, вставку из буфера, Unicode/эмодзи и спецсимволы, если интерфейс позволяет их передать.",
    why: "Реальные пользователи вставляют данные и используют символы, которые легко пропустить в обычном позитивном сценарии.",
    technique: TECHNIQUES.errorGuessing,
    examples: ["  значение  ", "emoji 🙂", "кавычки ' \"", "слеш / \\"],
    expected: "Приложение не ломается; данные нормализуются, принимаются или отклоняются согласно требованиям.",
  }));

  if (field.maxLength === undefined && ["text", "email", "phone", "password", "other"].includes(field.dataType)) result.push(step({
    id: `${prefix}-${field.id}-gap-max-length`, category: "requirements", title: `Уточни максимальную длину: «${name}»`,
    action: "Проверь требования или уточни у аналитика/разработчика, существует ли максимальная длина.",
    why: "Без известного ограничения нельзя корректно рассчитать верхнюю границу и нельзя подставлять условные 255 символов.",
  }));

  return result;
}

function objectSpecificPlan(config: TestObjectConfig): TestPlanStep[] {
  const result: TestPlanStep[] = [];
  if (config.objectType === "form" || config.objectType === "auth") {
    result.push(step({
      id: "form-happy", category: "positive", title: "Пройди форму по основному успешному сценарию",
      action: "Заполни все поля корректными согласованными данными и выполни целевое действие один раз.",
      why: "До детальных проверок нужно подтвердить, что пользователь вообще может выполнить основную задачу.",
      technique: TECHNIQUES.happy,
    }));
    config.fields.forEach((field, index) => result.push(...fieldPlan(field, `form-${index}`)));
    if (config.fields.length > 1) result.push(step({
      id: "form-field-interaction", category: "combinations", title: "Проверь поля формы вместе",
      action: "Оставляй остальные поля корректными и по одному меняй состояние выбранного поля: пустое, валидное, невалидное.",
      why: "Поле может работать отдельно, но ошибка проявиться только при отправке всей формы или взаимодействии нескольких значений.",
      technique: TECHNIQUES.scenario,
      examples: ["все поля валидны", "одно поле невалидно", "одно обязательное поле пустое", "несколько обязательных полей пусты"],
    }));
  }

  if (config.objectType === "field") config.fields.slice(0, 1).forEach((field) => result.push(...fieldPlan(field)));

  if (config.objectType === "search") result.push(
    step({ id: "search-happy", category: "positive", title: "Проверь точный успешный поиск", action: "Используй запрос, для которого заранее известен существующий результат.", why: "Это базовая контрольная точка перед негативными и комбинированными сценариями.", technique: TECHNIQUES.happy }),
    step({ id: "search-empty", category: "negative", title: "Проверь пустой запрос и отсутствие результатов", action: "Проверь пустое значение, запрос без совпадений и очистку фильтров, если эти элементы существуют.", why: "Empty state и отсутствие совпадений — обычные пользовательские сценарии, а не исключение.", technique: TECHNIQUES.negative }),
    step({ id: "search-normalization", category: "validation", title: "Проверь варианты поискового ввода", action: "Проверь регистр, пробелы в начале/конце, частичное совпадение и спецсимволы — только если продукт заявляет поддержку соответствующего поведения.", why: "Поисковые ошибки часто связаны с нормализацией пользовательского ввода.", technique: TECHNIQUES.ep }),
  );

  if (config.objectType === "api") {
    result.push(step({ id: "api-happy", category: "positive", title: `Выполни корректный ${config.httpMethod ?? "HTTP"}-запрос`, action: "Собери запрос только из известных обязательных параметров и проверь status code, body и фактический результат операции.", why: "API нужно проверять не только по коду ответа, но и по контракту и эффекту операции.", technique: TECHNIQUES.happy }));
    if (config.hasParameters || config.hasBody) result.push(step({ id: "api-input", category: "validation", title: "Проверь параметры и поля запроса", action: "Для каждого известного параметра проверь допустимые, недопустимые, пустые и граничные значения согласно контракту.", why: "Сервер обязан валидировать вход независимо от клиентского интерфейса.", technique: TECHNIQUES.ep }));
    if (config.requiredApiFields?.trim()) result.push(step({ id: "api-required", category: "negative", title: "Убери обязательные поля по одному", action: `Проверь отсутствие каждого обязательного поля: ${config.requiredApiFields}.`, why: "Контракт должен предсказуемо отклонять неполные запросы.", technique: TECHNIQUES.negative }));
    if (config.hasAuthorization) result.push(step({ id: "api-auth", category: "security", title: "Проверь авторизацию API", action: "Сравни корректные credentials/token с отсутствующим, истёкшим или заведомо невалидным значением в рамках тестового окружения.", why: "Защищённая операция не должна выполняться без корректной авторизации.", technique: TECHNIQUES.security }));
    result.push(step({ id: "api-errors", category: "reliability", title: "Проверь ошибочные ответы и повтор запроса", action: "Проверь корректную обработку ожидаемых 4xx/5xx, timeout и повторной отправки там, где это можно воспроизвести безопасно.", why: "Клиент и сервер должны предсказуемо переживать ошибки и не создавать неконсистентные данные.", technique: TECHNIQUES.recovery }));
  }

  if (config.objectType === "database") result.push(
    step({ id: "db-crud", category: "integration", title: "Проверь CRUD и фактическое состояние данных", action: "Создай, прочитай, измени и удали тестовую запись доступным способом; после каждого шага проверь фактические данные.", why: "Успешный UI/API-ответ ещё не доказывает правильное сохранение данных.", technique: TECHNIQUES.scenario }),
    step({ id: "db-constraints", category: "negative", title: "Проверь ограничения данных", action: "Проверь NULL/обязательность, уникальность, типы, PK/FK и другие реально заданные ограничения схемы.", why: "Целостность должна сохраняться даже при обходе клиентской валидации.", technique: TECHNIQUES.negative }),
    step({ id: "db-consistency", category: "reliability", title: "Проверь целостность после ошибки", action: "На тестовых данных проверь, не остаётся ли частично выполненная операция после контролируемой ошибки или rollback.", why: "Частично сохранённая транзакция может быть опаснее явной ошибки.", technique: TECHNIQUES.recovery, warning: "Только тестовое окружение и тестовые данные." }),
  );

  if (config.objectType === "file-upload") result.push(
    step({ id: "file-happy", category: "positive", title: "Загрузи корректный поддерживаемый файл", action: "Используй известный допустимый тип и размер и проверь весь путь до сохранения/обработки.", why: "Это контрольный успешный сценарий загрузки.", technique: TECHNIQUES.happy }),
    step({ id: "file-negative", category: "negative", title: "Проверь недопустимые файлы", action: "Проверь неподдерживаемый тип, пустой или повреждённый файл и размер вне известных ограничений.", why: "Система должна безопасно отклонять неподходящие входные данные.", technique: TECHNIQUES.negative }),
    step({ id: "file-interrupt", category: "destructive", title: "Прерви загрузку и проверь восстановление", action: "На тестовом окружении прерви загрузку/соединение, повтори операцию и проверь, не появились ли битые или дублированные данные.", why: "Операция должна корректно завершаться или восстанавливаться после прерывания.", technique: TECHNIQUES.recovery, warning: "Деструктивная проверка: только тестовое окружение и тестовые данные." }),
  );

  if (config.objectType === "permissions") result.push(
    step({ id: "permissions-positive", category: "positive", title: "Проверь разрешённое действие каждой роли", action: "Для каждой известной роли выполни действие, которое ей явно разрешено.", why: "Сначала подтверждаем корректную матрицу разрешений.", technique: TECHNIQUES.positive }),
    step({ id: "permissions-negative", category: "security", title: "Проверь запрещённые действия", action: "Попробуй запрещённое действие через UI и прямой доступ к ресурсу/API, если такой интерфейс доступен тестировщику.", why: "Скрытая кнопка не является контролем доступа; запрет должен обеспечиваться на доверенной стороне системы.", technique: TECHNIQUES.security }),
  );

  if (config.objectType === "checkout") result.push(
    step({ id: "checkout-happy", category: "positive", title: "Пройди успешный заказ от начала до конца", action: "Добавь товар, проверь расчёт, оформи заказ и используй только тестовый способ оплаты.", why: "Сквозной сценарий подтверждает совместную работу корзины, расчётов, заказа и интеграций.", technique: TECHNIQUES.scenario }),
    step({ id: "checkout-calculation", category: "validation", title: "Проверь расчёты и денежные границы", action: "Проверь количество, сумму, скидку, доставку и округление на известных границах и правилах.", why: "Ошибки расчёта особенно критичны для денежных операций.", technique: TECHNIQUES.bva }),
    step({ id: "checkout-repeat", category: "destructive", title: "Проверь повтор и прерывание критической операции", action: "В тестовом окружении проверь двойной submit, refresh/возврат во время операции и повтор после контролируемой ошибки.", why: "Критическая операция не должна создавать двойные заказы/списания или терять согласованное состояние.", technique: TECHNIQUES.recovery, warning: "Не выполнять с реальными платежами или production-данными." }),
  );

  if (config.objectType === "stateful") result.push(
    step({ id: "state-valid", category: "state", title: "Проверь каждый разрешённый переход состояния", action: `Используй только заданные состояния и переходы.${config.states?.trim() ? ` Состояния: ${config.states}.` : ""}${config.transitions?.trim() ? ` Переходы: ${config.transitions}.` : ""}`, why: "Для stateful-объекта важен не только результат, но и корректность перехода из конкретного исходного состояния.", technique: TECHNIQUES.state }),
    step({ id: "state-invalid", category: "negative", title: "Проверь запрещённые переходы", action: "Попробуй переходы, которые явно не разрешены требованиями, не придумывая отсутствующие правила.", why: "Недопустимый переход не должен оставлять объект в невозможном или частично изменённом состоянии.", technique: TECHNIQUES.state }),
  );

  return result;
}

function crossCuttingPlan(config: TestObjectConfig): TestPlanStep[] {
  const result: TestPlanStep[] = [];
  if (config.hasMultipleConditions) result.push(step({
    id: "decision-table", category: "combinations", title: "Разложи зависимые условия в таблицу решений",
    action: "Выпиши только известные условия и ожидаемый результат для значимых комбинаций; затем проверь по одному сценарию на каждое уникальное правило.",
    why: "Когда результат зависит сразу от нескольких условий, линейный список легко пропускает важную комбинацию.",
    technique: TECHNIQUES.decision,
  }));
  if (config.hasManyCombinations) result.push(step({
    id: "pairwise", category: "combinations", title: "Сократи большой набор независимых комбинаций попарно",
    action: "Применяй pairwise только к независимым параметрам с известными наборами значений; критические бизнес-комбинации добавь отдельно.",
    why: "Полный декартов перебор быстро становится огромным, а pairwise покрывает взаимодействие пар параметров меньшим числом тестов.",
    technique: TECHNIQUES.pairwise,
  }));

  if (["field", "form", "auth", "search", "file-upload", "checkout"].includes(config.objectType)) result.push(step({
    id: "ux", category: "ux", title: "Проверь понятность интерфейса и ошибок",
    action: "Проверь состояния loading/disabled/error/empty, сохранение введённых данных после ошибки и понятность сообщений пользователю.",
    why: "Функция может технически работать, но оставаться непонятной или провоцировать повторные действия пользователя.",
    technique: TECHNIQUES.exploratory,
  }));

  if (["field", "form", "auth", "search"].includes(config.objectType)) result.push(step({
    id: "accessibility", category: "accessibility", title: "Пройди сценарий с клавиатуры",
    action: "Проверь Tab/Shift+Tab, видимый фокус, Enter/Escape где применимо, подписи полей и доступность ошибки без мыши.",
    why: "Базовая клавиатурная доступность одновременно выявляет проблемы фокуса, семантики и порядка взаимодействия.",
  }));

  if (["field", "form", "auth", "search", "checkout"].includes(config.objectType)) result.push(step({
    id: "compatibility", category: "compatibility", title: "Проверь поддерживаемые размеры экрана и браузеры", action: "Повтори основной сценарий на поддерживаемых проектом браузерах/viewport, особенно в местах с формами, клавиатурой и длинным контентом.", why: "Вёрстка, браузерная валидация и поведение фокуса могут различаться между средами." }));

  if (["field", "form", "auth", "search", "api", "file-upload"].includes(config.objectType)) result.push(step({
    id: "security-input", category: "security", title: "Проверь безопасную обработку пользовательского ввода", action: "В тестовом окружении передай HTML-подобный текст, кавычки и спецсимволы в тех местах, где это допустимо по интерфейсу, и убедись, что ввод не исполняется и не ломает приложение.", why: "Пользовательский ввод должен обрабатываться как данные; клиентскую проверку нельзя считать единственной защитой.", technique: TECHNIQUES.security, examples: ["<script>alert(1)</script>", "' OR '1'='1", "<b>text</b>"], warning: "Только собственная тестовая система и разрешённое тестовое окружение." }));

  if (!["database"].includes(config.objectType)) result.push(step({
    id: "destructive-recovery", category: "destructive", title: "Проверь устойчивость к прерыванию и повтору", action: "Если операция изменяет данные, на тестовом окружении проверь повторный клик/запрос, refresh, закрытие страницы или потерю соединения в безопасно воспроизводимой точке.", why: "Деструктивные и recovery-проверки выявляют дубликаты, частично сохранённые данные и невозможность продолжить работу после сбоя.", technique: TECHNIQUES.recovery, warning: "Пропусти этот шаг на Production или если нет безопасного способа воспроизвести сбой." }));

  result.push(step({ id: "error-guessing", category: "exploratory", title: "Сделай короткий проход Error Guessing", action: "Используя уже изученное поведение, попробуй реалистичные ошибки: двойное действие, быстрые переключения, необычный порядок шагов, возврат назад и повтор после ошибки.", why: "После системных техник тестировщик уже знает слабые места объекта и может целенаправленно искать дефекты вне формальной модели.", technique: TECHNIQUES.errorGuessing }));
  result.push(step({ id: "regression", category: "regression", title: "Заверши ретестом и регрессией", action: "После исправлений повтори конкретно упавшие проверки, затем Happy Path и связанные критичные сценарии, которые могло затронуть изменение.", why: "Исправление дефекта может повлиять на соседнее поведение; retest подтверждает fix, regression — отсутствие побочных поломок.", technique: TECHNIQUES.regression }));
  return result;
}

export function buildTestPlan(config: TestObjectConfig): TestPlanStep[] {
  return [...objectSpecificPlan(config), ...crossCuttingPlan(config)];
}
