// ============================================================
//  SUPABASE EDGE FUNCTION: PHOTO-TO-CHECKLIST BATCH PROCESSOR
//  Fitur #22: Batch vision analysis untuk mapping foto ke checklist
//  Menggunakan Gemini Pro untuk vision, dengan batch optimization
//  Deploy: supabase functions deploy photo-checklist-mapper
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: PhotoChecklistRequest = await req.json();
    const { photos, proyekData, checklistContext, proyekId, batchSize = 5 } = body;

    if (!photos || photos.length === 0) {
      return new Response(JSON.stringify({ error: "photos array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (photos.length > 20) {
      return new Response(JSON.stringify({ error: "Maximum 20 photos per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
