const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const OPERATORS = new Set(["=", "<>", ">", ">=", "<", "<="]);
const AGGREGATES = new Set(["AVG", "SUM", "MIN", "MAX"]);

export function buildNestedScalarSubquery(levels, quoteIdentifier, toSqlValue) {
  if (!Array.isArray(levels) || levels.length === 0) throw new Error("Добавь хотя бы один уровень вложенного SELECT.");
  if (typeof quoteIdentifier !== "function" || typeof toSqlValue !== "function") throw new TypeError("Для построения подзапроса нужны функции экранирования идентификаторов и значений.");
  let nested = "";
  for (let index = levels.length - 1; index >= 0; index -= 1) {
    const level = levels[index];
    const label = " уровня " + (index + 2);
    const table = String(level?.table ?? "").trim();
    const column = String(level?.column ?? "").trim();
    if (!IDENTIFIER.test(table) || !IDENTIFIER.test(column)) throw new Error("Проверь таблицу и столбец результата во вложенном SELECT" + label + ".");
    if (level.selectKind !== "aggregate" && level.selectKind !== "column") throw new Error("Выбери допустимый тип результата вложенного SELECT" + label + ".");
    if (level.selectKind === "aggregate" && !AGGREGATES.has(level.aggregate)) throw new Error("Выбери допустимую агрегатную функцию" + label + ".");
    const selected = level.selectKind === "aggregate" ? level.aggregate + "(" + quoteIdentifier(column) + ")" : quoteIdentifier(column);
    let where = "";
    if (level.filterEnabled) {
      const filterColumn = String(level.filterColumn ?? "").trim();
      if (!IDENTIFIER.test(filterColumn)) throw new Error("Укажи корректный столбец WHERE" + label + ".");
      if (!OPERATORS.has(level.filterOperator)) throw new Error("Недопустимый оператор WHERE" + label + ".");
      const rightSide = nested || toSqlValue(String(level.filterValue ?? ""));
      if (!nested && !String(level.filterValue ?? "").trim()) throw new Error("Укажи значение WHERE" + label + ".");
      where = " WHERE " + quoteIdentifier(filterColumn) + " " + level.filterOperator + " " + rightSide;
    } else if (nested) throw new Error("Чтобы вложить следующий уровень, включи WHERE" + label + ".");
    nested = "(SELECT " + selected + " FROM " + quoteIdentifier(table) + where + ")";
  }
  return nested;
}

/**
 * Builds nested EXISTS predicates with lexical correlation scopes.
 * outerDepth=1 means the immediate parent query; larger values walk outward.
 */
export function buildCorrelatedExistsSubquery(config, quoteIdentifier, toSqlValue) {
  const { mode = "EXISTS", outer, levels } = config ?? {};
  if (mode !== "EXISTS" && mode !== "NOT EXISTS") throw new Error("Для коррелированного конструктора выбери EXISTS или NOT EXISTS.");
  if (typeof quoteIdentifier !== "function" || typeof toSqlValue !== "function") throw new TypeError("Не заданы функции форматирования SQL.");
  const valid = (value) => IDENTIFIER.test(String(value ?? "").trim());
  if (!outer || !valid(outer.table) || !valid(outer.alias)) throw new Error("Проверь внешнюю таблицу и её псевдоним.");
  if (!Array.isArray(levels) || levels.length === 0) throw new Error("Добавь хотя бы один коррелированный уровень.");
  const scopes = [{ table: outer.table.trim(), alias: outer.alias.trim() }];
  const normalized = levels.map((level, index) => {
    const table = String(level?.table ?? "").trim();
    const alias = String(level?.alias ?? "").trim();
    const innerColumn = String(level?.innerColumn ?? "").trim();
    const outerColumn = String(level?.outerColumn ?? "").trim();
    if (![table, alias, innerColumn, outerColumn].every(valid)) throw new Error("Проверь таблицу, псевдоним и столбцы связи на уровне " + (index + 1) + ".");
    if (scopes.some((scope) => scope.alias === alias)) throw new Error("Псевдоним " + alias + " уже используется во внешней области видимости.");
    const outerDepth = Number(level.outerDepth);
    if (!Number.isInteger(outerDepth) || outerDepth < 1 || outerDepth > scopes.length) throw new Error("На уровне " + (index + 1) + " выбрана недоступная внешняя область видимости.");
    const filterEnabled = Boolean(level.filterEnabled);
    const filterColumn = String(level.filterColumn ?? "").trim();
    const filterOperator = level.filterOperator ?? "=";
    if (filterEnabled) {
      if (!valid(filterColumn)) throw new Error("Проверь столбец локального WHERE на уровне " + (index + 1) + ".");
      if (!OPERATORS.has(filterOperator) && filterOperator !== "LIKE") throw new Error("Недопустимый оператор локального WHERE на уровне " + (index + 1) + ".");
      if (!String(level.filterValue ?? "").trim()) throw new Error("Укажи значение локального WHERE на уровне " + (index + 1) + ".");
    }
    const target = scopes[scopes.length - outerDepth];
    const result = { ...level, table, alias, innerColumn, outerColumn, filterEnabled, filterColumn, filterOperator, targetAlias: target.alias };
    scopes.push({ table, alias });
    return result;
  });
  let nested = "";
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const level = normalized[index];
    const correlation = quoteIdentifier(level.alias) + "." + quoteIdentifier(level.innerColumn) + " = " + quoteIdentifier(level.targetAlias) + "." + quoteIdentifier(level.outerColumn);
    const localFilter = level.filterEnabled
      ? " AND " + quoteIdentifier(level.alias) + "." + quoteIdentifier(level.filterColumn) + " " + level.filterOperator + " " + toSqlValue(String(level.filterValue))
      : "";
    nested = "EXISTS (SELECT 1 FROM " + quoteIdentifier(level.table) + " AS " + quoteIdentifier(level.alias) + " WHERE " + correlation + localFilter + (nested ? " AND " + nested : "") + ")";
  }
  return (mode === "NOT EXISTS" ? "NOT " : "") + nested;
}
