import { describe, it, expect } from 'vitest';
import { Score } from './Score.js';

describe('Score Value Object', () => {
  describe('Constructor', () => {
    it('should create Score with valid value', () => {
      const score = new Score(75);
      expect(score.value).toBe(75);
    });

    it('should throw error for negative value', () => {
      expect(() => new Score(-1)).toThrow('Skor harus antara 0 dan 100');
    });

    it('should throw error for value > 100', () => {
      expect(() => new Score(101)).toThrow('Skor harus antara 0 dan 100');
    });

    it('should throw error for non-numeric value', () => {
      expect(() => new Score('abc')).toThrow('Skor harus berupa angka');
    });

    it('should accept boundary values', () => {
      expect(() => new Score(0)).not.toThrow();
      expect(() => new Score(100)).not.toThrow();
    });

    it('should be immutable', () => {
      const score = new Score(80);
      expect(() => { score._value = 90; }).toThrow();
    });
  });

  describe('Status Methods', () => {
    it('should identify Laik Fungsi (>= 80)', () => {
      expect(new Score(80).isLaikFungsi()).toBe(true);
      expect(new Score(95).isLaikFungsi()).toBe(true);
      expect(new Score(79).isLaikFungsi()).toBe(false);
    });

    it('should identify Bersyarat (60-79)', () => {
      expect(new Score(60).isBersyarat()).toBe(true);
      expect(new Score(75).isBersyarat()).toBe(true);
      expect(new Score(79).isBersyarat()).toBe(true);
      expect(new Score(80).isBersyarat()).toBe(false);
      expect(new Score(59).isBersyarat()).toBe(false);
    });

    it('should identify Tidak Laik (< 60)', () => {
      expect(new Score(59).isTidakLaik()).toBe(true);
      expect(new Score(0).isTidakLaik()).toBe(true);
      expect(new Score(60).isTidakLaik()).toBe(false);
    });

    it('should return correct status string', () => {
      expect(new Score(85).getStatus()).toBe('LAIK_FUNGSI');
      expect(new Score(70).getStatus()).toBe('LAIK_FUNGSI_BERSYARAT');
      expect(new Score(50).getStatus()).toBe('TIDAK_LAIK_FUNGSI');
    });

    it('should return correct grade', () => {
      expect(new Score(95).getGrade()).toBe('A');
      expect(new Score(85).getGrade()).toBe('B');
      expect(new Score(75).getGrade()).toBe('C');
      expect(new Score(65).getGrade()).toBe('D');
      expect(new Score(55).getGrade()).toBe('E');
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add scores', () => {
      const score1 = new Score(70);
      const score2 = new Score(20);
      const result = score1.add(score2);

      expect(result.value).toBe(90);
      expect(score1.value).toBe(70); // Original unchanged
    });

    it('should cap addition at 100', () => {
      const score1 = new Score(80);
      const score2 = new Score(30);
      const result = score1.add(score2);

      expect(result.value).toBe(100);
    });

    it('should subtract scores', () => {
      const score1 = new Score(50);
      const score2 = new Score(20);
      const result = score1.subtract(score2);

      expect(result.value).toBe(30);
      expect(score1.value).toBe(50); // Original unchanged
    });

    it('should floor subtraction at 0', () => {
      const score1 = new Score(10);
      const score2 = new Score(20);
      const result = score1.subtract(score2);

      expect(result.value).toBe(0);
    });

    it('should calculate percentage', () => {
      const score = new Score(50);
      expect(score.percentageOf(100)).toBe(50);
      expect(score.percentageOf(200)).toBe(25);
    });
  });

  describe('Comparison', () => {
    it('should compare equality', () => {
      const score1 = new Score(75);
      const score2 = new Score(75);
      const score3 = new Score(80);

      expect(score1.equals(score2)).toBe(true);
      expect(score1.equals(score3)).toBe(false);
    });

    it('should compare greater than', () => {
      const score1 = new Score(80);
      const score2 = new Score(75);

      expect(score1.greaterThan(score2)).toBe(true);
      expect(score2.greaterThan(score1)).toBe(false);
    });

    it('should compare less than', () => {
      const score1 = new Score(70);
      const score2 = new Score(80);

      expect(score1.lessThan(score2)).toBe(true);
      expect(score2.lessThan(score1)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const score = new Score(85);
      const json = score.toJSON();

      expect(json).toEqual({
        value: 85,
        status: 'LAIK_FUNGSI',
        grade: 'B'
      });
    });

    it('should convert to string', () => {
      const score = new Score(75);
      expect(score.toString()).toBe('75/100');
    });

    it('should create from JSON', () => {
      const json = { value: 90, status: 'LAIK_FUNGSI', grade: 'A' };
      const score = Score.fromJSON(json);

      expect(score.value).toBe(90);
      expect(score.isLaikFungsi()).toBe(true);
    });
  });

  describe('Factory Methods', () => {
    it('should create max score', () => {
      const score = Score.max();
      expect(score.value).toBe(100);
    });

    it('should create min score', () => {
      const score = Score.min();
      expect(score.value).toBe(0);
    });
  });
});
