/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'number'`.
 *
 * Note: this guard matches `'number'` exclusively. Use `isIntegerSchema` for
 * integers, or `isNumericSchema` to match both `'number'` and `'integer'`.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isNumberSchema = (schema) => typeof schema === 'object' && schema !== null && schema.type === 'number';
