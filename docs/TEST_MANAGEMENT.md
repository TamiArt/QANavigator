# Test Management — спецификация QA Navigator

## Цель и ориентиры

Встроенная TMS объединяет лучшие продуктовые паттерны TestRail и Test IT: структурированную библиотеку тестов, повторное использование сценариев, планы и прогоны, результаты, дефекты, traceability, историю, аналитику и командную работу. Это единый контур внутри каждого проекта QA Navigator. Мы заимствуем подходы, но не копируем интерфейсы, тексты или закрытую реализацию поставщиков.

## Реализованный первый срез

Путь: Рабочее пространство → выбранный проект → Test Management.

Вкладки:
- Обзор — счётчики тест-кейсов, наборов, планов, прогонов и дефектов.
- Тест-кейсы — создание, поиск, ключ, папка, предусловия, шаги, ожидаемый результат, приоритет; выбор кейсов для набора.
- Наборы (Test Suites) — создание набора из выбранных кейсов; удаление набора не удаляет кейсы.
- Планы и прогоны (Test Plans / Runs) — план с окружением и составом кейсов, запуск, статусы Passed / Failed / Blocked / Skipped, actual result, история.
- Базовые коллекции — импорт шаблонов в библиотеку проекта как редактируемых копий.
- Дефекты — реестр дефектов с ключом, severity, priority, status и связью с тест-кейсом.

### Стартовые коллекции

1. Smoke / критический пользовательский путь.
2. Авторизация и регистрация.
3. Формы и валидация.
4. CRUD и управление данными.
5. Поиск, фильтры и таблицы.
6. API: базовый контракт.
7. Мобильное приложение.
8. Безопасность и доступы.
9. Доступность и UX.
10. Регрессионный набор.

Шаблоны — отправная точка, а не универсальные обязательные требования. QA адаптирует предусловия, тестовые данные и expected result к конкретному продукту.

### Хранение

- Данные разделены по projectId, ключ qa_navigator_test_management_v1.
- Ключ включён в общую резервную копию Settings и проверяется при импорте.
- Доступен JSON-экспорт и импорт архива выбранного проекта. Импорт валидирует структуру и связи, затем переносит данные в текущий проект, не меняя его ID.
- Общая резервная копия приложения продолжает включать ключ Test Management.
- Основные операции не требуют AI, API-ключа или backend.
- Данные находятся в хранилище текущего профиля браузера. Экспортированный JSON-файл пользователь сохраняет на своём компьютере и может импортировать на другом устройстве.
- Это local-first режим одного браузерного профиля; совместная синхронизация и роли не реализованы. Очистка данных браузера без резервной копии может привести к потере локальных данных.

## Целевая функциональность полноценной TMS

### Библиотека тестовой документации
- Дерево папок с вложенностью, drag-and-drop, фильтры, теги, компоненты, полнотекстовый поиск.
- Редактор кейса: описание, предусловия, шаги с expected на каждом шаге, тестовые данные, постусловия, вложения и ссылки.
- Версии, diff, история изменений, архивирование, восстановление, клонирование и массовые операции.
- Shared steps, параметры, data-driven кейсы, чек-листы, BDD/Gherkin и exploratory charters.

### Test Suites и Test Plans
- Иерархические и динамические suites.
- План с релизом/build, окружением, scope, целями, рисками, ответственными, датами, entry/exit criteria.
- Фиксированный snapshot состава на момент запуска.
- Платформы, конфигурации, регионы и роли.
- Повторный запуск failed/blocked, rerun выбранных кейсов и сравнение прогонов.

### Test Runs и выполнение
- Not Run, Passed, Failed, Blocked, Skipped, Retest, In Progress.
- Результат на уровне каждого шага, actual result, комментарий, длительность и исполнитель.
- Скриншоты, видео, HAR, логи, API/SQL evidence.
- Создание дефекта из failed результата с автоматической связью.
- Аудит событий, временные метки, история статусов и повторное открытие.
- Офлайн-черновики и восстановление незавершённого прогона.

### Дефекты
- Карточка: summary, описание, шаги, expected/actual, environment/build, severity, priority, assignee, labels, attachments.
- Жизненный цикл New → Open → In Progress → Fixed → Retest → Closed / Reopened / Rejected.
- Связи many-to-many с кейсами, прогонами, требованиями и релизами.
- Дедупликация, поиск, фильтры, комментарии и аудит.

### Requirements Traceability
- Реестр требований и критериев приёмки.
- Requirement ↔ Test Case ↔ Test Run ↔ Defect.
- Матрица покрытия, непокрытые требования, устаревшие тесты и impact analysis.
- Метрики покрытия рассчитываются по актуальным связям.

### Аналитика и отчёты
- pass rate, execution progress, blocked/fail rate, requirement coverage.
- Тренды между прогонами/релизами, распределение дефектов.
- flaky/reopened tests, длительность, aging.
- Отчёты Test Run, Test Plan, release readiness и traceability.
- CSV/JSON/Markdown/HTML/PDF export; каждая метрика имеет формулу и источник.

### Командная работа
- Роли Owner, Admin, QA Lead, Tester, Viewer и granular permissions.
- Исполнители/reviewers, комментарии, упоминания, уведомления.
- Optimistic locking/conflict resolution, audit log.
- Интеграции issue trackers и CI.
Эти возможности требуют backend и identity layer; localStorage не обеспечивает совместное хранилище.

### Импорт, экспорт и интеграции
- CSV/XLSX/JSON для кейсов, suites, plans и результатов.
- TestRail/Test IT migration только по проверенным форматам/API с preview, mapping, validation и отчётом о потерях.
- API/webhooks для CI/CD, Jira/YouTrack и automation frameworks.
- JUnit XML import.

## Целевая доменная модель

Сущности: Project, Folder, TestCase, TestStep, SharedStep, TestSuite, TestPlan, TestRun, TestResult, Attachment, Requirement, Defect, Comment, User, Role, AuditEvent, Release, Environment.

Все записи имеют стабильный ID, projectId и timestamps. История прогона должна быть воспроизводимой: Run хранит snapshot кейса/шагов на момент запуска; редактирование исходного кейса не переписывает старые результаты.

Связи: Suite N:M TestCases; Plan N:M Suites/TestCases; Run N:1 Plan; Run 1:N Results; Result N:M Defects/Evidence; Requirement N:M TestCases; Defect N:M TestCases/Results/Requirements.

## Архитектура и миграции

1. Для растущих объёмов перенести крупные коллекции и бинарные вложения в IndexedDB; текущие записи localStorage мигрировать без потери данных.
2. Ввести schemaVersion и последовательные миграции без потери существующих backup formats.
3. Добавить валидаторы сущностей и ссылочной целостности.
4. Атомарно обновлять прогон и связанные результаты через транзакции.
5. Project archive: manifest, checksum, preview, вложения и conflict resolution.
6. Сохранить local-first/offline режим; синхронизация не входит в архитектуру по умолчанию.
7. Сервер, авторизация и командная синхронизация не требуются для выбранного браузерного режима.

## Этапы развития

| Этап | Содержание | Статус |
|---|---|---|
| TMS foundation | Project-scoped cases, suites, plans/runs, statuses, defect register, starter collections, JSON export/backup and validated project import | Реализовано |
| Case management | Полный редактор, папки, tags/filters, версии, shared steps, attachments | Далее |
| Execution engine | Step-level results, evidence, reruns, assignees, audit trail | Далее |
| Traceability | Requirements matrix, impact analysis, defect linking | Далее |
| Reporting | Dashboards, run comparison, release readiness | Далее |
| Import/export | CSV/XLSX, TestRail/Test IT mapping, JUnit XML | Далее |
| Team mode | Backend, RBAC, collaboration, sync, notifications, integrations | Отдельный этап |

## Definition of Done

- Данные привязаны к проекту и переживают reload.
- Исторические результаты не меняются при редактировании кейса.
- Backup/restore валидирует структуру и сохраняет старые данные.
- Архив проекта можно перенести на другой компьютер и импортировать в выбранный проект.
- Работа с TMS не требует серверов, аккаунта или платного облачного хранилища.
- Есть тесты доменной логики, миграций, ссылочной целостности и UI flows.
- Интерфейс доступен с клавиатуры и адаптирован к мобильному экрану.
- Browser-only ограничения описаны явно.
- npm run verify проходит до объявления этапа завершённым.