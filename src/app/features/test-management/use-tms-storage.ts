import { useCallback, useEffect, useState } from "react";
import type { TmsData } from "../../domain/test-management";
import {
  getInitialTmsStorageMode,
  loadTmsProjects,
  persistTmsProjects,
  switchTmsStorageMode,
  type TmsStorageMode,
} from "./tms-storage";

export function useTmsStorage() {
  const [projects, setProjects] = useState<TmsData[]>([]);
  const [mode, setMode] = useState<TmsStorageMode>(getInitialTmsStorageMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    loadTmsProjects(mode).then((value) => {
      if (!active) return;
      setProjects(value);
      setLoading(false);
      if (mode === "indexedDB" && value.length) {
        setNotice("Данные доступны в IndexedDB. Исходная копия localStorage сохранена для возврата.");
      }
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить данные Test Management");
      setLoading(false);
    });
    return () => { active = false; };
  }, [mode]);

  const saveProjects = useCallback((next: TmsData[]) => {
    setProjects(next);
    setError("");
    void persistTmsProjects(mode, next).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить данные Test Management");
    });
  }, [mode]);

  const changeMode = useCallback(async (target: TmsStorageMode) => {
    if (target === mode) return;
    setError("");
    setNotice("");
    try {
      await switchTmsStorageMode(target, projects);
      setMode(target);
      setNotice(target === "indexedDB"
        ? "Данные перенесены в IndexedDB. Копия предыдущего хранилища сохранена."
        : "Возврат к localStorage выполнен. Копия IndexedDB не удалена.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось переключить хранилище");
    }
  }, [mode, projects]);

  return { projects, saveProjects, mode, changeMode, loading, error, notice };
}
