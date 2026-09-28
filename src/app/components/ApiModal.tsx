import * as React from "react";
import { useState } from "react";
import { Key, X, Eye, EyeOff } from "lucide-react";
import { useApp } from "../core/app-context";

export function ApiModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { apiKeys, setApiKeys } = useApp();
  const [keys, setKeys] = useState(apiKeys);
  const [showKeys, setShowKeys] = useState({ or: false, gem: false });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Настройка API ключей</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-foreground">
            <p className="font-medium mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-primary" /> Как получить ключи бесплатно за 2 минуты:</p>
            <ol className="space-y-1 text-muted-foreground ml-4 list-decimal">
              <li><strong>OpenRouter:</strong> openrouter.ai → Sign Up → Keys → Create Key</li>
              <li><strong>Gemini:</strong> aistudio.google.com → Get API key → Create API key</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">AI Провайдер</label>
            <div className="flex gap-2">
              {(["openrouter", "gemini"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setKeys({ ...keys, provider: p })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    keys.provider === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "openrouter" ? "OpenRouter (free)" : "Google Gemini"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">OpenRouter API Key</label>
            <div className="relative">
              <input
                type={showKeys.or ? "text" : "password"}
                placeholder="sk-or-v1-..."
                value={keys.openrouter}
                onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                onClick={() => setShowKeys((s) => ({ ...s, or: !s.or }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.or ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={showKeys.gem ? "text" : "password"}
                placeholder="AIza..."
                value={keys.gemini}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                onClick={() => setShowKeys((s) => ({ ...s, gem: !s.gem }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.gem ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setApiKeys(keys); onClose(); }}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Сохранить ключи
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
