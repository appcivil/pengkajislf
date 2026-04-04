# Deep Reasoning Engineering Documentation

## 📋 Overview

**Deep Reasoning Engineering** adalah sistem AI tingkat lanjut untuk aplikasi Smart AI Pengkaji SLF yang menggabungkan:

- ✅ **Rules Engine**: Validasi berdasarkan regulasi bangunan gedung Indonesia
- 🔄 **Workflows**: Alur kerja otomatis untuk berbagai jenis analisis
- 🪝 **Hooks**: Event-driven hooks untuk pre/post processing
- 🎯 **Skills**: Kapabilitas khusus untuk analisis forensik dan engineering

## 🎯 Fitur Utama

### 1. Rules Engine
Memuat dan memvalidasi berdasarkan regulasi:
- Undang-Undang (UU 28/2002, UU 02/2017, UU 06/2017, UU 11/2020, dll)
- Peraturan Pemerintah (PP 6/2021, PP 14/2021, PP 15/2021, PP 16/2021)
- Peraturan Menteri PUPR (26 regulasi teknis)
- Standar Nasional Indonesia (SNI Arsitektur, Struktur, MEP)
- Aturan terkait lainnya (KLHK, ESDM, Kesehatan, dll)

### 2. Workflow Engine
Alur kerja untuk:
- Checklist analysis
- Aspect analysis
- Comparative audit
- Consensus analysis
- Document validation

### 3. Hook System
Pre dan post processing hooks:
- `beforeAnalysis`: Sebelum analisis dimulai
- `afterAnalysis`: Setelah analisis selesai
- `beforeConsensus`: Sebelum multi-agent consensus
- `afterConsensus`: Setelah consensus selesai

### 4. Skill Registry
Kapabilitas khusus:
- **forensic_analysis**: Analisis forensik kegagalan bangunan
- **regulatory_validation**: Validasi regulasi
- **comparative_audit**: Audit komparatif dokumen
- **risk_assessment**: Penilaian risiko
- **recommendation_engine**: Mesin rekomendasi perbaikan
- **ocr_enhancement**: OCR dengan validasi regulasi
- **structure_analysis**: Analisis struktur khusus
- **mep_analysis**: Analisis MEP khusus

## 📁 Struktur File

```
src/infrastructure/ai/
├── deep-reasoning-engine.js          # Core engine utama
├── deep-reasoning-rules.js           # Definisi aturan regulasi
├── deep-reasoning-workflows.js       # Definisi workflows
├── deep-reasoning-hooks.js           # Definisi hooks
├── deep-reasoning-skills.js          # Definisi skills
├── deep-reasoning-integration.js     # Integration layer
├── example-usage.js                  # Contoh implementasi
└── README_DEEP_REASONING.md          # Dokumentasi ini
```

## 🚀 Quick Start

### 1. Inisialisasi Sistem

```javascript
import { initializeSmartAIIntegration } from './src/infrastructure/ai/deep-reasoning-integration.js';

// Panggil saat aplikasi dimuat
await initializeSmartAIIntegration();
```

### 2. Analisis Checklist dengan Deep Reasoning

```javascript
import { getSmartAIIntegration } from './src/infrastructure/ai/deep-reasoning-integration.js';

const integration = getSmartAIIntegration();

const filesData = [
  {
    base64: 'base64_encoded_image',
    mimeType: 'image/jpeg'
  }
];

const result = await integration.analyzeWithDeepReasoning(
  filesData,
  'Kolom Beton',
  'teknis',
  'struktur'
);

// Hasil akan mencakup:
// - status, catatan, rekomendasi (AI Vision)
// - reasoning_steps (Deep Reasoning)
// - legal_references (Referensi regulasi)
console.log(result);
```

### 3. Analisis Aspek dengan Deep Reasoning

```javascript
const items = [
  { kode: 'STR-001', nama: 'Kolom', status: 'tidak_sesuai', catatan: 'Retak' },
  { kode: 'STR-002', nama: 'Balok', status: 'sesuai', catatan: 'Baik' }
];

const result = await integration.runAspectAnalysisWithDeepReasoning(
  'struktur',
  items,
  (current, total, message) => console.log(`${current}/${total}: ${message}`)
);

// Hasil: skor_aspek, narasi_teknis, rekomendasi, meta
console.log(result);
```

### 4. Multi-Agent Analysis

```javascript
// Jalankan semua agents (Arsitek, Struktur, MEP, Legal)
const result = await integration.runMultiAgentWithDeepReasoning(proyekId);

// Hasil:
// - agentResults: Hasil dari setiap agent
// - consensusResult: Bab V & VI, status final, risk score
// - enhancedAnalysis: Analisis tambahan Deep Reasoning
console.log(result);
```

### 5. Query Regulasi

```javascript
// Cari regulasi berdasarkan keyword
const result = integration.queryRegulation('SNI 2847');
console.log(result);

// Dapatkan semua aturan untuk kategori
const rules = integration.getRulesForCategory('sni_struktur');
console.log(rules);
```

## 📖 API Reference

### SmartAIIntegration

#### Methods

##### `initialize()`
Inisialisasi sistem (load rules, workflows, hooks, skills)

```javascript
await integration.initialize();
```

##### `analyzeWithDeepReasoning(filesData, componentName, kategori, aspek)`
Analisis checklist gambar dengan Deep Reasoning

**Parameters:**
- `filesData`: Array<{base64: string, mimeType: string}>
- `componentName`: string (nama komponen)
- `kategori`: string ('teknis' | 'administrasi')
- `aspek`: string (opsional, nama aspek)

**Returns:** Promise<{status, catatan, rekomendasi, reasoning_steps, legal_references, deep_reasoning_enabled}>

##### `analyzeDocumentWithDeepReasoning(fileData)`
Analisis dokumen dengan validasi regulasi

**Parameters:**
- `fileData`: {base64: string, mimeType: string}

**Returns:** Promise<{category, subcategory, extracted_text, metadata, regulation_validated, deep_reasoning_enabled}>

##### `analyzeComparativeWithDeepReasoning(filesData, itemName, itemKode, context)`
Analisis komparatif dokumen

**Parameters:**
- `filesData`: Array<{base64: string, mimeType: string}>
- `itemName`: string
- `itemKode`: string
- `context`: string (opsional)

**Returns:** Promise<{status, catatan, comparative_analysis, deep_reasoning_enabled}>

##### `runAspectAnalysisWithDeepReasoning(aspek, items, onProgress, options)`
Analisis aspek komprehensif

**Parameters:**
- `aspek`: string (nama aspek)
- `items`: Array<{kode, nama, status, catatan, metadata}>
- `onProgress`: Function(current, total, message)
- `options`: Object (opsional)

**Returns:** Promise<{skor_aspek, narasi_teknis, rekomendasi, meta}>

##### `runMultiAgentWithDeepReasoning(proyekId, agentIds)`
Multi-agent analysis

**Parameters:**
- `proyekId`: string
- `agentIds`: Array<string> (opsional, jika tidak diisi semua agent akan dijalankan)

**Returns:** Promise<{agentResults, consensusResult, enhancedAnalysis}>

##### `runOCRWithDeepReasoning(base64Data, mimeType)`
OCR dengan validasi regulasi

**Parameters:**
- `base64Data`: string
- `mimeTyp

e`: string

**Returns:** Promise<{nama_bangunan, pemilik, luas_bangunan, rule_validation, ...}>

##### `getConsensusWithDeepReasoning(checklist, proyek, analisisSummary)`
Multi-agent consensus dengan Deep Reasoning

**Parameters:**
- `checklist`: Array
- `proyek`: Object
- `analisisSummary`: Object

**Returns:** Promise<{bab5_analisis, bab6_kesimpulan, status_final, risk_score, enhanced_consensus}>

##### `queryRegulation(query)`
Query aturan regulasi

**Parameters:**
- `query`: string (keyword pencarian)

**Returns:** {category, rule} | null

##### `getRulesForCategory(category)`
Dapatkan semua aturan untuk kategori

**Parameters:**
- `category`: string ('undang_undang', 'peraturan_pemerintah', 'peraturan_menteri', 'sni_arsitektur', 'sni_struktur', 'sni_mep', 'aturan_lainnya')

**Returns:** Array

##### `getSkillInfo(skillName)`
Dapatkan info skill

**Parameters:**
- `skillName`: string

**Returns**: {name, description, capability, complexity, execution_time, ...}

##### `getAllSkills()`
Dapatkan semua skill yang tersedia

**Returns:** Array<{name, description, capability, complexity, execution_time, ...}>

##### `getAllWorkflows()`
Dapatkan semua workflow yang tersedia

**Returns:** Object

## 🔧 Configuration

### Environment Variables

Tidak ada environment variable khusus yang diperlukan untuk Deep Reasoning. Sistem menggunakan environment yang sudah ada:

- `VITE_GEMINI_API_KEY` - Untuk Gemini API
- `VITE_OPENAI_API_KEY` - Untuk OpenAI API
- `VITE_CLAUDE_API_KEY` - Untuk Claude API
- `VITE_HF_API_TOKEN` - Untuk Hugging Face API

## 🎨 Implementation in Components

### React Component Example

```jsx
import { useState } from 'react';
import { getSmartAIIntegration } from '../infrastructure/ai/deep-reasoning-integration.js';

function ChecklistAnalysis({ filesData, componentName, kategori, aspek }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const integration = getSmartAIIntegration();
      const analysisResult = await integration.analyzeWithDeepReasoning(
        filesData,
        componentName,
        kategori,
        aspek
      );
      
      setResult(analysisResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Menganalisis...' : 'Analisis dengan Deep Reasoning'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result">
          <h3>Hasil Analisis</h3>
          <p>Status: {result.status}</p>
          <p>Catatan: {result.catatan}</p>
          
          {result.deep_reasoning_enabled && (
            <div className="deep-reasoning">
              <h4>Deep Reasoning Analysis</h4>
              <ul>
                {result.reasoning_steps?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
              
              <h4>Referensi Regulasi</h4>
              <ul>
                {result.legal_references?.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 🔄 Integration with Existing System

Deep Reasoning Engineering dirancang untuk **non-breaking integration** dengan sistem yang sudah ada:

1. **Optional Enhancement**: Sistem akan otomatis fallback ke sistem lama jika Deep Reasoning gagal
2. **Backward Compatible**: Semua fungsi AI yang sudah ada tetap berfungsi
3. **Automatic Enhancement**: Hasil AI Vision otomatis di-enhance dengan Deep Reasoning

### Flow Diagram

```
User Request
    ↓
AI Vision (Gemini/OpenAI/Claude)
    ↓
Deep Reasoning Engine (Optional)
    ↓
Rule Validation
    ↓
Enhanced Result (AI + Deep Reasoning)
    ↓
Fallback (if Deep Reasoning fails)
    ↓
Final Result
```

## 📊 Data Structures

### Analysis Result

```javascript
{
  // Dari AI Vision
  status: "baik|sedang|buruk|kritis",
  catatan: "Deskripsi teknis",
  rekomendasi: "Saran perbaikan",
  
  // Dari Deep Reasoning
  reasoning_steps: [
    "Langkah penalaran 1",
    "Langkah penalaran 2",
    "..."
  ],
  legal_references: [
    "UU 28/2002 Pasal 23",
    "SNI 2847:2019 Bab 4",
    "..."
  ],
  
  // Metadata
  deep_reasoning_enabled: true,
  provider: "gemini",
  timestamp: "2026-04-01T09:18:00Z"
}
```

### Aspect Analysis Result

```javascript
{
  skor_aspek: 85,
  narasi_teknis: "Laporan teknis lengkap...",
  rekomendasi: [
    "Rekomendasi 1",
    "Rekomendasi 2",
    "..."
  ],
  meta: {
    provider: "gemini",
    kategori: "teknis",
    risk_highlights: ["Risiko 1", "Risiko 2"],
    total_items: 10,
    items_baik: 7,
    items_sedang: 2,
    items_buruk: 1
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Deep Reasoning tidak terinisialisasi
**Problem**: Fungsi Deep Reasoning tidak berjalan

**Solution**: Pastikan `initializeSmartAIIntegration()` dipanggil saat aplikasi dimuat

```javascript
// Di main.js
import { initializeSmartAIIntegration } from './src/infrastructure/ai/deep-reasoning-integration.js';

await initializeSmartAIIntegration();
```

#### 2. Rules tidak terload
**Problem**: `getRulesForCategory()` mengembalikan array kosong

**Solution**: Cek file `deep-reasoning-rules.js` dan pastikan tidak ada error saat import

#### 3. Performance lambat
**Problem**: Analisis memakan waktu lama

**Solution**: 
- Deep Reasoning menambahkan 1-2 detik per analisis
- Gunakan caching untuk hasil yang sering digunakan
- Pertimbangkan untuk men-disable Deep Reasoning untuk production jika tidak diperlukan

## 📝 Best Practices

### 1. Inisialisasi
Inisialisasi sistem sekali saat aplikasi dimuat, tidak perlu dipanggil berulang kali

### 2. Error Handling
Selalu gunakan try-catch dan fallback ke sistem lama

```javascript
try {
  const result = await integration.analyzeWithDeepReasoning(...);
  return result;
} catch (error) {
  // Fallback ke sistem lama
  const fallbackResult = await analyzeChecklistImage(...);
  return fallbackResult;
}
```

### 3. Progress Tracking
Gunakan callback `onProgress` untuk menampilkan progress ke user

```javascript
const onProgress = (current, total, message) => {
  console.log(`Progress: ${current}/${total} - ${message}`);
  updateProgressBar(current, total);
};
```

### 4. Caching
Cache hasil yang sering digunakan untuk mengurangi API calls

## 🔮 Future Enhancements

- [ ] Machine Learning untuk learning dari hasil analisis
- [ ] Custom rules configuration dari database
- [ ] Real-time rule updates
- [ ] Advanced skill registry dengan dynamic loading
- [ ] Performance optimization dengan caching
- [ ] Rule builder UI untuk user-defined rules
- [ ] Integration dengan external compliance databases

## 📚 Additional Resources

- [Example Usage](./example-usage.js) - Contoh implementasi lengkap
- [Rules Definition](./deep-reasoning-rules.js) - Definisi aturan regulasi
- [Workflows Definition](./deep-reasoning-workflows.js) - Definisi workflows
- [Hooks Definition](./deep-reasoning-hooks.js) - Definisi hooks
- [Skills Definition](./deep-reasoning-skills.js) - Definisi skills

## 🤝 Contributing

Untuk menambahkan regulasi baru:

1. Update file `deep-reasoning-rules.js`
2. Tambahkan ke kategori yang sesuai
3. Update dokumentasi ini

Untuk menambahkan workflow baru:

1. Update file `deep-reasoning-workflows.js`
2. Register workflow di `createWorkflows()`
3. Update dokumentasi ini

Untuk menambahkan skill baru:

1. Update file `deep-reasoning-skills.js`
2. Register skill di `createSkills()`
3. Update dokumentasi ini

## 📄 License

Proprietary - Smart AI Pengkaji SLF

## 📞 Support

Untuk pertanyaan atau issues, hubungi tim development Smart AI Pengkaji SLF.