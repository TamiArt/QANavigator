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
  retest: { ru: "Повторное тестирование исправления", en: "Retesting" },
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
const fileBoundaryValues = (min?: number, max?: number) => unique([
  ...(min === undefined ? [] : [Math.max(0, min - 0.01), min, min + 0.01]),
  ...(max === undefined ? [] : [Math.max(0, max - 0.01), max, max + 0.01]),
]).map((value) => `${value} МБ`);

function fieldPlan(field: FieldConfig, prefix = "field"): TestPlanStep[] {
  const name = named(field);
  const result: TestPlanStep[] = [step({
    id: `${prefix}-${field.id}-positive`, category: "positive", title: `Проверь корректное значение: «${name}»`,
    action: "Введи значение, которое точно соответствует известным требованиям, и выполни основное действие.",
    why: "Сначала нужно убедиться, что валидные данные принимаются и основной пользовательский сценарий работает.",
    technique: TECHNIQUES.positive,
    expected: "Корректное значение принимается, сохраняется или передаётся без ошибки согласно требованиям.",
  })];

  if (field.required) result.push(step({
    id: `${prefix}-${field.id}-required`, category: "negative", title: `Оставь «${name}» пустым`,
    action: "Не заполняй обязательное поле и попробуй продолжить или отправить форму.",
    why: "Обязательность должна контролироваться предсказуемо и сопровождаться понятной ошибкой.",
    technique: TECHNIQUES.negative, examples: ["пустое значение", "только пробелы"],
    expected: "Действие блокируется или сервер отклоняет запрос согласно требованиям.",
  }));

  if (field.dataType === "number" && (field.min !== undefined || field.max !== undefined)) {
    const classes = [
      ...(field.min === undefined ? [] : [`< ${field.min}`]),
      ...(field.min !== undefined && field.max !== undefined ? [`${field.min}…${field.max}`] : []),
      ...(field.max === undefined ? [] : [`> ${field.max}`]),
    ];
    result.push(step({
      id: `${prefix}-${field.id}-ep-number`, category: "validation", title: `Раздели значения «${name}» на классы`,
      action: "Возьми по одному представителю из каждого известного допустимого и недопустимого диапазона.",
      why: "Классы эквивалентности уменьшают число повторяющихся тестов без потери смыслового покрытия.",
      technique: TECHNIQUES.ep, examples: classes,
    }));
    result.push(step({
      id: `${prefix}-${field.id}-bva-number`, category: "validation", title: `Проверь числовые границы: «${name}»`,
      action: "Проверь значение перед каждой известной границей, на границе и сразу после неё.",
      why: "Ошибки сравнения и ограничения часто возникают около min/max.",
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
      action: "Используй строки из каждого известного класса длины.",
      why: "Это проверяет правила длины без бессмысленного перебора всех размеров.",
      technique: TECHNIQUES.ep, examples: classes,
    }));
    result.push(step({
      id: `${prefix}-${field.id}-bva-length`, category: "validation", title: `Проверь границы длины: «${name}»`,
      action: "Создай строки длиной рядом с каждым известным ограничением.",
      why: "Ограничения длины подвержены ошибкам off-by-one.",
      technique: TECHNIQUES.bva, examples: lengthBoundaryValues(field.minLength, field.maxLength),
    }));
  }

  if (field.format || ["email", "phone", "date"].includes(field.dataType)) result.push(step({
    id: `${prefix}-${field.id}-format`, category: "validation", title: `Проверь формат: «${name}»`,
    action: field.format
      ? `Возьми корректное значение по формату «${field.format}», затем измени одну значимую часть.`
      : "Проверь корректный и заведомо некорректный формат, не добавляя ограничений, которых нет в требованиях.",
    why: "Формат нужно проверять позитивным и негативным представителем отдельно от длины.",
    technique: TECHNIQUES.ep,
    examples: field.format ? [field.format, "вариант с нарушенной частью формата"] : ["корректный формат", "некорректный формат"],
  }));

  if (["text", "email", "phone", "password", "other"].includes(field.dataType)) result.push(step({
    id: `${prefix}-${field.id}-input-errors`, category: "negative", title: `Проверь необычный ввод: «${name}»`,
    action: "Попробуй пробелы в начале/конце, вставку из буфера, Unicode/эмодзи и спецсимволы, если интерфейс позволяет их передать.",
    why: "Реальные пользователи вставляют данные и используют символы, которые легко пропустить в обычном сценарии.",
    technique: TECHNIQUES.errorGuessing,
    examples: ["  значение  ", "emoji 🙂", "кавычки ' \"", "слеш / \\"],
    expected: "Приложение не ломается; значение принимается, нормализуется или отклоняется согласно требованиям.",
  }));

  if (field.maxLength === undefined && ["text", "email", "phone", "password", "other"].includes(field.dataType)) result.push(step({
    id: `${prefix}-${field.id}-gap-max-length`, category: "requirements", title: `Уточни максимальную длину: «${name}»`,
    action: "Проверь требования или уточни, существует ли максимальная длина.",
    why: "Без известного ограничения нельзя корректно рассчитать верхнюю границу и нельзя подставлять условные 255 символов.",
  }));

  return result;
}

function formPlan(config: TestObjectConfig): TestPlanStep[] {
  const result: TestPlanStep[] = [step({
    id: "form-happy", category: "positive", title: "Пройди основной успешный сценарий",
    action: "Заполни все поля корректными согласованными данными и выполни целевое действие один раз.",
    why: "До детальных проверок нужно подтвердить, что пользователь вообще может выполнить основную задачу.",
    technique: TECHNIQUES.happy,
  })];
  config.fields.forEach((field, index) => result.push(...fieldPlan(field, `form-${index}`)));
  if (config.fields.length > 1) result.push(step({
    id: "form-field-interaction", category: "combinations", title: "Проверь поля вместе",
    action: "Оставляй остальные поля корректными и по одному меняй состояние выбранного поля: пустое, валидное, невалидное.",
    why: "Поле может работать отдельно, но ошибка проявиться только при отправке всей формы.",
    technique: TECHNIQUES.scenario,
    examples: ["все поля валидны", "одно поле невалидно", "одно обязательное поле пустое", "несколько обязательных полей пусты"],
  }));
  return result;
}

function objectSpecificPlan(config: TestObjectConfig): TestPlanStep[] {
  const result: TestPlanStep[] = [];

  if (config.objectType === "form" || config.objectType === "auth") result.push(...formPlan(config));
  if (config.objectType === "field") result.push(...config.fields.slice(0, 1).flatMap((field) => fieldPlan(field)));

  if (config.objectType === "auth") result.push(
    step({ id: "auth-invalid-credentials", category: "negative", title: "Проверь неверные учётные данные", action: "Оставь формат полей корректным, но используй заведомо неверную комбинацию логина/пароля или другого идентификатора.", why: "Так отделяется проверка бизнес-результата авторизации от обычной валидации формата.", technique: TECHNIQUES.negative }),
    step({ id: "auth-repeat", category: "security", title: "Проверь повторные ошибки входа и сообщения", action: "Повтори несколько неуспешных попыток в пределах разрешённого тестового сценария и проверь, что сообщения не раскрывают лишние данные о существовании аккаунта.", why: "Авторизация должна предсказуемо обрабатывать ошибки и не выдавать чувствительную информацию.", technique: TECHNIQUES.security, warning: "Не проводи нагрузочные или блокирующие атаки; используй только тестовую учётную запись." }),
  );

  if (config.objectType === "search") {
    result.push(
      step({ id: "search-happy", category: "positive", title: "Проверь точный успешный поиск", action: "Используй запрос, для которого заранее известен существующий результат.", why: "Это контрольная точка перед негативными и комбинированными сценариями.", technique: TECHNIQUES.happy }),
      step({ id: "search-empty", category: "negative", title: "Проверь пустой запрос и отсутствие результатов", action: "Проверь пустое значение и запрос без совпадений.", why: "Empty state и отсутствие совпадений — обычные пользовательские сценарии.", technique: TECHNIQUES.negative }),
      step({ id: "search-normalization", category: "validation", title: "Проверь варианты поискового ввода", action: "Проверь регистр, пробелы в начале/конце, частичное совпадение и спецсимволы только там, где такое поведение определено продуктом.", why: "Поисковые ошибки часто связаны с нормализацией ввода.", technique: TECHNIQUES.ep }),
    );
    if (config.hasFilters) result.push(step({ id: "search-filters", category: "combinations", title: "Проверь фильтры отдельно и вместе", action: "Сначала примени каждый известный фильтр отдельно, затем значимые комбинации и сброс фильтров.", why: "Ошибки фильтрации часто возникают именно при пересечении условий.", technique: config.hasManyCombinations ? TECHNIQUES.pairwise : TECHNIQUES.scenario }));
    if (config.hasSorting) result.push(step({ id: "search-sorting", category: "validation", title: "Проверь сортировку", action: "Проверь каждый доступный порядок, одинаковые значения, пустые значения и сохранение фильтров при смене сортировки, если это предусмотрено.", why: "Сортировка должна быть стабильной и не менять состав результатов.", technique: TECHNIQUES.positive }));
    if (config.hasPagination) result.push(step({ id: "search-pagination", category: "validation", title: "Проверь пагинацию", action: "Проверь первую/последнюю страницу, переходы вперёд/назад, смену размера страницы и границу количества результатов, если эти элементы существуют.", why: "На границах страниц часто появляются пропуски и дубликаты.", technique: TECHNIQUES.bva }));
  }

  if (config.objectType === "api") {
    result.push(step({ id: "api-happy", category: "positive", title: `Выполни корректный ${config.httpMethod ?? "GET"}-запрос`, action: "Собери запрос только из известных параметров и проверь status code, body, headers и фактический эффект операции.", why: "API проверяется по контракту и результату, а не только по HTTP-коду.", technique: TECHNIQUES.happy }));
    if (config.hasParameters || config.hasBody) result.push(step({ id: "api-input", category: "validation", title: "Проверь параметры и поля запроса", action: "Для каждого известного параметра проверь допустимые, недопустимые, пустые и граничные значения согласно контракту.", why: "Сервер обязан валидировать вход независимо от клиента.", technique: TECHNIQUES.ep }));
    if (config.requiredApiFields?.trim()) result.push(step({ id: "api-required", category: "negative", title: "Убери обязательные поля по одному", action: `Проверь отсутствие каждого обязательного поля: ${config.requiredApiFields}.`, why: "Контракт должен предсказуемо отклонять неполные запросы.", technique: TECHNIQUES.negative }));
    if (config.hasAuthorization) result.push(step({ id: "api-auth", category: "security", title: "Проверь авторизацию API", action: "Сравни корректный токен с отсутствующим, истёкшим или заведомо невалидным значением в тестовом окружении.", why: "Защищённая операция не должна выполняться без корректной авторизации.", technique: TECHNIQUES.security }));
    result.push(step({ id: "api-errors", category: "reliability", title: "Проверь ошибки и повтор запроса", action: "Проверь обработку ожидаемых 4xx/5xx, timeout и повторной отправки там, где это можно воспроизвести безопасно.", why: "Ошибки не должны создавать неконсистентные или дублированные данные.", technique: TECHNIQUES.recovery }));
  }

  if (config.objectType === "database") {
    result.push(step({ id: "db-crud", category: "integration", title: "Проверь CRUD и фактические данные", action: "Создай, прочитай, измени и удали тестовую запись доступным способом; после каждого шага проверь фактическое состояние.", why: "Успешный UI/API-ответ ещё не доказывает правильное сохранение.", technique: TECHNIQUES.scenario }));
    if (config.databaseConstraints?.trim()) result.push(step({ id: "db-constraints", category: "negative", title: "Проверь известные ограничения схемы", action: `Проверяй только заданные ограничения: ${config.databaseConstraints}.`, why: "Ограничения БД должны защищать целостность независимо от клиентской валидации.", technique: TECHNIQUES.negative }));
    else result.push(step({ id: "db-gap", category: "requirements", title: "Уточни ограничения схемы", action: "Узнай, какие поля допускают NULL, где есть UNIQUE, PK/FK, ограничения типов и длины.", why: "Без схемы нельзя честно определить негативные и граничные проверки БД." }));
    result.push(step({ id: "db-consistency", category: "reliability", title: "Проверь целостность после ошибки", action: "На тестовых данных проверь, не остаётся ли частично выполненная операция после контролируемой ошибки или rollback.", why: "Частично сохранённая транзакция может быть опаснее явной ошибки.", technique: TECHNIQUES.recovery, warning: "Только тестовое окружение и тестовые данные." }));
  }

  if (config.objectType === "file-upload") {
    result.push(step({ id: "file-happy", category: "positive", title: "Загрузи корректный поддерживаемый файл", action: config.acceptedFileTypes?.trim() ? `Используй один из известных допустимых типов: ${config.acceptedFileTypes}.` : "Используй файл, который требования явно считают допустимым.", why: "Это контрольный успешный сценарий загрузки.", technique: TECHNIQUES.happy }));
    if (config.acceptedFileTypes?.trim()) result.push(step({ id: "file-type", category: "negative", title: "Проверь допустимые и недопустимые типы", action: `Проверь заявленные типы «${config.acceptedFileTypes}» и один заведомо неподдерживаемый тип.`, why: "Проверка типа должна выполняться предсказуемо и безопасно.", technique: TECHNIQUES.ep }));
    else result.push(step({ id: "file-type-gap", category: "requirements", title: "Уточни допустимые типы файлов", action: "Проверь требования и выясни разрешённые расширения/MIME-типы.", why: "Без этого нельзя корректно выбрать позитивные и негативные классы файлов." }));
    if (config.minFileSizeMb !== undefined || config.maxFileSizeMb !== undefined) result.push(step({ id: "file-size", category: "validation", title: "Проверь границы размера файла", action: "Проверь значения рядом с каждой известной границей размера.", why: "Ошибки ограничений размера часто появляются непосредственно около порога.", technique: TECHNIQUES.bva, examples: fileBoundaryValues(config.minFileSizeMb, config.maxFileSizeMb) }));
    else result.push(step({ id: "file-size-gap", category: "requirements", title: "Уточни ограничения размера файла", action: "Уточни min/max размера, если такие ограничения существуют.", why: "Мастер не может сам назначить условный лимит и построить BVA без требования." }));
    result.push(step({ id: "file-corrupt", category: "negative", title: "Проверь повреждённый или пустой файл", action: "Если такой сценарий безопасно воспроизводится, передай пустой или повреждённый файл и проверь корректный отказ.", why: "Расширение и размер сами по себе не гарантируют корректное содержимое.", technique: TECHNIQUES.negative }));
    result.push(step({ id: "file-interrupt", category: "destructive", title: "Прерви загрузку и проверь восстановление", action: "На тестовом окружении прерви загрузку/соединение, повтори операцию и проверь отсутствие битых или дублированных данных.", why: "Операция должна корректно завершаться или восстанавливаться после прерывания.", technique: TECHNIQUES.recovery, warning: "Деструктивная проверка: только тестовое окружение и тестовые данные." }));
  }

  if (config.objectType === "permissions") {
    if (config.roles?.trim()) result.push(
      step({ id: "permissions-positive", category: "positive", title: "Проверь разрешённые действия каждой роли", action: `Используй указанную матрицу ролей и прав: ${config.roles}.`, why: "Сначала подтверждаем корректные разрешения.", technique: TECHNIQUES.positive }),
      step({ id: "permissions-negative", category: "security", title: "Проверь запрещённые действия", action: "Для каждой роли попробуй действие, которое ей явно запрещено, через UI и доверенный серверный интерфейс, если он доступен тестировщику.", why: "Скрытая кнопка не является контролем доступа; запрет должен обеспечиваться на серверной стороне.", technique: TECHNIQUES.security }),
    );
    else result.push(step({ id: "permissions-gap", category: "requirements", title: "Уточни матрицу ролей и прав", action: "Получить список ролей и явно разрешённых/запрещённых действий для каждой роли.", why: "Без матрицы доступа нельзя определить ожидаемый результат проверки прав." }));
  }

  if (config.objectType === "checkout") {
    result.push(step({ id: "checkout-happy", category: "positive", title: "Пройди успешный заказ от начала до конца", action: "Добавь товар, проверь отображаемые расчёты, оформи заказ и используй только тестовый способ оплаты.", why: "Сквозной сценарий подтверждает совместную работу корзины, заказа и интеграций.", technique: TECHNIQUES.scenario }));
    if (config.checkoutRules?.trim()) result.push(step({ id: "checkout-rules", category: "validation", title: "Проверь известные правила расчёта", action: `Разбери и проверь только заданные правила: ${config.checkoutRules}. Для числовых границ примени BVA, для зависимых условий — Decision Table.`, why: "Денежные расчёты нужно проверять по фактическим правилам, а не по предполагаемым порогам.", technique: config.hasMultipleConditions ? TECHNIQUES.decision : TECHNIQUES.bva }));
    else result.push(step({ id: "checkout-gap", category: "requirements", title: "Уточни правила расчёта", action: "Узнай правила цены, скидки, доставки, округления и оплаты, которые относятся к текущему сценарию.", why: "Без известных правил нельзя корректно рассчитать границы и ожидаемые суммы." }));
    result.push(step({ id: "checkout-repeat", category: "destructive", title: "Проверь повтор и прерывание критической операции", action: "В тестовом окружении проверь двойной submit, refresh/возврат во время операции и повтор после контролируемой ошибки.", why: "Критическая операция не должна создавать двойные заказы/списания или терять состояние.", technique: TECHNIQUES.recovery, warning: "Не выполнять с реальными платежами или production-данными." }));
  }

  if (config.objectType === "stateful") {
    if (!config.states?.trim()) result.push(step({ id: "state-gap-states", category: "requirements", title: "Уточни список состояний", action: "Получить полный перечень состояний объекта и значение начального/конечных состояний, если они определены.", why: "Без состояний невозможно построить корректную модель переходов." }));
    if (!config.transitions?.trim()) result.push(step({ id: "state-gap-transitions", category: "requirements", title: "Уточни разрешённые переходы", action: "Получить список разрешённых переходов и условий перехода, если они существуют.", why: "Мастер не должен придумывать допустимые и запрещённые переходы." }));
    if (config.states?.trim() && config.transitions?.trim()) result.push(
      step({ id: "state-valid", category: "state", title: "Проверь каждый разрешённый переход", action: `Состояния: ${config.states}. Разрешённые переходы: ${config.transitions}. Выполни каждый переход из правильного исходного состояния.`, why: "Для stateful-объекта важен путь перехода, а не только конечное значение.", technique: TECHNIQUES.state }),
      step({ id: "state-invalid", category: "negative", title: "Проверь явно запрещённые переходы", action: "Используй модель требований и пробуй только те переходы, которые из неё однозначно следуют как недопустимые.", why: "Недопустимый переход не должен оставлять объект в невозможном или частично изменённом состоянии.", technique: TECHNIQUES.state }),
    );
  }

  return result;
}

function crossCuttingPlan(config: TestObjectConfig): TestPlanStep[] {
  const result: TestPlanStep[] = [];
  if (config.hasMultipleConditions) result.push(step({
    id: "decision-table", category: "combinations", title: "Разложи зависимые условия в таблицу решений",
    action: `Выпиши только известные условия и ожидаемый результат для значимых комбинаций.${config.notes?.trim() ? ` Используй требования: ${config.notes}.` : ""}`,
    why: "Когда результат зависит от нескольких условий, линейный список легко пропускает важную комбинацию.",
    technique: TECHNIQUES.decision,
  }));
  if (config.hasManyCombinations) result.push(step({
    id: "pairwise", category: "combinations", title: "Сократи большой набор независимых комбинаций попарно",
    action: "Применяй pairwise только к независимым параметрам с известными наборами значений; критические бизнес-комбинации добавь отдельно.",
    why: "Полный декартов перебор быстро становится огромным, а pairwise покрывает взаимодействие пар меньшим числом тестов.",
    technique: TECHNIQUES.pairwise,
  }));

  if (["field", "form", "auth", "search", "file-upload", "checkout"].includes(config.objectType)) result.push(step({
    id: "ux", category: "ux", title: "Проверь понятность интерфейса и ошибок",
    action: "Проверь существующие состояния loading/disabled/error/empty, сохранение введённых данных после ошибки и понятность сообщений.",
    why: "Функция может технически работать, но оставаться непонятной или провоцировать повторные действия.",
    technique: TECHNIQUES.exploratory,
  }));

  if (["field", "form", "auth", "search"].includes(config.objectType)) result.push(step({
    id: "accessibility", category: "accessibility", title: "Пройди сценарий с клавиатуры",
    action: "Проверь Tab/Shift+Tab, видимый фокус, Enter/Escape где применимо, подписи полей и доступность ошибки без мыши.",
    why: "Базовая клавиатурная доступность выявляет проблемы фокуса, семантики и порядка взаимодействия.",
  }));

  if (["field", "form", "auth", "search", "checkout"].includes(config.objectType)) result.push(step({
    id: "compatibility", category: "compatibility", title: "Проверь поддерживаемые среды", action: "Повтори основной сценарий только на поддерживаемых проектом браузерах, viewport, устройствах или ОС.", why: "Вёрстка, браузерная валидация и поведение фокуса могут различаться между средами." }));

  if (["field", "form", "auth", "search", "api", "file-upload"].includes(config.objectType)) result.push(step({
    id: "security-input", category: "security", title: "Проверь безопасную обработку пользовательского ввода", action: "В собственной тестовой системе передай HTML-подобный текст, кавычки и спецсимволы в доступные поля/параметры и убедись, что ввод не исполняется и не ломает приложение.", why: "Пользовательский ввод должен обрабатываться как данные; клиентскую валидацию нельзя считать единственной защитой.", technique: TECHNIQUES.security, examples: ["<script>alert(1)</script>", "' OR '1'='1", "<b>text</b>"], warning: "Только собственная тестовая система и разрешённое тестовое окружение." }));

  if (!["database", "file-upload", "checkout"].includes(config.objectType)) result.push(step({
    id: "destructive-recovery", category: "destructive", title: "Проверь устойчивость к прерыванию и повтору", action: "Если операция изменяет данные, на тестовом окружении проверь повторный клик/запрос, refresh, закрытие страницы или потерю соединения в безопасно воспроизводимой точке.", why: "Деструктивные и recovery-проверки выявляют дубликаты, частично сохранённые данные и проблемы восстановления.", technique: TECHNIQUES.recovery, warning: "Пропусти этот шаг на Production или если нет безопасного способа воспроизвести сбой." }));

  result.push(step({ id: "error-guessing", category: "exploratory", title: "Сделай короткий проход Error Guessing", action: "Используя уже изученное поведение, попробуй реалистичные ошибки: двойное действие, быстрые переключения, необычный порядок шагов, возврат назад и повтор после ошибки.", why: "После системных техник тестировщик уже знает слабые места объекта и может искать дефекты вне формальной модели.", technique: TECHNIQUES.errorGuessing }));
  result.push(step({ id: "retest", category: "regression", title: "После исправления выполни Retest", action: "Повтори ровно те шаги и данные, на которых был найден дефект, и проверь фактическое исправление.", why: "Retest подтверждает конкретный fix и не заменяется общей регрессией.", technique: TECHNIQUES.retest }));
  result.push(step({ id: "regression", category: "regression", title: "Заверши регрессией связанных сценариев", action: "После изменений повтори Happy Path и связанные критичные сценарии, которые могло затронуть исправление.", why: "Исправление дефекта может повлиять на соседнее поведение.", technique: TECHNIQUES.regression }));
  return result;
}

export function buildTestPlan(config: TestObjectConfig): TestPlanStep[] {
  return [...objectSpecificPlan(config), ...crossCuttingPlan(config)];
}
