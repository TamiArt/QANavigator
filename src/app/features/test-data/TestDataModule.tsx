import * as React from "react";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { CopyButton } from "../../components/shared";
import { TEST_DATA } from "../../core/constants";
import { HANDBOOK } from "../../handbook-data";

// ══════════════════════════════════════════════════════
// MODULE 6: TEST DATA GENERATOR
// ══════════════════════════════════════════════════════
export function TestDataModule() {
  const [category, setCategory] = useState<keyof typeof TEST_DATA>("boundary");
  const [copied, setCopied] = useState<string | null>(null);

  const copyItem = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const cats: { id: keyof typeof TEST_DATA; label: string; icon: string; desc: string }[] = [
    { id: "boundary", label: "Граничные строки", icon: "📏", desc: "Пустые, длинные, нулевые значения" },
    { id: "special", label: "Спецсимволы и SQL", icon: "⚡", desc: "Инъекции, управляющие символы" },
    { id: "xss", label: "XSS Пейлоады", icon: "🔓", desc: "Cross-Site Scripting атаки" },
    { id: "emails", label: "Невалидные Email", icon: "📧", desc: "Неверные форматы email-адресов" },
    { id: "dates", label: "Невалидные даты", icon: "📅", desc: "Неверные форматы и значения дат" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">🛠️ Генератор тестовых данных</h2>
        <p className="text-sm text-muted-foreground">Готовые наборы тестовых данных для мгновенного копирования. Клиентская генерация — без AI.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${
              category === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-xl">{c.icon}</span>
            <span className="font-medium text-center leading-tight">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <p className="text-sm font-medium text-foreground">{cats.find((c) => c.id === category)?.label}</p>
          <CopyButton text={TEST_DATA[category].join("\n")} label="Копировать всё" />
        </div>
        <div className="divide-y divide-border">
          {TEST_DATA[category].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/30 transition-colors">
              <code className="flex-1 text-xs font-mono text-foreground break-all">
                {item === "" ? <span className="text-muted-foreground italic">(пустая строка)</span> : item}
              </code>
              <button
                onClick={() => copyItem(item)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
              >
                {copied === item ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// MODULE 7: QA HANDBOOK
