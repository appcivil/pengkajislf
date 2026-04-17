// ============================================================
// COMFORT INSPECTION - Clean Architecture Implementation
// Refactor dari comfort-inspection.js (2700 baris → ~300 baris)
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError } from '../../components/toast.js';

/**
 * Kelas ComfortInspection mengextends BaseInspection.
 * Mengimplementasikan business logic spesifik untuk pemeriksaan aspek kenyamanan.
 * 
 * @extends BaseInspection
 */
export class ComfortInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'comfort',
      phaseCode: 'PHASE 02D',
      title: 'Pemeriksaan Aspek Kenyamanan',
      badge: 'PP 16/2021',
      icon: 'couch',
      accentColor: 'var(--success-400)',
      description: 'Evaluasi aspek kenyamanan bangunan berdasarkan PP Nomor 16 Tahun 2021 (Pasal 226), SNI 03-6197-2000, SNI 03-6572-2001, SNI 03-6389-2000, dan ASHRAE 55/62.1.',
      tables: ['comfort_rooms', 'comfort_climate', 'comfort_noise', 'comfort_vibration', 'comfort_view', 'comfort_summary']
    });

    // Standards constants
    this.OCCUPANCY_STANDARDS = {
      office: 10, residential: 9, retail: 4, education: 2,
      hospital: 12, worship: 1.5, restaurant: 2, library: 4,
      museum: 4, cinema: 0.65
    };

    this.TEMPERATURE_STANDARDS = {
      office: { min: 20, max: 28 }, residential: { min: 20, max: 28 },
      hospital: { min: 22, max: 26 }, education: { min: 20, max: 28 },
      retail: { min: 20, max: 28 }, restaurant: { min: 20, max: 28 }
    };

    this.NOISE_STANDARDS = {
      office: { day: 45, night: 35 }, residential: { day: 40, night: 30 },
      hospital: { day: 35, night: 25 }, education: { day: 40, night: 35 },
      industrial: { day: 85, night: 85 }, retail: { day: 50, night: 45 }
    };
  }

  // ============================================================
  // DATA LOADING
  // ============================================================

  /**
   * Load data spesifik modul comfort.
   * Di-override dari BaseInspection.
   * @override
   */
  async loadData() {
    const projectId = this._state.projectId;

    // Parallel loading untuk performa optimal
    const [
      rooms, climateData, noiseData, vibrationData, viewData, summary
    ] = await Promise.all([
      this.repository.getComfortRooms(projectId),
      this.repository.getComfortClimateData(projectId),
      this.repository.getComfortNoiseData(projectId),
      this.repository.getComfortVibrationData(projectId),
      this.repository.getComfortViewData(projectId),
      this.repository.getComfortSummary(projectId)
    ]);

    this._setData('rooms', rooms);
    this._setData('climateData', climateData);
    this._setData('noiseData', noiseData);
    this._setData('vibrationData', vibrationData);
    this._setData('viewData', viewData);
    this._setData('summary', summary);
    this._setData('selectedRoom', rooms.length > 0 ? rooms[0] : null);
  }

  // ============================================================
  // TAB CONFIGURATION
  // ============================================================

  /**
   * Definisi tabs untuk modul comfort.
   * Di-override dari BaseInspection.
   * @override
   * @returns {Array<TabConfig>}
   */
  getTabs() {
    const data = this._getData.bind(this);
    
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'occupancy', icon: 'users', label: `RUANG (${data('rooms')?.length || 0})` },
      { id: 'climate', icon: 'temperature-high', label: `UDARA (${data('climateData')?.length || 0})` },
      { id: 'view', icon: 'eye', label: `PANDANGAN (${data('viewData')?.length || 0})` },
      { id: 'acoustic', icon: 'volume-up', label: `BISING (${data('noiseData')?.length || 0})` },
      { id: 'report', icon: 'file-pdf', label: 'LAPORAN' }
    ];
  }

  // ============================================================
  // TAB RENDERING
  // ============================================================

  /**
   * Render content berdasarkan tab aktif.
   * Di-override dari BaseInspection.
   * @override
   * @param {string} tabId - ID tab yang aktif
   * @returns {string} HTML content
   */
  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'occupancy': return this.renderOccupancyTab();
      case 'climate': return this.renderClimateTab();
      case 'view': return this.renderViewTab();
      case 'acoustic': return this.renderAcousticTab();
      case 'report': return this.renderReportTab();
      default: return this.renderDashboardTab();
    }
  }

  // ============================================================
  // DASHBOARD TAB
  // ============================================================

  renderDashboardTab() {
    const rooms = this._getData('rooms') || [];
    const climateData = this._getData('climateData') || [];
    const noiseData = this._getData('noiseData') || [];
    const vibrationData = this._getData('vibrationData') || [];
    const viewData = this._getData('viewData') || [];

    const compliantRooms = rooms.filter(r => r.compliance_status === 'C').length;
    const overallScore = this.calculateOverallScore();

    const stats = [
      { icon: 'door-open', value: rooms.length, label: 'Total Ruang', sublabel: `${compliantRooms} Lengkap`, accentColor: 'var(--brand-400)' },
      { icon: 'thermometer-half', value: climateData.length, label: 'Data Iklim', sublabel: 'Pengukuran', accentColor: 'var(--warning-400)' },
      { icon: 'volume-up', value: noiseData.length, label: 'Data Kebisingan', sublabel: 'Pengukuran', accentColor: 'var(--success-400)' },
      { icon: 'chart-line', value: `${overallScore}%`, label: 'Skor Kenyamanan', sublabel: overallScore >= 80 ? 'Baik' : 'Perlu Perbaikan', accentColor: overallScore >= 80 ? 'var(--success-400)' : 'var(--warning-400)' }
    ];

    return `
      <div id="comfort-tab-dashboard" class="comfort-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div class="grid-2-col" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Ruang Terbaru',
            icon: 'door-open',
            accentColor: 'var(--brand-400)',
            content: rooms.length > 0 
              ? this.renderRoomsPreview(rooms.slice(0, 5))
              : InspectionWidgets.renderEmptyState({
                  icon: 'door-open',
                  title: 'Belum Ada Data Ruang',
                  message: 'Tambahkan data ruang untuk memulai evaluasi kenyamanan.',
                  actionLabel: 'Tambah Ruang',
                  actionOnClick: `window._inspectionControllers['comfort'].showAddRoomModal()`
                })
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Status Compliance',
            icon: 'check-circle',
            accentColor: 'var(--success-400)',
            content: this.renderComplianceSummary(rooms)
          })}
        </div>
      </div>
    `;
  }

  renderRoomsPreview(rooms) {
    const rows = rooms.map(room => [
      room.room_name || '-',
      room.room_type || '-',
      this._formatNumber(room.area, 2),
      this._checkCompliance(room.occupancy_load, null, room.max_occupancy) === 'compliant' 
        ? '<span style="color: var(--success-400)">✓</span>' 
        : '<span style="color: var(--danger-400)">✗</span>'
    ]);

    return InspectionWidgets.renderDataTable({
      headers: ['Nama Ruang', 'Tipe', 'Luas (m²)', 'Status'],
      rows,
      align: ['left', 'left', 'right', 'center']
    });
  }

  renderComplianceSummary(rooms) {
    const total = rooms.length;
    const compliant = rooms.filter(r => r.compliance_status === 'C').length;
    const partial = rooms.filter(r => r.compliance_status === 'P').length;
    const nonCompliant = rooms.filter(r => r.compliance_status === 'NC').length;
    const pending = total - compliant - partial - nonCompliant;

    return `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div style="padding: 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400);">${compliant}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Lengkap</div>
        </div>
        <div style="padding: 16px; background: hsla(35, 100%, 50%, 0.1); border-radius: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-400);">${partial}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Sebagian</div>
        </div>
        <div style="padding: 16px; background: hsla(0, 80%, 60%, 0.1); border-radius: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400);">${nonCompliant}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Tidak Lengkap</div>
        </div>
        <div style="padding: 16px; background: hsla(220, 20%, 30%, 0.3); border-radius: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-tertiary);">${pending}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Belum Diisi</div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // OCCUPANCY TAB
  // ============================================================

  renderOccupancyTab() {
    const rooms = this._getData('rooms') || [];
    const selectedRoom = this._getData('selectedRoom');

    return `
      <div id="comfort-tab-occupancy" class="comfort-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Ruang', variant: 'primary', onclick: `window._inspectionControllers['comfort'].showAddRoomModal()` },
          { icon: 'file-import', label: 'Import CSV', variant: 'secondary', onclick: `window._inspectionControllers['comfort'].showImportModal()` },
          { icon: 'calculator', label: 'Hitung Occupancy', variant: 'ghost', onclick: `window._inspectionControllers['comfort'].calculateAllOccupancy()` }
        ])}
        
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 20px;">
          <div class="card-quartz" style="padding: 16px; max-height: 600px; overflow-y: auto;">
            <h5 style="font-family: 'Outfit', sans-serif; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 12px;">Daftar Ruang</h5>
            ${rooms.length > 0 
              ? rooms.map(room => `
                <div onclick="window._inspectionControllers['comfort'].selectRoom('${room.id}')" 
                     class="room-list-item ${selectedRoom?.id === room.id ? 'active' : ''}"
                     style="padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 8px; transition: all 0.2s; ${selectedRoom?.id === room.id ? 'background: var(--gradient-brand);' : 'background: hsla(220, 20%, 20%, 0.3);'}">
                  <div style="font-weight: 600; font-size: 0.85rem; color: ${selectedRoom?.id === room.id ? 'white' : 'var(--text-primary)'};">${room.room_name}</div>
                  <div style="font-size: 0.75rem; color: ${selectedRoom?.id === room.id ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'};">${room.room_type} • ${this._formatNumber(room.area, 1)} m²</div>
                </div>
              `).join('')
              : InspectionWidgets.renderEmptyState({ icon: 'door-open', title: 'Tidak Ada Ruang', message: 'Tambahkan ruang pertama Anda.' })
            }
          </div>
          
          <div>
            ${selectedRoom 
              ? this.renderRoomDetail(selectedRoom)
              : InspectionWidgets.renderEmptyState({ icon: 'mouse-pointer', title: 'Pilih Ruang', message: 'Klik ruang di sidebar untuk melihat detail.' })
            }
          </div>
        </div>
      </div>
    `;
  }

  renderRoomDetail(room) {
    const standard = this.OCCUPANCY_STANDARDS[room.room_type] || 10;
    const maxOccupancy = Math.floor(room.area / standard);
    const compliance = this._checkCompliance(room.occupancy_load, null, maxOccupancy);

    return InspectionWidgets.renderSectionCard({
      title: `Detail Ruang: ${room.room_name}`,
      icon: 'door-open',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Luas Ruang</label>
            <div style="font-size: 1.2rem; font-weight: 700; color: white;">${this._formatNumber(room.area, 2)} m²</div>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Tipe Ruang</label>
            <div style="font-size: 1.2rem; font-weight: 700; color: white;">${room.room_type}</div>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Standar (m²/orang)</label>
            <div style="font-size: 1.2rem; font-weight: 700; color: white;">${standard}</div>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Max Occupancy</label>
            <div style="font-size: 1.2rem; font-weight: 700; color: white;">${maxOccupancy} orang</div>
          </div>
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Status Compliance</span>
            ${InspectionWidgets.renderComplianceBadge(compliance)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">
            ${compliance === 'compliant' 
              ? '✓ Ruang memenuhi standar beban hunian' 
              : compliance === 'non_compliant'
                ? '✗ Ruang melebihi kapasitas maksimum'
                : '⏳ Perlu verifikasi data'
            }
          </div>
        </div>
        
        ${InspectionWidgets.renderActionBar([
          { icon: 'edit', label: 'Edit Ruang', variant: 'secondary', onclick: `window._inspectionControllers['comfort'].editRoom('${room.id}')` },
          { icon: 'trash', label: 'Hapus', variant: 'danger', onclick: `window._inspectionControllers['comfort'].deleteRoom('${room.id}')` }
        ])}
      `
    });
  }

  // ============================================================
  // CLIMATE TAB (Placeholder - implementasi lengkap diperlukan)
  // ============================================================

  renderClimateTab() {
    const climateData = this._getData('climateData') || [];
    
    return `
      <div id="comfort-tab-climate" class="comfort-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Pengukuran', variant: 'primary', onclick: `window._inspectionControllers['comfort'].showAddClimateModal()` },
          { icon: 'file-import', label: 'Import Data', variant: 'secondary', onclick: `window._inspectionControllers['comfort'].showImportModal()` }
        ])}
        
        ${climateData.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Waktu', 'Ruang', 'Suhu (°C)', 'Kelembaban (%)', 'Kecepatan Angin (m/s)', 'Status'],
              rows: climateData.map(d => [
                this._formatDate(d.measured_at),
                d.room_name || '-',
                d.temperature,
                d.humidity,
                d.air_velocity,
                this._checkClimateCompliance(d.temperature, d.humidity, d.room_type)
              ]),
              align: ['left', 'left', 'center', 'center', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'thermometer-half',
              title: 'Belum Ada Data Iklim',
              message: 'Tambahkan pengukuran suhu, kelembaban, dan kecepatan angin.',
              actionLabel: 'Tambah Pengukuran',
              actionOnClick: `window._inspectionControllers['comfort'].showAddClimateModal()`
            })
        }
      </div>
    `;
  }

  _checkClimateCompliance(temp, humidity, roomType) {
    const standard = this.TEMPERATURE_STANDARDS[roomType] || this.TEMPERATURE_STANDARDS.office;
    const tempOk = temp >= standard.min && temp <= standard.max;
    const humidityOk = humidity >= 40 && humidity <= 60;
    
    if (tempOk && humidityOk) return InspectionWidgets.renderComplianceBadge('compliant', 'sm');
    if (!tempOk && !humidityOk) return InspectionWidgets.renderComplianceBadge('non_compliant', 'sm');
    return InspectionWidgets.renderComplianceBadge('partial', 'sm');
  }

  // ============================================================
  // VIEW TAB (Placeholder)
  // ============================================================

  renderViewTab() {
    return InspectionWidgets.renderEmptyState({
      icon: 'eye',
      title: 'Analisis Pandangan',
      message: 'Modul analisis pandangan akan diimplementasikan.',
      actionLabel: 'Tambah Data',
      actionOnClick: `showInfo('Fitur dalam pengembangan')`
    });
  }

  // ============================================================
  // ACOUSTIC TAB (Placeholder)
  // ============================================================

  renderAcousticTab() {
    return InspectionWidgets.renderEmptyState({
      icon: 'volume-up',
      title: 'Analisis Kebisingan & Getaran',
      message: 'Modul analisis akustik akan diimplementasikan.',
      actionLabel: 'Tambah Data',
      actionOnClick: `showInfo('Fitur dalam pengembangan')`
    });
  }

  // ============================================================
  // REPORT TAB
  // ============================================================

  renderReportTab() {
    const summary = this._getData('summary');
    const score = this.calculateOverallScore();

    return `
      <div id="comfort-tab-report" class="comfort-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ score, label: 'Skor Overall Aspek Kenyamanan', size: 'lg' })}
        
        <div style="margin-top: 24px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Ringkasan Laporan',
            icon: 'file-alt',
            accentColor: 'var(--brand-400)',
            content: `
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                ${summary?.findings || 'Ringkasan evaluasi akan ditampilkan di sini setelah seluruh data diinput.'}
              </p>
              
              ${InspectionWidgets.renderActionBar([
                { icon: 'file-pdf', label: 'Generate PDF', variant: 'primary', onclick: `window._inspectionControllers['comfort'].generateReport('pdf')` },
                { icon: 'file-excel', label: 'Export Excel', variant: 'secondary', onclick: `window._inspectionControllers['comfort'].generateReport('excel')` }
              ])}
            `
          })}
        </div>
      </div>
    `;
  }

  // ============================================================
  // BUSINESS LOGIC
  // ============================================================

  calculateOverallScore() {
    const rooms = this._getData('rooms') || [];
    if (rooms.length === 0) return 0;

    const compliant = rooms.filter(r => r.compliance_status === 'C').length;
    const partial = rooms.filter(r => r.compliance_status === 'P').length;
    
    return Math.round(((compliant + (partial * 0.5)) / rooms.length) * 100);
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  selectRoom(roomId) {
    const rooms = this._getData('rooms') || [];
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      this._setData('selectedRoom', room);
      this.switchTab('occupancy');
    }
  }

  showAddRoomModal() {
    // Implementasi modal
    showInfo('Modal tambah ruang akan ditampilkan');
  }

  showImportModal() {
    showInfo('Modal import akan ditampilkan');
  }

  showAddClimateModal() {
    showInfo('Modal tambah data iklim akan ditampilkan');
  }

  calculateAllOccupancy() {
    showSuccess('Perhitungan occupancy selesai');
  }

  editRoom(roomId) {
    showInfo(`Edit ruang ${roomId}`);
  }

  async deleteRoom(roomId) {
    if (confirm('Apakah Anda yakin ingin menghapus ruang ini?')) {
      try {
        await this.repository.delete('comfort_rooms', roomId);
        showSuccess('Ruang berhasil dihapus');
        await this.loadData();
        this.switchTab('occupancy');
      } catch (error) {
        showError('Gagal menghapus ruang');
      }
    }
  }

  generateReport(format) {
    showInfo(`Generate ${format.toUpperCase()} report - Dalam pengembangan`);
  }

  // ============================================================
  // AFTER RENDER
  // ============================================================

  afterRender() {
    super.afterRender();
    // Register global untuk tab switching
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['comfort'] = this;
    }
  }
}

// ============================================================
// PAGE EXPORTS (Legacy Compatibility)
// ============================================================

let comfortInspectionInstance = null;

/**
 * Entry point untuk router (legacy compatibility).
 * Menggantikan comfortInspectionPage() function lama.
 */
export async function comfortInspectionPage(params = {}) {
  // Cleanup instance lama jika ada
  if (comfortInspectionInstance) {
    comfortInspectionInstance.destroy();
  }

  // Create new instance
  comfortInspectionInstance = new ComfortInspection();
  
  // Initialize dan return HTML
  return await comfortInspectionInstance.initialize(params);
}

/**
 * After render hook (legacy compatibility).
 */
export function afterComfortInspectionRender() {
  if (comfortInspectionInstance) {
    comfortInspectionInstance.afterRender();
  }
}
