import { isBoolean, isFunction, isNullish, isNumber, isString } from "remeda";
import { CompareOperator } from "compare-versions";
import debug from "debug";
import { allLocales } from "@faker-js/faker";
import { OpenAPIV3_1 } from "@scalar/openapi-types";
import { TypeDocOptions } from "typedoc";

//#region src/types.d.ts
declare const SupportedFormatter: {
  readonly PRETTIER: "prettier";
  readonly BIOME: "biome";
  readonly OXFMT: "oxfmt";
};
type SupportedFormatter = (typeof SupportedFormatter)[keyof typeof SupportedFormatter];
interface Options {
  output?: string | OutputOptions;
  input?: string | string[] | InputOptions;
  hooks?: Partial<HooksOptions>;
}
type OptionsFn = () => Options | Promise<Options>;
type OptionsExport = Options | Promise<Options> | OptionsFn;
type Config = Record<string, OptionsExport>;
type ConfigFn = () => Config | Promise<Config>;
type ConfigExternal = Config | Promise<Config> | ConfigFn;
type NormalizedConfig = Record<string, NormalizedOptions | undefined>;
interface NormalizedOptions {
  output: NormalizedOutputOptions;
  input: NormalizedInputOptions;
  hooks: NormalizedHookOptions;
}
interface NormalizedOutputOptions {
  workspace?: string;
  target: string;
  schemas?: string | NormalizedSchemaOptions;
  operationSchemas?: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  /**
   * File extension for schema artifacts (TS types or Zod schemas) under
   * `schemas:`. Defaults to `.zod.ts` when the output is Zod schemas
   * (`schemas: { type: 'zod' }` or `client: 'zod'` + `generateReusableSchemas`),
   * otherwise `.ts`. A user-set `output.fileExtension` always wins.
   */
  schemaFileExtension: string;
  mode: OutputMode;
  mock: NormalizedMocksConfig;
  override: NormalizedOverrideOutput;
  client: OutputClient | OutputClientFunc;
  httpClient: OutputHttpClient;
  clean: boolean | string[];
  docs: boolean | OutputDocsOptions;
  formatter?: SupportedFormatter;
  tsconfig?: Tsconfig;
  packageJson?: PackageJson;
  headers: boolean;
  indexFiles: boolean;
  baseUrl?: string | BaseUrlFromSpec | BaseUrlFromConstant | BaseUrlRuntime;
  allParamsOptional: boolean;
  urlEncodeParameters: boolean;
  unionAddMissingProperties: boolean;
  optionsParamRequired: boolean;
  propertySortOrder: PropertySortOrder;
  factoryMethods?: NormalizedFactoryMethodsOptions;
  tagsSplitDeduplication: boolean;
  commonTypesFileName: string;
}
interface NormalizedParamsSerializerOptions {
  qs?: Record<string, unknown>;
}
/**
 * Controls how readonly properties are treated when a schema is reused as a request body.
 *
 * Best practice:
 * - `strip` (default): recommended for most OpenAPI specs, because `readOnly`
 *   properties are response-oriented and generally should not constrain request
 *   payload authoring.
 * - `preserve`: use when your schema intentionally models immutable request DTOs
 *   and you want generated request-body types to keep readonly modifiers.
 *
 * Note: this applies to request bodies regardless of the generated client style
 * (`httpClient`, `httpResource`, etc.). `httpResource` still issues request
 * payloads, so the same OpenAPI guidance applies.
 *
 * If we later want a stricter OpenAPI-aligned mode that omits `readOnly`
 * properties from request bodies entirely, that should be introduced as a new
 * explicit mode rather than overloading `preserve`.
 */
type ReadonlyRequestBodiesMode = 'strip' | 'preserve';
interface NormalizedOverrideOutput {
  title?: (title: string) => string;
  transformer?: OutputTransformer;
  mutator?: NormalizedMutator;
  operations: Record<string, NormalizedOperationOptions | undefined>;
  tags: Record<string, NormalizedOperationOptions | undefined>;
  mock?: OverrideMockOptions;
  contentType?: OverrideOutputContentType;
  header: false | ((info: OpenApiInfoObject) => string[] | string);
  formData: NormalizedFormDataType<NormalizedMutator>;
  formUrlEncoded: boolean | NormalizedMutator;
  paramsSerializer?: NormalizedMutator;
  paramsSerializerOptions?: NormalizedParamsSerializerOptions;
  paramsFilter?: NormalizedMutator;
  namingConvention: {
    enum?: NamingConvention;
  };
  components: {
    schemas: {
      suffix: string;
      itemSuffix: string;
    };
    responses: {
      suffix: string;
    };
    parameters: {
      suffix: string;
    };
    requestBodies: {
      suffix: string;
    };
  };
  hono: NormalizedHonoOptions;
  mcp: NormalizedMcpOptions;
  query: NormalizedQueryOptions;
  angular: NormalizedAngularOptions;
  swr: SwrOptions;
  zod: NormalizedZodOptions;
  effect: NormalizedEffectOptions;
  fetch: NormalizedFetchOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  requestOptions: Record<string, unknown> | boolean;
  useDates?: boolean;
  useTypeOverInterfaces?: boolean;
  useDeprecatedOperations?: boolean;
  useBigInt?: boolean;
  useNamedParameters?: boolean;
  enumGenerationType: EnumGeneration;
  suppressReadonlyModifier?: boolean;
  /**
   * Controls how readonly properties are handled for generated request-body types.
   *
   * Prefer `strip` for most OpenAPI specs because `readOnly` fields are
   * response-oriented. Use `preserve` only when your request DTOs are
   * intentionally immutable and should remain readonly in generated types.
   */
  preserveReadonlyRequestBodies?: ReadonlyRequestBodiesMode;
  /**
   * When enabled, operations with multiple request body content-types
   * (e.g. both `multipart/form-data` and `application/json`) will generate
   * separate functions for each content type instead of a single function
   * with a union type parameter.
   *
   * @example
   * // With splitByContentType: true
   * updateProfileWithFormData(body: FormDataType) => { ... }
   * updateProfileWithJson(body: JsonType) => { ... }
   *
   * // With splitByContentType: false (default)
   * updateProfile(body: FormDataType | JsonType) => { ... }
   *
   * @default false
   */
  splitByContentType: boolean;
  jsDoc: NormalizedJsDocOptions;
  aliasCombinedTypes: boolean;
  /**
   * When enabled, optional properties will be typed as `T | null` instead of just `T`.
   * @default false
   */
  useNullForOptional?: boolean;
}
interface NormalizedMutator {
  path: string;
  resolvedPath?: string;
  name?: string;
  default: boolean;
  alias?: Record<string, string>;
  external?: string[];
  extension?: string;
}
interface NormalizedOperationOptions {
  transformer?: OutputTransformer;
  mutator?: NormalizedMutator;
  mock?: {
    data?: MockData;
    properties?: MockProperties;
  };
  contentType?: OverrideOutputContentType;
  query?: NormalizedQueryOptions;
  angular?: NormalizedAngularOptions;
  swr?: SwrOptions;
  zod?: NormalizedOperationZodOptions;
  effect?: NormalizedEffectOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  fetch?: FetchOptions;
  formData?: NormalizedFormDataType<NormalizedMutator>;
  formUrlEncoded?: boolean | NormalizedMutator;
  paramsSerializer?: NormalizedMutator;
  paramsFilter?: NormalizedMutator;
  requestOptions?: object | boolean;
}
interface NormalizedInputOptions {
  target: string | OpenApiDocument;
  override: OverrideInput;
  unsafeDisableValidation: boolean;
  filters?: InputFiltersOptions;
  parserOptions?: {
    headers?: {
      domains: string[];
      headers: Record<string, string>;
    }[];
    externalRefs?: {
      allow?: string[];
    };
  };
}
type OutputClientFunc = (clients: GeneratorClients) => ClientGeneratorsBuilder;
interface BaseUrlFromSpec {
  getBaseUrlFromSpecification: true;
  variables?: Record<string, string>;
  index?: number;
  baseUrl?: never;
}
interface BaseUrlFromConstant {
  getBaseUrlFromSpecification: false;
  variables?: never;
  index?: never;
  baseUrl: string;
}
/**
 * Embed a runtime JavaScript expression into generated URL template literals
 * (e.g. `process.env.API_BASE_URL`) so the same build can target different hosts at runtime.
 */
interface BaseUrlRuntime {
  runtime: string;
  /** Named imports for symbols used in `runtime` (e.g. `{ name: 'apiBase', importPath: '../config' }`). */
  imports?: GeneratorImport[];
  getBaseUrlFromSpecification?: never;
  baseUrl?: never;
}
declare const PropertySortOrder: {
  readonly ALPHABETICAL: "Alphabetical";
  readonly SPECIFICATION: "Specification";
};
type PropertySortOrder = (typeof PropertySortOrder)[keyof typeof PropertySortOrder];
declare const NamingConvention: {
  readonly CAMEL_CASE: "camelCase";
  readonly PASCAL_CASE: "PascalCase";
  readonly SNAKE_CASE: "snake_case";
  readonly KEBAB_CASE: "kebab-case";
};
type NamingConvention = (typeof NamingConvention)[keyof typeof NamingConvention];
declare const EnumGeneration: {
  readonly CONST: "const";
  readonly ENUM: "enum";
  readonly UNION: "union";
};
type EnumGeneration = (typeof EnumGeneration)[keyof typeof EnumGeneration];
type SchemaGenerationType = 'typescript' | 'zod';
type FactoryMethodsMode = 'single' | 'split' | 'single-split';
interface FactoryMethodsOptions {
  functionNamePrefix?: string;
  mode?: FactoryMethodsMode;
  outputDirectory?: string;
  includeOptionalProperty?: boolean;
}
interface NormalizedFactoryMethodsOptions {
  functionNamePrefix: string;
  mode: FactoryMethodsMode;
  outputDirectory: string;
  includeOptionalProperty: boolean;
}
interface SchemaOptions {
  path: string;
  type?: SchemaGenerationType;
  importPath?: string;
  /**
   * When `true`, schemas are organized into per-tag subdirectories instead of
   * a single flat directory. Schemas referenced by multiple tags remain at the
   * root of the schema directory.
   *
   * @default false
   */
  splitByTags?: boolean;
}
interface NormalizedSchemaOptions {
  path: string;
  type: SchemaGenerationType;
  importPath?: string;
  splitByTags: boolean;
}
interface OutputOptions {
  workspace?: string;
  target: string;
  schemas?: string | SchemaOptions | false;
  /**
   * Separate path for operation-derived types (params, bodies, responses).
   * When set, types matching operation patterns (e.g., *Params, *Body) are written here
   * while regular schema types remain in the `schemas` path.
   */
  operationSchemas?: string;
  namingConvention?: NamingConvention;
  fileExtension?: string;
  /**
   * Optional file extension applied only to schema artifacts (TS types or
   * Zod schemas) under `schemas:`. Takes precedence over `fileExtension`
   * for schema files. Defaults to `.zod.ts` when the output is Zod schemas
   * (`schemas: { type: 'zod' }` or `client: 'zod'` + `generateReusableSchemas`),
   * otherwise mirrors `fileExtension`.
   */
  schemaFileExtension?: string;
  mode?: OutputMode;
  mock?: OutputMocksOption;
  override?: OverrideOutput;
  client?: OutputClient | OutputClientFunc;
  httpClient?: OutputHttpClient;
  clean?: boolean | string[];
  docs?: boolean | OutputDocsOptions;
  formatter?: SupportedFormatter;
  tsconfig?: string | Tsconfig;
  packageJson?: string;
  headers?: boolean;
  indexFiles?: boolean;
  baseUrl?: string | BaseUrlFromSpec | BaseUrlFromConstant | BaseUrlRuntime;
  allParamsOptional?: boolean;
  urlEncodeParameters?: boolean;
  unionAddMissingProperties?: boolean;
  optionsParamRequired?: boolean;
  propertySortOrder?: PropertySortOrder;
  factoryMethods?: FactoryMethodsOptions;
  tagsSplitDeduplication?: boolean;
  commonTypesFileName?: string;
}
interface InputFiltersOptions {
  mode?: 'include' | 'exclude';
  tags?: (string | RegExp)[];
  schemas?: (string | RegExp)[];
  /**
   * When `tags` is set, orval limits the output to only the schemas referenced
   * by the matching operations. Set this to `true` to keep every
   * `#/components/schemas` entry (including unreferenced ones) while still
   * filtering endpoints by `tags`. The other component sections (`responses`,
   * `parameters`, `requestBodies`) remain pruned to what the matching
   * operations use. Ignored when `schemas` is set.
   *
   * @default false
   */
  includeUnreferencedSchemas?: boolean;
}
interface InputOptions {
  target: string | string[] | Record<string, unknown> | OpenApiDocument;
  override?: OverrideInput;
  /**
   * Disable OpenAPI spec validation.
   *
   * **Use at your own risk** — code generation with invalid specs is not guaranteed
   * to work and may break in minor updates. Bug reports with validation disabled are
   * not accepted.
   *
   * @default false
   */
  unsafeDisableValidation?: boolean;
  filters?: InputFiltersOptions;
  parserOptions?: {
    headers?: {
      domains: string[];
      headers: Record<string, string>;
    }[];
    /**
     * Control how external `$ref` targets (local files or remote URLs) are
     * resolved.
     *
     * By default, orval refuses to resolve any external `$ref` and prints a
     * config snippet you can paste into your `parserOptions`.
     */
    externalRefs?: {
      /**
       * External `$ref` document targets to allow. Each entry should be the
       * document part of the `$ref` (without the `#/...` fragment). File paths
       * are relative to the spec file. Use `['*']` to allow all external refs.
       *
       * @default []
       */
      allow?: string[];
    };
  };
}
declare const OutputClient: {
  readonly ANGULAR: "angular";
  readonly ANGULAR_QUERY: "angular-query";
  readonly AXIOS: "axios";
  readonly AXIOS_FUNCTIONS: "axios-functions";
  readonly REACT_QUERY: "react-query";
  readonly SOLID_START: "solid-start";
  readonly SOLID_QUERY: "solid-query";
  readonly SVELTE_QUERY: "svelte-query";
  readonly VUE_QUERY: "vue-query";
  readonly SWR: "swr";
  readonly ZOD: "zod";
  readonly EFFECT: "effect";
  readonly HONO: "hono";
  readonly FETCH: "fetch";
  readonly MCP: "mcp";
};
type OutputClient = (typeof OutputClient)[keyof typeof OutputClient];
declare const OutputHttpClient: {
  readonly AXIOS: "axios";
  readonly FETCH: "fetch";
  readonly ANGULAR: "angular";
};
type OutputHttpClient = (typeof OutputHttpClient)[keyof typeof OutputHttpClient];
declare const OutputMode: {
  readonly SINGLE: "single";
  readonly SPLIT: "split";
  readonly TAGS: "tags";
  readonly TAGS_SPLIT: "tags-split";
  readonly TAGS_OPERATIONS: "tags-operations";
  readonly TAGS_OPERATIONS_SPLIT: "tags-operations-split";
};
type OutputMode = (typeof OutputMode)[keyof typeof OutputMode];
type OutputDocsOptions = {
  configPath?: string;
} & Partial<TypeDocOptions>;
declare const OutputMockType: {
  readonly MSW: "msw";
  readonly FAKER: "faker";
};
type OutputMockType = (typeof OutputMockType)[keyof typeof OutputMockType];
type PreferredContentType = 'application/json' | 'application/xml' | 'text/plain' | 'text/html' | 'application/octet-stream' | (string & {});
interface CommonMockOptions {
  useExamples?: boolean;
  generateEachHttpStatus?: boolean;
  locale?: keyof typeof allLocales;
  preferredContentType?: string;
  arrayItems?: boolean;
}
interface MswMockOptions extends CommonMockOptions {
  type: typeof OutputMockType.MSW;
  operationResponses?: boolean;
  baseUrl?: string;
  delay?: false | number | (() => number);
  delayFunctionLazyExecute?: boolean;
  path?: string;
}
interface FakerMockOptions extends CommonMockOptions {
  type: typeof OutputMockType.FAKER;
  schemas?: boolean;
  schemasImportPath?: string;
  operationResponses?: boolean;
  path?: string;
}
type GlobalMockOptions = MswMockOptions | FakerMockOptions;
interface OutputMocksConfig {
  indexMockFiles?: boolean;
  path?: string;
  generators: (GlobalMockOptions | ClientMockBuilder)[];
}
type OutputMocksOption = boolean | OutputMocksConfig | ClientMockBuilder;
interface NormalizedMocksConfig {
  indexMockFiles: boolean;
  path?: string;
  generators: (GlobalMockOptions | ClientMockBuilder)[];
}
type OverrideMockOptions = Partial<GlobalMockOptions> & {
  arrayMin?: number;
  arrayMax?: number;
  stringMin?: number;
  stringMax?: number;
  numberMin?: number;
  numberMax?: number;
  required?: boolean;
  nonNullable?: boolean;
  properties?: MockProperties;
  schemas?: Record<string, {
    properties: MockProperties;
  }>;
  format?: Record<string, unknown>;
  fractionDigits?: number;
};
type MockOptions = Omit<OverrideMockOptions, 'properties' | 'schemas'> & {
  properties?: Record<string, unknown>;
  operations?: Record<string, {
    properties: Record<string, unknown>;
  }>;
  tags?: Record<string, {
    properties: Record<string, unknown>;
  }>;
  schemas?: Record<string, {
    properties: Record<string, unknown>;
  }>;
};
type MockPropertiesObject = Record<string, unknown>;
type MockPropertiesObjectFn = (specs: OpenApiDocument) => MockPropertiesObject;
type MockProperties = MockPropertiesObject | MockPropertiesObjectFn;
type MockDataObject = Record<string, unknown>;
type MockDataObjectFn = (specs: OpenApiDocument) => MockDataObject;
type MockDataArray = unknown[];
type MockDataArrayFn = (specs: OpenApiDocument) => MockDataArray;
type MockData = MockDataObject | MockDataObjectFn | MockDataArray | MockDataArrayFn;
type OutputTransformerFn = (verb: GeneratorVerbOptions) => GeneratorVerbOptions;
type OutputTransformer = string | OutputTransformerFn;
interface MutatorObject {
  path: string;
  name?: string;
  default?: boolean;
  alias?: Record<string, string>;
  external?: string[];
  extension?: string;
}
type Mutator = string | MutatorObject;
interface ParamsSerializerOptions {
  qs?: Record<string, unknown>;
}
declare const FormDataArrayHandling: {
  readonly SERIALIZE: "serialize";
  readonly EXPLODE: "explode";
  readonly SERIALIZE_WITH_BRACKETS: "serialize-with-brackets";
};
type FormDataArrayHandling = (typeof FormDataArrayHandling)[keyof typeof FormDataArrayHandling];
type NormalizedFormDataType<TMutator> = {
  disabled: true;
  mutator?: never;
  arrayHandling: FormDataArrayHandling;
} | {
  disabled: false;
  mutator?: TMutator;
  arrayHandling: FormDataArrayHandling;
};
type FormDataType<TMutator> = {
  mutator: TMutator;
  arrayHandling?: FormDataArrayHandling;
} | {
  mutator?: TMutator;
  arrayHandling: FormDataArrayHandling;
};
interface OverrideOutput {
  title?: (title: string) => string;
  transformer?: OutputTransformer;
  mutator?: Mutator;
  operations?: Record<string, OperationOptions>;
  tags?: Record<string, OperationOptions>;
  mock?: OverrideMockOptions;
  contentType?: OverrideOutputContentType;
  header?: boolean | ((info: OpenApiInfoObject) => string[] | string);
  formData?: boolean | Mutator | FormDataType<Mutator>;
  formUrlEncoded?: boolean | Mutator;
  paramsSerializer?: Mutator;
  paramsSerializerOptions?: ParamsSerializerOptions;
  paramsFilter?: Mutator;
  namingConvention?: {
    enum?: NamingConvention;
  };
  components?: {
    schemas?: {
      suffix?: string;
      itemSuffix?: string;
    };
    responses?: {
      suffix?: string;
    };
    parameters?: {
      suffix?: string;
    };
    requestBodies?: {
      suffix?: string;
    };
  };
  hono?: HonoOptions;
  mcp?: McpOptions;
  query?: QueryOptions;
  swr?: SwrOptions;
  angular?: AngularOptions;
  zod?: ZodOptions;
  effect?: EffectOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  fetch?: FetchOptions;
  requestOptions?: Record<string, unknown> | boolean;
  useDates?: boolean;
  useTypeOverInterfaces?: boolean;
  useDeprecatedOperations?: boolean;
  useBigInt?: boolean;
  useNamedParameters?: boolean;
  enumGenerationType?: EnumGeneration;
  suppressReadonlyModifier?: boolean;
  /**
   * Controls how readonly properties are handled for generated request-body types.
   *
   * Prefer `strip` for most OpenAPI specs because `readOnly` fields are
   * response-oriented. Use `preserve` only when your request DTOs are
   * intentionally immutable and should remain readonly in generated types.
   */
  preserveReadonlyRequestBodies?: ReadonlyRequestBodiesMode;
  /**
   * When enabled, operations with multiple request body content-types
   * (e.g. both `multipart/form-data` and `application/json`) will generate
   * separate functions for each content type instead of a single function
   * with a union type parameter.
   *
   * @default false
   */
  splitByContentType?: boolean;
  jsDoc?: JsDocOptions;
  aliasCombinedTypes?: boolean;
  /**
   * When enabled, optional properties will be typed as `T | null` instead of just `T`.
   * @default false
   */
  useNullForOptional?: boolean;
}
interface JsDocOptions {
  filter?: (schema: Record<string, unknown>) => {
    key: string;
    value: string;
  }[];
}
interface NormalizedJsDocOptions {
  filter?: (schema: Record<string, unknown>) => {
    key: string;
    value: string;
  }[];
}
interface OverrideOutputContentType {
  include?: string[];
  exclude?: string[];
}
/**
 * Strategy controlling how an existing hono handler file is treated on
 * regeneration.
 *
 * - `smart` (default): non-destructively reconcile orval-owned imports and
 *   `zValidator` arguments and append handlers for new operations, preserving
 *   all user-authored imports, middleware, bodies, and top-level code.
 * - `skip`: leave an existing handler file byte-for-byte unchanged.
 * - `full`: rebuild the preamble and validator chain from the spec, splicing
 *   back only the handler body. Drops custom imports/middleware/helpers.
 */
type HonoHandlerStrategy = 'smart' | 'skip' | 'full';
interface NormalizedHonoOptions {
  handlers?: string;
  handlerGenerationStrategy: HonoHandlerStrategy;
  compositeRoute: string;
  validator: boolean | 'hono';
  validatorOutputPath: string;
}
interface ZodDateTimeOptions {
  offset?: boolean;
  local?: boolean;
  precision?: number;
}
interface ZodTimeOptions {
  precision?: -1 | 0 | 1 | 2 | 3;
}
/**
 * Target Zod major version for generated output.
 *
 * - `4` — always emit Zod 4-style output (`z.strictObject`, `z.looseObject`,
 *   `z.iso.datetime()`, `.meta()`, …) regardless of the installed `zod` version.
 * - `3` — always emit Zod 3-compatible output (`.strict()`/`.passthrough()`,
 *   `z.string().datetime()`, …) regardless of the installed `zod` version.
 * - `'auto'` — infer the target from the `zod` version resolved in the output
 *   project's `package.json`; when no `zod` package can be detected, fall back
 *   to Zod 4 output.
 */
type ZodVersionOption = 3 | 4 | 'auto';
type ZodVariantOption = 'classic' | 'mini';
interface BaseZodOptions {
  strict?: {
    param?: boolean;
    query?: boolean;
    header?: boolean;
    body?: boolean;
    response?: boolean;
  };
  generate?: {
    param?: boolean;
    query?: boolean;
    header?: boolean;
    body?: boolean;
    response?: boolean;
  };
  coerce?: {
    param?: boolean | ZodCoerceType[];
    query?: boolean | ZodCoerceType[];
    header?: boolean | ZodCoerceType[];
    body?: boolean | ZodCoerceType[];
    response?: boolean | ZodCoerceType[];
  };
  preprocess?: {
    param?: Mutator;
    query?: Mutator;
    header?: Mutator;
    body?: Mutator;
    response?: Mutator;
  };
  /**
   * Mutator referencing a function called once per emitted validator at schema
   * construction time. It receives codegen-time context (operation, location,
   * schema name, field path, validator name) and returns a Zod `params` object
   * (e.g. `{ error: ... }`) that is appended as the trailing argument.
   *
   * The plural name follows Zod's own term for the validator's second argument
   * (`z.string(params)`) and is unrelated to the singular `param` key used by
   * `generate` / `coerce` / `preprocess` above, which refers to the path-parameter
   * location.
   */
  params?: Mutator;
  useBrandedTypes?: boolean;
}
interface ZodOptions extends BaseZodOptions {
  /**
   * Select the generated Zod API style. `classic` imports from `zod`; `mini`
   * imports from `zod/mini` and emits the functional/check-based Zod Mini API.
   * Zod Mini requires a Zod 4 target.
   */
  variant?: ZodVariantOption;
  /**
   * Pin the Zod output target so generation is deterministic instead of
   * inferred from the installed `zod` version. Defaults to `'auto'`, which
   * infers from the detected package and otherwise falls back to Zod 4 output.
   * See {@link ZodVersionOption}.
   */
  version?: ZodVersionOption;
  dateTimeOptions?: ZodDateTimeOptions;
  timeOptions?: ZodTimeOptions;
  generateEachHttpStatus?: boolean;
  /**
   * When true, emits one reusable Zod schema per `#/components/schemas/*` `$ref`
   * (with `namingConvention` applied to the name) and references it everywhere
   * instead of inlining. Default `false`. See `docs/superpowers/specs/2026-05-26-reusable-zod-schemas-design.md`.
   */
  generateReusableSchemas?: boolean;
  /**
   * When true (zod v4 only), attaches registry metadata to generated
   * **component** schemas via `.meta({ id, description?, deprecated? })`: `id` is
   * the schema name, plus `description`/`deprecated` when the OpenAPI schema
   * provides them. On zod v3 (which has no `.meta()`) descriptions still emit
   * via `.describe()`. Default `false`.
   */
  generateMeta?: boolean;
  /**
   * When true, a `oneOf`/`anyOf` that carries an OpenAPI `discriminator` is
   * emitted as `zod.discriminatedUnion(key, [...])` (better per-branch errors)
   * instead of a plain `zod.union([...])`, but only when every branch can be
   * represented as an object — otherwise it safely falls back to a union.
   * Default `false` (opt-in), so existing output is unchanged.
   */
  generateDiscriminatedUnion?: boolean;
  /**
   * When true (zod v4 only), emits optional object properties with
   * `.exactOptional()` (classic) / `zod.exactOptional()` (mini) instead of
   * `.optional()`, so consumers with `exactOptionalPropertyTypes` infer
   * `{ x?: T }` rather than `{ x?: T | undefined }`. On zod v3 (which has no
   * `.exactOptional()`) this is a no-op and `.optional()` is emitted. Default
   * `false` (opt-in), so existing output is unchanged.
   */
  exactOptional?: boolean;
}
/**
 * Per-operation/tag Zod overrides only include settings that are actually
 * merged into the operation-specific generator path. Output-wide target and
 * schema-layout settings belong on `override.zod`, not `override.operations.*`
 * / `override.tags.*`.
 */
type OperationZodOptions = BaseZodOptions;
interface EffectOptions {
  strict?: ZodOptions['strict'];
  generate?: ZodOptions['generate'];
  generateEachHttpStatus?: boolean;
  useBrandedTypes?: boolean;
  /**
   * When true, emits optional Struct properties with
   * `S.optionalWith(schema, { exact: true })` instead of `S.optional(schema)`,
   * so `exactOptionalPropertyTypes` consumers infer `{ x?: T }`. Default `false`.
   */
  exactOptional?: boolean;
}
type ZodCoerceType = 'string' | 'number' | 'boolean' | 'bigint' | 'date' | 'array';
interface NormalizedZodOptions {
  variant: ZodVariantOption;
  version: ZodVersionOption;
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
  coerce: {
    param: boolean | ZodCoerceType[];
    query: boolean | ZodCoerceType[];
    header: boolean | ZodCoerceType[];
    body: boolean | ZodCoerceType[];
    response: boolean | ZodCoerceType[];
  };
  preprocess?: {
    param?: NormalizedMutator;
    query?: NormalizedMutator;
    header?: NormalizedMutator;
    body?: NormalizedMutator;
    response?: NormalizedMutator;
  };
  params?: NormalizedMutator;
  generateEachHttpStatus: boolean;
  useBrandedTypes: boolean;
  generateReusableSchemas: boolean;
  generateMeta: boolean;
  generateDiscriminatedUnion: boolean;
  exactOptional: boolean;
  dateTimeOptions: ZodDateTimeOptions;
  timeOptions: ZodTimeOptions;
}
type NormalizedOperationZodOptions = Pick<NormalizedZodOptions, 'strict' | 'generate' | 'coerce' | 'preprocess' | 'params' | 'useBrandedTypes'>;
interface NormalizedEffectOptions {
  strict: NormalizedZodOptions['strict'];
  generate: NormalizedZodOptions['generate'];
  generateEachHttpStatus: boolean;
  useBrandedTypes: boolean;
  exactOptional: boolean;
}
/**
 * A single parameter value for `mutationInvalidates` params.
 *
 * - `string` – treated as a variable reference, e.g. `"petId"` → `variables.petId`
 * - `{ literal: string }` – emitted as a string literal, e.g. `{ literal: "@me" }` → `"@me"`
 */
type InvalidateTargetParam = string | {
  literal: string;
};
type InvalidateTarget = string | {
  query: string;
  params?: InvalidateTargetParam[] | Record<string, InvalidateTargetParam>;
  invalidateMode?: 'invalidate' | 'reset';
  file?: string;
};
interface MutationInvalidatesRule {
  onMutations: string[];
  invalidates: InvalidateTarget[];
}
type MutationInvalidatesConfig = MutationInvalidatesRule[];
interface HonoOptions {
  handlers?: string;
  handlerGenerationStrategy?: HonoHandlerStrategy;
  compositeRoute?: string;
  validator?: boolean | 'hono';
  validatorOutputPath?: string;
}
interface McpServerOptions {
  path: string;
  name?: string;
  default?: boolean;
}
interface NormalizedMcpServerOptions {
  path: string;
  name?: string;
  default: boolean;
}
interface McpOptions {
  server?: McpServerOptions;
}
interface NormalizedMcpOptions {
  server?: NormalizedMcpServerOptions;
}
interface NormalizedQueryOptions {
  useQuery?: boolean;
  useSuspenseQuery?: boolean;
  useMutation?: boolean;
  useInfinite?: boolean;
  useSuspenseInfiniteQuery?: boolean;
  useInfiniteQueryParam?: string;
  usePrefetch?: boolean;
  useInvalidate?: boolean;
  useSetQueryData?: boolean;
  useGetQueryData?: boolean;
  options?: Record<string, unknown>;
  queryKey?: NormalizedMutator;
  queryOptions?: NormalizedMutator;
  mutationOptions?: NormalizedMutator;
  shouldExportMutatorHooks?: boolean;
  shouldExportHttpClient?: boolean;
  shouldExportQueryKey?: boolean;
  shouldFilterQueryKey?: boolean;
  queryKeyFilter?: string;
  shouldSplitQueryKey?: boolean;
  useOperationIdAsQueryKey?: boolean;
  signal?: boolean;
  version?: 3 | 4 | 5;
  mutationInvalidates?: MutationInvalidatesConfig;
  runtimeValidation?: boolean;
}
interface QueryOptions {
  useQuery?: boolean;
  useSuspenseQuery?: boolean;
  useMutation?: boolean;
  useInfinite?: boolean;
  useSuspenseInfiniteQuery?: boolean;
  useInfiniteQueryParam?: string;
  usePrefetch?: boolean;
  useInvalidate?: boolean;
  useSetQueryData?: boolean;
  useGetQueryData?: boolean;
  options?: Record<string, unknown>;
  queryKey?: Mutator;
  queryOptions?: Mutator;
  mutationOptions?: Mutator;
  shouldExportMutatorHooks?: boolean;
  shouldExportHttpClient?: boolean;
  shouldExportQueryKey?: boolean;
  shouldFilterQueryKey?: boolean;
  queryKeyFilter?: string;
  shouldSplitQueryKey?: boolean;
  useOperationIdAsQueryKey?: boolean;
  signal?: boolean;
  version?: 3 | 4 | 5;
  mutationInvalidates?: MutationInvalidatesConfig;
  runtimeValidation?: boolean;
}
interface AngularOptions {
  provideIn?: 'root' | 'any' | boolean;
  /**
   * Preferred name for configuring how retrieval-style operations are emitted.
   *
   * - `httpClient`: keep retrievals as service methods
   * - `httpResource`: emit retrievals as Angular `httpResource` helpers
   * - `both`: emit retrieval helpers and keep service methods where needed
   *
   * Mutation-style operations still use generated `HttpClient` service methods
   * by default unless a per-operation override forces a different behavior.
   */
  retrievalClient?: 'httpClient' | 'httpResource' | 'both';
  /**
   * Backward-compatible alias for `retrievalClient`.
   *
   * Kept for compatibility with existing configs.
   */
  client?: 'httpClient' | 'httpResource' | 'both';
  runtimeValidation?: boolean;
  httpResource?: AngularHttpResourceOptions;
  /**
   * Controls how object-typed query parameters are serialized when no
   * `paramsSerializer` is configured.
   *
   * - `spec` (default): honor the OpenAPI parameter's `style`/`explode` —
   *   `form` + `explode: true` (the OpenAPI default) spreads the object's
   *   properties as top-level query params, `form` + `explode: false` joins
   *   them into a single comma-separated value, and `deepObject` emits
   *   bracketed `name[prop]` keys.
   * - `legacy`: restore the pre-#3705 behavior of silently dropping
   *   object-typed query params from the generated request.
   *
   * Has no effect when a `paramsSerializer` or `paramsFilter` is configured
   * for the operation — those remain in full control of the raw value. See
   * issue #3705.
   */
  queryObjectSerialization?: 'spec' | 'legacy';
}
interface NormalizedAngularOptions {
  provideIn: 'root' | 'any' | boolean;
  client: 'httpClient' | 'httpResource' | 'both';
  runtimeValidation: boolean;
  httpResource?: AngularHttpResourceOptions;
  queryObjectSerialization: 'spec' | 'legacy';
}
interface AngularHttpResourceOptions {
  /**
   * Value to expose while the resource is idle/loading.
   *
   * Serialized as a literal into generated code.
   */
  defaultValue?: unknown;
  /**
   * Debug name shown in Angular DevTools.
   */
  debugName?: string;
  /**
   * Raw code expression for HttpResourceOptions.injector.
   * Example: `inject(Injector)`.
   */
  injector?: string;
  /**
   * Raw code expression for HttpResourceOptions.equal.
   * Example: `(a, b) => a.id === b.id`.
   */
  equal?: string;
}
interface SwrOptions {
  useInfinite?: boolean;
  useSWRMutationForGet?: boolean;
  useSuspense?: boolean;
  generateErrorTypes?: boolean;
  swrOptions?: unknown;
  swrMutationOptions?: unknown;
  swrInfiniteOptions?: unknown;
}
interface NormalizedFetchOptions {
  includeHttpResponseReturnType: boolean;
  forceSuccessResponse: boolean;
  jsonReviver?: Mutator;
  runtimeValidation: boolean;
  useRuntimeFetcher: boolean;
  /**
   * Serialization format for array query parameters that do not have an explicit
   * `explode` setting in the OpenAPI spec.
   *
   * - `repeat` — repeat the key for each value: `foo=1&foo=2`
   * - `brackets` — append `[]` to the key: `foo[]=1&foo[]=2`
   * - `comma` — join values with a comma: `foo=1,2`
   */
  arrayFormat?: 'repeat' | 'brackets' | 'comma';
}
interface FetchOptions {
  includeHttpResponseReturnType?: boolean;
  forceSuccessResponse?: boolean;
  jsonReviver?: Mutator;
  runtimeValidation?: boolean;
  useRuntimeFetcher?: boolean;
  /**
   * Serialization format for array query parameters that do not have an explicit
   * `explode` setting in the OpenAPI spec.
   *
   * - `repeat` — repeat the key for each value: `foo=1&foo=2`
   * - `brackets` — append `[]` to the key: `foo[]=1&foo[]=2`
   * - `comma` — join values with a comma: `foo=1,2`
   */
  arrayFormat?: 'repeat' | 'brackets' | 'comma';
}
type InputTransformerFn = (spec: OpenApiDocument) => OpenApiDocument | Promise<OpenApiDocument>;
type InputTransformer = string | InputTransformerFn;
interface OverrideInput {
  transformer?: InputTransformer;
}
interface OperationOptions {
  transformer?: OutputTransformer;
  mutator?: Mutator;
  mock?: {
    data?: MockData;
    properties?: MockProperties;
  };
  query?: QueryOptions;
  angular?: AngularOptions;
  swr?: SwrOptions;
  zod?: OperationZodOptions;
  effect?: EffectOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  fetch?: FetchOptions;
  formData?: boolean | Mutator | FormDataType<Mutator>;
  formUrlEncoded?: boolean | Mutator;
  paramsSerializer?: Mutator;
  paramsFilter?: Mutator;
  requestOptions?: object | boolean;
}
type Hook = 'afterAllFilesWrite';
type HookFunction<TArgs extends unknown[] = unknown[]> = (...args: TArgs) => void | Promise<void>;
interface HookOption {
  command: string | HookFunction;
  injectGeneratedDirsAndFiles?: boolean;
}
type HookCommand = string | HookFunction | HookOption | (string | HookFunction | HookOption)[];
type NormalizedHookCommand = HookCommand[];
type HooksOptions<T = HookCommand | NormalizedHookCommand> = Partial<Record<Hook, T>>;
type NormalizedHookOptions = HooksOptions<NormalizedHookCommand>;
type Verbs = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch';
declare const Verbs: {
  GET: Verbs;
  PUT: Verbs;
  POST: Verbs;
  DELETE: Verbs;
  OPTIONS: Verbs;
  HEAD: Verbs;
  PATCH: Verbs;
};
/**
 * Canonical tag name used for the generated bucket that collects untagged operations.
 */
declare const DefaultTag: "default";
interface ImportOpenApi {
  spec: OpenApiDocument;
  input: NormalizedInputOptions;
  output: NormalizedOutputOptions;
  target: string;
  workspace: string;
  projectName?: string;
}
interface ContextSpec {
  projectName?: string;
  target: string;
  workspace: string;
  spec: OpenApiDocument;
  parents?: string[];
  output: NormalizedOutputOptions;
  /**
   * Per-schema dynamic scope mapping `$dynamicAnchor` names to concrete schema
   * entries or generic parameter placeholders. Populated by `buildDynamicScope`.
   */
  dynamicScope?: Partial<Record<string, DynamicScopeEntry>>;
  /**
   * Lazily-built index of every `$dynamicAnchor` declared in
   * `components.schemas`, used by the `resolveDynamicRef` fallback when an
   * anchor is absent from {@link dynamicScope}. Memoized on first miss so the
   * O(numSchemas) scan runs once per spec instead of once per `$dynamicRef`.
   * Populated by `getDynamicAnchorIndex` in `resolvers/ref.ts`.
   */
  dynamicAnchorIndex?: Map<string, DynamicAnchorIndexEntry>;
  /**
   * Tracks array-item mock factory names already emitted per output file scope.
   * Populated by `@orval/mock` when `arrayItems: true` so shared `$ref` item
   * factories are not re-declared within the same file (single/split) or tag
   * bucket (tags/tags-split). Scope keys include the active mock generator
   * type so separate `.msw.ts` / `.faker.ts` files each get their own copy.
   */
  arrayItemMockFactories?: Map<string, Set<string>>;
  /**
   * Set by `@orval/mock` while generating per-operation mock output so
   * file-scoped helpers (e.g. array-item factory dedup) can distinguish
   * separate mock generator files.
   */
  activeMockOutputType?: OutputMockType;
}
/**
 * Maps a `$dynamicAnchor` name to its resolution target.
 *
 * Concrete entry (bound via `$ref`):
 *   - `name` — the generated TypeScript type name (e.g. `User`)
 *   - `schemaName` — the original key in `components.schemas` (e.g. `User`)
 *
 * Parameter entry (unbound `$defs` placeholder):
 *   - `isParameter` — `true`, signals this is a generic type parameter
 *   - `name` — the `$dynamicAnchor` name used as the type parameter (e.g. `itemType`)
 *   - `schemaName` — same as `name` for parameters
 *
 * Inline entry (anonymous subschema overriding an anchor without a `$ref`):
 *   - `inlineSchema` — the concrete schema object to resolve `$dynamicRef` against.
 *     Takes precedence over the component lookup in `resolveDynamicRef`, so an
 *     inline `$dynamicAnchor` (e.g. inside `allOf` / `items`) correctly shadows
 *     the outer/global anchor. `schemaName` is the anchor name itself.
 */
interface DynamicScopeEntry {
  name: string;
  schemaName: string;
  isParameter?: boolean;
  inlineSchema?: OpenApiSchemaObject;
}
/**
 * Compact per-anchor result of the single `$dynamicAnchor` index scan.
 *
 * Reproduces the precedence in `resolveDynamicRef`'s fallback without storing
 * full match arrays:
 *   - {@link exactName} — a schema whose key equals the anchor name. Always
 *     wins when present (matches `matches.find(m => m === anchorName)`).
 *   - {@link firstName} / {@link count} — non-exact matches. Only the first is
 *     kept; `count` is capped at 2 because the resolution only distinguishes
 *     "exactly one" from "ambiguous". Recording stops once `count >= 2`, which
 *     is the safe form of "bail early when ambiguous" — a literal early-return
 *     at `count === 2` would regress the exact-name rule when the exact schema
 *     appears later in iteration order.
 */
interface DynamicAnchorIndexEntry {
  exactName?: string;
  firstName?: string;
  count: number;
}
interface GlobalOptions {
  watch?: boolean | string | string[];
  verbose?: boolean;
  clean?: boolean | string[];
  formatter?: SupportedFormatter;
  mock?: OutputMocksOption;
  client?: OutputClient;
  httpClient?: OutputHttpClient;
  mode?: OutputMode;
  tsconfig?: string | Tsconfig;
  packageJson?: string;
  input?: string | string[];
  output?: string;
  failOnWarnings?: boolean;
}
interface Tsconfig {
  baseUrl?: string;
  compilerOptions?: {
    esModuleInterop?: boolean;
    allowSyntheticDefaultImports?: boolean;
    exactOptionalPropertyTypes?: boolean;
    paths?: Record<string, string[]>;
    target?: TsConfigTarget;
    module?: TsConfigModule;
    moduleResolution?: TsConfigModuleResolution;
    allowImportingTsExtensions?: boolean;
  };
}
type TsConfigTarget = 'es3' | 'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'es2023' | 'es2024' | 'es2025' | 'esnext';
/** Accepts both the canonical casing and the all-lowercase variant of a string literal. */
type CaseInsensitive<T extends string> = T | Lowercase<T>;
/**
 * Valid values for the TypeScript `compilerOptions.module` setting.
 *
 * Both title-case (e.g. `"NodeNext"`) and lower-case (e.g. `"nodenext"`) are
 * accepted, matching TypeScript's own case-insensitive parsing.
 *
 * @see {@link https://www.typescriptlang.org/tsconfig#module}
 */
type TsConfigModule = CaseInsensitive<'None' | 'CommonJS' | 'AMD' | 'UMD' | 'System' | 'ES6' | 'ES2015' | 'ES2020' | 'ES2022' | 'ESNext' | 'Node16' | 'Node18' | 'Node20' | 'NodeNext' | 'Preserve'>;
/**
 * Valid values for the TypeScript `compilerOptions.moduleResolution` setting.
 *
 * Both title-case (e.g. `"NodeNext"`) and lower-case (e.g. `"nodenext"`) are
 * accepted, matching TypeScript's own case-insensitive parsing.
 *
 * @see https://www.typescriptlang.org/tsconfig#moduleResolution
 */
type TsConfigModuleResolution = CaseInsensitive<'Classic' | 'Node' | 'Node10' | 'Node16' | 'NodeNext' | 'Bundler'>;
interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  catalog?: Record<string, string>;
  catalogs?: Record<string, Record<string, string>>;
  resolvedVersions?: Record<string, string>;
}
interface GeneratorSchema {
  name: string;
  model: string;
  imports: GeneratorImport[];
  dependencies?: string[];
  schema?: OpenApiSchemaObject;
  factory?: string;
  factoryImports?: GeneratorImport[];
  factoryMode?: FactoryMethodsMode;
}
interface GeneratorImport {
  readonly name: string;
  readonly schemaName?: string;
  readonly isZodSchema?: boolean;
  readonly isConstant?: boolean;
  readonly alias?: string;
  readonly default?: boolean;
  readonly values?: boolean;
  readonly syntheticDefaultImport?: boolean;
  readonly namespaceImport?: boolean;
  readonly importPath?: string;
  readonly schemaFactory?: boolean;
}
interface GeneratorDependency {
  readonly exports: readonly GeneratorImport[];
  readonly dependency: string;
}
interface GeneratorApiResponse {
  operations: GeneratorOperations;
  schemas: GeneratorSchema[];
}
type GeneratorOperations = Record<string, GeneratorOperation>;
type StrictMockSchemaKind = 'object' | 'alias' | 'binary';
interface GeneratorMockOutput {
  type: OutputMockType;
  implementation: string;
  imports: GeneratorImport[];
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
interface GeneratorMockOutputFull {
  type: OutputMockType;
  implementation: {
    function: string;
    handler: string;
    handlerName: string;
  };
  imports: GeneratorImport[];
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
interface GeneratorTarget {
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutput[];
  mutators?: GeneratorMutator[];
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator[];
  formUrlEncoded?: GeneratorMutator[];
  paramsSerializer?: GeneratorMutator[];
  paramsFilter?: GeneratorMutator[];
  fetchReviver?: GeneratorMutator[];
  sharedTypes?: SharedTypeDeclaration[];
}
interface GeneratorTargetFull {
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutputFull[];
  mutators?: GeneratorMutator[];
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator[];
  formUrlEncoded?: GeneratorMutator[];
  paramsSerializer?: GeneratorMutator[];
  paramsFilter?: GeneratorMutator[];
  fetchReviver?: GeneratorMutator[];
  sharedTypes?: SharedTypeDeclaration[];
}
interface GeneratorOperation {
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutputFull[];
  tags: string[];
  mutator?: GeneratorMutator;
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator;
  formUrlEncoded?: GeneratorMutator;
  paramsSerializer?: GeneratorMutator;
  paramsFilter?: GeneratorMutator;
  fetchReviver?: GeneratorMutator;
  operationName: string;
  types?: {
    result: (title?: string) => string;
  };
}
/**
 * One operation's slice of a tag bucket, produced by
 * `generateTargetForTagsOperations` for the `tags-operations` /
 * `tags-operations-split` modes. Unlike `GeneratorTargetFull`, the
 * implementation here is never merged with sibling operations — each
 * operation keeps its own header/footer-wrapped implementation so it can be
 * written to its own file.
 */
interface GeneratorOperationTarget {
  operationName: string;
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutput[];
  mockOutputsFull: GeneratorMockOutputFull[];
  mutators?: GeneratorMutator[];
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator[];
  formUrlEncoded?: GeneratorMutator[];
  paramsSerializer?: GeneratorMutator[];
  paramsFilter?: GeneratorMutator[];
  fetchReviver?: GeneratorMutator[];
}
/**
 * Shared per-tag helper block (e.g. `AwaitedInput`/`Awaited`,
 * `SecondParameter`, query-key helpers, deduplicated shared types) computed
 * once per tag so every operation file in that tag can import it instead of
 * redeclaring it.
 */
interface GeneratorTagHelpers {
  implementation: string;
  sharedTypes?: SharedTypeDeclaration[];
  /**
   * Top-level `type` identifiers declared in `implementation`. Writers
   * import these with `import type { ... }` — a side-effect import
   * (`import './<tag>.helpers'`) never brings type names into scope.
   */
  typeNames: string[];
  /**
   * Top-level `const`/`function` identifiers declared in `implementation`
   * (e.g. a query-key helper called at runtime). These must survive as a
   * real value import, not `import type`.
   */
  valueNames: string[];
}
interface GeneratorTagOperationsTarget {
  helpers: GeneratorTagHelpers;
  operations: GeneratorOperationTarget[];
}
interface GeneratorVerbOptions {
  verb: Verbs;
  route: string;
  pathRoute: string;
  summary?: string;
  doc: string;
  tags: string[];
  operationId: string;
  operationName: string;
  typeName: string;
  response: GetterResponse;
  body: GetterBody;
  headers?: GetterQueryParam;
  queryParams?: GetterQueryParam;
  params: GetterParams;
  props: GetterProps;
  mutator?: GeneratorMutator;
  formData?: GeneratorMutator;
  formUrlEncoded?: GeneratorMutator;
  paramsSerializer?: GeneratorMutator;
  paramsFilter?: GeneratorMutator;
  fetchReviver?: GeneratorMutator;
  override: NormalizedOverrideOutput;
  deprecated?: boolean;
  originalOperation: OpenApiOperationObject;
}
type GeneratorVerbsOptions = GeneratorVerbOptions[];
interface GeneratorOptions {
  route: string;
  pathRoute: string;
  override: NormalizedOverrideOutput;
  context: ContextSpec;
  mock?: GlobalMockOptions | ClientMockBuilder;
  output: string;
}
interface GeneratorClient {
  implementation: string;
  imports: GeneratorImport[];
  mutators?: GeneratorMutator[];
  /** When set, overrides the default verbOption.doc prepended to the implementation */
  docComment?: string;
  returnType?: (title?: string) => string;
}
interface GeneratorMutatorParsingInfo {
  numberOfParams: number;
  returnNumberOfParams?: number;
}
interface GeneratorMutator {
  name: string;
  path: string;
  default: boolean;
  hasErrorType: boolean;
  errorTypeName: string;
  hasSecondArg: boolean;
  hasThirdArg: boolean;
  isHook: boolean;
  bodyTypeName?: string;
}
type ClientBuilder = (verbOptions: GeneratorVerbOptions, options: GeneratorOptions, outputClient: OutputClient | OutputClientFunc, output?: NormalizedOutputOptions) => GeneratorClient | Promise<GeneratorClient>;
interface ClientFileBuilder {
  path: string;
  content: string;
}
type ClientExtraFilesBuilder = (verbOptions: Record<string, GeneratorVerbOptions>, output: NormalizedOutputOptions, context: ContextSpec) => Promise<ClientFileBuilder[]>;
interface SharedTypeDeclaration {
  name: string;
  exported: boolean;
  code: string;
}
type HeaderResult = {
  implementation: string;
  sharedTypes?: SharedTypeDeclaration[];
};
type ClientHeaderBuilder = (params: {
  title: string;
  isRequestOptions: boolean;
  isMutator: boolean;
  noFunction?: boolean;
  isGlobalMutator: boolean;
  provideIn: boolean | 'root' | 'any';
  hasAwaitedType: boolean;
  output: NormalizedOutputOptions;
  verbOptions: Record<string, GeneratorVerbOptions>;
  tag?: string;
  isDefaultTagBucket?: boolean;
  clientImplementation: string;
}) => string | HeaderResult;
type ClientFooterBuilder = (params: {
  noFunction?: boolean | undefined;
  operationNames: string[];
  operations?: GeneratorOperation[];
  title?: string;
  hasAwaitedType: boolean;
  hasMutator: boolean;
}) => string;
type ClientTitleBuilder = (title: string) => string;
type ClientDependenciesBuilder = (hasGlobalMutator: boolean, hasParamsSerializerOptions: boolean, packageJson?: PackageJson, httpClient?: OutputHttpClient, hasTagsMutator?: boolean, override?: NormalizedOverrideOutput) => GeneratorDependency[];
interface ClientMockGeneratorImplementation {
  function: string;
  handlerName: string;
  handler: string;
}
interface ClientMockGeneratorBuilder {
  imports: GeneratorImport[];
  implementation: ClientMockGeneratorImplementation;
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
type ClientMockBuilder = (verbOptions: GeneratorVerbOptions, generatorOptions: GeneratorOptions) => ClientMockGeneratorBuilder;
interface ClientGeneratorsBuilder {
  client: ClientBuilder;
  header?: ClientHeaderBuilder;
  dependencies?: ClientDependenciesBuilder;
  footer?: ClientFooterBuilder;
  title?: ClientTitleBuilder;
  extraFiles?: ClientExtraFilesBuilder;
}
type GeneratorClients = Record<OutputClient, ClientGeneratorsBuilder>;
interface GetterResponse {
  imports: GeneratorImport[];
  definition: {
    success: string;
    errors: string;
  };
  isBlob: boolean;
  types: {
    success: ResReqTypesValue[];
    errors: ResReqTypesValue[];
  };
  contentTypes: string[];
  schemas: GeneratorSchema[];
  originalSchema?: OpenApiResponsesObject;
}
interface GetterBody {
  originalSchema: OpenApiReferenceObject | OpenApiRequestBodyObject;
  imports: GeneratorImport[];
  definition: string;
  implementation: string;
  schemas: GeneratorSchema[];
  formData?: string;
  formUrlEncoded?: string;
  contentType: string;
  isOptional: boolean;
}
interface GetterParameters {
  query: {
    parameter: OpenApiParameterObject;
    imports: GeneratorImport[];
  }[];
  path: {
    parameter: OpenApiParameterObject;
    imports: GeneratorImport[];
  }[];
  header: {
    parameter: OpenApiParameterObject;
    imports: GeneratorImport[];
  }[];
}
interface GetterParam {
  name: string;
  definition: string;
  implementation: string;
  default: unknown;
  required: boolean;
  imports: GeneratorImport[];
}
type GetterParams = GetterParam[];
interface GetterQueryParam {
  schema: GeneratorSchema;
  deps: GeneratorSchema[];
  isOptional: boolean;
  paramNames?: string[];
  originalSchema?: OpenApiSchemaObject;
  requiredNullableKeys?: string[];
  /**
   * Names of query parameters whose declared schema is non-primitive
   * (object, array of objects, or untyped). Used by Angular generators to
   * preserve these values through the default `filterParams` helper instead
   * of silently dropping them — the user's `paramsSerializer`, `mutator`, or
   * `paramsFilter` is then responsible for handling them. See issue #3326.
   */
  nonPrimitiveKeys?: string[];
  /**
   * Per-parameter serialization strategy for query params whose declared
   * schema is a plain object, derived from the OpenAPI parameter's
   * `style`/`explode` (defaulting to `form` + `explode: true` per spec).
   * Used by Angular generators' default `filterParams` helper to serialize
   * these values instead of silently dropping them, when no
   * `paramsSerializer`/`paramsFilter` is configured. See issue #3705.
   *
   * - `flatten`: `form` + `explode: true` — spread properties as top-level
   *   query params.
   * - `comma`: `form` + `explode: false` — join `prop,value` pairs with commas
   *   into a single value.
   * - `deepObject`: `deepObject` style — emit bracketed `name[prop]` keys.
   */
  objectQueryParams?: {
    key: string;
    strategy: 'flatten' | 'comma' | 'deepObject';
  }[];
}
type GetterPropType = 'param' | 'body' | 'queryParam' | 'header' | 'namedPathParams';
declare const GetterPropType: {
  readonly PARAM: "param";
  readonly NAMED_PATH_PARAMS: "namedPathParams";
  readonly BODY: "body";
  readonly QUERY_PARAM: "queryParam";
  readonly HEADER: "header";
};
interface GetterPropBase {
  name: string;
  definition: string;
  implementation: string;
  default: unknown;
  required: boolean;
}
type GetterProp = GetterPropBase & ({
  type: 'namedPathParams';
  destructured: string;
  schema: GeneratorSchema;
} | {
  type: Exclude<GetterPropType, 'namedPathParams'>;
});
type GetterProps = GetterProp[];
type SchemaType = 'integer' | 'number' | 'string' | 'boolean' | 'object' | 'null' | 'array' | 'enum' | 'unknown';
declare const SchemaType: {
  integer: string;
  number: string;
  string: string;
  boolean: string;
  object: string;
  null: string;
  array: string;
  enum: string;
  unknown: string;
};
interface ScalarValue {
  value: string;
  useTypeAlias?: boolean;
  isEnum: boolean;
  hasReadonlyProps: boolean;
  type: SchemaType;
  imports: GeneratorImport[];
  schemas: GeneratorSchema[];
  isRef: boolean;
  dependencies: string[];
  example?: unknown;
  examples?: Record<string, unknown> | unknown[];
}
type ResolverValue = ScalarValue & {
  originalSchema: OpenApiSchemaObject;
};
type ResReqTypesValue = ScalarValue & {
  formData?: string;
  formUrlEncoded?: string;
  isRef?: boolean;
  hasReadonlyProps?: boolean;
  key: string;
  contentType: string;
  originalSchema?: OpenApiSchemaObject;
};
interface FinalizeMockImplementationOptions {
  mockOptions?: Pick<MockOptions, 'required' | 'nonNullable'>;
  strictSchemaTypeNames?: readonly string[];
  strictMockSchemaKinds?: Readonly<Record<string, StrictMockSchemaKind>>;
}
interface WriteSpecBuilder {
  operations: GeneratorOperations;
  verbOptions: Record<string, GeneratorVerbOptions>;
  schemas: GeneratorSchema[];
  title: GeneratorClientTitle;
  header: GeneratorClientHeader;
  footer: GeneratorClientFooter;
  imports: GeneratorClientImports;
  importsMock: GenerateMockImports;
  /** Hoists shared strict-mock type aliases once per aggregated mock file. */
  finalizeMockImplementation?: (implementation: string, options: FinalizeMockImplementationOptions) => string;
  extraFiles: ClientFileBuilder[];
  info: OpenApiInfoObject;
  target: string;
  spec: OpenApiDocument;
}
interface WriteModeProps {
  builder: WriteSpecBuilder;
  output: NormalizedOutputOptions;
  workspace: string;
  projectName?: string;
  header: string;
  needSchema: boolean;
  generateSchemasInline?: () => string;
  schemaTagMap?: Map<string, string>;
}
interface GeneratorApiOperations {
  verbOptions: Record<string, GeneratorVerbOptions>;
  operations: GeneratorOperations;
  schemas: GeneratorSchema[];
}
interface GeneratorClientExtra {
  implementation: string;
  implementationMock: string;
  sharedTypes?: SharedTypeDeclaration[];
}
type GeneratorClientTitle = (data: {
  outputClient?: OutputClient | OutputClientFunc;
  title: string;
  customTitleFunc?: (title: string) => string;
  output: NormalizedOutputOptions;
}) => GeneratorClientExtra;
type GeneratorClientHeader = (data: {
  outputClient?: OutputClient | OutputClientFunc;
  isRequestOptions: boolean;
  isMutator: boolean;
  isGlobalMutator: boolean;
  provideIn: boolean | 'root' | 'any';
  hasAwaitedType: boolean;
  titles: GeneratorClientExtra;
  output: NormalizedOutputOptions;
  verbOptions: Record<string, GeneratorVerbOptions>;
  tag?: string;
  isDefaultTagBucket?: boolean;
  clientImplementation: string;
}) => GeneratorClientExtra;
type GeneratorClientFooter = (data: {
  outputClient: OutputClient | OutputClientFunc;
  operationNames: string[];
  operations?: GeneratorOperation[];
  hasMutator: boolean;
  hasAwaitedType: boolean;
  titles: GeneratorClientExtra;
  output: NormalizedOutputOptions;
}) => GeneratorClientExtra;
type GeneratorClientImports = (data: {
  client: OutputClient | OutputClientFunc;
  implementation: string;
  imports: readonly GeneratorDependency[];
  projectName?: string;
  hasSchemaDir: boolean;
  isAllowSyntheticDefaultImports: boolean;
  hasGlobalMutator: boolean;
  hasTagsMutator: boolean;
  hasParamsSerializerOptions: boolean;
  packageJson?: PackageJson;
  output: NormalizedOutputOptions;
}) => string;
type GenerateMockImports = (data: {
  implementation: string;
  imports: readonly GeneratorDependency[];
  projectName?: string;
  hasSchemaDir: boolean;
  isAllowSyntheticDefaultImports: boolean;
  options?: GlobalMockOptions;
}) => string;
type GeneratorApiBuilder = GeneratorApiOperations & {
  title: GeneratorClientTitle;
  header: GeneratorClientHeader;
  footer: GeneratorClientFooter;
  imports: GeneratorClientImports;
  importsMock: GenerateMockImports; /** Hoists shared strict-mock type aliases once per aggregated mock file. */
  finalizeMockImplementation?: (implementation: string, options: FinalizeMockImplementationOptions) => string;
  extraFiles: ClientFileBuilder[];
};
declare class ErrorWithTag extends Error {
  tag: string;
  constructor(message: string, tag: string, options?: ErrorOptions);
}
type OpenApiSchemaObjectType = 'string' | 'number' | 'boolean' | 'object' | 'integer' | 'null' | 'array';
type OpenApiDocument = OpenAPIV3_1.Document;
type OpenApiSchemaObject = OpenAPIV3_1.SchemaObject;
type OpenApiSchemasObject = Record<string, OpenApiSchemaObject>;
type OpenApiReferenceObject = OpenAPIV3_1.ReferenceObject & {
  $ref?: string;
};
type OpenApiComponentsObject = OpenAPIV3_1.ComponentsObject;
type OpenApiPathsObject = OpenAPIV3_1.PathsObject;
type OpenApiPathItemObject = OpenAPIV3_1.PathItemObject;
type OpenApiResponsesObject = OpenAPIV3_1.ResponsesObject;
type OpenApiResponseObject = OpenAPIV3_1.ResponseObject;
type OpenApiParameterObject = OpenAPIV3_1.ParameterObject;
type OpenApiRequestBodyObject = OpenAPIV3_1.RequestBodyObject;
type OpenApiInfoObject = OpenAPIV3_1.InfoObject;
type OpenApiExampleObject = OpenAPIV3_1.ExampleObject;
type OpenApiOperationObject = OpenAPIV3_1.OperationObject;
type OpenApiMediaTypeObject = OpenAPIV3_1.MediaTypeObject;
type OpenApiEncodingObject = OpenAPIV3_1.EncodingObject;
type OpenApiServerObject = OpenAPIV3_1.ServerObject;
//#endregion
//#region src/constants.d.ts
declare const generalJSTypes: string[];
declare const generalJSTypesWithArray: string[];
declare const VERBS_WITH_BODY: Verbs[];
declare const URL_REGEX: RegExp;
declare const TEMPLATE_TAG_REGEX: RegExp;
//#endregion
//#region src/generators/component-definition.d.ts
declare function generateComponentDefinition(responses: OpenApiComponentsObject['responses'] | OpenApiComponentsObject['requestBodies'], context: ContextSpec, suffix: string): GeneratorSchema[];
//#endregion
//#region src/generators/factory.d.ts
declare function generateFactory(schema: OpenApiSchemaObject, name: string, context: ContextSpec): {
  model: string;
  imports: GeneratorImport[];
} | undefined;
//#endregion
//#region src/generators/imports.d.ts
interface GenerateImportsOptions {
  imports: readonly GeneratorImport[];
  namingConvention?: NamingConvention;
  importExtension?: string;
}
declare function generateImports({
  imports,
  namingConvention,
  importExtension
}: GenerateImportsOptions): string;
interface GenerateMutatorImportsOptions {
  mutators: GeneratorMutator[];
  implementation?: string;
  oneMore?: boolean;
}
declare function generateMutatorImports({
  mutators,
  implementation,
  oneMore
}: GenerateMutatorImportsOptions): string;
interface AddDependencyOptions {
  implementation: string;
  exports: readonly GeneratorImport[];
  dependency: string;
  projectName?: string;
  hasSchemaDir: boolean;
  isAllowSyntheticDefaultImports: boolean;
}
declare function addDependency({
  implementation,
  exports,
  dependency,
  projectName,
  isAllowSyntheticDefaultImports
}: AddDependencyOptions): string | undefined;
declare function generateDependencyImports(implementation: string, imports: {
  exports: readonly GeneratorImport[];
  dependency: string;
}[], projectName: string | undefined, hasSchemaDir: boolean, isAllowSyntheticDefaultImports: boolean): string;
declare function generateVerbImports({
  response,
  body,
  queryParams,
  props,
  headers,
  params
}: GeneratorVerbOptions): GeneratorImport[];
//#endregion
//#region src/generators/input-filters.d.ts
declare const COMPONENT_TYPES: readonly ["schemas", "responses", "parameters", "requestBodies"];
type ComponentType = (typeof COMPONENT_TYPES)[number];
declare function filteredVerbs(verbs: OpenApiPathItemObject, filters: NormalizedInputOptions['filters']): [string, any][];
declare const collectReferencedComponents: (spec: OpenApiDocument, tags: (string | RegExp)[], mode: InputFiltersOptions["mode"]) => Record<ComponentType, string[]>;
//#endregion
//#region src/generators/models-inline.d.ts
declare function generateModelInline(acc: string, model: string): string;
declare function generateModelsInline(obj: Record<string, GeneratorSchema[]> | GeneratorSchema[]): string;
//#endregion
//#region src/generators/mutator.d.ts
declare const BODY_TYPE_NAME = "BodyType";
interface GenerateMutatorOptions {
  output?: string;
  mutator?: NormalizedMutator;
  name: string;
  workspace: string;
  tsconfig?: Tsconfig;
}
declare function generateMutator({
  output,
  mutator,
  name,
  workspace,
  tsconfig
}: GenerateMutatorOptions): Promise<GeneratorMutator | undefined>;
//#endregion
//#region src/generators/options.d.ts
/**
 * Per-parameter Angular query-object serialization strategy, mirroring
 * {@link GetterQueryParam.objectQueryParams}. See issue #3705.
 */
type AngularObjectParamStrategy = 'flatten' | 'comma' | 'deepObject';
/**
 * Filters query params for Angular's HttpClient.
 *
 * Why: Angular's HttpParams / HttpClient `params` type does not accept `null` or
 * `undefined` values, and arrays must only contain string/number/boolean.
 * Orval models often include nullable query params, so we remove nullish values
 * (including nulls inside arrays) before passing params to HttpClient or a
 * paramsSerializer to avoid runtime and type issues.
 *
 * Required-nullable params (spec `required: true` + `nullable: true`) are the
 * exception: dropping them silently would violate the OpenAPI contract. When a
 * `paramsSerializer` is configured (preserveRequiredNullables), a `null` value
 * is preserved for the serializer to encode. Without a serializer, `null` is
 * instead emitted as an empty string (`''`, wire form `?key=`) so the key
 * still reaches the request. See #3712.
 *
 * Returns an inline IIFE expression. For paths that benefit from a shared helper
 * (e.g. observe-mode branches), prefer getAngularFilteredParamsCallExpression +
 * getAngularFilteredParamsHelperBody instead.
 */
declare const getAngularFilteredParamsExpression: (paramsExpression: string, requiredNullableParamKeys?: string[], preserveRequiredNullables?: boolean, nonPrimitiveKeys?: string[], objectParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>) => string;
/**
 * Returns the body of a standalone `filterParams` helper function
 * to be emitted once in the generated file header, replacing the
 * inline IIFE that was previously duplicated in every method.
 *
 * Pass `{ hasObjectParams: true }` only when at least one operation in the
 * file actually needs the object-serialization overload (issue #3705) —
 * with the flag omitted/false this returns the exact same string as before
 * that feature existed, so files without object query params see zero
 * helper churn.
 *
 * Required-nullable handling: a query param that the spec marks both
 * `required` and `nullable` must still reach the wire when its runtime
 * value is `null`, or the request violates the OpenAPI contract. When a
 * `paramsSerializer` is configured (preserveRequiredNullables), the literal
 * `null` is preserved for the serializer to encode. Without a serializer,
 * `null` is instead emitted as an empty string (`''`, wire form `?key=`) so
 * the key is not silently dropped. See #3712.
 */
declare const getAngularFilteredParamsHelperBody: ({
  hasObjectParams
}?: {
  hasObjectParams?: boolean;
}) => string;
/**
 * Returns a call expression to the `filterParams` helper function.
 */
declare const getAngularFilteredParamsCallExpression: (paramsExpression: string, requiredNullableParamKeys?: string[], preserveRequiredNullables?: boolean, nonPrimitiveKeys?: string[], objectParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>) => string;
/**
 * Returns the filter call/IIFE used to massage query params before passing
 * them to Angular's HttpParams. When the user supplied a `paramsFilter`
 * mutator, the built-in `filterParams` is bypassed entirely and the user's
 * function is called with the raw params — they own nullish-stripping and
 * any object/array handling. Otherwise the built-in filter is used (either
 * the shared helper or an inline IIFE), and callers should only pass
 * `nonPrimitiveKeys` when a downstream serializer or custom consumer can
 * legally handle raw object/array values.
 */
declare const buildAngularParamsFilterExpression: ({
  paramsExpression,
  requiredNullableParamKeys,
  preserveRequiredNullables,
  nonPrimitiveKeys,
  objectParamStrategies,
  paramsFilter,
  useSharedHelper
}: {
  paramsExpression: string;
  requiredNullableParamKeys?: string[];
  preserveRequiredNullables?: boolean;
  nonPrimitiveKeys?: string[];
  objectParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>;
  paramsFilter?: GeneratorMutator;
  useSharedHelper: boolean;
}) => string;
/**
 * Computes the gated object-serialization strategy map for a single
 * operation's query params (issue #3705).
 *
 * Strategies are suppressed — returning `{}`, restoring the pre-#3705
 * dropping behavior — whenever:
 * - a `paramsFilter` mutator is configured (it bypasses the built-in filter
 *   entirely and owns raw object/array handling itself), or
 * - a `paramsSerializer` mutator is configured (it receives the raw object
 *   via the existing `nonPrimitiveKeys` passthrough instead), or
 * - `override.angular.queryObjectSerialization` is `'legacy'`.
 */
declare const getAngularObjectParamStrategies: ({
  queryParams,
  paramsSerializer,
  paramsFilter,
  queryObjectSerialization
}: {
  queryParams?: GetterQueryParam;
  paramsSerializer?: GeneratorMutator;
  paramsFilter?: GeneratorMutator;
  queryObjectSerialization: "spec" | "legacy";
}) => Readonly<Record<string, AngularObjectParamStrategy>>;
interface GenerateFormDataAndUrlEncodedFunctionOptions {
  body: GetterBody;
  formData?: GeneratorMutator;
  formUrlEncoded?: GeneratorMutator;
  isFormData: boolean;
  isFormUrlEncoded: boolean;
}
declare function generateBodyOptions(body: GetterBody, isFormData: boolean, isFormUrlEncoded: boolean): string | undefined;
interface GenerateAxiosOptions {
  response: GetterResponse;
  isExactOptionalPropertyTypes: boolean;
  angularObserve?: 'body' | 'events' | 'response';
  angularParamsRef?: string;
  requiredNullableQueryParamKeys?: string[];
  nonPrimitiveQueryParamKeys?: string[];
  objectQueryParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>;
  queryParams?: GeneratorSchema;
  headers?: GeneratorSchema;
  requestOptions?: object | boolean;
  hasSignal: boolean;
  hasSignalParam?: boolean;
  isAngular: boolean;
  paramsSerializer?: GeneratorMutator;
  paramsSerializerOptions?: ParamsSerializerOptions;
  paramsFilter?: GeneratorMutator;
}
declare function generateAxiosOptions({
  response,
  isExactOptionalPropertyTypes,
  angularObserve,
  angularParamsRef,
  requiredNullableQueryParamKeys,
  nonPrimitiveQueryParamKeys,
  objectQueryParamStrategies,
  queryParams,
  headers,
  requestOptions,
  hasSignal,
  hasSignalParam,
  isAngular,
  paramsSerializer,
  paramsSerializerOptions,
  paramsFilter
}: GenerateAxiosOptions): string;
interface GenerateOptionsOptions {
  route: string;
  body: GetterBody;
  angularObserve?: 'body' | 'events' | 'response';
  angularParamsRef?: string;
  headers?: GetterQueryParam;
  queryParams?: GetterQueryParam;
  /**
   * Per-parameter object-serialization strategies (issue #3705), already
   * gated by the caller for `override.angular.queryObjectSerialization` and
   * any configured `paramsFilter`/`paramsSerializer`.
   */
  objectQueryParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>;
  response: GetterResponse;
  verb: Verbs;
  requestOptions?: object | boolean;
  isFormData: boolean;
  isFormUrlEncoded: boolean;
  isAngular?: boolean;
  isExactOptionalPropertyTypes: boolean;
  hasSignal: boolean;
  hasSignalParam?: boolean;
  paramsSerializer?: GeneratorMutator;
  paramsSerializerOptions?: ParamsSerializerOptions;
  paramsFilter?: GeneratorMutator;
}
declare function generateOptions({
  route,
  body,
  angularObserve,
  angularParamsRef,
  headers,
  queryParams,
  objectQueryParamStrategies,
  response,
  verb,
  requestOptions,
  isFormData,
  isFormUrlEncoded,
  isAngular,
  isExactOptionalPropertyTypes,
  hasSignal,
  hasSignalParam,
  paramsSerializer,
  paramsSerializerOptions,
  paramsFilter
}: GenerateOptionsOptions): string;
declare function generateBodyMutatorConfig(body: GetterBody, isFormData: boolean, isFormUrlEncoded: boolean): string;
declare function generateQueryParamsAxiosConfig(response: GetterResponse, isAngular: boolean, requiredNullableQueryParamKeys?: string[], queryParams?: GetterQueryParam, paramsFilter?: GeneratorMutator): string;
interface GenerateMutatorConfigOptions {
  route: string;
  body: GetterBody;
  headers?: GetterQueryParam;
  queryParams?: GetterQueryParam;
  response: GetterResponse;
  verb: Verbs;
  isFormData: boolean;
  isFormUrlEncoded: boolean;
  hasSignal: boolean;
  hasSignalParam?: boolean;
  isExactOptionalPropertyTypes: boolean;
  isAngular?: boolean;
  paramsFilter?: GeneratorMutator;
}
declare function generateMutatorConfig({
  route,
  body,
  headers,
  queryParams,
  response,
  verb,
  isFormData,
  isFormUrlEncoded,
  hasSignal,
  hasSignalParam,
  isExactOptionalPropertyTypes,
  isAngular,
  paramsFilter
}: GenerateMutatorConfigOptions): string;
declare function generateMutatorRequestOptions(requestOptions: boolean | object | undefined, hasSecondArgument: boolean): string;
declare function generateFormDataAndUrlEncodedFunction({
  body,
  formData,
  formUrlEncoded,
  isFormData,
  isFormUrlEncoded
}: GenerateFormDataAndUrlEncodedFunctionOptions): string;
//#endregion
//#region src/generators/parameter-definition.d.ts
declare function generateParameterDefinition(parameters: OpenApiComponentsObject['parameters'], context: ContextSpec, suffix: string): GeneratorSchema[];
//#endregion
//#region src/generators/schema-definition.d.ts
/**
 * Extract all types from #/components/schemas
 */
declare function generateSchemasDefinition(schemas: OpenApiSchemasObject | undefined, context: ContextSpec, suffix: string, filters?: InputFiltersOptions): GeneratorSchema[];
//#endregion
//#region src/generators/verbs-options.d.ts
interface GenerateVerbOptionsParams {
  verb: Verbs;
  output: NormalizedOutputOptions;
  operation: OpenApiOperationObject;
  route: string;
  pathRoute: string;
  verbParameters?: OpenApiPathItemObject['parameters'];
  components?: OpenApiComponentsObject;
  context: ContextSpec;
}
declare function generateVerbOptions({
  verb,
  output,
  operation,
  route,
  pathRoute,
  verbParameters,
  context
}: GenerateVerbOptionsParams): Promise<GeneratorVerbOptions[]>;
interface GenerateVerbsOptionsParams {
  verbs: OpenApiPathItemObject;
  input: NormalizedInputOptions;
  output: NormalizedOutputOptions;
  route: string;
  pathRoute: string;
  context: ContextSpec;
}
declare function generateVerbsOptions({
  verbs,
  input,
  output,
  route,
  pathRoute,
  context
}: GenerateVerbsOptionsParams): Promise<GeneratorVerbsOptions>;
//#endregion
//#region src/getters/object.d.ts
/**
 * Context for form request body (multipart/form-data and
 * application/x-www-form-urlencoded) type generation.
 * Discriminated union with two states:
 *
 * 1. `{ atPart: false, encoding }` - At form root, before property iteration
 *    - May traverse through allOf/anyOf/oneOf to reach properties
 *    - Carries encoding map so getObject can look up `encoding[key]`
 *
 * 2. `{ atPart: true, partContentType }` - At a multipart part (top-level property)
 *    - `partContentType` = Encoding Object's `contentType` for this part
 *    - Used by getScalar for file type detection (precedence over contentMediaType)
 *    - Arrays pass this through to items; combiners inside arrays also get context
 *
 * `urlEncoded` marks an application/x-www-form-urlencoded body. Such bodies are
 * built with URLSearchParams, whose values are always strings, so getScalar
 * keeps file/binary fields as `string` instead of `Blob` (#1624).
 *
 * `undefined` means not in form context (or nested inside plain object field = JSON)
 */
type FormDataContext = {
  atPart: false;
  encoding: Record<string, {
    contentType?: string;
  }>;
  urlEncoded?: boolean;
} | {
  atPart: true;
  partContentType?: string;
  urlEncoded?: boolean;
};
interface GetObjectOptions {
  item: OpenApiSchemaObject;
  name?: string;
  context: ContextSpec;
  nullable: string;
  /**
   * Multipart/form-data context for file type handling.
   * @see FormDataContext
   */
  formDataContext?: FormDataContext;
}
/**
 * Return the output type from an object
 *
 * @param item item with type === "object"
 */
declare function getObject({
  item,
  name,
  context,
  nullable,
  formDataContext
}: GetObjectOptions): ScalarValue;
//#endregion
//#region src/getters/array.d.ts
interface GetArrayOptions {
  schema: OpenApiSchemaObject;
  name?: string;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
/**
 * Return the output type from an array
 *
 * @param item item with type === "array"
 */
declare function getArray({
  schema,
  name,
  context,
  formDataContext
}: GetArrayOptions): ScalarValue;
//#endregion
//#region src/getters/body.d.ts
interface GetBodyOptions {
  requestBody: OpenApiReferenceObject | OpenApiRequestBodyObject;
  operationName: string;
  context: ContextSpec;
  contentType?: OverrideOutputContentType;
}
declare function getBody({
  requestBody,
  operationName,
  context,
  contentType
}: GetBodyOptions): GetterBody;
/**
 * Returns per-content-type bodies when `splitByContentType` is enabled.
 * Each entry includes a `contentTypeSuffix` for generating distinct function names.
 */
declare function getBodiesByContentType({
  requestBody,
  operationName,
  context,
  contentType
}: GetBodyOptions): (GetterBody & {
  contentTypeSuffix: string;
})[];
//#endregion
//#region src/getters/combine.d.ts
type Separator = 'allOf' | 'anyOf' | 'oneOf';
declare function combineSchemas({
  name,
  schema,
  separator,
  context,
  nullable,
  formDataContext
}: {
  name?: string;
  schema: OpenApiSchemaObject;
  separator: Separator;
  context: ContextSpec;
  nullable: string;
  formDataContext?: FormDataContext;
}): ScalarValue;
//#endregion
//#region src/getters/discriminators.d.ts
declare function resolveDiscriminators(schemas: OpenApiSchemasObject, context: ContextSpec): OpenApiSchemasObject;
//#endregion
//#region src/getters/enum.d.ts
declare function getEnumNames(schemaObject: OpenApiSchemaObject | undefined): (string | undefined)[] | undefined;
declare function getEnumDescriptions(schemaObject: OpenApiSchemaObject | undefined): (string | undefined)[] | undefined;
declare function getEnum(value: string, enumName: string, names: (string | undefined)[] | undefined, enumGenerationType: EnumGeneration, descriptions?: (string | undefined)[], enumNamingConvention?: NamingConvention): string;
declare function getEnumImplementation(value: string, names?: (string | undefined)[], descriptions?: (string | undefined)[], enumNamingConvention?: NamingConvention): string;
interface CombinedEnumInput {
  value: string;
  isRef: boolean;
  schema: OpenApiSchemaObject | undefined;
}
interface CombinedEnumValue {
  value: string;
  valueImports: string[];
  hasNull: boolean;
}
declare function getEnumUnionFromSchema(schema: OpenApiSchemaObject | undefined): string;
declare function getCombinedEnumValue(inputs: CombinedEnumInput[]): CombinedEnumValue;
//#endregion
//#region src/getters/keys.d.ts
declare function getKey(key: string): string;
/**
 * Emits a property access for a possibly non-identifier name: dot access for
 * valid identifier names (`.petId`), quoted bracket access otherwise
 * (`['scope.id']`).
 */
declare function getPropertyAccessor(name: string): string;
//#endregion
//#region src/getters/operation.d.ts
declare function getOperationId(operation: OpenApiOperationObject, route: string, verb: Verbs): string;
//#endregion
//#region src/getters/parameters.d.ts
interface GetParametersOptions {
  parameters: (OpenApiReferenceObject | OpenApiParameterObject)[];
  context: ContextSpec;
}
declare function getParameters({
  parameters,
  context
}: GetParametersOptions): GetterParameters;
//#endregion
//#region src/getters/params.d.ts
/**
 * Return every params in a path
 *
 * @example
 * ```
 * getParamsInPath("/pet/{category}/{name}/");
 * // => ["category", "name"]
 * ```
 * @param path
 */
declare function getParamsInPath(path: string): string[];
interface GetParamsOptions {
  route: string;
  pathParams?: GetterParameters['query'];
  operationId: string;
  context: ContextSpec;
  output: NormalizedOutputOptions;
}
declare function getParams({
  route,
  pathParams,
  operationId,
  context,
  output
}: GetParamsOptions): GetterParams;
//#endregion
//#region src/getters/props.d.ts
interface GetPropsOptions {
  body: GetterBody;
  queryParams?: GetterQueryParam;
  params: GetterParams;
  operationName: string;
  headers?: GetterQueryParam;
  context: ContextSpec;
}
declare function getProps({
  body,
  queryParams,
  params,
  operationName,
  headers,
  context
}: GetPropsOptions): GetterProps;
//#endregion
//#region src/getters/query-params.d.ts
interface GetQueryParamsOptions {
  queryParams: GetterParameters['query'];
  operationName: string;
  context: ContextSpec;
  suffix?: string;
}
declare function getQueryParams({
  queryParams,
  operationName,
  context,
  suffix
}: GetQueryParamsOptions): GetterQueryParam | undefined;
//#endregion
//#region src/getters/ref.d.ts
/**
 * `$ref`s targeting these sections under `#/components/...` are emitted as
 * named TypeScript imports (e.g. `import type { Pet } from './model'`).
 * Refs to any other location — for example `#/paths/.../schema` produced by
 * JSON-Schema-Ref-Parser `bundle()` — have no corresponding `export type`
 * and must be inlined by the resolver. See issue #398.
 */
declare const NAMED_COMPONENT_SECTIONS: readonly ["schemas", "responses", "parameters", "requestBodies"];
type RefComponent = (typeof NAMED_COMPONENT_SECTIONS)[number];
declare const RefComponentSuffix: Record<RefComponent, string>;
/**
 * True iff `ref` targets a named slot eligible for emission as a TypeScript
 * import. Used by `resolveValue` to decide between named import vs inlining
 * the resolved schema.
 */
declare function isComponentRef(ref: string): boolean;
interface RefInfo {
  name: string;
  originalName: string;
  refPaths?: string[];
}
/**
 * Return the output type from the $ref
 *
 * @param $ref
 */
declare function getRefInfo($ref: string, context: ContextSpec): RefInfo;
/**
 * Extracts the anchor name from a fragment-only `$dynamicRef` (e.g. `#category` → `category`).
 *
 * Returns `undefined` for external-document `$dynamicRef` values (e.g. `other.json#anchor`)
 * which are not supported.
 */
declare function getDynamicAnchorName(dynamicRef: string): string | undefined;
//#endregion
//#region src/getters/res-req-types.d.ts
declare function getResReqTypes(responsesOrRequests: [string, OpenApiReferenceObject | OpenApiResponseObject | OpenApiRequestBodyObject][], name: string, context: ContextSpec, defaultType?: string, uniqueKey?: (item: ResReqTypesValue, index: number, data: ResReqTypesValue[]) => unknown): ResReqTypesValue[];
/**
 * Response type categories for HTTP client response parsing.
 * Maps to Angular HttpClient's responseType, Axios responseType, and Fetch response methods.
 */
type ResponseTypeCategory = 'json' | 'text' | 'blob' | 'arraybuffer';
/**
 * Determine the responseType option based on success content types only.
 * This avoids error-response content types influencing the responseType.
 */
declare function getSuccessResponseType(response: GetterResponse): 'blob' | 'text' | undefined;
/**
 * Determine the response type category for a given content type.
 * Used to set the correct responseType option in HTTP clients.
 *
 * @param contentType - The MIME content type (e.g., 'application/json', 'text/plain')
 * @returns The response type category to use for parsing
 */
declare function getResponseTypeCategory(contentType: string): ResponseTypeCategory;
/**
 * Get the default content type from a list of content types.
 * Priority: application/json > any JSON-like type > first in list
 *
 * @param contentTypes - Array of content types from OpenAPI spec
 * @returns The default content type to use
 */
declare function getDefaultContentType(contentTypes: string[]): string;
//#endregion
//#region src/getters/response.d.ts
interface GetResponseOptions {
  responses: OpenApiResponsesObject;
  operationName: string;
  context: ContextSpec;
  contentType?: OverrideOutputContentType;
}
declare function getResponse({
  responses,
  operationName,
  context,
  contentType
}: GetResponseOptions): GetterResponse;
//#endregion
//#region src/getters/route.d.ts
/**
 * Sanitizes an OpenAPI path-parameter name while preserving the spec's
 * spelling: keeps word characters, underscores, dashes and dots, strips
 * everything else, and prefixes ES5 keywords with an underscore. Use this
 * when the emitted name must match the spec (e.g. Hono routes).
 */
declare const sanitizePathParamName: (name: string) => string;
/**
 * Derives the generated JS identifier for an OpenAPI path-parameter name
 * (`scope.id` → `scopeId`, `_id` → `id`, `class` → `_class`). This is the
 * single source of truth for param variable names: the emitted route
 * interpolations, the generated function arguments and the spec-parameter
 * matching must all agree on it.
 */
declare const camelPathParamName: (name: string) => string;
/**
 * Converts every `{param}` in an OpenAPI path to `:param` (Hono/MSW style
 * routes). `formatParamName` maps the raw OpenAPI parameter name to the
 * emitted one (`sanitizePathParamName` or `camelPathParamName`).
 */
declare const toColonRoutePath: (path: string, formatParamName: (rawName: string) => string) => string;
/**
 * Converts an OpenAPI path (`{param}`) to a template-literal route (`${param}`),
 * escaping static text with jsesc for safe embedding in backtick strings.
 * The `route` arg must be a raw OpenAPI path; a non-empty route always emits
 * with a leading `/`.
 */
declare function getRoute(route: string): string;
/**
 * Prepends a base URL to an already-processed route.
 *
 * `route` must be the output of {@link getRoute} (already escaped for template
 * literals). This function does NOT re-escape it — jsesc is not idempotent, so
 * escaping twice would double the backslashes. Only the server URL from
 * `getBaseUrlFromSpecification` is escaped here, after variable substitution.
 */
declare function getFullRoute(route: string, servers: OpenApiServerObject[] | undefined, baseUrl: string | BaseUrlFromConstant | BaseUrlFromSpec | BaseUrlRuntime | undefined): string;
/**
 * Returns `GeneratorImport` entries for {@link BaseUrlRuntime.imports} when `baseUrl` is a runtime config.
 *
 * Defaults `values` to true so symbols in `runtime` emit as value imports in the
 * generated client. Set `values: false` explicitly only for unusual cases (e.g.
 * type-only symbols referenced from the expression).
 */
declare function getBaseUrlRuntimeImports(baseUrl?: NormalizedOutputOptions['baseUrl']): GeneratorImport[];
declare const wrapRouteParameters: (route: string, prepend: string, append: string) => string;
declare const makeRouteSafe: (route: string) => string;
declare function getRouteAsArray(route: string): string;
//#endregion
//#region src/getters/scalar.d.ts
/**
 * Returns true when a schema describes a raw binary string scalar — i.e. one
 * that getScalar's `case 'string':` branch would coerce to `Blob` outside a
 * url-encoded context (see the formDataContext.urlEncoded gate below). Shared
 * with resolveValue so the component-`$ref` urlEncoded short-circuit and the
 * inline scalar path stay in lockstep when new binary shapes are added
 * (#1624 / #3395 / #2410).
 *
 * Accepts OAS 3.1 nullable unions (`type: ['string', 'null']`) since getScalar
 * normalizes those into `case 'string':` before invoking this predicate.
 */
declare function isBinaryScalarSchema(schema: OpenApiSchemaObject): boolean;
interface GetScalarOptions {
  item: OpenApiSchemaObject;
  name?: string;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
/**
 * Return the typescript equivalent of open-api data type
 *
 * @param item
 * @ref https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#data-types
 */
declare function getScalar({
  item,
  name,
  context,
  formDataContext
}: GetScalarOptions): ScalarValue;
//#endregion
//#region src/resolvers/object.d.ts
interface ResolveOptions {
  schema: OpenApiSchemaObject | OpenApiReferenceObject;
  propName?: string;
  combined?: boolean;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
interface CreateTypeAliasOptions {
  resolvedValue: ResolverValue;
  propName: string | undefined;
  context: ContextSpec;
}
/**
 * Wraps inline object type in a type alias.
 * E.g. `{ foo: string }` → value becomes `FooBody`, schema gets `export type FooBody = { foo: string };`
 */
declare function createTypeAliasIfNeeded({
  resolvedValue,
  propName,
  context
}: CreateTypeAliasOptions): ScalarValue | undefined;
declare function resolveObject({
  schema,
  propName,
  combined,
  context,
  formDataContext
}: ResolveOptions): ResolverValue;
//#endregion
//#region src/resolvers/ref.d.ts
/** Convert a `$dynamicAnchor` name to a valid TypeScript generic parameter identifier. */
declare function dynamicAnchorToParamName(anchor: string): string;
declare function dynamicAnchorsToUniqueParamNames(anchors: string[]): Map<string, string>;
type Example = OpenApiExampleObject | OpenApiReferenceObject;
type ResolvedExample = unknown;
type Examples = Example[] | Record<string, Example> | ResolvedExample[] | Record<string, ResolvedExample> | undefined;
/**
 * Recursively resolves a `$ref` in an OpenAPI document, following
 * nested schema refs and collecting imports along the way.
 *
 * Handles OpenAPI 3.0 `nullable` and 3.1 type-array hints on direct refs.
 *
 * @see https://spec.openapis.org/oas/v3.0.3#reference-object
 * @see https://spec.openapis.org/oas/v3.1.0#reference-object
 */
declare function resolveRef<TSchema extends object = OpenApiComponentsObject>(schema: OpenApiComponentsObject | OpenApiReferenceObject, context: ContextSpec, imports?: GeneratorImport[]): {
  schema: TSchema;
  imports: GeneratorImport[];
};
/**
 * Describes a resolved generic alias binding — the concrete type arguments
 * that fill the template's `$dynamicAnchor` slots for a given `$ref` with
 * `$defs` overrides.
 *
 * Produced by {@link extractBoundAliasInfo} and consumed by `resolveValue`
 * to emit instantiated generic type expressions (e.g. `Paginated<User>`).
 */
interface BoundAliasInfo {
  genericName: string;
  genericParams: string[];
  typeArgs: string[];
  imports: {
    name: string;
    schemaName: string;
  }[];
  extraSchemas?: (OpenApiSchemaObject | OpenApiReferenceObject)[];
}
/**
 * Extract bound-alias information from a schema that references a generic template
 * and binds `$dynamicAnchor` entries to concrete types via `$defs`.
 */
declare function extractBoundAliasInfo(schema: OpenApiSchemaObject | OpenApiReferenceObject, context: ContextSpec): BoundAliasInfo | undefined;
/**
 * Build the dynamic scope for a schema: maps `$dynamicAnchor` names to concrete
 * type entries for self-referential resolution, `$defs` bindings, and sibling anchors.
 */
declare function buildDynamicScope(schemaName: string, schema: OpenApiSchemaObject, context: ContextSpec): Record<string, DynamicScopeEntry>;
/**
 * Build dynamic scope entries for an **anonymous inline** subschema that declares
 * `$dynamicAnchor` without a `$ref` (e.g. inside `allOf`, `items`, nested props).
 *
 * Unlike {@link buildDynamicScope}, entries carry the concrete `inlineSchema` so
 * that a descendant `$dynamicRef` resolves to the inline override rather than the
 * outer/global component. Used when `dereference` enters a subschema without a
 * named component `$ref`.
 *
 * Scope of handling (deliberate, see #3492):
 *   - Direct `$dynamicAnchor` on the subschema → inline entry.
 *   - `$defs` `$dynamicAnchor` *without* a `$ref` → inline entry. Note this
 *     differs from `buildDynamicScope`, which treats unbound `$defs` anchors as
 *     generic parameters (`isParameter`); inline subschemas are concrete
 *     instances, so the anchor resolves to the inline schema object itself.
 *   - `$defs` `$dynamicAnchor` *with* a `$ref` → intentionally NOT collected
 *     here. Such anchors rely on `resolveDynamicRef`'s global fallback (which
 *     finds them when the `$ref` target declares the same anchor). Fully
 *     resolving them would duplicate `buildDynamicScope`'s `$defs` logic.
 */
declare function buildInlineDynamicScope(schema: OpenApiSchemaObject): Record<string, DynamicScopeEntry>;
/**
 * Lazily build and memoize the `$dynamicAnchor` index on the context.
 *
 * Scans `components.schemas` once per spec and stores, per anchor name, the
 * compact match info required by the {@link resolveDynamicRef} fallback (see
 * {@link DynamicAnchorIndexEntry}). Subsequent fallback lookups are O(1)
 * instead of re-scanning every schema per `$dynamicRef`.
 *
 * Recording of non-exact matches stops once `count >= 2` — the fallback only
 * distinguishes "exactly one non-exact" from "ambiguous", so further non-exact
 * names are irrelevant. Iteration continues regardless because a later schema
 * whose key equals the anchor name is still the definitive (`exactName`)
 * winner. This is the safe form of "bail early when ambiguous": a literal
 * early-return at `count === 2` would regress the exact-name rule when the
 * exact schema appears later in iteration order.
 */
declare function getDynamicAnchorIndex(context: ContextSpec): Map<string, DynamicAnchorIndexEntry>;
/**
 * Resolve a `$dynamicRef` anchor to its concrete type using the current dynamic scope.
 * Returns `{ schema: {}, resolvedTypeName: 'unknown' }` when no scope override exists.
 */
declare function resolveDynamicRef(anchorName: string, context: ContextSpec, imports?: GeneratorImport[]): {
  schema: OpenApiSchemaObject;
  imports: GeneratorImport[];
  resolvedTypeName: string;
  schemaName: string | undefined;
};
/** Recursively resolves `$ref` entries in an examples array or record. */
declare function resolveExampleRefs(examples: Examples, context: ContextSpec): ResolvedExample[] | Record<string, ResolvedExample> | undefined;
//#endregion
//#region src/resolvers/value.d.ts
interface ResolveValueOptions {
  schema: OpenApiSchemaObject | OpenApiReferenceObject;
  name?: string;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
/**
 * Resolves an OpenAPI schema or reference object to a {@link ResolverValue}
 * that carries the TypeScript type string, required imports, and metadata.
 *
 * Handles all schema forms in priority order:
 * 1. **Bound generic alias** — a `$ref` with `$defs` overrides; emits an
 *    instantiated generic expression such as `Paginated<User>`.
 * 2. **Component `$ref`** — a named `$ref` pointing to `#/components/…`;
 *    emits the schema name as a reference import.
 * 3. **Non-component `$ref`** — an anonymous or path-level ref; inlines the
 *    resolved schema via {@link getScalar} (cycle-safe).
 * 4. **`$dynamicRef`** — resolved via the active dynamic scope; falls back to
 *    `unknown` when the anchor is absent or the ref is a bare `#`.
 * 5. **Plain schema** — delegates to {@link getScalar} for all other cases
 *    (primitives, objects, arrays, enums, …).
 */
declare function resolveValue({
  schema,
  name,
  context,
  formDataContext
}: ResolveValueOptions): ResolverValue;
//#endregion
//#region src/utils/assertion.d.ts
/**
 * Type guard for an OpenAPI {@link OpenApiReferenceObject}.
 *
 * Returns `true` when `obj` has a `$ref` property, indicating a static
 * JSON Pointer reference rather than an inline schema.
 *
 * @param obj - Value to test.
 */
declare function isReference(obj: object): obj is OpenApiReferenceObject;
/**
 * Represents an OpenAPI 3.1 schema object that contains a `$dynamicRef`
 * keyword, used for recursive or polymorphic schema references.
 *
 * @see https://json-schema.org/draft/2020-12/json-schema-core#section-8.2.4
 */
interface OpenApiDynamicReferenceObject {
  $dynamicRef: string;
  [key: string]: unknown;
}
/**
 * Discriminator helper for {@link OpenApiDynamicReferenceObject}.
 *
 * Returns `true` when `obj` has a `$dynamicRef` string property,
 * indicating it is an OpenAPI 3.1 dynamic reference rather than a
 * static `$ref`.
 *
 * @param obj - Value to test.
 *
 * @see https://json-schema.org/draft/2020-12/json-schema-core#section-8.2.4
 */
declare function isDynamicReference(obj: object): obj is OpenApiDynamicReferenceObject;
/**
 * Returns `true` when `pathValue` has no file extension and is treated as a
 * directory path.
 *
 * @param pathValue - Path string to inspect.
 */
declare function isDirectory(pathValue: string): boolean;
/**
 * Type guard for plain objects created with `{}` or `new Object()`.
 *
 * Excludes `null`, arrays, dates, and other non-plain object values.
 *
 * @param x - Value to test.
 */
declare function isObject(x: unknown): x is Record<string, unknown>;
/**
 * Type guard for string primitives and `String` wrapper objects.
 *
 * @param val - Value to test.
 */
declare function isStringLike(val: unknown): val is string;
/**
 * Type guard for ES module namespace objects.
 *
 * @param x - Value to test.
 */
declare function isModule(x: unknown): x is Record<string, unknown>;
/**
 * Type guard for integer numbers and numeric strings.
 *
 * Accepts finite integers (`42`) and strings that match `/^-?\d+$/`
 * (`"-1"`, `"0"`). Rejects floats, empty strings, and non-numeric values.
 *
 * @param x - Value to test.
 */
declare function isNumeric(x: unknown): x is number;
/**
 * Type guard for an inline OpenAPI {@link OpenApiSchemaObject}.
 *
 * Returns `true` when `x` looks like a schema definition: it has a known
 * `type`, composition keywords (`allOf`, `anyOf`, `oneOf`), or `properties`.
 * Does not match reference objects; use {@link isReference} for those.
 *
 * @param x - Value to test.
 */
declare function isSchema(x: unknown): x is OpenApiSchemaObject;
/**
 * Type guard for HTTP methods defined in {@link Verbs}.
 *
 * @param verb - Method name to test (for example, `"get"`, `"post"`).
 */
declare function isVerb(verb: string): verb is Verbs;
/**
 * Returns `true` when `str` is a valid absolute URL with an `http:` or
 * `https:` protocol.
 *
 * Empty or whitespace-only strings are rejected.
 *
 * @param str - URL string to validate.
 */
declare function isUrl(str: string): boolean;
/**
 * Type guard for the MSW mock generator. Use to narrow a
 * `GlobalMockOptions | ClientMockBuilder` value to `MswMockOptions`.
 *
 * @param mock - Mock configuration or builder to test.
 */
declare function isMswMock(mock: GlobalMockOptions | ClientMockBuilder): mock is MswMockOptions;
/**
 * Type guard for the Faker mock generator. Use to narrow a
 * `GlobalMockOptions | ClientMockBuilder` value to `FakerMockOptions`.
 *
 * @param mock - Mock configuration or builder to test.
 */
declare function isFakerMock(mock: GlobalMockOptions | ClientMockBuilder): mock is FakerMockOptions;
//#endregion
//#region src/utils/async-reduce.d.ts
declare function asyncReduce<IterationItem, AccValue>(array: IterationItem[], reducer: (accumulate: AccValue, current: IterationItem) => AccValue | Promise<AccValue>, initValue: AccValue): Promise<AccValue>;
//#endregion
//#region src/utils/case.d.ts
declare function pascal(s?: string): string;
declare function camel(s?: string): string;
declare function snake(s?: string): string;
declare function kebab(s?: string): string;
declare function upper(s: string, fillWith: string, isDeapostrophe?: boolean): string;
declare function conventionName(name: string, convention: NamingConvention): string;
//#endregion
//#region src/utils/compare-version.d.ts
declare function compareVersions(firstVersion: string, secondVersions: string, operator?: CompareOperator): boolean;
//#endregion
//#region src/utils/content-type.d.ts
/**
 * Determine if a content type is binary.
 * Only known binary types return true. Unknown types default to false (non-binary)
 * so that schema type information is preserved rather than being overridden with Blob.
 */
declare function isBinaryContentType(contentType: string): boolean;
/**
 * Determine if a form-data field should be treated as a file (binary or text).
 *
 * Precedence (per OAS 3.1): encoding.contentType > schema.contentMediaType
 *
 * Returns:
 * - 'binary': binary file (Blob)
 * - 'text': text file (Blob | string)
 * - undefined: not a file, use standard string resolution
 */
declare function getFormDataFieldFileType(resolvedSchema: OpenApiSchemaObject, partContentType: string | undefined): 'binary' | 'text' | undefined;
/**
 * Filter configuration for content types
 */
interface ContentTypeFilter {
  include?: string[];
  exclude?: string[];
}
/**
 * Filters items by content type based on include/exclude rules
 *
 * @param items - Array of items with contentType property
 * @param filter - Optional filter configuration
 * @returns Filtered array
 *
 * @example
 * ```ts
 * const types = [
 *   { contentType: 'application/json', value: '...' },
 *   { contentType: 'text/xml', value: '...' }
 * ];
 *
 * // Include only JSON
 * filterByContentType(types, { include: ['application/json'] });
 *
 * // Exclude XML
 * filterByContentType(types, { exclude: ['text/xml'] });
 * ```
 */
declare function filterByContentType<T extends {
  contentType: string;
}>(items: T[], filter?: ContentTypeFilter): T[];
//#endregion
//#region src/utils/debug.d.ts
interface DebuggerOptions {
  onlyWhenFocused?: boolean | string;
}
declare function createDebugger(ns: string, options?: DebuggerOptions): debug.Debugger['log'];
//#endregion
//#region src/utils/deep-non-nullable.d.ts
type DeepNonNullable<T> = T extends ((...args: never[]) => unknown) ? T : T extends readonly (infer U)[] ? DeepNonNullable<NonNullable<U>>[] : T extends object ? { [K in keyof T]: DeepNonNullable<NonNullable<T[K]>> } : NonNullable<T>;
//#endregion
//#region src/utils/doc.d.ts
interface JsDocSchema extends Record<string, unknown> {
  description?: string[] | string;
  deprecated?: boolean;
  summary?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minItems?: number;
  maxItems?: number;
  type?: string | string[];
  pattern?: string;
  items?: JsDocSchema;
}
declare function jsDoc(schema: object & JsDocSchema, tryOneLine?: boolean, context?: ContextSpec): string;
declare function keyValuePairsToJsDoc(keyValues: {
  key: string;
  value: string;
}[]): string;
//#endregion
//#region src/utils/dynamic-import.d.ts
declare function dynamicImport<T>(toImport: T | string, from?: string, takeDefault?: boolean): Promise<T>;
//#endregion
//#region src/utils/extension.d.ts
declare function getExtension(path: string): "yaml" | "json";
//#endregion
//#region src/utils/file.d.ts
declare function getFileInfo(target?: string, {
  backupFilename,
  extension
}?: {
  backupFilename?: string;
  extension?: string;
}): {
  path: string;
  pathWithoutExtension: string;
  extension: string;
  isDirectory: boolean;
  dirname: string;
  filename: string;
};
declare function removeFilesAndEmptyFolders(patterns: string[], dir: string): Promise<void>;
//#endregion
//#region src/utils/file-extensions.d.ts
/**
 * Returns the filename suffix for a given mock entry's output file. For
 * example a `{ type: OutputMockType.MSW }` entry produces `<file>.msw.ts` and
 * a `{ type: OutputMockType.FAKER }` entry produces `<file>.faker.ts`.
 *
 * Custom `ClientMockBuilder` functions default to the `msw` suffix to preserve
 * the historical behavior.
 */
declare function getMockFileExtensionByTypeName(mock: GlobalMockOptions | ClientMockBuilder): OutputMockType;
//#endregion
//#region src/utils/get-property-safe.d.ts
/**
 * Type safe way to get arbitrary property from an object.
 *
 * @param obj - The object from which to retrieve the property.
 * @param propertyName - The name of the property to retrieve.
 * @returns Object with `hasProperty: true` and `value` of the property if it exists; otherwise `hasProperty: false` and undefined.
 *
 * @remarks Until TypeScript adds type-narrowing for Object.hasOwn we have to use this workaround
 */
declare function getPropertySafe<T extends object, K extends keyof T>(obj: T, propertyName: K | string): {
  hasProperty: true;
  value: T[K];
} | {
  hasProperty: false;
  value: undefined;
};
//#endregion
//#region src/utils/is-body-verb.d.ts
declare function getIsBodyVerb(verb: Verbs): boolean;
//#endregion
//#region src/utils/logger.d.ts
declare const log: (message?: any, ...optionalParams: any[]) => void;
declare function logWarning(message: string): void;
declare function getWarningCount(): number;
declare function resetWarnings(): void;
declare function setVerbose(v: boolean): void;
declare function isVerbose(): boolean;
declare const logVerbose: typeof console.log;
declare function startMessage({
  name,
  version,
  description
}: {
  name: string;
  version: string;
  description: string;
}): string;
declare function logError(err: unknown, tag?: string): void;
declare function mismatchArgsMessage(mismatchArgs: string[]): void;
declare function createSuccessMessage(backend?: string): void;
type LogType = 'error' | 'warn' | 'info';
type LogLevel = LogType | 'silent';
interface Logger {
  info(msg: string, options?: LogOptions): void;
  warn(msg: string, options?: LogOptions): void;
  warnOnce(msg: string, options?: LogOptions): void;
  error(msg: string, options?: LogOptions): void;
  clearScreen(type: LogType): void;
  hasWarned: boolean;
}
interface LogOptions {
  clear?: boolean;
  timestamp?: boolean;
}
declare const LogLevels: Record<LogLevel, number>;
interface LoggerOptions {
  prefix?: string;
  allowClearScreen?: boolean;
}
declare function createLogger(level?: LogLevel, options?: LoggerOptions): Logger;
//#endregion
//#region src/utils/merge-deep.d.ts
declare function mergeDeep<T extends object, U extends object>(source: T, target: U): T & U;
//#endregion
//#region src/utils/occurrence.d.ts
declare function count(str: string | undefined, key: string): number;
declare namespace path_d_exports {
  export { getRelativeImportPath, getSchemaFileName, isAbsolute, join, joinSafe, normalizeSafe, relativeSafe, resolve, separator$1 as separator, toUnix };
}
declare function isAbsolute(value: string): boolean;
declare function resolve(...args: string[]): string;
declare function toUnix(value: string): string;
declare function join(...args: string[]): string;
/**
 * Behaves exactly like `path.relative(from, to)`, but keeps the first meaningful "./"
 */
declare function relativeSafe(from: string, to: string): string;
declare function getSchemaFileName(path: string): string;
declare const separator$1 = "/";
declare function normalizeSafe(value: string): string;
declare function joinSafe(...values: string[]): string;
/**
 * Given two absolute file paths, generates a valid ESM relative import path
 * from the 'importer' file to the 'exporter' file.
 *
 * @example
 * ```ts
 * getRelativeImportPath('/path/to/importer.ts', '/path/to/exporter.ts')
 * // => './exporter'
 * getRelativeImportPath('/path/to/importer.ts', '/path/to/sub/exporter.ts')
 * // => './sub/exporter'
 * getRelativeImportPath('/path/to/importer.ts', '/path/sibling/exporter.ts')
 * // => '../sibling/exporter'
 * ```
 *
 * This function handles path normalization, cross-platform separators, and
 * ensures the path is a valid ESM relative specifier (e.g., starts with './').
 *
 * @param importerFilePath - The absolute path of the file that will contain the import statement.
 * @param exporterFilePath - The absolute path of the file being imported.
 * @param [includeFileExtension=false] - Whether the import path should include the file extension, defaults to false.
 * @returns The relative import path string.
 */
declare function getRelativeImportPath(importerFilePath: string, exporterFilePath: string, includeFileExtension?: boolean): string;
//#endregion
//#region src/utils/resolve-version.d.ts
declare function resolveInstalledVersion(packageName: string, fromDir: string): string | undefined;
declare function resolveInstalledVersions(packageJson: PackageJson, fromDir: string): Record<string, string>;
//#endregion
//#region src/utils/schemas-options.d.ts
interface SchemaOptionLike {
  importPath?: string;
}
/**
 * Extracts the custom package import specifier from a normalized `schemas`
 * config. Returns `undefined` when `schemas` is a plain string, `false`,
 * `undefined`, or when `importPath` is not set.
 */
declare function getSchemasImportPath(schemas?: string | NormalizedSchemaOptions | SchemaOptionLike | false | null): string | undefined;
//#endregion
//#region src/utils/sort.d.ts
declare const sortByPriority: <T>(arr: (T & {
  default?: unknown;
  required?: boolean;
})[]) => (T & {
  default?: unknown;
  required?: boolean;
})[];
//#endregion
//#region src/utils/string.d.ts
/**
 * Converts data to a string representation suitable for code generation.
 * Handles strings, numbers, booleans, functions, arrays, and objects.
 *
 * @param data - The data to stringify. Can be a string, array, object, number, boolean, function, null, or undefined.
 * @returns A string representation of the data, `null` for null, or undefined if data is undefined.
 * @example
 * stringify('hello') // returns "'hello'"
 * stringify(42) // returns "42"
 * stringify([1, 2, 3]) // returns "[1, 2, 3]"
 * stringify({ a: 1, b: 'test' }) // returns "{ a: 1, b: 'test', }"
 */
declare function stringify(data?: unknown): string | undefined;
/**
 * Sanitizes a string value by removing or replacing special characters and ensuring
 * it conforms to JavaScript identifier naming rules if needed.
 *
 * @param value - The string value to sanitize.
 * @param options - Configuration options for sanitization:
 *   - `whitespace` - Replacement string for whitespace characters, or `true` to keep them.
 *   - `underscore` - Replacement string for underscores, or `true` to keep them.
 *   - `dot` - Replacement string for dots, or `true` to keep them.
 *   - `dash` - Replacement string for dashes, or `true` to keep them.
 *   - `es5keyword` - If true, prefixes the value with underscore if it's an ES5 keyword.
 *   - `es5IdentifierName` - If true, ensures the value is a valid ES5 identifier name.
 *   - `special` - If true, preserves special characters that would otherwise be removed.
 * @returns The sanitized string value.
 * @example
 * sanitize('hello-world', { dash: '_' }) // returns "hello_world"
 * sanitize('class', { es5keyword: true }) // returns "_class"
 * sanitize('123abc', { es5IdentifierName: true }) // returns "N123abc"
 */
declare function sanitize(value: string, options?: {
  whitespace?: string | true;
  underscore?: string | true;
  dot?: string | true;
  dash?: string | true;
  es5keyword?: boolean;
  es5IdentifierName?: boolean;
  special?: boolean;
}): string;
/**
 * Converts an array of objects to a comma-separated string representation.
 * Optionally extracts a nested property from each object using a dot-notation path.
 *
 * @param props - Array of objects to convert to string.
 * @param path - Optional dot-notation path to extract a property from each object (e.g., "user.name").
 * @returns A comma-separated string of values, with each value on a new line indented.
 * @example
 * toObjectString([{ name: 'John' }, { name: 'Jane' }], 'name')
 * // returns "John,\n    Jane,"
 * toObjectString(['a', 'b', 'c'])
 * // returns "a,\n    b,\n    c,"
 */
declare function toObjectString<T>(props: T[], path?: keyof T): string;
/**
 * Converts a number to its word representation by translating each digit to its word form.
 *
 * @param num - The number to convert to words.
 * @returns A string containing the word representation of each digit concatenated together.
 * @example
 * getNumberWord(123) // returns "onetwothree"
 * getNumberWord(42) // returns "fourtwo"
 */
declare function getNumberWord(num: number): string;
/**
 * Escapes a specific character in a string by prefixing all of its occurrences with a backslash.
 *
 * @param str - The string to escape, or null.
 * @param char - The character to escape. Defaults to single quote (').
 * @returns The escaped string, or null if the input is null.
 * @example
 * escape("don't") // returns "don\'t"
 * escape("it's John's") // returns "it\'s John\'s"
 * escape('say "hello"', '"') // returns 'say \\"hello\\"'
 * escape("a'''b", "'") // returns "a\'\'\'b"
 */
declare function escape(str: string | null, char?: string): string | undefined;
/**
 * Escapes regular expression metacharacters in a string so it can be safely
 * embedded inside a RegExp pattern.
 *
 * @param value - The raw string value to escape for regex usage.
 * @returns The escaped string.
 * @example
 * escapeRegExp('foo$bar') // returns 'foo\\$bar'
 */
declare function escapeRegExp(value: string): string;
/**
 * Escape all characters not included in SingleStringCharacters and
 * DoubleStringCharacters on
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * Based on https://github.com/joliss/js-string-escape/blob/master/index.js
 *
 * @param input String to escape
 */
declare function jsStringEscape(input: string): string;
/**
 * Escape a string for embedding inside a single-quoted JS string literal.
 *
 * Unlike {@link jsStringEscape}, this escapes only what a string literal
 * actually needs: backslashes, single quotes, and line terminators. It
 * deliberately does NOT escape `/` or `*`, which are meaningless inside a
 * string literal, so escaping them produces "useless escapes" that round-trip
 * to the same value but trip ESLint's `no-useless-escape` in generated code
 * (e.g. RegExp pattern literals, see #3337).
 *
 * Use {@link jsStringEscape} instead when the value is embedded in a JS comment,
 * where the comment delimiters must be neutralized.
 *
 * @param input String to escape
 */
declare function jsStringLiteralEscape(input: string): string;
/**
 * Deduplicates a TypeScript union type string.
 * Handles types like "A | B | B" → "A | B" and "null | null" → "null".
 * Only splits on top-level | (not inside {} () [] <> or string literals).
 */
declare function dedupeUnionType(unionType: string): string;
//#endregion
//#region src/utils/tags.d.ts
/**
 * Canonical bucket key for a single OpenAPI tag.
 *
 * In `tags` / `tags-split` mode operations are routed into files by their first
 * tag. This function is the **single source of truth** for turning a tag (or a
 * missing tag) into the key that identifies that file bucket. Every place that
 * groups operations by tag, derives a per-tag file/directory name, or checks
 * whether an operation belongs to a tag MUST go through here so that the
 * "build the key" side and the "look the key up" side can never disagree.
 *
 * The result is `kebab`-cased. `kebab` is idempotent
 * (`kebab(kebab(x)) === kebab(x)`), so it is always safe to call this on a value
 * that is already a canonical key. Other case functions (`camel`, `pascal`) are
 * NOT safe here: they do not round-trip through the bucket key for tags
 * containing acronyms or spaces (e.g. `"AB Widget"`), which is exactly the class
 * of bug this module exists to prevent.
 *
 * Missing or empty tags map to the implicit {@link DefaultTag} bucket.
 */
declare function getTagKey(tag?: string): string;
/**
 * Canonical bucket key for an operation, derived from its primary (first) tag.
 *
 * Untagged operations resolve to the {@link DefaultTag} bucket.
 */
declare function getOperationTagKey(operation: {
  tags: string[];
}): string;
/**
 * Whether an operation belongs to the given tag bucket.
 *
 * Both sides are normalised through {@link getTagKey}, so the comparison is
 * correct regardless of how `tagKey` was spelled or cased by the caller. An
 * absent (`undefined`) `tagKey` matches every operation (the "no tag filter"
 * case); an empty/whitespace `tagKey` is normalised to the {@link DefaultTag}
 * bucket like any other tag.
 *
 * Prefer this over hand-rolling `operation.tags[0] === tagKey`: a raw tag
 * compared against a canonical key silently fails for multi-word/acronym tags.
 */
declare function isOperationInTagBucket(operation: {
  tags: string[];
}, tagKey?: string): boolean;
//#endregion
//#region src/utils/tsconfig.d.ts
declare function isSyntheticDefaultImportsAllow(config?: Tsconfig): boolean;
declare function getImportExtension(fileExtension: string, tsconfig?: Tsconfig): string;
//#endregion
//#region src/writers/file.d.ts
/**
 * Write generated code to a file, stripping trailing whitespace from each line.
 *
 * Template literals in code generators can produce lines with only whitespace
 * when conditional expressions evaluate to empty strings. This function
 * ensures the output is always clean regardless of generator implementation.
 */
declare function writeGeneratedFile(filePath: string, content: string): Promise<void>;
//#endregion
//#region src/writers/schema-tag-mapper.d.ts
declare const SHARED_DIR = ".";
declare function buildSchemaTagMap(operations: ReadonlyArray<Pick<GeneratorOperation, 'imports' | 'tags'>>, schemas: GeneratorSchema[]): Map<string, string>;
//#endregion
//#region src/writers/schemas.d.ts
/**
 * Split schemas into regular and operation types.
 */
declare function splitSchemasByType(schemas: GeneratorSchema[]): {
  regularSchemas: GeneratorSchema[];
  operationSchemas: GeneratorSchema[];
};
/**
 * Fix imports in operation schemas that reference regular schemas.
 */
declare function fixCrossDirectoryImports(operationSchemas: GeneratorSchema[], regularSchemaNames: Set<string>, schemaPath: string, operationSchemaPath: string, namingConvention: NamingConvention, fileExtension: string, tsconfig?: Tsconfig): void;
/**
 * Fix imports in regular schemas that reference operation schemas.
 */
declare function fixRegularSchemaImports(regularSchemas: GeneratorSchema[], operationSchemaNames: Set<string>, schemaPath: string, operationSchemaPath: string, namingConvention: NamingConvention, fileExtension: string, tsconfig?: Tsconfig): void;
declare function writeModelInline(acc: string, model: string): string;
declare function writeModelsInline(array: GeneratorSchema[]): string;
interface WriteSchemaOptions {
  path: string;
  schema: GeneratorSchema;
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  tsconfig?: Tsconfig;
}
declare function writeSchema({
  path,
  schema,
  target,
  namingConvention,
  fileExtension,
  header,
  tsconfig
}: WriteSchemaOptions): Promise<void>;
interface WriteSchemasOptions {
  schemaPath: string;
  schemas: GeneratorSchema[];
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  indexFiles: boolean;
  tsconfig?: Tsconfig;
  factoryOutputDirectory?: string;
}
declare function writeSchemas({
  schemaPath,
  schemas,
  target,
  namingConvention,
  fileExtension,
  header,
  indexFiles,
  tsconfig,
  factoryOutputDirectory
}: WriteSchemasOptions): Promise<void>;
//#endregion
//#region src/writers/schemas-tags-split.d.ts
interface WriteSchemasTagsSplitOptions {
  schemaPath: string;
  schemas: GeneratorSchema[];
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  indexFiles: boolean;
  tsconfig?: Tsconfig;
  factoryOutputDirectory?: string;
  operations: ReadonlyArray<{
    imports: GeneratorImport[];
    tags: string[];
  }>;
}
declare function writeSchemasTagsSplit({
  schemaPath,
  schemas,
  target,
  namingConvention,
  fileExtension,
  header,
  indexFiles,
  tsconfig,
  factoryOutputDirectory,
  operations
}: WriteSchemasTagsSplitOptions): Promise<void>;
//#endregion
//#region src/writers/single-mode.d.ts
declare function writeSingleMode({
  builder,
  output,
  projectName,
  header,
  needSchema,
  generateSchemasInline,
  schemaTagMap
}: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/split-mode.d.ts
declare function writeSplitMode({
  builder,
  output,
  projectName,
  header,
  needSchema,
  generateSchemasInline,
  schemaTagMap
}: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/split-tags-mode.d.ts
declare function writeSplitTagsMode({
  builder,
  output,
  projectName,
  header,
  needSchema,
  generateSchemasInline,
  schemaTagMap
}: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/tags-mode.d.ts
declare function writeTagsMode({
  builder,
  output,
  projectName,
  header,
  needSchema,
  generateSchemasInline,
  schemaTagMap
}: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/tags-operations-mode.d.ts
declare function assertClientSupportsTagsOperations(client: OutputClient | OutputClientFunc, mode: string): void;
/**
 * `tags-operations` mode: one file per operation, nested under a per-tag
 * directory (`<dir>/<tag>/<operation><ext>`), each containing both the
 * operation's types and its runtime implementation. A per-tag barrel
 * (`<dir>/<tag>/index<ext>`) re-exports every operation file so existing
 * `import from '<build>/<tag>'`-style imports keep working.
 */
declare function writeTagsOperationsMode({
  builder,
  output,
  projectName,
  header,
  needSchema,
  generateSchemasInline,
  schemaTagMap
}: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/tags-operations-split-mode.d.ts
/**
 * `tags-operations-split` mode: two files per operation, nested under a
 * per-tag directory (`<dir>/<tag>/<operation><ext>` for the runtime
 * implementation, `<dir>/<tag>/<operation>.schemas<ext>` for the component
 * schemas that operation's implementation references), plus a per-tag
 * barrel (`<dir>/<tag>/index<ext>`) re-exporting both files for every
 * operation so existing `import from '<build>/<tag>'`-style imports keep
 * working.
 */
declare function writeTagsOperationsSplitMode({
  builder,
  output,
  projectName,
  header,
  needSchema,
  generateSchemasInline,
  schemaTagMap
}: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/target.d.ts
/**
 * `mockOutputsFull` keeps `function` and `handler` separate so the split
 * writers can strip factories from the MSW output before flattening.
 */
interface GeneratorTargetWithFull extends GeneratorTarget {
  mockOutputsFull: GeneratorMockOutputFull[];
}
declare function generateTarget(builder: WriteSpecBuilder, options: NormalizedOutputOptions): GeneratorTargetWithFull;
//#endregion
//#region src/writers/target-tags.d.ts
declare function generateTargetForTags(builder: WriteSpecBuilder, options: NormalizedOutputOptions): Record<string, GeneratorTargetWithFull>;
//#endregion
//#region src/writers/target-tags-operations.d.ts
/**
 * Resolves the transitive closure of component schemas an operation's
 * implementation references, so `tags-operations-split`'s per-operation
 * `.schemas` file includes not just the schemas named directly in the
 * operation's imports but everything those schemas reference too (e.g. a
 * `Pet` schema composed from `Dog` / `Cat` via `oneOf`). Mirrors the
 * traversal in `schema-tag-mapper.ts`'s `propagateTransitiveTags`.
 */
declare function resolveTransitiveSchemas(directNames: Iterable<string>, schemas: readonly GeneratorSchema[]): GeneratorSchema[];
/**
 * Builds the import statement(s) an operation file uses to pull in its
 * tag's shared helper block, or `''` when the helper has nothing to export.
 * A plain `import './tag.helpers'` would compile but never bring the
 * helper's `type`/`const` names into scope — callers must import them by
 * name, and type names must use `import type` while runtime values
 * (e.g. `withQueryKey`) need a real import so they survive to the emitted JS.
 */
declare function buildTagHelpersImport(helpers: GeneratorTagHelpers, helperImportPath: string, usedIn?: string): string;
/**
 * Builds one {@link GeneratorTagOperationsTarget} per tag for the
 * `tags-operations` / `tags-operations-split` modes. Unlike
 * `generateTargetForTags`, operations within a tag are NOT merged into a
 * single implementation string — each operation keeps its own
 * implementation so the caller can write it to its own file.
 *
 * The tag's header/footer are still computed once (from the merged
 * implementation of every operation in the tag, exactly as
 * `generateTargetForTags` does) so client builders that key their output on
 * tag-wide signals (e.g. "does any operation in this tag use a mutator")
 * produce the same boilerplate they would in `tags` mode. That boilerplate
 * becomes the tag's shared `helpers` block, written once per tag and
 * imported by every operation file in that tag instead of being duplicated.
 */
declare function generateTargetForTagsOperations(builder: WriteSpecBuilder, options: NormalizedOutputOptions): Record<string, GeneratorTagOperationsTarget>;
//#endregion
//#region src/writers/types.d.ts
declare function getOrvalGeneratedTypes(): string;
declare function getTypedResponse(): string;
//#endregion
export { AngularHttpResourceOptions, AngularObjectParamStrategy, AngularOptions, BODY_TYPE_NAME, BaseUrlFromConstant, BaseUrlFromSpec, BaseUrlRuntime, BoundAliasInfo, ClientBuilder, ClientDependenciesBuilder, ClientExtraFilesBuilder, ClientFileBuilder, ClientFooterBuilder, ClientGeneratorsBuilder, ClientHeaderBuilder, ClientMockBuilder, ClientMockGeneratorBuilder, ClientMockGeneratorImplementation, ClientTitleBuilder, CommonMockOptions, Config, ConfigExternal, ConfigFn, ContentTypeFilter, ContextSpec, DeepNonNullable, DefaultTag, DynamicAnchorIndexEntry, DynamicScopeEntry, EffectOptions, EnumGeneration, ErrorWithTag, FactoryMethodsMode, FactoryMethodsOptions, FakerMockOptions, FetchOptions, FinalizeMockImplementationOptions, FormDataArrayHandling, FormDataContext, FormDataType, GenerateMockImports, GenerateVerbOptionsParams, GenerateVerbsOptionsParams, GeneratorApiBuilder, GeneratorApiOperations, GeneratorApiResponse, GeneratorClient, GeneratorClientExtra, GeneratorClientFooter, GeneratorClientHeader, GeneratorClientImports, GeneratorClientTitle, GeneratorClients, GeneratorDependency, GeneratorImport, GeneratorMockOutput, GeneratorMockOutputFull, GeneratorMutator, GeneratorMutatorParsingInfo, GeneratorOperation, GeneratorOperationTarget, GeneratorOperations, GeneratorOptions, GeneratorSchema, GeneratorTagHelpers, GeneratorTagOperationsTarget, GeneratorTarget, GeneratorTargetFull, GeneratorTargetWithFull, GeneratorVerbOptions, GeneratorVerbsOptions, GetterBody, GetterParam, GetterParameters, GetterParams, GetterProp, GetterPropType, GetterProps, GetterQueryParam, GetterResponse, GlobalMockOptions, GlobalOptions, HeaderResult, HonoHandlerStrategy, HonoOptions, Hook, HookCommand, HookFunction, HookOption, HooksOptions, ImportOpenApi, InputFiltersOptions, InputOptions, InputTransformerFn, InvalidateTarget, InvalidateTargetParam, JsDocOptions, LogLevel, LogLevels, LogOptions, LogType, Logger, LoggerOptions, McpOptions, McpServerOptions, MockData, MockDataArray, MockDataArrayFn, MockDataObject, MockDataObjectFn, MockOptions, MockProperties, MockPropertiesObject, MockPropertiesObjectFn, MswMockOptions, MutationInvalidatesConfig, MutationInvalidatesRule, Mutator, MutatorObject, NAMED_COMPONENT_SECTIONS, NamingConvention, NormalizedAngularOptions, NormalizedConfig, NormalizedEffectOptions, NormalizedFactoryMethodsOptions, NormalizedFetchOptions, NormalizedFormDataType, NormalizedHonoOptions, NormalizedHookCommand, NormalizedHookOptions, NormalizedInputOptions, NormalizedJsDocOptions, NormalizedMcpOptions, NormalizedMcpServerOptions, NormalizedMocksConfig, NormalizedMutator, NormalizedOperationOptions, NormalizedOperationZodOptions, NormalizedOptions, NormalizedOutputOptions, NormalizedOverrideOutput, NormalizedParamsSerializerOptions, NormalizedQueryOptions, NormalizedSchemaOptions, NormalizedZodOptions, OpenApiComponentsObject, OpenApiDocument, OpenApiDynamicReferenceObject, OpenApiEncodingObject, OpenApiExampleObject, OpenApiInfoObject, OpenApiMediaTypeObject, OpenApiOperationObject, OpenApiParameterObject, OpenApiPathItemObject, OpenApiPathsObject, OpenApiReferenceObject, OpenApiRequestBodyObject, OpenApiResponseObject, OpenApiResponsesObject, OpenApiSchemaObject, OpenApiSchemaObjectType, OpenApiSchemasObject, OpenApiServerObject, OperationOptions, OperationZodOptions, Options, OptionsExport, OptionsFn, OutputClient, OutputClientFunc, OutputDocsOptions, OutputHttpClient, OutputMockType, OutputMocksConfig, OutputMocksOption, OutputMode, OutputOptions, OverrideInput, OverrideMockOptions, OverrideOutput, OverrideOutputContentType, PackageJson, ParamsSerializerOptions, PreferredContentType, PropertySortOrder, QueryOptions, ReadonlyRequestBodiesMode, RefComponentSuffix, RefInfo, ResReqTypesValue, ResolverValue, ResponseTypeCategory, SHARED_DIR, ScalarValue, SchemaGenerationType, SchemaOptionLike, SchemaOptions, SchemaType, SharedTypeDeclaration, StrictMockSchemaKind, SupportedFormatter, SwrOptions, TEMPLATE_TAG_REGEX, TsConfigModule, TsConfigModuleResolution, TsConfigTarget, Tsconfig, URL_REGEX, VERBS_WITH_BODY, Verbs, WriteModeProps, WriteSpecBuilder, ZodCoerceType, ZodDateTimeOptions, ZodOptions, ZodTimeOptions, ZodVariantOption, ZodVersionOption, addDependency, assertClientSupportsTagsOperations, asyncReduce, buildAngularParamsFilterExpression, buildDynamicScope, buildInlineDynamicScope, buildSchemaTagMap, buildTagHelpersImport, camel, camelPathParamName, collectReferencedComponents, combineSchemas, compareVersions, conventionName, count, createDebugger, createLogger, createSuccessMessage, createTypeAliasIfNeeded, dedupeUnionType, dynamicAnchorToParamName, dynamicAnchorsToUniqueParamNames, dynamicImport, escape, escapeRegExp, extractBoundAliasInfo, filterByContentType, filteredVerbs, fixCrossDirectoryImports, fixRegularSchemaImports, generalJSTypes, generalJSTypesWithArray, generateAxiosOptions, generateBodyMutatorConfig, generateBodyOptions, generateComponentDefinition, generateDependencyImports, generateFactory, generateFormDataAndUrlEncodedFunction, generateImports, generateModelInline, generateModelsInline, generateMutator, generateMutatorConfig, generateMutatorImports, generateMutatorRequestOptions, generateOptions, generateParameterDefinition, generateQueryParamsAxiosConfig, generateSchemasDefinition, generateTarget, generateTargetForTags, generateTargetForTagsOperations, generateVerbImports, generateVerbOptions, generateVerbsOptions, getAngularFilteredParamsCallExpression, getAngularFilteredParamsExpression, getAngularFilteredParamsHelperBody, getAngularObjectParamStrategies, getArray, getBaseUrlRuntimeImports, getBodiesByContentType, getBody, getCombinedEnumValue, getDefaultContentType, getDynamicAnchorIndex, getDynamicAnchorName, getEnum, getEnumDescriptions, getEnumImplementation, getEnumNames, getEnumUnionFromSchema, getExtension, getFileInfo, getFormDataFieldFileType, getFullRoute, getImportExtension, getIsBodyVerb, getKey, getMockFileExtensionByTypeName, getNumberWord, getObject, getOperationId, getOperationTagKey, getOrvalGeneratedTypes, getParameters, getParams, getParamsInPath, getPropertyAccessor, getPropertySafe, getProps, getQueryParams, getRefInfo, getResReqTypes, getResponse, getResponseTypeCategory, getRoute, getRouteAsArray, getScalar, getSchemasImportPath, getSuccessResponseType, getTagKey, getTypedResponse, getWarningCount, isBinaryContentType, isBinaryScalarSchema, isBoolean, isComponentRef, isDirectory, isDynamicReference, isFakerMock, isFunction, isModule, isMswMock, isNullish, isNumber, isNumeric, isObject, isOperationInTagBucket, isReference, isSchema, isString, isStringLike, isSyntheticDefaultImportsAllow, isUrl, isVerb, isVerbose, jsDoc, jsStringEscape, jsStringLiteralEscape, kebab, keyValuePairsToJsDoc, log, logError, logVerbose, logWarning, makeRouteSafe, mergeDeep, mismatchArgsMessage, pascal, removeFilesAndEmptyFolders, resetWarnings, resolveDiscriminators, resolveDynamicRef, resolveExampleRefs, resolveInstalledVersion, resolveInstalledVersions, resolveObject, resolveRef, resolveTransitiveSchemas, resolveValue, sanitize, sanitizePathParamName, setVerbose, snake, sortByPriority, splitSchemasByType, startMessage, stringify, toColonRoutePath, toObjectString, path_d_exports as upath, upper, wrapRouteParameters, writeGeneratedFile, writeModelInline, writeModelsInline, writeSchema, writeSchemas, writeSchemasTagsSplit, writeSingleMode, writeSplitMode, writeSplitTagsMode, writeTagsMode, writeTagsOperationsMode, writeTagsOperationsSplitMode };
//# sourceMappingURL=index.d.mts.map