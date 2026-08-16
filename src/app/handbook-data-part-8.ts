import type { HandbookTopic } from "./handbook-data";

export const HANDBOOK_PART_8: HandbookTopic[] = [
  {
    id: "mob2",
    title: "Инструменты мобильного тестирования",
    category: "Тестирование мобильных приложений",
    level: "beginner",
    tags: ["Appium", "XCUITest", "Espresso", "эмулятор", "Charles Proxy"],
    content: `## Инструменты мобильного тестирования

### Ручное тестирование: эмуляторы и реальные устройства

**Android Emulator (Android Studio):**
\`\`\`
AVD Manager → Create Virtual Device
Выбрать: устройство, версию Android, конфигурацию
Полезные команды (adb):
  adb devices                    # список подключённых устройств
  adb install app.apk            # установить APK
  adb uninstall com.example.app  # удалить приложение
  adb shell                      # командная строка устройства
  adb logcat | grep MyApp        # логи приложения
  adb pull /sdcard/screenshot.png # скачать файл
\`\`\`

**iOS Simulator (Xcode):**
\`\`\`
Xcode → Open Developer Tool → Simulator
xcrun simctl list devices         # список симуляторов
xcrun simctl boot "iPhone 15 Pro" # запустить
xcrun simctl install booted app.app # установить
simctl push booted com.example.app notification.apson # push-уведомление
\`\`\`

**Разница эмулятор vs реальное устройство:**
\`\`\`
Эмулятор/Симулятор:
  + Быстрее, бесплатно, любая версия ОС
  - Нет реального сенсора, камеры, gyroscope
  - iOS Simulator не тестирует реальный App Store поведение
  - Производительность отличается от реального железа

Реальное устройство:
  + Точная производительность, все сенсоры
  + Реальные условия (нотификации, батарея)
  - Дорого, ограниченный парк устройств
  → Решение: BrowserStack / Sauce Labs (реальные устройства в облаке)
\`\`\`

### Перехват трафика: Charles Proxy / Proxyman

\`\`\`
Настройка:
1. Запустить Charles на компьютере
2. Узнать IP компьютера в локальной сети
3. На телефоне: WiFi → Прокси → IP:8888
4. Установить сертификат Charles на телефон (для HTTPS)

Что можно делать:
  - Просматривать все HTTP/HTTPS запросы приложения
  - Изменять запросы и ответы (Breakpoints)
  - Симулировать медленное соединение (Throttling)
  - Заблокировать конкретный URL (Block List)
  - Перезаписать ответ (Map Local / Rewrite)
\`\`\`

### Автоматизация: Appium

\`\`\`python
from appium import webdriver
from appium.options.android import UiAutomator2Options

options = UiAutomator2Options()
options.platform_name = "Android"
options.device_name = "emulator-5554"
options.app = "/path/to/app.apk"
options.app_package = "com.example.app"
options.app_activity = ".MainActivity"

driver = webdriver.Remote("http://127.0.0.1:4723", options=options)

# Найти элемент
el = driver.find_element(AppiumBy.ID, "com.example.app:id/login_button")
el.click()

# Ввод текста
driver.find_element(AppiumBy.ID, "com.example.app:id/email").send_keys("test@example.com")

# Жест swipe
driver.swipe(start_x=500, start_y=1000, end_x=500, end_y=200, duration=300)

driver.quit()
\`\`\`

### Нативные фреймворки автоматизации

**XCUITest (iOS, Swift):**
\`\`\`swift
func testLogin() throws {
    let app = XCUIApplication()
    app.launch()

    let emailField = app.textFields["email_input"]
    emailField.tap()
    emailField.typeText("user@example.com")

    app.buttons["login_button"].tap()

    XCTAssertTrue(app.staticTexts["Добро пожаловать"].exists)
}
\`\`\`

**Espresso (Android, Kotlin):**
\`\`\`kotlin
@Test
fun testLogin() {
    onView(withId(R.id.email_input))
        .perform(typeText("user@example.com"), closeSoftKeyboard())
    onView(withId(R.id.login_button)).perform(click())
    onView(withText("Добро пожаловать")).check(matches(isDisplayed()))
}
\`\`\``,
  },
  {
    id: "mob3",
    title: "Тестирование производительности и безопасности мобильных приложений",
    category: "Тестирование мобильных приложений",
    level: "intermediate",
    tags: ["производительность", "безопасность", "аккумулятор", "память", "crashes"],
    content: `## Производительность и безопасность мобильных приложений

### Метрики производительности

**Время запуска (Launch Time):**
\`\`\`
Cold Start — приложение не в памяти (первый запуск):
  iOS:     норма < 400мс до первого кадра
  Android: норма < 500мс до первого кадра

Warm Start — приложение в памяти, свернуто:
  Норма: < 200мс

Hot Start — возврат из фона (быстро):
  Норма: < 100мс
\`\`\`

**Потребление ресурсов:**
| Метрика | Android (Profiler) | iOS (Instruments) |
| CPU | Android Studio Profiler | Xcode Instruments → Time Profiler |
| Память | Memory Profiler | Allocations / Leaks |
| Сеть | Network Profiler | Network |
| Батарея | Battery Historian | Energy Log |
| Рендеринг | GPU Profiler | Core Animation |

**Нормы для мобильных приложений:**
\`\`\`
[ ] 60 fps при скролле (< 16мс на кадр)
[ ] Нет утечек памяти (Memory растёт и не освобождается)
[ ] Батарея: < 5% за 15 минут активного использования
[ ] Сеть: минимальное количество запросов, сжатие данных
[ ] Размер приложения: < 100 MB (оптимально), < 200 MB (допустимо)
\`\`\`

### Анализ крашей

\`\`\`
Android:
  - logcat: adb logcat | grep -i "crash\|exception\|fatal"
  - Google Play Console → Android Vitals → Crashes & ANR
  - Firebase Crashlytics (stacktrace, устройство, версия ОС)

iOS:
  - Xcode → Window → Devices and Simulators → Logs
  - Xcode Organizer → Crashes
  - Firebase Crashlytics

ANR (Application Not Responding) — Android:
  Приложение не отвечает > 5 секунд (touch events)
  > 10 секунд (background)
  Причина: тяжёлая операция на Main Thread
\`\`\`

### Тестирование безопасности мобильных приложений

**OWASP Mobile Top 10:**
\`\`\`
M1 — Improper Credential Usage
  [ ] Пароли не хранятся в открытом виде
  [ ] Токены не в логах, не в URL параметрах

M2 — Inadequate Supply Chain Security
  [ ] Зависимости обновляются, нет CVE

M3 — Insecure Authentication/Authorization
  [ ] Биометрика + пин-код как fallback
  [ ] Jailbreak/Root detection (если критично)

M5 — Insecure Communication
  [ ] HTTPS везде (certificate pinning для банков)
  [ ] Нет HTTP в продакшене

M8 — Security Misconfiguration
  [ ] Нет debug-логов в production сборке
  [ ] Нет тестовых endpoint в production

M9 — Insecure Data Storage
  [ ] Скриншоты запрещены на экранах с ПДн
  [ ] Данные не в открытом виде в SharedPreferences/NSUserDefaults
  [ ] Keychain/Keystore для секретов
\`\`\`

**Практические проверки:**
\`\`\`bash
# Android: проверить что в SharedPreferences нет секретов
adb shell cat /data/data/com.example.app/shared_prefs/prefs.xml

# Проверить открытые сетевые соединения
adb shell netstat | grep com.example

# Backup флаг (android:allowBackup)
adb backup -apk -nosystem com.example.app
# Если backup работает — данные доступны без root
\`\`\``,
  },
  // ══ ТЕСТИРОВАНИЕ ИГР ══════════════════════════════════════════════════
  {
    id: "game1",
    title: "Специфика тестирования игр: обзор",
    category: "Тестирование игр",
    level: "beginner",
    tags: ["игры", "game testing", "QA", "геймплей", "баги"],
    content: `## Тестирование игр: введение

### Чем тестирование игр отличается от обычного

**Субъективность:**
\`\`\`
В обычном ПО: «кнопка не работает» — объективный баг
В игре: «уровень слишком сложный» — это баг или дизайн?
QA должен понимать игровой дизайн и целевую аудиторию.
\`\`\`

**Нелинейность:**
\`\`\`
Пользователи могут делать что угодно и в любом порядке.
«А что если я прыгну сюда? А если пойду туда?»
Невозможно протестировать все комбинации — нужен опыт + интуиция.
\`\`\`

**Производительность критична:**
\`\`\`
30 fps — минимально приемлемо
60 fps — стандарт для мобильных игр
144 fps — для ПК шутеров
Дропы fps ощущаются физически — это всегда баг.
\`\`\`

### Виды тестирования игр

**Gameplay Testing — игровое тестирование:**
\`\`\`
Механики: движение, прыжки, атаки, сбор предметов
Баланс: сложность, экономика, прогрессия
Геймдизайн: fun factor, читабельность интерфейса
\`\`\`

**Compliance Testing — соответствие требованиям:**
\`\`\`
TRC (Technical Requirements Checklist) — Sony PlayStation
TCR (Technical Certification Requirements) — Microsoft Xbox
Lotcheck — Nintendo
App Store / Google Play Review Guidelines
Без прохождения — игру не выпустят!
\`\`\`

**Localization Testing — локализация:**
\`\`\`
Текст помещается в UI (немецкий длиннее английского на 30%)
Нет «кракозябр» (неправильная кодировка)
Дата/время/числа в локальном формате
Нет оскорбительного контента для региона
\`\`\`

**Multiplayer Testing:**
\`\`\`
Синхронизация состояния игроков
Latency (задержка) — как игра ведёт себя при пинге 200мс+
Читерство: проверка серверной валидации
Вместимость серверов (нагрузочное тестирование)
\`\`\`

### Типичные баги в играх

\`\`\`
Коллизии:
  - Можно пройти сквозь стену/пол (clip through)
  - Застрять в геометрии (stuck)
  - Провалиться под карту (fall through)

Физика:
  - Объекты летают (floating objects)
  - Персонаж скользит по воздуху
  - Gravity работает неправильно

Прогрессия:
  - Квест нельзя завершить (quest breaking bug — критический!)
  - Можно пропустить обязательную локацию
  - Получить предмет до положенного момента (sequence break)

UI/HUD:
  - Счёт не обновляется
  - Полоса HP не уменьшается
  - Карта не отображается

Аудио:
  - Звук обрезается посередине
  - Музыка не переключается при смене локации
  - Звуковые эффекты зациклились
\`\`\`

### Серьёзность багов в играх

\`\`\`
Critical (Blocker):
  - Краш/зависание
  - Невозможно завершить основной квест
  - Потеря прогресса
  - Дыра в экономике (бесконечные ресурсы)

High:
  - Можно застрять без возможности выбраться
  - Мультиплеер не работает
  - Читерская механика нарушает баланс

Medium:
  - Визуальные глитчи (артефакты)
  - Звук не соответствует действию
  - Неправильный перевод

Low:
  - Опечатки в тексте
  - Незначительные визуальные дефекты
  - Несоответствие лора
\`\`\``,
  },
  {
    id: "game2",
    title: "Производительность и платформенное тестирование игр",
    category: "Тестирование игр",
    level: "intermediate",
    tags: ["fps", "производительность", "платформа", "console", "ПК", "мобильные игры"],
    content: `## Производительность и платформы

### Метрики производительности игр

**FPS (Frames Per Second):**
\`\`\`
< 20 fps  — неиграбельно
24-30 fps — приемлемо для RPG, стратегий
60 fps    — стандарт для большинства жанров
120+ fps  — шутеры, файтинги, competitive games

Frametime (время кадра):
  60 fps = 16.67 мс/кадр
  30 fps = 33.3 мс/кадр

Frame drops (дропы):
  Кратковременное падение fps → "stuttering"
  Даже если средний fps 60, дроп до 20 на секунду — заметный баг
\`\`\`

**Инструменты измерения:**
\`\`\`
ПК (Windows):
  - MSI Afterburner + RivaTuner — оверлей fps, cpu/gpu usage
  - CapFrameX — детальный анализ frametimes
  - NVIDIA FrameView — для NVIDIA GPU

Android:
  - Android GPU Inspector
  - GameBench (профессиональный инструмент)
  - adb shell dumpsys gfxinfo <package> — данные рендеринга

iOS:
  - Xcode Instruments → Metal System Trace
  - GameBench iOS

Консоли:
  - PlayStation: System Software инструменты разработчика
  - Xbox: PIX for Windows + GDK tools
\`\`\`

### Чеклист производительности

\`\`\`
[ ] Стабильный fps на целевой платформе (нет дропов)
[ ] Frametimes ровные (нет stuttering)
[ ] Время загрузки уровня < 30 секунд (норма по жанру)
[ ] Потребление RAM не превышает 80% от доступного
[ ] GPU/CPU не перегреваются (термический троттлинг)
[ ] Нет memory leak (RAM растёт за длинную сессию)
[ ] Работает в оффлайн-режиме (если нужно)
[ ] Нет фризов при сохранении игры
[ ] Переход между локациями плавный
\`\`\`

### Мобильные игры: специфика

\`\`\`
Целевые устройства — разбить на тиры:
  High-end:  флагманы (последние 1-2 года)
  Mid-range: средний класс (основная аудитория)
  Low-end:   бюджетные устройства (2-4 лет назад)

Чеклист для мобильных:
  [ ] Нагрев устройства (не должен обжигать)
  [ ] Расход батареи (< 10% за 30 минут игры)
  [ ] Работа при входящем звонке
  [ ] Работа при уведомлениях
  [ ] Поведение при низком заряде (режим энергосбережения)
  [ ] Тач-управление: нет ложных нажатий, отклик < 100мс
  [ ] Gyroscope управление (если есть)
  [ ] Работа с наушниками (Bluetooth + проводные)
\`\`\`

### Платформенная специфика

**Console (PS5/Xbox Series/Switch):**
\`\`\`
TRC/TCR обязательны перед сабмитом в магазин:
  - Контроллер: все кнопки задействованы по гайдлайнам
  - Pause при нажатии Home/Dashboard
  - Сохранение каждые X минут (или предупреждение)
  - Онлайн/оффлайн переключение без перезапуска
  - HDR/4K/60fps если платформа поддерживает

Switch специфика:
  - Dock mode (TV) и handheld mode — оба работают
  - Joy-Con разделение и воссоединение в меню
  - Sleep mode — данные не теряются
  - 4 GB RAM — очень жёсткие ограничения

PS5/Xbox:
  - SSD загрузка — нет экранов загрузки > 2 сек
  - Haptics (DualSense): силовые триггеры работают
  - Activity Cards (PS5) — правильные данные
\`\`\``,
  },
];
