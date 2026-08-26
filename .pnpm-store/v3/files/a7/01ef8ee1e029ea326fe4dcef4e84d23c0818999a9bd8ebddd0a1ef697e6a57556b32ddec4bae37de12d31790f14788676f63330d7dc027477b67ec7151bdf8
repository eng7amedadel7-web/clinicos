/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'array'`.
 *
 * After narrowing, array-specific properties such as `items`, `prefixItems`,
 * `minItems`, `maxItems`, and `uniqueItems` become accessible without a
 * manual cast.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isArraySchema = (schema) => typeof schema === 'object' && schema !== null && schema.type === 'array';
