import type { HandbookTopic } from "./handbook-data";

export const HANDBOOK_PART_4: HandbookTopic[] = [
  {
    id: "web8",
    title: "Мобильное тестирование: виды приложений и специфика",
    category: "Web и API тестирование",
    level: "intermediate",
    tags: ["мобильное", "iOS", "Android", "native", "hybrid", "PWA", "Appium"],
    content: `## Мобильное тестирование

### Типы мобильных приложений

| Тип | Описание | Примеры | Инструменты |
| **Native** | Написано для конкретной ОС (Swift/ObjC для iOS, Kotlin/Java для Android) | Instagram, WhatsApp | Appium, XCUITest, Espresso |
| **Hybrid** | WebView внутри нативной обёртки (Ionic, React Native, Flutter) | Airbnb, Facebook | Appium + ChromeDriver |
| **PWA** | Прогрессивное веб-приложение, работает в браузере | Starbucks PWA, Twitter Lite | Playwright, Selenium |
| **Cross-platform** | Один код для iOS и Android (Flutter, React Native) | Discord, Tesla | Appium, Detox |

### Специфика тестирования мобильных приложений

#### Уникальные для mobile проверки
\`\`\`
[ ] Прерывания: звонок, SMS, push-уведомление во время действия
[ ] Переключение между приложениями (background/foreground)
[ ] Поворот экрана (portrait ↔ landscape) — сохранение состояния
[ ] Режим разделённого экрана (split screen)
[ ] Разные размеры экранов: 4" → 7" → планшет
[ ] Тёмная тема (Dark Mode)
[ ] Доступность (VoiceOver/TalkBack)
[ ] Работа без интернета (offline mode, кэш)
[ ] Слабый сигнал (edge, 3G)
[ ] Низкий заряд батареи / режим экономии
[ ] Разрешения (camera, location, contacts) — отказ и предоставление
[ ] Глубокие ссылки (Deep Links): app://screen?id=123
[ ] Push-уведомления: получение, действие, пока приложение закрыто
\`\`\`

#### Жесты
- Tap, Double Tap, Long Press
- Swipe (влево, вправо, вверх, вниз)
- Pinch (zoom in/out)
- Drag & Drop

### Appium — основы
Appium — open source фреймворк для автоматизации мобильных приложений (iOS + Android).

\`\`\`python
from appium import webdriver
from appium.options.android import UiAutomator2Options

options = UiAutomator2Options()
options.platform_name = "Android"
options.device_name = "emulator-5554"
options.app = "/path/to/app.apk"

driver = webdriver.Remote("http://localhost:4723", options=options)

# Найти элемент и нажать
element = driver.find_element("id", "com.example:id/login_button")
element.click()
\`\`\`

### Инструменты мобильного тестирования
| Инструмент | Для чего |
| Android Studio Emulator | Эмулятор Android (бесплатно) |
| Xcode Simulator | Симулятор iOS (только macOS) |
| BrowserStack | Реальные устройства в облаке |
| Sauce Labs | Облачная мобильная ферма |
| Charles Proxy | Перехват трафика мобильного приложения |
| Appium Inspector | Поиск локаторов в мобильном UI |

### Матрица устройств
Нельзя тестировать на всех устройствах. Стратегия выбора:
\`\`\`
1. Топ-5 устройств по аналитике (Firebase Analytics, Mixpanel)
2. Минимальная поддерживаемая версия ОС (Android 10+, iOS 15+)
3. Покрыть: низкий/средний/топовый сегмент
4. Разные производители Android: Samsung, Xiaomi, Google Pixel
\`\`\``,
  },
  {
    id: "web9",
    title: "Docker и Git: основы для QA",
    category: "Web и API тестирование",
    level: "beginner",
    tags: ["Docker", "Git", "контейнер", "версионирование", "DevOps"],
    content: `## Docker для QA

### Зачем QA знать Docker?
- Поднять тестовую среду локально (база данных, mock-сервер)
- Запустить автотесты в контейнере
- Воспроизвести проблему "работает у меня, не работает у тебя"
- Участвовать в CI/CD пайплайне

### Основные команды Docker
\`\`\`bash
# Скачать образ
docker pull postgres:16

# Запустить контейнер с PostgreSQL для тестов
docker run -d \\
  --name test-db \\
  -e POSTGRES_PASSWORD=testpass \\
  -e POSTGRES_DB=testdb \\
  -p 5432:5432 \\
  postgres:16

# Запустить контейнер с приложением
docker run -d -p 8080:8080 myapp:latest

# Посмотреть запущенные контейнеры
docker ps

# Посмотреть логи контейнера
docker logs test-db
docker logs -f myapp   # -f = следить в реальном времени

# Остановить и удалить
docker stop test-db && docker rm test-db

# Зайти внутрь контейнера (как SSH)
docker exec -it test-db bash
\`\`\`

### Docker Compose — запустить несколько сервисов
\`\`\`yaml
# docker-compose.yml
version: "3.8"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"

  app:
    image: myapp:latest
    ports:
      - "8080:8080"
    depends_on:
      - db
\`\`\`

\`\`\`bash
docker compose up -d      # Запустить всё
docker compose down       # Остановить и удалить
docker compose logs -f    # Логи всех сервисов
\`\`\`

## Git для QA

### Основные команды
\`\`\`bash
# Статус изменений
git status

# Посмотреть историю
git log --oneline -20

# Переключиться на ветку
git checkout feature/login-tests
git switch feature/login-tests    # новый синтаксис

# Создать ветку и переключиться
git checkout -b qa/smoke-regression

# Обновить ветку
git pull origin main

# Сохранить изменения
git add tests/login_test.py
git commit -m "feat: add login smoke test"
git push origin qa/smoke-regression

# Посмотреть разницу
git diff                    # Несохранённые изменения
git diff HEAD~1             # Изменения последнего коммита
\`\`\`

### Что QA делает в Git
- Хранит **тест-кейсы** (если в коде) и **скрипты** автотестов
- Создаёт **ветки** для наборов тестов
- Делает **pull request** с автотестами вместе с фичей
- Проверяет **git log** и **git diff** для понимания что изменилось

### .gitignore для QA-проекта
\`\`\`gitignore
# Результаты тестов
test-results/
playwright-report/
allure-results/

# Конфигурация с секретами
.env
config/secrets.yaml

# Зависимости
node_modules/
__pycache__/
\`\`\``,
  },
  {
    id: "web10",
    title: "Инструменты тестировщика: Jira, TestRail, Postman",
    category: "Web и API тестирование",
    level: "beginner",
    tags: ["Jira", "TestRail", "Postman", "Qase", "инструменты", "трекинг"],
    content: `## Экосистема инструментов QA

### Трекинг задач и дефектов

#### Jira (Atlassian)
Стандарт для управления проектами и баг-трекинга.
- **Issue types:** Bug, Story, Task, Epic, Subtask
- **Workflow:** Backlog → To Do → In Progress → Review → Done
- **JQL (Jira Query Language):**
\`\`\`jql
project = MYAPP AND issuetype = Bug AND status != Closed ORDER BY priority ASC
assignee = currentUser() AND status = "In Progress"
created >= -7d AND issuetype = Bug AND priority in (Blocker, Critical)
\`\`\`
- **Полезные функции:** метки (labels), связи задач (blocks/is blocked by), поиск дубликатов

#### YouTrack, Linear, GitLab Issues
Альтернативы Jira. Принципы те же: создать задачу, описать, назначить, отследить.

### Управление тест-кейсами

#### TestRail
Классический инструмент для ведения тест-кейсов.
- **Test Suite** → Test Section → Test Case
- **Test Run** — запуск набора тестов с фиксацией результатов (Passed/Failed/Blocked/Skipped)
- Интеграция с Jira: тест-кейс → дефект

#### Qase.io
Современная альтернатива TestRail, удобный UX.
- Встроенные дефекты и интеграции (Jira, GitHub)
- Репортинг: можно видеть прогресс по релизу

#### TestIT
Российская платформа управления тестированием. Популярна в enterprise-проектах РФ.

### API-тестирование

#### Postman
Де-факто стандарт для ручного и полуавтоматического API-тестирования.

**Ключевые возможности:**
\`\`\`javascript
// Pre-request Script — подготовка
pm.environment.set("timestamp", Date.now());

// Tests — проверки после запроса
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has user id", () => {
  const body = pm.response.json();
  pm.expect(body.id).to.be.a('number');
});

// Сохранить токен из ответа
const token = pm.response.json().access_token;
pm.environment.set("auth_token", token);
\`\`\`

**Collections** — группируют запросы по модулям. **Environments** — переменные (url, token) для разных сред (dev/stage/prod).

**Newman** — запуск коллекций Postman из CLI:
\`\`\`bash
newman run collection.json -e staging.json --reporters html
\`\`\`

#### Bruno / Insomnia
Open source альтернативы Postman (без обязательной авторизации).

### Мониторинг и логи

#### Kibana / ELK Stack
- **Elasticsearch** — хранение и поиск логов
- **Logstash** — сбор и обработка логов
- **Kibana** — визуализация и поиск

**Для QA:** при воспроизведении бага смотреть логи в Kibana:
\`\`\`
поиск: request_id:"abc-123-xyz" AND level:ERROR
временной фильтр: "Last 15 minutes"
\`\`\`

#### Sentry
Автоматический трекинг ошибок в продакшене. QA проверяет, что ошибки не исчезают из Sentry после фикса.

### Документация и проектирование

| Инструмент | Назначение |
| Confluence | Вики-документация (требования, процессы) |
| Notion | Гибкая база знаний команды |
| Miro | Диаграммы, mindmaps, визуализация тест-стратегии |
| Figma | Прототипы UI (QA сверяет реализацию с макетами) |`,
  },
  {
    id: "web11",
    title: "WebSocket тестирование",
    category: "Web и API тестирование",
    level: "intermediate",
    tags: ["WebSocket", "real-time", "ws", "чат", "уведомления"],
    content: `## WebSocket — тестирование реального времени

### Что такое WebSocket?
Двунаправленное постоянное соединение между клиентом и сервером. В отличие от HTTP (запрос → ответ → закрытие), WebSocket держит соединение открытым.

**Применение:** чаты, онлайн-игры, live-дашборды, коллаборативные редакторы, трекинг курьера.

### WebSocket vs HTTP

| | HTTP | WebSocket |
| Соединение | Открывается на каждый запрос | Одно постоянное |
| Инициатор | Только клиент | Клиент и сервер |
| Overhead | Высокий (заголовки каждый раз) | Низкий |
| Latency | Выше | Ниже |

### Handshake — установка соединения
WebSocket начинается как HTTP-запрос с upgrade:
\`\`\`http
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
\`\`\`

### Что тестировать в WebSocket

#### Функциональные проверки
\`\`\`
[ ] Успешное подключение (статус 101)
[ ] Отправка сообщения — получение подтверждения
[ ] Получение сообщения от другого пользователя
[ ] Broadcast: сообщение видят все участники
[ ] Личное сообщение: только адресат видит
[ ] Reconnect: после разрыва соединение восстанавливается
[ ] Heartbeat/Ping-Pong: сервер и клиент обмениваются ping/pong
\`\`\`

#### Граничные случаи
\`\`\`
[ ] Очень длинное сообщение (> 65KB)
[ ] Бинарные данные (файл, изображение)
[ ] Одновременно 1000+ подключений
[ ] Сообщение при закрытом соединении
[ ] Авторизация: токен в query параметре (?token=...) или subprotocol
[ ] XSS через WebSocket-сообщения
\`\`\`

### Инструменты

#### DevTools → Network → WS
- Фильтр: тип "WS"
- Видны все фреймы (входящие ↓ и исходящие ↑)
- Можно смотреть payload каждого сообщения

#### Postman (v10+)
Поддерживает WebSocket. Можно слать и принимать сообщения в GUI.

#### websocat — CLI-клиент
\`\`\`bash
# Подключиться к WebSocket серверу
websocat ws://localhost:8080/chat

# С авторизацией
websocat -H "Authorization: Bearer token123" ws://api.example.com/ws
\`\`\`

#### Playwright — автоматизация WebSocket
\`\`\`javascript
test('WebSocket chat', async ({ page }) => {
  const wsPromise = page.waitForEvent('websocket');
  await page.goto('/chat');
  const ws = await wsPromise;

  // Ждём первое сообщение от сервера
  const frame = await ws.waitForEvent('framereceived');
  expect(JSON.parse(frame.payload)).toHaveProperty('type', 'connected');
});
\`\`\``,
  },
  // ══ ТЕСТИРОВАНИЕ ВЕБ-ПРИЛОЖЕНИЙ ═══════════════════════════════════════
  {
    id: "webtest1",
    title: "Тестирование веб-форм: полный чеклист",
    category: "Тестирование веб-приложений",
    level: "beginner",
    tags: ["форма", "валидация", "input", "submit", "веб"],
    content: `## Тестирование веб-форм

Формы — одна из самых частых точек отказа в веб-приложениях. Здесь концентрируется бизнес-логика, валидация и взаимодействие с сервером.

### Чеклист полей ввода

**Позитивные сценарии:**
\`\`\`
[ ] Валидные данные принимаются и обрабатываются корректно
[ ] Успешная отправка формы — правильное сообщение/редирект
[ ] Все обязательные поля заполнены — форма отправляется
[ ] Данные сохраняются/обновляются корректно
\`\`\`

**Негативные сценарии:**
\`\`\`
[ ] Пустые обязательные поля — ошибка валидации
[ ] Недопустимые символы в поле (XSS, SQL-инъекции)
[ ] Пробелы в начале/конце строки (trim или нет?)
[ ] Очень длинное значение (> max_length)
[ ] Очень короткое значение (< min_length)
[ ] Неверный формат: email без @, телефон без цифр
[ ] Несовпадение паролей в полях «Пароль» / «Подтвердите пароль»
[ ] Специальные символы: !@#$%^&*()<>?/|
[ ] Unicode/Emoji: 😀, арабский, японский
\`\`\`

**Граничные значения:**
\`\`\`
[ ] Ровно min_length символов
[ ] min_length - 1 символ
[ ] Ровно max_length символов
[ ] max_length + 1 символ
[ ] Числовые поля: 0, -1, MAX_INT, MIN_INT
\`\`\`

### Специфические типы полей

**Email:**
\`\`\`
Валидные:   user@example.com, user+tag@sub.domain.org
Невалидные: @domain.com, user@, user @domain.com,
            user@domain..com, .user@domain.com
\`\`\`

**Телефон:**
\`\`\`
[ ] +7 (международный формат)
[ ] 8-800-... (российский)
[ ] Пробелы, дефисы, скобки — принимаются или нет?
[ ] Слишком короткий/длинный номер
\`\`\`

**Дата/Время:**
\`\`\`
[ ] 29 февраля в не-високосный год
[ ] 31 апреля (несуществующий день)
[ ] Дата в прошлом (если форма требует будущей даты)
[ ] Формат: DD.MM.YYYY vs YYYY-MM-DD
\`\`\`

**Файловые поля:**
\`\`\`
[ ] Допустимые форматы файлов
[ ] Недопустимый формат (загрузить exe вместо jpg)
[ ] Максимальный размер файла
[ ] Файл с двойным расширением (file.jpg.exe)
[ ] Пустой файл (0 байт)
\`\`\`

### UX валидации

\`\`\`
[ ] Ошибка показывается рядом с полем, а не только в шапке
[ ] Текст ошибки понятен пользователю (не "Error 422")
[ ] После исправления ошибки — подтверждение корректности
[ ] Focus переходит на первое поле с ошибкой
[ ] Клавиша Enter отправляет форму (если ожидается)
[ ] Автозаполнение браузера не ломает валидацию
[ ] Disabled-кнопка «Отправить» до заполнения обязательных полей
\`\`\`

### Многошаговые формы (Wizard)
\`\`\`
[ ] Данные предыдущих шагов сохраняются при переходе вперёд/назад
[ ] Нельзя перескочить шаг (прямой URL)
[ ] При обновлении страницы — предупреждение о потере данных
[ ] Progress-индикатор показывает текущий шаг
[ ] Итоговый экран показывает все введённые данные для проверки
\`\`\``,
  },
  {
    id: "webtest2",
    title: "Кросс-браузерное и адаптивное тестирование",
    category: "Тестирование веб-приложений",
    level: "beginner",
    tags: ["кросс-браузерное", "responsive", "браузер", "мобильный", "viewport"],
    content: `## Кросс-браузерное и адаптивное тестирование

### Браузерное покрытие (2026)

| Браузер | Доля рынка | Движок |
| Chrome | ~65% | Blink (V8) |
| Safari | ~19% | WebKit |
| Firefox | ~4% | Gecko |
| Edge | ~4% | Blink (V8) |
| Samsung Internet | ~3% | Blink |

**Минимальный набор:** Chrome + Safari (iOS) = покрытие ~84%.
**Расширенный:** + Firefox + Edge.

### Что проверять кросс-браузерно

\`\`\`
[ ] Отображение layout (Flexbox/Grid — поддержка почти везде, но есть нюансы)
[ ] Шрифты: custom fonts загружаются во всех браузерах
[ ] CSS анимации и transitions
[ ] JavaScript API: fetch, Promise, IntersectionObserver
[ ] Формы: date picker выглядит по-разному в браузерах
[ ] Видео/Аудио: кодеки (H.264 vs WebM)
[ ] SVG-иконки
[ ] Print-стили (если нужны)
[ ] PDF-просмотр (встроенный viewer vs скачивание)
\`\`\`

**Специфика Safari:**
\`\`\`
- position: sticky — требует -webkit-sticky
- Date parsing: new Date('2024-01-15') работает,
                new Date('15.01.2024') — нет!
- Input type="date" — не поддерживался в старых версиях
- Web Push — появился только в iOS 16.4
- IndexedDB — есть ограничения в Private Mode
\`\`\`

### Адаптивное тестирование (Responsive)

**Стандартные breakpoints:**
| Размер | Диапазон | Устройства |
| xs | < 576px | Старые смартфоны |
| sm | 576-767px | Смартфоны (portrait) |
| md | 768-991px | Планшеты (portrait) |
| lg | 992-1199px | Планшеты (landscape), small desktop |
| xl | 1200-1399px | Desktop |
| xxl | ≥ 1400px | Large desktop, 4K |

**Что тестировать при каждом breakpoint:**
\`\`\`
[ ] Навигация: меню не обрезается, hamburger работает
[ ] Изображения: не выходят за границы контейнера
[ ] Таблицы: горизонтальный скролл или перестройка в карточки
[ ] Текст: не overflow, не слишком мелкий
[ ] Кнопки: достаточного размера для нажатия пальцем (44px min)
[ ] Формы: поля не слишком узкие
[ ] Модальные окна: помещаются на экране
[ ] Контент не перекрыт фиксированной шапкой
\`\`\`

**Инструменты:**
\`\`\`
DevTools → Toggle Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M):
  - Выбрать устройство из списка (iPhone 14, Galaxy S21...)
  - Установить кастомное разрешение
  - Throttle сети (Slow 3G, offline)
  - Throttle CPU (2×, 6× slowdown)

BrowserStack — реальные браузеры в облаке
LambdaTest   — кросс-браузерное тестирование
Responsively App — видеть все breakpoints одновременно
\`\`\`

### Тестирование на реальных мобильных браузерах
\`\`\`
[ ] Chrome on Android (основной)
[ ] Safari on iOS (обязательно для iOS-аудитории)
[ ] Samsung Internet (важен для Samsung-устройств)
[ ] Firefox Mobile
[ ] UC Browser (актуален в Азии)

Специфика мобильного браузера:
  - URL-бар занимает место (100vh ≠ видимой области)
  - Двойной тап зуммирует страницу (если не запрещено)
  - Горизонтальный скролл всей страницы — баг
  - Телефонные номера автоматически становятся ссылками
\`\`\``,
  },
];
