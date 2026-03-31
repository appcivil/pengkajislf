/**
 * SYNC DATA USE CASE
 * Mengatur proses pengiriman data dari cache lokal (IndexedDB) ke Supabase.
 */
export class SyncData {
  constructor(checklistRepo, notificationService) {
    this.checklistRepo = checklistRepo;
    this.notificationService = notificationService;
  }

  async execute() {
    try {
      const drafts = await this.checklistRepo.getPendingDrafts();
      if (drafts.length === 0) return { success: true, count: 0 };

      const payload = drafts.map(({ id, ...rest }) => ({
        ...rest,
        updated_at: new Date().toISOString()
      }));

      await this.checklistRepo.upsertMany(payload);
      await this.checklistRepo.clearSyncedDrafts(drafts.map(d => d.id));

      this.notificationService.notifySuccess(`Berhasil sinkronisasi ${drafts.length} data ke Cloud.`);
      return { success: true, count: drafts.length };
    } catch (err) {
      this.notificationService.notifyError('Gagal sinkronisasi: ' + err.message);
      throw err;
    }
  }
}
