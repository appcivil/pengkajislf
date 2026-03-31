import { PROYEK_AI_TEMPLATES } from '../ai-templates/ProyekAI.js';

/**
 * ANALISIS DOKUMEN AI USE CASE
 * Mengatur alur kerja analisis kecerdasan buatan untuk sebuah berkas.
 */
export class AnalisisDokumenAI {
  constructor(fileRepo, aiService, notificationService, auditLogger) {
    this.fileRepo = fileRepo;
    this.aiService = aiService;
    this.notificationService = notificationService;
    this.auditLogger = auditLogger;
  }

  async execute(fileId, userId = 'system') {
    try {
      // 1. Ambil data berkas
      const berkas = await this.fileRepo.getById(fileId);
      if (!berkas) throw new Error('Berkas tidak ditemukan');

      // 2. Siapkan Prompt
      const prompt = PROYEK_AI_TEMPLATES.DOCUMENT_ANALYSIS(berkas.nama, berkas.kategori);

      // 3. Jalankan Analisis AI
      this.notificationService.notifySuccess(`Menganalisis berkas: ${berkas.nama}...`);
      const aiResult = await this.aiService.analyze(prompt);

      // 4. Siapkan Data Update
      const updateData = {
        ai_status: 'Analyzed',
        category: aiResult.category || berkas.kategori,
        subcategory: aiResult.subcategory || berkas.subkategori,
        ai_summary: aiResult.ai_summary,
        completeness: aiResult.completeness || 0,
        status: aiResult.status || 'Draft',
        metadata: {
          ...berkas.metadata,
          ai_last_run: new Date().toISOString(),
          provider: 'CleanArch-AI-Engine'
        }
      };

      // 5. Simpan Hasil
      await this.fileRepo.update(fileId, updateData);

      // 6. Catat Log Audit
      await this.auditLogger.log('AI_ANALYSIS', { 
        fileId: fileId, 
        fileName: berkas.nama,
        category: updateData.category 
      }, userId);
      
      this.notificationService.notifySuccess(`Analisis ${berkas.nama} selesai.`);
      return { success: true, data: updateData };
    } catch (err) {
      this.notificationService.notifyError(`Gagal analisis AI: ${err.message}`);
      throw err;
    }
  }
}
