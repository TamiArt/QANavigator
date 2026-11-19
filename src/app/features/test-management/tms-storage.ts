import { parseStoredValue, serializeStoredValue } from "../../core/storage";
import { STORAGE_KEYS } from "../../core/constants";
import { isTestManagementStorageValue } from "../../core/storage-validators";
import type { TmsData } from "../../domain/test-management";

export type TmsStorageMode = "localStorage" | "indexedDB";
export const TMS_STORAGE_MODE_KEY = "qa_navigator_tms_storage_mode_v1";
const DATABASE_NAME = "qa-navigator-test-management";
const DATABASE_VERSION = 1;
const PROJECT_STORE = "projects";

function readLocalProjects(): TmsData[] {
  const raw = localStorage.getItem(STORAGE_KEYS.testManagement);
  if (!raw) return [];
  const parsed = parseStoredValue<unknown>(raw, [], isTestManagementStorageValue);
  if (!Array.isArray(parsed)) throw new Error("Локальные данные Test Management имеют неизвестный формат");
  return parsed as TmsData[];
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Этот браузер не поддерживает IndexedDB"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        database.createObjectStore(PROJECT_STORE, { keyPath: "projectId" });
      }
      if (!database.objectStoreNames.contains("attachments")) {
        const attachments = database.createObjectStore("attachments", { keyPath: "id" });
        attachments.createIndex("projectId", "projectId", { unique: false });
      }
      if (!database.objectStoreNames.contains("meta")) {
        database.createObjectStore("meta", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Не удалось открыть локальную базу Test Management"));
    request.onblocked = () => reject(new Error("Обновление локальной базы заблокировано другой вкладкой. Закройте другие вкладки QA Navigator."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ошибка локальной базы данных"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Транзакция локальной базы не выполнена"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Транзакция локальной базы отменена"));
  });
}

async function readIndexedDbProjects(): Promise<TmsData[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PROJECT_STORE, "readonly");
    const result = await requestResult(transaction.objectStore(PROJECT_STORE).getAll()) as TmsData[];
    await transactionDone(transaction);
    return result;
  } finally {
    database.close();
  }
}

async function writeIndexedDbProjects(projects: TmsData[]): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PROJECT_STORE, "readwrite");
    const store = transaction.objectStore(PROJECT_STORE);
    store.clear();
    for (const project of projects) {
      if (!project.projectId) throw new Error("У записи Test Management отсутствует projectId");
      store.put({ ...project, version: 1 });
    }
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export function getInitialTmsStorageMode(): TmsStorageMode {
  try {
    return localStorage.getItem(TMS_STORAGE_MODE_KEY) === "localStorage" ? "localStorage" : "indexedDB";
  } catch {
    return "indexedDB";
  }
}

/** First IndexedDB open copies legacy localStorage records; the old copy is deliberately retained. */
export async function loadTmsProjects(mode: TmsStorageMode): Promise<TmsData[]> {
  if (mode === "localStorage") return readLocalProjects();

  const database = await openDatabase();
  try {
    const markerTransaction = database.transaction("meta", "readonly");
    const marker = await requestResult(markerTransaction.objectStore("meta").get("legacyLocalStorageMigrated"));
    await transactionDone(markerTransaction);
    if (marker) {
      const readTransaction = database.transaction(PROJECT_STORE, "readonly");
      const projects = await requestResult(readTransaction.objectStore(PROJECT_STORE).getAll()) as TmsData[];
      await transactionDone(readTransaction);
      return projects;
    }

    const legacyProjects = readLocalProjects();
    const migration = database.transaction([PROJECT_STORE, "meta"], "readwrite");
    const projectStore = migration.objectStore(PROJECT_STORE);
    for (const project of legacyProjects) {
      if (!project.projectId) throw new Error("У записи Test Management отсутствует projectId");
      projectStore.put({ ...project, version: 1 });
    }
    migration.objectStore("meta").put({ key: "legacyLocalStorageMigrated", completedAt: new Date().toISOString() });
    await transactionDone(migration);
    return legacyProjects;
  } finally {
    database.close();
  }
}

/** Switches only after the target store has accepted the full data set. The source is never deleted. */
export async function switchTmsStorageMode(
  target: TmsStorageMode,
  projects: TmsData[],
): Promise<void> {
  if (target === "indexedDB") {
    await writeIndexedDbProjects(projects);
  } else {
    localStorage.setItem(STORAGE_KEYS.testManagement, serializeStoredValue(projects));
  }
  localStorage.setItem(TMS_STORAGE_MODE_KEY, target);
}

export async function persistTmsProjects(
  mode: TmsStorageMode,
  projects: TmsData[],
): Promise<void> {
  if (mode === "indexedDB") {
    await writeIndexedDbProjects(projects);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.testManagement, serializeStoredValue(projects));
}
