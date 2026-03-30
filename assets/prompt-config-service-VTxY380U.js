import{t as e}from"./supabase-Cpvc2oH5.js";var t=`slf_deep_reasoning_config`,n={mission:`Selesaikan analisis teknis keandalan bangunan secara forensik, akurat, terstruktur, dan dapat dipertanggungjawabkan secara logis sesuai standar PUPR.`,goal:`Menganalisis secara mendalam aspek keandalan bangunan [{{agent_name}}]. Tentukan apakah parameter memenuhi standar teknis (SNI/NSPK), identifikasi akar masalah jika ada kegagalan, dan berikan rekomendasi mitigasi risiko.`,done_criteria:`- Hasil menjawab seluruh aspek investigasi teknis
- Analisis didasarkan pada bukti data lapangan (Context)
- Memuat kesimpulan kelaikan yang tegas (Sesuai/Tidak Sesuai)
- Rekomendasi bersifat aplikabel dan teknis`,context:`[Data Checklist Lapangan & Temuan Konsorsium Ahli]`,constraints:`- Gunakan bahasa Engineering formal (Audit Forensik)
- Dilarang membuat asumsi tanpa basis standar teknis (SNI)
- Fokus pada integritas struktural, keselamatan jiwa, dan kesehatan gedung
- Abaikan informasi yang tidak relevan`,strategy:`Lakukan langkah penalaran 3 Lapis (Deep Reasoning):
1. **IDENTIFIKASI**: Periksa data lapangan terhadap ambang batas standar teknis (NSPK).
2. **AUDIT FORENSIK**: Jika ada deviasi, analisis penyebab (root-cause) dan pengaruhnya terhadap sistem bangunan lainnya (efek domino).
3. **SINTESIS**: Tentukan skor keandalan (0-100) dan kategori risiko (Kritis/Tinggi/Sedang/Rendah) berdasarkan tingkat keparahan temuan.`,output_format:`Kembalikan respon dalam format JSON VALID agar dapat diproses sistem, dengan field 'analisis' mengikuti struktur narasi berikut:

[Ringkasan Eksekutif]
(singkat, padat, 1 paragraf)

[Analisis Utama (Forensik)]
(penjelasan sistematis, rujukan SNI, dan diagnosa teknis)

[Temuan Kunci]
(bullet points risiko & deviasi)

[Kesimpulan Final]
(tegas: Laik/Tidak Laik)

[Verifikasi]
- Tujuan tercapai: Ya/Tidak

Contoh JSON:
{
  "reasoning_steps": ["Langkah 1...", "Langkah 2..."],
  "analisis": "[Ringkasan Eksekutif]... [Analisis Utama]...",
  "rekomendasi": "Tindakan teknis spesifik",
  "skor": 85,
  "risiko": "Rendah",
  "status_label": "Sesuai"
}`,reasoning:`Effort: EXTREME (Deep Thinking Required)
Prioritas: Forensik Teknis > Kecepatan
Gunakan waktu berpikir optimal untuk mengevaluasi risiko kelaikan fungsi (SLF).`},r=`
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
</reasoning>`,i={active:!1,version:`1.0.0`,principles:n,system_instructions:r};async function a(){try{let{data:t,error:n}=await e.from(`agent_prompts`).select(`*`);return n?(console.error(`Error fetching all agent prompts:`,n),[]):t||[]}catch(e){return console.error(`Error in fetchAllAgentPrompts:`,e),[]}}async function o(t){try{let{data:n,error:r}=await e.from(`agent_prompts`).select(`*`).eq(`agent_id`,t).maybeSingle();return r?(console.error(`Error fetching agent prompt:`,r),null):n}catch(e){return console.error(`Error in fetchAgentPrompt:`,e),null}}async function s(t,n){let{data:r,error:i}=await e.from(`agent_prompts`).upsert({agent_id:t,...n,updated_at:new Date().toISOString()});if(i)throw console.error(`Error saving agent prompt:`,i),i;return r}function c(){let e=localStorage.getItem(t);if(!e)return i;try{return JSON.parse(e)}catch{return i}}function l(e,t){let n=e||r;return Object.keys(t).forEach(e=>{let r=RegExp(`{{${e}}}`,`g`);n=n.replace(r,t[e])}),n}export{c as a,a as i,r as n,l as o,o as r,s,n as t};