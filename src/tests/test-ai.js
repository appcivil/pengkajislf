/**
 * TEST AI ANALYSIS (Unit Test - Mock)
 * Verifikasi logika AnalisisDokumenAI Use Case.
 */
import { AnalisisDokumenAI } from '../application/use-cases/AnalisisDokumenAI.js';
import { PROYEK_AI_TEMPLATES } from '../application/ai-templates/ProyekAI.js';

// 1. Mock Implementations
class MockFileRepository {
  async getById(id) {
    return {
      id,
      nama: 'IMB_Gedung_A.pdf',
      kategori: 'umum',
      metadata: { version: 1 }
    };
  }
  async update(id, data) {
    console.log(`[Mock Repo] Updating file ${id} with:`, data);
    return true;
  }
}

class MockAIService {
  async analyze(prompt) {
    console.log("[Mock AI] Input Prompt: ", prompt.substring(0, 100) + "...");
    return {
      category: 'arsitektur',
      subcategory: 'IMB',
      ai_summary: 'Dokumen IMB Gedung A terdeteksi valid.',
      completeness: 100,
      status: 'Final'
    };
  }
}

class MockNotificationService {
  notifySuccess(msg) { console.log("[Mock Notify] SUCCESS:", msg); }
  notifyError(msg) { console.error("[Mock Notify] ERROR:", msg); }
}

class MockAuditLogger {
  async log(action, details) {
    console.log(`[Mock Audit] Action: ${action}`, details);
  }
}

// 2. Test Execution
async function runTest() {
  console.log("=== MEMULAI TEST ANALISIS AI (CLEAN ARCH) ===");
  
  const fileRepo = new MockFileRepository();
  const aiService = new MockAIService();
  const notify = new MockNotificationService();
  const audit = new MockAuditLogger();

  const useCase = new AnalisisDokumenAI(fileRepo, aiService, notify, audit);

  const result = await useCase.execute('test-file-123');
  
  console.log("=== TEST SELESAI ===");
  console.log("Hasil Akhir:", result);
}

// Jalankan jika di lingkup browser/node
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
    runTest().catch(console.error);
}
