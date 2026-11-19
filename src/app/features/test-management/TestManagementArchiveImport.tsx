import { useState } from "react";
import { Upload } from "lucide-react";
import { STORAGE_KEYS } from "../../core/constants";
import { isTestManagementStorageValue } from "../../core/storage-validators";
import { parseStoredValue, serializeStoredValue } from "../../core/storage";
import { parseTmsProjectBackup } from "./project-backup";
import type { TmsData } from "../../domain/test-management";

export function TestManagementArchiveImport({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState("");

  const importArchive = () => {
    setMessage("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const imported = parseTmsProjectBackup(await file.text(), projectId);
        if (!window.confirm(
          "Импорт заменит тест-кейсы, наборы, планы, прогоны и дефекты текущего проекта. Продолжить?",
        )) return;

        const raw = localStorage.getItem(STORAGE_KEYS.testManagement);
        const currentValue = raw ? JSON.parse(raw) as unknown : [];
        if (raw && !isTestManagementStorageValue(currentValue)) {
          throw new Error("Текущие данные Test Management повреждены. Сначала экспортируйте резервную копию.");
        }
        const current = parseStoredValue<TmsData[]>(raw, [], isTestManagementStorageValue);
        const next = [
          ...current.filter((item) => item.projectId !== projectId),
          { ...imported, projectId, version: 1 as const },
        ];
        localStorage.setItem(STORAGE_KEYS.testManagement, serializeStoredValue(next));
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Не удалось импортировать архив");
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={importArchive}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
      >
        <Upload className="h-4 w-4" /> Импорт проекта
      </button>
      {message && <p role="alert" className="w-full text-right text-xs text-destructive">{message}</p>}
    </div>
  );
}
