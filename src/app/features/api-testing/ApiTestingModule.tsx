import { useMemo, useState } from "react";
import { Activity, Clock3, Copy, Plus, Send, Trash2 } from "lucide-react";
import { STORAGE_KEYS } from "../../core/constants";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type HeaderRow = { id: string; key: string; value: string };
type SavedRequest = { id: string; name: string; method: HttpMethod; url: string; headers: HeaderRow[]; body: string; savedAt: string };
type ApiResponse = { status: number; statusText: string; duration: number; size: number; headers: [string, string][]; body: string; ok: boolean; statusAssertion: boolean | null; bodyAssertion: boolean | null };

const STORAGE_KEY = STORAGE_KEYS.apiWorkbench;
const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function readSaved(): SavedRequest[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is SavedRequest =>
      Boolean(item && typeof item === "object" && typeof item.url === "string" && typeof item.method === "string")
    ).slice(0, 50) : [];
  } catch { return []; }
}

function parseHeaders(rows: HeaderRow[]): Headers {
  const headers = new Headers();
  for (const row of rows) {
    const key = row.key.trim();
    if (key && row.value.trim()) headers.set(key, row.value);
  }
  return headers;
}

function sanitizeSavedRequest(request: SavedRequest): SavedRequest {
  const safeUrl = (() => {
    try {
      const parsed = new URL(request.url);
      const queryKeys: string[] = [];
      parsed.searchParams.forEach((_value, key) => queryKeys.push(key));
      for (const key of queryKeys) {
        if (/token|key|secret|password|auth/i.test(key)) parsed.searchParams.set(key, "[REDACTED]");
      }
      if (parsed.username) parsed.username = "[REDACTED]";
      if (parsed.password) parsed.password = "[REDACTED]";
      return parsed.toString();
    } catch { return request.url; }
  })();
  const safeHeaders = request.headers.map((header) => ({
    ...header,
    value: /authorization|cookie|api[-_]?key|token|secret/i.test(header.key.trim())
      ? "[REDACTED — введите повторно]" : header.value,
  }));
  let safeBody = request.body;
  try {
    const redact = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(redact);
      if (!value || typeof value !== "object") return value;
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (/password|token|secret|api[_-]?key|client_secret|authorization/i.test(key)) return [key, "[REDACTED]"];
        return [key, redact(item)];
      }));
    };
    safeBody = JSON.stringify(redact(JSON.parse(request.body)), null, 2);
  } catch {
    safeBody = request.body.replace(/(password|token|secret|api[_-]?key)(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1$2[REDACTED]");
  }
  return { ...request, name: request.name.replace(/:\/\/[^/@\\s]+@/g, "://[REDACTED]@").replace(/([?&](?:token|key|secret|password|auth)=)[^&]+/gi, "$1[REDACTED]"), url: safeUrl, headers: safeHeaders, body: safeBody };
}

function escapeShell(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function ApiTestingModule() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<HeaderRow[]>([{ id: makeId(), key: "Accept", value: "application/json" }]);
  const [body, setBody] = useState('{\n  "example": true\n}');
  const [environmentText, setEnvironmentText] = useState("{}");
  const [expectedStatus, setExpectedStatus] = useState("");
  const [responseContains, setResponseContains] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<SavedRequest[]>(readSaved);
  const [activeTab, setActiveTab] = useState<"headers" | "body" | "environment" | "history">("headers");

  const requestCount = saved.length;
  const curl = useMemo(() => {
    const parts = ["curl", "-X", method, escapeShell(url || "https://example.com")];
    headers.filter((item) => item.key.trim()).forEach((item) => parts.push("-H", escapeShell(`${item.key}: ${item.value}`)));
    if (!["GET", "HEAD"].includes(method) && body.trim()) parts.push("--data-raw", escapeShell(body));
    return parts.join(" ");
  }, [body, headers, method, url]);

  const updateSaved = (next: SavedRequest[]) => {
    setSaved(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 50))); }
    catch { setError("Не удалось сохранить историю запросов: хранилище браузера недоступно или заполнено."); }
  };

  const sendRequest = async () => {
    setError("");
    setResponse(null);
    let variables: Record<string, string>;
    try {
      const parsedEnvironment: unknown = JSON.parse(environmentText);
      if (!parsedEnvironment || typeof parsedEnvironment !== "object" || Array.isArray(parsedEnvironment)) throw new Error("Окружение должно быть JSON-объектом.");
      variables = Object.fromEntries(Object.entries(parsedEnvironment as Record<string, unknown>).map(([key, value]) => [key, String(value)]));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Проверьте JSON окружения.");
      return;
    }
    const resolveVariables = (value: string) => value.replace(/\{\{([^{}]+)\}\}/g, (match, key: string) => variables[key.trim()] ?? match);
    const resolvedUrl = resolveVariables(url);
    const resolvedBody = resolveVariables(body);
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(resolvedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Поддерживаются только HTTP и HTTPS.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Укажите корректный URL, включая https://.");
      return;
    }

    let requestHeaders: Headers;
    try { requestHeaders = parseHeaders(headers.map((item) => ({ ...item, value: resolveVariables(item.value) }))); }
    catch { setError("Проверьте названия и значения HTTP-заголовков."); return; }

    if (!["GET", "HEAD"].includes(method) && body.trim()) {
      const contentType = requestHeaders.get("content-type");
      if (contentType?.includes("application/json")) {
        try { JSON.parse(resolvedBody); } catch { setError("Тело запроса не является корректным JSON."); return; }
      }
    }

    setBusy(true);
    const startedAt = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const result = await fetch(parsedUrl, {
        method,
        headers: requestHeaders,
        body: ["GET", "HEAD"].includes(method) ? undefined : resolvedBody || undefined,
        signal: controller.signal,
      });
      const raw = method === "HEAD" ? "" : await result.text();
      let formatted = raw;
      try { formatted = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* keep text response */ }
      const responseHeaders: [string, string][] = [];
      result.headers.forEach((value, key) => responseHeaders.push([key, value]));
      setResponse({
        status: result.status,
        statusText: result.statusText,
        duration: Math.round(performance.now() - startedAt),
        size: new Blob([raw]).size,
        headers: responseHeaders,
        body: formatted,
        ok: result.ok,
        statusAssertion: expectedStatus.trim() ? result.status === Number(expectedStatus) : null,
        bodyAssertion: responseContains.trim() ? formatted.includes(responseContains) : null,
      });
      const record: SavedRequest = { id: makeId(), name: `${method} ${parsedUrl.pathname}`, method, url, headers, body, savedAt: new Date().toISOString() };
      updateSaved([sanitizeSavedRequest(record), ...saved].slice(0, 50));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Неизвестная ошибка запроса.";
      setError(controller.signal.aborted
        ? "Превышено время ожидания (30 секунд)."
        : `Не удалось получить ответ. Возможные причины: CORS, сеть, TLS, авторизация или недоступный сервер. Браузер не позволяет обойти CORS. Подробности: ${message}`);
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };

  const saveCurrent = () => {
    if (!url.trim()) { setError("Сначала укажите URL запроса."); return; }
    updateSaved([sanitizeSavedRequest({ id: makeId(), name: `${method} ${url}`, method, url, headers, body, savedAt: new Date().toISOString() }), ...saved].slice(0, 50));
    setError("");
  };

  const loadRequest = (item: SavedRequest) => {
    setMethod(item.method);
    setUrl(item.url);
    setHeaders(item.headers);
    setBody(item.body);
    setResponse(null);
    setError("");
    setActiveTab("headers");
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); }
    catch { setError("Браузер не разрешил копирование. Выделите текст вручную."); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm text-muted-foreground">API TESTING / HTTP WORKBENCH</p><h2 className="text-2xl font-bold mt-1">API Workbench</h2><p className="text-sm text-muted-foreground mt-2 max-w-2xl">Отправляйте HTTP-запросы, изучайте ответы сервера и сохраняйте часто используемые запросы в локальной истории.</p></div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground"><Activity className="w-4 h-4 text-primary" /> Выполняется в браузере</div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <select aria-label="HTTP method" value={method} onChange={(event) => setMethod(event.target.value as HttpMethod)} className="sm:w-32 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold">
            {METHODS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input aria-label="Request URL" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.example.com/v1/resource" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm" onKeyDown={(event) => { if (event.key === "Enter" && !busy) void sendRequest(); }} />
          <button type="button" onClick={() => void sendRequest()} disabled={busy || !url.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Send className="w-4 h-4" />{busy ? "Отправка…" : "Отправить"}</button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border">
          {(["headers", "body", "environment", "history"] as const).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm border-b-2 -mb-px ${activeTab === tab ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>{tab === "headers" ? `Headers (${headers.length})` : tab === "body" ? "Body" : tab === "environment" ? "Environment" : `История (${requestCount})`}</button>)}
        </div>

        {activeTab === "headers" && <div className="space-y-2">
          {headers.map((item) => <div key={item.id} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
            <input aria-label="Header name" value={item.key} onChange={(event) => setHeaders((current) => current.map((row) => row.id === item.id ? { ...row, key: event.target.value } : row))} placeholder="Header" className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input aria-label="Header value" value={item.value} onChange={(event) => setHeaders((current) => current.map((row) => row.id === item.id ? { ...row, value: event.target.value } : row))} placeholder="Value" className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button type="button" aria-label="Удалить заголовок" onClick={() => setHeaders((current) => current.filter((row) => row.id !== item.id))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>)}
          <button type="button" onClick={() => setHeaders((current) => [...current, { id: makeId(), key: "", value: "" }])} className="inline-flex items-center gap-1.5 text-sm text-primary"><Plus className="w-4 h-4" /> Добавить заголовок</button>
        </div>}

        {activeTab === "body" && <div className="space-y-2"><p className="text-xs text-muted-foreground">Для GET и HEAD тело запроса не отправляется. JSON проверяется перед отправкой, если указан Content-Type: application/json.</p><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={9} spellCheck={false} className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs" /></div>}

        {activeTab === "environment" && <div className="space-y-2"><p className="text-xs text-muted-foreground">JSON-объект переменных окружения. Подставляйте значения в URL, заголовки и тело через синтаксис <code>{'{{variable}}'}</code>. Значения хранятся только в памяти текущей страницы и не записываются в историю.</p><textarea value={environmentText} onChange={(event) => setEnvironmentText(event.target.value)} rows={8} spellCheck={false} className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs" placeholder='{"baseUrl":"https://api.example.com","token":"..."}' /></div>}

        {activeTab === "history" && <div className="space-y-2">{saved.length === 0 ? <p className="text-sm text-muted-foreground py-5 text-center">История пока пуста. Отправьте запрос или сохраните его вручную.</p> : saved.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
          <span className="rounded bg-muted px-2 py-1 text-[11px] font-bold">{item.method}</span><span className="min-w-0 flex-1 truncate text-sm">{item.url}</span><span className="text-xs text-muted-foreground">{new Date(item.savedAt).toLocaleString()}</span><button type="button" onClick={() => loadRequest(item)} className="text-xs text-primary">Загрузить</button><button type="button" aria-label="Удалить запрос из истории" onClick={() => updateSaved(saved.filter((entry) => entry.id !== item.id))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
        </div>)}</div>}

        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
          <button type="button" onClick={saveCurrent} className="text-sm text-muted-foreground hover:text-foreground">Сохранить запрос</button>
          <button type="button" onClick={() => void copy(curl)} className="inline-flex items-center gap-1.5 text-sm text-primary"><Copy className="w-4 h-4" />Копировать cURL</button>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3"><h3 className="font-semibold text-sm">Проверки ответа (Assertions)</h3><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Ожидаемый HTTP status<input inputMode="numeric" value={expectedStatus} onChange={(event) => setExpectedStatus(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Например, 200" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">Ответ должен содержать<input value={responseContains} onChange={(event) => setResponseContains(event.target.value)} placeholder='Например, "success"' className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" /></label></div></section>

      {response && <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Ответ сервера</h3><div className="flex flex-wrap gap-2 text-xs"><span className={`rounded-lg px-2.5 py-1.5 font-semibold ${response.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>HTTP {response.status} {response.statusText}</span><span className="rounded-lg bg-muted px-2.5 py-1.5"><Clock3 className="inline w-3 h-3 mr-1" />{response.duration} ms</span><span className="rounded-lg bg-muted px-2.5 py-1.5">{response.size.toLocaleString()} bytes</span></div></div>
        {(response.statusAssertion !== null || response.bodyAssertion !== null) && <div className="flex flex-wrap gap-2 text-xs">{response.statusAssertion !== null && <span className={response.statusAssertion ? "rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-emerald-600" : "rounded-lg bg-destructive/10 px-2.5 py-1.5 text-destructive"}>Status assertion: {response.statusAssertion ? "PASS" : "FAIL"}</span>}{response.bodyAssertion !== null && <span className={response.bodyAssertion ? "rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-emerald-600" : "rounded-lg bg-destructive/10 px-2.5 py-1.5 text-destructive"}>Body contains: {response.bodyAssertion ? "PASS" : "FAIL"}</span>}</div>}
        <div><div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Response body</h4><button type="button" onClick={() => void copy(response.body)} className="text-xs text-primary"><Copy className="inline w-3 h-3 mr-1" />Копировать</button></div><pre className="max-h-[520px] overflow-auto rounded-xl bg-muted/60 p-4 text-xs leading-relaxed whitespace-pre-wrap break-words">{response.body || "(пустое тело ответа)"}</pre></div>
        <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Response headers ({response.headers.length})</summary><div className="mt-3 space-y-2">{response.headers.map(([key, value]) => <div key={key} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 text-xs"><span className="font-mono text-muted-foreground">{key}</span><span className="break-all">{value}</span></div>)}</div></details>
      </section>}

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground"><strong className="text-foreground">Ограничения браузера.</strong> Запросы выполняются напрямую с текущего сайта. Если сервер не разрешает CORS, браузер заблокирует чтение ответа. Это нельзя исправить настройкой внутри QA Navigator. Заголовки Authorization/Cookie/API-Key, секретные query-параметры и чувствительные поля JSON маскируются в локальной истории; при повторной загрузке их нужно ввести заново. Не вставляйте production-секреты на общедоступных устройствах.</div>
    </div>
  );
}
