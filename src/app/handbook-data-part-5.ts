import type { HandbookTopic } from "./handbook-data";

export const HANDBOOK_PART_5: HandbookTopic[] = [
  {
    id: "webtest3",
    title: "Web Vitals и производительность веб-приложений",
    category: "Тестирование веб-приложений",
    level: "intermediate",
    tags: ["Core Web Vitals", "Lighthouse", "LCP", "CLS", "FID", "производительность"],
    content: `## Производительность веб-приложений

### Core Web Vitals (Google, 2024)

Метрики, напрямую влияющие на SEO и пользовательский опыт.

| Метрика | Расшифровка | Хорошо | Нужно улучшить | Плохо |
| **LCP** | Largest Contentful Paint — время рендера главного элемента | ≤ 2.5с | 2.5-4с | > 4с |
| **INP** | Interaction to Next Paint — время реакции на взаимодействие | ≤ 200мс | 200-500мс | > 500мс |
| **CLS** | Cumulative Layout Shift — смещение контента | ≤ 0.1 | 0.1-0.25 | > 0.25 |

**Что такое CLS на практике:**
Пользователь нажимает кнопку, в этот момент загружается реклама и кнопка смещается — нажатие попадает на другой элемент. Это CLS-проблема.

### Инструменты измерения

**Lighthouse (встроен в Chrome DevTools):**
\`\`\`
DevTools → Lighthouse → Generate report
Категории: Performance, Accessibility, Best Practices, SEO

Важно: запускать в режиме Incognito (без расширений)
и с throttling (Simulated throttling = мобильное устройство)
\`\`\`

**PageSpeed Insights:**
- Реальные данные от пользователей Chrome (CrUX)
- Lab data (симулированные условия)

**WebPageTest (webpagetest.org):**
- Детальный waterfall запросов
- Тест с реальных устройств в разных локациях
- Видео загрузки страницы

### Waterfall анализ

\`\`\`
DevTools → Network → Waterfall:

Цвета:
  Синий — HTML
  Фиолетовый — CSS
  Жёлтый — JavaScript
  Зелёный — изображения
  Серый — другое (шрифты, видео)

Что искать:
  - Render-blocking resources (JS/CSS до <body>)
  - Долгая TTFB (> 800ms) — проблема на сервере
  - Много запросов — нет bundling
  - Тяжёлые изображения — не сжаты
  - Waterfall «лесенка» — последовательные запросы вместо параллельных
\`\`\`

### Чеклист производительности

\`\`\`
[ ] Lighthouse Score Performance ≥ 90 (desktop), ≥ 70 (mobile)
[ ] LCP ≤ 2.5 секунды
[ ] CLS ≤ 0.1
[ ] TTFB (Time to First Byte) ≤ 800мс
[ ] Размер страницы ≤ 3 MB (сжатый)
[ ] Изображения в WebP/AVIF формате
[ ] Изображения с атрибутами width/height (нет CLS)
[ ] JS bundle size ≤ 500 KB (gzipped)
[ ] HTTP/2 или HTTP/3 используется
[ ] Gzip/Brotli сжатие включено на сервере
[ ] Кэширование статики (Cache-Control: max-age=31536000)
[ ] Шрифты с font-display: swap (нет FOUT)
[ ] Lazy loading для изображений вне viewport
\`\`\`

### Тестирование под нагрузкой (веб)
\`\`\`
k6 — нагрузочный тест:

import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  vus: 100,           // 100 виртуальных пользователей
  duration: '30s',
};

export default function () {
  let res = http.get('https://example.com');
  check(res, {
    'status 200': (r) => r.status === 200,
    'duration < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
\`\`\``,
  },
  {
    id: "webtest4",
    title: "Cookie, LocalStorage, SessionStorage: тестирование",
    category: "Тестирование веб-приложений",
    level: "intermediate",
    tags: ["cookie", "localStorage", "sessionStorage", "хранилище", "сессия"],
    content: `## Клиентское хранилище: тестирование

### Сравнение механизмов хранения

| | Cookie | localStorage | sessionStorage |
| Объём | ~4 KB | ~5-10 MB | ~5-10 MB |
| Срок жизни | Устанавливается (expires) | Постоянно | До закрытия вкладки |
| Доступ с сервера | ✅ (HTTP заголовок) | ❌ | ❌ |
| Доступ из JS | ✅ (если нет HttpOnly) | ✅ | ✅ |
| Отправляется с запросами | ✅ | ❌ | ❌ |
| Между вкладками | ✅ | ✅ | ❌ |
| Между доменами | ❌ (SameSite) | ❌ | ❌ |

### Как проверять в DevTools

\`\`\`
DevTools → Application → Storage:
  ├── Cookies           (по доменам)
  ├── Local Storage     (по origin)
  ├── Session Storage   (по origin + вкладке)
  └── IndexedDB         (структурированные данные)

Полезные действия:
  - Удалить отдельный ключ (правый клик → Delete)
  - Изменить значение прямо в таблице
  - Очистить всё: "Clear site data"
\`\`\`

### Тестирование Cookie

**Атрибуты которые нужно проверять:**
\`\`\`
Secure      — передаётся только по HTTPS
HttpOnly    — недоступен из JavaScript (защита от XSS)
SameSite    — Strict/Lax/None (защита от CSRF)
Domain      — на какой домен распространяется
Path        — на какой путь распространяется
Expires/Max-Age — срок жизни
\`\`\`

**Тест-сценарии:**
\`\`\`
[ ] Авторизационный cookie устанавливается после логина
[ ] Cookie удаляется после разлогина
[ ] Истёкший cookie не даёт доступа (redirect на логин)
[ ] HttpOnly cookie — не читается через document.cookie
[ ] Secure cookie — не отправляется по HTTP (только HTTPS)
[ ] SameSite=Strict — не отправляется с cross-site запросов (CSRF-тест)
[ ] Cookie сохраняется после закрытия/открытия браузера (если persistent)
\`\`\`

### Тестирование localStorage

\`\`\`javascript
// Проверить в консоли:
localStorage.getItem('token')        // прочитать
localStorage.setItem('key', 'value') // записать
localStorage.removeItem('key')       // удалить
localStorage.clear()                 // очистить всё
Object.keys(localStorage)            // все ключи
\`\`\`

**Тест-сценарии:**
\`\`\`
[ ] Данные сохраняются после перезагрузки страницы
[ ] Данные доступны во всех вкладках одного домена
[ ] Данные НЕ доступны с другого домена/субдомена
[ ] Приватный режим: localStorage обнуляется при закрытии окна
[ ] Очистка через DevTools — приложение корректно обрабатывает (нет краша)
[ ] Данные удаляются при выходе пользователя (если требуется)
\`\`\`

### Тестирование sessionStorage

\`\`\`
[ ] Данные сохраняются в пределах одной вкладки и сессии
[ ] Данные НЕ доступны в новой вкладке (даже на том же домене)
[ ] Данные теряются при закрытии вкладки
[ ] Данные НЕ теряются при F5/Ctrl+R (перезагрузка)
[ ] Дублирование вкладки (Ctrl+D) — sessionStorage КОПИРУЕТСЯ в новую вкладку
\`\`\`

### Безопасность хранилища

\`\`\`
❌ Нельзя хранить в localStorage:
   - Пароли
   - Номера карт, CVV
   - Персональные данные (GDPR)
   - Секретные ключи

✅ Альтернативы:
   - Токены → HttpOnly Cookie (недоступны XSS)
   - Чувствительные данные → только в памяти (state), не на диске
   - Если нужна персистентность → шифровать через Web Crypto API
\`\`\``,
  },
  // ══ ТЕСТИРОВАНИЕ API ══════════════════════════════════════════════════
  {
    id: "api1",
    title: "REST API тестирование: полное руководство",
    category: "Тестирование API",
    level: "beginner",
    tags: ["REST", "API", "HTTP", "статус коды", "тестирование"],
    content: `## REST API тестирование

### Что такое REST API?

REST (Representational State Transfer) — архитектурный стиль, описывающий правила взаимодействия клиента и сервера через HTTP. API (Application Programming Interface) — интерфейс для взаимодействия программ.

**6 принципов REST:**
1. **Client-Server** — клиент и сервер независимы
2. **Stateless** — каждый запрос содержит всю необходимую информацию
3. **Cacheable** — ответы могут кэшироваться
4. **Uniform Interface** — единый интерфейс взаимодействия
5. **Layered System** — клиент не знает, напрямую ли он общается с сервером
6. **Code on Demand** — сервер может передавать исполняемый код (опционально)

### HTTP Методы

| Метод | Назначение | Идемпотентный | Тело запроса |
| GET | Получить ресурс | ✅ | ❌ |
| POST | Создать ресурс | ❌ | ✅ |
| PUT | Заменить ресурс полностью | ✅ | ✅ |
| PATCH | Обновить часть ресурса | ❌* | ✅ |
| DELETE | Удалить ресурс | ✅ | ❌ |
| HEAD | Как GET, но без тела | ✅ | ❌ |
| OPTIONS | Узнать поддерживаемые методы | ✅ | ❌ |

### Коды статусов

\`\`\`
2xx — Успех:
  200 OK           — стандартный успех
  201 Created      — ресурс создан (POST)
  204 No Content   — успех, нет тела (DELETE, PUT)
  206 Partial Content — частичный контент (загрузка файлов)

3xx — Перенаправление:
  301 Moved Permanently — постоянный редирект
  302 Found            — временный редирект
  304 Not Modified     — кэш актуален

4xx — Ошибка клиента:
  400 Bad Request    — неверный запрос (невалидные данные)
  401 Unauthorized   — не авторизован (нет токена)
  403 Forbidden      — запрещено (токен есть, но нет доступа)
  404 Not Found      — ресурс не найден
  405 Method Not Allowed — метод не разрешён
  409 Conflict       — конфликт (дубликат, версия)
  422 Unprocessable  — ошибка валидации
  429 Too Many Requests — rate limiting

5xx — Ошибка сервера:
  500 Internal Server Error — ошибка сервера
  502 Bad Gateway     — проблема с upstream
  503 Service Unavailable — сервис недоступен
  504 Gateway Timeout — таймаут от upstream
\`\`\`

### Структура REST-запроса

\`\`\`http
POST /api/v1/users HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGci...
Content-Type: application/json
Accept: application/json

{
  "name": "Иванова Анна",
  "email": "anna@example.com",
  "role": "qa"
}
\`\`\`

### Что тестировать в REST API

**Позитивные сценарии:**
\`\`\`
[ ] GET — возвращает корректный список/объект
[ ] POST — ресурс создаётся, возвращается 201 и id нового ресурса
[ ] PUT — ресурс обновляется полностью
[ ] PATCH — обновляется только указанное поле
[ ] DELETE — ресурс удаляется, повторный GET возвращает 404
\`\`\`

**Негативные сценарии:**
\`\`\`
[ ] Без авторизации → 401
[ ] С чужим токеном → 403
[ ] Несуществующий ID → 404
[ ] Невалидный JSON в теле → 400
[ ] Отсутствует обязательное поле → 400 или 422
[ ] Дубликат уникального поля (email) → 409
[ ] Строка вместо числа → 400 или 422
[ ] SQL injection в параметрах → должна быть экранирована
[ ] Очень длинная строка → 400 или 413
\`\`\`

**Заголовки:**
\`\`\`
[ ] Content-Type: application/json в ответе (не text/html)
[ ] CORS: нужные Origin разрешены
[ ] Cache-Control корректен для типа эндпоинта
[ ] X-RateLimit-Remaining присутствует (если есть rate limiting)
\`\`\``,
  },
  {
    id: "api2",
    title: "Postman: коллекции, переменные, тесты, Newman",
    category: "Тестирование API",
    level: "beginner",
    tags: ["Postman", "коллекции", "переменные", "Newman", "автоматизация"],
    content: `## Postman: полное руководство

### Базовые концепции

**Collection** — группа запросов, организованных в папки по модулям/версиям API.
**Environment** — набор переменных для конкретной среды (dev/staging/prod).
**Variables** — плейсхолдеры в запросах: \`{{base_url}}\`, \`{{token}}\`.

### Иерархия переменных (приоритет: верхний > нижний)
\`\`\`
1. Data Variables        (из CSV/JSON для data-driven tests)
2. Local Variables       (только в текущем запросе, pm.variables.set)
3. Environment Variables (pm.environment.set)
4. Collection Variables  (pm.collectionVariables.set)
5. Global Variables      (pm.globals.set)
\`\`\`

### Pre-request Script — подготовка запроса

\`\`\`javascript
// Установить временную метку
pm.environment.set("timestamp", Date.now());

// Сгенерировать случайный email для теста
const random = Math.random().toString(36).substring(2, 8);
pm.environment.set("test_email", \`qa_\${random}@test.com\`);

// Вычислить HMAC-подпись
const crypto = require('crypto-js');
const signature = crypto.HmacSHA256(pm.environment.get("payload"), pm.environment.get("secret"));
pm.environment.set("signature", signature.toString());
\`\`\`

### Tests — проверки после запроса

\`\`\`javascript
// Статус код
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Status 201", () => pm.response.to.have.status(201));

// Время ответа
pm.test("Response time < 500ms", () => pm.expect(pm.response.responseTime).to.be.below(500));

// Структура ответа
pm.test("Has required fields", () => {
  const body = pm.response.json();
  pm.expect(body).to.have.property("id");
  pm.expect(body).to.have.property("email");
  pm.expect(body.id).to.be.a("number");
  pm.expect(body.email).to.include("@");
});

// Сохранить токен из ответа для следующих запросов
const token = pm.response.json().access_token;
pm.environment.set("auth_token", token);

// Сохранить созданный ID
pm.environment.set("created_user_id", pm.response.json().id);

// Проверить заголовок
pm.test("Content-Type is JSON", () => {
  pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Схема ответа (JSON Schema)
const schema = {
  type: "object",
  required: ["id", "name", "email"],
  properties: {
    id:    { type: "number" },
    name:  { type: "string" },
    email: { type: "string", format: "email" }
  }
};
pm.test("Schema valid", () => pm.response.to.have.jsonSchema(schema));
\`\`\`

### Collection Runner — прогон набора тестов

\`\`\`
Collection Runner (кнопка Run Collection):
  - Выбрать Environment
  - Установить порядок запросов
  - Количество итераций
  - Delay между запросами (мс)
  - Data File (CSV/JSON для data-driven)

Результат: отчёт с pass/fail по каждому тесту
\`\`\`

### Newman — запуск из командной строки

\`\`\`bash
# Установка
npm install -g newman newman-reporter-htmlextra

# Базовый запуск
newman run collection.json -e staging.json

# С HTML-отчётом
newman run collection.json \\
  -e staging.json \\
  --reporters htmlextra \\
  --reporter-htmlextra-export reports/api-report.html

# В CI/CD (GitHub Actions)
- name: Run API Tests
  run: newman run collection.json -e staging.json --bail
  # --bail останавливает при первой ошибке
\`\`\`

### Организация коллекций — лучшие практики

\`\`\`
MyApp API Collection/
├── Auth/
│   ├── POST /login (saves {{token}})
│   ├── POST /refresh-token
│   └── POST /logout
├── Users/
│   ├── GET /users
│   ├── POST /users (saves {{user_id}})
│   ├── GET /users/{{user_id}}
│   ├── PATCH /users/{{user_id}}
│   └── DELETE /users/{{user_id}}
└── Orders/
    ├── GET /orders
    └── POST /orders
\`\`\`

**Принципы:**
- Первый запрос в папке — авторизация (сохраняет токен)
- Следующий запрос использует токен из переменной
- Порядок имеет значение (создание перед чтением/удалением)`,
  },
  {
    id: "api3",
    title: "Swagger / OpenAPI: читать и тестировать по документации",
    category: "Тестирование API",
    level: "beginner",
    tags: ["Swagger", "OpenAPI", "документация", "спецификация", "контракт"],
    content: `## Swagger / OpenAPI для QA

### Что такое OpenAPI Specification (OAS)?

Формальное описание REST API в формате YAML или JSON. Swagger UI — интерактивная документация на основе OAS. QA использует её как **основной источник требований** при тестировании API.

### Как читать Swagger UI

\`\`\`
GET /api/v1/users/{id}
  Parameters:
    Path: id (integer, required) — ID пользователя
    Query: include_deleted (boolean, optional) — включить удалённых
  Headers:
    Authorization: Bearer <token>
  Responses:
    200: User object
      {
        "id": 1,
        "name": "string",
        "email": "string",
        "role": "admin" | "user" | "moderator"
      }
    401: Unauthorized
    403: Forbidden
    404: Not Found
\`\`\`

**Что нужно извлечь при анализе:**
\`\`\`
[ ] Обязательные и опциональные параметры
[ ] Типы данных (integer, string, boolean, array, object)
[ ] Форматы (date, date-time, email, uuid, uri)
[ ] Ограничения: minLength, maxLength, minimum, maximum, pattern
[ ] Enum-значения (допустимые варианты)
[ ] Возможные коды ответа
[ ] Схема тела запроса и ответа
\`\`\`

### Contract Testing (контрактное тестирование)

**Проблема:** backend изменил схему ответа, frontend сломался.
**Решение:** тест проверяет соответствие реального ответа спецификации.

\`\`\`javascript
// Postman: проверка против OpenAPI схемы
const ajv = require('ajv');
const validate = new ajv().compile(pm.environment.get("user_schema"));
pm.test("Response matches contract", () => {
  pm.expect(validate(pm.response.json())).to.be.true;
});
\`\`\`

**Инструменты контрактного тестирования:**
- **Pact** — consumer-driven contract testing
- **Dredd** — тестирует API против OpenAPI spec
- **Schemathesis** — автоматически генерирует тесты из OpenAPI

\`\`\`bash
# Dredd — запустить тесты против спецификации
dredd api.yaml http://localhost:3000

# Schemathesis — fuzzing на основе схемы
schemathesis run api.yaml --url http://localhost:3000 --checks all
\`\`\`

### Что тестировать по документации

**Сравнение spec vs реализация:**
\`\`\`
[ ] Все задокументированные endpoints существуют
[ ] URL-пути совпадают (регистр, слэши)
[ ] HTTP-методы совпадают
[ ] Обязательные поля действительно обязательны (без них → ошибка)
[ ] Опциональные поля работают с дефолтными значениями
[ ] Типы данных соответствуют (строка не приходит вместо числа)
[ ] Enum-значения — приходит только из допустимого списка
[ ] Коды ответа соответствуют задокументированным
[ ] Поля в ответе не исчезли (breaking change!)
[ ] Новые недокументированные поля в ответе — OK, но зафиксировать
\`\`\`

### Тестирование версионирования API

\`\`\`
Стратегии версионирования:
  URL:    GET /api/v1/users vs /api/v2/users
  Header: Accept: application/vnd.api.v2+json
  Param:  GET /api/users?version=2

Что тестировать:
  [ ] v1 и v2 работают параллельно
  [ ] Запрос без версии → понятная ошибка или дефолтная версия
  [ ] Breaking changes в v2 не ломают v1-клиентов
  [ ] Устаревший Deprecation header присутствует для старой версии
\`\`\``,
  },
];
