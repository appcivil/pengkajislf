/**
 * Infrastructure: SupabaseAIMemoryRepository
 * Implementasi IAIMemoryRepository menggunakan Supabase
 */
import { IAIMemoryRepository } from '../../domain/repositories/IAIMemoryRepository.js';
import { AIMemory } from '../../domain/entities/AIMemory.js';
import { supabase } from '../../lib/supabase.js';

export class SupabaseAIMemoryRepository extends IAIMemoryRepository {
  constructor() {
    super();
    this.supabase = supabase;
  }

  /**
   * Simpan memory
   */
  async save(memory) {
    const data = typeof memory.toJSON === 'function' ? memory.toJSON() : memory;
    
    const { data: result, error } = await this.supabase
      .from('ai_memories')
      .insert({
        id: data.id,
        user_id: data.userId,
        type: data.type,
        category: data.category,
        key: data.key,
        value: data.value,
        confidence: data.confidence,
        source_session_id: data.sourceSessionId,
        metadata: data.metadata,
        expires_at: data.expiresAt,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        access_count: data.accessCount,
        last_accessed_at: data.lastAccessedAt
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseAIMemoryRepository] save error:', error);
      throw new Error(`Gagal menyimpan memory: ${error.message}`);
    }

    return AIMemory.fromJSON(this._mapFromDB(result));
  }

  /**
   * Get memory by ID
   */
  async getById(id) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Gagal mengambil memory: ${error.message}`);
    }

    return data ? AIMemory.fromJSON(this._mapFromDB(data)) : null;
  }

  /**
   * Get memory by key
   */
  async getByKey(userId, key) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal mengambil memory: ${error.message}`);
    }

    return data ? AIMemory.fromJSON(this._mapFromDB(data)) : null;
  }

  /**
   * Query memories dengan filter
   */
  async query(query) {
    const filters = query.buildFilters();
    
    let dbQuery = this.supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', filters.userId)
      .gte('confidence', filters.minConfidence)
      .order('updated_at', { ascending: false });

    if (filters.types) {
      dbQuery = dbQuery.in('type', filters.types);
    }

    if (filters.categories) {
      dbQuery = dbQuery.in('category', filters.categories);
    }

    if (filters.keyPattern) {
      dbQuery = dbQuery.ilike('key', `%${filters.keyPattern}%`);
    }

    const { data, error } = await dbQuery.limit(query.limit);

    if (error) {
      throw new Error(`Gagal query memories: ${error.message}`);
    }

    return (data || []).map(d => AIMemory.fromJSON(this._mapFromDB(d)));
  }

  /**
   * Get relevant memories untuk context
   */
  async getRelevantForContext(userId, context, options = {}) {
    const { limit = 10, types = null } = options;

    let query = this.supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .gte('confidence', 0.5)
      .order('access_count', { ascending: false })
      .order('last_accessed_at', { ascending: false })
      .limit(limit * 2);

    if (types) {
      query = query.in('type', Array.isArray(types) ? types : [types]);
    }

    // Filter yang belum expired
    query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Gagal mengambil relevant memories: ${error.message}`);
    }

    // Calculate relevance dan sort
    const memories = (data || []).map(d => AIMemory.fromJSON(this._mapFromDB(d)));
    
    return memories
      .filter(m => m.isValid())
      .sort((a, b) => {
        const scoreA = a.getRelevanceScore() * a.confidence;
        const scoreB = b.getRelevanceScore() * b.confidence;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Update memory
   */
  async update(id, updates) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal update memory: ${error.message}`);
    }

    return AIMemory.fromJSON(this._mapFromDB(data));
  }

  /**
   * Delete memory
   */
  async delete(id) {
    const { error } = await this.supabase
      .from('ai_memories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Gagal menghapus memory: ${error.message}`);
    }
  }

  /**
   * Mark memory as accessed
   */
  async markAccessed(id) {
    const { error } = await this.supabase.rpc('increment_memory_access', {
      p_memory_id: id
    });

    if (error) {
      // Fallback: manual update
      const { error: updateError } = await this.supabase
        .from('ai_memories')
        .update({
          access_count: this.supabase.rpc('increment_access_count'),
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('[SupabaseAIMemoryRepository] markAccessed error:', updateError);
      }
    }
  }

  /**
   * Get user memory stats
   */
  async getUserStats(userId) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('type, category, confidence', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Gagal mengambil stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      byType: {},
      byCategory: {},
      avgConfidence: 0
    };

    let totalConfidence = 0;
    data.forEach(m => {
      stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
      stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      totalConfidence += m.confidence;
    });

    stats.avgConfidence = data.length > 0 ? totalConfidence / data.length : 0;

    return stats;
  }

  /**
   * Cleanup expired memories
   */
  async cleanupExpired(userId) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      throw new Error(`Gagal cleanup: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get memories by category
   */
  async getByCategory(userId, category) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .gte('confidence', 0.5)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Gagal mengambil memories: ${error.message}`);
    }

    return (data || []).map(d => AIMemory.fromJSON(this._mapFromDB(d)));
  }

  /**
   * Search memories dengan text
   */
  async search(userId, searchText, options = {}) {
    const { limit = 20 } = options;

    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .or(`key.ilike.%${searchText}%,value->>'text'.ilike.%${searchText}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Gagal search memories: ${error.message}`);
    }

    return (data || []).map(d => AIMemory.fromJSON(this._mapFromDB(d)));
  }

  /**
   * Batch save memories
   */
  async batchSave(memories) {
    if (memories.length === 0) return [];

    const dataToInsert = memories.map(m => {
      const data = typeof m.toJSON === 'function' ? m.toJSON() : m;
      return {
        id: data.id,
        user_id: data.userId,
        type: data.type,
        category: data.category,
        key: data.key,
        value: data.value,
        confidence: data.confidence,
        source_session_id: data.sourceSessionId,
        metadata: data.metadata,
        expires_at: data.expiresAt,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        access_count: data.accessCount,
        last_accessed_at: data.lastAccessedAt
      };
    });

    const { data, error } = await this.supabase
      .from('ai_memories')
      .insert(dataToInsert)
      .select();

    if (error) {
      console.error('[SupabaseAIMemoryRepository] batchSave error:', error);
      throw new Error(`Gagal batch save: ${error.message}`);
    }

    return (data || []).map(d => AIMemory.fromJSON(this._mapFromDB(d)));
  }

  /**
   * Map dari DB format ke entity format
   */
  _mapFromDB(dbRecord) {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      type: dbRecord.type,
      category: dbRecord.category,
      key: dbRecord.key,
      value: dbRecord.value,
      confidence: dbRecord.confidence,
      sourceSessionId: dbRecord.source_session_id,
      metadata: dbRecord.metadata,
      expiresAt: dbRecord.expires_at,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      accessCount: dbRecord.access_count,
      lastAccessedAt: dbRecord.last_accessed_at
    };
  }
}
