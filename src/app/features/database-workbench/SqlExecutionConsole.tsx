import { useEffect, useRef, useState } from "react";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { AlertTriangle, Database as DatabaseIcon, Play, RotateCcw } from "lucide-react";
import { SQL_TRAINER_SEED_SQL } from "./sql-seed.mjs";
import { executeSqlBatch, type SqlBatchResult } from "./sql-execution.mjs";
import { registerSqlCompatibilityFunctions } from "./sql-dialect-compat.mjs";

const DEFAULT_SQL = `DROP TABLE IF EXISTS ordering;
CREATE TABLE ordering AS
SELECT author, title,
       (SELECT AVG(amount) FROM book) AS amount
FROM book
WHERE amount < (SELECT AVG(amount) FROM book);
SELECT * FROM ordering;`;

type Props = { generatedSql: string; generatedError?: string; dialect: "postgres" | "mysql" };

export function SqlExecutionConsole({ generatedSql, generatedError, dialect }: Props) {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState("");
  const [running, setRunning] = useState(false);
  const [batch, setBatch] = useState<SqlBatchResult | null>(null);
  const databaseRef = useRef<Database | null>(null);
  const engineRef = useRef<SqlJsStatic | null>(null);

  useEffect(() => {
    let active = true;
    initSqlJs({ locateFile: () => wasmUrl })
      .then((SQL) => {
        if (!active) return;
        const database = new SQL.Database();
        registerSqlCompatibilityFunctions(database);
        database.run(SQL_TRAINER_SEED_SQL);
        engineRef.current = SQL;
        databaseRef.current = database;
        setReady(true);
      })
      .catch((error: unknown) => {
        if (active) setInitializationError(error instanceof Error ? error.message : "Не удалось загрузить SQL-движок.");
      });
    return () => {
      active = false;
      databaseRef.current?.close();
      databaseRef.current = null;
      engineRef.current = null;
    };
  }, []);

  const run = () => {
    if (!databaseRef.current || running) return;
    setRunning(true);
    try {
      setBatch(executeSqlBatch(databaseRef.current, sql, dialect));
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    const SQL = engineRef.current;
    if (!SQL) return;
    databaseRef.current?.close();
    const database = new SQL.Database();
    registerSqlCompatibilityFunctions(database);
    database.run(SQL_TRAINER_SEED_SQL);
    databaseRef.current = database;
    setBatch(null);
  };

  return (
    <section className="space-y-3 rounded-xl border border-primary/25 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold"><DatabaseIcon className="h-4 w-4 text-primary" />4. Выполнение SQL</div>
          <p className="mt-1 text-xs text-muted-foreground">Запросы выполняются в отдельной SQLite-базе прямо в браузере. Данные учебные и сбрасываются при перезагрузке страницы.</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${ready ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{ready ? "Движок готов" : "Загрузка движка…"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSql(generatedSql)} disabled={!generatedSql || Boolean(generatedError)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:opacity-40">Подставить собранный SQL</button>
        <button type="button" onClick={reset} disabled={!ready || running} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Сбросить БД</button>
      </div>

      <label className="block text-xs font-medium text-muted-foreground" htmlFor="sql-execution-editor">SQL-скрипт — можно несколько инструкций через ;</label>
      <textarea id="sql-execution-editor" value={sql} onChange={(event) => setSql(event.target.value)} spellCheck={false} className="min-h-48 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground outline-none focus:ring-2 focus:ring-primary/40" />
      <button type="button" onClick={run} disabled={!ready || running || !sql.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4" />{running ? "Выполнение…" : "Выполнить SQL"}</button>

      {initializationError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Не удалось запустить SQLite: {initializationError}</div>}
      {batch && (
        <div className="space-y-3" aria-live="polite">
          <div className={`rounded-lg border p-3 text-xs ${batch.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
            {batch.ok ? `Успешно выполнено инструкций: ${batch.completedCount}.` : `Ошибка в инструкции №${batch.failedStatement ?? "—"}: ${batch.error}`}
            {!batch.ok && (batch.completedCount ?? 0) > 0 && <p className="mt-1 text-muted-foreground">До ошибки успешно выполнено: {batch.completedCount}. Изменения этих инструкций уже применены к учебной БД.</p>}
          </div>
          {batch.results.map((result) => (
            <article key={result.index} className="overflow-hidden rounded-lg border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold">Инструкция {result.index}</span>
                <span className="text-[11px] text-muted-foreground">{result.tables.length ? `Наборов результатов: ${result.tables.length}` : `Изменено строк: ${result.affectedRows ?? 0}`}</span>
              </div>
              {result.tables.length ? result.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-muted/30"><tr>{table.columns.map((column, columnIndex) => <th key={columnIndex} className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">{column}</th>)}</tr></thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => <tr key={rowIndex} className="odd:bg-background even:bg-muted/20">{row.map((value, columnIndex) => <td key={columnIndex} className="max-w-64 border-b border-border/60 px-3 py-2 align-top"><span className={value === null ? "italic text-muted-foreground" : "text-foreground"}>{value === null ? "NULL" : value instanceof Uint8Array ? "[BLOB]" : String(value)}</span></td>)}</tr>)}
                    </tbody>
                  </table>
                  <p className="px-3 py-2 text-[11px] text-muted-foreground">Строк в результате: {table.rowCount}{table.truncated ? ` (показаны первые ${table.rows.length})` : ""}</p>
                </div>
              )) : <p className="px-3 py-3 text-xs text-muted-foreground">Инструкция выполнена. Табличного результата нет.</p>}
            </article>
          ))}
          {!batch.ok && batch.failedSql && <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs"><AlertTriangle className="h-4 w-4 shrink-0 text-destructive" /><code className="whitespace-pre-wrap break-all">{batch.failedSql}</code></div>}
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">Важно: используется SQLite в WebAssembly, а не сервер PostgreSQL/MySQL. Выбранный диалект: {dialect === "postgres" ? "PostgreSQL" : "MySQL"}. Совместимый синтаксис адаптируется для SQLite; специфичные возможности сервера, расширения и типы данных могут отличаться. База изолирована в памяти браузера и не имеет доступа к внешним данным.</p>
    </section>
  );
}
