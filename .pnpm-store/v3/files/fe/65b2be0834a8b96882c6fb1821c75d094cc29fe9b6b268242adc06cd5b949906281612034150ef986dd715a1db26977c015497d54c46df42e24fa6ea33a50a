import { EnumGeneration, OutputMockType, OutputMode, PropertySortOrder, camelPathParamName, compareVersions, escapeRegExp, generalJSTypesWithArray, generateDependencyImports, getKey, getOperationTagKey, getRefInfo, isBoolean, isFunction, isMswMock, isNumber, isObject, isReference, isSchema, isString, jsStringLiteralEscape, mergeDeep, pascal, resolveRef, stringify, toColonRoutePath } from "@orval/core";
import { prop } from "remeda";
//#region src/mock-types.ts
function isStrictMock(mockOptions) {
	return Boolean(mockOptions && mockOptions.required && mockOptions.nonNullable);
}
function getStrictMockTypeName(typeName) {
	return `${typeName}Mock`;
}
function getStrictMockHelperTypeDeclarations() {
	return `export type KeysWithNull<O> = {
  [K in keyof O]-?: null extends O[K] ? K : never;
}[keyof O];

export type MockWithNullableOverrides<
  T,
  O extends Partial<T>,
  M extends Record<keyof T, unknown>,
> = Omit<M, Extract<KeysWithNull<O>, keyof T>> & {
  [K in Extract<KeysWithNull<O>, keyof T>]: M[K] | null;
};`;
}
function classifyStrictMockSchemaType(schema, context) {
	if (!schema) return "object";
	if (schema.format === "binary" || schema.contentMediaType === "application/octet-stream" && !schema.contentEncoding) return "binary";
	if (typeof schema.$ref === "string") {
		if (context) {
			const { schema: resolved } = resolveRef(schema, context);
			return classifyStrictMockSchemaType(resolved, context);
		}
		return "object";
	}
	if (schema.type === "object" || schema.properties || isComposedObjectSchema(schema)) return "object";
	return "alias";
}
function isComposedObjectSchema(schema) {
	const branches = schema.oneOf ?? schema.anyOf ?? schema.allOf;
	if (!branches?.length) return false;
	return branches.some((branch) => {
		const item = branch;
		if (typeof item.$ref === "string" || item.type === "object" || item.properties) return true;
		return isComposedObjectSchema(item);
	});
}
function getStrictMockTypeDeclaration(typeName, kind = "object", options) {
	const mockTypeName = getStrictMockTypeName(typeName);
	if (kind === "alias") return `export type ${mockTypeName} = ${typeName};`;
	if (kind === "binary") return `export type ${mockTypeName} = ArrayBuffer;`;
	const mappedType = `{\n  [K in keyof Required<NonNullable<${typeName}>>]: NonNullable<Required<NonNullable<${typeName}>>[K]>;\n}`;
	return `export type ${mockTypeName} = ${options?.schemaNullableAtRoot ? `${mappedType} | null` : mappedType};`;
}
function getStrictMockTypeDeclarations(typeNames, kinds, nullableAtRoot) {
	const unique = [...new Set(typeNames)];
	if (unique.length === 0) return "";
	return unique.map((typeName) => getStrictMockTypeDeclaration(typeName, kinds?.[typeName] ?? "object", { schemaNullableAtRoot: nullableAtRoot?.[typeName] })).join("\n\n");
}
function strictMockResolvedImportMatches(typeName, resolvedImport, importBareName) {
	const resolvedName = resolvedImport?.name;
	if (!resolvedName) return false;
	if (typeName === resolvedName) return true;
	if (resolvedImport.alias && typeName === resolvedImport.alias) return true;
	return importBareName !== void 0 && importBareName === resolvedName;
}
function resolveStrictMockSchemaForTypeName(typeName, originalSchema, context, importBareName) {
	if (!originalSchema) return;
	if (!context) return originalSchema;
	const branches = originalSchema.oneOf ?? originalSchema.anyOf ?? originalSchema.allOf;
	if (branches?.length) {
		for (const branch of branches) {
			if (typeof branch.$ref !== "string") continue;
			const resolved = resolveRef(branch, context);
			if (strictMockResolvedImportMatches(typeName, resolved.imports[0], importBareName)) return resolved.schema;
		}
		return;
	}
	if (typeof originalSchema.$ref === "string") {
		const resolved = resolveRef(originalSchema, context);
		if (strictMockResolvedImportMatches(typeName, resolved.imports[0], importBareName)) return resolved.schema;
		return;
	}
	return originalSchema;
}
function getMockFactoryReturnType(typeName, mockOptions) {
	return isStrictMock(mockOptions) ? getStrictMockTypeName(typeName) : typeName;
}
function getMockFactorySignatureParts(typeName, mockOptions, options = {}) {
	const isOverridable = options.isOverridable ?? false;
	const overrideType = options.overrideType ?? `Partial<${typeName}>`;
	const mockTypeName = getStrictMockTypeName(typeName);
	if (!isOverridable) return {
		param: "",
		returnType: getMockFactoryReturnType(typeName, mockOptions),
		returnCast: ""
	};
	if (isStrictMock(mockOptions)) return {
		param: `<O extends ${overrideType} = {}>(overrideResponse?: O)`,
		returnType: `MockWithNullableOverrides<${typeName}, O, ${mockTypeName}>`,
		returnCast: ` as MockWithNullableOverrides<${typeName}, O, ${mockTypeName}>`
	};
	return {
		param: `overrideResponse: ${overrideType} = {}`,
		returnType: typeName,
		returnCast: ""
	};
}
function getSimpleSchemaReturnType(returnType, schemaTypeNames) {
	const trimmed = returnType.trim();
	return schemaTypeNames.includes(trimmed) ? trimmed : void 0;
}
function formatMockFactoryDeclaration(factoryName, param, returnType, body, returnCast, options) {
	return `${param ? param.startsWith("<") ? `export const ${factoryName} = ${param}` : `export const ${factoryName} = (${param})` : `export const ${factoryName} = ()`}${options?.omitReturnType || !returnType ? "" : `: ${returnType}`} => (${body})${returnCast}${returnCast || options?.terminateStatement ? ";" : ""}`;
}
function getSchemaTypeNamesFromResponses(responses) {
	const names = /* @__PURE__ */ new Set();
	for (const response of responses) {
		for (const imp of response.imports) {
			if (imp.values || imp.schemaFactory) continue;
			const importName = imp.alias ?? imp.name;
			if (/^[A-Z]\w*$/.test(importName)) names.add(importName);
		}
		const { value } = response;
		if (!value) continue;
		const baseType = value.endsWith("[]") ? value.slice(0, -2) : value;
		if (/^[A-Z]\w*$/.test(baseType)) names.add(baseType);
	}
	return [...names];
}
function getStrictMockSchemaKindsFromResponses(responses, context) {
	const kinds = {};
	for (const response of responses) {
		for (const imp of response.imports) {
			if (imp.values || imp.schemaFactory) continue;
			const importName = imp.alias ?? imp.name;
			if (!/^[A-Z]\w*$/.test(importName)) continue;
			const schemaForImport = resolveStrictMockSchemaForTypeName(importName, response.originalSchema, context, imp.name);
			if (!schemaForImport) continue;
			kinds[importName] = classifyStrictMockSchemaType(schemaForImport, context);
		}
		const { value } = response;
		if (!value || !response.originalSchema) continue;
		const baseType = value.endsWith("[]") ? value.slice(0, -2) : value;
		if (!/^[A-Z]\w*$/.test(baseType)) continue;
		const schema = response.originalSchema;
		if (value.endsWith("[]") && schema.type === "array" && schema.items) {
			const items = schema.items;
			kinds[baseType] = classifyStrictMockSchemaType(items, context);
			continue;
		}
		kinds[baseType] = classifyStrictMockSchemaType(resolveStrictMockSchemaForTypeName(baseType, response.originalSchema, context) ?? response.originalSchema, context);
	}
	return kinds;
}
function buildStrictMockTypeFileHeader(schemaTypeNames, kinds) {
	const schemaBlock = getStrictMockTypeDeclarations([...new Set(schemaTypeNames)], kinds);
	return [getStrictMockHelperTypeDeclarations(), schemaBlock].filter(Boolean).join("\n\n");
}
/**
* Prepends shared strict-mock helper types and each `{Schema}Mock` alias once at
* the top of a mock file. Generators pass `strictSchemaTypeNames`; no scraping.
*
* Not idempotent — callers must invoke this exactly once per aggregated mock
* file (writers and `writeFakerSchemaMocks`), not from import hooks.
*/
function dedupeStrictMockTypeDeclarations(implementation, options = {}) {
	if (!isStrictMock(options.mockOptions)) return implementation;
	const schemaTypeNames = options.strictSchemaTypeNames ? [...new Set(options.strictSchemaTypeNames)] : [];
	if (schemaTypeNames.length === 0) return implementation;
	return `${buildStrictMockTypeFileHeader(schemaTypeNames, options.strictMockSchemaKinds)}\n\n${implementation.trimStart()}`;
}
function applyStrictMockReturnType(returnType, schemaTypeNames) {
	if (schemaTypeNames.length === 0) return returnType;
	let result = returnType;
	const sorted = [...schemaTypeNames].toSorted((a, b) => b.length - a.length);
	for (const name of sorted) result = result.replaceAll(new RegExp(String.raw`\b${escapeRegExp(name)}\b`, "g"), getStrictMockTypeName(name));
	return result;
}
const STRICT_MOCK_SCHEMA_TYPE_FROM_OVERRIDES = /MockWithNullableOverrides<([A-Z]\w*),/g;
const STRICT_MOCK_SCHEMA_TYPE_FROM_OVERRIDE_ALIAS = /MockWithNullableOverrides<[^,]+,\s*[^,]+,\s*([A-Z]\w*Mock)>/g;
const STRICT_MOCK_SCHEMA_TYPE_FROM_MOCK_ALIAS_RETURN = /\): ([A-Z]\w*Mock)(?:\[\]|;)/g;
/** Inverse of {@link getStrictMockTypeName}: `PetMock` → `Pet`, `WidgetMockMock` → `WidgetMock`. */
function getSchemaTypeNameFromStrictMockAlias(alias) {
	return alias.endsWith("Mock") ? alias.slice(0, -4) : alias;
}
/**
* Collect schema type names referenced by strict mock factories in generated
* implementation text (nested split factories, array item helpers, etc.).
*
* This reverse-parses emitted factory syntax and is therefore coupled to the
* current `formatMockFactoryDeclaration` / `getMockFactorySignatureParts`
* shape. The structurally robust alternative is to record each nested item's
* schema name where split factories are generated (array-item / faker getters,
* where the `$ref` name is known) and thread it into `strictMockSchemaTypeNames`.
*/
function collectStrictMockSchemaTypeNamesFromImplementation(implementation) {
	const names = /* @__PURE__ */ new Set();
	for (const match of implementation.matchAll(STRICT_MOCK_SCHEMA_TYPE_FROM_OVERRIDES)) names.add(match[1]);
	for (const pattern of [STRICT_MOCK_SCHEMA_TYPE_FROM_OVERRIDE_ALIAS, STRICT_MOCK_SCHEMA_TYPE_FROM_MOCK_ALIAS_RETURN]) for (const match of implementation.matchAll(pattern)) names.add(getSchemaTypeNameFromStrictMockAlias(match[1]));
	return [...names];
}
function mergeStrictMockSchemaTypeNames(...groups) {
	const names = /* @__PURE__ */ new Set();
	for (const group of groups) {
		if (!group) continue;
		for (const name of group) names.add(name);
	}
	return names.size > 0 ? [...names] : void 0;
}
function mergeStrictMockSchemaKinds(...groups) {
	const merged = {};
	for (const group of groups) {
		if (!group) continue;
		for (const [name, kind] of Object.entries(group)) merged[name] ??= kind;
	}
	return Object.keys(merged).length > 0 ? merged : void 0;
}
//#endregion
//#region src/faker/imports.ts
/**
* Appends entries added to `source` since `sinceIndex`. Uses indexed push
* instead of spread so large import batches (common with `schemas: true`
* delegation on wide objects) do not overflow the call stack.
*/
function appendImportsDelta(target, source, sinceIndex) {
	for (let i = sinceIndex; i < source.length; i++) target.push(source[i]);
}
/**
* Merge imports returned from mock resolution when the shared imports array
* was not mutated in place. Enum mocks and nested object factories return
* their imports separately; schema-factory delegation mutates `sharedImports`
* directly and must not be merged again from `resolvedImports`.
*/
function mergeReturnedMockImports(sharedImports, sharedBefore, resolvedImports) {
	if (sharedImports.length === sharedBefore) appendImportsDelta(sharedImports, resolvedImports, 0);
}
/** Recover type imports referenced by nested oneOf split mock helpers. */
function collectSplitMockTypeImports(implementations) {
	const seen = /* @__PURE__ */ new Set();
	const imports = [];
	const addType = (name) => {
		if (!name || seen.has(name)) return;
		seen.add(name);
		imports.push({
			name,
			values: false
		});
	};
	for (const impl of implementations) {
		for (const match of impl.matchAll(/export const get\w+Mock = \(\s*overrideResponse: Partial<(\w+)[^)]*\):\s*(\w+)\s*=>/g)) {
			addType(match[1]);
			addType(match[2]);
		}
		for (const match of impl.matchAll(/export const get\w+Mock[\s\S]*?MockWithNullableOverrides<(?:Extract<(\w+),[^>]+>|(\w+)),/g)) addType(match[1] ?? match[2]);
	}
	return imports;
}
//#endregion
//#region src/delay.ts
const getDelay = (override, options) => {
	const mswOptions = options && isMswMock(options) ? options : void 0;
	const overrideMock = override?.mock;
	const overrideDelay = overrideMock?.delay ?? mswOptions?.delay;
	const delayFunctionLazyExecute = overrideMock?.delayFunctionLazyExecute ?? mswOptions?.delayFunctionLazyExecute;
	if (isFunction(overrideDelay)) return delayFunctionLazyExecute ? overrideDelay : overrideDelay();
	if (isNumber(overrideDelay) || isBoolean(overrideDelay)) return overrideDelay;
	return false;
};
//#endregion
//#region src/faker/compatible-v9.ts
const getFakerPackageVersion = (packageJson) => {
	return packageJson.resolvedVersions?.["@faker-js/faker"] ?? packageJson.dependencies?.["@faker-js/faker"] ?? packageJson.devDependencies?.["@faker-js/faker"] ?? packageJson.peerDependencies?.["@faker-js/faker"];
};
const isFakerVersionV9 = (packageJson) => {
	const version = getFakerPackageVersion(packageJson);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "9.0.0");
};
//#endregion
//#region src/faker/constants.ts
const DEFAULT_FORMAT_MOCK = {
	bic: "faker.finance.bic()",
	binary: "new ArrayBuffer(faker.number.int({ min: 1, max: 64 }))",
	city: "faker.location.city()",
	country: "faker.location.country()",
	date: "faker.date.past().toISOString().slice(0, 10)",
	"date-time": "faker.date.past().toISOString().slice(0, 19) + 'Z'",
	email: "faker.internet.email()",
	firstName: "faker.person.firstName()",
	gender: "faker.person.gender()",
	iban: "faker.finance.iban()",
	ipv4: "faker.internet.ipv4()",
	ipv6: "faker.internet.ipv6()",
	jobTitle: "faker.person.jobTitle()",
	lastName: "faker.person.lastName()",
	password: "faker.internet.password()",
	phoneNumber: "faker.phone.number()",
	streetName: "faker.location.street()",
	uri: "faker.internet.url()",
	url: "faker.internet.url()",
	userName: "faker.internet.userName()",
	uuid: "faker.string.uuid()",
	zipCode: "faker.location.zipCode()"
};
const DEFAULT_OBJECT_KEY_MOCK = "faker.string.alphanumeric(5)";
//#endregion
//#region src/faker/getters/object.ts
const overrideVarName = "overrideResponse";
function wrapRootNullableObjectValue(value, schemaItem, mockOptions, combine) {
	const nullableAtRoot = !combine && isNullableSchema(schemaItem) && !mockOptions?.nonNullable;
	return {
		value: nullableAtRoot ? getNullable(value, true) : value,
		nullWrapped: nullableAtRoot
	};
}
function getReferenceName$1(ref, context) {
	if (!ref) return "";
	return getRefInfo(ref, context).name;
}
function getMockObject({ item, mockOptions, operationId, tags, combine, context, imports, existingReferencedProperties, existingReferencedAllOfRefs = [], splitMockImplementations, allowOverride = false }) {
	if (isReference(item)) return resolveMockValue({
		schema: {
			...item,
			name: item.name,
			path: item.path ? `${item.path}.${item.name}` : item.name
		},
		mockOptions,
		operationId,
		tags,
		context,
		imports,
		existingReferencedProperties,
		existingReferencedAllOfRefs,
		splitMockImplementations
	});
	const schemaItem = item;
	const itemAllOf = schemaItem.allOf;
	const itemOneOf = schemaItem.oneOf;
	const itemAnyOf = schemaItem.anyOf;
	const itemType = schemaItem.type;
	const itemProperties = schemaItem.properties;
	const itemRequired = schemaItem.required;
	const itemAdditionalProperties = schemaItem.additionalProperties;
	if (itemAllOf || itemOneOf || itemAnyOf) return combineSchemasMock({
		item: schemaItem,
		separator: itemAllOf ? "allOf" : itemOneOf ? "oneOf" : "anyOf",
		mockOptions,
		operationId,
		tags,
		combine,
		context,
		imports,
		existingReferencedProperties,
		existingReferencedAllOfRefs,
		splitMockImplementations
	});
	if (Array.isArray(itemType)) {
		const nonNullTypes = mockOptions?.nonNullable ? itemType.filter((type) => type !== "null") : itemType;
		if (nonNullTypes.length === 0) return {
			value: "null",
			imports: [],
			name: schemaItem.name
		};
		if (nonNullTypes.length === 1) return getMockObject({
			item: {
				...schemaItem,
				type: nonNullTypes[0]
			},
			mockOptions,
			operationId,
			tags,
			combine,
			context,
			imports,
			existingReferencedProperties,
			existingReferencedAllOfRefs,
			splitMockImplementations,
			allowOverride
		});
		if (!itemProperties && (!itemRequired || itemRequired.length === 0) && !itemAdditionalProperties && nonNullTypes.includes("object") && nonNullTypes.includes("null") && nonNullTypes.every((type) => type === "object" || type === "null")) {
			if (mockOptions?.nonNullable) return {
				value: "{}",
				imports: [],
				name: schemaItem.name
			};
			return {
				value: "faker.helpers.arrayElement([{}, null])",
				imports: [],
				name: schemaItem.name
			};
		}
		const baseItem = schemaItem;
		return combineSchemasMock({
			item: {
				anyOf: nonNullTypes.map((type) => ({
					...baseItem,
					type
				})),
				name: schemaItem.name
			},
			separator: "anyOf",
			mockOptions,
			operationId,
			tags,
			combine,
			context,
			imports,
			existingReferencedProperties,
			existingReferencedAllOfRefs,
			splitMockImplementations
		});
	}
	if (itemProperties) {
		let value = !combine || combine.separator === "oneOf" || combine.separator === "anyOf" ? "{" : "";
		const imports = [];
		const includedProperties = [];
		const entries = Object.entries(itemProperties);
		if (context.output.propertySortOrder === PropertySortOrder.ALPHABETICAL) entries.sort((a, b) => {
			return a[0].localeCompare(b[0], "en", { numeric: true });
		});
		const propertyScalars = entries.map(([key, prop]) => {
			if (combine?.includedProperties.includes(key)) return;
			const isRequired = mockOptions?.required ?? (Array.isArray(itemRequired) ? itemRequired : []).includes(key);
			const hasNullable = "nullable" in prop && prop.nullable === true;
			if (isReference(prop) && existingReferencedProperties.includes(getReferenceName$1(prop.$ref, context))) {
				if (isRequired) return `${getKey(key)}: null`;
				return;
			}
			const importsBefore = imports.length;
			const resolvedValue = resolveMockValue({
				schema: {
					...prop,
					name: key,
					parentName: schemaItem.name,
					path: schemaItem.path ? `${schemaItem.path}.${key}` : `#.${key}`
				},
				mockOptions,
				operationId,
				tags,
				context,
				imports,
				existingReferencedProperties,
				existingReferencedAllOfRefs: [],
				splitMockImplementations
			});
			mergeReturnedMockImports(imports, importsBefore, resolvedValue.imports);
			includedProperties.push(key);
			const keyDefinition = getKey(key);
			const hasDefault = "default" in prop && prop.default !== void 0;
			if (!isRequired && !resolvedValue.overrided && !hasDefault) {
				const omitValue = mockOptions?.nonNullable || !hasNullable ? "undefined" : "null";
				return `${keyDefinition}: faker.helpers.arrayElement([${resolvedValue.value}, ${omitValue}])`;
			}
			if (Array.isArray(prop.type) && prop.type.includes("null") && !resolvedValue.nullWrapped && !resolvedValue.overrided && !mockOptions?.nonNullable) return `${keyDefinition}: faker.helpers.arrayElement([${resolvedValue.value}, null])`;
			return `${keyDefinition}: ${resolvedValue.value}`;
		}).filter(Boolean);
		if (allowOverride) propertyScalars.push(`...${overrideVarName}`);
		value += propertyScalars.join(", ");
		value += !combine || combine.separator === "oneOf" || combine.separator === "anyOf" ? "}" : "";
		const { value: finalValue, nullWrapped } = wrapRootNullableObjectValue(value, schemaItem, mockOptions, combine);
		return {
			value: finalValue,
			nullWrapped,
			imports,
			name: schemaItem.name,
			includedProperties
		};
	}
	if (itemAdditionalProperties) {
		if (itemAdditionalProperties === true) {
			const { value: finalValue, nullWrapped } = wrapRootNullableObjectValue(`{}`, schemaItem, mockOptions, combine);
			return {
				value: finalValue,
				nullWrapped,
				imports: [],
				name: schemaItem.name
			};
		}
		const additionalProperties = itemAdditionalProperties;
		if (isReference(additionalProperties) && existingReferencedProperties.includes(getReferenceName$1(additionalProperties.$ref, context))) {
			const { value: finalValue, nullWrapped } = wrapRootNullableObjectValue(`{}`, schemaItem, mockOptions, combine);
			return {
				value: finalValue,
				nullWrapped,
				imports: [],
				name: schemaItem.name
			};
		}
		const resolvedValue = resolveMockValue({
			schema: {
				...additionalProperties,
				name: schemaItem.name,
				path: schemaItem.path ? `${schemaItem.path}.#` : "#"
			},
			mockOptions,
			operationId,
			tags,
			context,
			imports,
			existingReferencedProperties,
			existingReferencedAllOfRefs: [],
			splitMockImplementations
		});
		const { value: finalValue, nullWrapped } = wrapRootNullableObjectValue(`{
        [${DEFAULT_OBJECT_KEY_MOCK}]: ${resolvedValue.value}
      }`, schemaItem, mockOptions, combine);
		return {
			...resolvedValue,
			value: finalValue,
			nullWrapped
		};
	}
	const { value: finalValue, nullWrapped } = wrapRootNullableObjectValue("{}", schemaItem, mockOptions, combine);
	return {
		value: finalValue,
		nullWrapped,
		imports: [],
		name: schemaItem.name
	};
}
//#endregion
//#region src/faker/getters/array-item-factory.ts
/**
* Scope key for file-level array-item factory dedup. Must match how writers
* group mock output: one bucket per tag file in tags modes, one bucket per
* operation file in the tags-operations modes (each operation gets its own
* mock file), otherwise one bucket for the whole target.
*/
function getArrayItemMockFileScope(context, tags, operationId) {
	const mode = context.output.mode;
	const mockType = context.activeMockOutputType ?? OutputMockType.MSW;
	let base;
	if (mode === OutputMode.TAGS_OPERATIONS || mode === OutputMode.TAGS_OPERATIONS_SPLIT) base = `operation:${operationId ?? ""}`;
	else if (mode === OutputMode.TAGS || mode === OutputMode.TAGS_SPLIT) base = `tag:${getOperationTagKey({ tags })}`;
	else if (mode === OutputMode.SPLIT) base = "split";
	else base = "single";
	return `${base}:${mockType}`;
}
function getFileLevelExtractedFactories(context, scope) {
	context.arrayItemMockFactories ??= /* @__PURE__ */ new Map();
	const existing = context.arrayItemMockFactories.get(scope);
	if (existing) return existing;
	const factories = /* @__PURE__ */ new Set();
	context.arrayItemMockFactories.set(scope, factories);
	return factories;
}
/**
* True when any mock generator entry opts into reusable array-item mock
* factories for object-like array item schemas in operation responses.
*/
function shouldExtractArrayItemFactories(context) {
	return context.output.mock.generators.some((g) => !isFunction(g) && g.arrayItems === true);
}
/**
* True when `schemas: true` already emits a consolidated factory for this
* `$ref` item under `components/schemas`, so we must not re-export it from
* the operation mock file.
*/
function hasConsolidatedSchemaFactory(items, context) {
	if (!context.output.schemas) return false;
	const itemsRef = extractItemsRef(items);
	if (!itemsRef) return false;
	const { refPaths } = getRefInfo(itemsRef, context);
	if (!(Array.isArray(refPaths) && refPaths[0] === "components" && refPaths[1] === "schemas")) return false;
	return context.output.mock.generators.some((g) => !isFunction(g) && g.type === OutputMockType.FAKER && g.schemas === true);
}
/**
* True when `parentName` looks like a nested property key rather than the
* generated response wrapper type (e.g. `outer` vs `GetTenants200`). Inlining
* avoids factory/type-name collisions and mismatched `<Parent><Prop>Item` aliases.
*/
function isAmbiguousInlineItemContext(operationId, parentName) {
	if (!parentName) return false;
	return !parentName.toLowerCase().includes(operationId.toLowerCase());
}
function isNullableArrayItem(schema) {
	if (schema.nullable === true) return true;
	return Array.isArray(schema.type) && schema.type.includes("null");
}
function isResolvedSchemaObjectLike(schema) {
	if (schema.type === "object" || schema.properties) return true;
	if (schema.allOf) return true;
	return false;
}
/**
* True when array `items` resolve to an object-like schema worth extracting.
* Conservative: skips scalar refs, oneOf/anyOf, nullable items, and nested
* contexts where generated item type names cannot be inferred reliably.
*/
function shouldExtractArrayItem(items, context, operationId, parentName) {
	const itemsRef = extractItemsRef(items);
	if (itemsRef) try {
		const { schema } = resolveRef({ $ref: itemsRef }, context);
		return isResolvedSchemaObjectLike(schema);
	} catch {
		return false;
	}
	if (isReference(items)) return false;
	const schema = items;
	if (isNullableArrayItem(schema)) return false;
	if (schema.oneOf || schema.anyOf) return false;
	if (schema.allOf) return true;
	if (schema.type === "object" || schema.properties) return !isAmbiguousInlineItemContext(operationId, parentName);
	return false;
}
/**
* True when `mapValue` is already a bare factory call or a single spread of one.
*/
function isAlreadyFactoryCall(mapValue) {
	return /^(?:\{\s*\.\.\.\s*get\w+Mock\(\)\s*\}|get\w+Mock\(\))$/.test(mapValue.trim());
}
/**
* Derive the exported factory and TypeScript type names for an array item.
*/
function getArrayItemFactoryNames({ items, propertyName, parentName, operationId, context }) {
	if (!shouldExtractArrayItem(items, context, operationId, parentName)) return;
	const itemsRef = extractItemsRef(items);
	if (itemsRef) {
		const { name } = getRefInfo(itemsRef, context);
		const typeName = pascal(name);
		return {
			factoryName: `get${typeName}Mock`,
			typeName
		};
	}
	const itemSuffix = context.output.override.components.schemas.itemSuffix;
	let typeName;
	if (parentName) typeName = `${pascal(parentName)}${pascal(propertyName)}${itemSuffix}`;
	else {
		const workingName = propertyName.endsWith(" | null") ? propertyName.slice(0, -7) : propertyName;
		if (workingName.endsWith("[]")) {
			const base = workingName.slice(0, -2);
			if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(base)) return;
			typeName = base;
		} else {
			const schema = items;
			if (schema.allOf && !schema.properties && schema.type !== "object") return;
			if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(workingName)) return;
			typeName = `${pascal(workingName)}${itemSuffix}`;
		}
	}
	return {
		factoryName: `get${pascal(operationId)}Response${pascal(propertyName)}ItemMock`,
		typeName
	};
}
/**
* When `arrayItems: true`, lift an object-like array item mock body into a
* reusable exported factory and return the call site expression for `.map()`.
*/
function extractArrayItemMock({ items, propertyName, parentName, operationId, tags, mapValue, context, splitMockImplementations, imports }) {
	if (!shouldExtractArrayItemFactories(context)) return;
	if (!mapValue || mapValue === "[]" || isAlreadyFactoryCall(mapValue) || hasConsolidatedSchemaFactory(items, context)) return;
	const names = getArrayItemFactoryNames({
		items,
		propertyName,
		parentName,
		operationId,
		context
	});
	if (!names) return;
	const { factoryName, typeName } = names;
	const fileLevelFactories = getFileLevelExtractedFactories(context, getArrayItemMockFileScope(context, tags, operationId));
	const mockOptions = context.output.override.mock;
	if (!(fileLevelFactories.has(factoryName) || splitMockImplementations.some((f) => f.includes(`export const ${factoryName}`)))) {
		const { param, returnType, returnCast } = getMockFactorySignatureParts(typeName, mockOptions, {
			isOverridable: true,
			overrideType: `Partial<${typeName}>`
		});
		const func = formatMockFactoryDeclaration(factoryName, param, returnType, `{${mapValue.startsWith("...") ? "" : "..."}${mapValue}, ...${overrideVarName}}`, returnCast, { terminateStatement: true });
		splitMockImplementations.push(func);
		fileLevelFactories.add(factoryName);
	}
	imports.push({ name: typeName });
	return `{...${factoryName}()${isStrictMock(mockOptions) ? ` as ${getStrictMockTypeName(typeName)}` : ""}}`;
}
//#endregion
//#region src/faker/format-example-value.ts
const DATE_FORMATS = new Set(["date", "date-time"]);
function isDateFormat(format) {
	return format !== void 0 && DATE_FORMATS.has(format);
}
function isSchemaObject(schema) {
	return typeof schema === "object" && schema !== null && !Array.isArray(schema);
}
function resolveSchema(schema, context) {
	if (!schema) return;
	if (isReference(schema)) return resolveRef(schema, context).schema;
	return schema;
}
function mergePropertySchemas(...schemas) {
	const merged = {};
	for (const schema of schemas) {
		if (!schema?.properties) continue;
		for (const [key, prop] of Object.entries(schema.properties)) if (isSchemaObject(prop)) merged[key] = prop;
	}
	return merged;
}
function getEffectiveScalarFormat(resolved, context) {
	if (!resolved) return;
	if (isDateFormat(resolved.format)) return resolved.format;
	const oneOf = resolved.oneOf;
	const anyOf = resolved.anyOf;
	for (const variant of [...oneOf ?? [], ...anyOf ?? []]) {
		const resolvedVariant = resolveSchema(isReference(variant) || isSchemaObject(variant) ? variant : void 0, context);
		if (isDateFormat(resolvedVariant?.format)) return resolvedVariant.format;
	}
}
/**
* Resolves compositional schemas (allOf / oneOf / anyOf) so example formatting
* can see property formats on nested and referenced types.
*/
function resolveExampleSchema(schema, context, seenRefs = /* @__PURE__ */ new Set()) {
	if (!schema) return;
	if (isReference(schema)) {
		const ref = schema.$ref;
		if (ref && seenRefs.has(ref)) return resolveRef(schema, context).schema;
		if (ref) seenRefs = new Set(seenRefs).add(ref);
	}
	const resolved = resolveSchema(schema, context);
	if (!resolved) return;
	const allOf = resolved.allOf;
	const oneOf = resolved.oneOf;
	const anyOf = resolved.anyOf;
	const compositors = [
		...allOf ?? [],
		...oneOf ?? [],
		...anyOf ?? []
	];
	const properties = mergePropertySchemas(resolved, ...compositors.map((sub) => resolveExampleSchema(sub, context, seenRefs)));
	const baseResolved = resolved;
	if (resolved.type === "array" && isSchemaObject(resolved.items)) {
		const items = resolveExampleSchema(resolved.items, context, seenRefs);
		const itemProperties = items?.properties;
		const normalizedItems = itemProperties && Object.keys(itemProperties).length > 0 ? {
			type: "object",
			properties: itemProperties
		} : items;
		return {
			...baseResolved,
			...Object.keys(properties).length > 0 ? { properties } : {},
			items: normalizedItems ?? resolved.items
		};
	}
	if (Object.keys(properties).length > 0) return {
		...baseResolved,
		properties
	};
	if (compositors.length > 0 && (oneOf ?? anyOf)) {
		const variantProperties = mergePropertySchemas(...compositors.map((sub) => resolveExampleSchema(sub, context, seenRefs)));
		if (Object.keys(variantProperties).length > 0) return {
			type: "object",
			properties: variantProperties
		};
	}
	const scalarFormat = getEffectiveScalarFormat(resolved, context);
	if (scalarFormat) return {
		...baseResolved,
		format: scalarFormat
	};
	return resolved;
}
function formatLiteralValue(example, schema, context) {
	if (example === null) return "null";
	if (example === void 0) return "undefined";
	const resolved = resolveExampleSchema(schema, context);
	if (Array.isArray(example)) {
		const itemsSchema = resolved?.type === "array" && isSchemaObject(resolved.items) ? resolveExampleSchema(resolved.items, context) : resolved;
		return `[${example.map((item) => formatLiteralValue(item, itemsSchema, context)).join(", ")}]`;
	}
	if (typeof example === "object") {
		const properties = resolved?.properties ?? {};
		return `{ ${Object.entries(example).map(([key, value]) => {
			const propSchema = properties[key];
			const resolvedProp = isSchemaObject(propSchema) ? resolveExampleSchema(propSchema, context) : void 0;
			return `${/^[a-zA-Z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${formatLiteralValue(value, resolvedProp, context)}`;
		}).join(", ")} }`;
	}
	if (context.output.override.useDates && typeof example === "string" && isDateFormat(getEffectiveScalarFormat(resolved, context))) return `new Date(${JSON.stringify(example)})`;
	return JSON.stringify(example);
}
function formatSchemaExampleValue(example, schema, context) {
	if (!context.output.override.useDates || schema === void 0) return JSON.stringify(example);
	return formatLiteralValue(example, schema, context);
}
//#endregion
//#region src/faker/getters/scalar.ts
function getMockScalar({ item, imports, mockOptions, operationId, tags, combine, context, existingReferencedProperties, existingReferencedAllOfRefs = [], splitMockImplementations, allowOverride = false }) {
	const safeMockOptions = mockOptions ?? {};
	const nonNullableOption = safeMockOptions.nonNullable;
	if (item.isRef) existingReferencedProperties = [...existingReferencedProperties, item.name];
	const operationProperty = resolveMockOverride(safeMockOptions.operations?.[operationId]?.properties, item, nonNullableOption);
	if (operationProperty) return operationProperty;
	let overrideTag = { properties: {} };
	const sortedTags = Object.entries(safeMockOptions.tags ?? {}).toSorted((a, b) => a[0].localeCompare(b[0], "en", { numeric: true }));
	for (const [tag, options] of sortedTags) {
		if (!tags.includes(tag)) continue;
		overrideTag = mergeDeep(overrideTag, options);
	}
	const tagProperty = resolveMockOverride(overrideTag.properties, item, nonNullableOption);
	if (tagProperty) return tagProperty;
	const schemaName = item.parentName;
	const schemaProperty = schemaName ? resolveMockOverride(safeMockOptions.schemas?.[schemaName]?.properties, item, nonNullableOption) : void 0;
	if (schemaProperty) return schemaProperty;
	const property = resolveMockOverride(safeMockOptions.properties, item, nonNullableOption);
	if (property) return property;
	if (context.output.override.mock?.useExamples || safeMockOptions.useExamples) {
		const propertyExample = item.example === void 0 ? Array.isArray(item.examples) && item.examples.length > 0 ? item.examples[0] : void 0 : item.example;
		if (propertyExample !== void 0) return {
			value: formatSchemaExampleValue(propertyExample, item, context),
			imports: [],
			name: item.name,
			overrided: true
		};
	}
	const formatOverrides = safeMockOptions.format ?? {};
	const ALL_FORMAT = {
		...DEFAULT_FORMAT_MOCK,
		...Object.fromEntries(Object.entries(formatOverrides).filter((entry) => typeof entry[1] === "string"))
	};
	const isNullable = Array.isArray(item.type) && item.type.includes("null");
	const nullWrapped = isNullable && !nonNullableOption;
	const schemaContentMediaType = item.contentMediaType;
	if (!item.format && schemaContentMediaType === "application/octet-stream" && ALL_FORMAT.binary) return {
		value: getNullable(ALL_FORMAT.binary, isNullable, nonNullableOption),
		imports: [],
		name: item.name,
		overrided: false,
		nullWrapped
	};
	if (item.format && ALL_FORMAT[item.format]) {
		let value = ALL_FORMAT[item.format];
		if (["date", "date-time"].includes(item.format) && context.output.override.useDates) value = `new Date(${value})`;
		return {
			value: getNullable(value, isNullable, nonNullableOption),
			imports: [],
			name: item.name,
			overrided: false,
			nullWrapped
		};
	}
	const type = getItemType(item);
	const isFakerV9 = !!context.output.packageJson && isFakerVersionV9(context.output.packageJson);
	switch (type) {
		case "number":
		case "integer": {
			const intFunction = context.output.override.useBigInt && (item.format === "int64" || item.format === "uint64") ? "bigInt" : "int";
			const numMin = typeof item.exclusiveMinimum === "number" ? item.exclusiveMinimum : item.minimum ?? safeMockOptions.numberMin;
			const numMax = typeof item.exclusiveMaximum === "number" ? item.exclusiveMaximum : item.maximum ?? safeMockOptions.numberMax;
			const intParts = [];
			if (numMin !== void 0) intParts.push(`min: ${numMin}`);
			if (numMax !== void 0) intParts.push(`max: ${numMax}`);
			if (isFakerV9 && item.multipleOf !== void 0) intParts.push(`multipleOf: ${item.multipleOf}`);
			let value = getNullable(`faker.number.${intFunction}(${intParts.length > 0 ? `{${intParts.join(", ")}}` : ""})`, isNullable, nonNullableOption);
			if (type === "number") {
				const floatParts = [];
				if (numMin !== void 0) floatParts.push(`min: ${numMin}`);
				if (numMax !== void 0) floatParts.push(`max: ${numMax}`);
				if (isFakerV9 && item.multipleOf !== void 0) floatParts.push(`multipleOf: ${item.multipleOf}`);
				else if (safeMockOptions.fractionDigits !== void 0) floatParts.push(`fractionDigits: ${safeMockOptions.fractionDigits}`);
				value = getNullable(`faker.number.float(${floatParts.length > 0 ? `{${floatParts.join(", ")}}` : ""})`, isNullable, nonNullableOption);
			}
			const numberImports = [];
			if (item.enum) value = getEnum(item, numberImports, context, existingReferencedProperties, "number");
			else if ("const" in item) value = JSON.stringify(item.const);
			return {
				value,
				enums: item.enum,
				imports: numberImports,
				name: item.name,
				nullWrapped: nullWrapped && !item.enum && !("const" in item)
			};
		}
		case "boolean": {
			let value = "faker.datatype.boolean()";
			const booleanImports = [];
			if (item.enum) value = getEnum(item, booleanImports, context, existingReferencedProperties, "boolean");
			else if ("const" in item) value = JSON.stringify(item.const);
			return {
				value,
				enums: item.enum,
				imports: booleanImports,
				name: item.name
			};
		}
		case "array": {
			const prefixItems = item.prefixItems;
			if (prefixItems && prefixItems.length > 0) {
				const tupleImports = [];
				return {
					value: `[${prefixItems.map((prefixItem, index) => {
						const { value: elementValue, imports: elementImports } = resolveMockValue({
							schema: {
								...prefixItem,
								name: item.name,
								parentName: item.parentName,
								path: item.path ? `${item.path}.[${index}]` : `#.[${index}]`
							},
							combine,
							mockOptions,
							operationId,
							tags,
							context,
							imports,
							existingReferencedProperties,
							existingReferencedAllOfRefs,
							splitMockImplementations
						});
						tupleImports.push(...elementImports);
						return elementValue;
					}).join(", ")}]`,
					imports: tupleImports,
					name: item.name
				};
			}
			if (!item.items) return {
				value: "[]",
				imports: [],
				name: item.name
			};
			const itemsRef = extractItemsRef(item.items);
			if (itemsRef && existingReferencedProperties.includes(getRefInfo(itemsRef, context).name)) return {
				value: "[]",
				imports: [],
				name: item.name
			};
			const resolvedItems = itemsRef && !("$ref" in item.items) ? { $ref: itemsRef } : item.items;
			const { value, enums, imports: resolvedImports } = resolveMockValue({
				schema: {
					...resolvedItems,
					name: item.name,
					parentName: item.parentName,
					path: item.path ? `${item.path}.[]` : "#.[]"
				},
				combine,
				mockOptions,
				operationId,
				tags,
				context,
				imports,
				existingReferencedProperties,
				existingReferencedAllOfRefs,
				splitMockImplementations
			});
			if (enums) return {
				value,
				imports: resolvedImports,
				name: item.name
			};
			let mapValue = value;
			const extractedItemCall = extractArrayItemMock({
				items: resolvedItems,
				propertyName: item.name,
				parentName: item.parentName,
				operationId,
				tags,
				mapValue,
				context,
				splitMockImplementations,
				imports: resolvedImports
			});
			if (extractedItemCall) mapValue = extractedItemCall;
			if (combine && !value.startsWith("faker") && !value.startsWith("{") && !value.startsWith("Array.from")) mapValue = `{${value}}`;
			const arrSchemaMin = item.minItems;
			const arrSchemaMax = item.maxItems;
			const arrGlobalMin = safeMockOptions.arrayMin;
			const arrGlobalMax = safeMockOptions.arrayMax;
			let arrMin;
			if (arrSchemaMin !== void 0) arrMin = arrSchemaMin;
			else if (arrSchemaMax === void 0) arrMin = arrGlobalMin;
			else if (arrGlobalMin === void 0 || arrGlobalMin > arrSchemaMax) arrMin = arrSchemaMax;
			else arrMin = arrGlobalMin;
			let arrMax;
			if (arrSchemaMax !== void 0) arrMax = arrSchemaMax;
			else if (arrSchemaMin === void 0) arrMax = arrGlobalMax;
			else if (arrGlobalMax === void 0 || arrGlobalMax < arrSchemaMin) arrMax = arrSchemaMin;
			else arrMax = arrGlobalMax;
			const arrParts = [];
			if (arrMin !== void 0) arrParts.push(`min: ${arrMin}`);
			if (arrMax !== void 0) arrParts.push(`max: ${arrMax}`);
			return {
				value: `Array.from({ length: faker.number.int(${arrParts.length > 0 ? `{${arrParts.join(", ")}}` : ""}) }, (_, i) => i + 1).map(() => (${mapValue}))`,
				imports: resolvedImports,
				name: item.name
			};
		}
		case "string": {
			const schemaMin = item.minLength;
			const schemaMax = item.maxLength;
			const globalMin = safeMockOptions.stringMin;
			const globalMax = safeMockOptions.stringMax;
			let strMin;
			if (schemaMin !== void 0) strMin = schemaMin;
			else if (schemaMax === void 0) strMin = globalMin;
			else if (globalMin === void 0 || globalMin > schemaMax) strMin = schemaMax;
			else strMin = globalMin;
			let strMax;
			if (schemaMax !== void 0) strMax = schemaMax;
			else if (schemaMin === void 0) strMax = globalMax;
			else if (globalMax === void 0 || globalMax < schemaMin) strMax = schemaMin;
			else strMax = globalMax;
			const strLenParts = [];
			if (strMin !== void 0 && strMax !== void 0) strLenParts.push(`min: ${strMin}`, `max: ${strMax}`);
			let value = `faker.string.alpha(${strLenParts.length > 0 ? `{length: {${strLenParts.join(", ")}}}` : ""})`;
			const stringImports = [];
			if (item.enum) value = getEnum(item, stringImports, context, existingReferencedProperties, "string");
			else if (item.pattern) value = `faker.helpers.fromRegExp(${JSON.stringify(item.pattern)})`;
			else if ("const" in item) value = JSON.stringify(item.const);
			return {
				value: getNullable(value, isNullable, nonNullableOption),
				enums: item.enum,
				name: item.name,
				imports: stringImports,
				nullWrapped
			};
		}
		case "null": return {
			value: "null",
			imports: [],
			name: item.name
		};
		default:
			if (item.enum) {
				const enumImports = [];
				return {
					value: getEnum(item, enumImports, context, existingReferencedProperties),
					enums: item.enum,
					imports: enumImports,
					name: item.name
				};
			}
			return getMockObject({
				item,
				mockOptions,
				operationId,
				tags,
				combine: combine ? {
					separator: combine.separator,
					includedProperties: []
				} : void 0,
				context,
				imports,
				existingReferencedProperties,
				existingReferencedAllOfRefs,
				splitMockImplementations,
				allowOverride
			});
	}
}
function extractItemsRef(items) {
	if (isReference(items)) return items.$ref;
	for (const key of [
		"allOf",
		"oneOf",
		"anyOf"
	]) {
		const composed = items[key];
		if (Array.isArray(composed) && composed.length === 1 && isReference(composed[0])) return composed[0].$ref;
	}
}
function getItemType(item) {
	if (Array.isArray(item.type) && item.type.includes("null")) {
		const typesWithoutNull = item.type.filter((x) => x !== "null");
		return typesWithoutNull.length === 1 ? typesWithoutNull[0] : typesWithoutNull;
	}
	if (item.type) return item.type;
	if (!item.enum) return;
	const uniqTypes = new Set(item.enum.map((value) => typeof value));
	if (uniqTypes.size > 1) return;
	const type = [...uniqTypes.values()].at(0);
	if (!type) return;
	return ["string", "number"].includes(type) ? type : void 0;
}
function getEnum(item, imports, context, existingReferencedProperties, type) {
	if (!item.enum) return "";
	let enumValue = `[${item.enum.filter((e) => e !== null).map((e) => type === "string" || type === void 0 && isString(e) ? `'${jsStringLiteralEscape(e)}'` : e).join(",")}]`;
	if (context.output.override.enumGenerationType === EnumGeneration.ENUM) if (item.isRef || existingReferencedProperties.length === 0) {
		enumValue += ` as ${item.name}${item.name.endsWith("[]") ? "" : "[]"}`;
		imports.push({ name: item.name });
	} else {
		const parentReference = existingReferencedProperties.at(-1);
		if (!parentReference) return "";
		enumValue += ` as ${parentReference}['${item.name}']`;
		if (!item.path?.endsWith("[]")) enumValue += "[]";
		imports.push({ name: parentReference });
	}
	else enumValue += " as const";
	if (item.isRef && type === "string" && context.output.override.enumGenerationType !== EnumGeneration.UNION) {
		enumValue = `Object.values(${item.name})`;
		imports.push({
			name: item.name,
			values: true
		});
	}
	return item.path?.endsWith("[]") ? `faker.helpers.arrayElements(${enumValue})` : `faker.helpers.arrayElement(${enumValue})`;
}
//#endregion
//#region src/faker/resolvers/value.ts
function isRegex(key) {
	return key.startsWith("/") && key.endsWith("/");
}
function stripArrayMarkerSegments(s) {
	return s.split(".").filter((seg) => seg !== "[]").join(".");
}
function resolveMockOverride(properties = {}, item, nonNullableOption) {
	const path = item.path ?? `#.${item.name}`;
	const normalizedPath = stripArrayMarkerSegments(path);
	const entries = Object.entries(properties);
	let property = entries.find(([key]) => {
		if (isRegex(key)) {
			const regex = new RegExp(key.slice(1, -1));
			if (regex.test(item.name) || regex.test(path)) return true;
		}
		if (`#.${stripArrayMarkerSegments(key)}` === normalizedPath) return true;
		return false;
	});
	if (!property) property = entries.find(([key]) => !isRegex(key) && !key.includes(".") && key === item.name);
	if (!property) return;
	return {
		value: getNullable(property[1], isNullableSchema(item), nonNullableOption),
		imports: [],
		name: item.name,
		overrided: true
	};
}
/** OpenAPI 3.0 `nullable: true` or 3.1 `type` unions that include `null`. */
function isNullableSchema(schema) {
	if (!schema || typeof schema !== "object") return false;
	const { type, nullable } = schema;
	return nullable === true || Array.isArray(type) && type.includes("null");
}
/** When `nonNullableOption` is true (`override.mock.nonNullable`), omit the null branch. */
function getNullable(value, nullable, nonNullableOption) {
	if (!nullable || nonNullableOption) return value;
	return `faker.helpers.arrayElement([${value}, null])`;
}
/**
* True when the active faker generator entry asks for consolidated schema
* mock factories and the output is configured to host them (i.e. there is a
* dedicated schemas directory we can import `index.faker` from). Used to
* decide whether an operation factory should inline a `$ref`'d schema or
* delegate to its `get<X>Mock` factory.
*/
function shouldDelegateToSchemaFactories(context) {
	if (!context.output.schemas) return false;
	return !!context.output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && g.schemas === true);
}
/**
* Predicate: this `$ref` points at a top-level `#/components/schemas/<Name>`
* (vs. a parameter, response, or inline schema). Only those have a
* corresponding `get<Name>Mock` factory in the consolidated faker file.
*/
function isComponentsSchemaRef(refPaths) {
	return Array.isArray(refPaths) && refPaths[0] === "components" && refPaths[1] === "schemas";
}
/**
* Returns true when an operation- or tag-level mock override touches any
* property declared on the referenced schema. In that case we must inline
* the schema body so the override actually applies; the shared
* `get<X>Mock` factory has no knowledge of operation-scoped overrides.
*
* Schema-scoped overrides (`override.mock.schemas`) need no special handling
* here: they target a schema's *own* properties, so the schema's `get<X>Mock`
* factory — built with the same mock options — already bakes them in, and
* delegating to it preserves the override.
*
* Reuses `resolveMockOverride` so the same matching rules apply as for
* regular property mocks — bare name, regex (`/.../`), and exact-path
* (`#.foo.bar`). The parent's `path` (where the `$ref` appears in the
* surrounding schema) gets composed into each synthetic property item so
* exact-path overrides like `#.color.value` resolve correctly.
*/
function hasOverrideTouchingSchema(schemaProperties, mockOptions, operationId, tags, parentPath) {
	if (!schemaProperties) return false;
	const propertyNames = Object.keys(schemaProperties);
	if (propertyNames.length === 0) return false;
	const overrideBuckets = [mockOptions?.operations?.[operationId]?.properties];
	for (const tag of tags) overrideBuckets.push(mockOptions?.tags?.[tag]?.properties);
	return overrideBuckets.some((bucket) => {
		if (!bucket) return false;
		return propertyNames.some((propertyName) => {
			return !!resolveMockOverride(bucket, {
				name: propertyName,
				path: parentPath ? `${parentPath}.${propertyName}` : propertyName
			});
		});
	});
}
function resolveMockValue({ schema, mockOptions, operationId, tags, combine, context, imports, existingReferencedProperties, existingReferencedAllOfRefs = [], splitMockImplementations, allowOverride }) {
	if (isReference(schema)) {
		const schemaReference = schema;
		const { name, refPaths } = getRefInfo(typeof schema.$ref === "string" ? schema.$ref : "", context);
		const schemaRef = Array.isArray(refPaths) ? prop(context.spec, ...refPaths) : void 0;
		const newSchema = {
			...schemaRef,
			name,
			path: schemaReference.path,
			isRef: true,
			required: [...schemaRef?.required ?? [], ...schemaReference.required ?? []],
			...schemaReference.nullable === void 0 ? {} : { nullable: schemaReference.nullable }
		};
		if (combine?.separator === "allOf" && newSchema.discriminator && newSchema.oneOf) {
			const parentDiscriminator = newSchema.discriminator;
			const mappingTargetNames = parentDiscriminator.mapping ? Object.values(parentDiscriminator.mapping).map((ref) => pascal(ref.split("/").pop() ?? "")) : [];
			if (existingReferencedProperties.some((refName) => mappingTargetNames.includes(refName))) {
				const mutableSchema = newSchema;
				delete mutableSchema.oneOf;
				const parentProperties = newSchema.properties;
				if (parentDiscriminator.propertyName && parentProperties && parentDiscriminator.propertyName in parentProperties) {
					const remainingProperties = Object.fromEntries(Object.entries(parentProperties).filter(([key]) => key !== parentDiscriminator.propertyName));
					if (Object.keys(remainingProperties).length === 0) delete mutableSchema.properties;
					else mutableSchema.properties = remainingProperties;
					const parentRequired = newSchema.required;
					if (Array.isArray(parentRequired)) {
						const filteredRequired = parentRequired.filter((key) => key !== parentDiscriminator.propertyName);
						if (filteredRequired.length === 0) delete mutableSchema.required;
						else mutableSchema.required = filteredRequired;
					}
				}
			}
		}
		const newSeparator = newSchema.allOf ? "allOf" : newSchema.oneOf ? "oneOf" : "anyOf";
		if (shouldDelegateToSchemaFactories(context) && isComponentsSchemaRef(refPaths) && !hasOverrideTouchingSchema(schemaRef?.properties, mockOptions, operationId, tags, schemaReference.path)) {
			const factoryName = `get${pascal(name)}Mock`;
			const factoryImport = {
				name: factoryName,
				values: true,
				schemaFactory: true
			};
			const isObjectLike = newSchema.type === "object" || !!newSchema.allOf || resolvesToObjectLike(newSchema, context);
			const mockTypeName = getStrictMockTypeName(pascal(name));
			const strictMockTypeImport = isStrictMock(mockOptions) && isObjectLike ? {
				name: mockTypeName,
				values: false,
				schemaFactory: true
			} : void 0;
			const strictObjectCast = isStrictMock(mockOptions) && isObjectLike ? ` as ${mockTypeName}` : "";
			return {
				value: getNullable(isObjectLike ? `{ ...${factoryName}()${strictObjectCast} }` : `${factoryName}()`, Boolean(newSchema.nullable), mockOptions?.nonNullable),
				imports: strictMockTypeImport ? [factoryImport, strictMockTypeImport] : [factoryImport],
				name: newSchema.name,
				type: getType(newSchema),
				nullWrapped: Boolean(newSchema.nullable) && !mockOptions?.nonNullable
			};
		}
		const importsBefore = imports.length;
		const scalar = getMockScalar({
			item: newSchema,
			mockOptions,
			operationId,
			tags,
			combine: combine ? {
				separator: combine.separator === "anyOf" ? newSeparator : combine.separator,
				includedProperties: newSeparator === "allOf" ? [] : combine.includedProperties
			} : void 0,
			context,
			imports,
			existingReferencedProperties,
			existingReferencedAllOfRefs,
			splitMockImplementations,
			allowOverride
		});
		if (scalar.value && (newSchema.type === "object" || newSchema.allOf) && combine?.separator === "oneOf") {
			const funcName = `get${pascal(operationId)}Response${pascal(newSchema.name)}Mock`;
			if (!splitMockImplementations.some((f) => f.includes(`export const ${funcName}`))) {
				const discriminatedProperty = newSchema.discriminator?.propertyName;
				let overrideType = `Partial<${newSchema.name}>`;
				if (discriminatedProperty) overrideType = `Omit<${overrideType}, '${discriminatedProperty}'>`;
				const { param, returnType, returnCast } = getMockFactorySignatureParts(newSchema.name, mockOptions, {
					isOverridable: true,
					overrideType
				});
				const func = formatMockFactoryDeclaration(funcName, param, returnType, `{${scalar.value.startsWith("...") ? "" : "..."}${scalar.value}, ...${overrideVarName}}`, returnCast, { terminateStatement: true });
				splitMockImplementations.push(func);
			}
			scalar.value = newSchema.nullable ? `${funcName}()` : `{...${funcName}()}`;
			const typeImport = {
				name: newSchema.name,
				values: false
			};
			scalar.imports.push(typeImport);
			if (scalar.imports !== imports) appendImportsDelta(imports, scalar.imports, 0);
		}
		mergeReturnedMockImports(imports, importsBefore, scalar.imports);
		return {
			...scalar,
			type: getType(newSchema)
		};
	}
	const importsBefore = imports.length;
	const scalar = getMockScalar({
		item: schema,
		mockOptions,
		operationId,
		tags,
		combine,
		context,
		imports,
		existingReferencedProperties,
		existingReferencedAllOfRefs,
		splitMockImplementations,
		allowOverride
	});
	mergeReturnedMockImports(imports, importsBefore, scalar.imports);
	return {
		...scalar,
		type: getType(schema)
	};
}
function getType(schema) {
	if (isReference(schema)) return;
	return schema.type ?? (schema.properties ? "object" : schema.items ? "array" : void 0);
}
function resolvesToObjectLike(schema, context, seen = /* @__PURE__ */ new Set()) {
	let resolved;
	if (isReference(schema)) {
		if (typeof schema.$ref !== "string" || seen.has(schema.$ref)) return false;
		seen = new Set(seen).add(schema.$ref);
		const { refPaths } = getRefInfo(schema.$ref, context);
		resolved = Array.isArray(refPaths) ? prop(context.spec, ...refPaths) : void 0;
	} else resolved = schema;
	if (!resolved) return false;
	if (resolved.type === "object" || resolved.properties || resolved.additionalProperties || resolved.allOf) return true;
	const branches = resolved.oneOf ?? resolved.anyOf;
	if (branches && branches.length > 0) return branches.every((branch) => resolvesToObjectLike(branch, context, seen));
	return false;
}
//#endregion
//#region src/faker/getters/combine.ts
function getReferenceName(ref, context) {
	if (!ref) return "";
	return getRefInfo(ref, context).name;
}
function combineSchemasMock({ item, separator, mockOptions, operationId, tags, combine, context, imports, existingReferencedProperties, existingReferencedAllOfRefs = [], splitMockImplementations }) {
	const combineImports = [];
	const includedProperties = [...combine?.includedProperties ?? []];
	const separatorItems = item[separator] ?? [];
	const itemRequired = item.required;
	const isRefAndNotExisting = isReference(item) && !existingReferencedProperties.includes(item.name);
	const discriminator = item.discriminator;
	const itemProperties = item.properties;
	const discriminatorPropertyName = separator === "oneOf" && discriminator?.mapping && discriminator.propertyName && itemProperties && discriminator.propertyName in itemProperties ? discriminator.propertyName : void 0;
	const itemEntriesForResolve = Object.entries(item).filter(([key]) => key !== separator);
	if (discriminatorPropertyName && itemProperties) {
		const propertiesIdx = itemEntriesForResolve.findIndex(([key]) => key === "properties");
		if (propertiesIdx !== -1) {
			const filteredProperties = Object.fromEntries(Object.entries(itemProperties).filter(([key]) => key !== discriminatorPropertyName));
			if (Object.keys(filteredProperties).length === 0) itemEntriesForResolve.splice(propertiesIdx, 1);
			else itemEntriesForResolve[propertiesIdx] = ["properties", filteredProperties];
		}
		const requiredIdx = itemEntriesForResolve.findIndex(([key]) => key === "required");
		if (requiredIdx !== -1 && Array.isArray(itemRequired)) {
			const filteredRequired = itemRequired.filter((key) => key !== discriminatorPropertyName);
			if (filteredRequired.length === 0) itemEntriesForResolve.splice(requiredIdx, 1);
			else itemEntriesForResolve[requiredIdx] = ["required", filteredRequired];
		}
	}
	const hasResolvableProperties = itemEntriesForResolve.some(([key]) => key === "properties");
	const itemResolvedValue = isRefAndNotExisting || hasResolvableProperties ? resolveMockValue({
		schema: Object.fromEntries(itemEntriesForResolve),
		combine: {
			separator: "allOf",
			includedProperties: []
		},
		mockOptions,
		operationId,
		tags,
		context,
		imports,
		existingReferencedProperties,
		existingReferencedAllOfRefs,
		splitMockImplementations
	}) : void 0;
	includedProperties.push(...itemResolvedValue?.includedProperties ?? []);
	combineImports.push(...itemResolvedValue?.imports ?? []);
	let containsOnlyPrimitiveValues = true;
	const allRequiredFields = [];
	if (separator === "allOf") {
		if (itemRequired) allRequiredFields.push(...itemRequired);
		for (const val of separatorItems) if (isSchema(val) && val.required) allRequiredFields.push(...val.required);
	}
	let value = separator === "allOf" ? "" : "faker.helpers.arrayElement([";
	for (const val of separatorItems) {
		const refName = isReference(val) ? getReferenceName(val.$ref, context) : "";
		if (separator === "allOf" ? refName && (refName === item.name || existingReferencedProperties.includes(refName) && !item.isRef || existingReferencedAllOfRefs.includes(refName)) : refName && existingReferencedProperties.includes(refName)) {
			if (separatorItems.length === 1) value = "undefined";
			continue;
		}
		const resolvedValue = resolveMockValue({
			schema: (() => {
				if (separator !== "allOf" || allRequiredFields.length === 0) return {
					...val,
					name: item.name,
					path: item.path ?? "#"
				};
				const valRequired = val.required;
				const combinedRequired = valRequired ? [...allRequiredFields, ...valRequired] : allRequiredFields;
				return {
					...val,
					name: item.name,
					path: item.path ?? "#",
					required: [...new Set(combinedRequired)]
				};
			})(),
			combine: {
				separator,
				includedProperties: separator === "oneOf" ? itemResolvedValue?.includedProperties ?? [] : includedProperties
			},
			mockOptions,
			operationId,
			tags,
			context,
			imports,
			existingReferencedProperties,
			existingReferencedAllOfRefs: separator === "allOf" && refName ? [...existingReferencedAllOfRefs, refName] : [],
			splitMockImplementations
		});
		combineImports.push(...resolvedValue.imports);
		includedProperties.push(...resolvedValue.includedProperties ?? []);
		if (resolvedValue.value === "{}") {
			containsOnlyPrimitiveValues = false;
			continue;
		}
		if (separator === "allOf") {
			if (resolvedValue.value.startsWith("{") || !resolvedValue.type) {
				containsOnlyPrimitiveValues = false;
				value += `...${resolvedValue.value},`;
				continue;
			}
			if (resolvedValue.type === "object") {
				containsOnlyPrimitiveValues = false;
				value += resolvedValue.value.startsWith("faker") ? `...${resolvedValue.value},` : `...{${resolvedValue.value}},`;
				continue;
			}
		}
		value += `${resolvedValue.value},`;
	}
	let finalValue = value === "undefined" || separator !== "allOf" && value === "faker.helpers.arrayElement([" ? "undefined" : `${separator === "allOf" && !containsOnlyPrimitiveValues ? "{" : ""}${value}${separator === "allOf" ? containsOnlyPrimitiveValues ? "" : "}" : "])"}`;
	if (itemResolvedValue) finalValue = finalValue.startsWith("...") ? `...{${finalValue}, ${itemResolvedValue.value}}` : `{...${finalValue}, ${itemResolvedValue.value}}`;
	if (finalValue.endsWith(",")) finalValue = finalValue.slice(0, Math.max(0, finalValue.length - 1));
	return {
		value: finalValue,
		imports: combineImports,
		name: item.name,
		includedProperties
	};
}
//#endregion
//#region src/faker/getters/route.ts
const getRouteMSW = (route, baseUrl = "*") => `${baseUrl}${toColonRoutePath(route.replaceAll(":", String.raw`\\:`), camelPathParamName)}`;
//#endregion
//#region src/msw/mocks.ts
function getMockPropertiesWithoutFunc(properties, spec) {
	const resolvedProperties = typeof properties === "function" ? properties(spec) : properties;
	const mockProperties = {};
	for (const [key, value] of Object.entries(resolvedProperties)) mockProperties[key] = (isFunction(value) ? `(${String(value)})()` : stringify(value) ?? "undefined").replaceAll(/import_faker\.defaults|import_faker\.faker|_faker\.faker/g, "faker");
	return mockProperties;
}
function getMockWithoutFunc(spec, override) {
	const operations = override?.operations ? (() => {
		const operationMocks = {};
		for (const [key, value] of Object.entries(override.operations)) {
			if (!value?.mock?.properties) continue;
			operationMocks[key] = { properties: getMockPropertiesWithoutFunc(value.mock.properties, spec) };
		}
		return operationMocks;
	})() : void 0;
	const tags = override?.tags ? (() => {
		const tagMocks = {};
		for (const [key, value] of Object.entries(override.tags)) {
			if (!value?.mock?.properties) continue;
			tagMocks[key] = { properties: getMockPropertiesWithoutFunc(value.mock.properties, spec) };
		}
		return tagMocks;
	})() : void 0;
	const schemas = override?.mock?.schemas ? (() => {
		const schemaMocks = {};
		for (const [key, value] of Object.entries(override.mock.schemas)) {
			if (!value?.properties) continue;
			schemaMocks[key] = { properties: getMockPropertiesWithoutFunc(value.properties, spec) };
		}
		return schemaMocks;
	})() : void 0;
	return {
		arrayMin: override?.mock?.arrayMin,
		arrayMax: override?.mock?.arrayMax,
		stringMin: override?.mock?.stringMin,
		stringMax: override?.mock?.stringMax,
		numberMin: override?.mock?.numberMin,
		numberMax: override?.mock?.numberMax,
		required: override?.mock?.required,
		nonNullable: override?.mock?.nonNullable,
		fractionDigits: override?.mock?.fractionDigits,
		...override?.mock?.properties ? { properties: getMockPropertiesWithoutFunc(override.mock.properties, spec) } : {},
		...override?.mock?.format ? { format: getMockPropertiesWithoutFunc(override.mock.format, spec) } : {},
		...operations ? { operations } : {},
		...tags ? { tags } : {},
		...schemas ? { schemas } : {}
	};
}
function getMockNumberOption(mockOptionsWithoutFunc, key) {
	const value = mockOptionsWithoutFunc[key];
	return typeof value === "number" ? value : void 0;
}
function getMockScalarJsTypes(definition, mockOptionsWithoutFunc) {
	const isArray = definition.endsWith("[]");
	const type = isArray ? definition.slice(0, -2) : definition;
	const arrayMin = getMockNumberOption(mockOptionsWithoutFunc, "arrayMin");
	const arrayMax = getMockNumberOption(mockOptionsWithoutFunc, "arrayMax");
	switch (type) {
		case "number": {
			const numArrParts = [];
			if (arrayMin !== void 0) numArrParts.push(`min: ${arrayMin}`);
			if (arrayMax !== void 0) numArrParts.push(`max: ${arrayMax}`);
			const numArrArg = numArrParts.length > 0 ? `{${numArrParts.join(", ")}}` : "";
			return isArray ? `Array.from({length: faker.number.int(${numArrArg})}, () => faker.number.int())` : "faker.number.int()";
		}
		case "string": {
			const strArrParts = [];
			if (arrayMin !== void 0) strArrParts.push(`min: ${arrayMin}`);
			if (arrayMax !== void 0) strArrParts.push(`max: ${arrayMax}`);
			const strArrArg = strArrParts.length > 0 ? `{${strArrParts.join(", ")}}` : "";
			return isArray ? `Array.from({length: faker.number.int(${strArrArg})}, () => faker.word.sample())` : "faker.word.sample()";
		}
		default: return "undefined";
	}
}
function getExampleEntries(examples) {
	if (Array.isArray(examples)) return examples;
	if (examples && typeof examples === "object") return Object.values(examples);
	return [];
}
function unwrapExampleValue(example) {
	if (example && typeof example === "object" && "value" in example) return example.value;
	return example;
}
function getResponsesMockDefinition({ operationId, tags, returnType, responses, mockOptionsWithoutFunc, transformer, context, mockOptions, splitMockImplementations }) {
	const result = {
		definitions: [],
		imports: []
	};
	for (const response of responses) {
		const { value: definition, example, examples, imports, isRef } = response;
		let { originalSchema } = response;
		if (context.output.override.mock?.useExamples || mockOptions?.useExamples) {
			const exampleValue = unwrapExampleValue(example ?? originalSchema?.example ?? getExampleEntries(examples)[0] ?? getExampleEntries(originalSchema?.examples)[0]);
			if (exampleValue !== void 0) {
				const formatted = formatSchemaExampleValue(exampleValue, originalSchema, context);
				result.definitions.push(transformer ? transformer(formatted, returnType) : formatted);
				continue;
			}
		}
		if (!definition || generalJSTypesWithArray.includes(definition)) {
			const value = getMockScalarJsTypes(definition, mockOptionsWithoutFunc);
			result.definitions.push(transformer ? transformer(value, returnType) : value);
			continue;
		}
		if (!originalSchema && definition === "Blob") originalSchema = {
			type: "string",
			format: "binary"
		};
		else if (!originalSchema) continue;
		const resolvedSchema = resolveRef(originalSchema, context).schema;
		const responseImports = imports ?? [];
		const importsBefore = responseImports.length;
		const scalar = getMockScalar({
			item: {
				...resolvedSchema,
				name: definition,
				...context.output.override.enumGenerationType === "enum" && isRef ? { isRef: true } : {}
			},
			imports: responseImports,
			mockOptions: mockOptionsWithoutFunc,
			operationId,
			tags,
			context,
			existingReferencedProperties: [],
			splitMockImplementations,
			allowOverride: true
		});
		appendImportsDelta(result.imports, responseImports, importsBefore);
		if (scalar.imports !== responseImports) appendImportsDelta(result.imports, scalar.imports, 0);
		result.definitions.push(transformer ? transformer(scalar.value, returnType) : scalar.value);
	}
	appendImportsDelta(result.imports, collectSplitMockTypeImports(splitMockImplementations), 0);
	return result;
}
function getMockDefinition({ operationId, tags, returnType, responses, override, transformer, context, mockOptions, splitMockImplementations }) {
	const { definitions, imports } = getResponsesMockDefinition({
		operationId,
		tags,
		returnType,
		responses,
		mockOptionsWithoutFunc: getMockWithoutFunc(context.spec, override),
		transformer,
		context,
		mockOptions,
		splitMockImplementations
	});
	return {
		definition: "[" + definitions.join(", ") + "]",
		definitions,
		imports
	};
}
function getMockOptionsDataOverride(operationTags, operationId, override) {
	const responseOverride = override.operations[operationId]?.mock?.data ?? operationTags.map((operationTag) => override.tags[operationTag]?.mock?.data).find((e) => e !== void 0);
	return (isFunction(responseOverride) ? `(${String(responseOverride)})()` : stringify(responseOverride))?.replaceAll(/import_faker\.defaults|import_faker\.faker|_faker\.faker/g, "faker");
}
//#endregion
//#region src/msw/index.ts
function getMSWDependencies(options) {
	const locale = options?.locale;
	const fakerDependency = {
		exports: [{
			name: "faker",
			values: true
		}],
		dependency: locale ? `@faker-js/faker/locale/${locale}` : "@faker-js/faker"
	};
	const hasDelay = options && isMswMock(options) ? options.delay !== false : true;
	const exports = [
		{
			name: "http",
			values: true
		},
		{
			name: "HttpResponse",
			values: true
		},
		{
			name: "RequestHandlerOptions",
			values: false
		}
	];
	if (hasDelay) exports.push({
		name: "delay",
		values: true
	});
	return [{
		exports,
		dependency: "msw"
	}, fakerDependency];
}
const generateMSWImports = ({ implementation, imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports, options }) => {
	return generateDependencyImports(implementation, [...getMSWDependencies(options), ...imports], projectName, hasSchemaDir, isAllowSyntheticDefaultImports);
};
function generateDefinition(name, route, getResponseMockFunctionNameBase, handlerNameBase, { operationId, response, verb, tags }, { override, context, mock }, returnType, status, responseImports, responses, contentTypes, splitMockImplementations) {
	const oldSplitMockImplementations = [...splitMockImplementations];
	const { definitions, definition, imports } = getMockDefinition({
		operationId,
		tags,
		returnType,
		responses,
		imports: responseImports,
		override,
		context,
		mockOptions: isFunction(mock) ? void 0 : mock,
		splitMockImplementations
	});
	const mockData = getMockOptionsDataOverride(tags, operationId, override);
	let value = "";
	if (mockData) value = mockData;
	else if (definitions.length > 1) value = `faker.helpers.arrayElement(${definition})`;
	else if (definitions[0]) value = definitions[0];
	const isResponseOverridable = value.includes(overrideVarName);
	const isTextLikeContentType = (ct) => ct.startsWith("text/") || ct === "application/xml" || ct.endsWith("+xml");
	const isTypeExactlyString = (typeExpr) => typeExpr.trim().replaceAll(/^\(+|\)+$/g, "") === "string";
	const isUnionContainingString = (typeExpr) => typeExpr.split("|").map((part) => part.trim().replaceAll(/^\(+|\)+$/g, "")).includes("string");
	const isBinaryLikeContentType = (ct) => ct === "application/octet-stream" || ct === "application/pdf" || ct.startsWith("image/") || ct.startsWith("audio/") || ct.startsWith("video/") || ct.startsWith("font/");
	const preferredContentType = isFunction(mock) ? void 0 : mock?.preferredContentType?.toLowerCase();
	const preferredContentTypeMatch = preferredContentType ? responses.find((r) => r.contentType.toLowerCase() === preferredContentType)?.contentType : void 0;
	const contentTypesByPreference = preferredContentTypeMatch ? [preferredContentTypeMatch] : contentTypes;
	const responsesByPreference = preferredContentTypeMatch ? responses.filter((r) => r.contentType === preferredContentTypeMatch) : responses;
	const hasTextLikeContentType = contentTypes.some((ct) => isTextLikeContentType(ct));
	const isExactlyStringReturnType = isTypeExactlyString(returnType);
	const isTextResponse = isExactlyStringReturnType && hasTextLikeContentType || contentTypesByPreference.some((ct) => isTextLikeContentType(ct));
	const isSchemaBinary = (r) => r.originalSchema?.format === "binary" || r.originalSchema?.contentMediaType === "application/octet-stream" && !r.originalSchema.contentEncoding;
	const isBinaryResponse = contentTypesByPreference.some((ct) => isBinaryLikeContentType(ct)) || responsesByPreference.some((r) => isSchemaBinary(r));
	const binaryRefNames = responsesByPreference.filter((r) => isSchemaBinary(r)).flatMap((r) => r.imports.flatMap((imp) => imp.alias ? [imp.name, imp.alias] : [imp.name]));
	const isReturnHttpResponse = value && value !== "undefined";
	const getResponseMockFunctionName = `${getResponseMockFunctionNameBase}${pascal(name)}`;
	const handlerName = `${handlerNameBase}${pascal(name)}`;
	const addedSplitMockImplementations = splitMockImplementations.slice(oldSplitMockImplementations.length);
	splitMockImplementations.push(...addedSplitMockImplementations);
	const mockImplementations = addedSplitMockImplementations.length > 0 ? `${addedSplitMockImplementations.join("\n\n")}\n\n` : "";
	const binaryTypeRewriteRegex = new RegExp(String.raw`\b(?:${["Blob", ...binaryRefNames].map((n) => escapeRegExp(n)).join("|")})\b`, "g");
	const mockReturnType = isBinaryResponse ? returnType.replaceAll(binaryTypeRewriteRegex, "ArrayBuffer") : returnType;
	const isVoidUnionType = mockReturnType !== "void" && mockReturnType.split("|").some((part) => part.trim() === "void");
	const noContentStatusCode = isVoidUnionType ? responses.find((r) => r.value === "void")?.key ?? "204" : void 0;
	const nonVoidMockReturnType = isVoidUnionType ? mockReturnType.split("|").filter((part) => part.trim() !== "void").join(" | ").trim() : mockReturnType;
	const hasJsonContentType = contentTypesByPreference.some((ct) => ct.includes("json") || ct.includes("+json"));
	const hasStringReturnType = isTypeExactlyString(mockReturnType) || isUnionContainingString(mockReturnType);
	const overrideResponseType = `Partial<Extract<${nonVoidMockReturnType}, object>>`;
	const shouldPreferJsonResponse = hasJsonContentType && !hasStringReturnType;
	const needsRuntimeContentTypeSwitch = isTextResponse && hasJsonContentType && hasStringReturnType && mockReturnType !== "string";
	const mockOptionsFromOverride = override.mock;
	const strictMock = isStrictMock(mockOptionsFromOverride);
	const schemaTypeNames = strictMock ? getSchemaTypeNamesFromResponses(responses) : [];
	const strictMockReturnType = strictMock ? applyStrictMockReturnType(nonVoidMockReturnType, schemaTypeNames) : nonVoidMockReturnType;
	const simpleSchemaReturnType = strictMock ? getSimpleSchemaReturnType(nonVoidMockReturnType, schemaTypeNames) : void 0;
	let mockFactoryParam = "";
	let mockFactoryReturnType = nonVoidMockReturnType;
	let mockFactoryReturnCast = "";
	if (isResponseOverridable) if (strictMock && simpleSchemaReturnType) {
		const signature = getMockFactorySignatureParts(simpleSchemaReturnType, mockOptionsFromOverride, {
			isOverridable: true,
			overrideType: overrideResponseType
		});
		mockFactoryParam = signature.param;
		mockFactoryReturnType = signature.returnType;
		mockFactoryReturnCast = signature.returnCast;
	} else {
		mockFactoryParam = `overrideResponse: ${overrideResponseType} = {}`;
		mockFactoryReturnType = strictMock ? strictMockReturnType : nonVoidMockReturnType;
	}
	else if (strictMock) mockFactoryReturnType = strictMockReturnType;
	const mockImplementation = isReturnHttpResponse ? `${mockImplementations}${formatMockFactoryDeclaration(getResponseMockFunctionName, mockFactoryParam, mockFactoryReturnType, value, mockFactoryReturnCast, { omitReturnType: Boolean(mockData) })}\n\n` : mockImplementations;
	const delay = getDelay(override, isFunction(mock) ? void 0 : mock);
	const infoParam = "info";
	const resolvedResponseExpr = `overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(${infoParam}) : overrideResponse)
    : ${getResponseMockFunctionName}()`;
	const statusCode = status === "default" ? 200 : status.replace(/XX$/, "00");
	const binaryContentType = (preferredContentTypeMatch && isBinaryLikeContentType(preferredContentTypeMatch) ? preferredContentTypeMatch : contentTypes.find((ct) => isBinaryLikeContentType(ct))) ?? "application/octet-stream";
	const firstTextCt = isExactlyStringReturnType && !!preferredContentTypeMatch && !isTextLikeContentType(preferredContentTypeMatch) && hasTextLikeContentType ? contentTypes.find((ct) => isTextLikeContentType(ct)) : contentTypesByPreference.find((ct) => isTextLikeContentType(ct));
	const textHelper = firstTextCt === "application/xml" || firstTextCt?.endsWith("+xml") ? "xml" : firstTextCt === "text/html" ? "html" : "text";
	let responseBody;
	let responsePrelude = "";
	if (isReturnHttpResponse) {
		if (isBinaryResponse) responsePrelude = `const binaryBody = ${resolvedResponseExpr};`;
		else if (isVoidUnionType || needsRuntimeContentTypeSwitch) responsePrelude = `const resolvedBody = ${resolvedResponseExpr};`;
		else if (isTextResponse && !shouldPreferJsonResponse) responsePrelude = `const resolvedBody = ${resolvedResponseExpr};
    const textBody = typeof resolvedBody === 'string' ? resolvedBody : JSON.stringify(resolvedBody ?? null);`;
	}
	if (!isReturnHttpResponse) responseBody = `new HttpResponse(null,
      { status: ${statusCode}
      })`;
	else if (isBinaryResponse) responseBody = `HttpResponse.arrayBuffer(
      binaryBody instanceof ArrayBuffer
        ? binaryBody
        : new ArrayBuffer(0),
      { status: ${statusCode},
        headers: { 'Content-Type': '${binaryContentType}' }
      })`;
	else if (isVoidUnionType) {
		let nonVoidBody;
		if (needsRuntimeContentTypeSwitch) nonVoidBody = `typeof resolvedBody === 'string'
        ? HttpResponse.${textHelper}(resolvedBody, { status: ${statusCode} })
        : HttpResponse.json(resolvedBody, { status: ${statusCode} })`;
		else if (isTextResponse && !shouldPreferJsonResponse) nonVoidBody = `HttpResponse.${textHelper}(
        typeof resolvedBody === 'string' ? resolvedBody : JSON.stringify(resolvedBody ?? null),
        { status: ${statusCode} })`;
		else nonVoidBody = `HttpResponse.json(resolvedBody, { status: ${statusCode} })`;
		responseBody = `resolvedBody === undefined
      ? new HttpResponse(null, { status: ${noContentStatusCode} })
      : ${nonVoidBody}`;
	} else if (needsRuntimeContentTypeSwitch) responseBody = `typeof resolvedBody === 'string'
      ? HttpResponse.${textHelper}(resolvedBody, { status: ${statusCode} })
      : HttpResponse.json(resolvedBody, { status: ${statusCode} })`;
	else if (isTextResponse && !shouldPreferJsonResponse) responseBody = `HttpResponse.${textHelper}(textBody,
      { status: ${statusCode}
      })`;
	else responseBody = `HttpResponse.json(${resolvedResponseExpr},
      { status: ${statusCode}
      })`;
	const infoType = `Parameters<Parameters<typeof http.${verb}>[1]>[0]`;
	const handlerImplementation = `
export const ${handlerName} = (overrideResponse?: ${mockReturnType} | ((${infoParam}: ${infoType}) => Promise<${mockReturnType}> | ${mockReturnType}), options?: RequestHandlerOptions) => {
  return http.${verb}('${route}', async (${infoParam}: ${infoType}) => {${delay === false ? "" : `await delay(${isFunction(delay) ? `(${String(delay)})()` : String(delay)});`}
  ${isReturnHttpResponse ? "" : `if (typeof overrideResponse === 'function') {await overrideResponse(info); }`}
  ${responsePrelude}
    return ${responseBody}
  }, options)
}\n`;
	const includeResponseImports = [...imports, ...response.imports.filter((r) => {
		const searchWords = [r.alias, r.name].filter((p) => Boolean(p?.length)).map((part) => escapeRegExp(part)).join("|");
		if (!searchWords) return false;
		const reg = new RegExp(String.raw`\b(${searchWords})\b`);
		return reg.test(handlerImplementation) || reg.test(mockImplementation);
	})];
	return {
		implementation: {
			function: mockImplementation,
			handlerName,
			handler: handlerImplementation
		},
		imports: includeResponseImports,
		strictMockSchemaTypeNames: strictMock ? mergeStrictMockSchemaTypeNames(schemaTypeNames, collectStrictMockSchemaTypeNamesFromImplementation(mockImplementation)) : void 0,
		strictMockSchemaKinds: strictMock ? mergeStrictMockSchemaKinds(getStrictMockSchemaKindsFromResponses(responses, context), Object.fromEntries((collectStrictMockSchemaTypeNamesFromImplementation(mockImplementation) ?? []).map((name) => [name, "object"]))) : void 0
	};
}
function generateMSW(generatorVerbOptions, generatorOptions) {
	const { pathRoute, override, mock } = generatorOptions;
	const { operationName, response } = generatorVerbOptions;
	const overrideBaseUrl = override.mock && "baseUrl" in override.mock ? override.mock.baseUrl : void 0;
	const mockBaseUrl = mock && isMswMock(mock) ? mock.baseUrl : void 0;
	const route = getRouteMSW(pathRoute, overrideBaseUrl ?? mockBaseUrl);
	const handlerName = `get${pascal(operationName)}MockHandler`;
	const getResponseMockFunctionName = `get${pascal(operationName)}ResponseMock`;
	const splitMockImplementations = [];
	const baseDefinition = generateDefinition("", route, getResponseMockFunctionName, handlerName, generatorVerbOptions, generatorOptions, response.definition.success, response.types.success[0]?.key ?? "200", response.imports, response.types.success, response.contentTypes, splitMockImplementations);
	const mockImplementations = [baseDefinition.implementation.function];
	const handlerImplementations = [baseDefinition.implementation.handler];
	const imports = [...baseDefinition.imports];
	const strictMockSchemaTypeNames = new Set(baseDefinition.strictMockSchemaTypeNames);
	const strictMockSchemaKinds = { ...baseDefinition.strictMockSchemaKinds };
	if (generatorOptions.mock && isObject(generatorOptions.mock) && generatorOptions.mock.generateEachHttpStatus) for (const statusResponse of [...response.types.success, ...response.types.errors]) {
		const definition = generateDefinition(statusResponse.key, route, getResponseMockFunctionName, handlerName, generatorVerbOptions, generatorOptions, statusResponse.value, statusResponse.key, response.imports, [statusResponse], [statusResponse.contentType], splitMockImplementations);
		mockImplementations.push(definition.implementation.function);
		handlerImplementations.push(definition.implementation.handler);
		imports.push(...definition.imports);
		for (const name of definition.strictMockSchemaTypeNames ?? []) strictMockSchemaTypeNames.add(name);
		if (definition.strictMockSchemaKinds) for (const [name, kind] of Object.entries(definition.strictMockSchemaKinds)) strictMockSchemaKinds[name] ??= kind;
	}
	const aggregatedStrictNames = [...strictMockSchemaTypeNames];
	return {
		implementation: {
			function: mockImplementations.join("\n"),
			handlerName,
			handler: handlerImplementations.join("\n")
		},
		imports,
		strictMockSchemaTypeNames: aggregatedStrictNames.length > 0 ? aggregatedStrictNames : void 0,
		strictMockSchemaKinds: mergeStrictMockSchemaKinds(strictMockSchemaKinds)
	};
}
//#endregion
//#region src/faker/index.ts
function getFakerDependencies(options) {
	const locale = options?.locale;
	return [{
		exports: [{
			name: "faker",
			values: true
		}],
		dependency: locale ? `@faker-js/faker/locale/${locale}` : "@faker-js/faker"
	}];
}
/**
* Emits the import header for a faker-only mock file. Faker output never
* imports from `msw`, so this only emits `import { faker } from '@faker-js/faker'`
* (or the locale-scoped variant) plus any operation-specific imports.
*/
const generateFakerImports = ({ implementation, imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports, options }) => {
	return generateDependencyImports(implementation, [...getFakerDependencies(options), ...imports], projectName, hasSchemaDir, isAllowSyntheticDefaultImports);
};
/**
* Generates the faker-only mock output for a single operation. This reuses
* the response-factory portion of {@link generateMSW} and strips out the
* handler and aggregator entries so callers can write a standalone
* `<file>.faker.ts` with no `msw` dependency.
*/
function generateFaker(generatorVerbOptions, generatorOptions) {
	const result = generateMSW(generatorVerbOptions, generatorOptions);
	return {
		implementation: {
			function: result.implementation.function,
			handler: "",
			handlerName: ""
		},
		imports: result.imports,
		strictMockSchemaTypeNames: result.strictMockSchemaTypeNames,
		strictMockSchemaKinds: result.strictMockSchemaKinds
	};
}
/**
* Builds the contents of a consolidated faker mock file for every entry under
* `components/schemas`. Each schema produces a `get<SchemaName>Mock(overrides)`
* factory in the spirit of the existing per-operation `get<Op>ResponseMock`
* helpers. Opt in via `mock.generators: [{ type: 'faker', schemas: true }]`.
*
* Returns the function bodies plus any `GeneratorImport` references the
* factories need so the writer can hoist them into the file header.
*/
function generateFakerForSchemas(schemas, context, options) {
	const factories = [];
	const strictMockTypeNames = /* @__PURE__ */ new Set();
	const strictMockSchemaKinds = {};
	const allImports = [];
	const splitMockImplementations = [];
	const localFactoryNames = new Set(schemas.filter((s) => !!s.schema).map((s) => `get${pascal(s.name)}Mock`));
	const localMockTypeNames = new Set(schemas.filter((s) => !!s.schema).map((s) => getStrictMockTypeName(pascal(s.name))));
	const mockOptions = getMockWithoutFunc(context.spec, context.output.override);
	for (const generatorSchema of schemas) {
		const { name, schema } = generatorSchema;
		if (!schema) continue;
		const factoryName = `get${pascal(name)}Mock`;
		const factoryImports = [];
		const factoryImportsBefore = factoryImports.length;
		const schemaName = pascal(name);
		const result = getMockScalar({
			item: {
				...schema,
				name: schemaName
			},
			imports: factoryImports,
			mockOptions,
			operationId: name,
			tags: [],
			context,
			existingReferencedProperties: [schemaName],
			existingReferencedAllOfRefs: [schemaName],
			splitMockImplementations,
			allowOverride: true,
			isRef: false
		});
		appendImportsDelta(allImports, factoryImports, factoryImportsBefore);
		if (result.imports !== factoryImports) appendImportsDelta(allImports, result.imports, 0);
		const typeName = pascal(name);
		const { param, returnType, returnCast } = getMockFactorySignatureParts(typeName, mockOptions, {
			isOverridable: result.value.includes("overrideResponse"),
			overrideType: `Partial<${typeName}>`
		});
		const factory = formatMockFactoryDeclaration(factoryName, param, returnType, result.value, returnCast);
		if (isStrictMock(mockOptions)) {
			strictMockTypeNames.add(typeName);
			strictMockSchemaKinds[typeName] = classifyStrictMockSchemaType(schema);
		}
		factories.push(factory);
		allImports.push({
			name: pascal(name),
			values: false
		});
	}
	const mergedImports = /* @__PURE__ */ new Map();
	for (const imp of allImports) {
		if (imp.schemaFactory && localFactoryNames.has(imp.name)) continue;
		if (imp.schemaFactory && !imp.values && localMockTypeNames.has(imp.name)) continue;
		const key = `${imp.name}::${imp.alias ?? ""}`;
		const existing = mergedImports.get(key);
		if (!existing) {
			mergedImports.set(key, imp);
			continue;
		}
		if (!existing.values && imp.values) mergedImports.set(key, imp);
	}
	const uniqueImports = [...mergedImports.values()];
	const implementation = [...splitMockImplementations, ...factories].filter(Boolean).join("\n\n");
	for (const name of collectStrictMockSchemaTypeNamesFromImplementation(implementation)) {
		strictMockTypeNames.add(name);
		strictMockSchemaKinds[name] ??= "object";
	}
	const aggregatedStrictNames = [...strictMockTypeNames];
	return {
		implementation,
		imports: uniqueImports,
		strictMockSchemaTypeNames: aggregatedStrictNames.length > 0 ? aggregatedStrictNames : void 0,
		strictMockSchemaKinds: mergeStrictMockSchemaKinds(strictMockSchemaKinds)
	};
}
//#endregion
//#region src/index.ts
const DEFAULT_MSW_OPTIONS = {
	type: OutputMockType.MSW,
	useExamples: false
};
const DEFAULT_FAKER_OPTIONS = {
	type: OutputMockType.FAKER,
	useExamples: false,
	schemas: false,
	operationResponses: true
};
/**
* Returns the default GlobalMockOptions for a given mock type. Used when
* normalizing user-provided entries in `output.mock.generators` so callers
* can omit the per-type defaults.
*/
const getDefaultMockOptionsForType = (type) => {
	switch (type) {
		case OutputMockType.FAKER: return DEFAULT_FAKER_OPTIONS;
		case OutputMockType.MSW: return DEFAULT_MSW_OPTIONS;
	}
};
/**
* Dispatches mock-file imports generation to the appropriate generator based
* on the `OutputMockType` discriminator on the mock options.
*/
const generateMockImports = (importOptions) => {
	switch (importOptions.options?.type) {
		case OutputMockType.FAKER: return generateFakerImports(importOptions);
		default: return generateMSWImports(importOptions);
	}
};
/**
* Dispatches per-operation mock generation to the appropriate generator
* based on the `OutputMockType` discriminator. Each entry in
* `output.mock.generators` is dispatched here individually.
*/
function generateMock(generatorVerbOptions, generatorOptions) {
	const { context } = generatorOptions;
	const previousActiveMockOutputType = context.activeMockOutputType;
	context.activeMockOutputType = generatorOptions.mock.type;
	try {
		switch (generatorOptions.mock.type) {
			case OutputMockType.FAKER: return generateFaker(generatorVerbOptions, generatorOptions);
			default: return generateMSW(generatorVerbOptions, generatorOptions);
		}
	} finally {
		context.activeMockOutputType = previousActiveMockOutputType;
	}
}
//#endregion
export { DEFAULT_FAKER_OPTIONS, DEFAULT_MSW_OPTIONS, buildStrictMockTypeFileHeader, dedupeStrictMockTypeDeclarations, generateFaker, generateFakerForSchemas, generateFakerImports, generateMSW, generateMSWImports, generateMock, generateMockImports, getDefaultMockOptionsForType };

//# sourceMappingURL=index.mjs.map