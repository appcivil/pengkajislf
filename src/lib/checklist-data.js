/**
 * CHECKLIST DATA CONSTANTS (PDF FULL VERSION)
 * Formal NSPK PUPR & PDF Standard Categories for Building Inspection.
 */
import { FULL_CHECKLIST_SCHEMA, CHECKLIST_SECTIONS, SCALE_OPTIONS } from './checklist-full-schema.js';

export { FULL_CHECKLIST_SCHEMA, CHECKLIST_SECTIONS, SCALE_OPTIONS };

// Legacy Mappings for compatibility (will be deprecated)
export const ADMIN_ITEMS = FULL_CHECKLIST_SCHEMA.filter(i => i.category === 'identitas' || i.kode.startsWith('A'));
export const TEKNIS_ITEMS = FULL_CHECKLIST_SCHEMA.filter(i => i.category === 'tata-bangunan');
export const KAJIAN_GROUPS = [
    { aspek: 'Tata Bangunan Gedung', items: FULL_CHECKLIST_SCHEMA.filter(i => i.category === 'tata-bangunan') },
    { aspek: 'Keselamatan Bangunan', items: FULL_CHECKLIST_SCHEMA.filter(i => i.category === 'keselamatan') },
    { aspek: 'Kesehatan & Lingkungan', items: FULL_CHECKLIST_SCHEMA.filter(i => i.category === 'kesehatan') },
    { aspek: 'Kemudahan & Aksesibilitas', items: FULL_CHECKLIST_SCHEMA.filter(i => i.category === 'kemudahan') }
];

export const ADMIN_OPTIONS = [
  { value: 'sesuai', label: '✓ Sesuai' },
  { value: 'tidak_sesuai', label: '✗ Tidak Sesuai' },
  { value: 'tidak_ada', label: '— Tidak Ada / N/A' },
];

export const CONDITION_OPTIONS = SCALE_OPTIONS.map(o => ({ value: o.value, label: o.label }));

