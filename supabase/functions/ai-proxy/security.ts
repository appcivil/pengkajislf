export const MAX_BODY_BYTES = 5 * 1024 * 1024;
export const MAX_PROMPT_CHARS = 48_000;
export const MAX_SYSTEM_PROMPT_CHARS = 16_000;
export const MAX_IMAGE_BASE64_CHARS = 4_000_000;
export const MAX_OUTPUT_TOKENS = 4096;

export type ValidatedAIRequest = {
  provider: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  base64Data?: string;
  mimeType?: string;
  maxTokens: number;
  temperature: number;
};

export async function readJsonBody(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");

  if (!req.body) throw new Error("INVALID_JSON");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function validateAIRequest(value: unknown): ValidatedAIRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_REQUEST");
  }
  const body = value as Record<string, unknown>;
  const providers = new Set(["gemini", "openai", "claude", "groq", "openrouter", "mistral", "huggingface", "kimi"]);
  if (typeof body.provider !== "string" || !providers.has(body.provider)) {
    throw new Error("UNSUPPORTED_PROVIDER");
  }
  if (typeof body.model !== "string" || body.model.length < 1 || body.model.length > 120) {
    throw new Error("INVALID_MODEL");
  }
  // Model IDs are data, never URL fragments or arbitrary provider endpoints.
  const modelPatterns: Record<string, RegExp> = {
    gemini: /^[a-zA-Z0-9._-]{1,100}$/,
    openai: /^[a-zA-Z0-9._-]{1,100}$/,
    claude: /^[a-zA-Z0-9._-]{1,100}$/,
    groq: /^[a-zA-Z0-9._-]{1,100}$/,
    openrouter: /^[a-zA-Z0-9._-]{1,60}\/[a-zA-Z0-9._-]{1,60}$/,
    mistral: /^[a-zA-Z0-9._-]{1,100}$/,
    huggingface: /^[a-zA-Z0-9._-]{1,60}(\/[a-zA-Z0-9._-]{1,60})?$/,
    kimi: /^[a-zA-Z0-9._-]{1,100}$/,
  };
  if (!modelPatterns[body.provider].test(body.model)) throw new Error("INVALID_MODEL");

  if (typeof body.prompt !== "string" || body.prompt.trim().length === 0 ||
      body.prompt.length > MAX_PROMPT_CHARS) throw new Error("INVALID_PROMPT");
  if (body.systemPrompt !== undefined &&
      (typeof body.systemPrompt !== "string" || body.systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS)) {
    throw new Error("INVALID_SYSTEM_PROMPT");
  }

  const maxTokens = body.maxTokens === undefined ? 2048 : body.maxTokens;
  if (!Number.isInteger(maxTokens) || (maxTokens as number) < 1 ||
      (maxTokens as number) > MAX_OUTPUT_TOKENS) throw new Error("INVALID_MAX_TOKENS");
  const temperature = body.temperature === undefined ? 0.1 : body.temperature;
  if (typeof temperature !== "number" || !Number.isFinite(temperature) ||
      temperature < 0 || temperature > 1.5) throw new Error("INVALID_TEMPERATURE");

  const hasImage = body.base64Data !== undefined;
  if (hasImage) {
    if (body.provider !== "gemini" || typeof body.base64Data !== "string" ||
        body.base64Data.length < 4 || body.base64Data.length > MAX_IMAGE_BASE64_CHARS ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.base64Data)) {
      throw new Error("INVALID_IMAGE");
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(String(body.mimeType))) {
      throw new Error("INVALID_IMAGE");
    }
  } else if (body.mimeType !== undefined) {
    throw new Error("INVALID_IMAGE");
  }

  return {
    provider: body.provider,
    model: body.model,
    prompt: body.prompt,
    ...(typeof body.systemPrompt === "string" ? { systemPrompt: body.systemPrompt } : {}),
    ...(hasImage ? { base64Data: body.base64Data as string, mimeType: body.mimeType as string } : {}),
    maxTokens: maxTokens as number,
    temperature,
  };
}

export function publicError(error: unknown): { status: number; message: string } {
  const code = error instanceof Error ? error.message : "";
  const known: Record<string, { status: number; message: string }> = {
    PAYLOAD_TOO_LARGE: { status: 413, message: "Ukuran permintaan melewati batas." },
    INVALID_JSON: { status: 400, message: "Format JSON tidak valid." },
    INVALID_REQUEST: { status: 400, message: "Format permintaan tidak valid." },
    UNSUPPORTED_PROVIDER: { status: 400, message: "Provider tidak didukung." },
    INVALID_MODEL: { status: 400, message: "Model tidak valid." },
    INVALID_PROMPT: { status: 400, message: "Prompt kosong atau terlalu panjang." },
    INVALID_SYSTEM_PROMPT: { status: 400, message: "System prompt tidak valid atau terlalu panjang." },
    INVALID_MAX_TOKENS: { status: 400, message: "Batas token keluaran tidak valid (maksimum 4096)." },
    INVALID_TEMPERATURE: { status: 400, message: "Temperature harus berada pada rentang 0 sampai 1,5." },
    INVALID_IMAGE: { status: 400, message: "Data gambar tidak valid atau melewati batas." },
  };
  return known[code] || { status: 502, message: "Layanan AI sementara gagal. Silakan coba kembali." };
}
