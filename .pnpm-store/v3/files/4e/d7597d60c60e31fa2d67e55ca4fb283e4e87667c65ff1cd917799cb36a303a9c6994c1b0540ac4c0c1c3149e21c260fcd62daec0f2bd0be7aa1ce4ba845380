import { ClientBuilder, ClientDependenciesBuilder, ClientGeneratorsBuilder, ContextSpec, GeneratorMutator, OpenApiParameterObject, OpenApiReferenceObject, OpenApiSchemaObject, PackageJson, ZodCoerceType, ZodVariantOption, ZodVersionOption } from "@orval/core";

//#region src/compatible-v4.d.ts
declare const isZodVersionV4: (packageJson: PackageJson) => boolean;
/**
 * Resolves whether to emit Zod 4-style output.
 *
 * An explicit `override.zod.version` of `3` or `4` always wins; `'auto'` (the
 * default) falls back to inferring from the output project's resolved `zod`
 * version via {@link isZodVersionV4}. When no package metadata is available,
 * `'auto'` now defaults to Zod 4 so fresh or partially-installed workspaces
 * still get the modern baseline. This keeps generation deterministic when a
 * target is pinned while preserving package-detection for `'auto'`.
 */
declare const resolveIsZodV4: (version: ZodVersionOption | undefined, packageJson: PackageJson | undefined) => boolean;
declare const assertZodTarget: ({
  variant,
  isZodV4
}: {
  variant: ZodVariantOption | undefined;
  isZodV4: boolean;
}) => void;
declare const getZodImportSource: (variant: ZodVariantOption | undefined) => "zod/mini" | "zod";
declare const getZodTypeName: (variant: ZodVariantOption | undefined) => "ZodMiniType" | "ZodType";
//#endregion
//#region src/index.d.ts
declare const getZodDependencies: ClientDependenciesBuilder;
declare const predefinedZodFormats: Set<string>;
interface ZodValidationSchemaDefinition {
  functions: [string, unknown][];
  consts: string[];
}
interface DateTimeOptions {
  offset?: boolean;
  local?: boolean;
  precision?: number;
}
interface TimeOptions {
  precision?: -1 | 0 | 1 | 2 | 3;
}
declare const generateZodValidationSchemaDefinition: (schema: OpenApiSchemaObject | OpenApiReferenceObject | undefined, context: ContextSpec, name: string, strict: boolean, isZodV4: boolean, rules?: {
  required?: boolean;
  /**
   * Required keys inherited from sibling `allOf` members. Per JSON Schema /
   * OpenAPI 3.1, a `required` array in one `allOf` member applies to
   * properties contributed by ANY member, so it is collected at the `allOf`
   * level and applied here. Consumed at THIS object level only — never
   * forwarded into nested property schemas, so a deeper object sharing a key
   * name is unaffected. (#3171)
   */
  additionalRequired?: string[];
  dateTimeOptions?: DateTimeOptions;
  timeOptions?: TimeOptions;
  /**
   * Override schemas for properties at THIS level only.
   * Not passed to nested schemas. Used by form-data for file type handling.
   */
  propertyOverrides?: Record<string, ZodValidationSchemaDefinition>;
  /**
   * Internal registry to keep generated const names unique within a single
   * schema generation tree without leaking suffixes across unrelated top-level
   * schemas.
   */
  constNameRegistry?: Record<string, number>;
  /**
   * When true, plain `$ref`s into `#/components/schemas/*` emit a `namedRef`
   * placeholder instead of being inlined.
   */
  useReusableSchemas?: boolean;
  /**
   * When true, suppress File/Blob coercion for binary string fields anywhere
   * in the tree (`format: binary` / `contentMediaType: application/octet-stream`),
   * keeping them as `string`. Set for `application/x-www-form-urlencoded` bodies,
   * which serialize via URLSearchParams (string-only) — mirrors core's
   * `formDataContext.urlEncoded` handling in getScalar (#1624). Threaded into
   * every recursive call so nested/array/composed fields are covered too.
   */
  urlEncoded?: boolean;
  /**
   * When true (and `isZodV4`), the top-level (named component) schema emits a
   * `.meta({ id, description?, deprecated? })` instead of `.describe(...)`.
   * Set ONLY for top-level component-schema generation — recursive calls omit
   * it, so nested schemas keep `.describe()` and never get a duplicate `id`.
   */
  emitMeta?: boolean;
}) => ZodValidationSchemaDefinition;
/**
 * Runtime shape passed to the user-supplied `override.zod.params` function for
 * every emitted validator. Exported so consumers can type their function with
 * `import type { ZodParamsContext } from 'orval'` instead of hand-writing it.
 */
interface ZodParamsContext {
  /** The OpenAPI `operationId`, or `''` for shared component schemas. */
  operationId: string;
  /** `'schema'` is used for shared component schemas with no owning operation. */
  location: 'param' | 'query' | 'header' | 'body' | 'response' | 'schema';
  /** Generated schema name, e.g. `CreateUserBody`, or the component name. */
  schemaName: string;
  /** Path to the current property within the schema. Only object property names are appended. */
  fieldPath: string[];
  /** The Zod method being emitted, e.g. `'string'`, `'min'`, `'email'`. */
  validator: string;
}
interface ZodParamsInjection extends Pick<ZodParamsContext, 'operationId' | 'location' | 'schemaName'> {
  mutator: GeneratorMutator;
}
declare const parseZodValidationSchemaDefinition: (input: ZodValidationSchemaDefinition, context: ContextSpec, coerceTypes: boolean | ZodCoerceType[] | undefined, strict: boolean, isZodV4: boolean, preprocess?: GeneratorMutator, paramsInjection?: ZodParamsInjection, variant?: ZodVariantOption, exactOptional?: boolean) => {
  zod: string;
  consts: string;
  usedRefs: Set<string>;
};
/**
 * Recursively inlines all `$ref` and `$dynamicRef` references in an OpenAPI
 * schema tree, producing a fully-resolved schema suitable for Zod code generation.
 *
 * Tracks visited `$ref` paths via `context.parents` to break circular
 * references (returning `{}` for cycles).
 *
 * `$dynamicRef` is resolved using the dynamic scope attached to `context`:
 *  1. Look up the anchor name in `context.dynamicScope`.
 *  2. If not found, fall back to scanning `components.schemas` for a schema
 *     that declares `$dynamicAnchor` with the same name.
 *  3. If resolved to a concrete schema, inline it (same as `$ref`).
 *  4. If unresolved, external, or a generic parameter → return `{}`.
 */
declare const dereference: (schema: OpenApiSchemaObject | OpenApiReferenceObject, context: ContextSpec) => OpenApiSchemaObject;
/**
 * Generate zod schema for form-data request body.
 * Handles file type detection for top-level properties based on encoding.contentType
 * and contentMediaType. Mirrors type gen's resolveFormDataRootObject.
 */
declare const generateFormDataZodSchema: (schema: OpenApiSchemaObject, context: ContextSpec, name: string, strict: boolean, isZodV4: boolean, encoding?: Record<string, {
  contentType?: string;
}>, useReusableSchemas?: boolean) => ZodValidationSchemaDefinition;
declare const parseParameters: ({
  data,
  context,
  operationName,
  isZodV4,
  strict,
  generate,
  useReusableSchemas
}: {
  data: (OpenApiParameterObject | OpenApiReferenceObject)[] | undefined;
  context: ContextSpec;
  operationName: string;
  isZodV4: boolean;
  strict: {
    param: boolean;
    query: boolean;
    header: boolean;
    body: boolean;
    response: boolean;
  };
  generate: {
    param: boolean;
    query: boolean;
    header: boolean;
    body: boolean;
    response: boolean;
  };
  useReusableSchemas?: boolean;
}) => {
  headers: ZodValidationSchemaDefinition;
  queryParams: ZodValidationSchemaDefinition;
  params: ZodValidationSchemaDefinition;
};
declare const generateZod: ClientBuilder;
declare const builder: () => () => ClientGeneratorsBuilder;
//#endregion
export { ZodParamsContext, ZodParamsInjection, ZodValidationSchemaDefinition, assertZodTarget, builder, builder as default, dereference, generateFormDataZodSchema, generateZod, generateZodValidationSchemaDefinition, getZodDependencies, getZodImportSource, getZodTypeName, isZodVersionV4, parseParameters, parseZodValidationSchemaDefinition, predefinedZodFormats, resolveIsZodV4 };
//# sourceMappingURL=index.d.mts.map