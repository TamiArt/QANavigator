import { useMemo, useState } from "react";
import {
  AlertTriangle, BookOpen, CheckCircle2, Code2, Copy,
  Database, Info, Search, ShieldCheck, WandSparkles,
} from "lucide-react";

type Dialect = "postgres" | "mysql";
type Operation = "select" | "aggregate" | "join" | "insert" | "update" | "delete" | "rename" | "alias";
type AggregateFunction = "COUNT" | "COUNT_DISTINCT" | "SUM" | "AVG" | "MIN" | "MAX";
type AggregateMetric = { id: number; fn: AggregateFunction; column: string; alias: string };
type FilterCondition = { id: number; column: string; operator: string; value: string; connector: "AND" | "OR" };
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
  setColumn: string;
  setValue: string;
  newColumn: string;
  oldColumn: string;
  alias: string;
};

const initial: BuilderState = {
  table: "users", columns: "id, email, created_at", groupBy: "", groupAliases: "",
  aggregates: [
    { id: 1, fn: "COUNT", column: "*", alias: "total" },
  ],
  insertValues: "101 | qa@example.com | 2026-11-07",
  conditions: [{ id: 1, column: "id", operator: "=", value: "10", connector: "AND" }], orderColumn: "", orderDirection: "DESC",
  limit: "50", offset: "", distinct: false, havingAlias: "", havingOperator: ">", havingValue: "",
  secondTable: "orders", joinType: "LEFT",
  leftKey: "users.id", rightKey: "orders.user_id",
  setColumn: "status", setValue: "active", newColumn: "display_name",
  oldColumn: "name", alias: "u",
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
];

function validIdentifier(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
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
  if (!validIdentifier(table)) return { sql: "", params: [], error: "Укажи имя таблицы латиницей: users, order_items." };
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
    const clauses = conditions.map((condition, index) => {
      if (!validIdentifier(condition.column.trim())) throw new Error("Имя поля условия №" + (index + 1) + " должно быть SQL-идентификатором.");
      const operator = ["=", "<>", ">", ">=", "<", "<=", "LIKE", "IN", "BETWEEN", "IS NULL", "IS NOT NULL"].includes(condition.operator) ? condition.operator : "=";
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
      } else {
        if (!condition.value.trim()) throw new Error("Укажи значение для условия №" + (index + 1) + ".");
        expression = q(condition.column.trim()) + " " + operator + " " + placeholder(condition.value);
      }
      return (index === 0 ? "" : condition.connector + " ") + expression;
    });
    return "\nWHERE " + clauses.join("\n  ");
  };
  try {
    switch (operation) {
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
        if (form.havingAlias.trim() && !form.havingValue.trim()) return { sql: "", params, error: "Укажи значение для условия HAVING." };
        if (form.orderColumn.trim() && !validIdentifier(form.orderColumn.trim())) return { sql: "", params, error: "Проверь поле или псевдоним для сортировки агрегатов." };
        if (form.limit.trim() && (!/^\d+$/.test(form.limit.trim()) || Number(form.limit) > 10000)) return { sql: "", params, error: "LIMIT должен быть целым числом от 0 до 10000." };
        if (form.offset.trim() && (!/^\d+$/.test(form.offset.trim()) || Number(form.offset) > 1000000)) return { sql: "", params, error: "OFFSET должен быть целым числом от 0 до 1000000." };
        const whereClause = where();
        const having = form.havingAlias.trim()
          ? "\nHAVING " + q(form.havingAlias.trim()) + " " + form.havingOperator + " " + placeholder(form.havingValue)
          : "";
        const sorting = form.orderColumn.trim() ? "\nORDER BY " + q(form.orderColumn.trim()) + " " + form.orderDirection : "";
        const limit = form.limit.trim() ? "\nLIMIT " + Number(form.limit) : "";
        const offset = form.offset.trim() ? "\nOFFSET " + Number(form.offset) : "";
        return { sql: "SELECT " + groupColumns.map((column, index) => groupAliases.length ? q(column) + " AS " + aliasSql(groupAliases[index]) : q(column)).join(", ") + ",\n       " + expressions.join(",\n       ") + "\nFROM " + tableSql + whereClause + "\nGROUP BY " + groupColumns.map(q).join(", ") + having + sorting + limit + offset + ";", params, error: "" };
      }
      case "join": {
        if (!validIdentifier(form.secondTable.trim()) || !/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/.test(form.leftKey.trim()) || !/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/.test(form.rightKey.trim())) {
          return { sql: "", params, error: "Укажи вторую таблицу и ключи в формате table.column." };
        }
        if (form.joinType === "FULL OUTER" && dialect === "mysql") return { sql: "", params, error: "MySQL не поддерживает FULL OUTER JOIN напрямую. Используй UNION из LEFT и RIGHT JOIN." };
        const left = form.leftKey.split(".").map(q).join(".");
        const right = form.rightKey.split(".").map(q).join(".");
        return { sql: "SELECT *\nFROM " + tableSql + "\n" + form.joinType + " JOIN " + q(form.secondTable.trim()) + " ON " + left + " = " + right + ";", params, error: "" };
      }
      case "insert": {
        if (!columns) return { sql: "", params, error: "Укажи столбцы для INSERT через запятую." };
        const enteredValues = form.insertValues.split("|").map((value) => value.trim());
        if (enteredValues.length !== columns.length || enteredValues.some((value) => !value)) return { sql: "", params, error: "Количество значений должно совпадать с количеством столбцов. Разделяй значения символом |." };
        const values = enteredValues.map((value) => placeholder(value));
        return { sql: "INSERT INTO " + tableSql + " (" + columns.map(q).join(", ") + ")\nVALUES (" + values.join(", ") + ");", params, error: "" };
      }
      case "update": {
        if (!validIdentifier(form.setColumn.trim())) return { sql: "", params, error: "Укажи корректное имя столбца для изменения." };
        if (!form.conditions.some((condition) => condition.column.trim())) return { sql: "", params, error: "Для безопасности UPDATE обязательно задай хотя бы одно условие WHERE." };
        const value = placeholder(form.setValue);
        const condition = where();
        return { sql: "UPDATE " + tableSql + "\nSET " + q(form.setColumn.trim()) + " = " + value + condition + ";", params, error: "" };
      }
      case "delete": {
        if (!form.conditions.some((condition) => condition.column.trim())) return { sql: "", params, error: "DELETE без WHERE заблокирован конструктором. Добавь хотя бы одно условие." };
        return { sql: "DELETE FROM " + tableSql + where() + ";", params, error: "" };
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
  const update = (key: keyof BuilderState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value } as BuilderState));
  const updateCondition = (id: number, key: keyof Omit<FilterCondition, "id">, value: string) => setForm((current) => ({ ...current, conditions: current.conditions.map((condition) => condition.id === id ? { ...condition, [key]: value } : condition) }));
  const addCondition = () => setForm((current) => ({ ...current, conditions: [...current.conditions, { id: Math.max(0, ...current.conditions.map((condition) => condition.id)) + 1, column: "", operator: "=", value: "", connector: "AND" }] }));
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
        <p className="text-sm text-muted-foreground">Практический SQL-помощник для QA: собери запрос, проверь его логику и скопируй в свой SQL-клиент.</p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
            <select value={operation} onChange={(event) => { const next = event.target.value as Operation; setOperation(next); if (next === "aggregate") setForm((current) => ({ ...current, conditions: [] })); }} className={fieldClass + " max-w-xs"}>
              <option value="select">Получить данные — SELECT</option>
              <option value="aggregate">Сгруппировать и посчитать — GROUP BY</option>
              <option value="join">Объединить таблицы — JOIN</option>
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
              <div><label className={labelClass}>Название таблицы</label><input value={form.table} onChange={(event) => update("table", event.target.value)} className={fieldClass} placeholder="users" /></div>
              {(operation === "select" || operation === "insert" || operation === "alias") && <div><label className={labelClass}>Столбцы, которые нужно вывести через запятую</label><input value={form.columns} onChange={(event) => update("columns", event.target.value)} className={fieldClass} placeholder="id, email, created_at" /><p className="mt-1 text-[11px] text-muted-foreground">Для SELECT можно указать * — все столбцы.</p></div>}
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
              {operation === "insert" && <div><label className={labelClass}>Значения в том же порядке (разделитель |)</label><input value={form.insertValues} onChange={(event) => update("insertValues", event.target.value)} className={fieldClass} placeholder="101 | qa@example.com | Anna" /><p className="mt-1 text-[11px] text-muted-foreground">Значения попадут в список параметров отдельно от SQL. Текстовые кавычки вручную добавлять не нужно.</p></div>}
              {(operation === "select" || operation === "aggregate" || operation === "update" || operation === "delete") && (
                <div className="space-y-3 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">Условия WHERE</p><button type="button" onClick={addCondition} className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-background">+ Добавить условие</button></div>
                  {form.conditions.map((condition, index) => <div key={condition.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Условие {index + 1}</span>{form.conditions.length > 1 && <button type="button" onClick={() => removeCondition(condition.id)} className="text-xs text-destructive hover:underline">Удалить</button>}</div>
                    {index > 0 && <select aria-label={"Связка перед условием " + (index + 1)} value={condition.connector} onChange={(event) => updateCondition(condition.id, "connector", event.target.value)} className={fieldClass}><option value="AND">AND — должны выполняться оба условия</option><option value="OR">OR — достаточно одного условия</option></select>}
                    <div className="grid grid-cols-[1fr_auto] gap-2"><input aria-label={"Столбец условия " + (index + 1)} value={condition.column} onChange={(event) => updateCondition(condition.id, "column", event.target.value)} className={fieldClass} placeholder="Например, status" /><select aria-label={"Оператор условия " + (index + 1)} value={condition.operator} onChange={(event) => updateCondition(condition.id, "operator", event.target.value)} className={fieldClass + " w-auto"}>{["=", "<>", ">", ">=", "<", "<=", "LIKE", "IN", "BETWEEN", "IS NULL", "IS NOT NULL"].map((operator) => <option key={operator}>{operator}</option>)}</select></div>
                    {![ "IS NULL", "IS NOT NULL" ].includes(condition.operator) && <div><label className={labelClass}>{condition.operator === "BETWEEN" ? "Границы диапазона (от, до)" : condition.operator === "IN" ? "Список значений" : condition.operator === "LIKE" ? "Шаблон LIKE" : "Значение параметра"}</label><input aria-label={"Значение условия " + (index + 1)} value={condition.value} onChange={(event) => updateCondition(condition.id, "value", event.target.value)} className={fieldClass} placeholder={condition.operator === "IN" ? "Например: new, active, pending" : condition.operator === "BETWEEN" ? "Например: 100, 500" : condition.operator === "LIKE" ? "Например: Ан%, %ов, а_я" : "Например, 42 или active"} /></div>}
                  </div>)}
                  <p className="text-[11px] text-muted-foreground">Значения будут безопасно экранированы и показаны непосредственно в готовом SQL. Для BETWEEN укажи две границы через запятую; обе границы включаются в диапазон. Для IN перечисли значения через запятую. Для LIKE используй шаблон: % означает ноль или более любых символов, _ — ровно один любой символ. Например, «Ан%» — начинается с «Ан», «%ов» — заканчивается на «ов», «а_я» — три символа, где средний любой. BETWEEN и IN имеют тот же приоритет, что и операторы сравнения: они выполняются раньше NOT, AND и OR. AND требует выполнения обоих условий, OR — хотя бы одного. В SQL AND имеет более высокий приоритет, чем OR: A OR B AND C читается как A OR (B AND C). Если нужна группировка (A OR B) AND C, добавь скобки в SQL вручную после копирования.</p>{(operation === "update" || operation === "delete") && form.conditions.some((condition, index) => index > 0 && condition.connector === "OR") && <p className="text-[11px] font-medium text-amber-600">Внимание: OR может расширить набор изменяемых или удаляемых записей. Проверь итоговый WHERE особенно внимательно.</p>}
                </div>
              )}
              {operation === "select" && <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"><label className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><input type="checkbox" checked={form.distinct} onChange={(event) => update("distinct", event.target.checked)} />Убрать повторяющиеся строки (DISTINCT)</label><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Сортировать по</label><input value={form.orderColumn} onChange={(event) => update("orderColumn", event.target.value)} className={fieldClass} placeholder="created_at" /></div><div><label className={labelClass}>Порядок</label><select value={form.orderDirection} onChange={(event) => update("orderDirection", event.target.value)} className={fieldClass}><option>DESC</option><option>ASC</option></select></div><div><label className={labelClass}>LIMIT</label><input value={form.limit} onChange={(event) => update("limit", event.target.value)} className={fieldClass} placeholder="50" /></div><div><label className={labelClass}>OFFSET</label><input value={form.offset} onChange={(event) => update("offset", event.target.value)} className={fieldClass} placeholder="0" /></div></div><p className="text-[11px] text-muted-foreground">DISTINCT удаляет дубликаты строк результата. LIMIT ограничивает число строк, OFFSET пропускает указанное число строк.</p></div>}
              {operation === "aggregate" && <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs font-semibold">Фильтрация групп и сортировка</p><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>HAVING: псевдоним агрегата</label><input value={form.havingAlias} onChange={(event) => update("havingAlias", event.target.value)} className={fieldClass} placeholder="total" /></div><div><label className={labelClass}>Оператор</label><select value={form.havingOperator} onChange={(event) => update("havingOperator", event.target.value)} className={fieldClass}>{[">", ">=", "=", "<>", "<=", "<"].map((item) => <option key={item}>{item}</option>)}</select></div><div><label className={labelClass}>Значение HAVING</label><input value={form.havingValue} onChange={(event) => update("havingValue", event.target.value)} className={fieldClass} placeholder="5" /></div><div><label className={labelClass}>ORDER BY</label><input value={form.orderColumn} onChange={(event) => update("orderColumn", event.target.value)} className={fieldClass} placeholder="total или status" /></div><div><label className={labelClass}>LIMIT</label><input value={form.limit} onChange={(event) => update("limit", event.target.value)} className={fieldClass} placeholder="50" /></div><div><label className={labelClass}>OFFSET</label><input value={form.offset} onChange={(event) => update("offset", event.target.value)} className={fieldClass} placeholder="0" /></div><div><label className={labelClass}>Направление сортировки</label><select value={form.orderDirection} onChange={(event) => update("orderDirection", event.target.value)} className={fieldClass}><option>DESC</option><option>ASC</option></select></div></div><p className="text-[11px] text-muted-foreground">WHERE фильтрует строки до группировки; HAVING — уже сформированные группы. В HAVING указывай псевдоним одного из агрегатов.</p></div>}
              {operation === "join" && <div className="space-y-2"><div><label className={labelClass}>Вторая таблица</label><input value={form.secondTable} onChange={(event) => update("secondTable", event.target.value)} className={fieldClass} /></div><div><label className={labelClass}>Тип JOIN</label><select value={form.joinType} onChange={(event) => update("joinType", event.target.value)} className={fieldClass}>{["INNER", "LEFT", "RIGHT", "FULL OUTER"].map((type) => <option key={type}>{type}</option>)}</select></div><div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Левый ключ</label><input value={form.leftKey} onChange={(event) => update("leftKey", event.target.value)} className={fieldClass} /></div><div><label className={labelClass}>Правый ключ</label><input value={form.rightKey} onChange={(event) => update("rightKey", event.target.value)} className={fieldClass} /></div></div></div>}
              {operation === "update" && <div><label className={labelClass}>Какой столбец изменить?</label><input value={form.setColumn} onChange={(event) => update("setColumn", event.target.value)} className={fieldClass} /><label className={labelClass + " mt-2"}>Новое значение</label><input value={form.setValue} onChange={(event) => update("setValue", event.target.value)} className={fieldClass} /></div>}
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
