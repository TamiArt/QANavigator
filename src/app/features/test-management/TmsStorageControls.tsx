import { useEffect, useState } from "react";
import type { TmsStorageMode } from "./tms-storage";

interface Props {
  mode: TmsStorageMode;
  loading: boolean;
  switching: boolean;
  error: string;
  notice: string;
  onChange: (mode: TmsStorageMode) => Promise<void>;
}

export function TmsStorageControls({
  mode,
  loading,
  switching,
  error,
  notice,
  onChange,
}: Props) {
  const disabled = loading || switching;
  const [persistence, setPersistence] = useState<"checking" | "persistent" | "best-effort" | "unsupported">("checking");
  const [storageUsage, setStorageUsage] = useState("");
  const [persistenceMessage, setPersistenceMessage] = useState("");

  useEffect(() => {
    let active = true;
    const inspect = async () => {
      if (typeof navigator === "undefined" || !navigator.storage) {
        if (active) setPersistence("unsupported");
        return;
      }
      try {
        const [persistent, estimate] = await Promise.all([
          navigator.storage.persisted(),
          navigator.storage.estimate(),
        ]);
        if (!active) return;
        setPersistence(persistent ? "persistent" : "best-effort");
        if (typeof estimate.usage === "number") {
          const used = (estimate.usage / (1024 * 1024)).toFixed(1);
          const quota = typeof estimate.quota === "number" ? (estimate.quota / (1024 * 1024)).toFixed(0) : "";
          setStorageUsage(quota ? used + " МБ из " + quota + " МБ" : used + " МБ");
        }
      } catch {
        if (active) setPersistence("unsupported");
      }
    };
    void inspect();
    return () => { active = false; };
  }, []);

  const requestPersistence = async () => {
    setPersistenceMessage("");
    if (typeof navigator === "undefined" || !navigator.storage?.persist) {
      setPersistence("unsupported");
      setPersistenceMessage("Браузер не поддерживает запрос постоянного хранилища.");
      return;
    }
    try {
      const granted = await navigator.storage.persist();
      setPersistence(granted ? "persistent" : "best-effort");
      setPersistenceMessage(granted
        ? "Браузер разрешил постоянное хранение данных сайта."
        : "Браузер не разрешил постоянное хранение. Регулярно сохраняйте архивы на компьютер.");
    } catch {
      setPersistenceMessage("Не удалось запросить постоянное хранение. Сохраняйте резервные копии на компьютер.");
    }
  };
  const indexedDbDisabled = disabled || Boolean(error);
  const localStorageDisabled = disabled || (Boolean(error) && mode !== "indexedDB");
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold">Хранилище тестовой документации</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            IndexedDB — основное хранилище для больших проектов. localStorage — режим совместимости.
            Переключение копирует данные и не удаляет исходную копию. Вложения продолжают храниться отдельно в IndexedDB.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-pressed={mode === "indexedDB"}
            disabled={indexedDbDisabled || mode === "indexedDB"}
            onClick={() => void onChange("indexedDB")}
            className={"rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50 " +
              (mode === "indexedDB" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}
          >
            IndexedDB
          </button>
          <button
            type="button"
            aria-pressed={mode === "localStorage"}
            disabled={localStorageDisabled || mode === "localStorage"}
            onClick={() => void onChange("localStorage")}
            className={"rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50 " +
              (mode === "localStorage" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}
          >
            localStorage
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>{persistence === "persistent" ? "Постоянное хранение разрешено браузером" : persistence === "best-effort" ? "Хранение может быть очищено браузером" : persistence === "unsupported" ? "Статус защиты хранилища недоступен" : "Проверка защиты хранилища…"}</p>
          {storageUsage && <p>Использовано: {storageUsage}</p>}
        </div>
        {persistence === "best-effort" && <button type="button" onClick={() => void requestPersistence()} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted">Запросить защиту данных</button>}
      </div>
      {persistenceMessage && <p role="status" className="text-xs text-muted-foreground">{persistenceMessage}</p>}
      <p className="text-[11px] text-muted-foreground">Даже постоянное хранилище не защищает от очистки данных сайта или поломки диска. Регулярно скачивайте архивы проекта на компьютер.</p>
      {loading && <p role="status" className="text-xs text-muted-foreground">Загрузка локальной базы…</p>}
      {switching && <p role="status" className="text-xs text-muted-foreground">Перенос данных. Не закрывайте вкладку…</p>}
      {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
