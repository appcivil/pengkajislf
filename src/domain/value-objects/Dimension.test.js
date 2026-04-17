import { describe, it, expect } from 'vitest';
import { Dimension } from './Dimension.js';

describe('Dimension Value Object', () => {
  describe('Constructor', () => {
    it('should create Dimension with valid data', () => {
      const dim = new Dimension({ width: 10, height: 5, depth: 3, unit: 'm' });
      expect(dim.width).toBe(10);
      expect(dim.height).toBe(5);
      expect(dim.depth).toBe(3);
      expect(dim.unit).toBe('m');
    });

    it('should create 2D dimension with default depth', () => {
      const dim = new Dimension({ width: 10, height: 5 });
      expect(dim.depth).toBe(0);
      expect(dim.unit).toBe('m');
    });

    it('should throw error for missing width', () => {
      expect(() => new Dimension({ height: 5 })).toThrow('width harus diisi');
    });

    it('should throw error for missing height', () => {
      expect(() => new Dimension({ width: 10 })).toThrow('height harus diisi');
    });

    it('should throw error for non-numeric values', () => {
      expect(() => new Dimension({ width: 'abc', height: 5 })).toThrow('width harus berupa angka');
    });

    it('should throw error for negative values', () => {
      expect(() => new Dimension({ width: -10, height: 5 })).toThrow('width tidak boleh negatif');
    });

    it('should be immutable', () => {
      const dim = new Dimension({ width: 10, height: 5 });
      expect(() => { dim._width = 20; }).toThrow();
    });
  });

  describe('Calculated Properties', () => {
    it('should calculate area', () => {
      const dim = new Dimension({ width: 10, height: 5 });
      expect(dim.area).toBe(50);
    });

    it('should calculate volume', () => {
      const dim = new Dimension({ width: 10, height: 5, depth: 3 });
      expect(dim.volume).toBe(150);
    });

    it('should calculate perimeter', () => {
      const dim = new Dimension({ width: 10, height: 5 });
      expect(dim.perimeter).toBe(30);
    });

    it('should calculate diagonal', () => {
      const dim = new Dimension({ width: 3, height: 4 });
      expect(dim.diagonal).toBe(5);
    });

    it('should return 0 for wall area in 2D', () => {
      const dim = new Dimension({ width: 10, height: 5 });
      expect(dim.wallArea).toBe(0);
    });

    it('should calculate wall area for 3D', () => {
      const dim = new Dimension({ width: 10, height: 5, depth: 3 });
      expect(dim.wallArea).toBe(90); // 2 * (10 + 5) * 3
    });
  });

  describe('Methods', () => {
    it('should scale dimensions', () => {
      const dim = new Dimension({ width: 10, height: 5, depth: 3 });
      const scaled = dim.scale(2);

      expect(scaled.width).toBe(20);
      expect(scaled.height).toBe(10);
      expect(scaled.depth).toBe(6);
    });

    it('should convert units', () => {
      const dim = new Dimension({ width: 10, height: 5, unit: 'm' });
      const converted = dim.convertTo('cm', 100);

      expect(converted.width).toBe(1000);
      expect(converted.height).toBe(500);
      expect(converted.unit).toBe('cm');
    });

    it('should compare equality', () => {
      const dim1 = new Dimension({ width: 10, height: 5 });
      const dim2 = new Dimension({ width: 10, height: 5 });
      const dim3 = new Dimension({ width: 8, height: 5 });

      expect(dim1.equals(dim2)).toBe(true);
      expect(dim1.equals(dim3)).toBe(false);
    });

    it('should compare volume', () => {
      const dim1 = new Dimension({ width: 10, height: 5, depth: 3 }); // vol = 150
      const dim2 = new Dimension({ width: 5, height: 5, depth: 5 }); // vol = 125

      expect(dim1.largerThan(dim2)).toBe(true);
      expect(dim2.largerThan(dim1)).toBe(false);
    });
  });

  describe('Compliance Checks', () => {
    it('should check minimum area', () => {
      const dim = new Dimension({ width: 10, height: 5 }); // area = 50

      expect(dim.meetsMinimumArea(40)).toBe(true);
      expect(dim.meetsMinimumArea(60)).toBe(false);
    });

    it('should check aspect ratio', () => {
      const dim = new Dimension({ width: 10, height: 5 }); // ratio = 2:1

      expect(dim.meetsAspectRatio(1.5, 2.5)).toBe(true);
      expect(dim.meetsAspectRatio(2.5, 3.0)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const dim = new Dimension({ width: 10, height: 5, depth: 3 });
      const json = dim.toJSON();

      expect(json).toEqual({
        width: 10,
        height: 5,
        depth: 3,
        unit: 'm',
        area: 50,
        volume: 150
      });
    });

    it('should convert 2D to string', () => {
      const dim = new Dimension({ width: 10, height: 5 });
      expect(dim.toString()).toBe('10 x 5 m');
    });

    it('should convert 3D to string', () => {
      const dim = new Dimension({ width: 10, height: 5, depth: 3 });
      expect(dim.toString()).toBe('10 x 5 x 3 m');
    });

    it('should create from JSON', () => {
      const json = { width: 8, height: 6, depth: 4, unit: 'm' };
      const dim = Dimension.fromJSON(json);

      expect(dim.width).toBe(8);
      expect(dim.height).toBe(6);
      expect(dim.depth).toBe(4);
    });
  });

  describe('Factory Methods', () => {
    it('should create square', () => {
      const square = Dimension.square(10, 'm');
      expect(square.width).toBe(10);
      expect(square.height).toBe(10);
      expect(square.depth).toBe(0);
      expect(square.area).toBe(100);
    });

    it('should create cube', () => {
      const cube = Dimension.cube(5, 'm');
      expect(cube.width).toBe(5);
      expect(cube.height).toBe(5);
      expect(cube.depth).toBe(5);
      expect(cube.volume).toBe(125);
    });
  });
});
