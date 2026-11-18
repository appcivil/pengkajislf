import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { readJsonBody, validateAIRequest, publicError } from "./security.ts";

Deno.test("accepts a registered provider/model and clamps output tokens", () => {
  const request = validateAIRequest({
    provider: "gemini",
    model: "gemini-2.0-flash",
    prompt: "Buat ringkasan teknis",
    maxTokens: 8192,
    temperature: 0.2,
  });
  assertEquals(request.maxTokens, 4096);
  assertEquals(request.temperature, 0.2);
});

Deno.test("accepts registered namespaced Groq and OpenRouter models", () => {
  assertEquals(validateAIRequest({ provider: "groq", model: "openai/gpt-oss-120b", prompt: "x" }).provider, "groq");
  assertEquals(validateAIRequest({ provider: "openrouter", model: "google/gemini-2.0-flash-lite:free", prompt: "x" }).provider, "openrouter");
});

Deno.test("rejects unregistered provider and model", () => {
  for (const input of [
    { provider: "ollama", model: "gemma3:27b", prompt: "x" },
    { provider: "openai", model: "gpt-4o-mini", prompt: "x" },
    { provider: "openrouter", model: "https://attacker.invalid/x", prompt: "x" },
  ]) {
    try {
      validateAIRequest(input);
      throw new Error("Expected validation to fail");
    } catch (error) {
      if (!(error instanceof Error) || error.message === "Expected validation to fail") throw error;
    }
  }
});

Deno.test("rejects invalid image MIME and malformed base64", () => {
  try {
    validateAIRequest({
      provider: "gemini",
      model: "gemini-2.0-flash",
      prompt: "describe",
      base64Data: "not base64!",
      mimeType: "text/html",
    });
    throw new Error("Expected image validation to fail");
  } catch (error) {
    if (!(error instanceof Error) || error.message === "Expected image validation to fail") throw error;
  }
});

Deno.test("bounded JSON reader rejects a body above the byte limit", async () => {
  const req = new Request("https://example.invalid", {
    method: "POST",
    body: "x".repeat(5 * 1024 * 1024 + 1),
  });
  await assertRejects(() => readJsonBody(req), Error, "PAYLOAD_TOO_LARGE");
});

Deno.test("public errors never expose unknown provider diagnostics", () => {
  assertEquals(publicError(new Error("provider response contains private details")), {
    status: 502,
    message: "Layanan AI sementara gagal. Silakan coba kembali.",
  });
});
