import { GetterPropType, OutputClient, OutputHttpClient, Verbs, camel, compareVersions, generateFormDataAndUrlEncodedFunction, generateMutator, generateMutatorConfig, generateMutatorRequestOptions, generateOptions, generateVerbImports, getAngularFilteredParamsCallExpression, getAngularFilteredParamsHelperBody, getFullRoute, getRoute, getRouteAsArray, getSuccessResponseType, isObject, isOperationInTagBucket, isString, isSyntheticDefaultImportsAllow, jsDoc, logWarning, makeRouteSafe, mergeDeep, pascal, stringify, toObjectString } from "@orval/core";
import { generateFetchHeader, generateRequestFunction } from "@orval/fetch";
import nodePath from "node:path";
import { styleText } from "node:util";
import { omitBy } from "remeda";
//#region src/utils.ts
const normalizeQueryOptions = (queryOptions = {}, outputWorkspace) => {
	return {
		...queryOptions.usePrefetch ? { usePrefetch: true } : {},
		...queryOptions.useInvalidate ? { useInvalidate: true } : {},
		...queryOptions.useSetQueryData ? { useSetQueryData: true } : {},
		...queryOptions.useGetQueryData ? { useGetQueryData: true } : {},
		...queryOptions.useQuery === void 0 ? {} : { useQuery: queryOptions.useQuery },
		...queryOptions.useMutation === void 0 ? {} : { useMutation: queryOptions.useMutation },
		...queryOptions.useSuspenseQuery ? { useSuspenseQuery: true } : {},
		...queryOptions.useSuspenseInfiniteQuery ? { useSuspenseInfiniteQuery: true } : {},
		...queryOptions.useInfinite ? { useInfinite: true } : {},
		...queryOptions.useInfiniteQueryParam ? { useInfiniteQueryParam: queryOptions.useInfiniteQueryParam } : {},
		...queryOptions.options ? { options: queryOptions.options } : {},
		...queryOptions.queryKey ? { queryKey: normalizeMutator(outputWorkspace, queryOptions.queryKey) } : {},
		...queryOptions.queryOptions ? { queryOptions: normalizeMutator(outputWorkspace, queryOptions.queryOptions) } : {},
		...queryOptions.mutationOptions ? { mutationOptions: normalizeMutator(outputWorkspace, queryOptions.mutationOptions) } : {},
		...queryOptions.signal ? { signal: true } : {},
		...queryOptions.shouldExportMutatorHooks ? { shouldExportMutatorHooks: true } : {},
		...queryOptions.shouldExportQueryKey ? { shouldExportQueryKey: true } : {},
		...queryOptions.shouldFilterQueryKey ? { shouldFilterQueryKey: true } : {},
		...queryOptions.queryKeyFilter ? { queryKeyFilter: queryOptions.queryKeyFilter } : {},
		...queryOptions.shouldExportHttpClient ? { shouldExportHttpClient: true } : {},
		...queryOptions.shouldSplitQueryKey ? { shouldSplitQueryKey: true } : {},
		...queryOptions.useOperationIdAsQueryKey ? { useOperationIdAsQueryKey: true } : {}
	};
};
const normalizeMutator = (workspace, mutator) => {
	if (isObject(mutator)) {
		const m = mutator;
		if (!m.path) throw new Error(styleText("red", `Mutator need a path`));
		return {
			path: nodePath.resolve(workspace, m.path),
			name: m.name,
			default: m.default ?? !m.name,
			alias: m.alias,
			external: m.external,
			extension: m.extension
		};
	}
	if (isString(mutator)) return {
		path: nodePath.resolve(workspace, mutator),
		default: true
	};
};
const getQueryTypeForFramework = (type) => {
	switch (type) {
		case "suspenseQuery": return "query";
		case "suspenseInfiniteQuery": return "infiniteQuery";
		default: return type;
	}
};
const getHasSignal = ({ overrideQuerySignal = false }) => overrideQuerySignal;
//#endregion
//#region src/client.ts
const AXIOS_DEPENDENCIES = [{
	exports: [
		{
			name: "axios",
			default: true,
			values: true,
			syntheticDefaultImport: true
		},
		{ name: "AxiosRequestConfig" },
		{ name: "AxiosResponse" },
		{ name: "AxiosError" }
	],
	dependency: "axios"
}];
const ANGULAR_HTTP_DEPENDENCIES = [
	{
		exports: [
			{
				name: "HttpClient",
				values: true
			},
			{
				name: "HttpHeaders",
				values: true
			},
			{
				name: "HttpParams",
				values: true
			},
			{ name: "HttpContext" }
		],
		dependency: "@angular/common/http"
	},
	{
		exports: [{
			name: "lastValueFrom",
			values: true
		}, {
			name: "fromEvent",
			values: true
		}],
		dependency: "rxjs"
	},
	{
		exports: [{
			name: "takeUntil",
			values: true
		}, {
			name: "map",
			values: true
		}],
		dependency: "rxjs/operators"
	}
];
const generateAngularHttpRequestFunction = ({ headers, queryParams, operationName, response, mutator, body, props, verb, formData, formUrlEncoded, override }, { route: _route, context }) => {
	let route = _route;
	if (context.output.urlEncodeParameters) route = makeRouteSafe(route);
	const isRequestOptions = override.requestOptions !== false;
	const isFormData = !override.formData.disabled;
	const isFormUrlEncoded = override.formUrlEncoded !== false;
	const hasSignal = getHasSignal({ overrideQuerySignal: override.query.signal });
	const hasSignalParam = props.some((prop) => prop.name === "signal");
	const bodyForm = generateFormDataAndUrlEncodedFunction({
		formData,
		formUrlEncoded,
		body,
		isFormData,
		isFormUrlEncoded
	});
	if (mutator) {
		const isExactOptionalPropertyTypes = !!context.output.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;
		const mutatorConfig = generateMutatorConfig({
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
			isAngular: context.output.httpClient === OutputHttpClient.ANGULAR
		});
		const requestOptions = isRequestOptions ? generateMutatorRequestOptions(override.requestOptions, mutator.hasSecondArg) : "";
		const propsImplementation = toObjectString(props, "implementation");
		return `${override.query.shouldExportHttpClient ? "export " : ""}const ${operationName} = (\n    ${propsImplementation}\n ${isRequestOptions && mutator.hasSecondArg ? `options${context.output.optionsParamRequired ? "" : "?"}: SecondParameter<typeof ${mutator.name}>,` : ""} ${getSignalDefinition({
			hasSignal,
			hasSignalParam
		})}) => {
      ${bodyForm}
      return ${mutator.name}<${response.definition.success || "unknown"}>(
      ${mutatorConfig},
      ${requestOptions});
    }
  `;
	}
	const queryProps = toObjectString(props, "implementation").replace(/,\s*$/, "");
	const dataType = response.definition.success || "unknown";
	const hasQueryParams = queryParams?.schema.name;
	const filteredParamsExpression = getAngularFilteredParamsCallExpression("params", queryParams?.requiredNullableKeys);
	const urlConstruction = hasQueryParams ? `const httpParams = params ? new HttpParams({ fromObject: ${filteredParamsExpression} }) : undefined;
    const url = \`${route}\`;` : `const url = \`${route}\`;`;
	const httpOptions = [];
	if (hasQueryParams) httpOptions.push("params: httpParams");
	if (headers) httpOptions.push("headers: new HttpHeaders(headers)");
	const successResponseType = getSuccessResponseType(response);
	const responseTypeOption = successResponseType ? `'${successResponseType}'` : void 0;
	if (responseTypeOption) httpOptions.push(`responseType: ${responseTypeOption}`);
	const optionsStr = httpOptions.length > 0 ? `, { ${httpOptions.join(", ")} }` : "";
	let httpCall;
	const httpGeneric = responseTypeOption ? "" : `<${dataType}>`;
	const bodyArg = isFormData && body.formData ? "formData" : isFormUrlEncoded && body.formUrlEncoded ? "formUrlEncoded" : body.definition ? toObjectString([body], "implementation").replace(/,\s*$/, "") : "";
	switch (verb) {
		case "get":
		case "head":
			httpCall = `http.${verb}${httpGeneric}(url${optionsStr})`;
			break;
		case "delete":
			httpCall = bodyArg ? `http.${verb}${httpGeneric}(url, { ${httpOptions.length > 0 ? httpOptions.join(", ") + ", " : ""}body: ${bodyArg} })` : `http.${verb}${httpGeneric}(url${optionsStr})`;
			break;
		default:
			httpCall = `http.${verb}${httpGeneric}(url, ${bodyArg || "undefined"}${optionsStr})`;
			break;
	}
	const responseType = response.definition.success;
	const isPrimitiveType = [
		"string",
		"number",
		"boolean",
		"void",
		"unknown"
	].includes(responseType);
	const hasSchema = response.imports.some((imp) => imp.name === responseType);
	const isZodOutput = isObject(context.output.schemas) && context.output.schemas.type === "zod";
	if (override.query.runtimeValidation && isZodOutput && !isPrimitiveType && hasSchema) httpCall = `${httpCall}.pipe(map(data => ${responseType === "Error" ? "ErrorSchema" : responseType}.parse(data)))`;
	const additionalParams = [queryProps, hasSignal ? "options?: { signal?: AbortSignal | null }" : ""].filter(Boolean).join(", ");
	return `${override.query.shouldExportHttpClient ? "export " : ""}const ${operationName} = (
    http: HttpClient${additionalParams ? `,\n    ${additionalParams}` : ""}
  ): Promise<${dataType}> => {
    ${bodyForm}
    ${urlConstruction}
    const request$ = ${httpCall};
    if (options?.signal) {
      return lastValueFrom(request$.pipe(takeUntil(fromEvent(options.signal, 'abort'))));
    }
    return lastValueFrom(request$);
  }
`;
};
const generateAxiosRequestFunction = ({ headers, queryParams, operationName, response, mutator, body, props: _props, verb, formData, formUrlEncoded, override, paramsSerializer }, { route: _route, context }, adapter) => {
	const props = adapter.transformProps(_props);
	let route = _route;
	if (context.output.urlEncodeParameters) route = makeRouteSafe(route);
	const unrefStatements = adapter.getRequestUnrefStatements(props);
	const isRequestOptions = override.requestOptions !== false;
	const isFormData = !override.formData.disabled;
	const isFormUrlEncoded = override.formUrlEncoded !== false;
	const hasSignal = getHasSignal({ overrideQuerySignal: override.query.signal });
	const hasSignalParam = _props.some((prop) => prop.name === "signal");
	const isExactOptionalPropertyTypes = !!context.output.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;
	const bodyForm = generateFormDataAndUrlEncodedFunction({
		formData,
		formUrlEncoded,
		body,
		isFormData,
		isFormUrlEncoded
	});
	if (mutator) {
		const mutatorConfig = generateMutatorConfig({
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
			isExactOptionalPropertyTypes
		});
		const bodyDefinition = body.definition.replace("[]", String.raw`\[\]`);
		const propsImplementation = mutator.bodyTypeName && body.definition ? toObjectString(props, "implementation").replace(new RegExp(String.raw`(\w*):\s?${bodyDefinition}`), `$1: ${mutator.bodyTypeName}<${body.definition}>`) : toObjectString(props, "implementation");
		const requestOptions = isRequestOptions ? generateMutatorRequestOptions(override.requestOptions, mutator.hasSecondArg) : "";
		if (mutator.isHook) {
			const callback = `(\n    ${propsImplementation}\n ${isRequestOptions && mutator.hasSecondArg ? `options${context.output.optionsParamRequired ? "" : "?"}: SecondParameter<ReturnType<typeof ${mutator.name}>>,` : ""}${getSignalDefinition({
				hasSignal,
				hasSignalParam
			})}) => {
        ${unrefStatements}
        ${bodyForm}
        return ${operationName}(
          ${mutatorConfig},
          ${requestOptions});
        }`;
			return `${override.query.shouldExportMutatorHooks ? "export " : ""}const use${pascal(operationName)}Hook = () => {
        const ${operationName} = ${mutator.name}<${response.definition.success || "unknown"}>();

        return ${adapter.wrapHookMutatorCallback(callback, operationName)}
      }
    `;
		}
		return `${override.query.shouldExportHttpClient ? "export " : ""}const ${operationName} = (\n    ${propsImplementation}\n ${isRequestOptions && mutator.hasSecondArg ? `options${context.output.optionsParamRequired ? "" : "?"}: SecondParameter<typeof ${mutator.name}>,` : ""}${getSignalDefinition({
			hasSignal,
			hasSignalParam
		})}) => {
      ${unrefStatements}
      ${bodyForm}
      return ${mutator.name}<${response.definition.success || "unknown"}>(
      ${mutatorConfig},
      ${requestOptions});
    }
  `;
	}
	const isSyntheticDefaultImportsAllowed = isSyntheticDefaultImportsAllow(context.output.tsconfig);
	const options = generateOptions({
		route,
		body,
		headers,
		queryParams,
		response,
		verb,
		requestOptions: override.requestOptions,
		isFormData,
		isFormUrlEncoded,
		paramsSerializer,
		paramsSerializerOptions: override.paramsSerializerOptions,
		isExactOptionalPropertyTypes,
		hasSignal,
		hasSignalParam
	});
	const optionsArgs = generateRequestOptionsArguments({
		isRequestOptions,
		hasSignal,
		hasSignalParam
	});
	const queryProps = toObjectString(props, "implementation");
	return `${override.query.shouldExportHttpClient ? "export " : ""}const ${operationName} = (\n    ${queryProps} ${optionsArgs} ): Promise<AxiosResponse<${response.definition.success || "unknown"}>> => {
    ${unrefStatements}
    ${bodyForm}
    return axios${isSyntheticDefaultImportsAllowed ? "" : ".default"}.${verb}(${options});
  }
`;
};
const generateRequestOptionsArguments = ({ isRequestOptions, hasSignal, hasSignalParam = false }) => {
	if (isRequestOptions) return "options?: AxiosRequestConfig\n";
	return getSignalDefinition({
		hasSignal,
		hasSignalParam
	});
};
const getSignalDefinition = ({ hasSignal, hasSignalParam = false }) => {
	if (!hasSignal) return "";
	return `${hasSignalParam ? "querySignal" : "signal"}?: AbortSignal\n`;
};
const getQueryArgumentsRequestType = (httpClient, mutator, useRuntimeFetcher) => {
	if (!mutator) {
		if (httpClient === OutputHttpClient.AXIOS) return `axios?: AxiosRequestConfig`;
		if (httpClient === OutputHttpClient.FETCH && useRuntimeFetcher) return "fetch?: RequestInit, fetcher?: typeof globalThis.fetch";
		return "fetch?: RequestInit";
	}
	if (mutator.hasSecondArg && !mutator.isHook) return `request?: SecondParameter<typeof ${mutator.name}>`;
	if (mutator.hasSecondArg && mutator.isHook) return `request?: SecondParameter<ReturnType<typeof ${mutator.name}>>`;
	return "";
};
const getQueryOptions = ({ isRequestOptions, mutator, isExactOptionalPropertyTypes, hasSignal, httpClient, hasSignalParam = false, useRuntimeFetcher = false }) => {
	const signalVar = hasSignalParam ? "querySignal" : "signal";
	const signalProp = hasSignalParam ? `signal: ${signalVar}` : "signal";
	if (!mutator && isRequestOptions) {
		const options = httpClient === OutputHttpClient.AXIOS ? "axiosOptions" : "fetchOptions";
		const fetcherArg = httpClient === OutputHttpClient.FETCH && useRuntimeFetcher ? ", fetcherFn" : "";
		if (!hasSignal) return `${options}${fetcherArg}`;
		return `{ ${isExactOptionalPropertyTypes ? `...(${signalVar} ? { ${signalProp} } : {})` : signalProp}, ...${options} }${fetcherArg}`;
	}
	if (mutator?.hasSecondArg && httpClient === OutputHttpClient.ANGULAR) {
		if (!hasSignal) return "http";
		return `http, ${signalVar}`;
	}
	if (mutator?.hasSecondArg && isRequestOptions) {
		if (!hasSignal) return "requestOptions";
		return httpClient === OutputHttpClient.AXIOS || httpClient === OutputHttpClient.ANGULAR ? `requestOptions, ${signalVar}` : `{ ${signalProp}, ...requestOptions }`;
	}
	if (hasSignal) {
		if (httpClient === OutputHttpClient.AXIOS) return signalVar;
		if (httpClient === OutputHttpClient.ANGULAR && mutator) return signalVar;
		return `{ ${signalProp} }`;
	}
	return "";
};
const getHookOptions = ({ isRequestOptions, httpClient, mutator, useRuntimeFetcher = false }) => {
	if (!isRequestOptions) return "";
	let value = "const {query: queryOptions";
	if (!mutator) if (httpClient === OutputHttpClient.AXIOS) value += ", axios: axiosOptions";
	else if (httpClient === OutputHttpClient.FETCH && useRuntimeFetcher) value += ", fetch: fetchOptions, fetcher: fetcherFn";
	else value += ", fetch: fetchOptions";
	if (mutator?.hasSecondArg) value += ", request: requestOptions";
	value += "} = options ?? {};";
	return value;
};
const dedupeUnionTypes = (types) => {
	if (!types) return types;
	return [...new Set(types.split("|").map((t) => t.trim()).filter(Boolean))].join(" | ");
};
const getQueryErrorType = (operationName, response, httpClient, mutator, forceSuccessResponse) => {
	const errorsType = dedupeUnionTypes(response.definition.errors || "unknown");
	if (mutator) return mutator.hasErrorType ? `${mutator.default ? pascal(operationName) : ""}ErrorType<${errorsType}>` : errorsType;
	if (httpClient === OutputHttpClient.AXIOS) return `AxiosError<${errorsType}>`;
	if (forceSuccessResponse) return `globalThis.Error & { info?: ${errorsType}; status?: number }`;
	return errorsType;
};
const getHooksOptionImplementation = (isRequestOptions, httpClient, operationName, mutator, useRuntimeFetcher) => {
	const fetcherOption = httpClient === OutputHttpClient.FETCH && useRuntimeFetcher ? ", fetcher: fetcherFn" : "";
	const options = httpClient === OutputHttpClient.AXIOS ? ", axios: axiosOptions" : `, fetch: fetchOptions${fetcherOption}`;
	return isRequestOptions ? `const mutationKey = ['${operationName}'];
const {mutation: mutationOptions${mutator ? mutator.hasSecondArg ? ", request: requestOptions" : "" : options}} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }${mutator?.hasSecondArg ? ", request: undefined" : ""}${mutator ? "" : httpClient === OutputHttpClient.AXIOS ? ", axios: undefined" : ", fetch: undefined"}};` : "";
};
const getMutationRequestArgs = (isRequestOptions, httpClient, mutator, useRuntimeFetcher) => {
	const options = httpClient === OutputHttpClient.AXIOS ? "axiosOptions" : "fetchOptions";
	const fetcherArg = httpClient === OutputHttpClient.FETCH && useRuntimeFetcher ? ", fetcherFn" : "";
	if (mutator?.hasSecondArg && httpClient === OutputHttpClient.ANGULAR) return "http";
	return isRequestOptions ? mutator ? mutator.hasSecondArg ? "requestOptions" : "" : `${options}${fetcherArg}` : "";
};
const getQueryHeader = (params) => {
	if (params.output.httpClient === OutputHttpClient.FETCH) return generateFetchHeader(params);
	if (params.output.httpClient === OutputHttpClient.ANGULAR) return Object.values(params.verbOptions).filter((verbOption) => isOperationInTagBucket(verbOption, params.tag)).some((v) => v.queryParams) ? getAngularFilteredParamsHelperBody() : "";
	return "";
};
//#endregion
//#region src/dependencies.ts
const REACT_DEPENDENCIES = [{
	exports: [{
		name: "useCallback",
		values: true
	}],
	dependency: "react"
}];
const PARAMS_SERIALIZER_DEPENDENCIES = [{
	exports: [{
		name: "qs",
		default: true,
		values: true,
		syntheticDefaultImport: true
	}],
	dependency: "qs"
}];
const SVELTE_QUERY_DEPENDENCIES_V3 = [{
	exports: [
		{
			name: "useQuery",
			values: true
		},
		{
			name: "useInfiniteQuery",
			values: true
		},
		{
			name: "useMutation",
			values: true
		},
		{
			name: "useQueryClient",
			values: true
		},
		{ name: "UseQueryOptions" },
		{ name: "UseInfiniteQueryOptions" },
		{ name: "UseMutationOptions" },
		{ name: "QueryFunction" },
		{ name: "MutationFunction" },
		{ name: "UseQueryStoreResult" },
		{ name: "UseInfiniteQueryStoreResult" },
		{ name: "QueryKey" },
		{ name: "CreateMutationResult" },
		{ name: "InvalidateOptions" }
	],
	dependency: "@sveltestack/svelte-query"
}];
const SVELTE_QUERY_DEPENDENCIES = [{
	exports: [
		{
			name: "createQuery",
			values: true
		},
		{
			name: "createInfiniteQuery",
			values: true
		},
		{
			name: "createMutation",
			values: true
		},
		{
			name: "useQueryClient",
			values: true
		},
		{ name: "CreateQueryOptions" },
		{ name: "CreateInfiniteQueryOptions" },
		{ name: "MutationFunctionContext" },
		{ name: "CreateMutationOptions" },
		{ name: "QueryFunction" },
		{ name: "MutationFunction" },
		{ name: "CreateQueryResult" },
		{ name: "CreateInfiniteQueryResult" },
		{ name: "QueryKey" },
		{ name: "InfiniteData" },
		{ name: "CreateMutationResult" },
		{ name: "DataTag" },
		{ name: "QueryClient" },
		{ name: "InvalidateOptions" }
	],
	dependency: "@tanstack/svelte-query"
}];
const isSvelteQueryV3 = (packageJson) => {
	const hasSvelteQuery = packageJson?.dependencies?.["@sveltestack/svelte-query"] ?? packageJson?.devDependencies?.["@sveltestack/svelte-query"] ?? packageJson?.peerDependencies?.["@sveltestack/svelte-query"];
	const hasSvelteQueryV4 = packageJson?.dependencies?.["@tanstack/svelte-query"] ?? packageJson?.devDependencies?.["@tanstack/svelte-query"] ?? packageJson?.peerDependencies?.["@tanstack/svelte-query"];
	return !!hasSvelteQuery && !hasSvelteQueryV4;
};
const isSvelteQueryV6 = (packageJson) => {
	return isQueryV6(packageJson, "svelte-query");
};
const getSvelteQueryDependencies = (hasGlobalMutator, hasParamsSerializerOptions, packageJson, httpClient) => {
	const hasSvelteQueryV3 = isSvelteQueryV3(packageJson);
	return [
		...!hasGlobalMutator && httpClient === OutputHttpClient.AXIOS ? AXIOS_DEPENDENCIES : [],
		...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : [],
		...hasSvelteQueryV3 ? SVELTE_QUERY_DEPENDENCIES_V3 : SVELTE_QUERY_DEPENDENCIES
	];
};
const REACT_QUERY_DEPENDENCIES_V3 = [{
	exports: [
		{
			name: "useQuery",
			values: true
		},
		{
			name: "useInfiniteQuery",
			values: true
		},
		{
			name: "useMutation",
			values: true
		},
		{
			name: "useQueryClient",
			values: true
		},
		{ name: "UseQueryOptions" },
		{ name: "UseInfiniteQueryOptions" },
		{ name: "UseMutationOptions" },
		{ name: "QueryFunction" },
		{ name: "MutationFunction" },
		{ name: "UseQueryResult" },
		{ name: "UseInfiniteQueryResult" },
		{ name: "QueryKey" },
		{ name: "QueryClient" },
		{ name: "UseMutationResult" },
		{ name: "InvalidateOptions" }
	],
	dependency: "react-query"
}];
const REACT_QUERY_DEPENDENCIES = [{
	exports: [
		{
			name: "useQuery",
			values: true
		},
		{
			name: "useSuspenseQuery",
			values: true
		},
		{
			name: "useInfiniteQuery",
			values: true
		},
		{
			name: "useSuspenseInfiniteQuery",
			values: true
		},
		{
			name: "useMutation",
			values: true
		},
		{
			name: "useQueryClient",
			values: true
		},
		{ name: "UseQueryOptions" },
		{ name: "DefinedInitialDataOptions" },
		{ name: "UndefinedInitialDataOptions" },
		{ name: "UseSuspenseQueryOptions" },
		{ name: "UseInfiniteQueryOptions" },
		{ name: "UseSuspenseInfiniteQueryOptions" },
		{ name: "UseMutationOptions" },
		{ name: "QueryFunction" },
		{ name: "MutationFunction" },
		{ name: "MutationFunctionContext" },
		{ name: "UseQueryResult" },
		{ name: "DefinedUseQueryResult" },
		{ name: "UseSuspenseQueryResult" },
		{ name: "UseInfiniteQueryResult" },
		{ name: "DefinedUseInfiniteQueryResult" },
		{ name: "UseSuspenseInfiniteQueryResult" },
		{ name: "QueryKey" },
		{ name: "QueryClient" },
		{ name: "InfiniteData" },
		{ name: "UseMutationResult" },
		{ name: "DataTag" },
		{ name: "InvalidateOptions" }
	],
	dependency: "@tanstack/react-query"
}];
const getReactQueryDependencies = (hasGlobalMutator, hasParamsSerializerOptions, packageJson, httpClient, hasTagsMutator, override) => {
	const hasReactQuery = packageJson?.dependencies?.["react-query"] ?? packageJson?.devDependencies?.["react-query"] ?? packageJson?.peerDependencies?.["react-query"];
	const hasReactQueryV4 = packageJson?.dependencies?.["@tanstack/react-query"] ?? packageJson?.devDependencies?.["@tanstack/react-query"] ?? packageJson?.peerDependencies?.["@tanstack/react-query"];
	const queryVersion = override?.query.version;
	const useReactQueryV3 = queryVersion === void 0 ? hasReactQuery && !hasReactQueryV4 : queryVersion <= 3;
	return [
		...hasGlobalMutator || hasTagsMutator ? REACT_DEPENDENCIES : [],
		...!hasGlobalMutator && httpClient === OutputHttpClient.AXIOS ? AXIOS_DEPENDENCIES : [],
		...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : [],
		...useReactQueryV3 ? REACT_QUERY_DEPENDENCIES_V3 : REACT_QUERY_DEPENDENCIES
	];
};
const VUE_QUERY_DEPENDENCIES_V3 = [
	{
		exports: [
			{
				name: "useQuery",
				values: true
			},
			{
				name: "useInfiniteQuery",
				values: true
			},
			{
				name: "useMutation",
				values: true
			}
		],
		dependency: "vue-query"
	},
	{
		exports: [
			{ name: "UseQueryOptions" },
			{ name: "UseInfiniteQueryOptions" },
			{ name: "UseMutationOptions" },
			{ name: "QueryFunction" },
			{ name: "MutationFunction" },
			{ name: "UseQueryResult" },
			{ name: "UseInfiniteQueryResult" },
			{ name: "QueryKey" },
			{ name: "UseMutationReturnType" },
			{ name: "InvalidateOptions" }
		],
		dependency: "vue-query/types"
	},
	{
		exports: [{
			name: "unref",
			values: true
		}, {
			name: "computed",
			values: true
		}],
		dependency: "vue"
	},
	{
		exports: [{ name: "UseQueryReturnType" }],
		dependency: "vue-query/lib/vue/useBaseQuery"
	}
];
const VUE_QUERY_DEPENDENCIES = [{
	exports: [
		{
			name: "useQuery",
			values: true
		},
		{
			name: "useInfiniteQuery",
			values: true
		},
		{
			name: "useMutation",
			values: true
		},
		{
			name: "useQueryClient",
			values: true
		},
		{ name: "UseQueryOptions" },
		{ name: "UseInfiniteQueryOptions" },
		{ name: "UseMutationOptions" },
		{ name: "QueryFunction" },
		{ name: "MutationFunction" },
		{ name: "MutationFunctionContext" },
		{ name: "QueryKey" },
		{ name: "UseQueryReturnType" },
		{ name: "UseInfiniteQueryReturnType" },
		{ name: "InfiniteData" },
		{ name: "UseMutationReturnType" },
		{ name: "DataTag" },
		{ name: "QueryClient" },
		{ name: "InvalidateOptions" }
	],
	dependency: "@tanstack/vue-query"
}, {
	exports: [
		{
			name: "computed",
			values: true
		},
		{
			name: "unref",
			values: true
		},
		{
			name: "toValue",
			values: true
		},
		{ name: "MaybeRef" },
		{ name: "MaybeRefOrGetter" }
	],
	dependency: "vue"
}];
const getSolidQueryImports = (prefix, hasRenamedOptionsTypes) => {
	const capitalized = prefix === "use" ? "Use" : "Create";
	const queryOptionsTypeName = hasRenamedOptionsTypes ? "QueryOptions" : "SolidQueryOptions";
	const infiniteQueryOptionsTypeName = hasRenamedOptionsTypes ? "InfiniteQueryOptions" : "SolidInfiniteQueryOptions";
	const mutationOptionsTypeName = hasRenamedOptionsTypes ? "MutationOptions" : "SolidMutationOptions";
	return [{
		exports: [
			{
				name: `${prefix}Query`,
				values: true
			},
			{
				name: `${prefix}InfiniteQuery`,
				values: true
			},
			{
				name: `${prefix}Mutation`,
				values: true
			},
			{ name: `${capitalized}QueryOptions` },
			{ name: `${capitalized}InfiniteQueryOptions` },
			{ name: queryOptionsTypeName },
			{ name: infiniteQueryOptionsTypeName },
			{ name: mutationOptionsTypeName },
			{ name: "QueryFunction" },
			{ name: "MutationFunction" },
			{ name: `${capitalized}QueryResult` },
			{ name: `${capitalized}InfiniteQueryResult` },
			{ name: "QueryKey" },
			{ name: "InfiniteData" },
			{ name: `${capitalized}MutationResult` },
			{ name: "DataTag" },
			{ name: "QueryClient" },
			{ name: "InvalidateOptions" }
		],
		dependency: "@tanstack/solid-query"
	}, {
		exports: [{
			name: "mergeProps",
			values: true
		}],
		dependency: "solid-js"
	}];
};
const ANGULAR_QUERY_DEPENDENCIES = [{
	exports: [
		{
			name: "injectQuery",
			values: true
		},
		{
			name: "injectInfiniteQuery",
			values: true
		},
		{
			name: "injectMutation",
			values: true
		},
		{ name: "InjectQueryOptions" },
		{ name: "InjectMutationOptions" },
		{ name: "CreateQueryOptions" },
		{ name: "CreateInfiniteQueryOptions" },
		{ name: "CreateMutationOptions" },
		{ name: "MutationFunctionContext" },
		{ name: "QueryFunction" },
		{ name: "MutationFunction" },
		{ name: "QueryKey" },
		{ name: "CreateQueryResult" },
		{ name: "CreateInfiniteQueryResult" },
		{ name: "InfiniteData" },
		{ name: "CreateMutationResult" },
		{ name: "DataTag" },
		{
			name: "QueryClient",
			values: true
		},
		{ name: "InvalidateOptions" }
	],
	dependency: "@tanstack/angular-query-experimental"
}, {
	exports: [
		{
			name: "inject",
			values: true
		},
		{ name: "Signal" },
		{
			name: "computed",
			values: true
		}
	],
	dependency: "@angular/core"
}];
const isVueQueryV3 = (packageJson) => {
	const hasVueQuery = packageJson?.dependencies?.["vue-query"] ?? packageJson?.devDependencies?.["vue-query"] ?? packageJson?.peerDependencies?.["vue-query"];
	const hasVueQueryV4 = packageJson?.dependencies?.["@tanstack/vue-query"] ?? packageJson?.devDependencies?.["@tanstack/vue-query"] ?? packageJson?.peerDependencies?.["@tanstack/vue-query"];
	return !!hasVueQuery && !hasVueQueryV4;
};
const getVueQueryDependencies = (hasGlobalMutator, hasParamsSerializerOptions, packageJson, httpClient) => {
	const hasVueQueryV3 = isVueQueryV3(packageJson);
	return [
		...!hasGlobalMutator && httpClient === OutputHttpClient.AXIOS ? AXIOS_DEPENDENCIES : [],
		...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : [],
		...hasVueQueryV3 ? VUE_QUERY_DEPENDENCIES_V3 : VUE_QUERY_DEPENDENCIES
	];
};
const getSolidQueryDependencies = (hasGlobalMutator, hasParamsSerializerOptions, packageJson, httpClient) => {
	return [
		...!hasGlobalMutator && httpClient === OutputHttpClient.AXIOS ? AXIOS_DEPENDENCIES : [],
		...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : [],
		...getSolidQueryImports(isSolidQueryWithUsePrefix(packageJson) ? "use" : "create", isSolidQueryWithRenamedOptionsTypes(packageJson))
	];
};
const getAngularQueryDependencies = (hasGlobalMutator, hasParamsSerializerOptions, packageJson, httpClient) => {
	const useAngularHttp = httpClient === OutputHttpClient.ANGULAR;
	const useAxios = !hasGlobalMutator && httpClient === OutputHttpClient.AXIOS;
	return [
		...useAngularHttp ? ANGULAR_HTTP_DEPENDENCIES : [],
		...useAxios ? AXIOS_DEPENDENCIES : [],
		...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : [],
		...ANGULAR_QUERY_DEPENDENCIES
	];
};
const isQueryV5 = (packageJson, queryClient) => {
	if (queryClient === "angular-query") return true;
	const version = getPackageByQueryClient(packageJson, queryClient);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.0.0");
};
const isQueryV6 = (packageJson, queryClient) => {
	const version = getPackageByQueryClient(packageJson, queryClient);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "6.0.0");
};
const isQueryV5WithDataTagError = (packageJson, queryClient) => {
	if (queryClient === "angular-query") return true;
	const version = getPackageByQueryClient(packageJson, queryClient);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.62.0");
};
const isQueryV5WithRequiredContextOnSuccess = (packageJson, queryClient) => {
	const version = getPackageByQueryClient(packageJson, queryClient);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.14.1");
};
const isQueryV5WithMutationContextOnSuccess = (packageJson, queryClient) => {
	const version = getPackageByQueryClient(packageJson, queryClient);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.89.0");
};
const isQueryV5WithInfiniteQueryOptionsError = (packageJson, queryClient) => {
	if (queryClient === "angular-query") return true;
	const version = getPackageByQueryClient(packageJson, queryClient);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.80.0");
};
const isSolidQueryWithUsePrefix = (packageJson) => {
	const version = getPackageByQueryClient(packageJson, "solid-query");
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.71.5");
};
/**
* Solid Query renamed its plain options interfaces in v5.100.6, dropping the
* `Solid` prefix:
*   - `SolidQueryOptions` → `QueryOptions`
*   - `SolidInfiniteQueryOptions` → `InfiniteQueryOptions`
*   - `SolidMutationOptions` → `MutationOptions`
*
* The Accessor wrappers `UseQueryOptions` / `UseInfiniteQueryOptions` /
* `UseMutationOptions` keep the same names but reference the renamed
* interfaces internally.
*
* https://github.com/TanStack/query/commit/<rename-commit>
*/
const isSolidQueryWithRenamedOptionsTypes = (packageJson) => {
	const version = getPackageByQueryClient(packageJson, "solid-query");
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "5.100.6");
};
const getPackageByQueryClient = (packageJson, queryClient) => {
	switch (queryClient) {
		case "react-query": {
			const pkgName = "@tanstack/react-query";
			return packageJson?.resolvedVersions?.[pkgName] ?? packageJson?.dependencies?.[pkgName] ?? packageJson?.devDependencies?.[pkgName] ?? packageJson?.peerDependencies?.[pkgName];
		}
		case "svelte-query": {
			const pkgName = "@tanstack/svelte-query";
			return packageJson?.resolvedVersions?.[pkgName] ?? packageJson?.dependencies?.[pkgName] ?? packageJson?.devDependencies?.[pkgName] ?? packageJson?.peerDependencies?.[pkgName];
		}
		case "vue-query": {
			const pkgName = "@tanstack/vue-query";
			return packageJson?.resolvedVersions?.[pkgName] ?? packageJson?.dependencies?.[pkgName] ?? packageJson?.devDependencies?.[pkgName] ?? packageJson?.peerDependencies?.[pkgName];
		}
		case "angular-query": {
			const pkgName = "@tanstack/angular-query-experimental";
			return packageJson?.resolvedVersions?.[pkgName] ?? packageJson?.dependencies?.[pkgName] ?? packageJson?.devDependencies?.[pkgName] ?? packageJson?.peerDependencies?.[pkgName];
		}
		case "solid-query": {
			const pkgName = "@tanstack/solid-query";
			return packageJson?.resolvedVersions?.[pkgName] ?? packageJson?.dependencies?.[pkgName] ?? packageJson?.devDependencies?.[pkgName] ?? packageJson?.peerDependencies?.[pkgName];
		}
	}
};
//#endregion
//#region src/query-options.ts
const QueryType = {
	INFINITE: "infiniteQuery",
	QUERY: "query",
	SUSPENSE_QUERY: "suspenseQuery",
	SUSPENSE_INFINITE: "suspenseInfiniteQuery"
};
const INFINITE_QUERY_PROPERTIES = new Set(["getNextPageParam", "getPreviousPageParam"]);
const generateQueryOptions = ({ params, options, type, adapter }) => {
	if (options === false) return "";
	const queryConfig = isObject(options) ? ` ${stringify(omitBy(options, (_, key) => type !== QueryType.INFINITE && type !== QueryType.SUSPENSE_INFINITE && INFINITE_QUERY_PROPERTIES.has(key)))?.slice(1, -1)}` : "";
	if (params.length === 0 || isSuspenseQuery(type)) {
		if (options) return `${queryConfig} ...queryOptions`;
		return "...queryOptions";
	}
	return `${adapter ? adapter.generateEnabledOption(params, options) : !isObject(options) || !Object.hasOwn(options, "enabled") ? `enabled: ${params.map(({ name }) => `${name} != null`).join(" && ")},` : ""}${queryConfig} ...queryOptions`;
};
const isSuspenseQuery = (type) => {
	return [QueryType.SUSPENSE_INFINITE, QueryType.SUSPENSE_QUERY].includes(type);
};
const getQueryOptionsDefinition = ({ operationName, mutator, definitions, type, prefix, hasQueryV5, hasQueryV5WithInfiniteQueryOptionsError, queryParams, queryParam, isReturnType, initialData, adapter }) => {
	const isMutatorHook = mutator?.isHook;
	const partialOptions = !isReturnType && hasQueryV5;
	if (type) {
		const funcReturnType = `Awaited<ReturnType<${isMutatorHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationName}`}>>`;
		const optionTypeInitialDataPostfix = initialData && !isSuspenseQuery(type) ? ` & Pick<
        ${pascal(initialData)}InitialDataOptions<
          ${funcReturnType},
          TError,
          ${funcReturnType}${hasQueryV5 && (type === QueryType.INFINITE || type === QueryType.SUSPENSE_INFINITE) && queryParam && queryParams ? `, QueryKey` : ""}
        > , 'initialData'
      >` : "";
		const optionsTypeName = isReturnType && adapter?.getOptionsReturnTypeName ? adapter.getOptionsReturnTypeName(type === QueryType.INFINITE || type === QueryType.SUSPENSE_INFINITE ? "infiniteQuery" : "query") : void 0;
		const optionType = optionsTypeName ? `${optionsTypeName}<${funcReturnType}, TError, TData${hasQueryV5 && (type === QueryType.INFINITE || type === QueryType.SUSPENSE_INFINITE) && queryParam && queryParams ? `, QueryKey, ${queryParams.schema.name}['${queryParam}']` : ""}>` : `${prefix}${pascal(type)}Options<${funcReturnType}, TError, TData${hasQueryV5 && (type === QueryType.INFINITE || type === QueryType.SUSPENSE_INFINITE) && queryParam && queryParams ? hasQueryV5WithInfiniteQueryOptionsError ? `, QueryKey, ${queryParams.schema.name}['${queryParam}']` : `, ${funcReturnType}, QueryKey, ${queryParams.schema.name}['${queryParam}']` : ""}>`;
		return `${partialOptions ? "Partial<" : ""}${optionType}${partialOptions ? ">" : ""}${optionTypeInitialDataPostfix}`;
	}
	const mutationOptionsTypeName = adapter?.getOptionsReturnTypeName ? adapter.getOptionsReturnTypeName("mutation") : void 0;
	return mutationOptionsTypeName ? `${mutationOptionsTypeName}<Awaited<ReturnType<${isMutatorHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationName}`}>>, TError,${definitions ? `{${definitions}}` : "void"}, TContext>` : `${prefix}MutationOptions<Awaited<ReturnType<${isMutatorHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationName}`}>>, TError,${definitions ? `{${definitions}}` : "void"}, TContext>`;
};
//#endregion
//#region src/frameworks/angular.ts
const createAngularAdapter = ({ hasQueryV5, hasQueryV5WithDataTagError, hasQueryV5WithInfiniteQueryOptionsError, hasQueryV5WithMutationContextOnSuccess, hasQueryV5WithRequiredContextOnSuccess }) => {
	const prefix = "Create";
	return {
		outputClient: OutputClient.ANGULAR_QUERY,
		hookPrefix: "inject",
		isAngularHttp: true,
		hasQueryV5,
		hasQueryV5WithDataTagError,
		hasQueryV5WithInfiniteQueryOptionsError,
		hasQueryV5WithMutationContextOnSuccess,
		hasQueryV5WithRequiredContextOnSuccess,
		getHookPropsDefinitions(props) {
			return toObjectString(props.map((prop) => {
				const getterType = prop.definition.replace(/^(\w+)(\??): (.+)$/, (_match, name, optional, type) => `${name}${optional}: ${type} | (() => ${type.replace(" | undefined", "")}${optional ? " | undefined" : ""})`);
				return {
					...prop,
					definition: getterType
				};
			}), "definition");
		},
		getHttpFunctionQueryProps(queryProperties, _httpClient, hasMutator) {
			if (!hasMutator) return queryProperties ? `http, ${queryProperties}` : "http";
			return queryProperties;
		},
		getInfiniteQueryHttpProps(props, queryParam, _httpClient, hasMutator) {
			let result = props.map((param) => {
				if (param.type === GetterPropType.NAMED_PATH_PARAMS) return param.destructured;
				return param.name === "params" ? `{...params, '${queryParam}': pageParam ?? params?.['${queryParam}']}` : param.name;
			}).join(",");
			if (!hasMutator) result = result ? `http, ${result}` : "http";
			return result;
		},
		getHttpFirstParam(mutator) {
			if (!mutator || mutator.hasSecondArg) return "http: HttpClient, ";
			return "";
		},
		getMutationHttpPrefix(mutator) {
			if (!mutator) return "http, ";
			return "";
		},
		getQueryReturnType({ type }) {
			if (type !== QueryType.INFINITE && type !== QueryType.SUSPENSE_INFINITE) return `CreateQueryResult<TData, TError>`;
			return `CreateInfiniteQueryResult<TData, TError>`;
		},
		getMutationReturnType({ dataType, variableType }) {
			return `: CreateMutationResult<
        Awaited<ReturnType<${dataType}>>,
        TError,
        ${variableType},
        TContext
      >`;
		},
		getQueryReturnStatement({ queryResultVarName }) {
			return `return ${queryResultVarName};`;
		},
		shouldAnnotateQueryKey() {
			return false;
		},
		generateQueryInit({ mutator }) {
			if (!mutator || mutator.hasSecondArg) return `const http = inject(HttpClient);`;
			return "";
		},
		generateQueryInvocationArgs({ props, queryOptionsFnName, isRequestOptions, mutator }) {
			return `() => {${props.length > 0 ? `
    // Resolve params if getter function (for signal reactivity)
    ${props.map((p) => `const _${p.name} = typeof ${p.name} === 'function' ? ${p.name}() : ${p.name};`).join("\n    ")}` : ""}
    // Resolve options if getter function (for signal reactivity)
    const _options = typeof ${isRequestOptions ? "options" : "queryOptions"} === 'function' ? ${isRequestOptions ? "options" : "queryOptions"}() : ${isRequestOptions ? "options" : "queryOptions"};
    return ${queryOptionsFnName}(${!mutator || mutator.hasSecondArg ? "http" : ""}${props.length > 0 ? `${!mutator || mutator.hasSecondArg ? ", " : ""}${props.map((p) => `_${p.name}`).join(", ")}` : ""}, _options);
  }`;
		},
		getOptionalQueryClientArgument() {
			return "";
		},
		getQueryOptionsDefinitionPrefix() {
			return prefix;
		},
		generateQueryArguments({ operationName, definitions, mutator, isRequestOptions, type, queryParams, queryParam, initialData, httpClient, forQueryOptions = false, hasInvalidation, useRuntimeFetcher }) {
			const definition = getQueryOptionsDefinition({
				operationName,
				mutator,
				definitions,
				type,
				prefix,
				hasQueryV5,
				hasQueryV5WithInfiniteQueryOptionsError,
				queryParams,
				queryParam,
				isReturnType: false,
				initialData
			});
			if (!isRequestOptions) return `${type ? "queryOptions" : "mutationOptions"}${initialData === "defined" ? "" : "?"}: ${definition}`;
			const requestType = getQueryArgumentsRequestType(httpClient, mutator, useRuntimeFetcher);
			const isQueryRequired = initialData === "defined";
			const optionsType = `{ ${type ? "query" : "mutation"}${isQueryRequired ? "" : "?"}:${definition}, ${!type && hasInvalidation ? "skipInvalidation?: boolean, " : ""}${requestType}}`;
			if (type !== void 0 && !forQueryOptions) return `options${isQueryRequired ? "" : "?"}: ${optionsType} | (() => ${optionsType})\n`;
			return `options${isQueryRequired ? "" : "?"}: ${optionsType}\n`;
		},
		generateMutationImplementation({ mutationOptionsFnName, hasInvalidation, isRequestOptions }) {
			return `${mutationOptionsFnName}(${hasInvalidation ? `queryClient, ` : ""}${isRequestOptions ? "options" : "mutationOptions"})`;
		},
		supportsMutationInvalidation() {
			return true;
		},
		generateMutationHookBody({ operationPrefix, mutationOptionsFnName, mutationOptionsVarName, isRequestOptions, mutator, hasInvalidation }) {
			if (!mutator || mutator.hasSecondArg) return `      const http = inject(HttpClient);${hasInvalidation ? "\n      const queryClient = inject(QueryClient);" : ""}
      const ${mutationOptionsVarName} = ${mutationOptionsFnName}(http${hasInvalidation ? ", queryClient" : ""}${isRequestOptions ? ", options" : ", mutationOptions"});

      return ${operationPrefix}Mutation(() => ${mutationOptionsVarName});`;
			return `      const ${mutationOptionsVarName} = ${`${mutationOptionsFnName}(${hasInvalidation ? `queryClient, ` : ""}${isRequestOptions ? "options" : "mutationOptions"})`};

      return ${operationPrefix}Mutation(() => ${mutationOptionsVarName});`;
		},
		getQueryType(type) {
			return getQueryTypeForFramework(type);
		},
		generateRequestFunction(verbOptions, options) {
			return generateAngularHttpRequestFunction(verbOptions, options);
		},
		generatePrefetch({ usePrefetch, type, useQuery, useInfinite, operationName, mutator, doc, queryProps, dataType, errorType, queryArguments, queryOptionsVarName, queryOptionsFnName, queryProperties, isRequestOptions }) {
			if (!(usePrefetch && (type === QueryType.QUERY || type === QueryType.INFINITE || type === QueryType.SUSPENSE_QUERY && !useQuery || type === QueryType.SUSPENSE_INFINITE && !useInfinite))) return "";
			const prefetchType = type === QueryType.QUERY || type === QueryType.SUSPENSE_QUERY ? "query" : "infinite-query";
			const prefetchFnName = camel(`prefetch-${prefetchType}`);
			return `${doc}export const ${camel(`prefetch-${operationName}-${prefetchType}`)} = async <TData = Awaited<ReturnType<${dataType}>>, TError = ${errorType}>(\n queryClient: QueryClient, ${!mutator || mutator.hasSecondArg ? "http: HttpClient, " : ""}${queryProps} ${queryArguments}\n  ): Promise<QueryClient> => {

  const ${queryOptionsVarName} = ${queryOptionsFnName}(${!mutator || mutator.hasSecondArg ? "http, " : ""}${queryProperties}${queryProperties ? "," : ""}${isRequestOptions ? "options" : "queryOptions"})

  if (${queryOptionsVarName}.enabled === false) {
    return queryClient;
  }

  await queryClient.${prefetchFnName}(${queryOptionsVarName});

  return queryClient;
}\n`;
		}
	};
};
//#endregion
//#region src/frameworks/react.ts
const createReactAdapter = ({ hasQueryV5, hasQueryV5WithDataTagError, hasQueryV5WithInfiniteQueryOptionsError, hasQueryV5WithMutationContextOnSuccess, hasQueryV5WithRequiredContextOnSuccess }) => ({
	outputClient: OutputClient.REACT_QUERY,
	hookPrefix: "use",
	hasQueryV5,
	hasQueryV5WithDataTagError,
	hasQueryV5WithInfiniteQueryOptionsError,
	hasQueryV5WithMutationContextOnSuccess,
	hasQueryV5WithRequiredContextOnSuccess,
	getQueryReturnType({ type, isInitialDataDefined }) {
		return ` ${isInitialDataDefined && !isSuspenseQuery(type) ? "Defined" : ""}Use${pascal(type)}Result<TData, TError> & { queryKey: ${hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey"} }`;
	},
	getMutationReturnType({ dataType, variableType }) {
		return `: UseMutationResult<
        Awaited<ReturnType<${dataType}>>,
        TError,
        ${variableType},
        TContext
      >`;
	},
	getQueryReturnStatement({ queryResultVarName, queryOptionsVarName }) {
		return `return withQueryKey(${queryResultVarName}, ${queryOptionsVarName}.queryKey);`;
	},
	shouldGenerateOverrideTypes() {
		return hasQueryV5;
	},
	generateMutationImplementation({ mutationOptionsFnName, hasInvalidation, isRequestOptions }) {
		return `${mutationOptionsFnName}(${hasInvalidation ? `queryClient ?? backupQueryClient, ` : ""}${isRequestOptions ? "options" : "mutationOptions"})`;
	},
	supportsMutationInvalidation() {
		return true;
	},
	generateMutationHookBody({ operationPrefix, mutationImplementation, hasInvalidation, optionalQueryClientArgument }) {
		return `      ${hasInvalidation ? `const backupQueryClient = useQueryClient();\n      ` : ""}return ${operationPrefix}Mutation(${mutationImplementation}${optionalQueryClientArgument ? `, queryClient` : ""});`;
	}
});
//#endregion
//#region src/frameworks/solid.ts
const createSolidAdapter = ({ hasQueryV5, hasQueryV5WithDataTagError, hasQueryV5WithInfiniteQueryOptionsError, hasQueryV5WithMutationContextOnSuccess, hasQueryV5WithRequiredContextOnSuccess, hasSolidQueryUsePrefix, hasSolidQueryRenamedOptionsTypes }) => ({
	outputClient: OutputClient.SOLID_QUERY,
	hookPrefix: hasSolidQueryUsePrefix ? "use" : "create",
	hasQueryV5,
	hasQueryV5WithDataTagError,
	hasQueryV5WithInfiniteQueryOptionsError,
	hasQueryV5WithMutationContextOnSuccess,
	hasQueryV5WithRequiredContextOnSuccess,
	getQueryOptionsDefinitionPrefix() {
		return hasSolidQueryUsePrefix ? "Use" : "Create";
	},
	getOptionsReturnTypeName(type) {
		if (type === "mutation") return hasSolidQueryRenamedOptionsTypes ? "MutationOptions" : "SolidMutationOptions";
		if (type === "infiniteQuery") return hasSolidQueryRenamedOptionsTypes ? "InfiniteQueryOptions" : "SolidInfiniteQueryOptions";
		return hasSolidQueryRenamedOptionsTypes ? "QueryOptions" : "SolidQueryOptions";
	},
	getQueryKeyPrefix() {
		return "";
	},
	shouldAnnotateQueryKey() {
		return false;
	},
	shouldCastQueryResult() {
		return false;
	},
	shouldCastQueryOptions() {
		return false;
	},
	getQueryReturnType({ type }) {
		const prefix = hasSolidQueryUsePrefix ? "Use" : "Create";
		const queryKeyType = hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey";
		if (type !== QueryType.INFINITE && type !== QueryType.SUSPENSE_INFINITE) return `${prefix}QueryResult<TData, TError> & { queryKey: ${queryKeyType} }`;
		return `${prefix}InfiniteQueryResult<TData, TError> & { queryKey: ${queryKeyType} }`;
	},
	getMutationReturnType({ dataType, variableType }) {
		return `: ${hasSolidQueryUsePrefix ? "Use" : "Create"}MutationResult<
        Awaited<ReturnType<${dataType}>>,
        TError,
        ${variableType},
        TContext
      >`;
	},
	getQueryReturnStatement({ queryResultVarName, queryOptionsVarName }) {
		return `return mergeProps(${queryResultVarName}, { queryKey: ${queryOptionsVarName}.queryKey }) as any;`;
	},
	generateQueryInvocationArgs({ queryOptionsFnName, queryProperties, isRequestOptions, optionalQueryClientArgument }) {
		const optionsArg = isRequestOptions ? "options" : "queryOptions";
		return `() => ${queryOptionsFnName}(${queryProperties ? `${queryProperties},${optionsArg}` : optionsArg})${optionalQueryClientArgument ? ", queryClient" : ""}`;
	},
	generateMutationImplementation({ mutationOptionsFnName, isRequestOptions }) {
		return `${mutationOptionsFnName}(${isRequestOptions ? "options" : "mutationOptions"})`;
	},
	supportsMutationInvalidation() {
		return false;
	},
	generateMutationOnSuccess() {
		return "";
	},
	generateMutationHookBody({ operationPrefix, mutationImplementation, optionalQueryClientArgument }) {
		return `      return ${operationPrefix}Mutation(() => ${mutationImplementation}${optionalQueryClientArgument ? `, queryClient` : ""});`;
	},
	getOptionalQueryClientArgument() {
		return ", queryClient?: () => QueryClient";
	}
});
//#endregion
//#region src/frameworks/svelte.ts
const createSvelteAdapter = ({ hasSvelteQueryV4, hasSvelteQueryV6, hasQueryV5, hasQueryV5WithDataTagError, hasQueryV5WithInfiniteQueryOptionsError, hasQueryV5WithMutationContextOnSuccess, hasQueryV5WithRequiredContextOnSuccess }) => {
	const prefix = hasSvelteQueryV4 ? "Create" : "Use";
	return {
		outputClient: OutputClient.SVELTE_QUERY,
		hookPrefix: hasSvelteQueryV4 ? "create" : "use",
		hasQueryV5,
		hasQueryV5WithDataTagError,
		hasQueryV5WithInfiniteQueryOptionsError,
		hasQueryV5WithMutationContextOnSuccess,
		hasQueryV5WithRequiredContextOnSuccess,
		getHookPropsDefinitions(props) {
			if (hasSvelteQueryV6) return toObjectString(props.map((p) => ({
				...p,
				definition: p.definition.replace(":", ": () => ")
			})), "definition");
			return toObjectString(props, "implementation");
		},
		getQueryReturnType({ type, isMutatorHook, operationName }) {
			if (!hasSvelteQueryV4) return `Use${pascal(type)}StoreResult<Awaited<ReturnType<${isMutatorHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationName}`}>>, TError, TData, QueryKey> & { queryKey: QueryKey }`;
			return `Create${pascal(type)}Result<TData, TError> & { queryKey: ${hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey"} }`;
		},
		getMutationReturnType({ dataType, variableType }) {
			return `: CreateMutationResult<
        Awaited<ReturnType<${dataType}>>,
        TError,
        ${variableType},
        TContext
      >`;
		},
		getQueryReturnStatement({ queryResultVarName, queryOptionsVarName }) {
			if (hasSvelteQueryV6) return `return ${queryResultVarName}`;
			if (hasSvelteQueryV4) return `${queryResultVarName}.queryKey = ${queryOptionsVarName}.queryKey;

  return ${queryResultVarName};`;
			return `return { ...${queryResultVarName}, queryKey: ${queryOptionsVarName}.queryKey };`;
		},
		generateQueryInit({ queryOptionsFnName, queryProperties, isRequestOptions }) {
			if (hasSvelteQueryV6) return "";
			return `const ${isRequestOptions ? "queryOptions" : "options"} = ${queryOptionsFnName}(${queryProperties}${queryProperties ? "," : ""}${isRequestOptions ? "options" : "queryOptions"})`;
		},
		generateQueryInvocationArgs({ props, queryOptionsFnName, isRequestOptions, queryOptionsVarName, optionalQueryClientArgument }) {
			if (hasSvelteQueryV6) return `() => ${queryOptionsFnName}(${toObjectString(props.map((p) => ({
				...p,
				name: p.default || !p.required ? `${p.name}?.()` : `${p.name}()`
			})), "name")}${isRequestOptions ? "options?.()" : "queryOptions?.()"})`;
			return `${queryOptionsVarName}${optionalQueryClientArgument ? ", queryClient" : ""}`;
		},
		getQueryInvocationSuffix() {
			return hasSvelteQueryV6 ? `, queryClient` : "";
		},
		getOptionalQueryClientArgument(hasInvalidation) {
			if (hasSvelteQueryV6) return `, queryClient?: () => QueryClient`;
			if (hasQueryV5 || hasInvalidation) return ", queryClient?: QueryClient";
			return "";
		},
		getQueryOptionsDefinitionPrefix() {
			return prefix;
		},
		generateQueryArguments({ operationName, definitions, mutator, isRequestOptions, type, queryParams, queryParam, initialData, httpClient, forQueryOptions = false, hasInvalidation, useRuntimeFetcher }) {
			const definition = getQueryOptionsDefinition({
				operationName,
				mutator,
				definitions,
				type,
				prefix,
				hasQueryV5,
				hasQueryV5WithInfiniteQueryOptionsError,
				queryParams,
				queryParam,
				isReturnType: false,
				initialData
			});
			if (!isRequestOptions) return `${type ? "queryOptions" : "mutationOptions"}${initialData === "defined" ? "" : "?"}: ${definition}`;
			const requestType = getQueryArgumentsRequestType(httpClient, mutator, useRuntimeFetcher);
			const isQueryRequired = initialData === "defined";
			const optionsType = `{ ${type ? "query" : "mutation"}${isQueryRequired ? "" : "?"}:${definition}, ${!type && hasInvalidation ? "skipInvalidation?: boolean, " : ""}${requestType}}`;
			return `options${isQueryRequired ? "" : "?"}: ${hasSvelteQueryV6 && !forQueryOptions ? "() => " : ""}${optionsType}\n`;
		},
		generateMutationImplementation({ mutationOptionsFnName, hasInvalidation, isRequestOptions }) {
			if (hasSvelteQueryV6) return `${mutationOptionsFnName}(${hasInvalidation ? `backupQueryClient, ` : ""}${isRequestOptions ? "options" : "mutationOptions"}?.())`;
			return `${mutationOptionsFnName}(${hasInvalidation ? `queryClient ?? backupQueryClient, ` : ""}${isRequestOptions ? "options" : "mutationOptions"})`;
		},
		supportsMutationInvalidation() {
			return true;
		},
		generateMutationHookBody({ operationPrefix, mutationImplementation, hasInvalidation, optionalQueryClientArgument }) {
			if (hasSvelteQueryV6) return `      ${hasInvalidation ? `const backupQueryClient = useQueryClient(${optionalQueryClientArgument ? "queryClient?.()" : ""});\n      ` : ""}return ${operationPrefix}Mutation(() => ({ ...${mutationImplementation} })${optionalQueryClientArgument ? `, queryClient` : ""});`;
			return `      ${hasInvalidation ? `const backupQueryClient = useQueryClient();\n      ` : ""}return ${operationPrefix}Mutation(${mutationImplementation});`;
		},
		getQueryType(type) {
			if (hasSvelteQueryV4) return getQueryTypeForFramework(type);
			return type;
		}
	};
};
//#endregion
//#region src/frameworks/vue.ts
const getVueReactivity = (hasQueryV5) => hasQueryV5 ? {
	wrapper: "MaybeRefOrGetter",
	resolve: "toValue"
} : {
	wrapper: "MaybeRef",
	resolve: "unref"
};
function vueWrapTypeWithMaybeRef(props, hasQueryV5) {
	const { wrapper } = getVueReactivity(hasQueryV5);
	return props.map((prop) => {
		const [paramName, paramType] = prop.implementation.split(":");
		if (!paramType) return prop;
		const name = prop.type === GetterPropType.NAMED_PATH_PARAMS ? prop.name : paramName;
		const [type, defaultValue] = paramType.split("=");
		return {
			...prop,
			implementation: `${name}: ${wrapper}<${type.trim()}>${defaultValue ? ` = ${defaultValue}` : ""}`
		};
	});
}
const vueUnRefParams = (props, hasQueryV5) => {
	const { resolve } = getVueReactivity(hasQueryV5);
	return props.map((prop) => {
		if (prop.type === GetterPropType.NAMED_PATH_PARAMS) return `const ${prop.destructured} = ${resolve}(${prop.name});`;
		return `${prop.name} = ${resolve}(${prop.name});`;
	}).join("\n");
};
const createVueAdapter = ({ hasVueQueryV4, hasQueryV5, hasQueryV5WithDataTagError, hasQueryV5WithInfiniteQueryOptionsError, hasQueryV5WithMutationContextOnSuccess, hasQueryV5WithRequiredContextOnSuccess }) => ({
	outputClient: OutputClient.VUE_QUERY,
	hookPrefix: "use",
	hasQueryV5,
	hasQueryV5WithDataTagError,
	hasQueryV5WithInfiniteQueryOptionsError,
	hasQueryV5WithMutationContextOnSuccess,
	hasQueryV5WithRequiredContextOnSuccess,
	transformProps(props) {
		return vueWrapTypeWithMaybeRef(props, hasQueryV5);
	},
	shouldDestructureNamedPathParams() {
		return false;
	},
	getHttpFunctionQueryProps(queryProperties, httpClient) {
		if (httpClient === OutputHttpClient.FETCH && queryProperties) {
			const { resolve } = getVueReactivity(hasQueryV5);
			return queryProperties.split(",").map((prop) => `${resolve}(${prop})`).join(",");
		}
		return queryProperties;
	},
	getInfiniteQueryHttpProps(props, queryParam, httpClient) {
		const { resolve } = getVueReactivity(hasQueryV5);
		return props.map((param) => {
			if (param.name === "params") return `{...${resolve}(params), '${queryParam}': pageParam ?? ${resolve}(params)?.['${queryParam}']}`;
			return httpClient === OutputHttpClient.FETCH ? `${resolve}(${param.name})` : param.name;
		}).join(",");
	},
	getQueryReturnType({ type }) {
		if (!hasVueQueryV4) return ` UseQueryReturnType<TData, TError, Use${pascal(type)}Result<TData, TError>> & { queryKey: QueryKey }`;
		if (type !== QueryType.INFINITE && type !== QueryType.SUSPENSE_INFINITE) return `UseQueryReturnType<TData, TError> & { queryKey: ${hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey"} }`;
		return `UseInfiniteQueryReturnType<TData, TError> & { queryKey: ${hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey"} }`;
	},
	getMutationReturnType({ dataType, variableType }) {
		return `: UseMutationReturnType<
        Awaited<ReturnType<${dataType}>>,
        TError,
        ${variableType},
        TContext
      >`;
	},
	getQueryReturnStatement({ queryResultVarName, queryOptionsVarName }) {
		return `${queryResultVarName}.queryKey = unref(${queryOptionsVarName}).queryKey as ${hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey"};

  return ${queryResultVarName};`;
	},
	getQueryKeyRouteString(route) {
		return getRouteAsArray(route);
	},
	shouldAnnotateQueryKey() {
		return false;
	},
	getRequestUnrefStatements(props) {
		return vueUnRefParams(props, hasQueryV5);
	},
	getQueryOptionsUnrefStatements(props) {
		return vueUnRefParams(props.filter((prop) => prop.type === GetterPropType.NAMED_PATH_PARAMS), hasQueryV5);
	},
	wrapHookMutatorCallback(callback) {
		return callback;
	},
	generateEnabledOption(params, options) {
		if (params.length === 0) return "";
		if (!isObject(options) || !Object.hasOwn(options, "enabled")) {
			const { resolve } = getVueReactivity(hasQueryV5);
			return `enabled: computed(() => ${params.map(({ name }) => `${resolve}(${name}) !== null && ${resolve}(${name}) !== undefined`).join(" && ")}),`;
		}
		return "";
	},
	getQueryKeyPrefix() {
		return hasVueQueryV4 ? "" : "queryOptions?.queryKey ?? ";
	},
	generateMutationImplementation({ mutationOptionsFnName, hasInvalidation, isRequestOptions }) {
		return `${mutationOptionsFnName}(${hasInvalidation ? `queryClient ?? backupQueryClient, ` : ""}${isRequestOptions ? "options" : "mutationOptions"})`;
	},
	supportsMutationInvalidation() {
		return hasQueryV5;
	},
	generateMutationOnSuccess({ operationName, definitions, isRequestOptions, generateInvalidateCall, uniqueInvalidates }) {
		const invalidateCalls = uniqueInvalidates.map((t) => generateInvalidateCall(t)).join("\n");
		if (hasQueryV5WithMutationContextOnSuccess) {
			if (isRequestOptions) return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, onMutateResult: TContext, context: MutationFunctionContext) => {
        if (!options?.skipInvalidation) {
    ${invalidateCalls}
        }
        unref(unref(typeof mutationOptions === 'function' ? mutationOptions() : mutationOptions)?.onSuccess)?.(data, variables, onMutateResult, context);
      };`;
			return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, onMutateResult: TContext, context: MutationFunctionContext) => {
    ${invalidateCalls}
        unref(unref(typeof mutationOptions === 'function' ? mutationOptions() : mutationOptions)?.onSuccess)?.(data, variables, onMutateResult, context);
      };`;
		}
		if (isRequestOptions) return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, context: TContext${hasQueryV5WithRequiredContextOnSuccess ? "" : " | undefined"}) => {
        if (!options?.skipInvalidation) {
    ${invalidateCalls}
        }
        unref(unref(typeof mutationOptions === 'function' ? mutationOptions() : mutationOptions)?.onSuccess)?.(data, variables, context);
      };`;
		return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, context: TContext${hasQueryV5WithRequiredContextOnSuccess ? "" : " | undefined"}) => {
    ${invalidateCalls}
        unref(unref(typeof mutationOptions === 'function' ? mutationOptions() : mutationOptions)?.onSuccess)?.(data, variables, context);
      };`;
	},
	generateMutationHookBody({ operationPrefix, mutationImplementation, hasInvalidation, optionalQueryClientArgument }) {
		return `      ${hasInvalidation ? `const backupQueryClient = useQueryClient();\n      ` : ""}return ${operationPrefix}Mutation(${mutationImplementation}${optionalQueryClientArgument ? `, queryClient` : ""});`;
	},
	getQueryPropertyForProp(prop, body) {
		return prop.type === GetterPropType.BODY ? body.implementation : prop.name;
	}
});
//#endregion
//#region src/frameworks/index.ts
/** Fill in defaults for fields that most adapters leave empty or share a common implementation. */
const withDefaults = (adapter) => {
	const composed = {
		isAngularHttp: false,
		getHttpFirstParam: () => "",
		getMutationHttpPrefix: () => "",
		getRequestUnrefStatements: () => "",
		getQueryOptionsUnrefStatements: () => "",
		wrapHookMutatorCallback: (callback, operationName) => `useCallback(${callback}, [${operationName}])`,
		getQueryInvocationSuffix: () => "",
		transformProps: (props) => props,
		getHttpFunctionQueryProps: (qp) => qp,
		getQueryType: (type) => type,
		shouldDestructureNamedPathParams: () => true,
		shouldAnnotateQueryKey: () => true,
		shouldGenerateOverrideTypes: () => false,
		shouldCastQueryResult: () => true,
		shouldCastQueryOptions: () => true,
		getQueryKeyPrefix: () => "queryOptions?.queryKey ?? ",
		getQueryOptionsDefinitionPrefix: () => "Use",
		getHookPropsDefinitions: (props) => toObjectString(props, "implementation"),
		getQueryKeyRouteString(route, shouldSplitQueryKey) {
			if (shouldSplitQueryKey) return getRouteAsArray(route);
			return `\`${route}\``;
		},
		generateEnabledOption(params, options) {
			if (params.length === 0) return "";
			if (!isObject(options) || !Object.hasOwn(options, "enabled")) return `enabled: ${params.map(({ name }) => `${name} !== null && ${name} !== undefined`).join(" && ")},`;
			return "";
		},
		getQueryPropertyForProp(prop, body) {
			if (prop.type === GetterPropType.NAMED_PATH_PARAMS) return prop.destructured;
			return prop.type === GetterPropType.BODY ? body.implementation : prop.name;
		},
		generateRequestFunction(verbOptions, options) {
			return options.context.output.httpClient === OutputHttpClient.AXIOS ? generateAxiosRequestFunction(verbOptions, options, composed) : generateRequestFunction(verbOptions, options);
		},
		getInfiniteQueryHttpProps(props, queryParam) {
			return props.map((param) => {
				if (param.type === GetterPropType.NAMED_PATH_PARAMS) return param.destructured;
				return param.name === "params" ? `{...params, '${queryParam}': pageParam ?? params?.['${queryParam}']}` : param.name;
			}).join(",");
		},
		generateQueryInit({ queryOptionsFnName, queryProperties, isRequestOptions }) {
			return `const ${isRequestOptions ? "queryOptions" : "options"} = ${queryOptionsFnName}(${queryProperties}${queryProperties ? "," : ""}${isRequestOptions ? "options" : "queryOptions"})`;
		},
		generateQueryInvocationArgs({ queryOptionsVarName, optionalQueryClientArgument }) {
			return `${queryOptionsVarName}${optionalQueryClientArgument ? ", queryClient" : ""}`;
		},
		getOptionalQueryClientArgument() {
			return composed.hasQueryV5 ? ", queryClient?: QueryClient" : "";
		},
		generateQueryArguments({ operationName, definitions, mutator, isRequestOptions, type, queryParams, queryParam, initialData, httpClient, hasInvalidation, useRuntimeFetcher }) {
			const definition = getQueryOptionsDefinition({
				operationName,
				mutator,
				definitions,
				type,
				prefix: composed.getQueryOptionsDefinitionPrefix(),
				hasQueryV5: composed.hasQueryV5,
				hasQueryV5WithInfiniteQueryOptionsError: composed.hasQueryV5WithInfiniteQueryOptionsError,
				queryParams,
				queryParam,
				isReturnType: false,
				initialData,
				adapter: composed
			});
			if (!isRequestOptions) return `${type ? "queryOptions" : "mutationOptions"}${initialData === "defined" ? "" : "?"}: ${definition}`;
			const requestType = getQueryArgumentsRequestType(httpClient, mutator, useRuntimeFetcher);
			const isQueryRequired = initialData === "defined";
			const optionsType = `{ ${type ? "query" : "mutation"}${isQueryRequired ? "" : "?"}:${definition}, ${!type && hasInvalidation ? "skipInvalidation?: boolean, " : ""}${requestType}}`;
			return `options${isQueryRequired ? "" : "?"}: ${optionsType}\n`;
		},
		generateMutationOnSuccess({ operationName, definitions, isRequestOptions, generateInvalidateCall, uniqueInvalidates }) {
			const invalidateCalls = uniqueInvalidates.map((t) => generateInvalidateCall(t)).join("\n");
			if (composed.hasQueryV5WithMutationContextOnSuccess) {
				if (isRequestOptions) return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, onMutateResult: TContext, context: MutationFunctionContext) => {
        if (!options?.skipInvalidation) {
    ${invalidateCalls}
        }
        mutationOptions?.onSuccess?.(data, variables, onMutateResult, context);
      };`;
				return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, onMutateResult: TContext, context: MutationFunctionContext) => {
    ${invalidateCalls}
        mutationOptions?.onSuccess?.(data, variables, onMutateResult, context);
      };`;
			} else {
				if (isRequestOptions) return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, context: TContext${composed.hasQueryV5WithRequiredContextOnSuccess ? "" : " | undefined"}) => {
        if (!options?.skipInvalidation) {
    ${invalidateCalls}
        }
        mutationOptions?.onSuccess?.(data, variables, context);
      };`;
				return `  const onSuccess = (data: Awaited<ReturnType<typeof ${operationName}>>, variables: ${definitions ? `{${definitions}}` : "void"}, context: TContext${composed.hasQueryV5WithRequiredContextOnSuccess ? "" : " | undefined"}) => {
    ${invalidateCalls}
        mutationOptions?.onSuccess?.(data, variables, context);
      };`;
			}
		},
		...adapter
	};
	return composed;
};
/**
* Create a FrameworkAdapter for the given output client, resolving version flags
* from the packageJson and query config.
*/
const createFrameworkAdapter = ({ outputClient, packageJson, queryVersion }) => {
	const clientType = outputClient;
	const _hasQueryV5 = queryVersion === 5 || isQueryV5(packageJson, clientType);
	const _hasQueryV5WithDataTagError = queryVersion === 5 || isQueryV5WithDataTagError(packageJson, clientType);
	const _hasQueryV5WithInfiniteQueryOptionsError = queryVersion === 5 || isQueryV5WithInfiniteQueryOptionsError(packageJson, clientType);
	const _hasQueryV5WithMutationContextOnSuccess = isQueryV5WithMutationContextOnSuccess(packageJson, clientType);
	const _hasQueryV5WithRequiredContextOnSuccess = isQueryV5WithRequiredContextOnSuccess(packageJson, clientType);
	switch (outputClient) {
		case OutputClient.VUE_QUERY: return withDefaults(createVueAdapter({
			hasVueQueryV4: !isVueQueryV3(packageJson) || queryVersion === 4,
			hasQueryV5: _hasQueryV5,
			hasQueryV5WithDataTagError: _hasQueryV5WithDataTagError,
			hasQueryV5WithInfiniteQueryOptionsError: _hasQueryV5WithInfiniteQueryOptionsError,
			hasQueryV5WithMutationContextOnSuccess: _hasQueryV5WithMutationContextOnSuccess,
			hasQueryV5WithRequiredContextOnSuccess: _hasQueryV5WithRequiredContextOnSuccess
		}));
		case OutputClient.SVELTE_QUERY: return withDefaults(createSvelteAdapter({
			hasSvelteQueryV4: !isSvelteQueryV3(packageJson) || queryVersion === 4,
			hasSvelteQueryV6: isSvelteQueryV6(packageJson),
			hasQueryV5: _hasQueryV5,
			hasQueryV5WithDataTagError: _hasQueryV5WithDataTagError,
			hasQueryV5WithInfiniteQueryOptionsError: _hasQueryV5WithInfiniteQueryOptionsError,
			hasQueryV5WithMutationContextOnSuccess: _hasQueryV5WithMutationContextOnSuccess,
			hasQueryV5WithRequiredContextOnSuccess: _hasQueryV5WithRequiredContextOnSuccess
		}));
		case OutputClient.ANGULAR_QUERY: return withDefaults(createAngularAdapter({
			hasQueryV5: _hasQueryV5,
			hasQueryV5WithDataTagError: _hasQueryV5WithDataTagError,
			hasQueryV5WithInfiniteQueryOptionsError: _hasQueryV5WithInfiniteQueryOptionsError,
			hasQueryV5WithMutationContextOnSuccess: _hasQueryV5WithMutationContextOnSuccess,
			hasQueryV5WithRequiredContextOnSuccess: _hasQueryV5WithRequiredContextOnSuccess
		}));
		case OutputClient.SOLID_QUERY: return withDefaults(createSolidAdapter({
			hasQueryV5: _hasQueryV5,
			hasQueryV5WithDataTagError: _hasQueryV5WithDataTagError,
			hasQueryV5WithInfiniteQueryOptionsError: _hasQueryV5WithInfiniteQueryOptionsError,
			hasQueryV5WithMutationContextOnSuccess: _hasQueryV5WithMutationContextOnSuccess,
			hasQueryV5WithRequiredContextOnSuccess: _hasQueryV5WithRequiredContextOnSuccess,
			hasSolidQueryUsePrefix: isSolidQueryWithUsePrefix(packageJson),
			hasSolidQueryRenamedOptionsTypes: isSolidQueryWithRenamedOptionsTypes(packageJson)
		}));
		default: return withDefaults(createReactAdapter({
			hasQueryV5: _hasQueryV5,
			hasQueryV5WithDataTagError: _hasQueryV5WithDataTagError,
			hasQueryV5WithInfiniteQueryOptionsError: _hasQueryV5WithInfiniteQueryOptionsError,
			hasQueryV5WithMutationContextOnSuccess: _hasQueryV5WithMutationContextOnSuccess,
			hasQueryV5WithRequiredContextOnSuccess: _hasQueryV5WithRequiredContextOnSuccess
		}));
	}
};
//#endregion
//#region src/mutation-generator.ts
const normalizeInvalidateMode = (invalidateMode) => invalidateMode === "reset" ? "reset" : "invalidate";
const normalizeTarget = (target) => isString(target) ? {
	query: target,
	invalidateMode: "invalidate"
} : {
	...target,
	invalidateMode: normalizeInvalidateMode(target.invalidateMode)
};
const serializeTarget = (target) => JSON.stringify({
	query: target.query,
	params: target.params ?? [],
	invalidateMode: target.invalidateMode,
	file: target.file ?? ""
});
const HTTP_METHODS = [
	"get",
	"post",
	"put",
	"delete",
	"patch",
	"options",
	"head",
	"trace"
];
const MUTATION_OPERATION_LOCAL_NAMES = new Set([
	"backupQueryClient",
	"context",
	"customOptions",
	"data",
	"fetchOptions",
	"http",
	"mutationFn",
	"mutationKey",
	"mutationOptions",
	"onMutateResult",
	"onSuccess",
	"options",
	"props",
	"queryClient",
	"variables"
]);
const getMutationOperationReferenceName = (operationName, localNames) => {
	if (!localNames.has(operationName)) return operationName;
	let candidate = camel(`${operationName}-request-fn`);
	let index = 2;
	while (localNames.has(candidate)) {
		candidate = camel(`${operationName}-request-fn-${index}`);
		index += 1;
	}
	return candidate;
};
/**
* Look up an operation's route and path-parameter metadata from the OpenAPI
* spec. Matches against both the raw `operationId` and its camelCase form
* so that renamed/overridden operations are still found.
*/
const findOperationInfo = (spec, operationName) => {
	const paths = spec?.paths;
	if (!paths || typeof paths !== "object") return void 0;
	for (const [routePath, rawPathItem] of Object.entries(paths)) {
		if (!rawPathItem || typeof rawPathItem !== "object") continue;
		const pathItem = rawPathItem;
		for (const method of HTTP_METHODS) {
			const operation = pathItem[method];
			const opId = operation?.operationId;
			if (!opId) continue;
			if (opId !== operationName && camel(opId) !== operationName) continue;
			if (!routePath.includes("{")) return {
				route: routePath,
				method,
				hasRequiredPathParams: false
			};
			return {
				route: routePath,
				method,
				hasRequiredPathParams: [...Array.isArray(pathItem.parameters) ? pathItem.parameters : [], ...Array.isArray(operation.parameters) ? operation.parameters : []].filter((p) => p.in === "path").some((p) => p.schema?.default === void 0 && p.default === void 0)
			};
		}
	}
};
/**
* Extract the static route prefix before the first path parameter.
* e.g. "/pets/{petId}" → "/pets/", "/pets" → "/pets"
*
* Returns `undefined` when the prefix contains no meaningful literal
* segments (e.g. "/{tenantId}/pets") to avoid overly-broad invalidation.
*/
const getStaticRoutePrefix = (route) => {
	const idx = route.indexOf("{");
	if (idx === -1) return route;
	const prefix = route.slice(0, idx);
	return prefix.split("/").some((segment) => segment.length > 0) ? prefix : void 0;
};
const getMutationOptionsUrl = (route, pathParamNames, pathRoute) => {
	const pathParams = new Set(pathParamNames);
	if (pathParams.size === 0) return route;
	const formatPathRoute = (value) => value.replace(/\$\{([^}]+)\}/g, (match, expression) => pathParams.has(expression) ? `{${expression}}` : match);
	if (pathRoute) {
		if (route.endsWith(pathRoute)) return `${route.slice(0, -pathRoute.length)}${formatPathRoute(pathRoute)}`;
		const routeWithoutLeadingSlash = pathRoute.startsWith("/") ? pathRoute.slice(1) : void 0;
		if (routeWithoutLeadingSlash && route.endsWith(routeWithoutLeadingSlash)) return `${route.slice(0, -routeWithoutLeadingSlash.length)}${formatPathRoute(routeWithoutLeadingSlash)}`;
	}
	return pathRoute ? route : formatPathRoute(route);
};
const getMutationOptionsNamedPathParamName = (param) => {
	const trimmedParam = param.trim();
	if (!trimmedParam || trimmedParam.startsWith("...")) return void 0;
	const [name] = trimmedParam.split(/[=:]/);
	return name?.trim() || void 0;
};
const getMutationOptionsPathParamNames = (props) => props.flatMap((prop) => {
	if (prop.type === GetterPropType.PARAM) return [prop.name];
	if (prop.type === GetterPropType.NAMED_PATH_PARAMS) return prop.destructured.replace(/^\{\s*|\s*\}$/g, "").split(",").flatMap((param) => {
		const name = getMutationOptionsNamedPathParamName(param);
		return name ? [name] : [];
	});
	return [];
});
/**
* Check whether the target invalidation needs to call the query key function.
* Returns false when no params are specified and the route has required path
* parameters (without defaults), meaning we should use predicate-based broad
* invalidation instead of calling the function without the required arguments.
*/
const hasNonEmptyParams = (params) => {
	if (!params) return false;
	if (Array.isArray(params)) return params.length > 0;
	return Object.keys(params).length > 0;
};
const needsQueryKeyFnCall = (target, spec) => {
	if (hasNonEmptyParams(target.params)) return true;
	if (findOperationInfo(spec, target.query)?.hasRequiredPathParams) return false;
	return true;
};
const generateParamArg = (param) => {
	if (!isString(param)) return JSON.stringify(param.literal);
	const parts = param.split(".");
	if (parts.length === 1) return `variables.${param}`;
	return `variables.${parts[0]}?.${parts.slice(1).join("?.")}`;
};
const generateParamArgs = (params) => {
	if (Array.isArray(params)) return params.map((v) => generateParamArg(v)).join(", ");
	return Object.values(params).map((v) => generateParamArg(v)).join(", ");
};
/**
* Build the code-literal form of a static route prefix for use inside a
* `.startsWith(...)` predicate. A prefix derived from a runtime `baseUrl`
* contains a `${...}` interpolation, so it must be emitted as a template
* literal; otherwise a plain single-quoted string is enough and keeps the
* output byte-identical to the no-baseUrl case.
*/
const toPrefixLiteral = (prefix) => prefix.includes("${") ? `\`${prefix}\`` : `'${prefix}'`;
/**
* Create a generateInvalidateCall function that has access to the OpenAPI spec
* for intelligent route-based invalidation when params are not specified.
*/
const createGenerateInvalidateCall = (spec, shouldSplitQueryKey, useOperationIdAsQueryKey, baseUrl, servers) => {
	return (target) => {
		const method = target.invalidateMode === "reset" ? "resetQueries" : "invalidateQueries";
		const queryKeyFn = camel(`get-${target.query}-query-key`);
		if (hasNonEmptyParams(target.params)) return `    queryClient.${method}({ queryKey: ${queryKeyFn}(${generateParamArgs(target.params)}) });`;
		const info = findOperationInfo(spec, target.query);
		if (info?.hasRequiredPathParams) {
			const prefix = getStaticRoutePrefix(info.route);
			if (prefix !== void 0) {
				const prefixWithBase = getFullRoute(getRoute(prefix), servers, baseUrl);
				const verbPrefix = getQueryKeyVerbPrefix({
					verb: info.method,
					useOperationIdAsQueryKey
				});
				if (shouldSplitQueryKey) {
					const segments = getRouteAsArray(prefixWithBase);
					return `    queryClient.${method}({ queryKey: ${verbPrefix ? `['${verbPrefix}', ${segments}]` : `[${segments}]`} });`;
				}
				const prefixLiteral = toPrefixLiteral(prefixWithBase);
				if (verbPrefix) return `    queryClient.${method}({ predicate: (query) => query.queryKey[0] === '${verbPrefix}' && typeof query.queryKey[1] === 'string' && query.queryKey[1].startsWith(${prefixLiteral}) });`;
				return `    queryClient.${method}({ predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith(${prefixLiteral}) });`;
			}
		}
		return `    queryClient.${method}({ queryKey: ${queryKeyFn}() });`;
	};
};
const generateMutationHook = async ({ verbOptions, options, isRequestOptions, httpClient, doc, adapter }) => {
	const { operationName, typeName, body, props, mutator, response, operationId, route: pathRoute, override } = verbOptions;
	const { route, context, output } = options;
	const query = override.query;
	const mutationOptionsMutator = query.mutationOptions ? await generateMutator({
		output,
		mutator: query.mutationOptions,
		name: `${operationName}MutationOptions`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	const bodyOptionalMark = body.isOptional ? "?" : "";
	const definitions = props.map(({ definition, type }) => type === GetterPropType.BODY ? mutator?.bodyTypeName ? `data${bodyOptionalMark}: ${mutator.bodyTypeName}<${body.definition}>` : `data${bodyOptionalMark}: ${body.definition}` : definition).join(";");
	const properties = props.map(({ name, type }) => type === GetterPropType.BODY ? "data" : name).join(",");
	const operationLocalNames = new Set(MUTATION_OPERATION_LOCAL_NAMES);
	for (const { name, type } of props) operationLocalNames.add(type === GetterPropType.BODY ? "data" : name);
	const errorType = getQueryErrorType(typeName, response, httpClient, mutator, override.fetch.forceSuccessResponse);
	const operationReferenceName = getMutationOperationReferenceName(operationName, operationLocalNames);
	const dataType = mutator?.isHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationReferenceName}`;
	const operationTypeReferenceName = mutator?.isHook ? operationName : operationReferenceName;
	const mutationOptionFnReturnType = getQueryOptionsDefinition({
		operationName: operationTypeReferenceName,
		mutator,
		definitions,
		prefix: adapter.getQueryOptionsDefinitionPrefix(),
		hasQueryV5: adapter.hasQueryV5,
		hasQueryV5WithInfiniteQueryOptionsError: adapter.hasQueryV5WithInfiniteQueryOptionsError,
		isReturnType: true,
		adapter
	});
	const invalidatesConfig = (query.mutationInvalidates ?? []).filter((rule) => rule.onMutations.includes(operationName)).flatMap((rule) => rule.invalidates).map((t) => normalizeTarget(t));
	const seenTargets = /* @__PURE__ */ new Set();
	const uniqueInvalidates = invalidatesConfig.filter((target) => {
		const key = serializeTarget(target);
		if (seenTargets.has(key)) return false;
		seenTargets.add(key);
		return true;
	});
	const hasInvalidation = uniqueInvalidates.length > 0 && adapter.supportsMutationInvalidation();
	const useRuntimeFetcher = override.fetch.useRuntimeFetcher;
	const mutationArguments = adapter.generateQueryArguments({
		operationName: operationTypeReferenceName,
		definitions,
		mutator,
		isRequestOptions,
		httpClient,
		hasInvalidation,
		useRuntimeFetcher
	});
	const mutationArgumentsForOptions = adapter.generateQueryArguments({
		operationName: operationTypeReferenceName,
		definitions,
		mutator,
		isRequestOptions,
		httpClient,
		forQueryOptions: true,
		hasInvalidation,
		useRuntimeFetcher
	});
	const mutationOptionsFnName = camel(mutationOptionsMutator || mutator?.isHook ? `use-${operationName}-mutationOptions` : `get-${operationName}-mutationOptions`);
	const hooksOptionImplementation = getHooksOptionImplementation(isRequestOptions, httpClient, camel(operationName), mutator, useRuntimeFetcher);
	const mutationOptionsFn = `export const ${mutationOptionsFnName} = <TError = ${errorType},
    TContext = unknown>(${adapter.getHttpFirstParam(mutator)}${hasInvalidation ? "queryClient: QueryClient, " : ""}${mutationArgumentsForOptions}): ${mutationOptionFnReturnType} => {

${hooksOptionImplementation}

      ${mutator?.isHook ? `const ${operationReferenceName} =  use${pascal(operationName)}Hook()` : ""}


      const mutationFn: MutationFunction<Awaited<ReturnType<${dataType}>>, ${definitions ? `{${definitions}}` : "void"}> = (${properties ? "props" : ""}) => {
          ${properties ? `const {${properties}} = props ?? {};` : ""}

          return  ${operationReferenceName}(${adapter.getMutationHttpPrefix(mutator)}${properties}${properties ? "," : ""}${getMutationRequestArgs(isRequestOptions, httpClient, mutator, useRuntimeFetcher)})
        }

${hasInvalidation ? adapter.generateMutationOnSuccess({
		operationName,
		definitions,
		isRequestOptions,
		generateInvalidateCall: createGenerateInvalidateCall(context.spec, !!query.shouldSplitQueryKey, !!query.useOperationIdAsQueryKey, context.output.baseUrl, context.spec.servers),
		uniqueInvalidates
	}) : ""}

        ${mutationOptionsMutator ? `const customOptions = ${mutationOptionsMutator.name}({...mutationOptions, mutationFn}${mutationOptionsMutator.hasSecondArg ? `, { url: \`${getMutationOptionsUrl(route, getMutationOptionsPathParamNames(props), pathRoute)}\` }` : ""}${mutationOptionsMutator.hasThirdArg ? `, { operationId: '${operationId}', operationName: '${operationName}' }` : ""});` : ""}


  return  ${mutationOptionsMutator ? "customOptions" : hasInvalidation ? "{ ...mutationOptions, mutationFn, onSuccess }" : "{ mutationFn, ...mutationOptions }"}}`;
	const operationPrefix = adapter.hookPrefix;
	const optionalQueryClientArgument = adapter.getOptionalQueryClientArgument(hasInvalidation);
	const mutationImplementation = adapter.generateMutationImplementation({
		mutationOptionsFnName,
		hasInvalidation,
		isRequestOptions
	});
	const mutationOptionsVarName = camel(`${operationName}-mutation-options`);
	const mutationReturnType = adapter.getMutationReturnType({
		dataType,
		variableType: definitions ? `{${definitions}}` : "void"
	});
	const mutationHookBody = adapter.generateMutationHookBody({
		operationPrefix,
		mutationOptionsFnName,
		mutationImplementation,
		mutationOptionsVarName,
		isRequestOptions,
		mutator,
		hasInvalidation,
		optionalQueryClientArgument
	});
	return {
		implementation: `
${!mutator?.isHook && operationReferenceName !== operationName ? `const ${operationReferenceName} = ${operationName};` : ""}
${mutationOptionsFn}

    export type ${pascal(typeName)}MutationResult = NonNullable<Awaited<ReturnType<${dataType}>>>
    ${body.definition ? `export type ${pascal(typeName)}MutationBody = ${mutator?.bodyTypeName ? `${mutator.bodyTypeName}<${body.definition}>` : body.definition}${body.isOptional ? " | undefined" : ""}` : ""}
    export type ${pascal(typeName)}MutationError = ${errorType}

    ${doc}export const ${camel(`${operationPrefix}-${operationName}`)} = <TError = ${errorType},
    TContext = unknown>(${mutationArguments} ${optionalQueryClientArgument})${mutationReturnType} => {
${mutationHookBody}
    }
    `,
		mutators: mutationOptionsMutator ? [mutationOptionsMutator] : void 0,
		imports: hasInvalidation ? uniqueInvalidates.filter((i) => !!i.file && needsQueryKeyFnCall(i, context.spec)).map((i) => ({
			name: camel(`get-${i.query}-query-key`),
			importPath: i.file,
			values: true
		})) : []
	};
};
//#endregion
//#region src/query-generator.ts
/**
* Decide whether the current operation's configuration conflicts with a
* `mutationInvalidates` rule. The rule wires its invalidation through the
* Mutation hook's `onSuccess`, so referencing an operation that is not
* generated as a Mutation (either forced into a Query via per-operation
* `useQuery: true`, or suppressed entirely) makes the rule a silent no-op.
*
* Returns the warning message when the conflict applies, or `undefined`
* when the configuration is consistent.
*/
const getMutationInvalidatesConflictWarning = ({ operationName, isMutation, isQuery, mutationInvalidates }) => {
	if (isMutation) return void 0;
	if (!mutationInvalidates?.length) return void 0;
	if (!mutationInvalidates.find((rule) => rule.onMutations.includes(operationName))) return void 0;
	return `mutationInvalidates rule references '${operationName}', but that operation is generated as a ${isQuery ? "Query hook" : "plain function (no hook)"}, not a Mutation. The invalidation will not fire. Either remove '${operationName}' from the rule's onMutations list, or configure '${operationName}' so that it is generated as a Mutation hook.`;
};
const hasQueryParam = (queryParams, queryParam) => {
	if (!queryParam || !queryParams) return false;
	return queryParams.paramNames?.includes(queryParam) ?? true;
};
const escapeRegExpMetaChars = (value) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
/**
* Wraps the body parameter's type in a property string with the mutator's
* `BodyType<T>` envelope so that user-facing Query helpers (hook signature,
* `getXxxQueryOptions`, `getXxxQueryKey`, prefetch / invalidate / set+get
* QueryData) match the request function's signature, which is already
* wrapped by `client.ts`. Without this, callers that pass a plain body to
* a non-GET Query hook (possible after #2376 routes non-GET verbs to
* Query hooks) would hit a type mismatch against the underlying request
* function.
*
* The pattern handles three prop shapes that the various
* `toObjectString(props, ...)` callers can emit:
*   - `name: T`                — required body
*   - `name?: T`               — optional body
*   - `name: undefined | T`    — `definedInitialData` overload transform
*
* `body.definition` is fully regex-escaped so types containing metachars
* (e.g. `Pet[]`, `Foo | Bar`, anonymous object types) are matched
* verbatim rather than reinterpreted as regex syntax.
*
* No-op when the operation has no body or the mutator does not export a
* `BodyType<T>` wrapper, so existing GET-only Query keys are unchanged.
*/
const wrapPropsBodyWithMutatorBodyType = ({ propsString, body, mutator }) => {
	if (!mutator?.bodyTypeName || !body.definition) return propsString;
	const bodyDefinitionPattern = escapeRegExpMetaChars(body.definition);
	return propsString.replace(new RegExp(String.raw`(\w+\??:\s*(?:undefined\s*\|\s*)?)${bodyDefinitionPattern}`), `$1${mutator.bodyTypeName}<${body.definition}>`);
};
/**
* Widens a parameter signature to be optional. Skips params that already
* carry a default value (`= ...`), since those are syntactically optional
* and adding `?` on top would be a TypeScript error.
*/
const makeOptionalParam = (impl) => {
	if (impl.includes("=")) return impl;
	return impl.replace(/^(\w+):\s*/, "$1?: ");
};
/**
* Widens a parameter type to also accept `undefined`. Already-optional
* (`?:`) signatures are normalized to required-with-undefined, and params
* with a default value pass through unchanged.
*/
const allowUndefinedParam = (impl) => {
	if (impl.includes("=")) return impl;
	const optional = /^(\w+)\?:\s*(.+)$/.exec(impl);
	if (optional) return `${optional[1]}: ${optional[2]} | undefined`;
	return impl.replace(/^(\w+):\s*(.+)$/, "$1: $2 | undefined");
};
/**
* Renders the `setXxxQueryData` helper as either a React hook (returns a
* setter) or a plain function taking `queryClient`. Both shapes share the
* same body and signature, so this collapses what would otherwise be two
* near-identical template literals.
*/
const renderSetQueryDataHelper = ({ doc, isReactQuery, fnName, propsSig, body }) => {
	const docPrefix = doc ?? "";
	if (isReactQuery) return `${docPrefix}export const ${fnName} = () => {
  const queryClient = useQueryClient();
  return (${propsSig}) => {
    ${body}
  };
}\n`;
	return `${docPrefix}export const ${fnName} = (queryClient: QueryClient, ${propsSig}) => {
  ${body}
}\n`;
};
/**
* Renders the prop list shared by `getXxxQueryKey`, `setXxxQueryData` and
* `getXxxQueryData` helpers: headers are dropped, path params stay required,
* non-path params (query params, body) are passed through `widenNonPath`
* (defaults to identity — pass `makeOptionalParam` or `allowUndefinedParam`
* to relax the signature).
*
* Centralising this prevents the three call sites from drifting apart on
* how they treat the same props.
*/
const buildKeyShapedProps = ({ props, body, mutator, widenNonPath = (impl) => impl }) => wrapPropsBodyWithMutatorBodyType({
	propsString: toObjectString(props.filter((prop) => prop.type !== GetterPropType.HEADER).map((prop) => ({
		...prop,
		implementation: prop.type === GetterPropType.PARAM || prop.type === GetterPropType.NAMED_PATH_PARAMS ? prop.implementation : widenNonPath(prop.implementation)
	})), "implementation"),
	body,
	mutator
});
/**
* Computes a verb prefix segment for query keys when a non-GET operation is
* routed to a Query hook. Without this prefix, two operations sharing a path
* (e.g. `GET /pets` and `POST /pets`) would generate cache keys that both
* begin with `'/pets'`, so TanStack Query would mix their cached data and
* `invalidateQueries({ queryKey: ['/pets'] })` would match both.
*
* Skipped for GET (preserves existing keys) and when
* `useOperationIdAsQueryKey` is enabled (operation IDs are already unique
* across verb + path, so the prefix would be redundant).
*
* Returns the uppercased verb when a prefix should be inserted, or
* `undefined` when no prefix is needed.
*/
const getQueryKeyVerbPrefix = ({ verb, useOperationIdAsQueryKey }) => {
	if (useOperationIdAsQueryKey) return void 0;
	if (verb === Verbs.GET) return void 0;
	return verb.toUpperCase();
};
const getQueryFnArguments = ({ hasQueryParam, hasSignal, hasSignalParam = false }) => {
	if (!hasQueryParam && !hasSignal) return "";
	const signalDestructure = hasSignalParam ? "signal: querySignal" : "signal";
	if (hasQueryParam) {
		if (hasSignal) return `{ ${signalDestructure}, pageParam }`;
		return "{ pageParam }";
	}
	return `{ ${signalDestructure} }`;
};
const generatePrefetch = ({ usePrefetch, type, useQuery, useInfinite, operationName, mutator, doc, queryProps, dataType, errorType, queryArguments, queryOptionsVarName, queryOptionsFnName, queryProperties, isRequestOptions }) => {
	if (!(usePrefetch && (type === QueryType.QUERY || type === QueryType.INFINITE || type === QueryType.SUSPENSE_QUERY && !useQuery || type === QueryType.SUSPENSE_INFINITE && !useInfinite))) return "";
	const prefetchType = type === QueryType.QUERY || type === QueryType.SUSPENSE_QUERY ? "query" : "infinite-query";
	const prefetchFnName = camel(`prefetch-${prefetchType}`);
	if (mutator?.isHook) return `${doc}export const ${camel(`use-prefetch-${operationName}-${prefetchType}`)} = <TData = Awaited<ReturnType<${dataType}>>, TError = ${errorType}>(${queryProps} ${queryArguments}) => {
  const queryClient = useQueryClient();
  const ${queryOptionsVarName} = ${queryOptionsFnName}(${queryProperties}${queryProperties ? "," : ""}${isRequestOptions ? "options" : "queryOptions"})
  return useCallback(async (): Promise<QueryClient> => {
    await queryClient.${prefetchFnName}(${queryOptionsVarName})
    return queryClient;
  },[queryClient, ${queryOptionsVarName}]);
};\n`;
	else return `${doc}export const ${camel(`prefetch-${operationName}-${prefetchType}`)} = async <TData = Awaited<ReturnType<${dataType}>>, TError = ${errorType}>(\n queryClient: QueryClient, ${queryProps} ${queryArguments}\n  ): Promise<QueryClient> => {

  const ${queryOptionsVarName} = ${queryOptionsFnName}(${queryProperties}${queryProperties ? "," : ""}${isRequestOptions ? "options" : "queryOptions"})

  await queryClient.${prefetchFnName}(${queryOptionsVarName});

  return queryClient;
}\n`;
};
const generateQueryImplementation = ({ queryOption: { name, typeName: optionTypeName, queryParam, options, type, queryKeyFnName }, operationId, operationName, typeName, queryProperties, queryKeyProperties, queryParams, params, props, body, mutator, queryOptionsMutator, queryKeyMutator, isRequestOptions, response, httpClient, isExactOptionalPropertyTypes, hasSignal, useRuntimeFetcher, forceSuccessResponse, route, doc, usePrefetch, useQuery, useInfinite, useInvalidate, useSetQueryData, useGetQueryData, adapter }) => {
	const { hasQueryV5, hasQueryV5WithDataTagError, hasQueryV5WithInfiniteQueryOptionsError } = adapter;
	const hasSignalParam = props.some((prop) => prop.name === "signal");
	const queryPropDefinitions = wrapPropsBodyWithMutatorBodyType({
		propsString: toObjectString(props, "definition"),
		body,
		mutator
	});
	const definedInitialDataQueryPropsDefinitions = wrapPropsBodyWithMutatorBodyType({
		propsString: toObjectString(props.map((prop) => {
			const regex = new RegExp(String.raw`^${prop.name}\s*\?:`);
			if (!regex.test(prop.definition)) return prop;
			const definitionWithUndefined = prop.definition.replace(regex, `${prop.name}: undefined | `);
			return {
				...prop,
				definition: definitionWithUndefined
			};
		}), "definition"),
		body,
		mutator
	});
	const queryProps = wrapPropsBodyWithMutatorBodyType({
		propsString: toObjectString(props, "implementation"),
		body,
		mutator
	});
	const infiniteQueryParamType = hasQueryParam(queryParams, queryParam) && queryParams && queryParam ? `${queryParams.schema.name}['${queryParam}']` : "";
	const hasInfiniteQueryParam = !!infiniteQueryParamType;
	const httpFunctionProps = queryParam ? adapter.getInfiniteQueryHttpProps(props, queryParam, httpClient, !!mutator) : adapter.getHttpFunctionQueryProps(queryProperties, httpClient, !!mutator);
	const definedInitialDataReturnType = adapter.getQueryReturnType({
		type,
		isMutatorHook: mutator?.isHook,
		operationName,
		hasQueryV5,
		hasQueryV5WithDataTagError,
		isInitialDataDefined: true
	});
	const returnType = adapter.getQueryReturnType({
		type,
		isMutatorHook: mutator?.isHook,
		operationName,
		hasQueryV5,
		hasQueryV5WithDataTagError
	});
	const errorType = getQueryErrorType(typeName, response, httpClient, mutator, forceSuccessResponse);
	const dataType = mutator?.isHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationName}`;
	const definedInitialDataQueryArguments = adapter.generateQueryArguments({
		operationName,
		mutator,
		definitions: "",
		isRequestOptions,
		type,
		queryParams,
		queryParam,
		initialData: "defined",
		httpClient,
		useRuntimeFetcher
	});
	const undefinedInitialDataQueryArguments = adapter.generateQueryArguments({
		operationName,
		definitions: "",
		mutator,
		isRequestOptions,
		type,
		queryParams,
		queryParam,
		initialData: "undefined",
		httpClient,
		useRuntimeFetcher
	});
	const queryArguments = adapter.generateQueryArguments({
		operationName,
		definitions: "",
		mutator,
		isRequestOptions,
		type,
		queryParams,
		queryParam,
		httpClient,
		useRuntimeFetcher
	});
	const queryArgumentsForOptions = adapter.generateQueryArguments({
		operationName,
		definitions: "",
		mutator,
		isRequestOptions,
		type,
		queryParams,
		queryParam,
		httpClient,
		forQueryOptions: true,
		useRuntimeFetcher
	});
	const queryOptions = getQueryOptions({
		isRequestOptions,
		isExactOptionalPropertyTypes,
		mutator,
		hasSignal,
		httpClient,
		hasSignalParam,
		useRuntimeFetcher
	});
	const hookOptions = getHookOptions({
		isRequestOptions,
		httpClient,
		mutator,
		useRuntimeFetcher
	});
	const queryFnArguments = getQueryFnArguments({
		hasQueryParam: !!queryParam && props.some(({ type }) => type === "queryParam"),
		hasSignal,
		hasSignalParam
	});
	const queryOptionFnReturnType = getQueryOptionsDefinition({
		operationName,
		mutator,
		definitions: "",
		type,
		prefix: adapter.getQueryOptionsDefinitionPrefix(),
		hasQueryV5,
		hasQueryV5WithInfiniteQueryOptionsError,
		queryParams,
		queryParam,
		isReturnType: true,
		adapter
	});
	const queryOptionsImp = generateQueryOptions({
		params,
		options,
		type,
		adapter
	});
	const queryOptionsFnName = camel(queryKeyMutator || queryOptionsMutator || mutator?.isHook ? `use-${name}-queryOptions` : `get-${name}-queryOptions`);
	const queryOptionsVarName = isRequestOptions ? "queryOptions" : "options";
	const queryResultVarName = props.some((prop) => prop.name === "query") ? "_query" : "query";
	const infiniteParam = infiniteQueryParamType ? `, ${infiniteQueryParamType}` : "";
	const TData = hasQueryV5 && (type === QueryType.INFINITE || type === QueryType.SUSPENSE_INFINITE) ? `InfiniteData<Awaited<ReturnType<${dataType}>>${infiniteParam}>` : `Awaited<ReturnType<${dataType}>>`;
	const queryOptionsFn = `export const ${queryOptionsFnName} = <TData = ${TData}, TError = ${errorType}>(${adapter.getHttpFirstParam(mutator)}${queryProps} ${queryArgumentsForOptions}) => {

${hookOptions}

  const queryKey =  ${queryKeyMutator ? `${queryKeyMutator.name}({ ${queryProperties} }${queryKeyMutator.hasSecondArg ? `, { url: \`${route}\`, queryOptions }` : ""});` : `${adapter.getQueryKeyPrefix()}${queryKeyFnName}(${queryKeyProperties});`}

  ${mutator?.isHook ? `const ${operationName} =  use${pascal(operationName)}Hook();` : ""}

    const queryFn: QueryFunction<Awaited<ReturnType<${mutator?.isHook ? `ReturnType<typeof use${pascal(operationName)}Hook>` : `typeof ${operationName}`}>>${hasQueryV5 && hasInfiniteQueryParam ? `, QueryKey, ${infiniteQueryParamType}` : ""}> = (${queryFnArguments}) => ${operationName}(${httpFunctionProps}${httpFunctionProps ? ", " : ""}${queryOptions});

      ${adapter.getQueryOptionsUnrefStatements(props)}

      ${queryOptionsMutator ? `const customOptions = ${queryOptionsMutator.name}({ queryKey, queryFn, ${queryOptionsImp}}${queryOptionsMutator.hasSecondArg ? `, { ${queryProperties} }` : ""}${queryOptionsMutator.hasThirdArg ? `, { url: \`${route}\`, operationId: '${operationId}', operationName: '${operationName}' }` : ""});` : ""}

   return  ${queryOptionsMutator ? "customOptions" : `{ queryKey, queryFn, ${queryOptionsImp}}`}${adapter.shouldCastQueryOptions?.() === false ? "" : ` as ${queryOptionFnReturnType} ${adapter.shouldAnnotateQueryKey() ? `& { queryKey: ${hasQueryV5 ? `DataTag<QueryKey, TData${hasQueryV5WithDataTagError ? ", TError" : ""}>` : "QueryKey"} }` : ""}`}
}`;
	const operationPrefix = adapter.hookPrefix;
	const optionalQueryClientArgument = adapter.getOptionalQueryClientArgument();
	const queryHookName = camel(`${operationPrefix}-${name}`);
	const overrideTypes = `
export function ${queryHookName}<TData = ${TData}, TError = ${errorType}>(\n ${definedInitialDataQueryPropsDefinitions} ${definedInitialDataQueryArguments} ${optionalQueryClientArgument}\n  ): ${definedInitialDataReturnType}
export function ${queryHookName}<TData = ${TData}, TError = ${errorType}>(\n ${queryPropDefinitions} ${undefinedInitialDataQueryArguments} ${optionalQueryClientArgument}\n  ): ${returnType}
export function ${queryHookName}<TData = ${TData}, TError = ${errorType}>(\n ${queryPropDefinitions} ${queryArguments} ${optionalQueryClientArgument}\n  ): ${returnType}`;
	const prefetchContext = {
		usePrefetch,
		type,
		useQuery,
		useInfinite,
		operationName,
		mutator,
		queryProps,
		dataType,
		errorType,
		queryArguments: queryArgumentsForOptions,
		queryOptionsVarName,
		queryOptionsFnName,
		queryProperties,
		isRequestOptions,
		doc
	};
	const prefetch = adapter.generatePrefetch ? adapter.generatePrefetch(prefetchContext) : generatePrefetch(prefetchContext);
	const isPrimaryQueryType = type === QueryType.QUERY || type === QueryType.INFINITE || type === QueryType.SUSPENSE_QUERY && !useQuery || type === QueryType.SUSPENSE_INFINITE && !useInfinite;
	const buildBaseQueryKeyExpr = () => queryKeyMutator ? `${queryKeyMutator.name}({ ${queryProperties} }${queryKeyMutator.hasSecondArg ? `, { url: \`${route}\` }` : ""})` : `${queryKeyFnName}(${queryKeyProperties})`;
	const applyQueryOptionsMutator = (baseExpr) => queryOptionsMutator && !queryOptionsMutator.isHook ? `${queryOptionsMutator.name}({ queryKey: ${baseExpr} }${queryOptionsMutator.hasSecondArg ? `, { ${queryProperties} }` : ""}${queryOptionsMutator.hasThirdArg ? `, { url: \`${route}\`, operationId: '${operationId}', operationName: '${operationName}' }` : ""}).queryKey` : baseExpr;
	const hasHookMutator = !!queryOptionsMutator?.isHook;
	if (hasHookMutator && (useSetQueryData || useGetQueryData)) logWarning(`'${name}' has a hook-based queryOptions mutator, so the requested set/get-query-data helpers were skipped to avoid a cache-key mismatch with the query hook.`);
	const shouldGenerateInvalidate = useInvalidate && isPrimaryQueryType;
	const invalidateFnName = camel(`invalidate-${name}`);
	const invalidateQueryKeyExpr = applyQueryOptionsMutator(buildBaseQueryKeyExpr());
	const shouldGenerateSetQueryData = useSetQueryData && isPrimaryQueryType && !hasHookMutator;
	const isReactQuery = adapter.outputClient === OutputClient.REACT_QUERY;
	const setQueryDataFnName = isReactQuery ? camel(`use-set-${name}-query-data`) : camel(`set-${name}-query-data`);
	const setQueryDataKeyExpr = applyQueryOptionsMutator(buildBaseQueryKeyExpr());
	const setQueryDataProps = buildKeyShapedProps({
		props,
		body,
		mutator,
		widenNonPath: allowUndefinedParam
	});
	const shouldGenerateGetQueryData = useGetQueryData && isPrimaryQueryType && !hasHookMutator;
	const getQueryDataFnName = isReactQuery ? camel(`use-get-${name}-query-data`) : camel(`get-${name}-query-data`);
	const getQueryDataProps = buildKeyShapedProps({
		props,
		body,
		mutator
	});
	const queryInit = adapter.generateQueryInit({
		queryOptionsFnName,
		queryProperties,
		isRequestOptions,
		mutator
	});
	const queryInvocationArgs = adapter.generateQueryInvocationArgs({
		props,
		queryOptionsFnName,
		queryProperties,
		isRequestOptions,
		mutator,
		operationPrefix,
		type,
		queryOptionsVarName,
		optionalQueryClientArgument
	});
	const queryInvocationSuffix = adapter.getQueryInvocationSuffix();
	return `
${queryOptionsFn}

export type ${pascal(optionTypeName)}QueryResult = NonNullable<Awaited<ReturnType<${dataType}>>>
export type ${pascal(optionTypeName)}QueryError = ${errorType}

${adapter.shouldGenerateOverrideTypes() ? overrideTypes : ""}
${doc}
export function ${queryHookName}<TData = ${TData}, TError = ${errorType}>(\n ${wrapPropsBodyWithMutatorBodyType({
		propsString: adapter.getHookPropsDefinitions(props),
		body,
		mutator
	})} ${queryArguments} ${optionalQueryClientArgument} \n ): ${returnType} {

  ${queryInit}

  const ${queryResultVarName} = ${camel(`${operationPrefix}-${adapter.getQueryType(type)}`)}(${queryInvocationArgs}${queryInvocationSuffix})${adapter.shouldCastQueryResult?.() === false ? "" : ` as ${returnType}`};

  ${adapter.getQueryReturnStatement({
		hasQueryV5,
		hasQueryV5WithDataTagError,
		queryResultVarName,
		queryOptionsVarName
	})}
}\n
${prefetch}
${shouldGenerateInvalidate ? `${doc}export const ${invalidateFnName} = async (\n queryClient: QueryClient, ${queryProps} options?: InvalidateOptions\n  ): Promise<QueryClient> => {

  await queryClient.invalidateQueries({ queryKey: ${invalidateQueryKeyExpr} }, options);

  return queryClient;
}\n` : ""}
${shouldGenerateSetQueryData ? renderSetQueryDataHelper({
		doc,
		isReactQuery,
		fnName: setQueryDataFnName,
		propsSig: `${setQueryDataProps}updater: ${TData} | undefined | ((old: ${TData} | undefined) => ${TData} | undefined)`,
		body: `queryClient.setQueriesData<${TData}>({ queryKey: ${setQueryDataKeyExpr} }, updater);`
	}) : ""}
${shouldGenerateGetQueryData ? isReactQuery ? `${doc}export const ${getQueryDataFnName} = () => {
  const queryClient = useQueryClient();
  return (${getQueryDataProps}) =>
    queryClient.getQueryData<${TData}>(${setQueryDataKeyExpr});
}\n` : `${doc}export const ${getQueryDataFnName} = (queryClient: QueryClient, ${getQueryDataProps}) =>
  queryClient.getQueryData<${TData}>(${setQueryDataKeyExpr});\n` : ""}
`;
};
const generateQueryHook = async (verbOptions, options, outputClient, adapter) => {
	if (!adapter) throw new Error("FrameworkAdapter is required for generateQueryHook");
	const { queryParams, operationName, typeName, body, props: _props, verb, params, override, mutator, response, operationId, summary, deprecated } = verbOptions;
	const { route, override: { operations }, context, output } = options;
	const props = adapter.transformProps(_props);
	const query = override.query;
	const isRequestOptions = override.requestOptions !== false;
	const operationQueryOptions = operations[operationId]?.query;
	const isExactOptionalPropertyTypes = !!context.output.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;
	const httpClient = context.output.httpClient;
	const doc = jsDoc({
		summary,
		deprecated
	});
	let implementation = "";
	let mutators;
	const effectiveUseQuery = operationQueryOptions?.useQuery ?? override.query.useQuery ?? verb === Verbs.GET;
	const effectiveUseMutation = operationQueryOptions?.useMutation ?? override.query.useMutation ?? verb !== Verbs.GET;
	const globalSuspenseOrInfiniteOnlyForGet = (flag) => flag === true && verb === Verbs.GET;
	const effectiveUseSuspenseQuery = operationQueryOptions?.useSuspenseQuery ?? globalSuspenseOrInfiniteOnlyForGet(override.query.useSuspenseQuery);
	const hasConfiguredInfiniteQueryParam = !query.useInfiniteQueryParam || hasQueryParam(queryParams, query.useInfiniteQueryParam);
	const effectiveUseInfinite = (operationQueryOptions?.useInfinite ?? globalSuspenseOrInfiniteOnlyForGet(override.query.useInfinite)) && hasConfiguredInfiniteQueryParam;
	const effectiveUseSuspenseInfiniteQuery = (operationQueryOptions?.useSuspenseInfiniteQuery ?? globalSuspenseOrInfiniteOnlyForGet(override.query.useSuspenseInfiniteQuery)) && hasConfiguredInfiniteQueryParam;
	let isQuery = effectiveUseQuery || effectiveUseSuspenseQuery || effectiveUseInfinite || effectiveUseSuspenseInfiniteQuery;
	let isMutation = effectiveUseMutation;
	if (verb !== Verbs.GET && isQuery) isMutation = false;
	if (verb === Verbs.GET && isMutation) isQuery = false;
	const conflictWarning = getMutationInvalidatesConflictWarning({
		operationName,
		isMutation,
		isQuery,
		mutationInvalidates: override.query.mutationInvalidates
	});
	if (conflictWarning) logWarning(conflictWarning);
	if (isQuery) {
		const queryKeyMutator = query.queryKey ? await generateMutator({
			output,
			mutator: query.queryKey,
			name: `${operationName}QueryKey`,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0;
		const queryOptionsMutator = query.queryOptions ? await generateMutator({
			output,
			mutator: query.queryOptions,
			name: `${operationName}QueryOptions`,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0;
		const queryProperties = props.map((param) => {
			return adapter.getQueryPropertyForProp(param, body);
		}).join(",");
		const queryKeyProperties = props.filter((prop) => prop.type !== GetterPropType.HEADER).map((param) => {
			return adapter.getQueryPropertyForProp(param, body);
		}).join(",");
		const queries = [
			...effectiveUseInfinite ? [{
				name: camel(`${operationName}-infinite`),
				typeName: camel(`${typeName}-infinite`),
				options: query.options,
				type: QueryType.INFINITE,
				queryParam: query.useInfiniteQueryParam,
				queryKeyFnName: camel(`get-${operationName}-infinite-query-key`)
			}] : [],
			...effectiveUseQuery ? [{
				name: operationName,
				typeName,
				options: query.options,
				type: QueryType.QUERY,
				queryKeyFnName: camel(`get-${operationName}-query-key`)
			}] : [],
			...effectiveUseSuspenseQuery ? [{
				name: camel(`${operationName}-suspense`),
				typeName: camel(`${typeName}-suspense`),
				options: query.options,
				type: QueryType.SUSPENSE_QUERY,
				queryKeyFnName: camel(`get-${operationName}-query-key`)
			}] : [],
			...effectiveUseSuspenseInfiniteQuery ? [{
				name: camel(`${operationName}-suspense-infinite`),
				typeName: camel(`${typeName}-suspense-infinite`),
				options: query.options,
				type: QueryType.SUSPENSE_INFINITE,
				queryParam: query.useInfiniteQueryParam,
				queryKeyFnName: camel(`get-${operationName}-infinite-query-key`)
			}] : []
		];
		const uniqueQueryOptionsByKeys = queries.filter((obj, index, self) => index === self.findIndex((t) => t.queryKeyFnName === obj.queryKeyFnName));
		let queryKeyFns = "";
		if (!queryKeyMutator) for (const queryOption of uniqueQueryOptionsByKeys) {
			const queryKeyProps = buildKeyShapedProps({
				props,
				body,
				mutator,
				widenNonPath: makeOptionalParam
			});
			const routeString = adapter.getQueryKeyRouteString(route, !!override.query.shouldSplitQueryKey);
			const queryKeyIdentifier = override.query.useOperationIdAsQueryKey ? `"${operationName}"` : routeString;
			const queryKeyParams = props.filter((p) => override.query.useOperationIdAsQueryKey ? true : p.type === GetterPropType.QUERY_PARAM).toSorted((a) => a.required ? -1 : 1).map((p) => `...(${p.name} ? [${p.name}] : [])`).join(", ");
			const verbPrefix = getQueryKeyVerbPrefix({
				verb,
				useOperationIdAsQueryKey: override.query.useOperationIdAsQueryKey
			});
			queryKeyFns += `
${override.query.shouldExportQueryKey ? "export " : ""}const ${queryOption.queryKeyFnName} = (${queryKeyProps}) => {
    return [
    ${[
				queryOption.type === QueryType.INFINITE || queryOption.type === QueryType.SUSPENSE_INFINITE ? `'infinite'` : "",
				verbPrefix ? `'${verbPrefix}'` : "",
				queryKeyIdentifier,
				queryKeyParams,
				body.implementation
			].filter((x) => !!x).join(", ")}
    ]${override.query.shouldFilterQueryKey ? `.filter(${override.query.queryKeyFilter ?? "q => q !== undefined"})` : " as const"};
    }
`;
		}
		implementation += `
${queryKeyFns}`;
		let queryImplementations = "";
		for (const queryOption of queries) queryImplementations += generateQueryImplementation({
			queryOption,
			operationId,
			operationName,
			typeName,
			queryProperties,
			queryKeyProperties,
			params,
			props,
			body,
			mutator,
			isRequestOptions,
			queryParams,
			response,
			httpClient,
			isExactOptionalPropertyTypes,
			hasSignal: getHasSignal({ overrideQuerySignal: override.query.signal }),
			useRuntimeFetcher: override.fetch.useRuntimeFetcher,
			forceSuccessResponse: override.fetch.forceSuccessResponse,
			queryOptionsMutator,
			queryKeyMutator,
			route,
			doc,
			usePrefetch: query.usePrefetch,
			useQuery: effectiveUseQuery,
			useInfinite: effectiveUseInfinite,
			useInvalidate: query.useInvalidate,
			useSetQueryData: operationQueryOptions?.useSetQueryData ?? query.useSetQueryData,
			useGetQueryData: operationQueryOptions?.useGetQueryData ?? query.useGetQueryData,
			adapter
		});
		implementation += `
    ${queryImplementations}
`;
		mutators = queryOptionsMutator || queryKeyMutator ? [...queryOptionsMutator ? [queryOptionsMutator] : [], ...queryKeyMutator ? [queryKeyMutator] : []] : void 0;
	}
	let imports = [];
	if (isMutation) {
		const mutationResult = await generateMutationHook({
			verbOptions: {
				...verbOptions,
				props
			},
			options,
			isRequestOptions,
			httpClient,
			doc,
			adapter
		});
		implementation += mutationResult.implementation;
		mutators = mutationResult.mutators ? [...mutators ?? [], ...mutationResult.mutators] : mutators;
		imports = mutationResult.imports;
	}
	return {
		implementation,
		mutators,
		imports
	};
};
//#endregion
//#region src/index.ts
const WITH_QUERY_KEY_HELPER = `const withQueryKey = <T extends object, K>(query: T, queryKey: K): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    // The explicit queryKey always wins, matching the previous
    // \`{ ...query, queryKey }\` spread where it was set last.
    if (key === 'queryKey') continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};`;
const generateQueryHeader = (params) => {
	const needsWithQueryKey = params.clientImplementation.includes("withQueryKey(");
	const innerHeader = getQueryHeader(params);
	const innerImpl = typeof innerHeader === "string" ? innerHeader : innerHeader.implementation;
	const innerSharedTypes = typeof innerHeader === "string" ? void 0 : innerHeader.sharedTypes;
	const ownImplementation = `${params.hasAwaitedType ? "" : `type AwaitedInput<T> = PromiseLike<T> | T;\n
      type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;\n\n`}
${params.isRequestOptions && params.isMutator ? `type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];\n\n` : ""}
${innerImpl}
${needsWithQueryKey ? `${WITH_QUERY_KEY_HELPER}\n\n` : ""}`;
	if (innerSharedTypes && innerSharedTypes.length > 0) return {
		implementation: ownImplementation,
		sharedTypes: innerSharedTypes
	};
	return ownImplementation;
};
const generateQuery = async (verbOptions, options, outputClient) => {
	const isZodOutput = typeof options.context.output.schemas === "object" && options.context.output.schemas.type === "zod";
	const responseType = verbOptions.response.definition.success;
	const isPrimitiveResponse = [
		"string",
		"number",
		"boolean",
		"void",
		"unknown"
	].includes(responseType);
	const normalizedVerbOptions = verbOptions.override.query.runtimeValidation && isZodOutput && !isPrimitiveResponse && verbOptions.response.imports.some((imp) => imp.name === responseType) ? {
		...verbOptions,
		response: {
			...verbOptions.response,
			imports: verbOptions.response.imports.map((imp) => imp.name === responseType ? {
				...imp,
				values: true
			} : imp)
		}
	} : verbOptions;
	const adapter = createFrameworkAdapter({
		outputClient,
		packageJson: options.context.output.packageJson,
		queryVersion: normalizedVerbOptions.override.query.version
	});
	const imports = generateVerbImports(normalizedVerbOptions);
	const functionImplementation = adapter.generateRequestFunction(normalizedVerbOptions, options);
	const { implementation: hookImplementation, imports: hookImports, mutators } = await generateQueryHook(normalizedVerbOptions, options, outputClient, adapter);
	const isFetchHttpClient = options.context.output.httpClient !== OutputHttpClient.AXIOS;
	return {
		implementation: `${functionImplementation}\n\n${hookImplementation}`,
		imports: [...imports, ...hookImports],
		mutators,
		...isFetchHttpClient && { docComment: "" }
	};
};
const dependenciesBuilder = {
	"react-query": getReactQueryDependencies,
	"vue-query": getVueQueryDependencies,
	"svelte-query": getSvelteQueryDependencies,
	"angular-query": getAngularQueryDependencies,
	"solid-query": getSolidQueryDependencies
};
const builder = ({ type = "react-query", options: queryOptions, output } = {}) => () => {
	const client = (verbOptions, options, outputClient) => {
		if (options.override.useNamedParameters && (type === "vue-query" || outputClient === "vue-query")) throw new Error(`vue-query client does not support named parameters, and had broken reactivity previously, please set useNamedParameters to false; See for context: https://github.com/orval-labs/orval/pull/931#issuecomment-1752355686`);
		if (queryOptions) {
			const normalizedQueryOptions = normalizeQueryOptions(queryOptions, options.context.workspace);
			verbOptions.override.query = mergeDeep(normalizedQueryOptions, verbOptions.override.query);
			options.override.query = mergeDeep(normalizedQueryOptions, verbOptions.override.query);
		}
		return generateQuery(verbOptions, options, outputClient, output);
	};
	return {
		client,
		header: generateQueryHeader,
		dependencies: dependenciesBuilder[type]
	};
};
//#endregion
export { builder, builder as default, generateQuery, generateQueryHeader, getAngularQueryDependencies, getReactQueryDependencies, getSolidQueryDependencies, getSvelteQueryDependencies, getVueQueryDependencies };

//# sourceMappingURL=index.mjs.map