import { describe, it, expect } from 'vitest';
import { ComplianceStatus, COMPLIANCE_TYPES } from './ComplianceStatus.js';

describe('ComplianceStatus Value Object', () => {
  describe('Constructor', () => {
    it('should create with valid type', () => {
      const status = new ComplianceStatus('compliant');
      expect(status.type).toBe('compliant');
    });

    it('should create with uppercase type', () => {
      const status = new ComplianceStatus('COMPLIANT');
      expect(status.type).toBe('COMPLIANT');
    });

    it('should throw error for invalid type', () => {
      expect(() => new ComplianceStatus('invalid')).toThrow('Tipe compliance tidak valid');
    });

    it('should accept findings and recommendations', () => {
      const findings = ['Finding 1', 'Finding 2'];
      const recommendations = ['Rec 1'];
      const status = new ComplianceStatus('partial', findings, recommendations);

      expect(status.findings).toEqual(findings);
      expect(status.recommendations).toEqual(recommendations);
    });

    it('should be immutable', () => {
      const status = new ComplianceStatus('compliant');
      expect(() => { status._type = 'non_compliant'; }).toThrow();
    });
  });

  describe('Status Checks', () => {
    it('should identify compliant', () => {
      const status = new ComplianceStatus('compliant');
      expect(status.isCompliant()).toBe(true);
      expect(status.isNonCompliant()).toBe(false);
      expect(status.isPartial()).toBe(false);
    });

    it('should identify non_compliant', () => {
      const status = new ComplianceStatus('non_compliant');
      expect(status.isCompliant()).toBe(false);
      expect(status.isNonCompliant()).toBe(true);
      expect(status.isPartial()).toBe(false);
    });

    it('should identify partial', () => {
      const status = new ComplianceStatus('partial');
      expect(status.isCompliant()).toBe(false);
      expect(status.isNonCompliant()).toBe(false);
      expect(status.isPartial()).toBe(true);
    });

    it('should identify pending', () => {
      const status = new ComplianceStatus('pending');
      expect(status.isPending()).toBe(true);
      expect(status.isCompliant()).toBe(false);
    });

    it('should check if action required', () => {
      const compliant = new ComplianceStatus('compliant');
      const partial = new ComplianceStatus('partial');
      const nonCompliant = new ComplianceStatus('non_compliant');

      expect(compliant.isActionRequired()).toBe(false);
      expect(partial.isActionRequired()).toBe(true);
      expect(nonCompliant.isActionRequired()).toBe(true);
    });
  });

  describe('Labels and Severity', () => {
    it('should return correct label for each type', () => {
      expect(new ComplianceStatus('compliant').label).toBe('Sesuai');
      expect(new ComplianceStatus('partial').label).toBe('Sebagian Sesuai');
      expect(new ComplianceStatus('non_compliant').label).toBe('Tidak Sesuai');
      expect(new ComplianceStatus('pending').label).toBe('Menunggu');
    });

    it('should return correct severity', () => {
      expect(new ComplianceStatus('compliant').severity).toBe(0);
      expect(new ComplianceStatus('partial').severity).toBe(1);
      expect(new ComplianceStatus('non_compliant').severity).toBe(2);
      expect(new ComplianceStatus('pending').severity).toBe(-1);
    });

    it('should return correct priority', () => {
      expect(new ComplianceStatus('non_compliant').getPriority()).toBe('HIGH');
      expect(new ComplianceStatus('partial').getPriority()).toBe('MEDIUM');
      expect(new ComplianceStatus('compliant').getPriority()).toBe('LOW');
      expect(new ComplianceStatus('pending').getPriority()).toBe('NONE');
    });

    it('should return correct badge color', () => {
      expect(new ComplianceStatus('compliant').getBadgeColor()).toBe('success');
      expect(new ComplianceStatus('partial').getBadgeColor()).toBe('warning');
      expect(new ComplianceStatus('non_compliant').getBadgeColor()).toBe('danger');
      expect(new ComplianceStatus('pending').getBadgeColor()).toBe('info');
    });
  });

  describe('Immutable Updates', () => {
    it('should add finding immutably', () => {
      const status = new ComplianceStatus('compliant', ['Original']);
      const newStatus = status.withFinding('New Finding');

      expect(status.findings).toEqual(['Original']);
      expect(newStatus.findings).toEqual(['Original', 'New Finding']);
    });

    it('should add recommendation immutably', () => {
      const status = new ComplianceStatus('compliant', [], ['Original']);
      const newStatus = status.withRecommendation('New Rec');

      expect(status.recommendations).toEqual(['Original']);
      expect(newStatus.recommendations).toEqual(['Original', 'New Rec']);
    });

    it('should change type immutably', () => {
      const status = new ComplianceStatus('compliant');
      const newStatus = status.withType('non_compliant');

      expect(status.type).toBe('compliant');
      expect(newStatus.type).toBe('non_compliant');
    });
  });

  describe('Aggregation', () => {
    it('should return pending for empty array', () => {
      const aggregated = ComplianceStatus.aggregate([]);
      expect(aggregated.isPending()).toBe(true);
    });

    it('should return pending for undefined', () => {
      const aggregated = ComplianceStatus.aggregate(undefined);
      expect(aggregated.isPending()).toBe(true);
    });

    it('should aggregate to worst status (non_compliant)', () => {
      const statuses = [
        new ComplianceStatus('compliant'),
        new ComplianceStatus('partial'),
        new ComplianceStatus('non_compliant')
      ];
      const aggregated = ComplianceStatus.aggregate(statuses);

      expect(aggregated.isNonCompliant()).toBe(true);
    });

    it('should aggregate to partial when no non_compliant', () => {
      const statuses = [
        new ComplianceStatus('compliant'),
        new ComplianceStatus('partial'),
        new ComplianceStatus('compliant')
      ];
      const aggregated = ComplianceStatus.aggregate(statuses);

      expect(aggregated.isPartial()).toBe(true);
    });

    it('should collect all findings from aggregated statuses', () => {
      const statuses = [
        new ComplianceStatus('compliant', ['F1']),
        new ComplianceStatus('partial', ['F2'], ['R1']),
        new ComplianceStatus('non_compliant', ['F3'], ['R2'])
      ];
      const aggregated = ComplianceStatus.aggregate(statuses);

      expect(aggregated.findings).toContain('F1');
      expect(aggregated.findings).toContain('F2');
      expect(aggregated.findings).toContain('F3');
      expect(aggregated.recommendations).toContain('R1');
      expect(aggregated.recommendations).toContain('R2');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const status = new ComplianceStatus('partial', ['F1'], ['R1']);
      const json = status.toJSON();

      expect(json).toEqual({
        type: 'partial',
        label: 'Sebagian Sesuai',
        severity: 1,
        isCompliant: false,
        isActionRequired: true,
        priority: 'MEDIUM',
        badgeColor: 'warning',
        findings: ['F1'],
        recommendations: ['R1']
      });
    });

    it('should convert to string', () => {
      const status = new ComplianceStatus('compliant');
      expect(status.toString()).toBe('Sesuai');
    });
  });

  describe('Factory Methods', () => {
    it('should create compliant status', () => {
      const status = ComplianceStatus.compliant(['F1'], ['R1']);
      expect(status.isCompliant()).toBe(true);
      expect(status.findings).toEqual(['F1']);
      expect(status.recommendations).toEqual(['R1']);
    });

    it('should create non_compliant status', () => {
      const status = ComplianceStatus.nonCompliant(['F1'], ['R1']);
      expect(status.isNonCompliant()).toBe(true);
      expect(status.findings).toEqual(['F1']);
      expect(status.recommendations).toEqual(['R1']);
    });

    it('should create partial status', () => {
      const status = ComplianceStatus.partial(['F1'], ['R1']);
      expect(status.isPartial()).toBe(true);
      expect(status.findings).toEqual(['F1']);
      expect(status.recommendations).toEqual(['R1']);
    });

    it('should create pending status', () => {
      const status = ComplianceStatus.pending();
      expect(status.isPending()).toBe(true);
    });

    it('should create from JSON', () => {
      const json = {
        type: 'non_compliant',
        findings: ['F1', 'F2'],
        recommendations: ['R1']
      };
      const status = ComplianceStatus.fromJSON(json);

      expect(status.isNonCompliant()).toBe(true);
      expect(status.findings).toEqual(['F1', 'F2']);
      expect(status.recommendations).toEqual(['R1']);
    });
  });

  describe('Constants', () => {
    it('should export COMPLIANCE_TYPES', () => {
      expect(COMPLIANCE_TYPES).toBeDefined();
      expect(COMPLIANCE_TYPES.COMPLIANT).toEqual({
        value: 'compliant',
        label: 'Sesuai',
        severity: 0
      });
    });
  });
});
