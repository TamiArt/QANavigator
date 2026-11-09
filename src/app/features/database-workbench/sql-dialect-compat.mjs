const IDENTIFIER = String.raw`[A-Za-z_][A-Za-z0-9_$]*(?:\.[A-Za-z_][A-Za-z0-9_$]*)?`;
const TYPE_NAME = String.raw`(?:BIGINT|INT|INTEGER|SMALLINT|DECIMAL(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?|NUMERIC(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?|VARCHAR(?:\s*\(\s*\d+\s*\))?|CHAR(?:\s*\(\s*\d+\s*\))?|TEXT|DATE|DATETIME|TIMESTAMP|BOOLEAN|REAL|DOUBLE(?:\s+PRECISION)?|JSONB?|UUID)`;

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
      } else if (char === "\\" && quote === "'" && next) {
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
  result = result.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(new RegExp(String.raw`(${IDENTIFIER})\s*::\s*(${TYPE_NAME})`, "gi"), "CAST($1 AS $2)");
  result = result.replace(/\bILIKE\b/gi, "LIKE");
  result = result.replace(/\bBIGSERIAL\s+PRIMARY\s+KEY\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(/\bSMALLSERIAL\s+PRIMARY\s+KEY\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(/\b(?:SERIAL|BIGSERIAL|SMALLSERIAL)\b/gi, "INTEGER");
  result = result.replace(/\bJSONB\b/gi, "TEXT");
  result = result.replace(/\bJSONB_OBJECTAGG\s*\(/gi, "JSON_OBJECTAGG(");
  return result;
}

function adaptMysql(code) {
  let result = code;
  result = result.replace(/\bSTDDEV\s*\(/gi, "STDDEV_POP(");
  result = result.replace(/\bSTD\s*\(/gi, "STDDEV_POP(");
  result = result.replace(/\bVARIANCE\s*\(/gi, "VAR_POP(");
  result = result.replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, "INSERT OR IGNORE INTO");
  result = result.replace(/\bON\s+DUPLICATE\s+KEY\s+UPDATE\b/gi, "ON CONFLICT DO UPDATE SET");
  result = result.replace(/\bVALUES\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/gi, "excluded.$1");
  result = result.replace(/\b(?:BIGINT|INT|INTEGER|SMALLINT)\s+UNSIGNED\b/gi, "$&");
  result = result.replace(/\bUNSIGNED\b/gi, "");
  result = result.replace(/\b(?:INT|INTEGER|BIGINT)\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  result = result.replace(/\bAUTO_INCREMENT\b/gi, "AUTOINCREMENT");
  result = result.replace(/\bENGINE\s*=\s*[A-Za-z_][A-Za-z0-9_]*/gi, "");
  result = result.replace(/\bDEFAULT\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, "DEFAULT CURRENT_TIMESTAMP");
  result = result.replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, "");
  result = result.replace(/\bTINYINT\s*\(\s*1\s*\)/gi, "INTEGER");
  result = result.replace(/\bDATETIME\b/gi, "TEXT");
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
    return adapted.replace(/\bNOW\s*\(\s*\)/gi, "CURRENT_TIMESTAMP");
  });
}

function numericValues(values) {
  return values.filter((value) => value !== null && value !== undefined).map(Number).filter(Number.isFinite);
}

function statisticalAggregate(kind, sample = false) {
  return {
    init: () => ({ count: 0, mean: 0, m2: 0, values: [] }),
    step: (state, value) => {
      if (value === null || value === undefined) return state;
      const number = Number(value);
      if (!Number.isFinite(number)) return state;
      state.count += 1;
      const delta = number - state.mean;
      state.mean += delta / state.count;
      state.m2 += delta * (number - state.mean);
      state.values.push(number);
      return state;
    },
    finalize: (state) => {
      if (!state.count) return null;
      if (kind === "median") {
        const sorted = state.values.sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
      }
      if (kind === "stddev" || kind === "variance") {
        if (sample && state.count < 2) return null;
        const variance = state.m2 / (sample ? state.count - 1 : state.count);
        return kind === "stddev" ? Math.sqrt(variance) : variance;
      }
      return null;
    },
  };
}

/** Register aggregate names commonly used by PostgreSQL and MySQL on the local SQLite engine. */
export function registerSqlCompatibilityFunctions(database) {
  if (typeof database?.create_function !== "function") return;
  database.create_function("CONCAT", (...values) => values.map((value) => value == null ? "" : String(value)).join(""));
  database.create_function("IF", (condition, whenTrue, whenFalse) => condition ? whenTrue : whenFalse);
  database.create_function("GREATEST", (...values) => values.some((value) => value == null) ? null : Math.max(...values.map(Number)));
  database.create_function("LEAST", (...values) => values.some((value) => value == null) ? null : Math.min(...values.map(Number)));

  if (typeof database.create_aggregate !== "function") return;
  const register = (name, aggregate) => database.create_aggregate(name, aggregate);
  for (const [name, kind, sample] of [
    ["STDDEV", "stddev", true], ["STD", "stddev", true],
    ["STDDEV_SAMP", "stddev", true], ["STDDEV_POP", "stddev", false],
    ["VARIANCE", "variance", true], ["VAR_SAMP", "variance", true], ["VAR_POP", "variance", false],
    ["MEDIAN", "median", false],
  ]) register(name, statisticalAggregate(kind, sample));

  register("BOOL_AND", {
    init: () => null,
    step: (state, value) => value == null ? state : state === null ? Boolean(value) : state && Boolean(value),
    finalize: (state) => state,
  });
  register("BOOL_OR", {
    init: () => null,
    step: (state, value) => value == null ? state : state === null ? Boolean(value) : state || Boolean(value),
    finalize: (state) => state,
  });
  register("EVERY", {
    init: () => null,
    step: (state, value) => value == null ? state : state === null ? Boolean(value) : state && Boolean(value),
    finalize: (state) => state,
  });
  register("BIT_AND", {
    init: () => null,
    step: (state, value) => value == null ? state : state === null ? Number(value) | 0 : state & (Number(value) | 0),
    finalize: (state) => state,
  });
  register("BIT_OR", {
    init: () => null,
    step: (state, value) => value == null ? state : state === null ? Number(value) | 0 : state | (Number(value) | 0),
    finalize: (state) => state,
  });
  register("BIT_XOR", {
    init: () => null,
    step: (state, value) => value == null ? state : state === null ? Number(value) | 0 : state ^ (Number(value) | 0),
    finalize: (state) => state,
  });
  register("ANY_VALUE", {
    init: () => null,
    step: (state, value) => state === null && value !== null ? value : state,
    finalize: (state) => state,
  });
  const collect = {
    init: () => [],
    step: (state, value) => { state.push(value === undefined ? null : value); return state; },
    finalize: (state) => state.length ? JSON.stringify(state) : null,
  };
  for (const name of ["ARRAY_AGG", "JSON_AGG", "JSONB_AGG", "JSON_ARRAYAGG"]) register(name, collect);
  register("JSON_OBJECTAGG", {
    init: () => ({}),
    step: (state, key, value) => { if (key !== null && key !== undefined) state[String(key)] = value === undefined ? null : value; return state; },
    finalize: (state) => Object.keys(state).length ? JSON.stringify(state) : null,
  });
  register("STRING_AGG", {
    init: () => null,
    step: (state, value, separator) => value == null ? state : state === null ? String(value) : state + (separator == null ? "" : String(separator)) + String(value),
    finalize: (state) => state,
  });
}
