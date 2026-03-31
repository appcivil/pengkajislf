/**
 * SCHEMA VALIDATOR
 * Utilitas sederhana untuk memvalidasi objek data (DTO).
 */
export class SchemaValidator {
  /**
   * Validasi objek berdasarkan aturan sederhana.
   * @param {Object} data - Data yang akan divalidasi.
   * @param {Object} schema - Aturan validasi (required fields).
   */
  static validate(data, schema) {
    const errors = [];
    
    Object.keys(schema).forEach(field => {
      const rule = schema[field];
      const value = data[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
      }

      if (rule.type && typeof value !== rule.type) {
        errors.push(`${field} must be of type ${rule.type}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validation Error: ${errors.join(', ')}`);
    }

    return true;
  }
}
