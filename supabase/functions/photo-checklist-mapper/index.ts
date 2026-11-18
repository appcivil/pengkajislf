// ============================================================
//  SUPABASE EDGE FUNCTION: PHOTO-TO-CHECKLIST BATCH PROCESSOR
//  Fitur #22: Batch vision analysis untuk mapping foto ke checklist
//  Menggunakan Gemini Pro untuk vision, dengan batch optimization
//  Deploy: supabase functions deploy photo-checklist-mapper
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateProject, readJsonBody } from "../_shared/tenant-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PhotoChecklistRequest {
  photos: Array<{
    id: string;
    base64: string;
    mimeType: string;
    filename?: string;
    location?: string;
  }>;
  proyekData?: {
    nama_bangunan: string;
    fungsi_bangunan?: string;
    jenis_bangunan?: string;
  };
  checklistContext?: Array<{
    kode: string;
    nama: string;
    aspek: string;
  }>;
  proyekId?: string;
  batchSize?: number; // Jumlah foto per batch (default: 5)
}

interface PhotoAnalysisResult {
  photoId: string;
  filename?: string;
  komponen: string[];
  kondisi: string;
  kerusakan: string[];
  checklistMapping: string[];
  confidence: number;
  rekomendasi: string;
  error?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsedBody = await readJsonBody(req, 12 * 1024 * 1024);
    if (!parsedBody.ok) {
      return new Response(JSON.stringify({ error: parsedBody.error }), {
        status: parsedBody.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!parsedBody.data || typeof parsedBody.data !== "object" || Array.isArray(parsedBody.data)) {
      return new Response(JSON.stringify({ error: "JSON body must be an object" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = parsedBody.data as PhotoChecklistRequest;
    const { photos, proyekData, checklistContext, proyekId, batchSize = 2 } = body;
    const authorization = await authenticateProject(req, proyekId);
    if (!authorization.ok) {
      return new Response(JSON.stringify({ error: authorization.error }), {
        status: authorization.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(photos) || photos.length === 0 || photos.length > 10) {
      return new Response(JSON.stringify({ error: "Provide between 1 and 10 photos per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 3) {
      return new Response(JSON.stringify({ error: "batchSize must be an integer from 1 to 3" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    let totalEncodedBytes = 0;
    for (const photo of photos) {
      if (!photo || typeof photo.id !== "string" || photo.id.length > 100 ||
          typeof photo.base64 !== "string" || photo.base64.length === 0 || !allowedMimeTypes.has(photo.mimeType) ||
          photo.base64.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(photo.base64)) {
        return new Response(JSON.stringify({ error: "Each photo must have a valid id, base64 data, and JPEG/PNG/WebP MIME type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const padding = photo.base64.endsWith('==') ? 2 : photo.base64.endsWith('=') ? 1 : 0;\n      const estimatedBytes = (photo.base64.length / 4) * 3 - padding;
      if (estimatedBytes > 3 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Each photo must be 3 MB or smaller" }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      totalEncodedBytes += estimatedBytes;
    }
    if (totalEncodedBytes > 8 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Combined photo data must be 8 MB or smaller" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (proyekData && JSON.stringify(proyekData).length > 16 * 1024) {
      return new Response(JSON.stringify({ error: "proyekData is too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (checklistContext && (!Array.isArray(checklistContext) || checklistContext.length > 100)) {
      return new Response(JSON.stringify({ error: "checklistContext must contain at most 100 items" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Default checklist context
    const defaultContext = [
      { kode: "ITEM-05A1", nama: "Kondisi Fondasi", aspek: "struktur" },
      { kode: "ITEM-05A2", nama: "Kondisi Kolom", aspek: "struktur" },
      { kode: "ITEM-05A3", nama: "Kondisi Balok", aspek: "struktur" },
      { kode: "ITEM-05A4", nama: "Kondisi Pelat Lantai", aspek: "struktur" },
      { kode: "ITEM-05A5", nama: "Kondisi Dinding", aspek: "struktur" },
      { kode: "ITEM-05A6", nama: "Kondisi Atap", aspek: "struktur" },
      { kode: "ITEM-05A7", nama: "Kondisi Tangga", aspek: "struktur" },
      { kode: "ITEM-03A", nama: "Fasad Bangunan", aspek: "arsitektur" },
      { kode: "ITEM-03B", nama: "Ruang Luar", aspek: "arsitektur" },
      { kode: "ITEM-05B", nama: "Sistem Proteksi Kebakaran", aspek: "mekanikal" },
      { kode: "ITEM-05C", nama: "Instalasi Listrik", aspek: "mekanikal" },
      { kode: "ITEM-05D", nama: "Instalasi Plumbing", aspek: "mekanikal" },
      { kode: "ITEM-06A", nama: "Ventilasi", aspek: "kesehatan" },
      { kode: "ITEM-06B", nama: "Pencahayaan", aspek: "kesehatan" },
      { kode: "ITEM-08A", nama: "Akses Masuk", aspek: "kemudahan" },
    ];

    const context = checklistContext || defaultContext;

    // Process photos in batches
    const results: PhotoAnalysisResult[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize);
      
      // Process each photo in batch (sequential untuk menghindari rate limit)
      for (const photo of batch) {
        try {
          const prompt = `Anda adalah AI Inspector Bangunan untuk Sertifikat Laik Fungsi (SLF) Indonesia.

DATA PROYEK:
${JSON.stringify(proyekData || {}, null, 2)}

DAFTAR CHECKLIST YANG TERSEDIA:
${JSON.stringify(context, null, 2)}

Analisis foto bangunan ini dan berikan:
1. Komponen bangunan yang terlihat (pilih dari: fondasi, kolom, balok, pelat, dinding, atap, tangga, fasad, ruang luar, proteksi kebakaran, listrik, plumbing, ventilasi, pintu, jendela)
2. Kondisi visual: baik (tidak ada kerusakan), sedang (kerusakan minor), buruk (kerusakan signifikan), kritis (bahaya struktural)
3. Jenis kerusakan yang terdeteksi (retak, karat, rembesan, kelengkungan, korosi, kebocoran, aus, dll)
4. Mapping ke kode checklist SLF yang relevan (pilih dari daftar di atas)
5. Confidence score (0.0-1.0)
6. Rekomendasi perbaikan singkat

Output WAJIB dalam format JSON:
{
  "komponen": ["kolom", "balok"],
  "kondisi": "baik|sedang|buruk|kritis",
  "kerusakan": ["retak halus"],
  "checklistMapping": ["ITEM-05A2", "ITEM-05A3"],
  "confidence": 0.85,
  "rekomendasi": "Perbaikan..."
}`;

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent?key=${GEMINI_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ 
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: photo.mimeType, data: photo.base64 } }
                  ] 
                }],
                generationConfig: { 
                  temperature: 0.1, 
                  maxOutputTokens: 2048 
                },
              }),
            }
          );

          if (!geminiRes.ok) {
            const errorData = await geminiRes.json();
            throw new Error(`Gemini Error: ${JSON.stringify(errorData)}`);
          }

          const geminiData = await geminiRes.json();
          const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
          
          // Extract JSON
          let parsed: Partial<PhotoAnalysisResult> = {};
          try {
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            }
          } catch (parseErr) {
            console.error("[PhotoMapper] JSON parse error for photo", photo.id);
          }

          results.push({
            photoId: photo.id,
            filename: photo.filename,
            komponen: parsed.komponen || [],
            kondisi: parsed.kondisi || "unknown",
            kerusakan: parsed.kerusakan || [],
            checklistMapping: parsed.checklistMapping || [],
            confidence: parsed.confidence || 0,
            rekomendasi: parsed.rekomendasi || "Tidak ada rekomendasi",
          });

        } catch (photoError) {
          console.error(`[PhotoMapper] Error processing photo ${photo.id}:`, photoError);
          errors.push(`Photo ${photo.id}: ${photoError instanceof Error ? photoError.message : 'Unknown error'}`);
          results.push({
            photoId: photo.id,
            filename: photo.filename,
            komponen: [],
            kondisi: "error",
            kerusakan: [],
            checklistMapping: [],
            confidence: 0,
            rekomendasi: "Gagal menganalisis foto",
            error: photoError instanceof Error ? photoError.message : 'Unknown error',
          });
        }

        // Delay antara foto untuk menghindari rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Aggregate statistics
    const byChecklist: Record<string, { count: number; avgConfidence: number; photos: string[] }> = {};
    results.forEach(r => {
      r.checklistMapping.forEach(kode => {
        if (!byChecklist[kode]) {
          byChecklist[kode] = { count: 0, avgConfidence: 0, photos: [] };
        }
        byChecklist[kode].count++;
        byChecklist[kode].avgConfidence += r.confidence;
        byChecklist[kode].photos.push(r.photoId);
      });
    });

    // Normalize averages
    Object.keys(byChecklist).forEach(kode => {
      byChecklist[kode].avgConfidence = Math.round((byChecklist[kode].avgConfidence / byChecklist[kode].count) * 100) / 100;
    });

    const avgConfidence = results.length > 0 
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length 
      : 0;

    return new Response(JSON.stringify({
      success: true,
      proyekId,
      results,
      aggregated: byChecklist,
      stats: {
        totalPhotos: photos.length,
        processed: results.length,
        successCount: results.filter(r => !r.error).length,
        errorCount: errors.length,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        modelUsed: "gemini-2.5-pro-exp-03-25",
        costTier: "high",
        batchSize,
        errors: errors.length > 0 ? errors : undefined
      },
      processedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Photo Checklist Mapper] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
