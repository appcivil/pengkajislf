/**
 * Infrastructure: SupabaseChatRepository
 * Implementasi IChatRepository menggunakan Supabase
 */
import { IChatRepository } from '../../domain/repositories/IChatRepository.js';
import { ChatSession } from '../../domain/entities/ChatSession.js';
import { ChatMessage } from '../../domain/entities/ChatMessage.js';
import { supabase } from '../../lib/supabase.js';

export class SupabaseChatRepository extends IChatRepository {
  constructor() {
    super();
    this.supabase = supabase;
  }

  /**
   * Simpan chat session
   */
  async saveSession(session) {
    const sessionData = typeof session.toJSON === 'function' ? session.toJSON() : session;

    // Get current user for RLS policy
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('chat_sessions')
      .upsert({
        id: sessionData.id,
        title: sessionData.title,
        messages: sessionData.messages,
        context: sessionData.context,
        project_id: sessionData.projectId,
        module_context: sessionData.moduleContext,
        settings: sessionData.settings,
        user_id: user?.id,
        created_at: sessionData.createdAt,
        updated_at: sessionData.updatedAt
      }, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseChatRepository] saveSession error:', error);
      throw new Error(`Gagal menyimpan session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[SupabaseChatRepository] getSession error:', error);
      throw new Error(`Gagal mengambil session: ${error.message}`);
    }

    if (!data) return null;

    return ChatSession.fromJSON({
      id: data.id,
      title: data.title,
      messages: data.messages || [],
      context: data.context || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      projectId: data.project_id,
      moduleContext: data.module_context,
      settings: data.settings || {}
    });
  }

  /**
   * Get semua sessions dengan filter
   */
  async getSessions({ projectId = null, moduleContext = null, limit = 20, offset = 0 } = {}) {
    let query = this.supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (moduleContext) {
      query = query.eq('module_context', moduleContext);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabaseChatRepository] getSessions error:', error);
      throw new Error(`Gagal mengambil sessions: ${error.message}`);
    }

    return (data || []).map(d => ChatSession.fromJSON({
      id: d.id,
      title: d.title,
      messages: d.messages || [],
      context: d.context || {},
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      projectId: d.project_id,
      moduleContext: d.module_context,
      settings: d.settings || {}
    }));
  }

  /**
   * Hapus session
   */
  async deleteSession(sessionId) {
    const { error } = await this.supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('[SupabaseChatRepository] deleteSession error:', error);
      throw new Error(`Gagal menghapus session: ${error.message}`);
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId, updates) {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseChatRepository] updateSession error:', error);
      throw new Error(`Gagal mengupdate session: ${error.message}`);
    }

    return data;
  }

  /**
   * Simpan message ke session
   */
  async saveMessage(sessionId, message) {
    // Messages disimpan dalam array di session, jadi update session
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} tidak ditemukan`);
    }

    session.addMessage(message);
    await this.saveSession(session);
  }

  /**
   * Get messages untuk session
   */
  async getMessages(sessionId, { limit = 50, offset = 0 } = {}) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} tidak ditemukan`);
    }

    const messages = session.messages || [];
    return messages
      .slice(offset, offset + limit)
      .map(m => ChatMessage.fromJSON(m));
  }

  /**
   * Search messages
   */
  async searchMessages(query, { projectId = null, limit = 20 } = {}) {
    // Search menggunakan Supabase text search
    let dbQuery = this.supabase
      .from('chat_sessions')
      .select('*');

    if (projectId) {
      dbQuery = dbQuery.eq('project_id', projectId);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('[SupabaseChatRepository] searchMessages error:', error);
      throw new Error(`Gagal mencari messages: ${error.message}`);
    }

    // Filter messages yang mengandung query
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const session of (data || [])) {
      const messages = session.messages || [];
      for (const msg of messages) {
        if (msg.content && msg.content.toLowerCase().includes(lowerQuery)) {
          results.push({
            message: ChatMessage.fromJSON(msg),
            sessionId: session.id,
            sessionTitle: session.title
          });
        }
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit = 10) {
    return this.getSessions({ limit });
  }

  /**
   * Get session count
   */
  async getSessionCount({ projectId = null, moduleContext = null } = {}) {
    let query = this.supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (moduleContext) {
      query = query.eq('module_context', moduleContext);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[SupabaseChatRepository] getSessionCount error:', error);
      return 0;
    }

    return count || 0;
  }
}
