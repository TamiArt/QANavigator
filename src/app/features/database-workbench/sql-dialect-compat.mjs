const IDENTIFIER = String.raw`[A-Za-z_][A-Za-z0-9_$]*(?:\\.[A-Za-z_][A-Za-z0-9_$]*)?`;
const TYPE_NAME = String.raw`(?:BIGINT|INT|INTEGER|SMALLINT|DECIMAL(?:\\s*\\(\\s*\\d+(?:\\s*,\\s*\\d+)?\\s*\\))?|NUMERIC(?:\\s*\\(\\s*\\d+(?:\\s*,\\s*\\d+)?\\s*\\))?|VARCHAR(?:\\s*\\(\\s*\\d+\\s*\\))?|CHAR(?:\\s*\\(\\s*\\d+\\s*\\))?|TEXT|DATE|DATETIME|TIMESTAMP|BOOLEAN|REAL|DOUBLE(?:\\s+PRECISION)?|JSONB?|UUID)`;

function transformCodeSegments(sql, transform) {
  let output = "";
  let code = "";
  let quote = "";
  let lineComment = false;
  let blockComment = false;
  const flush = () => {
    if (code) output += transform(code);
    code = "";
  };

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];
    if (lineComment) {
      flush();
      output += char;
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      flush();
      output += char;
      if (char === "*" && next === "/") {
        output += next;
        index += 1;
        blockComment = false;
      }
      continue;
    }
    if (quote) {
      flush();
      output += char;
      if (char === quote) {
        if (next === quote) {
          output += next;
          index += 1;
        } else quote = "";
      } else if (char === "\\\\" && quote === "'" && next) {
        output += next;
        index += 1;
      }
      continue;
    }
    if (char === "-" && next === "-") {
      flush();
      output += char + next;
      index += 1;
      lineComment = true;
    } else if (char === "/" && next === "*") {
      flush();
      output += char + next;
      index += 1;
      blockComment = true;
    } else if (char === "'" || char === "\"" || char === "`" || char === "[") {
      flush();
      output += char;
      quote = char === "[" ? "]" : char;
    } else {
      code += char;
    }
  }
  flush();
  return output;
}

function adaptPostgres(code) {
  let result = code;
  result = result.replace(new RegExp("(" + IDENTIFIER + ")\\s*::\\s*(" + TYPE_NAME + ")", "gi"), "CAST($1 AS $2)");
  result = result.replace(new RegExp("(" + IDENTIFIER + "|\\d+(?:\\.\\d+)?|'(?:''|[^'])*')\\s+ILIKE\\s+(" + IDENTIFIER + "|'[^']*'|\\?)", "gi"), "LOWER($1) LIKE LOWER($2)");
  result = result.replace(/\\bSERIAL\\s+PRIMARY\\s+KEY\\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(/\\bBIGSERIAL\\s+PRIMARY\\s+KEY\\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(/\\bSMALLSERIAL\\s+PRIMARY\\s+KEY\\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(/\\b(?:SERIAL|BIGSERIAL|SMALLSERIAL)\\b/gi, "INTEGER");
  result = result.replace(/\\bJSONB\\b/gi, "TEXT");
  return result;
}

function adaptMysql(code) {
  let result = code;
  result = result.replace(/\\bINSERT\\s+IGNORE\\s+INTO\\b/gi, "INSERT OR IGNORE INTO");
  result = result.replace(/\\b(?:BIGINT|INT|INTEGER|SMALLINT)\\s+UNSIGNED\\b/gi, "$&");
  result = result.replace(/\\bUNSIGNED\\b/gi, "");
  result = result.replace(/\\bAUTO_INCREMENT\\b/gi, "AUTOINCREMENT");
  result = result.replace(/\\bENGINE\\s*=\\s*[A-Za-z_][A-Za-z0-9_]*/gi, "");
  result = result.replace(/\\bDEFAULT\\s+ON\\s+UPDATE\\s+CURRENT_TIMESTAMP\\b/gi, "DEFAULT CURRENT_TIMESTAMP");
  result = result.replace(/\\bON\\s+UPDATE\\s+CURRENT_TIMESTAMP\\b/gi, "");
  result = result.replace(/\\bTINYINT\\s*\\(\\s*1\\s*\\)/gi, "INTEGER");
  result = result.replace(/\\bDATETIME\\b/gi, "TEXT");
  return result;
}

/**
 * Adapts a useful, deliberately bounded subset of PostgreSQL/MySQL syntax to SQLite.
 * This is a compatibility layer, not a PostgreSQL/MySQL server emulator.
 */
export function adaptSqlForSqlite(sql, dialect = "postgres") {
  const normalizedDialect = dialect === "mysql" ? "mysql" : "postgres";
  return transformCodeSegments(String(sql ?? ""), (code) => {
    const adapted = normalizedDialect === "mysql" ? adaptMysql(code) : adaptPostgres(code);
    return adapted.replace(/\\bNOW\\s*\\(\\s*\\)/gi, "CURRENT_TIMESTAMP");
  });
}

export function registerSqlCompatibilityFunctions(database) {
  if (typeof database?.create_function !== "function") return;
  database.create_function("CONCAT", (...values) => values.map((value) => value == null ? "" : String(value)).join(""));
  database.create_function("IF", (condition, whenTrue, whenFalse) => condition ? whenTrue : whenFalse);
  database.create_function("GREATEST", (...values) => values.some((value) => value == null) ? null : Math.max(...values.map(Number)));
  database.create_function("LEAST", (...values) => values.some((value) => value == null) ? null : Math.min(...values.map(Number)));
}
