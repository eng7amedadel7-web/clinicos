import { ClientBuilder, ClientGeneratorsBuilder, ClientHeaderBuilder, GeneratorDependency, GeneratorOptions, GeneratorVerbOptions } from "@orval/core";

//#region src/index.d.ts
/** Returns the list of generator dependencies required by the fetch client (e.g. zod). */
declare const getFetchDependencies: () => GeneratorDependency[];
/**
 * Generates the URL helper function and the fetch request function for a single
 * OpenAPI operation. Handles query-param serialization (explode, arrayFormat,
 * paramsSerializer), request body encoding, response parsing, and optional
 * runtime Zod validation.
 */
declare const generateRequestFunction: ({
  queryParams,
  headers,
  operationName,
  typeName,
  response,
  mutator,
  body,
  props,
  verb,
  fetchReviver,
  formData,
  formUrlEncoded,
  override,
  doc,
  paramsSerializer
}: GeneratorVerbOptions, {
  route: _route,
  context,
  pathRoute
}: GeneratorOptions) => string;
/**
 * Derives the TypeScript response type name for a fetch operation.
 * Returns the operation-scoped name when `includeHttpResponseReturnType` is
 * enabled, otherwise falls back to the success response definition name.
 */
declare const fetchResponseTypeName: (includeHttpResponseReturnType: boolean | undefined, definitionSuccessResponse: string, typeName: string) => string;
/** Builds the full fetch client output (imports + implementation) for one verb. */
declare const generateClient: ClientBuilder;
/** Emits HTTP status-code union types at the top of the generated file when they are needed. */
declare const generateFetchHeader: ClientHeaderBuilder;
/** Returns the fetch client builder factory used by orval's plugin system. */
declare const builder: () => () => ClientGeneratorsBuilder;
//#endregion
export { builder, builder as default, fetchResponseTypeName, generateClient, generateFetchHeader, generateRequestFunction, getFetchDependencies };
//# sourceMappingURL=index.d.mts.map