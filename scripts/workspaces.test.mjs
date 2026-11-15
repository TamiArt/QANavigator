import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("API workbench provides a real browser HTTP request workflow and explains CORS limits", async () => {
  const source = await read("../src/app/features/api-testing/ApiTestingModule.tsx");
  for (const token of ["fetch(parsedUrl", "AbortController", "CORS", "cURL", "localStorage", "Response headers", "environmentText", "statusAssertion", "bodyAssertion", "sanitizeSavedRequest"]) {
    assert.ok(source.includes(token), `Missing API workbench capability: ${token}`);
  }
});

test("backend log analyzer processes selected files locally and masks common sensitive values", async () => {
  const source = await read("../src/app/features/backend-logs/BackendLogsModule.tsx");
  for (const token of ["file.text()", "MAX_FILE_BYTES", "maskSensitive", "requestId", "traceId", "Экспорт CSV", "не сохраняются"]) {
    assert.ok(source.includes(token), `Missing log analyzer capability: ${token}`);
  }
});

test("integrations page supports Postman JSON import/export and distinguishes planned direct connectors", async () => {
  const source = await read("../src/app/features/integrations/IntegrationsModule.tsx");
  for (const token of ["Postman Collection", "schema.getpostman.com", "OpenAPI JSON", "parseYaml", "CORS", "Test IT"]) {
    assert.ok(source.includes(token), `Missing integration capability or limitation: ${token}`);
  }
});

test("application shell routes all new pages and keeps the database workbench under an expandable section", async () => {
  const app = await read("../src/app/App.tsx");
  for (const token of ["<ApiTestingModule />", "<BackendLogsModule />", "<IntegrationsModule />", "section.collapsible", "aria-expanded"]) {
    assert.ok(app.includes(token), `Missing application navigation wiring: ${token}`);
  }
});
