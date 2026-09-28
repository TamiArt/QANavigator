import * as React from "react";
import { useState } from "react";
import { Database, Download, Key, Info, Trash2, Upload } from "lucide-react";
import { useApp } from "../../core/app-context";
import { EXPORTABLE_STORAGE_KEYS } from "../../core/constants";
import { downloadTextFile } from "../../lib/download";

// ══════════════════════════════════════════════════════
// MODULE 8: SETTINGS
// ══════════════════════════════════════════════════════
export function SettingsModule() {
  const { apiKeys, setApiKeys } = useApp();
  const [dataMessage, setDataMessage] = useState("");

  const exportData = () => {
    setDataMessage("");
    const data = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {} as Record<string, any>,
    };
    try {
      EXPORTABLE_STORAGE_KEYS.forEach((key) => {
        data.data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
      });
    } catch (error) {
      setDataMessage(error instanceof Error ? `Экспорт остановлен: ${error.message}` : "Не удалось прочитать локальные данные");
      return;
    }
    downloadTextFile(
      JSON.stringify(data, null, 2),
      `qa-navigator-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
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
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!parsed || typeof parsed.data !== "object" || parsed.data === null) {
            throw new Error("Некорректная структура резервной копии");
          }
          EXPORTABLE_STORAGE_KEYS.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
              localStorage.setItem(key, JSON.stringify(parsed.data[key]));
            }
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

  const clearAll = () => {
    if (confirm("Удалить все данные? Это действие необратимо.")) {
      EXPORTABLE_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
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
        <p className="text-sm text-muted-foreground">Рабочие данные хранятся локально в браузере (localStorage). Текст, отправленный в AI-функции, передаётся выбранному провайдеру. Экспортируйте резервную копию для переноса на другое устройство.</p>
        {dataMessage && <p role="alert" className="text-sm text-destructive">{dataMessage}</p>}
        <div className="flex gap-3 flex-wrap">
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Экспорт в JSON
          </button>
          <button onClick={importData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Импорт из JSON
          </button>
          <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Очистить все данные
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> О приложении</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-medium">QA Navigator</span> — бесплатный инструмент для тестировщиков</p>
          <p>Стандарты: ISTQB CTFL v4.0 · ISO 25010 · ISO/IEC/IEEE 29119 · OWASP Top 10</p>
          <p>Хранение: клиентское (localStorage); AI-запросы передаются выбранному внешнему провайдеру.</p>
          <p>AI: OpenRouter (бесплатные модели) · Google Gemini Flash</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
