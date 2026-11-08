const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TYPES = new Set(["INT","INTEGER","BIGINT","SMALLINT","TINYINT","DECIMAL","NUMERIC","FLOAT","DOUBLE","REAL","BOOLEAN","BOOL","DATE","TIME","TIMESTAMP","DATETIME","TEXT","CHAR","VARCHAR","BINARY","VARBINARY","BLOB","JSON","JSONB","UUID"]);
const OPERATORS = new Set(["=", "<>", "!=", ">", ">=", "<", "<="]);

function fail(message) { throw new Error(message); }
function identifier(value, label = "имя") {
  const name = String(value || "").trim();
  if (!IDENTIFIER.test(name)) fail("Проверь " + label + ": допустимы латинские буквы, цифры и подчёркивание; первый символ — буква или _.");
  return name;
}
function quote(name, dialect) {
  const value = identifier(name);
  return dialect === "mysql" ? "\`" + value + "\`" : '"' + value + '"';
}
function literal(value) {
  const input = String(value ?? "").trim();
  if (!input) fail("Значение не может быть пустым.");
  if (/^-?\d+(?:\.\d+)?$/.test(input) || /^(?:NULL|TRUE|FALSE|CURRENT_DATE|CURRENT_TIMESTAMP)$/i.test(input)) return input;
  if (/^'.*(?:''.*)*'$/.test(input)) return input;
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(input) && /^(?:CURRENT_TIMESTAMP|CURRENT_DATE|NOW|UUID)\s*\(\s*\)$/i.test(input)) return input;
  return "'" + input.replace(/'/g, "''") + "'";
}
function parseColumnDefinition(line, index, dialect) {
  const trimmed = line.trim();
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z]+)(?:\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\))?(.*)$/);
  if (!match) fail("Столбец №" + (index + 1) + ": укажи имя, тип и необязательные ограничения.");
  const name = identifier(match[1], "имя столбца");
  const type = match[2].toUpperCase();
  if (!TYPES.has(type)) fail("Столбец " + name + ": неподдерживаемый тип данных " + type + ".");
  const length = match[3] ? Number(match[3]) : null;
  const scale = match[4] ? Number(match[4]) : null;
  if (length !== null && (length < 1 || length > 1000000)) fail("Столбец " + name + ": недопустимая длина типа.");
  if (scale !== null && (scale > length || scale > 30)) fail("Столбец " + name + ": недопустимая точность DECIMAL/NUMERIC.");
  if ((length !== null && !["CHAR","VARCHAR","BINARY","VARBINARY","DECIMAL","NUMERIC"].includes(type)) || (scale !== null && !["DECIMAL","NUMERIC"].includes(type))) fail("Столбец " + name + ": параметры длины/точности не подходят типу " + type + ".");
  let rest = match[5].trim();
  if (/[;]|--|\/\*|\*\/|[\r\n]/.test(rest)) fail("Столбец " + name + ": недопустимые символы в ограничениях.");
  const clauses = [];
  if (/^NOT\s+NULL\b/i.test(rest)) { clauses.push("NOT NULL"); rest = rest.replace(/^NOT\s+NULL\b/i, "").trim(); }
  else if (/^NULL\b/i.test(rest)) { clauses.push("NULL"); rest = rest.replace(/^NULL\b/i, "").trim(); }
  if (/^UNIQUE\b/i.test(rest)) { clauses.push("UNIQUE"); rest = rest.replace(/^UNIQUE\b/i, "").trim(); }
  if (/^PRIMARY\s+KEY\b/i.test(rest)) { clauses.push("PRIMARY KEY"); rest = rest.replace(/^PRIMARY\s+KEY\b/i, "").trim(); }
  const defaultMatch = rest.match(/^DEFAULT\s+((?:'[^']*(?:''[^']*)*')|(?:-?\d+(?:\.\d+)?)|(?:NULL|TRUE|FALSE|CURRENT_DATE|CURRENT_TIMESTAMP))(.*)$/i);
  if (defaultMatch) { clauses.push("DEFAULT " + defaultMatch[1]); rest = defaultMatch[2].trim(); }
  const referenceMatch = rest.match(/^REFERENCES\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)(.*)$/i);
  if (referenceMatch) { clauses.push("REFERENCES " + quote(referenceMatch[1], dialect) + " (" + quote(referenceMatch[2], dialect) + ")"); rest = referenceMatch[3].trim(); }
  const checkMatch = rest.match(/^CHECK\s*\(\s*([A-Za-z_][A-Za-z0-9_]*(?:\s*(?:=|<>|!=|>=|<=|>|<)\s*(?:-?\d+(?:\.\d+)?|'[^']*'|TRUE|FALSE|NULL))?)\s*\)(.*)$/i);
  if (checkMatch) { clauses.push("CHECK (" + checkMatch[1] + ")"); rest = checkMatch[2].trim(); }
  if (rest) fail("Столбец " + name + ": не удалось разобрать ограничение " + rest + ".");
  return quote(name, dialect) + " " + type + (length !== null ? "(" + length + (scale !== null ? "," + scale : "") + ")" : "") + (clauses.length ? " " + clauses.join(" ") : "");
}
export function buildCreateTable(config) {
  const dialect = config.dialect || "postgres";
  const table = quote(config.table, dialect);
  const lines = String(config.columns || "").split("\n").map((x) => x.trim()).filter(Boolean);
  if (!lines.length) fail("Добавь хотя бы одно определение столбца.");
  const definitions = lines.map((line, index) => parseColumnDefinition(line, index, dialect));
  if (new Set(lines.map((line) => line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)/)?.[1].toLowerCase())).size !== lines.length) fail("Имена столбцов должны быть уникальными.");
  const constraints = [];
  const primary = lines.filter((line) => /\bPRIMARY\s+KEY\b/i.test(line));
  if (primary.length > 1) fail("У таблицы может быть только одно объявление PRIMARY KEY; для составного ключа используй отдельное ограничение в будущей версии.");
  return { sql: "CREATE TABLE " + table + " (\n  " + definitions.join(",\n  ") + "\n);", columnCount: definitions.length };
}
export function buildAlterTable(config) {
  const dialect = config.dialect || "postgres";
  const table = quote(config.table, dialect);
  const action = config.action;
  const column = identifier(config.column, "имя столбца");
  if (action === "add") {
    const definition = parseColumnDefinition(config.definition || (column + " " + config.dataType), 0, dialect);
    return { sql: "ALTER TABLE " + table + " ADD COLUMN " + definition + ";" };
  }
  if (action === "drop") return { sql: "ALTER TABLE " + table + " DROP COLUMN " + quote(column, dialect) + ";" };
  if (action === "rename") return { sql: "ALTER TABLE " + table + " RENAME COLUMN " + quote(column, dialect) + " TO " + quote(config.newName, dialect) + ";" };
  if (action === "type") {
    const type = String(config.dataType || "").trim().toUpperCase();
    if (!TYPES.has(type)) fail("Выбери поддерживаемый тип данных.");
    const size = String(config.typeSize || "").trim();
    if (size && !/^\d+(?:,\d+)?$/.test(size)) fail("Проверь размер типа.");
    if (size && !["CHAR","VARCHAR","BINARY","VARBINARY","DECIMAL","NUMERIC"].includes(type)) fail("Размер можно указать только для CHAR/VARCHAR/BINARY/VARBINARY/DECIMAL/NUMERIC.");
    const dimensions = size ? size.split(",").map(Number) : [];
    if (dimensions.some((part) => !Number.isInteger(part) || part < 1 || part > 1000000) || (dimensions.length === 2 && (dimensions[0] > 1000000 || dimensions[1] > 30 || dimensions[1] > dimensions[0]))) fail("Недопустимая длина или точность типа.");
    if (dialect === "mysql") return { sql: "ALTER TABLE " + table + " MODIFY COLUMN " + quote(column, dialect) + " " + type + (size ? "(" + size + ")" : "") + ";" };
    return { sql: "ALTER TABLE " + table + " ALTER COLUMN " + quote(column, dialect) + " TYPE " + type + (size ? "(" + size + ")" : "") + ";" };
  }
  fail("Выбери действие ALTER TABLE.");
}
export function buildDropTable(config) {
  const table = identifier(config.table, "имя таблицы");
  if (config.confirmName !== table) fail("Для DROP TABLE повтори имя таблицы в поле подтверждения.");
  return { sql: "DROP TABLE " + (config.ifExists ? "IF EXISTS " : "") + quote(table, config.dialect || "postgres") + ";" };
}
export function buildTruncateTable(config) {
  const table = identifier(config.table, "имя таблицы");
  if (config.confirmName !== table) fail("Для TRUNCATE повтори имя таблицы в поле подтверждения.");
  return { sql: "TRUNCATE TABLE " + quote(table, config.dialect || "postgres") + ";" };
}
export function buildInsert(config) {
  const dialect = config.dialect || "postgres";
  const table = quote(config.table, dialect);
  const columns = String(config.columns || "").split(",").map((x) => identifier(x, "имя столбца"));
  if (!columns.length || new Set(columns).size !== columns.length) fail("Укажи уникальные столбцы для INSERT.");
  if (config.selectSql) {
    if (!/^SELECT\b/i.test(config.selectSql.trim()) || /;|--|\/\*|\*\//.test(config.selectSql)) fail("INSERT ... SELECT принимает один SELECT без завершающей точки с запятой и комментариев.");
    return { sql: "INSERT INTO " + table + " (" + columns.map((x) => quote(x, dialect)).join(", ") + ")\n" + config.selectSql.trim().replace(/;$/, "") + ";" };
  }
  const rows = String(config.rows || "").split("\n").map((x) => x.trim()).filter(Boolean).map((row, index) => {
    const values = row.split("|").map((x) => x.trim());
    if (values.length !== columns.length || values.some((x) => !x)) fail("Строка INSERT №" + (index + 1) + ": число значений должно совпадать с числом столбцов; разделитель — |.");
    return "  (" + values.map(literal).join(", ") + ")";
  });
  if (!rows.length) fail("Добавь хотя бы одну строку значений.");
  return { sql: "INSERT INTO " + table + " (" + columns.map((x) => quote(x, dialect)).join(", ") + ")\nVALUES\n" + rows.join(",\n") + ";", rowCount: rows.length };
}
export function buildUpdate(config) {
  const dialect = config.dialect || "postgres";
  const table = quote(config.table, dialect);
  const assignments = String(config.assignments || "").split("\n").map((x) => x.trim()).filter(Boolean);
  if (!assignments.length) fail("Добавь хотя бы одно присваивание SET.");
  const seen = new Set();
  const setSql = assignments.map((line, index) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!match) fail("SET №" + (index + 1) + ": используй формат status = active.");
    const name = identifier(match[1], "имя столбца");
    if (seen.has(name.toLowerCase())) fail("Столбец " + name + " повторяется в SET.");
    seen.add(name.toLowerCase());
    return quote(name, dialect) + " = " + literal(match[2]);
  });
  const where = String(config.where || "").trim();
  if (!where) fail("Для безопасности UPDATE обязательно задай WHERE.");
  if (/[;]|--|\/\*|\*\/|\b(?:UPDATE|DELETE|DROP|ALTER|INSERT|EXEC|CALL)\b/i.test(where)) fail("Недопустимое условие WHERE.");
  return { sql: "UPDATE " + table + "\nSET " + setSql.join(",\n    ") + "\nWHERE " + where + ";" };
}
export function buildDelete(config) {
  const dialect = config.dialect || "postgres";
  const table = quote(config.table, dialect);
  const where = String(config.where || "").trim();
  if (!where) fail("DELETE без WHERE заблокирован конструктором. Добавь хотя бы одно условие.");
  if (/[;]|--|\/\*|\*\/|\b(?:UPDATE|DELETE|DROP|ALTER|INSERT|EXEC|CALL)\b/i.test(where)) fail("Недопустимое условие WHERE.");
  return { sql: "DELETE FROM " + table + "\nWHERE " + where + ";" };
}
