export type TestObjectType =
  | "field"
  | "form"
  | "auth"
  | "search"
  | "api"
  | "database"
  | "file-upload"
  | "permissions"
  | "checkout"
  | "stateful";

export type FieldDataType = "text" | "number" | "email" | "phone" | "password" | "date" | "other";

export interface FieldConfig {
  id: string;
  name: string;
  dataType: FieldDataType;
  required: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
}

export interface TestObjectConfig {
  objectType: TestObjectType;
  fields: FieldConfig[];
  httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  hasParameters?: boolean;
  hasBody?: boolean;
  hasAuthorization?: boolean;
  requiredApiFields?: string;
  states?: string;
  transitions?: string;
  hasMultipleConditions?: boolean;
  hasManyCombinations?: boolean;
  notes?: string;
}

export type TestPlanCategory =
  | "requirements"
  | "positive"
  | "validation"
  | "negative"
  | "combinations"
  | "state"
  | "integration"
  | "ux"
  | "accessibility"
  | "compatibility"
  | "security"
  | "reliability"
  | "destructive"
  | "exploratory"
  | "regression";

export interface TestTechnique {
  ru: string;
  en: string;
  short?: string;
}

export interface TestPlanStep {
  id: string;
  category: TestPlanCategory;
  title: string;
  action: string;
  why: string;
  technique?: TestTechnique;
  examples?: string[];
  expected?: string;
  warning?: string;
}

export const TEST_OBJECT_OPTIONS: { id: TestObjectType; label: string; hint: string }[] = [
  { id: "field", label: "Поле ввода", hint: "Одно поле и его ограничения" },
  { id: "form", label: "Форма", hint: "Несколько полей и их взаимодействие" },
  { id: "auth", label: "Регистрация / авторизация", hint: "Учётные данные, сессии и ошибки входа" },
  { id: "search", label: "Поиск / фильтрация / сортировка", hint: "Запросы, выдача и комбинации условий" },
  { id: "api", label: "API", hint: "Методы, параметры, body, контракт и авторизация" },
  { id: "database", label: "База данных", hint: "CRUD, ограничения и целостность данных" },
  { id: "file-upload", label: "Загрузка файла", hint: "Типы, размеры, ошибки и прерывания" },
  { id: "permissions", label: "Роли и права", hint: "Матрица доступа и запрещённые действия" },
  { id: "checkout", label: "Корзина / заказ / оплата", hint: "Расчёты, статусы и интеграции" },
  { id: "stateful", label: "Объект с состояниями", hint: "Состояния и разрешённые переходы" },
];

export const FIELD_TYPE_OPTIONS: { id: FieldDataType; label: string }[] = [
  { id: "text", label: "Текст" },
  { id: "number", label: "Число" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Телефон" },
  { id: "password", label: "Пароль" },
  { id: "date", label: "Дата" },
  { id: "other", label: "Другое" },
];

export const createEmptyField = (index = 0): FieldConfig => ({
  id: crypto.randomUUID(),
  name: index === 0 ? "Поле" : `Поле ${index + 1}`,
  dataType: "text",
  required: false,
});

export const createInitialObjectConfig = (): TestObjectConfig => ({
  objectType: "field",
  fields: [createEmptyField()],
  hasParameters: false,
  hasBody: false,
  hasAuthorization: false,
  hasMultipleConditions: false,
  hasManyCombinations: false,
});
