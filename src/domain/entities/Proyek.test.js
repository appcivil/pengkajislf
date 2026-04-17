import { describe, it, expect, beforeEach } from 'vitest';
import { Proyek } from './Proyek.js';

describe('Proyek Entity', () => {
  let validProyekData;

  beforeEach(() => {
    validProyekData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nama: 'Gedung Perkantoran ABC',
      alamat: 'Jl. Sudirman No. 123, Jakarta',
      status: 'Draft',
      skore: 75,
      metadata: {
        jenisBangunan: 'Kantor',
        jumlahLantai: 5
      }
    };
  });

  describe('Constructor', () => {
    it('should create Proyek with valid data', () => {
      const proyek = new Proyek(validProyekData);

      expect(proyek.id).toBe(validProyekData.id);
      expect(proyek.nama).toBe(validProyekData.nama);
      expect(proyek.alamat).toBe(validProyekData.alamat);
      expect(proyek.status).toBe(validProyekData.status);
      expect(proyek.skore).toBe(validProyekData.skore);
      expect(proyek.metadata).toEqual(validProyekData.metadata);
    });

    it('should set default status to Draft', () => {
      const dataWithoutStatus = { ...validProyekData };
      delete dataWithoutStatus.status;

      const proyek = new Proyek(dataWithoutStatus);

      expect(proyek.status).toBe('Draft');
    });

    it('should set default skore to 0', () => {
      const dataWithoutSkore = { ...validProyekData };
      delete dataWithoutSkore.skore;

      const proyek = new Proyek(dataWithoutSkore);

      expect(proyek.skore).toBe(0);
    });

    it('should set created_at and updated_at timestamps', () => {
      const before = new Date().toISOString();
      const proyek = new Proyek(validProyekData);
      const after = new Date().toISOString();

      expect(proyek.created_at).toBeDefined();
      expect(proyek.updated_at).toBeDefined();
      expect(proyek.created_at >= before).toBe(true);
      expect(proyek.created_at <= after).toBe(true);
    });
  });

  describe('isLaikFungsi', () => {
    it('should return true when skore >= 80', () => {
      const proyek = new Proyek({ ...validProyekData, skore: 80 });
      expect(proyek.isLaikFungsi()).toBe(true);

      const proyekAbove = new Proyek({ ...validProyekData, skore: 95 });
      expect(proyekAbove.isLaikFungsi()).toBe(true);
    });

    it('should return false when skore < 80', () => {
      const proyek = new Proyek({ ...validProyekData, skore: 79 });
      expect(proyek.isLaikFungsi()).toBe(false);

      const proyekLow = new Proyek({ ...validProyekData, skore: 0 });
      expect(proyekLow.isLaikFungsi()).toBe(false);
    });
  });

  describe('updateSkore', () => {
    it('should update skore with valid value', () => {
      const proyek = new Proyek(validProyekData);
      const oldSkore = proyek.skore;
      const newSkore = 85;

      proyek.updateSkore(newSkore);

      expect(proyek.skore).toBe(newSkore);
      expect(proyek.skore).not.toBe(oldSkore);
      expect(proyek.updated_at).toBeDefined();
    });

    it('should throw error when skore is negative', () => {
      const proyek = new Proyek(validProyekData);

      expect(() => proyek.updateSkore(-1)).toThrow('Skor harus antara 0-100');
    });

    it('should throw error when skore > 100', () => {
      const proyek = new Proyek(validProyekData);

      expect(() => proyek.updateSkore(101)).toThrow('Skor harus antara 0-100');
    });

    it('should accept boundary values 0 and 100', () => {
      const proyek = new Proyek(validProyekData);

      expect(() => proyek.updateSkore(0)).not.toThrow();
      expect(() => proyek.updateSkore(100)).not.toThrow();
    });
  });
});
