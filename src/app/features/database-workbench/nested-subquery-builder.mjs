const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const OPERATORS = new Set(["=", "<>", ">", ">=", "<", "<="]);
const AGGREGATES = new Set(["AVG", "SUM", "MIN", "MAX"]);

/**
 * Builds an arbitrarily deep scalar-subquery chain.
 * Levels are supplied outermost-to-innermost; each inner SELECT is placed
 * into the preceding level's WHERE comparison.
 */
export function buildNestedScalarSubquery(levels, quoteIdentifier, toSqlValue) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error("Добавь хотя бы один уровень вложенного SELECT.");
  }
  if (typeof quoteIdentifier !== "function" || typeof toSqlValue !== "function") {
    throw new TypeError("Для построения подзапроса нужны функции экранирования идентификаторов и значений.");
  }

  let nested = "";
  for (let index = levels.length - 1; index >= 0; index -= 1) {
    const level = levels[index];
    const label = " уровня " + (index + 2);
    const table = String(level?.table ?? "").trim();
    const column = String(level?.column ?? "").trim();
    if (!IDENTIFIER.test(table) || !IDENTIFIER.test(column)) {
      throw new Error("Проверь таблицу и столбец результата во вложенном SELECT" + label + ".");
    }
    if (level.selectKind !== "aggregate" && level.selectKind !== "column") {
      throw new Error("Выбери допустимый тип результата вложенного SELECT" + label + ".");
    }
    if (level.selectKind === "aggregate" && !AGGREGATES.has(level.aggregate)) {
      throw new Error("Выбери допустимую агрегатную функцию" + label + ".");
    }

    const selected = level.selectKind === "aggregate"
      ? level.aggregate + "(" + quoteIdentifier(column) + ")"
      : quoteIdentifier(column);
    let where = "";
    if (level.filterEnabled) {
      const filterColumn = String(level.filterColumn ?? "").trim();
      if (!IDENTIFIER.test(filterColumn)) {
        throw new Error("Укажи корректный столбец WHERE" + label + ".");
      }
      if (!OPERATORS.has(level.filterOperator)) {
        throw new Error("Недопустимый оператор WHERE" + label + ".");
      }
      const rightSide = nested || toSqlValue(String(level.filterValue ?? ""));
      if (!nested && !String(level.filterValue ?? "").trim()) {
        throw new Error("Укажи значение WHERE" + label + ".");
      }
      where = " WHERE " + quoteIdentifier(filterColumn) + " " + level.filterOperator + " " + rightSide;
    } else if (nested) {
      throw new Error("Чтобы вложить следующий уровень, включи WHERE" + label + ".");
    }

    nested = "(SELECT " + selected + " FROM " + quoteIdentifier(table) + where + ")";
  }
  return nested;
}
