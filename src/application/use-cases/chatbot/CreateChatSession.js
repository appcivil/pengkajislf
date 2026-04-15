/**
 * Use Case: CreateChatSession
 * Membuat session chat baru
 */
import { ChatSession } from '../../../domain/entities/ChatSession.js';

export class CreateChatSession {
  constructor(chatRepository) {
    this.chatRepository = chatRepository;
  }

  /**
   * Execute use case
   * @param {CreateSessionRequest} request
   * @returns {Promise<ChatSession>}
   */
  async execute(request) {
    // Create new session
    const session = new ChatSession({
      title: request.title,
      projectId: request.projectId,
      moduleContext: request.moduleContext,
      settings: {
        ...request.settings
      }
    });

    // Add system message untuk konteks
    const systemMessage = this._generateSystemMessage(session);
    if (systemMessage) {
      session.addMessage({
        role: 'system',
        content: systemMessage,
        timestamp: new Date().toISOString()
      });
    }

    // Save session
    await this.chatRepository.saveSession(session);

    return session;
  }

  /**
   * Generate system message berdasarkan context
   */
  _generateSystemMessage(session) {
    const parts = [
      'Anda adalah AI assistant untuk aplikasi Pengkajian SLF (Sertifikat Laik Fungsi).',
      'Anda dapat membantu pengguna dengan:',
      '- Menjawab pertanyaan tentang regulasi dan standar SLF',
      '- Menganalisis data pengkajian bangunan',
      '- Membuat laporan dan presentasi',
      '- Menghasilkan gambar ilustrasi teknis',
      '- Membuat file Excel untuk perhitungan',
      ''
    ];

    if (session.projectId) {
      parts.push(`Anda sedang berada dalam konteks project ID: ${session.projectId}.`);
      parts.push('Anda dapat mengakses data project ini untuk analisis dan rekomendasi.');
    }

    if (session.moduleContext) {
      parts.push(`Modul aktif: ${session.moduleContext}.`);
      parts.push('Anda dapat memberikan informasi spesifik tentang modul ini.');
    }

    parts.push('');
    parts.push('Gunakan bahasa Indonesia akademik dan teknis.');
    parts.push('Berdasarkan regulasi: Peraturan Menteri PUPR No. 2/PRT/M/2022 dan SNI terkait.');

    return parts.join('\n');
  }
}
