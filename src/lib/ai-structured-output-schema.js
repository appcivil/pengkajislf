/**
 * AI STRUCTURED OUTPUT SCHEMA
 * Definisi JSON Schema untuk output AI yang konsisten dan valid
 * Sesuai dengan dokumentasi Groq dan best practices untuk output terstruktur
 *
 * @module lib/ai-structured-output-schema
 */

/**
 * Schema dasar untuk analisis checklist item
 */
export const CHECKLIST_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    kode: {
      type: 'string',
      description: 'Kode item checklist'
    },
    nama: {
      type: 'string',
      description: 'Nama parameter yang dinilai'
    },
    status: {
      type: 'string',
      enum: ['Sesuai', 'Tidak Sesuai', 'Kritis', 'Perlu Review'],
      description: 'Status kesesuaian terhadap standar'
    },
    kategori_temuan: {
      type: 'string',
      enum: ['Admin', 'Arsitektur', 'Struktur', 'MEP', 'Fire Safety', 'Unknown'],
      description: 'Kategori teknis temuan'
    },
    faktual: {
      type: 'string',
      description: 'Deskripsi temuan faktual di lapangan'
    },
    analisis: {
      type: 'string',
      description: 'Analisis teknis mendalam berdasarkan standar SNI/NSPK'
    },
    risiko: {
      type: 'string',
      enum: ['Rendah', 'Sedang', 'Tinggi', 'Kritis'],
      description: 'Level risiko temuan'
    },
    rekomendasi: {
      type: 'string',
      description: 'Rekomendasi tindakan perbaikan spesifik'
    },
    referensi_sni: {
      type: 'array',
      items: { type: 'string' },
      description: 'Daftar referensi SNI yang relevan'
    },
    skor_kesesuaian: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Skor kesesuaian dalam persen'
    },
    needs_manual_review: {
      type: 'boolean',
      description: 'Apakah perlu review manual oleh ahli'
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Confidence score AI (0-1)'
    },
    temuan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          jenis: { type: 'string' },
          lokasi: { type: 'string' },
          deskripsi: { type: 'string' },
          severity: { type: 'string', enum: ['minor', 'major', 'critical'] }
        },
        required: ['jenis', 'deskripsi']
      },
      description: 'Daftar temuan detail'
    }
  },
  required: ['kode', 'nama', 'status', 'faktual', 'analisis', 'risiko', 'rekomendasi', 'confidence']
};

/**
 * Schema untuk analisis dokumen
 */
export const DOCUMENT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    doc_id: { type: 'string' },
    kategori: {
      type: 'string',
      enum: ['Administrasi', 'Teknis', 'Perizinan', 'Gambar', 'Lainnya']
    },
    subkategori: { type: 'string' },
    completeness: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Persentase kelengkapan dokumen'
    },
    status: {
      type: 'string',
      enum: ['Lengkap', 'Tidak Lengkap', 'Draft', 'Perlu Review']
    },
    ai_summary: {
      type: 'string',
      description: 'Ringkasan analisis dokumen'
    },
    temuan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          jenis: { type: 'string', enum: ['kekurangan', 'ketidaksesuaian', 'rekomendasi'] },
          field: { type: 'string' },
          deskripsi: { type: 'string' },
          skor: { type: 'number', minimum: 0, maximum: 100 }
        },
        required: ['jenis', 'deskripsi']
      }
    },
    rekomendasi: {
      type: 'array',
      items: { type: 'string' }
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    needs_review: { type: 'boolean' },
    metadata: {
      type: 'object',
      properties: {
        halaman: { type: 'number' },
        tanggal_dokumen: { type: 'string' },
        nomor_dokumen: { type: 'string' },
        pemegang_izin: { type: 'string' }
      }
    }
  },
  required: ['doc_id', 'kategori', 'status', 'ai_summary', 'completeness', 'confidence']
};

/**
 * Schema untuk laporan evaluasi SLF
 */
export const SLF_EVALUATION_SCHEMA = {
  type: 'object',
  properties: {
    skor_total: {
      type: 'number',
      minimum: 0,
      maximum: 100
    },
    status_kelaikan: {
      type: 'string',
      enum: ['Laik Fungsi', 'Tidak Laik Fungsi', 'Perbaikan', 'Pending']
    },
    kategori_penilaian: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nama: { type: 'string' },
          skor: { type: 'number' },
          bobot: { type: 'number' },
          status: { type: 'string' },
          temuan_kritis: { type: 'number' }
        }
      }
    },
    narasi_kesimpulan: { type: 'string' },
    rekomendasi_utama: {
      type: 'array',
      items: { type: 'string' }
    },
    perbaikan_prioritas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          prioritas: { type: 'string', enum: ['rendah', 'sedang', 'tinggi', 'kritis'] },
          estimasi_waktu: { type: 'string' },
          estimasi_biaya: { type: 'string' }
        }
      }
    },
    risiko_kestabilan: {
      type: 'string',
      enum: ['aman', 'waspada', 'berbahaya']
    },
    periode_evaluasi: {
      type: 'string',
      description: 'Rekomendasi periode evaluasi ulang'
    }
  },
  required: ['skor_total', 'status_kelaikan', 'kategori_penilaian', 'narasi_kesimpulan']
};

/**
 * Schema untuk validasi teknis (rule-based)
 */
export const TECHNICAL_VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    valid: { type: 'boolean' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
          severity: { type: 'string', enum: ['error', 'warning', 'info'] },
          rule_id: { type: 'string' }
        }
      }
    },
    warnings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
          suggestion: { type: 'string' }
        }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        validation_timestamp: { type: 'string' },
        rules_checked: { type: 'number' },
        rules_passed: { type: 'number' },
        rules_failed: { type: 'number' }
      }
    }
  },
  required: ['valid', 'errors']
};

/**
 * Helper untuk generate prompt dengan schema constraint
 * Sesuai dengan dokumentasi Groq untuk structured outputs
 */
export function generateStructuredPrompt(basePrompt, schema, options = {}) {
  const schemaDescription = JSON.stringify(schema, null, 2);

  return {
    system: `Anda adalah sistem analisis teknis untuk Sertifikat Laik Fungsi (SLF) bangunan gedung.

ATURAN PENTING:
1. Output HARUS berupa JSON VALID yang mengikuti schema berikut
2. Jangan tambahkan teks di luar JSON
3. Gunakan Bahasa Indonesia teknis dan formal
4. Semua field wajib diisi sesuai definisi schema
5. Confidence score harus realistis (0.0-1.0)

JSON SCHEMA:
\`\`\`json
${schemaDescription}
\`\`\``,

    instructions: options.instructions || basePrompt,

    context: options.context || '',

    input: options.input || '',

    response_format: {
      type: 'json_schema',
      json_schema: schema
    }
  };
}

/**
 * Validator untuk memastikan output AI sesuai schema
 */
export function validateStructuredOutput(output, schema) {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in output)) {
        errors.push({
          field,
          message: `Field wajib '${field}' tidak ditemukan`,
          severity: 'error'
        });
      }
    }
  }

  // Validate types
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      if (key in output) {
        const fieldValue = output[key];

        // Type checking
        if (value.type === 'string' && typeof fieldValue !== 'string') {
          errors.push({ field: key, message: `Field '${key}' harus string`, severity: 'error' });
        }
        if (value.type === 'number' && typeof fieldValue !== 'number') {
          errors.push({ field: key, message: `Field '${key}' harus number`, severity: 'error' });
        }
        if (value.type === 'boolean' && typeof fieldValue !== 'boolean') {
          errors.push({ field: key, message: `Field '${key}' harus boolean`, severity: 'error' });
        }
        if (value.type === 'array' && !Array.isArray(fieldValue)) {
          errors.push({ field: key, message: `Field '${key}' harus array`, severity: 'error' });
        }
        if (value.type === 'object' && typeof fieldValue !== 'object') {
          errors.push({ field: key, message: `Field '${key}' harus object`, severity: 'error' });
        }

        // Enum checking
        if (value.enum && !value.enum.includes(fieldValue)) {
          errors.push({
            field: key,
            message: `Field '${key}' harus salah satu dari: ${value.enum.join(', ')}`,
            severity: 'error'
          });
        }

        // Range checking for numbers
        if (value.type === 'number') {
          if (value.minimum !== undefined && fieldValue < value.minimum) {
            errors.push({
              field: key,
              message: `Field '${key}' minimal ${value.minimum}`,
              severity: 'error'
            });
          }
          if (value.maximum !== undefined && fieldValue > value.maximum) {
            errors.push({
              field: key,
              message: `Field '${key}' maksimal ${value.maximum}`,
              severity: 'error'
            });
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    output
  };
}

/**
 * Parser untuk output AI yang mungkin tidak pure JSON
 */
export function parseAIOutput(rawOutput, schema) {
  try {
    // Try direct parse
    if (typeof rawOutput === 'string') {
      // Extract JSON from markdown code blocks
      const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try parsing the whole string
      return JSON.parse(rawOutput);
    }

    return rawOutput;
  } catch (error) {
    console.warn('[StructuredOutput] Parse error:', error.message);
    return null;
  }
}

/**
 * Safe wrapper untuk AI calls dengan structured output
 */
export async function callAIWithStructuredOutput(aiCallFn, schema, options = {}) {
  const maxRetries = options.maxRetries || 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const rawOutput = await aiCallFn();
      const parsedOutput = parseAIOutput(rawOutput, schema);

      if (!parsedOutput) {
        throw new Error('Failed to parse AI output as JSON');
      }

      const validation = validateStructuredOutput(parsedOutput, schema);

      if (validation.valid) {
        return {
          success: true,
          data: parsedOutput,
          raw: rawOutput,
          attempt
        };
      }

      // If validation fails but we have retries left, try again with stronger prompt
      if (attempt < maxRetries) {
        console.warn(`[StructuredOutput] Validation failed, retrying...`, validation.errors);
        continue;
      }

      // Last attempt: return with validation errors
      return {
        success: false,
        data: parsedOutput,
        raw: rawOutput,
        validationErrors: validation.errors,
        attempt
      };

    } catch (error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error.message,
          attempt
        };
      }
    }
  }
}

export default {
  CHECKLIST_ANALYSIS_SCHEMA,
  DOCUMENT_ANALYSIS_SCHEMA,
  SLF_EVALUATION_SCHEMA,
  TECHNICAL_VALIDATION_SCHEMA,
  generateStructuredPrompt,
  validateStructuredOutput,
  parseAIOutput,
  callAIWithStructuredOutput
};
