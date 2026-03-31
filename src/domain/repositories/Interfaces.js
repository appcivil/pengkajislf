/**
 * ICHECKLIST REPOSITORY
 * Kontrak untuk operasi data checklist (Offline & Online).
 */
export class IChecklistRepository {
  async getPendingDrafts() { throw new Error('Not implemented'); }
  async clearSyncedDrafts(ids) { throw new Error('Not implemented'); }
  async upsertMany(items) { throw new Error('Not implemented'); }
}

/**
 * IFILE REPOSITORY
 * Kontrak untuk data berkas proyek.
 */
export class IFileRepository {
  async getById(id) { throw new Error('Not implemented'); }
  async update(id, data) { throw new Error('Not implemented'); }
  async getByProjectId(projectId) { throw new Error('Not implemented'); }
}

/**
 * IPROYEK REPOSITORY
 * Kontrak untuk data proyek.
 */
export class IProyekRepository {
  async getAll() { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async save(proyek) { throw new Error('Not implemented'); }
}

/**
 * IAUDIT LOGGER
 * Kontrak untuk pencatatan jejak audit (Audit Trail).
 */
export class IAuditLogger {
  async log(action, details, userId) { throw new Error('Not implemented'); }
}

/**
 * IAIService
 * Kontrak untuk layanan kecerdasan buatan.
 */
export class IAIService {
  async analyze(prompt, options = {}) { throw new Error('Not implemented'); }
}

/**
 * INOTIFICATION SERVICE
 * Kontrak untuk sistem notifikasi UI.
 */
export class INotificationService {
  notifySuccess(message) { throw new Error('Not implemented'); }
  notifyError(message) { throw new Error('Not implemented'); }
}
