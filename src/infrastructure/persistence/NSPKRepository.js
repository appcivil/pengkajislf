// ============================================================
// NSPK REPOSITORY - RAG (Retrieval Augmented Generation) Support
// Repository untuk mengakses dan mengindeks regulasi teknik (NSPK)
// sebagai knowledge base untuk AI recommendations
// ============================================================

/**
 * NSPK Entry Structure
 * @typedef {Object} NSPKEntry
 * @property {string} id - Unique identifier
 * @property {string} category - Kategori (struktur, arsitektur, elektrikal, etc.)
 * @property {string} standard - Nama standar (SNI 1726:2019, PUIL 2020, etc.)
 * @property {string} title - Judul regulasi
 * @property {string} content - Isi regulasi/pasal
 * @property {string[]} keywords - Keywords untuk indexing
 * @property {string} relevance_score - Skor relevansi (computed)
 */

/**
 * Repository untuk mengelola knowledge base NSPK (Norma, Standar,
 * Pedoman, dan Kriteria) sebagai konteks RAG untuk AI analysis.
 * 
 * Implementasi lightweight RAG tanpa vector database eksternal,
 * menggunakan keyword matching dan relevance scoring.
 */
export class NSPKRepository {
  constructor() {
    // In-memory cache untuk NSPK entries
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 menit
    
    // Index untuk pencarian cepat
    this.keywordIndex = new Map();
    this.categoryIndex = new Map();
    
    // NSPK Data - Berdasarkan daftar_nspk.md
    this.nspkDatabase = this._initializeNSPKDatabase();
    
    // Build indexes
    this._buildIndexes();
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  _initializeNSPKDatabase() {
    return [
      // STRUKTUR
      {
        id: 'struktur-sni-1726-2019',
        category: 'struktur',
        standard: 'SNI 1726:2019',
        title: 'Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Non Gedung',
        content: 'Standar ini menetapkan kriteria perencanaan ketahanan gempa minimum untuk struktur bangunan gedung dan non gedung untuk menjaga keselamatan jiwa manusia.',
        keywords: ['gempa', 'ketahanan gempa', 'struktur', 'seismic', 'beban gempa', 'zona gempa', 'respon spektrum'],
        clauses: ['Pasal 4', 'Pasal 5', 'Pasal 6', 'Pasal 7'],
        priority: 'critical'
      },
      {
        id: 'struktur-sni-2847-2019',
        category: 'struktur',
        standard: 'SNI 2847:2019',
        title: 'Persyaratan Beton Struktural untuk Bangunan Gedung',
        content: 'Persyaratan perencanaan dan pelaksanaan beton struktural termasuk kuat tekan minimum, penulangan, dan detailing untuk ketahanan gempa.',
        keywords: ['beton', 'struktur beton', 'kuat tekan', 'fc', 'fy', 'penulangan', 'kolom', 'balok'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3'],
        priority: 'high'
      },
      {
        id: 'struktur-sni-1729-2020',
        category: 'struktur',
        standard: 'SNI 1729:2020',
        title: 'Spesifikasi untuk Bangunan Gedung Baja Struktural',
        content: 'Spesifikasi untuk perencanaan, fabrikasi, dan pemasangan baja struktural pada bangunan gedung.',
        keywords: ['baja', 'struktur baja', 'wf', 'h-beam', 'i-beam', 'sambungan', 'las', 'baut'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3', 'Pasal 4'],
        priority: 'high'
      },
      
      // ARSITEKTUR
      {
        id: 'arsitektur-permen-14-2017',
        category: 'arsitektur',
        standard: 'Permen PUPR No. 14/2017',
        title: 'Persyaratan Kemudahan Bangunan Gedung bagi Penyandang Disabilitas',
        content: 'Persyaratan minimum kemudahan bangunan gedung bagi penyandang disabilitas dan lanjut usia.',
        keywords: ['aksesibilitas', 'difabel', 'disabilitas', 'ram', 'tangga', 'lift', 'jalur', 'guiding block'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3', 'Pasal 4', 'Pasal 5'],
        priority: 'critical'
      },
      {
        id: 'arsitektur-permen-06-2006',
        category: 'arsitektur',
        standard: 'Permen PUPR No. 06/2006',
        title: 'Pedoman Teknis Pembangunan Bangunan Gedung',
        content: 'Pedoman teknis pembangunan bangunan gedung termasuk persyaratan arsitektural.',
        keywords: ['fasad', 'arsitektur', 'tampak', 'elevasi', 'ketinggian', 'setback'],
        clauses: ['Pasal 1', 'Pasal 2'],
        priority: 'medium'
      },
      
      // PROTEKSI KEBAKARAN
      {
        id: 'kebakaran-permen-26-2008',
        category: 'kebakaran',
        standard: 'Permen PUPR No. 26/PRT/M/2008',
        title: 'Pedoman Teknis Sistem Proteksi Kebakaran pada Bangunan Gedung',
        content: 'Persyaratan sistem proteksi kebakaran aktif dan pasif pada bangunan gedung.',
        keywords: ['kebakaran', 'apar', 'sprinkler', 'hydrant', 'alarm', 'smoke detector', 'proteksi', 'evakuasi'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3', 'Pasal 4'],
        priority: 'critical'
      },
      {
        id: 'kebakaran-sni-03-6572-2001',
        category: 'kebakaran',
        standard: 'SNI 03-6572-2001',
        title: 'Tata Cara Perencanaan dan Pengelolaan Proteksi Kebakaran',
        content: 'Tata cara perencanaan proteksi kebakaran termasuk klasifikasi bahaya dan persyaratan sistem.',
        keywords: ['kebakaran', 'kelas bahaya', 'fire rating', 'kompartemen', 'jarak aman'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3'],
        priority: 'high'
      },
      
      // PROTEKSI PETIR
      {
        id: 'petir-sni-2848-2020',
        category: 'petir',
        standard: 'SNI 2848:2020',
        title: 'Sistem Proteksi Petir Eksternal',
        content: 'Persyaratan sistem proteksi petir eksternal termasuk air terminal, down conductor, dan earth termination.',
        keywords: ['petir', 'lps', 'penangkal petir', 'grounding', 'down conductor', 'air terminal', 'resistansi'],
        clauses: ['Pasal 4', 'Pasal 5', 'Pasal 6'],
        priority: 'high'
      },
      
      // KELISTRIKAN
      {
        id: 'elektrikal-puil-2011',
        category: 'elektrikal',
        standard: 'PUIL 2011',
        title: 'Persyaratan Umum Instalasi Listrik',
        content: 'Pedoman umum instalasi listrik untuk keamanan dan keselamatan.',
        keywords: ['listrik', 'instalasi', 'panel', 'mcb', 'kabel', 'grounding', 'daya', 'kva'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3', 'Pasal 4', 'Pasal 5'],
        priority: 'critical'
      },
      {
        id: 'elektrikal-sni-03-7015-2004',
        category: 'elektrikal',
        standard: 'SNI 03-7015-2004',
        title: 'Tata Cara Pemasangan Penangkal Petir untuk Bangunan Gedung',
        content: 'Tata cara pemasangan sistem proteksi petir untuk bangunan gedung.',
        keywords: ['petir', 'instalasi petir', 'grounding', 'elektrode'],
        clauses: ['Pasal 1', 'Pasal 2'],
        priority: 'high'
      },
      
      // LINGKUNGAN DALAM (KENYAMANAN)
      {
        id: 'kenyamanan-sni-03-6197-2000',
        category: 'kenyamanan',
        standard: 'SNI 03-6197-2000',
        title: 'Tata Cara Perancangan Sistem Pencahayaan Alami pada Bangunan Gedung',
        content: 'Tata cara perancangan pencahayaan alami termasuk daylight factor dan penghawaan.',
        keywords: ['cahaya', 'pencahayaan', 'daylight factor', 'jendela', 'bukaan', 'lux'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3'],
        priority: 'medium'
      },
      {
        id: 'kenyamanan-sni-03-6572-2001',
        category: 'kenyamanan',
        standard: 'SNI 03-6572-2001',
        title: 'Tata Cara Perancangan Ventilasi dan Pengkondisian Udara',
        content: 'Tata cara perancangan sistem ventilasi dan AC untuk kenyamanan termal.',
        keywords: ['ventilasi', 'ac', 'suhu', 'kelembaban', 'pertukaran udara', 'ach'],
        clauses: ['Pasal 1', 'Pasal 2'],
        priority: 'medium'
      },
      
      // SANITASI
      {
        id: 'sanitasi-sni-8153-2015',
        category: 'sanitasi',
        standard: 'SNI 8153:2015',
        title: 'Sistem Plambing dan Sanitasi',
        content: 'Persyaratan sistem plambing dan sanitasi termasuk pipa, fixture, dan ventilasi.',
        keywords: ['plambing', 'pipa', 'air', 'sanitasi', 'wc', 'wastafel', 'ventilasi'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3'],
        priority: 'high'
      },
      
      // TATA RUANG
      {
        id: 'tataruang-permen-05-2008',
        category: 'tataruang',
        standard: 'Permen PUPR No. 05/2008',
        title: 'Pedoman Teknis Penyusunan Zonasi Daerah',
        content: 'Pedoman teknis penyusunan zonasi untuk pengendalian pemanfaatan ruang.',
        keywords: ['zonasi', 'rtrw', 'peruntukan', 'kdb', 'klb', 'gsb', 'kdh'],
        clauses: ['Pasal 1', 'Pasal 2'],
        priority: 'high'
      },
      
      // GEOTEKNIK
      {
        id: 'geoteknik-sni-8460-2017',
        category: 'geoteknik',
        standard: 'SNI 8460:2017',
        title: 'Persyaratan Perancangan Geoteknik',
        content: 'Persyaratan perancangan geoteknik untuk fondasi dan konstruksi bawah tanah.',
        keywords: ['tanah', 'fondasi', 'geoteknik', 'bore pile', 'strauss pile', 'daya dukung'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3'],
        priority: 'high'
      },
      
      // MKKG (Manajemen Keselamatan)
      {
        id: 'mkkg-permen-20-2009',
        category: 'mkkg',
        standard: 'Permen PUPR No. 20/2009',
        title: 'Pedoman Manajemen Keselamatan Kebakaran',
        content: 'Pedoman manajemen keselamatan kebakaran di gedung dan area umum.',
        keywords: ['mkkg', 'keselamatan', 'evakuasi', 'fire safety', 'petugas'],
        clauses: ['Pasal 1', 'Pasal 2'],
        priority: 'medium'
      },
      
      // ADMINISTRASI / SLF
      {
        id: 'admin-permen-27-2018',
        category: 'administrasi',
        standard: 'Permen PUPR No. 27/2018',
        title: 'Sertifikat Laik Fungsi Bangunan Gedung',
        content: 'Persyaratan dan tata cara penerbitan Sertifikat Laik Fungsi (SLF).',
        keywords: ['slf', 'sertifikat laik fungsi', 'izin', 'pengkajian', 'audit'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3', 'Pasal 4', 'Pasal 5', 'Pasal 6'],
        priority: 'critical'
      },
      
      // HUKUM
      {
        id: 'hukum-uu-28-2002',
        category: 'hukum',
        standard: 'UU No. 28/2002',
        title: 'Undang-Undang Bangunan Gedung',
        content: 'Ketentuan umum tentang bangunan gedung termasuk perizinan dan pengawasan.',
        keywords: ['bangunan gedung', 'izin', 'imb', 'pbg', 'slf', 'perizinan'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3', 'Pasal 4'],
        priority: 'critical'
      },
      
      // BENCANA
      {
        id: 'bencana-uu-24-2007',
        category: 'bencana',
        standard: 'UU No. 24/2007',
        title: 'Penanggulangan Bencana',
        content: 'Sistem penanggulangan bencana termasuk mitigasi dan kesiapsiagaan.',
        keywords: ['bencana', 'mitigasi', 'risiko', 'penanggulangan', 'siaga'],
        clauses: ['Pasal 1', 'Pasal 2', 'Pasal 3'],
        priority: 'high'
      }
    ];
  }

  _buildIndexes() {
    // Build keyword index
    this.nspkDatabase.forEach(entry => {
      entry.keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        if (!this.keywordIndex.has(normalizedKeyword)) {
          this.keywordIndex.set(normalizedKeyword, []);
        }
        this.keywordIndex.get(normalizedKeyword).push(entry.id);
      });
      
      // Index by category
      if (!this.categoryIndex.has(entry.category)) {
        this.categoryIndex.set(entry.category, []);
      }
      this.categoryIndex.get(entry.category).push(entry.id);
    });
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  /**
   * Search NSPK entries by keywords
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.limit - Max results
   * @param {string} options.category - Filter by category
   * @returns {NSPKEntry[]} Matching entries sorted by relevance
   */
  search(query, options = {}) {
    const { limit = 5, category = null, minRelevance = 0.3 } = options;
    
    if (!query || query.trim() === '') {
      return category 
        ? this.getByCategory(category).slice(0, limit)
        : this.nspkDatabase.slice(0, limit);
    }

    const queryTerms = query.toLowerCase().split(/\s+/);
    const scores = new Map();

    // Score based on keyword matching
    queryTerms.forEach(term => {
      // Exact keyword match
      if (this.keywordIndex.has(term)) {
        this.keywordIndex.get(term).forEach(id => {
          scores.set(id, (scores.get(id) || 0) + 1.0);
        });
      }
      
      // Partial keyword match
      this.keywordIndex.forEach((ids, keyword) => {
        if (keyword.includes(term) || term.includes(keyword)) {
          ids.forEach(id => {
            scores.set(id, (scores.get(id) || 0) + 0.5);
          });
        }
      });
    });

    // Filter and sort by relevance
    let results = Array.from(scores.entries())
      .filter(([_, score]) => score >= minRelevance)
      .map(([id, score]) => {
        const entry = this.nspkDatabase.find(e => e.id === id);
        return { ...entry, relevance_score: score };
      })
      .sort((a, b) => b.relevance_score - a.relevance_score);

    // Filter by category if specified
    if (category) {
      results = results.filter(r => r.category === category);
    }

    return results.slice(0, limit);
  }

  /**
   * Get NSPK entries by category
   * @param {string} category - Category name
   * @returns {NSPKEntry[]} Entries in category
   */
  getByCategory(category) {
    const ids = this.categoryIndex.get(category) || [];
    return ids.map(id => this.nspkDatabase.find(e => e.id === id)).filter(Boolean);
  }

  /**
   * Get relevant context for AI prompt based on inspection data
   * @param {string} moduleType - Type of inspection module
   * @param {Object} inspectionData - Current inspection data
   * @returns {string} Formatted context string for AI prompt
   */
  getContextForAI(moduleType, inspectionData = {}) {
    const categoryMap = {
      'struktur': 'struktur',
      'electrical': 'elektrikal',
      'lps': 'petir',
      'fire_protection': 'kebakaran',
      'architectural': 'arsitektur',
      'comfort': 'kenyamanan',
      'accessibility': 'arsitektur', // Also arsitektur
      'environmental': 'tataruang',
      'stormwater': 'sanitasi',
      'sanitation': 'sanitasi',
      'water_system': 'sanitasi',
      'wastewater': 'sanitasi',
      'building_intensity': 'tataruang',
      'egress': 'kebakaran', // Also fire safety
      'disaster': 'bencana',
      'kondisi': 'struktur'
    };

    const category = categoryMap[moduleType] || moduleType;
    const entries = this.getByCategory(category);
    
    if (entries.length === 0) {
      return '';
    }

    // Format context untuk prompt
    const contextEntries = entries
      .sort((a, b) => {
        const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3) // Ambil top 3 prioritas tinggi
      .map(entry => `### ${entry.standard}: ${entry.title}\n${entry.content}\nPasal terkait: ${entry.clauses.join(', ')}`)
      .join('\n\n');

    return `## REGULASI TEKNIS YANG RELEVAN:\n\n${contextEntries}`;
  }

  /**
   * Get all standards applicable for a building function
   * @param {string} buildingFunction - Fungsi bangunan (rumah sakit, kantor, etc.)
   * @returns {NSPKEntry[]} Applicable standards
   */
  getApplicableStandards(buildingFunction) {
    const functionKeywords = {
      'rumah sakit': ['keselamatan', 'evakuasi', 'aksesibilitas', 'listrik'],
      'kantor': ['kenyamanan', 'aksesibilitas', 'kebakaran'],
      'perhotelan': ['kebakaran', 'evakuasi', 'kenyamanan'],
      'perdagangan': ['kebakaran', 'aksesibilitas', 'parkir'],
      'pendidikan': ['aksesibilitas', 'kebakaran', 'kenyamanan'],
      'peribadatan': ['aksesibilitas', 'kebakaran', 'parkir']
    };

    const keywords = functionKeywords[buildingFunction?.toLowerCase()] || [];
    if (keywords.length === 0) {
      return this.nspkDatabase.filter(e => e.priority === 'critical');
    }

    const applicable = new Set();
    keywords.forEach(keyword => {
      const entries = this.search(keyword, { limit: 10 });
      entries.forEach(e => applicable.add(e.id));
    });

    return Array.from(applicable)
      .map(id => this.nspkDatabase.find(e => e.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // ============================================================
  // CACHE MANAGEMENT
  // ============================================================

  _getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  _setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache() {
    this.cache.clear();
  }

  // ============================================================
  // UTILITY
  // ============================================================

  getStats() {
    return {
      totalEntries: this.nspkDatabase.length,
      categories: Array.from(this.categoryIndex.keys()),
      keywordCount: this.keywordIndex.size,
      cacheSize: this.cache.size
    };
  }
}

// Singleton instance
export const nspkRepository = new NSPKRepository();

export default NSPKRepository;
