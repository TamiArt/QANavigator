import { useState } from "react";
import { Upload } from "lucide-react";
import { useTmsStorage } from "./use-tms-storage";
import { parseTmsProjectArchive } from "./project-backup";
import { persistTmsProjects } from "./tms-storage";
import { replaceProjectTmsAttachments, type TmsAttachmentRecord } from "./tms-attachments";

function decodeAttachment(data: string, mimeType: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export function TestManagementArchiveImport({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState("");
  const { projects, mode, loading, error: storageError } = useTmsStorage();

  const importArchive = () => {
    setMessage("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        if (loading) throw new Error("Дождитесь загрузки локальной базы Test Management");
        if (storageError) throw new Error("Импорт остановлен: локальное хранилище находится в состоянии ошибки. Сначала восстановите доступ к данным.");
        const archive = parseTmsProjectArchive(await file.text(), projectId);
        if (!window.confirm(
          `Импорт заменит тест-кейсы, наборы, планы, прогоны, дефекты и вложения текущего проекта. В архиве вложений: ${archive.attachments.length}. Продолжить?`,
        )) return;

        const next = [
          ...projects.filter((item) => item.projectId !== projectId),
          { ...archive.testManagement, projectId, version: 1 as const },
        ];
        const attachmentRecords: TmsAttachmentRecord[] = archive.attachments.map((item) => ({
          id: item.id, projectId, ownerType: item.ownerType, ownerId: item.ownerId,
          name: item.name, mimeType: item.mimeType, size: item.size, createdAt: item.createdAt,
          blob: decodeAttachment(item.data, item.mimeType),
        }));
        if (attachmentRecords.some((item) => item.blob.size !== item.size)) {
          throw new Error("Размер одного из вложений не совпадает с данными архива");
        }

        if (typeof indexedDB === "undefined" && attachmentRecords.length) throw new Error("Этот браузер не поддерживает локальное хранение файлов");
        await persistTmsProjects(mode, next);
        try {
          if (typeof indexedDB !== "undefined") await replaceProjectTmsAttachments(projectId, attachmentRecords);
        } catch (error) {
          await persistTmsProjects(mode, projects);
          throw error;
        }
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
        disabled={loading || Boolean(storageError)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
      >
        <Upload className="h-4 w-4" /> Импорт проекта
      </button>
      {storageError && <p role="alert" className="w-full text-right text-xs text-destructive">{storageError}</p>}
      {message && <p role="alert" className="w-full text-right text-xs text-destructive">{message}</p>}
    </div>
  );
}
