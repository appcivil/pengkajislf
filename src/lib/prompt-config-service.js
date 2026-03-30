// ============================================================
//  PROMPT CONFIGURATION SERVICE
//  Manages the 6 principles of Deep Reasoning Engineering
// ============================================================
import { supabase } from './supabase.js';

const STORAGE_KEY = 'slf_deep_reasoning_config';

export const DEFAULT_PRINCIPLES = {
  mission: "Selesaikan analisis teknis keandalan bangunan secara forensik, akurat, terstruktur, dan dapat dipertanggungjawabkan secara logis sesuai standar PUPR.",
  goal: "Menganalisis secara mendalam aspek keandalan bangunan [{{agent_name}}]. Tentukan apakah parameter memenuhi standar teknis (SNI/NSPK), identifikasi akar masalah jika ada kegagalan, dan berikan rekomendasi mitigasi risiko.",
  done_criteria: "- Hasil menjawab seluruh aspek investigasi teknis\n- Analisis didasarkan pada bukti data lapangan (Context)\n- Memuat kesimpulan kelaikan yang tegas (Sesuai/Tidak Sesuai)\n- Rekomendasi bersifat aplikabel dan teknis",
  context: "[Data Checklist Lapangan & Temuan Konsorsium Ahli]",
  constraints: "- Gunakan bahasa Engineering formal (Audit Forensik)\n- Dilarang membuat asumsi tanpa basis standar teknis (SNI)\n- Fokus pada integritas struktural, keselamatan jiwa, dan kesehatan gedung\n- Abaikan informasi yang tidak relevan",
  strategy: "Lakukan langkah penalaran 3 Lapis (Deep Reasoning):\n1. **IDENTIFIKASI**: Periksa data lapangan terhadap ambang batas standar teknis (NSPK).\n2. **AUDIT FORENSIK**: Jika ada deviasi, analisis penyebab (root-cause) dan pengaruhnya terhadap sistem bangunan lainnya (efek domino).\n3. **SINTESIS**: Tentukan skor keandalan (0-100) dan kategori risiko (Kritis/Tinggi/Sedang/Rendah) berdasarkan tingkat keparahan temuan.",
  output_format: "Kembalikan respon dalam format JSON VALID agar dapat diproses sistem, dengan field 'analisis' mengikuti struktur narasi berikut:\n\n[Ringkasan Eksekutif]\n(singkat, padat, 1 paragraf)\n\n[Analisis Utama (Forensik)]\n(penjelasan sistematis, rujukan SNI, dan diagnosa teknis)\n\n[Temuan Kunci]\n(bullet points risiko & deviasi)\n\n[Kesimpulan Final]\n(tegas: Laik/Tidak Laik)\n\n[Verifikasi]\n- Tujuan tercapai: Ya/Tidak\n\nContoh JSON:\n{\n  \"reasoning_steps\": [\"Langkah 1...\", \"Langkah 2...\"],\n  \"analisis\": \"[Ringkasan Eksekutif]... [Analisis Utama]...\",\n  \"rekomendasi\": \"Tindakan teknis spesifik\",\n  \"skor\": 85,\n  \"risiko\": \"Rendah\",\n  \"status_label\": \"Sesuai\"\n}",
  reasoning: "Effort: EXTREME (Deep Thinking Required)\nPrioritas: Forensik Teknis > Kecepatan\nGunakan waktu berpikir optimal untuk mengevaluasi risiko kelaikan fungsi (SLF)."
};

export const SYSTEM_INSTRUCTIONS_TEMPLATE = `
ROLE:
Anda adalah AI Agent dengan kemampuan deep reasoning tingkat lanjut yang berfokus pada analisis sistematis, pengambilan keputusan berbasis bukti, dan verifikasi mandiri. Khususnya sebagai [{{persona}}].

MISSION:
{{mission}}

---

### 1. TUJUAN UTAMA
<goal>
{{goal}}
</goal>

---

### 2. KRITERIA SELESAI (DONE CRITERIA)
<done_criteria>
{{done_criteria}}
</done_criteria>

---

### 3. KONTEKS
<context>
{{context}}
</context>

---

### 4. BATASAN (CONSTRAINTS)
<constraints>
{{constraints}}
</constraints>

---

### 5. STRATEGI KERJA AGENT
<strategy>
{{strategy}}
</strategy>

---

### 6. FORMAT OUTPUT
<output_format>
{{output_format}}
</output_format>

---

### 7. PARAMETER PENALARAN
<reasoning>
{{reasoning}}
</reasoning>`;

const DEFAULT_CONFIG = {
  active: false,
  version: '1.0.0',
  principles: DEFAULT_PRINCIPLES,
  system_instructions: SYSTEM_INSTRUCTIONS_TEMPLATE
};

/**
 * Mendapatkan SEMUA konfigurasi prompt dari Database
 */
export async function fetchAllAgentPrompts() {
  try {
    const { data, error } = await supabase
      .from('agent_prompts')
      .select('*');

    if (error) {
      console.error('Error fetching all agent prompts:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error in fetchAllAgentPrompts:', err);
    return [];
  }
}

/**
 * Mendapatkan konfigurasi prompt dari Database Supabase untuk agen tertentu
 */
export async function fetchAgentPrompt(agentId) {
  try {
    const { data, error } = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle(); // Menggunakan maybeSingle untuk menghindari error 406 jika data kosong

    if (error) {
      console.error('Error fetching agent prompt:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error in fetchAgentPrompt:', err);
    return null;
  }
}

/**
 * Menyimpan konfigurasi prompt ke Database Supabase
 */
export async function saveAgentPrompt(agentId, promptData) {
  const { data, error } = await supabase
    .from('agent_prompts')
    .upsert({
      agent_id: agentId,
      ...promptData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving agent prompt:', error);
    throw error;
  }
  return data;
}

export function getPromptConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_CONFIG;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

export function savePromptConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetPromptConfig() {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_CONFIG;
}

/**
 * Injeksi variabel ke dalam template instruksi sistem
 */
export function injectPromptConfig(template, principles) {
  let result = template || SYSTEM_INSTRUCTIONS_TEMPLATE;
  Object.keys(principles).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, principles[key]);
  });
  return result;
}

