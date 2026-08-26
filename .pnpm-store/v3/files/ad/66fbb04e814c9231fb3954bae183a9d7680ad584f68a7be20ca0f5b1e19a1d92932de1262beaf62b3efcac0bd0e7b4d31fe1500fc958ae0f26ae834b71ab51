import { ClientBuilder, ClientGeneratorsBuilder, ContextSpec, GeneratorDependency, OpenApiParameterObject, OpenApiReferenceObject, OpenApiSchemaObject } from "@orval/core";

//#region src/index.d.ts
declare const getEffectDependencies: () => GeneratorDependency[];
declare const predefinedEffectFormats: Set<string>;
interface EffectValidationSchemaDefinition {
  functions: [string, unknown][];
  consts: string[];
}
declare const generateEffectValidationSchemaDefinition: (schema: OpenApiSchemaObject | undefined, context: ContextSpec, name: string, strict: boolean, rules?: {
  required?: boolean;
  propertyOverrides?: Record<string, EffectValidationSchemaDefinition>;
  constNameRegistry?: Record<string, number>;
}) => EffectValidationSchemaDefinition;
interface ParseEffectOptions {
  /**
   * When emitting inside a Struct property, wrap optionals/defaults with
   * `S.optional` / `S.optionalWith` so they describe an optional field
   * rather than `T | undefined`.
   */
  asStructProperty?: boolean;
  brandName?: string;
}
/**
 * Parse the intermediate definition into Effect Schema source code.
 */
declare const parseEffectValidationSchemaDefinition: (input: EffectValidationSchemaDefinition, context: ContextSpec, strict: boolean, brandName?: string, exactOptional?: boolean) => {
  effect: string;
  consts: string;
};
declare const dereference: (schema: OpenApiSchemaObject | OpenApiReferenceObject, context: ContextSpec) => OpenApiSchemaObject;
declare const generateFormDataEffectSchema: (schema: OpenApiSchemaObject, context: ContextSpec, name: string, strict: boolean, encoding?: Record<string, {
  contentType?: string;
}>) => EffectValidationSchemaDefinition;
declare const parseParameters: ({
  data,
  context,
  operationName,
  strict,
  generate
}: {
  data: (OpenApiParameterObject | OpenApiReferenceObject)[] | undefined;
  context: ContextSpec;
  operationName: string;
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
}) => {
  headers: EffectValidationSchemaDefinition;
  queryParams: EffectValidationSchemaDefinition;
  params: EffectValidationSchemaDefinition;
};
declare const generateEffect: ClientBuilder;
declare const builder: () => () => ClientGeneratorsBuilder;
//#endregion
export { EffectValidationSchemaDefinition, ParseEffectOptions, builder, builder as default, dereference, generateEffect, generateEffectValidationSchemaDefinition, generateFormDataEffectSchema, getEffectDependencies, parseEffectValidationSchemaDefinition, parseParameters, predefinedEffectFormats };
//# sourceMappingURL=index.d.mts.map