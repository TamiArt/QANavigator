import { HANDBOOK } from "../handbook-data";
import type { AutoStack } from "../domain/types";

// CONSTANTS
// ══════════════════════════════════════════════════════
export const PRESETS = [
  { id: "input-form", name: "Форма ввода", icon: "📝", hint: "поля, валидация, обязательные поля" },
  { id: "auth", name: "Авторизация/Регистрация", icon: "🔐", hint: "логин, регистрация, восстановление пароля" },
  { id: "button-cta", name: "Кнопка/CTA", icon: "🖱️", hint: "состояния, hover, disabled, loading" },
  { id: "payment", name: "Оплата", icon: "💳", hint: "карта, CVV, 3DS, безопасность" },
  { id: "search-table", name: "Таблица/Поиск", icon: "🔍", hint: "фильтрация, сортировка, пагинация" },
  { id: "custom", name: "Своя фича", icon: "⚙️", hint: "опишите свою функциональность" },
];

export const TEST_DATA = {
  boundary: ["a", "aa", "a".repeat(255), "a".repeat(256), "0", "-1", "2147483647", "2147483648", " ", "\t\n", "null", "NULL", "undefined", "NaN", "0.0001"],
  special: ["!@#$%^&*()_+", "\\n\\r\\t\\0", "' OR '1'='1", "'; DROP TABLE users;--", "admin'--", "SELECT * FROM users", "1=1", "\" OR \"\"=\"", "<>/?:;|\\"],
  xss: ["<script>alert('XSS')</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)", "<svg onload=alert(1)>", "';alert(1)//", "<iframe src=\"javascript:alert(1)\">", "%3Cscript%3Ealert(1)%3C/script%3E", "<body onload=alert(1)>"],
  emails: ["plainaddress", "@missinglocal.com", "email@", "email@.com", "email@domain..com", "email @domain.com", "..email@domain.com", "email@domain@domain.com", "тест@домен.рф"],
  dates: ["00/00/0000", "13/01/2024", "01/32/2024", "29/02/2023", "31/11/2024", "2024-13-01", "99/99/9999", "not-a-date", "2024-02-30", ""],
};

export const STACKS: { id: AutoStack; label: string; lang: string; badge?: string }[] = [
  // Python
  { id: "python-playwright", label: "Python + Playwright", lang: "python", badge: "🔥 популярный" },
  { id: "python-selenium",   label: "Python + Selenium",   lang: "python" },
  { id: "python-requests",   label: "Python + Pytest + Requests (API)", lang: "python", badge: "API" },
  // TypeScript / JavaScript
  { id: "ts-playwright",     label: "TypeScript + Playwright", lang: "typescript", badge: "🔥 популярный" },
  { id: "ts-cypress",        label: "TypeScript + Cypress",    lang: "typescript" },
  { id: "js-playwright",     label: "JavaScript + Playwright", lang: "javascript" },
  { id: "js-cypress",        label: "JavaScript + Cypress",    lang: "javascript" },
  // Java
  { id: "java-junit",        label: "Java + Selenium + JUnit 5",  lang: "java", badge: "🔥 популярный" },
  { id: "java-testng",       label: "Java + Selenium + TestNG",    lang: "java" },
  { id: "java-restassured",  label: "Java + REST Assured (API)",   lang: "java", badge: "API" },
  // Kotlin
  { id: "kotlin-junit",      label: "Kotlin + JUnit 5",     lang: "kotlin" },
  { id: "kotlin-espresso",   label: "Kotlin + Espresso (Android)", lang: "kotlin", badge: "Mobile" },
  // C#
  { id: "csharp-nunit",      label: "C# + NUnit",           lang: "csharp", badge: "🔥 популярный" },
  { id: "csharp-xunit",      label: "C# + xUnit",           lang: "csharp" },
  { id: "csharp-specflow",   label: "C# + SpecFlow (BDD)",  lang: "csharp", badge: "BDD" },
  // Другие языки
  { id: "ruby-capybara",     label: "Ruby + Capybara + RSpec", lang: "ruby" },
  { id: "go-playwright",     label: "Go + Playwright",         lang: "go" },
  { id: "swift-xcuitest",    label: "Swift + XCUITest (iOS)",  lang: "swift", badge: "Mobile" },
  { id: "php-codeception",   label: "PHP + Codeception",       lang: "php" },
];

export const CATEGORIES = [...new Set(HANDBOOK.map((t) => t.category))];

export const STORAGE_KEYS = {
  theme: "qa_nav_theme",
  apiKeys: "qa_nav_apikeys",
  checklists: "qa_navigator_checklists",
  testCases: "qa_navigator_testcases",
  bugReports: "qa_navigator_bugreports",
  bookmarks: "qa_navigator_bookmarks",
  requirementsText: "qa_navigator_req_text",
  requirementsResult: "qa_navigator_req_result",
} as const;
export const EXPORTABLE_STORAGE_KEYS = [
  "qa_navigator_checklists",
  "qa_navigator_testcases",
  "qa_navigator_bugreports",
  "qa_navigator_bookmarks",
  "qa_navigator_req_text",
  "qa_navigator_req_result",
] as const;

// ══════════════════════════════════════════════════════
