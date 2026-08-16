import type { HandbookTopic } from "./handbook-data";

export const HANDBOOK_PART_6: HandbookTopic[] = [
  {
    id: "api4",
    title: "Тестирование аутентификации и авторизации в API",
    category: "Тестирование API",
    level: "intermediate",
    tags: ["авторизация", "JWT", "OAuth", "RBAC", "токен", "безопасность"],
    content: `## Аутентификация и авторизация: тест-сценарии

### Матрица ролей (RBAC)

Перед написанием тестов составить матрицу «роль × действие»:

| Endpoint | Admin | Manager | User | Guest |
| GET /users | ✅ | ✅ | ✅ (только себя) | ❌ |
| POST /users | ✅ | ✅ | ❌ | ❌ |
| DELETE /users | ✅ | ❌ | ❌ | ❌ |
| GET /reports | ✅ | ✅ | ❌ | ❌ |

Каждая клетка = тест-кейс. Матрица предотвращает пропуск сценариев.

### Тест-сценарии аутентификации

**JWT:**
\`\`\`
Подготовка: получить валидный токен (POST /login)

Позитивные:
  [ ] Запрос с валидным токеном → 200
  [ ] Токен в заголовке: Authorization: Bearer <token>

Негативные:
  [ ] Без токена → 401
  [ ] Пустой токен: "Bearer " → 401
  [ ] Истёкший токен (exp в прошлом) → 401
  [ ] Изменённый токен (1 символ в payload) → 401
  [ ] Токен другого пользователя → 403 (не чужие данные)
  [ ] Токен от другой среды (prod-токен на dev) → 401
  [ ] Алгоритм "none" в заголовке JWT → 401 (уязвимость!)

Refresh Token:
  [ ] POST /refresh с валидным refresh_token → новый access_token
  [ ] Старый access_token после refresh → недействителен (rotation)
  [ ] Использованный refresh_token повторно → 401 (rotation)
  [ ] Истёкший refresh_token → 401, перелогин
\`\`\`

**OAuth 2.0:**
\`\`\`
[ ] Authorization Code flow — code приходит, обменивается на token
[ ] Истёкший code → 400 (обычно 10 минут жизни)
[ ] Неверный redirect_uri → 400 (security check)
[ ] Scope: токен с scope=read → POST-запрос → 403
[ ] state параметр проверяется (защита от CSRF)
\`\`\`

### Тест-сценарии авторизации (что можно делать)

**Horizontal Privilege Escalation (доступ к чужим данным):**
\`\`\`
Сценарий:
  1. Залогиниться как User A → получить токен A
  2. Залогиниться как User B → получить id ресурса B (например, order_id=456)
  3. Запросить с токеном A: GET /orders/456
  Ожидание: 403 Forbidden
  Дефект: 200 OK с данными User B — IDOR уязвимость!
\`\`\`

**Vertical Privilege Escalation (получение прав администратора):**
\`\`\`
Сценарий:
  1. Залогиниться как обычный User
  2. Попробовать: DELETE /users/1 (admin action)
  Ожидание: 403 Forbidden
  Дефект: 200 OK — нарушение авторизации!
\`\`\`

**Тест через Postman:**
\`\`\`javascript
// Pre-request: залогиниться как User A
pm.sendRequest({
  url: pm.environment.get("base_url") + "/login",
  method: "POST",
  body: { email: "userA@test.com", password: "passA" }
}, (err, res) => {
  pm.environment.set("token_a", res.json().access_token);
});

// Tests: проверить что user B's data недоступна с token A
pm.test("Cannot access other user data", () => {
  pm.response.to.have.status(403);
});
\`\`\`

### Rate Limiting тестирование
\`\`\`
[ ] Отправить N+1 запросов за период → 429 Too Many Requests
[ ] Заголовки: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
[ ] После сброса лимита → снова 200
[ ] Rate limit по IP, по токену, по endpoint — что именно?
\`\`\``,
  },
  // ══ РАБОТА С БАЗАМИ ДАННЫХ ════════════════════════════════════════════
  {
    id: "db1",
    title: "SQL для тестировщика: от SELECT до JOIN",
    category: "Работа с базами данных",
    level: "beginner",
    tags: ["SQL", "SELECT", "JOIN", "WHERE", "PostgreSQL", "MySQL"],
    content: `## SQL для тестировщика

### Зачем QA нужен SQL?

- Проверить, что данные **сохранились** в БД после действия в UI/API
- Подготовить **тестовые данные** напрямую
- Найти **дефекты данных**: дубликаты, NULL в обязательных полях, нарушенные ограничения
- Воспроизвести **баги** через прямой запрос к данным
- Сравнить данные в БД с тем, что показывает UI

### SELECT — чтение данных

\`\`\`sql
-- Все записи
SELECT * FROM users;

-- Конкретные поля
SELECT id, email, created_at FROM users;

-- С условием
SELECT * FROM users WHERE email = 'test@example.com';

-- Несколько условий
SELECT * FROM orders
WHERE status = 'pending'
  AND total > 1000
  AND created_at >= '2026-01-01';

-- OR условие
SELECT * FROM users WHERE role = 'admin' OR role = 'moderator';

-- NOT
SELECT * FROM users WHERE status != 'deleted';
SELECT * FROM users WHERE status <> 'deleted'; -- то же самое

-- NULL проверка (важно: = NULL не работает!)
SELECT * FROM orders WHERE deleted_at IS NULL;
SELECT * FROM orders WHERE deleted_at IS NOT NULL;

-- Диапазон
SELECT * FROM products WHERE price BETWEEN 100 AND 500;

-- Вхождение в список
SELECT * FROM orders WHERE status IN ('pending', 'processing');

-- Поиск по шаблону
SELECT * FROM users WHERE email LIKE '%@gmail.com';  -- заканчивается на
SELECT * FROM users WHERE name LIKE 'Ив%';            -- начинается с
SELECT * FROM users WHERE name LIKE '%ов%';           -- содержит

-- Сортировка
SELECT * FROM orders ORDER BY created_at DESC;         -- новые первыми
SELECT * FROM orders ORDER BY total ASC, created_at DESC; -- несколько полей

-- Лимит
SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20;

-- Пропустить N строк
SELECT * FROM users LIMIT 10 OFFSET 20; -- страница 3
\`\`\`

### JOIN — объединение таблиц

\`\`\`sql
-- INNER JOIN: только записи с совпадением в обеих таблицах
SELECT orders.id, users.email, orders.total
FROM orders
INNER JOIN users ON orders.user_id = users.id;

-- LEFT JOIN: все из левой + совпадения из правой (NULL если нет)
SELECT users.email, COUNT(orders.id) AS order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.email;

-- Найти пользователей БЕЗ заказов:
SELECT users.email
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE orders.id IS NULL;

-- Три таблицы:
SELECT u.email, o.id AS order_id, p.name AS product
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE u.email = 'test@example.com';
\`\`\`

### Агрегатные функции

\`\`\`sql
-- Количество
SELECT COUNT(*) FROM users;                           -- все строки
SELECT COUNT(DISTINCT email) FROM users;              -- уникальные email

-- Сумма, среднее, мин, макс
SELECT SUM(total), AVG(total), MIN(total), MAX(total) FROM orders;

-- Группировка
SELECT status, COUNT(*) AS cnt, SUM(total) AS revenue
FROM orders
GROUP BY status;

-- HAVING — фильтр по агрегату (не WHERE!)
SELECT user_id, COUNT(*) AS cnt
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5;  -- пользователи с > 5 заказами
\`\`\`

### INSERT / UPDATE / DELETE

\`\`\`sql
-- Создать тестового пользователя
INSERT INTO users (email, name, role, created_at)
VALUES ('qa_test@example.com', 'QA Test', 'user', NOW());

-- Обновить
UPDATE users
SET status = 'verified', updated_at = NOW()
WHERE email = 'qa_test@example.com';

-- Удалить (ВСЕГДА проверяй WHERE через SELECT сначала!)
DELETE FROM users WHERE email = 'qa_test@example.com';
\`\`\`

### QA-запросы на каждый день

\`\`\`sql
-- Найти дубликаты email
SELECT email, COUNT(*) FROM users
GROUP BY email HAVING COUNT(*) > 1;

-- NULL в обязательных полях
SELECT COUNT(*) FROM orders WHERE user_id IS NULL;

-- Последние ошибки
SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20;

-- Проверить корректность суммы заказа
SELECT o.id, o.total, SUM(oi.price * oi.quantity) AS calculated
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.total
HAVING o.total != SUM(oi.price * oi.quantity);

-- Найти «зависшие» задачи (в статусе pending > 24 часов)
SELECT * FROM tasks
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours';
\`\`\``,
  },
  {
    id: "db2",
    title: "NoSQL и MongoDB: основы для тестировщика",
    category: "Работа с базами данных",
    level: "intermediate",
    tags: ["NoSQL", "MongoDB", "документы", "коллекции", "JSON"],
    content: `## NoSQL: MongoDB для тестировщика

### SQL vs NoSQL

| | SQL (реляционные) | NoSQL (нереляционные) |
| Структура | Таблицы + строки | Документы / ключ-значение / графы |
| Схема | Жёсткая (schema-on-write) | Гибкая (schema-on-read) |
| Связи | JOIN | Вложенные документы / ссылки |
| Масштабирование | Вертикальное | Горизонтальное |
| Примеры | PostgreSQL, MySQL | MongoDB, Redis, Cassandra, DynamoDB |
| Когда | Структурированные данные, ACID | Гибкие данные, высокие нагрузки |

### MongoDB — основные концепции

\`\`\`
SQL              MongoDB
Database    →    Database
Table       →    Collection
Row         →    Document (JSON)
Column      →    Field
Primary Key →    _id (ObjectId)
JOIN        →    $lookup / вложенные документы
\`\`\`

**Документ MongoDB:**
\`\`\`json
{
  "_id": "ObjectId('6697b2f1a3e4c...')",
  "email": "user@example.com",
  "name": "Иванова Анна",
  "role": "qa",
  "created_at": "ISODate('2026-07-15T10:00:00Z')",
  "address": {
    "city": "Москва",
    "zip": "123456"
  },
  "tags": ["testing", "automation"]
}
\`\`\`

### CRUD в MongoDB

\`\`\`javascript
// Через mongo shell или mongosh

// Найти все документы
db.users.find()

// С фильтром
db.users.find({ role: "qa" })
db.users.find({ "address.city": "Москва" })

// Условия (аналог WHERE)
db.orders.find({ total: { $gt: 1000 } })         // > 1000
db.orders.find({ total: { $gte: 100, $lte: 500 }}) // BETWEEN
db.orders.find({ status: { $in: ["pending", "processing"] }})
db.users.find({ email: { $regex: "@gmail.com$" } })

// Сортировка и лимит
db.orders.find().sort({ created_at: -1 }).limit(10)

// Создать
db.users.insertOne({
  email: "qa_test@example.com",
  name: "QA Test",
  role: "user"
})

// Обновить
db.users.updateOne(
  { email: "qa_test@example.com" },
  { $set: { status: "verified", updated_at: new Date() } }
)

// Удалить
db.users.deleteOne({ email: "qa_test@example.com" })

// Агрегация (аналог GROUP BY)
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
\`\`\`

### Что тестировать при работе с MongoDB

\`\`\`
[ ] Документ создаётся с корректными полями
[ ] ObjectId генерируется автоматически
[ ] Вложенные объекты сохраняются корректно
[ ] Массивы добавляются/обновляются правильно ($push, $pull)
[ ] Уникальный индекс не допускает дубликатов
[ ] Поиск по полю вложенного документа работает
[ ] Null-поля не ломают логику (в отличие от SQL — нет NOT NULL)
[ ] Большие документы (> 16 MB — лимит MongoDB) обрабатываются
[ ] Транзакции (если используются) атомарны
\`\`\`

### Redis — кэш и хранилище сессий

\`\`\`bash
# Базовые команды redis-cli
SET user:session:abc123 "{'user_id': 42, 'role': 'admin'}"
GET user:session:abc123
TTL user:session:abc123    # оставшееся время жизни в секундах
EXPIRE user:session:abc123 3600  # установить TTL 1 час
DEL user:session:abc123    # удалить

# Проверить что кэш инвалидируется после изменения данных
SET product:price:101 1500
# ... изменить цену в основной БД ...
GET product:price:101  # должно вернуть nil (кэш очищен) или новое значение
\`\`\``,
  },
  {
    id: "db3",
    title: "Тестовые данные и среды: подготовка и управление",
    category: "Работа с базами данных",
    level: "intermediate",
    tags: ["тестовые данные", "data management", "seed", "миграции", "среды"],
    content: `## Управление тестовыми данными

### Стратегии подготовки тестовых данных

**1. Static Test Data (статические данные)**
Зафиксированный набор данных, существующий в тестовой среде постоянно.
\`\`\`
Плюсы: предсказуемость, всегда доступны
Минусы: могут «протухнуть», тесты могут влиять друг на друга
Когда: smoke-тесты, читающие тесты (GET)
\`\`\`

**2. Dynamic Test Data (динамические данные)**
Данные создаются перед каждым тестом и удаляются после.
\`\`\`
Плюсы: тесты изолированы, нет «загрязнения»
Минусы: медленнее, сложнее реализовать
Когда: POST/PUT/DELETE тесты, сложные бизнес-сценарии
\`\`\`

**3. Synthetic Data (синтетические данные)**
Генерация данных по правилам (Faker, фабрики).
\`\`\`python
from faker import Faker
fake = Faker('ru_RU')

user = {
  "name": fake.name(),
  "email": fake.email(),
  "phone": fake.phone_number(),
  "address": fake.address(),
  "born": str(fake.date_of_birth(minimum_age=18))
}
\`\`\`

**4. Production Data Clone (копия продакшена)**
Анонимизированная копия реальных данных.
\`\`\`
ВАЖНО: перед использованием обязательна анонимизация!
  - email → qa_anonymized_123@test.com
  - phone → +7999000XXXX
  - name → Тестовый Пользователь
  - ИНН, паспорт → случайные числа

Нарушение GDPR/152-ФЗ при использовании реальных ПДн!
\`\`\`

### Database Seeding (заполнение тестовой БД)

\`\`\`sql
-- seeds/01_users.sql
INSERT INTO users (email, name, role, status) VALUES
  ('admin@test.com',    'Admin User',    'admin',   'active'),
  ('manager@test.com',  'Manager User',  'manager', 'active'),
  ('user@test.com',     'Regular User',  'user',    'active'),
  ('blocked@test.com',  'Blocked User',  'user',    'blocked');

-- seeds/02_products.sql
INSERT INTO products (name, price, stock) VALUES
  ('Тестовый товар', 999.99, 100),
  ('Дорогой товар',  99999,  1),
  ('Бесплатный',     0,      999);
\`\`\`

### Управление тестовыми средами

| Среда | Назначение | Данные | Доступ |
| **Local** | Разработка | Mock / пустая БД | Dev |
| **Dev** | Интеграция компонентов | Seed-данные | Dev + QA |
| **Test/QA** | Функциональное тестирование | Полный seed | QA |
| **Staging** | UAT, предрелизная проверка | Копия структуры prod | QA + Бизнес |
| **Production** | Реальные пользователи | Реальные данные | DevOps |

### Откат тестовых данных

\`\`\`sql
-- Быстрый откат: хранить начальное состояние
BEGIN TRANSACTION;
  -- тестовые операции
  INSERT INTO orders ...;
  UPDATE products SET stock = stock - 1 ...;
  -- проверки
  SELECT ...;
ROLLBACK; -- откатываем всё, БД чистая
\`\`\`

\`\`\`python
# Pytest fixture с автооткатом
import pytest

@pytest.fixture
def db_session():
    session = create_test_session()
    session.begin()
    yield session
    session.rollback()  # автооткат после каждого теста
    session.close()
\`\`\`

### Проверки целостности данных

\`\`\`sql
-- Нарушения NOT NULL
SELECT table_name, column_name
FROM information_schema.columns
WHERE is_nullable = 'NO'
-- затем проверить каждую таблицу:
SELECT COUNT(*) FROM orders WHERE user_id IS NULL;

-- Нарушения внешних ключей (осиротевшие записи)
SELECT o.id FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;  -- заказы без пользователя

-- Дубликаты в уникальных полях
SELECT email, COUNT(*) FROM users
GROUP BY email HAVING COUNT(*) > 1;
\`\`\``,
  },
  // ══ ОСНОВЫ РАБОТЫ С BASH ══════════════════════════════════════════════
  {
    id: "bash1",
    title: "Bash для тестировщика: основные команды",
    category: "Основы работы с bash",
    level: "beginner",
    tags: ["bash", "terminal", "linux", "командная строка", "shell"],
    content: `## Bash: основы для тестировщика

### Зачем QA знать bash?

- Запускать автотесты из командной строки
- Работать с CI/CD (GitHub Actions, Jenkins — bash-скрипты)
- Анализировать логи (grep, tail, awk)
- Автоматизировать рутинные задачи
- Работать с Docker и серверами (SSH)

### Навигация по файловой системе

\`\`\`bash
pwd               # показать текущую директорию
ls                # список файлов
ls -la            # список с правами, скрытыми файлами, размерами
ls -lt            # сортировка по времени изменения
cd /path/to/dir   # перейти в директорию
cd ~              # домашняя директория
cd ..             # на уровень вверх
cd -              # вернуться в предыдущую директорию
\`\`\`

### Работа с файлами и директориями

\`\`\`bash
# Создание
mkdir my_folder              # создать директорию
mkdir -p path/to/nested/dir  # создать вложенные директории
touch file.txt               # создать пустой файл

# Просмотр содержимого
cat file.txt             # вывести всё содержимое
head -20 file.txt        # первые 20 строк
tail -20 file.txt        # последние 20 строк
tail -f app.log          # следить за файлом в реальном времени (логи!)
less file.txt            # постраничный просмотр (q для выхода)

# Копирование и перемещение
cp file.txt backup.txt           # скопировать файл
cp -r folder/ backup_folder/     # скопировать директорию (-r = рекурсивно)
mv file.txt new_name.txt         # переименовать
mv file.txt /other/path/         # переместить

# Удаление
rm file.txt              # удалить файл
rm -rf folder/           # удалить директорию рекурсивно (ОСТОРОЖНО!)
rmdir empty_folder       # удалить пустую директорию

# Права
chmod +x script.sh       # сделать файл исполняемым
chmod 755 script.sh      # rwxr-xr-x
\`\`\`

### Поиск

\`\`\`bash
# Найти файлы
find . -name "*.log"                    # все .log файлы
find . -name "test_*.py"                # тестовые файлы Python
find . -mtime -1                        # изменённые за последний день
find . -size +10M                       # файлы больше 10 MB
find . -type f -name "*.log" -delete    # найти и удалить

# Найти содержимое в файлах (grep)
grep "ERROR" app.log                    # строки с ERROR
grep -i "error" app.log                 # без учёта регистра
grep -n "error" app.log                 # с номерами строк
grep -r "def test_" tests/              # рекурсивно в директории
grep -v "DEBUG" app.log                 # строки БЕЗ DEBUG (инверсия)
grep -c "ERROR" app.log                 # только подсчёт совпадений
grep -A 3 "ERROR" app.log              # ERROR + 3 строки после
grep -B 2 "ERROR" app.log              # ERROR + 2 строки до
grep -E "ERROR|CRITICAL" app.log       # несколько паттернов (regex)
\`\`\`

### Переменные и вывод

\`\`\`bash
# Переменные
NAME="QA Navigator"
VERSION="2.5.1"

# Использование
echo "App: $NAME v$VERSION"
echo "Today: $(date +%Y-%m-%d)"   # подстановка команды

# Переменные окружения
export API_KEY="sk-prod-abc123"    # установить
echo $API_KEY                      # прочитать
env | grep API                     # найти среди переменных окружения
unset API_KEY                      # удалить
\`\`\`

### Пайпы и перенаправление

\`\`\`bash
# Пайп: передать вывод одной команды на вход другой
cat app.log | grep ERROR | head -20

# Перенаправление в файл
echo "Test result: PASS" > result.txt    # создать/перезаписать
echo "Another line" >> result.txt        # добавить в конец
cat app.log 2> errors.txt               # stderr в файл
cat app.log > output.txt 2>&1           # stdout + stderr в файл

# wc — подсчёт
wc -l file.txt     # количество строк
wc -w file.txt     # количество слов
grep ERROR app.log | wc -l   # количество ошибок

# sort и uniq
cat errors.txt | sort | uniq -c | sort -rn  # частота ошибок
\`\`\`

### Работа с процессами

\`\`\`bash
ps aux                          # все процессы
ps aux | grep python            # найти процессы Python
kill 12345                      # завершить процесс по PID
kill -9 12345                   # принудительно завершить
pkill -f "pytest"               # завершить по имени

# Запуск в фоне
pytest tests/ &                 # запустить в фоне
jobs                            # список фоновых задач
wait                            # дождаться всех фоновых задач
\`\`\``,
  },
];
