import type { HandbookTopic } from "./handbook-data";

export const HANDBOOK_PART_7: HandbookTopic[] = [
  {
    id: "bash2",
    title: "Bash-скрипты для автоматизации QA-задач",
    category: "Основы работы с bash",
    level: "intermediate",
    tags: ["bash", "скрипт", "автоматизация", "CI", "логи"],
    content: `## Bash-скрипты для QA

### Структура bash-скрипта

\`\`\`bash
#!/bin/bash
# Shebang — указывает интерпретатор

# Строгий режим (рекомендуется всегда!)
set -e          # остановить при ошибке
set -u          # ошибка при необъявленных переменных
set -o pipefail # учитывать ошибки в пайпах

# Переменные
BASE_URL="http://localhost:8080"
REPORT_DIR="./reports/$(date +%Y-%m-%d)"

# Создать директорию для отчётов
mkdir -p "$REPORT_DIR"

echo "=== QA Test Run: $(date) ==="
\`\`\`

### Условия и циклы

\`\`\`bash
# if-else
if [ $status_code -eq 200 ]; then
  echo "✅ PASS"
elif [ $status_code -eq 404 ]; then
  echo "⚠️  Not Found"
else
  echo "❌ FAIL: $status_code"
fi

# Проверки файлов
if [ -f "config.json" ]; then echo "Файл существует"; fi
if [ -d "reports/" ]; then echo "Директория существует"; fi
if [ -z "$API_KEY" ]; then echo "Ключ не задан!"; exit 1; fi

# for loop
for env in dev staging prod; do
  echo "Testing $env environment..."
  newman run collection.json -e $env.json
done

# while loop
attempts=0
while [ $attempts -lt 5 ]; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
  if [ "$response" = "200" ]; then break; fi
  attempts=$((attempts + 1))
  sleep 2
done
\`\`\`

### Практические скрипты для QA

**Скрипт: дождаться готовности сервера**
\`\`\`bash
#!/bin/bash
wait_for_server() {
  local url=$1
  local timeout=\${2:-60}
  local elapsed=0

  echo "Waiting for \$url..."
  until curl -sf "\$url/health" > /dev/null; do
    if [ \$elapsed -ge \$timeout ]; then
      echo "❌ Server not ready after \${timeout}s"
      exit 1
    fi
    sleep 2
    elapsed=\$((elapsed + 2))
  done
  echo "✅ Server ready after \${elapsed}s"
}

wait_for_server "http://localhost:8080" 120
\`\`\`

**Скрипт: анализ логов на ошибки**
\`\`\`bash
#!/bin/bash
LOG_FILE="\${1:-app.log}"
REPORT="log_analysis_$(date +%Y%m%d_%H%M).txt"

echo "=== Log Analysis: $LOG_FILE ===" > "$REPORT"
echo "Date: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

# Подсчёт ошибок по уровню
echo "--- Error Counts ---" >> "$REPORT"
for level in ERROR CRITICAL WARNING; do
  count=$(grep -c "$level" "$LOG_FILE" 2>/dev/null || echo 0)
  echo "$level: $count" >> "$REPORT"
done

# Топ-10 частых ошибок
echo "" >> "$REPORT"
echo "--- Top 10 Errors ---" >> "$REPORT"
grep "ERROR" "$LOG_FILE" | \
  sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}[T ][0-9:.]*//' | \
  sort | uniq -c | sort -rn | head -10 >> "$REPORT"

cat "$REPORT"
echo "Report saved to $REPORT"
\`\`\`

**Скрипт: запуск тестов с отчётом**
\`\`\`bash
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="reports/$TIMESTAMP"
mkdir -p "$REPORT_DIR"

echo "🚀 Starting test run: $TIMESTAMP"

# Запуск pytest с отчётом
pytest tests/ \\
  --html="$REPORT_DIR/report.html" \\
  --tb=short \\
  -v \\
  2>&1 | tee "$REPORT_DIR/console.log"

EXIT_CODE=\${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests PASSED"
else
  echo "❌ Tests FAILED (exit code: $EXIT_CODE)"
  echo "Check report: $REPORT_DIR/report.html"
fi

exit $EXIT_CODE
\`\`\`

### Работа с curl для тестирования API

\`\`\`bash
# GET запрос
curl -s https://api.example.com/users

# GET с заголовками
curl -s -H "Authorization: Bearer $TOKEN" \\
  https://api.example.com/users

# POST с JSON
curl -s -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"name":"Test","email":"test@example.com"}'

# Получить только статус код
status=$(curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health)
echo "Status: $status"

# Сохранить в файл + вывести статус
curl -s -w "\\nStatus: %{http_code}\\n" \\
  https://api.example.com/users \\
  -o response.json
cat response.json | python3 -m json.tool  # форматировать JSON
\`\`\``,
  },
  // ══ ОСНОВЫ РАБОТЫ С GIT ═══════════════════════════════════════════════
  {
    id: "git1",
    title: "Git для тестировщика: базовые команды",
    category: "Основы работы с git",
    level: "beginner",
    tags: ["git", "версионирование", "commit", "branch", "clone"],
    content: `## Git для тестировщика

### Зачем QA знать Git?

- Хранить автотесты и тест-кейсы в репозитории
- Участвовать в code review автотестов
- Смотреть что изменилось перед тестированием (\`git diff\`)
- Создавать ветки для наборов тестов
- Работать в CI/CD пайплайне

### Первоначальная настройка

\`\`\`bash
git config --global user.name "Иванова Анна"
git config --global user.email "anna@example.com"
git config --global core.editor "code --wait"  # VS Code как редактор
git config --list  # проверить настройки
\`\`\`

### Базовые команды

**Инициализация и клонирование:**
\`\`\`bash
git init                          # создать новый репозиторий
git clone https://github.com/org/repo.git  # клонировать
git clone repo.git my_folder     # клонировать в конкретную папку
\`\`\`

**Статус и история:**
\`\`\`bash
git status                        # текущее состояние
git log                           # история коммитов
git log --oneline                 # краткая история
git log --oneline -20             # последние 20 коммитов
git log --oneline --graph --all   # граф всех веток
git show abc1234                  # детали коммита
git diff                          # несохранённые изменения
git diff HEAD~1                   # изменения последнего коммита
git diff main..feature-branch     # разница между ветками
\`\`\`

**Staging и коммиты:**
\`\`\`bash
git add file.py                   # добавить файл в staging
git add tests/                    # добавить директорию
git add -A                        # добавить все изменения
git add -p                        # интерактивно выбрать изменения

git commit -m "feat: add login smoke test"    # коммит
git commit -m "fix: correct expected result"  # коммит

git reset HEAD file.py            # убрать из staging (не удаляет изменения)
git checkout -- file.py           # отменить изменения в файле (⚠️ необратимо)
\`\`\`

### Ветки (Branches)

\`\`\`bash
git branch                        # список локальных веток
git branch -a                     # все ветки (включая remote)

git checkout -b qa/sprint-24-smoke  # создать и переключиться
git switch -c qa/sprint-24-smoke    # то же самое (новый синтаксис)

git checkout main                 # переключиться на main
git switch main

git branch -d qa/old-branch       # удалить ветку (если слита)
git branch -D qa/old-branch       # удалить принудительно
\`\`\`

### Синхронизация с remote

\`\`\`bash
git fetch                         # скачать изменения (не применять)
git pull                          # скачать и применить (fetch + merge)
git pull --rebase                 # скачать и rebase (чистая история)

git push origin qa/sprint-24      # отправить ветку
git push -u origin qa/sprint-24   # отправить + установить upstream

git remote -v                     # список remote репозиториев
git remote add origin https://...  # добавить remote
\`\`\`

### Конвенция коммитов (Conventional Commits)

Структура: \`тип(скоуп): описание\`

\`\`\`
feat:     новая функциональность
fix:      исправление бага
test:     добавление/изменение тестов
refactor: рефакторинг (не новая фича, не фикс)
docs:     документация
chore:    обслуживание (обновление зависимостей, конфиги)

Примеры:
  feat(auth): add bearer token validation test
  fix(login): correct expected error message
  test(checkout): add payment failure scenarios
  docs: update test setup instructions
\`\`\`

### .gitignore для QA-проекта

\`\`\`gitignore
# Результаты тестов
test-results/
playwright-report/
allure-results/
allure-report/
*.xml
coverage/

# Окружение и секреты
.env
.env.local
config/secrets.yaml
*.key

# IDE
.vscode/settings.json
.idea/
*.pyc
__pycache__/

# Зависимости
node_modules/
venv/
.pytest_cache/
\`\`\``,
  },
  {
    id: "git2",
    title: "Git: ветвление, слияние, Pull Request и Git Flow",
    category: "Основы работы с git",
    level: "intermediate",
    tags: ["git flow", "merge", "rebase", "pull request", "code review"],
    content: `## Git: ветвление и командная работа

### Git Flow — модель ветвления

\`\`\`
main (production-ready)
  └── develop (интеграция)
        ├── feature/add-payment-tests  (новые тесты)
        ├── feature/fix-login-test     (исправление теста)
        └── release/2.5.0             (подготовка релиза)
              └── hotfix/critical-bug  (срочные фиксы)
\`\`\`

**Ветки для QA:**
\`\`\`
Соглашение по именованию:
  qa/smoke-sprint-25        — smoke тесты для спринта
  qa/regression-v2.5        — регрессия для релиза
  test/payment-module        — тесты для модуля оплаты
  fix/flaky-test-TC-123      — фикс нестабильного теста
\`\`\`

### Слияние веток (Merge vs Rebase)

**Merge — объединить ветки:**
\`\`\`bash
git checkout main
git merge feature/add-tests        # merge commit создаётся
git merge --squash feature/tests   # все коммиты в один
git merge --no-ff feature/tests    # явный merge commit
\`\`\`

**Rebase — перенести коммиты на новую базу:**
\`\`\`bash
git checkout feature/tests
git rebase main          # перенести коммиты поверх main

# Interactive rebase — редактировать историю
git rebase -i HEAD~3     # последние 3 коммита
# pick → squash (объединить)
# pick → reword (переименовать)
# pick → drop (удалить коммит)
\`\`\`

**Разница:**
\`\`\`
Merge:  сохраняет историю ветки, создаёт merge commit
Rebase: линейная история, нет merge commit
        ⚠️ Никогда не rebase публичные ветки (main, develop)!
\`\`\`

### Разрешение конфликтов

\`\`\`bash
# При merge/rebase возник конфликт:
git status           # показывает файлы с конфликтами

# Конфликт в файле выглядит так:
< < < < < < < HEAD (текущая ветка)
expected_result = "Успешно авторизован"
= = = = = = =
expected_result = "Авторизация выполнена успешно"
> > > > > > > feature/tests (входящая ветка)

# Решение:
# 1. Открыть файл, выбрать нужный вариант (или объединить)
# 2. Удалить маркеры <<<<<<<, =======, >>>>>>>
# 3. git add файл
# 4. git commit (при merge) или git rebase --continue
\`\`\`

### Pull Request (PR) — процесс

\`\`\`
1. Создать ветку: git checkout -b test/checkout-flow
2. Написать тесты, сделать коммиты
3. Запушить: git push origin test/checkout-flow
4. Открыть PR на GitHub/GitLab:
   - Заголовок: "test: add checkout flow E2E tests"
   - Описание: что сделано, что протестировано, ссылка на задачу
   - Reviewers: назначить коллег
5. Code Review: исправить комментарии
6. Merge после апрува
\`\`\`

**Хороший PR от QA:**
\`\`\`markdown
## Что сделано
- Добавлены E2E тесты для флоу оплаты (TC-101, TC-102, TC-103)
- Добавлены негативные сценарии: невалидная карта, истёкшая карта
- Обновлены page objects: PaymentPage, ConfirmationPage

## Тесты покрывают
- Happy path: успешная оплата картой
- Неверный CVV → сообщение об ошибке
- Отмена оплаты → возврат в корзину

## Как запустить
\`\`\`bash
pytest tests/e2e/test_checkout.py -v
\`\`\`

## Задача
Jira: PROJ-456
\`\`\`

### Полезные команды для анализа кода перед тестированием

\`\`\`bash
# Что изменилось в этой ветке относительно main?
git diff main...HEAD --name-only           # только имена файлов
git diff main...HEAD --stat                # краткая статистика

# Кто последний менял файл?
git blame tests/test_login.py

# Когда был изменён файл?
git log --oneline -- src/payment/service.py

# Поиск коммита по сообщению
git log --oneline --grep="payment" --all

# Откат к предыдущей версии файла
git checkout HEAD~1 -- tests/test_login.py

# Stash — временно сохранить незакоммиченные изменения
git stash                    # сохранить
git stash list               # список
git stash pop                # восстановить последний
git stash apply stash@{2}    # восстановить конкретный
\`\`\``,
  },
  // ══ ТЕСТИРОВАНИЕ МОБИЛЬНЫХ ПРИЛОЖЕНИЙ ════════════════════════════════
  {
    id: "mob1",
    title: "Виды мобильных приложений и стратегия тестирования",
    category: "Тестирование мобильных приложений",
    level: "beginner",
    tags: ["мобильное", "native", "hybrid", "PWA", "iOS", "Android"],
    content: `## Виды мобильных приложений

### Классификация по типу разработки

**Native (нативные):**
\`\`\`
iOS:     Swift / Objective-C → UIKit / SwiftUI
Android: Kotlin / Java → Android SDK

Плюсы:  лучшая производительность, доступ ко всем API устройства
Минусы: два отдельных приложения, двойные затраты
\`\`\`

**Cross-platform:**
\`\`\`
React Native — JavaScript, приближается к нативному
Flutter — Dart, компилируется в нативный код
Xamarin / MAUI — C#

Плюсы:  один код для iOS и Android
Минусы: производительность чуть ниже нативного
\`\`\`

**Hybrid (гибридные):**
\`\`\`
Web-view внутри нативной оболочки (Ionic, Cordova)
Тестируются как веб + специфика нативного контейнера
\`\`\`

**PWA (Progressive Web App):**
\`\`\`
Веб-сайт, который можно «установить» на устройство
Работает через Service Worker, имеет оффлайн-режим
Тестируется как веб + тест установки/удаления
\`\`\`

### Специфика тестирования iOS vs Android

| Аспект | iOS | Android |
| Версии ОС | 2-3 основных | Фрагментация (6-14+) |
| Устройства | Закрытая экосистема | Сотни производителей |
| Магазин | App Store (строгие ревью) | Google Play + side-loading |
| Разрешения | Каждое разрешение — свой диалог | Группы разрешений |
| Back button | ❌ (жест назад) | ✅ кнопка/жест |
| Deep links | Universal Links | App Links + Deep Links |
| Уведомления | Сложнее настроить | Более гибко |

### Чеклист мобильного тестирования

**Установка/Обновление:**
\`\`\`
[ ] Установка из магазина (свежая установка)
[ ] Обновление с предыдущей версии (данные сохранились)
[ ] Переустановка (что происходит с данными?)
[ ] Достаточно места на устройстве (мало места → ошибка)
[ ] Удаление приложения (данные очищаются, если нужно)
\`\`\`

**Прерывания:**
\`\`\`
[ ] Входящий звонок во время использования
[ ] SMS/уведомление
[ ] Блокировка экрана и разблокировка
[ ] Свернуть приложение → открыть другое → вернуться
[ ] Низкий заряд батареи (режим энергосбережения)
[ ] Отключение интернета в середине операции
[ ] Переключение WiFi → мобильный интернет
\`\`\`

**Разрешения:**
\`\`\`
[ ] Первый запрос разрешения — диалог показывается
[ ] Разрешение отклонено — приложение работает корректно (без краша)
[ ] Разрешение отозвано в настройках — приложение обрабатывает
[ ] Гео-разрешение: «Только при использовании» vs «Всегда»
[ ] Уведомления отключены — нет краша
\`\`\`

**Ориентация и размеры экрана:**
\`\`\`
[ ] Portrait (вертикальная) ориентация
[ ] Landscape (горизонтальная) — если поддерживается
[ ] Поворот экрана не теряет данные формы
[ ] Split-screen режим (Android)
[ ] Маленький экран (5") и большой (6.7"+)
[ ] Планшет (если поддерживается)
\`\`\``,
  },
];
