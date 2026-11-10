import { useMemo, useState } from "react";
import { buildNestedScalarSubquery, buildCorrelatedExistsSubquery } from "./nested-subquery-builder.mjs";
import { buildAdvancedSelect } from "./advanced-select-builder.mjs";
import { buildCreateTable, buildAlterTable, buildDropTable, buildTruncateTable, buildInsert, buildUpdate, buildDelete } from "./ddl-dml-builder.mjs";
import { SqlExecutionConsole } from "./SqlExecutionConsole";
import {
  AlertTriangle, BookOpen, CheckCircle2, ClipboardList, Code2, Copy,
  Database, Info, Search, ShieldCheck, WandSparkles,
} from "lucide-react";

type Dialect = "postgres" | "mysql";
type Operation = "select" | "aggregate" | "join" | "subquery" | "cte" | "createTableAs" | "createTable" | "alterTable" | "dropTable" | "truncateTable" | "insert" | "update" | "delete" | "rename" | "alias" | "advancedSelect";
type SubqueryMode = "SCALAR" | "IN" | "NOT IN" | "EXISTS" | "NOT EXISTS";
type AggregateFunction = "COUNT" | "COUNT_DISTINCT" | "SUM" | "AVG" | "MIN" | "MAX" | "GROUP_CONCAT" | "STRING_AGG" | "ARRAY_AGG" | "JSON_AGG" | "JSON_ARRAYAGG" | "JSON_OBJECTAGG" | "JSONB_OBJECTAGG" | "BOOL_AND" | "BOOL_OR" | "EVERY" | "BIT_AND" | "BIT_OR" | "BIT_XOR" | "STDDEV" | "STDDEV_POP" | "STDDEV_SAMP" | "VARIANCE" | "VAR_POP" | "VAR_SAMP" | "MEDIAN" | "TOTAL" | "ANY_VALUE";
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

const frequentQueries = [
  { group: "Поиск и просмотр записей", title: "Найти запись по ID", sql: "SELECT *\nFROM users\nWHERE id = 101;", note: "Находит конкретную запись по первичному ключу. Замени users, id и 101 на свои значения." },
  { group: "Поиск и просмотр записей", title: "Найти запись по нескольким значениям", sql: "SELECT *\nFROM orders\nWHERE id IN (101, 102, 103);", note: "Проверяет сразу несколько записей по списку идентификаторов." },
  { group: "Поиск и просмотр записей", title: "Найти последние добавленные записи", sql: "SELECT *\nFROM users\nORDER BY created_at DESC\nLIMIT 20;", note: "Показывает 20 последних записей. Если в таблице другое поле даты создания, замени created_at." },
  { group: "Поиск и просмотр записей", title: "Найти записи за период", sql: "SELECT *\nFROM orders\nWHERE created_at >= '2026-01-01'\n  AND created_at < '2026-02-01'\nORDER BY created_at;", note: "Выбирает записи за январь 2026 года. Полуоткрытый диапазон корректно включает все часы последнего дня." },
  { group: "Количество и агрегаты", title: "Посчитать общее количество записей", sql: "SELECT COUNT(*) AS total\nFROM users;", note: "Возвращает общее количество строк в таблице. Сравни с количеством элементов в интерфейсе или API с учётом фильтров." },
  { group: "Количество и агрегаты", title: "Посчитать записи по каждому статусу", sql: "SELECT status, COUNT(*) AS total\nFROM orders\nGROUP BY status\nORDER BY total DESC;", note: "Показывает распределение заказов по статусам — удобно проверять переходы состояний." },
  { group: "Количество и агрегаты", title: "Проверить сумму и среднее значение", sql: "SELECT COUNT(*) AS rows_count,\n       SUM(amount) AS total_amount,\n       AVG(amount) AS average_amount,\n       MIN(amount) AS min_amount,\n       MAX(amount) AS max_amount\nFROM orders;", note: "Считает количество, сумму, среднее, минимум и максимум. Проверь, что amount — числовой столбец." },
  { group: "Качество данных", title: "Найти NULL в обязательном поле", sql: "SELECT *\nFROM users\nWHERE email IS NULL;", note: "Находит строки, где значение отсутствует именно как NULL. Замени email на проверяемое поле." },
  { group: "Качество данных", title: "Найти пустые строки и строки из пробелов", sql: "SELECT *\nFROM users\nWHERE email IS NULL\n   OR TRIM(email) = '';", note: "Проверяет NULL, пустую строку и строку из пробелов — это разные состояния данных." },
  { group: "Качество данных", title: "Найти дубликаты по значению", sql: "SELECT email, COUNT(*) AS duplicates_count\nFROM users\nGROUP BY email\nHAVING COUNT(*) > 1;", note: "Показывает значения email, которые встречаются больше одного раза. Для составной уникальности добавь поля в GROUP BY." },
  { group: "Качество данных", title: "Найти записи с некорректным диапазоном", sql: "SELECT *\nFROM products\nWHERE price < 0\n   OR stock < 0;", note: "Ищет отрицательные цены или остатки. Замени условие на бизнес-правила проверяемых полей." },
  { group: "Связи между таблицами", title: "Найти записи без связанных данных", sql: "SELECT u.*\nFROM users AS u\nLEFT JOIN orders AS o ON o.user_id = u.id\nWHERE o.id IS NULL;", note: "Находит пользователей, у которых нет заказов. Подходит для проверки необязательной связи один-ко-многим." },
  { group: "Связи между таблицами", title: "Найти «осиротевшие» дочерние записи", sql: "SELECT o.*\nFROM orders AS o\nLEFT JOIN users AS u ON u.id = o.user_id\nWHERE u.id IS NULL;", note: "Находит заказы, для которых не существует пользователя. Полезно для проверки ссылочной целостности." },
  { group: "Связи между таблицами", title: "Получить данные из двух связанных таблиц", sql: "SELECT o.id, o.status, o.amount, u.email\nFROM orders AS o\nINNER JOIN users AS u ON u.id = o.user_id\nWHERE o.id = 101;", note: "Показывает заказ вместе с данными пользователя. Замени условие, чтобы проверить нужную запись." },
  { group: "Сверка данных и результатов операций", title: "Проверить, что запись сохранилась после создания", sql: "SELECT id, email, status, created_at\nFROM users\nWHERE email = 'qa.test@example.com';", note: "Проверяет наличие созданной записи и значения её ключевых полей. Подставь уникальное тестовое значение." },
  { group: "Сверка данных и результатов операций", title: "Проверить результат изменения записи", sql: "SELECT id, status, updated_at\nFROM orders\nWHERE id = 101;", note: "Проверяет фактическое состояние записи после UPDATE или запроса API на изменение." },
  { group: "Сверка данных и результатов операций", title: "Проверить отсутствие записи после удаления", sql: "SELECT COUNT(*) AS remaining_count\nFROM users\nWHERE id = 101;", note: "После удаления ожидается remaining_count = 0. Если удаление логическое, проверь также deleted_at или статус." },
  { group: "Сверка данных и результатов операций", title: "Сравнить значения в связанных таблицах", sql: "SELECT o.id, o.total AS order_total,\n       SUM(oi.quantity * oi.price) AS items_total\nFROM orders AS o\nJOIN order_items AS oi ON oi.order_id = o.id\nWHERE o.id = 101\nGROUP BY o.id, o.total\nHAVING o.total <> SUM(oi.quantity * oi.price);", note: "Находит заказ, сумма которого отличается от суммы его позиций. Учти скидки, доставку, налоги и правила округления проекта." },
  { group: "Сверка данных и результатов операций", title: "Найти записи, отсутствующие во второй таблице", sql: "SELECT a.id\nFROM expected_records AS a\nLEFT JOIN actual_records AS b ON b.id = a.id\nWHERE b.id IS NULL;", note: "Сверяет ожидаемый набор с фактическим и показывает ID, которых нет во второй таблице. Замени таблицы на свои наборы данных." },

];

const memoOperatorGroups = [
  {
    group: "Группы SQL-команд",
    items: [
      { title: "DQL — чтение данных", syntax: "SELECT", note: "Получает данные из таблиц, представлений или подзапросов. Не изменяет сохранённые данные." },
      { title: "DML — изменение данных", syntax: "INSERT", note: "Добавляет новые строки в таблицу." },
      { title: "DML — изменение данных", syntax: "UPDATE", note: "Изменяет значения в существующих строках. Без WHERE может обновить все строки." },
      { title: "DML — изменение данных", syntax: "DELETE", note: "Удаляет строки из таблицы. Без WHERE может удалить все строки." },
      { title: "DDL — структура БД", syntax: "CREATE", note: "Создаёт объект БД: таблицу, представление, индекс, схему и другие объекты." },
      { title: "DDL — структура БД", syntax: "ALTER", note: "Изменяет структуру существующего объекта: добавляет, удаляет или меняет столбцы и ограничения." },
      { title: "DDL — структура БД", syntax: "DROP", note: "Удаляет объект БД целиком, например таблицу или представление, вместе с его структурой." },
      { title: "DDL — структура БД", syntax: "TRUNCATE", note: "Быстро удаляет все строки таблицы, сохраняя саму таблицу. Детали отката и счётчиков зависят от СУБД." },
      { title: "DCL — права доступа", syntax: "GRANT / REVOKE", note: "GRANT выдаёт права пользователю или роли; REVOKE отзывает ранее выданные права." },
      { title: "TCL — транзакции", syntax: "BEGIN / START TRANSACTION", note: "Начинает транзакцию — логически объединённую последовательность операций." },
      { title: "TCL — транзакции", syntax: "COMMIT", note: "Подтверждает транзакцию и сохраняет её изменения." },
      { title: "TCL — транзакции", syntax: "ROLLBACK", note: "Отменяет неподтверждённые изменения текущей транзакции." },
      { title: "TCL — транзакции", syntax: "SAVEPOINT / ROLLBACK TO SAVEPOINT", note: "Создаёт точку сохранения внутри транзакции и позволяет откатиться к ней, не отменяя всю транзакцию." },
    ],
  },
  {
    group: "Части SELECT-запроса",
    items: [
      { title: "SELECT", syntax: "SELECT column1, column2", note: "Определяет, какие столбцы или выражения попадут в результат. SELECT * выбирает все столбцы." },
      { title: "DISTINCT", syntax: "SELECT DISTINCT column", note: "Убирает повторяющиеся строки результата по комбинации всех выбранных столбцов." },
      { title: "FROM", syntax: "FROM table_name", note: "Указывает источник данных: таблицу, представление или подзапрос." },
      { title: "JOIN", syntax: "JOIN table_name ON condition", note: "Соединяет строки из нескольких таблиц по условию связи." },
      { title: "ON", syntax: "ON a.id = b.a_id", note: "Задаёт условие соединения таблиц в JOIN." },
      { title: "USING", syntax: "JOIN other_table USING (id)", note: "Краткая форма условия JOIN, когда столбец связи имеет одинаковое имя в обеих таблицах. Поддержка зависит от СУБД." },
      { title: "WHERE", syntax: "WHERE condition", note: "Фильтрует отдельные строки до группировки и агрегирования." },
      { title: "GROUP BY", syntax: "GROUP BY column", note: "Объединяет строки с одинаковыми значениями в группы, обычно для COUNT, SUM, AVG и других агрегатов." },
      { title: "HAVING", syntax: "HAVING COUNT(*) > 1", note: "Фильтрует уже сформированные группы. В отличие от WHERE может фильтровать по агрегатным результатам." },
      { title: "ORDER BY", syntax: "ORDER BY column ASC | DESC", note: "Сортирует результат. ASC — по возрастанию (по умолчанию), DESC — по убыванию." },
      { title: "LIMIT / OFFSET", syntax: "LIMIT 10 OFFSET 20", note: "LIMIT ограничивает число возвращаемых строк, OFFSET пропускает заданное количество. В других СУБД могут использоваться FETCH или TOP." },
      { title: "AS", syntax: "SELECT total AS order_total", note: "Задаёт псевдоним столбцу или таблице только внутри запроса/результата; не переименовывает объект в БД." },
      { title: "WITH (CTE)", syntax: "WITH active AS (SELECT ...)", note: "Объявляет именованный временный результат, который можно использовать в основном запросе." },
      { title: "WITH RECURSIVE", syntax: "WITH RECURSIVE tree AS (...)", note: "Создаёт рекурсивный CTE для обхода иерархий, деревьев и связанных последовательностей." },
    ],
  },
  {
    group: "Операторы сравнения и фильтрации",
    items: [
      { title: "Равно", syntax: "=", note: "Проверяет равенство двух значений." },
      { title: "Не равно", syntax: "<>  или  !=", note: "Проверяет, что значения различаются. <> — стандартная форма SQL; != поддерживается многими СУБД." },
      { title: "Сравнение величин", syntax: ">   <   >=   <=", note: "Больше, меньше, больше или равно, меньше или равно." },
      { title: "Диапазон", syntax: "BETWEEN min AND max", note: "Проверяет попадание в диапазон, включая обе границы." },
      { title: "Вхождение в список", syntax: "IN (value1, value2, ...)", note: "Проверяет, совпадает ли значение хотя бы с одним элементом списка или результата подзапроса." },
      { title: "Исключение списка", syntax: "NOT IN (value1, value2, ...)", note: "Проверяет, что значение не входит в список. Важно: NULL внутри списка/подзапроса может дать UNKNOWN и повлиять на результат." },
      { title: "Шаблон строки", syntax: "LIKE 'A%'  |  NOT LIKE 'A%'", note: "Ищет строки по шаблону: % означает любое количество символов, _ — ровно один символ." },
      { title: "Регистронезависимый шаблон", syntax: "ILIKE 'anna%'", note: "Регистронезависимый вариант LIKE в PostgreSQL. В MySQL регистрозависимость обычно определяется collation." },
      { title: "Проверка NULL", syntax: "IS NULL  |  IS NOT NULL", note: "Проверяет отсутствие или наличие значения NULL. Нельзя писать = NULL или <> NULL." },
      { title: "NULL-безопасное сравнение", syntax: "IS DISTINCT FROM", note: "Сравнивает два значения так, чтобы NULL корректно участвовал в сравнении. Синтаксис доступен не во всех СУБД." },
    ],
  },
  {
    group: "Логические и специальные операторы",
    items: [
      { title: "Логическое И", syntax: "condition1 AND condition2", note: "Истина только тогда, когда истинны оба условия." },
      { title: "Логическое ИЛИ", syntax: "condition1 OR condition2", note: "Истина, когда истинно хотя бы одно условие." },
      { title: "Логическое НЕ", syntax: "NOT condition", note: "Инвертирует логическое условие. Скобки помогают явно задать порядок вычислений." },
      { title: "Скобки", syntax: "(condition1 OR condition2) AND condition3", note: "Группируют условия и задают приоритет. AND выполняется раньше OR, если скобки не меняют порядок." },
      { title: "Проверка существования", syntax: "EXISTS (SELECT 1 ...)", note: "Возвращает TRUE, если подзапрос вернул хотя бы одну строку; часто применяется для проверки связанных записей." },
      { title: "Отсутствие строк", syntax: "NOT EXISTS (SELECT 1 ...)", note: "Возвращает TRUE, если подзапрос не вернул ни одной строки." },
      { title: "Сравнение с набором", syntax: "value = ANY (subquery)", note: "Сравнивает значение с элементами набора; ANY/SOME означает, что достаточно совпадения хотя бы с одним элементом." },
      { title: "Сравнение со всеми", syntax: "value > ALL (subquery)", note: "Условие должно выполняться для каждого значения из набора." },
    ],
  },
  {
    group: "Арифметика и работа со значениями",
    items: [
      { title: "Сложение / вычитание", syntax: "+   -", note: "Выполняет сложение и вычитание чисел; в зависимости от СУБД + также может участвовать в операциях с датами." },
      { title: "Умножение / деление", syntax: "*   /", note: "Выполняет умножение и деление. Следи за типами данных и целочисленным делением." },
      { title: "Остаток от деления", syntax: "%  или  MOD(a, b)", note: "Возвращает остаток от деления. Поддерживаемая форма зависит от СУБД." },
      { title: "Конкатенация строк", syntax: "||", note: "Объединяет строки в PostgreSQL и стандартном SQL. В MySQL обычно используют CONCAT(a, b)." },
      { title: "CASE", syntax: "CASE WHEN condition THEN value ELSE other END", note: "Возвращает значение по условиям, аналог условного if/else внутри SQL-запроса." },
      { title: "COALESCE", syntax: "COALESCE(value1, value2, ...)", note: "Возвращает первое значение, которое не равно NULL. Полезно для обработки отсутствующих данных." },
      { title: "NULLIF", syntax: "NULLIF(value1, value2)", note: "Возвращает NULL, если значения равны; иначе возвращает первое значение. Может помочь избежать деления на ноль." },
      { title: "CAST", syntax: "CAST(value AS data_type)", note: "Преобразует значение к указанному типу данных, например строку в число или дату." },
    ],
  },
  {
    group: "Объединение результатов и соединения",
    items: [
      { title: "UNION", syntax: "query1 UNION query2", note: "Объединяет результаты двух SELECT и удаляет дубликаты. Количество и совместимость типов столбцов должны совпадать." },
      { title: "UNION ALL", syntax: "query1 UNION ALL query2", note: "Объединяет результаты SELECT, сохраняя дубликаты; обычно не требует затрат на их удаление." },
      { title: "INTERSECT", syntax: "query1 INTERSECT query2", note: "Возвращает строки, присутствующие в обоих результатах. Доступность зависит от СУБД и версии." },
      { title: "EXCEPT", syntax: "query1 EXCEPT query2", note: "Возвращает строки первого результата, которых нет во втором. В Oracle используется оператор MINUS." },
      { title: "INNER JOIN", syntax: "INNER JOIN ... ON ...", note: "Возвращает только строки с совпадениями в обеих таблицах." },
      { title: "LEFT [OUTER] JOIN", syntax: "LEFT JOIN ... ON ...", note: "Возвращает все строки левой таблицы и совпадения справа; при отсутствии пары правые столбцы будут NULL." },
      { title: "RIGHT [OUTER] JOIN", syntax: "RIGHT JOIN ... ON ...", note: "Возвращает все строки правой таблицы и совпадения слева." },
      { title: "FULL [OUTER] JOIN", syntax: "FULL OUTER JOIN ... ON ...", note: "Возвращает совпадения и несовпавшие строки обеих таблиц. MySQL не поддерживает его напрямую." },
      { title: "CROSS JOIN", syntax: "CROSS JOIN", note: "Создаёт декартово произведение: каждая строка первой таблицы соединяется с каждой строкой второй." },
    ],
  },
  {
    group: "Агрегатные и оконные функции",
    items: [
      { title: "COUNT", syntax: "COUNT(*)  |  COUNT(column)  |  COUNT(DISTINCT column)", note: "Считает строки; COUNT(column) не учитывает NULL, COUNT(DISTINCT column) считает уникальные непустые значения." },
      { title: "SUM", syntax: "SUM(amount)", note: "Суммирует значения числового столбца, игнорируя NULL." },
      { title: "AVG", syntax: "AVG(amount)", note: "Вычисляет среднее арифметическое непустых значений." },
      { title: "MIN / MAX", syntax: "MIN(value)  |  MAX(value)", note: "Возвращают минимальное и максимальное значение." },
      { title: "STRING_AGG / GROUP_CONCAT", syntax: "STRING_AGG(name, ', ')", note: "Объединяет значения нескольких строк в одну строку. Название функции зависит от СУБД." },
      { title: "OVER", syntax: "function() OVER (...)", note: "Превращает функцию в оконную: вычисляет результат по набору строк, не сворачивая строки в одну группу." },
      { title: "PARTITION BY", syntax: "OVER (PARTITION BY department)", note: "Делит строки на независимые окна/группы для оконной функции." },
      { title: "ROW_NUMBER", syntax: "ROW_NUMBER() OVER (ORDER BY created_at)", note: "Нумерует строки по порядку; номер каждой строки уникален." },
      { title: "RANK / DENSE_RANK", syntax: "RANK() OVER (...)  |  DENSE_RANK() OVER (...)", note: "Присваивают ранг. RANK оставляет пропуски после равных значений, DENSE_RANK — без пропусков." },
      { title: "LAG / LEAD", syntax: "LAG(value) OVER (...)  |  LEAD(value) OVER (...)", note: "Получают значение из предыдущей или следующей строки в рамках окна." },
    ],
  },
  {
    group: "Ограничения целостности таблиц",
    items: [
      { title: "PRIMARY KEY", syntax: "PRIMARY KEY (id)", note: "Первичный ключ: уникально идентифицирует строку; не допускает NULL и дубликаты." },
      { title: "FOREIGN KEY", syntax: "FOREIGN KEY (user_id) REFERENCES users(id)", note: "Внешний ключ: связывает таблицы и защищает ссылочную целостность." },
      { title: "UNIQUE", syntax: "UNIQUE (email)", note: "Запрещает повторяющиеся значения или комбинации столбцов. Поведение с NULL зависит от СУБД." },
      { title: "NOT NULL", syntax: "email VARCHAR(255) NOT NULL", note: "Запрещает сохранять NULL в столбце." },
      { title: "CHECK", syntax: "CHECK (price >= 0)", note: "Ограничивает допустимые значения выражением, например запрещает отрицательную цену." },
      { title: "DEFAULT", syntax: "status VARCHAR(20) DEFAULT 'new'", note: "Подставляет значение по умолчанию, если при INSERT значение не указано." },
    ],
  },
];

const snippets = [
  { group: "Чтение данных", title: "Найти запись по ID", sql: "SELECT * FROM users WHERE id = :id;", note: "Подставь параметр id через механизм параметров своего SQL-клиента." },
  { group: "Чтение данных", title: "Найти дубликаты", sql: "SELECT email, COUNT(*) AS duplicate_count\nFROM users\nGROUP BY email\nHAVING COUNT(*) > 1;", note: "Показывает email, которые встречаются более одного раза." },
  { group: "Чтение данных", title: "Найти NULL в обязательном поле", sql: "SELECT *\nFROM orders\nWHERE user_id IS NULL;", note: "Сверь результат с ограничениями и требованиями к данным." },
  { group: "JOIN", title: "Пользователи без заказов", sql: "SELECT u.*\nFROM users AS u\nLEFT JOIN orders AS o ON o.user_id = u.id\nWHERE o.id IS NULL;", note: "Классический LEFT JOIN + IS NULL для поиска записей без пары." },
  { group: "JOIN", title: "Сверить связанные записи", sql: "SELECT o.id, o.user_id, u.email\nFROM orders AS o\nINNER JOIN users AS u ON u.id = o.user_id;", note: "Подходит для проверки связи внешнего ключа с родительской записью." },
  { group: "Агрегация", title: "Количество по статусам", sql: "SELECT status, COUNT(*) AS total\nFROM orders\nGROUP BY status\nORDER BY total DESC;", note: "Помогает проверить распределение данных по статусам." },
  { group: "Агрегация", title: "COUNT непустых имён Anna", sql: "SELECT COUNT(first_name) AS count\nFROM Student\nWHERE first_name = 'Anna';", note: "COUNT(column) считает только непустые значения столбца после применения WHERE. В учебной таблице Student результат равен 3." },
  { group: "Агрегация", title: "Различные книги и экземпляры по авторам", sql: "SELECT author AS \"Автор\", COUNT(DISTINCT book_id) AS \"Различных_книг\", COUNT(*) AS \"Количество_экземпляров\"\nFROM books\nGROUP BY author;", note: "Пример для PostgreSQL. Одна строка books должна соответствовать одному физическому экземпляру; если в строке хранится количество в поле quantity, используй SUM(quantity). В MySQL псевдонимы обрамляются обратными кавычками." },
  { group: "Агрегация", title: "Группы с количеством больше 5", sql: "SELECT user_id, COUNT(*) AS orders_count\nFROM orders\nGROUP BY user_id\nHAVING COUNT(*) > 5;", note: "WHERE фильтрует строки до группировки, HAVING — группы после неё." },
  { group: "Изменение данных", title: "Безопасный UPDATE", sql: "BEGIN;\nSELECT * FROM users WHERE id = :id;\nUPDATE users SET status = :status WHERE id = :id;\nSELECT * FROM users WHERE id = :id;\n-- COMMIT;  -- только после проверки\n-- ROLLBACK; -- если результат неверный", note: "Выполняй только в разрешённой тестовой среде. Сначала проверь выборку." },
  { group: "Изменение данных", title: "Удаление тестовой записи", sql: "BEGIN;\nSELECT * FROM users WHERE email = :test_email;\nDELETE FROM users WHERE email = :test_email;\nSELECT * FROM users WHERE email = :test_email;\n-- COMMIT;  -- только после проверки\n-- ROLLBACK; -- если результат неверный", note: "Убедись, что WHERE выбирает ровно тестовую запись. Не запускай на production." },
  { group: "Структура БД", title: "Переименовать столбец в таблице", sql: "ALTER TABLE users RENAME COLUMN old_name TO new_name;", note: "Меняет структуру таблицы. Синтаксис и транзакционность зависят от СУБД." },
  { group: "Псевдонимы", title: "Переименовать столбец только в выдаче", sql: "SELECT first_name AS name\nFROM users;", note: "AS задаёт псевдоним только для результата SELECT, а не переименовывает столбец в БД." },
  { group: "Псевдонимы", title: "Псевдоним таблицы", sql: "SELECT u.email, o.total\nFROM users AS u\nJOIN orders AS o ON o.user_id = u.id;", note: "Псевдонимы таблиц сокращают запрос и помогают различать одинаковые имена столбцов." },
  { group: "Чтение данных", title: "Только уникальные значения", sql: "SELECT DISTINCT status\nFROM orders\nORDER BY status;", note: "DISTINCT удаляет повторяющиеся строки результата; применяется ко всему набору выбранных столбцов." },
  { group: "DQL — выборка и фильтрация", title: "SELECT", sql: "SELECT [DISTINCT] столбец1, столбец2\nFROM имя_таблицы;", note: "Выбирает указанные столбцы. DISTINCT убирает дубли строк результата." },
  { group: "DQL — выборка и фильтрация", title: "SELECT *", sql: "SELECT *\nFROM имя_таблицы;", note: "Возвращает все столбцы таблицы. В рабочих запросах лучше указывать нужные поля явно." },
  { group: "DQL — выборка и фильтрация", title: "FROM", sql: "SELECT столбцы\nFROM имя_таблицы;", note: "Указывает источник данных: таблицу, представление или подзапрос." },
  { group: "DQL — выборка и фильтрация", title: "WHERE", sql: "SELECT столбцы\nFROM имя_таблицы\nWHERE условие;", note: "Оставляет только строки, удовлетворяющие условию; выполняется до группировки." },
  { group: "DQL — выборка и фильтрация", title: "DISTINCT", sql: "SELECT DISTINCT столбец1, столбец2\nFROM имя_таблицы;", note: "Возвращает уникальные комбинации выбранных столбцов." },
  { group: "DQL — выборка и фильтрация", title: "ORDER BY", sql: "SELECT столбцы\nFROM имя_таблицы\nORDER BY столбец [ASC | DESC];", note: "Сортирует результат по возрастанию (ASC, по умолчанию) или убыванию (DESC)." },
  { group: "DQL — выборка и фильтрация", title: "LIMIT / OFFSET", sql: "SELECT столбцы\nFROM имя_таблицы\nORDER BY id\nLIMIT 10 OFFSET 20;", note: "LIMIT ограничивает число строк, OFFSET пропускает указанное число строк. В PostgreSQL и MySQL поддерживается." },
  { group: "DQL — выборка и фильтрация", title: "FETCH FIRST", sql: "SELECT столбцы\nFROM имя_таблицы\nORDER BY id\nFETCH FIRST 10 ROWS ONLY;", note: "Стандартный SQL-вариант ограничения числа возвращаемых строк; поддерживается PostgreSQL." },
  { group: "DQL — выборка и фильтрация", title: "GROUP BY", sql: "SELECT столбец_группировки, COUNT(*)\nFROM имя_таблицы\nGROUP BY столбец_группировки;", note: "Объединяет строки с одинаковыми значениями в группы для агрегатных вычислений." },
  { group: "DQL — выборка и фильтрация", title: "HAVING", sql: "SELECT столбец, COUNT(*)\nFROM имя_таблицы\nGROUP BY столбец\nHAVING COUNT(*) > 1;", note: "Фильтрует уже сформированные группы; в отличие от WHERE может содержать агрегаты." },
  { group: "DQL — выборка и фильтрация", title: "AS — псевдоним", sql: "SELECT first_name AS имя\nFROM Student AS s;", note: "Задаёт временное имя столбцу или таблице в запросе; структуру БД не меняет." },
  { group: "DQL — выборка и фильтрация", title: "WITH — CTE", sql: "WITH active_users AS (\n  SELECT * FROM users WHERE active = TRUE\n)\nSELECT * FROM active_users;", note: "Создаёт именованный временный набор результатов, доступный внутри одного SQL-запроса." },
  { group: "DQL — выборка и фильтрация", title: "WITH RECURSIVE", sql: "WITH RECURSIVE tree AS (\n  SELECT id, parent_id FROM categories WHERE parent_id IS NULL\n  UNION ALL\n  SELECT c.id, c.parent_id FROM categories c\n  JOIN tree t ON c.parent_id = t.id\n)\nSELECT * FROM tree;", note: "Строит рекурсивный CTE, например для дерева категорий или иерархии." },
  { group: "DQL — выборка и фильтрация", title: "UNION", sql: "SELECT city FROM customers\nUNION\nSELECT city FROM suppliers;", note: "Объединяет результаты запросов и удаляет дубли. Число и типы столбцов должны быть совместимы." },
  { group: "DQL — выборка и фильтрация", title: "UNION ALL", sql: "SELECT city FROM customers\nUNION ALL\nSELECT city FROM suppliers;", note: "Объединяет результаты, сохраняя дубли; обычно быстрее UNION." },
  { group: "DQL — выборка и фильтрация", title: "INTERSECT", sql: "SELECT id FROM table_a\nINTERSECT\nSELECT id FROM table_b;", note: "Возвращает строки, присутствующие в обоих результатах. Поддерживается PostgreSQL; в MySQL зависит от версии." },
  { group: "DQL — выборка и фильтрация", title: "EXCEPT / MINUS", sql: "SELECT id FROM table_a\nEXCEPT\nSELECT id FROM table_b;", note: "Возвращает строки первого запроса, отсутствующие во втором. В Oracle используется MINUS." },
  { group: "DQL — выборка и фильтрация", title: "Подзапрос в SELECT", sql: "SELECT name,\n  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count\nFROM users u;", note: "Скалярный подзапрос возвращает одно значение для каждой строки внешнего запроса." },
  { group: "DQL — выборка и фильтрация", title: "Подзапрос с IN", sql: "SELECT * FROM users\nWHERE id IN (SELECT user_id FROM orders);", note: "Проверяет, входит ли значение в набор, возвращённый подзапросом." },
  { group: "DQL — выборка и фильтрация", title: "EXISTS / NOT EXISTS", sql: "SELECT * FROM users u\nWHERE EXISTS (\n  SELECT 1 FROM orders o WHERE o.user_id = u.id\n);", note: "EXISTS проверяет наличие хотя бы одной строки в подзапросе; NOT EXISTS — отсутствие." },
  { group: "DQL — выборка и фильтрация", title: "JOIN — INNER", sql: "SELECT *\nFROM users u\nINNER JOIN orders o ON o.user_id = u.id;", note: "Возвращает только строки, для которых найдено совпадение в обеих таблицах." },
  { group: "DQL — выборка и фильтрация", title: "JOIN — LEFT", sql: "SELECT *\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id;", note: "Возвращает все строки левой таблицы и совпавшие строки правой; при отсутствии пары справа будут NULL." },
  { group: "DQL — выборка и фильтрация", title: "JOIN — RIGHT", sql: "SELECT *\nFROM users u\nRIGHT JOIN orders o ON o.user_id = u.id;", note: "Возвращает все строки правой таблицы и совпадения слева." },
  { group: "DQL — выборка и фильтрация", title: "JOIN — FULL OUTER", sql: "SELECT *\nFROM table_a a\nFULL OUTER JOIN table_b b ON b.id = a.id;", note: "Возвращает совпавшие строки и все несовпавшие строки обеих таблиц. В MySQL нет прямой поддержки FULL OUTER JOIN." },
  { group: "DQL — выборка и фильтрация", title: "CROSS JOIN", sql: "SELECT *\nFROM colors\nCROSS JOIN sizes;", note: "Создаёт декартово произведение: каждая строка первой таблицы соединяется с каждой строкой второй." },
  { group: "DQL — выборка и фильтрация", title: "NATURAL JOIN", sql: "SELECT * FROM table_a NATURAL JOIN table_b;", note: "Соединяет по всем одноимённым столбцам. Использовать осторожно: добавление столбца может изменить условие соединения." },
  { group: "Операторы условий и сравнения", title: "Сравнение", sql: "=   <>   !=   >   <   >=   <=", note: "Равно, не равно, больше, меньше, больше или равно, меньше или равно. <> — стандартная форма неравенства." },
  { group: "Операторы условий и сравнения", title: "AND / OR / NOT", sql: "WHERE условие1 AND условие2\nWHERE условие1 OR условие2\nWHERE NOT условие;", note: "AND требует истинности обоих условий; OR — хотя бы одного; NOT инвертирует логическое условие. Используй скобки для явного порядка." },
  { group: "Операторы условий и сравнения", title: "BETWEEN", sql: "WHERE price BETWEEN 100 AND 500;", note: "Проверяет попадание в диапазон, включая обе границы." },
  { group: "Операторы условий и сравнения", title: "IN / NOT IN", sql: "WHERE status IN ('new', 'paid')\nWHERE status NOT IN ('cancelled', 'deleted');", note: "Проверяет вхождение или невхождение значения в список/результат подзапроса. Учитывай влияние NULL в подзапросе." },
  { group: "Операторы условий и сравнения", title: "LIKE / NOT LIKE", sql: "WHERE name LIKE 'An%'\nWHERE code NOT LIKE 'X_';", note: "Поиск по шаблону: % — любое количество символов, _ — ровно один символ." },
  { group: "Операторы условий и сравнения", title: "ILIKE", sql: "WHERE name ILIKE 'anna%';", note: "Регистронезависимый LIKE в PostgreSQL. В MySQL поведение зависит от collation." },
  { group: "Операторы условий и сравнения", title: "IS NULL / IS NOT NULL", sql: "WHERE deleted_at IS NULL\nWHERE email IS NOT NULL;", note: "Проверяет отсутствие или наличие значения NULL. Нельзя использовать = NULL." },
  { group: "Операторы условий и сравнения", title: "IS DISTINCT FROM", sql: "WHERE old_value IS DISTINCT FROM new_value;", note: "Сравнивает значения с безопасной обработкой NULL: NULL считается отличным от обычного значения. Поддержка зависит от СУБД/версии." },
  { group: "Операторы условий и сравнения", title: "ANY / SOME", sql: "WHERE price > ANY (SELECT price FROM offers);", note: "Сравнивает значение хотя бы с одним элементом набора. SOME — синоним ANY." },
  { group: "Операторы условий и сравнения", title: "ALL", sql: "WHERE price > ALL (SELECT price FROM offers);", note: "Условие должно выполняться для каждого значения из набора." },
  { group: "Операторы условий и сравнения", title: "Арифметические операторы", sql: "+   -   *   /   %", note: "Сложение, вычитание, умножение, деление и остаток от деления. Для целочисленного деления и % учитывай различия диалектов." },
  { group: "Операторы условий и сравнения", title: "Конкатенация строк", sql: "-- PostgreSQL\nSELECT first_name || ' ' || last_name FROM users;\n-- MySQL\nSELECT CONCAT(first_name, ' ', last_name) FROM users;", note: "Объединяет строки. || — PostgreSQL; CONCAT() — переносимый вариант для PostgreSQL и MySQL." },
  { group: "Операторы условий и сравнения", title: "Побитовые операторы", sql: "&   |   #   ~   <<   >>", note: "Побитовое AND, OR, XOR (символ зависит от СУБД), NOT, сдвиг влево и вправо. Синтаксис различается между PostgreSQL и MySQL." },
  { group: "Агрегатные функции", title: "COUNT", sql: "COUNT(*)\nCOUNT(имя_столбца)\nCOUNT(DISTINCT имя_столбца)", note: "Считает все строки; непустые значения столбца; или количество уникальных непустых значений соответственно." },
  { group: "Агрегатные функции", title: "SUM", sql: "SUM(числовой_столбец)", note: "Суммирует непустые числовые значения. Для пустого набора обычно возвращает NULL." },
  { group: "Агрегатные функции", title: "AVG", sql: "AVG(числовой_столбец)", note: "Вычисляет среднее арифметическое непустых значений." },
  { group: "Агрегатные функции", title: "MIN / MAX", sql: "MIN(столбец)\nMAX(столбец)", note: "Возвращает минимальное или максимальное значение; применимо к числам, датам и сравнимым строкам." },
  { group: "Агрегатные функции", title: "STRING_AGG", sql: "STRING_AGG(столбец, ', ')\n-- PostgreSQL", note: "Объединяет значения строк в одну строку с разделителем. NULL пропускаются." },
  { group: "Агрегатные функции", title: "GROUP_CONCAT", sql: "GROUP_CONCAT(столбец SEPARATOR ', ')\n-- MySQL", note: "MySQL-функция объединения значений группы в строку. В PostgreSQL аналог — STRING_AGG." },
  { group: "Агрегатные функции", title: "ARRAY_AGG", sql: "ARRAY_AGG(столбец)\n-- PostgreSQL", note: "Собирает значения группы в массив, сохраняя порядок только при заданном ORDER BY внутри агрегата." },
  { group: "Агрегатные функции", title: "JSON_AGG / JSONB_AGG", sql: "JSON_AGG(столбец)\nJSONB_AGG(столбец)\n-- PostgreSQL", note: "Собирает значения строк в JSON-массив; JSONB_AGG возвращает JSONB." },
  { group: "Агрегатные функции", title: "JSON_ARRAYAGG", sql: "JSON_ARRAYAGG(столбец)\n-- MySQL", note: "Формирует JSON-массив из значений группы." },
  { group: "Агрегатные функции", title: "JSON_OBJECTAGG", sql: "JSON_OBJECTAGG(ключ, значение)", note: "Формирует JSON-объект из пар ключ–значение. Конкретные правила повторяющихся ключей зависят от СУБД." },
  { group: "Агрегатные функции", title: "BOOL_AND / BOOL_OR / EVERY", sql: "BOOL_AND(условие)\nBOOL_OR(условие)\nEVERY(условие)", note: "Проверяет, истинны ли все значения, истинно ли хотя бы одно; EVERY — аналог BOOL_AND в PostgreSQL." },
  { group: "Агрегатные функции", title: "BIT_AND / BIT_OR / BIT_XOR", sql: "BIT_AND(числовой_столбец)\nBIT_OR(числовой_столбец)\nBIT_XOR(числовой_столбец)", note: "Выполняет побитовое агрегирование значений в группе. Наличие и точная семантика зависят от СУБД." },
  { group: "Агрегатные функции", title: "STDDEV / STDDEV_POP / STDDEV_SAMP", sql: "STDDEV(столбец)\nSTDDEV_POP(столбец)\nSTDDEV_SAMP(столбец)", note: "Вычисляет стандартное отклонение. POP — для генеральной совокупности, SAMP — для выборки; STDDEV трактуется по-разному в СУБД." },
  { group: "Агрегатные функции", title: "VARIANCE / VAR_POP / VAR_SAMP", sql: "VARIANCE(столбец)\nVAR_POP(столбец)\nVAR_SAMP(столбец)", note: "Вычисляет дисперсию генеральной совокупности или выборки. Проверяй семантику VARIANCE в выбранной СУБД." },
  { group: "Агрегатные функции", title: "MEDIAN / PERCENTILE_CONT", sql: "MEDIAN(столбец)\nPERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY столбец)", note: "Медиана — центральное значение упорядоченного набора. Наличие MEDIAN зависит от СУБД; PERCENTILE_CONT — стандартный процентильный агрегат." },
  { group: "Агрегатные функции", title: "CORR / COVAR", sql: "CORR(y, x)\nCOVAR_POP(y, x)\nCOVAR_SAMP(y, x)", note: "Корреляция и ковариация двух числовых наборов; доступны в PostgreSQL и ряде других СУБД." },
  { group: "Агрегатные функции", title: "REGR_*", sql: "REGR_COUNT(y, x)\nREGR_SLOPE(y, x)\nREGR_INTERCEPT(y, x)\nREGR_R2(y, x)", note: "Регрессионные агрегаты: число пар, наклон, пересечение с осью и коэффициент детерминации. Набор зависит от СУБД." },
  { group: "Агрегатные функции", title: "FILTER для агрегата", sql: "SELECT COUNT(*) FILTER (WHERE status = 'paid')\nFROM orders;", note: "Применяет условие только к конкретному агрегату. Поддерживается PostgreSQL; в MySQL обычно используют SUM(CASE WHEN ... THEN 1 ELSE 0 END)." },
  { group: "Агрегатные функции", title: "Агрегат без GROUP BY", sql: "SELECT COUNT(*) AS total,\n       AVG(score) AS average_score\nFROM Student\nWHERE is_active = TRUE;", note: "Вычисляет одно итоговое значение по всей отфильтрованной выборке. GROUP BY не нужен." },
  { group: "Агрегатные функции", title: "Агрегат с GROUP BY и HAVING", sql: "SELECT department, AVG(salary) AS avg_salary\nFROM employees\nGROUP BY department\nHAVING AVG(salary) > 50000;", note: "Сначала формирует группы, затем HAVING оставляет только группы, удовлетворяющие условию." },
  { group: "Математические функции", title: "ABS", sql: "ABS(число)", note: "Возвращает абсолютное значение (модуль) числа." },
  { group: "Математические функции", title: "ROUND", sql: "ROUND(число, количество_знаков)", note: "Округляет число до указанного количества знаков после запятой; поведение для граничных случаев может различаться." },
  { group: "Математические функции", title: "CEIL / CEILING / FLOOR", sql: "CEIL(число)\nCEILING(число)\nFLOOR(число)", note: "Округляет вверх до ближайшего целого или вниз до ближайшего целого." },
  { group: "Математические функции", title: "TRUNC / TRUNCATE", sql: "TRUNC(число, знаки)\nTRUNCATE(число, знаки)", note: "Отбрасывает дробную часть до заданного количества знаков без математического округления; имена зависят от СУБД." },
  { group: "Математические функции", title: "MOD / POWER / SQRT", sql: "MOD(a, b)\nPOWER(a, степень)\nSQRT(число)", note: "Остаток от деления, возведение в степень и квадратный корень." },
  { group: "Математические функции", title: "EXP / LN / LOG", sql: "EXP(x)\nLN(x)\nLOG(основание, x)", note: "Экспонента и логарифмы. Порядок аргументов LOG и доступные варианты могут отличаться в СУБД." },
  { group: "Математические функции", title: "SIGN / PI / RANDOM", sql: "SIGN(x)\nPI()\nRANDOM() -- PostgreSQL\nRAND() -- MySQL", note: "Знак числа, число π и псевдослучайное число. Функция случайного числа зависит от диалекта." },
  { group: "Строковые функции", title: "CONCAT", sql: "CONCAT(строка1, строка2, ...)", note: "Объединяет несколько строк в одну." },
  { group: "Строковые функции", title: "LENGTH / CHAR_LENGTH", sql: "LENGTH(строка)\nCHAR_LENGTH(строка)", note: "Возвращает длину строки. LENGTH часто считает байты, CHAR_LENGTH — символы; детали зависят от СУБД." },
  { group: "Строковые функции", title: "UPPER / LOWER", sql: "UPPER(строка)\nLOWER(строка)", note: "Преобразует строку в верхний или нижний регистр." },
  { group: "Строковые функции", title: "TRIM / LTRIM / RTRIM", sql: "TRIM(строка)\nLTRIM(строка)\nRTRIM(строка)", note: "Удаляет пробелы или заданные символы с обоих краёв, слева или справа." },
  { group: "Строковые функции", title: "SUBSTRING / SUBSTR", sql: "SUBSTRING(строка FROM начало FOR длина)\nSUBSTR(строка, начало, длина)", note: "Извлекает часть строки. Формы записи различаются между диалектами." },
  { group: "Строковые функции", title: "LEFT / RIGHT", sql: "LEFT(строка, количество)\nRIGHT(строка, количество)", note: "Возвращает указанное количество символов слева или справа." },
  { group: "Строковые функции", title: "REPLACE", sql: "REPLACE(строка, что_найти, чем_заменить)", note: "Заменяет все найденные вхождения подстроки." },
  { group: "Строковые функции", title: "POSITION / INSTR", sql: "POSITION(подстрока IN строка)\nINSTR(строка, подстрока)", note: "Возвращает позицию первого вхождения подстроки. Синтаксис зависит от СУБД." },
  { group: "Строковые функции", title: "LPAD / RPAD", sql: "LPAD(строка, итоговая_длина, символы)\nRPAD(строка, итоговая_длина, символы)", note: "Дополняет строку слева или справа до указанной длины." },
  { group: "Строковые функции", title: "SPLIT_PART", sql: "SPLIT_PART(строка, разделитель, номер_части)", note: "Возвращает указанную часть строки, разделённой заданным разделителем; PostgreSQL." },
  { group: "Функции NULL и условные выражения", title: "COALESCE", sql: "COALESCE(значение1, значение2, ...)", note: "Возвращает первое значение, которое не равно NULL." },
  { group: "Функции NULL и условные выражения", title: "NULLIF", sql: "NULLIF(значение1, значение2)", note: "Возвращает NULL, если значения равны; иначе возвращает первое значение. Полезно для защиты от деления на ноль." },
  { group: "Функции NULL и условные выражения", title: "CASE WHEN", sql: "CASE\n  WHEN условие1 THEN результат1\n  WHEN условие2 THEN результат2\n  ELSE альтернативный_результат\nEND AS имя_столбца", note: "Условное выражение: проверяет условия по порядку и возвращает результат первой истинной ветки. ELSE необязателен." },
  { group: "Функции NULL и условные выражения", title: "IF", sql: "IF(условие, значение_если_истина, значение_если_ложь)", note: "Условная функция MySQL. В PostgreSQL используй CASE WHEN." },
  { group: "Функции NULL и условные выражения", title: "IFNULL / ISNULL", sql: "IFNULL(значение, замена) -- MySQL\nISNULL(значение) -- проверка NULL в MySQL", note: "IFNULL заменяет NULL заданным значением. ISNULL в MySQL проверяет NULL; в PostgreSQL для замены используй COALESCE." },
  { group: "Функции NULL и условные выражения", title: "GREATEST / LEAST", sql: "GREATEST(значение1, значение2, ...)\nLEAST(значение1, значение2, ...)", note: "Возвращает наибольшее или наименьшее из переданных значений. Обработка NULL зависит от СУБД." },
  { group: "Функции даты и времени", title: "CURRENT_DATE / CURRENT_TIME / NOW", sql: "CURRENT_DATE\nCURRENT_TIME\nCURRENT_TIMESTAMP\nNOW()", note: "Возвращает текущую дату, время или дату-время. NOW() распространена в PostgreSQL и MySQL." },
  { group: "Функции даты и времени", title: "EXTRACT", sql: "EXTRACT(YEAR FROM created_at)\nEXTRACT(MONTH FROM created_at)\nEXTRACT(DAY FROM created_at)", note: "Извлекает часть даты или времени: год, месяц, день, час и другие компоненты." },
  { group: "Функции даты и времени", title: "DATE_TRUNC", sql: "DATE_TRUNC('month', created_at)\n-- PostgreSQL", note: "Округляет дату-время до начала указанного периода: года, месяца, дня, часа и т. д." },
  { group: "Функции даты и времени", title: "DATE_ADD / DATE_SUB", sql: "DATE_ADD(date_value, INTERVAL 7 DAY)\nDATE_SUB(date_value, INTERVAL 1 MONTH)\n-- MySQL", note: "Прибавляет или вычитает интервал времени. В PostgreSQL часто используют date_value + INTERVAL '7 days'." },
  { group: "Функции даты и времени", title: "DATEDIFF", sql: "DATEDIFF(date1, date2)\n-- MySQL", note: "Возвращает разницу между датами в днях. Аналог в PostgreSQL — вычитание дат." },
  { group: "Функции даты и времени", title: "AGE", sql: "AGE(date1, date2)\n-- PostgreSQL", note: "Возвращает календарный интервал между датами." },
  { group: "Функции преобразования типов", title: "CAST", sql: "CAST(значение AS тип_данных)", note: "Преобразует выражение к указанному типу по стандартному SQL-синтаксису." },
  { group: "Функции преобразования типов", title: "Оператор ::", sql: "значение::тип_данных\n-- PostgreSQL", note: "Краткая форма приведения типа в PostgreSQL; не является переносимым синтаксисом." },
  { group: "Функции преобразования типов", title: "CONVERT", sql: "CONVERT(значение, тип)\n-- MySQL", note: "Преобразует значение к типу в синтаксисе MySQL. Для переносимого SQL предпочитай CAST." },
  { group: "Функции преобразования типов", title: "TO_CHAR / TO_DATE / TO_NUMBER", sql: "TO_CHAR(date_value, 'YYYY-MM-DD')\nTO_DATE('2026-11-09', 'YYYY-MM-DD')\nTO_NUMBER('123.45', '999.99')", note: "Форматирует дату/число в строку и преобразует строку в дату/число; PostgreSQL." },
  { group: "Оконные функции", title: "OVER", sql: "функция(...) OVER (\n  PARTITION BY столбец\n  ORDER BY столбец\n)", note: "Превращает агрегатную или оконную функцию в вычисление по окну строк, не сворачивая строки в группы." },
  { group: "Оконные функции", title: "PARTITION BY", sql: "AVG(salary) OVER (PARTITION BY department)", note: "Разбивает строки на независимые окна по значению столбца; расчёт выполняется отдельно внутри каждого окна." },
  { group: "Оконные функции", title: "ROW_NUMBER", sql: "ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC)", note: "Нумерует строки внутри каждого окна без повторения номеров." },
  { group: "Оконные функции", title: "RANK / DENSE_RANK", sql: "RANK() OVER (ORDER BY score DESC)\nDENSE_RANK() OVER (ORDER BY score DESC)", note: "Присваивает ранг с пропусками после одинаковых значений (RANK) или без пропусков (DENSE_RANK)." },
  { group: "Оконные функции", title: "NTILE", sql: "NTILE(4) OVER (ORDER BY score DESC)", note: "Делит упорядоченные строки на указанное число примерно равных групп и возвращает номер группы." },
  { group: "Оконные функции", title: "LAG / LEAD", sql: "LAG(value, 1) OVER (ORDER BY created_at)\nLEAD(value, 1) OVER (ORDER BY created_at)", note: "Получает значение из предыдущей или следующей строки окна." },
  { group: "Оконные функции", title: "FIRST_VALUE / LAST_VALUE / NTH_VALUE", sql: "FIRST_VALUE(value) OVER (...)\nLAST_VALUE(value) OVER (...)\nNTH_VALUE(value, 2) OVER (...)", note: "Возвращает первое, последнее или N-е значение в рамке окна. Для LAST_VALUE важно правильно задать frame." },
  { group: "Оконные функции", title: "Рамка окна ROWS / RANGE", sql: "SUM(amount) OVER (\n  PARTITION BY user_id\n  ORDER BY created_at\n  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n)", note: "Определяет диапазон строк для оконного расчёта; пример считает накопительную сумму." },
  { group: "Оконные функции", title: "Агрегаты как оконные функции", sql: "COUNT(*) OVER (PARTITION BY status)\nAVG(score) OVER ()", note: "Позволяет вывести агрегат рядом с каждой исходной строкой. Пустой OVER() считает по всему результату." },
  { group: "JSON-функции", title: "JSON_EXTRACT / JSON_VALUE", sql: "JSON_EXTRACT(data, '$.name') -- MySQL\nJSON_VALUE(data, '$.name')", note: "Извлекает значение по JSON-пути; доступность и поведение зависят от версии СУБД." },
  { group: "JSON-функции", title: "Операторы PostgreSQL JSON", sql: "data -> 'name'\ndata ->> 'name'\ndata #> '{profile,city}'\ndata #>> '{profile,city}'", note: "Извлекает JSON-значение или текст по ключу/пути. -> и #> возвращают JSON, ->> и #>> — текст." },
  { group: "JSON-функции", title: "JSONB containment", sql: "data @> '{\"active\": true}'::jsonb\ndata ? 'name'\ndata ?| ARRAY['name', 'email']\ndata ?& ARRAY['name', 'email']", note: "Операторы PostgreSQL JSONB: содержит структуру, содержит ключ, содержит любой или все ключи из списка." },
  { group: "JSON-функции", title: "JSON_OBJECT / JSON_ARRAY", sql: "JSON_OBJECT('name', first_name, 'age', age)\nJSON_ARRAY(id, name)", note: "Создаёт JSON-объект или массив из переданных значений; точный синтаксис зависит от СУБД." },
  { group: "Операторы изменения данных (DML)", title: "INSERT", sql: "INSERT INTO имя_таблицы (столбец1, столбец2)\nVALUES (значение1, значение2);", note: "Добавляет одну или несколько новых строк в таблицу." },
  { group: "Операторы изменения данных (DML)", title: "INSERT ... SELECT", sql: "INSERT INTO archive_users (id, email)\nSELECT id, email FROM users WHERE inactive = TRUE;", note: "Добавляет в таблицу результат другого SELECT-запроса." },
  { group: "Операторы изменения данных (DML)", title: "UPDATE", sql: "UPDATE имя_таблицы\nSET столбец = новое_значение\nWHERE условие;", note: "Изменяет значения существующих строк. Без WHERE будут изменены все строки таблицы." },
  { group: "Операторы изменения данных (DML)", title: "DELETE", sql: "DELETE FROM имя_таблицы\nWHERE условие;", note: "Удаляет строки, удовлетворяющие условию. Без WHERE удалит все строки." },
  { group: "Операторы изменения данных (DML)", title: "UPSERT — ON CONFLICT", sql: "INSERT INTO users (id, email)\nVALUES (1, 'a@example.com')\nON CONFLICT (id) DO UPDATE\nSET email = EXCLUDED.email;\n-- PostgreSQL", note: "При конфликте уникальности выполняет обновление или пропускает вставку. Синтаксис MySQL — ON DUPLICATE KEY UPDATE." },
  { group: "Операторы изменения данных (DML)", title: "REPLACE", sql: "REPLACE INTO users (id, email)\nVALUES (1, 'a@example.com');\n-- MySQL", note: "MySQL-оператор вставки с заменой конфликтующей строки; может фактически удалить старую и вставить новую." },
  { group: "Операторы определения данных (DDL)", title: "CREATE DATABASE", sql: "CREATE DATABASE имя_базы;", note: "Создаёт базу данных. Требует соответствующих прав; поддержка синтаксиса зависит от СУБД." },
  { group: "Операторы определения данных (DDL)", title: "CREATE TABLE", sql: "CREATE TABLE имя_таблицы (\n  id BIGINT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);", note: "Создаёт таблицу и определяет столбцы, типы данных и ограничения." },
  { group: "Операторы определения данных (DDL)", title: "CREATE TABLE AS SELECT", sql: "CREATE TABLE new_table AS\nSELECT id, name FROM users WHERE active = TRUE;", note: "Создаёт таблицу на основе результата SELECT. Перенос ограничений и индексов не гарантируется." },
  { group: "Операторы определения данных (DDL)", title: "CREATE VIEW", sql: "CREATE VIEW active_users AS\nSELECT * FROM users WHERE active = TRUE;", note: "Создаёт представление — сохранённый запрос, который можно использовать как таблицу." },
  { group: "Операторы определения данных (DDL)", title: "CREATE INDEX", sql: "CREATE INDEX idx_users_email\nON users (email);", note: "Создаёт индекс для ускорения поиска и сортировки; увеличивает стоимость записи и хранения." },
  { group: "Операторы определения данных (DDL)", title: "ALTER TABLE ADD", sql: "ALTER TABLE users\nADD COLUMN phone VARCHAR(30);", note: "Добавляет столбец в существующую таблицу." },
  { group: "Операторы определения данных (DDL)", title: "ALTER TABLE ALTER / MODIFY", sql: "ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(50);\n-- PostgreSQL\nALTER TABLE users MODIFY phone VARCHAR(50);\n-- MySQL", note: "Изменяет тип или свойства столбца; синтаксис PostgreSQL и MySQL различается." },
  { group: "Операторы определения данных (DDL)", title: "ALTER TABLE DROP / RENAME", sql: "ALTER TABLE users DROP COLUMN phone;\nALTER TABLE users RENAME COLUMN name TO full_name;", note: "Удаляет или переименовывает столбец. Синтаксис и поддержка зависят от версии СУБД." },
  { group: "Операторы определения данных (DDL)", title: "DROP TABLE / VIEW / INDEX", sql: "DROP TABLE имя_таблицы;\nDROP VIEW имя_представления;\nDROP INDEX имя_индекса;", note: "Удаляет таблицу, представление или индекс как объект схемы. CASCADE/зависимости зависят от СУБД." },
  { group: "Операторы определения данных (DDL)", title: "TRUNCATE TABLE", sql: "TRUNCATE TABLE имя_таблицы;", note: "Быстро удаляет все строки таблицы, сохраняя её структуру. Поведение транзакций и identity зависит от СУБД." },
  { group: "Ограничения целостности", title: "PRIMARY KEY", sql: "id BIGINT PRIMARY KEY", note: "Первичный ключ: уникально идентифицирует строку; не допускает NULL." },
  { group: "Ограничения целостности", title: "FOREIGN KEY / REFERENCES", sql: "user_id BIGINT REFERENCES users(id)\n-- или отдельное ограничение\nFOREIGN KEY (user_id) REFERENCES users(id)", note: "Внешний ключ обеспечивает ссылочную целостность между таблицами." },
  { group: "Ограничения целостности", title: "UNIQUE", sql: "email VARCHAR(255) UNIQUE", note: "Запрещает повторяющиеся значения в столбце или комбинации столбцов; правила NULL различаются." },
  { group: "Ограничения целостности", title: "NOT NULL / DEFAULT", sql: "status VARCHAR(20) NOT NULL DEFAULT 'new'", note: "NOT NULL запрещает отсутствие значения; DEFAULT задаёт значение по умолчанию при отсутствии явного значения." },
  { group: "Ограничения целостности", title: "CHECK", sql: "age INT CHECK (age >= 0)", note: "Проверяет логическое условие для каждой добавляемой или изменяемой строки." },
  { group: "Транзакции (TCL)", title: "BEGIN / START TRANSACTION", sql: "BEGIN;\n-- или START TRANSACTION;", note: "Начинает транзакцию — группу операций, которую можно подтвердить или отменить." },
  { group: "Транзакции (TCL)", title: "COMMIT", sql: "COMMIT;", note: "Подтверждает изменения текущей транзакции." },
  { group: "Транзакции (TCL)", title: "ROLLBACK", sql: "ROLLBACK;", note: "Отменяет изменения текущей транзакции, ещё не подтверждённые COMMIT." },
  { group: "Транзакции (TCL)", title: "SAVEPOINT / ROLLBACK TO", sql: "SAVEPOINT before_update;\nUPDATE users SET active = FALSE;\nROLLBACK TO SAVEPOINT before_update;", note: "Создаёт точку сохранения и позволяет откатить часть транзакции." },
  { group: "Управление доступом (DCL)", title: "GRANT", sql: "GRANT SELECT, INSERT ON users TO analyst;", note: "Выдаёт пользователю или роли указанные права доступа. Синтаксис зависит от СУБД." },
  { group: "Управление доступом (DCL)", title: "REVOKE", sql: "REVOKE INSERT ON users FROM analyst;", note: "Отзывает ранее выданные права." },
  { group: "Оконные и служебные выражения", title: "WITHIN GROUP", sql: "PERCENTILE_CONT(0.5)\nWITHIN GROUP (ORDER BY score)", note: "Задаёт порядок значений внутри упорядоченного агрегата, например для процентилей." },
  { group: "Оконные и служебные выражения", title: "FILTER (WHERE)", sql: "SUM(amount) FILTER (WHERE status = 'paid')", note: "Условно включает строки в один агрегат, не меняя выборку для других агрегатов; PostgreSQL." },
  { group: "Оконные и служебные выражения", title: "Комментарии", sql: "-- однострочный комментарий\n/* многострочный\n   комментарий */", note: "Комментарии не исполняются. -- поддерживается обоими диалектами; детали /* */ зависят от СУБД." },

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
function aggregateSqlExpression(metric: AggregateMetric, q: (name: string) => string) {
  const column = metric.column.trim();
  if (metric.fn === "COUNT" && column === "*") return "COUNT(*)";
  if (metric.fn === "JSON_OBJECTAGG" || metric.fn === "JSONB_OBJECTAGG") {
    const pair = column.split(",").map((value) => value.trim());
    if (pair.length !== 2 || pair.some((value) => !validColumnReference(value))) throw new Error("Для JSON_OBJECTAGG укажи два столбца: ключ, значение.");
    return "JSON_OBJECTAGG(" + q(pair[0]) + ", " + q(pair[1]) + ")";
  }
  if (!validColumnReference(column)) throw new Error("Проверь столбец агрегатного показателя. Для COUNT(*) укажи звёздочку.");
  if (metric.fn === "COUNT_DISTINCT") return "COUNT(DISTINCT " + q(column) + ")";
  if (metric.fn === "STRING_AGG") return "STRING_AGG(" + q(column) + ", ', ')";
  return metric.fn + "(" + q(column) + ")";
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
        const groupColumns = form.groupBy.trim() ? splitIdentifiers(form.groupBy) : [];
        if (!groupColumns) return { sql: "", params, error: "Проверь столбцы группировки: используй имена через запятую." };
        if (!form.aggregates.length) return { sql: "", params, error: "Добавь хотя бы один агрегатный показатель." };
        const groupAliases = form.groupAliases.trim() ? form.groupAliases.split(",").map((alias) => alias.trim()) : [];
        if (groupAliases.length && (groupAliases.length !== groupColumns.length || groupAliases.some((alias) => !alias))) return { sql: "", params, error: "Если задаёшь псевдонимы, укажи по одному для каждого столбца группировки через запятую." };
        const expressions = form.aggregates.map((metric, index) => {
          const alias = metric.alias.trim();
          if (!alias) throw new Error("Укажи псевдоним для агрегатного столбца №" + (index + 1) + ".");
          return aggregateSqlExpression(metric, q) + " AS " + aliasSql(alias);
        });
        if (form.havingAlias.trim() && !validIdentifier(form.havingAlias.trim())) return { sql: "", params, error: "HAVING должен ссылаться на корректный псевдоним агрегатного показателя." };
        if (form.havingAlias.trim() && !form.aggregates.some((metric) => metric.alias.trim() === form.havingAlias.trim())) return { sql: "", params, error: "Псевдоним HAVING должен совпадать с псевдонимом одного из агрегатных показателей." };
        if (form.havingAlias.trim() && !form.havingValue.trim()) return { sql: "", params, error: "Укажи значение для условия HAVING." };
        if (form.orderColumn.trim() && !validIdentifier(form.orderColumn.trim())) return { sql: "", params, error: "Проверь поле или псевдоним для сортировки агрегатов." };
        if (form.limit.trim() && (!/^\d+$/.test(form.limit.trim()) || Number(form.limit) > 10000)) return { sql: "", params, error: "LIMIT должен быть целым числом от 0 до 10000." };
        if (form.offset.trim() && (!/^\d+$/.test(form.offset.trim()) || Number(form.offset) > 1000000)) return { sql: "", params, error: "OFFSET должен быть целым числом от 0 до 1000000." };
        const whereClause = where();
        const havingMetric = form.aggregates.find((metric) => metric.alias.trim() === form.havingAlias.trim());
        const havingTarget = havingMetric ? aggregateSqlExpression(havingMetric, q) : "";
        const having = form.havingAlias.trim()
          ? "\nHAVING " + (dialect === "mysql" ? q(form.havingAlias.trim()) : havingTarget) + " " + form.havingOperator + " " + placeholder(form.havingValue)
          : "";
        const sorting = form.orderColumn.trim() ? "\nORDER BY " + q(form.orderColumn.trim()) + " " + form.orderDirection : "";
        const limit = form.limit.trim() ? "\nLIMIT " + Number(form.limit) : "";
        const offset = form.offset.trim() ? "\nOFFSET " + Number(form.offset) : "";
        const selectedGroups = groupColumns.map((column, index) => groupAliases.length ? q(column) + " AS " + aliasSql(groupAliases[index]) : q(column));
        const selectItems = [...selectedGroups, ...expressions].join(",\n       ");
        const groupByClause = groupColumns.length ? "\nGROUP BY " + groupColumns.map(q).join(", ") : "";
        return { sql: "SELECT " + selectItems + "\nFROM " + tableSql + whereClause + groupByClause + having + sorting + limit + offset + ";", params, error: "" };
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
  const [tab, setTab] = useState<"builder" | "reference" | "memo" | "frequent" | "checks">("builder");
  const [dialect, setDialect] = useState<Dialect>("postgres");
  const [operation, setOperation] = useState<Operation>("select");
  const [form, setForm] = useState<BuilderState>(initial);
  const [search, setSearch] = useState("");
  const [frequentSearch, setFrequentSearch] = useState("");
  const [memoSearch, setMemoSearch] = useState("");
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
  const snippetGroups = [...new Set(filteredSnippets.map((item) => item.group))].sort((a, b) => {
    if (a === "DQL — выборка и фильтрация") return -1;
    if (b === "DQL — выборка и фильтрация") return 1;
    return 0;
  });

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Database className="h-5 w-5" /></div>
          <h2 className="text-xl font-semibold">Работа с базами данных</h2>
        </div>
        <p className="text-sm text-muted-foreground">Инструмент для QA: собери SQL-запрос, выполни его на учебных данных и проверь результат.</p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { id: "builder" as const, title: "Конструктор запросов", desc: "Собрать SQL по полям", icon: <WandSparkles className="h-4 w-4" /> },
          { id: "reference" as const, title: "Шпаргалка SQL", desc: "Команды и примеры", icon: <BookOpen className="h-4 w-4" /> },
          { id: "memo" as const, title: "Памятка по SQL", desc: "Основные операторы и их значения", icon: <Info className="h-4 w-4" /> },
          { id: "frequent" as const, title: "Наиболее частые запросы", desc: "SQL для ежедневных QA-проверок", icon: <ClipboardList className="h-4 w-4" /> },
          { id: "checks" as const, title: "Проверки QA", desc: "Чек-лист тестирования данных", icon: <ShieldCheck className="h-4 w-4" /> },
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
                <div><label className={labelClass}>Группировать по (необязательно; пустое поле — один общий результат)</label><input value={form.groupBy} onChange={(event) => update("groupBy", event.target.value)} className={fieldClass} placeholder="status, department" /><label className={labelClass + " mt-2"}>Псевдонимы столбцов группировки (необязательно)</label><input value={form.groupAliases} onChange={(event) => update("groupAliases", event.target.value)} className={fieldClass} placeholder="Статус, Отдел" /><p className="mt-1 text-[11px] text-muted-foreground">Можно группировать по любым полям текущей таблицы. Перечисли несколько столбцов через запятую. Если псевдонимы не нужны, оставь поле пустым.</p></div>
                <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">Агрегатные показатели</p><button type="button" onClick={() => setForm((current) => ({ ...current, aggregates: [...current.aggregates, { id: Math.max(0, ...current.aggregates.map((metric) => metric.id)) + 1, fn: "COUNT", column: "*", alias: "total" }] }))} className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-background">+ Добавить показатель</button></div>
                {form.aggregates.map((metric, index) => <div key={metric.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Показатель {index + 1}</span>{form.aggregates.length > 1 && <button type="button" onClick={() => setForm((current) => ({ ...current, aggregates: current.aggregates.filter((item) => item.id !== metric.id) }))} className="text-xs text-destructive hover:underline">Удалить</button>}</div>
                  <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Функция</label><select value={metric.fn} onChange={(event) => setForm((current) => ({ ...current, aggregates: current.aggregates.map((item) => item.id === metric.id ? { ...item, fn: event.target.value as AggregateFunction } : item) }))} className={fieldClass}><option value="COUNT">COUNT — количество</option><option value="COUNT_DISTINCT">COUNT DISTINCT — уникальные</option><option value="SUM">SUM — сумма</option><option value="AVG">AVG — среднее</option><option value="MIN">MIN — минимум</option><option value="MAX">MAX — максимум</option><option value="GROUP_CONCAT">GROUP_CONCAT — объединить строки</option><option value="STRING_AGG">STRING_AGG — объединить строки с разделителем</option><option value="ARRAY_AGG">ARRAY_AGG — массив значений (JSON)</option><option value="JSON_AGG">JSON_AGG — JSON-массив</option><option value="JSON_ARRAYAGG">JSON_ARRAYAGG — JSON-массив</option><option value="JSON_OBJECTAGG">JSON_OBJECTAGG — JSON-объект (ключ, значение)</option><option value="JSONB_OBJECTAGG">JSONB_OBJECTAGG — JSONB-объект (ключ, значение)</option><option value="BOOL_AND">BOOL_AND — все истинны</option><option value="BOOL_OR">BOOL_OR — хотя бы одно истинно</option><option value="EVERY">EVERY — все истинны</option><option value="BIT_AND">BIT_AND — побитовое И</option><option value="BIT_OR">BIT_OR — побитовое ИЛИ</option><option value="BIT_XOR">BIT_XOR — побитовое исключающее ИЛИ</option><option value="STDDEV">STDDEV — стандартное отклонение</option><option value="STDDEV_POP">STDDEV_POP — отклонение генеральной совокупности</option><option value="STDDEV_SAMP">STDDEV_SAMP — выборочное отклонение</option><option value="VARIANCE">VARIANCE — дисперсия</option><option value="VAR_POP">VAR_POP — дисперсия генеральной совокупности</option><option value="VAR_SAMP">VAR_SAMP — выборочная дисперсия</option><option value="MEDIAN">MEDIAN — медиана</option><option value="TOTAL">TOTAL — сумма с результатом 0 для пустого набора</option><option value="ANY_VALUE">ANY_VALUE — любое значение группы</option></select></div><div><label className={labelClass}>Столбец</label><input value={metric.column} onChange={(event) => setForm((current) => ({ ...current, aggregates: current.aggregates.map((item) => item.id === metric.id ? { ...item, column: event.target.value } : item) }))} className={fieldClass} placeholder="* / first_name / key_column, value_column" /></div></div>
                  <div><label className={labelClass}>Название столбца в результате (AS)</label><input value={metric.alias} onChange={(event) => setForm((current) => ({ ...current, aggregates: current.aggregates.map((item) => item.id === metric.id ? { ...item, alias: event.target.value } : item) }))} className={fieldClass} placeholder="Количество_экземпляров" /></div>
                </div>)}
                <p className="text-[11px] leading-relaxed text-muted-foreground">Выбирай агрегатные функции и столбцы под свою задачу: GROUP BY можно не заполнять: агрегат вычисляется по всей выборке после WHERE. Доступны COUNT, SUM, AVG, MIN, MAX, GROUP_CONCAT, STRING_AGG, ARRAY_AGG, JSON_AGG/JSON_ARRAYAGG/JSON_OBJECTAGG, BOOL_AND/OR, EVERY, BIT_AND/OR/XOR, STDDEV, VARIANCE, MEDIAN, TOTAL и ANY_VALUE. Для JSON_OBJECTAGG укажи два столбца через запятую: ключ, значение.</p>
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
            </div>
          </div>
        </section>
      )}

      <div className={tab === "builder" ? "block" : "hidden"}>
        <SqlExecutionConsole generatedSql={generated.sql} generatedError={generated.error} dialect={dialect} />
      </div>

      {tab === "reference" && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">DQL — выборка и фильтрация</h2>
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} className={fieldClass + " pl-9"} placeholder="Найти оператор, функцию или синтаксис: SELECT, COUNT, CASE, JOIN..." /></div>
          <div className="space-y-7">
            {snippetGroups.map((group) => (
              <section key={group} className="space-y-3">
                {group === "DQL — выборка и фильтрация" ? (
                  <h3 className="border-b border-border pb-2 text-sm font-semibold text-foreground">🔹 Основные команды выборки и фильтрации (DQL)</h3>
                ) : (
                  <h3 className="border-b border-border pb-2 text-sm font-semibold text-foreground">🔹 {group}</h3>
                )}
                <div className="space-y-2">
                  {filteredSnippets.filter((item) => item.group === group).map((item) => (
                    <p key={item.title} className="text-sm leading-6 text-foreground">
                      <strong>{item.title}</strong>{" "}
                      <code className="whitespace-pre-wrap break-words rounded bg-muted/60 px-1 py-0.5 text-xs">{item.sql.replace(/\\s+/g, " ")}</code>
                      {" — "}{item.note}
                      <button onClick={() => copy(item.sql)} className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"><Copy className="h-3 w-3" />Копировать</button>
                    </p>
                  ))}
                </div>
              </section>
            ))}
            {filteredSnippets.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">По запросу ничего не найдено.</p>}
          </div>
        </section>
      )}
      
      {tab === "memo" && (
        <section className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Памятка по SQL — основные операторы и их значения</h3>
            <p className="text-sm text-muted-foreground">Краткий справочник по командам, частям запросов, условиям, функциям и ограничениям целостности. Синтаксис отдельных операторов может отличаться между PostgreSQL, MySQL и другими СУБД.</p>
          </div>
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={memoSearch} onChange={(event) => setMemoSearch(event.target.value)} className={fieldClass + " pl-9"} placeholder="Найти оператор: WHERE, JOIN, AND, COUNT, COMMIT..." /></div>
          <div className="space-y-6">
            {memoOperatorGroups.map((group) => {
              const items = group.items.filter((item) => (group.group + item.title + item.syntax + item.note).toLocaleLowerCase("ru").includes(memoSearch.toLocaleLowerCase("ru")));
              if (!items.length) return null;
              return (
                <section key={group.group} className="space-y-3">
                  <h4 className="border-b border-border pb-2 text-sm font-semibold text-foreground">{group.group}</h4>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {items.map((item) => (
                      <article key={item.title + item.syntax} className="min-w-0 rounded-xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-semibold text-foreground">{item.title}</h5>
                          <button type="button" onClick={() => copy(item.syntax)} className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"><Copy className="h-3 w-3" />Копировать</button>
                        </div>
                        <code className="mt-2 block whitespace-pre-wrap break-words rounded bg-muted/60 px-2 py-1.5 text-xs text-foreground">{item.syntax}</code>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
            {!memoOperatorGroups.some((group) => group.items.some((item) => (group.group + item.title + item.syntax + item.note).toLocaleLowerCase("ru").includes(memoSearch.toLocaleLowerCase("ru")))) && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">По запросу ничего не найдено.</p>}
          </div>
          <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /><p>Осторожно с UPDATE, DELETE, DROP и TRUNCATE: они изменяют или удаляют данные/объекты. Перед изменениями проверь WHERE, используй тестовую БД и транзакцию, если СУБД поддерживает откат этой операции.</p></div>
        </section>
      )}

      {tab === "frequent" && (
        <section className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Наиболее частые запросы</h3>
            <p className="text-sm text-muted-foreground">Готовые SQL-примеры для повседневных проверок тестировщика. Перед запуском замени названия таблиц, столбцов и тестовые значения на соответствующие своей БД.</p>
          </div>
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={frequentSearch} onChange={(event) => setFrequentSearch(event.target.value)} className={fieldClass + " pl-9"} placeholder="Найти запрос: дубликаты, NULL, статус, JOIN..." /></div>
          <div className="space-y-7">
            {[...new Set(frequentQueries.filter((item) => (item.title + item.group + item.sql + item.note).toLocaleLowerCase("ru").includes(frequentSearch.toLocaleLowerCase("ru"))).map((item) => item.group))].map((group) => (
              <section key={group} className="space-y-3">
                <h4 className="border-b border-border pb-2 text-sm font-semibold text-foreground">🔹 {group}</h4>
                <div className="grid gap-3 lg:grid-cols-2">
                  {frequentQueries.filter((item) => item.group === group && (item.title + item.group + item.sql + item.note).toLocaleLowerCase("ru").includes(frequentSearch.toLocaleLowerCase("ru"))).map((item) => (
                    <article key={item.title} className="min-w-0 space-y-2 rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-sm font-semibold text-foreground">{item.title}</h5>
                        <button type="button" onClick={() => copy(item.sql)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"><Copy className="h-3 w-3" />Копировать</button>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs leading-5 text-foreground"><code>{item.sql}</code></pre>
                      <p className="text-xs leading-5 text-muted-foreground">{item.note}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
            {frequentQueries.filter((item) => (item.title + item.group + item.sql + item.note).toLocaleLowerCase("ru").includes(frequentSearch.toLocaleLowerCase("ru"))).length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">По запросу ничего не найдено.</p>}
          </div>
          <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /><p>Примеры в основном читают данные (SELECT). Перед использованием проверь имена таблиц и полей, права доступа и тестовую среду. Не запускай изменяющие данные команды на production без разрешения.</p></div>
        </section>
      )}

      {tab === "checks" && (
        <section className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Чек-лист проверки данных</div><ul className="space-y-2 text-sm text-muted-foreground">{["После создания пользователя проверь, что запись появилась и поля заполнены корректно.","После изменения статуса проверь новое значение и историю изменений, если она предусмотрена.","Для связей проверь существование родительской записи и отсутствие «осиротевших» записей.","Для списков сравни COUNT(*) с количеством элементов в UI/API с учётом фильтров и пагинации.","Проверь дубликаты в полях, которые по требованиям должны быть уникальными.","Проверь NULL, пустую строку и пробелы отдельно — это разные значения.","Для денежных расчётов сравни сумму заказа с суммой позиций и правилами округления.","Для удаления проверь, что удалена только нужная запись и связанные данные обработаны согласно требованиям."].map((item) => <li key={item} className="flex gap-2"><span className="text-primary">•</span>{item}</li>)}</ul></div>
          <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /><p>Не запускай DDL/DML-команды в production или общей staging-среде без явного разрешения. Перед UPDATE/DELETE сначала выполни SELECT с тем же WHERE и проверь количество строк.</p></div>
        </section>
      )}
    </div>
  );
}
