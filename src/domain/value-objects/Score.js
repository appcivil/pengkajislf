// ============================================================
// SCORE VALUE OBJECT
// Representasi immutable untuk nilai skor SLF
// ============================================================

import { DomainError } from '../errors/DomainError.js';

export class Score {
  constructor(value) {
    this._validate(value);
    this._value = Number(value);
    Object.freeze(this);
  }

  get value() {
    return this._value;
  }

  _validate(value) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new DomainError('Skor harus berupa angka', 'INVALID_SCORE_TYPE');
    }
    if (num < 0 || num > 100) {
      throw new DomainError('Skor harus antara 0 dan 100', 'INVALID_SCORE_RANGE');
    }
  }

  // Business logic
  isLaikFungsi() {
    return this._value >= 80;
  }

  isBersyarat() {
    return this._value >= 60 && this._value < 80;
  }

  isTidakLaik() {
    return this._value < 60;
  }

  getStatus() {
    if (this.isLaikFungsi()) return 'LAIK_FUNGSI';
    if (this.isBersyarat()) return 'LAIK_FUNGSI_BERSYARAT';
    return 'TIDAK_LAIK_FUNGSI';
  }

  getGrade() {
    if (this._value >= 90) return 'A';
    if (this._value >= 80) return 'B';
    if (this._value >= 70) return 'C';
    if (this._value >= 60) return 'D';
    return 'E';
  }

  // Arithmetic operations return new instances (immutable)
  add(other) {
    return new Score(Math.min(100, this._value + other.value));
  }

  subtract(other) {
    return new Score(Math.max(0, this._value - other.value));
  }

  percentageOf(total) {
    return (this._value / total) * 100;
  }

  // Comparison
  equals(other) {
    return other instanceof Score && this._value === other.value;
  }

  greaterThan(other) {
    return this._value > other.value;
  }

  lessThan(other) {
    return this._value < other.value;
  }

  // Serialization
  toJSON() {
    return {
      value: this._value,
      status: this.getStatus(),
      grade: this.getGrade()
    };
  }

  toString() {
    return `${this._value}/100`;
  }

  // Factory methods
  static fromJSON(json) {
    return new Score(json.value);
  }

  static max() {
    return new Score(100);
  }

  static min() {
    return new Score(0);
  }
}
