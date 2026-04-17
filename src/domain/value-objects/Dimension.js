// ============================================================
// DIMENSION VALUE OBJECT
// Representasi immutable untuk dimensi ruang/bangunan
// ============================================================

import { DomainError } from '../errors/DomainError.js';

export class Dimension {
  constructor({ width, height, depth = 0, unit = 'm' }) {
    this._validate({ width, height, depth });
    this._width = Number(width);
    this._height = Number(height);
    this._depth = Number(depth);
    this._unit = unit;
    Object.freeze(this);
  }

  get width() { return this._width; }
  get height() { return this._height; }
  get depth() { return this._depth; }
  get unit() { return this._unit; }

  _validate({ width, height, depth }) {
    [width, height, depth].forEach((dim, idx) => {
      const name = ['width', 'height', 'depth'][idx];
      if (dim === undefined || dim === null) {
        throw new DomainError(`${name} harus diisi`, `INVALID_${name.toUpperCase()}`);
      }
      if (isNaN(Number(dim))) {
        throw new DomainError(`${name} harus berupa angka`, `INVALID_${name.toUpperCase()}_TYPE`);
      }
      if (Number(dim) < 0) {
        throw new DomainError(`${name} tidak boleh negatif`, `INVALID_${name.toUpperCase()}_NEGATIVE`);
      }
    });
  }

  // Calculated properties
  get area() {
    return this._width * this._height;
  }

  get volume() {
    return this._width * this._height * this._depth;
  }

  get perimeter() {
    return 2 * (this._width + this._height);
  }

  get diagonal() {
    return Math.sqrt(Math.pow(this._width, 2) + Math.pow(this._height, 2));
  }

  // Space calculations
  get floorArea() {
    return this.area;
  }

  get wallArea() {
    if (this._depth === 0) return 0;
    return 2 * (this._width + this._height) * this._depth;
  }

  // Methods
  scale(factor) {
    return new Dimension({
      width: this._width * factor,
      height: this._height * factor,
      depth: this._depth * factor,
      unit: this._unit
    });
  }

  convertTo(newUnit, conversionFactor) {
    return new Dimension({
      width: this._width * conversionFactor,
      height: this._height * conversionFactor,
      depth: this._depth * conversionFactor,
      unit: newUnit
    });
  }

  // Comparison
  equals(other) {
    return other instanceof Dimension &&
      this._width === other.width &&
      this._height === other.height &&
      this._depth === other.depth;
  }

  largerThan(other) {
    return this.volume > other.volume;
  }

  // Compliance checks
  meetsMinimumArea(minArea) {
    return this.area >= minArea;
  }

  meetsAspectRatio(minRatio, maxRatio) {
    const ratio = this._width / this._height;
    return ratio >= minRatio && ratio <= maxRatio;
  }

  // Serialization
  toJSON() {
    return {
      width: this._width,
      height: this._height,
      depth: this._depth,
      unit: this._unit,
      area: this.area,
      volume: this.volume
    };
  }

  toString() {
    if (this._depth === 0) {
      return `${this._width} x ${this._height} ${this._unit}`;
    }
    return `${this._width} x ${this._height} x ${this._depth} ${this._unit}`;
  }

  // Factory methods
  static fromJSON(json) {
    return new Dimension(json);
  }

  static square(size, unit = 'm') {
    return new Dimension({ width: size, height: size, depth: 0, unit });
  }

  static cube(size, unit = 'm') {
    return new Dimension({ width: size, height: size, depth: size, unit });
  }
}
