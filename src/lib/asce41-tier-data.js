/**
 * ASCE 41-17 TIER CHECKLIST DATA
 * Standard evaluation checklists for building safety assessment
 * Based on ASCE 41-17 and SNI 9274:2024
 */

// Tier 1 Screening Checklist - Table 17-1 & 17-2
// Status: C (Compliant), NC (Non-Compliant), N/A (Not Applicable), U (Unknown)
export const TIER1_CHECKLIST = {
  id: 'tier1',
  name: 'Tier 1 - Screening Evaluation',
  description: 'Form evaluasi screening berdasarkan Tabel 17-1 & 17-2 ASCE 41-17',
  reference: 'ASCE 41-17 Chapter 17',
  sections: [
    {
      id: 'seismicity',
      name: 'Seismicity Level',
      icon: 'fa-earthquake',
      reference: 'ASCE 41-17 17.2',
      items: [
        {
          kode: 'T1-S1',
          nama: 'Bangunan berada di wilayah seismisitas sangat rendah (Ss < 0.25)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: '17.2.1',
          tier2Required: true,
          keterangan: 'Jika NC, lanjut ke Tier 2'
        },
        {
          kode: 'T1-S2',
          nama: 'Bangunan berada di wilayah seismisitas rendah (Ss < 0.50 dan S1 < 0.20)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: '17.2.2',
          tier2Required: true
        }
      ]
    },
    {
      id: 'configuration',
      name: 'Basic Configuration',
      icon: 'fa-building',
      reference: 'ASCE 41-17 Table 17-1',
      items: [
        {
          kode: 'T1-C1',
          nama: 'Jumlah lantai tidak melebihi batas untuk tipe struktur (max 2 untuk bearing wall, 4 untuk frame)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 1',
          tier2Required: true
        },
        {
          kode: 'T1-C2',
          nama: 'Bangunan memiliki sistem lateral pada setiap arah horizontal (orthogonal)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 2',
          tier2Required: true
        },
        {
          kode: 'T1-C3',
          nama: 'Tidak ada soft story, weak story, atau vertical stiffness irregularity',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 3',
          tier2Required: true,
          tooltip: 'Soft story: stiffness lantai < 70% stiffness lantai di atasnya'
        },
        {
          kode: 'T1-C4',
          nama: 'Tidak ada mass irregularity (perubahan massa > 200% antar lantai)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 4',
          tier2Required: true
        },
        {
          kode: 'T1-C5',
          nama: 'Tidak ada vertical geometric irregularity (setback > 130% dimensi di atasnya)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 5',
          tier2Required: true
        },
        {
          kode: 'T1-C6',
          nama: 'Tidak ada in-plane offset irregularity pada elemen penahan lateral',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 6',
          tier2Required: true
        },
        {
          kode: 'T1-C7',
          nama: 'Tidak ada weak story dengan drift yang berlebihan (diaphragm discontinuity)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 7',
          tier2Required: true
        }
      ]
    },
    {
      id: 'load_path',
      name: 'Load Path',
      icon: 'fa-road',
      reference: 'ASCE 41-17 Table 17-1',
      items: [
        {
          kode: 'T1-L1',
          nama: 'Lintasan beban gempa lateral kontinu dari massa ke elemen penahan lateral (5.4.1.1)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: '5.4.1.1',
          tier2Required: true,
          tooltip: 'Periksa koneksi dan transfer gaya antar elemen struktur'
        },
        {
          kode: 'T1-L2',
          nama: 'Tidak ada irregularity horizontal torsional (eksen massa dan kekakuan tidak berimpit)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 9',
          tier2Required: true
        },
        {
          kode: 'T1-L3',
          nama: 'Diaphragm tidak ada re-entrant corner atau notch (re-entrant < 15% dimensi)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 10',
          tier2Required: true
        },
        {
          kode: 'T1-L4',
          nama: 'Tidak ada diaphragm discontinuity atau opening > 50% dari area bracing',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 11',
          tier2Required: true
        },
        {
          kode: 'T1-L5',
          nama: 'Out-of-plane offset pada elemen penahan lateral tidak melebihi batas (max 1.2m)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-1 Item 12',
          tier2Required: true
        }
      ]
    },
    {
      id: 'adjacent',
      name: 'Adjacent Buildings & Geologic',
      icon: 'fa-mountain',
      reference: 'ASCE 41-17 Table 17-2',
      items: [
        {
          kode: 'T1-A1',
          nama: 'Jarak antar bangunan memenuhi syarat pounding (min 0.006 x h + 1cm, h=tinggi)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-2 Item 1',
          tier2Required: true,
          tooltip: 'Jarak pounding minimum = 0.6% dari tinggi bangunan + 1cm'
        },
        {
          kode: 'T1-A2',
          nama: 'Bangunan tidak terletak di atas atau dekat active fault',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-2 Item 2',
          tier2Required: true
        },
        {
          kode: 'T1-A3',
          nama: 'Bangunan tidak terletak di area liquefaction prone atau tanah lunak',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-2 Item 3',
          tier2Required: true
        },
        {
          kode: 'T1-A4',
          nama: 'Slope stability aman (tidak di lereng dengan risiko longsor)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-2 Item 4',
          tier2Required: true
        }
      ]
    },
    {
      id: 'components',
      name: 'Structural Components',
      icon: 'fa-cubes',
      reference: 'ASCE 41-17 Table 17-3',
      items: [
        {
          kode: 'T1-P1',
          nama: 'Beam-column connection memenuhi persyaratan ductility dan strength',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-3 Item 1',
          tier2Required: true
        },
        {
          kode: 'T1-P2',
          nama: 'Tidak ada short captive column (kolom dengan height-to-width ratio < 2)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-3 Item 2',
          tier2Required: true
        },
        {
          kode: 'T1-P3',
          nama: 'Shear wall tidak ada opening yang signifikan (> 50% panjang wall)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-3 Item 3',
          tier2Required: true
        },
        {
          kode: 'T1-P4',
          nama: 'Gravity load tidak didukung oleh elemen yang seismically vulnerable',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-3 Item 4',
          tier2Required: true
        },
        {
          kode: 'T1-P5',
          nama: 'Tidak ada tilt-up atau precast wall panel dengan anchorage yang tidak memadai',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-3 Item 5',
          tier2Required: true
        },
        {
          kode: 'T1-P6',
          nama: 'Kolom dan balok tidak menunjukkan kerusakan beton (spalling, delamination)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'SNI 9274:2024 7.3',
          tier2Required: true
        }
      ]
    },
    {
      id: 'performance',
      name: 'Collapse Prevention (CP) Level',
      icon: 'fa-shield-halved',
      reference: 'ASCE 41-17 Table 17-4',
      items: [
        {
          kode: 'T1-CP1',
          nama: 'Interstory drift ratio tidak melebihi batas CP (5% untuk concrete moment frame)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-4 Item 1',
          tier2Required: true,
          tooltip: 'CP Level: 5% untuk concrete moment frame, 4% untuk steel moment frame'
        },
        {
          kode: 'T1-CP2',
          nama: 'Komponen struktur masih memiliki kapasitas untuk menahan gaya gravitasi P-Δ effect',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-4 Item 2',
          tier2Required: true
        },
        {
          kode: 'T1-CP3',
          nama: 'Struktur tidak memiliki mekanisme keruntuhan yang jelas (story mechanism)',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'Table 17-4 Item 3',
          tier2Required: true
        },
        {
          kode: 'T1-CP4',
          nama: 'Aspek keandalan kebakaran, kesehatan, kenyamanan, kemudahan memenuhi minimal LS',
          type: 'radio',
          options: ['C', 'NC', 'N/A', 'U'],
          pasal: 'SNI 9274:2024 5.2',
          tier2Required: true
        }
      ]
    }
  ]
};

// Tier 2 Deficiency-Based Evaluation
// DCR = Demand Capacity Ratio
export const TIER2_CHECKLIST = {
  id: 'tier2',
  name: 'Tier 2 - Deficiency-Based Evaluation',
  description: 'Evaluasi berbasis defisiensi hasil Tier 1 dengan perhitungan DCR',
  reference: 'ASCE 41-17 Chapter 17.4',
  sections: [
    {
      id: 'dcr_calculation',
      name: 'DCR Calculations',
      icon: 'fa-calculator',
      reference: 'ASCE 41-17 17.4.3',
      items: [
        {
          kode: 'T2-DCR1',
          nama: 'DCR Beams (Momen positif dan negatif)',
          type: 'dcr_calc',
          formula: 'DCR = M_demand / M_capacity',
          batas: 2.0,
          tier3Required: true,
          pasal: '17.4.3.1',
          fields: [
            { name: 'demand', label: 'Momen Demand (kNm)', type: 'number' },
            { name: 'capacity', label: 'Momen Capacity (kNm)', type: 'number' },
            { name: 'location', label: 'Lokasi', type: 'text' }
          ]
        },
        {
          kode: 'T2-DCR2',
          nama: 'DCR Columns (Momen dan Gaya Aksial)',
          type: 'dcr_calc',
          formula: 'DCR = max(P_demand/Pn, M_demand/Mn)',
          batas: 2.0,
          tier3Required: true,
          pasal: '17.4.3.2',
          fields: [
            { name: 'p_demand', label: 'P Demand (kN)', type: 'number' },
            { name: 'p_capacity', label: 'Pn Capacity (kN)', type: 'number' },
            { name: 'm_demand', label: 'M Demand (kNm)', type: 'number' },
            { name: 'm_capacity', label: 'Mn Capacity (kNm)', type: 'number' },
            { name: 'location', label: 'Lokasi', type: 'text' }
          ]
        },
        {
          kode: 'T2-DCR3',
          nama: 'DCR Shear (Gaya Geser)',
          type: 'dcr_calc',
          formula: 'DCR = V_demand / φVn',
          batas: 2.0,
          tier3Required: true,
          pasal: '17.4.3.3',
          fields: [
            { name: 'v_demand', label: 'V Demand (kN)', type: 'number' },
            { name: 'v_capacity', label: 'φVn Capacity (kN)', type: 'number' },
            { name: 'location', label: 'Lokasi', type: 'text' }
          ]
        },
        {
          kode: 'T2-DCR4',
          nama: 'DCR Shear Walls',
          type: 'dcr_calc',
          formula: 'DCR = max(V_demand/Vn, M_demand/Mn)',
          batas: 2.0,
          tier3Required: true,
          pasal: '17.4.3.4',
          fields: [
            { name: 'v_demand', label: 'V Demand (kN)', type: 'number' },
            { name: 'v_capacity', label: 'Vn Capacity (kN)', type: 'number' },
            { name: 'm_demand', label: 'M Demand (kNm)', type: 'number' },
            { name: 'm_capacity', label: 'Mn Capacity (kNm)', type: 'number' },
            { name: 'location', label: 'Lokasi Wall', type: 'text' }
          ]
        },
        {
          kode: 'T2-DCR5',
          nama: 'DCR Connections (Balok-Kolom)',
          type: 'dcr_calc',
          formula: 'DCR = M_connection_demand / M_connection_capacity',
          batas: 1.5,
          tier3Required: true,
          pasal: '17.4.3.5',
          fields: [
            { name: 'm_conn_demand', label: 'M Connection Demand (kNm)', type: 'number' },
            { name: 'm_conn_capacity', label: 'M Connection Capacity (kNm)', type: 'number' },
            { name: 'location', label: 'Lokasi Joint', type: 'text' }
          ]
        }
      ]
    },
    {
      id: 'deficiency_evaluation',
      name: 'Deficiency Evaluation',
      icon: 'fa-magnifying-glass-chart',
      reference: 'ASCE 41-17 17.4.4',
      items: [
        {
          kode: 'T2-DE1',
          nama: 'Strong-Column Weak-Beam Check: ΣMnc > ΣMnb',
          type: 'formula_check',
          formula: 'ΣMnc / ΣMnb > 1.0',
          batas: 1.0,
          tier3Required: true,
          pasal: '17.4.4.1',
          fields: [
            { name: 'sum_mnc', label: 'ΣMnc (kNm)', type: 'number' },
            { name: 'sum_mnb', label: 'ΣMnb (kNm)', type: 'number' },
            { name: 'joint_location', label: 'Lokasi Joint', type: 'text' }
          ]
        },
        {
          kode: 'T2-DE2',
          nama: 'Story Drift Ratio Check',
          type: 'drift_calc',
          formula: 'IDR = (Δi - Δi-1) / hi',
          batas: 0.02,
          tier3Required: true,
          pasal: '17.4.4.2',
          fields: [
            { name: 'delta_i', label: 'Δi (mm)', type: 'number' },
            { name: 'delta_i1', label: 'Δi-1 (mm)', type: 'number' },
            { name: 'height', label: 'hi (mm)', type: 'number' },
            { name: 'story', label: 'Lantai', type: 'text' }
          ]
        },
        {
          kode: 'T2-DE3',
          nama: 'Torsional Irregularity Check',
          type: 'formula_check',
          formula: 'δmax / δavg < 1.2',
          batas: 1.2,
          tier3Required: true,
          pasal: '17.4.4.3',
          fields: [
            { name: 'delta_max', label: 'δmax (mm)', type: 'number' },
            { name: 'delta_avg', label: 'δavg (mm)', type: 'number' }
          ]
        },
        {
          kode: 'T2-DE4',
          nama: 'P-Δ Effect Check',
          type: 'formula_check',
          formula: 'θ = (P×Δ)/(V×h) < 0.1',
          batas: 0.1,
          tier3Required: true,
          pasal: '17.4.4.4',
          fields: [
            { name: 'p', label: 'P (kN)', type: 'number' },
            { name: 'delta', label: 'Δ (mm)', type: 'number' },
            { name: 'v', label: 'V (kN)', type: 'number' },
            { name: 'h', label: 'h (mm)', type: 'number' }
          ]
        }
      ]
    }
  ]
};

// Tier 3 Systematic Evaluation
export const TIER3_CHECKLIST = {
  id: 'tier3',
  name: 'Tier 3 - Systematic Evaluation',
  description: 'Analisis sistematis dengan pushover atau nonlinear response history',
  reference: 'ASCE 41-17 Chapter 17.5',
  sections: [
    {
      id: 'pushover_params',
      name: 'Pushover Analysis Parameters',
      icon: 'fa-chart-line',
      reference: 'ASCE 41-17 17.5.3',
      items: [
        {
          kode: 'T3-PO1',
          nama: 'Target Displacement (δt)',
          type: 'number',
          unit: 'mm',
          pasal: '17.5.3.1',
          keterangan: 'Target displacement berdasarkan spektrum respons desain'
        },
        {
          kode: 'T3-PO2',
          nama: 'Base Shear at Target Displacement',
          type: 'number',
          unit: 'kN',
          pasal: '17.5.3.2'
        },
        {
          kode: 'T3-PO3',
          nama: 'Roof Displacement at Target',
          type: 'number',
          unit: 'mm',
          pasal: '17.5.3.3'
        },
        {
          kode: 'T3-PO4',
          nama: 'Performance Point (Kurva Kapasitas vs Demand)',
          type: 'file_upload',
          accept: '.csv,.xlsx,.etabs',
          pasal: '17.5.3.4',
          keterangan: 'Upload hasil ETABS atau SAP2000'
        }
      ]
    },
    {
      id: 'plastic_hinges',
      name: 'Plastic Hinge Status',
      icon: 'fa-circle-nodes',
      reference: 'ASCE 41-17 Table 9-6',
      items: [
        {
          kode: 'T3-PH1',
          nama: 'Status Sendi Plastis Kolom (B-IO, IO-LS, LS-CP, CP-E, >E)',
          type: 'hinge_status_grid',
          pasal: '9.6',
          keterangan: 'B=Bruising, IO=Immediate Occupancy, LS=Life Safety, CP=Collapse Prevention, E=Complete'
        },
        {
          kode: 'T3-PH2',
          nama: 'Status Sendi Plastis Balok',
          type: 'hinge_status_grid',
          pasal: '9.6'
        },
        {
          kode: 'T3-PH3',
          nama: 'Status Sendi Plastis Joint/Connection',
          type: 'hinge_status_grid',
          pasal: '9.6'
        },
        {
          kode: 'T3-PH4',
          nama: 'Distribusi Mekanisme Keruntuhan (Strong Column Weak Beam)',
          type: 'mechanism_check',
          pasal: '9.5.2.2',
          keterangan: 'Verifikasi mekanisme yang terbentuk'
        }
      ]
    },
    {
      id: 'acceptance_criteria',
      name: 'Acceptance Criteria Check',
      icon: 'fa-clipboard-check',
      reference: 'ASCE 41-17 Chapter 9',
      items: [
        {
          kode: 'T3-AC1',
          nama: 'Deformation-controlled actions (m_rotation, m_shear) < allowable',
          type: 'acceptance_check',
          level: 'CP',
          pasal: '9.6.1'
        },
        {
          kode: 'T3-AC2',
          nama: 'Force-controlled actions (V, P) < φVn atau φPn',
          type: 'acceptance_check',
          level: 'CP',
          pasal: '9.6.2'
        },
        {
          kode: 'T3-AC3',
          nama: 'Secondary component deformations tidak menyebabkan kehilangan vertikal load-carrying capacity',
          type: 'boolean',
          pasal: '9.6.3'
        }
      ]
    }
  ]
};

// Status options for all tiers
export const TIER_STATUS_OPTIONS = [
  { value: 'C', label: 'C - Compliant', color: '#22c55e', description: 'Memenuhi persyaratan' },
  { value: 'NC', label: 'NC - Non-Compliant', color: '#ef4444', description: 'Tidak memenuhi, perlu Tier 2/3' },
  { value: 'N/A', label: 'N/A - Not Applicable', color: '#6b7280', description: 'Tidak berlaku untuk bangunan ini' },
  { value: 'U', label: 'U - Unknown', color: '#f59e0b', description: 'Data tidak tersedia' }
];

// Plastic hinge status colors (ASCE 41-17 Table 9-6)
export const PLASTIC_HINGE_STATUS = {
  'B-IO': { label: 'B to IO', color: '#3b82f6', description: 'Bruising to Immediate Occupancy' },
  'IO-LS': { label: 'IO to LS', color: '#22c55e', description: 'Immediate Occupancy to Life Safety' },
  'LS-CP': { label: 'LS to CP', color: '#eab308', description: 'Life Safety to Collapse Prevention' },
  'CP-E': { label: 'CP to E', color: '#ef4444', description: 'Collapse Prevention to Complete' },
  '>E': { label: '> E', color: '#8b5cf6', description: 'Beyond Elastic' }
};

// Helper functions
export function calculateDCR(demand, capacity) {
  if (!capacity || capacity === 0) return Infinity;
  return demand / capacity;
}

export function getDCRStatus(dcr, threshold = 2.0) {
  if (dcr <= 1.0) return { status: 'C', color: '#22c55e', message: 'Aman' };
  if (dcr <= threshold) return { status: 'LS', color: '#eab308', message: 'Life Safety' };
  return { status: 'NC', color: '#ef4444', message: 'Perlu evaluasi Tier 3' };
}

export function calculateIDR(delta_i, delta_i1, height) {
  if (!height || height === 0) return 0;
  return (delta_i - delta_i1) / height;
}

export function getIDRStatus(idr, batas = 0.02) {
  if (idr <= batas * 0.5) return { status: 'C', color: '#22c55e', message: 'Aman' };
  if (idr <= batas) return { status: 'LS', color: '#eab308', message: 'Life Safety' };
  return { status: 'NC', color: '#ef4444', message: 'Melebihi batas CP' };
}

export function checkTier1NeedsTier2(checklistData) {
  // Cek apakah ada item Tier 1 yang NC sehingga memerlukan Tier 2
  const ncItems = Object.entries(checklistData).filter(([kode, val]) => {
    return val.status === 'NC' && kode.startsWith('T1-');
  });
  return ncItems.length > 0 ? ncItems : null;
}

export function checkTier2NeedsTier3(tier2Data) {
  // Cek apakah ada DCR > 2.0 atau defisiensi yang memerlukan Tier 3
  const needsTier3 = [];
  
  Object.entries(tier2Data).forEach(([kode, val]) => {
    if (val.dcr && val.dcr > 2.0) {
      needsTier3.push({ kode, reason: 'DCR > 2.0', value: val.dcr });
    }
    if (val.idr && val.idr > 0.02) {
      needsTier3.push({ kode, reason: 'IDR > 2%', value: val.idr });
    }
  });
  
  return needsTier3.length > 0 ? needsTier3 : null;
}
