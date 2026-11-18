// ============================================================
//  SUPABASE EDGE FUNCTION: AUTO-FILL DAFTAR SIMAK
//  Fitur #8: Generate checklist otomatis dari data proyek
//  Menggunakan Gemini Flash untuk hemat quota
//  Deploy: supabase functions deploy auto-fill-simak
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateProject, readJsonBody } from "../_shared/tenant-auth.ts";
import { reserveAIUsage, finalizeAIUsage, releaseAIUsage, estimateTextTokens, extractProviderUsageTokens, type AIQuotaReservation } from "../_shared/ai-quota.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AutoFillRequest {
  proyekData: {
    nama_bangunan: string;
    jenis_bangunan?: string;
    fungsi_bangunan?: string;
    jumlah_lantai?: number;
    luas_bangunan?: number;
    tahun_dibangun?: number;
    kondisi_umum?: string;
    [key: string]: any;
  };
  checklistTemplate?: Array<{
    kode: string;
    nama: string;
    aspek: string;
  }>;
  proyekId?: string;
}

interface ChecklistItem {
  kode: string;
  nama: string;
  status: string;
  catatan: string;
  nilai: number;
  confidence: number;
  aspek: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let quotaReservation: AIQuotaReservation | null = null;
  let actualTokens: number | null = null;
  let providerRequestStarted = false;
  try {
    const parsedBody = await readJsonBody(req, 256 * 1024);
    if (!parsedBody.ok) {
      return new Response(JSON.stringify({ error: parsedBody.error }), {
        status: parsedBody.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!parsedBody.data || typeof parsedBody.data !== "object" || Array.isArray(parsedBody.data)) {
      return new Response(JSON.stringify({ error: "JSON body must be an object" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = parsedBody.data as AutoFillRequest;
    const { proyekData, checklistTemplate, proyekId } = body;
    const authorization = await authenticateProject(req, proyekId);
    if (!authorization.ok) {
      return new Response(JSON.stringify({ error: authorization.error }), {
        status: authorization.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!proyekData || typeof proyekData !== "object" || Array.isArray(proyekData)) {
      return new Response(JSON.stringify({ error: "proyekData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (JSON.stringify(proyekData).length > 32 * 1024) {
      return new Response(JSON.stringify({ error: "proyekData is too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (checklistTemplate && (!Array.isArray(checklistTemplate) || checklistTemplate.length > 100 || checklistTemplate.some((item) => !item || typeof item.kode !== "string" || typeof item.nama !== "string" || typeof item.aspek !== "string" || item.kode.length > 40 || item.nama.length > 200 || item.aspek.length > 40))) {
      return new Response(JSON.stringify({ error: "Invalid checklistTemplate (maximum 100 valid items)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use Gemini Flash for fast, cost-effective text generation
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not configured");

    const defaultTemplate = [
      { kode: "A01", nama: "Dokumen Kepemilikan", aspek: "administrasi" },
      { kode: "A02", nama: "IMB/PBG", aspek: "administrasi" },
      { kode: "ITEM-01A", nama: "Kesesuaian Fungsi", aspek: "pemanfaatan" },
      { kode: "ITEM-02A", nama: "GSB (Garis Sempadan Bangunan)", aspek: "pemanfaatan" },
      { kode: "ITEM-03A", nama: "Kesesuaian Arsitektur", aspek: "arsitektur" },
      { kode: "ITEM-05A1", nama: "Kondisi Fondasi", aspek: "struktur" },
      { kode: "ITEM-05A2", nama: "Kondisi Kolom", aspek: "struktur" },
      { kode: "ITEM-05A3", nama: "Kondisi Balok", aspek: "struktur" },
      { kode: "ITEM-05B", nama: "Sistem Proteksi Kebakaran", aspek: "mekanikal" },
      { kode: "ITEM-05C", nama: "Sistem Kelistrikan", aspek: "mekanikal" },
      { kode: "ITEM-05D", nama: "Sistem Plumbing", aspek: "mekanikal" },
      { kode: "ITEM-06A", nama: "Ventilasi Udara", aspek: "kesehatan" },
      { kode: "ITEM-06B", nama: "Pencahayaan Alami", aspek: "kesehatan" },
      { kode: "ITEM-07A", nama: "Kebisingan", aspek: "kenyamanan" },
      { kode: "ITEM-08A", nama: "Aksesibilitas", aspek: "kemudahan" },
    ];

    const template = checklistTemplate || defaultTemplate;

    const prompt = `
Anda adalah AI Assistant untuk pengisian Daftar Simak Sertifikat Laik Fungsi (SLF) Indonesia.
Berdasarkan data proyek berikut, generate status checklist yang paling mungkin:

DATA PROYEK:
- Nama Bangunan: ${proyekData.nama_bangunan || "-"}
- Jenis Bangunan: ${proyekData.jenis_bangunan || "-"}
- Fungsi Bangunan: ${proyekData.fungsi_bangunan || "-"}
- Jumlah Lantai: ${proyekData.jumlah_lantai || "-"}
- Luas Bangunan: ${proyekData.luas_bangunan || "-"} m²
- Tahun Dibangun: ${proyekData.tahun_dibangun || "-"}
- Kondisi Umum: ${proyekData.kondisi_umum || "-"}

TEMPLATE CHECKLIST:
${JSON.stringify(template, null, 2)}

Rules:
1. Untuk bangunan >20 tahun: struktur biasanya "sedang" atau "buruk"
2. Untuk bangunan komersial/high-rise: wajib ada proteksi kebakaran aktif
3. Fungsi bangunan menentukan prioritas aspek (kantor=kenyamanan, pabrik=kesehatan)
4. Gunakan confidence score rendah jika tidak yakin

Generate dalam format JSON array:
[{
  "kode": "ITEM-XX",
  "nama": "...",
  "status": "ada_sesuai|ada_tidak_sesuai|tidak_ada|baik|sedang|buruk",
  "catatan": "alasan pemilihan status",
  "nilai": 0-100,
  "confidence": 0.0-1.0,
  "aspek": "administrasi|pemanfaatan|arsitektur|struktur|mekanikal|kesehatan|kenyamanan|kemudahan"
}]

PENTING: Kembalikan HANYA JSON array tanpa markdown atau penjelasan tambahan.
`;

    quotaReservation = await reserveAIUsage(
      { userId: authorization.userId, organizationId: authorization.organizationId },
      Math.min(1_000_000, estimateTextTokens(prompt) + 8192),
    );

    providerRequestStarted = true;
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.2, 
            maxOutputTokens: 8192,
            topP: 0.95 
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    actualTokens = extractProviderUsageTokens(geminiData);
    if (!geminiRes.ok) {
      throw new Error(`Gemini Error ${geminiRes.status}: ${JSON.stringify(geminiData)}`);
    }

    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    
    // Extract JSON from response
    let checklistItems: ChecklistItem[] = [];
    try {
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        checklistItems = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("[AutoFill] JSON parse error:", parseError);
      checklistItems = [];
    }

    // Calculate statistics
    const avgConfidence = checklistItems.length > 0 
      ? checklistItems.reduce((sum, item) => sum + (item.confidence || 0), 0) / checklistItems.length 
      : 0;

    const byAspek: Record<string, number> = {};
    checklistItems.forEach(item => {
      byAspek[item.aspek] = (byAspek[item.aspek] || 0) + 1;
    });

    await finalizeAIUsage(quotaReservation, actualTokens ?? quotaReservation.reservedTokens);

    return new Response(JSON.stringify({
      success: true,
      proyekId,
      items: checklistItems,
      stats: {
        totalGenerated: checklistItems.length,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        byAspek,
        modelUsed: "gemini-2.0-flash",
        costTier: "low"
      },
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    if (quotaReservation) {
      try {
        if (providerRequestStarted) {
          await finalizeAIUsage(quotaReservation, quotaReservation.reservedTokens);
        } else {
          await releaseAIUsage(quotaReservation);
        }
      } catch {
        console.error("[AI quota] settlement deferred to expiry");
      }
    }
    if (error instanceof Error && error.name === "AIQuotaDeniedError") {
      return new Response(JSON.stringify({ error: "Kuota AI telah tercapai." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("[AutoFill Simak] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
