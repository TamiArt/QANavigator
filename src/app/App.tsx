import {
  useState, useEffect, useCallback, useRef, createContext, useContext, useMemo,
} from "react";


import { HandbookTopic, HANDBOOK } from "./handbook-data";
import { useLocalStorage } from "./hooks/use-local-storage";
import { downloadTextFile } from "./lib/download";

import {
  BookOpen, CheckSquare, Bug, Zap, BarChart2, Database, Settings,
  Copy, Check, Download, Search, Star, Moon, Sun, Key, AlertTriangle,
  Info, X, Plus, Trash2, RefreshCw, FileText, Code, Filter,
  ChevronRight, ChevronDown, Menu, Brain, Shield, Globe, Terminal,
  CheckCircle, XCircle, AlertCircle, Play, RotateCcw, Upload, Eye,
  EyeOff, Award, ArrowRight, Cpu, GraduationCap, Lightbulb, HelpCircle,
  ChevronUp, Clipboard, Bookmark, BookMarked, List, Layers,
} from "lucide-react";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════
type Theme = "light" | "dark";
type Module =
  | "requirements" | "test-design" | "test-execution"
  | "automation" | "release-report" | "test-data" | "handbook" | "documentation" | "settings";
type TestStatus = "pending" | "passed" | "failed" | "blocked";
type Severity = "critical" | "high" | "medium" | "low";
type AutoStack =
  | "python-playwright" | "python-selenium" | "python-requests"
  | "ts-playwright" | "ts-cypress" | "js-cypress" | "js-playwright"
  | "java-junit" | "java-testng" | "java-restassured"
  | "kotlin-junit" | "kotlin-espresso"
  | "csharp-nunit" | "csharp-xunit" | "csharp-specflow"
  | "ruby-capybara" | "go-playwright" | "swift-xcuitest" | "php-codeception";

interface ApiKeys {
  openrouter: string;
  gemini: string;
  provider: "openrouter" | "gemini";
}

interface ChecklistItem {
  id: string;
  text: string;
  category: "positive" | "negative" | "boundary" | "nonfunctional";
  status: TestStatus;
  testCase?: TestCase;
}

interface TestCase {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected: string;
  priority: "P1" | "P2" | "P3";
  status: TestStatus;
  source?: string;
}

interface BugReport {
  id: string;
  title: string;
  environment: string;
  steps: string[];
  actual: string;
  expected: string;
  severity: Severity;
  priority: "P1" | "P2" | "P3";
  createdAt: string;
  testCaseRef?: string;
}


interface AppCtx {
  activeModule: Module;
  setActiveModule: (m: Module) => void;
  selectedTechnique: string | null;
  setSelectedTechnique: (t: string | null) => void;
  theme: Theme;
  toggleTheme: () => void;
  apiKeys: ApiKeys;
  setApiKeys: (k: ApiKeys) => void;
  checklists: ChecklistItem[];
  setChecklists: (items: ChecklistItem[]) => void;
  testCases: TestCase[];
  setTestCases: (tcs: TestCase[]) => void;
  bugReports: BugReport[];
  setBugReports: (brs: BugReport[]) => void;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  showApiModal: boolean;
  setShowApiModal: (v: boolean) => void;
  requirementsText: string;
  setRequirementsText: (t: string) => void;
  requirementsResult: string;
  setRequirementsResult: (t: string) => void;
}

// ══════════════════════════════════════════════════════
// CONTEXT
// ══════════════════════════════════════════════════════
const AppContext = createContext<AppCtx>({} as AppCtx);
const useApp = () => useContext(AppContext);


// ══════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════
const PRESETS = [
  { id: "input-form", name: "Форма ввода", icon: "📝", hint: "поля, валидация, обязательные поля" },
  { id: "auth", name: "Авторизация/Регистрация", icon: "🔐", hint: "логин, регистрация, восстановление пароля" },
  { id: "button-cta", name: "Кнопка/CTA", icon: "🖱️", hint: "состояния, hover, disabled, loading" },
  { id: "payment", name: "Оплата", icon: "💳", hint: "карта, CVV, 3DS, безопасность" },
  { id: "search-table", name: "Таблица/Поиск", icon: "🔍", hint: "фильтрация, сортировка, пагинация" },
  { id: "custom", name: "Своя фича", icon: "⚙️", hint: "опишите свою функциональность" },
];

const TEST_DATA = {
  boundary: ["a", "aa", "a".repeat(255), "a".repeat(256), "0", "-1", "2147483647", "2147483648", " ", "\t\n", "null", "NULL", "undefined", "NaN", "0.0001"],
  special: ["!@#$%^&*()_+", "\\n\\r\\t\\0", "' OR '1'='1", "'; DROP TABLE users;--", "admin'--", "SELECT * FROM users", "1=1", "\" OR \"\"=\"", "<>/?:;|\\"],
  xss: ["<script>alert('XSS')</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)", "<svg onload=alert(1)>", "';alert(1)//", "<iframe src=\"javascript:alert(1)\">", "%3Cscript%3Ealert(1)%3C/script%3E", "<body onload=alert(1)>"],
  emails: ["plainaddress", "@missinglocal.com", "email@", "email@.com", "email@domain..com", "email @domain.com", "..email@domain.com", "email@domain@domain.com", "тест@домен.рф"],
  dates: ["00/00/0000", "13/01/2024", "01/32/2024", "29/02/2023", "31/11/2024", "2024-13-01", "99/99/9999", "not-a-date", "2024-02-30", ""],
};

const STACKS: { id: AutoStack; label: string; lang: string; badge?: string }[] = [
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

const CATEGORIES = [...new Set(HANDBOOK.map((t) => t.category))];
const EXPORTABLE_STORAGE_KEYS = [
  "qa_navigator_checklists",
  "qa_navigator_testcases",
  "qa_navigator_bugreports",
  "qa_navigator_bookmarks",
  "qa_navigator_req_text",
  "qa_navigator_req_result",
] as const;

// ══════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════
const uid = () => crypto.randomUUID();

// ══════════════════════════════════════════════════════
// AI HOOK
// ══════════════════════════════════════════════════════
function enrichNetworkError(e: unknown, provider: string, url: string): Error {
  if (e instanceof TypeError && e.message.toLowerCase().includes("fetch")) {
    return new Error(
      `Сеть недоступна (${provider})\n` +
      `Возможные причины:\n` +
      `• Нет интернета или VPN блокирует запросы\n` +
      `• CORS: запрос заблокирован браузером (проверь Console → Network)\n` +
      `• Неверный URL эндпоинта: ${url}\n` +
      `Оригинальная ошибка: ${e.message}`
    );
  }
  return e instanceof Error ? e : new Error(String(e));
}

async function callAI(
  apiKeys: ApiKeys,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const activeKey = apiKeys[apiKeys.provider];
  if (!activeKey) {
    const providerName = apiKeys.provider === "gemini" ? "Gemini" : "OpenRouter";
    throw new Error(`API ключ ${providerName} не настроен. Перейдите в Настройки.`);
  }

  if (apiKeys.provider === "gemini" && apiKeys.gemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeys.gemini}`;
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
    };
    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (e) {
      throw enrichNetworkError(e, "Gemini", url);
    }
    if (!res.ok) {
      let detail = "";
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message ?? JSON.stringify(errBody);
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new Error(
        `Gemini ${res.status} (${res.statusText})` +
        (detail ? `\n${detail}` : "")
      );
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason ?? "unknown";
      throw new Error(`Gemini вернул пустой ответ · finishReason: ${reason}\n` + JSON.stringify(data).slice(0, 300));
    }
    return text;
  }

  const model = "mistralai/mistral-7b-instruct:free";
  const orUrl = "https://openrouter.ai/api/v1/chat/completions";
  let res: Response;
  try {
    res = await fetch(orUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeys.openrouter}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "QA Navigator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });
  } catch (e) {
    throw enrichNetworkError(e, "OpenRouter", orUrl);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message ?? errBody?.message ?? JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      `OpenRouter ${res.status} (${res.statusText}) · модель: ${model}` +
      (detail ? `\n${detail}` : "")
    );
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(
      `OpenRouter вернул пустой ответ · модель: ${model}\n` +
      `finish_reason: ${data.choices?.[0]?.finish_reason ?? "unknown"}\n` +
      JSON.stringify(data).slice(0, 300)
    );
  }
  return content;
}

const QA_SYSTEM_PROMPT = `Ты — Senior QA Engineer, эксперт по методологиям тестирования 2026 года.
Строго следуй:
- ISTQB CTFL v4.0: семь принципов тестирования, STLC-фазы
- ISO 25010: качество ПО (функциональность, производительность, безопасность, удобство, надёжность, переносимость)
- ISO/IEC/IEEE 29119: структура тест-кейсов
- OWASP Top 10 2021: веб-уязвимости
Отвечай на русском языке. Используй чёткие action-глаголы в шагах ("Нажать", "Ввести", "Выбрать", "Проверить").
Ожидаемые результаты — конкретны и измеримы.`;

// ══════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ══════════════════════════════════════════════════════
function CopyButton({ text, label = "Копировать" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Скопировано!" : label}
    </button>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "positive" | "negative" | "boundary" | "nonfunctional" | "passed" | "failed" | "blocked" | "pending" | "beginner" | "intermediate" | "pro" }) {
  const cls: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    boundary: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    nonfunctional: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    blocked: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pending: "bg-muted text-muted-foreground",
    beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    intermediate: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[variant]}`}>
      {children}
    </span>
  );
}

function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 bg-foreground text-background text-xs rounded-lg px-2.5 py-2 z-50 shadow-xl pointer-events-none leading-relaxed">
          {tip}
        </span>
      )}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
      AI генерирует...
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-muted-foreground/40 w-12 h-12">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>
    </div>
  );
}

function CodeBlock({ code, lang = "text" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
        <span className="text-xs text-muted-foreground font-mono">{lang}</span>
        <CopyButton text={code} label="Копировать" />
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

// Simple markdown-ish renderer
function MarkdownView({ content }: { content: string }) {
  // AI responses and imported handbook content are untrusted. Escape them before
  // adding the small, controlled set of markup supported by this renderer.
  const escapedContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const html = escapedContent
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1.5 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/gm, '<pre class="bg-muted border border-border rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap">$2</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-3 my-2 text-sm text-muted-foreground italic">$1</blockquote>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split("|").filter(Boolean).map(c => c.trim());
      return `<tr>${cells.map(c => `<td class="border border-border px-2 py-1 text-sm">${c}</td>`).join("")}</tr>`;
    })
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm mb-0.5">$2</li>')
    .replace(/^[•\-] (.+)$/gm, '<li class="ml-4 list-disc text-sm mb-0.5">$1</li>')
    .replace(/^✅ (.+)$/gm, '<li class="ml-4 text-sm mb-0.5 text-emerald-600 dark:text-emerald-400 list-none">✅ $1</li>')
    .replace(/^❌ (.+)$/gm, '<li class="ml-4 text-sm mb-0.5 text-red-600 dark:text-red-400 list-none">❌ $1</li>')
    .replace(/^⚠️ (.+)$/gm, '<li class="ml-4 text-sm mb-0.5 text-amber-600 dark:text-amber-400 list-none">⚠️ $1</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="prose prose-sm max-w-none text-foreground leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ══════════════════════════════════════════════════════
// API SETTINGS MODAL
// ══════════════════════════════════════════════════════
function ApiModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { apiKeys, setApiKeys } = useApp();
  const [keys, setKeys] = useState(apiKeys);
  const [showKeys, setShowKeys] = useState({ or: false, gem: false });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Настройка API ключей</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-foreground">
            <p className="font-medium mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-primary" /> Как получить ключи бесплатно за 2 минуты:</p>
            <ol className="space-y-1 text-muted-foreground ml-4 list-decimal">
              <li><strong>OpenRouter:</strong> openrouter.ai → Sign Up → Keys → Create Key</li>
              <li><strong>Gemini:</strong> aistudio.google.com → Get API key → Create API key</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">AI Провайдер</label>
            <div className="flex gap-2">
              {(["openrouter", "gemini"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setKeys({ ...keys, provider: p })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    keys.provider === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "openrouter" ? "OpenRouter (free)" : "Google Gemini"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">OpenRouter API Key</label>
            <div className="relative">
              <input
                type={showKeys.or ? "text" : "password"}
                placeholder="sk-or-v1-..."
                value={keys.openrouter}
                onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                onClick={() => setShowKeys((s) => ({ ...s, or: !s.or }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.or ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={showKeys.gem ? "text" : "password"}
                placeholder="AIza..."
                value={keys.gemini}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                onClick={() => setShowKeys((s) => ({ ...s, gem: !s.gem }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.gem ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setApiKeys(keys); onClose(); }}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Сохранить ключи
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 1: REQUIREMENTS ANALYSIS
// ══════════════════════════════════════════════════════
function RequirementsModule() {
  const { apiKeys, requirementsText, setRequirementsText, requirementsResult, setRequirementsResult } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!requirementsText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await callAI(
        apiKeys,
        QA_SYSTEM_PROMPT,
        `Проанализируй следующие требования к функциональности, используя методологию ISTQB CTFL v4.0, ISO 25010 и Risk-Based Testing.

Требования:
${requirementsText}

Выдай структурированный анализ:

## 🔍 Выявленные неопределённости
(список конкретных пунктов, где требования неясны или неполны)

## 🕳️ Логические пробелы и противоречия
(места где требования противоречат друг другу или содержат логические дыры)

## ⚠️ Граничные случаи и риски
(потенциальные edge-cases и бизнес-риски по шкале Высокий/Средний/Низкий)

## 🛡️ Рекомендации по стратегии тестирования (Risk-Based)
(приоритеты и подходы к тестированию на основе рисков)

## ❓ Вопросы команде разработки
(конкретные вопросы, которые нужно задать до начала разработки)`
      );
      setRequirementsResult(result);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🧠 Анализ требований</h2>
        <p className="text-sm text-muted-foreground">Вставьте описание задачи из Jira или любой другой системы. AI выявит неопределённости, логические пробелы и риски.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Требования / User Story</label>
            <button onClick={() => setRequirementsText("")} className="text-xs text-muted-foreground hover:text-foreground">Очистить</button>
          </div>
          <textarea
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            placeholder="Вставьте текст требований, User Story или описание задачи из Jira...

Например:
As a user, I want to be able to register using my email and password so that I can access the application.
Acceptance Criteria:
- Email должен быть уникальным
- Пароль должен содержать минимум 8 символов"
            className="w-full h-64 bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none font-mono leading-relaxed"
          />
          <button
            onClick={analyze}
            disabled={loading || !requirementsText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Анализирую...</> : <><Brain className="w-4 h-4" /> Анализировать требования</>}
          </button>
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">{error.split("\n")[0]}</div>
                {error.includes("\n") && (
                  <pre className="mt-1 text-xs opacity-80 whitespace-pre-wrap break-all font-mono">{error.split("\n").slice(1).join("\n")}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Результат анализа</label>
            {requirementsResult && <CopyButton text={requirementsResult} label="Скопировать для Jira" />}
          </div>
          <div className="bg-card border border-border rounded-xl p-4 h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : requirementsResult ? (
              <MarkdownView content={requirementsResult} />
            ) : (
              <EmptyState icon={<Brain />} title="Ожидание анализа" desc="Вставьте требования и нажмите Анализировать" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PAIRWISE ALGORITHM (IPOG)
// ══════════════════════════════════════════════════════
function ipogPairwise(params: { name: string; values: string[] }[]): Record<string, string>[] {
  const n = params.length;
  if (n < 2) return [];

  type Row = (number | null)[];
  const tests: Row[] = [];

  // Init: all combos of first two params
  for (let v0 = 0; v0 < params[0].values.length; v0++) {
    for (let v1 = 0; v1 < params[1].values.length; v1++) {
      const row: Row = new Array(n).fill(null);
      row[0] = v0; row[1] = v1;
      tests.push(row);
    }
  }

  for (let pi = 2; pi < n; pi++) {
    const piLen = params[pi].values.length;
    // uncovered[pj|vj] = Set of vi-indices not yet covered with (pj,vj)
    const uncovered = new Map<string, Set<number>>();
    for (let pj = 0; pj < pi; pj++) {
      for (let vj = 0; vj < params[pj].values.length; vj++) {
        const s = new Set<number>();
        for (let vi = 0; vi < piLen; vi++) s.add(vi);
        uncovered.set(`${pj}|${vj}`, s);
      }
    }

    // Step 1: extend existing rows
    for (const test of tests) {
      let bestVi = 0, bestScore = -1;
      for (let vi = 0; vi < piLen; vi++) {
        let score = 0;
        for (let pj = 0; pj < pi; pj++) {
          if (test[pj] !== null && uncovered.get(`${pj}|${test[pj]}`)?.has(vi)) score++;
        }
        if (score > bestScore) { bestScore = score; bestVi = vi; }
      }
      test[pi] = bestVi;
      for (let pj = 0; pj < pi; pj++) {
        if (test[pj] !== null) uncovered.get(`${pj}|${test[pj]}`)?.delete(bestVi);
      }
    }

    // Step 2: new rows for remaining uncovered pairs
    for (let pj = 0; pj < pi; pj++) {
      for (let vj = 0; vj < params[pj].values.length; vj++) {
        const s = uncovered.get(`${pj}|${vj}`);
        if (!s || s.size === 0) continue;
        for (const vi of [...s]) {
          if (!uncovered.get(`${pj}|${vj}`)?.has(vi)) continue;
          const newRow: Row = new Array(n).fill(null);
          newRow[pj] = vj; newRow[pi] = vi;
          for (let pk = 0; pk < pi; pk++) {
            if (pk === pj) continue;
            let bestVk = 0, bestSc = -1;
            for (let vk = 0; vk < params[pk].values.length; vk++) {
              let sc = uncovered.get(`${pk}|${vk}`)?.has(vi) ? 1 : 0;
              if (sc > bestSc) { bestSc = sc; bestVk = vk; }
            }
            newRow[pk] = bestVk;
          }
          for (let pj2 = 0; pj2 < pi; pj2++) {
            if (newRow[pj2] !== null) uncovered.get(`${pj2}|${newRow[pj2]}`)?.delete(vi);
          }
          tests.push(newRow);
        }
      }
    }
  }

  return tests.map(row => {
    const obj: Record<string, string> = {};
    for (let p = 0; p < n; p++) obj[params[p].name] = params[p].values[row[p] ?? 0];
    return obj;
  });
}

// ══════════════════════════════════════════════════════
// PAIRWISE TAB
// ══════════════════════════════════════════════════════
type PwParam = { id: string; name: string; valuesRaw: string };

const VALUE_COLORS = [
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
];

function PairwiseTab() {
  const [params, setParams] = useState<PwParam[]>([
    { id: uid(), name: "Операционная система", valuesRaw: "Windows, macOS, Linux" },
    { id: uid(), name: "Браузер", valuesRaw: "Chrome, Firefox, Edge, Safari" },
    { id: uid(), name: "Разрешение экрана", valuesRaw: "1920×1080, 1366×768, 375×812" },
    { id: uid(), name: "Тип пользователя", valuesRaw: "Гость, Авторизованный, Администратор" },
  ]);
  const [result, setResult] = useState<Record<string, string>[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const parsedParams = useMemo(() =>
    params
      .map((p, i) => ({
        name: p.name.trim() || `Параметр ${i + 1}`,
        values: p.valuesRaw.split(",").map(v => v.trim()).filter(v => v.length > 0),
      }))
      .filter(p => p.values.length >= 1),
    [params]
  );

  const totalCombinations = useMemo(
    () => parsedParams.reduce((acc, p) => acc * p.values.length, 1),
    [parsedParams]
  );

  const colorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const p of parsedParams) {
      for (const v of p.values) {
        const k = `${p.name}:::${v}`;
        if (!map.has(k)) { map.set(k, idx % VALUE_COLORS.length); idx++; }
      }
    }
    return map;
  }, [parsedParams]);

  const generate = () => {
    setError("");
    if (parsedParams.length < 2) { setError("Нужно минимум 2 параметра с хотя бы 1 значением каждый."); return; }
    const emptyVal = parsedParams.find(p => p.values.length === 0);
    if (emptyVal) { setError(`Параметр «${emptyVal.name}» не имеет значений.`); return; }
    try {
      setResult(ipogPairwise(parsedParams));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addParam = () => setParams(p => [...p, { id: uid(), name: "", valuesRaw: "" }]);
  const removeParam = (id: string) => {
    if (params.length <= 2) return;
    setParams(p => p.filter(x => x.id !== id));
    setResult(null);
  };
  const updateParam = (id: string, field: keyof PwParam, value: string) => {
    setParams(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
    setResult(null);
  };

  const copyCSV = () => {
    if (!result) return;
    const header = parsedParams.map(p => `"${p.name}"`).join(",");
    const rows = result.map((tc, i) =>
      [`"${i + 1}"`, ...parsedParams.map(p => `"${tc[p.name]}"`)].join(",")
    );
    navigator.clipboard.writeText(["#," + header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reduction = result && totalCombinations > result.length
    ? Math.round((1 - result.length / totalCombinations) * 100)
    : 0;

  const totalPairs = useMemo(() => {
    let cnt = 0;
    for (let i = 0; i < parsedParams.length; i++)
      for (let j = i + 1; j < parsedParams.length; j++)
        cnt += parsedParams[i].values.length * parsedParams[j].values.length;
    return cnt;
  }, [parsedParams]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Попарное тестирование (Pairwise / All-Pairs)</span> — техника, при которой каждое значение каждого параметра встречается в паре с каждым значением каждого другого параметра хотя бы в одном тест-кейсе. Это позволяет охватить большинство дефектов (проявляются при взаимодействии 2 параметров), сократив количество тестов в {totalCombinations > 1 ? <><b className="text-foreground">{totalCombinations}x</b> раз</> : "несколько раз"}.
      </div>

      {/* Parameters input */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">Параметры и значения</span>
            <span className="ml-2 text-xs text-muted-foreground">Значения — через запятую</span>
          </div>
          <button
            onClick={addParam}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>

        <div className="space-y-2">
          {params.map((p, idx) => (
            <div key={p.id} className="flex gap-2 items-center">
              <span className="w-5 text-center text-xs text-muted-foreground font-mono shrink-0">{idx + 1}</span>
              <input
                value={p.name}
                onChange={e => updateParam(p.id, "name", e.target.value)}
                placeholder="Параметр"
                className="w-44 shrink-0 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                value={p.valuesRaw}
                onChange={e => updateParam(p.id, "valuesRaw", e.target.value)}
                placeholder="Значение 1, Значение 2, Значение 3"
                className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <div className="shrink-0 flex gap-1">
                {p.valuesRaw && (
                  <span className="text-xs text-muted-foreground tabular-nums py-1.5 px-2 bg-muted rounded-lg">
                    {p.valuesRaw.split(",").filter(v => v.trim()).length}
                  </span>
                )}
                <button
                  onClick={() => removeParam(p.id)}
                  disabled={params.length <= 2}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-25 rounded-lg hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <div className="text-xs text-muted-foreground space-x-3">
            <span>Параметров: <b className="text-foreground">{parsedParams.length}</b></span>
            <span>Полных комбинаций: <b className="text-foreground font-mono">{totalCombinations}</b></span>
            <span>Уникальных пар: <b className="text-foreground font-mono">{totalPairs}</b></span>
          </div>
          <div className="flex-1" />
          <button
            onClick={generate}
            disabled={parsedParams.length < 2}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Сгенерировать
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-primary tabular-nums">{result.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pairwise тест-кейсов</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-foreground tabular-nums">{totalCombinations}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Полных комбинаций</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {reduction > 0 ? `−${reduction}%` : "≈"}
              </div>
              <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Сокращение</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
              <span className="text-xs font-medium text-foreground">Таблица тест-кейсов ({result.length} строк)</span>
              <button
                onClick={copyCSV}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
              >
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Скопировано!</>
                  : <><Download className="w-3.5 h-3.5" /> Экспорт CSV</>}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10 tabular-nums">#</th>
                    {parsedParams.map(p => (
                      <th key={p.name} className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                        {p.name}
                        <span className="ml-1 font-normal text-muted-foreground">({p.values.length})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.map((tc, idx) => (
                    <tr key={idx} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono tabular-nums">{idx + 1}</td>
                      {parsedParams.map(p => {
                        const val = tc[p.name];
                        const cls = VALUE_COLORS[colorMap.get(`${p.name}:::${val}`) ?? 0];
                        return (
                          <td key={p.name} className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation */}
          <div className="flex gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <b className="text-foreground">Покрытие гарантировано:</b> каждая возможная пара значений любых двух параметров встречается хотя бы в одной строке таблицы. Алгоритм: <b className="text-foreground">IPOG</b> (In-Parameter-Order General). Всего уникальных пар: <b className="text-foreground">{totalPairs}</b>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl h-36 flex items-center justify-center">
          <EmptyState icon={<Layers />} title="Тест-кейсы появятся здесь" desc="Заполните параметры и нажмите «Сгенерировать»" />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TECHNIQUE TABS: EP, BVA, Decision Table, State Transition
// ══════════════════════════════════════════════════════

// ── Equivalence Partitioning ──────────────────────────
type EPFieldType = "number" | "string" | "email" | "date" | "phone";

interface EPField {
  id: string;
  name: string;
  type: EPFieldType;
  required: boolean;
  min: string;
  max: string;
  minLen: string;
  maxLen: string;
}

interface EPClass {
  fieldName: string;
  classType: "valid" | "invalid";
  description: string;
  testValue: string;
  expected: string;
}

function generateEquivalenceClasses(fields: EPField[]): EPClass[] {
  const classes: EPClass[] = [];
  for (const field of fields) {
    const fn = field.name.trim() || "Поле";
    switch (field.type) {
      case "number": {
        const minVal = field.min !== "" ? parseFloat(field.min) : null;
        const maxVal = field.max !== "" ? parseFloat(field.max) : null;
        if (minVal !== null && maxVal !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Число в диапазоне [${minVal}, ${maxVal}]`, testValue: String(Math.round((minVal + maxVal) / 2)), expected: "Значение принято" });
        } else if (minVal !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Число ≥ ${minVal}`, testValue: String(minVal + 5), expected: "Значение принято" });
        } else if (maxVal !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Число ≤ ${maxVal}`, testValue: String(maxVal - 5), expected: "Значение принято" });
        } else {
          classes.push({ fieldName: fn, classType: "valid", description: "Любое целое число", testValue: "42", expected: "Значение принято" });
        }
        if (minVal !== null) classes.push({ fieldName: fn, classType: "invalid", description: `Ниже минимума (< ${minVal})`, testValue: String(minVal - 1), expected: "Ошибка валидации" });
        if (maxVal !== null) classes.push({ fieldName: fn, classType: "invalid", description: `Выше максимума (> ${maxVal})`, testValue: String(maxVal + 1), expected: "Ошибка валидации" });
        classes.push({ fieldName: fn, classType: "invalid", description: "Текст вместо числа", testValue: "abc", expected: "Ошибка формата" });
        classes.push({ fieldName: fn, classType: "invalid", description: "Специальные символы", testValue: "!@#", expected: "Ошибка формата" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое обязательное поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "string": {
        const minL = field.minLen !== "" ? parseInt(field.minLen) : null;
        const maxL = field.maxLen !== "" ? parseInt(field.maxLen) : null;
        if (minL !== null && maxL !== null) {
          classes.push({ fieldName: fn, classType: "valid", description: `Строка ${minL}–${maxL} символов`, testValue: "a".repeat(Math.round((minL + maxL) / 2)), expected: "Значение принято" });
          if (minL > 1) classes.push({ fieldName: fn, classType: "invalid", description: `Слишком коротко (< ${minL} симв.)`, testValue: "a".repeat(Math.max(0, minL - 1)), expected: "Слишком коротко" });
          classes.push({ fieldName: fn, classType: "invalid", description: `Слишком длинно (> ${maxL} симв.)`, testValue: "a".repeat(maxL + 1), expected: "Слишком длинно" });
        } else {
          classes.push({ fieldName: fn, classType: "valid", description: "Обычная строка", testValue: "Тест Тестовый", expected: "Значение принято" });
        }
        classes.push({ fieldName: fn, classType: "invalid", description: "Только пробелы", testValue: "     ", expected: "Ошибка валидации" });
        classes.push({ fieldName: fn, classType: "invalid", description: "XSS-инъекция", testValue: "<script>alert(1)</script>", expected: "Экранирование/ошибка" });
        classes.push({ fieldName: fn, classType: "invalid", description: "SQL-инъекция", testValue: "' OR '1'='1", expected: "Экранирование/ошибка" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое обязательное поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "email": {
        classes.push({ fieldName: fn, classType: "valid", description: "Корректный email", testValue: "user@example.com", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "С субдоменом", testValue: "user@sub.example.com", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "С тегом (+)", testValue: "user+tag@example.com", expected: "Принято" });
        const badEmails: [string, string][] = [
          ["userexample.com", "Без @"], ["@example.com", "Нет локальной части"],
          ["user@", "Нет домена"], ["user @example.com", "Пробел в адресе"],
          ["user@example..com", "Двойная точка"], [".user@example.com", "Начало с точки"],
        ];
        for (const [val, desc] of badEmails) classes.push({ fieldName: fn, classType: "invalid", description: desc, testValue: val, expected: "Неверный формат" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "date": {
        classes.push({ fieldName: fn, classType: "valid", description: "Обычная дата", testValue: "15.06.2025", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "29 февраля (високосный год)", testValue: "29.02.2024", expected: "Принято" });
        const badDates: [string, string][] = [
          ["29.02.2025", "29 фев в невисокосный год"], ["31.04.2025", "31 апреля"],
          ["00.01.2025", "День 00"], ["15.13.2025", "Месяц 13"],
          ["abc", "Нечисловое"], ["2025.06.15", "Неверный формат (год первый)"],
        ];
        for (const [val, desc] of badDates) classes.push({ fieldName: fn, classType: "invalid", description: desc, testValue: val, expected: "Неверная дата" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
      case "phone": {
        classes.push({ fieldName: fn, classType: "valid", description: "+7 мобильный", testValue: "+7 (999) 123-45-67", expected: "Принято" });
        classes.push({ fieldName: fn, classType: "valid", description: "8-800 бесплатный", testValue: "8 800 555-35-35", expected: "Принято" });
        const badPhones: [string, string][] = [
          ["123", "Слишком короткий"], ["12345678901234", "Слишком длинный"],
          ["abc-def-ghij", "Буквы"], ["+7 (999) 12-34", "Неполный"],
        ];
        for (const [val, desc] of badPhones) classes.push({ fieldName: fn, classType: "invalid", description: desc, testValue: val, expected: "Неверный формат" });
        if (field.required) classes.push({ fieldName: fn, classType: "invalid", description: "Пустое поле", testValue: "(пусто)", expected: "Поле обязательно" });
        break;
      }
    }
  }
  return classes;
}

function EPTab() {
  const [fields, setFields] = useState<EPField[]>([
    { id: uid(), name: "Email", type: "email", required: true, min: "", max: "", minLen: "", maxLen: "" },
    { id: uid(), name: "Возраст", type: "number", required: true, min: "18", max: "120", minLen: "", maxLen: "" },
  ]);
  const [result, setResult] = useState<EPClass[] | null>(null);

  const addField = () => setFields(f => [...f, { id: uid(), name: "", type: "string" as EPFieldType, required: true, min: "", max: "", minLen: "", maxLen: "" }]);
  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));
  const updateField = (id: string, changes: Partial<EPField>) => setFields(f => f.map(x => x.id === id ? { ...x, ...changes } : x));
  const generate = () => setResult(generateEquivalenceClasses(fields.filter(f => f.name.trim())));

  const validCount = result?.filter(c => c.classType === "valid").length ?? 0;
  const invalidCount = result?.filter(c => c.classType === "invalid").length ?? 0;

  const typeLabels: Record<EPFieldType, string> = { number: "Число", string: "Строка", email: "Email", date: "Дата", phone: "Телефон" };

  const csvText = result
    ? ["Поле,Класс,Описание,Значение,Ожидаемый результат",
        ...result.map(c => `"${c.fieldName}","${c.classType === "valid" ? "Валидный" : "Невалидный"}","${c.description}","${c.testValue}","${c.expected}"`)
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">🎯 Классы эквивалентности (Equivalence Partitioning)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Разбивает входные данные на <span className="text-foreground font-medium">группы (классы)</span>, внутри которых система ведёт себя одинаково.
          Достаточно одного значения из каждого класса — это сокращает число тестов без потери покрытия.
          Применяется к полям с типами данных, форматами, диапазонами.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Валидный класс</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> Невалидный класс</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Поля для анализа</span>
          <button onClick={addField} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Добавить поле
          </button>
        </div>
        <div className="divide-y divide-border">
          {fields.map((field) => (
            <div key={field.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <input
                value={field.name}
                onChange={e => updateField(field.id, { name: e.target.value })}
                placeholder="Название поля"
                className="flex-1 min-w-[130px] bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <select
                value={field.type}
                onChange={e => updateField(field.id, { type: e.target.value as EPFieldType, min: "", max: "", minLen: "", maxLen: "" })}
                className="bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
              >
                {(Object.entries(typeLabels) as [EPFieldType, string][]).map(([t, label]) => (
                  <option key={t} value={t}>{label}</option>
                ))}
              </select>
              {field.type === "number" && (
                <div className="flex items-center gap-1.5">
                  <input value={field.min} onChange={e => updateField(field.id, { min: e.target.value })} placeholder="Мин" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input value={field.max} onChange={e => updateField(field.id, { max: e.target.value })} placeholder="Макс" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                </div>
              )}
              {field.type === "string" && (
                <div className="flex items-center gap-1.5">
                  <input value={field.minLen} onChange={e => updateField(field.id, { minLen: e.target.value })} placeholder="Мин.дл" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input value={field.maxLen} onChange={e => updateField(field.id, { maxLen: e.target.value })} placeholder="Макс.дл" className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                </div>
              )}
              {!["number", "string"].includes(field.type) && <div className="w-px" />}
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="rounded accent-primary" />
                Обяз.
              </label>
              <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={generate}
            disabled={fields.filter(f => f.name.trim()).length === 0}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Сгенерировать классы эквивалентности
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Результат</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{validCount} валидных</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{invalidCount} невалидных</span>
            </div>
            <CopyButton text={csvText} label="CSV" />
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Поле</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Класс</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Описание</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Тестовое значение</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ожидаемый результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.map((cls, i) => (
                    <tr key={i} className={cls.classType === "valid" ? "bg-emerald-50/40 dark:bg-emerald-900/10" : "bg-rose-50/40 dark:bg-rose-900/10"}>
                      <td className="px-3 py-2 font-medium text-foreground">{cls.fieldName}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls.classType === "valid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}>
                          {cls.classType === "valid" ? "✓ Валидный" : "✗ Невалидный"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{cls.description}</td>
                      <td className="px-3 py-2 font-mono text-foreground">{cls.testValue}</td>
                      <td className="px-3 py-2 text-muted-foreground">{cls.expected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Boundary Value Analysis ───────────────────────────
interface BVAField {
  id: string;
  name: string;
  min: string;
  max: string;
  step: string;
  required: boolean;
  isInteger: boolean;
}

interface BVAPoint {
  label: string;
  value: string;
  type: "valid" | "invalid";
  expected: string;
}

function generateBVA(field: BVAField): BVAPoint[] {
  const min = parseFloat(field.min);
  const max = parseFloat(field.max);
  const step = parseFloat(field.step) || 1;
  if (isNaN(min) || isNaN(max) || min >= max) return [];

  const fmt = (n: number) => {
    if (field.isInteger) return String(Math.round(n));
    const dec = step.toString().includes(".") ? step.toString().split(".")[1].length : 0;
    return n.toFixed(dec);
  };

  const pts: BVAPoint[] = [];
  pts.push({ label: "min − 1 (ниже минимума)", value: fmt(min - step), type: "invalid", expected: "Отклонить / ошибка валидации" });
  pts.push({ label: "min (минимально допустимое)", value: fmt(min), type: "valid", expected: "Принять значение" });
  if (min + step < max) pts.push({ label: "min + 1 (чуть выше минимума)", value: fmt(min + step), type: "valid", expected: "Принять значение" });
  const mid = (min + max) / 2;
  if (Math.abs(mid - min) > step && Math.abs(mid - max) > step)
    pts.push({ label: "среднее (номинальное)", value: fmt(mid), type: "valid", expected: "Принять значение" });
  if (max - step > min) pts.push({ label: "max − 1 (чуть ниже максимума)", value: fmt(max - step), type: "valid", expected: "Принять значение" });
  pts.push({ label: "max (максимально допустимое)", value: fmt(max), type: "valid", expected: "Принять значение" });
  pts.push({ label: "max + 1 (выше максимума)", value: fmt(max + step), type: "invalid", expected: "Отклонить / ошибка валидации" });
  pts.push({ label: "нечисловое значение", value: "abc", type: "invalid", expected: "Ошибка формата" });
  if (field.required) pts.push({ label: "пустое поле (обязательное)", value: "(пусто)", type: "invalid", expected: "Поле обязательно" });
  return pts;
}

function BVATab() {
  const [fields, setFields] = useState<BVAField[]>([
    { id: uid(), name: "Возраст пользователя", min: "18", max: "100", step: "1", required: true, isInteger: true },
    { id: uid(), name: "Сумма перевода (руб.)", min: "10", max: "50000", step: "0.01", required: true, isInteger: false },
  ]);
  const [result, setResult] = useState<Record<string, BVAPoint[]> | null>(null);

  const addField = () => setFields(f => [...f, { id: uid(), name: "", min: "", max: "", step: "1", required: true, isInteger: true }]);
  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));
  const updateField = (id: string, changes: Partial<BVAField>) => setFields(f => f.map(x => x.id === id ? { ...x, ...changes } : x));

  const generate = () => {
    const res: Record<string, BVAPoint[]> = {};
    for (const field of fields) {
      if (!field.name.trim() || !field.min || !field.max) continue;
      const pts = generateBVA(field);
      if (pts.length) res[field.id + "|" + field.name] = pts;
    }
    setResult(res);
  };

  const allEntries = result ? Object.entries(result) : [];
  const totalCount = allEntries.reduce((s, [, pts]) => s + pts.length, 0);

  const csvText = allEntries.length
    ? ["Поле,Граничная точка,Значение,Тип,Ожидаемый результат",
        ...allEntries.flatMap(([key, pts]) => {
          const name = key.split("|").slice(1).join("|");
          return pts.map(p => `"${name}","${p.label}","${p.value}","${p.type === "valid" ? "Валидный" : "Невалидный"}","${p.expected}"`);
        })
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">📏 Граничные значения (Boundary Value Analysis)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Дополняет классы эквивалентности: большинство ошибок концентрируется <span className="text-foreground font-medium">на границах диапазонов</span>.
          Генерирует до 7 точек для каждой границы: <span className="text-foreground font-medium">min−1, min, min+1, ном., max−1, max, max+1</span>.
          Применяется к числам, датам, длинам строк.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Валидная точка</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> Невалидная точка</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Поля с диапазонами</span>
          <button onClick={addField} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Добавить поле
          </button>
        </div>
        <div className="divide-y divide-border">
          {fields.map(field => (
            <div key={field.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <input
                value={field.name}
                onChange={e => updateField(field.id, { name: e.target.value })}
                placeholder="Название поля"
                className="flex-1 min-w-[140px] bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Мин:</span>
                <input value={field.min} onChange={e => updateField(field.id, { min: e.target.value })} className="w-20 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                <span className="text-xs text-muted-foreground">Макс:</span>
                <input value={field.max} onChange={e => updateField(field.id, { max: e.target.value })} className="w-20 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                <span className="text-xs text-muted-foreground">Шаг:</span>
                <input value={field.step} onChange={e => updateField(field.id, { step: e.target.value })} className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="rounded accent-primary" /> Обяз.
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={field.isInteger} onChange={e => updateField(field.id, { isInteger: e.target.checked })} className="rounded accent-primary" /> Целые
              </label>
              <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={generate}
            disabled={fields.filter(f => f.name.trim() && f.min && f.max).length === 0}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Сгенерировать граничные значения
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Результат</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">{totalCount} тест-кейсов</span>
            </div>
            <CopyButton text={csvText} label="CSV" />
          </div>
          {allEntries.length === 0 ? (
            <div className="bg-card border border-border rounded-xl h-20 flex items-center justify-center text-sm text-muted-foreground">Заполните мин. и макс. хотя бы одного поля</div>
          ) : (
            allEntries.map(([key, pts]) => {
              const fieldName = key.split("|").slice(1).join("|");
              return (
                <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-muted/50 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{fieldName}</span>
                    <span className="text-xs text-muted-foreground">{pts.length} точек</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">#</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Граничная точка</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Значение</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Тип</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ожидаемый результат</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pts.map((p, i) => (
                          <tr key={i} className={p.type === "valid" ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "bg-rose-50/30 dark:bg-rose-900/10"}>
                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-2 text-muted-foreground">{p.label}</td>
                            <td className="px-3 py-2 font-mono font-medium text-foreground">{p.value}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === "valid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}>
                                {p.type === "valid" ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{p.expected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Decision Table Tab ────────────────────────────────
interface DTCondition { id: string; name: string }
interface DTAction { id: string; name: string }

function DecisionTableTab() {
  const [conditions, setConditions] = useState<DTCondition[]>([
    { id: uid(), name: "Пользователь авторизован?" },
    { id: uid(), name: "Email подтверждён?" },
    { id: uid(), name: "Подписка активна?" },
  ]);
  const [actions, setActions] = useState<DTAction[]>([
    { id: uid(), name: "Показать контент" },
    { id: uid(), name: "Предложить подписку" },
    { id: uid(), name: "Показать страницу авторизации" },
  ]);
  const [actionMatrix, setActionMatrix] = useState<Record<string, boolean[]>>({});
  const [generated, setGenerated] = useState(false);

  const MAX_CONDITIONS = 4;
  const numCols = Math.pow(2, Math.min(conditions.length, MAX_CONDITIONS));

  const colValues = useMemo(() => {
    const n = Math.min(conditions.length, MAX_CONDITIONS);
    return Array.from({ length: numCols }, (_, col) =>
      Array.from({ length: n }, (__, ci) => {
        const period = Math.pow(2, n - 1 - ci);
        return Math.floor(col / period) % 2 === 0;
      })
    );
  }, [conditions.length, numCols]);

  const addCondition = () => {
    if (conditions.length >= MAX_CONDITIONS) return;
    setConditions(c => [...c, { id: uid(), name: "" }]);
    setGenerated(false);
    setActionMatrix({});
  };
  const removeCondition = (id: string) => { setConditions(c => c.filter(x => x.id !== id)); setGenerated(false); setActionMatrix({}); };
  const addAction = () => setActions(a => [...a, { id: uid(), name: "" }]);
  const removeAction = (id: string) => setActions(a => a.filter(x => x.id !== id));

  const generate = () => {
    const matrix: Record<string, boolean[]> = {};
    for (const action of actions) {
      const cur = actionMatrix[action.id] ?? [];
      matrix[action.id] = Array.from({ length: numCols }, (_, i) => cur[i] ?? false);
    }
    setActionMatrix(matrix);
    setGenerated(true);
  };

  const toggleAction = (actionId: string, col: number) => {
    setActionMatrix(prev => ({
      ...prev,
      [actionId]: (prev[actionId] ?? new Array(numCols).fill(false)).map((v: boolean, i: number) => i === col ? !v : v),
    }));
  };

  const tcText = colValues.map((colConds, ci) => {
    const cPart = conditions.slice(0, MAX_CONDITIONS).map((c, i) => `${c.name || "Условие " + (i + 1)}: ${colConds[i] ? "Да" : "Нет"}`).join("; ");
    const aPart = actions.filter(a => (actionMatrix[a.id] ?? [])[ci]).map(a => a.name || "Действие").join(", ") || "нет действий";
    return `ТК${ci + 1}: [${cPart}] → ${aPart}`;
  }).join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">📊 Таблицы решений (Decision Tables)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Систематически описывают логику с <span className="text-foreground font-medium">комбинациями условий</span> и соответствующими действиями.
          Инструмент генерирует все 2ⁿ комбинаций n условий (Да/Нет) — отметьте, какие действия срабатывают для каждой.
          Максимум {MAX_CONDITIONS} условия = {Math.pow(2, MAX_CONDITIONS)} тест-кейса.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Условия (C)</span>
            <button onClick={addCondition} disabled={conditions.length >= MAX_CONDITIONS} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-border">
            {conditions.map((cond, i) => (
              <div key={cond.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">C{i + 1}</span>
                <input
                  value={cond.name}
                  onChange={e => setConditions(prev => prev.map(c => c.id === cond.id ? { ...c, name: e.target.value } : c))}
                  placeholder={"Условие " + (i + 1)}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button onClick={() => removeCondition(cond.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Действия / результаты (A)</span>
            <button onClick={addAction} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-border">
            {actions.map((action, i) => (
              <div key={action.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">A{i + 1}</span>
                <input
                  value={action.name}
                  onChange={e => setActions(prev => prev.map(a => a.id === action.id ? { ...a, name: e.target.value } : a))}
                  placeholder={"Действие " + (i + 1)}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button onClick={() => removeAction(action.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={conditions.length === 0 || actions.length === 0}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Построить таблицу решений ({numCols} комбинаций)
      </button>

      {generated && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Таблица решений</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">Т = Да</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">Ф = Нет</span>
              <CopyButton text={tcText} label="Тест-кейсы" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[200px] sticky left-0 bg-muted/50 z-10">Условие / Действие</th>
                    {colValues.map((_, col) => (
                      <th key={col} className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[48px]">ТК{col + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {conditions.slice(0, MAX_CONDITIONS).map((cond, ci) => (
                    <tr key={cond.id} className="bg-sky-50/30 dark:bg-sky-900/10">
                      <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-sky-50/50 dark:bg-sky-900/20 z-10">
                        <span className="text-muted-foreground font-mono mr-2">C{ci + 1}</span>{cond.name || "Условие " + (ci + 1)}
                      </td>
                      {colValues.map((colConds, col) => (
                        <td key={col} className="text-center px-2 py-2">
                          <span className={`font-mono font-bold text-sm ${colConds[ci] ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                            {colConds[ci] ? "Т" : "Ф"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr><td colSpan={numCols + 1} className="px-3 py-1.5 bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider font-medium">Действия</td></tr>
                  {actions.map((action, ai) => (
                    <tr key={action.id}>
                      <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-card z-10">
                        <span className="text-muted-foreground font-mono mr-2">A{ai + 1}</span>{action.name || "Действие " + (ai + 1)}
                      </td>
                      {colValues.map((_, col) => {
                        const checked = (actionMatrix[action.id] ?? [])[col] ?? false;
                        return (
                          <td key={col} className="text-center px-2 py-2">
                            <button
                              onClick={() => toggleAction(action.id, col)}
                              className={`w-6 h-6 rounded transition-all flex items-center justify-center mx-auto ${checked ? "bg-primary text-primary-foreground" : "bg-muted text-transparent hover:bg-muted/70"}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Кликайте на клетки действий, чтобы отметить, что должно происходить при каждой комбинации условий.</p>
        </div>
      )}
    </div>
  );
}

// ── State Transition Tab ──────────────────────────────
interface STState { id: string; name: string; isInitial: boolean; isFinal: boolean }
interface STTransition { id: string; fromId: string; event: string; toId: string; expectedAction: string }
interface STTestCase { no: number; title: string; precondition: string; trigger: string; expected: string }

function generateSTTests(states: STState[], transitions: STTransition[]): STTestCase[] {
  return transitions.flatMap((t, idx) => {
    const from = states.find(s => s.id === t.fromId);
    const to = states.find(s => s.id === t.toId);
    if (!from || !to) return [];
    return [{
      no: idx + 1,
      title: from.name + " → " + to.name + ' (событие: "' + t.event + '")',
      precondition: 'Система в состоянии "' + from.name + '"',
      trigger: t.event,
      expected: 'Переход в "' + to.name + '"' + (t.expectedAction ? ". " + t.expectedAction : ""),
    }];
  });
}

function StateTransitionTab() {
  const [states, setStates] = useState<STState[]>([
    { id: uid(), name: "Корзина пуста", isInitial: true, isFinal: false },
    { id: uid(), name: "Товары в корзине", isInitial: false, isFinal: false },
    { id: uid(), name: "Оформление заказа", isInitial: false, isFinal: false },
    { id: uid(), name: "Заказ оформлен", isInitial: false, isFinal: true },
  ]);
  const [transitions, setTransitions] = useState<STTransition[]>([]);
  const [result, setResult] = useState<STTestCase[] | null>(null);
  const [newFrom, setNewFrom] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newAction, setNewAction] = useState("");

  const addState = () => setStates(s => [...s, { id: uid(), name: "", isInitial: false, isFinal: false }]);
  const removeState = (id: string) => { setStates(s => s.filter(x => x.id !== id)); setTransitions(t => t.filter(x => x.fromId !== id && x.toId !== id)); };
  const updateState = (id: string, changes: Partial<STState>) => setStates(s => s.map(x => x.id === id ? { ...x, ...changes } : x));

  const addTransition = () => {
    if (!newFrom || !newEvent.trim() || !newTo) return;
    setTransitions(t => [...t, { id: uid(), fromId: newFrom, event: newEvent.trim(), toId: newTo, expectedAction: newAction.trim() }]);
    setNewEvent(""); setNewAction("");
  };
  const removeTransition = (id: string) => setTransitions(t => t.filter(x => x.id !== id));

  const generate = () => setResult(generateSTTests(states, transitions));

  const namedStates = states.filter(s => s.name.trim());

  const diagram = namedStates.map(state => {
    const outs = transitions.filter(t => t.fromId === state.id);
    if (!outs.length) return "[" + state.name + "]";
    return outs.map(t => {
      const to = states.find(s => s.id === t.toId);
      return "[" + state.name + "] --" + t.event + "--> [" + (to?.name ?? "?") + "]";
    }).join("\n");
  }).join("\n");

  const csvText = result
    ? ["#,Переход,Предусловие,Событие,Ожидаемый результат",
        ...result.map(tc => tc.no + ',"' + tc.title + '","' + tc.precondition + '","' + tc.trigger + '","' + tc.expected + '"')
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm">🔄 Переходы состояний (State Transition Testing)</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Моделирует систему как <span className="text-foreground font-medium">конечный автомат</span> — набор состояний и переходов по событиям.
          Каждый переход превращается в тест-кейс. Минимальное покрытие: <span className="text-foreground font-medium">все переходы (0-switch)</span>.
          Полное: все пары переходов (1-switch).
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Начальное</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Финальное</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" /> Промежуточное</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* States panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Состояния</span>
            <button onClick={addState} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
          <div className="divide-y divide-border">
            {states.map((state, i) => (
              <div key={state.id} className="px-4 py-2.5 flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${state.isInitial ? "bg-sky-500" : state.isFinal ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                <input
                  value={state.name}
                  onChange={e => updateState(state.id, { name: e.target.value })}
                  placeholder={"Состояние " + (i + 1)}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0">
                  <input type="radio" name="st-initial" checked={state.isInitial} onChange={() => setStates(s => s.map(x => ({ ...x, isInitial: x.id === state.id })))} className="accent-sky-500" />
                  Нач.
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0">
                  <input type="checkbox" checked={state.isFinal} onChange={e => updateState(state.id, { isFinal: e.target.checked })} className="rounded accent-emerald-500" />
                  Фин.
                </label>
                <button onClick={() => removeState(state.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Transitions panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <span className="text-sm font-medium text-foreground">Переходы ({transitions.length})</span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {transitions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-muted-foreground text-center">Добавьте переходы ниже</div>
            ) : (
              transitions.map(t => {
                const from = states.find(s => s.id === t.fromId);
                const to = states.find(s => s.id === t.toId);
                return (
                  <div key={t.id} className="px-4 py-2 flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground truncate">{from?.name ?? "?"}</span>
                    <span className="text-muted-foreground shrink-0">→</span>
                    <span className="text-primary font-medium truncate">{t.event}</span>
                    <span className="text-muted-foreground shrink-0">→</span>
                    <span className="font-medium text-foreground truncate">{to?.name ?? "?"}</span>
                    <button onClick={() => removeTransition(t.id)} className="ml-auto shrink-0 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-3 py-3 border-t border-border bg-muted/20 space-y-2">
            <div className="flex gap-2">
              <select value={newFrom} onChange={e => setNewFrom(e.target.value)} className="flex-1 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                <option value="">Из...</option>
                {namedStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={newTo} onChange={e => setNewTo(e.target.value)} className="flex-1 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                <option value="">В...</option>
                {namedStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input value={newEvent} onChange={e => setNewEvent(e.target.value)} placeholder="Событие (напр., «Добавить товар»)" onKeyDown={e => e.key === "Enter" && addTransition()} className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input value={newAction} onChange={e => setNewAction(e.target.value)} placeholder="Доп. действие (опц.)" onKeyDown={e => e.key === "Enter" && addTransition()} className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <button onClick={addTransition} disabled={!newFrom || !newEvent.trim() || !newTo} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Plus className="w-3.5 h-3.5" /> Добавить переход
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={transitions.length === 0}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Сгенерировать тест-кейсы ({transitions.length} переходов)
      </button>

      {result && result.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Тест-кейсы</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">{result.length} тестов</span>
            </div>
            <CopyButton text={csvText} label="CSV" />
          </div>
          {diagram && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Диаграмма переходов</p>
              <pre className="text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap">{diagram}</pre>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Переход</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Предусловие</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Событие</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ожидаемый результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.map(tc => (
                    <tr key={tc.no} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground font-mono">{tc.no}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{tc.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{tc.precondition}</td>
                      <td className="px-3 py-2 font-medium text-primary">{tc.trigger}</td>
                      <td className="px-3 py-2 text-muted-foreground">{tc.expected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 2: TEST DESIGN
// ══════════════════════════════════════════════════════
type DesignTab = "ep" | "bva" | "decision" | "state" | "pairwise";

function TestDesignModule() {
  const [activeTab, setActiveTab] = useState<DesignTab>("ep");

  const designTabs: { id: DesignTab; label: string; icon: React.ReactNode; shortLabel: string }[] = [
    { id: "ep", label: "Классы экв-сти", shortLabel: "EP", icon: <Filter className="w-3.5 h-3.5" /> },
    { id: "bva", label: "Граничные знач.", shortLabel: "BVA", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "decision", label: "Таблицы решений", shortLabel: "Решения", icon: <Database className="w-3.5 h-3.5" /> },
    { id: "state", label: "Переходы состояний", shortLabel: "Состояния", icon: <RotateCcw className="w-3.5 h-3.5" /> },
    { id: "pairwise", label: "Pairwise", shortLabel: "Pairwise", icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">📝 Тест-дизайн</h2>
        <p className="text-sm text-muted-foreground">Техники тест-дизайна ISTQB с интерактивными инструментами.</p>
      </div>

      {/* Tab strip */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-max">
          {designTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "ep" && <EPTab />}
      {activeTab === "bva" && <BVATab />}
      {activeTab === "decision" && <DecisionTableTab />}
      {activeTab === "state" && <StateTransitionTab />}
      {activeTab === "pairwise" && <PairwiseTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 3: TEST EXECUTION
// ══════════════════════════════════════════════════════
function TestExecutionModule() {
  const { checklists, setChecklists, bugReports, setBugReports, apiKeys } = useApp();
  const [activeBugItem, setActiveBugItem] = useState<ChecklistItem | null>(null);
  const [generatingBug, setGeneratingBug] = useState(false);
  const [pendingBug, setPendingBug] = useState<Partial<BugReport> | null>(null);
  const [env, setEnv] = useState("Chrome 124, Windows 11, Staging");

  const setStatus = (id: string, status: TestStatus) => {
    setChecklists(checklists.map((c) => c.id === id ? { ...c, status } : c));
    if (status === "failed") {
      const item = checklists.find((c) => c.id === id);
      if (item) setActiveBugItem(item);
    }
  };

  const generateBugReport = async () => {
    if (!activeBugItem) return;
    setGeneratingBug(true);
    try {
      const result = await callAI(
        apiKeys,
        QA_SYSTEM_PROMPT,
        `Создай стандартный баг-репорт для следующего упавшего теста:
Тест: "${activeBugItem.text}"
Окружение: ${env}

Верни ТОЛЬКО JSON:
{
  "title": "заголовок бага по формуле [Где][Что][При каком условии]",
  "steps": ["шаг 1", "шаг 2", "шаг 3"],
  "actual": "фактический результат",
  "expected": "ожидаемый результат",
  "severity": "high",
  "priority": "P2"
}`
      );
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const data = JSON.parse(cleaned);
      setPendingBug({
        ...data,
        environment: env,
        testCaseRef: activeBugItem.id,
      });
    } catch {}
    setGeneratingBug(false);
  };

  const saveBug = () => {
    if (!pendingBug) return;
    const bug: BugReport = {
      id: uid(),
      title: pendingBug.title ?? "",
      environment: pendingBug.environment ?? env,
      steps: pendingBug.steps ?? [],
      actual: pendingBug.actual ?? "",
      expected: pendingBug.expected ?? "",
      severity: pendingBug.severity as Severity ?? "medium",
      priority: pendingBug.priority as "P1" | "P2" | "P3" ?? "P2",
      createdAt: new Date().toISOString(),
      testCaseRef: pendingBug.testCaseRef,
    };
    setBugReports([...bugReports, bug]);
    setPendingBug(null);
    setActiveBugItem(null);
  };

  const stats = {
    total: checklists.length,
    passed: checklists.filter((c) => c.status === "passed").length,
    failed: checklists.filter((c) => c.status === "failed").length,
    blocked: checklists.filter((c) => c.status === "blocked").length,
    pending: checklists.filter((c) => c.status === "pending").length,
  };

  const statusConfig: Record<TestStatus, { label: string; class: string; icon: React.ReactNode }> = {
    passed: { label: "Passed", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    failed: { label: "Failed", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", icon: <XCircle className="w-3.5 h-3.5" /> },
    blocked: { label: "Blocked", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: <AlertCircle className="w-3.5 h-3.5" /> },
    pending: { label: "Pending", class: "bg-muted text-muted-foreground border-border", icon: <Play className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🚀 Выполнение тестов</h2>
        <p className="text-sm text-muted-foreground">Выполняйте тесты и отмечайте статусы. При клике на Failed автоматически создастся баг-репорт.</p>
      </div>

      {checklists.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {([["total", "Всего", "text-foreground"], ["passed", "Passed", "text-emerald-600"], ["failed", "Failed", "text-red-500"], ["blocked", "Blocked", "text-amber-500"]] as const).map(([k, l, cls]) => (
            <div key={k} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{stats[k as keyof typeof stats]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      )}

      {checklists.length === 0 ? (
        <EmptyState icon={<Play />} title="Чек-лист пуст" desc="Сначала сгенерируйте чек-лист в модуле Тест-дизайн" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Окружение:</label>
              <input
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {checklists.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Badge variant={item.category as any} />
                <span className="flex-1 text-sm text-foreground">{item.text}</span>
                <div className="flex items-center gap-1.5">
                  {(["passed", "failed", "blocked"] as TestStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(item.id, s)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                        item.status === s ? statusConfig[s].class : "bg-muted text-muted-foreground border-border hover:opacity-80"
                      }`}
                    >
                      {item.status === s && statusConfig[s].icon}
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bug report section */}
      {bugReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-500" /> Баг-репорты ({bugReports.length})
          </h3>
          <div className="space-y-2">
            {bugReports.map((bug) => (
              <div key={bug.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{bug.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={bug.severity === "critical" || bug.severity === "high" ? "failed" : bug.severity === "medium" ? "boundary" : "default"}>
                        {bug.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="default">{bug.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(bug.createdAt).toLocaleDateString("ru")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton
                      text={`**${bug.title}**\n\nОкружение: ${bug.environment}\n\nШаги воспроизведения:\n${bug.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nФактический результат: ${bug.actual}\nОжидаемый результат: ${bug.expected}\n\nSeverity: ${bug.severity}\nPriority: ${bug.priority}`}
                      label="Jira/YouTrack"
                    />
                    <button onClick={() => setBugReports(bugReports.filter((b) => b.id !== bug.id))} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto bug modal */}
      {activeBugItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setActiveBugItem(null); setPendingBug(null); }} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-foreground">Создать баг-репорт</h3>
              </div>
              <button onClick={() => { setActiveBugItem(null); setPendingBug(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                <span className="font-medium">Упавший тест:</span> {activeBugItem.text}
              </div>

              {!pendingBug ? (
                <button
                  onClick={generateBugReport}
                  disabled={generatingBug}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generatingBug ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><Brain className="w-4 h-4" /> AI: Сгенерировать баг-репорт</>}
                </button>
              ) : (
                <div className="space-y-3">
                  {[
                    ["Заголовок", "title"],
                    ["Фактический результат", "actual"],
                    ["Ожидаемый результат", "expected"],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                      <textarea
                        value={(pendingBug as any)[key] ?? ""}
                        onChange={(e) => setPendingBug({ ...pendingBug, [key]: e.target.value })}
                        rows={key === "title" ? 2 : 3}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
                      <select
                        value={pendingBug.severity ?? "medium"}
                        onChange={(e) => setPendingBug({ ...pendingBug, severity: e.target.value as Severity })}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        {["critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                      <select
                        value={pendingBug.priority ?? "P2"}
                        onChange={(e) => setPendingBug({ ...pendingBug, priority: e.target.value as "P1" | "P2" | "P3" })}
                        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        {["P1", "P2", "P3"].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveBug} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90">
                      Сохранить баг-репорт
                    </button>
                    <button onClick={() => setPendingBug(null)} className="px-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl">
                      Перегенерировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 4: AUTOMATION GENERATOR
// ══════════════════════════════════════════════════════
function AutomationModule() {
  const { apiKeys, testCases, checklists } = useApp();
  const [stack, setStack] = useState<AutoStack>("python-playwright");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"code" | "guide">("code");
  const [error, setError] = useState("");

  const allItems = [
    ...testCases.map((tc) => ({ id: tc.id, text: tc.title, type: "testcase" })),
    ...checklists.filter((c) => !testCases.find((t) => t.source === c.text)).map((c) => ({ id: c.id, text: c.text, type: "checklist" })),
  ];

  const stackInfo = STACKS.find((s) => s.id === stack)!;

  const generate = async () => {
    if (!selectedItem) return;
    const item = allItems.find((i) => i.id === selectedItem);
    if (!item) return;
    setLoading(true);
    setCode("");
    setGuide("");
    setError("");

    const tc = testCases.find((t) => t.id === selectedItem);
    const steps = tc ? tc.steps.join("\n") : "";

    try {
      const [codeRes, guideRes] = await Promise.all([
        callAI(
          apiKeys,
          QA_SYSTEM_PROMPT,
          `Напиши автотест для ${stackInfo.label} с паттерном Page Object Model (POM).

Тест: "${item.text}"
${steps ? `Шаги:\n${steps}` : ""}

Требования:
- Используй ${stackInfo.label}
- Строго следуй паттерну Page Object Model
- Добавь понятные имена методов и переменных
- Добавь assertions (проверки)
- Код должен быть готов к запуску
- Файловая структура: /pages/ и /tests/
- Верни ТОЛЬКО код, без пояснений, с комментариями на русском

Верни два файла, разделённых строкой "# === pages/page.py ===" и "# === tests/test.py ===" (или аналогичные для выбранного языка)`
        ),
        callAI(
          apiKeys,
          QA_SYSTEM_PROMPT,
          `Напиши пошаговый гайд по запуску автотеста на ${stackInfo.label} для начинающего QA-инженера.

Включи:
1. Системные требования
2. Установка зависимостей (конкретные команды терминала)
3. Структура проекта
4. Команды для запуска тестов
5. Как посмотреть отчёт

Пиши чётко, с командами в code-блоках. На русском языке.`
        ),
      ]);
      setCode(codeRes);
      setGuide(guideRes);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🤖 Генератор автотестов</h2>
        <p className="text-sm text-muted-foreground">Конвертируйте тест-кейсы в готовый код автотестов с паттерном Page Object Model.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Стек технологий</label>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(["python","typescript","javascript","java","kotlin","csharp","ruby","go","swift","php"] as const).map((lang) => {
                const group = STACKS.filter((s) => s.lang === lang);
                if (!group.length) return null;
                const labels: Record<string, string> = {
                  python: "Python", typescript: "TypeScript", javascript: "JavaScript",
                  java: "Java", kotlin: "Kotlin", csharp: "C#",
                  ruby: "Ruby", go: "Go", swift: "Swift", php: "PHP",
                };
                return (
                  <div key={lang}>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 px-1">{labels[lang]}</div>
                    <div className="space-y-1">
                      {group.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStack(s.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                            stack === s.id
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span>{s.label}</span>
                            {s.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                s.badge.includes("🔥") ? "bg-orange-500/20 text-orange-400" :
                                s.badge === "API" ? "bg-blue-500/20 text-blue-400" :
                                s.badge === "Mobile" ? "bg-purple-500/20 text-purple-400" :
                                s.badge === "BDD" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                              }`}>{s.badge}</span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Выберите тест</label>
            {allItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Сначала создайте тест-кейсы в модуле Тест-дизайн</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                      selectedItem === item.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-mono text-muted-foreground mr-1.5">{item.type === "testcase" ? "TC" : "CL"}</span>
                    {item.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={generate}
            disabled={loading || !selectedItem}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><Code className="w-4 h-4" /> Сгенерировать автотест</>}
          </button>
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">{error.split("\n")[0]}</div>
                {error.includes("\n") && (
                  <pre className="mt-1 text-xs opacity-80 whitespace-pre-wrap break-all font-mono">{error.split("\n").slice(1).join("\n")}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2">
          {loading ? (
            <div className="bg-card border border-border rounded-xl h-96 flex items-center justify-center">
              <Spinner />
            </div>
          ) : code ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {["code", "guide"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "code" ? "💻 Код автотеста" : "📖 Гайд по запуску"}
                  </button>
                ))}
              </div>
              {tab === "code" ? (
                <CodeBlock code={code} lang={stackInfo.lang} />
              ) : (
                <div className="bg-card border border-border rounded-xl p-5 max-h-96 overflow-y-auto">
                  <MarkdownView content={guide} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl h-96 flex items-center justify-center">
              <EmptyState icon={<Terminal />} title="Код появится здесь" desc="Выберите тест и стек, затем нажмите Сгенерировать" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 5: RELEASE REPORT
// ══════════════════════════════════════════════════════
function ReleaseReportModule() {
  const { checklists, bugReports } = useApp();
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const { apiKeys } = useApp();

  const stats = {
    total: checklists.length,
    passed: checklists.filter((c) => c.status === "passed").length,
    failed: checklists.filter((c) => c.status === "failed").length,
    blocked: checklists.filter((c) => c.status === "blocked").length,
    pending: checklists.filter((c) => c.status === "pending").length,
    coverage: checklists.length ? Math.round((checklists.filter((c) => c.status !== "pending").length / checklists.length) * 100) : 0,
    passRate: checklists.length ? Math.round((checklists.filter((c) => c.status === "passed").length / checklists.length) * 100) : 0,
    critical: bugReports.filter((b) => b.severity === "critical").length,
    high: bugReports.filter((b) => b.severity === "high").length,
    medium: bugReports.filter((b) => b.severity === "medium").length,
    low: bugReports.filter((b) => b.severity === "low").length,
  };

  const verdict = stats.critical > 0 ? "🔴 NO GO" : stats.high > 2 ? "🟡 УСЛОВНЫЙ РЕЛИЗ" : stats.passRate >= 90 ? "🟢 GO" : "🟡 УСЛОВНЫЙ РЕЛИЗ";

  const generateReport = async () => {
    setLoading(true);
    try {
      const text = await callAI(
        apiKeys,
        QA_SYSTEM_PROMPT,
        `Напиши профессиональный Test Summary Report (Отчёт о тестировании) на русском языке.

Статистика:
- Всего тестов: ${stats.total}
- Passed: ${stats.passed} (${stats.passRate}%)
- Failed: ${stats.failed}
- Blocked: ${stats.blocked}
- Покрытие: ${stats.coverage}%

Баги:
- Critical: ${stats.critical}
- High: ${stats.high}
- Medium: ${stats.medium}
- Low: ${stats.low}

Вердикт: ${verdict}

Список багов:
${bugReports.map((b) => `- [${b.severity.toUpperCase()}] ${b.title}`).join("\n")}

Структура отчёта:
## 📊 Test Summary Report
### Краткое резюме
### Статистика выполнения
### Найденные дефекты
### Рекомендации команде
### Вердикт о готовности к релизу (Go/No-Go с обоснованием)`
      );
      setReportText(text);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">📊 Релизный отчёт</h2>
        <p className="text-sm text-muted-foreground">Сводка выполнения тестирования и рекомендация Go/No-Go для команды.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Всего тестов", value: stats.total, color: "text-foreground" },
          { label: "Pass Rate", value: `${stats.passRate}%`, color: stats.passRate >= 90 ? "text-emerald-500" : "text-amber-500" },
          { label: "Покрытие", value: `${stats.coverage}%`, color: "text-sky-500" },
          { label: "Critical баги", value: stats.critical, color: stats.critical > 0 ? "text-red-500" : "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Вердикт о готовности к релизу</h3>
          <span className="text-2xl font-bold">{verdict}</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[["Critical", stats.critical, "text-red-500"], ["High", stats.high, "text-orange-500"], ["Medium", stats.medium, "text-amber-500"], ["Low", stats.low, "text-muted-foreground"]].map(([l, v, c]) => (
            <div key={l} className="text-center">
              <p className={`text-xl font-bold ${c}`}>{v}</p>
              <p className="text-xs text-muted-foreground">{l} баги</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={generateReport} disabled={loading} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><FileText className="w-4 h-4" /> Сгенерировать отчёт</>}
        </button>
        {reportText && <CopyButton text={reportText} label="Скопировать отчёт" />}
      </div>

      {reportText && (
        <div className="bg-card border border-border rounded-xl p-5 max-h-96 overflow-y-auto">
          <MarkdownView content={reportText} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 6: TEST DATA GENERATOR
// ══════════════════════════════════════════════════════
function TestDataModule() {
  const [category, setCategory] = useState<keyof typeof TEST_DATA>("boundary");
  const [copied, setCopied] = useState<string | null>(null);

  const copyItem = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const cats: { id: keyof typeof TEST_DATA; label: string; icon: string; desc: string }[] = [
    { id: "boundary", label: "Граничные строки", icon: "📏", desc: "Пустые, длинные, нулевые значения" },
    { id: "special", label: "Спецсимволы и SQL", icon: "⚡", desc: "Инъекции, управляющие символы" },
    { id: "xss", label: "XSS Пейлоады", icon: "🔓", desc: "Cross-Site Scripting атаки" },
    { id: "emails", label: "Невалидные Email", icon: "📧", desc: "Неверные форматы email-адресов" },
    { id: "dates", label: "Невалидные даты", icon: "📅", desc: "Неверные форматы и значения дат" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🛠️ Генератор тестовых данных</h2>
        <p className="text-sm text-muted-foreground">Готовые наборы тестовых данных для мгновенного копирования. Клиентская генерация — без AI.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${
              category === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-xl">{c.icon}</span>
            <span className="font-medium text-center leading-tight">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <p className="text-sm font-medium text-foreground">{cats.find((c) => c.id === category)?.label}</p>
          <CopyButton text={TEST_DATA[category].join("\n")} label="Копировать всё" />
        </div>
        <div className="divide-y divide-border">
          {TEST_DATA[category].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/30 transition-colors">
              <code className="flex-1 text-xs font-mono text-foreground break-all">
                {item === "" ? <span className="text-muted-foreground italic">(пустая строка)</span> : item}
              </code>
              <button
                onClick={() => copyItem(item)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
              >
                {copied === item ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ── Lightbox & HandbookImages ──────────────────────────
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function HandbookImages({ images }: { images: { src: string; alt: string }[] }) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-3 mt-4">
        {images.map((img, i) => (
          <div key={i} className="relative group cursor-zoom-in" onClick={() => setLightbox(img)}>
            <img src={img.src} alt={img.alt} className="w-full rounded-lg border border-border object-contain max-h-[520px] transition-transform group-hover:scale-[1.01] duration-200" />
            <div className="absolute inset-0 rounded-lg flex items-center justify-center pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Нажмите для увеличения
              </span>
            </div>
          </div>
        ))}
      </div>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </>
  );
}

// MODULE 7: QA HANDBOOK
// ══════════════════════════════════════════════════════
function HandbookModule() {
  const { bookmarks, toggleBookmark, setSelectedTechnique, setActiveModule } = useApp();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cheatSheet, setCheatSheet] = useState(false);

  const filtered = useMemo(() => {
    return HANDBOOK.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchCat = !activeCategory || t.category === activeCategory;
      const matchLevel = !levelFilter || t.level === levelFilter;
      const matchBookmark = !cheatSheet || bookmarks.includes(t.id);
      return matchSearch && matchCat && matchLevel && matchBookmark;
    });
  }, [search, activeCategory, levelFilter, cheatSheet, bookmarks]);

  const techDesignTopics = ["td1", "td2", "td3", "td4", "td5"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">📚 База знаний QA</h2>
        <p className="text-sm text-muted-foreground">Интерактивный справочник по теории тестирования. Основан на ISTQB CTFL v4.0, ISO 25010, OWASP Top 10.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по темам, тегам, содержанию..."
            className="w-full bg-input-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {["beginner", "intermediate", "pro"].map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                levelFilter === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l === "beginner" ? "Новичок" : l === "intermediate" ? "Мидл" : "Эксперт"}
            </button>
          ))}
          <button
            onClick={() => setCheatSheet(!cheatSheet)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              cheatSheet ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Избранное
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          Все ({HANDBOOK.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {cat} ({HANDBOOK.filter((h) => h.category === cat).length})
          </button>
        ))}
      </div>

      {/* Topics */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState icon={<BookOpen />} title="Ничего не найдено" desc="Попробуйте изменить фильтры или поисковый запрос" />
        ) : (
          filtered.map((topic) => (
            <div key={topic.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpandedId(expandedId === topic.id ? null : topic.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground">{topic.title}</span>
                    <Badge variant={topic.level as any}>
                      {topic.level === "beginner" ? "Новичок" : topic.level === "intermediate" ? "Мидл" : "Эксперт"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topic.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(topic.id); }}
                    className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${bookmarks.includes(topic.id) ? "text-amber-500" : "text-muted-foreground"}`}
                  >
                    {bookmarks.includes(topic.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                  </button>
                  {expandedId === topic.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === topic.id && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  <MarkdownView content={topic.content} />
                  {topic.images && topic.images.length > 0 && (
                    <HandbookImages images={topic.images} />
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {techDesignTopics.includes(topic.id) && (
                      <button
                        onClick={() => { setSelectedTechnique(topic.id); setActiveModule("test-design"); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Применить в генераторе
                      </button>
                    )}
                    <CopyButton text={topic.content} label="Копировать" />
                    <button
                      onClick={() => toggleBookmark(topic.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${bookmarks.includes(topic.id) ? "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      {bookmarks.includes(topic.id) ? "Убрать из избранного" : "В избранное"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 8: SETTINGS
// ══════════════════════════════════════════════════════
function SettingsModule() {
  const { apiKeys, setApiKeys } = useApp();
  const [dataMessage, setDataMessage] = useState("");

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {} as Record<string, any>,
    };
    EXPORTABLE_STORAGE_KEYS.forEach((k) => {
      try { data.data[k] = JSON.parse(localStorage.getItem(k) ?? "null"); } catch {}
    });
    downloadTextFile(
      JSON.stringify(data, null, 2),
      `qa-navigator-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!parsed || typeof parsed.data !== "object" || parsed.data === null) {
            throw new Error("Некорректная структура резервной копии");
          }
          EXPORTABLE_STORAGE_KEYS.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
              localStorage.setItem(key, JSON.stringify(parsed.data[key]));
            }
          });
          window.location.reload();
        } catch (error) {
          setDataMessage(error instanceof Error ? error.message : "Не удалось импортировать файл");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAll = () => {
    if (confirm("Удалить все данные? Это действие необратимо.")) {
      EXPORTABLE_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">⚙️ Настройки</h2>
        <p className="text-sm text-muted-foreground">Управление API ключами, данными и параметрами приложения.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> API Ключи</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">OpenRouter</p>
            <p className="text-sm font-mono text-foreground">{apiKeys.openrouter ? `${apiKeys.openrouter.slice(0, 8)}...` : "Не настроен"}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Google Gemini</p>
            <p className="text-sm font-mono text-foreground">{apiKeys.gemini ? `${apiKeys.gemini.slice(0, 8)}...` : "Не настроен"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Активный провайдер: <span className="text-foreground font-medium">{apiKeys.provider === "openrouter" ? "OpenRouter" : "Google Gemini"}</span></p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Данные</h3>
        <p className="text-sm text-muted-foreground">Рабочие данные хранятся локально в браузере (localStorage). Текст, отправленный в AI-функции, передаётся выбранному провайдеру. Экспортируйте резервную копию для переноса на другое устройство.</p>
        {dataMessage && <p role="alert" className="text-sm text-destructive">{dataMessage}</p>}
        <div className="flex gap-3 flex-wrap">
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Экспорт в JSON
          </button>
          <button onClick={importData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Импорт из JSON
          </button>
          <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Очистить все данные
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> О приложении</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-medium">QA Navigator</span> — бесплатный инструмент для тестировщиков</p>
          <p>Стандарты: ISTQB CTFL v4.0 · ISO 25010 · ISO/IEC/IEEE 29119 · OWASP Top 10</p>
          <p>Хранение: клиентское (localStorage); AI-запросы передаются выбранному внешнему провайдеру.</p>
          <p>AI: OpenRouter (бесплатные модели) · Google Gemini Flash</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODULE 8: DOCUMENTATION
// ══════════════════════════════════════════════════════
type DocTab = "checklist" | "testcase" | "testplan" | "bugreport" | "testreport" | "rtm";

// ─── shared helper ────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-xs text-muted-foreground block mb-1">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function DocField({
  label, required, value, onChange, placeholder, type = "text", multiline, rows = 3,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean; rows?: number;
}) {
  const cls = "w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none";
  return (
    <div>
      <FieldLabel label={label} required={required} />
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cls} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function DocSelect({
  label, required, value, onChange, options,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ExportCard({ text, filename }: { text: string; filename: string }) {
  const download = () => downloadTextFile(text, filename, "text/markdown;charset=utf-8");
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Предпросмотр / Экспорт</span>
        <div className="flex items-center gap-2">
          <CopyButton text={text} label="Копировать" />
          <button onClick={download} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Download className="w-3.5 h-3.5" /> .md
          </button>
        </div>
      </div>
      <pre className="px-4 py-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{text}</pre>
    </div>
  );
}

// ─── Checklist (AI + Manual) ──────────────────────────
interface ChecklistDocItem { id: string; text: string; category: "positive" | "negative" | "boundary" | "nonfunctional"; priority: "P1" | "P2" | "P3" }

function ChecklistDocSection() {
  const { apiKeys, checklists, setChecklists, testCases, setTestCases, selectedTechnique, setSelectedTechnique, setActiveModule } = useApp();
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // ── AI mode state ────────────────────────────────────
  const [preset, setPreset] = useState<string | null>(null);
  const [featureDesc, setFeatureDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  const techniqueInstructions: Record<string, string> = {
    "td1": "Используй технику Equivalence Partitioning: выдели валидные и невалидные классы для каждого поля.",
    "td2": "Используй технику Boundary Value Analysis: проверь Min-1, Min, Min+1, Max-1, Max, Max+1 для каждого поля с диапазоном.",
    "td3": "Используй технику Decision Tables: для каждой комбинации условий (true/false) определи ожидаемый результат.",
    "td4": "Используй технику State Transition: определи все состояния системы и переходы между ними.",
    "td5": "Используй технику Error Guessing: основывайся на типичных ошибках — пустые поля, спецсимволы, граничные случаи.",
  };

  const generateChecklist = async () => {
    if (!featureDesc.trim()) return;
    setLoading(true); setAiError("");
    try {
      const techniqueExtra = selectedTechnique ? techniqueInstructions[selectedTechnique] ?? "" : "";
      const result = await callAI(apiKeys, QA_SYSTEM_PROMPT,
        "Сгенерируй структурированный чек-лист тестирования на русском языке для функциональности:\n\n\"" + featureDesc + "\"\n" +
        (techniqueExtra ? "\nПрименяемая техника тест-дизайна:\n" + techniqueExtra : "") +
        "\n\nВерни ТОЛЬКО JSON (без markdown-обёртки):\n{\"items\":[{\"text\":\"текст\",\"category\":\"positive\"},{\"text\":\"текст\",\"category\":\"negative\"},{\"text\":\"текст\",\"category\":\"boundary\"},{\"text\":\"текст\",\"category\":\"nonfunctional\"}]}\n\nКатегории: positive, negative, boundary, nonfunctional. Минимум 4 проверки каждой. Итого ≥16 пунктов."
      );
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed: { items: Array<{ text: string; category: string }> } = JSON.parse(cleaned);
      setChecklists(parsed.items.map(item => ({ id: uid(), text: item.text, category: item.category as ChecklistItem["category"], status: "pending" })));
    } catch (e: any) {
      setAiError(e.message || "AI вернул неверный формат. Попробуйте ещё раз.");
    }
    setLoading(false);
  };

  const expandToTestCase = async (item: ChecklistItem) => {
    setExpandingId(item.id);
    try {
      const result = await callAI(apiKeys, QA_SYSTEM_PROMPT,
        "Разверни проверку из чек-листа в детальный тест-кейс по ISO/IEC/IEEE 29119:\n\nПроверка: \"" + item.text + "\"\nКонтекст: " + (featureDesc || "общая функциональность") +
        "\n\nВерни ТОЛЬКО JSON:\n{\"title\":\"название\",\"preconditions\":\"предусловия\",\"steps\":[\"шаг 1\",\"шаг 2\"],\"expected\":\"ожидаемый результат\",\"priority\":\"P1\"}"
      );
      const tc = JSON.parse(result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      const testCase: TestCase = { id: uid(), title: tc.title, preconditions: tc.preconditions, steps: tc.steps, expected: tc.expected, priority: tc.priority as "P1" | "P2" | "P3", status: "pending", source: item.text };
      setChecklists(checklists.map(c => c.id === item.id ? { ...c, testCase } : c));
      setTestCases([...testCases.filter(t => t.id !== testCase.id), testCase]);
    } catch {}
    setExpandingId(null);
  };

  const catLabel: Record<string, string> = { positive: "Позитивные", negative: "Негативные", boundary: "Граничные значения", nonfunctional: "Нефункциональные" };
  const catOrder = ["positive", "negative", "boundary", "nonfunctional"];
  const grouped = catOrder.reduce((acc, cat) => { acc[cat] = checklists.filter(c => c.category === cat); return acc; }, {} as Record<string, ChecklistItem[]>);

  const aiMarkdown = checklists.length > 0
    ? ["# Чек-лист: " + (featureDesc.split("\n")[0] || "(без названия)"), "", ...catOrder.flatMap(cat => { const its = grouped[cat]; if (!its?.length) return []; return ["## " + catLabel[cat], "", ...its.map((c, i) => (i + 1) + ". " + c.text), ""]; })].join("\n")
    : "";

  // ── Manual mode state ────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [manTitle, setManTitle] = useState("");
  const [manFeature, setManFeature] = useState("");
  const [manEnv, setManEnv] = useState("");
  const [manTester, setManTester] = useState("");
  const [manDate, setManDate] = useState(today);
  const [manItems, setManItems] = useState<ChecklistDocItem[]>([
    { id: uid(), text: "", category: "positive", priority: "P2" },
    { id: uid(), text: "", category: "negative", priority: "P1" },
  ]);

  const manCatLabel: Record<string, string> = { positive: "Позитивный", negative: "Негативный", boundary: "Граничный", nonfunctional: "Нефункциональный" };
  const addManItem = () => setManItems(i => [...i, { id: uid(), text: "", category: "positive", priority: "P2" }]);
  const removeManItem = (id: string) => setManItems(i => i.filter(x => x.id !== id));
  const updMan = (id: string, ch: Partial<ChecklistDocItem>) => setManItems(i => i.map(x => x.id === id ? { ...x, ...ch } : x));

  const manGrouped = ["positive", "negative", "boundary", "nonfunctional"].map(cat => ({
    cat, label: manCatLabel[cat], items: manItems.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);

  const manMarkdown = [
    "# Чек-лист тестирования: " + (manTitle || "(без названия)"),
    "",
    "| Поле | Значение |",
    "|------|----------|",
    "| Функциональность | " + (manFeature || "—") + " |",
    "| Окружение | " + (manEnv || "—") + " |",
    "| Тестировщик | " + (manTester || "—") + " |",
    "| Дата | " + manDate + " |",
    "",
    ...manGrouped.flatMap(g => ["## " + g.label, "", "| # | Проверка | Приоритет | Статус |", "|---|----------|-----------|--------|", ...g.items.map((item, i) => "| " + (i + 1) + " | " + (item.text || "—") + " | " + item.priority + " | ☐ |"), ""]),
  ].join("\n");

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-max">
        <button onClick={() => setMode("ai")} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (mode === "ai" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Brain className="w-3.5 h-3.5" /> AI Генератор
        </button>
        <button onClick={() => setMode("manual")} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <FileText className="w-3.5 h-3.5" /> Ручной шаблон
        </button>
      </div>

      {/* ── AI mode ── */}
      {mode === "ai" && (
        <>
          {selectedTechnique && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
              <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">Активная техника: </span>
                <span className="text-sm text-primary font-mono">{HANDBOOK.find(h => h.id === selectedTechnique)?.title}</span>
              </div>
              <button onClick={() => setSelectedTechnique(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Быстрый старт — шаблоны</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => { setPreset(p.id); if (p.id !== "custom") setFeatureDesc(p.name + ": " + p.hint); else setFeatureDesc(""); }} className={"flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all " + (preset === p.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40")}>
                  <span className="text-xl">{p.icon}</span>
                  <span className="font-medium text-center leading-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-2 space-y-3">
              <textarea value={featureDesc} onChange={e => setFeatureDesc(e.target.value)} placeholder={"Опишите функциональность для тестирования...\n\nПример: Форма авторизации с полями Email и Пароль. Email обязателен, пароль минимум 8 символов. После 5 неверных попыток аккаунт блокируется на 30 минут."} className="w-full h-36 bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none" />
              <button onClick={generateChecklist} disabled={loading || !featureDesc.trim()} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Генерирую...</> : <><Zap className="w-4 h-4" /> Сгенерировать чек-лист</>}
              </button>
              {aiError && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {aiError}
                </div>
              )}
              {checklists.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <CopyButton text={checklists.map(c => "[" + catLabel[c.category] + "] " + c.text).join("\n")} label="Скопировать" />
                  {aiMarkdown && (
                    <button onClick={() => downloadTextFile(aiMarkdown, "checklist.md", "text/markdown;charset=utf-8")} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors">
                      <Download className="w-3.5 h-3.5" /> .md
                    </button>
                  )}
                  <button onClick={() => setActiveModule("test-execution")} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:opacity-80 transition-opacity">
                    <Play className="w-3.5 h-3.5" /> Запустить выполнение
                  </button>
                </div>
              )}
            </div>

            <div className="xl:col-span-3 space-y-3">
              {checklists.length === 0 ? (
                <div className="bg-card border border-border rounded-xl h-64 flex items-center justify-center">
                  <EmptyState icon={<CheckSquare />} title="Чек-лист появится здесь" desc="Заполните описание и нажмите Сгенерировать" />
                </div>
              ) : (
                catOrder.map(cat => grouped[cat]?.length > 0 && (
                  <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border bg-muted/50 flex items-center gap-2">
                      <Badge variant={cat as any}>{catLabel[cat]}</Badge>
                      <span className="text-xs text-muted-foreground">{grouped[cat].length} проверок</span>
                    </div>
                    <div className="divide-y divide-border">
                      {grouped[cat].map(item => (
                        <div key={item.id} className="px-4 py-3 group">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 text-sm text-foreground leading-relaxed">{item.text}</div>
                            <button onClick={() => expandToTestCase(item)} disabled={expandingId === item.id} className="shrink-0 text-xs px-2.5 py-1.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border text-muted-foreground transition-all opacity-0 group-hover:opacity-100">
                              {expandingId === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "→ Тест-кейс"}
                            </button>
                          </div>
                          {item.testCase && (
                            <div className="mt-2.5 bg-muted/60 rounded-lg p-3 text-xs space-y-1.5 border border-border">
                              <p className="font-medium text-foreground">{item.testCase.title}</p>
                              <p className="text-muted-foreground"><span className="font-medium">Предусловие:</span> {item.testCase.preconditions}</p>
                              <div className="text-muted-foreground"><span className="font-medium">Шаги:</span>
                                <ol className="ml-3 mt-0.5 space-y-0.5 list-decimal">{item.testCase.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                              </div>
                              <p className="text-muted-foreground"><span className="font-medium">Ожидаемый результат:</span> {item.testCase.expected}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <Badge variant="default">{item.testCase.priority}</Badge>
                                <CopyButton text={"ID: " + item.testCase.id + "\nTitle: " + item.testCase.title + "\nПредусловие: " + item.testCase.preconditions + "\nШаги:\n" + item.testCase.steps.map((s, i) => (i + 1) + ". " + s).join("\n") + "\nОжидаемый результат: " + item.testCase.expected + "\nПриоритет: " + item.testCase.priority} label="Jira" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Manual mode ── */}
      {mode === "manual" && (
        <>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>Поля, помеченные <span className="text-destructive font-medium">*</span>, обязательны по IEEE 829 / ISO/IEC/IEEE 29119.</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card border border-border rounded-xl p-4">
            <DocField label="Название чек-листа" required value={manTitle} onChange={setManTitle} placeholder="ЧЛ-01: Форма авторизации" />
            <DocField label="Тестируемая функциональность" required value={manFeature} onChange={setManFeature} placeholder="Авторизация пользователя" />
            <DocField label="Тестовое окружение" required value={manEnv} onChange={setManEnv} placeholder="Chrome 124, Windows 11, Staging" />
            <DocField label="Тестировщик" required value={manTester} onChange={setManTester} placeholder="Иванов Иван" />
            <div>
              <FieldLabel label="Дата составления" required />
              <input type="date" value={manDate} onChange={e => setManDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Проверки <span className="text-destructive">*</span></span>
              <button onClick={addManItem} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>
            <div className="divide-y divide-border">
              {manItems.map((item, i) => (
                <div key={item.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 shrink-0 font-mono">{i + 1}</span>
                  <input value={item.text} onChange={e => updMan(item.id, { text: e.target.value })} placeholder="Описание проверки..." className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                  <select value={item.category} onChange={e => updMan(item.id, { category: e.target.value as ChecklistDocItem["category"] })} className="bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                    {Object.entries(manCatLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={item.priority} onChange={e => updMan(item.id, { priority: e.target.value as "P1" | "P2" | "P3" })} className="w-16 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none">
                    <option>P1</option><option>P2</option><option>P3</option>
                  </select>
                  <button onClick={() => removeManItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <ExportCard text={manMarkdown} filename="checklist.md" />
        </>
      )}
    </div>
  );
}

// ─── Test Case Template ───────────────────────────────
function TestCaseDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [tcId, setTcId] = useState("TC-001");
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [preconditions, setPreconditions] = useState("");
  const [steps, setSteps] = useState("1. \n2. \n3. ");
  const [expected, setExpected] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [priority, setPriority] = useState("P2");
  const [severity, setSeverity] = useState("medium");
  const [status, setStatus] = useState("Draft");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(today);
  const [testData, setTestData] = useState("");

  const markdown = [
    "# Тест-кейс " + tcId,
    "",
    "**Название:** " + (title || "—"),
    "**Модуль/Функция:** " + (module || "—"),
    "**Приоритет:** " + priority + " | **Серьёзность:** " + severity,
    "**Статус:** " + status + " | **Автор:** " + (author || "—") + " | **Дата:** " + date,
    "",
    "## Предусловия *",
    preconditions || "—",
    "",
    "## Тестовые данные",
    testData || "—",
    "",
    "## Шаги воспроизведения *",
    steps || "—",
    "",
    "## Ожидаемый результат *",
    expected || "—",
    "",
    "## Фактический результат",
    actualResult || "Заполняется при выполнении",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Идентификация</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DocField label="ID тест-кейса" required value={tcId} onChange={setTcId} placeholder="TC-001" />
          <DocField label="Название тест-кейса" required value={title} onChange={setTitle} placeholder="Успешная авторизация с валидными данными" />
          <DocField label="Модуль / Функциональность" value={module} onChange={setModule} placeholder="Авторизация" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DocSelect label="Приоритет" required value={priority} onChange={setPriority} options={[{value:"P1",label:"P1 (Высокий)"},{value:"P2",label:"P2 (Средний)"},{value:"P3",label:"P3 (Низкий)"}]} />
          <DocSelect label="Серьёзность" required value={severity} onChange={setSeverity} options={[{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Medium"},{value:"low",label:"Low"}]} />
          <DocSelect label="Статус" value={status} onChange={setStatus} options={[{value:"Draft",label:"Draft"},{value:"Ready",label:"Ready"},{value:"Approved",label:"Approved"},{value:"Obsolete",label:"Obsolete"}]} />
          <div>
            <FieldLabel label="Дата создания" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <DocField label="Автор" required value={author} onChange={setAuthor} placeholder="Иванов Иван" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Содержание</h3>
        <DocField label="Предусловия (Preconditions)" required multiline rows={2} value={preconditions} onChange={setPreconditions} placeholder={"Пользователь не авторизован\nОткрыта страница /login\nВ БД есть активный пользователь test@example.com / password123"} />
        <DocField label="Тестовые данные (Test Data)" multiline rows={2} value={testData} onChange={setTestData} placeholder={"Email: test@example.com\nПароль: password123"} />
        <DocField label="Шаги воспроизведения (Test Steps)" required multiline rows={5} value={steps} onChange={setSteps} placeholder={"1. Открыть браузер и перейти на /login\n2. Ввести email test@example.com\n3. Ввести пароль password123\n4. Нажать кнопку «Войти»"} />
        <DocField label="Ожидаемый результат (Expected Result)" required multiline rows={3} value={expected} onChange={setExpected} placeholder={"Пользователь успешно авторизован\nПроизведён редирект на /dashboard\nОтображается имя пользователя в шапке"} />
        <DocField label="Фактический результат (Actual Result)" multiline rows={2} value={actualResult} onChange={setActualResult} placeholder="Заполняется при выполнении теста" />
      </div>

      <ExportCard text={markdown} filename={"testcase-" + tcId + ".md"} />
    </div>
  );
}

// ─── Test Plan Template ───────────────────────────────
function TestPlanDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [project, setProject] = useState("");
  const [version, setVersion] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(today);
  const [scope, setScope] = useState("");
  const [outOfScope, setOutOfScope] = useState("");
  const [testingTypes, setTestingTypes] = useState("Функциональное, Регрессионное, Smoke");
  const [team, setTeam] = useState("");
  const [environment, setEnvironment] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [entryCriteria, setEntryCriteria] = useState("");
  const [exitCriteria, setExitCriteria] = useState("");
  const [risks, setRisks] = useState("");
  const [approver, setApprover] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedContent(ev.target?.result as string);
      setUploadedName(file.name);
    };
    reader.readAsText(file);
  };

  const markdown = [
    "# Тест-план: " + (project || "(без названия)"),
    "**Версия продукта:** " + (version || "—") + " | **Автор:** " + (author || "—") + " | **Дата:** " + date,
    "**Утверждающий:** " + (approver || "—"),
    "",
    "---",
    "",
    "## 1. Цель и область тестирования *",
    "**Входит в область (In Scope):**",
    scope || "—",
    "",
    "**Не входит (Out of Scope):**",
    outOfScope || "—",
    "",
    "## 2. Виды тестирования *",
    testingTypes || "—",
    "",
    "## 3. Команда *",
    team || "—",
    "",
    "## 4. Тестовое окружение *",
    environment || "—",
    "",
    "## 5. Сроки *",
    "Начало: " + startDate + " | Окончание: " + (endDate || "—"),
    "",
    "## 6. Критерии входа *",
    entryCriteria || "—",
    "",
    "## 7. Критерии выхода *",
    exitCriteria || "—",
    "",
    "## 8. Риски",
    risks || "—",
  ].join("\n");

  return (
    <div className="space-y-5">
      {/* Upload banner */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Загрузить готовый тест-план</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Поддерживаются файлы .txt и .md</p>
          </div>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm font-medium">
            <Upload className="w-4 h-4" /> Загрузить файл
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown" className="hidden" onChange={handleUpload} />
        </div>
        {uploadedContent !== null && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" /> Загружен: <span className="font-medium">{uploadedName}</span>
              <button onClick={() => { setUploadedContent(null); setUploadedName(""); }} className="ml-auto text-muted-foreground hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto text-foreground">{uploadedContent}</pre>
            <div className="flex gap-2">
              <CopyButton text={uploadedContent} label="Скопировать" />
              <button
                onClick={() => {
                  downloadTextFile(uploadedContent, uploadedName);
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Скачать
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background text-xs text-muted-foreground px-3">или создайте новый</span></div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Заголовок</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocField label="Проект / Продукт" required value={project} onChange={setProject} placeholder="QA Navigator v2.0" />
          <DocField label="Версия / Релиз" required value={version} onChange={setVersion} placeholder="v2.0.0-release" />
          <DocField label="Автор тест-плана" required value={author} onChange={setAuthor} placeholder="Иванов Иван" />
          <DocField label="Утверждающий (Approver)" required value={approver} onChange={setApprover} placeholder="Руководитель QA" />
          <div>
            <FieldLabel label="Дата создания" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Содержание плана</h3>
        <DocField label="Область тестирования (In Scope)" required multiline rows={3} value={scope} onChange={setScope} placeholder={"- Модуль авторизации\n- Форма регистрации\n- Восстановление пароля"} />
        <DocField label="Вне области (Out of Scope)" multiline rows={2} value={outOfScope} onChange={setOutOfScope} placeholder={"- Мобильное приложение\n- Нагрузочное тестирование"} />
        <DocField label="Виды тестирования" required value={testingTypes} onChange={setTestingTypes} placeholder="Функциональное, Регрессионное, Smoke, Sanity" />
        <DocField label="Команда тестирования" required multiline rows={2} value={team} onChange={setTeam} placeholder={"QA Lead: Иванов И. — координация\nQA Engineer: Петров П. — ручное тестирование"} />
        <DocField label="Тестовое окружение" required multiline rows={2} value={environment} onChange={setEnvironment} placeholder={"Staging: https://staging.example.com\nБраузеры: Chrome 124, Firefox 125, Safari 17\nОС: Windows 11, macOS 14"} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Дата начала" required />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <FieldLabel label="Дата окончания" required />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <DocField label="Критерии входа (Entry Criteria)" required multiline rows={3} value={entryCriteria} onChange={setEntryCriteria} placeholder={"- Готова сборка для тестирования\n- Smoke-тесты пройдены\n- Тестовая среда развёрнута и доступна\n- Тест-кейсы согласованы"} />
        <DocField label="Критерии выхода (Exit Criteria)" required multiline rows={3} value={exitCriteria} onChange={setExitCriteria} placeholder={"- 100% тест-кейсов выполнено\n- Нет открытых критических/высоких багов\n- Регрессия пройдена\n- Отчёт о тестировании согласован"} />
        <DocField label="Риски и митигация" multiline rows={3} value={risks} onChange={setRisks} placeholder={"- Риск: нестабильная тестовая среда → Митигация: резервная среда\n- Риск: нехватка времени → Митигация: расстановка приоритетов"} />
      </div>

      <ExportCard text={markdown} filename="test-plan.md" />
    </div>
  );
}

// ─── Bug Report Template ──────────────────────────────
function BugReportDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [bugId, setBugId] = useState("BUG-001");
  const [titleWhere, setTitleWhere] = useState("");
  const [titleWhat, setTitleWhat] = useState("");
  const [titleCondition, setTitleCondition] = useState("");
  const [environment, setEnvironment] = useState("");
  const [severity, setSeverity] = useState("high");
  const [priority, setPriority] = useState("P2");
  const [steps, setSteps] = useState("1. \n2. \n3. ");
  const [actual, setActual] = useState("");
  const [expected, setExpected] = useState("");
  const [reporter, setReporter] = useState("");
  const [assignee, setAssignee] = useState("");
  const [date, setDate] = useState(today);
  const [attachments, setAttachments] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const composedTitle = [titleWhere, titleWhat, titleCondition].filter(Boolean).join(" — ");

  const markdown = [
    "# Баг-репорт " + bugId,
    "",
    "**Заголовок:** " + (composedTitle || "—"),
    "**Серьёзность:** " + severity + " | **Приоритет:** " + priority,
    "**Окружение:** " + (environment || "—"),
    "**Репортер:** " + (reporter || "—") + " | **Назначен:** " + (assignee || "—") + " | **Дата:** " + date,
    "",
    "## Шаги воспроизведения *",
    steps || "—",
    "",
    "## Фактический результат *",
    actual || "—",
    "",
    "## Ожидаемый результат *",
    expected || "—",
    "",
    "## Вложения",
    attachments || "—",
    "",
    "## Дополнительная информация",
    additionalInfo || "—",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Идентификация</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DocField label="ID баг-репорта" required value={bugId} onChange={setBugId} placeholder="BUG-001" />
          <DocSelect label="Серьёзность (Severity)" required value={severity} onChange={setSeverity} options={[{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Medium"},{value:"low",label:"Low"}]} />
          <DocSelect label="Приоритет" required value={priority} onChange={setPriority} options={[{value:"P1",label:"P1 (Высокий)"},{value:"P2",label:"P2 (Средний)"},{value:"P3",label:"P3 (Низкий)"}]} />
          <div>
            <FieldLabel label="Дата обнаружения" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocField label="Репортер (Reporter)" required value={reporter} onChange={setReporter} placeholder="Иванов Иван" />
          <DocField label="Назначен (Assignee)" value={assignee} onChange={setAssignee} placeholder="Разработчик" />
          <DocField label="Окружение" required value={environment} onChange={setEnvironment} placeholder="Chrome 124, Windows 11, Staging v2.0" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Заголовок баг-репорта <span className="text-destructive">*</span></h3>
          <p className="text-xs text-muted-foreground mb-3">Формула: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">[Где] — [Что произошло] — [При каком условии]</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DocField label="[Где] — место / компонент" required value={titleWhere} onChange={setTitleWhere} placeholder="Страница /login, поле «Пароль»" />
            <DocField label="[Что] — суть проблемы" required value={titleWhat} onChange={setTitleWhat} placeholder="Принимает менее 8 символов" />
            <DocField label="[Условие] — при каком условии" required value={titleCondition} onChange={setTitleCondition} placeholder="при вводе 3-символьного пароля" />
          </div>
          {composedTitle && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-foreground border border-border">
              <span className="text-xs text-muted-foreground block mb-1">Итоговый заголовок:</span>
              {composedTitle}
            </div>
          )}
        </div>
        <DocField label="Шаги воспроизведения (Steps to Reproduce)" required multiline rows={4} value={steps} onChange={setSteps} placeholder={"1. Открыть страницу /login\n2. Ввести email: test@example.com\n3. Ввести пароль: abc (3 символа)\n4. Нажать «Войти»"} />
        <DocField label="Фактический результат (Actual Result)" required multiline rows={2} value={actual} onChange={setActual} placeholder="Пользователь авторизован успешно. Пароль из 3 символов принят без ошибки." />
        <DocField label="Ожидаемый результат (Expected Result)" required multiline rows={2} value={expected} onChange={setExpected} placeholder="Отображается сообщение «Пароль должен содержать минимум 8 символов»." />
        <DocField label="Вложения (ссылки на скриншоты, видео)" value={attachments} onChange={setAttachments} placeholder="screenshot_001.png, video_reproduction.mp4" />
        <DocField label="Дополнительная информация" multiline rows={2} value={additionalInfo} onChange={setAdditionalInfo} placeholder="Воспроизводится в 100% случаев. Аналогичная проблема в поле «Подтверждение пароля»." />
      </div>

      <ExportCard text={markdown} filename={"bugreport-" + bugId + ".md"} />
    </div>
  );
}

// ─── Test Report Template ─────────────────────────────
function TestReportDocSection() {
  const today = new Date().toISOString().slice(0, 10);
  const [project, setProject] = useState("");
  const [version, setVersion] = useState("");
  const [period, setPeriod] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(today);
  const [totalTests, setTotalTests] = useState("");
  const [passed, setPassed] = useState("");
  const [failed, setFailed] = useState("");
  const [blocked, setBlocked] = useState("");
  const [skipped, setSkipped] = useState("");
  const [summary, setSummary] = useState("");
  const [defectsFound, setDefectsFound] = useState("");
  const [defectsClosed, setDefectsClosed] = useState("");
  const [knownIssues, setKnownIssues] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendation, setRecommendation] = useState("Продукт готов к релизу");
  const [approver, setApprover] = useState("");

  const passRate = totalTests && passed ? Math.round(parseInt(passed) / parseInt(totalTests) * 100) : 0;

  const markdown = [
    "# Отчёт о тестировании: " + (project || "(без названия)"),
    "**Версия:** " + (version || "—") + " | **Период:** " + (period || "—"),
    "**Автор:** " + (author || "—") + " | **Дата:** " + date + " | **Утверждающий:** " + (approver || "—"),
    "",
    "---",
    "",
    "## Сводная статистика",
    "",
    "| Метрика | Значение |",
    "|---------|----------|",
    "| Всего тест-кейсов | " + (totalTests || "—") + " |",
    "| Пройдено (Passed) | " + (passed || "—") + " |",
    "| Провалено (Failed) | " + (failed || "—") + " |",
    "| Заблокировано (Blocked) | " + (blocked || "—") + " |",
    "| Пропущено (Skipped) | " + (skipped || "—") + " |",
    "| % пройденных | " + (passRate ? passRate + "%" : "—") + " |",
    "| Найдено дефектов | " + (defectsFound || "—") + " |",
    "| Закрыто дефектов | " + (defectsClosed || "—") + " |",
    "",
    "## Краткое резюме *",
    summary || "—",
    "",
    "## Известные дефекты / Открытые баги",
    knownIssues || "—",
    "",
    "## Выводы *",
    conclusion || "—",
    "",
    "## Рекомендация",
    recommendation || "—",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Заголовок отчёта</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocField label="Проект / Продукт" required value={project} onChange={setProject} placeholder="QA Navigator" />
          <DocField label="Версия / Сборка" required value={version} onChange={setVersion} placeholder="v2.0.0-rc1" />
          <DocField label="Период тестирования" required value={period} onChange={setPeriod} placeholder="01.08.2026 – 08.08.2026" />
          <DocField label="Автор отчёта" required value={author} onChange={setAuthor} placeholder="Иванов Иван" />
          <DocField label="Утверждающий" required value={approver} onChange={setApprover} placeholder="Руководитель QA" />
          <div>
            <FieldLabel label="Дата отчёта" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Статистика тестирования <span className="text-destructive">*</span></h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DocField label="Всего тест-кейсов" required type="number" value={totalTests} onChange={setTotalTests} placeholder="120" />
          <DocField label="Passed (Пройдено)" required type="number" value={passed} onChange={setPassed} placeholder="105" />
          <DocField label="Failed (Провалено)" required type="number" value={failed} onChange={setFailed} placeholder="8" />
          <DocField label="Blocked (Заблокировано)" type="number" value={blocked} onChange={setBlocked} placeholder="5" />
          <DocField label="Skipped (Пропущено)" type="number" value={skipped} onChange={setSkipped} placeholder="2" />
          <DocField label="Найдено дефектов" required type="number" value={defectsFound} onChange={setDefectsFound} placeholder="12" />
          <DocField label="Закрыто дефектов" type="number" value={defectsClosed} onChange={setDefectsClosed} placeholder="9" />
          <div className="flex items-end">
            {passRate > 0 && (
              <div className="w-full p-3 rounded-lg text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{passRate}%</div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Анализ и выводы</h3>
        <DocField label="Краткое резюме тестирования" required multiline rows={3} value={summary} onChange={setSummary} placeholder="Проведено функциональное и регрессионное тестирование модуля авторизации. Выявлено 12 дефектов, из которых 9 закрыто разработкой..." />
        <DocField label="Известные дефекты и открытые баги" multiline rows={3} value={knownIssues} onChange={setKnownIssues} placeholder={"BUG-045 (Medium): Некорректное сообщение при сбросе пароля\nBUG-047 (Low): Опечатка в тексте кнопки"} />
        <DocField label="Выводы (Conclusions)" required multiline rows={3} value={conclusion} onChange={setConclusion} placeholder="Качество продукта соответствует критериям выхода. Все критические и высокие дефекты устранены..." />
        <DocSelect label="Рекомендация" required value={recommendation} onChange={setRecommendation} options={[{value:"Продукт готов к релизу",label:"✅ Готов к релизу"},{value:"Требуются исправления перед релизом",label:"⚠️ Требуются исправления"},{value:"Релиз не рекомендован",label:"❌ Релиз не рекомендован"}]} />
      </div>

      <ExportCard text={markdown} filename={"test-report-" + (version || "v1") + ".md"} />
    </div>
  );
}

// ─── RTM (Requirement Traceability Matrix) ────────────
interface RTMRequirement { id: string; reqId: string; title: string; priority: "high" | "medium" | "low" }
interface RTMTestCase { id: string; tcId: string; title: string }

function RTMSection() {
  const [requirements, setRequirements] = useState<RTMRequirement[]>([
    { id: uid(), reqId: "REQ-001", title: "Пользователь может авторизоваться по email и паролю", priority: "high" },
    { id: uid(), reqId: "REQ-002", title: "После 5 неверных попыток аккаунт блокируется на 30 мин", priority: "high" },
    { id: uid(), reqId: "REQ-003", title: "Пользователь может сбросить пароль по email", priority: "medium" },
  ]);
  const [testCaseRows, setTestCaseRows] = useState<RTMTestCase[]>([
    { id: uid(), tcId: "TC-001", title: "Успешная авторизация с валидными данными" },
    { id: uid(), tcId: "TC-002", title: "Авторизация с неверным паролем" },
    { id: uid(), tcId: "TC-003", title: "Блокировка после 5 неверных попыток" },
    { id: uid(), tcId: "TC-004", title: "Сброс пароля — отправка email" },
  ]);
  const [links, setLinks] = useState<Set<string>>(new Set(["REQ-001:TC-001","REQ-001:TC-002","REQ-002:TC-003","REQ-003:TC-004"]));
  const [newReqId, setNewReqId] = useState("");
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newTcId, setNewTcId] = useState("");
  const [newTcTitle, setNewTcTitle] = useState("");

  const toggleLink = (reqId: string, tcId: string) => {
    const key = reqId + ":" + tcId;
    setLinks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const addReq = () => {
    if (!newReqId.trim() || !newReqTitle.trim()) return;
    setRequirements(r => [...r, { id: uid(), reqId: newReqId.trim(), title: newReqTitle.trim(), priority: "medium" }]);
    setNewReqId(""); setNewReqTitle("");
  };

  const addTc = () => {
    if (!newTcId.trim() || !newTcTitle.trim()) return;
    setTestCaseRows(t => [...t, { id: uid(), tcId: newTcId.trim(), title: newTcTitle.trim() }]);
    setNewTcId(""); setNewTcTitle("");
  };

  const removeReq = (id: string) => setRequirements(r => r.filter(x => x.id !== id));
  const removeTc = (id: string) => setTestCaseRows(t => t.filter(x => x.id !== id));

  const coverage = requirements.map(req => {
    const covered = testCaseRows.filter(tc => links.has(req.reqId + ":" + tc.tcId)).length;
    return { reqId: req.reqId, total: testCaseRows.length, covered };
  });

  const totalCovered = coverage.filter(c => c.covered > 0).length;
  const coveragePercent = requirements.length > 0 ? Math.round(totalCovered / requirements.length * 100) : 0;

  const prioColor = { high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", low: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };

  const csvText = [
    "Требование,Описание,Приоритет," + testCaseRows.map(tc => tc.tcId).join(",") + ",Покрытие",
    ...requirements.map(req => {
      const covCount = testCaseRows.filter(tc => links.has(req.reqId + ":" + tc.tcId)).length;
      const cells = testCaseRows.map(tc => links.has(req.reqId + ":" + tc.tcId) ? "✓" : "").join(",");
      return '"' + req.reqId + '","' + req.title + '",' + req.priority + "," + cells + "," + (covCount > 0 ? "Покрыто" : "Не покрыто");
    })
  ].join("\n");

  return (
    <div className="space-y-5">
      {/* Coverage summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{requirements.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Требований</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{testCaseRows.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Тест-кейсов</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${coveragePercent === 100 ? "text-emerald-500" : coveragePercent > 50 ? "text-amber-500" : "text-rose-500"}`}>{coveragePercent}%</div>
          <div className="text-xs text-muted-foreground mt-1">Покрытие требований</div>
        </div>
      </div>

      {/* Add rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 text-sm font-medium text-foreground">Требования</div>
          <div className="divide-y divide-border max-h-56 overflow-y-auto">
            {requirements.map(req => (
              <div key={req.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs font-mono text-primary shrink-0">{req.reqId}</span>
                <span className="text-xs text-foreground flex-1 truncate">{req.title}</span>
                <select value={req.priority} onChange={e => setRequirements(r => r.map(x => x.id === req.id ? { ...x, priority: e.target.value as RTMRequirement["priority"] } : x))} className="bg-input-background border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none">
                  <option value="high">High</option><option value="medium">Med</option><option value="low">Low</option>
                </select>
                <button onClick={() => removeReq(req.id)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="px-3 py-2.5 border-t border-border flex gap-2">
            <input value={newReqId} onChange={e => setNewReqId(e.target.value)} placeholder="REQ-00X" className="w-24 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addReq()} />
            <input value={newReqTitle} onChange={e => setNewReqTitle(e.target.value)} placeholder="Описание требования..." className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addReq()} />
            <button onClick={addReq} disabled={!newReqId.trim() || !newReqTitle.trim()} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 text-sm font-medium text-foreground">Тест-кейсы</div>
          <div className="divide-y divide-border max-h-56 overflow-y-auto">
            {testCaseRows.map(tc => (
              <div key={tc.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 shrink-0">{tc.tcId}</span>
                <span className="text-xs text-foreground flex-1 truncate">{tc.title}</span>
                <button onClick={() => removeTc(tc.id)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="px-3 py-2.5 border-t border-border flex gap-2">
            <input value={newTcId} onChange={e => setNewTcId(e.target.value)} placeholder="TC-00X" className="w-20 bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addTc()} />
            <input value={newTcTitle} onChange={e => setNewTcTitle(e.target.value)} placeholder="Название тест-кейса..." className="flex-1 bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none" onKeyDown={e => e.key === "Enter" && addTc()} />
            <button onClick={addTc} disabled={!newTcId.trim() || !newTcTitle.trim()} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Матрица покрытия</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs">✓</span> Покрыто</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-muted border border-border inline-block" /> Нет связи</span>
            <CopyButton text={csvText} label="CSV" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[200px] sticky left-0 bg-muted/30 z-10">Требование</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[40px]">Приор.</th>
                {testCaseRows.map(tc => (
                  <th key={tc.id} className="text-center px-1 py-2 text-muted-foreground font-medium min-w-[52px]">
                    <div className="font-mono text-primary">{tc.tcId}</div>
                  </th>
                ))}
                <th className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[70px]">Покрытие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requirements.map(req => {
                const covCount = testCaseRows.filter(tc => links.has(req.reqId + ":" + tc.tcId)).length;
                return (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-card z-10">
                      <div className="font-mono text-primary text-xs">{req.reqId}</div>
                      <div className="text-foreground mt-0.5 line-clamp-2 max-w-[200px]">{req.title}</div>
                    </td>
                    <td className="text-center px-2 py-2">
                      <span className={"px-1.5 py-0.5 rounded text-xs font-medium " + prioColor[req.priority]}>{req.priority}</span>
                    </td>
                    {testCaseRows.map(tc => {
                      const linked = links.has(req.reqId + ":" + tc.tcId);
                      return (
                        <td key={tc.id} className="text-center px-1 py-2">
                          <button
                            onClick={() => toggleLink(req.reqId, tc.tcId)}
                            className={"w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all " + (linked ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60" : "bg-muted text-transparent hover:bg-muted/70 hover:text-muted-foreground")}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-center px-2 py-2">
                      <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + (covCount > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300")}>
                        {covCount}/{testCaseRows.length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          Кликайте на ячейки матрицы, чтобы связать требования с тест-кейсами
        </div>
      </div>
    </div>
  );
}

// ─── Main Documentation Module ────────────────────────
function DocumentationModule() {
  const [activeTab, setActiveTab] = useState<DocTab>("testplan");

  const tabs: { id: DocTab; label: string; icon: React.ReactNode }[] = [
    { id: "checklist", label: "Чек-лист", icon: <CheckSquare className="w-4 h-4" /> },
    { id: "testcase", label: "Тест-кейс", icon: <FileText className="w-4 h-4" /> },
    { id: "testplan", label: "Тест-план", icon: <Clipboard className="w-4 h-4" /> },
    { id: "bugreport", label: "Баг-репорт", icon: <Bug className="w-4 h-4" /> },
    { id: "testreport", label: "Test Report", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "rtm", label: "RTM", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">📄 Документация</h2>
        <p className="text-sm text-muted-foreground">Шаблоны тестовой документации по IEEE 829 / ISO/IEC/IEEE 29119. Поля со <span className="text-destructive font-medium">*</span> обязательны.</p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap " + (activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "checklist" && <ChecklistDocSection />}
      {activeTab === "testcase" && <TestCaseDocSection />}
      {activeTab === "testplan" && <TestPlanDocSection />}
      {activeTab === "bugreport" && <BugReportDocSection />}
      {activeTab === "testreport" && <TestReportDocSection />}
      {activeTab === "rtm" && <RTMSection />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════
const NAV_ITEMS: { id: Module; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { id: "requirements", label: "Анализ требований", shortLabel: "Требования", icon: <Brain className="w-4 h-4" /> },
  { id: "test-design", label: "Тест-дизайн", shortLabel: "Тест-дизайн", icon: <CheckSquare className="w-4 h-4" /> },
  { id: "test-execution", label: "Выполнение тестов", shortLabel: "Выполнение", icon: <Play className="w-4 h-4" /> },
  { id: "automation", label: "Автотесты", shortLabel: "Автотесты", icon: <Terminal className="w-4 h-4" /> },
  { id: "release-report", label: "Релизный отчёт", shortLabel: "Отчёт", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "test-data", label: "Генератор данных", shortLabel: "Данные", icon: <Database className="w-4 h-4" /> },
  { id: "handbook", label: "База знаний QA", shortLabel: "База знаний", icon: <BookOpen className="w-4 h-4" /> },
  { id: "documentation", label: "Документация", shortLabel: "Документы", icon: <FileText className="w-4 h-4" /> },
  { id: "settings", label: "Настройки", shortLabel: "Настройки", icon: <Settings className="w-4 h-4" /> },
];

// ══════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════
export default function App() {
  const [theme, setTheme] = useLocalStorage<Theme>("qa_nav_theme", "dark");
  const [activeModule, setActiveModule] = useState<Module>("requirements");
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>("qa_nav_apikeys", { openrouter: "", gemini: "", provider: "openrouter" });
  const [checklists, setChecklists] = useLocalStorage<ChecklistItem[]>("qa_navigator_checklists", []);
  const [testCases, setTestCases] = useLocalStorage<TestCase[]>("qa_navigator_testcases", []);
  const [bugReports, setBugReports] = useLocalStorage<BugReport[]>("qa_navigator_bugreports", []);
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>("qa_navigator_bookmarks", []);
  const [showApiModal, setShowApiModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requirementsText, setRequirementsText] = useLocalStorage<string>("qa_navigator_req_text", "");
  const [requirementsResult, setRequirementsResult] = useLocalStorage<string>("qa_navigator_req_result", "");

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(bookmarks.includes(id) ? bookmarks.filter((b) => b !== id) : [...bookmarks, id]);
  }, [bookmarks, setBookmarks]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const hasApiKey = apiKeys.openrouter || apiKeys.gemini;

  const ctx: AppCtx = {
    activeModule, setActiveModule, selectedTechnique, setSelectedTechnique,
    theme, toggleTheme, apiKeys, setApiKeys, checklists, setChecklists,
    testCases, setTestCases, bugReports, setBugReports, bookmarks, toggleBookmark,
    showApiModal, setShowApiModal, requirementsText, setRequirementsText,
    requirementsResult, setRequirementsResult,
  };

  const renderModule = () => {
    switch (activeModule) {
      case "requirements": return <RequirementsModule />;
      case "test-design": return <TestDesignModule />;
      case "test-execution": return <TestExecutionModule />;
      case "automation": return <AutomationModule />;
      case "release-report": return <ReleaseReportModule />;
      case "test-data": return <TestDataModule />;
      case "handbook": return <HandbookModule />;
      case "documentation": return <DocumentationModule />;
      case "settings": return <SettingsModule />;
    }
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-['Inter',_sans-serif]">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:relative z-30 lg:z-auto flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-full ${sidebarOpen ? "w-64" : "w-0 lg:w-64"} overflow-hidden shrink-0`}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sidebar-foreground text-sm leading-tight">QA Navigator</p>
              <p className="text-[10px] text-muted-foreground font-mono">v1.0 · 2026</p>
            </div>
          </div>

          {/* API Status */}
          <div className="px-4 py-3 border-b border-sidebar-border">
            <button
              onClick={() => setShowApiModal(true)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                hasApiKey
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
              <span className="flex-1 text-left">{hasApiKey ? "AI подключён" : "Настроить AI ключ"}</span>
              <Key className="w-3 h-3" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeModule === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span className={activeModule === item.id ? "text-sidebar-primary" : ""}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.id === "test-execution" && checklists.filter((c) => c.status === "failed").length > 0 && (
                  <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-mono">
                    {checklists.filter((c) => c.status === "failed").length}
                  </span>
                )}
                {item.id === "handbook" && bookmarks.length > 0 && (
                  <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-mono">
                    {bookmarks.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Theme toggle */}
          <div className="px-4 py-3 border-t border-sidebar-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-base text-foreground truncate">
                {NAV_ITEMS.find((n) => n.id === activeModule)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {!hasApiKey && (
                <Tooltip tip="Настройте API ключ для использования AI функций">
                  <button
                    onClick={() => setShowApiModal(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Настроить AI</span>
                  </button>
                </Tooltip>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
              {renderModule()}
            </div>
          </main>
        </div>
      </div>

      <ApiModal open={showApiModal} onClose={() => setShowApiModal(false)} />
    </AppContext.Provider>
  );
}
