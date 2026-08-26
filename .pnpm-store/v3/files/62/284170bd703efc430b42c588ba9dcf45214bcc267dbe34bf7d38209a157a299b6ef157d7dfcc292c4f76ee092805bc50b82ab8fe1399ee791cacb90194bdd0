import { createRequire } from "node:module";
import path from "node:path";
import { DefaultTag, FormDataArrayHandling, GetterPropType, NamingConvention, OutputClient, OutputHttpClient, OutputMockType, OutputMode, PropertySortOrder, RefComponentSuffix, SupportedFormatter, asyncReduce, buildDynamicScope, buildSchemaTagMap, collectReferencedComponents, conventionName, createSuccessMessage, dynamicImport, fixCrossDirectoryImports, fixRegularSchemaImports, generateComponentDefinition, generateDependencyImports, generateMutator, generateParameterDefinition, generateSchemasDefinition, generateVerbsOptions, getBaseUrlRuntimeImports, getFileInfo, getFullRoute, getImportExtension, getMockFileExtensionByTypeName, getRefInfo, getRoute, isBoolean, isComponentRef, isFunction, isNullish, isObject, isReference, isString, isUrl, jsDoc, kebab, log, logError, logVerbose, logWarning, pascal, removeFilesAndEmptyFolders, resolveInstalledVersions, resolveRef, resolveValue, splitSchemasByType, upath, writeGeneratedFile, writeSchemas, writeSchemasTagsSplit, writeSingleMode, writeSplitMode, writeSplitTagsMode, writeTagsMode, writeTagsOperationsMode, writeTagsOperationsSplitMode } from "@orval/core";
import { bundle } from "@scalar/json-magic/bundle";
import { fetchUrls, parseJson, parseYaml, readFiles } from "@scalar/json-magic/bundle/plugins/node";
import { upgrade, validate } from "@scalar/openapi-parser";
import fs, { access, readFile } from "node:fs/promises";
import { isNullish as isNullish$1, pick } from "remeda";
import jsYaml from "js-yaml";
import * as mock from "@orval/mock";
import { dedupeStrictMockTypeDeclarations, generateFakerForSchemas, generateMockImports, getDefaultMockOptionsForType } from "@orval/mock";
import angular from "@orval/angular";
import axios from "@orval/axios";
import effect from "@orval/effect";
import fetchClient from "@orval/fetch";
import hono from "@orval/hono";
import mcp from "@orval/mcp";
import query from "@orval/query";
import solidStart from "@orval/solid-start";
import swr from "@orval/swr";
import zod, { assertZodTarget, dereference, generateFormDataZodSchema, generateZodValidationSchemaDefinition, getZodImportSource, getZodTypeName, parseZodValidationSchemaDefinition, resolveIsZodV4 } from "@orval/zod";
import fs$1, { existsSync } from "node:fs";
import { styleText } from "node:util";
import { findUp, findUpMultiple } from "find-up";
import fs$2 from "fs-extra";
import { parseTsconfig } from "get-tsconfig";
import { ExecaError, execa } from "execa";
import { parseArgsStringToArgv } from "string-argv";
import { createJiti } from "jiti";
//#region package.json
var name = "orval";
var version = "8.23.0";
var description = "A swagger client generator for typescript";
//#endregion
//#region src/client.ts
const DEFAULT_CLIENT = OutputClient.AXIOS;
const getGeneratorClient = (outputClient, output) => {
	const angularBuilder = angular();
	const GENERATOR_CLIENT = {
		axios: axios({ type: "axios" })(),
		"axios-functions": axios({ type: "axios-functions" })(),
		angular: angularBuilder(output.override.angular),
		"angular-query": query({
			output,
			type: "angular-query"
		})(),
		"react-query": query({
			output,
			type: "react-query"
		})(),
		"solid-start": solidStart()(),
		"solid-query": query({
			output,
			type: "solid-query"
		})(),
		"svelte-query": query({
			output,
			type: "svelte-query"
		})(),
		"vue-query": query({
			output,
			type: "vue-query"
		})(),
		swr: swr()(),
		zod: zod()(),
		effect: effect()(),
		hono: hono()(),
		fetch: fetchClient()(),
		mcp: mcp()()
	};
	const generator = isFunction(outputClient) ? outputClient(GENERATOR_CLIENT) : GENERATOR_CLIENT[outputClient];
	if (!generator) throw new Error(`Unknown output client provided to getGeneratorClient: ${String(outputClient)}`);
	return generator;
};
const generateClientImports = ({ client, implementation, imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports, hasGlobalMutator, hasTagsMutator, hasParamsSerializerOptions, packageJson, output }) => {
	const { dependencies } = getGeneratorClient(client, output);
	return generateDependencyImports(implementation, dependencies ? [...dependencies(hasGlobalMutator, hasParamsSerializerOptions, packageJson, output.httpClient, hasTagsMutator, output.override), ...imports] : imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports);
};
const generateClientHeader = ({ outputClient = DEFAULT_CLIENT, isRequestOptions, isGlobalMutator, isMutator, provideIn, hasAwaitedType, titles, output, verbOptions, tag, isDefaultTagBucket, clientImplementation }) => {
	const { header } = getGeneratorClient(outputClient, output);
	const rawHeader = header ? header({
		title: titles.implementation,
		isRequestOptions,
		isGlobalMutator,
		isMutator,
		provideIn,
		hasAwaitedType,
		output,
		verbOptions,
		tag,
		isDefaultTagBucket,
		clientImplementation
	}) : "";
	const normalizedHeader = typeof rawHeader === "string" ? { implementation: rawHeader } : rawHeader;
	return {
		implementation: normalizedHeader.implementation,
		implementationMock: `export const ${titles.implementationMock} = () => [\n`,
		sharedTypes: normalizedHeader.sharedTypes
	};
};
const generateClientFooter = ({ outputClient, operationNames, operations, hasMutator, hasAwaitedType, titles, output }) => {
	const { footer } = getGeneratorClient(outputClient, output);
	if (!footer) return {
		implementation: "",
		implementationMock: `\n]\n`
	};
	let implementation;
	try {
		if (isFunction(outputClient)) {
			implementation = footer(operationNames);
			logWarning("⚠️  Passing an array of strings for operations names to the footer function is deprecated and will be removed in a future major release. Please pass them in an object instead: { operationNames: string[] }.");
		} else implementation = footer({
			operationNames,
			operations,
			title: titles.implementation,
			hasMutator,
			hasAwaitedType
		});
	} catch {
		implementation = footer({
			operationNames,
			operations,
			title: titles.implementation,
			hasMutator,
			hasAwaitedType
		});
	}
	return {
		implementation,
		implementationMock: `]\n`
	};
};
const generateClientTitle = ({ outputClient = DEFAULT_CLIENT, title, customTitleFunc, output }) => {
	const { title: generatorTitle } = getGeneratorClient(outputClient, output);
	if (!generatorTitle) return {
		implementation: "",
		implementationMock: `get${pascal(title)}Mock`
	};
	if (customTitleFunc) {
		const customTitle = customTitleFunc(title);
		return {
			implementation: generatorTitle(customTitle),
			implementationMock: `get${pascal(customTitle)}Mock`
		};
	}
	return {
		implementation: generatorTitle(title),
		implementationMock: `get${pascal(title)}Mock`
	};
};
/**
* Invokes the underlying mock generator (msw, faker, or a user-provided
* ClientMockBuilder) for a single generator entry. Returns the standard
* `ClientMockGeneratorBuilder` shape (function/handler/handlerName +
* imports) regardless of which generator handled it.
*/
const invokeMockGenerator = (verbOption, options, entry) => {
	if (isFunction(entry)) return entry(verbOption, {
		...options,
		mock: entry
	});
	return mock.generateMock(verbOption, {
		...options,
		mock: entry
	});
};
const generateOperations = (outputClient = DEFAULT_CLIENT, verbsOptions, options, output) => {
	const baseUrlImports = getBaseUrlRuntimeImports(output.baseUrl);
	return asyncReduce(verbsOptions, async (acc, verbOption) => {
		const { client: generatorClient } = getGeneratorClient(outputClient, output);
		const client = await generatorClient(verbOption, options, outputClient, output);
		if (!client.implementation) return acc;
		const mockOutputs = output.mock.generators.filter((entry) => {
			if (!isFunction(entry) && entry.type === OutputMockType.FAKER && entry.operationResponses === false) return false;
			return true;
		}).map((entry) => {
			const generated = invokeMockGenerator(verbOption, options, entry);
			return {
				type: isFunction(entry) ? OutputMockType.MSW : entry.type,
				implementation: generated.implementation,
				imports: generated.imports,
				strictMockSchemaTypeNames: generated.strictMockSchemaTypeNames,
				strictMockSchemaKinds: generated.strictMockSchemaKinds
			};
		});
		const hasImplementation = client.implementation.trim().length > 0;
		const preferredOperationKey = verbOption.operationName;
		const baseOperationKey = verbOption.operationId ? `${verbOption.operationId}::${verbOption.operationName}` : verbOption.operationName;
		let operationKey = Object.hasOwn(acc, preferredOperationKey) ? baseOperationKey : preferredOperationKey;
		let collisionIndex = 1;
		while (Object.hasOwn(acc, operationKey)) {
			collisionIndex += 1;
			operationKey = `${baseOperationKey}::${collisionIndex}`;
		}
		acc[operationKey] = {
			implementation: hasImplementation ? (client.docComment ?? verbOption.doc) + client.implementation : client.implementation,
			imports: [...baseUrlImports, ...client.imports],
			mockOutputs,
			tags: verbOption.tags,
			mutator: verbOption.mutator,
			clientMutators: client.mutators,
			formData: verbOption.formData,
			formUrlEncoded: verbOption.formUrlEncoded,
			paramsSerializer: verbOption.paramsSerializer,
			paramsFilter: verbOption.paramsFilter,
			operationName: verbOption.operationName,
			fetchReviver: verbOption.fetchReviver,
			...client.returnType ? { types: { result: client.returnType } } : void 0
		};
		return acc;
	}, {});
};
const generateExtraFiles = (outputClient = DEFAULT_CLIENT, verbsOptions, output, context) => {
	const { extraFiles: generateExtraFiles } = getGeneratorClient(outputClient, output);
	if (!generateExtraFiles) return Promise.resolve([]);
	return generateExtraFiles(verbsOptions, output, context);
};
//#endregion
//#region src/api.ts
async function getApiBuilder({ input, output, context }) {
	const api = await asyncReduce(Object.entries(context.spec.paths ?? {}), async (acc, [pathRoute, verbs]) => {
		if (!verbs) return acc;
		const route = getRoute(pathRoute);
		let resolvedVerbs = verbs;
		if (isReference(verbs)) {
			const { schema } = resolveRef(verbs, context);
			resolvedVerbs = schema;
		}
		let verbsOptions = await generateVerbsOptions({
			verbs: resolvedVerbs,
			input,
			output,
			route,
			pathRoute,
			context
		});
		if (output.override.useDeprecatedOperations === false) verbsOptions = verbsOptions.filter((verb) => {
			return !verb.deprecated;
		});
		const schemas = [];
		for (const { queryParams, headers, body, response, props } of verbsOptions) {
			schemas.push(...props.flatMap((param) => param.type === GetterPropType.NAMED_PATH_PARAMS ? param.schema : []));
			if (queryParams) schemas.push(queryParams.schema, ...queryParams.deps);
			if (headers) schemas.push(headers.schema, ...headers.deps);
			schemas.push(...body.schemas, ...response.schemas);
		}
		const fullRoute = getFullRoute(route, resolvedVerbs.servers ?? context.spec.servers, output.baseUrl);
		if (!output.target) throw new Error("Output does not have a target");
		const pathOperations = await generateOperations(output.client, verbsOptions, {
			route: fullRoute,
			pathRoute,
			override: output.override,
			context,
			output: output.target
		}, output);
		for (const verbOption of verbsOptions) acc.verbOptions[verbOption.operationId] = verbOption;
		acc.schemas.push(...schemas);
		for (const [key, value] of Object.entries(pathOperations)) {
			let operationKey = key;
			let counter = 1;
			while (Object.hasOwn(acc.operations, operationKey)) operationKey = `${key}::${++counter}`;
			acc.operations[operationKey] = value;
		}
		return acc;
	}, {
		operations: {},
		verbOptions: {},
		schemas: []
	});
	const extraFiles = await generateExtraFiles(output.client, api.verbOptions, output, context);
	return {
		operations: api.operations,
		schemas: api.schemas,
		verbOptions: api.verbOptions,
		title: generateClientTitle,
		header: generateClientHeader,
		footer: generateClientFooter,
		imports: generateClientImports,
		importsMock: generateMockImports,
		finalizeMockImplementation: dedupeStrictMockTypeDeclarations,
		extraFiles
	};
}
//#endregion
//#region src/import-open-api.ts
function filterSpecComponents(spec, input) {
	const filters = input.filters;
	if (!filters?.tags || filters.schemas) return spec;
	const referenced = collectReferencedComponents(spec, filters.tags, filters.mode);
	const allSchemas = spec.components?.schemas ?? {};
	return {
		...spec,
		components: {
			...spec.components,
			schemas: filters.includeUnreferencedSchemas ? allSchemas : pick(allSchemas, referenced.schemas),
			responses: pick(spec.components?.responses ?? {}, referenced.responses),
			parameters: pick(spec.components?.parameters ?? {}, referenced.parameters),
			requestBodies: pick(spec.components?.requestBodies ?? {}, referenced.requestBodies)
		}
	};
}
async function importOpenApi({ spec, input, output, target, workspace, projectName }) {
	const filteredSpec = filterSpecComponents(spec, input);
	const schemas = getApiSchemas({
		input,
		output,
		target,
		workspace,
		spec: filteredSpec
	});
	const api = await getApiBuilder({
		input,
		output,
		context: {
			projectName,
			target,
			workspace,
			spec: filteredSpec,
			output
		}
	});
	return {
		...api,
		schemas: [...schemas, ...api.schemas],
		target,
		info: filteredSpec.info,
		spec: filteredSpec
	};
}
function getApiSchemas({ input, output, target, workspace, spec }) {
	const context = {
		target,
		workspace,
		spec,
		output
	};
	const schemaDefinition = generateSchemasDefinition(spec.components?.schemas, context, output.override.components.schemas.suffix, input.filters);
	const responseDefinition = generateComponentDefinition(spec.components?.responses, context, output.override.components.responses.suffix);
	const swaggerResponseDefinition = generateComponentDefinition("responses" in spec ? spec.responses : void 0, context, "");
	const bodyDefinition = generateComponentDefinition(spec.components?.requestBodies, context, output.override.components.requestBodies.suffix);
	const parameters = generateParameterDefinition(spec.components?.parameters, context, output.override.components.parameters.suffix);
	return [
		...schemaDefinition,
		...responseDefinition,
		...swaggerResponseDefinition,
		...bodyDefinition,
		...parameters
	];
}
//#endregion
//#region src/utils/package-json.ts
const loadPackageJson = async (packageJson, workspace = process.cwd()) => {
	if (!packageJson) {
		const pkgPath = await findUp(["package.json"], { cwd: workspace });
		if (pkgPath) {
			const pkg = await dynamicImport(pkgPath, workspace);
			if (isPackageJson(pkg)) return resolveAndAttachVersions(await maybeReplaceCatalog(pkg, workspace), workspace, pkgPath);
			else throw new Error("Invalid package.json file");
		}
		return;
	}
	const normalizedPath = normalizePath(packageJson, workspace);
	if (fs$2.existsSync(normalizedPath)) {
		const pkg = await dynamicImport(normalizedPath);
		if (isPackageJson(pkg)) return resolveAndAttachVersions(await maybeReplaceCatalog(pkg, workspace), workspace, normalizedPath);
		else throw new Error(`Invalid package.json file: ${normalizedPath}`);
	}
};
const isPackageJson = (obj) => isObject(obj);
const resolvedCache = /* @__PURE__ */ new Map();
const resolveAndAttachVersions = (pkg, workspace, cacheKey) => {
	const cached = resolvedCache.get(cacheKey);
	if (cached) {
		pkg.resolvedVersions = cached;
		return pkg;
	}
	const resolved = resolveInstalledVersions(pkg, workspace);
	if (Object.keys(resolved).length > 0) {
		pkg.resolvedVersions = resolved;
		resolvedCache.set(cacheKey, resolved);
		for (const [name, version] of Object.entries(resolved)) logVerbose(styleText("dim", `Detected ${styleText("white", name)} v${styleText("white", version)}`));
	}
	return pkg;
};
const hasCatalogReferences = (pkg) => {
	return [
		...Object.entries(pkg.dependencies ?? {}),
		...Object.entries(pkg.devDependencies ?? {}),
		...Object.entries(pkg.peerDependencies ?? {})
	].some(([, value]) => isString(value) && value.startsWith("catalog:"));
};
const loadPnpmWorkspaceCatalog = async (workspace) => {
	const filePath = await findUp("pnpm-workspace.yaml", { cwd: workspace });
	if (!filePath) return void 0;
	try {
		const file = await fs$2.readFile(filePath, "utf8");
		const data = jsYaml.load(file);
		if (!data?.catalog && !data?.catalogs) return void 0;
		return {
			catalog: data.catalog,
			catalogs: data.catalogs
		};
	} catch {
		return;
	}
};
const loadPackageJsonCatalog = async (workspace) => {
	const filePaths = await findUpMultiple("package.json", { cwd: workspace });
	for (const filePath of filePaths) try {
		const pkg = await fs$2.readJson(filePath);
		if (pkg.catalog || pkg.catalogs) return {
			catalog: pkg.catalog,
			catalogs: pkg.catalogs
		};
	} catch {}
};
const loadYarnrcCatalog = async (workspace) => {
	const filePath = await findUp(".yarnrc.yml", { cwd: workspace });
	if (!filePath) return void 0;
	try {
		const file = await fs$2.readFile(filePath, "utf8");
		const data = jsYaml.load(file);
		if (!data?.catalog && !data?.catalogs) return void 0;
		return {
			catalog: data.catalog,
			catalogs: data.catalogs
		};
	} catch {
		return;
	}
};
const maybeReplaceCatalog = async (pkg, workspace) => {
	if (!hasCatalogReferences(pkg)) return pkg;
	const catalogData = await loadPnpmWorkspaceCatalog(workspace) ?? await loadPackageJsonCatalog(workspace) ?? await loadYarnrcCatalog(workspace);
	if (!catalogData) {
		logWarning("⚠️  package.json contains catalog: references, but no catalog source was found (checked: pnpm-workspace.yaml, package.json, .yarnrc.yml).");
		return pkg;
	}
	performSubstitution(pkg.dependencies, catalogData);
	performSubstitution(pkg.devDependencies, catalogData);
	performSubstitution(pkg.peerDependencies, catalogData);
	return pkg;
};
const performSubstitution = (dependencies, catalogData) => {
	if (!dependencies) return;
	for (const [packageName, version] of Object.entries(dependencies)) if (version === "catalog:" || version === "catalog:default") {
		if (!catalogData.catalog) {
			logWarning(`⚠️  catalog: substitution for the package '${packageName}' failed as there is no default catalog.`);
			continue;
		}
		const sub = catalogData.catalog[packageName];
		if (!sub) {
			logWarning(`⚠️  catalog: substitution for the package '${packageName}' failed as there is no matching package in the default catalog.`);
			continue;
		}
		dependencies[packageName] = sub;
	} else if (version.startsWith("catalog:")) {
		const catalogName = version.slice(8);
		const catalog = catalogData.catalogs?.[catalogName];
		if (!catalog) {
			logWarning(`⚠️  '${version}' substitution for the package '${packageName}' failed as there is no matching catalog named '${catalogName}'. (available named catalogs are: ${Object.keys(catalogData.catalogs ?? {}).join(", ")})`);
			continue;
		}
		const sub = catalog[packageName];
		if (!sub) {
			logWarning(`⚠️  '${version}' substitution for the package '${packageName}' failed as there is no package in the catalog named '${catalogName}'. (packages in the catalog are: ${Object.keys(catalog).join(", ")})`);
			continue;
		}
		dependencies[packageName] = sub;
	}
};
//#endregion
//#region src/utils/tsconfig.ts
const convertTarget = (config) => {
	if (!config.compilerOptions?.target) return {
		baseUrl: config.compilerOptions?.baseUrl,
		...config
	};
	const lowercaseTarget = config.compilerOptions.target.toLowerCase();
	return {
		baseUrl: config.compilerOptions.baseUrl,
		...config,
		compilerOptions: {
			...config.compilerOptions,
			target: lowercaseTarget
		}
	};
};
const loadTsconfig = async (tsconfig, workspace = process.cwd()) => {
	if (isNullish(tsconfig)) {
		const configPath = await findUp(["tsconfig.json", "jsconfig.json"], { cwd: workspace });
		if (configPath) return convertTarget(parseTsconfig(configPath));
		return;
	}
	if (isString(tsconfig)) {
		const normalizedPath = normalizePath(tsconfig, workspace);
		if (fs$2.existsSync(normalizedPath)) return convertTarget(parseTsconfig(normalizedPath));
		return;
	}
	if (isObject(tsconfig)) return tsconfig;
};
//#endregion
//#region src/utils/options.ts
const INPUT_TARGET_FETCH_TIMEOUT_MS = 1e4;
/**
* Type helper to make it easier to use orval.config.ts
* accepts a direct {@link ConfigExternal} object.
*/
function defineConfig(options) {
	return options;
}
/**
* Type helper to make it easier to write input transformers.
* accepts a direct {@link InputTransformerFn} function.
*/
function defineTransformer(transformer) {
	return transformer;
}
function createFormData(workspace, formData) {
	const defaultArrayHandling = FormDataArrayHandling.SERIALIZE;
	if (formData === void 0) return {
		disabled: false,
		arrayHandling: defaultArrayHandling
	};
	if (isBoolean(formData)) return {
		disabled: !formData,
		arrayHandling: defaultArrayHandling
	};
	if (isString(formData)) return {
		disabled: false,
		mutator: normalizeMutator(workspace, formData),
		arrayHandling: defaultArrayHandling
	};
	if ("mutator" in formData || "arrayHandling" in formData) return {
		disabled: false,
		mutator: normalizeMutator(workspace, formData.mutator),
		arrayHandling: formData.arrayHandling ?? defaultArrayHandling
	};
	return {
		disabled: false,
		mutator: normalizeMutator(workspace, formData),
		arrayHandling: defaultArrayHandling
	};
}
function normalizeSchemasOption(schemas, workspace) {
	if (!schemas) return;
	if (isString(schemas)) return normalizePath(schemas, workspace);
	if (!isString(schemas.path) || schemas.path.trim() === "") throw new Error(styleText("red", `\`schemas.path\` is required when \`schemas\` is an object (e.g. \`schemas: { path: './model', type: 'zod' }\`). To generate schemas alongside the target instead, omit \`schemas\` or set \`schemas: false\`.`));
	validatePackageSpecifier(schemas.importPath, "schemas.importPath");
	return {
		path: normalizePath(schemas.path, workspace),
		type: schemas.type ?? "typescript",
		importPath: schemas.importPath,
		splitByTags: schemas.splitByTags ?? false
	};
}
/**
* Validates that a config value is a valid package specifier (bare specifier
* or sub-path import like `@acme/models` / `@acme/models/fakers`). Rejects
* empty, whitespace-only, relative (`./`, `../`), and absolute paths with a
* clear, actionable error message. No-op when the value is `undefined`.
*/
function validatePackageSpecifier(value, fieldName) {
	if (value === void 0) return;
	if (!value) throw new Error(`\`${fieldName}\` must be a non-empty package specifier (e.g. '@acme/models'). Received an empty string.`);
	if (value.trim() === "") throw new Error(`\`${fieldName}\` must be a non-empty package specifier (e.g. '@acme/models'). Received a whitespace-only string.`);
	if (value.trim() !== value) throw new Error(`\`${fieldName}\` must be a non-empty package specifier (e.g. '@acme/models'). Received a value with leading or trailing whitespace: "${value}"`);
	if (value.startsWith(".")) throw new Error(`\`${fieldName}\` must be a package specifier (e.g. '@acme/models'), not a relative path. Received: "${value}"`);
	if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\")) throw new Error(`\`${fieldName}\` must be a package specifier (e.g. '@acme/models'), not an absolute path. Received: "${value}"`);
}
function looksLikePackageSpecifier(value) {
	return !!value && value.trim() === value && !value.startsWith(".") && !path.isAbsolute(value) && !/^[A-Za-z]:[\\/]/.test(value) && !value.startsWith("\\\\");
}
function resolvePackageSpecifier(workspace, value) {
	try {
		return createRequire(path.join(workspace, "package.json")).resolve(value);
	} catch {
		return;
	}
}
function isPackageSpecifierCandidate(workspace, value) {
	if (!looksLikePackageSpecifier(value)) return false;
	if (existsSync(path.resolve(workspace, value))) return false;
	if (value.startsWith("@")) return true;
	const [packageName] = value.split("/");
	if (!value.includes("/")) return true;
	for (let dir = workspace;;) {
		if (existsSync(path.join(dir, "node_modules", packageName))) return true;
		const parent = path.dirname(dir);
		if (parent === dir) return false;
		dir = parent;
	}
}
function normalizeEffectOptions(effect) {
	return {
		strict: {
			param: effect?.strict?.param ?? false,
			query: effect?.strict?.query ?? false,
			header: effect?.strict?.header ?? false,
			body: effect?.strict?.body ?? false,
			response: effect?.strict?.response ?? false
		},
		generate: {
			param: effect?.generate?.param ?? true,
			query: effect?.generate?.query ?? true,
			header: effect?.generate?.header ?? true,
			body: effect?.generate?.body ?? true,
			response: effect?.generate?.response ?? true
		},
		generateEachHttpStatus: effect?.generateEachHttpStatus ?? false,
		useBrandedTypes: effect?.useBrandedTypes ?? false,
		exactOptional: effect?.exactOptional ?? false
	};
}
async function normalizeOptions(optionsExport, workspace = process.cwd(), globalOptions = {}) {
	const options = await (isFunction(optionsExport) ? optionsExport() : optionsExport);
	if (!options.input) throw new Error(styleText("red", `Config requires an input.`));
	if (!options.output) throw new Error(styleText("red", `Config requires an output.`));
	const inputOptions = isString(options.input) || Array.isArray(options.input) ? { target: options.input } : options.input;
	const outputOptions = isString(options.output) ? { target: options.output } : options.output;
	const outputWorkspace = normalizePath(outputOptions.workspace ?? "", workspace);
	const { clean, client, httpClient, mode } = globalOptions;
	const tsconfig = await loadTsconfig(outputOptions.tsconfig ?? globalOptions.tsconfig, workspace);
	const packageJson = await loadPackageJson(outputOptions.packageJson ?? globalOptions.packageJson, workspace);
	const mocksOption = outputOptions.mock ?? globalOptions.mock;
	let mocks = {
		indexMockFiles: false,
		generators: []
	};
	if (isBoolean(mocksOption) && mocksOption) mocks = {
		indexMockFiles: false,
		generators: [getDefaultMockOptionsForType(OutputMockType.MSW), getDefaultMockOptionsForType(OutputMockType.FAKER)]
	};
	else if (isFunction(mocksOption)) mocks = {
		indexMockFiles: false,
		generators: [mocksOption]
	};
	else if (mocksOption && typeof mocksOption === "object") {
		if (!Array.isArray(mocksOption.generators)) throw new TypeError("mock.generators must be an array of generator entries (e.g. [{ type: \"msw\" }]).");
		const sharedMockPath = mocksOption.path && isString(mocksOption.path) ? normalizePath(mocksOption.path, outputWorkspace) : void 0;
		mocks = {
			indexMockFiles: mocksOption.indexMockFiles ?? false,
			path: sharedMockPath,
			generators: mocksOption.generators.map((m) => isFunction(m) ? m : {
				...getDefaultMockOptionsForType(m.type),
				...m,
				path: m.path && isString(m.path) ? normalizePath(m.path, outputWorkspace) : sharedMockPath
			})
		};
	}
	const seenMockTypes = /* @__PURE__ */ new Set();
	for (const entry of mocks.generators) {
		if (isFunction(entry)) continue;
		if (seenMockTypes.has(entry.type)) throw new Error(`Duplicate mock generator type "${entry.type}". Each type can only appear once in mock.generators.`);
		seenMockTypes.add(entry.type);
		if (entry.type === OutputMockType.FAKER) validatePackageSpecifier(entry.schemasImportPath, "mock.generators[faker].schemasImportPath");
	}
	const defaultFileExtension = ".ts";
	const defaultSchemaFileExtension = !!outputOptions.schemas && (!isString(outputOptions.schemas) && outputOptions.schemas.type === "zod" || isString(outputOptions.schemas) && (outputOptions.client ?? client) === "zod" && outputOptions.override?.zod?.generateReusableSchemas === true) ? ".zod.ts" : defaultFileExtension;
	const factoryMethodsConfig = outputOptions.factoryMethods;
	let factoryMethods = void 0;
	if (factoryMethodsConfig) factoryMethods = {
		functionNamePrefix: factoryMethodsConfig.functionNamePrefix ?? "create",
		mode: factoryMethodsConfig.mode ?? "split",
		outputDirectory: factoryMethodsConfig.outputDirectory ? normalizePath(factoryMethodsConfig.outputDirectory, outputWorkspace) : outputOptions.schemas ? normalizePath(isString(outputOptions.schemas) ? outputOptions.schemas : outputOptions.schemas.path, outputWorkspace) : normalizePath(outputWorkspace, outputWorkspace),
		includeOptionalProperty: factoryMethodsConfig.includeOptionalProperty ?? true
	};
	const globalQueryOptions = {
		signal: true,
		shouldExportMutatorHooks: true,
		shouldExportHttpClient: true,
		shouldExportQueryKey: true,
		shouldFilterQueryKey: false,
		shouldSplitQueryKey: false,
		...normalizeQueryOptions(outputOptions.override?.query, outputWorkspace)
	};
	const normalizedOptions = {
		input: {
			target: globalOptions.input ? Array.isArray(globalOptions.input) ? await resolveFirstValidTarget(globalOptions.input, process.cwd(), inputOptions.parserOptions) : normalizePathOrUrl(globalOptions.input, process.cwd()) : Array.isArray(inputOptions.target) ? await resolveFirstValidTarget(inputOptions.target, workspace, inputOptions.parserOptions) : normalizePathOrUrl(inputOptions.target, workspace),
			override: { transformer: normalizePath(inputOptions.override?.transformer, workspace) },
			unsafeDisableValidation: inputOptions.unsafeDisableValidation ?? false,
			filters: inputOptions.filters,
			parserOptions: inputOptions.parserOptions
		},
		output: {
			target: globalOptions.output ? normalizePath(globalOptions.output, process.cwd()) : normalizePath(outputOptions.target, outputWorkspace),
			schemas: normalizeSchemasOption(outputOptions.schemas, outputWorkspace),
			operationSchemas: outputOptions.operationSchemas ? normalizePath(outputOptions.operationSchemas, outputWorkspace) : void 0,
			namingConvention: outputOptions.namingConvention ?? NamingConvention.CAMEL_CASE,
			fileExtension: outputOptions.fileExtension ?? defaultFileExtension,
			schemaFileExtension: outputOptions.schemaFileExtension ?? outputOptions.fileExtension ?? defaultSchemaFileExtension,
			workspace: outputOptions.workspace ? outputWorkspace : void 0,
			client: outputOptions.client ?? client ?? OutputClient.AXIOS_FUNCTIONS,
			httpClient: outputOptions.httpClient ?? httpClient ?? ((outputOptions.client ?? client) === OutputClient.ANGULAR_QUERY ? OutputHttpClient.ANGULAR : OutputHttpClient.FETCH),
			mode: normalizeOutputMode(outputOptions.mode ?? mode),
			mock: mocks,
			clean: outputOptions.clean ?? clean ?? false,
			docs: outputOptions.docs ?? false,
			formatter: outputOptions.formatter ?? globalOptions.formatter,
			tsconfig,
			packageJson,
			headers: outputOptions.headers ?? false,
			indexFiles: outputOptions.indexFiles ?? true,
			baseUrl: outputOptions.baseUrl,
			unionAddMissingProperties: outputOptions.unionAddMissingProperties ?? false,
			factoryMethods,
			tagsSplitDeduplication: outputOptions.tagsSplitDeduplication ?? false,
			commonTypesFileName: outputOptions.commonTypesFileName ?? "common-types",
			override: {
				...outputOptions.override,
				mock: {
					arrayMin: outputOptions.override?.mock?.arrayMin ?? 1,
					arrayMax: outputOptions.override?.mock?.arrayMax ?? 10,
					stringMin: outputOptions.override?.mock?.stringMin ?? 10,
					stringMax: outputOptions.override?.mock?.stringMax ?? 20,
					fractionDigits: outputOptions.override?.mock?.fractionDigits ?? 2,
					...outputOptions.override?.mock
				},
				operations: normalizeOperationsAndTags(outputOptions.override?.operations ?? {}, outputWorkspace, { query: globalQueryOptions }, "operations"),
				tags: normalizeOperationsAndTags(outputOptions.override?.tags ?? {}, outputWorkspace, { query: globalQueryOptions }, "tags"),
				mutator: normalizeMutator(outputWorkspace, outputOptions.override?.mutator),
				formData: createFormData(outputWorkspace, outputOptions.override?.formData),
				formUrlEncoded: (isBoolean(outputOptions.override?.formUrlEncoded) ? outputOptions.override.formUrlEncoded : normalizeMutator(outputWorkspace, outputOptions.override?.formUrlEncoded)) ?? true,
				paramsSerializer: normalizeMutator(outputWorkspace, outputOptions.override?.paramsSerializer),
				paramsFilter: normalizeMutator(outputWorkspace, outputOptions.override?.paramsFilter),
				header: outputOptions.override?.header === false ? false : isFunction(outputOptions.override?.header) ? outputOptions.override.header : getDefaultFilesHeader,
				requestOptions: outputOptions.override?.requestOptions ?? true,
				namingConvention: outputOptions.override?.namingConvention ?? {},
				components: {
					schemas: {
						suffix: RefComponentSuffix.schemas,
						itemSuffix: outputOptions.override?.components?.schemas?.itemSuffix ?? "Item",
						...outputOptions.override?.components?.schemas
					},
					responses: {
						suffix: RefComponentSuffix.responses,
						...outputOptions.override?.components?.responses
					},
					parameters: {
						suffix: RefComponentSuffix.parameters,
						...outputOptions.override?.components?.parameters
					},
					requestBodies: {
						suffix: RefComponentSuffix.requestBodies,
						...outputOptions.override?.components?.requestBodies
					}
				},
				hono: normalizeHonoOptions(outputOptions.override?.hono, workspace),
				mcp: normalizeMcpOptions(outputOptions.override?.mcp, workspace),
				jsDoc: normalizeJSDocOptions(outputOptions.override?.jsDoc),
				query: globalQueryOptions,
				zod: {
					strict: {
						param: outputOptions.override?.zod?.strict?.param ?? false,
						query: outputOptions.override?.zod?.strict?.query ?? false,
						header: outputOptions.override?.zod?.strict?.header ?? false,
						body: outputOptions.override?.zod?.strict?.body ?? false,
						response: outputOptions.override?.zod?.strict?.response ?? false
					},
					generate: {
						param: outputOptions.override?.zod?.generate?.param ?? true,
						query: outputOptions.override?.zod?.generate?.query ?? true,
						header: outputOptions.override?.zod?.generate?.header ?? true,
						body: outputOptions.override?.zod?.generate?.body ?? true,
						response: outputOptions.override?.zod?.generate?.response ?? true
					},
					coerce: {
						param: outputOptions.override?.zod?.coerce?.param ?? false,
						query: outputOptions.override?.zod?.coerce?.query ?? false,
						header: outputOptions.override?.zod?.coerce?.header ?? false,
						body: outputOptions.override?.zod?.coerce?.body ?? false,
						response: outputOptions.override?.zod?.coerce?.response ?? false
					},
					preprocess: {
						...outputOptions.override?.zod?.preprocess?.param ? { param: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.param) } : {},
						...outputOptions.override?.zod?.preprocess?.query ? { query: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.query) } : {},
						...outputOptions.override?.zod?.preprocess?.header ? { header: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.header) } : {},
						...outputOptions.override?.zod?.preprocess?.body ? { body: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.body) } : {},
						...outputOptions.override?.zod?.preprocess?.response ? { response: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.response) } : {}
					},
					...outputOptions.override?.zod?.params ? { params: normalizeMutator(outputWorkspace, outputOptions.override.zod.params) } : {},
					variant: outputOptions.override?.zod?.variant ?? "classic",
					version: outputOptions.override?.zod?.version ?? "auto",
					generateEachHttpStatus: outputOptions.override?.zod?.generateEachHttpStatus ?? false,
					useBrandedTypes: outputOptions.override?.zod?.useBrandedTypes ?? false,
					generateReusableSchemas: outputOptions.override?.zod?.generateReusableSchemas ?? false,
					generateMeta: outputOptions.override?.zod?.generateMeta ?? false,
					generateDiscriminatedUnion: outputOptions.override?.zod?.generateDiscriminatedUnion ?? false,
					exactOptional: outputOptions.override?.zod?.exactOptional ?? false,
					dateTimeOptions: outputOptions.override?.zod?.dateTimeOptions ?? { offset: true },
					timeOptions: outputOptions.override?.zod?.timeOptions ?? {}
				},
				effect: normalizeEffectOptions(outputOptions.override?.effect),
				swr: {
					generateErrorTypes: false,
					...outputOptions.override?.swr
				},
				angular: {
					provideIn: outputOptions.override?.angular?.provideIn ?? "root",
					client: outputOptions.override?.angular?.retrievalClient ?? outputOptions.override?.angular?.client ?? "httpClient",
					runtimeValidation: outputOptions.override?.angular?.runtimeValidation ?? false,
					queryObjectSerialization: outputOptions.override?.angular?.queryObjectSerialization ?? "spec",
					...outputOptions.override?.angular?.httpResource ? { httpResource: outputOptions.override.angular.httpResource } : {}
				},
				fetch: {
					includeHttpResponseReturnType: outputOptions.override?.fetch?.includeHttpResponseReturnType ?? true,
					forceSuccessResponse: outputOptions.override?.fetch?.forceSuccessResponse ?? false,
					runtimeValidation: outputOptions.override?.fetch?.runtimeValidation ?? false,
					useRuntimeFetcher: outputOptions.override?.fetch?.useRuntimeFetcher ?? false,
					...outputOptions.override?.fetch?.arrayFormat ? { arrayFormat: outputOptions.override.fetch.arrayFormat } : {},
					...outputOptions.override?.fetch,
					...outputOptions.override?.fetch?.jsonReviver ? { jsonReviver: normalizeMutator(outputWorkspace, outputOptions.override.fetch.jsonReviver) } : {}
				},
				useDates: outputOptions.override?.useDates ?? false,
				useDeprecatedOperations: outputOptions.override?.useDeprecatedOperations ?? true,
				enumGenerationType: outputOptions.override?.enumGenerationType ?? "const",
				suppressReadonlyModifier: outputOptions.override?.suppressReadonlyModifier ?? false,
				preserveReadonlyRequestBodies: outputOptions.override?.preserveReadonlyRequestBodies ?? "strip",
				splitByContentType: outputOptions.override?.splitByContentType ?? false,
				aliasCombinedTypes: outputOptions.override?.aliasCombinedTypes ?? false
			},
			allParamsOptional: outputOptions.allParamsOptional ?? false,
			urlEncodeParameters: outputOptions.urlEncodeParameters ?? false,
			optionsParamRequired: outputOptions.optionsParamRequired ?? false,
			propertySortOrder: outputOptions.propertySortOrder ?? PropertySortOrder.SPECIFICATION
		},
		hooks: options.hooks ? normalizeHooks(options.hooks) : {}
	};
	if (!normalizedOptions.input.target) throw new Error(styleText("red", `Config requires an input target.`));
	if (!normalizedOptions.output.target && !normalizedOptions.output.schemas) throw new Error(styleText("red", `Config requires an output target or schemas.`));
	const fakerWithSchemasImportPath = normalizedOptions.output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && !!g.schemasImportPath);
	if (fakerWithSchemasImportPath) {
		if (fakerWithSchemasImportPath.schemas !== true) throw new Error(styleText("red", `\`mock.generators[faker].schemasImportPath\` requires \`schemas: true\` on the same generator. Schema-level faker factories are only emitted when \`schemas: true\`.`));
		if (!(isObject(normalizedOptions.output.schemas) && normalizedOptions.output.schemas.importPath)) throw new Error(styleText("red", `\`mock.generators[faker].schemasImportPath\` requires \`schemas.importPath\` to also be set. It overrides the package specifier used for importing schema-level faker factories.`));
	}
	const usesAngularGenerator = normalizedOptions.output.client === OutputClient.ANGULAR || normalizedOptions.output.client === OutputClient.ANGULAR_QUERY && normalizedOptions.output.httpClient === OutputHttpClient.ANGULAR;
	if (normalizedOptions.output.override.paramsFilter && !usesAngularGenerator) throw new Error(styleText("red", `\`override.paramsFilter\` is only supported by the Angular generator (the \`angular\` client, or \`angular-query\` with \`httpClient: 'angular'\`). It has no effect for other clients — use \`override.paramsSerializer\` instead.`));
	if (!usesAngularGenerator) {
		const offendingOperation = Object.entries(normalizedOptions.output.override.operations).find(([, opOverride]) => opOverride?.paramsFilter)?.[0];
		if (offendingOperation) throw new Error(styleText("red", `\`override.operations["${offendingOperation}"].paramsFilter\` is only supported by the Angular generator (the \`angular\` client, or \`angular-query\` with \`httpClient: 'angular'\`). It has no effect for other clients — use \`override.paramsSerializer\` instead.`));
		const offendingTag = Object.entries(normalizedOptions.output.override.tags).find(([, tagOverride]) => tagOverride?.paramsFilter)?.[0];
		if (offendingTag) throw new Error(styleText("red", `\`override.tags["${offendingTag}"].paramsFilter\` is only supported by the Angular generator (the \`angular\` client, or \`angular-query\` with \`httpClient: 'angular'\`). It has no effect for other clients — use \`override.paramsSerializer\` instead.`));
	}
	if (normalizedOptions.output.httpClient === OutputHttpClient.FETCH && normalizedOptions.output.optionsParamRequired && normalizedOptions.output.override.requestOptions !== false) logWarning(`⚠️  With \`httpClient: 'fetch'\`, \`optionsParamRequired: true\` cannot make the generated \`options\` parameter required. The fetch \`options\` parameter remains optional with type \`RequestInit\` (\`optionsParamRequired\` may still affect other generated parameters). Set \`httpClient: 'axios'\` to make the \`options\` parameter required.`);
	return normalizedOptions;
}
function normalizeMutator(workspace, mutator) {
	if (isObject(mutator)) {
		const m = mutator;
		if (!m.path) throw new Error(styleText("red", `Mutator requires a path.`));
		const resolvedPath = looksLikePackageSpecifier(m.path) ? resolvePackageSpecifier(workspace, m.path) : void 0;
		return {
			path: !!resolvedPath || isPackageSpecifierCandidate(workspace, m.path) ? m.path : path.resolve(workspace, m.path),
			...resolvedPath ? { resolvedPath } : {},
			name: m.name,
			default: m.default ?? !m.name,
			alias: m.alias,
			external: m.external,
			extension: m.extension
		};
	}
	if (isString(mutator)) {
		const resolvedPath = looksLikePackageSpecifier(mutator) ? resolvePackageSpecifier(workspace, mutator) : void 0;
		return {
			path: !!resolvedPath || isPackageSpecifierCandidate(workspace, mutator) ? mutator : path.resolve(workspace, mutator),
			...resolvedPath ? { resolvedPath } : {},
			default: true
		};
	}
}
async function resolveFirstValidTarget(targets, workspace, parserOptions) {
	for (const target of targets) {
		if (isUrl(target)) {
			try {
				const headers = getHeadersForUrl(target, parserOptions?.headers);
				const headResponse = await fetchWithTimeout(target, {
					method: "HEAD",
					headers
				});
				if (headResponse.ok) return target;
				if (headResponse.status === 405 || headResponse.status === 501) {
					if ((await fetchWithTimeout(target, {
						method: "GET",
						headers
					})).ok) return target;
				}
			} catch {
				continue;
			}
			continue;
		}
		const resolvedTarget = normalizePath(target, workspace);
		try {
			await access(resolvedTarget);
			return resolvedTarget;
		} catch {
			continue;
		}
	}
	throw new Error(styleText("red", `None of the input targets could be resolved:\n${targets.map((target) => `  - ${target}`).join("\n")}`));
}
function getHeadersForUrl(url, headersConfig) {
	if (!headersConfig) return {};
	const { hostname } = new URL(url);
	const matchedHeaders = {};
	for (const headerEntry of headersConfig) if (headerEntry.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) Object.assign(matchedHeaders, headerEntry.headers);
	return matchedHeaders;
}
async function fetchWithTimeout(target, init) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => {
		controller.abort();
	}, INPUT_TARGET_FETCH_TIMEOUT_MS);
	try {
		return await fetch(target, {
			...init,
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeoutId);
	}
}
function normalizePathOrUrl(path, workspace) {
	if (isString(path) && !isUrl(path)) return normalizePath(path, workspace);
	return path;
}
function normalizePath(path$1, workspace) {
	if (!isString(path$1)) return path$1;
	return path.resolve(workspace, path$1);
}
function normalizeOperationsAndTags(operationsOrTags, workspace, global, source) {
	const unsupportedZodKeys = [
		"version",
		"variant",
		"dateTimeOptions",
		"timeOptions",
		"generateEachHttpStatus",
		"generateReusableSchemas",
		"generateMeta",
		"generateDiscriminatedUnion"
	];
	return Object.fromEntries(Object.entries(operationsOrTags).map(([key, { transformer, mutator, formData, formUrlEncoded, paramsSerializer, paramsFilter, query, angular, zod, effect, ...rest }]) => {
		const unsupportedOperationZodKeys = zod && unsupportedZodKeys.filter((unsupportedKey) => zod[unsupportedKey] !== void 0);
		if (unsupportedOperationZodKeys && unsupportedOperationZodKeys.length) logWarning(`⚠️  override.${source}.${key}.zod only supports strict, generate, coerce, preprocess, params, and useBrandedTypes. Ignoring unsupported ${unsupportedOperationZodKeys.length === 1 ? "field" : "fields"}: ${unsupportedOperationZodKeys.map((unsupportedKey) => `zod.${unsupportedKey}`).join(", ")}.`);
		const hasSupportedOperationZodConfig = !!zod && (zod.strict !== void 0 || zod.generate !== void 0 || zod.coerce !== void 0 || zod.preprocess !== void 0 || zod.params !== void 0 || zod.useBrandedTypes !== void 0);
		return [key, {
			...rest,
			...angular ? { angular: {
				provideIn: angular.provideIn ?? "root",
				client: angular.retrievalClient ?? angular.client ?? "httpClient",
				runtimeValidation: angular.runtimeValidation ?? false,
				queryObjectSerialization: angular.queryObjectSerialization ?? "spec",
				...angular.httpResource ? { httpResource: angular.httpResource } : {}
			} } : {},
			...query ? { query: normalizeQueryOptions(query, workspace, global.query) } : {},
			...hasSupportedOperationZodConfig && zod ? { zod: {
				strict: {
					param: zod.strict?.param ?? false,
					query: zod.strict?.query ?? false,
					header: zod.strict?.header ?? false,
					body: zod.strict?.body ?? false,
					response: zod.strict?.response ?? false
				},
				generate: {
					param: zod.generate?.param ?? true,
					query: zod.generate?.query ?? true,
					header: zod.generate?.header ?? true,
					body: zod.generate?.body ?? true,
					response: zod.generate?.response ?? true
				},
				coerce: {
					param: zod.coerce?.param ?? false,
					query: zod.coerce?.query ?? false,
					header: zod.coerce?.header ?? false,
					body: zod.coerce?.body ?? false,
					response: zod.coerce?.response ?? false
				},
				preprocess: {
					...zod.preprocess?.param ? { param: normalizeMutator(workspace, zod.preprocess.param) } : {},
					...zod.preprocess?.query ? { query: normalizeMutator(workspace, zod.preprocess.query) } : {},
					...zod.preprocess?.header ? { header: normalizeMutator(workspace, zod.preprocess.header) } : {},
					...zod.preprocess?.body ? { body: normalizeMutator(workspace, zod.preprocess.body) } : {},
					...zod.preprocess?.response ? { response: normalizeMutator(workspace, zod.preprocess.response) } : {}
				},
				...zod.params ? { params: normalizeMutator(workspace, zod.params) } : {},
				useBrandedTypes: zod.useBrandedTypes ?? false
			} } : {},
			...effect ? { effect: normalizeEffectOptions(effect) } : {},
			...transformer ? { transformer: normalizePath(transformer, workspace) } : {},
			...mutator ? { mutator: normalizeMutator(workspace, mutator) } : {},
			...formData === void 0 ? {} : { formData: createFormData(workspace, formData) },
			...formUrlEncoded ? { formUrlEncoded: isBoolean(formUrlEncoded) ? formUrlEncoded : normalizeMutator(workspace, formUrlEncoded) } : {},
			...paramsSerializer ? { paramsSerializer: normalizeMutator(workspace, paramsSerializer) } : {},
			...paramsFilter ? { paramsFilter: normalizeMutator(workspace, paramsFilter) } : {}
		}];
	}));
}
function normalizeOutputMode(mode) {
	if (!mode) return OutputMode.SINGLE;
	if (!Object.values(OutputMode).includes(mode)) {
		logWarning(`⚠️  Unknown provided mode => ${mode}`);
		return OutputMode.SINGLE;
	}
	return mode;
}
function normalizeHooks(hooks) {
	const keys = Object.keys(hooks);
	const result = {};
	for (const key of keys) if (isString(hooks[key])) result[key] = [hooks[key]];
	else if (Array.isArray(hooks[key])) result[key] = hooks[key];
	else if (isFunction(hooks[key])) result[key] = [hooks[key]];
	else if (isObject(hooks[key])) result[key] = [hooks[key]];
	return result;
}
function normalizeHonoOptions(hono = {}, workspace) {
	return {
		...hono.handlers ? { handlers: path.resolve(workspace, hono.handlers) } : {},
		handlerGenerationStrategy: hono.handlerGenerationStrategy ?? "smart",
		compositeRoute: hono.compositeRoute ? path.resolve(workspace, hono.compositeRoute) : "",
		validator: hono.validator ?? true,
		validatorOutputPath: hono.validatorOutputPath ? path.resolve(workspace, hono.validatorOutputPath) : ""
	};
}
function normalizeMcpServerOptions(server, workspace) {
	return {
		path: path.resolve(workspace, server.path),
		name: server.name,
		default: server.default ?? !server.name
	};
}
function normalizeMcpOptions(mcp = {}, workspace) {
	return mcp.server ? { server: normalizeMcpServerOptions(mcp.server, workspace) } : {};
}
function normalizeJSDocOptions(jsdoc = {}) {
	return { ...jsdoc };
}
function normalizeQueryOptions(queryOptions = {}, outputWorkspace, globalOptions = {}) {
	if (queryOptions.options) logWarning("⚠️  Using query options is deprecated and will be removed in a future major release. Please use queryOptions or mutationOptions instead.");
	return {
		...isNullish(queryOptions.usePrefetch) ? {} : { usePrefetch: queryOptions.usePrefetch },
		...isNullish(queryOptions.useInvalidate) ? {} : { useInvalidate: queryOptions.useInvalidate },
		...isNullish(queryOptions.useSetQueryData) ? {} : { useSetQueryData: queryOptions.useSetQueryData },
		...isNullish(queryOptions.useGetQueryData) ? {} : { useGetQueryData: queryOptions.useGetQueryData },
		...isNullish(queryOptions.useQuery) ? {} : { useQuery: queryOptions.useQuery },
		...isNullish(queryOptions.useSuspenseQuery) ? {} : { useSuspenseQuery: queryOptions.useSuspenseQuery },
		...isNullish(queryOptions.useMutation) ? {} : { useMutation: queryOptions.useMutation },
		...isNullish(queryOptions.useInfinite) ? {} : { useInfinite: queryOptions.useInfinite },
		...isNullish(queryOptions.useSuspenseInfiniteQuery) ? {} : { useSuspenseInfiniteQuery: queryOptions.useSuspenseInfiniteQuery },
		...queryOptions.useInfiniteQueryParam ? { useInfiniteQueryParam: queryOptions.useInfiniteQueryParam } : {},
		...queryOptions.options ? { options: queryOptions.options } : {},
		...globalOptions.queryKey ? { queryKey: globalOptions.queryKey } : {},
		...queryOptions.queryKey ? { queryKey: normalizeMutator(outputWorkspace, queryOptions.queryKey) } : {},
		...globalOptions.queryOptions ? { queryOptions: globalOptions.queryOptions } : {},
		...queryOptions.queryOptions ? { queryOptions: normalizeMutator(outputWorkspace, queryOptions.queryOptions) } : {},
		...globalOptions.mutationOptions ? { mutationOptions: globalOptions.mutationOptions } : {},
		...queryOptions.mutationOptions ? { mutationOptions: normalizeMutator(outputWorkspace, queryOptions.mutationOptions) } : {},
		...isNullish(globalOptions.shouldExportQueryKey) ? {} : { shouldExportQueryKey: globalOptions.shouldExportQueryKey },
		...isNullish(queryOptions.shouldExportQueryKey) ? {} : { shouldExportQueryKey: queryOptions.shouldExportQueryKey },
		...isNullish(globalOptions.shouldFilterQueryKey) ? {} : { shouldFilterQueryKey: globalOptions.shouldFilterQueryKey },
		...isNullish(queryOptions.shouldFilterQueryKey) ? {} : { shouldFilterQueryKey: queryOptions.shouldFilterQueryKey },
		...isNullish(globalOptions.queryKeyFilter) ? {} : { queryKeyFilter: globalOptions.queryKeyFilter },
		...isNullish(queryOptions.queryKeyFilter) ? {} : { queryKeyFilter: queryOptions.queryKeyFilter },
		...isNullish(globalOptions.shouldExportHttpClient) ? {} : { shouldExportHttpClient: globalOptions.shouldExportHttpClient },
		...isNullish(queryOptions.shouldExportHttpClient) ? {} : { shouldExportHttpClient: queryOptions.shouldExportHttpClient },
		...isNullish(globalOptions.shouldExportMutatorHooks) ? {} : { shouldExportMutatorHooks: globalOptions.shouldExportMutatorHooks },
		...isNullish(queryOptions.shouldExportMutatorHooks) ? {} : { shouldExportMutatorHooks: queryOptions.shouldExportMutatorHooks },
		...isNullish(globalOptions.shouldSplitQueryKey) ? {} : { shouldSplitQueryKey: globalOptions.shouldSplitQueryKey },
		...isNullish(queryOptions.shouldSplitQueryKey) ? {} : { shouldSplitQueryKey: queryOptions.shouldSplitQueryKey },
		...isNullish(globalOptions.signal) ? {} : { signal: globalOptions.signal },
		...isNullish(globalOptions.useOperationIdAsQueryKey) ? {} : { useOperationIdAsQueryKey: globalOptions.useOperationIdAsQueryKey },
		...isNullish(queryOptions.useOperationIdAsQueryKey) ? {} : { useOperationIdAsQueryKey: queryOptions.useOperationIdAsQueryKey },
		...isNullish(globalOptions.signal) ? {} : { signal: globalOptions.signal },
		...isNullish(queryOptions.signal) ? {} : { signal: queryOptions.signal },
		...isNullish(globalOptions.version) ? {} : { version: globalOptions.version },
		...isNullish(queryOptions.version) ? {} : { version: queryOptions.version },
		...queryOptions.mutationInvalidates ? { mutationInvalidates: queryOptions.mutationInvalidates } : {},
		...isNullish(globalOptions.runtimeValidation) ? {} : { runtimeValidation: globalOptions.runtimeValidation },
		...isNullish(queryOptions.runtimeValidation) ? {} : { runtimeValidation: queryOptions.runtimeValidation }
	};
}
function getDefaultFilesHeader({ title, description, version: version$1 } = {}) {
	return [
		`Generated by ${name} v${version} 🍺`,
		`Do not edit manually.`,
		...title ? [title] : [],
		...description ? [description] : [],
		...version$1 ? [`OpenAPI spec version: ${version$1}`] : []
	];
}
//#endregion
//#region src/import-specs.ts
async function resolveSpec(input, { parserOptions, transformer, workspace, unsafeDisableValidation = false }) {
	const allowedRefs = parserOptions?.externalRefs?.allow ?? [];
	const isWildcard = allowedRefs.includes("*");
	const { data: specData, origin } = await loadSpec(input, parserOptions?.headers);
	if (!isWildcard) {
		const disallowed = collectExternalRefs(specData).filter((ref) => !isAllowedRef(ref, allowedRefs, origin));
		if (disallowed.length > 0) throw new Error(formatDisallowedRefsError(disallowed, allowedRefs));
	} else {
		const docs = [...new Set(collectExternalRefs(specData).map(getRefDocument))];
		if (docs.length > 0) logWarning(`External $ref documents being resolved:\n` + docs.map((d) => `  - ${d}`).join("\n"));
	}
	const dereferencedData = await bundleAndDereferenceExternalRefs(specData, parserOptions, origin, isWildcard, allowedRefs);
	let transformedData = dereferencedData;
	if (transformer) {
		const applied = await applyInputTransformer(dereferencedData, transformer, workspace);
		transformedData = collectExternalRefs(applied).length > 0 ? await bundleAndDereferenceExternalRefs(applied, parserOptions, origin, isWildcard, allowedRefs) : applied;
	}
	if (unsafeDisableValidation) logWarning("🚨 OpenAPI spec validation is disabled.\n  Code generation with invalid specs is not guaranteed to work and may break in minor updates.\n  Bug reports with validation disabled will not be accepted.");
	else {
		validateComponentKeys(transformedData);
		const { valid, errors } = await validate(transformedData);
		if (!valid) throw new Error(`OpenAPI spec validation failed:\n${JSON.stringify(errors, void 0, 2)}`);
	}
	const { specification } = upgrade(transformedData);
	return specification;
}
async function applyInputTransformer(data, transformer, workspace) {
	const transformerFn = await dynamicImport(transformer, workspace);
	const result = await transformerFn(data);
	if (!isObject(result)) {
		const source = isString(transformer) ? transformer : transformerFn.name || "<inline function>";
		throw new Error(`input.override.transformer must return an OpenAPI document object; got ${result === void 0 ? "undefined" : typeof result} from ${source}. Ensure your transformer returns the (possibly modified) spec.`);
	}
	return result;
}
/**
* Bundle external references into the document and then resolve the `x-ext`
* entries that `@scalar/json-magic` produces. Shared by the initial pass and
* the post-transformer pass (#3327); `origin` lets the second pass resolve refs
* relative to the original spec file when the input is an in-memory object.
*/
async function bundleAndDereferenceExternalRefs(input, parserOptions, origin, isWildcard = false, allowedExternalRefs = []) {
	return dereferenceExternalRef(await bundle(input, {
		plugins: [
			createSafeFileLoader(origin, isWildcard, allowedExternalRefs),
			createSafeUrlLoader(origin, isWildcard, allowedExternalRefs, parserOptions?.headers),
			parseJson(),
			parseYaml()
		],
		treeShake: false,
		...origin ? { origin } : {}
	}));
}
/**
* Load the top-level spec into an inline object so we can scan it for external
* `$ref`s before `bundle()` resolves them. The top-level target is trusted
* (user-configured `input.target`); only `$ref` values inside the spec are
* untrusted.
*/
function parseSpec(text) {
	const result = jsYaml.load(text);
	if (!isObject(result)) throw new Error("OpenAPI spec must be a valid JSON/YAML object.");
	return result;
}
async function loadSpec(input, headers) {
	if (!isString(input)) return { data: input };
	if (isUrl(input)) {
		const response = await fetch(input, { headers: getHeadersForUrl(input, headers) });
		if (!response.ok) throw new Error(`Failed to fetch OpenAPI spec from ${input}: ${response.status} ${response.statusText}`);
		return {
			data: parseSpec(await response.text()),
			origin: input
		};
	}
	return {
		data: parseSpec(await readFile(input, "utf-8")),
		origin: input
	};
}
/**
* Strip the JSON pointer fragment (`#/...`) from a `$ref` value, leaving only
* the document target (file path or URL).
*/
function getRefDocument(ref) {
	const hashIndex = ref.indexOf("#");
	return hashIndex === -1 ? ref : ref.slice(0, hashIndex);
}
/**
* Collect all external `$ref` document targets from a spec object. Returns
* deduplicated ref strings in their raw form (before fragment stripping).
*/
function collectExternalRefs(obj) {
	const refs = /* @__PURE__ */ new Set();
	function walk(val) {
		if (Array.isArray(val)) {
			val.forEach(walk);
			return;
		}
		if (isObject(val)) {
			if ("$ref" in val && isString(val.$ref) && !val.$ref.startsWith("#")) refs.add(val.$ref);
			Object.values(val).forEach(walk);
		}
	}
	walk(obj);
	return [...refs];
}
/**
* Resolve a ref document target (the part before `#`) to a canonical path or
* URL, so it can be compared against allow-list entries that were resolved the
* same way.
*/
function resolveRefTarget(ref, origin) {
	const doc = getRefDocument(ref);
	if (isUrl(doc)) return new URL(doc).href;
	if (origin && isUrl(origin)) return new URL(doc, origin).href;
	if (origin) return path.resolve(path.dirname(origin), doc);
	return path.resolve(doc);
}
/**
* Check whether a `$ref` is allowed by the user's allow-list. Both the ref and
* the allow-list entries are resolved against the spec origin so that
* `./schemas/pet.yaml` in the spec matches `./schemas/pet.yaml` in the config.
*/
function isAllowedRef(ref, allowedExternalRefs, origin) {
	const resolved = resolveRefTarget(ref, origin);
	return allowedExternalRefs.some((entry) => resolveRefTarget(entry, origin) === resolved);
}
function formatDisallowedRefsError(disallowed, currentAllowed) {
	const docs = [...new Set(disallowed.map(getRefDocument))];
	const all = [...new Set([...currentAllowed, ...docs])];
	const configSnippet = JSON.stringify({ input: { parserOptions: { externalRefs: { allow: all } } } }, null, 2);
	return `External \$ref targets are not allowed by default.
Add them to your config, or use externalRefs.allow: ['*'] to allow all.

Disallowed refs:\n${disallowed.map((r) => `  - ${r}`).join("\n")}\n\nSuggested config:\n${configSnippet}`;
}
/**
* Wrap `readFiles()` so every file read is checked against the allow-list.
* The top-level spec file (matching `origin`) is always allowed; subsequent
* reads must match an explicit entry or the wildcard.
*/
function createSafeFileLoader(origin, isWildcard, allowedExternalRefs) {
	const base = readFiles();
	return {
		type: "loader",
		validate: base.validate,
		async exec(value) {
			if (isWildcard) return base.exec(value);
			if (origin && path.resolve(value) === path.resolve(origin)) return base.exec(value);
			if (!isAllowedRef(value, allowedExternalRefs, origin)) throw new Error(`Refused to read external file: ${value}\nAdd it to externalRefs.allow or use ['*'] to allow all.`);
			return base.exec(value);
		}
	};
}
/**
* Wrap `fetchUrls()` so every URL fetch is checked against the allow-list.
* The top-level spec URL (matching `origin`) is always allowed; subsequent
* fetches must match an explicit entry or the wildcard.
*/
function createSafeUrlLoader(origin, isWildcard, allowedExternalRefs, headers) {
	const base = fetchUrls({ headers });
	return {
		type: "loader",
		validate: base.validate,
		async exec(value) {
			if (isWildcard) return base.exec(value);
			const resolved = resolveRefTarget(value, origin);
			if (origin && resolved === resolveRefTarget(origin)) return base.exec(value);
			if (!isAllowedRef(value, allowedExternalRefs, origin)) throw new Error(`Refused to fetch external URL: ${value}\nAdd it to externalRefs.allow or use ['*'] to allow all.`);
			return base.exec(value);
		}
	};
}
async function importSpecs(workspace, options, projectName) {
	const { input, output } = options;
	return importOpenApi({
		spec: await resolveSpec(input.target, {
			parserOptions: input.parserOptions,
			transformer: input.override.transformer,
			workspace,
			unsafeDisableValidation: input.unsafeDisableValidation
		}),
		input,
		output,
		target: isString(input.target) ? input.target : workspace,
		workspace,
		projectName
	});
}
const COMPONENT_KEY_PATTERN = /^[a-zA-Z0-9.\-_]+$/;
const COMPONENT_SECTIONS = [
	"schemas",
	"responses",
	"parameters",
	"examples",
	"requestBodies",
	"headers",
	"securitySchemes",
	"links",
	"callbacks",
	"pathItems"
];
/**
* Validate that all component keys conform to the OAS regex: ^[a-zA-Z0-9.\-_]+$
* @see https://spec.openapis.org/oas/v3.0.3.html#fixed-fields-5
* @see https://spec.openapis.org/oas/v3.1.0#fixed-fields-5
*/
function validateComponentKeys(data) {
	const components = data.components;
	if (!isObject(components)) return;
	const invalidKeys = [];
	for (const section of COMPONENT_SECTIONS) {
		const sectionObj = components[section];
		if (!isObject(sectionObj)) continue;
		for (const key of Object.keys(sectionObj)) if (!COMPONENT_KEY_PATTERN.test(key)) invalidKeys.push(`components.${section}.${key}`);
	}
	if (invalidKeys.length > 0) throw new Error(`Invalid component key${invalidKeys.length > 1 ? "s" : ""} found. OpenAPI component keys must match the pattern ${COMPONENT_KEY_PATTERN} (non-ASCII characters are not allowed per the spec).\n  See: https://spec.openapis.org/oas/v3.0.3.html#components-object\n  Invalid keys:\n` + invalidKeys.map((k) => `    - ${k}`).join("\n"));
}
/**
* The plugins from `@scalar/json-magic` does not dereference $ref.
* Instead it fetches them and puts them under x-ext, and changes the $ref to point to #x-ext/<name>.
* This function:
* 1. Merges external schemas into main spec's components.schemas (with collision handling)
* 2. Replaces x-ext refs with standard component refs or inlined content
*/
function dereferenceExternalRef(data) {
	const extensions = data["x-ext"] ?? {};
	const schemaNameMappings = mergeExternalSchemas(data, extensions);
	const result = {};
	for (const [key, value] of Object.entries(data)) if (key !== "x-ext") result[key] = replaceXExtRefs(value, extensions, schemaNameMappings);
	return result;
}
/**
* Merge external document schemas into main spec's components.schemas
* Returns mapping of original schema names to final names (with suffixes for collisions)
*/
function mergeExternalSchemas(data, extensions) {
	const schemaNameMappings = {};
	if (Object.keys(extensions).length === 0) return schemaNameMappings;
	data.components ??= {};
	const mainComponents = data.components;
	mainComponents.schemas ??= {};
	const mainSchemas = mainComponents.schemas;
	for (const [extKey, extDoc] of Object.entries(extensions)) {
		schemaNameMappings[extKey] = {};
		if (isObject(extDoc) && "components" in extDoc) {
			const extComponents = extDoc.components;
			if (isObject(extComponents) && "schemas" in extComponents) {
				const extSchemas = extComponents.schemas;
				for (const [schemaName, schema] of Object.entries(extSchemas)) {
					const existingSchema = mainSchemas[schemaName];
					const isXExtRef = isObject(existingSchema) && "$ref" in existingSchema && isString(existingSchema.$ref) && existingSchema.$ref.startsWith("#/x-ext/");
					let finalSchemaName = schemaName;
					if (schemaName in mainSchemas && !isXExtRef) {
						finalSchemaName = `${schemaName}_${extKey.replaceAll(/[^a-zA-Z0-9]/g, "_")}`;
						schemaNameMappings[extKey][schemaName] = finalSchemaName;
					} else schemaNameMappings[extKey][schemaName] = schemaName;
					mainSchemas[finalSchemaName] = scrubUnwantedKeys(schema);
				}
			}
		}
	}
	for (const [extKey, mapping] of Object.entries(schemaNameMappings)) for (const [, finalName] of Object.entries(mapping)) {
		const schema = mainSchemas[finalName];
		if (schema) mainSchemas[finalName] = updateInternalRefs(schema, extKey, schemaNameMappings);
	}
	return schemaNameMappings;
}
/**
* Remove unwanted keys like $schema and $id from objects
*/
function scrubUnwantedKeys(obj) {
	const UNWANTED_KEYS = new Set(["$schema", "$id"]);
	if (obj === null || obj === void 0) return obj;
	if (Array.isArray(obj)) return obj.map((x) => scrubUnwantedKeys(x));
	if (isObject(obj)) {
		const rec = obj;
		const out = {};
		for (const [k, v] of Object.entries(rec)) {
			if (UNWANTED_KEYS.has(k)) continue;
			out[k] = scrubUnwantedKeys(v);
		}
		return out;
	}
	return obj;
}
/**
* Update internal refs within an external schema to use suffixed names
*/
function updateInternalRefs(obj, extKey, schemaNameMappings) {
	if (obj === null || obj === void 0) return obj;
	if (Array.isArray(obj)) return obj.map((element) => updateInternalRefs(element, extKey, schemaNameMappings));
	if (isObject(obj)) {
		const record = obj;
		if ("$ref" in record && isString(record.$ref)) {
			const refValue = record.$ref;
			if (refValue.startsWith("#/components/schemas/")) {
				const schemaName = refValue.replace("#/components/schemas/", "");
				const mappedName = schemaNameMappings[extKey][schemaName];
				if (mappedName) return { $ref: `#/components/schemas/${mappedName}` };
			}
		}
		const result = {};
		for (const [key, value] of Object.entries(record)) result[key] = updateInternalRefs(value, extKey, schemaNameMappings);
		return result;
	}
	return obj;
}
/**
* Decode a single JSON Pointer reference token taken from an x-ext `$ref`.
*
* The token carries two layers of encoding: it sits in a URI fragment, so it
* may be percent-encoded (e.g. `%7B` for `{` in templated paths), and it is a
* JSON Pointer token, so `~1`/`~0` stand for `/`/`~` (RFC 6901). Percent-
* encoding is the outer layer and is removed first; a malformed sequence is
* left as-is rather than throwing. Without this, tokens such as `~1pets`
* never match the real `/pets` key and the external `$ref` fails to resolve.
*/
function decodeRefToken(token) {
	let decoded = token;
	try {
		decoded = decodeURIComponent(token);
	} catch {}
	return decoded.replaceAll("~1", "/").replaceAll("~0", "~");
}
/**
* Replace x-ext refs with standard component refs, or inline the content.
* `inliningRefs` tracks the inline chain to break cycles in recursive
* external schemas that aren't under `components.schemas` (#1642).
*/
function replaceXExtRefs(obj, extensions, schemaNameMappings, inliningRefs = /* @__PURE__ */ new Set()) {
	if (isNullish$1(obj)) return obj;
	if (Array.isArray(obj)) return obj.map((element) => replaceXExtRefs(element, extensions, schemaNameMappings, inliningRefs));
	if (isObject(obj)) {
		const record = obj;
		if ("$ref" in record && isString(record.$ref)) {
			const refValue = record.$ref;
			if (refValue.startsWith("#/x-ext/")) {
				const parts = refValue.replace("#/x-ext/", "").split("/");
				const extKey = parts.shift();
				if (extKey) {
					if (parts.length >= 3 && parts[0] === "components" && parts[1] === "schemas") {
						const schemaName = parts.slice(2).join("/");
						return { $ref: `#/components/schemas/${schemaNameMappings[extKey][schemaName] || schemaName}` };
					}
					if (inliningRefs.has(refValue)) {
						logWarning(`Detected a circular external $ref while inlining "${refValue}". Replacing with an empty schema to avoid infinite recursion. Move the schema under "components.schemas" in its source file or pre-bundle the spec to keep the recursion intact.`);
						return {};
					}
					let refObj = extensions[extKey];
					for (const rawPart of parts) {
						const p = decodeRefToken(rawPart);
						if (refObj && (isObject(refObj) || Array.isArray(refObj)) && p in refObj) refObj = refObj[p];
						else {
							refObj = void 0;
							break;
						}
					}
					if (refObj) {
						const cleaned = scrubUnwantedKeys(refObj);
						const nextInlining = new Set(inliningRefs);
						nextInlining.add(refValue);
						return replaceXExtRefs(cleaned, extensions, schemaNameMappings, nextInlining);
					}
				}
			}
		}
		const result = {};
		for (const [key, value] of Object.entries(record)) result[key] = replaceXExtRefs(value, extensions, schemaNameMappings, inliningRefs);
		return result;
	}
	return obj;
}
//#endregion
//#region src/formatters/prettier.ts
/**
* Format files with prettier.
* Tries the programmatic API first (project dependency),
* then falls back to the globally installed CLI.
*/
async function formatWithPrettier(paths, projectTitle) {
	const prettier = await tryImportPrettier();
	if (prettier) {
		const filePaths = [...new Set(await collectFilePaths(paths))];
		if (filePaths.length === 0) return;
		const config = await prettier.resolveConfig(filePaths[0]) ?? {};
		await Promise.all(filePaths.map(async (filePath) => {
			try {
				const content = await fs.readFile(filePath, "utf8");
				const formatted = await prettier.format(content, {
					...config,
					filepath: filePath
				});
				await fs.writeFile(filePath, formatted);
			} catch (error) {
				if (isMissingFileError(error)) return;
				if (error instanceof Error) if (error.name === "UndefinedParserError") {} else logWarning(`⚠️  ${projectTitle ? `${projectTitle} - ` : ""}Failed to format file ${filePath}: ${error.toString()}`);
				else logWarning(`⚠️  ${projectTitle ? `${projectTitle} - ` : ""}Failed to format file ${filePath}: unknown error`);
			}
		}));
		return;
	}
	try {
		await execa("prettier", ["--write", ...paths]);
	} catch {
		logWarning(`⚠️  ${projectTitle ? `${projectTitle} - ` : ""}prettier not found. Install it as a project dependency or globally.`);
	}
}
function isMissingFileError(error) {
	return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
/**
* Try to import prettier from the project's dependencies.
* Returns undefined if prettier is not installed.
*/
async function tryImportPrettier() {
	try {
		return await import("prettier");
	} catch {
		return;
	}
}
/**
* Recursively collect absolute file paths from a mix of files and directories.
*/
async function collectFilePaths(paths) {
	const results = [];
	for (const p of paths) {
		const absolute = path.resolve(p);
		try {
			const stat = await fs.stat(absolute);
			if (stat.isFile()) results.push(absolute);
			else if (stat.isDirectory()) {
				const subFiles = await collectFilePaths((await fs.readdir(absolute)).map((entry) => path.join(absolute, entry)));
				results.push(...subFiles);
			}
		} catch {}
	}
	return results;
}
//#endregion
//#region src/utils/barrel.ts
const RE_EXPORT_SPECIFIER = /export\s+\*\s+from\s*['"]([^'"]+)['"]/g;
/**
* Extract the set of `export * from '...'` module specifiers from barrel
* content. Quote-agnostic (matches both `'` and `"`) so it is unaffected by a
* formatter changing quote style between generations.
*/
function readReExportSpecifiers(content) {
	return new Set([...content.matchAll(RE_EXPORT_SPECIFIER)].map((m) => m[1]));
}
/**
* Return the deduplicated list of specifiers for a barrel by unioning the
* freshly generated `specifiers` with whatever re-exports already exist on
* disk. Merging on the bare specifier (rather than the formatted line) makes
* the barrel idempotent across regenerations regardless of how an external
* formatter rewrites quotes, semicolons, or whitespace. On-disk order is
* preserved and new specifiers are appended — matching the previous append
* ordering — so callers control any sorting they want.
*/
async function mergeBarrelSpecifiers(filePath, specifiers) {
	const existing = await fs$2.pathExists(filePath) ? readReExportSpecifiers(await fs$2.readFile(filePath, "utf8")) : /* @__PURE__ */ new Set();
	return [...new Set([...existing, ...specifiers])];
}
//#endregion
//#region src/utils/execute-hook.ts
const executeHook = async (name, commands = [], args = []) => {
	log(styleText("white", `Running ${name} hook...`));
	for (const command of commands) try {
		if (isString(command)) await executeCommand(command, args);
		else if (isFunction(command)) await command(args);
		else if (isObject(command)) await executeObjectCommand(command, args);
	} catch (error) {
		logError(error, `Failed to run ${name} hook`);
	}
};
async function executeCommand(command, args) {
	const [cmd, ..._args] = [...parseArgsStringToArgv(command), ...args];
	await execa(cmd, _args);
}
async function executeObjectCommand(command, args) {
	if (command.injectGeneratedDirsAndFiles === false) args = [];
	if (isString(command.command)) await executeCommand(command.command, args);
	else if (isFunction(command.command)) await command.command();
}
//#endregion
//#region src/utils/watcher.ts
/**
* Start a file watcher and invoke an async callback on file changes.
*
* If `watchOptions` is falsy the watcher is not started. Supported shapes:
*  - boolean: when true the `defaultTarget` is watched
*  - string: a single path to watch
*  - string[]: an array of paths to watch
*
* @param watchOptions - false to disable watching, or a path/paths to watch
* @param watchFn - async callback executed on change events
* @param defaultTarget - path(s) to watch when `watchOptions` is `true` (default: '.')
* @returns Resolves once the watcher has been started (or immediately if disabled)
*
* @example
* await startWatcher(true, async () => { await buildProject(); }, 'src');
*/
async function startWatcher(watchOptions, watchFn, defaultTarget = ".") {
	if (!watchOptions) return;
	const { watch } = await import("chokidar");
	const ignored = ["**/{.git,node_modules}/**"];
	const watchPaths = isBoolean(watchOptions) ? defaultTarget : watchOptions;
	log(`Watching for changes in ${Array.isArray(watchPaths) ? watchPaths.map((v) => "\"" + v + "\"").join(" | ") : "\"" + watchPaths + "\""}`);
	const watcher = watch(watchPaths, {
		ignorePermissionErrors: true,
		ignored
	});
	watcher.on("ready", () => {
		log("Initial scan complete. Watching for changes...");
		watcher.on("all", (type, file) => {
			log(`Change detected: ${type} ${file}`);
			watchFn().catch((error) => {
				logError(error);
			});
		});
	});
}
//#endregion
//#region src/reusable-schemas.ts
/**
* Resolve the export identifier for a `#/components/schemas/X` ref. We reuse
* `@orval/core`'s `getRefInfo(...).name` (`pascal` + sanitize + component
* suffix) so reusable zod schema exports match the operation wrappers and the
* TS model types exactly. `namingConvention` deliberately does NOT influence
* the identifier — it governs file names only, consistent with the rest of
* orval. The same call powers the generator's `namedRef` emission, so the
* definition name and every reference stay in sync.
*/
const resolveSchemaName = (ref, context) => getRefInfo(ref, context).name;
/**
* Resolve names for a set of refs, throwing on conflicts (two distinct refs
* collapsing to the same identifier). The mapping is the single source of
* truth for cross-schema references — the generator, the orchestrator's graph,
* and the sentinel rewriter all consult it.
*/
const resolveSchemaNames = (refs, context) => {
	const resolved = /* @__PURE__ */ new Map();
	const reverse = /* @__PURE__ */ new Map();
	for (const ref of refs) {
		const name = resolveSchemaName(ref, context);
		const previous = reverse.get(name);
		if (previous !== void 0 && previous !== ref) throw new Error(`[orval/zod] generateReusableSchemas: refs ${previous} and ${ref} both resolve to the export name "${name}". Rename one in the OpenAPI source.`);
		resolved.set(ref, name);
		reverse.set(name, ref);
	}
	return resolved;
};
/**
* For each component-schema ref, run the Zod generator + parser with
* `useReusableSchemas: true`. The resulting `zod` strings contain
* `__REF_<name>__` sentinels at every site that references another schema;
* the SCC step (Task 10) decides whether each sentinel becomes a direct
* identifier or a `z.lazy(() => Name)` wrapper.
*/
const generateReusableSchemaSet = (refs, context, options) => {
	const componentSchemas = context.spec.components?.schemas ?? {};
	const nameToRef = /* @__PURE__ */ new Map();
	for (const schemaName of Object.keys(componentSchemas)) {
		const ref = `#/components/schemas/${schemaName}`;
		nameToRef.set(resolveSchemaName(ref, context), ref);
	}
	const queue = [...refs];
	const seen = new Set(refs);
	const entries = [];
	for (const ref of queue) {
		const schemaName = ref.slice(21);
		const schema = componentSchemas[schemaName];
		if (!schema) continue;
		const name = resolveSchemaName(ref, context);
		const scopedContext = {
			...context,
			dynamicScope: buildDynamicScope(schemaName, schema, context)
		};
		const parsed = parseZodValidationSchemaDefinition(generateZodValidationSchemaDefinition(schema, scopedContext, name, options.strict, options.isZodV4, {
			required: true,
			useReusableSchemas: true,
			emitMeta: options.generateMeta
		}), scopedContext, options.coerce ?? false, options.strict, options.isZodV4, void 0, options.paramsMutator ? {
			mutator: options.paramsMutator,
			operationId: "",
			location: "schema",
			schemaName: name
		} : void 0, options.variant, options.exactOptional);
		entries.push({
			ref,
			name,
			zod: parsed.zod,
			consts: parsed.consts,
			usedRefs: parsed.usedRefs,
			variant: options.variant
		});
		for (const usedName of parsed.usedRefs) {
			const usedRef = nameToRef.get(usedName);
			if (usedRef !== void 0 && !seen.has(usedRef)) {
				seen.add(usedRef);
				queue.push(usedRef);
			}
		}
	}
	return entries;
};
const edgeKey = (from, to) => `${from}->${to}`;
const tarjan = (graph) => {
	let index = 0;
	const stack = [];
	const onStack = /* @__PURE__ */ new Set();
	const indices = /* @__PURE__ */ new Map();
	const lowlinks = /* @__PURE__ */ new Map();
	const sccs = [];
	const lazyEdges = /* @__PURE__ */ new Set();
	const strongconnect = (v) => {
		indices.set(v, index);
		lowlinks.set(v, index);
		index += 1;
		stack.push(v);
		onStack.add(v);
		const neighbors = graph.get(v) ?? /* @__PURE__ */ new Set();
		for (const w of neighbors) {
			if (v === w) {
				lazyEdges.add(edgeKey(v, w));
				continue;
			}
			if (!indices.has(w)) {
				strongconnect(w);
				lowlinks.set(v, Math.min(lowlinks.get(v) ?? -1, lowlinks.get(w) ?? -1));
			} else if (onStack.has(w)) {
				lazyEdges.add(edgeKey(v, w));
				lowlinks.set(v, Math.min(lowlinks.get(v) ?? -1, indices.get(w) ?? -1));
			}
		}
		if (lowlinks.get(v) === indices.get(v)) {
			const scc = [];
			let w;
			do {
				w = stack.pop();
				if (w === void 0) break;
				onStack.delete(w);
				scc.push(w);
			} while (w !== v);
			sccs.push(scc);
		}
	};
	for (const node of graph.keys()) if (!indices.has(node)) strongconnect(node);
	return {
		sccs,
		lazyEdges
	};
};
const SENTINEL_PATTERN = /__REF_([A-Za-z_$][A-Za-z0-9_$]*)__/g;
/**
* Replace every `__REF_<name>__` sentinel with the bare identifier. Use this
* for schemas that sit at the top of the dependency graph (operation params,
* bodies, responses) — they can never participate in a cycle with the
* component schemas they reference, so every ref is a direct (non-lazy) one.
*/
const rewriteSentinelsToDirect = (zod) => zod.replaceAll(SENTINEL_PATTERN, (_match, refName) => refName);
/**
* Replace every `__REF_<name>__` sentinel with either the bare identifier or
* `zod.lazy(() => <name>)` based on whether the edge closes a cycle, then
* reorder entries so that every non-lazy reference is emitted AFTER its
* target. This avoids TDZ errors at module load.
*
* Entries that sit in a cycle (SCC of size > 1, or a self-loop) are flagged
* `isRecursive`. Their generated `const` reads its own binding inside the
* initializer (through the `zod.lazy` wrapper), which TypeScript rejects with
* TS7022 ("'X' implicitly has type 'any' ... referenced directly or indirectly
* in its own initializer") unless the `const` carries an explicit type
* annotation. The writer (`write-zod-specs`) supplies that annotation —
* `const X: zod.ZodType<X>` — backed by a generated TS type, which both
* silences TS7022 and preserves full `z.infer` typing through the recursion.
*
* Both the lazy classification and the emit order come from a single Tarjan
* run, guaranteeing they agree: a non-lazy edge u→v means v is visited (and
* popped) before u in DFS, so v appears earlier in the SCC array → emitted
* before u → safe.
*/
const rewriteReusableSchemas = (entries) => {
	const graph = new Map(entries.map((e) => [e.name, new Set(e.usedRefs)]));
	for (const e of entries) for (const ref of e.usedRefs) if (!graph.has(ref)) graph.set(ref, /* @__PURE__ */ new Set());
	const { sccs, lazyEdges } = tarjan(graph);
	const recursiveNames = /* @__PURE__ */ new Set();
	for (const scc of sccs) if (scc.length > 1) for (const name of scc) recursiveNames.add(name);
	else if (lazyEdges.has(edgeKey(scc[0], scc[0]))) recursiveNames.add(scc[0]);
	const rewritten = new Map(entries.map((entry) => {
		const newZod = entry.zod.replaceAll(SENTINEL_PATTERN, (_match, refName) => {
			return lazyEdges.has(edgeKey(entry.name, refName)) ? `${entry.variant === "mini" ? "/*#__PURE__*/ " : ""}zod.lazy(() => ${refName})` : refName;
		});
		return [entry.name, {
			...entry,
			zod: newZod,
			isRecursive: recursiveNames.has(entry.name)
		}];
	}));
	const out = [];
	for (const scc of sccs) for (const name of scc) {
		const entry = rewritten.get(name);
		if (entry !== void 0) out.push(entry);
	}
	return out;
};
//#endregion
//#region src/write-zod-specs.ts
const getZodSchemaImportStatement = (variant) => variant === "mini" ? `import * as zod from '${getZodImportSource(variant)}';` : `import { z as zod } from '${getZodImportSource(variant)}';`;
/**
* Render the `import { ... } from '...'` line for a resolved
* `GeneratorMutator`. Mirrors the format produced by
* `generateMutatorImports` in `@orval/core` but inlined to avoid pulling in
* its full surface area for a single statement.
*/
function buildMutatorImportStatement(mutator) {
	return `import ${mutator.default ? mutator.name : `{ ${mutator.name} }`} from '${mutator.path}';`;
}
const ROOT_DIR = ".";
function getSchemaDir(schemaTagMap, name) {
	return schemaTagMap?.get(name) ?? ROOT_DIR;
}
function computeCrossDirImportPath(schemasPath, fromDir, toDir, fileName, importExt) {
	if (fromDir === toDir) return `./${fileName}${importExt}`;
	const fromPath = fromDir === ROOT_DIR ? schemasPath : path.join(schemasPath, fromDir);
	const toPath = toDir === ROOT_DIR ? schemasPath : path.join(schemasPath, toDir);
	const relDir = upath.relativeSafe(fromPath, toPath);
	return `${upath.joinSafe(relDir, fileName)}${importExt}`;
}
function adjustMutatorPathForDir(mutatorPath, tagDir) {
	if (tagDir === ROOT_DIR) return mutatorPath;
	if (mutatorPath.startsWith("./")) return `../${mutatorPath.slice(2)}`;
	if (mutatorPath.startsWith("../")) return `../${mutatorPath}`;
	return mutatorPath;
}
/**
* Whole-word substring check for a resolved mutator alias inside generated
* code. Plain `String.includes` would false-positive when the user names the
* mutator something like `min` against `.min(1)`.
*/
function bodyReferencesMutator(body, mutator) {
	return new RegExp(String.raw`\b${mutator.name}\b`).test(body);
}
function generateZodSchemaFileContent(header, schemas, zodVariant, includeZodImport = true) {
	const refImports = [...new Set(schemas.flatMap((s) => s.importStatements ?? []))].toSorted();
	const importBlock = [...includeZodImport ? [getZodSchemaImportStatement(zodVariant)] : [], ...refImports].join("\n");
	const schemaContent = schemas.map(({ schemaName, consts, zodExpression }) => {
		return `${consts ? `${consts}\n` : ""}export const ${schemaName} = ${zodExpression}

export type ${schemaName} = zod.input<typeof ${schemaName}>;
export type ${schemaName}Output = zod.output<typeof ${schemaName}>;`;
	}).join("\n\n");
	return `${header}${importBlock ? `${importBlock}\n\n` : ""}${schemaContent}\n`;
}
function renderReusableSchemaEntry(entry, context, zodVariant) {
	const consts = entry.consts ? `${entry.consts}\n\n` : "";
	if (entry.isRecursive) {
		const rawName = isComponentRef(entry.ref) ? getRefInfo(entry.ref, context).originalName : void 0;
		const schema = rawName ? context.spec.components?.schemas?.[rawName] : void 0;
		const resolved = schema ? resolveValue({
			schema,
			name: entry.name,
			context
		}) : void 0;
		const typeBody = resolved ? resolved.value : "unknown";
		const seenSubModels = /* @__PURE__ */ new Set();
		const subModels = (resolved?.schemas ?? []).filter((s) => {
			if (seenSubModels.has(s.name)) return false;
			seenSubModels.add(s.name);
			return true;
		});
		const subModelBlock = subModels.length ? `${subModels.map((s) => s.model.trimEnd()).join("\n")}\n\n` : "";
		const localNames = new Set(subModels.map((s) => s.name));
		const seen = /* @__PURE__ */ new Set();
		const extraImports = [];
		for (const imp of resolved?.imports ?? []) {
			if (!imp.name || imp.name === entry.name || localNames.has(imp.name)) continue;
			const bindingKey = imp.alias ?? imp.name;
			if (seen.has(bindingKey)) continue;
			seen.add(bindingKey);
			extraImports.push({
				name: imp.name,
				...imp.alias ? { alias: imp.alias } : {}
			});
		}
		return {
			content: `${consts}${subModelBlock}export type ${entry.name} = ${typeBody};\n\nexport const ${entry.name}: zod.${getZodTypeName(zodVariant)}<${entry.name}> = ${entry.zod};\n\nexport type ${entry.name}Output = zod.output<typeof ${entry.name}>;`,
			extraImports
		};
	}
	return {
		content: `${consts}export const ${entry.name} = ${entry.zod};\n\nexport type ${entry.name} = zod.input<typeof ${entry.name}>;\nexport type ${entry.name}Output = zod.output<typeof ${entry.name}>;`,
		extraImports: []
	};
}
const isValidSchemaIdentifier = (name) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
/**
* Build the sibling-file `import { … } from './…'` block for one reusable
* schema file. Two sources feed in:
*   - `usedRefs` — names from the zod runtime expression. Sourced from the
*     sentinel parser, so always unaliased.
*   - `extraImports` — names the recursive TS body needs that the zod runtime
*     collapsed (`propertyNames` $refs, etc.). May carry `alias`.
* Keyed by export name (`name`) so an aliased `extraImports` entry overrides
* a bare `usedRefs` entry — the recursive TS body uses the local binding, so
* the aliased form has to win for the file to compile. Self-refs and
* non-component identifiers are filtered out.
*
* Exported for unit-test coverage of the alias-propagation path; no
* `resolveValue` producer surfaces aliases here today, so the integration
* tests can't exercise it.
*/
function buildSiblingImports({ usedRefs, extraImports, entryName, componentNames, namingConvention, importExt, schemaTagMap, currentDir, schemasPath }) {
	const importsByName = /* @__PURE__ */ new Map();
	for (const name of usedRefs) {
		if (name === entryName) continue;
		importsByName.set(name, { name });
	}
	for (const imp of extraImports) {
		if (imp.name === entryName || !componentNames.has(imp.name)) continue;
		importsByName.set(imp.name, imp);
	}
	return [...importsByName.values()].toSorted((a, b) => a.name.localeCompare(b.name)).map(({ name, alias }) => {
		const importedFile = conventionName(name, namingConvention);
		return `import { ${alias ? `${name} as ${alias}` : name} } from '${schemaTagMap && currentDir && schemasPath ? computeCrossDirImportPath(schemasPath, currentDir, getSchemaDir(schemaTagMap, name), importedFile, importExt) : `./${importedFile}${importExt}`}';`;
	}).join("\n");
}
const isPrimitiveSchemaName = (name) => [
	"string",
	"number",
	"boolean",
	"void",
	"unknown",
	"Blob"
].includes(name);
const dedupeSchemasByName = (schemas) => {
	const uniqueSchemas = /* @__PURE__ */ new Map();
	for (const schema of schemas) if (!uniqueSchemas.has(schema.name)) uniqueSchemas.set(schema.name, schema);
	return [...uniqueSchemas.values()];
};
const groupSchemasByFilePath = (schemas) => {
	const grouped = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const key = schema.filePath.toLowerCase();
		const existingGroup = grouped.get(key);
		if (existingGroup) existingGroup.push(schema);
		else grouped.set(key, [schema]);
	}
	return [...grouped.values()].map((group) => [...group].toSorted((a, b) => a.filePath.localeCompare(b.filePath, "en", { numeric: true }))).toSorted((a, b) => a[0].filePath.localeCompare(b[0].filePath, "en", { numeric: true }));
};
async function writeZodSchemaIndex(schemasPath, fileExtension, header, schemaNames, namingConvention, shouldMergeExisting = false, tsconfig) {
	const importFileExtension = getImportExtension(fileExtension, tsconfig);
	const indexPath = path.join(schemasPath, `index.ts`);
	const newSpecifiers = [...new Set(schemaNames.map((schemaName) => {
		return `./${conventionName(schemaName, namingConvention)}${importFileExtension}`;
	}))];
	const exports = (shouldMergeExisting ? await mergeBarrelSpecifiers(indexPath, newSpecifiers) : newSpecifiers).toSorted().map((specifier) => `export * from '${specifier}';`).join("\n");
	await fs$2.outputFile(indexPath, `${header}\n${exports}\n`);
}
async function writeZodSchemaTagsSplitBarrel(schemasPath, fileExtension, header, componentDirs, verbDirs, namingConvention, tsconfig) {
	const importExt = getImportExtension(fileExtension, tsconfig);
	const indexImportExt = getImportExtension(".ts", tsconfig);
	const allDirs = /* @__PURE__ */ new Map();
	for (const [dir, names] of componentDirs) allDirs.set(dir, [...names]);
	for (const [dir, names] of verbDirs) if (allDirs.has(dir)) allDirs.get(dir).push(...names);
	else allDirs.set(dir, [...names]);
	for (const [dir, schemaNames] of allDirs) {
		if (dir === ROOT_DIR) continue;
		await writeZodSchemaIndex(path.join(schemasPath, dir), fileExtension, header, schemaNames, namingConvention, false, tsconfig);
	}
	const rootSchemas = allDirs.get(ROOT_DIR) ?? [];
	const rootExports = [...new Set(rootSchemas)].map((name) => {
		return `export * from './${conventionName(name, namingConvention)}${importExt}';`;
	}).toSorted();
	const tagExports = [...allDirs.keys()].filter((dir) => dir !== ROOT_DIR).toSorted((a, b) => a.localeCompare(b, "en", { numeric: true })).map((dir) => {
		return `export * from '${indexImportExt ? `./${dir}/index${indexImportExt}` : `./${dir}`}';`;
	});
	const allExports = [...rootExports, ...tagExports];
	const rootIndexPath = path.join(schemasPath, "index.ts");
	const content = `${header}\n${allExports.join("\n")}\n`;
	await fs$2.outputFile(rootIndexPath, content);
}
function generateZodSchemasInline(builder, output, includeZodImport = true, paramsMutator, includeParamsImport = false) {
	if (output.override.zod.generateReusableSchemas === true) return generateZodSchemasInlineReusable(builder, output, includeZodImport, paramsMutator, includeParamsImport);
	const schemasWithOpenApiDef = builder.schemas.filter((s) => s.schema);
	if (schemasWithOpenApiDef.length === 0) return "";
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const schemas = [];
	for (const { name, schema: schemaObject } of schemasWithOpenApiDef) {
		if (!schemaObject) continue;
		const context = {
			spec: builder.spec,
			target: builder.target,
			workspace: "",
			output
		};
		const parsedZodDefinition = parseZodValidationSchemaDefinition(generateZodValidationSchemaDefinition(dereference(schemaObject, context), context, name, strict, isZodV4, {
			required: true,
			emitMeta: output.override.zod.generateMeta
		}), context, coerce, strict, isZodV4, void 0, void 0, output.override.zod.variant, output.override.zod.exactOptional);
		schemas.push({
			schemaName: name,
			consts: parsedZodDefinition.consts,
			zodExpression: parsedZodDefinition.zod
		});
	}
	if (schemas.length === 0) return "";
	return generateZodSchemaFileContent("", schemas, output.override.zod.variant, includeZodImport);
}
function generateZodSchemasInlineReusable(builder, output, includeZodImport = true, paramsMutator, includeParamsImport = false) {
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const context = {
		spec: builder.spec,
		target: builder.target,
		workspace: "",
		output
	};
	const componentSchemas = builder.spec.components?.schemas ?? {};
	const refs = Object.keys(componentSchemas).map((schemaName) => `#/components/schemas/${schemaName}`);
	if (refs.length === 0) return "";
	resolveSchemaNames(refs, context);
	const body = rewriteReusableSchemas(generateReusableSchemaSet(refs, context, {
		strict,
		isZodV4,
		coerce,
		variant: output.override.zod.variant,
		generateMeta: output.override.zod.generateMeta,
		exactOptional: output.override.zod.exactOptional,
		paramsMutator
	})).map((entry) => renderReusableSchemaEntry(entry, context, output.override.zod.variant).content).join("\n\n");
	const zodImport = includeZodImport ? `${getZodSchemaImportStatement(output.override.zod.variant)}\n` : "";
	const paramsImport = paramsMutator && includeParamsImport && bodyReferencesMutator(body, paramsMutator) ? `${buildMutatorImportStatement(paramsMutator)}\n` : "";
	return `${zodImport || paramsImport ? `${zodImport}${paramsImport}\n` : ""}${body}\n`;
}
async function writeZodSchemas(builder, schemasPath, fileExtension, header, output, paramsMutator, schemaTagMap) {
	if (output.override.zod.generateReusableSchemas) return writeZodSchemasReusable(builder, schemasPath, fileExtension, header, output, paramsMutator, schemaTagMap);
	const isSplit = !!schemaTagMap;
	const schemasWithOpenApiDef = builder.schemas.filter((s) => s.schema);
	const schemasToWrite = [];
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	for (const generatorSchema of schemasWithOpenApiDef) {
		const { name, schema: schemaObject } = generatorSchema;
		if (!schemaObject) continue;
		const fileName = conventionName(name, output.namingConvention);
		const tagDir = getSchemaDir(schemaTagMap, name);
		const filePath = isSplit ? path.join(schemasPath, tagDir, `${fileName}${fileExtension}`) : path.join(schemasPath, `${fileName}${fileExtension}`);
		const context = {
			spec: builder.spec,
			target: builder.target,
			workspace: "",
			output
		};
		const parsedZodDefinition = parseZodValidationSchemaDefinition(generateZodValidationSchemaDefinition(dereference(schemaObject, context), context, name, strict, isZodV4, {
			required: true,
			emitMeta: output.override.zod.generateMeta
		}), context, coerce, strict, isZodV4, void 0, void 0, output.override.zod.variant, output.override.zod.exactOptional);
		schemasToWrite.push({
			schemaName: name,
			filePath,
			consts: parsedZodDefinition.consts,
			zodExpression: parsedZodDefinition.zod
		});
	}
	const groupedSchemasToWrite = groupSchemasByFilePath(schemasToWrite);
	for (const schemaGroup of groupedSchemasToWrite) {
		const fileContent = generateZodSchemaFileContent(header, schemaGroup, output.override.zod.variant);
		await fs$2.outputFile(schemaGroup[0].filePath, fileContent);
	}
	const writtenSchemaNames = groupedSchemasToWrite.map((schemaGroup) => schemaGroup[0].schemaName);
	if (output.indexFiles && !isSplit) await writeZodSchemaIndex(schemasPath, fileExtension, header, writtenSchemaNames, output.namingConvention, false, output.tsconfig);
	if (isSplit) {
		const dirSchemas = /* @__PURE__ */ new Map();
		for (const name of writtenSchemaNames) {
			const dir = getSchemaDir(schemaTagMap, name);
			if (!dirSchemas.has(dir)) dirSchemas.set(dir, []);
			dirSchemas.get(dir).push(name);
		}
		return dirSchemas;
	}
	return new Map([[ROOT_DIR, writtenSchemaNames]]);
}
async function writeZodSchemasReusable(builder, schemasPath, fileExtension, header, output, paramsMutator, schemaTagMap) {
	const isSplit = !!schemaTagMap;
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const context = {
		spec: builder.spec,
		target: builder.target,
		workspace: "",
		output
	};
	const componentSchemas = builder.spec.components?.schemas ?? {};
	const refs = Object.keys(componentSchemas).map((schemaName) => `#/components/schemas/${schemaName}`);
	resolveSchemaNames(refs, context);
	const rewritten = rewriteReusableSchemas(generateReusableSchemaSet(refs, context, {
		strict,
		isZodV4,
		coerce,
		variant: output.override.zod.variant,
		generateMeta: output.override.zod.generateMeta,
		exactOptional: output.override.zod.exactOptional,
		paramsMutator
	}));
	const componentNames = new Set(Object.keys(builder.spec.components?.schemas ?? {}).map((schemaName) => resolveSchemaName(`#/components/schemas/${schemaName}`, context)));
	for (const entry of rewritten) {
		const fileName = conventionName(entry.name, output.namingConvention);
		const tagDir = getSchemaDir(schemaTagMap, entry.name);
		const filePath = isSplit ? path.join(schemasPath, tagDir, `${fileName}${fileExtension}`) : path.join(schemasPath, `${fileName}${fileExtension}`);
		const importExt = getImportExtension(fileExtension, output.tsconfig);
		const rendered = renderReusableSchemaEntry(entry, context, output.override.zod.variant);
		const refImports = buildSiblingImports({
			usedRefs: entry.usedRefs,
			extraImports: rendered.extraImports,
			entryName: entry.name,
			componentNames,
			namingConvention: output.namingConvention,
			importExt,
			...isSplit ? {
				schemaTagMap,
				currentDir: tagDir,
				schemasPath
			} : {}
		});
		const mutatorImportStr = !!paramsMutator && bodyReferencesMutator(entry.zod, paramsMutator) ? buildMutatorImportStatement({
			...paramsMutator,
			path: isSplit ? adjustMutatorPathForDir(paramsMutator.path, tagDir) : paramsMutator.path
		}) : void 0;
		const imports = [...mutatorImportStr ? [mutatorImportStr] : [], ...refImports ? [refImports] : []].join("\n");
		const fileContent = `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n` + (imports ? `${imports}\n\n` : "\n") + `${rendered.content}\n`;
		await fs$2.outputFile(filePath, fileContent);
	}
	if (output.indexFiles && !isSplit && rewritten.length > 0) await writeZodSchemaIndex(schemasPath, fileExtension, header, rewritten.map((e) => e.name), output.namingConvention, true, output.tsconfig);
	if (isSplit) {
		const dirSchemas = /* @__PURE__ */ new Map();
		for (const entry of rewritten) {
			const dir = getSchemaDir(schemaTagMap, entry.name);
			if (!dirSchemas.has(dir)) dirSchemas.set(dir, []);
			dirSchemas.get(dir).push(entry.name);
		}
		return dirSchemas;
	}
	return new Map([[ROOT_DIR, rewritten.map((e) => e.name)]]);
}
async function writeZodSchemasFromVerbs(verbOptions, schemasPath, fileExtension, header, output, context, schemaTagMap) {
	const isSplit = !!schemaTagMap;
	const zodContext = context;
	const verbOptionsArray = Object.values(verbOptions);
	if (verbOptionsArray.length === 0) return /* @__PURE__ */ new Map();
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const useReusableSchemas = output.override.zod.generateReusableSchemas === true;
	const useNamedParameters = output.override.useNamedParameters ?? false;
	const uniqueVerbsSchemas = dedupeSchemasByName(verbOptionsArray.flatMap((verbOption) => {
		const operation = verbOption.originalOperation;
		const shouldGenerate = {
			...output.override.zod.generate,
			...verbOption.override?.zod.generate
		};
		const requestBody = operation.requestBody;
		const requestBodyContent = requestBody && "content" in requestBody ? requestBody.content : void 0;
		const jsonBodyMedia = requestBodyContent?.["application/json"];
		const formDataBodyMedia = requestBodyContent?.["multipart/form-data"];
		const formUrlEncodedBodyMedia = requestBodyContent?.["application/x-www-form-urlencoded"];
		const [bodyContentType, bodyMedia] = jsonBodyMedia ? ["application/json", jsonBodyMedia] : formDataBodyMedia ? ["multipart/form-data", formDataBodyMedia] : formUrlEncodedBodyMedia ? ["application/x-www-form-urlencoded", formUrlEncodedBodyMedia] : [void 0, void 0];
		const bodySchema = bodyMedia?.schema;
		const bodySchemas = shouldGenerate.body && bodySchema ? [{
			name: `${pascal(verbOption.typeName)}Body`,
			schema: useReusableSchemas ? bodySchema : dereference(bodySchema, zodContext),
			bodyContentType,
			encoding: bodyMedia?.encoding
		}] : [];
		const parameters = operation.parameters;
		const pathParams = parameters?.filter((p) => "in" in p && p.in === "path");
		const pathParamsSchemas = useNamedParameters && shouldGenerate.param && pathParams && pathParams.length > 0 ? [{
			name: `${pascal(verbOption.typeName)}PathParameters`,
			schema: {
				type: "object",
				properties: Object.fromEntries(pathParams.filter((p) => "schema" in p && p.schema).map((p) => [p.name, useReusableSchemas ? p.schema : dereference(p.schema, zodContext)])),
				required: pathParams.filter((p) => p.required).map((p) => p.name).filter((name) => name !== void 0)
			}
		}] : [];
		const queryParams = parameters?.filter((p) => "in" in p && p.in === "query");
		const queryParamsSchemas = shouldGenerate.query && queryParams && queryParams.length > 0 ? [{
			name: `${pascal(verbOption.typeName)}Params`,
			schema: {
				type: "object",
				properties: Object.fromEntries(queryParams.filter((p) => "schema" in p && p.schema).map((p) => [p.name, useReusableSchemas ? p.schema : dereference(p.schema, zodContext)])),
				required: queryParams.filter((p) => p.required).map((p) => p.name).filter((name) => name !== void 0)
			}
		}] : [];
		const headerParams = parameters?.filter((p) => "in" in p && p.in === "header");
		const headerParamsSchemas = shouldGenerate.header && headerParams && headerParams.length > 0 ? [{
			name: `${pascal(verbOption.typeName)}Headers`,
			schema: {
				type: "object",
				properties: Object.fromEntries(headerParams.filter((p) => "schema" in p && p.schema).map((p) => [p.name, useReusableSchemas ? p.schema : dereference(p.schema, zodContext)])),
				required: headerParams.filter((p) => p.required).map((p) => p.name).filter((name) => name !== void 0)
			}
		}] : [];
		const responseSchemas = shouldGenerate.response ? [...verbOption.response.types.success, ...verbOption.response.types.errors].filter((responseType) => !!responseType.originalSchema && !responseType.isRef && isValidSchemaIdentifier(responseType.value) && !isPrimitiveSchemaName(responseType.value)).map((responseType) => ({
			name: responseType.value,
			schema: useReusableSchemas ? responseType.originalSchema : dereference(responseType.originalSchema, zodContext)
		})) : [];
		return dedupeSchemasByName([
			...bodySchemas,
			...pathParamsSchemas,
			...queryParamsSchemas,
			...headerParamsSchemas,
			...responseSchemas
		]).map((s) => ({
			...s,
			verbTagDir: isSplit ? kebab(verbOption.tags?.[0] ?? DefaultTag) : ROOT_DIR
		}));
	}));
	const schemasToWrite = [];
	for (const entry of uniqueVerbsSchemas) {
		if (useReusableSchemas && entry.schema && typeof entry.schema.$ref === "string" && Object.keys(entry.schema).length === 1) continue;
		const { name, schema } = entry;
		const fileName = conventionName(name, output.namingConvention);
		const tagDir = entry.verbTagDir ?? ROOT_DIR;
		const filePath = isSplit ? path.join(schemasPath, tagDir, `${fileName}${fileExtension}`) : path.join(schemasPath, `${fileName}${fileExtension}`);
		const parsedZodDefinition = parseZodValidationSchemaDefinition("bodyContentType" in entry && entry.bodyContentType === "multipart/form-data" ? generateFormDataZodSchema(schema, zodContext, name, strict, isZodV4, "encoding" in entry ? entry.encoding : void 0, useReusableSchemas) : generateZodValidationSchemaDefinition(schema, zodContext, name, strict, isZodV4, {
			required: true,
			useReusableSchemas
		}), zodContext, coerce, strict, isZodV4, void 0, void 0, output.override.zod.variant, output.override.zod.exactOptional);
		let zodExpression = parsedZodDefinition.zod;
		let importStatements;
		if (useReusableSchemas && parsedZodDefinition.usedRefs.size > 0) {
			zodExpression = rewriteSentinelsToDirect(zodExpression);
			const importExt = getImportExtension(fileExtension, output.tsconfig);
			importStatements = [...parsedZodDefinition.usedRefs].filter((refName) => refName !== name).toSorted().map((refName) => {
				const importedFile = conventionName(refName, output.namingConvention);
				return `import { ${refName} } from '${isSplit ? computeCrossDirImportPath(schemasPath, tagDir, getSchemaDir(schemaTagMap, refName), importedFile, importExt) : `./${importedFile}${importExt}`}';`;
			});
		}
		schemasToWrite.push({
			schemaName: name,
			filePath,
			consts: parsedZodDefinition.consts,
			zodExpression,
			importStatements
		});
	}
	const groupedSchemasToWrite = groupSchemasByFilePath(schemasToWrite);
	for (const schemaGroup of groupedSchemasToWrite) {
		const fileContent = generateZodSchemaFileContent(header, schemaGroup, output.override.zod.variant);
		await fs$2.outputFile(schemaGroup[0].filePath, fileContent);
	}
	const writtenSchemaNames = groupedSchemasToWrite.map((schemaGroup) => schemaGroup[0].schemaName);
	if (output.indexFiles && !isSplit && uniqueVerbsSchemas.length > 0) await writeZodSchemaIndex(schemasPath, fileExtension, header, writtenSchemaNames, output.namingConvention, true, output.tsconfig);
	if (isSplit) {
		const dirSchemas = /* @__PURE__ */ new Map();
		for (const entry of uniqueVerbsSchemas) {
			if (useReusableSchemas && entry.schema && typeof entry.schema.$ref === "string" && Object.keys(entry.schema).length === 1) continue;
			const dir = entry.verbTagDir ?? ROOT_DIR;
			if (!dirSchemas.has(dir)) dirSchemas.set(dir, []);
			dirSchemas.get(dir).push(entry.name);
		}
		return dirSchemas;
	}
	return new Map([[ROOT_DIR, writtenSchemaNames]]);
}
//#endregion
//#region src/write-specs.ts
async function runExternalFormatter(bin, args, projectTitle) {
	try {
		await execa(bin, args);
	} catch (error) {
		let message;
		if (error instanceof ExecaError) message = error.code === "ENOENT" ? `⚠️  ${projectTitle ? `${projectTitle} - ` : ""}${bin} not found` : error.message;
		else if (error instanceof Error) message = error.message;
		else message = `⚠️  ${projectTitle ? `${projectTitle} - ` : ""}${bin} failed`;
		logWarning(message);
	}
}
async function runFormatter(formatter, paths, projectTitle) {
	switch (formatter) {
		case SupportedFormatter.PRETTIER:
			await formatWithPrettier(paths, projectTitle);
			break;
		case SupportedFormatter.BIOME:
			await runExternalFormatter(SupportedFormatter.BIOME, [
				"check",
				"--write",
				...paths
			], projectTitle);
			break;
		case SupportedFormatter.OXFMT:
			await runExternalFormatter(SupportedFormatter.OXFMT, paths, projectTitle);
			break;
	}
}
function getComparableFilePath(filePath) {
	const resolvedPath = path.resolve(filePath);
	let comparablePath = resolvedPath;
	try {
		comparablePath = fs$2.realpathSync(resolvedPath);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	return process.platform === "win32" || process.platform === "darwin" ? comparablePath.toLowerCase() : comparablePath;
}
function excludeFilePath(filePaths, filePathToExclude) {
	const comparablePathToExclude = getComparableFilePath(filePathToExclude);
	return filePaths.map((filePath) => ({
		filePath,
		comparablePath: getComparableFilePath(filePath)
	})).filter(({ comparablePath }) => comparablePath !== comparablePathToExclude).map(({ filePath }) => filePath);
}
function getHeader(option, info) {
	if (!option) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
}
/**
* Add re-export of operation schemas from the main schemas index file.
* Handles the case where the index file doesn't exist (no regular schemas).
*
* NOTE: `operationSchemasPath` is a directory, so under NodeNext the re-export
* would need an `/index.js` suffix rather than a bare `.js`. That directory-
* import case is tracked separately and intentionally left as-is here.
*/
async function addOperationSchemasReExport(schemaPath, operationSchemasPath, header) {
	const schemaIndexPath = path.join(schemaPath, `index.ts`);
	const esmImportPath = upath.getRelativeImportPath(schemaIndexPath, operationSchemasPath);
	const exportLine = `export * from '${esmImportPath}';\n`;
	if (await fs$2.pathExists(schemaIndexPath)) {
		if (!readReExportSpecifiers(await fs$2.readFile(schemaIndexPath, "utf8")).has(esmImportPath)) await fs$2.appendFile(schemaIndexPath, exportLine);
	} else {
		const content = header && header.trim().length > 0 ? `${header}\n${exportLine}` : exportLine;
		await fs$2.outputFile(schemaIndexPath, content);
	}
}
/**
* Emit `<schemas-dir>/index.faker.ts` (or `<output-root>/schemas.faker.ts`
* when `output.schemas` is not configured) when a faker generator entry has
* `schemas: true`. Each `components/schemas` entry becomes a
* `get<SchemaName>Mock(overrides)` factory in the file. Returns the written
* file path so callers can include it in formatter / hook runs, or
* `undefined` if no file was written.
*/
async function writeFakerSchemaMocks(builder, options, header, schemaTagMap) {
	const { output } = options;
	const fakerEntry = output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && g.schemas === true);
	if (!fakerEntry) return;
	const schemasWithDef = builder.schemas.filter((s) => !!s.schema);
	if (schemasWithDef.length === 0) return;
	const { implementation, imports, strictMockSchemaTypeNames, strictMockSchemaKinds } = generateFakerForSchemas(schemasWithDef, {
		spec: builder.spec,
		target: builder.target,
		workspace: "",
		output
	}, fakerEntry);
	if (!implementation.trim()) return;
	const finalizedImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(implementation, {
		mockOptions: output.override.mock,
		strictSchemaTypeNames: strictMockSchemaTypeNames,
		strictMockSchemaKinds
	}) : implementation;
	let filePath;
	let schemaImportPath;
	const fileExtension = output.fileExtension || ".ts";
	if (output.schemas) {
		const schemasDir = isString(output.schemas) ? output.schemas : output.schemas.path;
		filePath = path.join(schemasDir, `index.faker${fileExtension}`);
		schemaImportPath = ".";
	} else {
		const targetInfo = output.target ? getFileInfo(output.target, { extension: fileExtension }) : void 0;
		const dir = targetInfo?.dirname ?? process.cwd();
		filePath = path.join(dir, `schemas.faker${fileExtension}`);
		schemaImportPath = targetInfo ? `./${targetInfo.filename}${getImportExtension(fileExtension, output.tsconfig)}` : void 0;
	}
	const isZodSchemaOutput = isObject(output.schemas) && output.schemas.type === "zod";
	const importExtension = getImportExtension(fileExtension, output.tsconfig);
	const schemaSuffix = isZodSchemaOutput ? ".zod" : "";
	const perSchemaImportPath = /* @__PURE__ */ new Map();
	if (schemaImportPath === "." && !output.indexFiles && isObject(output.schemas)) for (const schema of builder.schemas) {
		const tsName = pascal(schema.name);
		const fileName = conventionName(schema.name, output.namingConvention);
		const tagDir = schemaTagMap?.get(schema.name);
		const tagSegment = tagDir && tagDir !== "." ? `${tagDir}/` : "";
		perSchemaImportPath.set(tsName, `./${tagSegment}${fileName}${schemaSuffix}${importExtension}`);
	}
	const reroutedImports = imports.map((imp) => {
		if (imp.importPath) return imp;
		if (imp.schemaFactory) return {
			...imp,
			importPath: "."
		};
		const resolved = perSchemaImportPath.get(imp.name);
		if (resolved) return {
			...imp,
			importPath: resolved
		};
		return {
			...imp,
			importPath: schemaImportPath
		};
	});
	const grouped = /* @__PURE__ */ new Map();
	for (const imp of reroutedImports) {
		const key = imp.importPath ?? "";
		if (!key) continue;
		const bucket = grouped.get(key) ?? [];
		bucket.push(imp);
		grouped.set(key, bucket);
	}
	const content = `${header}${generateDependencyImports(finalizedImplementation, [{
		exports: [{
			name: "faker",
			values: true
		}],
		dependency: fakerEntry.locale ? `@faker-js/faker/locale/${fakerEntry.locale}` : "@faker-js/faker"
	}, ...[...grouped.entries()].map(([dependency, exports]) => ({
		exports,
		dependency
	}))], void 0, !!output.schemas, false)}\n\n${finalizedImplementation}`;
	await writeGeneratedFile(filePath, content);
	return filePath;
}
function isSchemaValidatorClient(client) {
	return client === "zod" || client === "effect";
}
function shouldGenerateZodSchemasInline(output, hasOperations) {
	if (output.client !== "zod" || output.schemas) return false;
	if (output.override.zod.generateReusableSchemas) return true;
	return !hasOperations;
}
function shouldGenerateSchemas(output, hasOperations) {
	return !output.schemas && !isSchemaValidatorClient(output.client) || shouldGenerateZodSchemasInline(output, hasOperations);
}
function getImplementationPathsForIndex(output, implementationPaths, indexFile) {
	const shouldExcludeSelf = output.indexFiles;
	const paths = shouldExcludeSelf ? excludeFilePath(implementationPaths, indexFile) : implementationPaths;
	if (shouldExcludeSelf && output.mode === OutputMode.SPLIT && getComparableFilePath(output.target) === getComparableFilePath(indexFile)) {
		const targetInfo = getFileInfo(output.target, { extension: output.fileExtension });
		return excludeFilePath(paths, path.join(targetInfo.dirname, `${targetInfo.filename}.schemas${output.fileExtension}`));
	}
	if (!(output.mode === OutputMode.TAGS_OPERATIONS || output.mode === OutputMode.TAGS_OPERATIONS_SPLIT) || !shouldExcludeSelf) return paths;
	const targetInfo = getFileInfo(output.target, { extension: output.fileExtension });
	const rootBarrel = path.join(targetInfo.dirname, `index${output.fileExtension}`);
	const globalSchemas = path.join(targetInfo.dirname, `${targetInfo.filename}.schemas${output.fileExtension}`);
	return paths.filter((p) => getComparableFilePath(p) === getComparableFilePath(rootBarrel) || getComparableFilePath(p) === getComparableFilePath(globalSchemas));
}
async function writeSpecs(builder, workspace, options, projectName) {
	const { info, schemas, target } = builder;
	const { output } = options;
	const shouldSplitSchemasByTags = isObject(output.schemas) && output.schemas.splitByTags;
	const schemaTagMap = shouldSplitSchemasByTags ? buildSchemaTagMap(Object.values(builder.operations).map((op) => ({
		imports: op.imports,
		tags: op.tags
	})), schemas) : void 0;
	const projectTitle = projectName ?? info.title;
	const header = getHeader(output.override.header, info);
	if (output.schemas) {
		const schemasPath = isString(output.schemas) ? output.schemas : output.schemas.path;
		const isZodSchemas = !isString(output.schemas) && output.schemas.type === "zod" || isString(output.schemas) && output.client === "zod" && output.override.zod.generateReusableSchemas;
		if (shouldSplitSchemasByTags && output.operationSchemas) throw new Error("schemas.splitByTags cannot be used with output.operationSchemas. The tags-split schema mode handles operation type placement within tag directories.");
		if (isZodSchemas) {
			const fileExtension = output.schemaFileExtension;
			const schemasParamsMutator = output.override.zod.params ? await generateMutator({
				output: path.join(schemasPath, `__params__${fileExtension}`),
				mutator: output.override.zod.params,
				name: "zodParams",
				workspace,
				tsconfig: output.tsconfig
			}) : void 0;
			if (shouldSplitSchemasByTags) {
				const componentDirs = await writeZodSchemas(builder, schemasPath, fileExtension, header, output, schemasParamsMutator, schemaTagMap);
				const verbDirs = await writeZodSchemasFromVerbs(builder.verbOptions, schemasPath, fileExtension, header, output, {
					spec: builder.spec,
					target: builder.target,
					workspace,
					output
				}, schemaTagMap);
				if (output.indexFiles) await writeZodSchemaTagsSplitBarrel(schemasPath, fileExtension, header, componentDirs, verbDirs, output.namingConvention, output.tsconfig);
			} else {
				await writeZodSchemas(builder, schemasPath, fileExtension, header, output, schemasParamsMutator);
				await writeZodSchemasFromVerbs(builder.verbOptions, schemasPath, fileExtension, header, output, {
					spec: builder.spec,
					target: builder.target,
					workspace,
					output
				});
			}
		} else {
			const fileExtension = output.fileExtension || ".ts";
			if (shouldSplitSchemasByTags) await writeSchemasTagsSplit({
				schemaPath: schemasPath,
				schemas,
				target,
				namingConvention: output.namingConvention,
				fileExtension,
				header,
				indexFiles: output.indexFiles,
				tsconfig: output.tsconfig,
				factoryOutputDirectory: output.factoryMethods?.outputDirectory,
				operations: Object.values(builder.operations).map((op) => ({
					imports: op.imports,
					tags: op.tags
				}))
			});
			else if (output.operationSchemas) {
				const { regularSchemas, operationSchemas: opSchemas } = splitSchemasByType(schemas);
				const regularSchemaNames = new Set(regularSchemas.map((s) => s.name));
				const operationSchemaNames = new Set(opSchemas.map((s) => s.name));
				fixCrossDirectoryImports(opSchemas, regularSchemaNames, schemasPath, output.operationSchemas, output.namingConvention, fileExtension, output.tsconfig);
				fixRegularSchemaImports(regularSchemas, operationSchemaNames, schemasPath, output.operationSchemas, output.namingConvention, fileExtension, output.tsconfig);
				if (regularSchemas.length > 0) await writeSchemas({
					schemaPath: schemasPath,
					schemas: regularSchemas,
					target,
					namingConvention: output.namingConvention,
					fileExtension,
					header,
					indexFiles: output.indexFiles,
					tsconfig: output.tsconfig,
					factoryOutputDirectory: output.factoryMethods?.outputDirectory
				});
				if (opSchemas.length > 0) {
					await writeSchemas({
						schemaPath: output.operationSchemas,
						schemas: opSchemas,
						target,
						namingConvention: output.namingConvention,
						fileExtension,
						header,
						indexFiles: output.indexFiles,
						tsconfig: output.tsconfig,
						factoryOutputDirectory: output.factoryMethods?.outputDirectory
					});
					if (output.indexFiles) await addOperationSchemasReExport(schemasPath, output.operationSchemas, header);
				}
			} else await writeSchemas({
				schemaPath: schemasPath,
				schemas,
				target,
				namingConvention: output.namingConvention,
				fileExtension,
				header,
				indexFiles: output.indexFiles,
				tsconfig: output.tsconfig,
				factoryOutputDirectory: output.factoryMethods?.outputDirectory
			});
		}
	}
	const fakerSchemaPath = await writeFakerSchemaMocks(builder, options, header, schemaTagMap);
	let implementationPaths = [];
	if (output.target) {
		const writeMode = getWriteMode(output.mode);
		const hasOperations = Object.keys(builder.operations).length > 0;
		const needZodSchemasInline = shouldGenerateZodSchemasInline(output, hasOperations);
		const includeZodImport = !Object.values(builder.operations).some((operation) => /\bzod\b/.test(operation.implementation));
		const inlineSchemasParamsMutator = needZodSchemasInline && output.override.zod.params ? await generateMutator({
			output: output.target,
			mutator: output.override.zod.params,
			name: "zodParams",
			workspace,
			tsconfig: output.tsconfig
		}) : void 0;
		const isSchemasInSeparateFile = output.mode !== OutputMode.SINGLE;
		const includeParamsImport = !hasOperations || isSchemasInSeparateFile;
		implementationPaths = await writeMode({
			builder,
			workspace,
			output,
			projectName,
			header,
			needSchema: shouldGenerateSchemas(output, hasOperations),
			schemaTagMap,
			generateSchemasInline: needZodSchemasInline ? () => generateZodSchemasInline(builder, output, includeZodImport, inlineSchemasParamsMutator, includeParamsImport) : void 0
		});
	}
	if (output.workspace) {
		const workspacePath = output.workspace;
		const indexFile = path.join(workspacePath, "index.ts");
		const mockExtensions = output.mock.generators.map((g) => getMockFileExtensionByTypeName(g));
		const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
		const imports = getImplementationPathsForIndex(output, implementationPaths, indexFile).filter((p) => mockExtensions.length === 0 || !mockExtensions.some((ext) => p.endsWith(`.${ext}.ts`))).map((p) => {
			const relative = upath.getRelativeImportPath(indexFile, p, true);
			return (relative.endsWith(output.fileExtension) ? relative.slice(0, -output.fileExtension.length) : relative.replace(/\.[^/.]+$/, "")) + importExtension;
		});
		if (output.schemas) {
			const schemasPath = isString(output.schemas) ? output.schemas : output.schemas.path;
			imports.push(upath.getRelativeImportPath(indexFile, getFileInfo(schemasPath).dirname));
		}
		if (output.operationSchemas) imports.push(upath.getRelativeImportPath(indexFile, getFileInfo(output.operationSchemas).dirname));
		if (output.indexFiles) {
			if (await fs$2.pathExists(indexFile)) {
				const declared = readReExportSpecifiers(await fs$2.readFile(indexFile, "utf8"));
				const toAdd = [...new Set(imports.filter((imp) => !declared.has(imp)))];
				if (toAdd.length > 0) await fs$2.appendFile(indexFile, toAdd.map((imp) => `export * from '${imp}';\n`).join(""));
			} else await fs$2.outputFile(indexFile, `${[...new Set(imports)].map((imp) => `export * from '${imp}';`).join("\n")}\n`);
			implementationPaths = [indexFile, ...excludeFilePath(implementationPaths, indexFile)];
		}
	}
	if (builder.extraFiles.length > 0) {
		await Promise.all(builder.extraFiles.map(async (file) => fs$2.outputFile(file.path, file.content)));
		implementationPaths = [...implementationPaths, ...builder.extraFiles.map((file) => file.path)];
	}
	const paths = [
		...output.schemas ? [getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path).dirname] : [],
		...fakerSchemaPath ? [fakerSchemaPath] : [],
		...output.operationSchemas ? [getFileInfo(output.operationSchemas).dirname] : [],
		...implementationPaths
	];
	if (options.hooks.afterAllFilesWrite) await executeHook("afterAllFilesWrite", options.hooks.afterAllFilesWrite, paths);
	await runFormatter(output.formatter, paths, projectTitle);
	if (output.docs) try {
		let config = {};
		let configPath;
		if (isObject(output.docs)) {
			({configPath, ...config} = output.docs);
			if (configPath) config.options = configPath;
		}
		const getTypedocApplication = async () => {
			const { Application } = await import("typedoc");
			return Application;
		};
		const app = await (await getTypedocApplication()).bootstrapWithPlugins({
			entryPoints: paths.map((x) => upath.toUnix(x)),
			theme: "markdown",
			skipErrorChecking: true,
			...config,
			plugin: ["typedoc-plugin-markdown", ...config.plugin ?? []]
		});
		if (!app.options.isSet("readme")) app.options.setValue("readme", "none");
		if (!app.options.isSet("logLevel")) app.options.setValue("logLevel", "None");
		const project = await app.convert();
		if (project) {
			const outputPath = app.options.getValue("out");
			await app.generateDocs(project, outputPath);
			await runFormatter(output.formatter, [outputPath], projectTitle);
		} else throw new Error("TypeDoc not initialized");
	} catch (error) {
		logWarning(error instanceof Error ? error.message : `⚠️  ${projectTitle ? `${projectTitle} - ` : ""}Unable to generate docs`);
	}
	createSuccessMessage(projectTitle);
}
function getWriteMode(mode) {
	switch (mode) {
		case OutputMode.SPLIT: return writeSplitMode;
		case OutputMode.TAGS: return writeTagsMode;
		case OutputMode.TAGS_SPLIT: return writeSplitTagsMode;
		case OutputMode.TAGS_OPERATIONS: return writeTagsOperationsMode;
		case OutputMode.TAGS_OPERATIONS_SPLIT: return writeTagsOperationsSplitMode;
		default: return writeSingleMode;
	}
}
//#endregion
//#region src/generate-spec.ts
/**
* Generate client/spec files for a single Orval project.
*
* @param workspace - Absolute or relative workspace path used to resolve imports.
* @param options - Normalized generation options for this project.
* @param projectName - Optional project name used in logging output.
* @returns A promise that resolves once generation (and optional cleaning) completes.
*
* @example
* await generateSpec(process.cwd(), normalizedOptions, 'my-project');
*/
async function generateSpec(workspace, options, projectName) {
	if (options.output.clean) {
		const extraPatterns = Array.isArray(options.output.clean) ? options.output.clean : [];
		if (options.output.target) await removeFilesAndEmptyFolders([
			"**/*",
			"!**/*.d.ts",
			...extraPatterns
		], getFileInfo(options.output.target).dirname);
		if (options.output.schemas) {
			const schemasPath = isString(options.output.schemas) ? options.output.schemas : options.output.schemas.path;
			await removeFilesAndEmptyFolders([
				"**/*",
				"!**/*.d.ts",
				...extraPatterns
			], getFileInfo(schemasPath).dirname);
		}
		log(`${projectName} Cleaning output folder`);
	}
	await writeSpecs(await importSpecs(workspace, options, projectName), workspace, options, projectName);
}
//#endregion
//#region src/utils/config.ts
/**
* Resolve the Orval config file path.
*
* @param configFilePath - Optional path to the config file (absolute or relative).
* @returns The absolute path to the resolved config file.
* @throws If a provided path does not exist or if no config file is found.
*
* @example
* // explicit path
* const p = findConfigFile('./orval.config.ts');
*
* @example
* // automatic discovery (searches process.cwd())
* const p = findConfigFile();
*/
function findConfigFile(configFilePath) {
	if (configFilePath) {
		const absolutePath = path.isAbsolute(configFilePath) ? configFilePath : path.resolve(process.cwd(), configFilePath);
		if (!fs$1.existsSync(absolutePath)) throw new Error(`Config file ${configFilePath} does not exist`);
		return absolutePath;
	}
	const root = process.cwd();
	for (const ext of [
		".ts",
		".js",
		".mjs",
		".mts"
	]) {
		const fullPath = path.resolve(root, `orval.config${ext}`);
		if (fs$1.existsSync(fullPath)) return fullPath;
	}
	throw new Error(`No config file found in ${root}`);
}
/**
* Load an Orval config file
* @param configFilePath - Path to the config file (absolute or relative).
* @returns The resolved Orval `Config` object.
* @throws If the module does not provide a default export or the default export resolves to `undefined`.
*
* @example
* // load a config object
* const cfg = await loadConfigFile('./orval.config.ts');
*/
async function loadConfigFile(configFilePath) {
	const configExternal = await createJiti(process.cwd(), { interopDefault: true }).import(configFilePath, { default: true });
	if (configExternal === void 0) throw new Error(`${configFilePath} doesn't have a default export`);
	return await (isFunction(configExternal) ? configExternal() : configExternal);
}
//#endregion
export { defineConfig as a, description as c, startWatcher as i, name as l, loadConfigFile as n, defineTransformer as o, generateSpec as r, normalizeOptions as s, findConfigFile as t, version as u };

//# sourceMappingURL=config-18E5SVPo.mjs.map