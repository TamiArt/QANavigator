import * as React from "react";
import {
  ShieldCheck, ClipboardCheck, Bug, Search, Clock3, Target, Users, FileText,
  Gauge, Layers3, GitBranch, Rocket, BookOpen, CheckCircle2, AlertTriangle,
  ListChecks, FlaskConical, Network, Code2, Workflow, Repeat2, Lightbulb,
  Table2, LockKeyhole, Zap, ArrowRight, ArrowDown, Eye, Puzzle, Scale, Monitor,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;
export type Module1InfographicTile = { emoji?: string; title: string; text: string; icon: IconType; tone?: string };
export type Module1InfographicVisual = {
  eyebrow: string;
  headline: string;
  description: string;
  flow?: string[];
  tiles: Module1InfographicTile[];
  takeaway: string;
  layout?: "compare" | "steps" | "pyramid" | "matrix" | "grid";
};

const tile = (emoji: string, title: string, text: string, icon: IconType, tone = "blue"): Tile =>
  ({ emoji, title, text, icon, tone });

const LESSONS: Record<string, Module1InfographicVisual> = {
  "m1-02": {
    eyebrow: "ТРИ ПОНЯТИЯ — ТРИ УРОВНЯ РАБОТЫ С КАЧЕСТВОМ",
    headline: "QA → QC → Testing",
    description: "Обеспечение качества, контроль результата и непосредственное выполнение проверок связаны, но не равны друг другу.",
    layout: "compare",
    tiles: [
      tile("🛡️", "QA — Quality Assurance", "Превентивная деятельность: процессы, стандарты и методологии помогают предотвращать дефекты. Фокус — как организована работа на протяжении SDLC.", ShieldCheck, "violet"),
      tile("🔎", "QC — Quality Control", "Реактивная деятельность: проверяем готовый продукт на соответствие требованиям. Фокус — качество результата.", ClipboardCheck, "mint"),
      tile("🐞", "Testing — тестирование", "Конкретный процесс выполнения и исследования продукта с целью обнаружения дефектов. Testing — часть QC.", Bug, "rose"),
    ],
    flow: ["Процессы и профилактика", "Проверка продукта", "Поиск дефектов"],
    takeaway: "QA шире тестирования. QC контролирует продукт, а Testing — конкретная часть этой работы."
  },
  "m1-03": {
    eyebrow: "ISTQB CTFL v4.0 · 7 ПРИНЦИПОВ",
    headline: "Как мыслит тестировщик",
    description: "Принципы помогают выбирать разумный объём проверок, работать с рисками и правильно трактовать результаты.",
    layout: "grid",
    tiles: [
      tile("⚠️", "1. Тестирование показывает наличие дефектов, но не их отсутствие", "Успешные тесты не гарантируют, что в продукте нет других дефектов.", AlertTriangle, "rose"),
      tile("🧩", "2. Исчерпывающее тестирование невозможно", "Нельзя проверить все входы и комбинации. Используй риски и техники тест-дизайна.", Puzzle, "violet"),
      tile("⏱️", "3. Раннее тестирование экономит время (Shift-Left)", "Начинай анализ и проверки как можно раньше: исправлять найденное до реализации обычно дешевле. Shift-Left.", Clock3, "blue"),
      tile("🐛", "4. Скопление дефектов (Defect Clustering)", "Большая часть дефектов часто сосредоточена в небольшом числе модулей. Уделяй этим зонам больше внимания.", Bug, "rose"),
      tile("🧪", "5. Парадокс пестицида", "Повторение одних и тех же тестов перестаёт находить новое. Обновляй и разнообразь проверки.", FlaskConical, "mint"),
      tile("🧭", "6. Тестирование зависит от контекста", "Подход зависит от продукта, рисков, требований, среды и целей. Универсального набора тестов нет.", Network, "yellow"),
      tile("🎯", "7. Заблуждение об отсутствии дефектов", "Даже без найденных багов продукт может не решать задачу пользователя. Проверяй пригодность результата.", Target, "blue"),
    ],
    takeaway: "«Тесты прошли» не равно «продукт идеален»: оценивай риски, контекст и пользу для пользователя."
  },
  "m1-04": {
    eyebrow: "ДВА ВОПРОСА — ДВА РАЗНЫХ ВИДА ПРОВЕРКИ",
    headline: "Верификация и валидация",
    description: "Обе проверки нужны, чтобы понять качество продукта, но отвечают на разные вопросы.",
    layout: "compare",
    tiles: [
      tile("📐", "Верификация · Verification", "«Правильно ли мы создаём продукт?» Сверяем артефакты и реализацию с заданными требованиями, спецификациями и правилами.", FileText, "blue"),
      tile("🙋", "Валидация · Validation", "«Тот ли продукт мы создаём?» Проверяем, подходит ли полученный продукт пользователю и решает ли его реальную задачу.", Users, "mint"),
    ],
    flow: ["Требования и спецификация", "Созданный продукт", "Потребность пользователя"],
    takeaway: "Верификация — соответствие спецификации. Валидация — соответствие потребности."
  },
  "m1-05": {
    eyebrow: "ОТ ПОТРЕБНОСТИ К ПРОВЕРЯЕМОМУ РЕЗУЛЬТАТУ",
    headline: "Требования — основа тестирования",
    description: "Требование задаёт обязательное условие или критерий, по которому QA определяет ожидаемое поведение системы.",
    layout: "steps",
    flow: ["Бизнес-потребность", "Пользовательская цель", "Продуктное требование", "Тест и ожидаемый результат"],
    tiles: [
      tile("🏢", "Бизнес-требования", "Зачем нужен продукт и какую пользу он должен дать бизнесу.", Target, "violet"),
      tile("👤", "Пользовательские требования", "Что пользователь должен уметь делать; часто User Story или Use Case.", Users, "blue"),
      tile("⚙️", "Продуктные требования", "Как система должна работать, чтобы реализовать бизнес- и пользовательские цели.", Code2, "mint"),
      tile("✅", "Функциональные", "Что делает система: функции, действия, расчёты, проверки и бизнес-логика.", Zap, "blue"),
      tile("✨", "Нефункциональные", "Как система работает: производительность, безопасность, удобство, надёжность и совместимость.", Gauge, "yellow"),
      tile("🧾", "Хорошее требование", "Полное, однозначное, атомарное, непротиворечивое, выполнимое, проверяемое, прослеживаемое и приоритизированное.", ListChecks, "mint"),
      tile("🔗", "SRS и RTM", "SRS фиксирует требования. Матрица RTM связывает требования с тест-кейсами и помогает увидеть непокрытые функции и влияние изменений.", GitBranch, "violet"),
    ],
    takeaway: "Если ожидаемое поведение не определено или допускает разные трактовки — не придумывай его, уточни требование."
  },
  "m1-06": {
    eyebrow: "SOFTWARE DEVELOPMENT LIFE CYCLE",
    headline: "SDLC — жизненный цикл разработки ПО",
    description: "SDLC описывает путь продукта от идеи и требований до разработки, проверки и релиза.",
    layout: "steps",
    flow: ["Идея", "Требования", "Проектирование", "Разработка", "Тестирование", "Релиз"],
    tiles: [
      tile("💡", "Идея и потребность", "Определяем проблему, цель продукта и ожидаемую пользу.", Lightbulb, "yellow"),
      tile("📝", "Требования", "Формулируем, что и зачем должен делать продукт; QA ищет пробелы и неоднозначности.", FileText, "blue"),
      tile("🎨", "Проектирование", "Продумываем архитектуру, структуру и пользовательский интерфейс.", Layers3, "violet"),
      tile("💻", "Разработка", "Команда реализует спроектированное поведение и функциональность.", Code2, "mint"),
      tile("🧪", "Тестирование", "Проверяем реализацию, сопоставляем фактический результат с ожидаемым и фиксируем дефекты.", FlaskConical, "rose"),
      tile("🚀", "Релиз", "Доставляем версию пользователям и получаем обратную связь для дальнейшего развития.", Rocket, "blue"),
    ],
    takeaway: "QA полезен на всём SDLC: анализ требований и подготовка проверок начинаются до появления готового кода."
  },
  "m1-07": {
    eyebrow: "SOFTWARE TESTING LIFE CYCLE",
    headline: "STLC — жизненный цикл тестирования ПО",
    description: "STLC описывает последовательность работ QA: от понимания требований до итогов тестирования.",
    layout: "steps",
    flow: ["Анализ", "Планирование", "Тест-дизайн", "Подготовка", "Выполнение", "Завершение"],
    tiles: [
      tile("🔍", "1. Анализ требований", "Изучаем требования, продукт, объём и тестируемость; отмечаем вопросы и риски.", Search, "blue"),
      tile("🗺️", "2. Планирование", "Определяем стратегию, ресурсы, сроки, приоритеты и критерии завершения.", Target, "violet"),
      tile("🧩", "3. Тест-дизайн", "Выбираем техники, проектируем сценарии и тест-кейсы, определяем ожидаемые результаты.", Puzzle, "yellow"),
      tile("🧰", "4. Подготовка", "Готовим тестовые данные, окружение и необходимые инструменты.", Workflow, "mint"),
      tile("▶️", "5. Выполнение", "Запускаем проверки, фиксируем результаты, регистрируем дефекты и проводим повторные проверки.", FlaskConical, "rose"),
      tile("📊", "6. Завершение", "Подводим итоги, анализируем покрытие и дефекты, сохраняем отчёт и выводы.", ClipboardCheck, "blue"),
    ],
    takeaway: "SDLC — жизненный цикл всего продукта. STLC — жизненный цикл тестовых работ внутри разработки."
  },
  "m1-08": {
    eyebrow: "ДВА НЕЗАВИСИМЫХ КРИТЕРИЯ ОЦЕНКИ ДЕФЕКТА",
    headline: "Severity vs Priority",
    description: "Серьёзность показывает силу влияния дефекта, а приоритет — срочность его исправления.",
    layout: "matrix",
    tiles: [
      tile("💥", "Severity · Серьёзность", "Насколько сильно дефект влияет на систему, функциональность или пользователя.", AlertTriangle, "rose"),
      tile("⏰", "Priority · Приоритет", "Насколько срочно дефект нужно исправить с учётом потребностей и планов проекта.", Clock3, "yellow"),
      tile("🧭", "Решение команды", "Оценивай влияние и срочность отдельно. Высокая серьёзность не автоматически означает такой же приоритет — и наоборот.", Scale, "violet"),
    ],
    takeaway: "Severity = насколько сильно влияет. Priority = насколько срочно исправлять."
  },
  "m1-09": {
    eyebrow: "КЛАССИФИКАЦИЯ · НЕ ОДНА ЛИНЕЙНАЯ ШКАЛА",
    headline: "Виды тестирования: смотри на систему с разных сторон",
    description: "Классификация помогает определить, что проверяем, каким способом, на каком уровне и с какой целью. Один тест может относиться сразу к нескольким группам.",
    layout: "grid",
    tiles: [
      tile("🎯", "По цели", "Функциональное — что делает система. Нефункциональное — как хорошо она работает: производительность, безопасность, удобство, надёжность и совместимость.", Target, "blue"),
      tile("📄", "По запуску", "Статическое — анализ требований, макетов, документации и кода без запуска программы. Динамическое — проверки работающей системы, UI и API.", FileText, "violet"),
      tile("📦", "По уровню", "Unit — отдельная часть; Integration — взаимодействие; System — вся система; Acceptance / UAT — бизнес-критерии и ожидания заказчика.", Layers3, "mint"),
      tile("📦", "По знанию системы", "Black Box — без знания внутренней реализации; Grey Box — частичное знание API, БД или логов; White Box — знание кода и внутренних путей.", Eye, "yellow"),
      tile("🧑‍💻", "По способу выполнения", "Manual — человек выполняет проверки. Automated — проверки выполняет код или инструмент. Автоматизация — способ выполнения, а не самостоятельная цель.", Code2, "blue"),
      tile("🧪", "По сценарию", "Positive — корректные данные. Negative — ошибочные или недопустимые. Destructive — отказные и предельные условия только в разрешённой среде. E2E — полный сценарий.", FlaskConical, "rose"),
      tile("🧭", "По формализации", "Scripted — по тест-кейсам; Exploratory — исследование, проектирование и выполнение одновременно; Ad hoc — неформальная проверка на основе опыта.", Search, "violet"),
      tile("🔁", "По цели повторной проверки", "Smoke — пригодность сборки; Sanity — узкая проверка изменения; Re-test — исправленный дефект; Regression — отсутствие побочных поломок.", Repeat2, "mint"),
    ],
    takeaway: "Не пытайся выбрать только один ярлык: одна проверка может быть, например, функциональной, динамической, ручной и интеграционной одновременно."
  },
  "m1-10": {
    eyebrow: "TESTING PYRAMID · ОТ МАЛОГО К БОЛЬШОМУ ОХВАТУ",
    headline: "Пирамида уровней тестирования",
    description: "Уровни различаются масштабом проверки: от отдельной части кода до соответствия продукта бизнес-потребностям.",
    layout: "pyramid",
    tiles: [
      tile("🧱", "Unit · Модульное", "Проверяем отдельную функцию, метод, класс или небольшой компонент в изоляции. Обычно таких проверок много, они быстрые.", Code2, "mint"),
      tile("🔗", "Integration · Интеграционное", "Проверяем взаимодействие модулей, сервисов, БД и внешних систем.", Network, "blue"),
      tile("🖥️", "System · Системное", "Проверяем систему как единое целое на соответствие системным и пользовательским требованиям.", Monitor, "violet"),
      tile("🎯", "Acceptance / UAT · Приёмочное", "Проверяем соответствие критериям приёмки, бизнес-потребностям и ожиданиям заказчика или пользователей.", Users, "yellow"),
    ],
    takeaway: "От Unit к Acceptance обычно растут охват, сложность и стоимость проверки. Уровни дополняют друг друга."
  },
  "m1-11": {
    eyebrow: "TEST DESIGN · ВЫБИРАЕМ ПРОВЕРКИ ОСМЫСЛЕННО",
    headline: "Техники тест-дизайна",
    description: "Техники помогают сократить избыточные проверки и при этом не пропустить важные классы ошибок.",
    layout: "grid",
    tiles: [
      tile("🧩", "Эквивалентное разбиение", "Делим входные данные на классы, внутри которых система должна вести себя одинаково. Берём представителей классов вместо проверки каждого значения.", Puzzle, "violet"),
      tile("📏", "Анализ граничных значений", "Проверяем значения на границе классов и рядом с ней: именно около границ часто возникают ошибки.", Scale, "blue"),
      tile("🔀", "Pairwise · Попарное тестирование", "Подбираем набор тестов так, чтобы покрыть пары значений параметров и уменьшить число комбинаций.", Network, "mint"),
      tile("📋", "Decision Table · Таблица решений", "Описываем сочетания условий и соответствующие действия. Помогает проверять бизнес-правила с несколькими условиями.", Table2, "yellow"),
      tile("🔄", "State Transition · Переходы состояний", "Моделируем состояния системы, события и переходы между ними. Проверяем как допустимые, так и недопустимые переходы.", GitBranch, "rose"),
      tile("🧭", "Exploratory · Исследовательское", "Одновременно изучаем систему, формируем гипотезы, проектируем проверки и выполняем их. Фиксируем наблюдения и дефекты.", Search, "blue"),
    ],
    takeaway: "Тест-дизайн отвечает на вопрос: какие проверки дадут максимальную ценность при разумном объёме?"
  }
};

const TONES: Record<string, string> = {
  blue: "border-sky-200 bg-sky-50 text-blue-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
  mint: "border-emerald-200 bg-emerald-50 text-emerald-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
};

function FlowStrip({ items }: { items: string[] }) {
  return <div className="rounded-2xl border-2 border-blue-100 bg-white p-3 sm:p-4">
    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-blue-600">СХЕМА / ПОСЛЕДОВАТЕЛЬНОСТЬ</p>
    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-1.5">
      {items.map((item, index) => <React.Fragment key={item}>
        <div className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-center text-[10px] font-extrabold leading-tight text-blue-950">
          <span className="mr-1.5 text-blue-500">{String(index + 1).padStart(2, "0")}</span>{item}
        </div>
        {index < items.length - 1 ? <><ArrowDown className="mx-auto h-3.5 w-3.5 text-blue-300 sm:hidden" /><ArrowRight className="hidden h-4 w-4 shrink-0 text-blue-300 sm:block" /></> : null}
      </React.Fragment>)}
    </div>
  </div>;
}

function TileCard({ item, index }: { item: Module1InfographicTile; index: number }) {
  const Icon = item.icon;
  return <article className="flex min-w-0 gap-3 rounded-[18px] border-2 border-blue-100 bg-white p-3 shadow-[2px_3px_0_rgba(30,64,175,0.05)]">
    <div className="flex shrink-0 flex-col items-center gap-1">
      <span className={"flex h-11 w-11 items-center justify-center rounded-2xl border " + (TONES[item.tone ?? "blue"] ?? TONES.blue)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-[9px] font-black text-blue-400">{String(index + 1).padStart(2, "0")}</span>
    </div>
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        {item.emoji ? <span className="text-base leading-none" aria-hidden="true">{item.emoji}</span> : null}
        <h5 className="text-[12px] font-extrabold leading-tight text-blue-950">{item.title}</h5>
      </div>
      <p className="text-[10px] leading-[1.55] text-slate-600">{item.text}</p>
    </div>
  </article>;
}

function Pyramid({ tiles }: { tiles: Module1InfographicTile[] }) {
  return <div className="rounded-2xl border-2 border-blue-100 bg-white p-3 sm:p-4">
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5">
      {tiles.slice().reverse().map((item, index) => {
        const width = [58, 72, 86, 100][index] ?? 100;
        return <div key={item.title} style={{ width: width + "%" }} className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-sky-50 to-violet-50 px-3 py-2 text-center shadow-sm">
          <span className="mr-2 text-base">{item.emoji}</span><span className="text-[11px] font-black text-blue-950">{item.title}</span>
          <p className="mt-1 text-[9px] leading-snug text-slate-600">{item.text}</p>
        </div>;
      })}
    </div>
  </div>;
}

function SeverityPriorityMatrix() {
  return <div className="rounded-2xl border-2 border-blue-100 bg-white p-3 sm:p-4">
    <p className="mb-2 text-center text-[10px] font-black uppercase tracking-wider text-blue-700">ДВА КРИТЕРИЯ ОЦЕНИВАЮТСЯ ОТДЕЛЬНО</p>
    <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-center">
      <div className="flex items-center justify-center rounded-lg bg-slate-50 p-2 text-[9px] font-bold text-slate-500">Критерий</div>
      <div className="rounded-lg bg-sky-50 p-2 text-[10px] font-extrabold text-blue-800">Низкий Priority</div>
      <div className="rounded-lg bg-amber-50 p-2 text-[10px] font-extrabold text-amber-800">Высокий Priority</div>
      <div className="flex items-center justify-center rounded-lg bg-rose-50 p-2 text-[10px] font-extrabold text-rose-800">Высокий Severity</div>
      <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-[10px] text-slate-700">Сильное влияние, но исправление может быть не самым срочным</div>
      <div className="rounded-lg border border-rose-300 bg-rose-100 p-3 text-[10px] font-bold text-rose-900">Сильное влияние + срочное исправление</div>
      <div className="flex items-center justify-center rounded-lg bg-emerald-50 p-2 text-[10px] font-extrabold text-emerald-800">Низкий Severity</div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-[10px] text-slate-700">Небольшое влияние, не срочно</div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[10px] text-slate-700">Небольшое влияние, но исправить нужно скоро</div>
    </div>
    <p className="mt-2 text-center text-[9px] text-slate-500">Схема показывает независимость критериев, а не готовые правила приоритизации проекта.</p>
  </div>;
}

export function Module1StyleInfographic({ visual }: { visual: Module1InfographicVisual }) {
  return <div className="bg-[linear-gradient(rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:18px_18px] p-3 sm:p-5">
    <div className="mb-3 rounded-[22px] border-2 border-blue-100 bg-gradient-to-br from-white via-sky-50/70 to-violet-50/40 p-4 sm:p-5">
      <div className="mb-2 inline-flex rounded-full bg-blue-700 px-2.5 py-1 text-[9px] font-black tracking-wider text-white">{visual.eyebrow}</div>
      <h5 className="text-base font-black leading-tight text-blue-950 sm:text-lg">{visual.headline}</h5>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-600">{visual.description}</p>
    </div>
    {visual.flow ? <div className="mb-3"><FlowStrip items={visual.flow} /></div> : null}
    {visual.layout === "pyramid" ? <div className="mb-3"><Pyramid tiles={visual.tiles} /></div> : null}
    {visual.layout === "matrix" ? <div className="mb-3"><SeverityPriorityMatrix /></div> : null}
    <div className={"columns-1 gap-2.5 " + (visual.tiles.length >= 6 ? "sm:columns-2" : "sm:columns-2 lg:columns-3")}>
      {visual.tiles.map((item, index) => <div key={item.title} className="mb-2.5 break-inside-avoid"><TileCard item={item} index={index} /></div>)}
    </div>
    <div className="mt-3 flex items-start gap-3 rounded-[18px] border-2 border-amber-200 bg-amber-50 px-3.5 py-3">
      <span className="text-xl" aria-hidden="true">💡</span>
      <div><p className="text-[11px] font-extrabold text-amber-950">Главное, что нужно запомнить</p><p className="mt-1 text-[10px] leading-[1.5] text-amber-900">{visual.takeaway}</p></div>
    </div>
  </div>;
}

export function Module1LessonInfographic({ lessonId }: { lessonId: string }) {
  const visual = LESSONS[lessonId];
  return visual ? <Module1StyleInfographic visual={visual} /> : null;
}
