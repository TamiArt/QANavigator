import { useMemo, useState } from "react";
import { parse as parseYaml } from "yaml";
import { ArrowUpRight, CheckCircle2, Download, FileJson, FileUp, Link2, ShieldCheck, Upload } from "lucide-react";

type ImportedRequest = { name: string; method: string; url: string };
type ImportSummary = { kind: string; fileName: string; details: string[] };

function flattenPostmanItems(items: unknown[], result: ImportedRequest[]) {
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (Array.isArray(item.item)) flattenPostmanItems(item.item, result);
    if (item.request && typeof item.request === "object") {
      const request = item.request as Record<string, unknown>;
      const method = String(request.method ?? "GET").toUpperCase();
      const requestUrl = request.url;
      const url = typeof requestUrl === "string" ? requestUrl : requestUrl && typeof requestUrl === "object"
        ? String((requestUrl as Record<string, unknown>).raw ?? "") : "";
      result.push({ name: String(item.name ?? "Untitled request"), method, url });
    }
  }
}

export function IntegrationsModule() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [requests, setRequests] = useState<ImportedRequest[]>([]);
  const [postmanCollection, setPostmanCollection] = useState<unknown | null>(null);
  const [sourceType, setSourceType] = useState<"postman" | "openapi" | null>(null);
  const [postmanEnvironment, setPostmanEnvironment] = useState<unknown | null>(null);
  const [environmentName, setEnvironmentName] = useState("");
  const [error, setError] = useState("");
  const [openApiText, setOpenApiText] = useState("");
  const [openApiName, setOpenApiName] = useState("");
  const [busy, setBusy] = useState(false);

  const requestMethods = useMemo(() => requests.reduce<Record<string, number>>((acc, request) => { acc[request.method] = (acc[request.method] ?? 0) + 1; return acc; }, {}), [requests]);

  const importPostman = async (file?: File) => {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Файл больше 5 МБ.");
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !("info" in parsed) || !("item" in parsed) || !Array.isArray((parsed as { item: unknown }).item) || !(parsed as { info: unknown }).info || typeof (parsed as { info: unknown }).info !== "object") {
        throw new Error("Файл не похож на Postman Collection v2.1 JSON.");
      }
      const list: ImportedRequest[] = [];
      flattenPostmanItems((parsed as { item: unknown[] }).item, list);
      setRequests(list);
      setPostmanCollection(parsed);
      setSourceType("postman");
      setSummary({ kind: "Postman Collection", fileName: file.name, details: [`Найдено запросов: ${list.length}`, `Коллекция: ${String(((parsed as { info: Record<string, unknown> }).info).name ?? "без названия")}`] });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось прочитать коллекцию."); }
    finally { setBusy(false); }
  };

  const importPostmanEnvironment = async (file?: File) => {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("Файл окружения больше 2 МБ.");
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !("values" in parsed) || !Array.isArray((parsed as { values: unknown }).values)) {
        throw new Error("Ожидается Postman Environment JSON с массивом values.");
      }
      setPostmanEnvironment(parsed);
      setEnvironmentName(file.name);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось прочитать окружение."); }
    finally { setBusy(false); }
  };

  const exportEnvironment = () => {
    if (!postmanEnvironment) return;
    const blob = new Blob([JSON.stringify(postmanEnvironment, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "qa-navigator.postman_environment.json"; anchor.click(); URL.revokeObjectURL(url);
  };

  const importOpenApi = async (file?: File) => {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Файл больше 5 МБ.");
      const text = await file.text();
      const isYaml = /\.ya?ml$/i.test(file.name);
      const parsed: unknown = isYaml ? parseYaml(text) : JSON.parse(text);
      setPostmanCollection(null);
      setSourceType("openapi");
      if (!parsed || typeof parsed !== "object" || !("openapi" in parsed) || !("paths" in parsed)) {
        throw new Error("Ожидается OpenAPI 3.x YAML или JSON со свойствами openapi и paths.");
      }
      const spec = parsed as { openapi: string; info?: { title?: string; version?: string }; paths: Record<string, Record<string, unknown>> };
      if (typeof spec.openapi !== "string" || !spec.openapi.startsWith("3.") || !spec.paths || typeof spec.paths !== "object" || Array.isArray(spec.paths)) {
        throw new Error("Поддерживается OpenAPI 3.x с объектом paths.");
      }
      const operations = Object.entries(spec.paths).flatMap(([path, methods]) => {
        if (!methods || typeof methods !== "object" || Array.isArray(methods)) return [];
        return Object.entries(methods)
          .filter(([method, value]) => ["get", "post", "put", "patch", "delete", "head", "options"].includes(method.toLowerCase()) && Boolean(value && typeof value === "object"))
          .map(([method, value]) => ({ name: String((value as Record<string, unknown>).summary ?? `${method.toUpperCase()} ${path}`), method: method.toUpperCase(), url: path }));
      });
      setOpenApiText(text); setOpenApiName(file.name); setRequests(operations);
      setSummary({ kind: isYaml ? "OpenAPI YAML" : "OpenAPI JSON", fileName: file.name, details: [`Версия: ${spec.openapi}`, `Спецификация: ${spec.info?.title ?? "без названия"}`, `Операций найдено: ${operations.length}`] });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось прочитать OpenAPI."); }
    finally { setBusy(false); }
  };

  const exportRequests = () => {
    const collection = postmanCollection ?? {
      info: { name: "QA Navigator export", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
      item: requests.map((request) => ({ name: request.name, request: { method: request.method, url: request.url } })),
    };
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "qa-navigator-collection.postman_collection.json"; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div><p className="text-sm text-muted-foreground">INTEGRATIONS / DATA EXCHANGE</p><h2 className="mt-1 text-2xl font-bold">Интеграции и обмен данными</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Переносите коллекции и спецификации между QA Navigator и внешними инструментами. Основной сценарий работает через файлы и официальные ссылки — подключать аккаунты необязательно.</p></div>
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /><h3 className="font-semibold">Postman</h3></div><p className="text-sm text-muted-foreground">Импорт и экспорт Postman Collection v2.1 JSON без потери исходных параметров, а также импорт и экспорт Postman Environment JSON.</p><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />{busy ? "Чтение…" : "Импорт коллекции"}<input type="file" accept=".json,application/json" className="sr-only" disabled={busy} onChange={(event) => void importPostman(event.target.files?.[0])} /></label><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />Импорт окружения<input type="file" accept=".json,application/json" className="sr-only" disabled={busy} onChange={(event) => void importPostmanEnvironment(event.target.files?.[0])} /></label>{postmanEnvironment !== null && <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>Окружение: {environmentName}</span><button type="button" onClick={exportEnvironment} className="text-primary">Экспорт environment JSON</button></div>}<a href="https://www.postman.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">Открыть Postman <ArrowUpRight className="h-3 w-3" /></a></div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex items-center gap-2"><FileUp className="h-5 w-5 text-primary" /><h3 className="font-semibold">Swagger / OpenAPI</h3></div><p className="text-sm text-muted-foreground">Импорт OpenAPI 3.x YAML/JSON с локальным разбором структуры и извлечением операций из paths.</p><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />Импорт OpenAPI<input type="file" accept=".json,.yaml,.yml,application/json,text/yaml" className="sr-only" disabled={busy} onChange={(event) => void importOpenApi(event.target.files?.[0])} /></label><a href="https://editor.swagger.io/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">Открыть Swagger Editor <ArrowUpRight className="h-3 w-3" /></a></div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /><h3 className="font-semibold">Elasticsearch / Kibana</h3></div><p className="text-sm text-muted-foreground">Загружайте экспортированные логи в раздел Backend & Logs. Прямой доступ возможен только при разрешённом CORS, корректной авторизации и политике вашего сервера.</p><div className="flex flex-wrap gap-3"><a href="https://www.elastic.co/elasticsearch" target="_blank" rel="noreferrer" className="text-xs text-primary">Elasticsearch <ArrowUpRight className="inline h-3 w-3" /></a><a href="https://www.elastic.co/kibana" target="_blank" rel="noreferrer" className="text-xs text-primary">Kibana <ArrowUpRight className="inline h-3 w-3" /></a></div></div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h3 className="font-semibold">Test IT</h3></div><p className="text-sm text-muted-foreground">Поддержка API зависит от версии, прав и CORS конкретного экземпляра. На этом этапе доступна документация; прямое подключение и синхронизация ещё не реализованы.</p><a href="https://docs.testit.software/user-guide/work-with-api.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">Документация Test IT API <ArrowUpRight className="h-3 w-3" /></a></div>
      </section>
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      {summary && <section className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">Последний импорт</p><h3 className="font-semibold">{summary.kind}</h3><p className="text-xs text-muted-foreground">{summary.fileName}</p></div><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div><ul className="space-y-1 text-sm">{summary.details.map((detail) => <li key={detail}>• {detail}</li>)}</ul>{requests.length > 0 && <><div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"><p className="text-xs text-muted-foreground">Методы: {Object.entries(requestMethods).map(([method, count]) => `${method} ${count}`).join(" · ")}</p>{sourceType === "postman" && <button type="button" onClick={exportRequests} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"><Download className="h-3.5 w-3.5" />Экспорт исходной коллекции</button>}</div><div className="max-h-72 overflow-auto rounded-lg border border-border">{requests.map((request, index) => <div key={index} className="flex flex-wrap gap-2 border-b border-border p-2 text-xs last:border-0"><span className="w-16 font-bold text-primary">{request.method}</span><span className="min-w-0 flex-1 break-all">{request.name} — {request.url}</span></div>)}</div></>}</section>}
      {openApiText && <details className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer text-sm font-medium">Просмотр спецификации: {openApiName}</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs">{openApiText}</pre></details>}
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground"><strong className="text-foreground">Безопасность и совместимость.</strong> Прямые API-подключения к сторонним сервисам пока не реализованы. Не вставляйте долговременные токены в общие браузеры; не ослабляйте CORS и не обходите SSO, TLS, firewall или права доступа. Перед импортом проверяйте данные и предупреждения о неподдерживаемых полях.</div>
    </div>
  );
}
