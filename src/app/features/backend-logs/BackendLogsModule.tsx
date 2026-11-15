import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileSearch, Search, ShieldCheck, Trash2 } from "lucide-react";

type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE" | "UNKNOWN";
type LogEntry = { id: number; timestamp: string; level: LogLevel; service: string; message: string; raw: string; requestId: string };
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const SECRET_PATTERNS = [
  /(authorization\s*[:=]\s*)(bearer\s+)?[^\s,;]+/gi,
  /(password|passwd|token|api[_-]?key|secret)(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi,
  /([\w.+-]+)@([\w.-]+\.[A-Za-z]{2,})/g,
];

function maskSensitive(value: string): string {
  let result = value;
  result = result.replace(SECRET_PATTERNS[0], "$1[REDACTED]");
  result = result.replace(SECRET_PATTERNS[1], "$1$2[REDACTED]");
  result = result.replace(SECRET_PATTERNS[2], "[EMAIL_REDACTED]");
  return result;
}

function parseLine(line: string, index: number): LogEntry {
  let timestamp = "";
  let level: LogLevel = "UNKNOWN";
  let service = "";
  let message = line;
  let requestId = "";
  try {
    const parsed: unknown = JSON.parse(line);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const row = parsed as Record<string, unknown>;
      timestamp = String(row.timestamp ?? row.time ?? row["@timestamp"] ?? "");
      const rawLevel = String(row.level ?? row.severity ?? row.log_level ?? "").toUpperCase();
      if (["ERROR", "WARN", "INFO", "DEBUG", "TRACE"].includes(rawLevel)) level = rawLevel as LogLevel;
      service = String(row.service ?? row.logger ?? row.component ?? "");
      requestId = String(row.requestId ?? row.request_id ?? row.traceId ?? row.trace_id ?? "");
      message = String(row.message ?? row.msg ?? line);
    }
  } catch { /* plain text log */ }
  if (level === "UNKNOWN") {
    const match = line.match(/\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE)\b/i);
    if (match) level = match[1].toUpperCase().startsWith("WARN") ? "WARN" : match[1].toUpperCase() as LogLevel;
  }
  if (!timestamp) timestamp = line.match(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/)?.[0] ?? "";
  if (!requestId) requestId = line.match(/\b(?:request[_-]?id|trace[_-]?id)[=: ]+([\w-]+)/i)?.[1] ?? "";
  return { id: index, timestamp, level, service, message: maskSensitive(message), raw: maskSensitive(line), requestId };
}

function toCsv(rows: LogEntry[]): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return ["timestamp,level,service,requestId,message", ...rows.map((row) => [row.timestamp, row.level, row.service, row.requestId, row.message].map(quote).join(","))].join("\n");
}

export function BackendLogsModule() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | LogLevel>("ALL");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => entries.filter((entry) =>
    (level === "ALL" || entry.level === level) &&
    (!query || [entry.timestamp, entry.service, entry.requestId, entry.message].join(" ").toLowerCase().includes(query.toLowerCase()))
  ), [entries, level, query]);
  const counts = useMemo(() => entries.reduce((result, entry) => { result[entry.level] += 1; return result; }, { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0, UNKNOWN: 0 } as Record<LogLevel, number>), [entries]);
  const errorGroups = useMemo(() => {
    const groups = new Map<string, number>();
    entries.filter((entry) => entry.level === "ERROR").forEach((entry) => {
      const signature = entry.message.replace(/\b\d+\b/g, "#").slice(0, 180);
      groups.set(signature, (groups.get(signature) ?? 0) + 1);
    });
    return [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);

  const loadFile = async (file?: File) => {
    if (!file) return;
    setError("");
    if (file.size > MAX_FILE_BYTES) { setError("Файл больше 20 МБ. Разделите его на части и загрузите отдельно."); return; }
    setBusy(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length > 250000) { setError("В файле больше 250 000 строк. Уменьшите файл перед импортом."); return; }
      setEntries(lines.map(parseLine));
      setFileName(file.name);
      setQuery("");
      setLevel("ALL");
    } catch { setError("Не удалось прочитать файл. Проверьте формат и доступ к нему."); }
    finally { setBusy(false); }
  };

  const download = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "qa-navigator-filtered-logs.csv"; anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">BACKEND & LOGS / DIAGNOSTICS</p><h2 className="mt-1 text-2xl font-bold">Анализ backend-логов</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Загружайте логи из файла, находите ошибки, фильтруйте события и связывайте записи по request ID или trace ID. Файлы обрабатываются локально в браузере.</p></div><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Локальная обработка</div></div>
      <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <FileSearch className="mx-auto h-8 w-8 text-primary" /><h3 className="mt-2 font-semibold">Загрузить файл логов</h3><p className="mt-1 text-xs text-muted-foreground">Поддерживаются .log, .txt, .json, .jsonl и текстовые CSV. Максимум 20 МБ и 250 000 строк.</p>
        <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{busy ? "Чтение файла…" : "Выбрать файл"}<input type="file" accept=".log,.txt,.json,.jsonl,.csv,text/plain,application/json" className="sr-only" disabled={busy} onChange={(event) => void loadFile(event.target.files?.[0])} /></label>
        {fileName && <p className="mt-3 text-xs text-muted-foreground">Текущий файл: {fileName}</p>}
      </section>
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      {entries.length > 0 && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Всего событий</p><p className="mt-1 text-2xl font-bold">{entries.length.toLocaleString()}</p></div><div className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Ошибки</p><p className="mt-1 text-2xl font-bold text-destructive">{counts.ERROR}</p></div><div className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Предупреждения</p><p className="mt-1 text-2xl font-bold text-amber-500">{counts.WARN}</p></div><div className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Отфильтровано</p><p className="mt-1 text-2xl font-bold">{filtered.length.toLocaleString()}</p></div></div>
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Фильтры и поиск</h3><button type="button" onClick={download} className="inline-flex items-center gap-1.5 text-sm text-primary"><Download className="h-4 w-4" />Экспорт CSV</button></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Текст, сервис, request ID…" className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm" /></div><select aria-label="Уровень логирования" value={level} onChange={(event) => setLevel(event.target.value as "ALL" | LogLevel)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="ALL">Все уровни</option>{(["ERROR", "WARN", "INFO", "DEBUG", "TRACE", "UNKNOWN"] as LogLevel[]).map((item) => <option key={item}>{item}</option>)}</select></div></section>
        {errorGroups.length > 0 && <section className="rounded-2xl border border-border bg-card p-4"><h3 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-destructive" />Повторяющиеся ошибки</h3><div className="space-y-2">{errorGroups.map(([message, total]) => <div key={message} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm"><span className="break-all">{message}</span><span className="shrink-0 rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">{total}×</span></div>)}</div></section>}
        <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h3 className="font-semibold">События ({filtered.length.toLocaleString()})</h3><button type="button" onClick={() => { setEntries([]); setFileName(""); setQuery(""); setLevel("ALL"); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" />Очистить</button></div><div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="sticky top-0 bg-muted text-muted-foreground"><tr><th className="p-3">Время</th><th className="p-3">Уровень</th><th className="p-3">Сервис</th><th className="p-3">Сообщение</th></tr></thead><tbody>{filtered.slice(0, 2000).map((entry) => <tr key={entry.id} className="border-t border-border align-top"><td className="whitespace-nowrap p-3 font-mono">{entry.timestamp || "—"}</td><td className="p-3"><span className={entry.level === "ERROR" ? "font-bold text-destructive" : entry.level === "WARN" ? "font-semibold text-amber-500" : "text-muted-foreground"}>{entry.level}</span></td><td className="p-3">{entry.service || "—"}</td><td className="max-w-xl p-3"><p className="break-words">{entry.message}</p>{entry.requestId && <p className="mt-1 font-mono text-[10px] text-muted-foreground">request/trace: {entry.requestId}</p>}</td></tr>)}</tbody></table></div>{filtered.length > 2000 && <p className="border-t border-border p-3 text-xs text-muted-foreground">Показаны первые 2 000 строк. Экспорт CSV включает все отфильтрованные записи.</p>}</section>
      </>}
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground"><strong className="text-foreground">Защита данных:</strong> лог-файлы не отправляются на сервер и не сохраняются после закрытия страницы. Из отображаемых сообщений автоматически маскируются распространённые токены, пароли и email. Перед передачей логов коллегам всё равно проверяйте, не остались ли чувствительные данные в нестандартных полях.</div>
    </div>
  );
}
