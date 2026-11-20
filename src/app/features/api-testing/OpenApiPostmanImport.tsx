import { useRef, useState } from "react";
import { Download, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { parse as parseYaml } from "yaml";

type JsonObject = Record<string, unknown>;
type OpenApiOperation = {
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; type: "text" }[];
  query: { key: string; value: string; disabled?: boolean }[];
  path: { key: string; value: string }[];
  body?: string;
  description?: string;
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];
const asObject = (value: unknown): JsonObject => value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asText = (value: unknown, fallback = ""): string => typeof value === "string" ? value : fallback;
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function exampleForSchema(schemaValue: unknown): unknown {
  const schema = asObject(schemaValue);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum && Array.isArray(schema.enum)) return schema.enum[0];
  const type = asText(schema.type);
  if (type === "object") return Object.fromEntries(Object.entries(asObject(schema.properties)).map(([key, value]) => [key, exampleForSchema(value)]));
  if (type === "array") return [exampleForSchema(schema.items)];
  if (type === "integer" || type === "number") return 0;
  if (type === "boolean") return false;
  if (type === "string") return schema.format === "date-time" ? "2026-01-01T00:00:00Z" : "string";
  return {};
}

function resolveServer(document: JsonObject): string {
  const openApiServer = asObject(asArray(document.servers)[0]);
  if (asText(openApiServer.url)) return asText(openApiServer.url).replace(/\/$/, "");
  const host = asText(document.host);
  if (host) {
    const schemes = asArray(document.schemes).map(String);
    return `${schemes[0] || "https"}://${host}${asText(document.basePath, "")}`.replace(/\/$/, "");
  }
  return "https://api.example.com";
}

function convertOpenApiToPostman(document: JsonObject, fileName: string) {
  const version = asText(document.openapi) || asText(document.swagger);
  if (!version || !asObject(document.paths)) throw new Error("Файл не похож на OpenAPI 3.x или Swagger 2.0: отсутствуют openapi/swagger или paths.");
  const baseUrl = resolveServer(document);
  const operations: OpenApiOperation[] = [];

  for (const [path, pathValue] of Object.entries(asObject(document.paths))) {
    const pathItem = asObject(pathValue);
    for (const method of HTTP_METHODS) {
      const operation = asObject(pathItem[method]);
      if (!Object.keys(operation).length) continue;
      const parameters = [...asArray(pathItem.parameters), ...asArray(operation.parameters)].map(asObject);
      const pathParams = parameters.filter(p => asText(p.in) === "path");
      const queryParams = parameters.filter(p => asText(p.in) === "query");
      const headerParams = parameters.filter(p => asText(p.in) === "header");
      const renderedPath = path.replace(/\{([^}]+)\}/g, ":$1");
      const bodySchema = asObject(asObject(asObject(operation.requestBody).content)["application/json"]).schema;
      const swaggerBody = parameters.find(p => asText(p.in) === "body");
      const schema = bodySchema ?? asObject(swaggerBody).schema;
      const body = schema ? JSON.stringify(exampleForSchema(schema), null, 2) : undefined;
      const operationId = asText(operation.operationId);
      const summary = asText(operation.summary, operationId || `${method.toUpperCase()} ${path}`);
      const contentTypes = asObject(asObject(operation.requestBody).content);
      const hasJsonBody = Boolean(contentTypes["application/json"]) || Boolean(swaggerBody);
      operations.push({
        name: summary,
        method: method.toUpperCase(),
        url: `${baseUrl}${renderedPath}`,
        headers: [
          ...(hasJsonBody ? [{ key: "Content-Type", value: "application/json", type: "text" as const }] : []),
          ...headerParams.map(p => ({ key: asText(p.name), value: asText(p.example, asText(asObject(p.schema).example, "")), type: "text" as const })),
        ],
        query: queryParams.map(p => ({ key: asText(p.name), value: asText(p.example, asText(asObject(p.schema).example, "")), disabled: false })),
        path: pathParams.map(p => ({ key: asText(p.name), value: asText(p.example, asText(asObject(p.schema).example, `<${asText(p.name)}>`)) })),
        body,
        description: asText(operation.description),
      });
    }
  }
  if (!operations.length) throw new Error("В документе не найдено HTTP-операций.");
  const info = asObject(document.info);
  const collection = {
    info: {
      _postman_id: makeId(),
      name: asText(info.title, fileName.replace(/\.(json|ya?ml)$/i, "")) || "OpenAPI collection",
      description: asText(info.description, "Generated from OpenAPI / Swagger documentation."),
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: operations.map((operation) => ({
      name: operation.name,
      request: {
        method: operation.method,
        header: operation.headers,
        description: operation.description,
        url: {
          raw: operation.url,
          host: [new URL(operation.url.replace(/:[^/]+(?=\/|$)/g, "placeholder")).host],
          path: operation.url.replace(/^https?:\/\/[^/]+\/?/, "").split("/").filter(Boolean),
          query: operation.query,
          variable: operation.path,
        },
        ...(operation.body ? { body: { mode: "raw", raw: operation.body, options: { raw: { language: "json" } } } } : {}),
      },
      response: [],
    })),
  };
  return { collection, count: operations.length };
}

export function OpenApiPostmanImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const raw = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".yaml") || file.name.toLowerCase().endsWith(".yml")
        ? parseYaml(raw)
        : JSON.parse(raw);
      const { collection, count } = convertOpenApiToPostman(asObject(parsed), file.name);
      const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${collection.info.name.replace(/[^a-z0-9а-яё_-]+/gi, "-")}-postman.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`Создана Postman Collection 2.1: ${count} запросов. Импортируйте скачанный JSON в Postman через Import → Files.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось разобрать OpenAPI/Swagger-файл.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">Импорт Swagger / OpenAPI в Postman</h3>
          <p className="text-xs text-muted-foreground mt-1">Загрузите JSON или YAML документацию OpenAPI 3.x / Swagger 2.0. QA Navigator сформирует коллекцию Postman Collection 2.1 с endpoint, методами, параметрами и примерами JSON-тела.</p>
        </div>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          <FileUp className="h-4 w-4" /> {busy ? "Обработка…" : "Выбрать Swagger-файл"}
        </button>
        <input ref={inputRef} type="file" accept=".json,.yaml,.yml,application/json,text/yaml" className="hidden" onChange={event => void handleFile(event.target.files?.[0])} />
      </div>
      <p className="text-xs text-muted-foreground">После скачивания откройте Postman → Import → Files и выберите созданный JSON. Секреты и реальные токены не добавляются. Внешние схемы и сложные $ref не разрешаются автоматически; настройки авторизации и OAuth нужно проверить и настроить в Postman вручную.</p>
      {message && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    </section>
  );
}
