import { adaptSqlForSqlite } from "./sql-dialect-compat.mjs";

const MAX_STATEMENTS = 50;
const MAX_ROWS_PER_RESULT = 500;

export function splitSqlStatements(sql) {
  const source = String(sql ?? "");
  const statements = [];
  let start = 0;
  let quote = "";
  let dollarQuote = "";
  let lineComment = false;
  let blockCommentDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (dollarQuote) {
      if (source.startsWith(dollarQuote, index)) {
        index += dollarQuote.length - 1;
        dollarQuote = "";
      }
      continue;
    }
    if (lineComment) {
      if (char === "\\n" || char === "\\r") lineComment = false;
      continue;
    }
    if (blockCommentDepth > 0) {
      if (char === "/" && next === "*") {
        blockCommentDepth += 1;
        index += 1;
      } else if (char === "*" && next === "/") {
        blockCommentDepth -= 1;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === quote) {
        if (next === quote) index += 1;
        else quote = "";
      } else if (char === "\\\\" && (quote === "'" || quote === "`") && next) {
        index += 1;
      }
      continue;
    }
    if (char === "-" && next === "-") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockCommentDepth = 1;
      index += 1;
      continue;
    }
    if (char === "#") {
      lineComment = true;
      continue;
    }
    if (char === "$") {
      const delimiter = source.slice(index).match(/^\\$[A-Za-z_][A-Za-z0-9_]*\\$|^\\$\\$/)?.[0];
      if (delimiter) {
        dollarQuote = delimiter;
        index += delimiter.length - 1;
        continue;
      }
    }
    if (char === "'" || char === '"' || char === "`" || char === "[") {
      quote = char === "[" ? "]" : char;
      continue;
    }
    if (char === ";") {
      const statement = source.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }

  if (quote) throw new Error("SQL содержит незакрытую строку или кавычку идентификатора.");
  if (dollarQuote) throw new Error("SQL содержит незакрытую dollar-quoted строку.");
  if (blockCommentDepth > 0) throw new Error("SQL содержит незакрытый комментарий /* ... */.");
  const last = source.slice(start).trim();
  if (last) statements.push(last);
  if (statements.length > MAX_STATEMENTS) throw new Error("За один запуск можно выполнить не более " + MAX_STATEMENTS + " SQL-инструкций.");
  return statements;
}

export function executeSqlBatch(database, sql, dialect = "postgres") {
  let statements;
  try {
    statements = splitSqlStatements(sql);
  } catch (error) {
    return { ok: false, statementCount: 0, results: [], error: error instanceof Error ? error.message : "Не удалось разобрать SQL." };
  }

  if (!statements.length) {
    return { ok: false, statementCount: 0, results: [], error: "Добавь SQL-инструкцию для выполнения." };
  }

  const results = [];
  for (const [index, statement] of statements.entries()) {
    try {
      const queryResults = database.exec(adaptSqlForSqlite(statement, dialect));
      const tables = queryResults.map((result) => {
        const rowCount = result.values.length;
        return {
          columns: result.columns,
          rows: result.values.slice(0, MAX_ROWS_PER_RESULT),
          rowCount,
          truncated: rowCount > MAX_ROWS_PER_RESULT,
        };
      });
      const affectedRows = database.getRowsModified();
      results.push({
        index: index + 1,
        sql: statement,
        tables,
        affectedRows: tables.length ? null : affectedRows,
        ok: true,
      });
    } catch (error) {
      return {
        ok: false,
        statementCount: statements.length,
        completedCount: results.length,
        results,
        error: error instanceof Error ? error.message : "Ошибка выполнения SQL.",
        failedStatement: index + 1,
        failedSql: statement,
      };
    }
  }

  return { ok: true, statementCount: statements.length, completedCount: results.length, results, error: null };
}

export const SQL_EXECUTION_LIMITS = Object.freeze({
  maxStatements: MAX_STATEMENTS,
  maxRowsPerResult: MAX_ROWS_PER_RESULT,
});
