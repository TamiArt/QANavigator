const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
const column = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?$/;

function fail(message) { throw new Error(message); }
function validExpression(value) {
  const expression = value.trim();
  if (!expression || /[;]|--|\/\*|\*\/|\b(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|INTO|EXEC|CALL)\b/i.test(expression)) return false;
  if (!/^[A-Za-z0-9_.*+\-/(),\s<>=!'%]+$/.test(expression)) return false;
  const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|<>|!=|>=|<=|[()+*/.,<>=-]|'[^']*(?:''[^']*)*'/g) || [];
  if (tokens.join("").replace(/\s/g, "") !== expression.replace(/\s/g, "")) return false;
  const allowedWords = new Set(["COUNT","SUM","AVG","MIN","MAX","DISTINCT","CASE","WHEN","THEN","ELSE","END","AS","AND","OR","NOT","NULL","TRUE","FALSE","LIKE"]);
  return tokens.every((token) => !/^[A-Za-z_]/.test(token) || allowedWords.has(token.toUpperCase()) || identifier.test(token));
}
function validateSelectItem(item, index) {
  const parts = item.trim().split(/\s+AS\s+/i);
  if (parts.length > 2 || (parts[1] && !identifier.test(parts[1]))) fail("Проверь псевдоним SELECT-выражения №" + (index + 1) + ".");
  if (!validExpression(parts[0])) fail("Недопустимое SELECT-выражение №" + (index + 1) + ". Используй столбцы, арифметику, COUNT/SUM/AVG/MIN/MAX или CASE WHEN.");
  return parts[0] + (parts[1] ? " AS " + parts[1] : "");
}
function parseJoin(line, index) {
  const match = line.trim().match(/^(INNER|LEFT|RIGHT|FULL(?: OUTER)?)\s+JOIN\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+(?:AS\s+)?([A-Za-z_][A-Za-z0-9_]*))?\s+ON\s+([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)\s*(=|<>|!=|>=|<=|>|<)\s*([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)$/i);
  if (!match) fail("JOIN №" + (index + 1) + ": используй формат LEFT JOIN orders AS o ON o.user_id = u.id.");
  return match[1].toUpperCase().replace(/\s+/g, " ") + " JOIN " + match[2] + (match[3] ? " AS " + match[3] : "") + " ON " + match[4] + " " + match[5] + " " + match[6];
}
function parseHaving(line, index) {
  const match = line.trim().match(/^(.+?)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
  if (!match || !validExpression(match[1]) || !validExpression(match[3])) fail("HAVING №" + (index + 1) + ": укажи агрегатное выражение, оператор и значение, например COUNT(*) > 1.");
  if (!/\b(?:COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(match[1])) fail("HAVING должен содержать агрегатную функцию COUNT, SUM, AVG, MIN или MAX.");
  return match[1].trim() + " " + match[2] + " " + match[3].trim();
}
function parseOrder(line, index) {
  const match = line.trim().match(/^(.+?)(?:\s+(ASC|DESC))?$/i);
  if (!match || !validExpression(match[1])) fail("Проверь выражение ORDER BY №" + (index + 1) + ".");
  return match[1].trim() + (match[2] ? " " + match[2].toUpperCase() : "");
}
export function buildAdvancedSelect(config) {
  const table = (config.table || "").trim();
  if (!identifier.test(table)) fail("Укажи корректное имя основной таблицы.");
  const items = (config.selectItems || "").split("\n").map((item) => item.trim()).filter(Boolean);
  if (!items.length) fail("Добавь хотя бы одно SELECT-выражение — по одному на строку.");
  const joins = (config.joins || "").split("\n").map((item) => item.trim()).filter(Boolean);
  const groups = (config.groupBy || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (groups.some((item) => !column.test(item))) fail("GROUP BY: укажи имена столбцов через запятую.");
  const having = (config.having || "").split("\n").map((item) => item.trim()).filter(Boolean).map(parseHaving);
  const order = (config.orderBy || "").split(",").map((item) => item.trim()).filter(Boolean).map(parseOrder);
  const joinSql = joins.map(parseJoin);
  if (config.limit && (!/^\\d+$/.test(config.limit) || Number(config.limit) > 10000)) fail("LIMIT должен быть целым числом от 0 до 10000.");
  if (config.offset && (!/^\\d+$/.test(config.offset) || Number(config.offset) > 1000000)) fail("OFFSET должен быть целым числом от 0 до 1000000.");
  const sql = "SELECT " + (config.distinct ? "DISTINCT " : "") + items.map(validateSelectItem).join(",\n       ")
    + "\nFROM " + table + (joinSql.length ? "\n" + joinSql.join("\n") : "")
    + (config.whereClause || "")
    + (groups.length ? "\nGROUP BY " + groups.join(", ") : "")
    + (having.length ? "\nHAVING " + having.join("\n  AND ") : "")
    + (order.length ? "\nORDER BY " + order.join(", ") : "")
    + (config.limit ? "\nLIMIT " + config.limit : "")
    + (config.offset ? "\nOFFSET " + config.offset : "") + ";";
  return { sql, joinCount: joinSql.length, groupCount: groups.length, havingCount: having.length, orderCount: order.length };
}
