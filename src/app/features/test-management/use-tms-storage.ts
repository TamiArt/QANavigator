import { useCallback, useEffect, useRef, useState } from "react";
import type { TmsData } from "../../domain/test-management";
import {
  getInitialTmsStorageMode,
  loadTmsProjects,
  persistTmsProjects,
  switchTmsStorageMode,
  type TmsStorageMode,
  TMS_STORAGE_MODE_KEY,
} from "./tms-storage";

export function useTmsStorage() {
  const [projects, setProjects] = useState<TmsData[]>([]);
  const [mode, setMode] = useState<TmsStorageMode>(getInitialTmsStorageMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [switching, setSwitching] = useState(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const persistedProjects = useRef<TmsData[]>([]);

  useEffect(() => {
    let active = true;
    loadTmsProjects(mode).then((value) => {
      if (!active) return;
      persistedProjects.current = value;
      setLoadError(false);
      setProjects(value);
      setLoading(false);
      if (mode === "indexedDB" && value.length) {
        setNotice("Данные доступны в IndexedDB. Исходная копия localStorage сохранена для возврата.");
      }
    }).catch((reason: unknown) => {
      if (!active) return;
      if (mode === "indexedDB" && typeof indexedDB === "undefined") {
        setNotice("IndexedDB недоступен в этом браузере. Используется прежнее хранилище localStorage.");
        setMode("localStorage");
        return;
      }
      setLoadError(true);
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить данные Test Management");
      setLoading(false);
    });
    return () => { active = false; };
  }, [mode]);

  const saveProjects = useCallback((next: TmsData[]) => {
    setProjects(next);
    setError("");
    const operation = writeQueue.current.then(async () => {
      await persistTmsProjects(mode, next);
      persistedProjects.current = next;
      setLoadError(false);
      setProjects(next);
      setError("");
    });
    writeQueue.current = operation.catch(() => undefined);
    void operation.catch((reason: unknown) => {
      setProjects(persistedProjects.current);
      setLoadError(false);
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить данные Test Management");
    });
  }, [mode]);

  const changeMode = useCallback(async (target: TmsStorageMode) => {
    if (target === mode) return;
    setError("");
    setNotice("");
    setSwitching(true);
    try {
      await writeQueue.current;
      const stableProjects = persistedProjects.current;
      if (loadError && !(mode === "indexedDB" && target === "localStorage")) {
        throw new Error("Исходное хранилище не удалось загрузить. Переключение остановлено, чтобы не перезаписать данные пустым набором.");
      }
      if (loadError && mode === "indexedDB" && target === "localStorage") {
        const legacySnapshot = await loadTmsProjects("localStorage");
        localStorage.setItem(TMS_STORAGE_MODE_KEY, "localStorage");
        persistedProjects.current = legacySnapshot;
        setLoadError(false);
        setProjects(legacySnapshot);
        setMode("localStorage");
        setNotice("Открыта сохранённая резервная копия прежнего localStorage. Данные IndexedDB не удалены; проверьте актуальность копии перед продолжением.");
        setError("");
        return;
      }
      await switchTmsStorageMode(target, stableProjects);
      persistedProjects.current = stableProjects;
      setProjects(stableProjects);
      setMode(target);
      setNotice(target === "indexedDB"
        ? "Данные перенесены в IndexedDB. Копия предыдущего хранилища сохранена."
        : "Возврат к localStorage выполнен. Копия IndexedDB не удалена.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось переключить хранилище");
    } finally {
      setSwitching(false);
    }
  }, [mode, error, loadError]);

  return { projects, saveProjects, mode, changeMode, loading, switching, error, notice };
}
