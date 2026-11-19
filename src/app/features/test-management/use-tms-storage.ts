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
  const [notice, setNotice] = useState("");
  const [switching, setSwitching] = useState(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const persistedProjects = useRef<TmsData[]>([]);

  useEffect(() => {
    let active = true;
    loadTmsProjects(mode).then((value) => {
      if (!active) return;
      persistedProjects.current = value;
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
      setProjects(next);
      setError("");
    });
    writeQueue.current = operation.catch(() => undefined);
    void operation.catch((reason: unknown) => {
      setProjects(persistedProjects.current);
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
      if (mode === "indexedDB" && error && target === "localStorage") {
        const legacySnapshot = await loadTmsProjects("localStorage");
        localStorage.setItem(TMS_STORAGE_MODE_KEY, "localStorage");
        persistedProjects.current = legacySnapshot;
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
  }, [mode, error]);

  return { projects, saveProjects, mode, changeMode, loading, switching, error, notice };
}
