// ============================================================
//  SUPABASE EDGE FUNCTION: AI PROXY
//  Menerima request dari frontend, meneruskan ke AI provider
//  menggunakan API key yang aman di environment Supabase.
//  Deploy: supabase functions deploy ai-proxy
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AIRequest {
  provider: "gemini" | "openai" | "claude" | "groq" | "openrouter" | "mistral" | "huggingface" | "ollama";
  model: string;
  prompt: string;
  systemPrompt?: string;
  base64Data?: string;
  mimeType?: string;
  maxTokens?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authorization — hanya user Supabase yang authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AIRequest = await req.json();
    const { provider, model, prompt, systemPrompt, base64Data, mimeType, maxTokens = 8192 } = body;

    if (!provider || !prompt) {
      return new Response(JSON.stringify({ error: "provider and prompt are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result = "";

    switch (provider) {
      case "gemini": {
        const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY tidak dikonfigurasi di Supabase");

        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
        if (base64Data && mimeType) {
          parts.push({ inlineData: { mimeType, data: base64Data } });
        }

        // Determine which Gemini model to use based on request
        // Flash: text/narrative, fast, cost-effective
        // Pro: vision, complex reasoning, long context
        const isVisionRequest = !!base64Data;
        const modelToUse = isVisionRequest 
          ? (model || "gemini-2.5-pro-exp-03-25") // Default to Pro for vision
          : (model || "gemini-2.0-flash"); // Default to Flash for text

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { 
                temperature: 0.1, 
                maxOutputTokens: maxTokens,
                ...(isVisionRequest ? {} : { topP: 0.95 }) // Flash optimized params
              },
            }),
          }
        );
        const geminiData = await geminiRes.json();
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

        const oaiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens }),
        });
        const oaiData = await oaiRes.json();
        if (!oaiRes.ok) throw new Error(`${provider} Error ${oaiRes.status}: ${JSON.stringify(oaiData)}`);
        result = oaiData.choices?.[0]?.message?.content ?? "{}";
        break;
      }

      case "claude": {
        const CLAUDE_KEY = Deno.env.get("CLAUDE_API_KEY");
        if (!CLAUDE_KEY) throw new Error("CLAUDE_API_KEY tidak dikonfigurasi");

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
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
        if (!claudeRes.ok) throw new Error(`Claude Error ${claudeRes.status}: ${JSON.stringify(claudeData)}`);
        result = claudeData.content?.[0]?.text ?? "{}";
        break;
      }

      case "openrouter": {
        const OR_KEY = Deno.env.get("OPENROUTER_API_KEY");
        if (!OR_KEY) throw new Error("OPENROUTER_API_KEY tidak dikonfigurasi");

        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            temperature: 0.1,
          }),
        });
        const orData = await orRes.json();
        if (!orRes.ok) throw new Error(`OpenRouter Error ${orRes.status}: ${JSON.stringify(orData)}`);
        result = orData.choices?.[0]?.message?.content ?? "{}";
        break;
      }

      case "mistral": {
        const MISTRAL_KEY = Deno.env.get("MISTRAL_API_KEY");
        if (!MISTRAL_KEY) throw new Error("MISTRAL_API_KEY tidak dikonfigurasi");

        const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: maxTokens,
          }),
        });
        const mistralData = await mistralRes.json();
        if (!mistralRes.ok) throw new Error(`Mistral Error ${mistralRes.status}: ${JSON.stringify(mistralData)}`);
        result = mistralData.choices?.[0]?.message?.content ?? "{}";
        break;
      }

      case "huggingface": {
        const HF_KEY = Deno.env.get("HF_API_TOKEN");
        const HF_URL = Deno.env.get("HF_SLF_OPUS_URL") ?? "https://api-inference.huggingface.co/models/adminskpslf/SLF_OPUS";
        if (!HF_KEY) throw new Error("HF_API_TOKEN tidak dikonfigurasi");

        const hfRes = await fetch(HF_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${HF_KEY}` },
          body: JSON.stringify({
            inputs: [
              { role: "developer", content: "Anda adalah AI Ahli Pengkaji SLF Bangunan Gedung." },
              { role: "user", content: prompt },
            ],
            parameters: { max_new_tokens: 4096, temperature: 0.1, return_full_text: false },
          }),
        });
        const hfData = await hfRes.json();
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

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI Proxy] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
