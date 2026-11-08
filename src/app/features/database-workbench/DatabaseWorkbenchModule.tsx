import { useMemo, useState } from "react";
import { buildNestedScalarSubquery, buildCorrelatedExistsSubquery } from "./nested-subquery-builder.mjs";
import { buildAdvancedSelect } from "./advanced-select-builder.mjs";
import { buildCreateTable, buildAlterTable, buildDropTable, buildTruncateTable, buildInsert, buildUpdate, buildDelete } from "./ddl-dml-builder.mjs";
import {
  AlertTriangle, BookOpen, CheckCircle2, Code2, Copy,
  Database, Info, Search, ShieldCheck, WandSparkles,
} from "lucide-react";

type Dialect = "postgres" | "mysql";
type Operation = "select" | "aggregate" | "join" | "subquery" | "cte" | "createTableAs" | "createTable" | "alterTable" | "dropTable" | "truncateTable" | "insert" | "update" | "delete" | "rename" | "alias" | "advancedSelect";
type SubqueryMode = "SCALAR" | "IN" | "NOT IN" | "EXISTS" | "NOT EXISTS";
type AggregateFunction = "COUNT" | "COUNT_DISTINCT" | "SUM" | "AVG" | "MIN" | "MAX";
type AggregateMetric = { id: number; fn: AggregateFunction; column: string; alias: string };
type CorrelatedSubqueryLevel = { id: number; table: string; alias: string; innerColumn: string; outerDepth: number; outerColumn: string; filterEnabled: boolean; filterColumn: string; filterOperator: "=" | "<>" | ">" | ">=" | "<" | "<=" | "LIKE"; filterValue: string };
type SubqueryLevel = { id: number; table: string; selectKind: "aggregate" | "column"; aggregate: "AVG" | "SUM" | "MIN" | "MAX"; column: string; filterEnabled: boolean; filterColumn: string; filterOperator: "=" | "<>" | ">" | ">=" | "<" | "<="; filterValue: string };
type FilterCondition = { id: number; column: string; operator: string; value: string; connector: "AND" | "OR"; openGroups: number; closeGroups: number; negate: boolean; subqueryTable: string; subquerySelectColumn: string; subqueryFilterColumn: string; subqueryFilterOperator: string; subqueryFilterValue: string };
type BuilderState = {
  table: string;
  columns: string;
  groupBy: string;
  groupAliases: string;
  aggregates: AggregateMetric[];
  insertValues: string;
  conditions: FilterCondition[];
  orderColumn: string;
  orderDirection: "ASC" | "DESC";
  limit: string;
  offset: string;
  distinct: boolean;
  havingAlias: string;
  havingOperator: ">" | ">=" | "=" | "<>" | "<=" | "<";
  havingValue: string;
  secondTable: string;
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL OUTER";
  leftKey: string;
  rightKey: string;
  subqueryMode: SubqueryMode;
  subqueryOuterAlias: string;
  correlatedLevels: CorrelatedSubqueryLevel[];
  subqueryColumn: string;
  subqueryOperator: "=" | "<>" | ">" | ">=" | "<" | "<=";
  subqueryTable: string;
  subquerySelectColumn: string;
  subqueryFilterColumn: string;
  subqueryFilterOperator: "=" | "<>" | ">" | ">=" | "<" | "<=" | "LIKE";
  subqueryFilterValue: string;
  cteName: string;
  cteSourceTable: string;
  cteColumns: string;
  cteResultColumns: string;
  cteFilterColumn: string;
  cteFilterOperator: "=" | "<>" | ">" | ">=" | "<" | "<=" | "LIKE";
  cteFilterValue: string;
  cteOuterFilterColumn: string;
  cteOuterFilterOperator: "=" | "<>" | ">" | ">=" | "<" | "<=" | "LIKE";
  cteOuterFilterValue: string;
  ctasTable: string;
  ctasSourceTable: string;
  ctasColumns: string;
  ctasSelectKind: "aggregate" | "column";
  ctasAggregate: "AVG" | "SUM" | "MIN" | "MAX";
  ctasAggregateColumn: string;
  ctasSelectAlias: string;
  ctasWhereColumn: string;
  ctasWhereOperator: "=" | "<>" | ">" | ">=" | "<" | "<=";
  ctasScalarFilterEnabled: boolean;
  ctasScalarFilterColumn: string;
  ctasScalarFilterOperator: "=" | "<>" | ">" | ">=" | "<" | "<=";
  ctasSubqueryLevels: SubqueryLevel[];
  ctasAppendSelect: boolean;
  setColumn: string;
  setValue: string;
  newColumn: string;
  oldColumn: string;
  alias: string;
  advancedFromAlias: string;
  advancedSelectItems: string;
  advancedJoins: string;
  advancedGroupBy: string;
  advancedHaving: string;
  advancedOrderBy: string;
  ddlColumns: string;
  alterAction: "add" | "drop" | "rename" | "type";
  alterColumn: string;
  alterDefinition: string;
  alterDataType: string;
  alterTypeSize: string;
  alterNewName: string;
  confirmTable: string;
  ifExists: boolean;
  insertSelectSql: string;
  updateAssignments: string;
};

const initial: BuilderState = {
  table: "users", columns: "id, email, created_at", groupBy: "", groupAliases: "",
  aggregates: [
    { id: 1, fn: "COUNT", column: "*", alias: "total" },
  ],
  insertValues: "101 | qa@example.com | 2026-11-07",
  conditions: [{ id: 1, column: "id", operator: "=", value: "10", connector: "AND", openGroups: 0, closeGroups: 0, negate: false, subqueryTable: "orders", subquerySelectColumn: "user_id", subqueryFilterColumn: "status", subqueryFilterOperator: "=", subqueryFilterValue: "paid" }], orderColumn: "", orderDirection: "DESC",
  limit: "50", offset: "", distinct: false, havingAlias: "", havingOperator: ">", havingValue: "",
  secondTable: "orders", joinType: "LEFT",
  leftKey: "users.id", rightKey: "orders.user_id",
  subqueryMode: "EXISTS", subqueryOuterAlias: "u", correlatedLevels: [{ id: 1, table: "orders", alias: "o", innerColumn: "user_id", outerDepth: 1, outerColumn: "id", filterEnabled: true, filterColumn: "status", filterOperator: "=", filterValue: "paid" }], subqueryColumn: "id", subqueryOperator: "=",
  subqueryTable: "orders", subquerySelectColumn: "user_id",
  subqueryFilterColumn: "status", subqueryFilterOperator: "=", subqueryFilterValue: "paid",
  cteName: "filtered_orders", cteSourceTable: "orders", cteColumns: "id, user_id, total, status", cteResultColumns: "id, user_id, total, status",
  cteFilterColumn: "status", cteFilterOperator: "=", cteFilterValue: "paid",
  cteOuterFilterColumn: "total", cteOuterFilterOperator: ">=", cteOuterFilterValue: "100",
  ctasTable: "ordering", ctasSourceTable: "book", ctasColumns: "author, title",
  ctasSelectKind: "aggregate", ctasAggregate: "AVG", ctasAggregateColumn: "amount", ctasSelectAlias: "amount",
  ctasWhereColumn: "amount", ctasWhereOperator: "<", ctasScalarFilterEnabled: true,
  ctasScalarFilterColumn: "amount", ctasScalarFilterOperator: "<",
  ctasSubqueryLevels: [{ id: 2, table: "book", selectKind: "aggregate", aggregate: "AVG", column: "amount", filterEnabled: false, filterColumn: "amount", filterOperator: ">", filterValue: "0" }], ctasAppendSelect: true,
  setColumn: "status", setValue: "active", newColumn: "display_name",
  oldColumn: "name", alias: "u",
  advancedFromAlias: "u", advancedSelectItems: "u.id AS user_id\nu.email\nCOUNT(o.id) AS orders_count",
  advancedJoins: "LEFT JOIN orders AS o ON o.user_id = u.id",
  advancedGroupBy: "u.id, u.email", advancedHaving: "COUNT(o.id) > 1", advancedOrderBy: "orders_count DESC, u.email ASC",
  ddlColumns: "id BIGINT PRIMARY KEY\nemail VARCHAR(255) NOT NULL UNIQUE\nstatus VARCHAR(30) DEFAULT 'active'\ncreated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  alterAction: "add", alterColumn: "phone", alterDefinition: "phone VARCHAR(30)", alterDataType: "VARCHAR", alterTypeSize: "255", alterNewName: "display_name",
  confirmTable: "", ifExists: true, insertSelectSql: "", updateAssignments: "status = active\nupdated_at = CURRENT_TIMESTAMP",
};

const snippets = [
  { group: "Чтение данных", title: "Найти запись по ID", sql: "SELECT * FROM users WHERE id = :id;", note: "Подставь параметр id через механизм параметров своего SQL-клиента." },
  { group: "Чтение данных", title: "Найти дубликаты", sql: "SELECT email, COUNT(*) AS duplicate_count\nFROM users\nGROUP BY email\nHAVING COUNT(*) > 1;", note: "Показывает email, которые встречаются более одного раза." },
  { group: "Чтение данных", title: "Найти NULL в обязательном поле", sql: "SELECT *\nFROM orders\nWHERE user_id IS NULL;", note: "Сверь результат с ограничениями и требованиями к данным." },
  { group: "JOIN", title: "Пользователи без заказов", sql: "SELECT u.*\nFROM users AS u\nLEFT JOIN orders AS o ON o.user_id = u.id\nWHERE o.id IS NULL;", note: "Классический LEFT JOIN + IS NULL для поиска записей без пары." },
  { group: "JOIN", title: "Сверить связанные записи", sql: "SELECT o.id, o.user_id, u.email\nFROM orders AS o\nINNER JOIN users AS u ON u.id = o.user_id;", note: "Подходит для проверки связи внешнего ключа с родительской записью." },
  { group: "Агрегация", title: "Количество по статусам", sql: "SELECT status, COUNT(*) AS total\nFROM orders\nGROUP BY status\nORDER BY total DESC;", note: "Помогает проверить распределение данных по статусам." },
  { group: "Агрегация", title: "Различные книги и экземпляры по авторам", sql: "SELECT author AS \"Автор\", COUNT(DISTINCT book_id) AS \"Различных_книг\", COUNT(*) AS \"Количество_экземпляров\"\nFROM books\nGROUP BY author;", note: "Пример для PostgreSQL. Одна строка books должна соответствовать одному физическому экземпляру; если в строке хранится количество в поле quantity, используй SUM(quantity). В MySQL псевдонимы обрамляются обратными кавычками." },
  { group: "Агрегация", title: "Группы с количеством больше 5", sql: "SELECT user_id, COUNT(*) AS orders_count\nFROM orders\nGROUP BY user_id\nHAVING COUNT(*) > 5;", note: "WHERE фильтрует строки до группировки, HAVING — группы после неё." },
  { group: "Изменение данных", title: "Безопасный UPDATE", sql: "BEGIN;\nSELECT * FROM users WHERE id = :id;\nUPDATE users SET status = :status WHERE id = :id;\nSELECT * FROM users WHERE id = :id;\n-- COMMIT;  -- только после проверки\n-- ROLLBACK; -- если результат неверный", note: "Выполняй только в разрешённой тестовой среде. Сначала проверь выборку." },
  { group: "Изменение данных", title: "Удаление тестовой записи", sql: "BEGIN;\nSELECT * FROM users WHERE email = :test_email;\nDELETE FROM users WHERE email = :test_email;\nSELECT * FROM users WHERE email = :test_email;\n-- COMMIT;  -- только после проверки\n-- ROLLBACK; -- если результат неверный", note: "Убедись, что WHERE выбирает ровно тестовую запись. Не запускай на production." },
  { group: "Структура БД", title: "Переименовать столбец в таблице", sql: "ALTER TABLE users RENAME COLUMN old_name TO new_name;", note: "Меняет структуру таблицы. Синтаксис и транзакционность зависят от СУБД." },
  { group: "Псевдонимы", title: "Переименовать столбец только в выдаче", sql: "SELECT first_name AS name\nFROM users;", note: "AS задаёт псевдоним только для результата SELECT, а не переименовывает столбец в БД." },
  { group: "Псевдонимы", title: "Псевдоним таблицы", sql: "SELECT u.email, o.total\nFROM users AS u\nJOIN orders AS o ON o.user_id = u.id;", note: "Псевдонимы таблиц сокращают запрос и помогают различать одинаковые имена столбцов." },
  { group: "Чтение данных", title: "Только уникальные значения", sql: "SELECT DISTINCT status\nFROM orders\nORDER BY status;", note: "DISTINCT удаляет повторяющиеся строки результата; применяется ко всему набору выбранных столбцов." },

];

function validIdentifier(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
}

function validColumnReference(value: string) {
  return value.trim().split(".").length <= 2 && value.trim().split(".").every(validIdentifier);
}

function splitIdentifiers(value: string) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 && parts.every(validIdentifier) ? parts : null;
}

function sqlLiteral(value: string) {
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed) || /^(NULL|TRUE|FALSE)$/i.test(trimmed)) return trimmed;
  return "'" + value.replace(/'/g, "''") + "'";
}
function buildSql(operation: Operation, dialect: Dialect, form: BuilderState) {
  const table = form.table.trim();
  if (operation !== "createTableAs" && !validIdentifier(table)) return { sql: "", params: [], error: "Укажи имя таблицы латиницей: users, order_items." };
  const q = (name: string) => name;
  const aliasSql = (name: string) => dialect === "mysql"
    ? "`" + name.replace(/`/g, "``") + "`"
    : "\"" + name.replace(/"/g, "\"\"") + "\"";
  const tableSql = table;
  const columns = splitIdentifiers(form.columns);
  const params: string[] = [];
  const placeholder = (value: string) => {
    params.push(value);
    return sqlLiteral(value);
  };
  const where = () => {
    if (form.conditions.some((condition) => !condition.column.trim())) throw new Error("Заполни столбец во всех добавленных условиях или удали пустое условие.");
    const conditions = form.conditions;
    if (!conditions.length) return "";
    let depth = 0;
    const clauses = conditions.map((condition, index) => {
      if (!validColumnReference(condition.column.trim())) throw new Error("Поле условия №" + (index + 1) + " должно быть именем столбца или ссылкой table.column.");
      const operator = ["=", "<>", ">", ">=", "<", "<=", "LIKE", "IN", "IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)", "BETWEEN", "IS NULL", "IS NOT NULL"].includes(condition.operator) ? condition.operator : "=";
      let expression: string;
      if (operator === "IS NULL" || operator === "IS NOT NULL") expression = q(condition.column.trim()) + " " + operator;
      else if (operator === "BETWEEN") {
        const bounds = condition.value.split(",").map((value) => value.trim());
        if (bounds.length !== 2 || bounds.some((value) => !value)) throw new Error("Для BETWEEN в условии №" + (index + 1) + " укажи две границы через запятую: от, до.");
        expression = q(condition.column.trim()) + " BETWEEN " + placeholder(bounds[0]) + " AND " + placeholder(bounds[1]);
      } else if (operator === "IN") {
        const values = condition.value.split(",").map((value) => value.trim());
        if (!values.length || values.some((value) => !value)) throw new Error("Для IN в условии №" + (index + 1) + " укажи значения через запятую.");
        expression = q(condition.column.trim()) + " IN (" + values.map(placeholder).join(", ") + ")";
      } else if (["IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)"].includes(operator)) {
        const innerTable = condition.subqueryTable.trim();
        const innerColumn = condition.subquerySelectColumn.trim();
        const filterColumn = condition.subqueryFilterColumn.trim();
        if (!validIdentifier(innerTable) || !validIdentifier(innerColumn)) throw new Error("Для подзапроса в условии №" + (index + 1) + " укажи корректные таблицу и столбец результата или связи.");
        if (filterColumn && (!validIdentifier(filterColumn) || !condition.subqueryFilterValue.trim())) throw new Error("Проверь столбец и значение внутреннего фильтра подзапроса в условии №" + (index + 1) + ".");
        const innerFilter = filterColumn ? " WHERE " + q(filterColumn) + " " + (["=", "<>", ">", ">=", "<", "<=", "LIKE"].includes(condition.subqueryFilterOperator) ? condition.subqueryFilterOperator : "=") + " " + placeholder(condition.subqueryFilterValue) : "";
        if (operator === "IN (подзапрос)" || operator === "NOT IN (подзапрос)") {
          expression = q(condition.column.trim()) + (operator === "IN (подзапрос)" ? " IN " : " NOT IN ") + "(SELECT " + q(innerColumn) + " FROM " + q(innerTable) + innerFilter + ")";
        } else {
          expression = (operator === "EXISTS (подзапрос)" ? "EXISTS" : "NOT EXISTS") + " (SELECT 1 FROM " + q(innerTable) + " WHERE " + q(innerTable) + "." + q(innerColumn) + " = " + q(condition.column.trim()) + (innerFilter ? " AND " + innerFilter.slice(7) : "") + ")";
        }
      } else {
        if (!condition.value.trim()) throw new Error("Укажи значение для условия №" + (index + 1) + ".");
        expression = q(condition.column.trim()) + " " + operator + " " + placeholder(condition.value);
      }
      if (!Number.isInteger(condition.openGroups) || !Number.isInteger(condition.closeGroups) || condition.openGroups < 0 || condition.closeGroups < 0 || condition.openGroups > 4 || condition.closeGroups > 4) throw new Error("Число скобок должно быть от 0 до 4.");
      depth += condition.openGroups;
      const clause = (index === 0 ? "" : condition.connector + " ") + "(".repeat(condition.openGroups) + (condition.negate ? "NOT " : "") + expression + ")".repeat(condition.closeGroups);
      depth -= condition.closeGroups;
      if (depth < 0) throw new Error("Закрывающих скобок больше, чем открывающих. Проверь группировку условий.");
      return clause;
    });
    if (depth !== 0) throw new Error("Не все группы условий закрыты. Добавь закрывающие скобки.");
    return "\nWHERE " + clauses.join("\n  ");
  };
  try {
    switch (operation) {
      case "advancedSelect": {
        if (form.limit.trim() && (!/^\\d+$/.test(form.limit.trim()) || Number(form.limit) > 10000)) return { sql: "", params, error: "LIMIT должен быть целым числом от 0 до 10000." };
        if (form.offset.trim() && (!/^\\d+$/.test(form.offset.trim()) || Number(form.offset) > 1000000)) return { sql: "", params, error: "OFFSET должен быть целым числом от 0 до 1000000." };
        const advanced = buildAdvancedSelect({ table, fromAlias: form.advancedFromAlias, dialect, selectItems: form.advancedSelectItems, joins: form.advancedJoins, whereClause: where(), groupBy: form.advancedGroupBy, having: form.advancedHaving, orderBy: form.advancedOrderBy, distinct: form.distinct, limit: form.limit.trim() ? String(Number(form.limit)) : "", offset: form.offset.trim() ? String(Number(form.offset)) : "" });
        return { sql: advanced.sql, params, error: "" };
      }
      case "select": {
        if (!columns) return { sql: "", params, error: "Перечисли столбцы через запятую или укажи *." };
        const selected = form.columns.trim() === "*" ? "*" : columns.map(q).join(", ");
        if (form.orderColumn.trim() && !validIdentifier(form.orderColumn.trim())) return { sql: "", params, error: "Проверь имя столбца сортировки." };
        if (form.limit.trim() && (!/^\d+$/.test(form.limit.trim()) || Number(form.limit) > 10000)) return { sql: "", params, error: "LIMIT должен быть целым числом от 0 до 10000." };
        if (form.offset.trim() && (!/^\d+$/.test(form.offset.trim()) || Number(form.offset) > 1000000)) return { sql: "", params, error: "OFFSET должен быть целым числом от 0 до 1000000." };
        const sorting = form.orderColumn.trim() ? "\nORDER BY " + q(form.orderColumn.trim()) + " " + form.orderDirection : "";
        const limit = form.limit.trim() ? "\nLIMIT " + Number(form.limit) : "";
        const offset = form.offset.trim() ? "\nOFFSET " + Number(form.offset) : "";
        return { sql: "SELECT " + (form.distinct ? "DISTINCT " : "") + selected + "\nFROM " + tableSql + where() + sorting + limit + offset + ";", params, error: "" };
      }
      case "aggregate": {
        const groupColumns = splitIdentifiers(form.groupBy);
        if (!groupColumns) return { sql: "", params, error: "Укажи один или несколько столбцов группировки через запятую." };
        if (!form.aggregates.length) return { sql: "", params, error: "Добавь хотя бы один агрегатный показатель." };
        const groupAliases = form.groupAliases.trim() ? form.groupAliases.split(",").map((alias) => alias.trim()) : [];
        if (groupAliases.length && (groupAliases.length !== groupColumns.length || groupAliases.some((alias) => !alias))) return { sql: "", params, error: "Если задаёшь псевдонимы, укажи по одному для каждого столбца группировки через запятую." };
        const expressions = form.aggregates.map((metric, index) => {
          const column = metric.column.trim();
          const alias = metric.alias.trim();
          if (!alias) throw new Error("Укажи псевдоним для агрегатного столбца №" + (index + 1) + ".");
          if (metric.fn === "COUNT" && column === "*") return "COUNT(*) AS " + aliasSql(alias);
          if (!validIdentifier(column)) throw new Error("Проверь столбец агрегатного показателя №" + (index + 1) + ". Для COUNT(*) укажи звёздочку.");
          const expression = metric.fn === "COUNT_DISTINCT"
            ? "COUNT(DISTINCT " + q(column) + ")"
            : metric.fn + "(" + q(column) + ")";
          return expression + " AS " + aliasSql(alias);
        });
        if (form.havingAlias.trim() && !validIdentifier(form.havingAlias.trim())) return { sql: "", params, error: "HAVING должен ссылаться на корректный псевдоним агрегатного показателя." };
        if (form.havingAlias.trim() && !form.aggregates.some((metric) => metric.alias.trim() === form.havingAlias.trim())) return { sql: "", params, error: "Псевдоним HAVING должен совпадать с псевдонимом одного из агрегатных показателей." };
        if (form.havingAlias.trim() && !form.havingValue.trim()) return { sql: "", params, error: "Укажи значение для условия HAVING." };
        if (form.orderColumn.trim() && !validIdentifier(form.orderColumn.trim())) return { sql: "", params, error: "Проверь поле или псевдоним для сортировки агрегатов." };
        if (form.limit.trim() && (!/^\d+$/.test(form.limit.trim()) || Number(form.limit) > 10000)) return { sql: "", params, error: "LIMIT должен быть целым числом от 0 до 10000." };
        if (form.offset.trim() && (!/^\d+$/.test(form.offset.trim()) || Number(form.offset) > 1000000)) return { sql: "", params, error: "OFFSET должен быть целым числом от 0 до 1000000." };
        const whereClause = where();
        const havingMetric = form.aggregates.find((metric) => metric.alias.trim() === form.havingAlias.trim());
        const havingTarget = havingMetric
          ? havingMetric.fn === "COUNT" && havingMetric.column.trim() === "*"
            ? "COUNT(*)"
            : havingMetric.fn === "COUNT_DISTINCT"
              ? "COUNT(DISTINCT " + q(havingMetric.column.trim()) + ")"
              : havingMetric.fn + "(" + q(havingMetric.column.trim()) + ")"
          : "";
        const having = form.havingAlias.trim()
          ? "\nHAVING " + (dialect === "mysql" ? q(form.havingAlias.trim()) : havingTarget) + " " + form.havingOperator + " " + placeholder(form.havingValue)
          : "";
        const sorting = form.orderColumn.trim() ? "\nORDER BY " + q(form.orderColumn.trim()) + " " + form.orderDirection : "";
        const limit = form.limit.trim() ? "\nLIMIT " + Number(form.limit) : "";
        const offset = form.offset.trim() ? "\nOFFSET " + Number(form.offset) : "";
        return { sql: "SELECT " + groupColumns.map((column, index) => groupAliases.length ? q(column) + " AS " + aliasSql(groupAliases[index]) : q(column)).join(", ") + ",\n       " + expressions.join(",\n       ") + "\nFROM " + tableSql + whereClause + "\nGROUP BY " + groupColumns.map(q).join(", ") + having + sorting + limit + offset + ";", params, error: "" };
      }
      case "join": {
        const joinedTables = splitIdentifiers(form.secondTable);
        const leftKeys = form.leftKey.split(",").map((value) => value.trim());
        const rightKeys = form.rightKey.split(",").map((value) => value.trim());
        const qualified = /^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/;
        if (!joinedTables || leftKeys.length !== joinedTables.length || rightKeys.length !== joinedTables.length || leftKeys.some((key) => !qualified.test(key)) || rightKeys.some((key) => !qualified.test(key))) {
          return { sql: "", params, error: "Укажи таблицы через запятую и по одной паре ключей table.column для каждой таблицы." };
        }
        if (form.joinType === "FULL OUTER" && dialect === "mysql") return { sql: "", params, error: "MySQL не поддерживает FULL OUTER JOIN напрямую. Используй UNION из LEFT и RIGHT JOIN." };
        const joins = joinedTables.map((joinedTable, index) => "\n" + form.joinType + " JOIN " + q(joinedTable) + " ON " + leftKeys[index].split(".").map(q).join(".") + " = " + rightKeys[index].split(".").map(q).join(".")).join("");
        return { sql: "SELECT *\nFROM " + tableSql + joins + where() + ";", params, error: "" };
      }
      case "subquery": {
        const innerTable = form.subqueryTable.trim();
        const outerColumn = form.subqueryColumn.trim();
        const innerColumn = form.subquerySelectColumn.trim();
        const usesExists = form.subqueryMode === "EXISTS" || form.subqueryMode === "NOT EXISTS";
        if (!usesExists && (!validIdentifier(innerTable) || !validIdentifier(outerColumn) || !validIdentifier(innerColumn))) {
          return { sql: "", params, error: "Укажи корректные имена внешнего столбца, внутренней таблицы и столбца подзапроса." };
        }
        const filterColumn = form.subqueryFilterColumn.trim();
        if (!usesExists && filterColumn && !validIdentifier(filterColumn)) return { sql: "", params, error: "Проверь имя столбца дополнительного фильтра подзапроса." };
        if (!usesExists && filterColumn && !form.subqueryFilterValue.trim()) return { sql: "", params, error: "Укажи значение дополнительного фильтра подзапроса." };
        const innerFilter = !usesExists && filterColumn
          ? " WHERE " + q(filterColumn) + " " + form.subqueryFilterOperator + " " + placeholder(form.subqueryFilterValue)
          : "";
        let predicate = "";
        if (form.subqueryMode === "EXISTS" || form.subqueryMode === "NOT EXISTS") {
          const outerAlias = form.subqueryOuterAlias.trim();
          if (!validIdentifier(outerAlias)) return { sql: "", params, error: "Укажи корректный псевдоним внешней таблицы для корреляции." };
          try {
            predicate = buildCorrelatedExistsSubquery({
              mode: form.subqueryMode,
              outer: { table, alias: outerAlias },
              levels: form.correlatedLevels,
            }, (name) => aliasSql(name), sqlLiteral);
            params.push(...form.correlatedLevels.filter((level) => level.filterEnabled).map((level) => level.filterValue));
          } catch (error) {
            return { sql: "", params, error: error instanceof Error ? error.message : "Не удалось построить коррелированный подзапрос." };
          }
        } else if (form.subqueryMode === "IN" || form.subqueryMode === "NOT IN") {
          predicate = q(outerColumn) + " " + form.subqueryMode + " (SELECT " + q(innerColumn) + " FROM " + q(innerTable) + innerFilter + ")";
        } else {
          predicate = q(outerColumn) + " " + form.subqueryOperator + " (SELECT " + q(innerColumn) + " FROM " + q(innerTable) + innerFilter + ")";
        }
        return { sql: "SELECT " + (columns ? (form.columns.trim() === "*" ? "*" : columns.map(q).join(", ")) : "*") + "\nFROM " + tableSql + ((form.subqueryMode === "EXISTS" || form.subqueryMode === "NOT EXISTS") ? " AS " + aliasSql(form.subqueryOuterAlias.trim()) : "") + "\nWHERE " + predicate + ";", params, error: "" };
      }
      case "cte": {
        const cteName = form.cteName.trim();
        const sourceTable = form.cteSourceTable.trim();
        const cteColumns = splitIdentifiers(form.cteColumns);
        const cteResultColumns = splitIdentifiers(form.cteResultColumns);
        if (!validIdentifier(cteName) || !validIdentifier(sourceTable) || !cteColumns || !cteResultColumns) {
          return { sql: "", params, error: "Укажи корректное имя CTE, исходную таблицу и списки столбцов через запятую." };
        }
        if (cteResultColumns.some((column) => !cteColumns.includes(column))) return { sql: "", params, error: "Внешний SELECT может выбирать только столбцы, объявленные внутри CTE." };
        const cteFilterColumn = form.cteFilterColumn.trim();
        const outerFilterColumn = form.cteOuterFilterColumn.trim();
        if (cteFilterColumn && (!validIdentifier(cteFilterColumn) || !form.cteFilterValue.trim())) return { sql: "", params, error: "Проверь столбец и значение фильтра внутри CTE." };
        if (outerFilterColumn && (!validIdentifier(outerFilterColumn) || !form.cteOuterFilterValue.trim() || !cteColumns.includes(outerFilterColumn))) return { sql: "", params, error: "Внешний фильтр должен использовать столбец, объявленный внутри CTE, и иметь значение." };
        const cteWhere = cteFilterColumn ? "\n  WHERE " + q(cteFilterColumn) + " " + form.cteFilterOperator + " " + placeholder(form.cteFilterValue) : "";
        const outerWhere = outerFilterColumn ? "\nWHERE " + q(outerFilterColumn) + " " + form.cteOuterFilterOperator + " " + placeholder(form.cteOuterFilterValue) : "";
        const sorting = form.orderColumn.trim() ? validIdentifier(form.orderColumn.trim()) ? "\nORDER BY " + q(form.orderColumn.trim()) + " " + form.orderDirection : "" : "";
        if (form.orderColumn.trim() && !sorting) return { sql: "", params, error: "Проверь столбец сортировки результата CTE." };
        if (form.limit.trim() && (!/^\\d+$/.test(form.limit.trim()) || Number(form.limit) > 10000)) return { sql: "", params, error: "LIMIT должен быть целым числом от 0 до 10000." };
        const limit = form.limit.trim() ? "\nLIMIT " + Number(form.limit) : "";
        return { sql: "WITH " + q(cteName) + " AS (\n  SELECT " + cteColumns.map(q).join(", ") + "\n  FROM " + q(sourceTable) + cteWhere + "\n)\nSELECT " + cteResultColumns.map(q).join(", ") + "\nFROM " + q(cteName) + outerWhere + sorting + limit + ";", params, error: "" };
      }
      case "createTableAs": {
        const targetTable = form.ctasTable.trim();
        const sourceTable = form.ctasSourceTable.trim();
        const selectedColumns = splitIdentifiers(form.ctasColumns);
        const aggregateColumn = form.ctasAggregateColumn.trim();
        const selectAlias = form.ctasSelectAlias.trim();
        const whereColumn = form.ctasWhereColumn.trim();
        if (!validIdentifier(targetTable) || !validIdentifier(sourceTable) || !selectedColumns) {
          return { sql: "", params, error: "Укажи корректные имена создаваемой и исходной таблиц, а также обычные столбцы SELECT." };
        }
        if (!validIdentifier(aggregateColumn) || !validIdentifier(selectAlias)) {
          return { sql: "", params, error: "Укажи корректный столбец для агрегата и псевдоним вычисляемого столбца." };
        }
        if (!validIdentifier(whereColumn)) return { sql: "", params, error: "Укажи корректный столбец для сравнения в WHERE." };
        if (!["=", "<>", ">", ">=", "<", "<="].includes(form.ctasWhereOperator)) {
          return { sql: "", params, error: "Выбери допустимый оператор сравнения для WHERE." };
        }
        if (!validIdentifier(aggregateColumn)) return { sql: "", params, error: "Укажи корректный столбец скалярного SELECT." };
        if (form.ctasSelectKind === "aggregate" && !["AVG", "SUM", "MIN", "MAX"].includes(form.ctasAggregate)) return { sql: "", params, error: "Выбери допустимую агрегатную функцию скалярного SELECT." };
        if (![ "aggregate", "column" ].includes(form.ctasSelectKind)) return { sql: "", params, error: "Выбери допустимый тип результата скалярного SELECT." };
        const scalarSelect = form.ctasSelectKind === "aggregate"
          ? form.ctasAggregate + "(" + q(aggregateColumn) + ")"
          : q(aggregateColumn);
        let scalarFilter = "";
        if (form.ctasScalarFilterEnabled) {
          if (!validIdentifier(form.ctasScalarFilterColumn)) return { sql: "", params, error: "Укажи корректный столбец WHERE для скалярного подзапроса." };
          if (!["=", "<>", ">", ">=", "<", "<="].includes(form.ctasScalarFilterOperator)) return { sql: "", params, error: "Выбери допустимый оператор для вложенного подзапроса." };
          const nested = buildNestedScalarSubquery(form.ctasSubqueryLevels, q, placeholder);
          scalarFilter = " WHERE " + q(form.ctasScalarFilterColumn) + " " + form.ctasScalarFilterOperator + " " + nested;
        }
        const scalar = "(SELECT " + scalarSelect + " FROM " + q(sourceTable) + scalarFilter + ")";
        const create = "CREATE TABLE " + q(targetTable) + " AS\nSELECT " + selectedColumns.map(q).join(", ") + ",\n       " + scalar + " AS " + q(selectAlias) + "\nFROM " + q(sourceTable) + "\nWHERE " + q(whereColumn) + " " + form.ctasWhereOperator + " " + scalar + ";";
        return { sql: create + (form.ctasAppendSelect ? "\n\nSELECT * FROM " + q(targetTable) + ";" : ""), params, error: "" };
      }
      case "createTable": {
        const result = buildCreateTable({ dialect, table, columns: form.ddlColumns });
        return { sql: result.sql, params, error: "" };
      }
      case "alterTable": {
        const result = buildAlterTable({ dialect, table, action: form.alterAction, column: form.alterColumn, definition: form.alterDefinition, dataType: form.alterDataType, typeSize: form.alterTypeSize, newName: form.alterNewName });
        return { sql: result.sql, params, error: "" };
      }
      case "dropTable": {
        const result = buildDropTable({ dialect, table, confirmName: form.confirmTable, ifExists: form.ifExists });
        return { sql: result.sql, params, error: "" };
      }
      case "truncateTable": {
        const result = buildTruncateTable({ dialect, table, confirmName: form.confirmTable });
        return { sql: result.sql, params, error: "" };
      }
      case "insert": {
        const result = buildInsert({ dialect, table, columns: form.columns, rows: form.insertValues, selectSql: form.insertSelectSql });
        return { sql: result.sql, params, error: "" };
      }
      case "update": {
        const condition = where();
        const result = buildUpdate({ dialect, table, assignments: form.updateAssignments, where: condition.replace(/^\nWHERE\s+/i, "") });
        return { sql: result.sql, params, error: "" };
      }
      case "delete": {
        const condition = where();
        const result = buildDelete({ dialect, table, where: condition.replace(/^\nWHERE\s+/i, "") });
        return { sql: result.sql, params, error: "" };
      }
      case "rename":
        if (!validIdentifier(form.oldColumn.trim()) || !validIdentifier(form.newColumn.trim())) return { sql: "", params, error: "Проверь старое и новое имя столбца." };
        return { sql: "ALTER TABLE " + tableSql + " RENAME COLUMN " + q(form.oldColumn.trim()) + " TO " + q(form.newColumn.trim()) + ";", params, error: "" };
      case "alias":
        if (!validIdentifier(form.alias.trim()) || !columns) return { sql: "", params, error: "Укажи псевдоним и список столбцов." };
        const selected = columns.map((column, index) => index === 0 ? q(column) + " AS " + form.alias.trim() : q(column)).join(", ");
        return { sql: "SELECT " + selected + "\nFROM " + tableSql + ";", params, error: "" };
      default:
        return { sql: "", params, error: "Выбери поддерживаемый тип запроса." };
    }
  } catch (error) {
    return { sql: "", params, error: error instanceof Error ? error.message : "Не удалось собрать запрос." };
  }
}

const fieldClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function DatabaseWorkbenchModule() {
  const [tab, setTab] = useState<"builder" | "reference" | "checks">("builder");
  const [dialect, setDialect] = useState<Dialect>("postgres");
  const [operation, setOperation] = useState<Operation>("select");
  const [form, setForm] = useState<BuilderState>(initial);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const generated = useMemo(() => buildSql(operation, dialect, form), [operation, dialect, form]);
  const update = (key: keyof BuilderState, value: string | boolean | CorrelatedSubqueryLevel[]) => setForm((current) => ({ ...current, [key]: value } as BuilderState));
  const updateCondition = (id: number, key: keyof Omit<FilterCondition, "id">, value: string | number | boolean) => setForm((current) => ({ ...current, conditions: current.conditions.map((condition) => condition.id === id ? { ...condition, [key]: value } : condition) }));
  const addCondition = () => setForm((current) => ({ ...current, conditions: [...current.conditions, { id: Math.max(0, ...current.conditions.map((condition) => condition.id)) + 1, column: "", operator: "=", value: "", connector: "AND", openGroups: 0, closeGroups: 0, negate: false, subqueryTable: "orders", subquerySelectColumn: "user_id", subqueryFilterColumn: "status", subqueryFilterOperator: "=", subqueryFilterValue: "paid" }] }));
  const removeCondition = (id: number) => setForm((current) => ({ ...current, conditions: current.conditions.filter((condition) => condition.id !== id) }));
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const filteredSnippets = snippets.filter((item) => (item.title + item.group + item.sql + item.note).toLocaleLowerCase("ru").includes(search.toLocaleLowerCase("ru")));

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Database className="h-5 w-5" /></div>
          <h2 className="text-xl font-semibold">Работа с базами данных</h2>
        </div>
        <p className="text-sm text-muted-foreground">Инструмент для QA: собери SQL-запрос и скопируй его в свой SQL-клиент.</p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { id: "builder" as const, title: "Конструктор запросов", desc: "Собрать SQL по полям", icon: <WandSparkles className="h-4 w-4" /> },
          { id: "reference" as const, title: "Шпаргалка SQL", desc: "Команды и примеры", icon: <BookOpen className="h-4 w-4" /> },
          { id: "checks" as const, title: "Проверки QA", desc: "Готовые запросы для тестов", icon: <ShieldCheck className="h-4 w-4" /> },
        ].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={"rounded-xl border p-3 text-left transition-colors " + (tab === item.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40")}>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">{item.icon}{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.desc}</span>
          </button>
        ))}
      </div>

      {tab === "builder" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <div><p className="text-sm font-semibold">1. Что нужно сделать?</p><p className="text-xs text-muted-foreground">Выбери тип SQL-запроса.</p></div>
            <select value={operation} onChange={(event) => { const next = event.target.value as Operation; setOperation(next); if (next === "aggregate" || next === "advancedSelect") setForm((current) => ({ ...current, conditions: [] })); }} className={fieldClass + " max-w-xs"}>
              <option value="advancedSelect">Расширенный SELECT — JOIN / CASE / GROUP BY / HAVING / ORDER BY</option>
              <option value="select">Получить данные — SELECT</option>
              <option value="aggregate">Сгруппировать и посчитать — GROUP BY</option>
              <option value="join">Объединить таблицы — JOIN</option>
              <option value="subquery">Подзапросы — IN / EXISTS / SELECT</option>
              <option value="cte">Именованный набор — CTE / WITH</option>
              <option value="createTableAs">Создать таблицу из SELECT — CREATE TABLE AS</option>
              <option value="createTable">Создать структуру таблицы — CREATE TABLE</option>
              <option value="alterTable">Изменить структуру — ALTER TABLE</option>
              <option value="dropTable">Удалить таблицу — DROP TABLE</option>
              <option value="truncateTable">Очистить таблицу — TRUNCATE TABLE</option>
              <option value="insert">Добавить запись — INSERT</option>
              <option value="update">Изменить запись — UPDATE</option>
              <option value="delete">Удалить запись — DELETE</option>
              <option value="rename">Переименовать столбец в БД</option>
              <option value="alias">Псевдоним столбца — AS</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">2. Параметры запроса</p><select aria-label="Диалект SQL" value={dialect} onChange={(event) => setDialect(event.target.value as Dialect)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"><option value="postgres">PostgreSQL</option><option value="mysql">MySQL</option></select></div>
              {operation !== "createTableAs" && <div><label className={labelClass}>Название таблицы</label><input value={form.table} onChange={(event) => update("table", event.target.value)} className={fieldClass} placeholder="users" /></div>}
              {operation === "advancedSelect" && <div className="space-y-3 rounded-lg border border-primary/20 bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Собирай сложный SELECT: по одному выражению на строку, каждый JOIN — отдельной строкой. WHERE использует общий редактор условий ниже.</p><label className={labelClass}>Псевдоним основной таблицы (необязательно)</label><input value={form.advancedFromAlias} onChange={(event) => update("advancedFromAlias", event.target.value)} className={fieldClass} placeholder="u" /><label className={labelClass}>SELECT — столбцы, агрегаты, арифметика, CASE WHEN (по одному выражению на строку)</label><textarea value={form.advancedSelectItems} onChange={(event) => update("advancedSelectItems", event.target.value)} className={fieldClass + " min-h-24"} placeholder={"u.id AS user_id\nu.email\nCOUNT(o.id) AS orders_count"} /><label className={labelClass}>JOIN (каждый с новой строки)</label><textarea value={form.advancedJoins} onChange={(event) => update("advancedJoins", event.target.value)} className={fieldClass + " min-h-20"} placeholder={"LEFT JOIN orders AS o ON o.user_id = u.id\nLEFT JOIN payments AS p ON p.order_id = o.id"} /><label className={labelClass}>GROUP BY (через запятую, необязательно)</label><input value={form.advancedGroupBy} onChange={(event) => update("advancedGroupBy", event.target.value)} className={fieldClass} placeholder="u.id, u.email" /><label className={labelClass}>HAVING (каждое условие с новой строки, агрегаты)</label><textarea value={form.advancedHaving} onChange={(event) => update("advancedHaving", event.target.value)} className={fieldClass + " min-h-16"} placeholder={"COUNT(o.id) > 1\nSUM(o.amount) >= 100"} /><label className={labelClass}>ORDER BY (через запятую, направление у каждого поля)</label><input value={form.advancedOrderBy} onChange={(event) => update("advancedOrderBy", event.target.value)} className={fieldClass} placeholder="orders_count DESC, u.email ASC" /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.distinct} onChange={(event) => update("distinct", event.target.checked)} />DISTINCT</label><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>LIMIT</label><input value={form.limit} onChange={(event) => update("limit", event.target.value)} className={fieldClass} /></div><div><label className={labelClass}>OFFSET</label><input value={form.offset} onChange={(event) => update("offset", event.target.value)} className={fieldClass} /></div></div></div>}
              {(operation === "select" || operation === "subquery" || operation === "cte" || operation === "insert" || operation === "alias") && <div><label className={labelClass}>Столбцы, которые нужно вывести через запятую</label><input value={form.columns} onChange={(event) => update("columns", event.target.value)} className={fieldClass} placeholder="id, email, created_at" /><p className="mt-1 text-[11px] text-muted-foreground">Для SELECT можно указать * — все столбцы.</p></div>}
              {operation === "aggregate" && <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div><label className={labelClass}>Группировать по (один или несколько столбцов)</label><input value={form.groupBy} onChange={(event) => update("groupBy", event.target.value)} className={fieldClass} placeholder="status, department" /><label className={labelClass + " mt-2"}>Псевдонимы столбцов группировки (необязательно)</label><input value={form.groupAliases} onChange={(event) => update("groupAliases", event.target.value)} className={fieldClass} placeholder="Статус, Отдел" /><p className="mt-1 text-[11px] text-muted-foreground">Можно группировать по любым полям текущей таблицы. Перечисли несколько столбцов через запятую. Если псевдонимы не нужны, оставь поле пустым.</p></div>
                <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">Агрегатные показатели</p><button type="button" onClick={() => setForm((current) => ({ ...current, aggregates: [...current.aggregates, { id: Math.max(0, ...current.aggregates.map((metric) => metric.id)) + 1, fn: "COUNT", column: "*", alias: "total" }] }))} className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-background">+ Добавить показатель</button></div>
                {form.aggregates.map((metric, index) => <div key={metric.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Показатель {index + 1}</span>{form.aggregates.length > 1 && <button type="button" onClick={() => setForm((current) => ({ ...current, aggregates: current.aggregates.filter((item) => item.id !== metric.id) }))} className="text-xs text-destructive hover:underline">Удалить</button>}</div>
                  <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Функция</label><select value={metric.fn} onChange={(event) => setForm((current) => ({ ...current, aggregates: current.aggregates.map((item) => item.id === metric.id ? { ...item, fn: event.target.value as AggregateFunction } : item) }))} className={fieldClass}><option value="COUNT">COUNT — посчитать</option><option value="COUNT_DISTINCT">COUNT DISTINCT — уникальные</option><option value="SUM">SUM — сумма</option><option value="AVG">AVG — среднее</option><option value="MIN">MIN — минимум</option><option value="MAX">MAX — максимум</option></select></div><div><label className={labelClass}>Столбец</label><input value={metric.column} onChange={(event) => setForm((current) => ({ ...current, aggregates: current.aggregates.map((item) => item.id === metric.id ? { ...item, column: event.target.value } : item) }))} className={fieldClass} placeholder="* или book_id" /></div></div>
                  <div><label className={labelClass}>Название столбца в результате (AS)</label><input value={metric.alias} onChange={(event) => setForm((current) => ({ ...current, aggregates: current.aggregates.map((item) => item.id === metric.id ? { ...item, alias: event.target.value } : item) }))} className={fieldClass} placeholder="Количество_экземпляров" /></div>
                </div>)}
                <p className="text-[11px] leading-relaxed text-muted-foreground">Выбирай агрегатные функции и столбцы под свою задачу: COUNT(*) считает строки, COUNT(column) — непустые значения, COUNT(DISTINCT column) — уникальные значения, SUM — сумму, AVG — среднее, MIN и MAX — минимум и максимум. COUNT(column) и COUNT(DISTINCT column) не учитывают NULL.</p>
              </div>}
              {operation === "createTableAs" && <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">CREATE TABLE AS создаёт физическую таблицу из результата SELECT. Скалярный подзапрос можно использовать как вычисляемый столбец в SELECT и как правую часть сравнения в WHERE.</p>
                <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Новая таблица</label><input value={form.ctasTable} onChange={(event) => update("ctasTable", event.target.value)} className={fieldClass} placeholder="ordering" /></div><div><label className={labelClass}>Исходная таблица</label><input value={form.ctasSourceTable} onChange={(event) => update("ctasSourceTable", event.target.value)} className={fieldClass} placeholder="book" /></div></div>
                <div><label className={labelClass}>Обычные столбцы SELECT</label><input value={form.ctasColumns} onChange={(event) => update("ctasColumns", event.target.value)} className={fieldClass} placeholder="author, title" /></div>
                <div className="rounded-lg border border-border bg-card p-3 space-y-2"><p className="text-xs font-semibold">Скалярный подзапрос в SELECT</p><div className="grid grid-cols-2 gap-2"><div className="col-span-2"><label className={labelClass}>Результат SELECT</label><select value={form.ctasSelectKind} onChange={(event) => update("ctasSelectKind", event.target.value)} className={fieldClass}><option value="aggregate">Агрегатная функция</option><option value="column">Обычный столбец</option></select></div>{form.ctasSelectKind === "aggregate" && <div><label className={labelClass}>Агрегатная функция</label><select value={form.ctasAggregate} onChange={(event) => update("ctasAggregate", event.target.value)} className={fieldClass}>{["AVG", "SUM", "MIN", "MAX"].map((fn) => <option key={fn}>{fn}</option>)}</select></div>}<div className={form.ctasSelectKind === "column" ? "col-span-2" : ""}><label className={labelClass}>Столбец</label><input value={form.ctasAggregateColumn} onChange={(event) => update("ctasAggregateColumn", event.target.value)} className={fieldClass} placeholder="amount" /></div><div className="col-span-2"><label className={labelClass}>Псевдоним вычисляемого столбца</label><input value={form.ctasSelectAlias} onChange={(event) => update("ctasSelectAlias", event.target.value)} className={fieldClass} placeholder="amount" /></div></div></div>
                <div className="rounded-lg border border-border bg-card p-3 space-y-2"><p className="text-xs font-semibold">Скалярный подзапрос в WHERE</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Столбец внешней таблицы</label><input value={form.ctasWhereColumn} onChange={(event) => update("ctasWhereColumn", event.target.value)} className={fieldClass} placeholder="amount" /></div><div><label className={labelClass}>Оператор</label><select value={form.ctasWhereOperator} onChange={(event) => update("ctasWhereOperator", event.target.value)} className={fieldClass}>{["<", "<=", "=", "<>", ">=", ">"].map((op) => <option key={op}>{op}</option>)}</select></div></div><p className="text-[11px] text-muted-foreground">Подзапрос возвращает одно значение — например, AVG(amount) по всей исходной таблице. Оно сравнивается со значением каждой строки.</p>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.ctasScalarFilterEnabled} onChange={(event) => update("ctasScalarFilterEnabled", event.target.checked)} />Добавить ещё один уровень вложенности внутрь скалярного подзапроса</label>
                  {form.ctasScalarFilterEnabled && <div className="space-y-3 rounded-md border border-dashed border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold">Динамические уровни вложенного SELECT</p><button type="button" onClick={() => setForm((current) => ({ ...current, ctasSubqueryLevels: [...current.ctasSubqueryLevels.map((level, index) => index === current.ctasSubqueryLevels.length - 1 ? { ...level, filterEnabled: true } : level), { id: Math.max(1, ...current.ctasSubqueryLevels.map((level) => level.id)) + 1, table: "book", selectKind: "aggregate", aggregate: "AVG", column: "amount", filterEnabled: false, filterColumn: "amount", filterOperator: ">", filterValue: "0" }] }))} className="rounded-md border border-primary px-2 py-1 text-xs text-primary">+ Добавить уровень</button></div>
                    {form.ctasSubqueryLevels.map((level, index) => <div key={level.id} className="space-y-2 rounded-md border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">Уровень {index + 2}</p>{form.ctasSubqueryLevels.length > 1 && <button type="button" onClick={() => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.filter((item) => item.id !== level.id) }))} className="text-xs text-destructive">Удалить уровень</button>}</div>
                      <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Таблица</label><input value={level.table} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, table: event.target.value } : item) }))} className={fieldClass} /></div><div><label className={labelClass}>Что вернуть</label><select value={level.selectKind} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, selectKind: event.target.value as SubqueryLevel["selectKind"] } : item) }))} className={fieldClass}><option value="aggregate">Агрегат</option><option value="column">Обычный столбец</option></select></div>
                      {level.selectKind === "aggregate" && <div><label className={labelClass}>Агрегат</label><select value={level.aggregate} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, aggregate: event.target.value as SubqueryLevel["aggregate"] } : item) }))} className={fieldClass}>{["AVG", "SUM", "MIN", "MAX"].map((fn) => <option key={fn}>{fn}</option>)}</select></div>}<div className={level.selectKind === "column" ? "col-span-2" : ""}><label className={labelClass}>Столбец результата</label><input value={level.column} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, column: event.target.value } : item) }))} className={fieldClass} /></div></div>
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={level.filterEnabled} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, filterEnabled: event.target.checked } : item) }))} />Добавить независимый WHERE</label>
                      {level.filterEnabled && <div className="grid grid-cols-3 gap-2"><div><label className={labelClass}>Столбец WHERE</label><input value={level.filterColumn} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, filterColumn: event.target.value } : item) }))} className={fieldClass} /></div><div><label className={labelClass}>Оператор</label><select value={level.filterOperator} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, filterOperator: event.target.value as SubqueryLevel["filterOperator"] } : item) }))} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<="].map((op) => <option key={op}>{op}</option>)}</select></div><div><label className={labelClass}>Значение</label><input value={level.filterValue} onChange={(event) => setForm((current) => ({ ...current, ctasSubqueryLevels: current.ctasSubqueryLevels.map((item) => item.id === level.id ? { ...item, filterValue: event.target.value } : item) }))} className={fieldClass} /></div></div>}
                    </div>)}
                    <p className="text-[11px] text-muted-foreground">Каждый уровень имеет собственные SELECT, FROM и WHERE. Добавляй столько уровней, сколько требует запрос; обычный столбец в скалярном SELECT должен возвращать не более одной строки.</p>
                  </div>}
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={form.ctasAppendSelect} onChange={(event) => update("ctasAppendSelect", event.target.checked)} />После создания сразу добавить SELECT * из новой таблицы</label>
              </div>}

              {(operation === "select" || operation === "advancedSelect" || operation === "aggregate" || operation === "join" || operation === "update" || operation === "delete") && (
                <div className="space-y-3 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">Условия WHERE</p><button type="button" onClick={addCondition} className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-background">+ Добавить условие</button></div>
                  {form.conditions.map((condition, index) => <div key={condition.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Условие {index + 1}</span>{form.conditions.length > 1 && <button type="button" onClick={() => removeCondition(condition.id)} className="text-xs text-destructive hover:underline">Удалить</button>}</div>
                    {index > 0 && <select aria-label={"Связка перед условием " + (index + 1)} value={condition.connector} onChange={(event) => updateCondition(condition.id, "connector", event.target.value)} className={fieldClass}><option value="AND">AND — должны выполняться оба условия</option><option value="OR">OR — достаточно одного условия</option></select>}
                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={condition.negate} onChange={(event) => updateCondition(condition.id, "negate", event.target.checked)} />Применить NOT к этому условию</label>
                    <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Открыть скобки перед условием</label><select aria-label={"Открывающие скобки перед условием " + (index + 1)} value={condition.openGroups} onChange={(event) => updateCondition(condition.id, "openGroups", Number(event.target.value))} className={fieldClass}>{[0,1,2,3,4].map((count) => <option key={count} value={count}>{count === 0 ? "Без скобки" : "(".repeat(count) + " — " + count}</option>)}</select></div><div><label className={labelClass}>Закрыть скобки после условия</label><select aria-label={"Закрывающие скобки после условия " + (index + 1)} value={condition.closeGroups} onChange={(event) => updateCondition(condition.id, "closeGroups", Number(event.target.value))} className={fieldClass}>{[0,1,2,3,4].map((count) => <option key={count} value={count}>{count === 0 ? "Без скобки" : ")".repeat(count) + " — " + count}</option>)}</select></div></div>
                    <div className="grid grid-cols-[1fr_auto] gap-2"><input aria-label={"Столбец условия " + (index + 1)} value={condition.column} onChange={(event) => updateCondition(condition.id, "column", event.target.value)} className={fieldClass} placeholder="Например, status или orders.status" /><select aria-label={"Оператор условия " + (index + 1)} value={condition.operator} onChange={(event) => updateCondition(condition.id, "operator", event.target.value)} className={fieldClass + " w-auto"}>{["=", "<>", ">", ">=", "<", "<=", "LIKE", "IN", "IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)", "BETWEEN", "IS NULL", "IS NOT NULL"].map((operator) => <option key={operator}>{operator}</option>)}</select></div>
                    {![ "IS NULL", "IS NOT NULL", "IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)" ].includes(condition.operator) && <div><label className={labelClass}>{condition.operator === "BETWEEN" ? "Границы диапазона (от, до)" : condition.operator === "IN" ? "Список значений" : condition.operator === "LIKE" ? "Шаблон LIKE" : "Значение параметра"}</label><input aria-label={"Значение условия " + (index + 1)} value={condition.value} onChange={(event) => updateCondition(condition.id, "value", event.target.value)} className={fieldClass} placeholder={condition.operator === "IN" ? "Например: new, active, pending" : condition.operator === "BETWEEN" ? "Например: 100, 500" : condition.operator === "LIKE" ? "Например: Ан%, %ов, а_я" : "Например, 42 или active"} /></div>}
                    {(["IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)"].includes(condition.operator)) && <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3"><p className="text-xs font-semibold">Подзапрос для условия {index + 1}</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Внутренняя таблица</label><input value={condition.subqueryTable} onChange={(event) => updateCondition(condition.id, "subqueryTable", event.target.value)} className={fieldClass} placeholder="orders" /></div><div><label className={labelClass}>{condition.operator.includes("EXISTS") ? "Внутренний столбец связи" : "Столбец результата"}</label><input value={condition.subquerySelectColumn} onChange={(event) => updateCondition(condition.id, "subquerySelectColumn", event.target.value)} className={fieldClass} placeholder="user_id" /></div></div><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Внутренний фильтр (необязательно)</label><input value={condition.subqueryFilterColumn} onChange={(event) => updateCondition(condition.id, "subqueryFilterColumn", event.target.value)} className={fieldClass} placeholder="status" /></div><div><label className={labelClass}>Оператор фильтра</label><select value={condition.subqueryFilterOperator} onChange={(event) => updateCondition(condition.id, "subqueryFilterOperator", event.target.value)} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<=", "LIKE"].map((op) => <option key={op}>{op}</option>)}</select></div><div className="col-span-2"><label className={labelClass}>Значение внутреннего фильтра</label><input value={condition.subqueryFilterValue} onChange={(event) => updateCondition(condition.id, "subqueryFilterValue", event.target.value)} className={fieldClass} placeholder="paid" /></div></div><p className="text-[11px] text-muted-foreground">Для IN/NOT IN выбирается столбец результата; для EXISTS/NOT EXISTS он связывается с внешним столбцом условия. Подзапрос встраивается в WHERE, поэтому несколько таких условий можно объединять с обычными через AND/OR и скобки. Для NOT IN проверь, что подзапрос не возвращает NULL.</p></div>}
                  </div>)}
                  <p className="text-[11px] text-muted-foreground">Значения будут безопасно экранированы и показаны непосредственно в готовом SQL. Для BETWEEN укажи две границы через запятую; обе границы включаются в диапазон. Для IN перечисли значения через запятую. Для LIKE используй шаблон: % означает ноль или более любых символов, _ — ровно один любой символ. Например, «Ан%» — начинается с «Ан», «%ов» — заканчивается на «ов», «а_я» — три символа, где средний любой. BETWEEN и IN имеют тот же приоритет, что и операторы сравнения: они выполняются раньше NOT, AND и OR. AND требует выполнения обоих условий, OR — хотя бы одного. В SQL AND имеет более высокий приоритет, чем OR: A OR B AND C читается как A OR (B AND C). Для группировки условий используй поля открытия и закрытия скобок. Можно создавать несколько уровней вложенности и применять NOT к отдельным условиям; конструктор проверит баланс скобок.</p>{(operation === "update" || operation === "delete") && form.conditions.some((condition, index) => index > 0 && condition.connector === "OR") && <p className="text-[11px] font-medium text-amber-600">Внимание: OR может расширить набор изменяемых или удаляемых записей. Проверь итоговый WHERE особенно внимательно.</p>}
                </div>
              )}
              {operation === "select" && <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"><label className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><input type="checkbox" checked={form.distinct} onChange={(event) => update("distinct", event.target.checked)} />Убрать повторяющиеся строки (DISTINCT)</label><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Сортировать по</label><input value={form.orderColumn} onChange={(event) => update("orderColumn", event.target.value)} className={fieldClass} placeholder="created_at" /></div><div><label className={labelClass}>Порядок</label><select value={form.orderDirection} onChange={(event) => update("orderDirection", event.target.value)} className={fieldClass}><option>DESC</option><option>ASC</option></select></div><div><label className={labelClass}>LIMIT</label><input value={form.limit} onChange={(event) => update("limit", event.target.value)} className={fieldClass} placeholder="50" /></div><div><label className={labelClass}>OFFSET</label><input value={form.offset} onChange={(event) => update("offset", event.target.value)} className={fieldClass} placeholder="0" /></div></div><p className="text-[11px] text-muted-foreground">DISTINCT удаляет дубликаты строк результата. LIMIT ограничивает число строк, OFFSET пропускает указанное число строк.</p></div>}
              {operation === "aggregate" && <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs font-semibold">Фильтрация групп и сортировка</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>HAVING: псевдоним агрегата</label><input value={form.havingAlias} onChange={(event) => update("havingAlias", event.target.value)} className={fieldClass} placeholder="total" /></div><div><label className={labelClass}>Оператор</label><select value={form.havingOperator} onChange={(event) => update("havingOperator", event.target.value)} className={fieldClass}>{[">", ">=", "=", "<>", "<=", "<"].map((item) => <option key={item}>{item}</option>)}</select></div><div><label className={labelClass}>Значение HAVING</label><input value={form.havingValue} onChange={(event) => update("havingValue", event.target.value)} className={fieldClass} placeholder="5" /></div><div><label className={labelClass}>ORDER BY</label><input value={form.orderColumn} onChange={(event) => update("orderColumn", event.target.value)} className={fieldClass} placeholder="total или status" /></div><div><label className={labelClass}>LIMIT</label><input value={form.limit} onChange={(event) => update("limit", event.target.value)} className={fieldClass} placeholder="50" /></div><div><label className={labelClass}>OFFSET</label><input value={form.offset} onChange={(event) => update("offset", event.target.value)} className={fieldClass} placeholder="0" /></div><div><label className={labelClass}>Направление сортировки</label><select value={form.orderDirection} onChange={(event) => update("orderDirection", event.target.value)} className={fieldClass}><option>DESC</option><option>ASC</option></select></div></div><p className="text-[11px] text-muted-foreground">WHERE фильтрует строки до группировки; HAVING — уже сформированные группы. В HAVING указывай псевдоним одного из агрегатов.</p></div>}
              {operation === "cte" && <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">CTE создаёт именованный временный результат в рамках одного SQL-запроса. Сначала формируется выборка внутри WITH, затем внешний SELECT обращается к её имени.</p>
                <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Имя CTE</label><input value={form.cteName} onChange={(event) => update("cteName", event.target.value)} className={fieldClass} placeholder="filtered_orders" /></div><div><label className={labelClass}>Исходная таблица</label><input value={form.cteSourceTable} onChange={(event) => update("cteSourceTable", event.target.value)} className={fieldClass} placeholder="orders" /></div></div>
                <div><label className={labelClass}>Столбцы внутри CTE</label><input value={form.cteColumns} onChange={(event) => update("cteColumns", event.target.value)} className={fieldClass} placeholder="id, user_id, total" /></div>
                <div><label className={labelClass}>Столбцы внешнего SELECT</label><input value={form.cteResultColumns} onChange={(event) => update("cteResultColumns", event.target.value)} className={fieldClass} placeholder="id, total" /><p className="mt-1 text-[11px] text-muted-foreground">Выбирай только поля, которые включены в столбцы CTE выше.</p></div>
                <div className="rounded-lg border border-border bg-card p-3"><p className="mb-2 text-xs font-semibold">Фильтр внутри WITH (необязательно)</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Столбец</label><input value={form.cteFilterColumn} onChange={(event) => update("cteFilterColumn", event.target.value)} className={fieldClass} placeholder="status" /></div><div><label className={labelClass}>Оператор</label><select value={form.cteFilterOperator} onChange={(event) => update("cteFilterOperator", event.target.value)} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<=", "LIKE"].map((op) => <option key={op}>{op}</option>)}</select></div><div className="col-span-2"><label className={labelClass}>Значение</label><input value={form.cteFilterValue} onChange={(event) => update("cteFilterValue", event.target.value)} className={fieldClass} placeholder="paid" /></div></div></div>
                <div className="rounded-lg border border-border bg-card p-3"><p className="mb-2 text-xs font-semibold">Фильтр внешнего SELECT (необязательно)</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Столбец</label><input value={form.cteOuterFilterColumn} onChange={(event) => update("cteOuterFilterColumn", event.target.value)} className={fieldClass} placeholder="total" /></div><div><label className={labelClass}>Оператор</label><select value={form.cteOuterFilterOperator} onChange={(event) => update("cteOuterFilterOperator", event.target.value)} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<=", "LIKE"].map((op) => <option key={op}>{op}</option>)}</select></div><div className="col-span-2"><label className={labelClass}>Значение</label><input value={form.cteOuterFilterValue} onChange={(event) => update("cteOuterFilterValue", event.target.value)} className={fieldClass} placeholder="100" /></div></div></div>
              </div>}
              {operation === "subquery" && <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div><label className={labelClass}>Тип подзапроса</label><select value={form.subqueryMode} onChange={(event) => update("subqueryMode", event.target.value)} className={fieldClass}><option value="SCALAR">Скалярный — сравнение с одним значением</option><option value="IN">IN — значение входит в результат</option><option value="NOT IN">NOT IN — значения нет в результате</option><option value="EXISTS">EXISTS — связанная запись существует</option><option value="NOT EXISTS">NOT EXISTS — связанной записи нет</option></select></div>
                <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Внешняя таблица</label><input value={form.table} onChange={(event) => update("table", event.target.value)} className={fieldClass} /></div>{!form.subqueryMode.includes("EXISTS") && <div><label className={labelClass}>Внешний столбец</label><input value={form.subqueryColumn} onChange={(event) => update("subqueryColumn", event.target.value)} className={fieldClass} placeholder="id" /></div>}</div>
                {form.subqueryMode.includes("EXISTS") && <div className="space-y-3 rounded-lg border border-primary/20 bg-card p-3">
                  <div><label className={labelClass}>Псевдоним внешней таблицы</label><input value={form.subqueryOuterAlias} onChange={(event) => update("subqueryOuterAlias", event.target.value)} className={fieldClass} placeholder="u" /></div>
                  <p className="text-xs text-muted-foreground">Каждый уровень может ссылаться на непосредственный внешний запрос или на любой более высокий уровень по его псевдониму.</p>
                  {form.correlatedLevels.map((level, index) => <div key={level.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold">Уровень корреляции {index + 1}</p><button type="button" disabled={form.correlatedLevels.length === 1} onClick={() => update("correlatedLevels", form.correlatedLevels.filter((item) => item.id !== level.id))} className="text-xs text-destructive disabled:opacity-40">Удалить</button></div>
                    <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Внутренняя таблица</label><input value={level.table} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, table: event.target.value } : item))} className={fieldClass} placeholder="orders" /></div><div><label className={labelClass}>Псевдоним</label><input value={level.alias} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, alias: event.target.value } : item))} className={fieldClass} placeholder="o" /></div><div><label className={labelClass}>Столбец связи внутри</label><input value={level.innerColumn} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, innerColumn: event.target.value } : item))} className={fieldClass} placeholder="user_id" /></div><div><label className={labelClass}>Уровень внешней ссылки</label><select value={String(level.outerDepth)} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, outerDepth: Number(event.target.value) } : item))} className={fieldClass}>{Array.from({ length: index + 1 }, (_, depth) => <option key={depth + 1} value={depth + 1}>{depth === 0 ? "Непосредственный внешний" : "На " + (depth + 1) + " уровня выше"}</option>)}</select></div><div className="col-span-2"><label className={labelClass}>Столбец внешней таблицы для связи</label><input value={level.outerColumn} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, outerColumn: event.target.value } : item))} className={fieldClass} placeholder="id / order_id" /></div></div>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={level.filterEnabled} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, filterEnabled: event.target.checked } : item))} />Дополнительный локальный WHERE</label>
                    {level.filterEnabled && <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Столбец фильтра</label><input value={level.filterColumn} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, filterColumn: event.target.value } : item))} className={fieldClass} /></div><div><label className={labelClass}>Оператор</label><select value={level.filterOperator} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, filterOperator: event.target.value as CorrelatedSubqueryLevel["filterOperator"] } : item))} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<=", "LIKE"].map((op) => <option key={op}>{op}</option>)}</select></div><div className="col-span-2"><label className={labelClass}>Значение</label><input value={level.filterValue} onChange={(event) => update("correlatedLevels", form.correlatedLevels.map((item) => item.id === level.id ? { ...item, filterValue: event.target.value } : item))} className={fieldClass} /></div></div>}
                  </div>)}
                  <button type="button" onClick={() => update("correlatedLevels", [...form.correlatedLevels, { id: Math.max(0, ...form.correlatedLevels.map((item) => item.id)) + 1, table: "payments", alias: "p", innerColumn: "order_id", outerDepth: 1, outerColumn: "id", filterEnabled: false, filterColumn: "status", filterOperator: "=" as const, filterValue: "paid" }])} className="rounded-md border border-border px-3 py-2 text-xs font-medium">Добавить вложенный уровень</button>
                </div>}
                {form.subqueryMode === "SCALAR" && <div><label className={labelClass}>Оператор сравнения</label><select value={form.subqueryOperator} onChange={(event) => update("subqueryOperator", event.target.value)} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<="].map((op) => <option key={op}>{op}</option>)}</select></div>}
                {!form.subqueryMode.includes("EXISTS") && <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Таблица подзапроса</label><input value={form.subqueryTable} onChange={(event) => update("subqueryTable", event.target.value)} className={fieldClass} placeholder="orders" /></div><div><label className={labelClass}>Столбец результата</label><input value={form.subquerySelectColumn} onChange={(event) => update("subquerySelectColumn", event.target.value)} className={fieldClass} placeholder="user_id" /></div></div>}
                {form.subqueryMode.includes("EXISTS") && <p className="text-[11px] text-muted-foreground">Для EXISTS строится коррелированный подзапрос: внутренний столбец сравнивается с внешним. Дополнительный фильтр добавляется через AND.</p>}
                {!form.subqueryMode.includes("EXISTS") && <div className="rounded-lg border border-border bg-card p-3"><p className="mb-2 text-xs font-semibold">Необязательный фильтр внутри подзапроса</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Столбец</label><input value={form.subqueryFilterColumn} onChange={(event) => update("subqueryFilterColumn", event.target.value)} className={fieldClass} placeholder="status" /></div><div><label className={labelClass}>Оператор</label><select value={form.subqueryFilterOperator} onChange={(event) => update("subqueryFilterOperator", event.target.value)} className={fieldClass}>{["=", "<>", ">", ">=", "<", "<=", "LIKE"].map((op) => <option key={op}>{op}</option>)}</select></div><div className="col-span-2"><label className={labelClass}>Значение</label><input value={form.subqueryFilterValue} onChange={(event) => update("subqueryFilterValue", event.target.value)} className={fieldClass} placeholder="paid" /></div></div></div>}
              </div>}
              {operation === "join" && <div className="space-y-2"><div><label className={labelClass}>Дополнительные таблицы (через запятую)</label><input value={form.secondTable} onChange={(event) => update("secondTable", event.target.value)} className={fieldClass} placeholder="orders, payments" /></div><div><label className={labelClass}>Тип JOIN</label><select value={form.joinType} onChange={(event) => update("joinType", event.target.value)} className={fieldClass}>{["INNER", "LEFT", "RIGHT", "FULL OUTER"].map((type) => <option key={type}>{type}</option>)}</select></div><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Левые ключи (через запятую)</label><input value={form.leftKey} onChange={(event) => update("leftKey", event.target.value)} className={fieldClass} placeholder="users.id, orders.id" /></div><div><label className={labelClass}>Правые ключи (через запятую)</label><input value={form.rightKey} onChange={(event) => update("rightKey", event.target.value)} className={fieldClass} placeholder="orders.user_id, payments.order_id" /></div></div></div>}
              {operation === "createTable" && <div className="space-y-2"><label className={labelClass}>Определения столбцов (по одному на строку)</label><textarea value={form.ddlColumns} onChange={(event) => update("ddlColumns", event.target.value)} className={fieldClass + " min-h-36"} placeholder={"id BIGINT PRIMARY KEY\nemail VARCHAR(255) NOT NULL UNIQUE\nstatus VARCHAR(30) DEFAULT 'active'"} /><p className="text-[11px] text-muted-foreground">Поддерживаются числовые, строковые, даты, BOOLEAN, JSON/JSONB, NULL/NOT NULL, DEFAULT, UNIQUE, PRIMARY KEY, REFERENCES и простой CHECK.</p></div>}
              {operation === "alterTable" && <div className="space-y-2"><label className={labelClass}>Действие</label><select value={form.alterAction} onChange={(event) => update("alterAction", event.target.value)} className={fieldClass}><option value="add">Добавить столбец</option><option value="drop">Удалить столбец</option><option value="rename">Переименовать столбец</option><option value="type">Изменить тип столбца</option></select><label className={labelClass}>Столбец</label><input value={form.alterColumn} onChange={(event) => update("alterColumn", event.target.value)} className={fieldClass} />{form.alterAction === "add" && <><label className={labelClass}>Полное определение</label><input value={form.alterDefinition} onChange={(event) => update("alterDefinition", event.target.value)} className={fieldClass} placeholder="phone VARCHAR(30)" /></>}{form.alterAction === "rename" && <><label className={labelClass}>Новое имя</label><input value={form.alterNewName} onChange={(event) => update("alterNewName", event.target.value)} className={fieldClass} /></>}{form.alterAction === "type" && <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Тип</label><input value={form.alterDataType} onChange={(event) => update("alterDataType", event.target.value)} className={fieldClass} placeholder="VARCHAR" /></div><div><label className={labelClass}>Размер</label><input value={form.alterTypeSize} onChange={(event) => update("alterTypeSize", event.target.value)} className={fieldClass} placeholder="255" /></div></div>}</div>}
              {(operation === "dropTable" || operation === "truncateTable") && <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"><p className="text-xs text-destructive font-medium">{operation === "dropTable" ? "DROP TABLE удаляет таблицу вместе со структурой." : "TRUNCATE TABLE удаляет все строки таблицы."} Конструктор только формирует SQL и ничего не выполняет.</p><label className={labelClass}>Для подтверждения повтори имя таблицы: {form.table}</label><input value={form.confirmTable} onChange={(event) => update("confirmTable", event.target.value)} className={fieldClass} placeholder={form.table} />{operation === "dropTable" && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.ifExists} onChange={(event) => update("ifExists", event.target.checked)} />Добавить IF EXISTS</label>}</div>}
              {operation === "insert" && <div className="space-y-2"><label className={labelClass}>Строки значений (одна строка = одна запись; разделитель столбцов |)</label><textarea value={form.insertValues} onChange={(event) => update("insertValues", event.target.value)} className={fieldClass + " min-h-20"} placeholder={"101 | qa@example.com\n102 | dev@example.com"} /><label className={labelClass}>Или SELECT вместо VALUES (необязательно)</label><textarea value={form.insertSelectSql} onChange={(event) => update("insertSelectSql", event.target.value)} className={fieldClass + " min-h-20"} placeholder={"SELECT id, email FROM imported_users"} /></div>}
              {operation === "update" && <div className="space-y-2"><label className={labelClass}>SET — одно присваивание на строку</label><textarea value={form.updateAssignments} onChange={(event) => update("updateAssignments", event.target.value)} className={fieldClass + " min-h-20"} placeholder={"status = active\nupdated_at = CURRENT_TIMESTAMP"} /><p className="text-[11px] text-muted-foreground">Для UPDATE обязательно заполни WHERE ниже. Несколько полей можно изменить одним запросом.</p></div>}
              {operation === "rename" && <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Старое имя</label><input value={form.oldColumn} onChange={(event) => update("oldColumn", event.target.value)} className={fieldClass} /></div><div><label className={labelClass}>Новое имя</label><input value={form.newColumn} onChange={(event) => update("newColumn", event.target.value)} className={fieldClass} /></div></div>}
              {operation === "alias" && <div><label className={labelClass}>Псевдоним первого столбца в результате</label><input value={form.alias} onChange={(event) => update("alias", event.target.value)} className={fieldClass} /></div>}
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">3. Готовый SQL</p><p className="text-xs text-muted-foreground">Предпросмотр запроса</p></div><Code2 className="h-4 w-4 text-primary" /></div>
                {generated.error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{generated.error}</div> : <pre className="min-h-36 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 text-xs leading-6 text-foreground">{generated.sql}</pre>}
                {generated.params.length > 0 && <div className="mt-3 rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Значения уже подставлены в предпросмотр запроса. Проверь их перед копированием.</p></div>}
                <button disabled={!generated.sql} onClick={() => copy(generated.sql)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Скопировано" : "Скопировать SQL"}</button>
              </div>
              <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><p>Конструктор только формирует текст SQL — он не подключается к БД и ничего не выполняет. Перед запуском проверь схему, параметры и среду. UPDATE и DELETE требуют WHERE.</p></div>
            </div>
          </div>
        </section>
      )}

      {tab === "reference" && (
        <section className="space-y-3">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} className={fieldClass + " pl-9"} placeholder="Найти команду: JOIN, AS, GROUP BY, UPDATE..." /></div>
          <div className="space-y-3">
            {filteredSnippets.map((item) => <article key={item.title} className="rounded-xl border border-border bg-card p-4"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{item.group}</span><button onClick={() => copy(item.sql)} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" />Копировать</button></div><h3 className="mb-2 text-sm font-semibold">{item.title}</h3><pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs leading-5">{item.sql}</pre><p className="mt-2 text-xs text-muted-foreground">{item.note}</p></article>)}
            {filteredSnippets.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">По запросу ничего не найдено.</p>}
          </div>
        </section>
      )}

      {tab === "checks" && (
        <section className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Чек-лист проверки данных</div><ul className="space-y-2 text-sm text-muted-foreground">{["После создания пользователя проверь, что запись появилась и поля заполнены корректно.","После изменения статуса проверь новое значение и историю изменений, если она предусмотрена.","Для связей проверь существование родительской записи и отсутствие «осиротевших» записей.","Для списков сравни COUNT(*) с количеством элементов в UI/API с учётом фильтров и пагинации.","Проверь дубликаты в полях, которые по требованиям должны быть уникальными.","Проверь NULL, пустую строку и пробелы отдельно — это разные значения.","Для денежных расчётов сравни сумму заказа с суммой позиций и правилами округления.","Для удаления проверь, что удалена только нужная запись и связанные данные обработаны согласно требованиям."].map((item) => <li key={item} className="flex gap-2"><span className="text-primary">•</span>{item}</li>)}</ul></div>
          <div className="rounded-xl border border-border bg-card p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Info className="h-4 w-4 text-primary" />Памятка по SQL</div><div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><p><code>AS</code> — псевдоним в результате запроса; не меняет схему БД.</p><p><code>ALTER TABLE ... RENAME COLUMN</code> — реальное переименование столбца.</p><p><code>WHERE</code> — фильтр строк до группировки.</p><p><code>HAVING</code> — фильтр сгруппированных результатов.</p><p><code>COUNT(*)</code> — все строки; <code>COUNT(column)</code> — только не-NULL.</p><p><code>IS NULL</code> — проверка NULL; не используй <code>= NULL</code>.</p></div></div>
          <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /><p>Не запускай DDL/DML-команды в production или общей staging-среде без явного разрешения. Перед UPDATE/DELETE сначала выполни SELECT с тем же WHERE и проверь количество строк.</p></div>
        </section>
      )}
    </div>
  );
}
