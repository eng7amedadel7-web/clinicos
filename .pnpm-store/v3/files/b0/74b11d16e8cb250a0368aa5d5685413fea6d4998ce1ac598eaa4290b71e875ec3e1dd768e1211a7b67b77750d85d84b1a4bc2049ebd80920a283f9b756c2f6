import { buildDynamicScope, buildInlineDynamicScope, camel, compareVersions, generateMutator, getDynamicAnchorName, getFormDataFieldFileType, getNumberWord, getRefInfo, isBoolean, isDynamicReference, isNumber, isObject, isString, jsStringEscape, jsStringLiteralEscape, logVerbose, pascal, resolveDynamicRef, resolveRef, stringify } from "@orval/core";
import jsesc from "jsesc";
import { unique } from "remeda";
//#region src/compatible-v4.ts
const getZodPackageVersion = (packageJson) => {
	return packageJson.resolvedVersions?.zod ?? packageJson.dependencies?.zod ?? packageJson.devDependencies?.zod ?? packageJson.peerDependencies?.zod;
};
const isZodVersionV4 = (packageJson) => {
	const version = getZodPackageVersion(packageJson);
	if (!version) return false;
	const withoutRc = version.split("-")[0];
	return compareVersions(withoutRc, "4.0.0");
};
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
const resolveIsZodV4 = (version, packageJson) => {
	if (version === 4) return true;
	if (version === 3) return false;
	if (!packageJson || !getZodPackageVersion(packageJson)) return true;
	return isZodVersionV4(packageJson);
};
const assertZodTarget = ({ variant, isZodV4 }) => {
	if (variant === "mini" && !isZodV4) throw new Error("Zod Mini requires Zod 4 output. Use override.zod.version: 4 or install zod@^4 when override.zod.version is 'auto'.");
};
const getZodImportSource = (variant) => variant === "mini" ? "zod/mini" : "zod";
const getZodTypeName = (variant) => variant === "mini" ? "ZodMiniType" : "ZodType";
const getZodDateFormat = (isZodV4) => {
	return isZodV4 ? "iso.date" : "date";
};
const getZodTimeFormat = (isZodV4) => {
	return isZodV4 ? "iso.time" : "time";
};
const getZodDateTimeFormat = (isZodV4) => {
	return isZodV4 ? "iso.datetime" : "datetime";
};
const getParameterFunctions = (isZodV4, strict, parameters) => {
	if (isZodV4 && strict) return [["strictObject", parameters]];
	else return strict ? [["object", parameters], ["strict", void 0]] : [["object", parameters]];
};
const getObjectFunctionName = (isZodV4, strict) => {
	return isZodV4 && strict ? "strictObject" : "object";
};
/**
* Returns the object constructor to use for open/generic objects.
*
* - Zod v4 supports `zod.looseObject({...})` directly.
* - Zod v3 falls back to `zod.object({...})` and is finalized with
*   `.passthrough()` during parsing.
*/
const getLooseObjectFunctionName = (isZodV4) => {
	return isZodV4 ? "looseObject" : "object";
};
//#endregion
//#region src/index.ts
const getZodDependencies = (_hasGlobalMutator, _hasParamsSerializerOptions, _packageJson, _httpClient, _hasTagsMutator, override) => [{
	exports: [{
		default: false,
		name: "zod",
		syntheticDefaultImport: false,
		namespaceImport: true,
		values: true
	}],
	dependency: getZodImportSource(override?.zod.variant)
}];
/**
* values that may appear in "type". Equals SchemaObjectType
*/
const possibleSchemaTypes = new Set([
	"integer",
	"number",
	"string",
	"boolean",
	"object",
	"strictObject",
	"null",
	"array"
]);
const predefinedZodFormats = new Set([
	"date",
	"time",
	"date-time",
	"email",
	"uri",
	"hostname",
	"uuid"
]);
const resolveZodType = (schema) => {
	const schemaTypeValue = schema.type;
	if (Array.isArray(schemaTypeValue)) {
		const nonNullTypes = schemaTypeValue.filter((t) => isString(t)).filter((t) => t !== "null" && possibleSchemaTypes.has(t));
		if (nonNullTypes.length > 1) return { multiType: nonNullTypes };
		const type = nonNullTypes[0];
		if (type === "array" && "prefixItems" in schema) return "tuple";
		return type;
	}
	const type = isString(schemaTypeValue) ? schemaTypeValue : void 0;
	if (schema.type === "array" && "prefixItems" in schema) return "tuple";
	if (!type && "const" in schema) {
		const constValue = schema.const;
		if (isString(constValue)) return "string";
		if (isNumber(constValue)) return "number";
		if (isBoolean(constValue)) return "boolean";
		if (constValue === null) return "null";
	}
	return type ?? "unknown";
};
const COERCIBLE_TYPES = new Set([
	"string",
	"number",
	"boolean",
	"bigint",
	"date"
]);
const PURE_COMMENT = "/*#__PURE__*/ ";
const zodMiniCall = (fn, args = "") => `${PURE_COMMENT}zod.${fn}(${args})`;
const zodMiniCoerceCall = (fn, args = "") => `${PURE_COMMENT}zod.coerce.${fn}(${args})`;
/** Escapes string defaults for safe embedding in template literals. */
function formatDefaultValue(value) {
	if (isString(value)) return jsesc(value, {
		quotes: "backtick",
		wrap: true
	});
	if (Array.isArray(value)) return `[${value.map((item) => isString(item) ? jsesc(item, {
		quotes: "backtick",
		wrap: true
	}) : formatDefaultValue(item)).join(", ")}]`;
	return stringify(value) ?? "null";
}
const minAndMaxTypes = new Set([
	"number",
	"integer",
	"string",
	"array"
]);
const removeReadOnlyProperties = (schema) => {
	if (schema.properties && isObject(schema.properties)) {
		const filteredProperties = {};
		for (const [key, value] of Object.entries(schema.properties)) {
			if (isObject(value) && "readOnly" in value && value.readOnly) continue;
			filteredProperties[key] = value;
		}
		return {
			...schema,
			properties: filteredProperties
		};
	}
	if (schema.items && isObject(schema.items) && "properties" in schema.items) return {
		...schema,
		items: removeReadOnlyProperties(schema.items)
	};
	return schema;
};
const COMPONENT_SCHEMAS_REF_PATTERN = /^#\/components\/schemas\/[^/]+$/;
const isComponentSchemaRef = (ref) => COMPONENT_SCHEMAS_REF_PATTERN.test(ref);
const DISCRIMINATOR_MARK = "::discriminator::";
const encodeDiscriminatorSeparator = (base, property) => `${base}${DISCRIMINATOR_MARK}${property}`;
const decodeDiscriminatorSeparator = (fn) => {
	const index = fn.indexOf(DISCRIMINATOR_MARK);
	if (index === -1) return null;
	return {
		base: fn.slice(0, index),
		property: fn.slice(index + 17)
	};
};
const resolveUnionMemberSchema = (member, context) => {
	if (member && "$ref" in member && typeof member.$ref === "string") return tryResolveRefSchema(member.$ref, context);
	return member;
};
const isPlainObjectSchema = (schema) => {
	if (!schema || schema.oneOf || schema.anyOf || schema.allOf) return false;
	return schema.type === "object" || isObject(schema.properties) && Object.keys(schema.properties).length > 0;
};
const hasLiteralDiscriminator = (schema, property) => {
	if (!schema || !isObject(schema.properties)) return false;
	const propertySchema = schema.properties[property];
	if (!isObject(propertySchema)) return false;
	return propertySchema.const !== void 0 || Array.isArray(propertySchema.enum);
};
const collectDiscriminatorValues = (member, property, context) => {
	const readValues = (schema) => {
		if (!schema || !isObject(schema.properties)) return null;
		const propertySchema = schema.properties[property];
		if (!isObject(propertySchema)) return null;
		const constValue = propertySchema.const;
		if (constValue !== void 0) return [constValue];
		const enumValues = propertySchema.enum;
		if (Array.isArray(enumValues)) return enumValues;
		return null;
	};
	const resolved = resolveUnionMemberSchema(member, context);
	if (!resolved) return null;
	if (resolved.allOf) {
		const parts = resolved.allOf.map((part) => resolveUnionMemberSchema(part, context));
		for (let index = parts.length - 1; index >= 0; index--) {
			const values = readValues(parts[index]);
			if (values) return values;
		}
		return null;
	}
	return readValues(resolved);
};
const isDiscriminatableMember = (member, property, useReusableSchemas, context) => {
	const resolved = resolveUnionMemberSchema(member, context);
	if (!resolved) return false;
	if (resolved.oneOf || resolved.anyOf) return false;
	if (resolved.allOf) {
		if (useReusableSchemas) return false;
		const parts = resolved.allOf.map((part) => resolveUnionMemberSchema(part, context));
		if (!parts.every((part) => isPlainObjectSchema(part))) return false;
		return parts.some((part) => hasLiteralDiscriminator(part, property));
	}
	if (!isPlainObjectSchema(resolved)) return false;
	return hasLiteralDiscriminator(resolved, property);
};
const generateZodValidationSchemaDefinition = (schema, context, name, strict, isZodV4, rules) => {
	if (!schema) return {
		functions: [],
		consts: []
	};
	const CHAINABLE_SIBLINGS = new Set([
		"nullable",
		"default",
		"description"
	]);
	const isChainable = (k) => CHAINABLE_SIBLINGS.has(k);
	const applyChainableSiblings = (functions, consts, siblingSchema) => {
		const refRequired = rules?.required ?? false;
		const refHasDefault = siblingSchema.default !== void 0;
		if (!refRequired && siblingSchema.nullable) functions.push(["nullish", void 0]);
		else if (siblingSchema.nullable) functions.push(["nullable", void 0]);
		else if (!refRequired && !refHasDefault) functions.push(["optional", void 0]);
		if (refHasDefault) {
			const registry = rules?.constNameRegistry ?? {};
			const counter = isNumber(registry[name]) ? registry[name] + 1 : 0;
			registry[name] = counter;
			const defaultVarName = `${name}Default${counter ? pascal(getNumberWord(counter)) : ""}`;
			const defaultLiteral = stringify(siblingSchema.default);
			if (defaultLiteral !== void 0) {
				consts.push(`export const ${defaultVarName} = ${defaultLiteral};`);
				functions.push(["default", defaultVarName]);
			}
		}
		if (typeof siblingSchema.description === "string") functions.push(["describe", `'${jsStringEscape(siblingSchema.description)}'`]);
	};
	if (rules?.useReusableSchemas && "$ref" in schema && typeof schema.$ref === "string" && isComponentSchemaRef(schema.$ref)) {
		const siblings = Object.keys(schema).filter((k) => k !== "$ref");
		if (siblings.every((k) => isChainable(k))) {
			const functions = [["namedRef", {
				name: getRefInfo(schema.$ref, context).name,
				sourceRef: schema.$ref
			}]];
			const consts = [];
			applyChainableSiblings(functions, consts, schema);
			return {
				functions,
				consts
			};
		}
		logVerbose(`[orval/zod] $ref ${schema.$ref} has non-chainable siblings [${siblings.filter((s) => !isChainable(s)).join(", ")}]; falling back to inlining.`);
		schema = dereference(schema, context);
	}
	if (rules?.useReusableSchemas && isDynamicReference(schema)) {
		const anchorName = getDynamicAnchorName(schema.$dynamicRef);
		if (anchorName) {
			const { resolvedTypeName, schemaName } = resolveDynamicRef(anchorName, context);
			if (resolvedTypeName !== "unknown" && schemaName) {
				const siblings = Object.keys(schema).filter((k) => k !== "$dynamicRef");
				if (siblings.every((k) => isChainable(k))) {
					const functions = [["namedRef", {
						name: resolvedTypeName,
						sourceRef: `${COMPONENT_SCHEMAS_PREFIX}${encodeSegment(schemaName)}`
					}]];
					const consts = [];
					applyChainableSiblings(functions, consts, schema);
					return {
						functions,
						consts
					};
				}
				logVerbose(`[orval/zod] $dynamicRef ${schema.$dynamicRef} has non-chainable siblings [${siblings.filter((s) => !isChainable(s)).join(", ")}]; falling back to inlining.`);
			}
		}
		schema = dereference(schema, context);
	}
	const useReusableSchemas = rules?.useReusableSchemas ?? false;
	const urlEncoded = rules?.urlEncoded ?? false;
	const consts = [];
	const constNameRegistry = rules?.constNameRegistry ?? {};
	const constsCounter = isNumber(constNameRegistry[name]) ? constNameRegistry[name] + 1 : 0;
	const constsCounterValue = constsCounter ? pascal(getNumberWord(constsCounter)) : "";
	constNameRegistry[name] = constsCounter;
	const functions = [];
	const pushDescriptionOrMeta = () => {
		const description = typeof schema.description === "string" && schema.description.length > 0 ? schema.description : void 0;
		const deprecated = "deprecated" in schema && schema.deprecated === true ? true : void 0;
		if (rules?.emitMeta && isZodV4) {
			const meta = { id: name };
			if (description !== void 0) meta.description = description;
			if (deprecated) meta.deprecated = true;
			functions.push(["meta", meta]);
		} else if (description !== void 0) functions.push(["describe", `'${jsStringEscape(description)}'`]);
	};
	const type = resolveZodType(schema);
	const required = rules?.required ?? false;
	const hasDefault = schema.default !== void 0;
	const nullable = "nullable" in schema && schema.nullable || Array.isArray(schema.type) && schema.type.includes("null");
	const min = schema.minimum ?? schema.minLength ?? schema.minItems;
	const max = schema.maximum ?? schema.maxLength ?? schema.maxItems;
	const exclusiveMinRaw = "exclusiveMinimum" in schema ? schema.exclusiveMinimum : void 0;
	const exclusiveMaxRaw = "exclusiveMaximum" in schema ? schema.exclusiveMaximum : void 0;
	const exclusiveMin = isBoolean(exclusiveMinRaw) && exclusiveMinRaw ? min : exclusiveMinRaw;
	const exclusiveMax = isBoolean(exclusiveMaxRaw) && exclusiveMaxRaw ? max : exclusiveMaxRaw;
	const multipleOf = schema.multipleOf;
	const matches = schema.pattern ?? void 0;
	const hasNonArrayEnum = !!schema.enum && type !== "array";
	let skipSwitchStatement = false;
	if (schema.allOf || schema.oneOf || schema.anyOf) {
		const separator = schema.allOf ? "allOf" : schema.oneOf ? "oneOf" : "anyOf";
		const schemas = schema.allOf ?? schema.oneOf ?? schema.anyOf;
		const discriminatorProperty = (() => {
			if (!context.output?.override?.zod?.generateDiscriminatedUnion || !(schema.oneOf || schema.anyOf) || !schema.discriminator?.propertyName || schemas.length <= 1) return;
			const property = schema.discriminator.propertyName;
			if (!schemas.every((member) => isDiscriminatableMember(member, property, useReusableSchemas, context))) return;
			const seenValues = /* @__PURE__ */ new Set();
			for (const member of schemas) {
				const values = collectDiscriminatorValues(member, property, context);
				if (!values || values.length === 0) return void 0;
				for (const value of values) {
					const key = JSON.stringify(value);
					if (seenValues.has(key)) return void 0;
					seenValues.add(key);
				}
			}
			return property;
		})();
		const unionSeparator = discriminatorProperty ? encodeDiscriminatorSeparator(separator, discriminatorProperty) : separator;
		const allOfRequired = schema.allOf ? [...new Set([...schema.required ?? [], ...schemas.flatMap((member) => {
			const memberRequired = ("$ref" in member && typeof member.$ref === "string" ? tryResolveRefSchema(member.$ref, context) : member)?.required;
			return Array.isArray(memberRequired) ? memberRequired : [];
		})])] : void 0;
		const baseSchemas = schemas.map((schema, index) => generateZodValidationSchemaDefinition(schema, context, `${camel(name)}${pascal(getNumberWord(index + 1))}`, strict, isZodV4, {
			required: true,
			additionalRequired: allOfRequired,
			constNameRegistry,
			useReusableSchemas,
			urlEncoded
		}));
		if ((schema.allOf || schema.oneOf || schema.anyOf) && schema.properties) {
			const additionalPropertiesSchema = {
				properties: schema.properties,
				required: schema.required,
				additionalProperties: schema.additionalProperties,
				type: schema.type
			};
			const additionalIndex = baseSchemas.length + 1;
			const additionalPropertiesDefinition = generateZodValidationSchemaDefinition(additionalPropertiesSchema, context, `${camel(name)}${pascal(getNumberWord(additionalIndex))}`, strict, isZodV4, {
				required: true,
				additionalRequired: allOfRequired,
				constNameRegistry,
				useReusableSchemas,
				urlEncoded
			});
			if (schema.oneOf || schema.anyOf) functions.push(["allOf", [{
				functions: [[unionSeparator, baseSchemas]],
				consts: []
			}, additionalPropertiesDefinition]]);
			else {
				baseSchemas.push(additionalPropertiesDefinition);
				functions.push([separator, baseSchemas]);
			}
		} else functions.push([unionSeparator, baseSchemas]);
		skipSwitchStatement = true;
	}
	let defaultVarName;
	if (schema.default !== void 0) {
		defaultVarName = `${name}Default${constsCounterValue}`;
		let defaultValue;
		if (schema.type === "string" && (schema.format === "date" || schema.format === "date-time") && context.output.override.useDates) defaultValue = `new Date(${JSON.stringify(schema.default)})`;
		else if (isObject(schema.default)) {
			const entries = Object.entries(schema.default).map(([key, value]) => {
				const safeKey = JSON.stringify(key);
				if (isString(value)) return `${safeKey}: ${JSON.stringify(value)} as const`;
				if (Array.isArray(value)) return `${safeKey}: [${value.map((item) => isString(item) ? `${JSON.stringify(item)} as const` : `${item}`).join(", ")}]`;
				if (value === null || value === void 0 || isNumber(value) || isBoolean(value)) return `${safeKey}: ${value}`;
			}).join(", ");
			defaultValue = entries.length === 0 ? `{}` : `{ ${entries} }`;
		} else {
			defaultValue = formatDefaultValue(schema.default);
			if (Array.isArray(schema.default) && type === "array" && schema.items && "enum" in schema.items && schema.default.length > 0) {
				defaultVarName = defaultValue;
				defaultValue = void 0;
			}
		}
		if (defaultValue) consts.push(`export const ${defaultVarName} = ${defaultValue};`);
	}
	if (isObject(type) && "multiType" in type) {
		const types = type.multiType;
		functions.push(["oneOf", types.map((t) => generateZodValidationSchemaDefinition({
			...schema,
			type: t
		}, context, name, strict, isZodV4, {
			required: true,
			constNameRegistry,
			useReusableSchemas,
			urlEncoded
		}))]);
		if (!required && nullable) functions.push(["nullish", void 0]);
		else if (nullable) functions.push(["nullable", void 0]);
		else if (!required) functions.push(["optional", void 0]);
		pushDescriptionOrMeta();
		return {
			functions,
			consts
		};
	}
	if (!skipSwitchStatement) switch (type) {
		case "tuple":
			/**
			*
			* > 10.3.1.1. prefixItems
			* > The value of "prefixItems" MUST be a non-empty array of valid JSON Schemas.
			* >
			* > Validation succeeds if each element of the instance validates against the schema at the same position, if any.
			* > This keyword does not constrain the length of the array. If the array is longer than this keyword's value,
			* > this keyword validates only the prefix of matching length.
			* >
			* > This keyword produces an annotation value which is the largest index to which this keyword applied a subschema.
			* > The value MAY be a boolean true if a subschema was applied to every index of the instance, such as is produced by the "items" keyword.
			* > This annotation affects the behavior of "items" and "unevaluatedItems".
			* >
			* > Omitting this keyword has the same assertion behavior as an empty array.
			*/
			if ("prefixItems" in schema) {
				const schema31 = schema;
				const prefixItems = Array.isArray(schema31.prefixItems) ? schema31.prefixItems : [];
				if (prefixItems.length > 0) {
					functions.push(["tuple", prefixItems.map((item, idx) => generateZodValidationSchemaDefinition(dereference(item, context), context, camel(`${name}-${idx}-item`), isZodV4, strict, {
						required: true,
						constNameRegistry,
						useReusableSchemas,
						urlEncoded
					}))]);
					if (schema.items && (max ?? Number.POSITIVE_INFINITY) > prefixItems.length) functions.push(["rest", generateZodValidationSchemaDefinition(schema.items, context, camel(`${name}-item`), strict, isZodV4, {
						required: true,
						constNameRegistry,
						useReusableSchemas,
						urlEncoded
					})]);
				}
			}
			break;
		case "array":
			functions.push(["array", generateZodValidationSchemaDefinition(schema.items, context, camel(`${name}-item`), strict, isZodV4, {
				required: true,
				constNameRegistry,
				useReusableSchemas,
				urlEncoded
			})]);
			break;
		case "string":
			if (schema.enum) break;
			if (context.output.override.useDates && (schema.format === "date" || schema.format === "date-time")) {
				functions.push(["date", void 0]);
				break;
			}
			if (!urlEncoded && schema.format === "binary") {
				functions.push(["instanceof", "File"]);
				break;
			}
			if (!urlEncoded && schema.contentMediaType === "application/octet-stream" && !schema.contentEncoding) {
				functions.push(["instanceof", "File"]);
				break;
			}
			if (isZodV4) {
				if (!predefinedZodFormats.has(schema.format ?? "")) {
					if ("const" in schema) functions.push(["literal", JSON.stringify(String(schema.const))]);
					else if (schema.pattern && schema.format) {
						const isStartWithSlash = schema.pattern.startsWith("/");
						const isEndWithSlash = schema.pattern.endsWith("/");
						const regexp = `new RegExp('${jsStringLiteralEscape(schema.pattern.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : void 0))}')`;
						consts.push(`export const ${name}RegExp${constsCounterValue} = ${regexp};\n`);
						functions.push(["stringFormat", [`'${jsStringLiteralEscape(schema.format)}'`, `${name}RegExp${constsCounterValue}`]]);
					} else functions.push([type, void 0]);
					break;
				}
			} else if ("const" in schema) functions.push(["literal", JSON.stringify(String(schema.const))]);
			else functions.push([type, void 0]);
			if (schema.format === "date") {
				const formatAPI = getZodDateFormat(isZodV4);
				functions.push([formatAPI, void 0]);
				break;
			}
			if (schema.format === "time") {
				const options = context.output.override.zod.timeOptions;
				const formatAPI = getZodTimeFormat(isZodV4);
				functions.push([formatAPI, JSON.stringify(options)]);
				break;
			}
			if (schema.format === "date-time") {
				const options = context.output.override.zod.dateTimeOptions;
				const formatAPI = getZodDateTimeFormat(isZodV4);
				functions.push([formatAPI, JSON.stringify(options)]);
				break;
			}
			if (schema.format === "email") {
				functions.push(["email", void 0]);
				break;
			}
			if (schema.format === "uri") {
				functions.push(["url", void 0]);
				break;
			}
			if (schema.format === "hostname") {
				if (isZodV4) functions.push(["hostname", void 0]);
				else functions.push(["url", void 0]);
				break;
			}
			if (schema.format === "uuid") {
				functions.push(["uuid", void 0]);
				break;
			}
			break;
		default: {
			if ("const" in schema) {
				const constValue = schema.const;
				if (isNumber(constValue) || isBoolean(constValue) || constValue === null) {
					functions.push(["literal", constValue]);
					break;
				}
			}
			const hasProperties = !!schema.properties;
			const properties = schema.properties ?? {};
			const hasDefinedProperties = Object.keys(properties).length > 0;
			const hasAdditionalPropertiesSchema = !!schema.additionalProperties && !isBoolean(schema.additionalProperties);
			const shouldUseLooseObject = type === "object" && !hasDefinedProperties && schema.additionalProperties === void 0 && !hasAdditionalPropertiesSchema;
			if (hasProperties && hasDefinedProperties) {
				const objectType = getObjectFunctionName(isZodV4, strict);
				const requiredKeys = new Set([...schema.required ?? [], ...rules?.additionalRequired ?? []]);
				functions.push([objectType, Object.keys(properties).map((key) => ({ [key]: rules?.propertyOverrides?.[key] ?? generateZodValidationSchemaDefinition(properties[key], context, camel(`${name}-${key}`), strict, isZodV4, {
					required: requiredKeys.has(key),
					constNameRegistry,
					useReusableSchemas,
					urlEncoded
				}) })).reduce((acc, curr) => ({
					...acc,
					...curr
				}), {})]);
				if (strict && !isZodV4) functions.push(["strict", void 0]);
				break;
			}
			if (shouldUseLooseObject) {
				const looseObjectType = getLooseObjectFunctionName(isZodV4);
				functions.push([looseObjectType, {}]);
				if (!isZodV4) functions.push(["passthrough", void 0]);
				break;
			}
			if (schema.additionalProperties) {
				functions.push(["additionalProperties", generateZodValidationSchemaDefinition(isBoolean(schema.additionalProperties) ? {} : schema.additionalProperties, context, name, strict, isZodV4, {
					required: true,
					constNameRegistry,
					useReusableSchemas,
					urlEncoded
				})]);
				break;
			}
			if (schema.enum) break;
			functions.push([type === "integer" ? "int" : type, void 0]);
			break;
		}
	}
	if (!hasNonArrayEnum && isString(type) && minAndMaxTypes.has(type)) {
		const shouldUseExclusiveMin = exclusiveMinRaw !== void 0;
		const shouldUseExclusiveMax = exclusiveMaxRaw !== void 0;
		if (shouldUseExclusiveMin && exclusiveMin !== void 0) {
			consts.push(`export const ${name}ExclusiveMin${constsCounterValue} = ${exclusiveMin};`);
			functions.push(["gt", `${name}ExclusiveMin${constsCounterValue}`]);
		} else if (min !== void 0) if (min === 1) functions.push(["min", `${min}`]);
		else {
			consts.push(`export const ${name}Min${constsCounterValue} = ${min};`);
			functions.push(["min", `${name}Min${constsCounterValue}`]);
		}
		if (shouldUseExclusiveMax && exclusiveMax !== void 0) {
			consts.push(`export const ${name}ExclusiveMax${constsCounterValue} = ${exclusiveMax};`);
			functions.push(["lt", `${name}ExclusiveMax${constsCounterValue}`]);
		} else if (max !== void 0) {
			consts.push(`export const ${name}Max${constsCounterValue} = ${max};`);
			functions.push(["max", `${name}Max${constsCounterValue}`]);
		}
		if (multipleOf !== void 0) {
			consts.push(`export const ${name}MultipleOf${constsCounterValue} = ${multipleOf.toString()};`);
			functions.push(["multipleOf", `${name}MultipleOf${constsCounterValue}`]);
		}
		if (exclusiveMin !== void 0 || min !== void 0 || exclusiveMax !== void 0 || multipleOf !== void 0 || max !== void 0) consts.push(`\n`);
	}
	const stringFormatAlreadyEmitted = isZodV4 && type === "string" && !!matches && !!schema.format && !predefinedZodFormats.has(schema.format ?? "");
	if (matches && !hasNonArrayEnum && type === "string" && !stringFormatAlreadyEmitted) {
		const isStartWithSlash = matches.startsWith("/");
		const isEndWithSlash = matches.endsWith("/");
		const regexp = `new RegExp('${jsStringLiteralEscape(matches.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : void 0))}')`;
		consts.push(`export const ${name}RegExp${constsCounterValue} = ${regexp};\n`);
		if (schema.format && !predefinedZodFormats.has(schema.format) && isZodV4) functions.push(["stringFormat", [`'${jsStringLiteralEscape(schema.format)}'`, `${name}RegExp${constsCounterValue}`]]);
		else functions.push(["regex", `${name}RegExp${constsCounterValue}`]);
	}
	if (schema.enum && type !== "array") {
		const uniqueEnumValues = unique(schema.enum);
		if (uniqueEnumValues.every((value) => isString(value))) functions.push(["enum", `[${uniqueEnumValues.map((value) => `'${jsStringLiteralEscape(value)}'`).join(", ")}]`]);
		else functions.push(["oneOf", uniqueEnumValues.map((value) => ({
			functions: [["literal", isString(value) ? `'${jsStringLiteralEscape(value)}'` : value]],
			consts: []
		}))]);
	}
	if (!required && nullable) functions.push(["nullish", void 0]);
	else if (nullable) functions.push(["nullable", void 0]);
	else if (!required && !hasDefault) functions.push(["optional", void 0]);
	if (hasDefault) functions.push(["default", defaultVarName]);
	pushDescriptionOrMeta();
	return {
		functions,
		consts: unique(consts)
	};
};
const PARAMS_MODIFIER_VALIDATORS = new Set([
	"optional",
	"nullable",
	"nullish",
	"default",
	"describe",
	"unknown",
	"any",
	"never",
	"null",
	"undefined",
	"void"
]);
const PARAMS_MERGE_INTO_OPTIONS_VALIDATORS = new Set([
	"datetime",
	"time",
	"iso.datetime",
	"iso.time"
]);
const parseZodValidationSchemaDefinition = (input, context, coerceTypes = false, strict, isZodV4, preprocess, paramsInjection, variant = "classic", exactOptional = false) => {
	if (input.functions.length === 0) return {
		zod: "",
		consts: "",
		usedRefs: /* @__PURE__ */ new Set()
	};
	let consts = "";
	const usedRefs = /* @__PURE__ */ new Set();
	const appendConstsChunk = (chunk) => {
		if (!chunk) return;
		if (consts.length > 0 && !consts.endsWith("\n") && !chunk.startsWith("\n")) consts += "\n";
		consts += chunk;
	};
	const formatFunctionArgs = (value) => {
		if (value === void 0) return "";
		if (value === null) return "null";
		if (isString(value)) return value;
		if (Array.isArray(value)) return value.map((item) => formatFunctionArgs(item)).join(", ");
		if (isObject(value)) return stringify(value) ?? "";
		if (isNumber(value) || isBoolean(value)) return `${value}`;
		return "";
	};
	const buildParamsArg = (fn, fieldPath) => {
		if (!paramsInjection) return void 0;
		if (PARAMS_MODIFIER_VALIDATORS.has(fn)) return void 0;
		const ctx = {
			operationId: paramsInjection.operationId,
			location: paramsInjection.location,
			schemaName: paramsInjection.schemaName,
			fieldPath: [...fieldPath],
			validator: fn
		};
		return `${paramsInjection.mutator.name}(${JSON.stringify(ctx)})`;
	};
	const shouldCoerce = (fn) => coerceTypes && (Array.isArray(coerceTypes) ? coerceTypes.includes(fn) : COERCIBLE_TYPES.has(fn));
	const buildCombinedArgs = (fn, args, fieldPath) => {
		const formattedArgs = formatFunctionArgs(args);
		const paramsArg = buildParamsArg(fn, fieldPath);
		if (paramsArg && formattedArgs && PARAMS_MERGE_INTO_OPTIONS_VALIDATORS.has(fn)) return `{ ...${formattedArgs}, ...${paramsArg} }`;
		if (paramsArg) return formattedArgs ? `${formattedArgs}, ${paramsArg}` : paramsArg;
		return formattedArgs;
	};
	const renderMiniDefinition = (definition, fieldPath = []) => {
		let current;
		const requireCurrent = (fn) => {
			if (!current) throw new Error(`Cannot render zod mini ${fn} without a base schema`);
			return current;
		};
		const renderObject = (objectArgs, objectType) => ({
			kind: "object",
			expr: `${zodMiniCall(objectType, `{
${Object.entries(objectArgs).map(([key, schema]) => {
				const rendered = renderMiniDefinition(schema, [...fieldPath, key]);
				appendConstsChunk(schema.consts.join("\n"));
				if (Array.isArray(coerceTypes) && coerceTypes.includes("array") && schema.functions.some(([fn]) => fn === "array")) return `  ${JSON.stringify(key)}: ${zodMiniCall("pipe", `${zodMiniCall("transform", "(value) => value === undefined || Array.isArray(value) ? value : [value]")}, ${rendered.expr}`)}`;
				return `  ${JSON.stringify(key)}: ${rendered.expr}`;
			}).join(",\n")}
}`)}`
		});
		const mergeAllOfObjectsMini = (allOfArgs) => {
			if (!(allOfArgs.length > 0 && allOfArgs.every((partSchema) => {
				if (partSchema.functions.length === 0) return false;
				const firstFn = partSchema.functions[0][0];
				return firstFn === "object" || firstFn === "strictObject";
			}))) return null;
			const mergedProperties = {};
			for (const partSchema of allOfArgs) {
				if (partSchema.consts.length > 0) appendConstsChunk(partSchema.consts.join("\n"));
				const objectFunctionIndex = partSchema.functions.findIndex(([fnName]) => fnName === "object" || fnName === "strictObject");
				if (objectFunctionIndex !== -1) {
					const objectArgs = partSchema.functions[objectFunctionIndex][1];
					if (isObject(objectArgs)) Object.assign(mergedProperties, objectArgs);
				}
			}
			return mergedProperties;
		};
		const renderDiscriminatedUnionMemberMini = (member) => {
			if (member.functions[0]?.[0] === "allOf") {
				const merged = mergeAllOfObjectsMini(member.functions[0][1]);
				if (merged !== null) return renderObject(merged, getObjectFunctionName(true, strict)).expr;
			}
			appendConstsChunk(member.consts.join("\n"));
			return renderMiniDefinition(member, fieldPath).expr;
		};
		for (let index = 0; index < definition.functions.length; index++) {
			const [fn, args = ""] = definition.functions[index];
			if (fn === "namedRef") {
				const refArgs = args;
				usedRefs.add(refArgs.name);
				current = {
					expr: `__REF_${refArgs.name}__`,
					kind: "ref"
				};
				continue;
			}
			if (fn === "fileOrString") {
				current = {
					expr: zodMiniCall("union", `[${zodMiniCall("instanceof", "File")}, ${zodMiniCall("string")}]`),
					kind: "union"
				};
				continue;
			}
			if (fn === "allOf") {
				const allOfArgs = args;
				const mergedProperties = strict ? mergeAllOfObjectsMini(allOfArgs) : null;
				if (mergedProperties !== null) {
					current = renderObject(mergedProperties, getObjectFunctionName(true, strict));
					continue;
				}
				const rendered = allOfArgs.map((partSchema) => {
					appendConstsChunk(partSchema.consts.join("\n"));
					return renderMiniDefinition(partSchema, fieldPath).expr;
				});
				if (rendered.length === 0) {
					current = { expr: "" };
					continue;
				}
				current = {
					expr: rendered.reduce((acc, value) => acc ? zodMiniCall("intersection", `${acc}, ${value}`) : value),
					kind: "intersection"
				};
				continue;
			}
			const discriminator = decodeDiscriminatorSeparator(fn);
			if (discriminator || fn === "oneOf" || fn === "anyOf") {
				const unionArgs = args;
				if (unionArgs.length === 1) {
					appendConstsChunk(unionArgs[0].consts.join("\n"));
					current = renderMiniDefinition(unionArgs[0], fieldPath);
					continue;
				}
				if (discriminator) {
					current = {
						expr: zodMiniCall("discriminatedUnion", `'${jsStringEscape(discriminator.property)}', [${unionArgs.map((arg) => renderDiscriminatedUnionMemberMini(arg)).join(",")}]`),
						kind: "union"
					};
					continue;
				}
				current = {
					expr: zodMiniCall("union", `[${unionArgs.map((arg) => {
						appendConstsChunk(arg.consts.join("\n"));
						return renderMiniDefinition(arg, fieldPath).expr;
					}).join(",")}]`),
					kind: "union"
				};
				continue;
			}
			if (fn === "additionalProperties") {
				const additionalPropertiesArgs = args;
				const rendered = renderMiniDefinition(additionalPropertiesArgs, fieldPath);
				if (Array.isArray(additionalPropertiesArgs.consts)) appendConstsChunk(additionalPropertiesArgs.consts.join("\n"));
				current = {
					expr: zodMiniCall("record", `${zodMiniCall("string")}, ${rendered.expr}`),
					kind: "object"
				};
				continue;
			}
			if (fn === "object" || fn === "strictObject" || fn === "looseObject") {
				current = renderObject(args, fn === "looseObject" ? "looseObject" : getObjectFunctionName(true, strict));
				continue;
			}
			if (fn === "passthrough" || fn === "strict") continue;
			if (fn === "array") {
				const arrayArgs = args;
				const rendered = renderMiniDefinition(arrayArgs, fieldPath);
				if (isString(arrayArgs.consts)) appendConstsChunk(arrayArgs.consts);
				else if (Array.isArray(arrayArgs.consts)) appendConstsChunk(arrayArgs.consts.join("\n"));
				current = {
					expr: zodMiniCall("array", rendered.expr),
					kind: "array"
				};
				continue;
			}
			if (fn === "tuple") {
				const tupleItems = args.map((x) => {
					const rendered = renderMiniDefinition(x, fieldPath);
					appendConstsChunk(x.consts.join("\n"));
					return rendered.expr;
				}).join(",\n");
				const next = definition.functions[index + 1];
				if (next?.[0] === "rest") {
					const restDefinition = next[1];
					const rest = renderMiniDefinition(restDefinition, fieldPath).expr;
					appendConstsChunk(restDefinition.consts.join("\n"));
					current = {
						expr: zodMiniCall("tuple", `[${tupleItems}], ${rest}`),
						kind: "tuple"
					};
					index++;
				} else current = {
					expr: zodMiniCall("tuple", `[${tupleItems}]`),
					kind: "tuple"
				};
				continue;
			}
			const combinedArgs = buildCombinedArgs(fn, args, fieldPath);
			if (fn === "int" && shouldCoerce("number")) {
				current = {
					expr: zodMiniCall("pipe", `${zodMiniCoerceCall("number", buildCombinedArgs("number", void 0, fieldPath))}, ${zodMiniCall("int", combinedArgs)}`),
					kind: "number"
				};
				continue;
			}
			if (fn === "optional" || fn === "nullable" || fn === "nullish") {
				const value = requireCurrent(fn);
				current = {
					expr: zodMiniCall(exactOptional && isZodV4 && fn === "optional" ? "exactOptional" : fn, value.expr),
					kind: value.kind
				};
				continue;
			}
			if (fn === "default") {
				const value = requireCurrent(fn);
				current = {
					expr: zodMiniCall("_default", `${value.expr}, ${combinedArgs}`),
					kind: value.kind
				};
				continue;
			}
			if (fn === "describe" || fn === "meta") {
				const value = requireCurrent(fn);
				current = {
					expr: `${value.expr}.check(${zodMiniCall(fn, combinedArgs)})`,
					kind: value.kind
				};
				continue;
			}
			if (fn === "min" || fn === "max" || fn === "gt" || fn === "lt" || fn === "multipleOf" || fn === "regex" || fn === "length") {
				const value = requireCurrent(fn);
				const checkName = fn === "min" ? value.kind === "number" ? "gte" : "minLength" : fn === "max" ? value.kind === "number" ? "lte" : "maxLength" : fn;
				current = {
					expr: `${value.expr}.check(${zodMiniCall(checkName, combinedArgs)})`,
					kind: value.kind
				};
				continue;
			}
			if (fn !== "date" && shouldCoerce(fn) || fn === "date" && shouldCoerce(fn) && context.output.override.useDates) {
				current = {
					expr: zodMiniCoerceCall(fn, combinedArgs),
					kind: fn
				};
				continue;
			}
			current = {
				expr: zodMiniCall(fn, combinedArgs),
				kind: fn === "int" ? "number" : fn === "enum" || fn === "literal" || fn === "stringFormat" ? "string" : fn.split(".")[0]
			};
		}
		return current ?? { expr: "" };
	};
	function mergeAllOfObjectsClassic(allOfArgs, fieldPath) {
		if (!(allOfArgs.length > 0 && allOfArgs.every((partSchema) => {
			if (partSchema.functions.length === 0) return false;
			const firstFn = partSchema.functions[0][0];
			return firstFn === "object" || firstFn === "strictObject";
		}))) return null;
		const mergedProperties = {};
		let allConsts = "";
		for (const partSchema of allOfArgs) {
			if (partSchema.consts.length > 0) allConsts += partSchema.consts.join("\n");
			const objectFunctionIndex = partSchema.functions.findIndex(([fnName]) => fnName === "object" || fnName === "strictObject");
			if (objectFunctionIndex !== -1) {
				const objectArgs = partSchema.functions[objectFunctionIndex][1];
				if (isObject(objectArgs)) Object.assign(mergedProperties, objectArgs);
			}
		}
		if (allConsts.length > 0) appendConstsChunk(allConsts);
		const mergedObjectString = `zod.${getObjectFunctionName(isZodV4, strict)}({
${Object.entries(mergedProperties).map(([key, schema]) => {
			const value = schema.functions.map((prop) => parseProperty(prop, [...fieldPath, key])).join("");
			appendConstsChunk(schema.consts.join("\n"));
			return `  ${JSON.stringify(key)}: ${value.startsWith(".") ? "zod" : ""}${value}`;
		}).join(",\n")}
})`;
		if (strict && !isZodV4) return `${mergedObjectString}.strict()`;
		return mergedObjectString;
	}
	const renderDiscriminatedUnionMember = (member, fieldPath) => {
		if (member.functions[0]?.[0] === "allOf") {
			const merged = mergeAllOfObjectsClassic(member.functions[0][1], fieldPath);
			if (merged !== null) return merged;
		}
		appendConstsChunk(member.consts.join("\n"));
		const value = member.functions.map((prop) => parseProperty(prop, fieldPath)).join("");
		return `${value.startsWith(".") ? "zod" : ""}${value}`;
	};
	const parseProperty = (property, fieldPath = []) => {
		const [fn, args = ""] = property;
		if (fn === "namedRef") {
			const refArgs = args;
			usedRefs.add(refArgs.name);
			return `__REF_${refArgs.name}__`;
		}
		if (fn === "meta") {
			const metaArgs = args;
			const parts = [`id: '${jsStringEscape(metaArgs.id)}'`];
			if (metaArgs.description !== void 0) parts.push(`description: '${jsStringEscape(metaArgs.description)}'`);
			if (metaArgs.deprecated) parts.push("deprecated: true");
			return `.meta({ ${parts.join(", ")} })`;
		}
		if (fn === "fileOrString") return "zod.instanceof(File).or(zod.string())";
		if (fn === "allOf") {
			const allOfArgs = args;
			if (strict) {
				const merged = mergeAllOfObjectsClassic(allOfArgs, fieldPath);
				if (merged !== null) return merged;
			}
			let acc = "";
			for (const partSchema of allOfArgs) {
				const value = partSchema.functions.map((prop) => parseProperty(prop, fieldPath)).join("");
				const valueWithZod = `${value.startsWith(".") ? "zod" : ""}${value}`;
				if (partSchema.consts.length > 0) appendConstsChunk(partSchema.consts.join("\n"));
				if (acc.length === 0) acc = valueWithZod;
				else acc += `.and(${valueWithZod})`;
			}
			return acc;
		}
		const discriminator = decodeDiscriminatorSeparator(fn);
		if (discriminator || fn === "oneOf" || fn === "anyOf") {
			const unionArgs = args;
			if (unionArgs.length === 1) {
				appendConstsChunk(unionArgs[0].consts.join("\n"));
				return unionArgs[0].functions.map((prop) => parseProperty(prop, fieldPath)).join("");
			}
			if (discriminator) {
				const members = unionArgs.map((member) => renderDiscriminatedUnionMember(member, fieldPath));
				return `.discriminatedUnion('${jsStringEscape(discriminator.property)}', [${members.join(",")}])`;
			}
			return `.union([${unionArgs.map(({ functions, consts: argConsts }) => {
				const value = functions.map((prop) => parseProperty(prop, fieldPath)).join("");
				const valueWithZod = `${value.startsWith(".") ? "zod" : ""}${value}`;
				appendConstsChunk(argConsts.join("\n"));
				return valueWithZod;
			}).join(",")}])`;
		}
		if (fn === "additionalProperties") {
			const additionalPropertiesArgs = args;
			const value = additionalPropertiesArgs.functions.map((prop) => parseProperty(prop, fieldPath)).join("");
			const valueWithZod = `${value.startsWith(".") ? "zod" : ""}${value}`;
			if (Array.isArray(additionalPropertiesArgs.consts)) appendConstsChunk(additionalPropertiesArgs.consts.join("\n"));
			return `zod.record(zod.string(), ${valueWithZod})`;
		}
		if (fn === "object" || fn === "strictObject" || fn === "looseObject") {
			const objectArgs = args;
			const parsedObject = `zod.${fn === "looseObject" ? isZodV4 ? "looseObject" : "object" : getObjectFunctionName(isZodV4, strict)}({
${Object.entries(objectArgs).map(([key, schema]) => {
				const value = schema.functions.map((prop) => parseProperty(prop, [...fieldPath, key])).join("");
				appendConstsChunk(schema.consts.join("\n"));
				const fieldZod = `${value.startsWith(".") ? "zod" : ""}${value}`;
				if (Array.isArray(coerceTypes) && coerceTypes.includes("array") && schema.functions.some(([fn]) => fn === "array")) return `  ${JSON.stringify(key)}: zod.preprocess((value) => value === undefined || Array.isArray(value) ? value : [value], ${fieldZod})`;
				return `  ${JSON.stringify(key)}: ${fieldZod}`;
			}).join(",\n")}
})`;
			if (fn === "looseObject" && !isZodV4) return `${parsedObject}.passthrough()`;
			return parsedObject;
		}
		if (fn === "passthrough") return ".passthrough()";
		if (fn === "array") {
			const arrayArgs = args;
			const value = arrayArgs.functions.map((prop) => parseProperty(prop, fieldPath)).join("");
			if (isString(arrayArgs.consts)) appendConstsChunk(arrayArgs.consts);
			else if (Array.isArray(arrayArgs.consts)) appendConstsChunk(arrayArgs.consts.join("\n"));
			return `.array(${value.startsWith(".") ? "zod" : ""}${value})`;
		}
		if (fn === "strict" && !isZodV4) return ".strict()";
		if (fn === "tuple") return `zod.tuple([${args.map((x) => {
			const value = x.functions.map((prop) => parseProperty(prop, fieldPath)).join("");
			return `${value.startsWith(".") ? "zod" : ""}${value}`;
		}).join(",\n")}])`;
		if (fn === "rest") return `.rest(zod${args.functions.map((prop) => parseProperty(prop, fieldPath)).join("")})`;
		const shouldCoerceType = coerceTypes && (Array.isArray(coerceTypes) ? coerceTypes.includes(fn) : COERCIBLE_TYPES.has(fn));
		const formattedArgs = formatFunctionArgs(args);
		const paramsArg = buildParamsArg(fn, fieldPath);
		let combinedArgs;
		if (paramsArg && formattedArgs && PARAMS_MERGE_INTO_OPTIONS_VALIDATORS.has(fn)) combinedArgs = `{ ...${formattedArgs}, ...${paramsArg} }`;
		else if (paramsArg) combinedArgs = formattedArgs ? `${formattedArgs}, ${paramsArg}` : paramsArg;
		else combinedArgs = formattedArgs;
		if (fn === "int") {
			const numberArgs = buildCombinedArgs("number", void 0, fieldPath);
			if (shouldCoerce("number")) return `.coerce.number(${numberArgs}).int(${combinedArgs})`;
			if (!isZodV4) return `.number(${numberArgs}).int(${combinedArgs})`;
		}
		if (fn !== "date" && shouldCoerceType || fn === "date" && shouldCoerceType && context.output.override.useDates) return `.coerce.${fn}(${combinedArgs})`;
		if (exactOptional && isZodV4 && fn === "optional") return ".exactOptional()";
		return `.${fn}(${combinedArgs})`;
	};
	appendConstsChunk(input.consts.join("\n"));
	if (variant === "mini") {
		const rendered = renderMiniDefinition(input);
		const value = preprocess ? zodMiniCall("pipe", `${zodMiniCall("transform", preprocess.name)}, ${rendered.expr}`) : rendered.expr;
		if (consts.includes(",export")) consts = consts.replaceAll(",export", "\nexport");
		return {
			zod: value,
			consts,
			usedRefs
		};
	}
	const schema = input.functions.map((prop) => parseProperty(prop)).join("");
	const value = preprocess ? `.preprocess(${preprocess.name}, ${schema.startsWith(".") ? "zod" : ""}${schema})` : schema;
	const zod = `${value.startsWith(".") ? "zod" : ""}${value}`;
	if (consts.includes(",export")) consts = consts.replaceAll(",export", "\nexport");
	return {
		zod,
		consts,
		usedRefs
	};
};
const dereferenceScalar = (value, context) => {
	if (isObject(value)) return dereference(value, context);
	else if (Array.isArray(value)) return value.map((item) => dereferenceScalar(item, context));
	else return value;
};
/**
* Attempts to resolve a `$ref` to its target schema. Returns `undefined`
* instead of throwing when the ref cannot be found (e.g. external refs
* not yet bundled). Logs a verbose warning on failure to aid debugging.
*/
function tryResolveRefSchema($ref, context) {
	try {
		return resolveRef({ $ref }, context).schema;
	} catch (error) {
		logVerbose(`[orval/zod] Failed to resolve $ref "${$ref}":`, error instanceof Error ? error.message : error);
		return;
	}
}
const COMPONENT_SCHEMAS_PREFIX = "#/components/schemas/";
function extractSchemaNameFromRef($ref) {
	if (!$ref.startsWith(COMPONENT_SCHEMAS_PREFIX)) return void 0;
	const raw = $ref.slice(21);
	return decodeURIComponent(raw.replaceAll("~1", "/").replaceAll("~0", "~"));
}
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
const dereference = (schema, context) => {
	const refName = "$ref" in schema ? schema.$ref : void 0;
	if (refName && context.parents?.includes(refName)) return {};
	if (isDynamicReference(schema)) return dereferenceDynamicRef(schema, context);
	const childContext = {
		...context,
		...refName ? { parents: [...context.parents ?? [], refName] } : void 0
	};
	const resolvedSchema = "$ref" in schema ? (() => {
		const referencedSchema = tryResolveRefSchema(schema.$ref, context);
		if (!referencedSchema || !isObject(referencedSchema)) return;
		const siblingProperties = Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$ref"));
		return {
			...referencedSchema,
			...siblingProperties
		};
	})() : schema;
	if (!resolvedSchema) return {};
	const resolvedContext = buildScopedContext(childContext, refName, resolvedSchema);
	if (isDynamicReference(resolvedSchema)) return dereferenceDynamicRef(resolvedSchema, resolvedContext);
	return dereferenceProperties(resolvedSchema, resolvedContext);
};
function dereferenceProperties(schema, context) {
	return Object.entries(schema).reduce((acc, [key, value]) => {
		if (key === "properties" && isObject(value)) acc[key] = Object.entries(value).reduce((props, [propKey, propSchema]) => {
			props[propKey] = dereference(propSchema, context);
			return props;
		}, {});
		else if (key === "default" || key === "example" || key === "examples") acc[key] = value;
		else acc[key] = dereferenceScalar(value, context);
		return acc;
	}, {});
}
function buildScopedContext(childContext, refName, resolvedSchema) {
	if (refName) {
		const schemaName = extractSchemaNameFromRef(refName);
		if (!schemaName) return childContext;
		const schemaRecord = resolvedSchema;
		const hasDynamicAnchor = typeof schemaRecord.$dynamicAnchor === "string";
		const defs = schemaRecord.$defs;
		const hasDefsAnchors = defs && typeof defs === "object" && Object.values(defs).some((d) => d && typeof d === "object" && "$dynamicAnchor" in d);
		if (!hasDynamicAnchor && !hasDefsAnchors) return childContext;
		return {
			...childContext,
			dynamicScope: buildDynamicScope(schemaName, resolvedSchema, childContext)
		};
	}
	const inlineScope = buildInlineDynamicScope(resolvedSchema);
	if (Object.keys(inlineScope).length === 0) return childContext;
	return {
		...childContext,
		dynamicScope: {
			...childContext.dynamicScope,
			...inlineScope
		}
	};
}
function dereferenceDynamicRef(schema, context) {
	const dynamicRef = schema.$dynamicRef;
	const anchorName = getDynamicAnchorName(dynamicRef);
	if (!anchorName) return {};
	const { resolvedTypeName, schema: resolvedSchema, schemaName } = resolveDynamicRef(anchorName, context);
	const dynamicRefPath = `$dynamicRef:${dynamicRef}@${schemaName ?? "?"}`;
	if (context.parents?.includes(dynamicRefPath)) return {};
	if (resolvedTypeName === "unknown" || !isObject(resolvedSchema)) return {};
	const scopedContext = buildScopedContext({
		...context,
		parents: [...context.parents ?? [], dynamicRefPath]
	}, schemaName ? `${COMPONENT_SCHEMAS_PREFIX}${encodeSegment(schemaName)}` : void 0, resolvedSchema);
	const siblingProperties = Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$dynamicRef"));
	return dereferenceProperties({
		...resolvedSchema,
		...siblingProperties
	}, scopedContext);
}
function encodeSegment(segment) {
	return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
/**
* Generate zod schema for form-data request body.
* Handles file type detection for top-level properties based on encoding.contentType
* and contentMediaType. Mirrors type gen's resolveFormDataRootObject.
*/
const generateFormDataZodSchema = (schema, context, name, strict, isZodV4, encoding, useReusableSchemas) => {
	const propertyOverrides = {};
	if (schema.properties) for (const key of Object.keys(schema.properties)) {
		const propSchema = schema.properties[key];
		const resolvedPropSchema = propSchema ? dereference(propSchema, context) : void 0;
		const fileType = resolvedPropSchema ? getFormDataFieldFileType(resolvedPropSchema, encoding?.[key]?.contentType) : void 0;
		if (fileType) {
			const isRequired = schema.required?.includes(key);
			const fileFunctions = [fileType === "binary" ? ["instanceof", "File"] : ["fileOrString", void 0]];
			if (!isRequired) fileFunctions.push(["optional", void 0]);
			propertyOverrides[key] = {
				functions: fileFunctions,
				consts: []
			};
		}
	}
	return generateZodValidationSchemaDefinition(schema, context, name, strict, isZodV4, {
		required: true,
		propertyOverrides: Object.keys(propertyOverrides).length > 0 ? propertyOverrides : void 0,
		useReusableSchemas
	});
};
/**
* Parse a request body or response into a zod validation schema definition.
*
* Selects the relevant content type — JSON (and `+json` vendor types),
* `multipart/form-data`, or `application/x-www-form-urlencoded`, plus
* `text/plain` for responses — and generates the matching schema, handling
* array roots. The url-encoded string-contract rationale lives where the flag
* is derived (see `isFormUrlEncoded` below).
*/
const parseBodyAndResponse = ({ data, context, name, strict, generate, isZodV4, parseType, useReusableSchemas }) => {
	if (!data || !generate) return {
		input: {
			functions: [],
			consts: []
		},
		isArray: false
	};
	const resolvedRef = resolveRef(data, context).schema;
	const contentEntries = Object.entries(resolvedRef.content ?? {});
	const jsonContent = contentEntries.find(isMediaType(String.raw`^application\/([^/;]+\+)?json$`));
	const formDataContent = contentEntries.find(isMediaType(String.raw`^multipart\/form-data$`));
	const formUrlEncodedContent = contentEntries.find(isMediaType(String.raw`^application\/x-www-form-urlencoded$`));
	const [contentType, mediaType] = jsonContent ? ["application/json", jsonContent[1]] : formDataContent ? ["multipart/form-data", formDataContent[1]] : formUrlEncodedContent ? ["application/x-www-form-urlencoded", formUrlEncodedContent[1]] : [void 0, void 0];
	const isFormUrlEncoded = contentType === "application/x-www-form-urlencoded";
	const schema = mediaType?.schema;
	if (!schema) {
		if (parseType === "response") {
			if (contentEntries.find(isMediaType(String.raw`^text\/plain$`))) return {
				input: {
					functions: [["string", void 0]],
					consts: []
				},
				isArray: false
			};
		}
		return {
			input: {
				functions: [],
				consts: []
			},
			isArray: false
		};
	}
	const encoding = mediaType.encoding;
	const resolvedJsonSchema = dereference(schema, context);
	if (resolvedJsonSchema.items) {
		const min = resolvedJsonSchema.minimum ?? resolvedJsonSchema.minLength ?? resolvedJsonSchema.minItems;
		const max = resolvedJsonSchema.maximum ?? resolvedJsonSchema.maxLength ?? resolvedJsonSchema.maxItems;
		const rawItems = useReusableSchemas ? (() => {
			return resolveRef(schema, context).schema.items ?? resolvedJsonSchema.items;
		})() : resolvedJsonSchema.items;
		return {
			input: generateZodValidationSchemaDefinition(parseType === "body" ? removeReadOnlyProperties(rawItems) : rawItems, context, name, strict, isZodV4, {
				required: true,
				useReusableSchemas,
				urlEncoded: isFormUrlEncoded
			}),
			isArray: true,
			rules: {
				...min === void 0 ? {} : { min },
				...max === void 0 ? {} : { max }
			}
		};
	}
	const effectiveSchema = useReusableSchemas ? parseType === "body" ? removeReadOnlyProperties(schema) : schema : parseType === "body" ? removeReadOnlyProperties(resolvedJsonSchema) : resolvedJsonSchema;
	return {
		input: contentType === "multipart/form-data" ? generateFormDataZodSchema(effectiveSchema, context, name, strict, isZodV4, encoding, useReusableSchemas) : generateZodValidationSchemaDefinition(effectiveSchema, context, name, strict, isZodV4, {
			required: true,
			useReusableSchemas,
			urlEncoded: isFormUrlEncoded
		}),
		isArray: false
	};
};
const isMediaType = (pattern) => ([contentType]) => new RegExp(pattern).test(contentType.split(";")[0].trim().toLowerCase());
const getSingleResponse = (responses) => {
	if (!responses) return;
	const otherSuccess = Object.entries(responses).find(([code]) => code.startsWith("2") && code !== "204" && code !== "205")?.[1];
	return responses["200"] ?? responses["2XX"] ?? responses["2xx"] ?? otherSuccess ?? responses["204"] ?? responses["205"];
};
const parseParameters = ({ data, context, operationName, isZodV4, strict, generate, useReusableSchemas }) => {
	if (!data) return {
		headers: {
			functions: [],
			consts: []
		},
		queryParams: {
			functions: [],
			consts: []
		},
		params: {
			functions: [],
			consts: []
		}
	};
	const defintionsByParameters = data.reduce((acc, val) => {
		const { schema: parameter } = resolveRef(val, context);
		if (!parameter.schema) return acc;
		if (!parameter.in || !parameter.name) return acc;
		const schemaForGen = useReusableSchemas ? parameter.description ? Object.assign({}, parameter.schema, { description: parameter.description }) : parameter.schema : (() => {
			const s = dereference(parameter.schema, context);
			s.description = parameter.description;
			return s;
		})();
		const mapStrict = {
			path: strict.param,
			query: strict.query,
			header: strict.header
		};
		const mapGenerate = {
			path: generate.param,
			query: generate.query,
			header: generate.header
		};
		if (parameter.in !== "path" && parameter.in !== "query" && parameter.in !== "header") return acc;
		const definition = generateZodValidationSchemaDefinition(schemaForGen, context, camel(`${operationName}-${parameter.in}-${parameter.name}`), mapStrict[parameter.in], isZodV4, {
			required: parameter.required,
			useReusableSchemas
		});
		if (parameter.in === "header" && mapGenerate.header) return {
			...acc,
			headers: {
				...acc.headers,
				[parameter.name]: definition
			}
		};
		if (parameter.in === "query" && mapGenerate.query) return {
			...acc,
			queryParams: {
				...acc.queryParams,
				[parameter.name]: definition
			}
		};
		if (parameter.in === "path" && mapGenerate.path) return {
			...acc,
			params: {
				...acc.params,
				[parameter.name]: definition
			}
		};
		return acc;
	}, {
		headers: {},
		queryParams: {},
		params: {}
	});
	const headers = {
		functions: [],
		consts: []
	};
	if (Object.keys(defintionsByParameters.headers).length > 0) {
		const parameterFunctions = getParameterFunctions(isZodV4, strict.header, defintionsByParameters.headers);
		headers.functions.push(...parameterFunctions);
	}
	const queryParams = {
		functions: [],
		consts: []
	};
	if (Object.keys(defintionsByParameters.queryParams).length > 0) {
		const parameterFunctions = getParameterFunctions(isZodV4, strict.query, defintionsByParameters.queryParams);
		queryParams.functions.push(...parameterFunctions);
	}
	const params = {
		functions: [],
		consts: []
	};
	if (Object.keys(defintionsByParameters.params).length > 0) {
		const parameterFunctions = getParameterFunctions(isZodV4, strict.param, defintionsByParameters.params);
		params.functions.push(...parameterFunctions);
	}
	return {
		headers,
		queryParams,
		params
	};
};
const generateZodRoute = async ({ operationId, operationName, typeName, verb, override }, { pathRoute, context, output }) => {
	const zodVariant = context.output.override.zod.variant;
	const isZodV4 = resolveIsZodV4(context.output.override.zod.version, context.output.packageJson);
	assertZodTarget({
		variant: zodVariant,
		isZodV4
	});
	const useReusableSchemas = context.output.override.zod.generateReusableSchemas;
	const spec = context.spec.paths?.[pathRoute];
	if (spec == void 0) throw new Error(`No such path ${pathRoute} in ${context.projectName}`);
	const parsedParameters = parseParameters({
		data: [...spec.parameters ?? [], ...spec[verb]?.parameters ?? []],
		context,
		operationName,
		isZodV4,
		strict: override.zod.strict,
		generate: override.zod.generate,
		useReusableSchemas
	});
	const requestBody = spec[verb]?.requestBody;
	const parsedBody = parseBodyAndResponse({
		data: requestBody,
		context,
		name: camel(`${operationName}-body`),
		strict: override.zod.strict.body,
		generate: override.zod.generate.body,
		isZodV4,
		parseType: "body",
		useReusableSchemas
	});
	const responses = context.output.override.zod.generateEachHttpStatus ? Object.entries(spec[verb]?.responses ?? {}) : [["", getSingleResponse(spec[verb]?.responses)]];
	const parsedResponses = responses.map(([code, response]) => parseBodyAndResponse({
		data: response,
		context,
		name: camel(`${operationName}-${code}-response`),
		strict: override.zod.strict.response,
		generate: override.zod.generate.response,
		isZodV4,
		parseType: "response",
		useReusableSchemas
	}));
	const preprocessParams = override.zod.preprocess?.param ? await generateMutator({
		output,
		mutator: override.zod.preprocess.param,
		name: `${operationName}PreprocessParams`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	const paramsMutator = override.zod.params ? await generateMutator({
		output,
		mutator: override.zod.params,
		name: `${operationName}ZodParams`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	const pascalTypeName = pascal(typeName);
	const makeParamsInjection = (location, schemaSuffix) => paramsMutator ? {
		mutator: paramsMutator,
		operationId,
		location,
		schemaName: `${pascalTypeName}${schemaSuffix}`
	} : void 0;
	let inputParams = parseZodValidationSchemaDefinition(parsedParameters.params, context, override.zod.coerce.param, override.zod.strict.param, isZodV4, preprocessParams, makeParamsInjection("param", "Params"), zodVariant, override.zod.exactOptional);
	const preprocessQueryParams = override.zod.preprocess?.query ? await generateMutator({
		output,
		mutator: override.zod.preprocess.query,
		name: `${operationName}PreprocessQueryParams`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	let inputQueryParams = parseZodValidationSchemaDefinition(parsedParameters.queryParams, context, override.zod.coerce.query, override.zod.strict.query, isZodV4, preprocessQueryParams, makeParamsInjection("query", "QueryParams"), zodVariant, override.zod.exactOptional);
	const preprocessHeader = override.zod.preprocess?.header ? await generateMutator({
		output,
		mutator: override.zod.preprocess.header,
		name: `${operationName}PreprocessHeader`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	let inputHeaders = parseZodValidationSchemaDefinition(parsedParameters.headers, context, override.zod.coerce.header, override.zod.strict.header, isZodV4, preprocessHeader, makeParamsInjection("header", "Header"), zodVariant, override.zod.exactOptional);
	const preprocessBody = override.zod.preprocess?.body ? await generateMutator({
		output,
		mutator: override.zod.preprocess.body,
		name: `${operationName}PreprocessBody`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	let inputBody = parseZodValidationSchemaDefinition(parsedBody.input, context, override.zod.coerce.body, override.zod.strict.body, isZodV4, preprocessBody, makeParamsInjection("body", "Body"), zodVariant, override.zod.exactOptional);
	const preprocessResponse = override.zod.preprocess?.response ? await generateMutator({
		output,
		mutator: override.zod.preprocess.response,
		name: `${operationName}PreprocessResponse`,
		workspace: context.workspace,
		tsconfig: context.output.tsconfig
	}) : void 0;
	const inputResponses = parsedResponses.map((parsedResponse, index) => parseZodValidationSchemaDefinition(parsedResponse.input, context, override.zod.coerce.response, override.zod.strict.response, isZodV4, preprocessResponse, makeParamsInjection("response", responses[index][0] ? `${responses[index][0]}Response` : "Response"), zodVariant, override.zod.exactOptional));
	const SENTINEL_PATTERN = /__REF_([A-Za-z_$][A-Za-z0-9_$]*)__/g;
	const rewriteSentinels = (s) => s.replaceAll(SENTINEL_PATTERN, (_m, name) => name);
	const allUsedRefs = new Set([
		...inputParams.usedRefs,
		...inputQueryParams.usedRefs,
		...inputHeaders.usedRefs,
		...inputBody.usedRefs,
		...inputResponses.flatMap((r) => [...r.usedRefs])
	]);
	if (useReusableSchemas && allUsedRefs.size > 0) {
		inputParams = {
			...inputParams,
			zod: rewriteSentinels(inputParams.zod)
		};
		inputQueryParams = {
			...inputQueryParams,
			zod: rewriteSentinels(inputQueryParams.zod)
		};
		inputHeaders = {
			...inputHeaders,
			zod: rewriteSentinels(inputHeaders.zod)
		};
		inputBody = {
			...inputBody,
			zod: rewriteSentinels(inputBody.zod)
		};
		for (let i = 0; i < inputResponses.length; i++) inputResponses[i] = {
			...inputResponses[i],
			zod: rewriteSentinels(inputResponses[i].zod)
		};
	}
	if (!inputParams.zod && !inputQueryParams.zod && !inputHeaders.zod && !inputBody.zod && responses.length === 0) return {
		implementation: "",
		mutators: [],
		usedRefs: /* @__PURE__ */ new Set()
	};
	const useBrandedTypes = override.zod.useBrandedTypes;
	const brand = (name) => useBrandedTypes ? isZodV4 ? `.brand("${name}")` : `.brand<"${name}">()` : "";
	const zodArrayWithBounds = (itemName, rules) => {
		const checks = [...rules?.min ? [zodMiniCall("minLength", `${rules.min}`)] : [], ...rules?.max ? [zodMiniCall("maxLength", `${rules.max}`)] : []];
		if (zodVariant === "mini") return `${zodMiniCall("array", itemName)}${checks.map((check) => `.check(${check})`).join("")}`;
		return `zod.array(${itemName})${rules?.min ? `.min(${rules.min})` : ""}${rules?.max ? `.max(${rules.max})` : ""}`;
	};
	const localTaken = new Set(allUsedRefs);
	const allocateExportName = (baseName, hasItem) => {
		const collides = (name) => localTaken.has(name) || hasItem && localTaken.has(`${name}Item`);
		const reserve = (name) => {
			localTaken.add(name);
			if (hasItem) localTaken.add(`${name}Item`);
		};
		if (!collides(baseName)) {
			reserve(baseName);
			return baseName;
		}
		let counter = 0;
		let candidate = `${baseName}Schema`;
		while (collides(candidate)) {
			counter += 1;
			candidate = `${baseName}Schema${counter}`;
		}
		reserve(candidate);
		return candidate;
	};
	const paramsName = allocateExportName(`${pascalTypeName}Params`, false);
	const queryParamsName = allocateExportName(`${pascalTypeName}QueryParams`, false);
	const headerName = allocateExportName(`${pascalTypeName}Header`, false);
	const bodyName = allocateExportName(`${pascalTypeName}Body`, parsedBody.isArray);
	return {
		implementation: [
			...inputParams.consts ? [inputParams.consts] : [],
			...inputParams.zod ? [`export const ${paramsName} = ${inputParams.zod}${brand(paramsName)}`] : [],
			...inputQueryParams.consts ? [inputQueryParams.consts] : [],
			...inputQueryParams.zod ? [`export const ${queryParamsName} = ${inputQueryParams.zod}${brand(queryParamsName)}`] : [],
			...inputHeaders.consts ? [inputHeaders.consts] : [],
			...inputHeaders.zod ? [`export const ${headerName} = ${inputHeaders.zod}${brand(headerName)}`] : [],
			...inputBody.consts ? [inputBody.consts] : [],
			...inputBody.zod ? [parsedBody.isArray ? `export const ${bodyName}Item = ${inputBody.zod}
export const ${bodyName} = ${zodArrayWithBounds(bodyName + "Item", parsedBody.rules)}${brand(bodyName)}` : `export const ${bodyName} = ${inputBody.zod}${brand(bodyName)}`] : [],
			...inputResponses.flatMap((inputResponse, index) => {
				const operationResponse = allocateExportName(pascal(`${typeName}-${responses[index][0]}-response`), parsedResponses[index].isArray);
				if (!inputResponse.zod) {
					if (!override.zod.generate.response) return [];
					const noContentStatusCodes = new Set(["204", "205"]);
					const statusCode = responses[index][0];
					const isEachHttpStatusMode = !!statusCode;
					let isNoContent;
					if (isEachHttpStatusMode) isNoContent = noContentStatusCodes.has(statusCode);
					else {
						const specResponseKeys = new Set(Object.keys(spec[verb]?.responses ?? {}));
						isNoContent = !(specResponseKeys.has("200") || specResponseKeys.has("2XX") || specResponseKeys.has("2xx"));
					}
					return [`export const ${operationResponse} = ${isNoContent ? zodVariant === "mini" ? zodMiniCall("void") : "zod.void()" : zodVariant === "mini" ? zodMiniCall("unknown") : "zod.unknown()"}${brand(operationResponse)}`];
				}
				return [...inputResponse.consts ? [inputResponse.consts] : [], parsedResponses[index].isArray ? `export const ${operationResponse}Item = ${inputResponse.zod}
export const ${operationResponse} = ${zodArrayWithBounds(`${operationResponse}Item`, parsedResponses[index].rules)}${brand(operationResponse)}` : `export const ${operationResponse} = ${inputResponse.zod}${brand(operationResponse)}`];
			})
		].join("\n\n"),
		mutators: [
			...preprocessParams && inputParams.zod ? [preprocessParams] : [],
			...preprocessQueryParams && inputQueryParams.zod ? [preprocessQueryParams] : [],
			...preprocessHeader && inputHeaders.zod ? [preprocessHeader] : [],
			...preprocessBody && inputBody.zod ? [preprocessBody] : [],
			...preprocessResponse ? [preprocessResponse] : [],
			...paramsMutator ? [paramsMutator] : []
		],
		usedRefs: useReusableSchemas ? allUsedRefs : /* @__PURE__ */ new Set()
	};
};
const generateZod = async (verbOptions, options) => {
	const { implementation, mutators, usedRefs } = await generateZodRoute(verbOptions, options);
	return {
		implementation: implementation ? `${implementation}\n\n` : "",
		imports: [...usedRefs].toSorted().map((name) => ({
			name,
			schemaName: name,
			values: true
		})),
		mutators
	};
};
const zodClientBuilder = {
	client: generateZod,
	dependencies: getZodDependencies
};
const builder = () => () => zodClientBuilder;
//#endregion
export { assertZodTarget, builder, builder as default, dereference, generateFormDataZodSchema, generateZod, generateZodValidationSchemaDefinition, getZodDependencies, getZodImportSource, getZodTypeName, isZodVersionV4, parseParameters, parseZodValidationSchemaDefinition, predefinedZodFormats, resolveIsZodV4 };

//# sourceMappingURL=index.mjs.map