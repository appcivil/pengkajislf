// ============================================================
// COMPLIANCE STATUS VALUE OBJECT
// Representasi immutable untuk status kesesuaian/kelaikan
// ============================================================

import { DomainError } from '../errors/DomainError.js';

export const COMPLIANCE_TYPES = {
  COMPLIANT: { value: 'compliant', label: 'Sesuai', severity: 0 },
  PARTIAL: { value: 'partial', label: 'Sebagian Sesuai', severity: 1 },
  NON_COMPLIANT: { value: 'non_compliant', label: 'Tidak Sesuai', severity: 2 },
  PENDING: { value: 'pending', label: 'Menunggu', severity: -1 },
  NOT_APPLICABLE: { value: 'na', label: 'Tidak Berlaku', severity: -1 }
};

export class ComplianceStatus {
  constructor(type = 'pending', findings = [], recommendations = []) {
    this._validateType(type);
    this._type = type;
    this._findings = [...findings]; // Clone array
    this._recommendations = [...recommendations]; // Clone array
    Object.freeze(this);
  }

  _validateType(type) {
    if (!COMPLIANCE_TYPES[type.toUpperCase()] && !Object.values(COMPLIANCE_TYPES).find(t => t.value === type)) {
      throw new DomainError(
        `Tipe compliance tidak valid: ${type}`,
        'INVALID_COMPLIANCE_TYPE',
        { validTypes: Object.keys(COMPLIANCE_TYPES) }
      );
    }
  }

  get type() { return this._type; }
  get findings() { return [...this._findings]; }
  get recommendations() { return [...this._recommendations]; }

  get label() {
    const typeKey = Object.keys(COMPLIANCE_TYPES).find(
      key => COMPLIANCE_TYPES[key].value === this._type || key.toLowerCase() === this._type.toLowerCase()
    );
    return typeKey ? COMPLIANCE_TYPES[typeKey].label : this._type;
  }

  get severity() {
    const typeKey = Object.keys(COMPLIANCE_TYPES).find(
      key => COMPLIANCE_TYPES[key].value === this._type || key.toLowerCase() === this._type.toLowerCase()
    );
    return typeKey ? COMPLIANCE_TYPES[typeKey].severity : 0;
  }

  // Status checks
  isCompliant() {
    return this._type === 'compliant' || this._type === 'COMPLIANT';
  }

  isNonCompliant() {
    return this._type === 'non_compliant' || this._type === 'NON_COMPLIANT';
  }

  isPartial() {
    return this._type === 'partial' || this._type === 'PARTIAL';
  }

  isPending() {
    return this._type === 'pending' || this._type === 'PENDING';
  }

  isActionRequired() {
    return this.isNonCompliant() || this.isPartial();
  }

  // Business logic
  getPriority() {
    if (this.isNonCompliant()) return 'HIGH';
    if (this.isPartial()) return 'MEDIUM';
    if (this.isCompliant()) return 'LOW';
    return 'NONE';
  }

  getBadgeColor() {
    switch (this._type) {
      case 'compliant': return 'success';
      case 'partial': return 'warning';
      case 'non_compliant': return 'danger';
      case 'pending': return 'info';
      default: return 'secondary';
    }
  }

  // Immutable updates
  withFinding(finding) {
    return new ComplianceStatus(
      this._type,
      [...this._findings, finding],
      this._recommendations
    );
  }

  withRecommendation(recommendation) {
    return new ComplianceStatus(
      this._type,
      this._findings,
      [...this._recommendations, recommendation]
    );
  }

  withType(newType) {
    return new ComplianceStatus(newType, this._findings, this._recommendations);
  }

  // Aggregation helper
  static aggregate(statuses) {
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return new ComplianceStatus('pending');
    }

    const severities = statuses.map(s => s.severity);
    const maxSeverity = Math.max(...severities);

    const worstType = Object.keys(COMPLIANCE_TYPES).find(
      key => COMPLIANCE_TYPES[key].severity === maxSeverity
    )?.toLowerCase() || 'pending';

    const allFindings = statuses.flatMap(s => s.findings);
    const allRecommendations = statuses.flatMap(s => s.recommendations);

    return new ComplianceStatus(worstType, allFindings, allRecommendations);
  }

  // Serialization
  toJSON() {
    return {
      type: this._type,
      label: this.label,
      severity: this.severity,
      isCompliant: this.isCompliant(),
      isActionRequired: this.isActionRequired(),
      priority: this.getPriority(),
      badgeColor: this.getBadgeColor(),
      findings: this._findings,
      recommendations: this._recommendations
    };
  }

  toString() {
    return this.label;
  }

  // Factory methods
  static compliant(findings = [], recommendations = []) {
    return new ComplianceStatus('compliant', findings, recommendations);
  }

  static nonCompliant(findings = [], recommendations = []) {
    return new ComplianceStatus('non_compliant', findings, recommendations);
  }

  static partial(findings = [], recommendations = []) {
    return new ComplianceStatus('partial', findings, recommendations);
  }

  static pending() {
    return new ComplianceStatus('pending');
  }

  static fromJSON(json) {
    return new ComplianceStatus(
      json.type || json.status,
      json.findings || [],
      json.recommendations || []
    );
  }
}
