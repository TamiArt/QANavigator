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
            disabled={disabled || mode === "indexedDB"}
            onClick={() => void onChange("indexedDB")}
            className={"rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50 " +
              (mode === "indexedDB" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}
          >
            IndexedDB
          </button>
          <button
            type="button"
            aria-pressed={mode === "localStorage"}
            disabled={disabled || mode === "localStorage"}
            onClick={() => void onChange("localStorage")}
            className={"rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50 " +
              (mode === "localStorage" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}
          >
            localStorage
          </button>
        </div>
      </div>
      {loading && <p role="status" className="text-xs text-muted-foreground">Загрузка локальной базы…</p>}
      {switching && <p role="status" className="text-xs text-muted-foreground">Перенос данных. Не закрывайте вкладку…</p>}
      {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
