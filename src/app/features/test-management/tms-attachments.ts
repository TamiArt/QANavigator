export type TmsAttachmentOwnerType = "case" | "run-result" | "defect";
export interface TmsAttachmentRecord {
  id: string;
  projectId: string;
  ownerType: TmsAttachmentOwnerType;
  ownerId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  blob: Blob;
}
export type TmsAttachmentInfo = Omit<TmsAttachmentRecord, "blob">;
const DATABASE_NAME = "qa-navigator-test-management";
const DATABASE_VERSION = 1;
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("В этом браузере недоступно локальное файловое хранилище"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("projects")) database.createObjectStore("projects", { keyPath: "projectId" });
      if (!database.objectStoreNames.contains("attachments")) {
        const store = database.createObjectStore("attachments", { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
      if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Не удалось открыть файловое хранилище"));
  });
}
function resultOf<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ошибка файлового хранилища"));
  });
}
function done(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Не удалось сохранить вложение"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Сохранение вложения отменено"));
  });
}
function info(record: TmsAttachmentRecord): TmsAttachmentInfo {
  const { blob: _blob, ...metadata } = record;
  return metadata;
}
export async function listTmsAttachments(projectId: string, ownerType: TmsAttachmentOwnerType, ownerId: string): Promise<TmsAttachmentInfo[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readonly");
    const records = await resultOf(transaction.objectStore("attachments").index("projectId").getAll(projectId)) as TmsAttachmentRecord[];
    await done(transaction);
    return records.filter((item) => item.ownerType === ownerType && item.ownerId === ownerId).map(info);
  } finally { database.close(); }
}
export async function saveTmsAttachment(projectId: string, ownerType: TmsAttachmentOwnerType, ownerId: string, file: File): Promise<TmsAttachmentInfo> {
  if (!file.size) throw new Error("Нельзя прикрепить пустой файл");
  if (file.size > MAX_ATTACHMENT_SIZE) throw new Error("Размер одного вложения не должен превышать 20 МБ");
  const record: TmsAttachmentRecord = {
    id: crypto.randomUUID(), projectId, ownerType, ownerId, name: file.name,
    mimeType: file.type || "application/octet-stream", size: file.size,
    createdAt: new Date().toISOString(), blob: file,
  };
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readwrite");
    transaction.objectStore("attachments").put(record);
    await done(transaction);
    return info(record);
  } finally { database.close(); }
}
export async function getTmsAttachment(id: string): Promise<TmsAttachmentRecord | undefined> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readonly");
    const record = await resultOf(transaction.objectStore("attachments").get(id)) as TmsAttachmentRecord | undefined;
    await done(transaction);
    return record;
  } finally { database.close(); }
}
export async function deleteTmsAttachment(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readwrite");
    transaction.objectStore("attachments").delete(id);
    await done(transaction);
  } finally { database.close(); }
}
export async function listProjectTmsAttachments(projectId: string): Promise<TmsAttachmentRecord[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readonly");
    const records = await resultOf(transaction.objectStore("attachments").index("projectId").getAll(projectId)) as TmsAttachmentRecord[];
    await done(transaction);
    return records;
  } finally { database.close(); }
}
export async function importTmsAttachment(record: TmsAttachmentRecord): Promise<void> {
  if (record.size > MAX_ATTACHMENT_SIZE || record.blob.size !== record.size) throw new Error("В архиве обнаружено некорректное вложение");
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readwrite");
    transaction.objectStore("attachments").put(record);
    await done(transaction);
  } finally { database.close(); }
}

export async function replaceProjectTmsAttachments(projectId: string, records: TmsAttachmentRecord[]): Promise<void> {
  if (records.some((record) => record.projectId !== projectId || record.size > MAX_ATTACHMENT_SIZE || record.blob.size !== record.size)) {
    throw new Error("Архив содержит вложения с некорректными данными");
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction("attachments", "readwrite");
    const store = transaction.objectStore("attachments");
    const request = store.index("projectId").getAllKeys(projectId);
    request.onsuccess = () => {
      for (const key of request.result) store.delete(key);
      for (const record of records) store.put(record);
    };
    await done(transaction);
  } finally { database.close(); }
}
