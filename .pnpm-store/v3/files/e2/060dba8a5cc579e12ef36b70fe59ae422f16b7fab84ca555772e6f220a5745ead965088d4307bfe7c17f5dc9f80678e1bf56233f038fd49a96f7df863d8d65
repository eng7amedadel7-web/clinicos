/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'integer'`.
 *
 * Note: this guard matches `'integer'` exclusively. Use `isNumericSchema` to
 * match both `'number'` and `'integer'`.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isIntegerSchema = (schema) => typeof schema === 'object' && schema !== null && schema.type === 'integer';
