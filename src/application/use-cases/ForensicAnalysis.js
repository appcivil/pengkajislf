import { PROYEK_AI_TEMPLATES } from '../ai-templates/ProyekAI.js';
import { getSmartAIIntegration } from '../../infrastructure/ai/deep-reasoning-integration.js';

/**
 * FORENSIC ANALYSIS USE CASE
 * Menjalankan analisis mendalam 6-langkah untuk sebuah item checklist.
 */
export class ForensicAnalysis {
  constructor(checklistRepo, fileRepo, notificationService, auditLogger) {
    this.checklistRepo = checklistRepo;
    this.fileRepo = fileRepo;
    this.notificationService = notificationService;
    this.auditLogger = auditLogger;
    this.integration = getSmartAIIntegration();
  }

  /**
   * Eksekusi analisis forensik untuk satu item
   */
  async execute(itemId, userId = 'system') {
    try {
      // 1. Ambil data item
      const item = await this.checklistRepo.getById(itemId);
      if (!item) throw new Error('Item checklist tidak ditemukan');

      // 2. Ambil bukti terkait (Foto Lapangan & NSPK)
      const allFiles = await this.fileRepo.getByProjectId(item.proyek_id);
      const relevantEvidence = allFiles.filter(f => 
        (f.kategori === 'lapangan' || f.kategori === 'nspk' || f.kategori === item.kategori) &&
        (f.nama.toLowerCase().includes(item.nama.toLowerCase()) || item.kategori === f.kategori)
      ).map(f => ({
        id: f.id,
        name: f.nama,
        category: f.kategori,
        url: f.file_url 
      }));

      // 3. Jalankan Deep Reasoning via Integration Engine
      this.notificationService.notifySuccess(`Menjalankan audit forensik: ${item.nama}...`);
      
      const enhancedResult = await this.integration.analyzeWithDeepReasoning(item, item.aspek, {
        evidence: relevantEvidence
      });

      // 4. Transformasi hasil ke format metadata yang diinginkan
      const deepReasoningData = {
        ...enhancedResult.deepReasoning,
        faktual: enhancedResult.step_1 || item.hasil,
        interpretasi: enhancedResult.step_2,
        analisis: enhancedResult.step_3,
        risiko: enhancedResult.step_4,
        kesimpulan: enhancedResult.step_5,
        rekomendasi: enhancedResult.step_6,
        evidence_ref: enhancedResult.evidence_ref,
        regulation_ref: enhancedResult.regulation_ref,
        last_run: new Date().toISOString()
      };

      // 5. Update Checklist Item
      await this.checklistRepo.update(itemId, {
        metadata: {
          ...item.metadata,
          deep_reasoning: deepReasoningData
        }
      });

      // 6. Log Audit
      await this.auditLogger.log('FORENSIC_ANALYSIS', {
        itemId,
        itemName: item.nama,
        status: item.status
      }, userId);

      return { success: true, data: deepReasoningData };
    } catch (err) {
      console.error('[ForensicAnalysis] Error:', err);
      this.notificationService.notifyError(`Gagal analisis forensik: ${err.message}`);
      throw err;
    }
  }

  /**
   * Eksekusi analisis untuk semua item temuan (status !== Sesuai) dalam satu proyek
   */
  async executeForProject(proyekId, onProgress = () => {}) {
    // Implementasi batch jika diperlukan
  }
}
