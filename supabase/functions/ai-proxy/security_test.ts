/// <reference lib="deno.ns" />
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { readJsonBody, validateAIRequest, publicError, canExecuteProjectAI, canExecuteUnscopedAI } from "./security.ts";
import { extractProviderUsageTokens } from "../_shared/ai-quota.ts";

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

Deno.test("accepts bounded multi-image Gemini requests", () => {
  const request = validateAIRequest({
    provider: "gemini",
    model: "gemini-2.0-flash",
    prompt: "Bandingkan dua bukti",
    images: [
      { base64Data: "AQID", mimeType: "image/jpeg" },
      { base64Data: "BAUG", mimeType: "image/png" },
    ],
    projectId: "22222222-2222-4222-8222-222222222222",
  });
  assertEquals(request.images?.length, 2);
  assertEquals(request.projectId, "22222222-2222-4222-8222-222222222222");
});

Deno.test("rejects too many, mixed, or non-Gemini multi-image payloads", () => {
  const image = { base64Data: "AQID", mimeType: "image/jpeg" };
  for (const input of [
    { provider: "gemini", model: "gemini-2.0-flash", prompt: "x", images: Array(11).fill(image) },
    { provider: "gemini", model: "gemini-2.0-flash", prompt: "x", images: [image], base64Data: "AQID", mimeType: "image/jpeg" },
    { provider: "groq", model: "llama-3.3-70b-versatile", prompt: "x", images: [image] },
    { provider: "gemini", model: "gemini-2.0-flash", prompt: "x", images: [{ base64Data: "bad!", mimeType: "image/jpeg" }] },
  ]) {
    try {
      validateAIRequest(input);
      throw new Error("Expected multi-image validation to fail");
    } catch (error) {
      if (!(error instanceof Error) || error.message === "Expected multi-image validation to fail") throw error;
      assertEquals(error.message, "INVALID_IMAGE");
    }
  }
});

Deno.test("requires project context for multi-image analysis", () => {
  try {
    validateAIRequest({
      provider: "gemini",
      model: "gemini-2.0-flash",
      prompt: "Analisis bukti",
      images: [{ base64Data: "AQID", mimeType: "image/jpeg" }],
    });
    throw new Error("Expected project context to be required");
  } catch (error) {
    if (!(error instanceof Error) || error.message === "Expected project context to be required") throw error;
    assertEquals(error.message, "PROJECT_REQUIRED_FOR_IMAGE_ANALYSIS");
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

Deno.test("rejects audio-only Groq models on the text chat proxy", () => {
  for (const model of ["whisper-large-v3-turbo", "whisper-large-v3"]) {
    try {
      validateAIRequest({ provider: "groq", model, prompt: "transcribe this audio" });
      throw new Error("Expected audio-only model to be rejected");
    } catch (error) {
      if (!(error instanceof Error) || error.message === "Expected audio-only model to be rejected") throw error;
      assertEquals(error.message, "INVALID_MODEL");
    }
  }
});

Deno.test("preserves a syntactically valid project context", () => {
  const request = validateAIRequest({
    provider: "gemini",
    model: "gemini-2.0-flash",
    prompt: "Ringkas proyek",
    projectId: "22222222-2222-4222-8222-222222222222",
  });
  assertEquals(request.projectId, "22222222-2222-4222-8222-222222222222");
});

Deno.test("rejects malformed project context identifiers", () => {
  try {
    validateAIRequest({
      provider: "gemini",
      model: "gemini-2.0-flash",
      prompt: "Ringkas proyek",
      projectId: "not-a-uuid",
    });
    throw new Error("Expected project ID validation to fail");
  } catch (error) {
    if (!(error instanceof Error) || error.message === "Expected project ID validation to fail") throw error;
    assertEquals(error.message, "INVALID_PROJECT_ID");
  }
});


Deno.test("project AI role matrix allows owner, admin, and member", () => {
  for (const role of ["owner", "admin", "member"]) {
    assertEquals(canExecuteProjectAI(role), true, `${role} should be allowed to execute project AI`);
  }
});

Deno.test("project AI role matrix denies viewer, platform admin without membership, and unknown roles", () => {
  for (const role of ["viewer", "platform_admin", "service_role", "anon", null, undefined]) {
    assertEquals(canExecuteProjectAI(role), false, `${String(role)} must not receive implicit project AI access`);
  }
});


Deno.test("viewer-only memberships cannot execute unscoped AI", () => {
  const memberships = [{ role: "viewer" }, { role: "viewer" }];
  assertEquals(memberships.some((membership) => canExecuteProjectAI(membership.role)), false);
});

Deno.test("unscoped AI remains available to an account with an executable role in any tenant", () => {
  const memberships = [{ role: "viewer" }, { role: "member" }];
  assertEquals(memberships.some((membership) => canExecuteProjectAI(membership.role)), true);
});


Deno.test("only users without tenant memberships may execute unscoped AI", () => {
  assertEquals(canExecuteUnscopedAI([]), true);
  assertEquals(canExecuteUnscopedAI([{ role: "owner" }]), false);
  assertEquals(canExecuteUnscopedAI([{ role: "member" }]), false);
  assertEquals(canExecuteUnscopedAI([{ role: "viewer" }]), false);
  assertEquals(canExecuteUnscopedAI(null), false);
});


Deno.test("single-image Gemini requests require a project context", () => {
  const base = {
    provider: "gemini",
    model: "gemini-2.0-flash",
    prompt: "Analyze this building photo",
    base64Data: "AAAA",
    mimeType: "image/jpeg",
  };
  let error = "";
  try {
    validateAIRequest(base);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  assertEquals(error, "PROJECT_REQUIRED_FOR_IMAGE_ANALYSIS");

  const validated = validateAIRequest({ ...base, projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
  assertEquals(validated.projectId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
});


Deno.test("normalizes provider-reported token usage", () => {
  assertEquals(extractProviderUsageTokens({ usageMetadata: { totalTokenCount: 123 } }), 123);
  assertEquals(extractProviderUsageTokens({ usage: { total_tokens: 456 } }), 456);
  assertEquals(extractProviderUsageTokens({ usage: { prompt_tokens: 20, completion_tokens: 30 } }), 50);
  assertEquals(extractProviderUsageTokens({ usage: { input_tokens: 12, output_tokens: 8 } }), 20);
  assertEquals(extractProviderUsageTokens({ choices: [] }), null);
  assertEquals(extractProviderUsageTokens(null), null);
});
