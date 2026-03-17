import { APP_CONFIG } from "../config.js";

// Optional OpenAI helper.
// If no key is provided, returns null and app should continue normally.
export async function suggestBusinessDescription({ businessName, category }) {
  if (!APP_CONFIG.openAiApiKey) return null;

  const prompt = `اكتب وصفًا تسويقيًا عربيًا احترافيًا وقصيرًا لنشاط منزلي باسم "${businessName}" ضمن فئة "${category}".\nالناتج سطر واحد فقط بدون رموز.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APP_CONFIG.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 120,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await response.json();
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";
  return text.trim() || null;
}
