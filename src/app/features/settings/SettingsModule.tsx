import * as React from "react";
import { useState } from "react";
import { Database, Download, Key, Info, Trash2, Upload } from "lucide-react";
import { useApp } from "../../core/app-context";
import { EXPORTABLE_STORAGE_KEYS, STORAGE_KEYS } from "../../core/constants";
import {
  isActiveProjectStorageValue,
  isBookmarksStorageValue,
  isBugReportsStorageValue,
  isProjectsStorageValue,
  isChecklistsStorageValue,
  isTestCasesStorageValue,
  isTextStorageValue,
  isApiWorkbenchStorageValue,
  isTestManagementStorageValue,
  isTmsAttachmentsBackupValue,
} from "../../core/storage-validators";
import { downloadTextFile } from "../../lib/download";
import { createDataBackup, parseDataBackup } from "./data-backup";
import { getInitialTmsStorageMode, loadTmsProjects, persistTmsProjects, TMS_STORAGE_MODE_KEY } from "../test-management/tms-storage";
import { clearTmsDatabase, listAllTmsAttachments, replaceAllTmsAttachments, TMS_ATTACHMENTS_BACKUP_KEY, type TmsAttachmentRecord } from "../test-management/tms-attachments";
import type { TmsData } from "../../domain/test-management";

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}
function base64ToBlob(data: string, mimeType: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

// ══════════════════════════════════════════════════════
// MODULE 8: SETTINGS
// ══════════════════════════════════════════════════════
export function SettingsModule() {
  const { apiKeys, setApiKeys } = useApp();
  const [dataMessage, setDataMessage] = useState("");

  const exportData = async () => {
    setDataMessage("");
    try {
      const data: Record<string, unknown> = {};
      EXPORTABLE_STORAGE_KEYS.forEach((key) => {
        if (key !== STORAGE_KEYS.testManagement) data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
      });
      const mode = getInitialTmsStorageMode();
      data[STORAGE_KEYS.testManagement] = await loadTmsProjects(mode);
      const attachments = await listAllTmsAttachments();
      const totalBytes = attachments.reduce((sum, item) => sum + item.size, 0);
      if (totalBytes > 100 * 1024 * 1024) throw new Error("Размер вложений превышает лимит полной резервной копии 100 МБ");
      data[TMS_ATTACHMENTS_BACKUP_KEY] = await Promise.all(attachments.map(async (item) => ({
        id: item.id, projectId: item.projectId, ownerType: item.ownerType, ownerId: item.ownerId,
        name: item.name, mimeType: item.mimeType, size: item.size, createdAt: item.createdAt,
        data: await blobToBase64(item.blob),
      })));
      const backup = createDataBackup(data, new Date().toISOString());
      downloadTextFile(
        JSON.stringify(backup, null, 2),
        `qa-navigator-backup-${new Date().toISOString().slice(0, 10)}.json`,
        "application/json",
      );
    } catch (error) {
      setDataMessage(error instanceof Error ? `Экспорт остановлен: ${error.message}` : "Не удалось прочитать локальные данные");
    }
  };

  const importData = () => {
    setDataMessage("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const backup = parseDataBackup(String(ev.target?.result ?? ""), [...EXPORTABLE_STORAGE_KEYS, TMS_ATTACHMENTS_BACKUP_KEY], {
            qa_navigator_projects: isProjectsStorageValue,
            qa_navigator_active_project: isActiveProjectStorageValue,
            qa_navigator_checklists: isChecklistsStorageValue,
            qa_navigator_testcases: isTestCasesStorageValue,
            qa_navigator_bugreports: isBugReportsStorageValue,
            qa_navigator_bookmarks: isBookmarksStorageValue,
            qa_navigator_req_text: isTextStorageValue,
            qa_navigator_req_result: isTextStorageValue,
            qa_navigator_api_workbench_v1: isApiWorkbenchStorageValue,
            qa_navigator_test_management_v1: isTestManagementStorageValue,
            [TMS_ATTACHMENTS_BACKUP_KEY]: isTmsAttachmentsBackupValue,
          });
          const mode = getInitialTmsStorageMode();
          const tmsProjects = backup.data[STORAGE_KEYS.testManagement] as TmsData[] | undefined;
          const attachmentPayload = backup.data[TMS_ATTACHMENTS_BACKUP_KEY] as Array<Omit<TmsAttachmentRecord, "blob"> & { data: string }> | undefined;
          if (attachmentPayload) {
            const previousAttachments = await listAllTmsAttachments();
            const nextAttachments: TmsAttachmentRecord[] = attachmentPayload.map((item) => ({
              id: item.id, projectId: item.projectId, ownerType: item.ownerType, ownerId: item.ownerId,
              name: item.name, mimeType: item.mimeType, size: item.size, createdAt: item.createdAt,
              blob: base64ToBlob(item.data, item.mimeType),
            }));
            if (nextAttachments.some((item) => item.blob.size !== item.size)) throw new Error("Размер вложения не совпадает с резервной копией");
            await replaceAllTmsAttachments(nextAttachments);
            try {
              if (tmsProjects) await persistTmsProjects(mode, tmsProjects);
            } catch (error) {
              await replaceAllTmsAttachments(previousAttachments);
              throw error;
            }
          } else if (tmsProjects) {
            await persistTmsProjects(mode, tmsProjects);
          }
          Object.entries(backup.data).forEach(([key, value]) => {
            if (key === TMS_ATTACHMENTS_BACKUP_KEY || key === STORAGE_KEYS.testManagement) return;
            localStorage.setItem(key, JSON.stringify(value));
          });
          window.location.reload();
        } catch (error) {
          setDataMessage(error instanceof Error ? error.message : "Не удалось импортировать файл");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAll = async () => {
    if (confirm("Удалить все данные? Это действие необратимо.")) {
      try {
        await clearTmsDatabase();
        EXPORTABLE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        localStorage.removeItem(TMS_STORAGE_MODE_KEY);
        window.location.reload();
      } catch (error) {
        setDataMessage(error instanceof Error ? `Очистка остановлена: ${error.message}` : "Не удалось очистить локальную базу");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">⚙️ Настройки</h2>
        <p className="text-sm text-muted-foreground">Управление API ключами, данными и параметрами приложения.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> API Ключи</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">OpenRouter</p>
            <p className="text-sm font-mono text-foreground">{apiKeys.openrouter ? `${apiKeys.openrouter.slice(0, 8)}...` : "Не настроен"}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Google Gemini</p>
            <p className="text-sm font-mono text-foreground">{apiKeys.gemini ? `${apiKeys.gemini.slice(0, 8)}...` : "Не настроен"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Активный провайдер: <span className="text-foreground font-medium">{apiKeys.provider === "openrouter" ? "OpenRouter" : "Google Gemini"}</span></p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Данные</h3>
        <p className="text-sm text-muted-foreground">Рабочие данные хранятся локально в профиле браузера на этом устройстве. Сохраняйте резервную копию на компьютер и используйте импорт для переноса данных на другое устройство. Текст, отправленный в AI-функции, передаётся выбранному провайдеру.</p>
        {dataMessage && <p role="alert" className="text-sm text-destructive">{dataMessage}</p>}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => void exportData()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Экспорт в JSON
          </button>
          <button onClick={importData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Импорт из JSON
          </button>
          <button onClick={() => void clearAll()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Очистить все данные
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> О приложении</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-medium">QA Navigator</span> — бесплатный инструмент для тестировщиков</p>
          <p>Стандарты: ISTQB CTFL v4.0 · ISO 25010 · ISO/IEC/IEEE 29119 · OWASP Top 10</p>
          <p>Хранение: локально в браузере; резервные копии пользователь хранит на своём компьютере. AI-запросы передаются выбранному внешнему провайдеру.</p>
          <p>AI: OpenRouter (бесплатные модели) · Google Gemini Flash</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
