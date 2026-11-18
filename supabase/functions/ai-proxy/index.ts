// ============================================================
//  SUPABASE EDGE FUNCTION: AI PROXY
//  Menerima request dari frontend, meneruskan ke AI provider
//  menggunakan API key yang aman di environment Supabase.
//  Deploy: supabase functions deploy ai-proxy
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { readJsonBody, validateAIRequest, publicError, canExecuteProjectAI, canExecuteUnscopedAI, type ValidatedAIRequest } from "./security.ts";
import { reserveAIUsage, finalizeAIUsage, releaseAIUsage, estimateTextTokens, extractProviderUsageTokens, type AIQuotaReservation } from "../_shared/ai-quota.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AIRequest {
  provider: "gemini" | "openai" | "claude" | "groq" | "openrouter" | "mistral" | "huggingface" | "ollama" | "kimi";
  model: string;
  prompt: string;
  systemPrompt?: string;
  base64Data?: string;
  mimeType?: string;
  maxTokens?: number;
  temperature?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let quotaReservation: AIQuotaReservation | null = null;
  let actualTokens: number | null = null;\n  let providerRequestStarted = false;
  try {
    // ── OTORISASI ───────────────────────────────────────────────
    // Fungsi ini memegang kunci API berbayar, jadi pemanggilnya WAJIB
    // diverifikasi sebagai pengguna yang benar-benar login.
    //
    // SEBELUMNYA hanya diperiksa "apakah header Authorization ada". Itu
    // tidak cukup: anon key Supabase ikut ter-bundle ke berkas JS publik,
    // dan anon key adalah JWT yang sah — jadi siapa pun yang membuka situs
    // bisa menyalinnya lalu memanggil fungsi ini dan menghabiskan kuota AI
    // pemilik proyek. Pemindahan kunci ke sisi server menjadi tidak berarti
    // tanpa pemeriksaan di bawah ini.
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";

    const unauthorized = (reason: string) =>
      new Response(JSON.stringify({ error: `Unauthorized: ${reason}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (!token) return unauthorized("header Authorization tidak ada");

    // (a) Tolak lebih awal token ber-role anon / service_role. Payload JWT
    //     boleh dibaca tanpa verifikasi di sini — ini penyaring cepat,
    //     bukan pengganti pemeriksaan tanda tangan di langkah (b).
    let tokenRole: string | null = null;
    try {
      const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      tokenRole = JSON.parse(atob(b64))?.role ?? null;
    } catch {
      return unauthorized("token tidak dapat dibaca");
    }
    if (tokenRole !== "authenticated") {
      return unauthorized(
        `token ber-role '${tokenRole ?? "tidak dikenal"}' bukan sesi pengguna. ` +
        "Gunakan access_token dari hasil login, bukan anon key."
      );
    }

    // (b) Verifikasi tanda tangan token ke GoTrue. Ini yang menentukan.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[AI Proxy] SUPABASE_URL / SUPABASE_ANON_KEY tidak tersedia");
      return new Response(JSON.stringify({ error: "Konfigurasi server tidak lengkap" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return unauthorized("sesi tidak valid atau sudah kedaluwarsa");
    }

    const body: ValidatedAIRequest = validateAIRequest(await readJsonBody(req));
    const { provider, model, prompt, systemPrompt, base64Data, mimeType, images, maxTokens, temperature, projectId } = body;

    // A project context is an authorization boundary, not trusted client metadata.
    // Re-check it with the caller's JWT so Postgres RLS decides membership.
    const projectClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    let authorizedOrganizationId: string | null = null;
    if (projectId) {
      const { data: project, error: projectError } = await projectClient
        .from("proyek")
        .select("id, organization_id")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError || !project) {
        return new Response(JSON.stringify({ error: "Akses ke proyek tidak diizinkan." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      authorizedOrganizationId = project.organization_id as string;

      // RLS visibility only proves read access. AI execution is a separate
      // capability: owner/admin/member are allowed; viewer is read-only.
      // Platform admins receive no implicit cross-tenant bypass here.
      const { data: membership, error: membershipError } = await projectClient
        .from("organization_members")
        .select("role")
        .eq("organization_id", project.organization_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError || !membership || !canExecuteProjectAI(membership.role)) {
        return new Response(JSON.stringify({ error: "Role Anda hanya memiliki akses baca atau tidak memiliki izin menjalankan AI pada proyek ini." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Tenant users must supply projectId so role checks are unambiguous.
      // Only authenticated users with no tenant membership may use unscoped AI.
      const { data: memberships, error: membershipsError } = await projectClient
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id);

      if (membershipsError || !canExecuteUnscopedAI(memberships ?? [])) {
        return new Response(JSON.stringify({ error: "ID proyek wajib untuk pengguna yang tergabung dalam organisasi. Pilih proyek agar izin AI dapat diverifikasi." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Reserve against the authenticated user and organization resolved above.
    // Never accept an organization identifier or idempotency key from the client.
    const imageCount = (base64Data ? 1 : 0) + (images?.length ?? 0);
    const estimatedTokens = Math.min(1_000_000,
      estimateTextTokens(prompt + (systemPrompt ?? "")) +
      Math.max(1, maxTokens ?? 2048) + imageCount * 8192
    );
    quotaReservation = await reserveAIUsage({ userId: user.id, organizationId: authorizedOrganizationId }, estimatedTokens);

    let result = "";

    switch (provider) {
      case "gemini": {
        const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY tidak dikonfigurasi di Supabase");

        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
        if (base64Data && mimeType) {
          parts.push({ inlineData: { mimeType, data: base64Data } });
        }
        if (images?.length) {
          for (const image of images) {
            parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64Data } });
          }
        }

        // Determine which Gemini model to use based on request
        // Flash: text/narrative, fast, cost-effective
        // Pro: vision, complex reasoning, long context
        const isVisionRequest = !!base64Data || !!images?.length;
        const modelToUse = isVisionRequest 
          ? (model || "gemini-2.5-pro-exp-03-25") // Default to Pro for vision
          : (model || "gemini-2.0-flash"); // Default to Flash for text

        providerRequestStarted = true;\n        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { 
                temperature, 
                maxOutputTokens: maxTokens,
                ...(isVisionRequest ? {} : { topP: 0.95 }) // Flash optimized params
              },
            }),
          }
        );
        const geminiData = await geminiRes.json();
        actualTokens = extractProviderUsageTokens(geminiData);
        if (!geminiRes.ok) throw new Error(`Gemini Error ${geminiRes.status}: ${JSON.stringify(geminiData)}`);
        result = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        break;
      }

      case "openai":
      case "groq":
      case "kimi": {
        let key: string | undefined;
        let url: string;

        if (provider === "openai") {
          key = Deno.env.get("OPENAI_API_KEY");
          url = "https://api.openai.com/v1/chat/completions";
        } else if (provider === "groq") {
          key = Deno.env.get("GROQ_API_KEY");
          url = "https://api.groq.com/openai/v1/chat/completions";
        } else {
          // kimi - Moonshot AI Global Endpoint
          key = Deno.env.get("KIMI_API_KEY");
          url = "https://api.moonshot.ai/v1/chat/completions";
        }

        if (!key) throw new Error(`${provider.toUpperCase()}_API_KEY tidak dikonfigurasi`);

        const messages = systemPrompt
          ? [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }]
          : [{ role: "user", content: prompt }];

        providerRequestStarted = true;\n        const oaiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        });
        const oaiData = await oaiRes.json();
        actualTokens = extractProviderUsageTokens(oaiData);
        if (!oaiRes.ok) throw new Error(`${provider} Error ${oaiRes.status}: ${JSON.stringify(oaiData)}`);
        result = oaiData.choices?.[0]?.message?.content ?? "{}";
        break;
      }

      case "claude": {
        const CLAUDE_KEY = Deno.env.get("CLAUDE_API_KEY");
        if (!CLAUDE_KEY) throw new Error("CLAUDE_API_KEY tidak dikonfigurasi");

        providerRequestStarted = true;\n        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt ?? "Anda adalah asisten ahli teknis bangunan SLF.",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const claudeData = await claudeRes.json();
        actualTokens = extractProviderUsageTokens(claudeData);
        if (!claudeRes.ok) throw new Error(`Claude Error ${claudeRes.status}: ${JSON.stringify(claudeData)}`);
        result = claudeData.content?.[0]?.text ?? "{}";
        break;
      }

      case "openrouter": {
        const OR_KEY = Deno.env.get("OPENROUTER_API_KEY");
        if (!OR_KEY) throw new Error("OPENROUTER_API_KEY tidak dikonfigurasi");

        providerRequestStarted = true;\n        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OR_KEY}`,
            "HTTP-Referer": "https://smartaipengkaji.app",
            "X-Title": "Smart AI Pengkaji SLF",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: maxTokens,
          }),
        });
        const orData = await orRes.json();
        actualTokens = extractProviderUsageTokens(orData);
        if (!orRes.ok) throw new Error(`OpenRouter Error ${orRes.status}: ${JSON.stringify(orData)}`);
        result = orData.choices?.[0]?.message?.content ?? "{}";
        break;
      }

      case "mistral": {
        const MISTRAL_KEY = Deno.env.get("MISTRAL_API_KEY");
        if (!MISTRAL_KEY) throw new Error("MISTRAL_API_KEY tidak dikonfigurasi");

        providerRequestStarted = true;\n        const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: maxTokens,
          }),
        });
        const mistralData = await mistralRes.json();
        actualTokens = extractProviderUsageTokens(mistralData);
        if (!mistralRes.ok) throw new Error(`Mistral Error ${mistralRes.status}: ${JSON.stringify(mistralData)}`);
        result = mistralData.choices?.[0]?.message?.content ?? "{}";
        break;
      }

      case "huggingface": {
        const HF_KEY = Deno.env.get("HF_API_TOKEN");
        const HF_URL = Deno.env.get("HF_SLF_OPUS_URL") ?? "https://api-inference.huggingface.co/models/adminskpslf/SLF_OPUS";
        if (!HF_KEY) throw new Error("HF_API_TOKEN tidak dikonfigurasi");

        providerRequestStarted = true;\n        const hfRes = await fetch(HF_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${HF_KEY}` },
          body: JSON.stringify({
            inputs: [
              { role: "developer", content: "Anda adalah AI Ahli Pengkaji SLF Bangunan Gedung." },
              { role: "user", content: prompt },
            ],
            parameters: { max_new_tokens: maxTokens, temperature, return_full_text: false },
          }),
        });
        const hfData = await hfRes.json();
        actualTokens = extractProviderUsageTokens(hfData);
        if (!hfRes.ok) throw new Error(`HuggingFace Error ${hfRes.status}: ${JSON.stringify(hfData)}`);
        const hfText = Array.isArray(hfData) ? hfData[0]?.generated_text : hfData?.generated_text ?? "";
        result = hfText.replace(/<thought>[\s\S]*?<\/thought>/g, "").trim();
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Provider '${provider}' tidak dikenal` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Until provider adapters expose normalized usage metadata, account the full reservation conservatively.
    await finalizeAIUsage(quotaReservation, actualTokens ?? quotaReservation.reservedTokens);

    return new Response(JSON.stringify({ result, provider, model }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (quotaReservation) {
      try {
        if (providerRequestStarted) {
          // A request may have reached the provider even if the response was lost.
          await finalizeAIUsage(quotaReservation, quotaReservation.reservedTokens);
        } else {
          await releaseAIUsage(quotaReservation);
        }
      } catch {
        console.error("[AI Proxy] quota settlement deferred to expiry");
      }
    }
    if (error instanceof Error && error.name === "AIQuotaDeniedError") {
      const retryAfter = (error as Error & { retryAfter?: string }).retryAfter;
      return new Response(JSON.stringify({ error: "Kuota AI telah tercapai.", retryAfter }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Never return raw upstream provider diagnostics to the browser.
    const safe = publicError(error);
    console.error("[AI Proxy] Request failed:", safe.status);
    return new Response(JSON.stringify({ error: safe.message }), {
      status: safe.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
