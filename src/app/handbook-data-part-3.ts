import type { HandbookTopic } from "./handbook-data";

export const HANDBOOK_PART_3: HandbookTopic[] = [
  {
    id: "doc5",
    title: "Жизненный цикл дефекта и Severity vs Priority",
    category: "Тестовая документация",
    level: "beginner",
    tags: ["дефект", "bug", "severity", "priority", "жизненный цикл", "статусы"],
    content: `## Жизненный цикл дефекта

### Стандартные статусы
\`\`\`
New → Assigned → In Progress → Fixed → Retest → Closed
                     ↓                      ↓
                  Rejected              Reopened → In Progress...
                     ↓
                 Deferred (отложен)
\`\`\`

**Описание переходов:**
| Статус | Кто меняет | Значение |
| **New** | QA | Дефект зафиксирован |
| **Assigned** | QA Lead / PM | Назначен разработчику |
| **In Progress** | Dev | Разработчик работает над исправлением |
| **Fixed** | Dev | Исправление готово, деплой на тест-стенд |
| **Retest** | QA | QA проверяет исправление |
| **Closed** | QA | Дефект подтверждён исправленным |
| **Reopened** | QA | Исправление не устранило проблему |
| **Rejected** | Dev / PM | Не является дефектом (по дизайну, по требованиям) |
| **Deferred** | PM | Откладывается на следующий релиз |
| **Duplicate** | QA / Dev | Дублирует существующий баг |

### Severity (Критичность) — техническое влияние на систему

| Уровень | Описание | Пример |
| **S1 Blocker** | Система полностью неработоспособна | Сайт не открывается, данные теряются |
| **S2 Critical** | Критическая функция не работает | Нельзя оформить заказ, не проходит оплата |
| **S3 Major** | Важная функция работает некорректно | Неправильный расчёт суммы, некорректный фильтр |
| **S4 Minor** | Незначительная проблема | Неправильный перевод, неточное выравнивание |
| **S5 Trivial** | Косметический дефект | Опечатка в tooltip, лишний пробел |

### Priority (Приоритет) — срочность исправления для бизнеса

| Уровень | Описание |
| **P1 Urgent** | Исправить немедленно (до релиза/сейчас) |
| **P2 High** | Исправить в текущем спринте |
| **P3 Medium** | Запланировать в следующем спринте |
| **P4 Low** | Можно исправить при наличии времени |

### Важное различие: Severity ≠ Priority

\`\`\`
Кнопка "Связаться с нами" ведёт на несуществующую страницу:
  Severity = Minor (система работает)
  Priority = High (клиент звонит в поддержку — бизнес-потеря)

Ошибка в расчёте налога только у 2% пользователей:
  Severity = Critical (финансовые последствия)
  Priority = Medium (затрагивает малый %,исправим в следующем спринте)
\`\`\`

### Атрибуты хорошего баг-репорта (напоминание)
\`\`\`
Заголовок:    [Модуль] Краткое описание — факт, не оценка
Severity:     S1-S5
Priority:     P1-P4
Окружение:    ОС, Браузер, Версия сборки
Воспроизведение: Шаги 1-N (100% воспроизводимость)
Факт:         Что произошло
Ожидание:     Что должно было произойти
Вложения:     Скриншот / видео / HAR-файл
\`\`\``,
  },
  // ── ОСНОВЫ АВТОТЕСТИРОВАНИЯ (дополнительные) ─────────────────────────
  {
    id: "auto3",
    title: "Пирамида тестирования и стратегия автоматизации",
    category: "Основы автотестирования",
    level: "intermediate",
    tags: ["пирамида", "стратегия", "автоматизация", "E2E", "unit"],
    content: `## Пирамида тестирования

### Концепция (Mike Cohn, 2009)
\`\`\`
        /E2E\         ← Мало, медленно, дорого
       /──────\
      /  API   \      ← Среднее количество
     /──────────\
    /  Unit Tests \   ← Много, быстро, дёшево
   /──────────────\
\`\`\`

### Три уровня пирамиды

#### Низ: Unit Tests (70%)
- Тестируют функции / методы в изоляции
- Выполняются за секунды, всей суммой
- Покрытие цели: 80%+ branches
- ROI: очень высокий

#### Середина: API / Integration Tests (20%)
- Тестируют взаимодействие компонентов
- Быстрее E2E, надёжнее unit
- Инструменты: REST Assured, Supertest, pytest + httpx
- Идеальны для проверки бизнес-логики без UI

#### Верх: E2E / UI Tests (10%)
- Имитируют пользовательские сценарии через UI
- Медленные, флакающие, дорогие в поддержке
- Используйте только для **критических happy paths**
- Инструменты: Playwright, Selenium, Cypress

### Антипаттерны

**«Мороженое»** (перевёрнутая пирамида) — много E2E, мало unit:
\`\`\`
    /───────────\
   /  Много E2E  \   ← Хрупкие, медленные
  /──────────────\
 /   Мало API     \
/──────────────────\
       Нет Unit     ← Проблемы обнаруживаются поздно
\`\`\`

**«Кубок»** — много unit + много E2E, мало API-тестов.

### Что автоматизировать?
**Высокий приоритет:**
- Регрессия: стабильная функциональность, не меняющаяся часто
- Smoke-тесты (запускать при каждом деплое)
- CRUD-операции через API
- Сценарии с данными (data-driven)

**Низкий приоритет / не автоматизировать:**
- Разовые проверки
- Часто меняющийся UI
- Exploratory testing
- Юзабилити и визуальные проверки (лучше глазами)

### ROI автоматизации
\`\`\`
ROI = (Стоимость ручного тестирования × Количество запусков)
       ÷ Стоимость создания + поддержки автотестов

Если ROI > 1 — автоматизация выгодна
\`\`\`

> 💡 **Правило «10 запусков»:** автоматизируйте тест, если он будет запущен ≥10 раз. Меньше — чаще дешевле выполнять вручную.`,
  },
  {
    id: "auto4",
    title: "CI/CD и QA: автотесты в пайплайне",
    category: "Основы автотестирования",
    level: "intermediate",
    tags: ["CI/CD", "pipeline", "GitHub Actions", "Jenkins", "GitLab CI"],
    content: `## CI/CD и автоматизация тестирования

### CI/CD — основные понятия
- **CI (Continuous Integration)** — автоматическая сборка и тестирование при каждом коммите/пуше в ветку
- **CD (Continuous Delivery)** — автоматическая доставка до стейджинга, ручной деплой на прод
- **CD (Continuous Deployment)** — полностью автоматический деплой до продакшена

### Типичный пайплайн с тестами
\`\`\`
git push → Trigger CI
  │
  ├─► Lint + Static Analysis
  ├─► Build (компиляция/сборка)
  ├─► Unit Tests (быстрые, <2 мин)
  ├─► Integration Tests (<10 мин)
  ├─► Deploy to Test Environment
  ├─► Smoke Tests (критические E2E, <5 мин)
  ├─► API Regression Tests
  └─► [если всё зелёное] → Deploy to Staging
                               └─► Full E2E Regression
                                    └─► Deploy to Production
\`\`\`

### GitHub Actions — пример конфигурации
\`\`\`yaml
name: QA Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      - name: Run API tests
        run: npm run test:api
      - name: Run Playwright E2E
        run: npx playwright test --project=chromium
      - name: Upload test report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
\`\`\`

### Ключевые принципы интеграции тестов в CI
1. **Fast feedback** — unit-тесты должны падать первыми (< 2 минут)
2. **Fail fast** — пайплайн останавливается при первой красной ступени
3. **Изолированность** — тесты не зависят от порядка выполнения
4. **Детерминированность** — один и тот же код → один и тот же результат
5. **Артефакты** — сохранять HTML-отчёты, скриншоты, видео падений

### Работа с флакающими (flaky) тестами
\`\`\`
Симптом: тест иногда красный, иногда зелёный
Причины: гонки условий, зависимость от времени/сети, нечистое состояние

Решения:
- Добавить явные ожидания (explicit waits)
- Изолировать тест-данные
- Retry механизм (только как временная мера!)
- Карантин: отдельный flaky suite, не блокирующий деплой
\`\`\`

### Полезные инструменты CI/CD для QA
| Инструмент | Для чего |
| GitHub Actions | CI в GitHub-проектах |
| GitLab CI | CI в GitLab, встроенный |
| Jenkins | Self-hosted, гибкий |
| Allure Report | Красивые HTML-отчёты о тестах |
| TestRail CI Plugin | Синхронизация результатов |

> 💡 QA должен **активно участвовать** в настройке пайплайна, а не просто ждать зелёной сборки.`,
  },
  // ── WEB И API ТЕСТИРОВАНИЕ (дополнительные) ───────────────────────────
  {
    id: "web4",
    title: "Клиент-серверная архитектура и поиск проблем",
    category: "Web и API тестирование",
    level: "beginner",
    tags: ["клиент-сервер", "архитектура", "DNS", "HTTP", "HTTPS", "трассировка"],
    content: `## Клиент-серверная архитектура

### Путь запроса от браузера до сервера
\`\`\`
Пользователь → Браузер → DNS → CDN → Load Balancer
                                        → Web Server → App Server → Database
\`\`\`

### Каждый слой — потенциальный источник проблем

#### DNS (Domain Name System)
Преобразует доменное имя в IP-адрес.
- Проблема: устаревший DNS-кэш (TTL не истёк)
- Диагностика: \`nslookup example.com\` / \`dig example.com\`

#### HTTP / HTTPS
Протокол передачи данных. HTTPS = HTTP + TLS-шифрование.
- **Проблема:** смешанный контент (HTTPS-страница загружает HTTP-ресурс)
- **Диагностика:** DevTools → Console → ищем «Mixed Content»
- **301/302** — редиректы. Лишние редиректы замедляют загрузку

#### Load Balancer
Распределяет запросы между серверами.
- **Проблема:** запросы попадают на разные инстансы с разным состоянием
- **Диагностика:** заголовок \`X-Server-ID\` или \`X-Instance-ID\` в ответах

#### Web Server (Nginx, Apache)
Статические файлы, проксирование к App Server.
- **Проблема:** 502 Bad Gateway — App Server недоступен
- **Проблема:** 504 Gateway Timeout — App Server отвечает слишком долго

#### Application Server
Бизнес-логика, генерация ответов.
- **500 Internal Server Error** — ошибка в коде приложения
- **Диагностика:** логи сервера (Kibana, CloudWatch, Datadog)

#### Database
- **Проблема:** медленные запросы (N+1 query problem, отсутствие индексов)
- **Диагностика:** slow query log, \`EXPLAIN ANALYZE\` в PostgreSQL

### Локализация проблем: алгоритм

\`\`\`
1. Воспроизвести проблему стабильно
2. Открыть DevTools → Network
3. Найти проблемный запрос
4. Проверить Status Code (4xx = клиент, 5xx = сервер)
5. Посмотреть Response Body (текст ошибки)
6. Проверить Request Headers (Authorization есть? Content-Type верный?)
7. Попробовать тот же запрос в Postman
8. Сообщить разработчику: URL, метод, headers, body запроса, status code, body ответа
\`\`\`

### OSI-модель для QA (упрощённо)
| Уровень | Что тестируем |
| L7 Application | HTTP/HTTPS, API, WebSocket — основная работа QA |
| L4 Transport | TCP/UDP — порты, доступность сервисов |
| L3 Network | IP, DNS — связность между компонентами |
| L1-2 Physical | Инфраструктура (не для QA, для DevOps) |

> 💡 **Правило буравчика:** начинайте с L7 и спускайтесь вниз. 95% проблем QA видны на уровне HTTP.`,
  },
  {
    id: "web5",
    title: "Аутентификация: Basic Auth, Bearer Token, OAuth 2.0, JWT",
    category: "Web и API тестирование",
    level: "intermediate",
    tags: ["аутентификация", "Authorization", "JWT", "OAuth", "Bearer", "Basic Auth"],
    content: `## Аутентификация и авторизация в API

### Basic Authentication
Логин:пароль кодируются в Base64 и передаются в заголовке.
\`\`\`http
Authorization: Basic dXNlcjpwYXNzd29yZA==
# dXNlcjpwYXNzd29yZA== = base64("user:password")
\`\`\`

**Риски:** Base64 — не шифрование! Без HTTPS пароль читаем в сети.
**Тесты:**
- Неверный пароль → 401
- Без заголовка → 401
- Корректные данные → 200

### Bearer Token
Токен (непрозрачная строка или JWT) передаётся в заголовке.
\`\`\`http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Тесты:**
- Без токена → 401 Unauthorized
- Истёкший токен → 401 или 403
- Токен другого пользователя → 403 Forbidden (не чужие данные!)
- Изменённый токен (один символ) → 401

### JWT — JSON Web Token
Структура: **Header.Payload.Signature**
\`\`\`
eyJhbGci.eyJ1c2VySWQiOjEyMywiZXhwIjoxNzA...signature
   ↑              ↑                           ↑
 Header        Payload                    Signature
(алгоритм)  (данные, не секрет!)      (проверка подлинности)
\`\`\`

**Payload** читается без секрета (Base64): \`atob(token.split('.')[1])\`

**Что проверять:**
- \`exp\` — время истечения (timestamp)
- \`iat\` — время выпуска
- \`sub\` — идентификатор пользователя
- \`role\` / \`permissions\` — права доступа

**Атака alg:none:** заменить алгоритм на "none" и убрать подпись → система должна отклонять!

### OAuth 2.0
Протокол делегирования авторизации («Войти через Google/GitHub»).

**Основной flow (Authorization Code):**
\`\`\`
1. Пользователь → нажимает "Войти через Google"
2. Редирект на Google /oauth/authorize?client_id=...&redirect_uri=...
3. Пользователь разрешает доступ
4. Google → redirect обратно с code=ABC
5. Сервер обменивает code на access_token + refresh_token
6. Используется access_token для запросов к API
\`\`\`

**Что тестировать в OAuth:**
- Невалидный \`state\` параметр → атака CSRF на OAuth, должна быть ошибка
- Истёкший \`code\` → 400/401
- Refresh token rotation: старый refresh_token после обновления — недействителен
- Scope: токен с scope=read не должен давать доступ к write-операциям

### API Key
Простой токен в заголовке или query параметре.
\`\`\`http
X-API-Key: sk-prod-abc123xyz
# Или:
GET /api/data?api_key=sk-prod-abc123xyz
\`\`\`
⚠️ В URL попадает в логи серверов — небезопасно!`,
  },
  {
    id: "web6",
    title: "GraphQL и gRPC: специфика тестирования",
    category: "Web и API тестирование",
    level: "intermediate",
    tags: ["GraphQL", "gRPC", "API", "тестирование API", "mutation", "query"],
    content: `## GraphQL — тестирование

### Ключевые отличия от REST

| Параметр | REST | GraphQL |
| Endpoint | Много: /users, /orders | Один: /graphql |
| HTTP метод | GET/POST/PUT/DELETE | Всегда POST |
| Данные | Сервер решает что вернуть | Клиент выбирает поля |
| Статус код | 200/201/404/500 | **Почти всегда 200!** |

### Критическая особенность GraphQL: 200 при ошибке!
\`\`\`json
HTTP 200 OK
{
  "data": null,
  "errors": [
    {
      "message": "Unauthorized",
      "locations": [{"line": 2, "column": 3}],
      "path": ["user"]
    }
  ]
}
\`\`\`
**Вывод:** при тестировании GraphQL ВСЕГДА проверять тело ответа на наличие поля \`errors\`!

### Три типа операций GraphQL

**Query** (чтение):
\`\`\`graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}
\`\`\`

**Mutation** (запись):
\`\`\`graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
  }
}
\`\`\`

**Subscription** (real-time через WebSocket):
\`\`\`graphql
subscription OnMessageAdded {
  messageAdded {
    id
    text
    author
  }
}
\`\`\`

### Что тестировать в GraphQL
- Запрашивать только нужные поля — получать только их
- Вложенные запросы (N+1 проблема на сервере)
- Introspection отключён на продакшене (утечка схемы)
- Большие запросы (depth limit, complexity limit)
- Авторизация: доступ только к своим данным

### Инструменты
- **Postman** — поддерживает GraphQL нативно
- **Insomnia** — отличный GraphQL-клиент
- **GraphQL Playground / GraphiQL** — встроен в многие сервисы

## gRPC — тестирование

### Что такое gRPC
Google's Remote Procedure Call. Использует **Protocol Buffers** (бинарный формат) и HTTP/2.

**Преимущества:** в 5-10× быстрее REST (бинарный протокол), строгая типизация через .proto.

**Сложность тестирования:** бинарный формат, нечитаем напрямую.

### Инструменты для gRPC тестирования
\`\`\`
grpcurl  — аналог curl для gRPC
Postman  — поддержка gRPC (с 2022)
Kreya    — GUI-клиент для gRPC
BloomRPC — (устарел) GUI-клиент
\`\`\`

### Пример grpcurl
\`\`\`bash
grpcurl -d '{"user_id": "123"}' \\
  -proto user.proto \\
  api.example.com:443 \\
  user.UserService/GetUser
\`\`\`

### Типы gRPC вызовов
- **Unary** — 1 запрос → 1 ответ (как REST)
- **Server streaming** — 1 запрос → поток ответов
- **Client streaming** — поток запросов → 1 ответ
- **Bidirectional** — поток в обе стороны`,
  },
  {
    id: "web7",
    title: "Базы данных для QA: SQL основы",
    category: "Web и API тестирование",
    level: "beginner",
    tags: ["SQL", "база данных", "SELECT", "JOIN", "PostgreSQL", "MySQL"],
    content: `## SQL для тестировщика

### Зачем QA знать SQL?
- Проверять, что данные **сохраняются** в БД после действий в UI/API
- Готовить **тест-данные** напрямую в БД
- Искать **дефекты данных** (дубликаты, NULL там, где не должно быть)
- Анализировать **баги** (что именно попало в БД при воспроизведении)

### Основные команды

#### SELECT — чтение данных
\`\`\`sql
-- Все пользователи
SELECT * FROM users;

-- Конкретные поля
SELECT id, email, created_at FROM users;

-- С условием
SELECT * FROM users WHERE email = 'test@example.com';

-- Несколько условий
SELECT * FROM orders
WHERE status = 'pending' AND total > 1000;

-- Сортировка и лимит
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

#### WHERE — операторы
\`\`\`sql
-- Равенство и неравенство
WHERE status = 'active'
WHERE amount != 0
WHERE amount <> 0     -- то же самое

-- Диапазон
WHERE price BETWEEN 100 AND 500
WHERE created_at >= '2024-01-01'

-- NULL проверка (= NULL не работает!)
WHERE deleted_at IS NULL
WHERE deleted_at IS NOT NULL

-- Вхождение в список
WHERE status IN ('active', 'pending')

-- Поиск по шаблону
WHERE email LIKE '%@gmail.com'   -- оканчивается на @gmail.com
WHERE name LIKE 'Ив%'           -- начинается с "Ив"
\`\`\`

#### JOIN — объединение таблиц
\`\`\`sql
-- INNER JOIN: только совпадающие строки
SELECT orders.id, users.email, orders.total
FROM orders
INNER JOIN users ON orders.user_id = users.id;

-- LEFT JOIN: все из левой + совпадения из правой
SELECT users.email, orders.id
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
-- Пользователи без заказов будут с orders.id = NULL

-- Практический кейс: найти пользователей без заказов
SELECT users.email
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE orders.id IS NULL;
\`\`\`

#### GROUP BY + Агрегатные функции
\`\`\`sql
-- Количество заказов по пользователям
SELECT user_id, COUNT(*) as order_count
FROM orders
GROUP BY user_id;

-- Сумма заказов по статусам
SELECT status, SUM(total) as total_sum, COUNT(*) as cnt
FROM orders
GROUP BY status
HAVING COUNT(*) > 5;   -- HAVING = WHERE для агрегатов
\`\`\`

#### INSERT / UPDATE / DELETE
\`\`\`sql
-- Создание тест-данных
INSERT INTO users (email, name, role)
VALUES ('qa_test@example.com', 'QA Test User', 'user');

-- Обновление
UPDATE users
SET status = 'verified'
WHERE email = 'qa_test@example.com';

-- Удаление (ВСЕГДА с WHERE!)
DELETE FROM users
WHERE email = 'qa_test@example.com';
\`\`\`

⚠️ **Правило безопасности:** Никогда не запускайте DELETE/UPDATE без WHERE на продакшене. Всегда сначала проверяйте SELECT с теми же условиями!

### Полезные запросы для QA
\`\`\`sql
-- Найти дубликаты email
SELECT email, COUNT(*) FROM users
GROUP BY email HAVING COUNT(*) > 1;

-- Последние ошибки в логах
SELECT * FROM error_log
ORDER BY created_at DESC LIMIT 20;

-- Проверить, что поле не NULL
SELECT COUNT(*) FROM orders WHERE user_id IS NULL;
\`\`\``,
  },
];
