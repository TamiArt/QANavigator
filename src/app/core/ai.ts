import type { ApiKeys } from "../domain/types";

export const uid = () => crypto.randomUUID();

// ══════════════════════════════════════════════════════
// AI HOOK
// ══════════════════════════════════════════════════════
export function enrichNetworkError(e: unknown, provider: string, url: string): Error {
  if (e instanceof TypeError && e.message.toLowerCase().includes("fetch")) {
    return new Error(
      `Сеть недоступна (${provider})\n` +
      `Возможные причины:\n` +
      `• Нет интернета или VPN блокирует запросы\n` +
      `• CORS: запрос заблокирован браузером (проверь Console → Network)\n` +
      `• Неверный URL эндпоинта: ${url}\n` +
      `Оригинальная ошибка: ${e.message}`
    );
  }
  return e instanceof Error ? e : new Error(String(e));
}

export async function callAI(
  apiKeys: ApiKeys,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const activeKey = apiKeys[apiKeys.provider];
  if (!activeKey) {
    const providerName = apiKeys.provider === "gemini" ? "Gemini" : "OpenRouter";
    throw new Error(`API ключ ${providerName} не настроен. Перейдите в Настройки.`);
  }

  if (apiKeys.provider === "gemini" && apiKeys.gemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeys.gemini}`;
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
    };
    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (e) {
      throw enrichNetworkError(e, "Gemini", url);
    }
    if (!res.ok) {
      let detail = "";
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message ?? JSON.stringify(errBody);
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new Error(
        `Gemini ${res.status} (${res.statusText})` +
        (detail ? `\n${detail}` : "")
      );
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason ?? "unknown";
      throw new Error(`Gemini вернул пустой ответ · finishReason: ${reason}\n` + JSON.stringify(data).slice(0, 300));
    }
    return text;
  }

  const model = "mistralai/mistral-7b-instruct:free";
  const orUrl = "https://openrouter.ai/api/v1/chat/completions";
  let res: Response;
  try {
    res = await fetch(orUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeys.openrouter}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "QA Navigator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });
  } catch (e) {
    throw enrichNetworkError(e, "OpenRouter", orUrl);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message ?? errBody?.message ?? JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      `OpenRouter ${res.status} (${res.statusText}) · модель: ${model}` +
      (detail ? `\n${detail}` : "")
    );
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(
      `OpenRouter вернул пустой ответ · модель: ${model}\n` +
      `finish_reason: ${data.choices?.[0]?.finish_reason ?? "unknown"}\n` +
      JSON.stringify(data).slice(0, 300)
    );
  }
  return content;
}

export const QA_SYSTEM_PROMPT = `Ты — Senior QA Engineer, эксперт по методологиям тестирования 2026 года.`;
