# QA Navigator — Навигатор тестировщика

> Полная документация проекта: архитектура, модули, реализация, слабые места и план доработки.

---

## Содержание

1. [Обзор проекта](#1-обзор-проекта)
2. [Технический стек](#2-технический-стек)
3. [Архитектура приложения](#3-архитектура-приложения)
4. [Структура файлов](#4-структура-файлов)
5. [Глобальное состояние и хуки](#5-глобальное-состояние-и-хуки)
6. [AI-интеграция](#6-ai-интеграция)
7. [Модули приложения](#7-модули-приложения)
8. [База знаний (Handbook)](#8-база-знаний-handbook)
9. [Общие UI-компоненты](#9-общие-ui-компоненты)
10. [Дизайн-система и темизация](#10-дизайн-система-и-темизация)
11. [Слабые места](#11-слабые-места)
12. [План доработки](#12-план-доработки)

---

## 1. Обзор проекта

**QA Navigator** — одностраничное React-приложение (SPA) для QA-инженеров. Объединяет в одном интерфейсе весь инструментарий, необходимый тестировщику в ежедневной работе:

- Генерация артефактов тестирования через AI (чеклисты, тест-кейсы, баг-репорты, автотесты, релизные отчёты, тестовые данные)
- Интерактивная база знаний по теории тестирования (79 тем в 8 категориях)
- Управление тест-кейсами и баг-репортами с локальным хранилищем
- Поддержка двух AI-провайдеров: OpenRouter (бесплатные модели) и Google Gemini

**Целевая аудитория:** junior- и middle-QA-инженеры, студенты курсов тестирования.

**Деплой:** Vercel / любой статический хостинг (SPA без серверной части).

---

## 2. Технический стек

### Core
| Технология | Версия | Назначение |
|-----------|--------|-----------|
| React | 18 | UI-фреймворк |
| TypeScript | 5.x | Статическая типизация |
| Vite | 6.x | Сборщик и dev-server |
| Tailwind CSS | 4.x | Утилитарные стили |

### UI-библиотеки
| Библиотека | Назначение |
|-----------|-----------|
| `lucide-react` | Иконки (SVG) |
| `@radix-ui/*` | Доступные примитивы (Dialog, Accordion, Tabs и др.) |
| `motion` (framer-motion v12) | Анимации |
| `recharts` | Графики (релизный отчёт) |
| `sonner` | Toast-уведомления |
| `clsx` + `tailwind-merge` | Управление классами |

### Шрифты
- **Inter** — основной интерфейсный шрифт
- **JetBrains Mono** — код и моноширинные блоки

### AI-провайдеры (browser-to-API, без proxy)
| Провайдер | Модель по умолчанию | Особенность |
|----------|-------------------|------------|
| OpenRouter | `mistralai/mistral-7b-instruct:free` | Бесплатная, CORS-совместимая |
| Google Gemini | `gemini-1.5-flash-latest` | Быстрая, бесплатный tier |

---

## 3. Архитектура приложения

```
┌─────────────────────────────────────────────────────────┐
│                    React Context (AppCtx)                │
│  apiKeys · darkMode · activeModule · testCases ·         │
│  bugReports · bookmarks · selectedTechnique             │
└────────────────────────┬────────────────────────────────┘
                         │ useContext
          ┌──────────────┼──────────────────┐
          │              │                  │
    Sidebar         Main Area          ApiModal
    (навигация)   (8 модулей)       (настройка ключей)
          │              │
          └──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │        callAI()            │  ← единая точка AI-вызовов
    │  OpenRouter │ Gemini REST  │
    └────────────────────────────┘
```

### Принципы архитектуры

**Монолитный SPA.** Весь код находится в одном файле `src/app/App.tsx` (~5 700 строк). Это сознательное решение для простоты деплоя и отсутствия зависимостей от роутера.

**Без серверной части.** AI-запросы идут напрямую из браузера к API OpenRouter и Gemini. CORS разрешён обоими провайдерами.

**Персистентность через `localStorage`.** Все пользовательские данные (тест-кейсы, баг-репорты, закладки, API-ключи) хранятся локально. При закрытии вкладки данные сохраняются.

**Одно дерево состояния.** React Context (`AppCtx`) — единый источник истины. Нет Zustand/Redux — намеренно, чтобы не усложнять.

---

## 4. Структура файлов

```
/
├── QA_NAVIGATOR.md              ← этот файл
├── package.json
├── vite.config.ts
├── postcss.config.mjs
└── src/
    ├── app/
    │   └── App.tsx              ← весь код приложения (~5 700 строк)
    ├── styles/
    │   ├── fonts.css            ← импорты Google Fonts
    │   ├── theme.css            ← CSS-переменные (design tokens)
    │   └── index.css            ← Tailwind directives + @theme inline
    └── imports/                 ← пользовательские загрузки (PDF, изображения)
```

---

## 5. Глобальное состояние и хуки

### `useLocalStorage<T>(key, initial)`

```typescript
function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void]
```

Кастомный хук. При первом чтении пробует десериализовать значение из `localStorage`; при записи — сразу сохраняет. Обёртка над `useState`.

**Слабое место:** нет синхронизации между вкладками (event `storage` не слушается).

### `AppCtx` — React Context

Поля контекста:

| Поле | Тип | Назначение |
|------|-----|-----------|
| `apiKeys` | `ApiKeys` | Ключи провайдеров + выбранный провайдер |
| `darkMode` | `boolean` | Тёмная тема |
| `activeModule` | `string` | Текущий активный модуль |
| `testCases` | `TestCase[]` | Созданные тест-кейсы |
| `checklists` | `ChecklistItem[]` | Чеклисты |
| `bugReports` | `BugReport[]` | Баг-репорты |
| `bookmarks` | `string[]` | ID закладок в Handbook |
| `selectedTechnique` | `string \| null` | Мост «Handbook → TestDesign» |

### Типы данных

```typescript
interface ChecklistItem {
  id: string;
  text: string;
  category: "positive" | "negative" | "boundary" | "nonfunctional";
  checked: boolean;
}

interface TestCase {
  id: string;
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  steps: string[];
  expected: string;
  status: "untested" | "passed" | "failed" | "blocked";
  notes: string;
}

interface BugReport {
  id: string;
  title: string;
  severity: "S1" | "S2" | "S3" | "S4" | "S5";
  priority: "P1" | "P2" | "P3" | "P4";
  environment: string;
  steps: string;
  actual: string;
  expected: string;
  status: "new" | "in-progress" | "fixed" | "closed";
}

interface ApiKeys {
  openrouter: string;
  gemini: string;
  provider: "openrouter" | "gemini";
}

interface HandbookTopic {
  id: string;
  title: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  tags: string[];
  content: string;  // Markdown
}
```

---

## 6. AI-интеграция

### `enrichNetworkError(e, provider, url): Error`

Обогащает сетевые ошибки (`TypeError: Failed to fetch`) диагностической информацией о провайдере, URL и возможных причинах (CORS, VPN, нет сети).

### `callAI(apiKeys, systemPrompt, userPrompt): Promise<string>`

Единая точка входа для всех AI-запросов.

**Алгоритм:**
```
1. Проверить наличие хотя бы одного ключа → иначе throw
2. Если provider === "gemini" && gemini-ключ задан:
   a. POST https://generativelanguage.googleapis.com/.../generateContent
   b. Парсить candidates[0].content.parts[0].text
   c. При HTTP-ошибке — парсить тело ответа и обогащать сообщение
3. Иначе (OpenRouter):
   a. POST https://openrouter.ai/api/v1/chat/completions
   b. Модель: mistralai/mistral-7b-instruct:free
   c. Парсить choices[0].message.content
   d. При HTTP-ошибке — парсить error.message из тела
4. При TypeError (сеть) — enrichNetworkError()
5. При пустом ответе — throw с деталями (finish_reason, сырое тело)
```

### `QA_SYSTEM_PROMPT`

Системный промпт для всех AI-запросов. Устанавливает роль «Senior QA Engineer» и предписывает следовать стандартам:
- ISTQB CTFL v4.0
- ISO 25010
- ISO/IEC/IEEE 29119
- OWASP Top 10 2021

---

## 7. Модули приложения

### Модуль 1: Анализ требований (`RequirementsModule`)

**Назначение:** AI анализирует текст требований и возвращает структурированный отчёт.

**Выходной формат (Markdown):**
- Выявленные неопределённости
- Потенциальные риски
- Рекомендуемые техники тест-дизайна
- Готовые вопросы к разработчику/аналитику

**Реализация:** текстовое поле → `callAI()` с промптом на анализ по ISTQB → `MarkdownView`.

---

### Модуль 2: Тест-дизайн (`TestDesignModule`)

**Назначение:** генерация чеклистов и тест-кейсов на основе описания фичи.

**Функции:**
- Выбор техники тест-дизайна из Handbook (мост через `selectedTechnique`)
- Выбор пресета (форма, авторизация, оплата и т.д.)
- Генерация чеклиста (AI → JSON → `ChecklistItem[]`)
- Генерация тест-кейсов (AI → JSON → `TestCase[]`)
- Ручное добавление/редактирование тест-кейсов
- Изменение статуса тест-кейса (untested/passed/failed/blocked)
- Экспорт в Markdown

**AI-парсинг:** ответ AI оборачивается в `try/catch` с попыткой извлечь JSON из markdown-блоков (````json ... ````).

---

### Модуль 3: Выполнение тестов (`TestExecutionModule`)

**Назначение:** журнал выполнения тестов + генерация баг-репортов.

**Функции:**
- Отображение всех тест-кейсов с фильтрацией по статусу
- Прогон: отметить passed/failed/blocked
- При failed — AI генерирует черновик баг-репорта
- Ручное редактирование полей баг-репорта (severity, priority, шаги, ожидание/факт)
- Сохранение баг-репортов в localStorage
- Панель сводки: счётчики по статусам

---

### Модуль 4: Генератор автотестов (`AutomationModule`)

**Назначение:** генерация кода автотестов по тест-кейсам.

**Поддерживаемые стеки (19 вариантов):**

| Язык | Фреймворки |
|------|-----------|
| Python | Playwright, Selenium, Pytest+Requests |
| TypeScript | Playwright, Cypress |
| JavaScript | Playwright, Cypress |
| Java | Selenium+JUnit 5, Selenium+TestNG, REST Assured |
| Kotlin | JUnit 5, Espresso |
| C# | NUnit, xUnit, SpecFlow |
| Ruby | Capybara+RSpec |
| Go | Playwright |
| Swift | XCUITest |
| PHP | Codeception |

**Реализация:** AI получает тест-кейс + стек → возвращает код с паттерном Page Object Model → отображается в `CodeBlock` с подсветкой и кнопкой копирования.

---

### Модуль 5: Релизный отчёт (`ReleaseReportModule`)

**Назначение:** автоматическая генерация отчёта о тестировании для передачи команде/заказчику.

**Входные данные:**
- Версия релиза, дата, окружение
- Статистика из текущей сессии (тест-кейсы, баг-репорты)
- Дополнительный контекст (опционально)

**Выходной формат:** структурированный Markdown с разделами: исполнительное резюме, метрики, критические дефекты, рекомендации, вердикт.

**Дополнительно:** `recharts` PieChart для визуализации соотношения passed/failed/blocked.

---

### Модуль 6: Генератор тестовых данных (`TestDataModule`)

**Назначение:** быстрая генерация тестовых данных разных категорий.

**Встроенные наборы (без AI):**
- Граничные значения (boundary)
- Спецсимволы и инъекции (special, XSS, SQL injection)
- Невалидные email-адреса
- Проблемные даты (29 фев невисокосного года, 00/00/0000 и т.д.)

**AI-генерация:** произвольные наборы данных по описанию пользователя.

**Вывод:** таблица с кнопками копирования отдельных значений и всего набора.

---

### Модуль 7: База знаний (`HandbookModule`)

Подробно описан в разделе 8.

---

### Модуль 8: Настройки (`SettingsModule`)

**Функции:**
- Ввод/сохранение API-ключей (OpenRouter, Gemini)
- Выбор активного AI-провайдера
- Переключение темы (dark/light)
- Экспорт всех данных в JSON (тест-кейсы + баг-репорты + закладки)
- Импорт данных из JSON
- Полная очистка localStorage

---

## 8. База знаний (Handbook)

### Структура данных

Константа `HANDBOOK: HandbookTopic[]` — 79 тем, встроенных в код. Нет внешней БД — всё в `App.tsx`.

### Категории и темы

| Категория | Тем | Уровни |
|----------|-----|--------|
| Основы тестирования | 10 | beginner–intermediate |
| Техники тест-дизайна | 6 | beginner–intermediate |
| Виды тестирования | 7 | beginner–intermediate |
| Тестовая документация | 5 | beginner–intermediate |
| Основы автотестирования | 4 | intermediate–advanced |
| Web и API тестирование | 11 | beginner–intermediate |
| Тестирование мобильных приложений | 5 | beginner–intermediate |
| Тестирование игр | 7 | beginner–advanced |

### Полный список тем

**Основы тестирования:**
- f1: QA vs QC vs Testing
- f2: 7 принципов тестирования (ISTQB)
- f3: STLC — жизненный цикл тестирования
- f4: Shift-Left и психология тестировщика
- f5: Уровни тестирования (Unit → Acceptance)
- f6: SDLC и STLC: от требований до релиза
- f7: Валидация vs Верификация
- f8: Agile и Scrum для тестировщика
- f9: Риск-ориентированное тестирование
- f10: Метрики качества тестирования

**Техники тест-дизайна:**
- td1: Классы эквивалентности (EP)
- td2: Анализ граничных значений (BVA)
- td3: Таблицы решений
- td4: Переходы состояний
- td5: Исследовательское тестирование + Error Guessing
- td6: Попарное тестирование (Pairwise)

**Виды тестирования:**
- tt1: Функциональное vs нефункциональное
- tt2: Smoke, Sanity, Regression, Re-testing
- tt3: OWASP Top 10
- tt4: Нагрузочное тестирование (6 видов)
- tt5: Чёрный, белый, серый ящик
- tt6: Тестирование безопасности (XSS, CSRF, SQLi)
- tt7: Локализация и интернационализация

**Тестовая документация:**
- doc1: Анатомия баг-репорта
- doc2: Чеклист vs Тест-кейс
- doc3: Тест-план: структура
- doc4: RTM — матрица трассировки требований
- doc5: Жизненный цикл дефекта + Severity vs Priority

**Основы автотестирования:**
- auto1: Page Object Model
- auto2: Сравнение фреймворков 2026
- auto3: Пирамида тестирования
- auto4: CI/CD и автотесты в пайплайне

**Web и API тестирование:**
- web1: HTTP методы и коды статусов
- web2: REST API тестирование
- web3: Chrome DevTools для QA
- web4: Клиент-серверная архитектура
- web5: Аутентификация (Basic Auth, Bearer, OAuth 2.0, JWT)
- web6: GraphQL и gRPC тестирование
- web7: SQL для тестировщика
- web8: Мобильное тестирование: виды приложений
- web9: Docker и Git для QA
- web10: Инструменты (Jira, TestRail, Postman, Kibana)
- web11: WebSocket тестирование

**Тестирование мобильных приложений:**
- mob1: Стратегия мобильного тестирования
- mob2: Полный чеклист мобильного тестирования
- mob3: Производительность мобильных приложений
- mob4: Push-уведомления, геолокация, deep links
- mob5: Бета-тестирование (TestFlight, Firebase, Play Console)

**Тестирование игр:**
- game1: Введение: специфика и отличия от ПО
- game2: Виды тестирования игр (геймплей, баланс, совместимость)
- game3: Производительность и графика (FPS, Unity/Unreal Profiler)
- game4: Тестирование мультиплеера и сетевого кода
- game5: Баг-репорты в играх: структура и специфика
- game6: Тестирование мобильных игр (F2P, Gacha, реклама)
- game7: Автоматизация тестирования игр

### UI функции Handbook
- Поиск по заголовку, тегам, содержимому (клиентский, debounce нет)
- Фильтрация по категории и уровню
- Аккордеон (expand/collapse тем)
- Закладки (сохраняются в localStorage)
- Кнопка «Применить в генераторе» → переход в Тест-дизайн с выбранной техникой
- Копирование содержимого темы

### Рендеринг Markdown

Функция `MarkdownView` преобразует Markdown-контент в HTML через серию регулярных выражений (без сторонней библиотеки):

```
## Заголовок  →  <h2>
**жирный**    →  <strong>
`код`         →  <code>
- пункт       →  <ul><li>
| таблица |   →  <table>
```  ```       →  <pre><code>
```

Используется `dangerouslySetInnerHTML` — потенциальная XSS-уязвимость (см. раздел 11).

---

## 9. Общие UI-компоненты

### `CopyButton`
Кнопка копирования текста в буфер обмена. Состояния: «Копировать» → «Скопировано!» (2 сек). Использует `navigator.clipboard.writeText`.

### `Badge`
Цветной бейдж для статусов и уровней. Варианты: `default`, `positive`, `negative`, `boundary`, `nonfunctional`, `passed`, `failed`, `blocked`, `pending`, `beginner`, `intermediate`, `pro`.

### `Tooltip`
Всплывающая подсказка на hover (`title`-атрибут с CSS-позиционированием).

### `Spinner`
Анимированная иконка загрузки (SVG rotate-анимация через Tailwind `animate-spin`).

### `EmptyState`
Заглушка для пустых состояний: иконка + заголовок + описание.

### `CodeBlock`
Блок отображения кода. Поддержка языков для подсветки (через CSS-классы). Встроенная кнопка копирования.

### `MarkdownView`
Рендер Markdown-строки в HTML (regex-парсер, `dangerouslySetInnerHTML`).

### `ApiModal`
Диалог (`@radix-ui/react-dialog`) для ввода API-ключей. Два таба: OpenRouter и Gemini. Проверка наличия ключей — визуальный индикатор в сайдбаре.

---

## 10. Дизайн-система и темизация

### Эстетика: Swiss/IDE Technical

Тёмная тема вдохновлена GitHub Dark и инструментами разработчика:
- Фон: `#0d1117` (github-dark)
- Поверхность карточки: `#161b22`
- Акцент: `#22d3ee` (cyan-400)
- Шрифт кода: JetBrains Mono

Светлая тема:
- Фон: `#f6f8fa`
- Акцент: `#0891b2` (cyan-600)

### Токены (`src/styles/theme.css`)

CSS custom properties в `:root` и `.dark`:
```css
--background, --foreground, --card, --primary, --secondary,
--muted, --accent, --border, --destructive, --ring,
--chart-1..5, --sidebar-*, --radius
```

Все токены проброшены в `@theme inline` для Tailwind 4:
```css
--color-primary: var(--primary);
```

Это позволяет использовать классы `bg-primary`, `text-foreground`, `border-border` и т.д.

### Переключение темы

```typescript
useEffect(() => {
  document.documentElement.classList.toggle("dark", darkMode);
}, [darkMode]);
```

---

## 11. Слабые места

### Критические

| # | Проблема | Описание |
|---|---------|---------|
| 1 | **XSS в MarkdownView** | `dangerouslySetInnerHTML` с пользовательским контентом (промпты AI) без санитизации. Если AI вернёт `<script>`, он выполнится. |
| 2 | **API-ключи в localStorage** | Ключи OpenRouter и Gemini хранятся в незашифрованном `localStorage`. Любой JS на странице и расширения браузера могут их прочитать. |
| 3 | **Монолитный файл ~5700 строк** | `App.tsx` — один файл. Невозможно tree-shake неиспользуемые модули. Тяжёлая начальная загрузка. |

### Значимые

| # | Проблема | Описание |
|---|---------|---------|
| 4 | **Нет debounce в поиске Handbook** | Поиск срабатывает на каждый символ, фильтруя 79 тем на каждое нажатие клавиши. При большем объёме базы — заметные тормоза. |
| 5 | **Нет валидации AI-ответа** | JSON-парсинг ответа AI обёрнут в try/catch, но логика восстановления минимальна. Если AI вернёт невалидный JSON — пользователь видит «Ошибка парсинга» без деталей. |
| 6 | **Нет пагинации в списке тест-кейсов и баг-репортов** | При 100+ тест-кейсах интерфейс становится неудобным. |
| 7 | **Синхронная запись в localStorage** | `useLocalStorage` пишет при каждом изменении без debounce. При частых обновлениях (typing) — избыточные записи. |
| 8 | **Нет обработки квоты localStorage** | Если `localStorage` переполнен (~5 MB), `setItem` бросает `QuotaExceededError` без обработки. |
| 9 | **Нет i18n** | Интерфейс только на русском. Невозможно добавить второй язык без переписывания строк. |

### Архитектурные

| # | Проблема | Описание |
|---|---------|---------|
| 10 | **Нет роутинга** | URL не меняется при смене модуля. Нельзя поделиться ссылкой на конкретный модуль или тему Handbook. |
| 11 | **Нет разделения кода (code splitting)** | Все 8 модулей загружаются сразу. Модули автотестирования, игр — тяжёлые и нужны не всегда. |
| 12 | **Handbook в коде** | 79 тем жёстко вшиты в `App.tsx`. Добавление новой темы требует редактирования исходного кода и пересборки. |
| 13 | **Нет тестов** | Приложение не имеет ни unit-, ни integration-, ни E2E-тестов. Рефакторинг — рискован. |

---

## 12. План доработки

### Приоритет 1 — Безопасность (срочно)

**1.1 Санитизация Markdown**
```bash
npm install dompurify @types/dompurify
```
```typescript
import DOMPurify from "dompurify";
// В MarkdownView:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(content)) }} />
```

**1.2 Шифрование API-ключей в localStorage**
Использовать Web Crypto API для симметричного шифрования (AES-GCM) с ключом из `sessionStorage` (ключ шифрования не переживает закрытие вкладки).

**1.3 Обработка QuotaExceededError**
```typescript
try {
  localStorage.setItem(key, JSON.stringify(value));
} catch (e) {
  if (e instanceof DOMException && e.name === "QuotaExceededError") {
    toast.error("Хранилище заполнено. Экспортируйте и удалите старые данные.");
  }
}
```

---

### Приоритет 2 — UX и функциональность

**2.1 Роутинг (React Router)**
```
/ → Главная (Dashboard)
/handbook/:id → Конкретная тема
/test-design → Тест-дизайн
/execution → Выполнение тестов
```
Позволит делиться ссылками и использовать кнопку «назад» браузера.

**2.2 Поиск с debounce**
```typescript
const debouncedQuery = useDebounce(searchQuery, 200);
```

**2.3 Пагинация или виртуализация списков**
При 50+ тест-кейсах — виртуализация через `react-window` или `@tanstack/virtual`.

**2.4 Drag & Drop сортировка тест-кейсов**
Уже установлен `react-dnd` в зависимостях — использовать его.

**2.5 Экспорт в различные форматы**
- Тест-кейсы → CSV/XLSX (для TestRail, Qase)
- Баг-репорты → Jira-совместимый формат
- Чеклист → PDF

---

### Приоритет 3 — Архитектура

**3.1 Разбивка `App.tsx` на модули**
```
src/
  app/
    App.tsx              ← провайдер контекста, роутинг
  modules/
    requirements/        ← RequirementsModule
    test-design/         ← TestDesignModule
    execution/           ← TestExecutionModule
    automation/          ← AutomationModule
    handbook/            ← HandbookModule + data/
    settings/            ← SettingsModule
  components/            ← Badge, CopyButton, MarkdownView...
  hooks/                 ← useLocalStorage, useDebounce
  types/                 ← все интерфейсы
  ai/                    ← callAI, enrichNetworkError, systemPrompt
```

**3.2 Handbook как внешние данные**
Перенести темы в JSON-файлы или MDX. При запуске — загружать через `import()` или fetch. Добавление новой темы = добавление файла без перекомпиляции.

**3.3 Code Splitting**
```typescript
const AutomationModule = React.lazy(() => import("../modules/automation"));
const GameTestingModule = React.lazy(() => import("../modules/games"));
```

**3.4 Добавить тесты**
```
Минимальный набор:
  - Unit: callAI() — mock fetch, проверить парсинг ответа
  - Unit: useLocalStorage — запись, чтение, ошибки квоты
  - Unit: renderMarkdown() — корректный HTML
  - E2E (Playwright): smoke — открыть все 8 модулей, нет крашей
```

---

### Приоритет 4 — Новые функции

**4.1 Интеграция с Jira**
- OAuth через Jira REST API
- Создавать баг-репорты в Jira одной кнопкой
- Подтягивать задачи из спринта для составления тест-плана

**4.2 Коллаборация (real-time)**
- Supabase Realtime для общих тест-кейсов в команде
- Разграничение прав: QA Lead, QA Engineer, Readonly

**4.3 Dashboard (главная страница)**
- Сводная статистика по всем модулям
- График дефектов по дням (recharts LineChart)
- Быстрые действия

**4.4 Расширенный Handbook**
- Поиск с морфологией (русский стеммер)
- Версионирование тем (история изменений)
- Пользовательские темы (добавить свою тему через UI)
- Экспорт темы в PDF/DOCX

**4.5 AI — потоковый ответ (streaming)**
OpenRouter поддерживает SSE-стриминг. Реализовать `ReadableStream` для отображения текста по мере генерации.

**4.6 Шаблоны тест-планов**
Готовые шаблоны по типам проектов (мобайл, веб, API, игры) с автозаполнением из текущей сессии.

---

## Сводка по модулям

| Модуль | AI | localStorage | Статус |
|--------|----|----|--------|
| Анализ требований | ✅ | ❌ | Готов |
| Тест-дизайн | ✅ | ✅ | Готов |
| Выполнение тестов | ✅ | ✅ | Готов |
| Генератор автотестов | ✅ | ❌ | Готов |
| Релизный отчёт | ✅ | ❌ | Готов |
| Генератор данных | ✅ | ❌ | Готов |
| База знаний | ❌ | ✅ (закладки) | Готов |
| Настройки | ❌ | ✅ | Готов |

---

*Документ создан автоматически на основе анализа исходного кода. Актуально для версии `App.tsx` ~5 700 строк, 79 тем в Handbook, 19 стеков автоматизации.*
