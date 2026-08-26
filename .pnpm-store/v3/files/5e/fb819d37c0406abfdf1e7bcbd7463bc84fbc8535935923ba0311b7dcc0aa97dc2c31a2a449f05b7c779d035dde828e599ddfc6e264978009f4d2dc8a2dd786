import { t as __exportAll } from "./chunk-8H4AJuhK.mjs";
import { createRequire } from "node:module";
import { entries, groupBy, isArray, isBoolean, isBoolean as isBoolean$1, isEmptyish, isFunction, isFunction as isFunction$1, isNullish, isNullish as isNullish$1, isNumber, isString, isString as isString$1, prop, unique, uniqueBy, uniqueWith } from "remeda";
import { keyword } from "esutils";
import nodePath from "node:path";
import { compare } from "compare-versions";
import debug from "debug";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import fs, { existsSync, readFileSync } from "node:fs";
import { glob } from "tinyglobby";
import readline from "node:readline";
import { styleText } from "node:util";
import { isDereferenced } from "@scalar/openapi-types/helpers";
import jsesc from "jsesc";
import fs$1 from "fs-extra";
import { Parser } from "acorn";
import { build } from "esbuild";
//#region src/types.ts
const SupportedFormatter = {
	PRETTIER: "prettier",
	BIOME: "biome",
	OXFMT: "oxfmt"
};
const PropertySortOrder = {
	ALPHABETICAL: "Alphabetical",
	SPECIFICATION: "Specification"
};
const NamingConvention = {
	CAMEL_CASE: "camelCase",
	PASCAL_CASE: "PascalCase",
	SNAKE_CASE: "snake_case",
	KEBAB_CASE: "kebab-case"
};
const EnumGeneration = {
	CONST: "const",
	ENUM: "enum",
	UNION: "union"
};
const OutputClient = {
	ANGULAR: "angular",
	ANGULAR_QUERY: "angular-query",
	AXIOS: "axios",
	AXIOS_FUNCTIONS: "axios-functions",
	REACT_QUERY: "react-query",
	SOLID_START: "solid-start",
	SOLID_QUERY: "solid-query",
	SVELTE_QUERY: "svelte-query",
	VUE_QUERY: "vue-query",
	SWR: "swr",
	ZOD: "zod",
	EFFECT: "effect",
	HONO: "hono",
	FETCH: "fetch",
	MCP: "mcp"
};
const OutputHttpClient = {
	AXIOS: "axios",
	FETCH: "fetch",
	ANGULAR: "angular"
};
const OutputMode = {
	SINGLE: "single",
	SPLIT: "split",
	TAGS: "tags",
	TAGS_SPLIT: "tags-split",
	TAGS_OPERATIONS: "tags-operations",
	TAGS_OPERATIONS_SPLIT: "tags-operations-split"
};
const OutputMockType = {
	MSW: "msw",
	FAKER: "faker"
};
const FormDataArrayHandling = {
	SERIALIZE: "serialize",
	EXPLODE: "explode",
	SERIALIZE_WITH_BRACKETS: "serialize-with-brackets"
};
const Verbs = {
	GET: "get",
	PUT: "put",
	POST: "post",
	DELETE: "delete",
	OPTIONS: "options",
	HEAD: "head",
	PATCH: "patch"
};
/**
* Canonical tag name used for the generated bucket that collects untagged operations.
*/
const DefaultTag = "default";
const GetterPropType = {
	PARAM: "param",
	NAMED_PATH_PARAMS: "namedPathParams",
	BODY: "body",
	QUERY_PARAM: "queryParam",
	HEADER: "header"
};
const SchemaType = {
	integer: "integer",
	number: "number",
	string: "string",
	boolean: "boolean",
	object: "object",
	null: "null",
	array: "array",
	enum: "enum",
	unknown: "unknown"
};
var ErrorWithTag = class extends Error {
	tag;
	constructor(message, tag, options) {
		super(message, options);
		this.tag = tag;
	}
};
//#endregion
//#region src/constants.ts
const generalJSTypes = [
	"number",
	"string",
	"null",
	"unknown",
	"undefined",
	"object",
	"blob"
];
const generalJSTypesWithArray = generalJSTypes.flatMap((type) => [
	type,
	`Array<${type}>`,
	`${type}[]`
]);
const VERBS_WITH_BODY = [
	Verbs.POST,
	Verbs.PUT,
	Verbs.PATCH,
	Verbs.DELETE
];
const URL_REGEX = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;
const TEMPLATE_TAG_REGEX = /\${(.+?)}/g;
//#endregion
//#region src/utils/assertion.ts
/**
* Type guard for an OpenAPI {@link OpenApiReferenceObject}.
*
* Returns `true` when `obj` has a `$ref` property, indicating a static
* JSON Pointer reference rather than an inline schema.
*
* @param obj - Value to test.
*/
function isReference(obj) {
	return !isNullish$1(obj) && Object.hasOwn(obj, "$ref");
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
function isDynamicReference(obj) {
	return !isNullish$1(obj) && Object.hasOwn(obj, "$dynamicRef") && typeof obj.$dynamicRef === "string";
}
/**
* Returns `true` when `pathValue` has no file extension and is treated as a
* directory path.
*
* @param pathValue - Path string to inspect.
*/
function isDirectory(pathValue) {
	return !nodePath.extname(pathValue);
}
/**
* Type guard for plain objects created with `{}` or `new Object()`.
*
* Excludes `null`, arrays, dates, and other non-plain object values.
*
* @param x - Value to test.
*/
function isObject(x) {
	return Object.prototype.toString.call(x) === "[object Object]";
}
/**
* Type guard for string primitives and `String` wrapper objects.
*
* @param val - Value to test.
*/
function isStringLike(val) {
	if (isString$1(val)) return true;
	return Object.prototype.toString.call(val) === "[object String]";
}
/**
* Type guard for ES module namespace objects.
*
* @param x - Value to test.
*/
function isModule(x) {
	return Object.prototype.toString.call(x) === "[object Module]";
}
/**
* Type guard for integer numbers and numeric strings.
*
* Accepts finite integers (`42`) and strings that match `/^-?\d+$/`
* (`"-1"`, `"0"`). Rejects floats, empty strings, and non-numeric values.
*
* @param x - Value to test.
*/
function isNumeric(x) {
	if (typeof x === "number") return Number.isInteger(x);
	return isString$1(x) && /^-?\d+$/.test(x);
}
/**
* Type guard for an inline OpenAPI {@link OpenApiSchemaObject}.
*
* Returns `true` when `x` looks like a schema definition: it has a known
* `type`, composition keywords (`allOf`, `anyOf`, `oneOf`), or `properties`.
* Does not match reference objects; use {@link isReference} for those.
*
* @param x - Value to test.
*/
function isSchema(x) {
	if (!isObject(x)) return false;
	if (isString$1(x.type) && Object.values(SchemaType).includes(x.type)) return true;
	const combine = x.allOf ?? x.anyOf ?? x.oneOf;
	if (Array.isArray(combine)) return true;
	if (isObject(x.properties)) return true;
	return false;
}
/**
* Type guard for HTTP methods defined in {@link Verbs}.
*
* @param verb - Method name to test (for example, `"get"`, `"post"`).
*/
function isVerb(verb) {
	return Object.values(Verbs).includes(verb);
}
/**
* Returns `true` when `str` is a valid absolute URL with an `http:` or
* `https:` protocol.
*
* Empty or whitespace-only strings are rejected.
*
* @param str - URL string to validate.
*/
function isUrl(str) {
	if (!str.trim()) return false;
	try {
		const url = new URL(str);
		return ["http:", "https:"].includes(url.protocol);
	} catch {
		return false;
	}
}
/**
* Type guard for the MSW mock generator. Use to narrow a
* `GlobalMockOptions | ClientMockBuilder` value to `MswMockOptions`.
*
* @param mock - Mock configuration or builder to test.
*/
function isMswMock(mock) {
	return !isFunction$1(mock) && mock.type === OutputMockType.MSW;
}
/**
* Type guard for the Faker mock generator. Use to narrow a
* `GlobalMockOptions | ClientMockBuilder` value to `FakerMockOptions`.
*
* @param mock - Mock configuration or builder to test.
*/
function isFakerMock(mock) {
	return !isFunction$1(mock) && mock.type === OutputMockType.FAKER;
}
//#endregion
//#region src/utils/async-reduce.ts
async function asyncReduce(array, reducer, initValue) {
	let accumulate = initValue === null || initValue === Object(initValue) && !isFunction(initValue) ? Object.create(initValue) : initValue;
	for (const item of array) accumulate = await reducer(accumulate, item);
	return accumulate;
}
//#endregion
//#region src/utils/case.ts
const unicodes = function(s, prefix = "") {
	return s.replaceAll(/(^|-)/g, String.raw`$1\u` + prefix).replaceAll(",", String.raw`\u` + prefix);
};
const symbols = unicodes("20-26,28-2F,3A-40,5B-60,7B-7E,A0-BF,D7,F7", "00");
const lowers = "a-z" + unicodes("DF-F6,F8-FF", "00");
const uppers = "A-Z" + unicodes("C0-D6,D8-DE", "00");
const impropers = String.raw`A|An|And|As|At|But|By|En|For|If|In|Of|On|Or|The|To|Vs?\.?|Via`;
const regexps = {
	capitalize: new RegExp("(^|[" + symbols + "])([" + lowers + "])", "g"),
	pascal: new RegExp("(^|[" + symbols + "])+([" + lowers + uppers + "])", "g"),
	fill: new RegExp("[" + symbols + "]+(.|$)", "g"),
	sentence: new RegExp(String.raw`(^\s*|[\?\!\.]+"?\s+"?|,\s+")([` + lowers + "])", "g"),
	improper: new RegExp(String.raw`\b(` + impropers + String.raw`)\b`, "g"),
	relax: new RegExp("([^" + uppers + "])([" + uppers + "]*)([" + uppers + "])(?=[^" + uppers + "]|$)", "g"),
	upper: new RegExp("^[^" + lowers + "]+$"),
	hole: /[^\s]\s[^\s]/,
	apostrophe: /'/g,
	room: new RegExp("[" + symbols + "]")
};
const deapostrophe = (s) => {
	return s.replace(regexps.apostrophe, "");
};
const up = (s) => s.toUpperCase();
const low = (s) => s.toLowerCase();
const fill = (s, fillWith, isDeapostrophe = false) => {
	s = s.replace(regexps.fill, function(m, next) {
		return next ? fillWith + next : "";
	});
	if (isDeapostrophe) s = deapostrophe(s);
	return s;
};
const decap = (s, char = 0) => {
	return low(s.charAt(char)) + s.slice(char + 1);
};
const relax = (m, before, acronym, caps) => {
	return before + " " + (acronym ? acronym + " " : "") + caps;
};
const prep = (s, isFill = false, isPascal = false, isUpper = false) => {
	if (!isUpper && regexps.upper.test(s)) s = low(s);
	if (!isFill && !regexps.hole.test(s)) {
		var holey = fill(s, " ");
		if (regexps.hole.test(holey)) s = holey;
	}
	if (!isPascal && !regexps.room.test(s)) s = s.replace(regexps.relax, relax);
	return s;
};
const lower = (s, fillWith, isDeapostrophe) => {
	return fill(low(prep(s, !!fillWith)), fillWith, isDeapostrophe);
};
const pascalMemory = {};
function pascal(s = "") {
	if (pascalMemory[s]) return pascalMemory[s];
	const isStartWithUnderscore = s.startsWith("_");
	const cacheKey = s;
	if (regexps.upper.test(s)) s = low(s);
	const pascalString = (s.match(/[a-zA-Z0-9\u00C0-\u017F]+/g) ?? []).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
	const pascalWithUnderscore = isStartWithUnderscore ? `_${pascalString}` : pascalString;
	pascalMemory[cacheKey] = pascalWithUnderscore;
	return pascalWithUnderscore;
}
function camel(s = "") {
	const isStartWithUnderscore = s.startsWith("_");
	const camelString = decap(pascal(s), isStartWithUnderscore ? 1 : 0);
	return isStartWithUnderscore ? `_${camelString}` : camelString;
}
function snake(s = "") {
	return lower(s, "_", true);
}
function kebab(s = "") {
	return lower(s, "-", true);
}
function upper(s, fillWith, isDeapostrophe) {
	return fill(up(prep(s, !!fillWith, false, true)), fillWith, isDeapostrophe);
}
function conventionName(name, convention) {
	let nameConventionTransform = camel;
	switch (convention) {
		case NamingConvention.PASCAL_CASE:
			nameConventionTransform = pascal;
			break;
		case NamingConvention.SNAKE_CASE:
			nameConventionTransform = snake;
			break;
		case NamingConvention.KEBAB_CASE:
			nameConventionTransform = kebab;
			break;
	}
	return nameConventionTransform(name);
}
//#endregion
//#region src/utils/compare-version.ts
const getComparableVersion = (version) => {
	const npmAliasVersion = version.match(/^npm:(?:@[^/]+\/)?[^@]+@(.+)$/)?.[1];
	if (npmAliasVersion) return npmAliasVersion;
	if (version.startsWith("npm:")) return "latest";
	return version;
};
function compareVersions(firstVersion, secondVersions, operator = ">=") {
	const comparableVersion = getComparableVersion(firstVersion);
	if (comparableVersion === "latest" || comparableVersion === "*") return true;
	if (comparableVersion.startsWith("catalog:")) return true;
	return compare(comparableVersion.replace(/(\s(.*))/, ""), secondVersions, operator);
}
//#endregion
//#region src/utils/content-type.ts
const binaryApplicationTypes = new Set([
	"application/octet-stream",
	"application/pdf",
	"application/zip"
]);
/**
* Determine if a content type is binary.
* Only known binary types return true. Unknown types default to false (non-binary)
* so that schema type information is preserved rather than being overridden with Blob.
*/
function isBinaryContentType(contentType) {
	const baseType = contentType.split(";")[0].trim();
	if (baseType.startsWith("image/")) return true;
	if (baseType.startsWith("audio/")) return true;
	if (baseType.startsWith("video/")) return true;
	if (baseType.startsWith("font/")) return true;
	return binaryApplicationTypes.has(baseType);
}
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
function getFormDataFieldFileType(resolvedSchema, partContentType) {
	if (resolvedSchema.type !== "string") return;
	if (resolvedSchema.contentEncoding) return;
	const contentMediaType = resolvedSchema.contentMediaType;
	const effectiveContentType = partContentType ?? contentMediaType;
	if (effectiveContentType) return isBinaryContentType(effectiveContentType) ? "binary" : "text";
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
function filterByContentType(items, filter) {
	if (!filter) return items;
	return items.filter((item) => {
		const shouldInclude = !filter.include || filter.include.includes(item.contentType);
		const shouldExclude = filter.exclude?.includes(item.contentType) ?? false;
		return shouldInclude && !shouldExclude;
	});
}
//#endregion
//#region src/utils/debug.ts
const filter = process.env.ORVAL_DEBUG_FILTER;
const DEBUG = process.env.DEBUG;
function createDebugger(ns, options = {}) {
	const log = debug(ns);
	const { onlyWhenFocused } = options;
	const focus = isString(onlyWhenFocused) ? onlyWhenFocused : ns;
	return (msg, ...args) => {
		if (filter && !msg.includes(filter)) return;
		if (onlyWhenFocused && !DEBUG?.includes(focus)) return;
		log(msg, ...args);
	};
}
//#endregion
//#region src/utils/doc.ts
const search = String.raw`\*/`;
const replacement = String.raw`*\/`;
const regex = new RegExp(search, "g");
function trimTrailingEmptyLines(lines) {
	let lastLineIndex = lines.length - 1;
	while (lastLineIndex >= 0 && lines[lastLineIndex]?.trim() === "") lastLineIndex--;
	return lines.slice(0, lastLineIndex + 1);
}
function escapeJsDoc(value) {
	return value.replaceAll(regex, replacement);
}
function getDescriptionLines(description) {
	return trimTrailingEmptyLines((Array.isArray(description) ? description.filter((line) => !line.includes("eslint-disable")) : [description ?? ""]).flatMap((block) => block.split(/\r?\n/).map((line) => escapeJsDoc(line))));
}
function getEslintDisable(description) {
	return Array.isArray(description) ? description.find((line) => line.includes("eslint-disable")) : void 0;
}
const itemValidationKeys = [
	"minLength",
	"maxLength",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"minItems",
	"maxItems",
	"pattern"
];
function getItemValidationDocEntries(schema, prefix = "items", visited = /* @__PURE__ */ new WeakSet()) {
	if (!schema) return [];
	if (visited.has(schema)) return [];
	visited.add(schema);
	return [...itemValidationKeys.flatMap((key) => {
		const value = schema[key];
		return value === void 0 ? [] : [{
			key: `${prefix}.${key}`,
			value
		}];
	}), ...getItemValidationDocEntries(schema.items, `${prefix}.items`, visited)];
}
function toJsDocEntry(key, value) {
	if (value === void 0 || value === false || value === "") return [];
	return [{
		key,
		value
	}];
}
function getSchemaDocEntries(schema, itemValidationDocEntries, isNullable) {
	const { deprecated, summary, minLength, maxLength, minimum, maximum, exclusiveMinimum, exclusiveMaximum, minItems, maxItems, pattern } = schema;
	return [
		...toJsDocEntry("deprecated", deprecated),
		...toJsDocEntry("summary", summary),
		...toJsDocEntry("minLength", minLength),
		...toJsDocEntry("maxLength", maxLength),
		...toJsDocEntry("minimum", minimum),
		...toJsDocEntry("maximum", maximum),
		...toJsDocEntry("exclusiveMinimum", exclusiveMinimum),
		...toJsDocEntry("exclusiveMaximum", exclusiveMaximum),
		...toJsDocEntry("minItems", minItems),
		...toJsDocEntry("maxItems", maxItems),
		...toJsDocEntry("nullable", isNullable),
		...toJsDocEntry("pattern", pattern),
		...itemValidationDocEntries.flatMap(({ key, value }) => toJsDocEntry(key, value))
	];
}
function formatJsDocEntry({ key, value }) {
	if (value === true) return `@${key}`;
	return `@${key} ${escapeJsDoc(value.toString())}`;
}
function renderJsDocBlock(lines, tryOneLine = false) {
	if (lines.length === 0) return "";
	if (lines.length === 1 && tryOneLine) return `/** ${lines[0]} */\n`;
	const linePrefix = `${tryOneLine ? "  " : ""} *`;
	const closingPrefix = ` ${tryOneLine ? "  " : ""}`;
	return `/**\n${lines.map((line) => `${linePrefix}${line ? ` ${line}` : ""}`).join("\n")}\n${closingPrefix}*/\n`;
}
function jsDoc(schema, tryOneLine = false, context) {
	if (context?.output.override.jsDoc) {
		const { filter } = context.output.override.jsDoc;
		if (filter) return keyValuePairsToJsDoc(filter(schema));
	}
	const isNullable = schema.type === "null" || Array.isArray(schema.type) && schema.type.includes("null");
	const itemValidationDocEntries = getItemValidationDocEntries(schema.items);
	const lines = [...getDescriptionLines(schema.description), ...getSchemaDocEntries(schema, itemValidationDocEntries, isNullable).map((entry) => formatJsDocEntry(entry))];
	const eslintDisable = getEslintDisable(schema.description);
	const doc = renderJsDocBlock(lines, tryOneLine);
	return `${eslintDisable ? `/* ${escapeJsDoc(eslintDisable)} */\n` : ""}${doc}`;
}
function keyValuePairsToJsDoc(keyValues) {
	return renderJsDocBlock(keyValues.map(({ key, value }) => `@${key} ${value}`));
}
//#endregion
//#region src/utils/dynamic-import.ts
const TS_MODULE_EXTENSIONS = new Set([
	".ts",
	".mts",
	".cts",
	".tsx",
	".jsx"
]);
async function dynamicImport(toImport, from = process.cwd(), takeDefault = true) {
	if (!toImport) return toImport;
	try {
		if (isString(toImport)) {
			const filePath = nodePath.resolve(from, toImport);
			const extension = nodePath.extname(filePath);
			if (TS_MODULE_EXTENSIONS.has(extension)) {
				const data = await createJiti(from, { interopDefault: true }).import(filePath);
				if (takeDefault && (isObject(data) || isModule(data)) && data.default) return data.default;
				return data;
			}
			const fileUrl = pathToFileURL(filePath);
			const data = extension === ".json" ? await import(fileUrl.href, { with: { type: "json" } }) : await import(fileUrl.href);
			if (takeDefault && (isObject(data) || isModule(data)) && data.default) return data.default;
			return data;
		}
		return toImport;
	} catch (error) {
		throw new Error(`Oups... 🍻. Path: ${String(toImport)} => ${String(error)}`, { cause: error });
	}
}
//#endregion
//#region src/utils/extension.ts
function getExtension(path) {
	return path.toLowerCase().includes(".yaml") || path.toLowerCase().includes(".yml") ? "yaml" : "json";
}
//#endregion
//#region src/utils/file.ts
function getFileInfo(target = "", { backupFilename = "filename", extension = ".ts" } = {}) {
	const isDir = isDirectory(target);
	const filePath = isDir ? nodePath.join(target, backupFilename + extension) : target;
	return {
		path: filePath,
		pathWithoutExtension: filePath.replace(/\.[^/.]+$/, ""),
		extension,
		isDirectory: isDir,
		dirname: nodePath.dirname(filePath),
		filename: nodePath.basename(filePath, extension.startsWith(".") ? extension : `.${extension}`)
	};
}
async function removeFilesAndEmptyFolders(patterns, dir) {
	const files = await glob(patterns, {
		cwd: dir,
		absolute: true
	});
	await Promise.all(files.map((file) => fs.promises.unlink(file)));
	const sortedDirectories = (await glob(["**/*"], {
		cwd: dir,
		absolute: true,
		onlyDirectories: true
	})).toSorted((a, b) => {
		const depthA = a.split("/").length;
		return b.split("/").length - depthA;
	});
	for (const directory of sortedDirectories) try {
		if ((await fs.promises.readdir(directory)).length === 0) await fs.promises.rmdir(directory);
	} catch {}
}
//#endregion
//#region src/utils/file-extensions.ts
/**
* Returns the filename suffix for a given mock entry's output file. For
* example a `{ type: OutputMockType.MSW }` entry produces `<file>.msw.ts` and
* a `{ type: OutputMockType.FAKER }` entry produces `<file>.faker.ts`.
*
* Custom `ClientMockBuilder` functions default to the `msw` suffix to preserve
* the historical behavior.
*/
function getMockFileExtensionByTypeName(mock) {
	if (isFunction(mock)) return OutputMockType.MSW;
	return mock.type;
}
//#endregion
//#region src/utils/get-property-safe.ts
/**
* Type safe way to get arbitrary property from an object.
*
* @param obj - The object from which to retrieve the property.
* @param propertyName - The name of the property to retrieve.
* @returns Object with `hasProperty: true` and `value` of the property if it exists; otherwise `hasProperty: false` and undefined.
*
* @remarks Until TypeScript adds type-narrowing for Object.hasOwn we have to use this workaround
*/
function getPropertySafe(obj, propertyName) {
	if (Object.hasOwn(obj, propertyName)) return {
		hasProperty: true,
		value: obj[propertyName]
	};
	return {
		hasProperty: false,
		value: void 0
	};
}
//#endregion
//#region src/utils/is-body-verb.ts
function getIsBodyVerb(verb) {
	return VERBS_WITH_BODY.includes(verb);
}
//#endregion
//#region src/utils/logger.ts
const log = console.log;
let _warningCount = 0;
function logWarning(message) {
	_warningCount++;
	log(styleText("yellow", message));
}
function getWarningCount() {
	return _warningCount;
}
function resetWarnings() {
	_warningCount = 0;
}
let _verbose = false;
function setVerbose(v) {
	_verbose = v;
}
function isVerbose() {
	return _verbose;
}
const logVerbose = (...args) => {
	if (_verbose) log(...args);
};
function startMessage({ name, version, description }) {
	return `🍻 ${styleText(["cyan", "bold"], name)} ${styleText("green", `v${version}`)}${description ? ` - ${description}` : ""}`;
}
function logError(err, tag) {
	let message;
	if (err instanceof Error) {
		message = (err.message || err.stack) ?? "Unknown error";
		if (err.cause) {
			const causeMsg = err.cause instanceof Error ? err.cause.message : isString(err.cause) ? err.cause : JSON.stringify(err.cause, void 0, 2);
			message += `\n  Cause: ${causeMsg}`;
		}
	} else message = String(err);
	log(styleText("red", [
		"🛑",
		tag ? `${tag} -` : void 0,
		message
	].filter(Boolean).join(" ")));
}
function mismatchArgsMessage(mismatchArgs) {
	logWarning(`${mismatchArgs.join(", ")} ${mismatchArgs.length === 1 ? "is" : "are"} not defined in your configuration!`);
}
function createSuccessMessage(backend) {
	log(`🎉 ${backend ? `${styleText("green", backend)} - ` : ""}Your OpenAPI spec has been converted into ready to use orval!`);
}
const LogLevels = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3
};
function clearScreen() {
	const repeatCount = process.stdout.rows - 2;
	const blank = repeatCount > 0 ? "\n".repeat(repeatCount) : "";
	console.log(blank);
	readline.cursorTo(process.stdout, 0, 0);
	readline.clearScreenDown(process.stdout);
}
function createLogger(level = "info", options = {}) {
	const { prefix = "[vite]", allowClearScreen = true } = options;
	let lastType;
	let lastMsg;
	let sameCount = 0;
	const thresh = LogLevels[level];
	const clear = allowClearScreen && process.stdout.isTTY && !process.env.CI ? clearScreen : () => {};
	function output(type, msg, options = {}) {
		if (thresh >= LogLevels[type]) {
			const method = type === "info" ? "log" : type;
			const format = () => {
				if (options.timestamp) {
					const tag = type === "info" ? styleText(["cyan", "bold"], prefix) : type === "warn" ? styleText(["yellow", "bold"], prefix) : styleText(["red", "bold"], prefix);
					return `${styleText("dim", (/* @__PURE__ */ new Date()).toLocaleTimeString())} ${tag} ${msg}`;
				} else return msg;
			};
			if (type === lastType && msg === lastMsg) {
				sameCount++;
				clear();
				console[method](format(), styleText("yellow", `(x${sameCount + 1})`));
			} else {
				sameCount = 0;
				lastMsg = msg;
				lastType = type;
				if (options.clear) clear();
				console[method](format());
			}
		}
	}
	const warnedMessages = /* @__PURE__ */ new Set();
	const logger = {
		hasWarned: false,
		info(msg, opts) {
			output("info", msg, opts);
		},
		warn(msg, opts) {
			logger.hasWarned = true;
			output("warn", msg, opts);
		},
		warnOnce(msg, opts) {
			if (warnedMessages.has(msg)) return;
			logger.hasWarned = true;
			output("warn", msg, opts);
			warnedMessages.add(msg);
		},
		error(msg, opts) {
			logger.hasWarned = true;
			output("error", msg, opts);
		},
		clearScreen(type) {
			if (thresh >= LogLevels[type]) clear();
		}
	};
	return logger;
}
//#endregion
//#region src/utils/merge-deep.ts
function mergeDeep(source, target) {
	if (!isObject(target) || !isObject(source)) return source;
	const acc = Object.assign({}, source);
	for (const [key, value] of Object.entries(target)) {
		const sourceValue = acc[key];
		if (Array.isArray(sourceValue) && Array.isArray(value)) acc[key] = [...sourceValue, ...value];
		else if (isObject(sourceValue) && isObject(value)) acc[key] = mergeDeep(sourceValue, value);
		else acc[key] = value;
	}
	return acc;
}
//#endregion
//#region src/utils/occurrence.ts
function count(str = "", key) {
	if (!str) return 0;
	return (str.match(new RegExp(key, "g")) ?? []).length;
}
//#endregion
//#region src/utils/path.ts
var path_exports = /* @__PURE__ */ __exportAll({
	getRelativeImportPath: () => getRelativeImportPath,
	getSchemaFileName: () => getSchemaFileName,
	isAbsolute: () => isAbsolute,
	join: () => join,
	joinSafe: () => joinSafe,
	normalizeSafe: () => normalizeSafe,
	relativeSafe: () => relativeSafe,
	resolve: () => resolve,
	separator: () => "/",
	toUnix: () => toUnix
});
function isAbsolute(value) {
	return nodePath.isAbsolute(value);
}
function resolve(...args) {
	return toUnix(nodePath.resolve(...args));
}
function toUnix(value) {
	value = value.replaceAll("\\", "/");
	value = value.replaceAll(/(?<!^)\/+/g, "/");
	return value;
}
function join(...args) {
	return toUnix(nodePath.join(...args.map((a) => toUnix(a))));
}
/**
* Behaves exactly like `path.relative(from, to)`, but keeps the first meaningful "./"
*/
function relativeSafe(from, to) {
	return normalizeSafe(`./${toUnix(nodePath.relative(toUnix(from), toUnix(to)))}`);
}
function getSchemaFileName(path) {
	return path.replace(`.${getExtension(path)}`, "").slice(path.lastIndexOf("/") + 1);
}
function normalizeSafe(value) {
	let result;
	value = toUnix(value);
	result = toUnix(nodePath.normalize(value));
	if (value.startsWith("./") && !result.startsWith("./") && !result.startsWith("..")) result = "./" + result;
	else if (value.startsWith("//") && !result.startsWith("//")) result = value.startsWith("//./") ? "//." + result : "/" + result;
	return result;
}
function joinSafe(...values) {
	let result = toUnix(nodePath.join(...values.map((v) => toUnix(v))));
	if (values.length > 0) {
		const firstValue = toUnix(values[0]);
		if (firstValue.startsWith("./") && !result.startsWith("./") && !result.startsWith("..")) result = "./" + result;
		else if (firstValue.startsWith("//") && !result.startsWith("//")) result = firstValue.startsWith("//./") ? "//." + result : "/" + result;
	}
	return result;
}
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
function getRelativeImportPath(importerFilePath, exporterFilePath, includeFileExtension = false) {
	if (!nodePath.isAbsolute(importerFilePath)) throw new Error(`'importerFilePath' is not an absolute path. "${importerFilePath}"`);
	if (!nodePath.isAbsolute(exporterFilePath)) throw new Error(`'exporterFilePath' is not an absolute path. "${exporterFilePath}"`);
	const importerDir = nodePath.dirname(importerFilePath);
	const relativePath = nodePath.relative(importerDir, exporterFilePath);
	let posixPath = nodePath.posix.join(...relativePath.split(nodePath.sep));
	if (!posixPath.startsWith("./") && !posixPath.startsWith("../")) posixPath = `./${posixPath}`;
	if (!includeFileExtension) {
		const ext = nodePath.extname(posixPath);
		if (ext && posixPath.endsWith(ext)) posixPath = posixPath.slice(0, -ext.length);
	}
	return posixPath;
}
//#endregion
//#region src/utils/resolve-version.ts
function resolveInstalledVersion(packageName, fromDir) {
	try {
		const require = createRequire(nodePath.join(fromDir, "noop.js"));
		try {
			return require(`${packageName}/package.json`).version;
		} catch (directError) {
			if (directError instanceof Error && "code" in directError && directError.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
				const entryPath = require.resolve(packageName);
				let dir = nodePath.dirname(entryPath);
				while (dir !== nodePath.parse(dir).root) {
					const pkgPath = nodePath.join(dir, "package.json");
					if (existsSync(pkgPath)) {
						const pkgData = JSON.parse(readFileSync(pkgPath, "utf8"));
						if (pkgData.name === packageName) return pkgData.version;
					}
					dir = nodePath.dirname(dir);
				}
				return;
			}
			throw directError;
		}
	} catch {
		return;
	}
}
function resolveInstalledVersions(packageJson, fromDir) {
	const resolved = {};
	const allDeps = new Set([
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.devDependencies ?? {}),
		...Object.keys(packageJson.peerDependencies ?? {})
	]);
	for (const pkgName of allDeps) {
		const version = resolveInstalledVersion(pkgName, fromDir);
		if (version) resolved[pkgName] = version;
	}
	return resolved;
}
//#endregion
//#region src/utils/schemas-options.ts
/**
* Extracts the custom package import specifier from a normalized `schemas`
* config. Returns `undefined` when `schemas` is a plain string, `false`,
* `undefined`, or when `importPath` is not set.
*/
function getSchemasImportPath(schemas) {
	if (isObject(schemas)) return schemas.importPath;
}
//#endregion
//#region src/utils/sort.ts
const sortByPriority = (arr) => arr.toSorted((a, b) => {
	if (a.default) return 1;
	if (b.default) return -1;
	if (a.required && b.required) return 0;
	if (a.required) return -1;
	if (b.required) return 1;
	return 0;
});
//#endregion
//#region src/utils/string.ts
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
function stringify(data) {
	if (data === void 0) return;
	if (data === null) return "null";
	if (isString(data)) return `'${jsStringLiteralEscape(data)}'`;
	if (isNumber(data) || isBoolean(data) || isFunction(data)) return String(data);
	if (Array.isArray(data)) return `[${data.map((item) => stringify(item)).join(", ")}]`;
	const entries = Object.entries(data);
	let result = "";
	for (const [index, [key, value]] of entries.entries()) {
		const strValue = stringify(value);
		const safeKey = key === "__proto__" ? `['${jsStringLiteralEscape(key)}']` : keyword.isIdentifierNameES5(key) ? key : `'${jsStringLiteralEscape(key)}'`;
		if (entries.length === 1) result = `{ ${safeKey}: ${strValue}, }`;
		else if (!index) result = `{ ${safeKey}: ${strValue}, `;
		else if (entries.length - 1 === index) result += `${safeKey}: ${strValue}, }`;
		else result += `${safeKey}: ${strValue}, `;
	}
	return result;
}
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
function sanitize(value, options) {
	const { whitespace = "", underscore = "", dot = "", dash = "", es5keyword = false, es5IdentifierName = false, special = false } = options ?? {};
	let newValue = value;
	if (!special) newValue = newValue.replaceAll(/[!"`'#%&,:;<>=@{}~$()*+/\\?[\]^|]/g, "");
	if (whitespace !== true) newValue = newValue.replaceAll(/[\s]/g, whitespace);
	if (underscore !== true) newValue = newValue.replaceAll(/['_']/g, underscore);
	if (dot !== true) newValue = newValue.replaceAll(/[.]/g, dot);
	if (dash !== true) newValue = newValue.replaceAll(/[-]/g, dash);
	if (es5keyword) newValue = keyword.isKeywordES5(newValue, true) ? `_${newValue}` : newValue;
	if (es5IdentifierName) if (/^[0-9]/.test(newValue)) newValue = `N${newValue}`;
	else newValue = keyword.isIdentifierNameES5(newValue) ? newValue : `_${newValue}`;
	return newValue;
}
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
function toObjectString(props, path) {
	if (props.length === 0) return "";
	return (isString(path) ? props.map((prop) => {
		let obj = prop;
		for (const key of path.split(".")) obj = obj && (isObject(obj) || Array.isArray(obj)) ? obj[key] : void 0;
		return obj;
	}) : props).join(",\n    ") + ",";
}
const NUMBERS = {
	"0": "zero",
	"1": "one",
	"2": "two",
	"3": "three",
	"4": "four",
	"5": "five",
	"6": "six",
	"7": "seven",
	"8": "eight",
	"9": "nine"
};
/**
* Converts a number to its word representation by translating each digit to its word form.
*
* @param num - The number to convert to words.
* @returns A string containing the word representation of each digit concatenated together.
* @example
* getNumberWord(123) // returns "onetwothree"
* getNumberWord(42) // returns "fourtwo"
*/
function getNumberWord(num) {
	return [...num.toString()].reduce((acc, n) => acc + NUMBERS[n], "");
}
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
function escape(str, char = "'") {
	return str?.replaceAll(char, `\\${char}`);
}
/**
* Escapes regular expression metacharacters in a string so it can be safely
* embedded inside a RegExp pattern.
*
* @param value - The raw string value to escape for regex usage.
* @returns The escaped string.
* @example
* escapeRegExp('foo$bar') // returns 'foo\\$bar'
*/
function escapeRegExp(value) {
	return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
/**
* Escape all characters not included in SingleStringCharacters and
* DoubleStringCharacters on
* http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
*
* Based on https://github.com/joliss/js-string-escape/blob/master/index.js
*
* @param input String to escape
*/
function jsStringEscape(input) {
	return input.replaceAll(/["'\\\n\r\u2028\u2029/*]/g, (character) => {
		switch (character) {
			case "\"":
			case "'":
			case "\\":
			case "/":
			case "*": return "\\" + character;
			case "\n": return String.raw`\n`;
			case "\r": return String.raw`\r`;
			case "\u2028": return String.raw`\u2028`;
			case "\u2029": return String.raw`\u2029`;
			default: return "";
		}
	});
}
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
function jsStringLiteralEscape(input) {
	return input.replaceAll(/['\\\n\r\u2028\u2029]/g, (character) => {
		switch (character) {
			case "'":
			case "\\": return "\\" + character;
			case "\n": return String.raw`\n`;
			case "\r": return String.raw`\r`;
			case "\u2028": return String.raw`\u2028`;
			case "\u2029": return String.raw`\u2029`;
			default: return "";
		}
	});
}
/**
* Deduplicates a TypeScript union type string.
* Handles types like "A | B | B" → "A | B" and "null | null" → "null".
* Only splits on top-level | (not inside {} () [] <> or string literals).
*/
function dedupeUnionType(unionType) {
	const parts = [];
	let current = "";
	let depth = 0;
	let quote = "";
	let escaped = false;
	for (const c of unionType) {
		if (!escaped && (c === "'" || c === "\"")) {
			if (!quote) quote = c;
			else if (quote === c) quote = "";
		}
		if (!quote) {
			if ("{([<".includes(c)) depth++;
			if ("})]>".includes(c)) depth--;
			if (c === "|" && depth === 0) {
				parts.push(current.trim());
				current = "";
				continue;
			}
		}
		current += c;
		escaped = !!quote && !escaped && c === "\\";
	}
	if (current.trim()) parts.push(current.trim());
	return [...new Set(parts)].join(" | ");
}
//#endregion
//#region src/utils/tags.ts
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
function getTagKey(tag) {
	const normalizedTag = tag?.trim();
	return kebab(normalizedTag ? normalizedTag : DefaultTag);
}
/**
* Canonical bucket key for an operation, derived from its primary (first) tag.
*
* Untagged operations resolve to the {@link DefaultTag} bucket.
*/
function getOperationTagKey(operation) {
	return getTagKey(operation.tags[0]);
}
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
function isOperationInTagBucket(operation, tagKey) {
	if (tagKey == null) return true;
	return getOperationTagKey(operation) === getTagKey(tagKey);
}
//#endregion
//#region src/utils/tsconfig.ts
function isSyntheticDefaultImportsAllow(config) {
	if (!config) return true;
	return !!(config.compilerOptions?.allowSyntheticDefaultImports ?? config.compilerOptions?.esModuleInterop);
}
const NODE_NEXT_MODULES = new Set(["nodenext", "node16"]);
const NODE_NEXT_EXTENSION_MAP = [
	[".tsx", ".jsx"],
	[".mts", ".mjs"],
	[".cts", ".cjs"],
	[".ts", ".js"]
];
function getImportExtension(fileExtension, tsconfig) {
	const compilerOptions = tsconfig?.compilerOptions;
	if (compilerOptions?.allowImportingTsExtensions) return fileExtension;
	const module = compilerOptions?.module?.toLowerCase();
	const moduleResolution = compilerOptions?.moduleResolution?.toLowerCase();
	if (module && NODE_NEXT_MODULES.has(module) || moduleResolution && NODE_NEXT_MODULES.has(moduleResolution)) {
		for (const [from, to] of NODE_NEXT_EXTENSION_MAP) if (fileExtension.endsWith(from)) return `${fileExtension.slice(0, -from.length)}${to}`;
		return fileExtension;
	}
	return fileExtension.replace(/\.ts$/, "") || "";
}
//#endregion
//#region src/getters/enum.ts
/**
* Map of special characters to semantic word replacements.
*
* Applied before naming convention transforms (PascalCase, camelCase, …) so
* that characters which would otherwise be stripped still contribute a unique
* segment to the generated key.  Without this, values like "created_at" and
* "-created_at" both PascalCase to "CreatedAt", silently overwriting one
* another in the generated const/enum object.
*
* Only characters that appear as leading/trailing modifiers in real-world
* OpenAPI enums are mapped — the list is intentionally conservative to avoid
* changing output for schemas that don't hit collisions.
*/
const ENUM_SPECIAL_CHARACTER_MAP = {
	"-": "minus",
	"+": "plus"
};
/**
* Replace special characters with semantic words (plus an underscore separator)
* so that naming convention transforms (PascalCase, etc.) produce unique keys.
*
* The trailing underscore acts as a word boundary so that PascalCase treats the
* replacement as a separate word: "-created_at" → "minus_created_at" → "MinusCreatedAt".
*/
function replaceSpecialCharacters(key) {
	let result = "";
	for (const char of key) {
		const replacement = ENUM_SPECIAL_CHARACTER_MAP[char];
		result += replacement ? replacement + "_" : char;
	}
	return result;
}
function getEnumNames(schemaObject) {
	const names = schemaObject?.["x-enumNames"] ?? schemaObject?.["x-enumnames"] ?? schemaObject?.["x-enum-varnames"];
	if (!names) return;
	if (Array.isArray(names)) return names.map((name) => jsStringEscape(name));
	if (typeof names === "object") return (schemaObject?.enum ?? []).map((enumVal) => {
		const key = String(enumVal);
		return key in names ? jsStringEscape(names[key]) : void 0;
	});
}
function getEnumDescriptions(schemaObject) {
	const descriptions = schemaObject?.["x-enumDescriptions"] ?? schemaObject?.["x-enumdescriptions"] ?? schemaObject?.["x-enum-descriptions"];
	if (!descriptions) return;
	if (Array.isArray(descriptions)) return descriptions.map((description) => jsStringEscape(description));
	if (typeof descriptions === "object") return (schemaObject?.enum ?? []).map((enumVal) => {
		const key = String(enumVal);
		return key in descriptions ? jsStringEscape(descriptions[key]) : void 0;
	});
}
function getEnum(value, enumName, names, enumGenerationType, descriptions, enumNamingConvention) {
	if (enumGenerationType === EnumGeneration.CONST) return getTypeConstEnum(value, enumName, names, descriptions, enumNamingConvention);
	if (enumGenerationType === EnumGeneration.ENUM) return getNativeEnum(value, enumName, names, enumNamingConvention);
	return getUnion(value, enumName);
}
const getTypeConstEnum = (value, enumName, names, descriptions, enumNamingConvention) => {
	let enumValue = `export type ${enumName} = typeof ${enumName}[keyof typeof ${enumName}]`;
	value = String(value);
	if (value.endsWith(" | null")) {
		value = value.replace(" | null", "");
		enumValue += " | null";
	}
	enumValue += ";\n";
	const implementation = getEnumImplementation(value, names, descriptions, enumNamingConvention);
	enumValue += "\n\n";
	enumValue += `export const ${enumName} = {\n${implementation}} as const;\n`;
	return enumValue;
};
/**
* Derive the object/enum key for a single enum value.
*
* Handles numeric prefixes, sanitization, and optional naming convention
* transforms.  When `disambiguate` is true, special characters (-/+) are
* replaced with semantic words before the convention transform to prevent
* key collisions.
*/
function deriveEnumKey(val, enumNamingConvention, disambiguate = false) {
	let key = val.startsWith("'") ? val.slice(1, -1) : val;
	if (isNumeric(key)) key = toNumberKey(key);
	if (key.length > 1) key = sanitize(key, {
		whitespace: "_",
		underscore: true,
		dash: true,
		special: true
	});
	if (enumNamingConvention) {
		if (disambiguate) key = replaceSpecialCharacters(key);
		key = conventionName(key, enumNamingConvention);
	}
	return key;
}
function getEnumImplementation(value, names, descriptions, enumNamingConvention) {
	if (value === "") return "";
	const uniqueValues = [...new Set(value.split(" | "))];
	const disambiguate = !!enumNamingConvention && new Set(uniqueValues.map((v) => deriveEnumKey(v, enumNamingConvention))).size < uniqueValues.length;
	let result = "";
	for (const [index, val] of uniqueValues.entries()) {
		const name = names?.[index];
		const description = descriptions?.[index];
		const comment = description ? `  /** ${description} */\n` : "";
		if (name) {
			result += comment + `  ${keyword.isIdentifierNameES5(name) ? name : `'${name}'`}: ${val},\n`;
			continue;
		}
		const key = deriveEnumKey(val, enumNamingConvention, disambiguate);
		result += comment + `  ${keyword.isIdentifierNameES5(key) ? key : `'${key}'`}: ${val},\n`;
	}
	return result;
}
const getNativeEnum = (value, enumName, names, enumNamingConvention) => {
	return `export enum ${enumName} {\n${getNativeEnumItems(value, names, enumNamingConvention)}\n}`;
};
const getNativeEnumItems = (value, names, enumNamingConvention) => {
	if (value === "") return "";
	const uniqueValues = [...new Set(value.split(" | "))];
	const disambiguate = !!enumNamingConvention && new Set(uniqueValues.map((v) => deriveEnumKey(v, enumNamingConvention))).size < uniqueValues.length;
	let result = "";
	for (const [index, val] of uniqueValues.entries()) {
		const name = names?.[index];
		if (name) {
			result += `  ${keyword.isIdentifierNameES5(name) ? name : `'${name}'`}= ${val},\n`;
			continue;
		}
		const key = deriveEnumKey(val, enumNamingConvention, disambiguate);
		result += `  ${keyword.isIdentifierNameES5(key) ? key : `'${key}'`}= ${val},\n`;
	}
	return result;
};
const toNumberKey = (value) => {
	if (value.startsWith("-")) return `NUMBER_MINUS_${value.slice(1)}`;
	if (value.startsWith("+")) return `NUMBER_PLUS_${value.slice(1)}`;
	return `NUMBER_${value}`;
};
const getUnion = (value, enumName) => {
	return `export type ${enumName} = ${value};`;
};
function getEnumUnionFromSchema(schema) {
	if (!schema?.enum) return "";
	return schema.enum.filter((val) => val !== null).map((val) => isString(val) ? `'${jsStringLiteralEscape(val)}'` : String(val)).join(" | ");
}
const stripNullUnion = (value) => value.replaceAll(/\s*\|\s*null/g, "").trim();
const isSpreadableEnumRef = (schema, refName) => {
	if (!schema?.enum || !refName) return false;
	if (!getEnumUnionFromSchema(schema)) return false;
	const type = schema.type;
	if (type === "boolean" || Array.isArray(type) && type.includes("boolean")) return false;
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(refName);
};
const buildInlineEnum = (schema, enumValue) => {
	const names = getEnumNames(schema);
	const descriptions = getEnumDescriptions(schema);
	return getEnumImplementation(enumValue ?? getEnumUnionFromSchema(schema), names, descriptions);
};
function getCombinedEnumValue(inputs) {
	const valueImports = [];
	const hasNull = inputs.some((input) => {
		if (input.value.includes("| null")) return true;
		const schema = input.schema;
		if (!schema) return false;
		if (schema.nullable === true) return true;
		if (Array.isArray(schema.type) && schema.type.includes("null")) return true;
		return schema.enum?.includes(null) ?? false;
	});
	const addValueImport = (name) => {
		if (!valueImports.includes(name)) valueImports.push(name);
	};
	if (inputs.length === 1) {
		const input = inputs[0];
		if (input.isRef) {
			const refName = stripNullUnion(input.value);
			if (isSpreadableEnumRef(input.schema, refName)) {
				addValueImport(refName);
				return {
					value: refName,
					valueImports,
					hasNull
				};
			}
			return {
				value: `{${buildInlineEnum(input.schema)}} as const`,
				valueImports,
				hasNull
			};
		}
		return {
			value: `{${buildInlineEnum(input.schema, stripNullUnion(input.value))}} as const`,
			valueImports,
			hasNull
		};
	}
	return {
		value: `{${inputs.map((input) => {
			if (input.isRef) {
				const refName = stripNullUnion(input.value);
				if (isSpreadableEnumRef(input.schema, refName)) {
					addValueImport(refName);
					return `...${refName},`;
				}
				return buildInlineEnum(input.schema);
			}
			return buildInlineEnum(input.schema, stripNullUnion(input.value));
		}).join("")}} as const`,
		valueImports,
		hasNull
	};
}
//#endregion
//#region src/getters/ref.ts
/**
* `$ref`s targeting these sections under `#/components/...` are emitted as
* named TypeScript imports (e.g. `import type { Pet } from './model'`).
* Refs to any other location — for example `#/paths/.../schema` produced by
* JSON-Schema-Ref-Parser `bundle()` — have no corresponding `export type`
* and must be inlined by the resolver. See issue #398.
*/
const NAMED_COMPONENT_SECTIONS = [
	"schemas",
	"responses",
	"parameters",
	"requestBodies"
];
const RefComponentSuffix = {
	schemas: "",
	responses: "Response",
	parameters: "Parameter",
	requestBodies: "Body"
};
const COMPONENT_REF_PATTERN = new RegExp(String.raw`^#\/components\/(${NAMED_COMPONENT_SECTIONS.join("|")})\/[^/]+$`);
/**
* True iff `ref` targets a named slot eligible for emission as a TypeScript
* import. Used by `resolveValue` to decide between named import vs inlining
* the resolved schema.
*/
function isComponentRef(ref) {
	return COMPONENT_REF_PATTERN.test(ref);
}
const TILDE_1 = /~1/g;
const TILDE_0 = /~0/g;
/**
* Return the output type from the $ref
*
* @param $ref
*/
function getRefInfo($ref, context) {
	const [pathname, ref] = $ref.split("#");
	const refPaths = ref.slice(1).split("/").map((part) => decodeURIComponent(part).replaceAll(TILDE_1, "/").replaceAll(TILDE_0, "~"));
	const getOverrideSuffix = (override, paths) => {
		const firstLevel = override[paths[0]];
		if (!firstLevel) return "";
		return firstLevel[paths[1]]?.suffix ?? "";
	};
	const suffix = getOverrideSuffix(context.output.override, refPaths);
	const originalName = ref ? refPaths.at(-1) ?? "" : getSchemaFileName(pathname);
	if (!pathname) return {
		name: sanitize(pascal(originalName) + suffix, {
			es5keyword: true,
			es5IdentifierName: true,
			underscore: true,
			dash: true
		}),
		originalName,
		refPaths
	};
	return {
		name: sanitize(pascal(originalName) + suffix, {
			es5keyword: true,
			es5IdentifierName: true,
			underscore: true,
			dash: true
		}),
		originalName,
		refPaths
	};
}
/**
* Extracts the anchor name from a fragment-only `$dynamicRef` (e.g. `#category` → `category`).
*
* Returns `undefined` for external-document `$dynamicRef` values (e.g. `other.json#anchor`)
* which are not supported.
*/
function getDynamicAnchorName(dynamicRef) {
	if (!dynamicRef.startsWith("#") || dynamicRef.length <= 1) return;
	return dynamicRef.slice(1);
}
//#endregion
//#region src/getters/imports.ts
function getAliasedImports({ name, resolvedValue, context }) {
	return context.output.schemas && resolvedValue.isRef ? resolvedValue.imports.map((imp) => {
		if (!needCreateImportAlias({
			name,
			imp
		})) return imp;
		return {
			...imp,
			alias: `__${imp.name}`
		};
	}) : resolvedValue.imports;
}
function needCreateImportAlias({ imp, name }) {
	return !imp.alias && imp.name === name;
}
function getImportAliasForRefOrValue({ context, imports, resolvedValue }) {
	if (!context.output.schemas || !resolvedValue.isRef) return resolvedValue.value;
	return imports.find((imp) => imp.name === resolvedValue.value)?.alias ?? resolvedValue.value;
}
//#endregion
//#region src/getters/combine.ts
const mergeableAllOfKeys = new Set([
	"type",
	"properties",
	"required"
]);
function isMergeableAllOfObject(schema) {
	if (isNullish$1(schema.properties)) return false;
	if (schema.allOf || schema.anyOf || schema.oneOf) return false;
	if (!isNullish$1(schema.type) && schema.type !== "object") return false;
	return Object.keys(schema).every((key) => mergeableAllOfKeys.has(key));
}
function normalizeAllOfSchema(schema) {
	const schemaAllOf = schema.allOf;
	if (!schemaAllOf) return schema;
	let didMerge = false;
	const schemaProperties = schema.properties;
	const schemaRequired = schema.required;
	const mergedProperties = schemaProperties ? { ...schemaProperties } : {};
	const mergedRequired = new Set(schemaRequired);
	const remainingAllOf = [];
	for (const subSchema of schemaAllOf) {
		if (isSchema(subSchema) && isMergeableAllOfObject(subSchema)) {
			didMerge = true;
			if (subSchema.properties) Object.assign(mergedProperties, subSchema.properties);
			const subRequired = subSchema.required;
			if (subRequired) for (const prop of subRequired) mergedRequired.add(prop);
			continue;
		}
		remainingAllOf.push(subSchema);
	}
	if (!didMerge || remainingAllOf.length === 0) return schema;
	return {
		...schema,
		...Object.keys(mergedProperties).length > 0 && { properties: mergedProperties },
		...mergedRequired.size > 0 && { required: [...mergedRequired] },
		...remainingAllOf.length > 0 && { allOf: remainingAllOf }
	};
}
/** True when the schema node itself is not a single object shape. */
function directlyEmitsNonObjectType(schema) {
	if (schema.enum || schema.nullable === true) return true;
	const type = schema.type;
	if (!(!type || type === "object" || Array.isArray(type) && type.length === 1 && type[0] === "object")) return true;
	return false;
}
function isDirectlyNullable(schema) {
	if (schema.nullable === true) return true;
	const type = schema.type;
	return type === "null" || Array.isArray(type) && type.includes("null");
}
function directlyEmitsOnlyObjectOrNull(schema) {
	if (schema.enum) return false;
	const type = schema.type;
	const hasObjectType = !type || type === "object" || Array.isArray(type) && type.includes("object");
	const hasOnlyObjectAndNull = !type || type === "object" || Array.isArray(type) && type.every((memberType) => ["object", "null"].includes(memberType));
	return hasObjectType && hasOnlyObjectAndNull && (schema.nullable === true || Array.isArray(type) && type.includes("null"));
}
function isEnumMember(schema, context) {
	return resolveObject({
		schema,
		combined: true,
		context
	}).isEnum;
}
function hasAllEnumMembers(schema, context) {
	if (isReference(schema)) return false;
	return [
		schema.allOf,
		schema.oneOf,
		schema.anyOf
	].some((members) => !!members?.length && members.every((member) => isEnumMember(member, context)));
}
function usesCanonicalNullableOneOfObject(schema) {
	if (isReference(schema)) return false;
	const members = schema.oneOf;
	if (!members) return false;
	const isNullMember = (member) => {
		if (isReference(member)) return false;
		const type = member.type;
		return type === "null" || Array.isArray(type) && type.length === 1 && type[0] === "null";
	};
	const nonNullMembers = members.filter((member) => !isNullMember(member));
	const nonNullMember = nonNullMembers[0];
	if (!members.some(isNullMember) || nonNullMembers.length !== 1 || !nonNullMember || isReference(nonNullMember)) return false;
	const type = nonNullMember.type;
	const properties = nonNullMember.properties;
	return (type === "object" || !type && !!properties) && !!properties && Object.keys(properties).length > 0;
}
function propagatesNullAcrossRef(schema, crossesComponentRefBoundary) {
	if (!crossesComponentRefBoundary) return false;
	if (isDirectlyNullable(schema)) return true;
	return (schema.anyOf ?? []).some((member) => !isReference(member) && isDirectlyNullable(member));
}
/**
* True when this node can emit a branch that also omits keys contributed by
* its `allOf` descendants. Direct non-object output escapes the full
* intersection. Direct or inline-anyOf nullability can also escape when
* `resolveValue` resolves this node through a component `$ref` and preserves
* or appends `| null` outside the alias intersection. Canonical nullable oneOf
* and all-enum sibling compositions only make the node's own properties
* unsafe: `combineSchemas` still
* intersects every `allOf` member with their emitted union. A non-null object
* sibling or guaranteed properties on the parent also eliminate an
* object-or-null member's null branch from the parent intersection, preserving
* that member's object keys.
*/
function cannotGuaranteeAllOfPropertyKeys(schema, crossesComponentRefBoundary, nullBranchesEliminated = false) {
	if (directlyEmitsNonObjectType(schema) && !(nullBranchesEliminated && directlyEmitsOnlyObjectOrNull(schema))) return true;
	return !nullBranchesEliminated && propagatesNullAcrossRef(schema, crossesComponentRefBoundary);
}
/**
* True when this node's own property keys are not guaranteed in `keyof` of the
* referenced output. Nullable, enum, scalar, array, or mixed-type nodes fail
* directly; a missing type and OAS 3.1 `type: ['object']` remain object-capable.
*
* anyOf/oneOf members otherwise remain safe because `combineSchemas`
* intersects the node's own properties into every grouped branch. The exception
* is nullability on a component `$ref` target or one of its direct inline anyOf
* members: `resolveValue`/`getScalar` can propagate it outside the referenced
* wrapper's allOf intersection. Inline allOf members, reference members,
* non-null scalars, oneOf members, and nested unions stay inside the grouped
* intersection. An all-enum composition is also unsafe because `combineValues`
* emits the node's properties as a separate union branch instead. Finally, the
* canonical nullable-oneOf object shortcut emits only its inline object and
* `null`, dropping the node's own properties.
*/
function cannotGuaranteeOwnPropertyKeys(schema, context, crossesComponentRefBoundary, nullBranchesEliminated = false) {
	return cannotGuaranteeAllOfPropertyKeys(schema, crossesComponentRefBoundary, nullBranchesEliminated) || hasAllEnumMembers(schema, context) || usesCanonicalNullableOneOfObject(schema);
}
/**
* Dereference a component `$ref`, following `$ref`-to-`$ref` chains. Returns
* `undefined` (rather than throwing like `resolveRef`) for non-component,
* cyclic, malformed, or unresolvable refs so callers can fall back to the
* `Extract` guard. `seenRefs` records every visited hop and doubles as the
* cycle guard across the whole walk.
*/
function derefComponentSchema($ref, context, seenRefs) {
	let current = $ref;
	while (current && !seenRefs.has(current) && isComponentRef(current)) {
		seenRefs.add(current);
		let target;
		try {
			const { refPaths } = getRefInfo(current, context);
			target = Array.isArray(refPaths) ? prop(context.spec, ...refPaths) : void 0;
		} catch {
			return;
		}
		if (!isObject(target)) return;
		if (isReference(target)) {
			if (cannotGuaranteeAllOfPropertyKeys(target, true)) return;
			current = target.$ref;
			continue;
		}
		return target;
	}
}
/**
* True when this member is guaranteed to emit a non-null object. Walk the
* original `allOf` composition so object constraints hidden behind nested
* component refs are not lost when normalization merges an inline member into
* its parent. `seenRefs` keeps recursive component compositions cycle-safe.
*/
function guaranteesNonNullableObject(schema, context, seenRefs = /* @__PURE__ */ new Set(), crossesComponentRefBoundary = isReference(schema)) {
	if (isReference(schema)) {
		if (cannotGuaranteeOwnPropertyKeys(schema, context, crossesComponentRefBoundary)) return false;
		const resolvedSchema = derefComponentSchema(schema.$ref, context, seenRefs);
		return resolvedSchema ? guaranteesNonNullableObject(resolvedSchema, context, seenRefs, true) : false;
	}
	if (propagatesNullAcrossRef(schema, crossesComponentRefBoundary)) return false;
	const properties = schema.properties;
	const type = schema.type;
	const isExplicitlyNonNullableObject = type === "object" || Array.isArray(type) && type.length === 1 && type[0] === "object";
	if (!cannotGuaranteeOwnPropertyKeys(schema, context, crossesComponentRefBoundary) && (isExplicitlyNonNullableObject || !!properties && Object.keys(properties).length > 0)) return true;
	return (schema.allOf ?? []).some((member) => guaranteesNonNullableObject(member, context, new Set(seenRefs)));
}
/**
* Collect the property keys reachable through a schema's `allOf` composition,
* resolving component `$ref` members against the spec. Feeds the
* pickable/unresolved split for required-override keys: a key found here is
* provably in `keyof` of the emitted intersection, so a plain
* `Required<Pick<T, 'k'>>` is safe even when an `additionalProperties` index
* signature would collapse the `Extract` guard to `never` (#3748). Union
* members are deliberately not walked, while a node's own top-level properties
* are collected when the generator intersects them into every anyOf/oneOf
* branch. A node's own unsafe properties are skipped without discarding keys
* from sibling `allOf` descendants that remain in the emitted intersection.
* Nodes that can emit a branch outside that full intersection are skipped
* entirely, degrading to the compile-safe `Extract` guard. The component-ref
* boundary flag mirrors the only `resolveValue` path that lifts inline anyOf
* nullability outside the alias intersection. Parent allOf traversal also uses
* guaranteed properties on the parent or a sibling as proof that null cannot
* survive the full intersection.
*/
function collectDeepPropertyKeys(schema, context, crossesComponentRefBoundary = false, nullBranchesEliminated = false, seenRefs = /* @__PURE__ */ new Set()) {
	const resolvesComponentRef = crossesComponentRefBoundary || isReference(schema);
	if (cannotGuaranteeAllOfPropertyKeys(schema, resolvesComponentRef, nullBranchesEliminated)) return [];
	if (isReference(schema)) {
		const target = derefComponentSchema(schema.$ref, context, seenRefs);
		return target ? collectDeepPropertyKeys(target, context, true, nullBranchesEliminated, seenRefs) : [];
	}
	const properties = schema.properties;
	const keys = properties && !cannotGuaranteeOwnPropertyKeys(schema, context, resolvesComponentRef, nullBranchesEliminated) ? Object.keys(properties) : [];
	const parentPropertiesEliminateNull = keys.length > 0;
	const members = schema.allOf ?? [];
	const guaranteedObjectMembers = members.map((member) => guaranteesNonNullableObject(member, context));
	for (const [index, member] of members.entries()) {
		const hasObjectSibling = guaranteedObjectMembers.some((isGuaranteedObject, siblingIndex) => siblingIndex !== index && isGuaranteedObject);
		keys.push(...collectDeepPropertyKeys(member, context, false, nullBranchesEliminated || parentPropertiesEliminateNull || hasObjectSibling, seenRefs));
	}
	return keys;
}
function combineValues({ resolvedData, resolvedValue, separator, context, parentSchema, parentNullBranchesEliminated = false }) {
	if (resolvedData.isEnum.every(Boolean)) return `${resolvedData.values.join(` | `)}${resolvedValue ? ` | ${resolvedValue.value}` : ""}`;
	if (separator === "allOf") {
		let resolvedDataValue = resolvedData.values.map((v) => v.includes(" | ") ? `(${v})` : v).join(` & `);
		if (resolvedData.originalSchema.length > 0 && resolvedValue) {
			const discriminatedPropertySchemas = resolvedData.originalSchema.filter((s) => {
				const disc = s?.discriminator;
				return disc && resolvedValue.value.includes(` ${disc.propertyName}:`);
			});
			if (discriminatedPropertySchemas.length > 0) resolvedDataValue = `Omit<${resolvedDataValue}, '${discriminatedPropertySchemas.map((s) => s.discriminator?.propertyName).join("' | '")}'>`;
		}
		const resolvedValueStr = resolvedValue?.value.includes(" | ") ? `(${resolvedValue.value})` : resolvedValue?.value;
		const joined = `${resolvedDataValue}${resolvedValue ? ` & ${resolvedValueStr}` : ""}`;
		const parentProperties = parentSchema?.properties;
		const parentRequiredProperties = parentSchema?.required;
		const overrideRequiredProperties = resolvedData.requiredProperties.filter((prop) => !resolvedData.originalSchema.some((schema) => {
			const props = schema?.properties;
			const req = schema?.required;
			return props?.[prop] && req?.includes(prop);
		}) && !(parentProperties?.[prop] && parentRequiredProperties?.includes(prop)));
		const pickableParentProperties = parentSchema && parentProperties && !cannotGuaranteeOwnPropertyKeys(parentSchema, context, false, parentNullBranchesEliminated) ? Object.keys(parentProperties) : [];
		const pickableNonNullParentProperties = parentSchema && parentProperties && !cannotGuaranteeOwnPropertyKeys(parentSchema, context, false, true) ? Object.keys(parentProperties) : [];
		const pickableProperties = new Set([...resolvedData.allProperties, ...pickableParentProperties]);
		const pickableRequiredProperties = overrideRequiredProperties.filter((prop) => pickableProperties.has(prop));
		const unresolvedRequiredProperties = overrideRequiredProperties.filter((prop) => !pickableProperties.has(prop));
		const nullableParentRequiredProperties = unresolvedRequiredProperties.filter((prop) => pickableNonNullParentProperties.includes(prop));
		let result = joined;
		if (pickableRequiredProperties.length > 0) result = `${result} & Required<Pick<${joined}, '${pickableRequiredProperties.join("' | '")}'>>`;
		if (unresolvedRequiredProperties.length > 0) result = `${result} & Required<Pick<${joined}, Extract<keyof (${joined}), '${unresolvedRequiredProperties.join("' | '")}'>>>`;
		if (nullableParentRequiredProperties.length > 0) result = `${result} & (Required<Pick<NonNullable<${joined}>, '${nullableParentRequiredProperties.join("' | '")}'>> | null)`;
		if (pickableRequiredProperties.length > 0 || unresolvedRequiredProperties.length > 0) return result;
		return joined;
	}
	let values = resolvedData.values;
	if (resolvedData.allProperties.length && context.output.unionAddMissingProperties) {
		values = [];
		for (let i = 0; i < resolvedData.values.length; i += 1) {
			const subSchema = resolvedData.originalSchema[i];
			if (subSchema?.type !== "object" || !subSchema.properties) {
				values.push(resolvedData.values[i]);
				continue;
			}
			const subSchemaProps = subSchema.properties;
			const missingProperties = unique(resolvedData.allProperties.filter((p) => !Object.keys(subSchemaProps).includes(p)));
			values.push(`${resolvedData.values[i]}${missingProperties.length > 0 ? ` & {${missingProperties.map((p) => `${p}?: never`).join("; ")}}` : ""}`);
		}
	}
	if (resolvedValue) {
		const resolvedValueStr = resolvedValue.value.includes(" | ") ? `(${resolvedValue.value})` : resolvedValue.value;
		return values.map((value) => {
			return `(${value.includes(" | ") ? `(${value})` : value} & ${resolvedValueStr})`;
		}).join(" | ");
	}
	return values.join(" | ");
}
function combineSchemas({ name, schema, separator, context, nullable, formDataContext }) {
	const originalAllOfMembers = schema.allOf ?? [];
	const parentNullBranchesEliminated = separator === "allOf" && originalAllOfMembers.some((member) => guaranteesNonNullableObject(member, context));
	const normalizedSchema = separator === "allOf" && !context.output.override.aliasCombinedTypes && !schema.oneOf && !schema.anyOf ? normalizeAllOfSchema(schema) : schema;
	const items = normalizedSchema[separator] ?? [];
	const resolvedData = {
		values: [],
		imports: [],
		schemas: [],
		isEnum: [],
		isRef: [],
		types: [],
		dependencies: [],
		originalSchema: [],
		allProperties: [],
		hasReadonlyProps: false,
		example: schema.example,
		examples: resolveExampleRefs(schema.examples, context),
		requiredProperties: separator === "allOf" ? [...normalizedSchema.required ?? []] : []
	};
	for (const subSchema of items) {
		let propName;
		if (context.output.override.aliasCombinedTypes) {
			propName = name ? name + pascal(separator) : void 0;
			if (propName && resolvedData.schemas.length > 0) propName = propName + pascal(getNumberWord(resolvedData.schemas.length + 1));
		}
		const resolvedValue = resolveObject({
			schema: subSchema,
			propName,
			combined: true,
			context,
			formDataContext
		});
		if (separator === "allOf") {
			const memberRequired = resolvedValue.originalSchema?.required;
			if (Array.isArray(memberRequired)) resolvedData.requiredProperties.push(...memberRequired);
		}
		const aliasedImports = getAliasedImports({
			context,
			name,
			resolvedValue
		});
		const value = getImportAliasForRefOrValue({
			context,
			resolvedValue,
			imports: aliasedImports
		});
		resolvedData.values.push(value);
		resolvedData.imports.push(...aliasedImports);
		resolvedData.schemas.push(...resolvedValue.schemas);
		resolvedData.dependencies.push(...resolvedValue.dependencies);
		resolvedData.isEnum.push(resolvedValue.isEnum);
		resolvedData.types.push(resolvedValue.type);
		resolvedData.isRef.push(resolvedValue.isRef);
		resolvedData.originalSchema.push(resolvedValue.originalSchema);
		if (resolvedValue.hasReadonlyProps) resolvedData.hasReadonlyProps = true;
		if (resolvedValue.type === "object") if (separator === "allOf" && !isReference(resolvedValue.originalSchema)) resolvedData.allProperties.push(...collectDeepPropertyKeys(resolvedValue.originalSchema, context, isReference(subSchema)));
		else {
			const originalProps = resolvedValue.originalSchema.properties;
			if (originalProps) resolvedData.allProperties.push(...Object.keys(originalProps));
		}
	}
	const isAllEnums = resolvedData.isEnum.every(Boolean);
	const isNullableEnumComposition = (separator === "anyOf" || separator === "oneOf") && !isAllEnums && resolvedData.isEnum.some(Boolean) && resolvedData.isEnum.every((isEnum, index) => isEnum && !resolvedData.isRef[index] || resolvedData.types[index] === "null");
	if (isAllEnums && name && items.length > 1 && context.output.override.enumGenerationType !== EnumGeneration.UNION) {
		const { value: combinedEnumValue, valueImports, hasNull } = getCombinedEnumValue(resolvedData.values.map((value, index) => ({
			value,
			isRef: resolvedData.isRef[index],
			schema: resolvedData.originalSchema[index]
		})));
		const newEnum = `export const ${pascal(name)} = ${combinedEnumValue}`;
		const valueImportSet = new Set(valueImports);
		const typeSuffix = `${nullable}${hasNull && !nullable.includes("null") ? " | null" : ""}`;
		return {
			value: `typeof ${pascal(name)}[keyof typeof ${pascal(name)}]${typeSuffix}`,
			imports: [{ name: pascal(name) }],
			schemas: [...resolvedData.schemas, {
				imports: resolvedData.imports.filter((toImport) => valueImportSet.has(toImport.alias ?? toImport.name)).map((toImport) => ({
					...toImport,
					values: true
				})),
				model: newEnum,
				name
			}],
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: resolvedData.hasReadonlyProps,
			dependencies: resolvedData.dependencies,
			example: schema.example,
			examples: resolveExampleRefs(schema.examples, context)
		};
	}
	let resolvedValue;
	const normalizedProperties = normalizedSchema.properties;
	const schemaOneOf = schema.oneOf;
	const schemaAnyOf = schema.anyOf;
	if (normalizedProperties) resolvedValue = getScalar({
		item: Object.fromEntries(Object.entries(normalizedSchema).filter(([key]) => key !== separator)),
		name,
		context,
		formDataContext
	});
	else if (separator === "allOf" && (schemaOneOf || schemaAnyOf)) {
		const siblingCombiner = schemaOneOf ? "oneOf" : "anyOf";
		const siblingSchemas = schemaOneOf ?? schemaAnyOf;
		resolvedValue = combineSchemas({
			schema: { [siblingCombiner]: siblingSchemas },
			name,
			separator: siblingCombiner,
			context,
			nullable: ""
		});
	}
	return {
		value: dedupeUnionType(combineValues({
			resolvedData,
			separator,
			resolvedValue,
			context,
			parentSchema: normalizedSchema,
			parentNullBranchesEliminated
		}) + nullable),
		imports: resolvedValue ? [...resolvedData.imports, ...resolvedValue.imports] : resolvedData.imports,
		schemas: resolvedValue ? [...resolvedData.schemas, ...resolvedValue.schemas] : resolvedData.schemas,
		dependencies: resolvedValue ? [...resolvedData.dependencies, ...resolvedValue.dependencies] : resolvedData.dependencies,
		isEnum: isNullableEnumComposition,
		type: "object",
		isRef: false,
		hasReadonlyProps: resolvedData.hasReadonlyProps || (resolvedValue?.hasReadonlyProps ?? false),
		example: schema.example,
		examples: resolveExampleRefs(schema.examples, context)
	};
}
//#endregion
//#region src/getters/keys.ts
function getKey(key) {
	return keyword.isIdentifierNameES5(key) ? key : `'${jsStringLiteralEscape(key)}'`;
}
/**
* Emits a property access for a possibly non-identifier name: dot access for
* valid identifier names (`.petId`), quoted bracket access otherwise
* (`['scope.id']`).
*/
function getPropertyAccessor(name) {
	return keyword.isIdentifierNameES5(name) ? `.${name}` : `[${getKey(name)}]`;
}
//#endregion
//#region src/getters/object.ts
function getPropertyNamesEnumKeyType(item) {
	if (!("propertyNames" in item) || !item.propertyNames) return;
	const propertyNames = item.propertyNames;
	if (Array.isArray(propertyNames.enum)) {
		const enumValues = propertyNames.enum.filter((val) => isString(val));
		if (enumValues.length > 0) return {
			value: enumValues.map((val) => `'${jsStringLiteralEscape(val)}'`).join(" | "),
			imports: [],
			dependencies: []
		};
	}
	if (isString(propertyNames.const)) return {
		value: `'${jsStringLiteralEscape(propertyNames.const)}'`,
		imports: [],
		dependencies: []
	};
}
/**
* Resolve a narrowed key type from OpenAPI 3.1 propertyNames.
* Supports inline enum/const and $ref string enums.
*/
function getPropertyNamesKeyType(item, context) {
	const inlineKeyType = getPropertyNamesEnumKeyType(item);
	if (inlineKeyType) return inlineKeyType;
	const propertyNames = item.propertyNames;
	if (!propertyNames || !isReference(propertyNames)) return;
	const resolvedValue = resolveValue({
		schema: propertyNames,
		context
	});
	const resolvedConst = resolvedValue.originalSchema.const;
	const isStringConst = resolvedValue.type === "string" && isString(resolvedConst);
	if (!resolvedValue.isEnum && !isStringConst) return;
	return {
		value: resolvedValue.value,
		imports: resolvedValue.imports,
		dependencies: resolvedValue.dependencies
	};
}
/**
* Generate index signature key type based on propertyNames enum or const
* Returns union type string like "'foo' | 'bar'", "'x'", or 'string' if neither
*/
function getIndexSignatureKey(item) {
	return getPropertyNamesEnumKeyType(item)?.value ?? "string";
}
function getPropertyNamesRecordType(item, valueType, context) {
	const keyType = getPropertyNamesKeyType(item, context);
	if (!keyType) return;
	return {
		...keyType,
		value: `Partial<Record<${keyType.value}, ${valueType}>>`
	};
}
/**
* Return the output type from an object
*
* @param item item with type === "object"
*/
function getObject({ item, name, context, nullable, formDataContext }) {
	if (isReference(item)) {
		const { name } = getRefInfo(item.$ref, context);
		return {
			value: name + nullable,
			imports: [{ name }],
			schemas: [],
			isEnum: false,
			type: "object",
			isRef: true,
			hasReadonlyProps: item.readOnly ?? false,
			dependencies: [name],
			example: item.example,
			examples: resolveExampleRefs(item.examples, context)
		};
	}
	const schemaItem = item;
	const itemAllOf = schemaItem.allOf;
	const itemOneOf = schemaItem.oneOf;
	const itemAnyOf = schemaItem.anyOf;
	const itemType = schemaItem.type;
	if (itemAllOf || itemOneOf || itemAnyOf) {
		const separator = itemAllOf ? "allOf" : itemOneOf ? "oneOf" : "anyOf";
		const members = separator === "anyOf" ? itemAnyOf : separator === "oneOf" ? itemOneOf : void 0;
		if (members) {
			const isNullMember = (member) => {
				if (isReference(member)) return false;
				const memberType = member.type;
				return memberType === "null" || Array.isArray(memberType) && memberType.length === 1 && memberType[0] === "null";
			};
			const nonNullMembers = members.filter((member) => !isNullMember(member));
			const nonNullMember = nonNullMembers[0];
			const nonNullMemberType = nonNullMember && !isReference(nonNullMember) ? nonNullMember.type : void 0;
			const nonNullMemberProperties = nonNullMember && !isReference(nonNullMember) ? nonNullMember.properties : void 0;
			if (members.some(isNullMember) && nonNullMembers.length === 1 && nonNullMember != null && !isReference(nonNullMember) && (nonNullMemberType === "object" || nonNullMemberType == null && nonNullMemberProperties != null) && nonNullMemberProperties != null && Object.keys(nonNullMemberProperties).length > 0) return getObject({
				item: nonNullMember,
				name,
				context,
				nullable: nullable || " | null",
				formDataContext
			});
		}
		return combineSchemas({
			schema: schemaItem,
			name,
			separator,
			context,
			nullable,
			formDataContext
		});
	}
	if (Array.isArray(itemType)) {
		const typeArray = itemType;
		const nonNullTypes = typeArray.filter((type) => type !== "null");
		const typeArrayProperties = schemaItem.properties;
		if (!(nonNullTypes.length === 1 && nonNullTypes[0] === "object" && typeArrayProperties != null && Object.keys(typeArrayProperties).length > 0)) {
			const baseItem = schemaItem;
			return combineSchemas({
				schema: { anyOf: typeArray.map((type) => ({
					...baseItem,
					type
				})) },
				name,
				separator: "anyOf",
				context,
				nullable
			});
		}
	}
	const itemProperties = schemaItem.properties;
	if (itemProperties && Object.entries(itemProperties).length > 0) {
		const entries = Object.entries(itemProperties);
		if (context.output.propertySortOrder === PropertySortOrder.ALPHABETICAL) entries.sort((a, b) => {
			return a[0].localeCompare(b[0], "en", { numeric: true });
		});
		const acc = {
			imports: [],
			schemas: [],
			value: "",
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: false,
			useTypeAlias: false,
			dependencies: [],
			example: schemaItem.example,
			examples: resolveExampleRefs(schemaItem.examples, context)
		};
		const itemRequired = schemaItem.required;
		for (const [index, [key, schema]] of entries.entries()) {
			const isRequired = (Array.isArray(itemRequired) ? itemRequired : []).includes(key);
			let propName = "";
			if (name) {
				const isKeyStartWithUnderscore = key.startsWith("_");
				propName += pascal(`${isKeyStartWithUnderscore ? "_" : ""}${name}_${key}`);
			}
			const allSpecSchemas = context.spec.components?.schemas ?? {};
			if (Object.keys(allSpecSchemas).some((schemaName) => pascal(schemaName) === propName)) propName = propName + "Property";
			const propertyFormDataContext = formDataContext && !formDataContext.atPart ? {
				atPart: true,
				partContentType: formDataContext.encoding[key]?.contentType,
				urlEncoded: formDataContext.urlEncoded
			} : void 0;
			const resolvedValue = resolveObject({
				schema,
				propName,
				context,
				formDataContext: propertyFormDataContext
			});
			const isReadOnly = Boolean(schemaItem.readOnly) || Boolean(schema.readOnly);
			if (!index) acc.value += "{";
			const doc = jsDoc(schema, true, context);
			const propertyDoc = doc ? `${doc.trimEnd().split("\n").map((line) => `  ${line}`).join("\n")}\n` : "";
			if (isReadOnly || resolvedValue.hasReadonlyProps) acc.hasReadonlyProps = true;
			const constValue = "const" in schema ? schema.const : void 0;
			const hasConst = constValue !== void 0;
			let constLiteral;
			if (!hasConst) constLiteral = void 0;
			else if (isString(constValue)) constLiteral = `'${jsStringLiteralEscape(constValue)}'`;
			else constLiteral = JSON.stringify(constValue);
			const needsValueImport = hasConst && (resolvedValue.isEnum || resolvedValue.type === "enum");
			const usedResolvedValue = !hasConst || needsValueImport;
			const aliasedImports = needsValueImport ? resolvedValue.imports.map((imp) => ({
				...imp,
				isConstant: true
			})) : hasConst ? [] : getAliasedImports({
				name,
				context,
				resolvedValue
			});
			if (aliasedImports.length > 0) acc.imports.push(...aliasedImports);
			const alias = getImportAliasForRefOrValue({
				context,
				resolvedValue,
				imports: aliasedImports
			});
			const propValue = needsValueImport ? alias : constLiteral ?? alias;
			const finalPropValue = isRequired ? propValue : context.output.override.useNullForOptional === true ? `${propValue} | null` : propValue;
			acc.value += `\n${propertyDoc}${isReadOnly && !context.output.override.suppressReadonlyModifier ? "  readonly " : "  "}${getKey(key)}${isRequired ? "" : "?"}: ${finalPropValue};`;
			if (usedResolvedValue) {
				acc.schemas.push(...resolvedValue.schemas);
				acc.dependencies.push(...resolvedValue.dependencies);
			}
			if (entries.length - 1 === index) {
				const additionalProps = schemaItem.additionalProperties;
				if (additionalProps) if (additionalProps === true) {
					const recordType = getPropertyNamesRecordType(schemaItem, "unknown", context);
					if (recordType) {
						acc.value += "\n}";
						acc.value += ` & ${recordType.value}`;
						acc.useTypeAlias = true;
						acc.imports.push(...recordType.imports);
						acc.dependencies.push(...recordType.dependencies);
					} else {
						const keyType = getIndexSignatureKey(schemaItem);
						acc.value += `\n  [key: ${keyType}]: unknown;\n }`;
					}
				} else {
					const resolvedValue = resolveValue({
						schema: additionalProps,
						name,
						context
					});
					const recordType = getPropertyNamesRecordType(schemaItem, resolvedValue.value, context);
					if (recordType) {
						acc.value += "\n}";
						acc.value += ` & ${recordType.value}`;
						acc.useTypeAlias = true;
						acc.imports.push(...recordType.imports);
						acc.dependencies.push(...recordType.dependencies);
						acc.imports.push(...resolvedValue.imports);
						acc.schemas.push(...resolvedValue.schemas);
						acc.dependencies.push(...resolvedValue.dependencies);
					} else {
						const keyType = getIndexSignatureKey(schemaItem);
						acc.value += `\n  [key: ${keyType}]: unknown;\n}`;
					}
				}
				else acc.value += "\n}";
				acc.value += nullable;
			}
		}
		return acc;
	}
	const outerAdditionalProps = schemaItem.additionalProperties;
	const readOnlyFlag = schemaItem.readOnly;
	if (outerAdditionalProps) {
		if (outerAdditionalProps === true) {
			const recordType = getPropertyNamesRecordType(schemaItem, "unknown", context);
			if (recordType) return {
				value: recordType.value + nullable,
				imports: recordType.imports,
				schemas: [],
				isEnum: false,
				type: "object",
				isRef: false,
				hasReadonlyProps: readOnlyFlag ?? false,
				useTypeAlias: true,
				dependencies: recordType.dependencies
			};
			return {
				value: `{ [key: ${getIndexSignatureKey(schemaItem)}]: unknown }` + nullable,
				imports: [],
				schemas: [],
				isEnum: false,
				type: "object",
				isRef: false,
				hasReadonlyProps: readOnlyFlag ?? false,
				useTypeAlias: false,
				dependencies: []
			};
		}
		const resolvedValue = resolveValue({
			schema: outerAdditionalProps,
			name,
			context
		});
		const recordType = getPropertyNamesRecordType(schemaItem, resolvedValue.value, context);
		if (recordType) return {
			value: recordType.value + nullable,
			imports: [...recordType.imports, ...resolvedValue.imports],
			schemas: resolvedValue.schemas,
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: resolvedValue.hasReadonlyProps,
			useTypeAlias: true,
			dependencies: [...recordType.dependencies, ...resolvedValue.dependencies]
		};
		return {
			value: `{[key: ${getIndexSignatureKey(schemaItem)}]: ${resolvedValue.value}}` + nullable,
			imports: resolvedValue.imports,
			schemas: resolvedValue.schemas,
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: resolvedValue.hasReadonlyProps,
			useTypeAlias: false,
			dependencies: resolvedValue.dependencies
		};
	}
	const constValue = schemaItem.const;
	if (constValue !== void 0) {
		let type;
		if (Array.isArray(constValue)) type = "array";
		else if (constValue === null) type = "null";
		else if (typeof constValue === "string") type = "string";
		else if (typeof constValue === "number") type = "number";
		else if (typeof constValue === "boolean") type = "boolean";
		else type = "object";
		return {
			value: typeof constValue === "string" ? `'${jsStringLiteralEscape(constValue)}'` : JSON.stringify(constValue),
			imports: [],
			schemas: [],
			isEnum: false,
			type,
			isRef: false,
			hasReadonlyProps: readOnlyFlag ?? false,
			dependencies: []
		};
	}
	const keyType = itemType === "object" ? getIndexSignatureKey(schemaItem) : "string";
	const recordType = getPropertyNamesRecordType(schemaItem, "unknown", context);
	if (itemType === "object" && recordType) return {
		value: recordType.value + nullable,
		imports: recordType.imports,
		schemas: [],
		isEnum: false,
		type: "object",
		isRef: false,
		hasReadonlyProps: readOnlyFlag ?? false,
		useTypeAlias: true,
		dependencies: recordType.dependencies
	};
	return {
		value: (itemType === "object" ? `{ [key: ${keyType}]: unknown }` : "unknown") + nullable,
		imports: [],
		schemas: [],
		isEnum: false,
		type: "object",
		isRef: false,
		hasReadonlyProps: readOnlyFlag ?? false,
		useTypeAlias: false,
		dependencies: []
	};
}
//#endregion
//#region src/getters/scalar.ts
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
function isBinaryScalarSchema(schema) {
	const schemaType = schema.type;
	if (!(schemaType === "string" || isArray(schemaType) && schemaType.includes("string") && schemaType.every((type) => type === "string" || type === "null"))) return false;
	if (schema.format === "binary") return true;
	const contentMediaType = schema.contentMediaType;
	const contentEncoding = schema.contentEncoding;
	return contentMediaType === "application/octet-stream" && !contentEncoding;
}
/**
* Return the typescript equivalent of open-api data type
*
* @param item
* @ref https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#data-types
*/
function getScalar({ item, name, context, formDataContext }) {
	const schemaEnum = item.enum;
	const schemaType = item.type;
	const schemaReadOnly = item.readOnly;
	const schemaExample = item.example;
	const schemaExamples = item.examples;
	const schemaConst = item.const;
	const schemaFormat = item.format;
	const schemaNullable = item.nullable;
	const nullable = isArray(schemaType) && schemaType.includes("null") || schemaNullable === true ? " | null" : "";
	const enumItems = schemaEnum?.filter((enumItem) => enumItem !== null);
	let itemType = schemaType;
	if (!itemType && item.items) {
		item.type = "array";
		itemType = "array";
	}
	if (isArray(schemaType) && schemaType.includes("null")) {
		const typesWithoutNull = schemaType.filter((x) => x !== "null");
		itemType = typesWithoutNull.length === 1 ? typesWithoutNull[0] : typesWithoutNull;
	}
	switch (itemType) {
		case "number":
		case "integer": {
			let value = context.output.override.useBigInt && (schemaFormat === "int64" || schemaFormat === "uint64") ? "bigint" : "number";
			let isEnum = false;
			if (enumItems) {
				value = enumItems.map((enumItem) => `${enumItem}`).join(" | ");
				isEnum = true;
			}
			value += nullable;
			if (schemaConst !== void 0) value = `${schemaConst}${nullable}`;
			return {
				value,
				isEnum,
				type: "number",
				schemas: [],
				imports: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
		}
		case "boolean": {
			let value = "boolean";
			if (enumItems && !(enumItems.includes(true) && enumItems.includes(false))) value = enumItems.map((enumItem) => `${enumItem}`).join(" | ");
			value += nullable;
			if (schemaConst !== void 0) value = `${schemaConst}${nullable}`;
			return {
				value,
				type: "boolean",
				isEnum: false,
				schemas: [],
				imports: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
		}
		case "array": {
			const { value, ...rest } = getArray({
				schema: item,
				name,
				context,
				formDataContext
			});
			return {
				value: value + nullable,
				...rest,
				dependencies: rest.dependencies
			};
		}
		case "string": {
			let value = "string";
			let isEnum = false;
			if (enumItems) {
				value = enumItems.map((enumItem) => isString(enumItem) ? `'${jsStringLiteralEscape(enumItem)}'` : `${enumItem}`).filter(Boolean).join(` | `);
				isEnum = true;
			}
			if (!formDataContext?.urlEncoded) {
				if (schemaFormat === "binary") value = "Blob";
				else if (formDataContext?.atPart) {
					const fileType = getFormDataFieldFileType(item, formDataContext.partContentType);
					if (fileType) value = fileType === "binary" ? "Blob" : "Blob | string";
				} else if (isBinaryScalarSchema(item)) value = "Blob";
			}
			if (context.output.override.useDates && (schemaFormat === "date" || schemaFormat === "date-time")) value = "Date";
			value += nullable;
			if (schemaConst) value = `'${jsStringLiteralEscape(schemaConst)}'`;
			return {
				value,
				isEnum,
				type: "string",
				imports: [],
				schemas: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
		}
		case "null": {
			const itemAllOf = item.allOf;
			const itemOneOf = item.oneOf;
			const itemAnyOf = item.anyOf;
			let separator;
			if (itemAllOf?.length) separator = "allOf";
			else if (itemOneOf?.length) separator = "oneOf";
			else if (itemAnyOf?.length) separator = "anyOf";
			if (separator) return combineSchemas({
				schema: Object.fromEntries(Object.entries(item).filter(([key]) => key !== "type")),
				name,
				separator,
				context,
				nullable: nullable || " | null",
				formDataContext
			});
			return {
				value: "null",
				isEnum: false,
				type: "null",
				imports: [],
				schemas: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: []
			};
		}
		default: {
			if (isArray(itemType)) return combineSchemas({
				schema: { anyOf: itemType.map((type) => Object.assign({}, item, { type })) },
				name,
				separator: "anyOf",
				context,
				nullable
			});
			if (enumItems) return {
				value: enumItems.map((enumItem) => isString(enumItem) ? `'${jsStringLiteralEscape(enumItem)}'` : String(enumItem)).filter(Boolean).join(` | `) + nullable,
				isEnum: true,
				type: "string",
				imports: [],
				schemas: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
			const hasCombiners = item.allOf ?? item.anyOf ?? item.oneOf;
			const { value, ...rest } = getObject({
				item,
				name,
				context,
				nullable,
				formDataContext: formDataContext?.atPart === false || formDataContext?.atPart && hasCombiners ? formDataContext : void 0
			});
			return {
				value,
				...rest
			};
		}
	}
}
//#endregion
//#region src/resolvers/ref.ts
/** Convert a `$dynamicAnchor` name to a valid TypeScript generic parameter identifier. */
function dynamicAnchorToParamName(anchor) {
	return sanitize(anchor, {
		underscore: "_",
		whitespace: "_",
		dash: "_",
		es5keyword: true,
		es5IdentifierName: true
	});
}
function dynamicAnchorsToUniqueParamNames(anchors) {
	const result = /* @__PURE__ */ new Map();
	const usedNames = /* @__PURE__ */ new Map();
	for (const anchor of anchors) {
		const base = dynamicAnchorToParamName(anchor);
		const count = usedNames.get(base) ?? 0;
		usedNames.set(base, count + 1);
		const paramName = count === 0 ? base : `${base}${count + 1}`;
		result.set(anchor, paramName);
	}
	return result;
}
const REF_NOT_FOUND_PREFIX = "Oops... 🍻. Ref not found";
/**
* Recursively resolves a `$ref` in an OpenAPI document, following
* nested schema refs and collecting imports along the way.
*
* Handles OpenAPI 3.0 `nullable` and 3.1 type-array hints on direct refs.
*
* @see https://spec.openapis.org/oas/v3.0.3#reference-object
* @see https://spec.openapis.org/oas/v3.1.0#reference-object
*/
function resolveRef(schema, context, imports = []) {
	const refPath = "$ref" in schema ? schema.$ref : void 0;
	const nestedSchema = "schema" in schema ? schema.schema : void 0;
	if (isObject(nestedSchema) && isReference(nestedSchema) && typeof nestedSchema.$ref === "string") {
		const resolvedRef = resolveRef(nestedSchema, context, imports);
		if ("examples" in schema) {
			const schemaWithExamples = schema;
			schemaWithExamples.examples = resolveExampleRefs(schemaWithExamples.examples, context);
		}
		if ("examples" in resolvedRef.schema) {
			const resolvedWithExamples = resolvedRef.schema;
			resolvedWithExamples.examples = resolveExampleRefs(resolvedWithExamples.examples, context);
		}
		return {
			schema: {
				...schema,
				schema: resolvedRef.schema
			},
			imports: resolvedRef.imports
		};
	}
	if (isDereferenced(schema)) {
		if ("examples" in schema) {
			const schemaWithExamples = schema;
			schemaWithExamples.examples = resolveExampleRefs(schemaWithExamples.examples, context);
		}
		return {
			schema,
			imports
		};
	}
	if (!refPath) throw new Error(`${REF_NOT_FOUND_PREFIX}: missing $ref`);
	const { currentSchema, refInfo: { name, originalName } } = getSchema$1(schema, context);
	if (!currentSchema) throw new Error(`${REF_NOT_FOUND_PREFIX}: ${refPath}`);
	return resolveRef(currentSchema, { ...context }, [...imports, {
		name,
		schemaName: originalName
	}]);
}
/** Check whether a schema reference has at least one `$defs` entry with both `$dynamicAnchor` and `$ref`. */
function isBoundAlias(schema) {
	const defs = schema.$defs;
	if (!defs || typeof defs !== "object") return false;
	for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const rec = defSchema;
		if (typeof rec.$dynamicAnchor === "string" && typeof rec.$ref === "string") return true;
	}
	return false;
}
/**
* Extract bound-alias information from a schema that references a generic template
* and binds `$dynamicAnchor` entries to concrete types via `$defs`.
*/
function extractBoundAliasInfo(schema, context) {
	let bindingElement;
	let extraSchemas;
	if (isReference(schema) && isBoundAlias(schema)) bindingElement = schema;
	else {
		const allOf = schema.allOf;
		if (Array.isArray(allOf)) for (let i = 0; i < allOf.length; i++) {
			const element = allOf[i];
			if (isReference(element) && isBoundAlias(element)) {
				bindingElement = element;
				extraSchemas = allOf.filter((_, j) => j !== i);
				break;
			}
		}
	}
	if (!bindingElement) return void 0;
	const defs = bindingElement.$defs;
	if (!defs || typeof defs !== "object") return void 0;
	const bindingByAnchor = /* @__PURE__ */ new Map();
	for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const rec = defSchema;
		if (rec.$dynamicAnchor === void 0) continue;
		const ref = rec.$ref;
		if (!ref || !isComponentRef(ref)) continue;
		const anchor = rec.$dynamicAnchor;
		const { name, originalName } = getRefInfo(ref, context);
		bindingByAnchor.set(anchor, {
			typeName: name,
			originalName
		});
	}
	if (bindingByAnchor.size === 0) return void 0;
	const refPath = bindingElement.$ref;
	if (typeof refPath !== "string") return void 0;
	const { name: genericName, refPaths: templateRefPaths } = getRefInfo(refPath, context);
	const templateDefs = (templateRefPaths ? prop(context.spec, ...templateRefPaths) : void 0)?.$defs;
	const typeArgs = [];
	const genericParams = [];
	const imports = [];
	if (templateDefs && typeof templateDefs === "object") {
		const templateAnchors = [];
		for (const defSchema of Object.values(templateDefs)) {
			if (!defSchema || typeof defSchema !== "object") continue;
			const rec = defSchema;
			if (rec.$dynamicAnchor === void 0 || rec.$ref !== void 0) continue;
			templateAnchors.push(rec.$dynamicAnchor);
		}
		const uniqueNames = dynamicAnchorsToUniqueParamNames(templateAnchors);
		for (const anchor of templateAnchors) {
			const binding = bindingByAnchor.get(anchor);
			if (binding) {
				typeArgs.push(binding.typeName);
				imports.push({
					name: binding.typeName,
					schemaName: binding.originalName
				});
			} else {
				const paramName = uniqueNames.get(anchor) ?? dynamicAnchorToParamName(anchor);
				typeArgs.push(paramName);
				genericParams.push(paramName);
			}
		}
	}
	if (typeArgs.length === 0) for (const { typeName, originalName } of bindingByAnchor.values()) {
		typeArgs.push(typeName);
		imports.push({
			name: typeName,
			schemaName: originalName
		});
	}
	return {
		genericName,
		genericParams,
		typeArgs,
		imports,
		extraSchemas
	};
}
function getSchema$1(schema, context) {
	if (!schema.$ref) throw new Error(`${REF_NOT_FOUND_PREFIX}: missing $ref`);
	const refInfo = getRefInfo(schema.$ref, context);
	const { refPaths } = refInfo;
	const schemaByRefPaths = Array.isArray(refPaths) ? prop(context.spec, ...refPaths) : void 0;
	if (isObject(schemaByRefPaths) && isReference(schemaByRefPaths) && !isBoundAlias(schemaByRefPaths)) return getSchema$1(schemaByRefPaths, context);
	let currentSchema = schemaByRefPaths;
	if (isObject(currentSchema) && "nullable" in schema) {
		const nullable = schema.nullable;
		currentSchema = {
			...currentSchema,
			nullable
		};
	}
	if (isObject(currentSchema) && "type" in schema && Array.isArray(schema.type)) {
		const type = schema.type;
		currentSchema = {
			...currentSchema,
			type
		};
	}
	return {
		currentSchema,
		refInfo
	};
}
function encodeJsonPointerSegment(segment) {
	return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
/**
* Build the dynamic scope for a schema: maps `$dynamicAnchor` names to concrete
* type entries for self-referential resolution, `$defs` bindings, and sibling anchors.
*/
function buildDynamicScope(schemaName, schema, context) {
	const scope = {};
	const getSchemaScopeEntry = (name) => {
		const refInfo = getRefInfo(`#/components/schemas/${encodeJsonPointerSegment(name)}`, context);
		return {
			name: refInfo.name,
			schemaName: refInfo.originalName
		};
	};
	const schemaRecord = schema;
	if (typeof schemaRecord.$dynamicAnchor === "string") scope[schemaRecord.$dynamicAnchor] = getSchemaScopeEntry(schemaName);
	const defs = schemaRecord.$defs;
	if (defs && typeof defs === "object") {
		const unboundAnchors = [];
		for (const [, defSchema] of Object.entries(defs)) {
			if (!defSchema || typeof defSchema !== "object") continue;
			const defRecord = defSchema;
			if (typeof defRecord.$dynamicAnchor === "string") {
				const anchorName = defRecord.$dynamicAnchor;
				const refInDef = defSchema.$ref;
				if (refInDef?.startsWith("#/components/schemas/")) {
					const { name, originalName } = getRefInfo(refInDef, context);
					scope[anchorName] = {
						name,
						schemaName: originalName
					};
				} else if (!refInDef) unboundAnchors.push(anchorName);
			}
		}
		if (unboundAnchors.length > 0) {
			const uniqueNames = dynamicAnchorsToUniqueParamNames(unboundAnchors);
			for (const anchor of unboundAnchors) {
				const paramName = uniqueNames.get(anchor);
				if (paramName === void 0) continue;
				scope[anchor] = {
					name: paramName,
					schemaName: paramName,
					isParameter: true
				};
			}
		}
	}
	return scope;
}
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
function buildInlineDynamicScope(schema) {
	const scope = {};
	const schemaRecord = schema;
	if (typeof schemaRecord.$dynamicAnchor === "string") {
		const anchor = schemaRecord.$dynamicAnchor;
		scope[anchor] = {
			name: anchor,
			schemaName: anchor,
			inlineSchema: schema
		};
	}
	const defs = schemaRecord.$defs;
	if (defs && typeof defs === "object") for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const defRecord = defSchema;
		if (typeof defRecord.$dynamicAnchor === "string" && !defSchema.$ref) {
			const anchor = defRecord.$dynamicAnchor;
			scope[anchor] = {
				name: anchor,
				schemaName: anchor,
				inlineSchema: defSchema
			};
		}
	}
	return scope;
}
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
function getDynamicAnchorIndex(context) {
	const cached = context.dynamicAnchorIndex;
	if (cached) return cached;
	const index = /* @__PURE__ */ new Map();
	const schemas = context.spec.components?.schemas;
	if (schemas && typeof schemas === "object") for (const [schemaName, schemaObj] of Object.entries(schemas)) {
		if (!schemaObj || typeof schemaObj !== "object") continue;
		const anchor = schemaObj.$dynamicAnchor;
		if (typeof anchor !== "string") continue;
		let entry = index.get(anchor);
		if (!entry) {
			entry = { count: 0 };
			index.set(anchor, entry);
		}
		if (schemaName === anchor) entry.exactName = schemaName;
		else if (entry.count < 2) {
			entry.count += 1;
			if (!entry.firstName) entry.firstName = schemaName;
		}
	}
	context.dynamicAnchorIndex = index;
	return index;
}
/**
* Resolve a `$dynamicRef` anchor to its concrete type using the current dynamic scope.
* Returns `{ schema: {}, resolvedTypeName: 'unknown' }` when no scope override exists.
*/
function resolveDynamicRef(anchorName, context, imports = []) {
	let scopeEntry = (context.dynamicScope ?? {})[anchorName];
	if (!scopeEntry) {
		const entry = getDynamicAnchorIndex(context).get(anchorName);
		const match = entry?.exactName ?? (entry?.count === 1 ? entry?.firstName : void 0);
		if (match) {
			const refInfo = getRefInfo(`#/components/schemas/${encodeJsonPointerSegment(match)}`, context);
			scopeEntry = {
				name: refInfo.name,
				schemaName: refInfo.originalName
			};
		}
	}
	if (!scopeEntry) return {
		schema: {},
		imports,
		resolvedTypeName: "unknown",
		schemaName: void 0
	};
	if (scopeEntry.isParameter) return {
		schema: {},
		imports,
		resolvedTypeName: scopeEntry.name,
		schemaName: void 0
	};
	if (scopeEntry.inlineSchema) return {
		schema: scopeEntry.inlineSchema,
		imports,
		resolvedTypeName: scopeEntry.name,
		schemaName: void 0
	};
	const resolvedTypeName = scopeEntry.name;
	const schemaRef = `#/components/schemas/${encodeJsonPointerSegment(scopeEntry.schemaName)}`;
	try {
		const { schema: resolvedSchema, imports: resolvedImports } = resolveRef({ $ref: schemaRef }, context, imports);
		return {
			schema: resolvedSchema,
			imports: resolvedImports,
			resolvedTypeName,
			schemaName: scopeEntry.schemaName
		};
	} catch {
		return {
			schema: {},
			imports,
			resolvedTypeName: "unknown",
			schemaName: void 0
		};
	}
}
/** Recursively resolves `$ref` entries in an examples array or record. */
function resolveExampleRefs(examples, context) {
	if (!examples) return;
	return Array.isArray(examples) ? examples.map((example) => {
		if (isObject(example) && isReference(example)) {
			const { schema } = resolveRef(example, context);
			return schema.value;
		}
		return example;
	}) : (() => {
		const result = {};
		for (const [key, example] of Object.entries(examples)) result[key] = isObject(example) && isReference(example) ? resolveRef(example, context).schema.value : example;
		return result;
	})();
}
//#endregion
//#region src/resolvers/value.ts
const schemaArrayKeys = [
	"allOf",
	"anyOf",
	"oneOf",
	"prefixItems"
];
const schemaObjectKeys = [
	"additionalProperties",
	"contains",
	"else",
	"if",
	"items",
	"not",
	"propertyNames",
	"then",
	"unevaluatedItems",
	"unevaluatedProperties"
];
const schemaMapKeys = [
	"$defs",
	"dependentSchemas",
	"patternProperties",
	"properties"
];
/**
* Recursively walks a schema value and returns `true` if any nested
* `$dynamicRef` resolves — via the current `context.dynamicScope` — to a
* schema *other* than `refName`.
*
* Used by `resolveValue` to decide whether a `$ref`'d schema must be
* instantiated with its bound type arguments rather than referenced by name.
*
* @param value   - The schema node (or sub-node) to inspect.
* @param context - Current resolution context, including the dynamic scope.
* @param refName - The resolved name of the enclosing `$ref` schema; dynamic
*                  refs that resolve to this same name are considered
*                  self-references and do not count as "scope-affected".
* @param seen    - Cycle-guard; tracks already-visited objects.
*/
function hasScopeAffectedDynamicRef(value, context, refName, seen = /* @__PURE__ */ new WeakSet()) {
	if (!value || typeof value !== "object") return false;
	if (!context.dynamicScope || Object.keys(context.dynamicScope).length === 0) return false;
	if (seen.has(value)) return false;
	seen.add(value);
	if (isDynamicReference(value) && value.$dynamicRef.startsWith("#")) {
		const anchorName = getDynamicAnchorName(value.$dynamicRef);
		if (anchorName) {
			const scopeEntry = context.dynamicScope[anchorName];
			if (scopeEntry && scopeEntry.name !== refName) return true;
		}
	}
	const schema = value;
	for (const key of schemaArrayKeys) {
		const items = schema[key];
		if (Array.isArray(items) && items.some((item) => hasScopeAffectedDynamicRef(item, context, refName, seen))) return true;
	}
	for (const key of schemaObjectKeys) if (hasScopeAffectedDynamicRef(schema[key], context, refName, seen)) return true;
	for (const key of schemaMapKeys) {
		const schemaMap = schema[key];
		if (schemaMap && typeof schemaMap === "object" && Object.values(schemaMap).some((item) => hasScopeAffectedDynamicRef(item, context, refName, seen))) return true;
	}
	return false;
}
function makeUnknownValue(originalSchema) {
	return {
		value: "unknown",
		imports: [],
		type: "unknown",
		isEnum: false,
		schemas: [],
		isRef: false,
		hasReadonlyProps: false,
		originalSchema,
		dependencies: []
	};
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
function resolveValue({ schema, name, context, formDataContext }) {
	if (isReference(schema)) {
		const alias = extractBoundAliasInfo(schema, context);
		if (alias) {
			const value = `${alias.genericName}<${alias.typeArgs.join(", ")}>`;
			const allImports = [{
				name: alias.genericName,
				schemaName: alias.genericName
			}, ...alias.imports];
			return {
				value,
				imports: allImports,
				type: "object",
				schemas: [],
				isEnum: false,
				originalSchema: schema,
				hasReadonlyProps: false,
				isRef: true,
				dependencies: allImports.map((i) => i.name)
			};
		}
		const refValue = schema.$ref;
		const { schema: schemaObject, imports } = resolveRef(schema, context);
		if (refValue && !isComponentRef(refValue)) {
			if (context.parents?.includes(refValue)) return {
				value: "unknown",
				imports: [],
				schemas: [],
				type: "unknown",
				isEnum: false,
				originalSchema: schemaObject,
				hasReadonlyProps: false,
				isRef: false,
				dependencies: []
			};
			return {
				...getScalar({
					item: schemaObject,
					name,
					context: {
						...context,
						parents: [...context.parents ?? [], refValue]
					},
					formDataContext
				}),
				originalSchema: schemaObject,
				isRef: false
			};
		}
		if (formDataContext?.urlEncoded && isBinaryScalarSchema(schemaObject)) return {
			...getScalar({
				item: schemaObject,
				name,
				context,
				formDataContext
			}),
			originalSchema: schemaObject,
			isRef: false
		};
		const resolvedImport = imports[0];
		let hasReadonlyProps = false;
		const refName = resolvedImport.name;
		let effectiveContext = context;
		const refAnchor = schemaObject.$dynamicAnchor;
		if (typeof refAnchor === "string" && context.dynamicScope?.[refAnchor] && context.dynamicScope[refAnchor].name !== refName && !context.dynamicScope[refAnchor].isParameter && !context.dynamicScope[refAnchor].inlineSchema) {
			const scopeEntry = context.dynamicScope[refAnchor];
			const allOf = ((context.spec.components?.schemas)?.[scopeEntry.schemaName])?.allOf;
			if (!(Array.isArray(allOf) && allOf.some((el) => {
				if (!el || typeof el !== "object") return false;
				const rec = el;
				if (typeof rec.$ref !== "string" || !isComponentRef(rec.$ref)) return false;
				const { name } = getRefInfo(rec.$ref, context);
				return name === refName;
			}))) {
				const filteredScope = Object.fromEntries(Object.entries(context.dynamicScope).filter(([key]) => key !== refAnchor));
				effectiveContext = {
					...context,
					dynamicScope: filteredScope
				};
			}
		}
		if (!effectiveContext.parents?.includes(refName) && hasScopeAffectedDynamicRef(schemaObject, effectiveContext, refName)) return {
			...getScalar({
				item: schemaObject,
				name: name ?? refName,
				context: {
					...effectiveContext,
					parents: [...effectiveContext.parents ?? [], refName]
				},
				formDataContext
			}),
			originalSchema: schemaObject,
			isRef: false
		};
		if (!effectiveContext.parents?.includes(refName)) hasReadonlyProps = getScalar({
			item: schemaObject,
			name: refName,
			context: {
				...effectiveContext,
				parents: [...effectiveContext.parents ?? [], refName]
			}
		}).hasReadonlyProps;
		const isAnyOfNullable = schemaObject.anyOf?.some((anyOfItem) => !isReference(anyOfItem) && (anyOfItem.type === "null" || Array.isArray(anyOfItem.type) && anyOfItem.type.includes("null")));
		const schemaType = schemaObject.type;
		const nullable = Array.isArray(schemaType) && schemaType.includes("null") || schemaObject.nullable === true || isAnyOfNullable ? " | null" : "";
		return {
			value: resolvedImport.name + nullable,
			imports: [{
				name: resolvedImport.name,
				schemaName: resolvedImport.schemaName
			}],
			type: schemaObject.type ?? "object",
			schemas: [],
			isEnum: !!schemaObject.enum,
			originalSchema: schemaObject,
			hasReadonlyProps,
			isRef: true,
			dependencies: [resolvedImport.name]
		};
	}
	if (isDynamicReference(schema)) {
		const dynamicRef = schema.$dynamicRef;
		if (!dynamicRef.startsWith("#")) return makeUnknownValue(schema);
		const anchorName = getDynamicAnchorName(dynamicRef);
		if (!anchorName) return makeUnknownValue(schema);
		const { imports: resolvedImports, resolvedTypeName } = resolveDynamicRef(anchorName, context);
		if (resolvedTypeName === "unknown") return makeUnknownValue(schema);
		return {
			value: resolvedTypeName,
			imports: resolvedImports,
			type: "object",
			isEnum: false,
			schemas: [],
			isRef: true,
			hasReadonlyProps: false,
			originalSchema: schema,
			dependencies: [resolvedTypeName]
		};
	}
	return {
		...getScalar({
			item: schema,
			name,
			context,
			formDataContext
		}),
		originalSchema: schema,
		isRef: false
	};
}
//#endregion
//#region src/resolvers/object.ts
/**
* Wraps inline object type in a type alias.
* E.g. `{ foo: string }` → value becomes `FooBody`, schema gets `export type FooBody = { foo: string };`
*/
function createTypeAliasIfNeeded({ resolvedValue, propName, context }) {
	if (!propName) return;
	if (resolvedValue.isEnum || resolvedValue.type !== "object") return;
	const aliasPattern = context.output.override.aliasCombinedTypes ? String.raw`{|&|\|` : "{";
	if (!new RegExp(aliasPattern).test(resolvedValue.value)) return;
	const { originalSchema } = resolvedValue;
	const doc = jsDoc(originalSchema);
	const isConstant = "const" in originalSchema;
	const constantIsString = "type" in originalSchema && (originalSchema.type === "string" || Array.isArray(originalSchema.type) && originalSchema.type.includes("string"));
	const model = isConstant ? `${doc}export const ${propName} = ${constantIsString ? `'${originalSchema.const}'` : originalSchema.const} as const;\n` : `${doc}export type ${propName} = ${resolvedValue.value};\n`;
	return {
		value: propName,
		imports: [{
			name: propName,
			isConstant
		}],
		schemas: [...resolvedValue.schemas, {
			name: propName,
			model,
			imports: resolvedValue.imports,
			dependencies: resolvedValue.dependencies
		}],
		isEnum: false,
		type: "object",
		isRef: resolvedValue.isRef,
		hasReadonlyProps: resolvedValue.hasReadonlyProps,
		dependencies: resolvedValue.dependencies
	};
}
function resolveObjectOriginal({ schema, propName, combined = false, context, formDataContext }) {
	const resolvedValue = resolveValue({
		schema,
		name: propName,
		context,
		formDataContext
	});
	const aliased = createTypeAliasIfNeeded({
		resolvedValue,
		propName,
		context
	});
	if (aliased) return {
		...aliased,
		originalSchema: resolvedValue.originalSchema
	};
	if (propName && resolvedValue.isEnum && !combined && !resolvedValue.isRef) {
		const doc = jsDoc(resolvedValue.originalSchema);
		const enumValue = getEnum(resolvedValue.value, propName, getEnumNames(resolvedValue.originalSchema), context.output.override.enumGenerationType, getEnumDescriptions(resolvedValue.originalSchema), context.output.override.namingConvention.enum);
		return {
			value: propName,
			imports: [{ name: propName }],
			schemas: [...resolvedValue.schemas, {
				name: propName,
				model: doc + enumValue,
				imports: resolvedValue.imports,
				dependencies: resolvedValue.dependencies
			}],
			isEnum: false,
			type: "enum",
			originalSchema: resolvedValue.originalSchema,
			isRef: resolvedValue.isRef,
			hasReadonlyProps: resolvedValue.hasReadonlyProps,
			dependencies: [...resolvedValue.dependencies, propName]
		};
	}
	return resolvedValue;
}
const resolveObjectCacheMap = /* @__PURE__ */ new Map();
function resolveObject({ schema, propName, combined = false, context, formDataContext }) {
	const hashKey = JSON.stringify({
		schema,
		propName,
		combined,
		projectName: context.projectName ?? context.output.target,
		formDataContext,
		dynamicScope: context.dynamicScope
	});
	if (resolveObjectCacheMap.has(hashKey)) return resolveObjectCacheMap.get(hashKey);
	const result = resolveObjectOriginal({
		schema,
		propName,
		combined,
		context,
		formDataContext
	});
	resolveObjectCacheMap.set(hashKey, result);
	return result;
}
//#endregion
//#region src/getters/array.ts
/**
* Return the output type from an array
*
* @param item item with type === "array"
*/
function getArray({ schema, name, context, formDataContext }) {
	const schemaPrefixItems = schema.prefixItems;
	const schemaItems = schema.items;
	const schemaExample = schema.example;
	const schemaExamples = schema.examples;
	const itemSuffix = context.output.override.components.schemas.itemSuffix;
	if (schemaPrefixItems) {
		const resolvedObjects = schemaPrefixItems.map((item, index) => resolveObject({
			schema: item,
			propName: name ? name + itemSuffix + String(index) : void 0,
			context
		}));
		if (schemaItems) {
			const additional = resolveObject({
				schema: schemaItems,
				propName: name ? name + itemSuffix + "Additional" : void 0,
				context
			});
			resolvedObjects.push({
				...additional,
				value: `...${additional.value}[]`
			});
		}
		return {
			type: "array",
			isEnum: false,
			isRef: false,
			value: `[${resolvedObjects.map((o) => o.value).join(", ")}]`,
			imports: resolvedObjects.flatMap((o) => o.imports),
			schemas: resolvedObjects.flatMap((o) => o.schemas),
			dependencies: resolvedObjects.flatMap((o) => o.dependencies),
			hasReadonlyProps: resolvedObjects.some((o) => o.hasReadonlyProps),
			example: schemaExample,
			examples: resolveExampleRefs(schemaExamples, context)
		};
	}
	if (schemaItems) {
		const resolvedObject = resolveObject({
			schema: schemaItems,
			propName: name ? name + itemSuffix : void 0,
			context,
			formDataContext
		});
		return {
			value: `${schema.readOnly === true && !context.output.override.suppressReadonlyModifier ? "readonly " : ""}${resolvedObject.value.includes("|") || resolvedObject.value.includes("&") ? `(${resolvedObject.value})[]` : `${resolvedObject.value}[]`}`,
			imports: resolvedObject.imports,
			schemas: resolvedObject.schemas,
			dependencies: resolvedObject.dependencies,
			isEnum: false,
			type: "array",
			isRef: false,
			hasReadonlyProps: resolvedObject.hasReadonlyProps,
			example: schemaExample,
			examples: resolveExampleRefs(schemaExamples, context)
		};
	} else if (compareVersions(context.spec.openapi ?? "3.0.0", "3.1", ">=")) return {
		value: "unknown[]",
		imports: [],
		schemas: [],
		dependencies: [],
		isEnum: false,
		type: "array",
		isRef: false,
		hasReadonlyProps: false
	};
	else throw new Error(`All arrays must have an \`items\` key defined (name=${name}, schema=${JSON.stringify(schema)})`);
}
//#endregion
//#region src/getters/res-req-types.ts
const getSchemaType$1 = (s) => s.type;
const getSchemaCombined = (s) => s.oneOf ?? s.anyOf ?? s.allOf;
const getSchemaOneOf = (s) => s.oneOf;
const getSchemaAnyOf = (s) => s.anyOf;
const getSchemaItems = (s) => s.items;
const getSchemaRequired = (s) => s.required;
const getSchemaProperties = (s) => s.properties;
const resolveSchemaRef = (schema, context) => resolveRef(schema, context);
const resolveResponseOrRequestRef = (schema, context) => resolveRef(schema, context);
const formDataContentTypes = new Set(["multipart/form-data"]);
const formUrlEncodedContentTypes = new Set(["application/x-www-form-urlencoded"]);
function getResReqContentTypes({ mediaType, propName, context, isFormData, contentType }) {
	if (!mediaType.schema) return;
	const isFormUrlEncoded = formUrlEncodedContentTypes.has(contentType);
	const formDataContext = isFormData ? {
		atPart: false,
		encoding: mediaType.encoding ?? {}
	} : isFormUrlEncoded ? {
		atPart: false,
		encoding: mediaType.encoding ?? {},
		urlEncoded: true
	} : void 0;
	const resolvedObject = resolveObject({
		schema: mediaType.schema,
		propName,
		context,
		formDataContext
	});
	if (!isFormData && isBinaryContentType(contentType)) return {
		...resolvedObject,
		value: "Blob"
	};
	return resolvedObject;
}
function getResReqTypes(responsesOrRequests, name, context, defaultType = "unknown", uniqueKey = (item) => item.value) {
	return uniqueBy(responsesOrRequests.filter(([, res]) => Boolean(res)).map(([key, res]) => {
		if (isReference(res)) {
			const { schema: bodySchema, imports: [{ name, schemaName }] } = resolveResponseOrRequestRef(res, context);
			const firstEntry = Object.entries(bodySchema.content ?? {}).at(0);
			if (!firstEntry) return [{
				value: name,
				imports: [{
					name,
					schemaName
				}],
				schemas: [],
				type: "unknown",
				isEnum: false,
				isRef: true,
				hasReadonlyProps: false,
				dependencies: [name],
				originalSchema: void 0,
				example: void 0,
				examples: void 0,
				key,
				contentType: ""
			}];
			const [contentType, mediaType] = firstEntry;
			const isFormData = formDataContentTypes.has(contentType);
			const isFormUrlEncoded = formUrlEncodedContentTypes.has(contentType);
			if (!isFormData && !isFormUrlEncoded || !mediaType.schema) return [{
				value: name,
				imports: [{
					name,
					schemaName
				}],
				schemas: [],
				type: "unknown",
				isEnum: false,
				isRef: true,
				hasReadonlyProps: false,
				dependencies: [name],
				originalSchema: mediaType.schema,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context),
				key,
				contentType
			}];
			const formData = isFormData ? getSchemaFormDataAndUrlEncoded({
				name,
				schemaObject: mediaType.schema,
				context,
				isRequestBodyOptional: bodySchema.required !== true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const formUrlEncoded = isFormUrlEncoded ? getSchemaFormDataAndUrlEncoded({
				name,
				schemaObject: mediaType.schema,
				context,
				isRequestBodyOptional: bodySchema.required !== true,
				isUrlEncoded: true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const additionalImports = getFormDataAdditionalImports({
				schemaObject: mediaType.schema,
				context
			});
			return [{
				value: name,
				imports: [{
					name,
					schemaName
				}, ...additionalImports],
				schemas: [],
				type: "unknown",
				isEnum: false,
				hasReadonlyProps: false,
				dependencies: [name],
				formData,
				formUrlEncoded,
				isRef: true,
				originalSchema: mediaType.schema,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context),
				key,
				contentType
			}];
		}
		if (res.content) return Object.entries(res.content).map(([contentType, mediaType], index, arr) => {
			let propName = key ? pascal(name) + pascal(key) : void 0;
			if (propName && arr.length > 1) propName = propName + pascal(getNumberWord(index + 1));
			const isFormData = formDataContentTypes.has(contentType);
			const isFormUrlEncoded = formUrlEncodedContentTypes.has(contentType);
			let effectivePropName = propName;
			if (mediaType.schema && isReference(mediaType.schema)) {
				const { imports } = resolveSchemaRef(mediaType.schema, context);
				if (imports[0]?.name) effectivePropName = imports[0].name;
			} else if ((isFormData || isFormUrlEncoded) && mediaType.schema) {
				const combinedRefs = getSchemaOneOf(mediaType.schema) ?? getSchemaAnyOf(mediaType.schema);
				if (combinedRefs) {
					const names = [];
					for (const ref of combinedRefs) {
						if (!isReference(ref)) continue;
						const refName = resolveSchemaRef(ref, context).imports[0]?.name;
						if (refName) names.push(refName);
					}
					if (names.length > 0) effectivePropName = names.join("");
				}
			}
			const resolvedValue = getResReqContentTypes({
				mediaType,
				propName: effectivePropName,
				context,
				isFormData,
				contentType
			});
			if (!resolvedValue) {
				if (isBinaryContentType(contentType)) return {
					value: "Blob",
					imports: [],
					schemas: [],
					type: "Blob",
					isEnum: false,
					key,
					isRef: false,
					hasReadonlyProps: false,
					contentType
				};
				return;
			}
			if (!isFormData && !isFormUrlEncoded || !effectivePropName || !mediaType.schema) return {
				...resolvedValue,
				imports: resolvedValue.imports,
				dependencies: resolvedValue.dependencies,
				contentType,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context)
			};
			const formData = isFormData ? getSchemaFormDataAndUrlEncoded({
				name: effectivePropName,
				schemaObject: mediaType.schema,
				context,
				isRequestBodyOptional: res.required !== true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const formUrlEncoded = isFormUrlEncoded ? getSchemaFormDataAndUrlEncoded({
				name: effectivePropName,
				schemaObject: mediaType.schema,
				context,
				isUrlEncoded: true,
				isRequestBodyOptional: res.required !== true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const additionalImports = getFormDataAdditionalImports({
				schemaObject: mediaType.schema,
				context
			});
			return {
				...resolvedValue,
				imports: [...resolvedValue.imports, ...additionalImports],
				formData,
				formUrlEncoded,
				contentType,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context)
			};
		}).filter(Boolean).map((x) => ({
			...x,
			key
		}));
		const swaggerSchema = "schema" in res ? res.schema : void 0;
		if (swaggerSchema) return [{
			...resolveObject({
				schema: swaggerSchema,
				propName: key ? pascal(name) + pascal(key) : void 0,
				context
			}),
			contentType: "application/json",
			key
		}];
		return [{
			value: defaultType,
			imports: [],
			schemas: [],
			type: defaultType,
			isEnum: false,
			dependencies: [],
			key,
			isRef: false,
			hasReadonlyProps: false,
			contentType: "application/json"
		}];
	}).flat(), uniqueKey);
}
/**
* Determine the responseType option based on success content types only.
* This avoids error-response content types influencing the responseType.
*/
function getSuccessResponseType(response) {
	const successContentTypes = response.types.success.map((t) => t.contentType).filter(Boolean);
	if (response.isBlob) return "blob";
	const hasJsonResponse = successContentTypes.some((contentType) => contentType.includes("json") || contentType.includes("+json"));
	const hasTextResponse = successContentTypes.some((contentType) => contentType.startsWith("text/") || contentType.includes("xml"));
	if (!hasJsonResponse && hasTextResponse) return "text";
}
/**
* Determine the response type category for a given content type.
* Used to set the correct responseType option in HTTP clients.
*
* @param contentType - The MIME content type (e.g., 'application/json', 'text/plain')
* @returns The response type category to use for parsing
*/
function getResponseTypeCategory(contentType) {
	if (isBinaryContentType(contentType)) return "blob";
	if (contentType === "application/json" || contentType.includes("+json") || contentType.includes("-json")) return "json";
	return "text";
}
/**
* Get the default content type from a list of content types.
* Priority: application/json > any JSON-like type > first in list
*
* @param contentTypes - Array of content types from OpenAPI spec
* @returns The default content type to use
*/
function getDefaultContentType(contentTypes) {
	if (contentTypes.length === 0) return "application/json";
	if (contentTypes.includes("application/json")) return "application/json";
	const jsonType = contentTypes.find((ct) => ct.includes("+json") || ct.includes("-json"));
	if (jsonType) return jsonType;
	return contentTypes[0];
}
function getFormDataAdditionalImports({ schemaObject, context }) {
	const { schema } = resolveSchemaRef(schemaObject, context);
	if (schema.type !== "object") return [];
	const combinedSchemas = getSchemaOneOf(schema) ?? getSchemaAnyOf(schema);
	if (!combinedSchemas) return [];
	return combinedSchemas.map((subSchema) => resolveSchemaRef(subSchema, context).imports[0]).filter(Boolean);
}
function getSchemaFormDataAndUrlEncoded({ name, schemaObject, context, isRequestBodyOptional, isUrlEncoded, isRef, encoding }) {
	const { schema, imports } = resolveSchemaRef(schemaObject, context);
	const propName = camel(!isRef && isReference(schemaObject) ? imports[0].name : name);
	const variableName = isUrlEncoded ? "formUrlEncoded" : "formData";
	let form = isUrlEncoded ? `const ${variableName} = new URLSearchParams();\n` : `const ${variableName} = new FormData();\n`;
	const combinedSchemas = getSchemaCombined(schema);
	if (schema.type === "object" || schema.type === void 0 && combinedSchemas) {
		if (combinedSchemas) if (!!getSchemaOneOf(schema) || !!getSchemaAnyOf(schema)) {
			const directProperties = getSchemaProperties(schema);
			const directKeys = directProperties ? Object.entries(directProperties).filter(([, value]) => !resolveSchemaRef(value, context).schema.readOnly).map(([key]) => key) : [];
			const skipLine = directKeys.length > 0 ? `  if ([${directKeys.map((k) => JSON.stringify(k)).join(", ")}].includes(key)) return;\n` : "";
			form += `Object.entries(${propName} ?? {}).forEach(([key, value]) => {\n`;
			form += skipLine;
			form += `  if (value !== undefined && value !== null) {\n`;
			if (isUrlEncoded) {
				form += `    if (Array.isArray(value)) {\n`;
				form += `      value.forEach(v => {\n`;
				form += `        ${variableName}.append(key, typeof v === 'object' ? JSON.stringify(v) : String(v));\n`;
				form += `      });\n`;
				form += `    } else if (typeof value === 'object') {\n`;
				form += `      ${variableName}.append(key, JSON.stringify(value));\n`;
				form += `    } else {\n`;
				form += `      ${variableName}.append(key, String(value));\n`;
				form += `    }\n`;
			} else {
				form += `    if ((typeof File !== 'undefined' && value instanceof File) || value instanceof Blob) {\n`;
				form += `      ${variableName}.append(key, value);\n`;
				form += `    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {\n`;
				form += `      ${variableName}.append(key, new Blob([Uint8Array.from(value)]));\n`;
				form += `    } else if (Array.isArray(value)) {\n`;
				form += `      value.forEach(v => {\n`;
				form += `        if ((typeof File !== 'undefined' && v instanceof File) || v instanceof Blob) {\n`;
				form += `          ${variableName}.append(key, v);\n`;
				form += `        } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(v)) {\n`;
				form += `          ${variableName}.append(key, new Blob([Uint8Array.from(v)]));\n`;
				form += `        } else {\n`;
				form += `          ${variableName}.append(key, typeof v === 'object' ? JSON.stringify(v) : String(v));\n`;
				form += `        }\n`;
				form += `      });\n`;
				form += `    } else if (typeof value === 'object') {\n`;
				form += `      ${variableName}.append(key, JSON.stringify(value));\n`;
				form += `    } else {\n`;
				form += `      ${variableName}.append(key, String(value));\n`;
				form += `    }\n`;
			}
			form += `  }\n`;
			form += `});\n`;
		} else {
			const combinedSchemasFormData = combinedSchemas.map((subSchema) => {
				const { schema: combinedSchema } = resolveSchemaRef(subSchema, context);
				return resolveSchemaPropertiesToFormData({
					schema: combinedSchema,
					variableName,
					propName,
					context,
					isRequestBodyOptional,
					encoding
				});
			}).filter(Boolean).join("\n");
			form += combinedSchemasFormData;
		}
		if (schema.properties) {
			const formDataValues = resolveSchemaPropertiesToFormData({
				schema,
				variableName,
				propName,
				context,
				isRequestBodyOptional,
				encoding
			});
			form += formDataValues;
		}
		return form;
	}
	if (schema.type === "array") {
		let valueStr = "value";
		const schemaItems = getSchemaItems(schema);
		if (schemaItems) {
			const { schema: itemSchema } = resolveSchemaRef(schemaItems, context);
			if (itemSchema.type === "object" || itemSchema.type === "array") valueStr = "JSON.stringify(value)";
			else if (itemSchema.type === "number" || itemSchema.type === "integer" || itemSchema.type === "boolean") valueStr = "value.toString()";
		}
		return `${form}${propName}.forEach(value => ${variableName}.append('data', ${valueStr}))\n`;
	}
	if (schema.type === "number" || schema.type === "integer" || schema.type === "boolean") return `${form}${variableName}.append('data', ${propName}.toString())\n`;
	return `${form}${variableName}.append('data', ${propName})\n`;
}
function resolveSchemaPropertiesToFormData({ schema, variableName, propName, context, isRequestBodyOptional, keyPrefix = "", depth = 0, encoding }) {
	let formDataValues = "";
	const isUrlEncoded = variableName === "formUrlEncoded";
	const schemaProps = getSchemaProperties(schema) ?? {};
	for (const [key, value] of Object.entries(schemaProps)) {
		const { schema: property } = resolveSchemaRef(value, context);
		if (property.readOnly) continue;
		let formDataValue = "";
		const partContentType = (depth === 0 ? encoding?.[key] : void 0)?.contentType;
		const formattedKeyPrefix = isRequestBodyOptional ? keyword.isIdentifierNameES5(key) ? "?" : "?." : "";
		const formattedKey = keyword.isIdentifierNameES5(key) ? `.${key}` : `['${key}']`;
		const valueKey = `${propName}${formattedKeyPrefix}${formattedKey}`;
		const nonOptionalValueKey = `${propName}${formattedKey}`;
		const fileType = getFormDataFieldFileType(property, partContentType);
		const effectiveContentType = partContentType ?? property.contentMediaType;
		if (isUrlEncoded && (fileType || property.format === "binary")) formDataValue = `${variableName}.append(\`${keyPrefix}${key}\`, ${nonOptionalValueKey});\n`;
		else if (fileType === "binary" || property.format === "binary") formDataValue = `${variableName}.append(\`${keyPrefix}${key}\`, ${nonOptionalValueKey});\n`;
		else if (fileType === "text") formDataValue = `${variableName}.append(\`${keyPrefix}${key}\`, ${nonOptionalValueKey} instanceof Blob ? ${nonOptionalValueKey} : new Blob([${nonOptionalValueKey}], { type: '${effectiveContentType}' }));\n`;
		else if (property.type === "object" || Array.isArray(property.type) && property.type.includes("object")) formDataValue = context.output.override.formData.arrayHandling === FormDataArrayHandling.EXPLODE ? resolveSchemaPropertiesToFormData({
			schema: property,
			variableName,
			propName: nonOptionalValueKey,
			context,
			isRequestBodyOptional,
			keyPrefix: `${keyPrefix}${key}.`,
			depth: depth + 1,
			encoding
		}) : `${variableName}.append(\`${keyPrefix}${key}\`, JSON.stringify(${nonOptionalValueKey}));\n`;
		else if (property.type === "array" || Array.isArray(property.type) && property.type.includes("array")) {
			let valueStr = "value";
			let hasNonPrimitiveChild = false;
			const propertyItems = getSchemaItems(property);
			if (propertyItems) {
				const { schema: itemSchema } = resolveSchemaRef(propertyItems, context);
				if (itemSchema.type === "object" || itemSchema.type === "array") if (context.output.override.formData.arrayHandling === FormDataArrayHandling.EXPLODE) {
					hasNonPrimitiveChild = true;
					const resolvedValue = resolveSchemaPropertiesToFormData({
						schema: itemSchema,
						variableName,
						propName: "value",
						context,
						isRequestBodyOptional,
						keyPrefix: `${keyPrefix}${key}[\${index${depth > 0 ? depth : ""}}].`,
						depth: depth + 1
					});
					formDataValue = `${valueKey}.forEach((value, index${depth > 0 ? depth : ""}) => {
    ${resolvedValue}});\n`;
				} else valueStr = "JSON.stringify(value)";
				else {
					const itemType = getSchemaType$1(itemSchema);
					if (itemType === "number" || Array.isArray(itemType) && itemType.includes("number") || itemType === "integer" || Array.isArray(itemType) && itemType.includes("integer") || itemType === "boolean" || Array.isArray(itemType) && itemType.includes("boolean")) valueStr = "value.toString()";
				}
			}
			if (context.output.override.formData.arrayHandling === FormDataArrayHandling.EXPLODE) {
				if (!hasNonPrimitiveChild) formDataValue = `${valueKey}.forEach((value, index${depth > 0 ? depth : ""}) => ${variableName}.append(\`${keyPrefix}${key}[\${index${depth > 0 ? depth : ""}}]\`, ${valueStr}));\n`;
			} else formDataValue = `${valueKey}.forEach(value => ${variableName}.append(\`${keyPrefix}${key}${context.output.override.formData.arrayHandling === FormDataArrayHandling.SERIALIZE_WITH_BRACKETS ? "[]" : ""}\`, ${valueStr}));\n`;
		} else if ((() => {
			const propType = getSchemaType$1(property);
			return propType === "number" || Array.isArray(propType) && propType.includes("number") || propType === "integer" || Array.isArray(propType) && propType.includes("integer") || propType === "boolean" || Array.isArray(propType) && propType.includes("boolean");
		})()) formDataValue = `${variableName}.append(\`${keyPrefix}${key}\`, ${nonOptionalValueKey}.toString())\n`;
		else formDataValue = `${variableName}.append(\`${keyPrefix}${key}\`, ${nonOptionalValueKey});\n`;
		let existSubSchemaNullable = false;
		const combine = getSchemaCombined(property);
		if (combine) {
			const subSchemas = combine.map((c) => resolveObject({
				schema: c,
				combined: true,
				context
			}));
			if (subSchemas.some((subSchema) => {
				return [
					"number",
					"integer",
					"boolean"
				].includes(subSchema.type);
			})) formDataValue = `${variableName}.append(\`${key}\`, ${nonOptionalValueKey}.toString())\n`;
			if (subSchemas.some((subSchema) => {
				return subSchema.type === "null";
			})) existSubSchemaNullable = true;
		}
		const isRequired = getSchemaRequired(schema)?.includes(key) && !isRequestBodyOptional;
		const propType = getSchemaType$1(property);
		if (property.nullable || Array.isArray(propType) && propType.includes("null") || existSubSchemaNullable) {
			if (isRequired) {
				formDataValues += `if(${valueKey} !== null) {\n ${formDataValue} }\n`;
				continue;
			}
			formDataValues += `if(${valueKey} !== undefined && ${nonOptionalValueKey} !== null) {\n ${formDataValue} }\n`;
			continue;
		}
		if (isRequired) {
			formDataValues += formDataValue;
			continue;
		}
		formDataValues += `if(${valueKey} !== undefined) {\n ${formDataValue} }\n`;
	}
	return formDataValues;
}
//#endregion
//#region src/getters/body.ts
function buildBody(filteredBodyTypes, requestBody, operationName, context) {
	const imports = filteredBodyTypes.flatMap(({ imports }) => imports);
	const schemas = filteredBodyTypes.flatMap(({ schemas }) => schemas);
	const definition = filteredBodyTypes.map(({ value }) => value).join(" | ");
	const nonReadonlyDefinition = filteredBodyTypes.some((x) => x.hasReadonlyProps) && definition && context.output.override.preserveReadonlyRequestBodies !== "preserve" ? `NonReadonly<${definition}>` : definition;
	let implementation = generalJSTypesWithArray.includes(definition.toLowerCase()) || filteredBodyTypes.length > 1 ? camel(operationName) + context.output.override.components.requestBodies.suffix : camel(definition);
	const overrideName = getRequestBodyExtensionName(requestBody, context);
	if (overrideName) implementation = camel(overrideName);
	let isOptional = false;
	if (implementation) {
		implementation = sanitize(implementation, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		if (isReference(requestBody)) {
			const { schema: bodySchema } = resolveRef(requestBody, context);
			isOptional = bodySchema.required !== true;
		} else isOptional = requestBody.required !== true;
	}
	return {
		originalSchema: requestBody,
		definition: nonReadonlyDefinition,
		implementation,
		imports,
		schemas,
		isOptional,
		...filteredBodyTypes.length === 1 ? {
			formData: filteredBodyTypes[0].formData,
			formUrlEncoded: filteredBodyTypes[0].formUrlEncoded,
			contentType: filteredBodyTypes[0].contentType
		} : {
			formData: "",
			formUrlEncoded: "",
			contentType: ""
		}
	};
}
function getBody({ requestBody, operationName, context, contentType }) {
	return buildBody(filterByContentType(getResReqTypes([[context.output.override.components.requestBodies.suffix, requestBody]], operationName, context), contentType), requestBody, operationName, context);
}
/**
* Returns per-content-type bodies when `splitByContentType` is enabled.
* Each entry includes a `contentTypeSuffix` for generating distinct function names.
*/
function getBodiesByContentType({ requestBody, operationName, context, contentType }) {
	const filteredBodyTypes = filterByContentType(getResReqTypes([[context.output.override.components.requestBodies.suffix, requestBody]], operationName, context, void 0, (item) => `${item.value}::${item.contentType}`), contentType);
	if (filteredBodyTypes.length <= 1) return [{
		...buildBody(filteredBodyTypes, requestBody, operationName, context),
		contentTypeSuffix: ""
	}];
	return filteredBodyTypes.map((bodyType) => {
		const suffix = getContentTypeSuffix(bodyType.contentType);
		return {
			...buildBody([bodyType], requestBody, operationName, context),
			contentTypeSuffix: suffix
		};
	});
}
function getRequestBodyExtensionName(requestBody, context) {
	let value;
	if (isReference(requestBody)) {
		const { schema } = resolveRef(requestBody, context);
		value = schema?.["x-codegen-request-body-name"];
	} else value = requestBody?.["x-codegen-request-body-name"];
	return typeof value === "string" ? value : void 0;
}
const CONTENT_TYPE_SUFFIX_MAP = {
	"application/json": "Json",
	"multipart/form-data": "FormData",
	"application/x-www-form-urlencoded": "UrlEncoded",
	"text/plain": "Text",
	"application/xml": "Xml",
	"text/xml": "Xml",
	"application/octet-stream": "Blob"
};
function getContentTypeSuffix(contentType) {
	if (CONTENT_TYPE_SUFFIX_MAP[contentType]) return CONTENT_TYPE_SUFFIX_MAP[contentType];
	return (contentType.split("/")[1] ?? contentType).split(/[-+.]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
//#endregion
//#region src/getters/discriminators.ts
function resolveDiscriminators(schemas, context) {
	const transformedSchemas = schemas;
	for (const schema of Object.values(transformedSchemas)) {
		if (isBoolean$1(schema)) continue;
		const discriminator = schema.discriminator;
		if (!schema.oneOf && isArray(discriminator?.oneOf)) schema.oneOf = discriminator.oneOf;
		if (schema.discriminator?.mapping) {
			const { mapping, propertyName } = schema.discriminator;
			for (const [mappingKey, mappingValue] of Object.entries(mapping)) {
				let subTypeSchema;
				try {
					const { originalName } = getRefInfo(mappingValue, context);
					subTypeSchema = transformedSchemas[pascal(originalName)] ?? transformedSchemas[originalName];
				} catch {
					subTypeSchema = transformedSchemas[mappingValue];
				}
				if (!subTypeSchema || isBoolean$1(subTypeSchema) || propertyName === void 0) continue;
				const property = subTypeSchema.properties?.[propertyName];
				if (isBoolean$1(property)) continue;
				const schemaProperty = property && !isReference(property) ? property : void 0;
				const enumProperty = schemaProperty ? getPropertySafe(schemaProperty, "enum") : {
					hasProperty: false,
					value: void 0
				};
				const enumValues = enumProperty.hasProperty && Array.isArray(enumProperty.value) ? enumProperty.value : void 0;
				const propertyType = schemaProperty?.type ?? "string";
				let typedMappingKey = mappingKey;
				if (propertyType === "boolean") typedMappingKey = mappingKey === "true";
				else if (propertyType === "number" || propertyType === "integer") {
					const parsed = Number(mappingKey);
					if (!Number.isNaN(parsed)) typedMappingKey = parsed;
				}
				const mergedEnumValues = [...(enumValues ?? []).filter((value) => value !== typedMappingKey), typedMappingKey];
				const mergedProperty = {
					...schemaProperty,
					type: propertyType,
					enum: mergedEnumValues
				};
				delete mergedProperty.const;
				subTypeSchema.properties = {
					...subTypeSchema.properties,
					[propertyName]: mergedProperty
				};
				subTypeSchema.required = [...new Set([...subTypeSchema.required ?? [], propertyName])];
			}
		}
	}
	for (const [parentName, parentSchema] of Object.entries(transformedSchemas)) {
		if (isBoolean$1(parentSchema)) continue;
		const variants = parentSchema.oneOf ?? parentSchema.anyOf;
		if (!variants || !parentSchema.discriminator) continue;
		const { propertyName, mapping } = parentSchema.discriminator;
		if (!propertyName) continue;
		const mappedRefs = mapping ? Object.values(mapping) : [];
		const variantArrayRefs = variants.filter((item) => isReference(item) && typeof item.$ref === "string").map((item) => item.$ref);
		const variantRefs = [...new Set([...mappedRefs, ...variantArrayRefs])];
		const parentProperties = parentSchema.properties;
		const parentRequired = parentSchema.required;
		const inheritableProps = {};
		if (parentProperties) {
			for (const [key, value] of Object.entries(parentProperties)) if (key !== propertyName) inheritableProps[key] = value;
		}
		const inheritableRequired = parentRequired?.filter((key) => key !== propertyName);
		const hasInheritableProps = Object.keys(inheritableProps).length > 0;
		for (const mappingValue of variantRefs) {
			let variantSchema;
			try {
				const { originalName } = getRefInfo(mappingValue, context);
				variantSchema = transformedSchemas[pascal(originalName)] ?? transformedSchemas[originalName];
			} catch {
				variantSchema = transformedSchemas[mappingValue];
			}
			if (!variantSchema || isBoolean$1(variantSchema)) continue;
			const variantAllOf = variantSchema.allOf;
			if (!variantAllOf) continue;
			const rewritten = [];
			for (const item of variantAllOf) {
				if (!isReference(item) || !item.$ref) {
					rewritten.push(item);
					continue;
				}
				let refOriginalName;
				try {
					refOriginalName = getRefInfo(item.$ref, context).originalName;
				} catch {
					refOriginalName = void 0;
				}
				if (!(refOriginalName === parentName || refOriginalName !== void 0 && pascal(refOriginalName) === pascal(parentName))) {
					rewritten.push(item);
					continue;
				}
				const inlinedParent = { ...parentSchema };
				delete inlinedParent.oneOf;
				delete inlinedParent.discriminator;
				delete inlinedParent.allOf;
				delete inlinedParent.anyOf;
				if (hasInheritableProps) inlinedParent.properties = { ...inheritableProps };
				else delete inlinedParent.properties;
				if (inheritableRequired && inheritableRequired.length > 0) inlinedParent.required = [...inheritableRequired];
				else delete inlinedParent.required;
				if (Object.keys(inlinedParent).filter((key) => key !== "type").length > 0) rewritten.push(inlinedParent);
			}
			if (rewritten.length === 0) delete variantSchema.allOf;
			else variantSchema.allOf = rewritten;
		}
	}
	return transformedSchemas;
}
//#endregion
//#region src/getters/operation.ts
function getOperationId(operation, route, verb) {
	if (isString(operation.operationId)) return operation.operationId;
	return pascal([verb, ...route.split("/").map((p) => sanitize(p, {
		dash: true,
		underscore: "-",
		dot: "-",
		whitespace: "-"
	}))].join("-"));
}
//#endregion
//#region src/getters/parameters.ts
function getParameters({ parameters, context }) {
	const result = {
		path: [],
		query: [],
		header: []
	};
	for (const p of parameters) if (isReference(p)) {
		const { schema, imports } = resolveRef(p, context);
		const parameter = schema;
		const location = parameter.in;
		if (location === "path" || location === "query" || location === "header") {
			const safeImports = p.$ref && isComponentRef(p.$ref) ? imports : [];
			result[location].push({
				parameter,
				imports: safeImports
			});
		}
	} else if (p.in === "query" || p.in === "path" || p.in === "header") result[p.in].push({
		parameter: p,
		imports: []
	});
	for (const location of [
		"path",
		"query",
		"header"
	]) result[location] = [...new Map(result[location].map((entry) => [location === "header" ? entry.parameter.name?.toLowerCase() : entry.parameter.name, entry])).values()];
	return result;
}
//#endregion
//#region src/getters/route.ts
function isBaseUrlRuntime(baseUrl) {
	return isObject(baseUrl) && "runtime" in baseUrl && typeof baseUrl.runtime === "string";
}
/**
* Wraps a runtime expression for generated URL template literals.
* Pass the expression only (e.g. `process.env.API_BASE_URL`), not a `${...}` fragment.
*/
function runtimeExpressionToUrlPrefix(expression) {
	const t = expression.trim();
	if (!t) return "";
	return "${" + t + "}";
}
const PATH_PARAM_REGEX = /(?<!\$)\{([\w.*-]+)\}/g;
const ensureLeadingSlash = (path) => path && !path.startsWith("/") ? `/${path}` : path;
/**
* Sanitizes an OpenAPI path-parameter name while preserving the spec's
* spelling: keeps word characters, underscores, dashes and dots, strips
* everything else, and prefixes ES5 keywords with an underscore. Use this
* when the emitted name must match the spec (e.g. Hono routes).
*/
const sanitizePathParamName = (name) => sanitize(name, {
	es5keyword: true,
	underscore: true,
	dash: true,
	dot: true
});
/**
* Derives the generated JS identifier for an OpenAPI path-parameter name
* (`scope.id` → `scopeId`, `_id` → `id`, `class` → `_class`). This is the
* single source of truth for param variable names: the emitted route
* interpolations, the generated function arguments and the spec-parameter
* matching must all agree on it.
*/
const camelPathParamName = (name) => sanitize(camel(name), { es5keyword: true });
/**
* Converts every `{param}` in an OpenAPI path to `:param` (Hono/MSW style
* routes). `formatParamName` maps the raw OpenAPI parameter name to the
* emitted one (`sanitizePathParamName` or `camelPathParamName`).
*/
const toColonRoutePath = (path, formatParamName) => ensureLeadingSlash(path).replaceAll(PATH_PARAM_REGEX, (_, name) => `:${formatParamName(name)}`);
const esc = (str) => jsesc(str, {
	quotes: "backtick",
	wrap: false
});
/**
* Converts an OpenAPI path (`{param}`) to a template-literal route (`${param}`),
* escaping static text with jsesc for safe embedding in backtick strings.
* The `route` arg must be a raw OpenAPI path; a non-empty route always emits
* with a leading `/`.
*/
function getRoute(route) {
	return ensureLeadingSlash(route).split(PATH_PARAM_REGEX).map((part, i) => i % 2 ? `\${${camelPathParamName(part)}}` : esc(part)).join("");
}
/**
* Prepends a base URL to an already-processed route.
*
* `route` must be the output of {@link getRoute} (already escaped for template
* literals). This function does NOT re-escape it — jsesc is not idempotent, so
* escaping twice would double the backslashes. Only the server URL from
* `getBaseUrlFromSpecification` is escaped here, after variable substitution.
*/
function getFullRoute(route, servers, baseUrl) {
	const getBaseUrl = () => {
		if (!baseUrl) return "";
		if (isString(baseUrl)) return baseUrl;
		if (isBaseUrlRuntime(baseUrl)) return runtimeExpressionToUrlPrefix(baseUrl.runtime);
		if (baseUrl.getBaseUrlFromSpecification) {
			if (!servers) throw new Error("Orval is configured to use baseUrl from the specifications 'servers' field, but there exist no servers in the specification.");
			const server = servers.at(Math.min(baseUrl.index ?? 0, servers.length - 1));
			if (!server) return "";
			const serverUrl = server.url ?? "";
			if (!server.variables) return jsesc(serverUrl, {
				quotes: "backtick",
				wrap: false
			});
			let url = serverUrl;
			const variables = baseUrl.variables;
			for (const variableKey of Object.keys(server.variables)) {
				const variable = server.variables[variableKey];
				if (variables?.[variableKey]) {
					if (variable.enum && !variable.enum.some((e) => e == variables[variableKey])) throw new Error(`Invalid variable value '${variables[variableKey]}' for variable '${variableKey}' when resolving ${serverUrl}. Valid values are: ${variable.enum.join(", ")}.`);
					url = url.replaceAll(`{${variableKey}}`, variables[variableKey]);
				} else url = url.replaceAll(`{${variableKey}}`, String(variable.default));
			}
			return jsesc(url, {
				quotes: "backtick",
				wrap: false
			});
		}
		return baseUrl.baseUrl;
	};
	let fullRoute = route;
	const base = getBaseUrl();
	if (base) {
		if (base.endsWith("/") && route.startsWith("/")) fullRoute = route.slice(1);
		fullRoute = `${base}${fullRoute}`;
	}
	return fullRoute;
}
/**
* Returns `GeneratorImport` entries for {@link BaseUrlRuntime.imports} when `baseUrl` is a runtime config.
*
* Defaults `values` to true so symbols in `runtime` emit as value imports in the
* generated client. Set `values: false` explicitly only for unusual cases (e.g.
* type-only symbols referenced from the expression).
*/
function getBaseUrlRuntimeImports(baseUrl) {
	if (!baseUrl) return [];
	if (!isBaseUrlRuntime(baseUrl)) return [];
	return (baseUrl.imports ?? []).map((imp) => ({
		...imp,
		values: imp.values ?? true
	}));
}
const wrapRouteParameters = (route, prepend, append) => route.replaceAll(TEMPLATE_TAG_REGEX, `\${${prepend}$1${append}}`);
const makeRouteSafe = (route) => wrapRouteParameters(route, "encodeURIComponent(String(", "))");
function getRouteAsArray(route) {
	return route.split("/").filter((i) => i !== "").flatMap((segment) => {
		if (!segment.includes("${")) return [`'${segment.replaceAll("'", "\\'")}'`];
		return segment.split(/(?<!\\)(\$\{.+?\})/g).filter(Boolean).map((part) => {
			const match = /^(?<!\\)\$\{(.+?)\}$/.exec(part);
			return match ? match[1] : `'${part.replaceAll("'", "\\'")}'`;
		});
	}).join(",");
}
//#endregion
//#region src/getters/params.ts
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
function getParamsInPath(path) {
	let n;
	const output = [];
	const templatePathRegex = /\{(.*?)\}/g;
	while ((n = templatePathRegex.exec(path)) !== null) output.push(n[1]);
	return output;
}
/**
* Resolves a route placeholder to its single matching spec path parameter.
* `identifier` already is the generated JS identifier (it comes from the
* processed route), so we re-derive the same identifier from each spec name via
* `camelPathParamName` to match. Throws when two spec names collapse onto the
* same identifier, or when none match.
*/
function resolvePathParam(identifier, pathParams, operationId) {
	const matching = pathParams.filter(({ parameter }) => camelPathParamName(parameter.name ?? "") === identifier);
	if (matching.length > 1) {
		const names = matching.map(({ parameter }) => `'${parameter.name}'`).join(", ");
		throw new Error(`Path parameters ${names} all map to the same generated identifier '${identifier}' (${operationId}). Rename them so they don't collide.`);
	}
	const pathParam = matching[0];
	if (!pathParam) throw new Error(`The path params ${identifier} can't be found in parameters (${operationId})`);
	return pathParam;
}
function getParams({ route, pathParams = [], operationId, context, output }) {
	return getParamsInPath(route).map((p) => {
		const { name: nameWithoutSanitize, required = false, schema } = resolvePathParam(p, pathParams, operationId).parameter;
		const name = camelPathParamName(nameWithoutSanitize ?? "");
		if (!schema) return {
			name,
			definition: `${name}${required ? "" : "?"}: unknown`,
			implementation: `${name}${required ? "" : "?"}: unknown`,
			default: false,
			required,
			imports: []
		};
		const resolvedValue = resolveValue({
			schema,
			context
		});
		const originalSchema = resolvedValue.originalSchema;
		const schemaDefault = originalSchema.default;
		let paramType = resolvedValue.value;
		if (output.allParamsOptional) paramType = `${paramType} | undefined | null`;
		return {
			name,
			definition: `${name}${!required || schemaDefault ? "?" : ""}: ${paramType}`,
			implementation: `${name}${!required && !schemaDefault ? "?" : ""}${schemaDefault ? `: ${paramType} = ${stringify(schemaDefault)}` : `: ${paramType}`}`,
			default: schemaDefault,
			required,
			imports: resolvedValue.imports,
			originalSchema
		};
	});
}
//#endregion
//#region src/getters/props.ts
function getProps({ body, queryParams, params, operationName, headers, context }) {
	const bodyProp = {
		name: body.implementation,
		definition: `${body.implementation}${body.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${body.definition}`,
		implementation: `${body.implementation}${body.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${body.definition}`,
		default: false,
		required: !body.isOptional || context.output.optionsParamRequired,
		type: GetterPropType.BODY
	};
	const queryParamsProp = {
		name: "params",
		definition: getQueryParamDefinition(queryParams, context),
		implementation: getQueryParamDefinition(queryParams, context),
		default: false,
		required: isNullish(queryParams?.isOptional) ? !context.output.allParamsOptional || context.output.optionsParamRequired : !queryParams.isOptional && !context.output.allParamsOptional || context.output.optionsParamRequired,
		type: GetterPropType.QUERY_PARAM
	};
	const headersProp = {
		name: "headers",
		definition: `headers${headers?.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${headers?.schema.name}`,
		implementation: `headers${headers?.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${headers?.schema.name}`,
		default: false,
		required: isNullish(headers?.isOptional) ? false : !headers.isOptional || context.output.optionsParamRequired,
		type: GetterPropType.HEADER
	};
	let paramGetterProps;
	if (context.output.override.useNamedParameters && params.length > 0) {
		const parameterTypeName = `${pascal(operationName)}PathParameters`;
		const name = "pathParams";
		const namedParametersTypeDefinition = `export type ${parameterTypeName} = {\n ${params.map((property) => property.definition).join(",\n    ")},\n }`;
		const isOptional = context.output.optionsParamRequired || params.every((param) => param.default !== void 0);
		const implementation = `{ ${params.map((property) => property.default === void 0 ? property.name : `${property.name} = ${stringify(property.default)}`).join(", ")} }: ${parameterTypeName}${isOptional ? " = {}" : ""}`;
		const destructured = `{ ${params.map((property) => property.name).join(", ")} }`;
		paramGetterProps = [{
			type: GetterPropType.NAMED_PATH_PARAMS,
			name,
			definition: `${name}: ${parameterTypeName}`,
			implementation,
			default: false,
			destructured,
			required: true,
			schema: {
				name: parameterTypeName,
				model: namedParametersTypeDefinition,
				imports: params.flatMap((property) => property.imports)
			}
		}];
	} else paramGetterProps = params.map((param) => ({
		...param,
		type: GetterPropType.PARAM
	}));
	return sortByPriority([
		...paramGetterProps,
		...body.definition ? [bodyProp] : [],
		...queryParams ? [queryParamsProp] : [],
		...headers ? [headersProp] : []
	]);
}
function getQueryParamDefinition(queryParams, context) {
	const paramType = queryParams?.schema.name;
	return `params${(queryParams?.isOptional || context.output.allParamsOptional) && !context.output.optionsParamRequired ? "?" : ""}: ${paramType}`;
}
//#endregion
//#region src/getters/query-params.ts
const isOpenApiSchemaObject = (value) => {
	if (!value || typeof value !== "object") return false;
	return !("$ref" in value);
};
/**
* A `$ref` schema object (e.g. array `items` or a oneOf/anyOf/allOf variant
* pointing at a component). We don't resolve the reference here, but a query
* parameter behind a `$ref` is virtually always a complex (object-like) type,
* so it must be treated as non-primitive. Over-flagging is harmless: the only
* consumer (the Angular `nonPrimitiveKeys` passthrough) is gated on a
* configured `paramsSerializer`, which is precisely what handles raw values.
*/
const isRefObject = (value) => !!value && typeof value === "object" && "$ref" in value;
const getSchemaType = (schema) => {
	const type = schema.type;
	if (typeof type === "string") return type;
	if (Array.isArray(type) && type.every((variant) => typeof variant === "string")) return type;
};
/**
* Detects whether a query parameter's resolved schema is non-primitive — i.e.
* an object, an array of objects, or a composition (oneOf/anyOf/allOf) that
* resolves to a non-primitive shape.
*
* Used by Angular generators so the default `filterParams` helper preserves
* such values instead of silently dropping them. Angular's `HttpParams` only
* accepts primitives, but a user-provided `paramsSerializer`, `mutator`, or
* `paramsFilter` may need the raw object to flatten or stringify it.
*/
const isSchemaNonPrimitive = (schema) => {
	const schemaType = getSchemaType(schema);
	const type = Array.isArray(schemaType) ? schemaType.filter((variant) => variant !== "null") : schemaType;
	const additionalProperties = schema.additionalProperties;
	if (type === "object") return true;
	if (Array.isArray(type) && type.includes("object")) return true;
	if (type === "array" || Array.isArray(type) && type.includes("array")) {
		const items = schema.items;
		if (isOpenApiSchemaObject(items)) return isSchemaNonPrimitive(items);
		return true;
	}
	const compositions = [
		...Array.isArray(schema.oneOf) ? schema.oneOf : [],
		...Array.isArray(schema.anyOf) ? schema.anyOf : [],
		...Array.isArray(schema.allOf) ? schema.allOf : []
	];
	if (compositions.length > 0) return compositions.some((variant) => isOpenApiSchemaObject(variant) ? isSchemaNonPrimitive(variant) : isRefObject(variant));
	if (!type && (schema.properties !== void 0 || additionalProperties !== void 0 && additionalProperties !== false)) return true;
	return false;
};
/**
* Detects whether a query parameter's resolved schema is a plain object —
* i.e. serializable per OpenAPI's `style`/`explode` object rules (form/
* deepObject). Unlike {@link isSchemaNonPrimitive}, arrays (including arrays
* of objects) are explicitly excluded: OpenAPI defines no style/explode
* object-serialization for them, so they stay on the existing
* passthrough/drop path.
*
* Used to compute {@link GetterQueryParam.objectQueryParams}. See issue #3705.
*/
const isPlainObjectSchema = (schema) => {
	const schemaType = getSchemaType(schema);
	const type = Array.isArray(schemaType) ? schemaType.filter((variant) => variant !== "null") : schemaType;
	const additionalProperties = schema.additionalProperties;
	if (type === "object") return true;
	if (Array.isArray(type) && type.includes("object")) return true;
	if (type === "array" || Array.isArray(type) && type.includes("array")) return false;
	const compositions = [
		...Array.isArray(schema.oneOf) ? schema.oneOf : [],
		...Array.isArray(schema.anyOf) ? schema.anyOf : [],
		...Array.isArray(schema.allOf) ? schema.allOf : []
	];
	if (compositions.length > 0) return compositions.some((variant) => isOpenApiSchemaObject(variant) && isPlainObjectSchema(variant));
	if (!type && (schema.properties !== void 0 || additionalProperties !== void 0 && additionalProperties !== false)) return true;
	return false;
};
/**
* Derives the object-serialization strategy for a query parameter from its
* declared `style`/`explode`, following the OpenAPI defaults (`style: form`,
* `explode: true` for `form`). Returns `undefined` for parameters that are
* not plain-object schemas or that are defined via `content:` (their
* spec-correct encoding is a JSON string — a separate follow-up). See issue
* #3705.
*/
const getObjectQueryParamStrategy = (parameter, schema, isContentBased) => {
	if (isContentBased || !schema || !isPlainObjectSchema(schema)) return;
	const { style, explode } = parameter;
	if (style === "deepObject") return "deepObject";
	return explode ?? (style ?? "form") === "form" ? "flatten" : "comma";
};
const isSchemaNullable = (schema) => {
	if (schema.nullable === true) return true;
	if (schema.type === "null") return true;
	if (Array.isArray(schema.type) && schema.type.includes("null")) return true;
	const oneOfVariants = Array.isArray(schema.oneOf) ? schema.oneOf : [];
	const anyOfVariants = Array.isArray(schema.anyOf) ? schema.anyOf : [];
	return [...oneOfVariants, ...anyOfVariants].some((variant) => {
		if (!isOpenApiSchemaObject(variant)) return false;
		return isSchemaNullable(variant);
	});
};
function getQueryParamsTypes(queryParams, operationName, context) {
	return queryParams.map(({ parameter, imports: parameterImports }) => {
		const { name, required, schema: schemaParam, content } = parameter;
		const queryName = sanitize(`${pascal(operationName)}${pascal(name)}`, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		const schema = schemaParam ?? content?.["application/json"]?.schema;
		if (!schema) throw new Error(`Query parameter "${name}" has no schema or content definition`);
		const resolvedValue = resolveValue({
			schema,
			context,
			name: queryName
		});
		const objectStrategy = getObjectQueryParamStrategy(parameter, resolvedValue.originalSchema, schemaParam === void 0);
		const key = getKey(name);
		const schemaForDoc = schema;
		const doc = jsDoc({
			description: parameter.description,
			...schemaForDoc
		}, void 0, context);
		if (parameterImports.length > 0) return {
			name,
			required,
			definition: `${doc}${key}${!required || schema.default ? "?" : ""}: ${parameterImports[0].name};`,
			imports: parameterImports,
			schemas: [],
			originalSchema: resolvedValue.originalSchema,
			objectStrategy
		};
		if (resolvedValue.isEnum && !resolvedValue.isRef) {
			const enumName = queryName;
			const parameterAsSchema = parameter;
			const enumValue = getEnum(resolvedValue.value, enumName, getEnumNames(resolvedValue.originalSchema) ?? getEnumNames(parameterAsSchema), context.output.override.enumGenerationType, getEnumDescriptions(resolvedValue.originalSchema) ?? getEnumDescriptions(parameterAsSchema), context.output.override.namingConvention.enum);
			return {
				name,
				required,
				definition: `${doc}${key}${!required || schema.default ? "?" : ""}: ${enumName};`,
				imports: [{ name: enumName }],
				schemas: [...resolvedValue.schemas, {
					name: enumName,
					model: enumValue,
					imports: resolvedValue.imports
				}],
				originalSchema: resolvedValue.originalSchema,
				objectStrategy
			};
		}
		return {
			name,
			required,
			definition: `${doc}${key}${!required || schema.default ? "?" : ""}: ${resolvedValue.value};`,
			imports: resolvedValue.imports,
			schemas: resolvedValue.schemas,
			originalSchema: resolvedValue.originalSchema,
			objectStrategy
		};
	});
}
function getQueryParams({ queryParams, operationName, context, suffix = "params" }) {
	if (queryParams.length === 0) return;
	const types = getQueryParamsTypes(queryParams, operationName, context);
	const imports = types.flatMap(({ imports }) => imports);
	const schemas = types.flatMap(({ schemas }) => schemas);
	const name = `${pascal(operationName)}${pascal(suffix)}`;
	const type = types.map(({ definition }) => definition).join("\n");
	const allOptional = queryParams.every(({ parameter }) => !parameter.required);
	const requiredNullableKeys = types.filter(({ required, originalSchema }) => required && isSchemaNullable(originalSchema)).map(({ name }) => name);
	const nonPrimitiveKeys = types.filter(({ originalSchema }) => isSchemaNonPrimitive(originalSchema)).map(({ name }) => name);
	const objectQueryParams = types.filter((type) => type.objectStrategy !== void 0).map(({ name, objectStrategy }) => ({
		key: name,
		strategy: objectStrategy
	}));
	return {
		schema: {
			name,
			model: `export type ${name} = {\n${type}\n};\n`,
			imports
		},
		deps: schemas,
		isOptional: allOptional,
		paramNames: types.map(({ name }) => name),
		requiredNullableKeys,
		...nonPrimitiveKeys.length > 0 ? { nonPrimitiveKeys } : {},
		...objectQueryParams.length > 0 ? { objectQueryParams } : {}
	};
}
//#endregion
//#region src/getters/response.ts
function getResponse({ responses, operationName, context, contentType }) {
	const filteredTypes = filterByContentType(getResReqTypes(Object.entries(responses), operationName, context, "void", (type) => `${type.key}-${type.value}-${type.contentType}`), contentType);
	const imports = filteredTypes.flatMap(({ imports }) => imports);
	const schemas = filteredTypes.flatMap(({ schemas }) => schemas);
	const contentTypes = [...new Set(filteredTypes.map(({ contentType }) => contentType))];
	const groupedByStatus = {
		success: [],
		errors: []
	};
	for (const type of filteredTypes) if (type.key.startsWith("2")) groupedByStatus.success.push(type);
	else groupedByStatus.errors.push(type);
	const success = dedupeUnionType(groupedByStatus.success.map(({ value, formData }) => formData ? "Blob" : value).join(" | "));
	const errors = dedupeUnionType(groupedByStatus.errors.map(({ value }) => value).join(" | "));
	const defaultType = filteredTypes.find(({ key }) => key === "default")?.value;
	return {
		imports,
		definition: {
			success: success || (defaultType ?? "unknown"),
			errors: errors || (defaultType ?? "unknown")
		},
		isBlob: groupedByStatus.success.some((t) => !!t.contentType && isBinaryContentType(t.contentType) || t.originalSchema?.format === "binary" || t.originalSchema?.contentMediaType === "application/octet-stream" && !t.originalSchema.contentEncoding),
		types: groupedByStatus,
		contentTypes,
		schemas,
		originalSchema: responses
	};
}
//#endregion
//#region src/generators/component-definition.ts
function generateComponentDefinition(responses = {}, context, suffix) {
	if (isEmptyish(responses)) return [];
	const generatorSchemas = [];
	for (const [name, response] of entries(responses)) {
		const allResponseTypes = getResReqTypes([[suffix, response]], name, context, "void");
		const imports = allResponseTypes.flatMap(({ imports }) => imports);
		const schemas = allResponseTypes.flatMap(({ schemas }) => schemas);
		const type = allResponseTypes.map(({ value }) => value).join(" | ");
		const modelName = sanitize(`${pascal(name)}${suffix}`, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		const model = `${jsDoc(response)}export type ${modelName} = ${type || "unknown"};\n`;
		generatorSchemas.push(...schemas);
		if (modelName !== type) generatorSchemas.push({
			name: modelName,
			model,
			imports
		});
	}
	return generatorSchemas;
}
//#endregion
//#region src/generators/factory.ts
const circularRefCache = /* @__PURE__ */ new WeakMap();
function getSchemasPath(context) {
	const { schemas, target } = context.output;
	if (schemas) return normalizeSafe(isString(schemas) ? schemas : schemas.path);
	const { dirname, filename } = getFileInfo(target);
	return joinSafe(dirname, filename + ".schemas");
}
function getSchemaImportPath(refName, context) {
	if (context.output.factoryMethods?.mode === "single") return;
	const importPathBase = getSchemasImportPath(context.output.schemas);
	if (importPathBase) return joinSafe(importPathBase, conventionName(refName, context.output.namingConvention));
	let outputDir = context.output.factoryMethods?.outputDirectory;
	let schemasPath = getSchemasPath(context);
	if (context.output.workspace) {
		if (outputDir && !isAbsolute(outputDir)) outputDir = resolve(context.output.workspace, outputDir);
		if (schemasPath && !isAbsolute(schemasPath)) schemasPath = resolve(context.output.workspace, schemasPath);
	}
	return joinSafe(outputDir ? relativeSafe(outputDir, schemasPath) : "./", conventionName(refName, context.output.namingConvention));
}
function isReference$1(schema) {
	return "$ref" in schema;
}
function getResolvedRef(schema, context) {
	return resolveRef(schema, context);
}
function getProperties(schema) {
	return schema.properties ?? {};
}
function getItems(schema) {
	return schema.items;
}
function getAdditionalProperties(schema) {
	return schema.additionalProperties;
}
function getSchemas(schemas) {
	return schemas;
}
function getExtendedProps(schema) {
	const extended = schema;
	return {
		constValue: extended.const,
		prefixItems: extended.prefixItems,
		minItems: extended.minItems
	};
}
function generateFactory(schema, name, context) {
	if (!canGenerateSchema(schema) || !context.output.factoryMethods) return void 0;
	const { functionNamePrefix, mode } = context.output.factoryMethods;
	const factoryName = `${functionNamePrefix}${pascal(name)}`;
	const imports = [];
	const payload = buildPayload(schema, context, [name], imports);
	if (mode !== "single") {
		const schemaImportPath = getSchemaImportPath(name, context);
		imports.push({
			name,
			importPath: schemaImportPath
		});
	}
	return {
		model: `export function ${factoryName}(): ${name} {\n  return ${payload};\n}\n`,
		imports
	};
}
function canGenerateSchema(schema) {
	return schema.type === "object" || schema.type === "array" || !!schema.properties || !!schema.allOf || !!schema.oneOf || !!schema.anyOf || !!schema.items || !!schema.enum;
}
function hasCircularReference(target, sourceName, context, visited = /* @__PURE__ */ new Set()) {
	if (isReference$1(target)) {
		const { imports, schema } = getResolvedRef(target, context);
		const refName = imports[0]?.name;
		if (refName === sourceName) return true;
		if (refName && visited.has(refName)) return false;
		if (refName) visited.add(refName);
		let cache = circularRefCache.get(context);
		if (!cache) {
			cache = /* @__PURE__ */ new Map();
			circularRefCache.set(context, cache);
		}
		const cacheKey = refName ? `${sourceName}::${refName}` : void 0;
		if (cacheKey) {
			const cached = cache.get(cacheKey);
			if (cached !== void 0) return cached;
		}
		const result = hasCircularReference(schema, sourceName, context, visited);
		if (cacheKey) cache.set(cacheKey, result);
		return result;
	}
	const check = (schemas) => schemas?.some((s) => hasCircularReference(s, sourceName, context, visited)) ?? false;
	const items = getItems(target);
	const additionalProperties = getAdditionalProperties(target);
	return check(getSchemas(target.allOf)) || check(getSchemas(target.oneOf)) || check(getSchemas(target.anyOf)) || Object.values(getProperties(target)).some((s) => hasCircularReference(s, sourceName, context, visited)) || !!items && hasCircularReference(items, sourceName, context, visited) || typeof additionalProperties === "object" && hasCircularReference(additionalProperties, sourceName, context, visited);
}
function buildPayload(target, context, parents, imports) {
	if (isReference$1(target)) return buildRefPayload(target, context, parents, imports);
	const schema = target;
	const payloads = [];
	if (schema.allOf) payloads.push(buildAllOfPayload(getSchemas(schema.allOf) ?? [], context, parents, imports));
	else if (schema.oneOf) payloads.push(buildFirstOfPayload(getSchemas(schema.oneOf) ?? [], context, parents, imports));
	else if (schema.anyOf) payloads.push(buildFirstOfPayload(getSchemas(schema.anyOf) ?? [], context, parents, imports));
	if (Object.keys(getProperties(schema)).length > 0) payloads.push(buildObjectPayload(schema, context, parents, imports));
	if (payloads.length > 0) return payloads.length === 1 ? payloads[0] : `Object.assign({}, ${payloads.join(", ")})`;
	const { constValue } = getExtendedProps(schema);
	if (constValue !== void 0) return formatValue(constValue);
	if (schema.default !== void 0) return buildDefaultPayload(schema, context);
	const schemaType = inferSchemaType(schema);
	if (schemaType === "object") return "{}";
	if (schemaType === "array") return buildArrayPayload(schema, context, parents, imports);
	return buildPrimitivePayload(schema, schemaType, context);
}
function buildRefPayload(schema, context, parents, imports) {
	const { schema: resolved, imports: refImports } = getResolvedRef(schema, context);
	const refName = refImports[0]?.name;
	if (!refName) return "{}";
	if (parents.includes(refName) || hasCircularReference(resolved, parents[0], context)) {
		imports.push({
			name: refName,
			importPath: getSchemaImportPath(refName, context)
		});
		return `{} as ${refName}`;
	}
	const { functionNamePrefix = "create", mode = "single" } = context.output.factoryMethods ?? {};
	const refFactoryName = `${functionNamePrefix}${pascal(refName)}`;
	if (mode !== "single-split") {
		const importPath = resolveImportPath(mode, refName, context);
		imports.push({
			name: refFactoryName,
			importPath,
			isConstant: true
		});
	}
	imports.push({
		name: refName,
		importPath: getSchemaImportPath(refName, context)
	});
	return `${refFactoryName}()`;
}
function resolveImportPath(mode, refName, context) {
	const baseName = conventionName(refName, context.output.namingConvention);
	const pkgBase = getSchemasImportPath(context.output.schemas);
	switch (mode) {
		case "split": return pkgBase ? joinSafe(pkgBase, `${baseName}.factory`) : `./${baseName}.factory`;
		case "single-split": return pkgBase ? joinSafe(pkgBase, conventionName("factoryMethods", context.output.namingConvention)) : `./${conventionName("factoryMethods", context.output.namingConvention)}`;
		case "single": return pkgBase ? joinSafe(pkgBase, baseName) : `./${baseName}`;
	}
}
function buildAllOfPayload(allOf, context, parents, imports) {
	const payloads = allOf.map((s) => buildPayload(s, context, parents, imports));
	return payloads.length > 0 ? `Object.assign({}, ${payloads.join(", ")})` : "{}";
}
function buildFirstOfPayload(schemas, context, parents, imports) {
	const first = schemas[0];
	return first ? buildPayload(first, context, parents, imports) : "{}";
}
function buildObjectPayload(schema, context, parents, imports) {
	const { includeOptionalProperty = false } = context.output.factoryMethods ?? {};
	const props = getProperties(schema);
	const requiredProps = schema.required ?? [];
	const entries = Object.entries(props);
	if (context.output.propertySortOrder === PropertySortOrder.ALPHABETICAL) entries.sort(([a], [b]) => a.localeCompare(b));
	const includeOptional = includeOptionalProperty;
	const lines = [];
	for (const [key, prop] of entries) {
		const isRequired = requiredProps.includes(key);
		const resolved = isReference$1(prop) ? getResolvedRef(prop, context).schema : prop;
		const isReadOnly = !!prop.readOnly || !!resolved.readOnly;
		const isWriteOnly = !!prop.writeOnly || !!resolved.writeOnly;
		if (!isRequired) {
			if (isReadOnly) continue;
			if (!isWriteOnly && !includeOptional) continue;
		}
		const payload = buildPayload(prop, context, parents, imports);
		const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
		lines.push(`${safeKey}: ${payload}`);
	}
	return `{\n    ${lines.join(",\n    ")}\n  }`;
}
function buildArrayPayload(schema, context, parents, imports) {
	const { prefixItems, minItems } = getExtendedProps(schema);
	const items = getItems(schema);
	if (prefixItems && prefixItems.length > 0) return `[${prefixItems.map((item) => buildPayload(item, context, parents, imports)).join(", ")}]`;
	if (minItems && items) {
		const MAX_MIN_ITEMS = 50;
		if (minItems > MAX_MIN_ITEMS) logWarning(`Warning: minItems is ${minItems}, capping at ${MAX_MIN_ITEMS} to prevent massive payload.`);
		const count = Math.min(minItems, MAX_MIN_ITEMS);
		const itemPayload = buildPayload(items, context, parents, imports);
		return `[${Array.from({ length: count }).fill(itemPayload).join(", ")}]`;
	}
	return "[]";
}
function inferSchemaType(schema) {
	let type = schema.type;
	if (Array.isArray(type)) {
		const nonNull = type.filter((t) => t !== "null");
		type = nonNull.length > 0 ? nonNull[0] : "null";
	}
	if (!type && schema.items) return "array";
	if (!type && schema.enum) {
		const first = schema.enum[0];
		if (typeof first === "number") return "number";
		if (typeof first === "boolean") return "boolean";
		return "string";
	}
	return type;
}
function buildDefaultPayload(schema, context) {
	if (context.output.override.useDates && typeof schema.default === "string" && (schema.format === "date" || schema.format === "date-time")) return `new Date('${schema.default}')`;
	return formatValue(schema.default);
}
function buildPrimitivePayload(schema, schemaType, context) {
	if (schemaType === "null") return "null";
	const enumValues = schema.enum;
	if (schemaType === "boolean") return enumValues && enumValues.length > 0 ? String(enumValues[0]) : "false";
	if (schemaType === "number" || schemaType === "integer") return enumValues && enumValues.length > 0 ? String(enumValues[0]) : "0";
	if (schemaType === "string") {
		if (enumValues && enumValues.length > 0) {
			const first = enumValues[0];
			return typeof first === "string" ? JSON.stringify(first) : String(first);
		}
		if (schema.format === "date" || schema.format === "date-time") return context.output.override.useDates ? "new Date(0)" : `'${(/* @__PURE__ */ new Date(0)).toISOString()}'`;
		return "''";
	}
	return "undefined as unknown";
}
function formatValue(val) {
	if (val === null) return "null";
	if (typeof val === "string") return JSON.stringify(val);
	if (typeof val === "object") return JSON.stringify(val);
	return String(val);
}
//#endregion
//#region src/generators/imports.ts
function generateImports({ imports, namingConvention = NamingConvention.CAMEL_CASE, importExtension = "" }) {
	if (imports.length === 0) return "";
	const grouped = groupBy(uniqueWith(imports, (a, b) => a.name === b.name && a.default === b.default && a.alias === b.alias && a.values === b.values && a.isConstant === b.isConstant && a.namespaceImport === b.namespaceImport && a.syntheticDefaultImport === b.syntheticDefaultImport && a.importPath === b.importPath).map((imp) => ({
		...imp,
		importPath: imp.importPath ?? `./${conventionName(imp.name, namingConvention)}${importExtension}`
	})), (imp) => !imp.default && !imp.namespaceImport && !imp.syntheticDefaultImport && !imp.values && !imp.isConstant ? `aggregate|${imp.importPath}` : `single|${imp.importPath}|${imp.name}|${imp.alias ?? ""}|${String(imp.default)}|${String(imp.namespaceImport)}|${String(imp.syntheticDefaultImport)}|${String(imp.values)}|${String(imp.isConstant)}`);
	return Object.entries(grouped).toSorted(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([, group]) => {
		const sample = group[0];
		if (!sample.default && !sample.namespaceImport && !sample.syntheticDefaultImport && !sample.values && !sample.isConstant) return `import type { ${[...new Set(group.map(({ name, alias }) => `${name}${alias ? ` as ${alias}` : ""}`))].toSorted().join(", ")} } from '${sample.importPath}';`;
		const { name, values, alias, isConstant, importPath } = sample;
		return `import ${!values && !isConstant ? "type " : ""}{ ${name}${alias ? ` as ${alias}` : ""} } from '${importPath}';`;
	}).join("\n");
}
function generateMutatorImports({ mutators, implementation, oneMore }) {
	let imports = "";
	for (const mutator of uniqueWith(mutators, (a, b) => a.name === b.name && a.default === b.default)) {
		const isRelativeImport = mutator.path.startsWith(".");
		const path = `${oneMore && isRelativeImport ? "../" : ""}${mutator.path}`;
		const importDefault = mutator.default ? mutator.name : `{ ${mutator.name} }`;
		imports += `import ${importDefault} from '${path}';`;
		imports += "\n";
		if (implementation && (mutator.hasErrorType || mutator.bodyTypeName)) {
			let errorImportName = "";
			const targetErrorImportName = mutator.default ? `ErrorType as ${mutator.errorTypeName}` : mutator.errorTypeName;
			if (mutator.hasErrorType && implementation.includes(mutator.errorTypeName) && !imports.includes(`{ ${targetErrorImportName} `)) errorImportName = targetErrorImportName;
			let bodyImportName = "";
			const targetBodyImportName = mutator.default ? `BodyType as ${mutator.bodyTypeName}` : mutator.bodyTypeName;
			if (mutator.bodyTypeName && implementation.includes(mutator.bodyTypeName) && !imports.includes(` ${targetBodyImportName} }`)) bodyImportName = targetBodyImportName ?? "";
			if (bodyImportName || errorImportName) {
				imports += `import type { ${errorImportName}${errorImportName && bodyImportName ? " , " : ""}${bodyImportName} } from '${path}';`;
				imports += "\n";
			}
		}
	}
	return imports;
}
function generateDependency({ deps, isAllowSyntheticDefaultImports, dependency, projectName, key, onlyTypes }) {
	const defaultDep = deps.find((e) => e.default && (isAllowSyntheticDefaultImports || !e.syntheticDefaultImport));
	const namespaceImportDep = defaultDep ? void 0 : deps.find((e) => !!e.namespaceImport || !isAllowSyntheticDefaultImports && e.syntheticDefaultImport);
	const depsString = unique(deps.filter((e) => !e.default && !e.syntheticDefaultImport && !e.namespaceImport).map(({ name, alias }) => alias ? `${name} as ${alias}` : name)).toSorted().join(",\n  ");
	let importString = "";
	const namespaceImportString = namespaceImportDep ? `import * as ${namespaceImportDep.name} from '${dependency}';` : "";
	if (namespaceImportString) {
		if (deps.length === 1) return namespaceImportString;
		importString += `${namespaceImportString}\n`;
	}
	importString += `import ${onlyTypes ? "type " : ""}${defaultDep ? `${defaultDep.name}${depsString ? "," : ""}` : ""}${depsString ? `{\n  ${depsString}\n}` : ""} from '${dependency}${key !== "default" && projectName ? `/${projectName}` : ""}';`;
	return importString;
}
function addDependency({ implementation, exports, dependency, projectName, isAllowSyntheticDefaultImports }) {
	const toAdds = exports.filter((e) => {
		const identifier = e.alias?.length ? e.alias : e.name;
		if (!identifier) return false;
		const pattern = new RegExp(String.raw`\b(${escapeRegExp(identifier)})\b`, "g");
		return implementation.match(pattern);
	});
	if (toAdds.length === 0) return;
	const groupedBySpecKey = { default: {
		types: [],
		values: []
	} };
	for (const dep of toAdds) {
		const key = "default";
		if (dep.values && (isAllowSyntheticDefaultImports || !dep.syntheticDefaultImport)) groupedBySpecKey[key].values.push(dep);
		else groupedBySpecKey[key].types.push(dep);
	}
	return Object.entries(groupedBySpecKey).map(([key, { values, types }]) => {
		let dep = "";
		if (values.length > 0) dep += generateDependency({
			deps: values,
			isAllowSyntheticDefaultImports,
			dependency,
			projectName,
			key,
			onlyTypes: false
		});
		if (types.length > 0) {
			let uniqueTypes = types;
			if (values.length > 0) uniqueTypes = types.filter((t) => !values.some((v) => v.name === t.name && (v.alias ?? "") === (t.alias ?? "")));
			if (uniqueTypes.length > 0) {
				if (values.length > 0) dep += "\n";
				dep += generateDependency({
					deps: uniqueTypes,
					isAllowSyntheticDefaultImports,
					dependency,
					projectName,
					key,
					onlyTypes: true
				});
			}
		}
		return dep;
	}).join("\n") + "\n";
}
function getLibName(code) {
	return (code.split(" from ").at(-1) ?? "").split(";")[0].trim();
}
function generateDependencyImports(implementation, imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports) {
	const dependencies = imports.map((dep) => addDependency({
		...dep,
		implementation,
		projectName,
		hasSchemaDir,
		isAllowSyntheticDefaultImports
	})).filter((x) => Boolean(x)).toSorted((a, b) => {
		const aLib = getLibName(a);
		const bLib = getLibName(b);
		if (aLib === bLib) return 0;
		if (aLib.startsWith("'.") && !bLib.startsWith("'.")) return 1;
		return aLib < bLib ? -1 : 1;
	}).join("\n");
	return dependencies ? dependencies + "\n" : "";
}
function generateVerbImports({ response, body, queryParams, props, headers, params }) {
	return [
		...response.imports,
		...body.imports,
		...props.flatMap((prop) => prop.type === GetterPropType.NAMED_PATH_PARAMS ? [{ name: prop.schema.name }] : []),
		...queryParams ? [{ name: queryParams.schema.name }] : [],
		...headers ? [{ name: headers.schema.name }] : [],
		...params.flatMap(({ imports }) => imports)
	].flatMap((imp) => {
		if (imp.name !== "Error" || !imp.values || imp.alias) return [imp];
		return [{
			...imp,
			values: void 0
		}, {
			...imp,
			alias: "ErrorSchema",
			values: true
		}];
	});
}
//#endregion
//#region src/generators/input-filters.ts
const COMPONENT_TYPES = [
	"schemas",
	"responses",
	"parameters",
	"requestBodies"
];
function filteredVerbs(verbs, filters) {
	if (filters?.tags === void 0) return Object.entries(verbs);
	const filterTags = filters.tags;
	const filterMode = filters.mode ?? "include";
	return Object.entries(verbs).filter(([, operation]) => {
		const isMatch = (operation.tags ?? []).some((tag) => filterTags.some((filterTag) => filterTag instanceof RegExp ? filterTag.test(tag) : filterTag === tag));
		return filterMode === "exclude" ? !isMatch : isMatch;
	});
}
function findRefs(value) {
	if (!value || typeof value !== "object") return [];
	if (Array.isArray(value)) return value.flatMap((item) => findRefs(item));
	const obj = value;
	const refs = [];
	if (typeof obj.$ref === "string") refs.push(obj.$ref);
	return refs.concat(Object.values(obj).flatMap((val) => findRefs(val)));
}
function parseComponentRef(ref) {
	const parts = ref.split("/");
	if (parts[0] !== "#" || parts[1] !== "components" || parts.length < 4) return;
	const type = parts[2];
	const name = parts[3];
	if (!COMPONENT_TYPES.includes(type)) return;
	return {
		type,
		name
	};
}
function getComponentNames(refs, spec) {
	return refs.map((ref) => parseComponentRef(ref)).filter((parsed) => !!parsed && !!spec.components?.[parsed.type]?.[parsed.name]);
}
function resolveReferencedComponents(refs, spec, resolved) {
	const newComponents = getComponentNames(refs, spec).filter(({ type, name }) => !resolved[type].includes(name));
	if (newComponents.length === 0) return resolved;
	const nextResolved = {
		schemas: [...resolved.schemas],
		responses: [...resolved.responses],
		parameters: [...resolved.parameters],
		requestBodies: [...resolved.requestBodies]
	};
	for (const { type, name } of newComponents) nextResolved[type].push(name);
	return resolveReferencedComponents(newComponents.flatMap(({ type, name }) => findRefs(spec.components?.[type]?.[name])), spec, nextResolved);
}
const collectReferencedComponents = (spec, tags, mode) => {
	const filters = {
		tags,
		mode
	};
	return resolveReferencedComponents(Object.values(spec.paths ?? {}).filter((pathItem) => !!pathItem).flatMap((pathItem) => {
		return [...filteredVerbs(pathItem, filters).flatMap(([, operation]) => findRefs(operation)), ...findRefs(pathItem.parameters)];
	}), spec, {
		schemas: [],
		responses: [],
		parameters: [],
		requestBodies: []
	});
};
//#endregion
//#region src/generators/models-inline.ts
function generateModelInline(acc, model) {
	return acc + `${model}\n`;
}
function generateModelsInline(obj) {
	const schemas = Array.isArray(obj) ? obj : Object.values(obj).flat();
	let result = "";
	for (const { model } of schemas) result = generateModelInline(result, model);
	return result;
}
//#endregion
//#region src/generators/mutator-info.ts
async function getMutatorInfo(filePath, options) {
	const { root = process.cwd(), namedExport = "default", alias, external, tsconfig } = options ?? {};
	return parseFile(await bundleFile(root, filePath, alias, external, tsconfig?.compilerOptions), namedExport);
}
async function bundleFile(root, fileName, alias, external, compilerOptions) {
	const { text } = (await build({
		absWorkingDir: root,
		entryPoints: [fileName],
		write: false,
		platform: "node",
		bundle: true,
		format: "esm",
		metafile: false,
		target: compilerOptions?.target ?? "es6",
		minify: false,
		minifyIdentifiers: false,
		minifySyntax: false,
		minifyWhitespace: false,
		treeShaking: false,
		keepNames: false,
		alias,
		external: external ?? ["*"]
	})).outputFiles[0];
	return text;
}
function parseFile(file, name) {
	try {
		const ast = Parser.parse(file, {
			ecmaVersion: "latest",
			sourceType: "module"
		});
		const foundExport = ast.body.filter((x) => x.type === "ExportNamedDeclaration").map((declaration) => ({
			declaration,
			specifier: declaration.specifiers.find((specifier) => specifier.exported.type === "Identifier" && specifier.exported.name === name && specifier.local.type === "Identifier")
		})).find((item) => item.specifier);
		const foundSpecifier = foundExport?.specifier;
		if (foundExport && foundSpecifier && "name" in foundSpecifier.local) {
			const exportedFuncName = foundSpecifier.local.name;
			const mutatorInfo = parseFunction(ast, exportedFuncName);
			if (mutatorInfo) return mutatorInfo;
			if (foundExport.declaration.source || isImportedBinding(ast, exportedFuncName)) return standardMutatorInfo();
		}
	} catch {
		return;
	}
}
function isImportedBinding(ast, name) {
	return ast.body.some((node) => {
		if (node.type !== "ImportDeclaration") return false;
		return node.specifiers.some((specifier) => "name" in specifier.local && specifier.local.name === name);
	});
}
function standardMutatorInfo() {
	return { numberOfParams: 1 };
}
function parseFunction(ast, funcName) {
	const node = ast.body.find((childNode) => {
		if (childNode.type === "VariableDeclaration") return childNode.declarations.find((d) => d.id.type === "Identifier" && d.id.name === funcName);
		if (childNode.type === "FunctionDeclaration" && childNode.id.name === funcName) return childNode;
	});
	if (!node) return;
	if (node.type === "FunctionDeclaration") {
		const returnStatement = node.body.body.find((b) => b.type === "ReturnStatement");
		if (returnStatement?.argument && "params" in returnStatement.argument) return {
			numberOfParams: node.params.length,
			returnNumberOfParams: returnStatement.argument.params.length
		};
		else if (returnStatement?.argument?.type === "CallExpression") {
			const arrowFn = returnStatement.argument.arguments.at(0);
			if (arrowFn?.type === "ArrowFunctionExpression") return {
				numberOfParams: node.params.length,
				returnNumberOfParams: arrowFn.params.length
			};
		}
		return { numberOfParams: node.params.length };
	}
	const declaration = "declarations" in node ? node.declarations.find((d) => d.id.type === "Identifier" && d.id.name === funcName) : void 0;
	if (declaration?.init) {
		if ("name" in declaration.init) return parseFunction(ast, declaration.init.name);
		if (declaration.init.type === "CallExpression") return standardMutatorInfo();
		if ("body" in declaration.init && "params" in declaration.init && declaration.init.body.type === "ArrowFunctionExpression") return {
			numberOfParams: declaration.init.params.length,
			returnNumberOfParams: declaration.init.body.params.length
		};
		const returnStatement = "body" in declaration.init && "body" in declaration.init.body && isArray(declaration.init.body.body) ? declaration.init.body.body.find((b) => b.type === "ReturnStatement") : void 0;
		if ("params" in declaration.init) {
			if (returnStatement?.argument && "params" in returnStatement.argument) return {
				numberOfParams: declaration.init.params.length,
				returnNumberOfParams: returnStatement.argument.params.length
			};
			else if (returnStatement?.argument?.type === "CallExpression" && returnStatement.argument.arguments[0]?.type === "ArrowFunctionExpression") {
				const arrowFn = returnStatement.argument.arguments[0];
				return {
					numberOfParams: declaration.init.params.length,
					returnNumberOfParams: arrowFn.params.length
				};
			}
			return { numberOfParams: declaration.init.params.length };
		}
	}
}
//#endregion
//#region src/generators/mutator.ts
const BODY_TYPE_NAME = "BodyType";
const getImport = (output, mutator, tsconfig) => {
	if (mutator.resolvedPath || !nodePath.isAbsolute(mutator.path)) return mutator.path;
	const outputFile = getFileInfo(output).path;
	const ext = mutator.extension ?? getImportExtension(nodePath.extname(mutator.path), tsconfig);
	return `${getRelativeImportPath(outputFile, mutator.path)}${ext}`;
};
async function generateMutator({ output, mutator, name, workspace, tsconfig }) {
	if (!mutator || !output) return;
	const isDefault = mutator.default;
	const importName = mutator.name ?? `${name}Mutator`;
	const importPath = mutator.path;
	const inspectionPath = mutator.resolvedPath ?? mutator.path;
	const mutatorInfoName = isDefault ? "default" : mutator.name;
	if (mutatorInfoName === void 0) throw new Error(styleText("red", `Mutator ${importPath} must have a named or default export.`));
	let rawFile = nodePath.isAbsolute(inspectionPath) ? await fs$1.readFile(inspectionPath, "utf8") : "";
	rawFile = removeComments(rawFile);
	const hasErrorType = !!rawFile && (rawFile.includes("export type ErrorType") || rawFile.includes("export interface ErrorType"));
	const hasBodyType = !!rawFile && (rawFile.includes(`export type BodyType`) || rawFile.includes(`export interface BodyType`));
	const errorTypeName = mutator.default ? `${pascal(name)}ErrorType` : "ErrorType";
	const bodyTypeName = mutator.default ? `${pascal(name)}${BODY_TYPE_NAME}` : BODY_TYPE_NAME;
	const mutatorInfo = await getMutatorInfo(inspectionPath, {
		root: workspace,
		namedExport: mutatorInfoName,
		alias: mutator.alias,
		external: mutator.external,
		tsconfig
	});
	if (!mutatorInfo) throw new Error(styleText("red", `Your mutator file doesn't have the ${mutatorInfoName} exported function`));
	const importStatementPath = getImport(output, mutator, tsconfig);
	const isHook = mutator.name ? mutator.name.startsWith("use") && !mutatorInfo.numberOfParams : !mutatorInfo.numberOfParams;
	return {
		name: mutator.name || !isHook ? importName : `use${pascal(importName)}`,
		path: importStatementPath,
		default: isDefault,
		hasErrorType,
		errorTypeName,
		hasSecondArg: isHook ? (mutatorInfo.returnNumberOfParams ?? 0) > 1 : mutatorInfo.numberOfParams > 1,
		hasThirdArg: mutatorInfo.numberOfParams > 2,
		isHook,
		...hasBodyType ? { bodyTypeName } : {}
	};
}
function removeComments(file) {
	return file.replaceAll(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
}
//#endregion
//#region src/generators/options.ts
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
const getAngularFilteredParamsExpression = (paramsExpression, requiredNullableParamKeys = [], preserveRequiredNullables = false, nonPrimitiveKeys = [], objectParamStrategies = {}) => {
	const hasPassthrough = nonPrimitiveKeys.length > 0;
	const hasObjectStrategies = Object.keys(objectParamStrategies).length > 0;
	const filteredParamValueType = hasPassthrough ? "unknown" : `string | number | boolean${preserveRequiredNullables ? " | null" : ""} | Array<string | number | boolean>`;
	const passthroughBranch = hasPassthrough ? `    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
` : "";
	const objectStrategyBranch = hasObjectStrategies ? `    if (
      value != null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(objectParamStrategies, key)
    ) {
      const objectStrategy = objectParamStrategies[key];
      const entries = Object.entries(value as Record<string, unknown>);
      if (objectStrategy === 'comma') {
        const commaParts: string[] = [];
        for (const [prop, propValue] of entries) {
          if (Array.isArray(propValue)) {
            const filteredItems = propValue.filter(
              (item) =>
                item != null &&
                (typeof item === 'string' ||
                  typeof item === 'number' ||
                  typeof item === 'boolean'),
            ) as Array<string | number | boolean>;
            if (filteredItems.length) {
              commaParts.push(prop, ...filteredItems.map(String));
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            commaParts.push(prop, String(propValue));
          }
        }
        if (commaParts.length) {
          filteredParams[key] = commaParts.join(',');
        }
      } else {
        for (const [prop, propValue] of entries) {
          const targetKey =
            objectStrategy === 'deepObject' ? key + '[' + prop + ']' : prop;
          if (Array.isArray(propValue)) {
            const filteredProp = propValue.filter(
              (item) =>
                item != null &&
                (typeof item === 'string' ||
                  typeof item === 'number' ||
                  typeof item === 'boolean'),
            ) as Array<string | number | boolean>;
            if (filteredProp.length) {
              filteredParams[targetKey] = filteredProp;
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            filteredParams[targetKey] = propValue;
          }
        }
      }
      continue;
    }
` : "";
	const emitRequiredNullableBranch = preserveRequiredNullables || requiredNullableParamKeys.length > 0;
	const preserveNullableBranch = emitRequiredNullableBranch ? `    } else if (value === null && requiredNullableParamKeys.has(key)) {
      filteredParams[key] = ${preserveRequiredNullables ? "null" : "''"};
` : "";
	const requiredNullableParamKeysBranch = emitRequiredNullableBranch ? `const requiredNullableParamKeys = new Set<string>(${JSON.stringify(requiredNullableParamKeys)});` : "";
	return `(() => {
${hasPassthrough ? `  const passthroughKeys = new Set<string>(${JSON.stringify(nonPrimitiveKeys)});\n` : ""}${hasObjectStrategies ? `  const objectParamStrategies: Readonly<Record<string, 'flatten' | 'comma' | 'deepObject'>> = ${JSON.stringify(objectParamStrategies)};\n` : ""}  ${requiredNullableParamKeysBranch}
  const filteredParams: Record<string, ${filteredParamValueType}> = {};
  for (const [key, value] of Object.entries(${paramsExpression})) {
${passthroughBranch}${objectStrategyBranch}    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) =>
          item != null &&
          (typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'),
      ) as Array<string | number | boolean>;
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
${preserveNullableBranch}    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
})()`;
};
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
const getAngularFilteredParamsHelperBody = ({ hasObjectParams = false } = {}) => {
	if (!hasObjectParams) return `type AngularHttpParamValue = string | number | boolean | Array<string | number | boolean>;
type AngularHttpParamValueWithNullable = AngularHttpParamValue | null;

function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys?: ReadonlySet<string>,
  preserveRequiredNullables?: false,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: true,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValueWithNullable>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string>,
): Record<string, unknown>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> = new Set(),
  preserveRequiredNullables = false,
  passthroughKeys: ReadonlySet<string> = new Set(),
): Record<string, unknown> {
  const filteredParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) =>
          item != null &&
          (typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'),
      ) as Array<string | number | boolean>;
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
    } else if (value === null && requiredNullableKeys.has(key)) {
      // With a paramsSerializer (preserveRequiredNullables) the literal null
      // is passed through for it to consume; without one, emit an empty
      // string so the required key still reaches the wire as \`?key=\`
      // instead of being silently dropped. See #3712.
      filteredParams[key] = preserveRequiredNullables ? null : '';
    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
}`;
	return `type AngularHttpParamValue = string | number | boolean | Array<string | number | boolean>;
type AngularHttpParamValueWithNullable = AngularHttpParamValue | null;
type AngularObjectParamStrategy = 'flatten' | 'comma' | 'deepObject';

function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys?: ReadonlySet<string>,
  preserveRequiredNullables?: false,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: true,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValueWithNullable>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string>,
): Record<string, unknown>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string> | undefined,
  objectParamStrategies: Readonly<Record<string, AngularObjectParamStrategy>>,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> = new Set(),
  preserveRequiredNullables = false,
  passthroughKeys: ReadonlySet<string> = new Set(),
  objectParamStrategies: Readonly<Record<string, AngularObjectParamStrategy>> = {},
): Record<string, unknown> {
  const filteredParams: Record<string, unknown> = {};
  const filterPrimitiveArray = (
    value: unknown[],
  ): Array<string | number | boolean> =>
    value.filter(
      (item) =>
        item != null &&
        (typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean'),
    ) as Array<string | number | boolean>;
  for (const [key, value] of Object.entries(params)) {
    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
    if (
      value != null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(objectParamStrategies, key)
    ) {
      const objectStrategy = objectParamStrategies[key];
      const entries = Object.entries(value as Record<string, unknown>);
      if (objectStrategy === 'comma') {
        const commaParts: string[] = [];
        for (const [prop, propValue] of entries) {
          if (Array.isArray(propValue)) {
            const filteredItems = filterPrimitiveArray(propValue);
            if (filteredItems.length) {
              commaParts.push(prop, ...filteredItems.map(String));
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            commaParts.push(prop, String(propValue));
          }
        }
        if (commaParts.length) {
          filteredParams[key] = commaParts.join(',');
        }
      } else {
        for (const [prop, propValue] of entries) {
          const targetKey =
            objectStrategy === 'deepObject' ? key + '[' + prop + ']' : prop;
          if (Array.isArray(propValue)) {
            const filteredProp = filterPrimitiveArray(propValue);
            if (filteredProp.length) {
              filteredParams[targetKey] = filteredProp;
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            filteredParams[targetKey] = propValue;
          }
        }
      }
      continue;
    }
    if (Array.isArray(value)) {
      const filtered = filterPrimitiveArray(value);
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
    } else if (value === null && requiredNullableKeys.has(key)) {
      // With a paramsSerializer (preserveRequiredNullables) the literal null
      // is passed through for it to consume; without one, emit an empty
      // string so the required key still reaches the wire as \`?key=\`
      // instead of being silently dropped. See #3712.
      filteredParams[key] = preserveRequiredNullables ? null : '';
    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
}`;
};
/**
* Returns a call expression to the `filterParams` helper function.
*/
const getAngularFilteredParamsCallExpression = (paramsExpression, requiredNullableParamKeys = [], preserveRequiredNullables = false, nonPrimitiveKeys = [], objectParamStrategies = {}) => {
	const baseArgs = `${paramsExpression}, new Set<string>(${JSON.stringify(requiredNullableParamKeys)})`;
	if (Object.keys(objectParamStrategies).length > 0) return `filterParams(${baseArgs}, ${preserveRequiredNullables}, new Set<string>(${JSON.stringify(nonPrimitiveKeys)}), ${JSON.stringify(objectParamStrategies)} as const)`;
	if (nonPrimitiveKeys.length > 0) return `filterParams(${baseArgs}, ${preserveRequiredNullables}, new Set<string>(${JSON.stringify(nonPrimitiveKeys)}))`;
	return `filterParams(${baseArgs}${preserveRequiredNullables ? ", true" : ""})`;
};
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
const buildAngularParamsFilterExpression = ({ paramsExpression, requiredNullableParamKeys = [], preserveRequiredNullables = false, nonPrimitiveKeys = [], objectParamStrategies = {}, paramsFilter, useSharedHelper }) => {
	if (paramsFilter) return `${paramsFilter.name}(${paramsExpression})`;
	if (useSharedHelper) return getAngularFilteredParamsCallExpression(paramsExpression, requiredNullableParamKeys, preserveRequiredNullables, nonPrimitiveKeys, objectParamStrategies);
	return getAngularFilteredParamsExpression(paramsExpression, requiredNullableParamKeys, preserveRequiredNullables, nonPrimitiveKeys, objectParamStrategies);
};
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
const getAngularObjectParamStrategies = ({ queryParams, paramsSerializer, paramsFilter, queryObjectSerialization }) => {
	if (paramsFilter || paramsSerializer || queryObjectSerialization === "legacy" || !queryParams?.objectQueryParams?.length) return {};
	return Object.fromEntries(queryParams.objectQueryParams.map(({ key, strategy }) => [key, strategy]));
};
function generateBodyOptions(body, isFormData, isFormUrlEncoded) {
	if (isFormData && body.formData) return "formData";
	if (isFormUrlEncoded && body.formUrlEncoded) return "formUrlEncoded";
	if (body.implementation) return body.implementation;
}
function generateAxiosOptions({ response, isExactOptionalPropertyTypes, angularObserve, angularParamsRef, requiredNullableQueryParamKeys, nonPrimitiveQueryParamKeys, objectQueryParamStrategies, queryParams, headers, requestOptions, hasSignal, hasSignalParam = false, isAngular, paramsSerializer, paramsSerializerOptions, paramsFilter }) {
	const isRequestOptions = requestOptions !== false;
	const angularPassthroughQueryParamKeys = paramsSerializer ? nonPrimitiveQueryParamKeys : [];
	const angularObjectParamStrategies = paramsSerializer ? {} : objectQueryParamStrategies ?? {};
	const signalVar = hasSignalParam ? "querySignal" : "signal";
	const signalProp = hasSignalParam ? `signal: ${signalVar}` : "signal";
	if (!queryParams && !headers && !response.isBlob && response.definition.success !== "string") {
		if (isRequestOptions) return isAngular ? angularObserve ? `{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: '${angularObserve}',
      }` : "(options as Omit<NonNullable<typeof options>, 'observe'>)" : "options";
		if (hasSignal) return isExactOptionalPropertyTypes ? `...(${signalVar} ? { ${signalProp} } : {})` : signalProp;
		return "";
	}
	let value = "";
	if (!isRequestOptions) {
		if (queryParams) if (isAngular) {
			const iifeExpr = buildAngularParamsFilterExpression({
				paramsExpression: "params ?? {}",
				requiredNullableParamKeys: requiredNullableQueryParamKeys,
				preserveRequiredNullables: !!paramsSerializer,
				nonPrimitiveKeys: angularPassthroughQueryParamKeys,
				objectParamStrategies: angularObjectParamStrategies,
				paramsFilter,
				useSharedHelper: false
			});
			value += paramsSerializer ? `\n        params: ${paramsSerializer.name}(${iifeExpr}),` : `\n        params: ${iifeExpr},`;
		} else value += "\n        params,";
		if (headers) value += "\n        headers,";
		if (hasSignal) value += isExactOptionalPropertyTypes ? `\n        ...(${signalVar} ? { ${signalProp} } : {}),` : `\n        ${signalProp},`;
	}
	if (!isObject(requestOptions) || !Object.hasOwn(requestOptions, "responseType")) {
		const successResponseType = getSuccessResponseType(response);
		if (successResponseType) value += `\n        responseType: '${successResponseType}',`;
	}
	if (isObject(requestOptions)) value += `\n ${stringify(requestOptions)?.slice(1, -1)}`;
	if (isRequestOptions) {
		value += isAngular ? "\n    ...(options as Omit<NonNullable<typeof options>, 'observe'>)," : "\n    ...options,";
		if (isAngular && angularObserve) value += `\n        observe: '${angularObserve}',`;
		if (queryParams) if (isAngular && angularParamsRef) value += `\n        params: ${angularParamsRef},`;
		else if (isAngular && paramsSerializer) {
			const callExpr = buildAngularParamsFilterExpression({
				paramsExpression: "{...params, ...options?.params}",
				requiredNullableParamKeys: requiredNullableQueryParamKeys,
				preserveRequiredNullables: true,
				nonPrimitiveKeys: angularPassthroughQueryParamKeys,
				objectParamStrategies: angularObjectParamStrategies,
				paramsFilter,
				useSharedHelper: true
			});
			value += `\n        params: ${paramsSerializer.name}(${callExpr}),`;
		} else if (isAngular) {
			const callExpr = buildAngularParamsFilterExpression({
				paramsExpression: "{...params, ...options?.params}",
				requiredNullableParamKeys: requiredNullableQueryParamKeys,
				nonPrimitiveKeys: angularPassthroughQueryParamKeys,
				objectParamStrategies: angularObjectParamStrategies,
				paramsFilter,
				useSharedHelper: true
			});
			value += `\n        params: ${callExpr},`;
		} else value += "\n        params: {...params, ...options?.params},";
		if (headers) value += "\n        headers: {...headers, ...options?.headers},";
	}
	if (!isAngular && queryParams && (paramsSerializer || paramsSerializerOptions?.qs)) {
		const qsOptions = paramsSerializerOptions?.qs;
		value += paramsSerializer ? `\n        paramsSerializer: ${paramsSerializer.name},` : `\n        paramsSerializer: (params) => qs.stringify(params, ${JSON.stringify(qsOptions)}),`;
	}
	return value;
}
function generateOptions({ route, body, angularObserve, angularParamsRef, headers, queryParams, objectQueryParamStrategies, response, verb, requestOptions, isFormData, isFormUrlEncoded, isAngular, isExactOptionalPropertyTypes, hasSignal, hasSignalParam, paramsSerializer, paramsSerializerOptions, paramsFilter }) {
	const bodyIdentifier = getIsBodyVerb(verb) ? generateBodyOptions(body, isFormData, isFormUrlEncoded) : void 0;
	const axiosOptions = generateAxiosOptions({
		response,
		angularObserve,
		angularParamsRef,
		requiredNullableQueryParamKeys: queryParams?.requiredNullableKeys,
		nonPrimitiveQueryParamKeys: queryParams?.nonPrimitiveKeys,
		objectQueryParamStrategies,
		queryParams: queryParams?.schema,
		headers: headers?.schema,
		requestOptions,
		isExactOptionalPropertyTypes,
		hasSignal,
		hasSignalParam,
		isAngular: isAngular ?? false,
		paramsSerializer,
		paramsSerializerOptions,
		paramsFilter
	});
	const trimmedAxiosOptions = axiosOptions.trim();
	const isRawOptionsArgument = trimmedAxiosOptions === "options" || trimmedAxiosOptions.startsWith("(") && trimmedAxiosOptions.endsWith(")") || trimmedAxiosOptions.startsWith("{") && trimmedAxiosOptions.endsWith("}");
	const optionsArgument = axiosOptions ? isRawOptionsArgument ? axiosOptions : `{${axiosOptions}}` : "";
	if (verb === Verbs.DELETE) {
		if (!bodyIdentifier) return `\n      \`${route}\`${optionsArgument ? `,${optionsArgument}` : ""}\n    `;
		const deleteBodyOptions = isRawOptionsArgument ? `...${optionsArgument}` : axiosOptions;
		return `\n      \`${route}\`,{${`${isAngular ? "body" : "data"}: ${bodyIdentifier}`}${axiosOptions ? `,${deleteBodyOptions}` : ""}}\n    `;
	}
	const bodyOrOptions = getIsBodyVerb(verb) ? `\n      ${bodyIdentifier ?? "undefined"},` : "";
	return `\n      \`${route}\`${bodyOrOptions || optionsArgument ? "," : ""}${bodyOrOptions}${optionsArgument}\n    `;
}
function generateBodyMutatorConfig(body, isFormData, isFormUrlEncoded) {
	if (isFormData && body.formData) return ",\n       data: formData";
	if (isFormUrlEncoded && body.formUrlEncoded) return ",\n       data: formUrlEncoded";
	if (body.implementation) return `,\n      data: ${body.implementation}`;
	return "";
}
function generateQueryParamsAxiosConfig(response, isAngular, requiredNullableQueryParamKeys, queryParams, paramsFilter) {
	if (!queryParams && !response.isBlob) return "";
	let value = "";
	if (queryParams) if (isAngular) {
		const paramsExpr = buildAngularParamsFilterExpression({
			paramsExpression: "params ?? {}",
			requiredNullableParamKeys: requiredNullableQueryParamKeys,
			nonPrimitiveKeys: queryParams.nonPrimitiveKeys,
			paramsFilter,
			useSharedHelper: false
		});
		value += `,\n        params: ${paramsExpr}`;
	} else value += ",\n        params";
	if (response.isBlob) value += `,\n        responseType: 'blob'`;
	return value;
}
function generateMutatorConfig({ route, body, headers, queryParams, response, verb, isFormData, isFormUrlEncoded, hasSignal, hasSignalParam = false, isExactOptionalPropertyTypes, isAngular, paramsFilter }) {
	const bodyOptions = getIsBodyVerb(verb) ? generateBodyMutatorConfig(body, isFormData, isFormUrlEncoded) : "";
	const queryParamsOptions = generateQueryParamsAxiosConfig(response, isAngular ?? false, queryParams?.requiredNullableKeys, queryParams, paramsFilter);
	const ignoreContentTypes = isAngular ? ["multipart/form-data"] : [];
	const headerOptions = body.contentType && !ignoreContentTypes.includes(body.contentType) ? `,\n      headers: {'Content-Type': '${body.contentType}', ${headers ? "...headers" : ""}}` : headers ? ",\n      headers" : "";
	const signalVar = hasSignalParam ? "querySignal" : "signal";
	const signalProp = hasSignalParam ? `signal: ${signalVar}` : "signal";
	return `{url: \`${route}\`, method: '${verb.toUpperCase()}'${headerOptions}${bodyOptions}${queryParamsOptions}${hasSignal ? `, ${isExactOptionalPropertyTypes ? `...(${signalVar} ? { ${signalProp} }: {})` : signalProp}` : ""}\n    }`;
}
function generateMutatorRequestOptions(requestOptions, hasSecondArgument) {
	if (!hasSecondArgument) return isObject(requestOptions) ? `{${stringify(requestOptions)?.slice(1, -1)}}` : "";
	if (isObject(requestOptions)) return `{${stringify(requestOptions)?.slice(1, -1)} ...options}`;
	return "options";
}
function generateFormDataAndUrlEncodedFunction({ body, formData, formUrlEncoded, isFormData, isFormUrlEncoded }) {
	if (isFormData && body.formData) {
		if (formData) return `const formData = ${formData.name}(${body.implementation})`;
		return body.formData;
	}
	if (isFormUrlEncoded && body.formUrlEncoded) {
		if (formUrlEncoded) return `const formUrlEncoded = ${formUrlEncoded.name}(${body.implementation})`;
		return body.formUrlEncoded;
	}
	return "";
}
//#endregion
//#region src/generators/parameter-definition.ts
function generateParameterDefinition(parameters = {}, context, suffix) {
	if (isEmptyish(parameters)) return [];
	const generatorSchemas = [];
	for (const [parameterName, parameter] of entries(parameters)) {
		const modelName = sanitize(`${pascal(parameterName)}${suffix}`, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		const { schema, imports } = resolveRef(parameter, context);
		if (schema.in !== "query" && schema.in !== "header") continue;
		if (!schema.schema || imports.length > 0) {
			generatorSchemas.push({
				name: modelName,
				imports: imports.length > 0 ? [{
					name: imports[0].name,
					schemaName: imports[0].schemaName
				}] : [],
				model: `export type ${modelName} = ${imports.length > 0 ? imports[0].name : "unknown"};\n`,
				dependencies: imports.length > 0 ? [imports[0].name] : []
			});
			continue;
		}
		const resolvedObject = resolveObject({
			schema: schema.schema,
			propName: modelName,
			context
		});
		const model = `${jsDoc(schema)}export type ${modelName} = ${resolvedObject.value || "unknown"};\n`;
		generatorSchemas.push(...resolvedObject.schemas);
		if (modelName !== resolvedObject.value) generatorSchemas.push({
			name: modelName,
			model,
			imports: resolvedObject.imports,
			dependencies: resolvedObject.dependencies
		});
	}
	return generatorSchemas;
}
//#endregion
//#region src/generators/interface.ts
/**
* Generate the interface string
* An eslint comment is insert if the resulted object is empty
*
* @param name interface name
* @param schema
*/
function generateInterface({ name, schema, context, genericParams }) {
	const scalar = getScalar({
		item: schema,
		name,
		context
	});
	const isEmptyObject = scalar.value === "{}";
	const shouldUseTypeAlias = context.output.override.useTypeOverInterfaces ?? scalar.useTypeAlias;
	const genericSuffix = genericParams && genericParams.length > 0 ? `<${genericParams.join(", ")}>` : "";
	let model = "";
	model += jsDoc(schema);
	if (isEmptyObject) model += "// eslint-disable-next-line @typescript-eslint/no-empty-interface\n";
	if (scalar.type === "object" && !shouldUseTypeAlias) {
		const properties = schema.properties;
		if (properties && Object.values(properties).length > 0 && Object.values(properties).every((item) => "const" in item)) {
			const mappedScalarValue = scalar.value.replaceAll(";", ",").replaceAll("?:", ":");
			model += `export const ${name}Value = ${mappedScalarValue} as const;\nexport type ${name}${genericSuffix} = typeof ${name}Value;\n`;
		} else {
			const blankInterfaceValue = scalar.value === "unknown" ? "{}" : scalar.value;
			model += `export interface ${name}${genericSuffix} ${blankInterfaceValue}\n`;
		}
	} else model += `export type ${name}${genericSuffix} = ${scalar.value};\n`;
	const externalModulesImportsOnly = scalar.imports.filter((importName) => importName.alias ? importName.alias !== name : importName.name !== name);
	return [...scalar.schemas, {
		name,
		model,
		imports: externalModulesImportsOnly,
		dependencies: scalar.dependencies,
		schema
	}];
}
//#endregion
//#region src/generators/schema-definition.ts
/**
* Extract all types from #/components/schemas
*/
function generateSchemasDefinition(schemas = {}, context, suffix, filters) {
	if (isEmptyish(schemas)) return [];
	const transformedSchemas = resolveDiscriminators(schemas, context);
	let generateSchemas = Object.entries(transformedSchemas);
	if (filters?.schemas) {
		const schemasFilters = filters.schemas;
		const mode = filters.mode ?? "include";
		generateSchemas = generateSchemas.filter(([schemaName]) => {
			const isMatch = schemasFilters.some((filter) => isString(filter) ? filter === schemaName : filter.test(schemaName));
			return mode === "include" ? isMatch : !isMatch;
		});
	}
	const models = generateSchemas.flatMap(([schemaName, schema]) => generateSchemaDefinitions(schemaName, schema, context, suffix));
	const seenNames = /* @__PURE__ */ new Set();
	const deduplicatedModels = [];
	for (const schema of models) {
		const normalizedName = conventionName(schema.name, context.output.namingConvention);
		if (!seenNames.has(normalizedName)) {
			seenNames.add(normalizedName);
			if (context.output.factoryMethods && schema.schema) {
				const factoryData = generateFactory(schema.schema, schema.name, context);
				if (factoryData) if (context.output.factoryMethods.mode === "single") {
					schema.model += `\n${factoryData.model}`;
					for (const imp of factoryData.imports) if (!schema.imports.some((existing) => existing.name === imp.name)) schema.imports.push(imp);
				} else {
					schema.factory = factoryData.model;
					schema.factoryImports = factoryData.imports;
					schema.factoryMode = context.output.factoryMethods.mode;
				}
			}
			deduplicatedModels.push(schema);
		}
	}
	return sortSchemasByDependencies(deduplicatedModels);
}
function sortSchemasByDependencies(schemas) {
	if (schemas.length === 0) return schemas;
	const schemaNames = new Set(schemas.map((schema) => schema.name));
	const dependencyMap = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const dependencies = /* @__PURE__ */ new Set();
		if (schema.dependencies) {
			for (const dependencyName of schema.dependencies) if (dependencyName && schemaNames.has(dependencyName)) dependencies.add(dependencyName);
		}
		for (const imp of schema.imports) {
			const dependencyName = imp.alias ?? imp.name;
			if (dependencyName && schemaNames.has(dependencyName)) dependencies.add(dependencyName);
		}
		dependencyMap.set(schema.name, dependencies);
	}
	const sorted = [];
	const temporary = /* @__PURE__ */ new Set();
	const permanent = /* @__PURE__ */ new Set();
	const schemaMap = new Map(schemas.map((schema) => [schema.name, schema]));
	const visit = (name) => {
		if (permanent.has(name)) return;
		if (temporary.has(name)) return;
		temporary.add(name);
		const dependencies = dependencyMap.get(name);
		if (dependencies) {
			for (const dep of dependencies) if (dep !== name) visit(dep);
		}
		temporary.delete(name);
		permanent.add(name);
		const schema = schemaMap.get(name);
		if (schema) sorted.push(schema);
	};
	for (const schema of schemas) visit(schema.name);
	return sorted;
}
function shouldCreateInterface(schema) {
	const isNullable = isArray(schema.type) && schema.type.includes("null");
	return (!schema.type || schema.type === "object") && !schema.allOf && !schema.oneOf && !schema.anyOf && isDereferenced(schema) && !schema.enum && !isNullable;
}
function collectGenericParams(schema) {
	const defs = schema.$defs;
	if (!defs || typeof defs !== "object") return [];
	const anchors = [];
	for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const rec = defSchema;
		if (rec.$dynamicAnchor !== void 0 && rec.$ref === void 0) anchors.push(rec.$dynamicAnchor);
	}
	const uniqueNames = dynamicAnchorsToUniqueParamNames(anchors);
	return anchors.map((anchor) => ({
		anchorName: anchor,
		paramName: uniqueNames.get(anchor) ?? dynamicAnchorToParamName(anchor)
	}));
}
function generateSchemaDefinitions(schemaName, schema, context, suffix) {
	const sanitizedSchemaName = sanitize(`${pascal(schemaName)}${suffix}`, {
		underscore: "_",
		whitespace: "_",
		dash: true,
		es5keyword: true,
		es5IdentifierName: true
	});
	if (isBoolean(schema)) return [{
		name: sanitizedSchemaName,
		model: `export type ${sanitizedSchemaName} = ${schema ? "any" : "never"};\n`,
		imports: [],
		schema
	}];
	const alias = extractBoundAliasInfo(schema, context);
	if (alias) {
		const genericParams = alias.genericParams.map((paramName) => ({
			anchorName: paramName,
			paramName
		}));
		const genericSuffix = genericParams.length > 0 ? `<${genericParams.map((p) => p.paramName).join(", ")}>` : "";
		const typeArgsStr = alias.typeArgs.join(", ");
		const genericPart = `${alias.genericName}<${typeArgsStr}>`;
		const schemaType = schema.type;
		const nullable = Array.isArray(schemaType) && schemaType.includes("null") || schema.nullable === true ? " | null" : "";
		let model;
		const allImports = [{
			name: alias.genericName,
			schemaName: alias.genericName
		}, ...alias.imports];
		if (alias.extraSchemas && alias.extraSchemas.length > 0) {
			const aliasScopedContext = {
				...context,
				dynamicScope: buildDynamicScope(schemaName, schema, context)
			};
			const subSchemas = [];
			model = `export type ${sanitizedSchemaName}${genericSuffix} = (${[genericPart, ...alias.extraSchemas.map((extraSchema) => {
				const resolved = resolveValue({
					schema: extraSchema,
					name: sanitizedSchemaName,
					context: aliasScopedContext
				});
				for (const imp of resolved.imports) {
					const impSchemaName = imp.schemaName ?? imp.name;
					if (!allImports.some((a) => a.name === imp.name && a.schemaName === impSchemaName)) allImports.push({
						name: imp.name,
						schemaName: impSchemaName
					});
				}
				for (const sub of resolved.schemas) if (sub.name !== sanitizedSchemaName) subSchemas.push(sub);
				return resolved.value;
			})].join(" & ")})${nullable};\n`;
			return [...subSchemas, {
				name: sanitizedSchemaName,
				model,
				imports: allImports,
				dependencies: allImports.map((i) => i.name),
				schema
			}];
		} else model = `export type ${sanitizedSchemaName}${genericSuffix} = ${genericPart}${nullable};\n`;
		return [{
			name: sanitizedSchemaName,
			model,
			imports: allImports,
			dependencies: allImports.map((i) => i.name),
			schema
		}];
	}
	const scopedContext = isBoolean(schema) ? context : {
		...context,
		dynamicScope: buildDynamicScope(schemaName, schema, context)
	};
	const genericParams = collectGenericParams(schema);
	if (shouldCreateInterface(schema)) return generateInterface({
		name: sanitizedSchemaName,
		schema,
		context: scopedContext,
		genericParams: genericParams.length > 0 ? genericParams.map((p) => p.paramName) : void 0
	});
	const resolvedValue = resolveValue({
		schema,
		name: sanitizedSchemaName,
		context: scopedContext
	});
	let output = "";
	let imports = resolvedValue.imports;
	output += jsDoc(schema);
	if (resolvedValue.isEnum && !resolvedValue.isRef) output += getEnum(resolvedValue.value, sanitizedSchemaName, getEnumNames(resolvedValue.originalSchema), context.output.override.enumGenerationType, getEnumDescriptions(resolvedValue.originalSchema), context.output.override.namingConvention.enum);
	else if (sanitizedSchemaName === resolvedValue.value && resolvedValue.isRef) {
		const { schema: referredSchema } = resolveRef(schema, scopedContext);
		if (!shouldCreateInterface(referredSchema)) {
			const imp = resolvedValue.imports.find((imp) => imp.name === sanitizedSchemaName);
			if (imp) {
				const alias = `${resolvedValue.value}Bis`;
				output += `export type ${sanitizedSchemaName} = ${alias};\n`;
				imports = imports.map((imp) => imp.name === sanitizedSchemaName ? {
					...imp,
					alias
				} : imp);
				resolvedValue.dependencies = [imp.name];
			} else output += `export type ${sanitizedSchemaName} = ${resolvedValue.value};\n`;
		}
	} else {
		resolvedValue.schemas = resolvedValue.schemas.filter((schema) => {
			if (schema.name !== sanitizedSchemaName) return true;
			output += `${schema.model}\n`;
			imports = [...imports, ...schema.imports];
			resolvedValue.dependencies.push(...schema.dependencies ?? []);
			return false;
		});
		const genericSuffix = genericParams.length > 0 ? `<${genericParams.map((p) => p.paramName).join(", ")}>` : "";
		output += `export type ${sanitizedSchemaName}${genericSuffix} = ${resolvedValue.value};\n`;
	}
	return [...resolvedValue.schemas, {
		name: sanitizedSchemaName,
		model: output,
		imports,
		dependencies: resolvedValue.dependencies,
		schema
	}];
}
//#endregion
//#region src/generators/verbs-options.ts
async function buildVerbOption({ verb, output, operation, route, pathRoute, verbParameters = [], context, body, operationName, typeName, operationId, override, tags, deprecated, description, summary }) {
	const response = getResponse({
		responses: operation.responses ?? {},
		operationName: typeName,
		context,
		contentType: override.contentType
	});
	const parameters = getParameters({
		parameters: [...verbParameters, ...operation.parameters ?? []],
		context
	});
	const queryParams = getQueryParams({
		queryParams: parameters.query,
		operationName: typeName,
		context
	});
	const headers = output.headers ? getQueryParams({
		queryParams: parameters.header,
		operationName: typeName,
		context,
		suffix: "headers"
	}) : void 0;
	const params = getParams({
		route,
		pathParams: parameters.path,
		operationId,
		context,
		output
	});
	const verbOption = {
		verb,
		tags,
		route,
		pathRoute,
		summary,
		operationId,
		operationName,
		typeName,
		response,
		body,
		headers,
		queryParams,
		params,
		props: getProps({
			body,
			queryParams,
			params,
			headers,
			operationName: typeName,
			context
		}),
		mutator: await generateMutator({
			output: output.target,
			name: typeName,
			mutator: override.mutator,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}),
		formData: !override.formData.disabled && body.formData ? await generateMutator({
			output: output.target,
			name: typeName,
			mutator: override.formData.mutator,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		formUrlEncoded: isString(override.formUrlEncoded) || isObject(override.formUrlEncoded) ? await generateMutator({
			output: output.target,
			name: typeName,
			mutator: override.formUrlEncoded,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		paramsSerializer: isString(override.paramsSerializer) || isObject(override.paramsSerializer) ? await generateMutator({
			output: output.target,
			name: "paramsSerializer",
			mutator: override.paramsSerializer,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		paramsFilter: isString(override.paramsFilter) || isObject(override.paramsFilter) ? await generateMutator({
			output: output.target,
			name: "paramsFilter",
			mutator: override.paramsFilter,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		fetchReviver: isString(override.fetch.jsonReviver) || isObject(override.fetch.jsonReviver) ? await generateMutator({
			output: output.target,
			name: "fetchReviver",
			mutator: override.fetch.jsonReviver,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		override,
		doc: jsDoc({
			description,
			deprecated,
			summary
		}),
		deprecated,
		originalOperation: operation
	};
	const transformer = await dynamicImport(override.transformer, context.workspace);
	return transformer ? transformer(verbOption) : verbOption;
}
async function generateVerbOptions({ verb, output, operation, route, pathRoute, verbParameters = [], context }) {
	const { requestBody, tags: rawTags, deprecated: rawDeprecated, description: rawDescription, summary: rawSummary } = operation;
	const tags = rawTags ?? [];
	const deprecated = rawDeprecated;
	const description = rawDescription;
	const summary = rawSummary;
	const operationId = getOperationId(operation, route, verb);
	const overrideOperation = output.override.operations[operationId];
	let overrideTag = {};
	for (const [tag, options] of Object.entries(output.override.tags)) if (tags.includes(tag) && options) overrideTag = mergeDeep(overrideTag, options);
	const override = mergeDeep(mergeDeep(output.override, overrideTag), overrideOperation ?? {});
	const overrideOperationName = overrideOperation?.operationName ?? output.override.operationName;
	let operationName;
	let typeName;
	if (overrideOperationName) {
		const result = overrideOperationName(operation, route, verb);
		if (Array.isArray(result)) {
			operationName = sanitize(result[0], { es5keyword: true });
			typeName = sanitize(result[1], { es5keyword: true });
		} else {
			operationName = sanitize(result, { es5keyword: true });
			typeName = operationName;
		}
	} else {
		operationName = sanitize(camel(operationId), { es5keyword: true });
		typeName = operationName;
	}
	if (override.splitByContentType && requestBody) {
		const bodies = getBodiesByContentType({
			requestBody,
			operationName: typeName,
			context,
			contentType: override.contentType
		});
		const results = [];
		for (const bodyEntry of bodies) {
			const { contentTypeSuffix, ...body } = bodyEntry;
			const verbOption = await buildVerbOption({
				verb,
				output,
				operation,
				route,
				pathRoute,
				verbParameters,
				context,
				body,
				operationName: contentTypeSuffix ? `${operationName}With${contentTypeSuffix}` : operationName,
				typeName: contentTypeSuffix ? `${typeName}With${contentTypeSuffix}` : typeName,
				operationId,
				override,
				tags,
				deprecated,
				description,
				summary
			});
			results.push(verbOption);
		}
		return results;
	}
	return [await buildVerbOption({
		verb,
		output,
		operation,
		route,
		pathRoute,
		verbParameters,
		context,
		body: requestBody ? getBody({
			requestBody,
			operationName: typeName,
			context,
			contentType: override.contentType
		}) : {
			originalSchema: {},
			definition: "",
			implementation: "",
			imports: [],
			schemas: [],
			formData: "",
			formUrlEncoded: "",
			contentType: "",
			isOptional: false
		},
		operationName,
		typeName,
		operationId,
		override,
		tags,
		deprecated,
		description,
		summary
	})];
}
function generateVerbsOptions({ verbs, input, output, route, pathRoute, context }) {
	return asyncReduce(filteredVerbs(verbs, input.filters), async (acc, [verb, operation]) => {
		if (isVerb(verb)) {
			const verbOptions = await generateVerbOptions({
				verb,
				output,
				verbParameters: verbs.parameters,
				route,
				pathRoute,
				operation,
				context
			});
			acc.push(...verbOptions);
		}
		return acc;
	}, []);
}
//#endregion
//#region src/writers/file.ts
const TRAILING_WHITESPACE_RE = /[^\S\r\n]+$/gm;
/**
* Write generated code to a file, stripping trailing whitespace from each line.
*
* Template literals in code generators can produce lines with only whitespace
* when conditional expressions evaluate to empty strings. This function
* ensures the output is always clean regardless of generator implementation.
*/
async function writeGeneratedFile(filePath, content) {
	await fs$1.outputFile(filePath, content.replaceAll(TRAILING_WHITESPACE_RE, ""));
}
//#endregion
//#region src/writers/schema-tag-mapper.ts
const SHARED_DIR = ".";
function buildSchemaTagMap(operations, schemas) {
	const schemaNames = new Set(schemas.map((s) => s.name));
	const schemaToTags = /* @__PURE__ */ new Map();
	for (const schema of schemas) if (!schemaToTags.has(schema.name)) schemaToTags.set(schema.name, /* @__PURE__ */ new Set());
	for (const operation of operations) {
		const tag = kebab(operation.tags[0] ?? "default");
		for (const imp of operation.imports) if (!imp.importPath && schemaNames.has(imp.name)) addTag(schemaToTags, imp.name, tag);
	}
	propagateTransitiveTags(schemaToTags, new Map(schemas.map((s) => [s.name, s])));
	const result = /* @__PURE__ */ new Map();
	for (const [name, tags] of schemaToTags) if (tags.size === 0 || tags.size > 1) result.set(name, ".");
	else result.set(name, [...tags][0]);
	return result;
}
function addTag(schemaToTags, schemaName, tag) {
	if (!schemaToTags.has(schemaName)) schemaToTags.set(schemaName, /* @__PURE__ */ new Set());
	schemaToTags.get(schemaName).add(tag);
}
function propagateTransitiveTags(schemaToTags, schemaByName) {
	let changed = true;
	while (changed) {
		changed = false;
		for (const [name, tags] of schemaToTags) {
			const schema = schemaByName.get(name);
			if (!schema) continue;
			for (const imp of schema.imports) {
				if (!isSchemaImport$1(imp)) continue;
				if (!schemaByName.has(imp.name)) continue;
				const targetTags = schemaToTags.get(imp.name);
				if (!targetTags) continue;
				for (const tag of tags) if (!targetTags.has(tag)) {
					targetTags.add(tag);
					changed = true;
				}
			}
		}
	}
}
function isSchemaImport$1(imp) {
	return !imp.importPath;
}
//#endregion
//#region src/writers/schemas.ts
/**
* Patterns to detect operation-derived types (params, bodies, responses).
* These types are auto-generated from OpenAPI operations, not from component schemas.
*/
const OPERATION_TYPE_PATTERNS = [
	/Params$/i,
	/Body$/,
	/Body(One|Two|Three|Four|Five|Item)$/,
	/Parameter$/i,
	/Query$/i,
	/Header$/i,
	/Response\d*$/i,
	/^[1-5]\d{2}$/,
	/\d{3}(One|Two|Three|Four|Five|Item)$/i,
	/^(get|post|put|patch|delete|head|options)[A-Z].*\d{3}$/
];
/**
* Check if a schema name matches operation type patterns.
*/
function isOperationType(schemaName) {
	return OPERATION_TYPE_PATTERNS.some((pattern) => pattern.test(schemaName));
}
/**
* Split schemas into regular and operation types.
*/
function splitSchemasByType(schemas) {
	const regularSchemas = [];
	const operationSchemas = [];
	for (const schema of schemas) if (isOperationType(schema.name)) operationSchemas.push(schema);
	else regularSchemas.push(schema);
	return {
		regularSchemas,
		operationSchemas
	};
}
/**
* Fix cross-directory imports when schemas reference other schemas in a different directory.
* Updates import paths to use correct relative paths between directories.
*/
function fixSchemaImports(schemas, targetSchemaNames, fromPath, toPath, namingConvention, fileExtension, tsconfig) {
	const relativePath = relativeSafe(fromPath, toPath);
	const importExtension = getImportExtension(fileExtension, tsconfig);
	for (const schema of schemas) schema.imports = schema.imports.map((imp) => {
		if (targetSchemaNames.has(imp.name)) {
			const fileName = conventionName(imp.name, namingConvention);
			return {
				...imp,
				importPath: joinSafe(relativePath, fileName) + importExtension
			};
		}
		return imp;
	});
}
/**
* Fix imports in operation schemas that reference regular schemas.
*/
function fixCrossDirectoryImports(operationSchemas, regularSchemaNames, schemaPath, operationSchemaPath, namingConvention, fileExtension, tsconfig) {
	fixSchemaImports(operationSchemas, regularSchemaNames, operationSchemaPath, schemaPath, namingConvention, fileExtension, tsconfig);
}
/**
* Fix imports in regular schemas that reference operation schemas.
*/
function fixRegularSchemaImports(regularSchemas, operationSchemaNames, schemaPath, operationSchemaPath, namingConvention, fileExtension, tsconfig) {
	fixSchemaImports(regularSchemas, operationSchemaNames, schemaPath, operationSchemaPath, namingConvention, fileExtension, tsconfig);
}
function getSchemaKey(schemaPath, schemaName, namingConvention, fileExtension) {
	return getPath(schemaPath, conventionName(schemaName, namingConvention), fileExtension).toLowerCase().replaceAll("\\", "/");
}
function getSchemaGroups(schemaPath, schemas, namingConvention, fileExtension) {
	return groupBy(schemas, (schema) => getSchemaKey(schemaPath, schema.name, namingConvention, fileExtension));
}
function getCanonicalMap(schemaGroups, schemaPath, namingConvention, fileExtension) {
	const canonicalPathMap = /* @__PURE__ */ new Map();
	const canonicalNameMap = /* @__PURE__ */ new Map();
	for (const [key, groupSchemas] of Object.entries(schemaGroups)) {
		const canonicalInfo = {
			importPath: getPath(schemaPath, conventionName(groupSchemas[0].name, namingConvention), fileExtension),
			name: groupSchemas[0].name
		};
		canonicalPathMap.set(key, canonicalInfo);
		for (const schema of groupSchemas) canonicalNameMap.set(schema.name, canonicalInfo);
	}
	return {
		canonicalPathMap,
		canonicalNameMap
	};
}
function normalizeCanonicalImportPaths(schemas, canonicalPathMap, canonicalNameMap, schemaPath, namingConvention, fileExtension, tsconfig, factoryOutputDirectory) {
	const importExtension = getImportExtension(fileExtension, tsconfig);
	const factoryDir = factoryOutputDirectory ?? schemaPath;
	for (const schema of schemas) {
		schema.imports = schema.imports.map((imp) => {
			const canonicalByName = canonicalNameMap.get(imp.name);
			const resolvedImportKey = resolveImportKey(schemaPath, imp.importPath ?? `./${conventionName(imp.name, namingConvention)}`, fileExtension);
			const canonicalByPath = canonicalPathMap.get(resolvedImportKey);
			const canonical = canonicalByName ?? canonicalByPath;
			if (!canonical?.importPath) return imp;
			const relative = relativeSafe(schemaPath, canonical.importPath.replaceAll("\\", "/"));
			const importPath = `${relative.endsWith(fileExtension) ? relative.slice(0, -fileExtension.length) : relative.replace(/\.ts$/, "")}${importExtension}`;
			return {
				...imp,
				importPath
			};
		});
		if (schema.factoryImports) schema.factoryImports = schema.factoryImports.map((imp) => {
			const canonicalByName = canonicalNameMap.get(imp.name);
			const resolvedImportKey = resolveImportKey(factoryDir, imp.importPath ?? `./${conventionName(imp.name, namingConvention)}`, fileExtension);
			const canonicalByPath = canonicalPathMap.get(resolvedImportKey);
			const canonical = canonicalByName ?? canonicalByPath;
			if (!canonical?.importPath) return imp;
			const relative = relativeSafe(factoryDir, canonical.importPath.replaceAll("\\", "/"));
			const importPath = `${relative.endsWith(fileExtension) ? relative.slice(0, -fileExtension.length) : relative.replace(/\.ts$/, "")}${importExtension}`;
			return {
				...imp,
				importPath
			};
		});
	}
}
function mergeSchemaGroup(schemas) {
	const baseSchemaName = schemas[0].name;
	const baseSchema = schemas[0].schema;
	const mergedImports = [...new Map(schemas.flatMap((schema) => schema.imports).map((imp) => [JSON.stringify(imp), imp])).values()];
	const mergedDependencies = [...new Set(schemas.flatMap((schema) => schema.dependencies ?? []))];
	const mergedFactory = schemas.map((s) => s.factory).filter(Boolean).join("\n");
	const mergedFactoryImports = [...new Map(schemas.flatMap((schema) => schema.factoryImports ?? []).map((imp) => [JSON.stringify(imp), imp])).values()];
	return {
		name: baseSchemaName,
		schema: baseSchema,
		model: schemas.map((schema) => schema.model).join("\n"),
		imports: mergedImports,
		dependencies: mergedDependencies,
		factory: mergedFactory || void 0,
		factoryImports: mergedFactoryImports,
		factoryMode: schemas[0].factoryMode
	};
}
function resolveImportKey(schemaPath, importPath, fileExtension) {
	return join(schemaPath, `${importPath}${fileExtension}`).toLowerCase().replaceAll("\\", "/");
}
function getSchema({ schema: { imports, model }, header, namingConvention = NamingConvention.CAMEL_CASE, importExtension }) {
	let file = header;
	file += generateImports({
		imports: imports.filter((imp) => !model.includes(`type ${imp.alias ?? imp.name} =`) && !model.includes(`interface ${imp.alias ?? imp.name} {`)),
		namingConvention,
		importExtension
	});
	file += imports.length > 0 ? "\n\n" : "\n";
	file += model;
	return file;
}
function getPath(path, name, fileExtension) {
	return nodePath.join(path, `${name}${fileExtension}`);
}
function writeModelInline(acc, model) {
	return acc + `${model}\n`;
}
function writeModelsInline(array) {
	let acc = "";
	for (const { model } of array) acc = writeModelInline(acc, model);
	return acc;
}
async function writeSchema({ path, schema, target, namingConvention, fileExtension, header, tsconfig }) {
	const name = conventionName(schema.name, namingConvention);
	try {
		await writeGeneratedFile(getPath(path, name, fileExtension), getSchema({
			schema,
			target,
			header,
			namingConvention,
			importExtension: getImportExtension(fileExtension, tsconfig)
		}));
	} catch (error) {
		throw new Error(`Oups... 🍻. An Error occurred while writing schema ${name} => ${String(error)}`, { cause: error });
	}
}
async function emitFactoryForSchema(schema, namingConvention, header, factoryDir, fileExtension, helpers) {
	if (schema.factory && schema.factoryMode) {
		const mode = schema.factoryMode;
		if (mode === "split") {
			const factoryName = `${conventionName(schema.name, namingConvention)}.factory`;
			helpers.separateFactoryNames.push(factoryName);
			const factoryFile = `${header}\n${generateImports({
				imports: schema.factoryImports ?? [],
				namingConvention
			})}\n\n${schema.factory}`;
			await writeGeneratedFile(getPath(factoryDir, factoryName, fileExtension), factoryFile);
		} else if (mode === "single-split") {
			helpers.isCombined.value = true;
			helpers.combinedFactoryContent.value += `${schema.factory}\n`;
			helpers.combinedFactoryImports.push(...schema.factoryImports ?? []);
		}
	}
}
async function writeSchemas({ schemaPath, schemas, target, namingConvention, fileExtension, header, indexFiles, tsconfig, factoryOutputDirectory }) {
	const schemaGroups = getSchemaGroups(schemaPath, schemas, namingConvention, fileExtension);
	const { canonicalPathMap, canonicalNameMap } = getCanonicalMap(schemaGroups, schemaPath, namingConvention, fileExtension);
	normalizeCanonicalImportPaths(schemas, canonicalPathMap, canonicalNameMap, schemaPath, namingConvention, fileExtension, tsconfig, factoryOutputDirectory);
	const factoryDir = factoryOutputDirectory ?? schemaPath;
	const combinedFactoryContent = { value: "" };
	const combinedFactoryImports = [];
	const isCombined = { value: false };
	const separateFactoryNames = [];
	const factoryHelpers = {
		separateFactoryNames,
		combinedFactoryContent,
		combinedFactoryImports,
		isCombined
	};
	for (const groupSchemas of Object.values(schemaGroups)) {
		if (groupSchemas.length === 1) {
			await writeSchema({
				path: schemaPath,
				schema: groupSchemas[0],
				target,
				namingConvention,
				fileExtension,
				header,
				tsconfig
			});
			const singleSchema = groupSchemas[0];
			await emitFactoryForSchema(singleSchema, namingConvention, header, factoryDir, fileExtension, factoryHelpers);
			continue;
		}
		const mergedSchema = mergeSchemaGroup(groupSchemas);
		await writeSchema({
			path: schemaPath,
			schema: mergedSchema,
			target,
			namingConvention,
			fileExtension,
			header,
			tsconfig
		});
		await emitFactoryForSchema(mergedSchema, namingConvention, header, factoryDir, fileExtension, factoryHelpers);
	}
	if (isCombined.value) {
		const factoryFileName = conventionName("factoryMethods", namingConvention);
		const factoryFile = `${header}\n${generateImports({
			imports: combinedFactoryImports,
			namingConvention
		})}\n\n${combinedFactoryContent.value}`;
		await writeGeneratedFile(getPath(factoryDir, factoryFileName, fileExtension), factoryFile);
	}
	if (indexFiles) {
		const schemaFilePath = nodePath.join(schemaPath, `index.ts`);
		await fs$1.ensureFile(schemaFilePath);
		const ext = getImportExtension(fileExtension, tsconfig);
		const conventionNamesSet = new Set(Object.values(schemaGroups).map((group) => conventionName(group[0].name, namingConvention)));
		try {
			const currentExports = [...conventionNamesSet].map((schemaName) => `export * from './${schemaName}${ext}';`);
			if (factoryOutputDirectory && normalizeSafe(factoryOutputDirectory) !== normalizeSafe(schemaPath) && (isCombined.value || separateFactoryNames.length > 0)) {
				const factoryIndexFilePath = nodePath.join(factoryOutputDirectory, `index.ts`);
				await fs$1.ensureFile(factoryIndexFilePath);
				const factoryExports = [];
				if (isCombined.value) {
					const factoryFileName = conventionName("factoryMethods", namingConvention);
					factoryExports.push(`export * from './${factoryFileName}${ext}';`);
				}
				for (const fName of separateFactoryNames) factoryExports.push(`export * from './${fName}${ext}';`);
				await writeGeneratedFile(factoryIndexFilePath, `${header}\n${factoryExports.join("\n")}\n`);
			} else {
				if (isCombined.value) {
					const factoryFileName = conventionName("factoryMethods", namingConvention);
					currentExports.push(`export * from './${factoryFileName}${ext}';`);
				}
				for (const fName of separateFactoryNames) currentExports.push(`export * from './${fName}${ext}';`);
			}
			await writeGeneratedFile(schemaFilePath, `${header}\n${[...new Set(currentExports)].toSorted((a, b) => a.localeCompare(b, "en", { numeric: true })).join("\n")}\n`);
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing schema index file ${schemaFilePath} => ${String(error)}`, { cause: error });
		}
	}
}
//#endregion
//#region src/writers/schemas-tags-split.ts
async function writeSchemasTagsSplit({ schemaPath, schemas, target, namingConvention, fileExtension, header, indexFiles, tsconfig, factoryOutputDirectory, operations }) {
	const schemaTagMap = buildSchemaTagMap(operations, schemas);
	const importExtension = getImportExtension(fileExtension, tsconfig);
	const groups = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const group = schemaTagMap.get(schema.name) ?? ".";
		if (!groups.has(group)) groups.set(group, []);
		groups.get(group).push(schema);
	}
	for (const [groupDir, groupSchemas] of groups) {
		const isRoot = groupDir === ".";
		const groupPath = isRoot ? schemaPath : nodePath.join(schemaPath, groupDir);
		fixCrossTagImports(groupSchemas, schemaTagMap, schemaPath, groupDir, namingConvention, importExtension);
		const groupFactoryDir = factoryOutputDirectory ? isRoot ? factoryOutputDirectory : nodePath.join(factoryOutputDirectory, groupDir) : void 0;
		await writeSchemas({
			schemaPath: groupPath,
			schemas: groupSchemas,
			target,
			namingConvention,
			fileExtension,
			header,
			indexFiles: !isRoot && indexFiles,
			tsconfig,
			factoryOutputDirectory: groupFactoryDir
		});
	}
	if (indexFiles && groups.size > 0) {
		const rootIndexPath = nodePath.join(schemaPath, "index.ts");
		const rootExports = (groups.get(".") ?? []).map((s) => {
			return `export * from './${conventionName(s.name, namingConvention)}${importExtension}';`;
		});
		const tagExports = [...groups.keys()].filter((dir) => dir !== ".").toSorted((a, b) => a.localeCompare(b, "en", { numeric: true })).map((dir) => {
			return `export * from '${importExtension ? `./${dir}/index${importExtension}` : `./${dir}`}';`;
		});
		await writeGeneratedFile(rootIndexPath, `${header}\n${[...rootExports, ...tagExports].join("\n")}\n`);
	}
}
function fixCrossTagImports(schemas, schemaTagMap, schemaPath, currentGroupDir, namingConvention, importExtension) {
	const fromPath = currentGroupDir === "." ? schemaPath : nodePath.join(schemaPath, currentGroupDir);
	for (const schema of schemas) {
		const fixImports = (imports) => imports.map((imp) => {
			const targetGroup = schemaTagMap.get(imp.name);
			if (targetGroup === void 0 || targetGroup === currentGroupDir) return imp;
			const importPath = joinSafe(relativeSafe(fromPath, targetGroup === "." ? schemaPath : nodePath.join(schemaPath, targetGroup)), conventionName(imp.name, namingConvention)) + importExtension;
			return {
				...imp,
				importPath
			};
		});
		schema.imports = fixImports(schema.imports);
		if (schema.factoryImports) schema.factoryImports = fixImports(schema.factoryImports);
	}
}
//#endregion
//#region src/writers/finalize-mock-implementation.ts
function getFinalizeMockImplementationOptions(output, mockOutputs) {
	const outputs = Array.isArray(mockOutputs) ? mockOutputs : [mockOutputs];
	const strictSchemaTypeNames = [...new Set(outputs.flatMap((mockOutput) => mockOutput.strictMockSchemaTypeNames ?? []))];
	const strictMockSchemaKinds = outputs.reduce((acc, mockOutput) => {
		if (!mockOutput.strictMockSchemaKinds) return acc;
		for (const [name, kind] of Object.entries(mockOutput.strictMockSchemaKinds)) acc[name] ??= kind;
		return acc;
	}, {});
	return {
		mockOptions: output.override.mock,
		strictSchemaTypeNames: strictSchemaTypeNames.length > 0 ? strictSchemaTypeNames : void 0,
		strictMockSchemaKinds: Object.keys(strictMockSchemaKinds).length > 0 ? strictMockSchemaKinds : void 0
	};
}
/** Drop schema-factory `{Schema}Mock` type imports that are declared locally. */
function filterLocalStrictMockTypeImports(imports, strictSchemaTypeNames) {
	if (!strictSchemaTypeNames?.length) return [...imports];
	const localMockTypeNames = new Set(strictSchemaTypeNames.map((name) => `${name}Mock`));
	return imports.filter((imp) => !(imp.schemaFactory && !imp.values && localMockTypeNames.has(imp.name)));
}
//#endregion
//#region src/writers/generate-imports-for-builder.ts
function generateImportsForBuilder(output, imports, relativeSchemasPath, schemaTagMap) {
	const isPackageImport = isObject(output.schemas) && !!output.schemas.importPath;
	const isZodSchemaOutput = isObject(output.schemas) && output.schemas.type === "zod";
	const schemaFactoryImports = imports.filter((i) => i.schemaFactory);
	const schemaFactoryImportExtension = isPackageImport ? "" : getImportExtension(output.fileExtension, output.tsconfig);
	const schemaFactoryDependency = getFakerSchemasImportPath(output.mock) ?? joinSafe(relativeSchemasPath, `index.faker${schemaFactoryImportExtension}`);
	const schemaFactoryDeps = schemaFactoryImports.length > 0 ? [{
		exports: uniqueBy(schemaFactoryImports, (entry) => `${entry.name}|${entry.alias ?? ""}`),
		dependency: schemaFactoryDependency
	}] : [];
	imports = imports.filter((i) => !i.schemaFactory);
	let schemaImports;
	if (output.indexFiles) schemaImports = isZodSchemaOutput ? [{
		exports: imports.filter((i) => !i.importPath),
		dependency: relativeSchemasPath
	}] : [{
		exports: imports.filter((i) => !i.importPath),
		dependency: relativeSchemasPath
	}];
	else {
		const importsByDependency = /* @__PURE__ */ new Map();
		for (const schemaImport of imports.filter((i) => !i.importPath)) {
			const normalizedName = conventionName(isZodSchemaOutput ? schemaImport.name : schemaImport.schemaName ?? schemaImport.name, output.namingConvention);
			const suffix = isZodSchemaOutput ? ".zod" : "";
			const importExtension = isPackageImport ? "" : getImportExtension(output.fileExtension, output.tsconfig);
			const tagDir = schemaTagMap?.get(schemaImport.name);
			const dependency = joinSafe(relativeSchemasPath, `${tagDir && tagDir !== "." ? `${tagDir}/` : ""}${normalizedName}${suffix}${importExtension}`);
			if (!importsByDependency.has(dependency)) importsByDependency.set(dependency, []);
			importsByDependency.get(dependency)?.push(schemaImport);
		}
		schemaImports = [...importsByDependency.entries()].map(([dependency, dependencyImports]) => ({
			dependency,
			exports: uniqueBy(dependencyImports, (entry) => `${entry.name}|${entry.alias ?? ""}|${String(entry.values)}|${String(entry.default)}`)
		}));
	}
	const otherImportsMap = /* @__PURE__ */ new Map();
	for (const imp of uniqueBy(imports.filter((i) => !!i.importPath), (x) => `${x.name}|${x.importPath}`)) {
		const existing = otherImportsMap.get(imp.importPath);
		if (existing) existing.push(imp);
		else otherImportsMap.set(imp.importPath, [imp]);
	}
	const otherImports = [...otherImportsMap.entries()].map(([dependency, exports]) => ({
		exports,
		dependency
	}));
	return [
		...schemaImports,
		...schemaFactoryDeps,
		...otherImports
	];
}
/**
* Extracts the faker generator's `schemasImportPath` from the normalized mock
* config, if one is configured. Returns `undefined` when there is no faker
* generator with schema factories enabled, or when `schemasImportPath` is not
* set.
*/
function getFakerSchemasImportPath(mock) {
	if (!mock) return;
	return mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && g.schemas === true)?.schemasImportPath;
}
//#endregion
//#region src/writers/mock-imports.ts
/** Maps `components/schemas` names to consolidated index.faker import symbols. */
function buildKnownSchemaFactoryImportSets(schemaNames) {
	const factoryNames = /* @__PURE__ */ new Set();
	const typeNames = /* @__PURE__ */ new Set();
	for (const name of schemaNames) {
		const typeName = pascal(name);
		factoryNames.add(`get${typeName}Mock`);
		typeNames.add(`${typeName}Mock`);
	}
	return {
		factoryNames,
		typeNames
	};
}
/**
* Recover schema-factory imports referenced in generated mock bodies but
* missing from the collected import list (e.g. after shared-array import
* aggregation on large specs). Scans for `get<Schema>Mock()` calls and
* `as <Schema>Mock` casts emitted by strict schema delegation (#3590).
*
* When `knownSets` is provided, only symbols that exist in the consolidated
* schemas faker file are recovered — this avoids importing one-off split
* response helper factories that live in the tag file itself.
*/
function collectSchemaFactoryImportsFromImplementation(implementation, knownSets) {
	const imports = [];
	const seen = /* @__PURE__ */ new Set();
	for (const match of implementation.matchAll(/\b(get[A-Za-z0-9]+Mock)\(\)/g)) {
		const factoryName = match[1];
		if (knownSets && !knownSets.factoryNames.has(factoryName)) continue;
		const key = `value::${factoryName}`;
		if (seen.has(key)) continue;
		seen.add(key);
		imports.push({
			name: factoryName,
			values: true,
			schemaFactory: true
		});
	}
	for (const match of implementation.matchAll(/\bas ([A-Za-z0-9]+Mock)\b/g)) {
		const typeName = match[1];
		if (knownSets && !knownSets.typeNames.has(typeName)) continue;
		const key = `type::${typeName}`;
		if (seen.has(key)) continue;
		seen.add(key);
		imports.push({
			name: typeName,
			values: false,
			schemaFactory: true
		});
	}
	return imports;
}
function mergeGeneratorImports(...groups) {
	const merged = /* @__PURE__ */ new Map();
	for (const group of groups) for (const imp of group) {
		const key = `${imp.name}::${imp.alias ?? ""}`;
		const existing = merged.get(key);
		if (!existing) {
			merged.set(key, imp);
			continue;
		}
		if (!existing.values && imp.values) merged.set(key, imp);
	}
	return [...merged.values()];
}
/** Recover missing index.faker imports when `schemas: true` is enabled. */
function collectRecoveredSchemaFactoryImports(implementation, componentSchemaNames) {
	return collectSchemaFactoryImportsFromImplementation(implementation, buildKnownSchemaFactoryImportSets(componentSchemaNames));
}
//#endregion
//#region src/writers/mock-outputs.ts
/**
* Collapses the per-generator mock outputs for "inline" writer modes
* (`single`, `tags`) where every mock generator's content is concatenated
* into the implementation file. The MSW generator already emits the
* response-factory functions (`get<Op>ResponseMock`) that Faker would emit,
* so when both generators are configured we keep MSW and drop Faker to
* avoid duplicate function declarations and re-imported faker bindings.
*/
function collapseInlineMockOutputs(mockOutputs) {
	if (!mockOutputs.some((m) => m.type === OutputMockType.MSW)) return mockOutputs;
	return mockOutputs.filter((m) => m.type !== OutputMockType.FAKER);
}
/**
* Flattens a `GeneratorMockOutputFull` (which keeps `function` and `handler`
* separate) into a `GeneratorMockOutput` by concatenating the two portions.
*/
function flattenMockOutput(full) {
	return {
		type: full.type,
		implementation: full.implementation.function + full.implementation.handler,
		imports: full.imports,
		strictMockSchemaTypeNames: full.strictMockSchemaTypeNames,
		strictMockSchemaKinds: full.strictMockSchemaKinds
	};
}
const RESPONSE_MOCK_CALL_RE = /:\s*(get\w+ResponseMock\w*)\(\)/g;
/**
* Decides where the `get<Op>ResponseMock` factories live so `.msw.ts` never
* duplicates them:
*
* - The faker output declares every factory the handlers call: strip them
*   from the MSW output, the writer imports them from the faker file instead.
* - `mswOperationResponses` is false: strip the factories and replace the
*   handler fallbacks with `undefined`.
* - Otherwise leave the output unchanged, factories stay inline in `.msw.ts`.
*
* No need to remove the `faker` import when stripping, it is only added
* during import generation while the implementation still uses `faker.*`.
*/
function collapseMswFakerFullOutputs(mockOutputs, options = {}) {
	const mswEntry = mockOutputs.find((m) => m.type === OutputMockType.MSW);
	if (!mswEntry || mswEntry.implementation.function.trim().length === 0) return mockOutputs;
	const fakerEntry = mockOutputs.find((m) => m.type === OutputMockType.FAKER);
	let fakerDeclaresAllReferenced = false;
	if (fakerEntry) {
		const declared = new Set(extractResponseMockNames(fakerEntry.implementation.function));
		fakerDeclaresAllReferenced = extractResponseMockNames(mswEntry.implementation.handler).every((name) => declared.has(name));
	}
	if (fakerDeclaresAllReferenced) return mockOutputs.map((m) => m.type === OutputMockType.MSW ? {
		...m,
		implementation: {
			...m.implementation,
			function: ""
		}
	} : m);
	if (options.mswOperationResponses === false) {
		const strippedHandler = mswEntry.implementation.handler.replaceAll(RESPONSE_MOCK_CALL_RE, ": undefined");
		return mockOutputs.map((m) => m.type === OutputMockType.MSW ? {
			...m,
			implementation: {
				...m.implementation,
				function: "",
				handler: strippedHandler
			}
		} : m);
	}
	return mockOutputs;
}
const RESPONSE_MOCK_NAME_RE = /\bget\w+ResponseMock\w*\b/g;
/**
* Collects the unique `get<Op>ResponseMock` names in a mock implementation,
* including the status-suffixed ones from `generateEachHttpStatus`
* (e.g. `getListPetsResponseMock200`).
*/
function extractResponseMockNames(implementation) {
	return [...new Set([...implementation.matchAll(RESPONSE_MOCK_NAME_RE)].map((m) => m[0]))];
}
/**
* Builds the imports that let a `.msw.ts` file call the response factories
* declared in its `.faker.ts` file. Only imports names the handlers actually
* call and the faker file actually declares, so the import list can't drift
* out of sync with either file.
*/
function buildCrossFileFakerImports(mswFilePath, fakerFilePath, mswImplementation, fakerImplementation, importExtension = "") {
	const referencedNames = extractResponseMockNames(mswImplementation);
	if (referencedNames.length === 0) return [];
	const declaredNames = new Set(extractResponseMockNames(fakerImplementation));
	const responseMockNames = referencedNames.filter((name) => declaredNames.has(name));
	if (responseMockNames.length === 0) return [];
	const fakerImportPath = getRelativeImportPath(mswFilePath, fakerFilePath) + importExtension;
	return responseMockNames.map((name) => ({
		name,
		values: true,
		importPath: fakerImportPath
	}));
}
/**
* Re-export statement for the factories a `.msw.ts` file imports from its
* faker file, so importing them from the msw file keeps working like before
* the split.
*/
function buildFakerReexportStatement(imports) {
	if (imports.length === 0) return "";
	return `export { ${imports.map((imp) => imp.name).join(", ")} } from '${imports[0].importPath}';\n`;
}
//#endregion
//#region src/writers/mock-utils.ts
function getMockDir(entry, mockConfig) {
	if (!isFunction(entry) && entry.path) return entry.path;
	return mockConfig.path;
}
function hasAnyMockPath(mockConfig) {
	if (mockConfig.path) return true;
	return mockConfig.generators.some((g) => !isFunction(g) && !!g.path);
}
function resolveMockSchemasPath(mockFilePath, schemasTarget) {
	const ext = nodePath.extname(mockFilePath);
	const targetExt = nodePath.extname(schemasTarget);
	return getRelativeImportPath(mockFilePath, targetExt === ".schemas" ? schemasTarget + ext : targetExt ? schemasTarget : schemasTarget + ext);
}
//#endregion
//#region src/writers/typescript-version.ts
const getTypeScriptVersion = (packageJson) => {
	return packageJson?.resolvedVersions?.typescript ?? packageJson?.dependencies?.typescript ?? packageJson?.devDependencies?.typescript ?? packageJson?.peerDependencies?.typescript ?? "4.4.0";
};
const hasTypeScriptAwaitedType = (packageJson) => compareVersions(getTypeScriptVersion(packageJson), "4.5.0");
//#endregion
//#region src/writers/target.ts
function emptyMockOutputFull$1(type) {
	return {
		type,
		implementation: {
			function: "",
			handler: "",
			handlerName: ""
		},
		imports: []
	};
}
function generateTarget(builder, options) {
	const operationNames = Object.values(builder.operations).map(({ operationName }) => operationName);
	const isAngularClient = options.client === OutputClient.ANGULAR;
	const titles = builder.title({
		outputClient: options.client,
		title: pascal(builder.info.title),
		customTitleFunc: options.override.title,
		output: options
	});
	const target = {
		imports: [],
		implementation: "",
		mockOutputs: [],
		mutators: [],
		clientMutators: [],
		formData: [],
		formUrlEncoded: [],
		paramsSerializer: [],
		paramsFilter: [],
		fetchReviver: [],
		sharedTypes: []
	};
	const operations = Object.values(builder.operations);
	for (const [index, operation] of operations.entries()) {
		target.imports.push(...operation.imports);
		target.implementation += operation.implementation + "\n";
		for (const opMock of operation.mockOutputs) {
			let acc = target.mockOutputs.find((m) => m.type === opMock.type);
			if (!acc) {
				acc = emptyMockOutputFull$1(opMock.type);
				target.mockOutputs.push(acc);
			}
			acc.imports.push(...opMock.imports);
			if (opMock.strictMockSchemaTypeNames?.length) acc.strictMockSchemaTypeNames = [...new Set([...acc.strictMockSchemaTypeNames ?? [], ...opMock.strictMockSchemaTypeNames])];
			if (opMock.strictMockSchemaKinds) acc.strictMockSchemaKinds = {
				...acc.strictMockSchemaKinds,
				...opMock.strictMockSchemaKinds
			};
			acc.implementation.function += opMock.implementation.function;
			acc.implementation.handler += opMock.implementation.handler;
			if (opMock.implementation.handlerName) {
				const separator = acc.implementation.handlerName.length > 0 ? ",\n  " : "  ";
				acc.implementation.handlerName += separator + opMock.implementation.handlerName + "()";
			}
		}
		if (operation.mutator) target.mutators.push(operation.mutator);
		if (operation.formData) target.formData.push(operation.formData);
		if (operation.formUrlEncoded) target.formUrlEncoded.push(operation.formUrlEncoded);
		if (operation.paramsSerializer) target.paramsSerializer.push(operation.paramsSerializer);
		if (operation.paramsFilter) target.paramsFilter.push(operation.paramsFilter);
		if (operation.clientMutators) target.clientMutators.push(...operation.clientMutators);
		if (operation.fetchReviver) target.fetchReviver.push(operation.fetchReviver);
		if (index === operations.length - 1) {
			const isMutator = target.mutators.some((mutator) => isAngularClient ? mutator.hasThirdArg : mutator.hasSecondArg);
			const hasAwaitedType = hasTypeScriptAwaitedType(options.packageJson);
			const header = builder.header({
				outputClient: options.client,
				isRequestOptions: options.override.requestOptions !== false,
				isMutator,
				isGlobalMutator: !!options.override.mutator,
				provideIn: options.override.angular.provideIn,
				hasAwaitedType,
				titles,
				output: options,
				verbOptions: builder.verbOptions,
				clientImplementation: target.implementation
			});
			target.implementation = (header.sharedTypes && header.sharedTypes.length > 0 ? header.sharedTypes.map((t) => `${t.exported ? "export " : ""}${t.code}`).join("\n") + "\n\n" : "") + header.implementation + target.implementation;
			const footer = builder.footer({
				outputClient: options.client,
				operationNames,
				operations,
				hasMutator: target.mutators.length > 0,
				hasAwaitedType,
				titles,
				output: options
			});
			target.implementation += footer.implementation;
			for (const acc of target.mockOutputs) if (acc.implementation.handlerName) acc.implementation.handler = acc.implementation.handler + header.implementationMock + acc.implementation.handlerName + footer.implementationMock;
		}
	}
	return {
		imports: target.imports,
		implementation: target.implementation,
		mockOutputs: target.mockOutputs.map((m) => flattenMockOutput(m)),
		mockOutputsFull: target.mockOutputs,
		mutators: target.mutators,
		clientMutators: target.clientMutators,
		formData: target.formData,
		formUrlEncoded: target.formUrlEncoded,
		paramsSerializer: target.paramsSerializer,
		paramsFilter: target.paramsFilter,
		fetchReviver: target.fetchReviver
	};
}
//#endregion
//#region src/writers/types.ts
function getOrvalGeneratedTypes() {
	return `
// https://stackoverflow.com/questions/49579094/typescript-conditional-types-filter-out-readonly-properties-pick-only-requir/49579497#49579497
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
T,
>() => T extends Y ? 1 : 2
? A
: B;

type WritableKeys<T> = {
[P in keyof T]-?: IfEquals<
  { [Q in P]: T[P] },
  { -readonly [Q in P]: T[P] },
  P
>;
}[keyof T];

type UnionToIntersection<U> =
  (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never;
type DistributeReadOnlyOverUnions<T> = T extends any ? NonReadonly<T> : never;

type Writable<T> = Pick<T, WritableKeys<T>>;
type NonReadonly<T> = [T] extends [UnionToIntersection<T>] ? {
  [P in keyof Writable<T>]: T[P] extends object
    ? NonReadonly<NonNullable<T[P]>>
    : T[P];
} : DistributeReadOnlyOverUnions<T>;
`;
}
function getTypedResponse() {
	return `
interface TypedResponse<T> extends Response {
  json(): Promise<T>;
}
`;
}
//#endregion
//#region src/writers/single-mode.ts
async function writeSingleMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap }) {
	try {
		const { path: targetPath, filename, dirname, extension } = getFileInfo(output.target, {
			backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
			extension: output.fileExtension
		});
		const { imports, mockOutputs: rawMockOutputs, implementation, mutators, clientMutators, formData, formUrlEncoded, paramsSerializer, paramsFilter, fetchReviver } = generateTarget(builder, output);
		const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
		const shouldDeinlineMocks = hasAnyMockPath(output.mock);
		const schemaCustomImportPath = getSchemasImportPath(output.schemas);
		const schemasPath = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(targetPath, getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname) : void 0;
		const relativeSchemasPath = schemasPath ?? "./" + filename + ".schemas" + extension.replace(/\.ts$/, "");
		const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : targetPath;
		const normalizedImports = imports.filter((imp) => {
			const searchWords = [imp.alias, imp.name].filter((part) => Boolean(part?.length)).map((part) => escapeRegExp(part)).join("|");
			if (!searchWords) return false;
			return new RegExp(String.raw`\b(${searchWords})\b`, "g").test(implementation);
		}).map((imp) => ({ ...imp }));
		const collapsedMockOutputs = shouldDeinlineMocks ? [] : collapseInlineMockOutputs(rawMockOutputs);
		if (!shouldDeinlineMocks) {
			const importsMock = collapsedMockOutputs.flatMap((m) => m.imports);
			for (const mockImport of importsMock) {
				const matchingImport = normalizedImports.find((imp) => imp.name === mockImport.name && (imp.alias ?? "") === (mockImport.alias ?? ""));
				if (!matchingImport) continue;
				if (!!mockImport.values || !!mockImport.isConstant || !!mockImport.default || !!mockImport.namespaceImport || !!mockImport.syntheticDefaultImport) matchingImport.values = true;
			}
		}
		let data = header;
		const importsForBuilder = schemasPath ? generateImportsForBuilder(output, normalizedImports, relativeSchemasPath, schemaTagMap) : generateImportsForBuilder(output, normalizedImports.filter((imp) => !!imp.importPath), ".");
		data += builder.imports({
			client: output.client,
			implementation,
			imports: importsForBuilder,
			projectName,
			hasSchemaDir: !!output.schemas,
			isAllowSyntheticDefaultImports,
			hasGlobalMutator: !!output.override.mutator,
			hasTagsMutator: Object.values(output.override.tags).some((tag) => !!tag?.mutator),
			hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
			packageJson: output.packageJson,
			output
		});
		if (!shouldDeinlineMocks) for (const mockOutput of collapsedMockOutputs) {
			const entry = output.mock.generators.find((g) => !isFunction(g) && g.type === mockOutput.type);
			const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
			const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
			const recoveredSchemaFactoryImports = !!entry && !isFunction(entry) && entry.type === OutputMockType.FAKER && entry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
			const filteredMockImports = filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports).filter((impMock) => !normalizedImports.some((imp) => imp.name === impMock.name && (imp.alias ?? "") === (impMock.alias ?? ""))), finalizeMockOptions.strictSchemaTypeNames);
			const importsMockForBuilder = schemasPath ? generateImportsForBuilder(output, filteredMockImports, relativeSchemasPath, schemaTagMap) : generateImportsForBuilder(output, filteredMockImports.filter((imp) => !!imp.importPath), ".");
			data += builder.importsMock({
				implementation: finalizedMockImplementation,
				imports: importsMockForBuilder,
				projectName,
				hasSchemaDir: !!output.schemas,
				isAllowSyntheticDefaultImports,
				options: entry && !isFunction(entry) ? entry : void 0
			});
		}
		if (mutators) data += generateMutatorImports({
			mutators,
			implementation
		});
		if (clientMutators) data += generateMutatorImports({ mutators: clientMutators });
		if (formData) data += generateMutatorImports({ mutators: formData });
		if (formUrlEncoded) data += generateMutatorImports({ mutators: formUrlEncoded });
		if (paramsSerializer) data += generateMutatorImports({ mutators: paramsSerializer });
		if (paramsFilter) data += generateMutatorImports({ mutators: paramsFilter });
		if (fetchReviver) data += generateMutatorImports({ mutators: fetchReviver });
		if (implementation.includes("NonReadonly<")) {
			data += getOrvalGeneratedTypes();
			data += "\n";
		}
		if (implementation.includes("TypedResponse<")) {
			data += getTypedResponse();
			data += "\n";
		}
		if (!output.schemas && needSchema) data += generateSchemasInline ? generateSchemasInline() : generateModelsInline(builder.schemas);
		data += `${implementation.trim()}\n`;
		if (!shouldDeinlineMocks) {
			const implementationMock = collapsedMockOutputs.map((m) => m.implementation).join("\n\n");
			const finalizedImplementationMock = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(implementationMock, getFinalizeMockImplementationOptions(output, collapsedMockOutputs)) : implementationMock;
			if (collapsedMockOutputs.length > 0) {
				data += "\n\n";
				data += finalizedImplementationMock;
			}
		}
		await writeGeneratedFile(targetPath, data);
		const extraPaths = [];
		if (shouldDeinlineMocks) {
			const seenMockIndexKeys = /* @__PURE__ */ new Set();
			const writtenMockEntries = [];
			for (const mockOutput of rawMockOutputs) {
				const rawEntry = output.mock.generators.find((g) => {
					if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
					return g.type === mockOutput.type;
				});
				if (!rawEntry) continue;
				const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
				const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
				const mockFilePath = nodePath.join(mockDir, filename + "." + mockExtension + extension);
				const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
				const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
				const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
				const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
				const importsMockForBuilder = schemasPath || mockDir !== dirname ? generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap) : generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames).filter((imp) => !!imp.importPath), ".");
				let mockData = header;
				mockData += builder.importsMock({
					implementation: finalizedMockImplementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: isFunction(rawEntry) ? void 0 : rawEntry
				});
				mockData += `\n${finalizedMockImplementation}`;
				await writeGeneratedFile(mockFilePath, mockData);
				extraPaths.push(mockFilePath);
				const indexKey = `${mockExtension}::${mockDir}`;
				if (!seenMockIndexKeys.has(indexKey)) {
					seenMockIndexKeys.add(indexKey);
					writtenMockEntries.push({
						extension: mockExtension,
						mockDir
					});
				}
			}
			if (output.mock.indexMockFiles) {
				const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
				for (const { extension: mockExt, mockDir } of writtenMockEntries) {
					const indexMockPath = nodePath.join(mockDir, `index.${mockExt}${extension}`);
					await writeGeneratedFile(indexMockPath, `export * from './${filename}.${mockExt}${importExtension}'\n`);
					extraPaths.push(indexMockPath);
				}
			}
		}
		return [targetPath, ...extraPaths];
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : "unknown error";
		throw new Error(`Oups... 🍻. An Error occurred while writing file => ${errorMsg}`, { cause: error });
	}
}
//#endregion
//#region src/writers/split-mode.ts
async function writeSplitMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap }) {
	try {
		const { path: targetPath, filename, dirname, extension } = getFileInfo(output.target, {
			backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
			extension: output.fileExtension
		});
		const { imports, implementation, mockOutputsFull, mutators, clientMutators, formData, formUrlEncoded, paramsSerializer, paramsFilter, fetchReviver } = generateTarget(builder, output);
		const collapsedFull = collapseMswFakerFullOutputs(mockOutputsFull, { mswOperationResponses: output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.MSW)?.operationResponses });
		const mockOutputs = collapsedFull.map((m) => flattenMockOutput(m));
		let implementationData = header;
		const schemaCustomImportPath = getSchemasImportPath(output.schemas);
		const relativeSchemasPath = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(targetPath, isString(output.schemas) ? output.schemas : output.schemas.path, true) : "./" + filename + ".schemas" + getImportExtension(extension, output.tsconfig);
		const schemasTarget = output.schemas ? isString(output.schemas) ? output.schemas : output.schemas.path : nodePath.join(dirname, filename + ".schemas" + getImportExtension(extension, output.tsconfig));
		const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
		const importsForBuilder = generateImportsForBuilder(output, imports, relativeSchemasPath, schemaTagMap);
		implementationData += builder.imports({
			client: output.client,
			implementation,
			imports: importsForBuilder,
			projectName,
			hasSchemaDir: !!output.schemas,
			isAllowSyntheticDefaultImports,
			hasGlobalMutator: !!output.override.mutator,
			hasTagsMutator: Object.values(output.override.tags).some((tag) => !!tag?.mutator),
			hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
			packageJson: output.packageJson,
			output
		});
		const schemasPath = !output.schemas && needSchema ? nodePath.join(dirname, filename + ".schemas" + extension) : void 0;
		if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
		if (mutators) implementationData += generateMutatorImports({
			mutators,
			implementation
		});
		if (clientMutators) implementationData += generateMutatorImports({ mutators: clientMutators });
		if (formData) implementationData += generateMutatorImports({ mutators: formData });
		if (formUrlEncoded) implementationData += generateMutatorImports({ mutators: formUrlEncoded });
		if (paramsSerializer) implementationData += generateMutatorImports({ mutators: paramsSerializer });
		if (paramsFilter) implementationData += generateMutatorImports({ mutators: paramsFilter });
		if (fetchReviver) implementationData += generateMutatorImports({ mutators: fetchReviver });
		if (implementation.includes("NonReadonly<")) {
			implementationData += getOrvalGeneratedTypes();
			implementationData += "\n";
		}
		if (implementation.includes("TypedResponse<")) {
			implementationData += getTypedResponse();
			implementationData += "\n";
		}
		implementationData += `\n${implementation}`;
		const implementationFilename = filename + (OutputClient.ANGULAR === output.client ? ".service" : "") + extension;
		const implementationPath = nodePath.join(dirname, implementationFilename);
		await writeGeneratedFile(implementationPath, implementationData);
		const mockPaths = [];
		const mswFactoriesMoved = mockOutputs.some((m) => m.type === OutputMockType.FAKER) && collapsedFull.some((m) => m.type === OutputMockType.MSW && m.implementation.function.trim().length === 0);
		const fakerImplementation = mockOutputs.find((m) => m.type === OutputMockType.FAKER)?.implementation ?? "";
		const fakerEntry = output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER);
		const fakerDir = fakerEntry ? getMockDir(fakerEntry, output.mock) ?? dirname : dirname;
		const fakerFilePath = nodePath.join(fakerDir, filename + ".faker" + extension);
		const fakerImportExtension = getImportExtension(extension, output.tsconfig);
		const seenMockIndexKeys = /* @__PURE__ */ new Set();
		const writtenMockEntries = [];
		for (const mockOutput of mockOutputs) {
			const rawEntry = output.mock.generators.find((g) => {
				if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
				return g.type === mockOutput.type;
			});
			if (!rawEntry) continue;
			const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
			const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
			const mockFilePath = nodePath.join(mockDir, filename + "." + mockExtension + extension);
			const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
			const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
			const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
			const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
			const crossFileFakerImports = mswFactoriesMoved && mockOutput.type === OutputMockType.MSW ? buildCrossFileFakerImports(mockFilePath, fakerFilePath, mockOutput.implementation, fakerImplementation, fakerImportExtension) : [];
			const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports, crossFileFakerImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap);
			let mockData = header;
			mockData += builder.importsMock({
				implementation: finalizedMockImplementation,
				imports: importsMockForBuilder,
				projectName,
				hasSchemaDir: !!output.schemas,
				isAllowSyntheticDefaultImports,
				options: isFunction(rawEntry) ? void 0 : rawEntry
			});
			mockData += buildFakerReexportStatement(crossFileFakerImports);
			mockData += `\n${finalizedMockImplementation}`;
			await writeGeneratedFile(mockFilePath, mockData);
			mockPaths.push(mockFilePath);
			const indexKey = `${mockExtension}::${mockDir}`;
			if (!seenMockIndexKeys.has(indexKey)) {
				seenMockIndexKeys.add(indexKey);
				writtenMockEntries.push({
					extension: mockExtension,
					mockDir
				});
			}
		}
		const indexMockPaths = [];
		if (output.mock.indexMockFiles) {
			const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
			for (const { extension: mockExt, mockDir } of writtenMockEntries) {
				const indexMockPath = nodePath.join(mockDir, `index.${mockExt}${extension}`);
				await writeGeneratedFile(indexMockPath, `export * from './${filename}.${mockExt}${importExtension}'\n`);
				indexMockPaths.push(indexMockPath);
			}
		}
		return [
			implementationPath,
			...schemasPath ? [schemasPath] : [],
			...mockPaths,
			...indexMockPaths
		];
	} catch (error) {
		throw new Error(`Oups... 🍻. An Error occurred while splitting => ${String(error)}`, { cause: error });
	}
}
//#endregion
//#region src/writers/target-tags.ts
/**
* Ensures every operation has at least one tag by falling back to the
* {@link DefaultTag} constant for untagged operations, so the tag-routing
* logic in {@link generateTargetTags} always has a bucket to assign the
* operation to.
*/
function addDefaultTagIfEmpty$1(operation) {
	return {
		...operation,
		tags: operation.tags.length > 0 ? operation.tags : [DefaultTag]
	};
}
function emptyMockOutputFull(type) {
	return {
		type,
		implementation: {
			function: "",
			handler: "",
			handlerName: ""
		},
		imports: []
	};
}
function mergeOperationMockOutputs(accMockOutputs, opMockOutputs) {
	const result = accMockOutputs.map((m) => ({
		type: m.type,
		implementation: { ...m.implementation },
		imports: [...m.imports],
		strictMockSchemaTypeNames: m.strictMockSchemaTypeNames ? [...m.strictMockSchemaTypeNames] : void 0,
		strictMockSchemaKinds: m.strictMockSchemaKinds ? { ...m.strictMockSchemaKinds } : void 0
	}));
	for (const op of opMockOutputs) {
		let acc = result.find((m) => m.type === op.type);
		if (!acc) {
			acc = emptyMockOutputFull(op.type);
			result.push(acc);
		}
		acc.imports.push(...op.imports);
		if (op.strictMockSchemaTypeNames?.length) acc.strictMockSchemaTypeNames = [...new Set([...acc.strictMockSchemaTypeNames ?? [], ...op.strictMockSchemaTypeNames])];
		if (op.strictMockSchemaKinds) acc.strictMockSchemaKinds = {
			...acc.strictMockSchemaKinds,
			...op.strictMockSchemaKinds
		};
		acc.implementation.function += op.implementation.function;
		acc.implementation.handler += op.implementation.handler;
		if (op.implementation.handlerName) {
			const separator = acc.implementation.handlerName.length > 0 ? ",\n  " : "  ";
			acc.implementation.handlerName += separator + op.implementation.handlerName + "()";
		}
	}
	return result;
}
function initialMockOutputsForOperation(op) {
	return op.mockOutputs.map((m) => ({
		type: m.type,
		implementation: {
			function: m.implementation.function,
			handler: m.implementation.handler,
			handlerName: m.implementation.handlerName ? "  " + m.implementation.handlerName + "()" : ""
		},
		imports: [...m.imports],
		strictMockSchemaTypeNames: m.strictMockSchemaTypeNames ? [...m.strictMockSchemaTypeNames] : void 0,
		strictMockSchemaKinds: m.strictMockSchemaKinds ? { ...m.strictMockSchemaKinds } : void 0
	}));
}
function generateTargetTags(currentAcc, operation) {
	const tag = getOperationTagKey(operation);
	if (!(tag in currentAcc)) {
		currentAcc[tag] = {
			imports: operation.imports,
			mockOutputs: initialMockOutputsForOperation(operation),
			mutators: operation.mutator ? [operation.mutator] : [],
			clientMutators: operation.clientMutators ?? [],
			formData: operation.formData ? [operation.formData] : [],
			formUrlEncoded: operation.formUrlEncoded ? [operation.formUrlEncoded] : [],
			paramsSerializer: operation.paramsSerializer ? [operation.paramsSerializer] : [],
			paramsFilter: operation.paramsFilter ? [operation.paramsFilter] : [],
			fetchReviver: operation.fetchReviver ? [operation.fetchReviver] : [],
			implementation: operation.implementation
		};
		return currentAcc;
	}
	const currentOperation = currentAcc[tag];
	currentAcc[tag] = {
		implementation: currentOperation.implementation + operation.implementation,
		imports: [...currentOperation.imports, ...operation.imports],
		mockOutputs: mergeOperationMockOutputs(currentOperation.mockOutputs, operation.mockOutputs),
		mutators: operation.mutator ? [...currentOperation.mutators ?? [], operation.mutator] : currentOperation.mutators,
		clientMutators: operation.clientMutators ? [...currentOperation.clientMutators ?? [], ...operation.clientMutators] : currentOperation.clientMutators,
		formData: operation.formData ? [...currentOperation.formData ?? [], operation.formData] : currentOperation.formData,
		formUrlEncoded: operation.formUrlEncoded ? [...currentOperation.formUrlEncoded ?? [], operation.formUrlEncoded] : currentOperation.formUrlEncoded,
		paramsSerializer: operation.paramsSerializer ? [...currentOperation.paramsSerializer ?? [], operation.paramsSerializer] : currentOperation.paramsSerializer,
		paramsFilter: operation.paramsFilter ? [...currentOperation.paramsFilter ?? [], operation.paramsFilter] : currentOperation.paramsFilter,
		fetchReviver: operation.fetchReviver ? [...currentOperation.fetchReviver ?? [], operation.fetchReviver] : currentOperation.fetchReviver
	};
	return currentAcc;
}
function generateTargetForTags(builder, options) {
	const isAngularClient = options.client === OutputClient.ANGULAR;
	const operations = Object.values(builder.operations).map((operation) => addDefaultTagIfEmpty$1(operation));
	let allTargetTags = {};
	for (const [index, operation] of operations.entries()) {
		allTargetTags = generateTargetTags(allTargetTags, operation);
		if (index === operations.length - 1) {
			const transformed = {};
			for (const [tag, target] of Object.entries(allTargetTags)) {
				const isMutator = !!target.mutators?.some((mutator) => isAngularClient ? mutator.hasThirdArg : mutator.hasSecondArg);
				const operationNames = operations.filter((operation) => isOperationInTagBucket(operation, tag));
				const hasAwaitedType = hasTypeScriptAwaitedType(options.packageJson);
				const titles = builder.title({
					outputClient: options.client,
					title: pascal(tag),
					customTitleFunc: options.override.title,
					output: options
				});
				const footer = builder.footer({
					outputClient: options.client,
					operationNames: operationNames.map(({ operationName }) => operationName),
					operations: operationNames,
					hasMutator: !!target.mutators?.length,
					hasAwaitedType,
					titles,
					output: options
				});
				const header = builder.header({
					outputClient: options.client,
					isRequestOptions: options.override.requestOptions !== false,
					isMutator,
					isGlobalMutator: !!options.override.mutator,
					provideIn: options.override.angular.provideIn,
					hasAwaitedType,
					titles,
					output: options,
					verbOptions: builder.verbOptions,
					tag,
					isDefaultTagBucket: tag === "default" && Object.values(builder.operations).some((operation) => operation.tags.length === 0),
					clientImplementation: target.implementation
				});
				const sharedTypes = header.sharedTypes;
				const deduplicationActive = options.tagsSplitDeduplication && !options.workspace;
				const inlinedSharedTypes = !deduplicationActive && sharedTypes && sharedTypes.length > 0 ? sharedTypes.map((t) => `${t.exported ? "export " : ""}${t.code}`).join("\n") + "\n\n" : "";
				const wrappedMockOutputs = target.mockOutputs.map((m) => ({
					type: m.type,
					implementation: {
						function: m.implementation.function,
						handler: m.implementation.handlerName ? m.implementation.handler + header.implementationMock + m.implementation.handlerName + footer.implementationMock : m.implementation.handler,
						handlerName: m.implementation.handlerName
					},
					imports: m.imports,
					strictMockSchemaTypeNames: m.strictMockSchemaTypeNames,
					strictMockSchemaKinds: m.strictMockSchemaKinds
				}));
				transformed[tag] = {
					implementation: inlinedSharedTypes + header.implementation + target.implementation + footer.implementation,
					mockOutputs: wrappedMockOutputs,
					imports: target.imports,
					mutators: target.mutators,
					clientMutators: target.clientMutators,
					formData: target.formData,
					formUrlEncoded: target.formUrlEncoded,
					paramsSerializer: target.paramsSerializer,
					paramsFilter: target.paramsFilter,
					fetchReviver: target.fetchReviver,
					sharedTypes: deduplicationActive ? sharedTypes : void 0
				};
			}
			allTargetTags = transformed;
		}
	}
	const result = {};
	for (const [tag, target] of Object.entries(allTargetTags)) result[tag] = {
		...target,
		mockOutputs: target.mockOutputs.map((m) => flattenMockOutput(m)),
		mockOutputsFull: target.mockOutputs
	};
	return result;
}
//#endregion
//#region src/writers/split-tags-mode.ts
async function writeSplitTagsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap }) {
	const { filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = generateTargetForTags(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const mockIndexEntries = [];
	const seenMockIndexKeys = /* @__PURE__ */ new Set();
	const schemasTarget = output.schemas ? isString(output.schemas) ? output.schemas : output.schemas.path : nodePath.join(dirname, filename + ".schemas" + getImportExtension(extension, output.tsconfig));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const deduplicationEnabled = output.tagsSplitDeduplication && !output.workspace;
	const collectedSharedTypes = [];
	const seenSharedTypeNames = /* @__PURE__ */ new Set();
	for (const [, target] of tagEntries) {
		if (!target.sharedTypes) continue;
		for (const t of target.sharedTypes) if (!seenSharedTypeNames.has(t.name)) {
			seenSharedTypeNames.add(t.name);
			collectedSharedTypes.push(t);
		}
	}
	const commonTypesImportExtension = getImportExtension(extension, output.tsconfig);
	const commonTypesBasename = output.commonTypesFileName;
	const commonTypesPath = nodePath.join(dirname, commonTypesBasename + extension);
	const commonTypesRelativeImport = "../" + commonTypesBasename + (deduplicationEnabled ? commonTypesImportExtension : "");
	const generatedFilePathsArray = await Promise.all(tagEntries.map(async ([tag, target]) => {
		try {
			const { imports, implementation, mockOutputsFull, mutators, clientMutators, formData, fetchReviver, formUrlEncoded, paramsSerializer, paramsFilter } = target;
			const collapsedFull = collapseMswFakerFullOutputs(mockOutputsFull, { mswOperationResponses: output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.MSW)?.operationResponses });
			const mockOutputs = collapsedFull.map((m) => flattenMockOutput(m));
			let implementationData = header;
			if (deduplicationEnabled && target.sharedTypes && target.sharedTypes.length > 0) {
				const typeNames = target.sharedTypes.map((t) => t.name).join(", ");
				implementationData += `import type { ${typeNames} } from '${commonTypesRelativeImport}';\n`;
			}
			const importerPath = nodePath.join(dirname, tag, tag + extension);
			const schemaCustomImportPath = getSchemasImportPath(output.schemas);
			const relativeSchemasPath = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(importerPath, isString(output.schemas) ? output.schemas : output.schemas.path, true) : "../" + filename + ".schemas" + getImportExtension(extension, output.tsconfig);
			const tagNames = new Set(tagEntries.map(([t]) => t));
			const serviceSuffix = OutputClient.ANGULAR === output.client ? ".service" : "";
			const importsForBuilder = generateImportsForBuilder(output, imports.map((imp) => {
				if (!imp.importPath) return imp;
				if (!imp.importPath.startsWith(".")) return imp;
				const resolvedPath = nodePath.resolve(dirname, imp.importPath);
				const targetBasename = nodePath.basename(resolvedPath);
				let targetFile;
				if (tagNames.has(targetBasename)) {
					const tagFilename = targetBasename + serviceSuffix + extension;
					targetFile = nodePath.join(resolvedPath, tagFilename);
				} else targetFile = resolvedPath + extension;
				const adjustedPath = getRelativeImportPath(importerPath, targetFile);
				return {
					...imp,
					importPath: adjustedPath
				};
			}), relativeSchemasPath, schemaTagMap);
			implementationData += builder.imports({
				client: output.client,
				implementation,
				imports: importsForBuilder,
				projectName,
				hasSchemaDir: !!output.schemas,
				isAllowSyntheticDefaultImports,
				hasGlobalMutator: !!output.override.mutator,
				hasTagsMutator: Object.values(output.override.tags).some((tag) => !!tag?.mutator),
				hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
				packageJson: output.packageJson,
				output
			});
			const schemasPath = !output.schemas && needSchema ? nodePath.join(dirname, filename + ".schemas" + extension) : void 0;
			if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
			if (mutators) implementationData += generateMutatorImports({
				mutators,
				implementation,
				oneMore: true
			});
			if (clientMutators) implementationData += generateMutatorImports({
				mutators: clientMutators,
				oneMore: true
			});
			if (formData) implementationData += generateMutatorImports({
				mutators: formData,
				oneMore: true
			});
			if (formUrlEncoded) implementationData += generateMutatorImports({
				mutators: formUrlEncoded,
				oneMore: true
			});
			if (paramsSerializer) implementationData += generateMutatorImports({
				mutators: paramsSerializer,
				oneMore: true
			});
			if (paramsFilter) implementationData += generateMutatorImports({
				mutators: paramsFilter,
				oneMore: true
			});
			if (fetchReviver) implementationData += generateMutatorImports({
				mutators: fetchReviver,
				oneMore: true
			});
			if (implementation.includes("NonReadonly<")) {
				implementationData += getOrvalGeneratedTypes();
				implementationData += "\n";
			}
			if (implementation.includes("TypedResponse<")) {
				implementationData += getTypedResponse();
				implementationData += "\n";
			}
			implementationData += `\n${implementation}`;
			const implementationFilename = tag + (OutputClient.ANGULAR === output.client ? ".service" : "") + extension;
			const implementationPath = nodePath.join(dirname, tag, implementationFilename);
			await writeGeneratedFile(implementationPath, implementationData);
			const mockPaths = [];
			const mswFactoriesMoved = mockOutputs.some((m) => m.type === OutputMockType.FAKER) && collapsedFull.some((m) => m.type === OutputMockType.MSW && m.implementation.function.trim().length === 0);
			const fakerImplementation = mockOutputs.find((m) => m.type === OutputMockType.FAKER)?.implementation ?? "";
			const fakerEntry = output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER);
			const fakerDir = fakerEntry ? getMockDir(fakerEntry, output.mock) ?? dirname : dirname;
			const fakerFilePath = nodePath.join(fakerDir, tag, tag + ".faker" + extension);
			const fakerImportExtension = getImportExtension(extension, output.tsconfig);
			for (const mockOutput of mockOutputs) {
				const rawEntry = output.mock.generators.find((g) => {
					if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
					return g.type === mockOutput.type;
				});
				if (!rawEntry) continue;
				const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
				const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
				const mockFilePath = nodePath.join(mockDir, tag, tag + "." + mockExtension + extension);
				const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
				const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
				const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
				const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
				const crossFileFakerImports = mswFactoriesMoved && mockOutput.type === OutputMockType.MSW ? buildCrossFileFakerImports(mockFilePath, fakerFilePath, mockOutput.implementation, fakerImplementation, fakerImportExtension) : [];
				const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports, crossFileFakerImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap);
				let mockData = header;
				mockData += builder.importsMock({
					implementation: finalizedMockImplementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: isFunction(rawEntry) ? void 0 : rawEntry
				});
				mockData += buildFakerReexportStatement(crossFileFakerImports);
				mockData += `\n${finalizedMockImplementation}`;
				await writeGeneratedFile(mockFilePath, mockData);
				mockPaths.push(mockFilePath);
				const indexKey = `${mockExtension}::${mockDir}`;
				let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
				if (!indexEntry) {
					indexEntry = {
						ext: mockExtension,
						mockDir,
						tags: []
					};
					mockIndexEntries.push(indexEntry);
					seenMockIndexKeys.add(indexKey);
				}
				if (!indexEntry.tags.includes(tag)) indexEntry.tags.push(tag);
			}
			return [
				implementationPath,
				...schemasPath ? [schemasPath] : [],
				...mockPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while splitting tag ${tag} => ${String(error)}`, { cause: error });
		}
	}));
	if (output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, tags } of mockIndexEntries) await writeGeneratedFile(nodePath.join(mockDir, `index.${ext}${extension}`), tags.toSorted((a, b) => a.localeCompare(b)).map((tag) => {
			const localMockPath = joinSafe("./", tag, tag + "." + ext + mockImportExtension);
			return ext === OutputMockType.MSW ? `export { get${pascal(tag)}Mock } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
		}).join(""));
	}
	let commonTypesFilePath;
	if (deduplicationEnabled && collectedSharedTypes.length > 0) {
		const commonTypesContent = collectedSharedTypes.map((t) => `export ${t.code}`).join("\n") + "\n";
		commonTypesFilePath = commonTypesPath;
		await writeGeneratedFile(commonTypesPath, commonTypesContent);
	}
	let indexFilePath;
	if (output.indexFiles && deduplicationEnabled && tagEntries.length > 0) {
		const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
		const serviceSuffix = OutputClient.ANGULAR === output.client ? ".service" : "";
		const publicSharedTypeNames = collectedSharedTypes.filter((t) => t.exported).map((t) => t.name);
		const indexContent = (publicSharedTypeNames.length > 0 ? `export type { ${publicSharedTypeNames.join(", ")} } from './${commonTypesBasename}${importExtension}';\n` : "") + tagEntries.map(([tag]) => {
			return `export * from '${joinSafe("./", tag, tag + serviceSuffix + importExtension)}';\n`;
		}).join("");
		indexFilePath = nodePath.join(dirname, `index${extension}`);
		await writeGeneratedFile(indexFilePath, indexContent);
	}
	return [...new Set([
		...output.mock.indexMockFiles ? mockIndexEntries.map(({ mockDir, ext }) => nodePath.join(mockDir, `index.${ext}${extension}`)) : [],
		...commonTypesFilePath ? [commonTypesFilePath] : [],
		...indexFilePath ? [indexFilePath] : [],
		...generatedFilePathsArray.flat()
	])];
}
//#endregion
//#region src/writers/tags-mode.ts
async function writeTagsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap }) {
	const { path: targetPath, filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = generateTargetForTags(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const shouldDeinlineMocks = hasAnyMockPath(output.mock);
	const mockIndexEntries = [];
	const seenMockIndexKeys = /* @__PURE__ */ new Set();
	const schemaCustomImportPath = getSchemasImportPath(output.schemas);
	const schemasPathRelative = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(targetPath, getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname) : "./" + filename + ".schemas" + getImportExtension(extension, output.tsconfig);
	const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : nodePath.join(dirname, filename + ".schemas" + getImportExtension(extension, output.tsconfig));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const generatedFilePathsArray = await Promise.all(tagEntries.map(async ([tag, target]) => {
		try {
			const { imports, implementation, mockOutputs: rawMockOutputs, mutators, clientMutators, formData, formUrlEncoded, fetchReviver, paramsSerializer, paramsFilter } = target;
			const normalizedImports = imports.filter((imp) => {
				const searchWords = [imp.alias, imp.name].filter((part) => Boolean(part?.length)).map((part) => escapeRegExp(part)).join("|");
				if (!searchWords) return false;
				return new RegExp(String.raw`\b(${searchWords})\b`, "g").test(implementation);
			}).map((imp) => ({ ...imp }));
			const collapsedMockOutputs = shouldDeinlineMocks ? [] : collapseInlineMockOutputs(rawMockOutputs);
			let data = header;
			if (!shouldDeinlineMocks) {
				const importsMock = collapsedMockOutputs.flatMap((m) => m.imports);
				for (const mockImport of importsMock) {
					const matchingImport = normalizedImports.find((imp) => imp.name === mockImport.name && (imp.alias ?? "") === (mockImport.alias ?? ""));
					if (!matchingImport) continue;
					if (!!mockImport.values || !!mockImport.isConstant || !!mockImport.default || !!mockImport.namespaceImport || !!mockImport.syntheticDefaultImport) matchingImport.values = true;
				}
			}
			const importsForBuilder = generateImportsForBuilder(output, normalizedImports, schemasPathRelative, schemaTagMap);
			data += builder.imports({
				client: output.client,
				implementation,
				imports: importsForBuilder,
				projectName,
				hasSchemaDir: !!output.schemas,
				isAllowSyntheticDefaultImports,
				hasGlobalMutator: !!output.override.mutator,
				hasTagsMutator: Object.values(output.override.tags).some((tag) => !!tag?.mutator),
				hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
				packageJson: output.packageJson,
				output
			});
			if (!shouldDeinlineMocks) for (const mockOutput of collapsedMockOutputs) {
				const entry = output.mock.generators.find((g) => !isFunction(g) && g.type === mockOutput.type);
				const importsMockForBuilder = generateImportsForBuilder(output, mockOutput.imports.filter((impMock) => !normalizedImports.some((imp) => imp.name === impMock.name && (imp.alias ?? "") === (impMock.alias ?? ""))), schemasPathRelative, schemaTagMap);
				data += builder.importsMock({
					implementation: mockOutput.implementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: entry && !isFunction(entry) ? entry : void 0
				});
			}
			const schemasPath = !output.schemas && needSchema ? nodePath.join(dirname, filename + ".schemas" + extension) : void 0;
			if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
			if (mutators) data += generateMutatorImports({
				mutators,
				implementation
			});
			if (clientMutators) data += generateMutatorImports({ mutators: clientMutators });
			if (formData) data += generateMutatorImports({ mutators: formData });
			if (formUrlEncoded) data += generateMutatorImports({ mutators: formUrlEncoded });
			if (paramsSerializer) data += generateMutatorImports({ mutators: paramsSerializer });
			if (paramsFilter) data += generateMutatorImports({ mutators: paramsFilter });
			if (fetchReviver) data += generateMutatorImports({ mutators: fetchReviver });
			data += "\n\n";
			if (implementation.includes("NonReadonly<")) {
				data += getOrvalGeneratedTypes();
				data += "\n";
			}
			if (implementation.includes("TypedResponse<")) {
				data += getTypedResponse();
				data += "\n";
			}
			data += implementation;
			if (!shouldDeinlineMocks) {
				const implementationMock = collapsedMockOutputs.map((m) => m.implementation).join("\n\n");
				const finalizedImplementationMock = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(implementationMock, getFinalizeMockImplementationOptions(output, collapsedMockOutputs)) : implementationMock;
				if (collapsedMockOutputs.length > 0) {
					data += "\n\n";
					data += finalizedImplementationMock;
				}
			}
			const kebabTag = kebab(tag);
			const implementationPath = nodePath.join(dirname, `${kebabTag}${extension}`);
			await writeGeneratedFile(implementationPath, data);
			const extraPaths = [];
			if (shouldDeinlineMocks) for (const mockOutput of rawMockOutputs) {
				const rawEntry = output.mock.generators.find((g) => {
					if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
					return g.type === mockOutput.type;
				});
				if (!rawEntry) continue;
				const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
				const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
				const mockFilePath = nodePath.join(mockDir, kebabTag, kebabTag + "." + mockExtension + extension);
				const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
				const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
				const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
				const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
				const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap);
				let mockData = header;
				mockData += builder.importsMock({
					implementation: finalizedMockImplementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: isFunction(rawEntry) ? void 0 : rawEntry
				});
				mockData += `\n${finalizedMockImplementation}`;
				await writeGeneratedFile(mockFilePath, mockData);
				extraPaths.push(mockFilePath);
				const indexKey = `${mockExtension}::${mockDir}`;
				let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
				if (!indexEntry) {
					indexEntry = {
						ext: mockExtension,
						mockDir,
						tags: []
					};
					mockIndexEntries.push(indexEntry);
					seenMockIndexKeys.add(indexKey);
				}
				if (!indexEntry.tags.includes(kebabTag)) indexEntry.tags.push(kebabTag);
			}
			return [
				implementationPath,
				...schemasPath ? [schemasPath] : [],
				...extraPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing tag ${tag} => ${String(error)}`, { cause: error });
		}
	}));
	if (shouldDeinlineMocks && output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, tags } of mockIndexEntries) {
			const indexPath = nodePath.join(mockDir, `index.${ext}${extension}`);
			await writeGeneratedFile(indexPath, tags.toSorted((a, b) => a.localeCompare(b)).map((kebabTag) => {
				const localMockPath = joinSafe("./", kebabTag, kebabTag + "." + ext + mockImportExtension);
				return ext === OutputMockType.MSW ? `export { get${pascal(kebabTag)}Mock } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
			}).join(""));
			generatedFilePathsArray.push([indexPath]);
		}
	}
	return generatedFilePathsArray.flat();
}
//#endregion
//#region src/writers/target-tags-operations.ts
function isSchemaImport(imp) {
	return !imp.importPath;
}
/**
* Resolves the transitive closure of component schemas an operation's
* implementation references, so `tags-operations-split`'s per-operation
* `.schemas` file includes not just the schemas named directly in the
* operation's imports but everything those schemas reference too (e.g. a
* `Pet` schema composed from `Dog` / `Cat` via `oneOf`). Mirrors the
* traversal in `schema-tag-mapper.ts`'s `propagateTransitiveTags`.
*/
function resolveTransitiveSchemas(directNames, schemas) {
	const schemaByName = new Map(schemas.map((s) => [s.name, s]));
	const included = /* @__PURE__ */ new Set();
	const queue = [...directNames];
	while (queue.length > 0) {
		const name = queue.pop();
		if (included.has(name)) continue;
		const schema = schemaByName.get(name);
		if (!schema) continue;
		included.add(name);
		for (const imp of schema.imports) if (isSchemaImport(imp) && !included.has(imp.name)) queue.push(imp.name);
	}
	return schemas.filter((s) => included.has(s.name));
}
const TYPE_DECLARATION_RE = /^(export\s+)?type\s+([A-Za-z_$][\w$]*)/gm;
const VALUE_DECLARATION_RE = /^(export\s+)?(const|function)\s+([A-Za-z_$][\w$]*)/gm;
/**
* Extracts the top-level `type`/`const`/`function` names declared in the
* tag helper block, and rewrites the block so every one of them is
* `export`ed — necessary now that the block lives in its own module and is
* imported by name rather than inlined into the operation file.
*/
function extractDeclaredNames(implementation) {
	const typeNames = [...implementation.matchAll(TYPE_DECLARATION_RE)].map((match) => match[2]);
	const valueNames = [...implementation.matchAll(VALUE_DECLARATION_RE)].map((match) => match[3]);
	return {
		implementation: implementation.replaceAll(TYPE_DECLARATION_RE, (whole, existingExport) => existingExport ? whole : `export ${whole}`).replaceAll(VALUE_DECLARATION_RE, (whole, existingExport) => existingExport ? whole : `export ${whole}`),
		typeNames,
		valueNames
	};
}
/**
* Builds the import statement(s) an operation file uses to pull in its
* tag's shared helper block, or `''` when the helper has nothing to export.
* A plain `import './tag.helpers'` would compile but never bring the
* helper's `type`/`const` names into scope — callers must import them by
* name, and type names must use `import type` while runtime values
* (e.g. `withQueryKey`) need a real import so they survive to the emitted JS.
*/
function buildTagHelpersImport(helpers, helperImportPath, usedIn) {
	const used = (name) => !usedIn || new RegExp(String.raw`\b${name}\b`).test(usedIn);
	const typeNames = helpers.typeNames.filter(used);
	const valueNames = helpers.valueNames.filter(used);
	let result = "";
	if (typeNames.length > 0) result += `import type { ${typeNames.join(", ")} } from '${helperImportPath}';\n`;
	if (valueNames.length > 0) result += `import { ${valueNames.join(", ")} } from '${helperImportPath}';\n`;
	return result;
}
/**
* Ensures every operation has at least one tag by falling back to the
* {@link DefaultTag} constant for untagged operations, mirroring
* `target-tags.ts`'s `addDefaultTagIfEmpty` so operations without a tag still
* land in a bucket.
*/
function addDefaultTagIfEmpty(operation) {
	return {
		...operation,
		tags: operation.tags.length > 0 ? operation.tags : [DefaultTag]
	};
}
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
function generateTargetForTagsOperations(builder, options) {
	const isAngularClient = options.client === OutputClient.ANGULAR;
	const hasAwaitedType = hasTypeScriptAwaitedType(options.packageJson);
	const operations = Object.values(builder.operations).map((operation) => addDefaultTagIfEmpty(operation));
	const tags = [...new Set(operations.map((op) => getOperationTagKey(op)))];
	const result = {};
	for (const tag of tags) {
		const tagOperations = operations.filter((operation) => isOperationInTagBucket(operation, tag));
		const mergedImplementation = tagOperations.map((operation) => operation.implementation).join("");
		const mergedMutators = tagOperations.map((operation) => operation.mutator).filter((mutator) => !!mutator);
		const isMutator = mergedMutators.some((mutator) => isAngularClient ? mutator.hasThirdArg : mutator.hasSecondArg);
		const titles = builder.title({
			outputClient: options.client,
			title: pascal(tag),
			customTitleFunc: options.override.title,
			output: options
		});
		const footer = builder.footer({
			outputClient: options.client,
			operationNames: tagOperations.map(({ operationName }) => operationName),
			operations: tagOperations,
			hasMutator: mergedMutators.length > 0,
			hasAwaitedType,
			titles,
			output: options
		});
		const header = builder.header({
			outputClient: options.client,
			isRequestOptions: options.override.requestOptions !== false,
			isMutator,
			isGlobalMutator: !!options.override.mutator,
			provideIn: options.override.angular.provideIn,
			hasAwaitedType,
			titles,
			output: options,
			verbOptions: builder.verbOptions,
			tag,
			isDefaultTagBucket: tag === "default" && Object.values(builder.operations).some((operation) => operation.tags.length === 0),
			clientImplementation: mergedImplementation
		});
		const sharedTypes = header.sharedTypes;
		const { implementation: helperImplementation, typeNames, valueNames } = extractDeclaredNames((sharedTypes && sharedTypes.length > 0 ? sharedTypes.map((t) => `${t.exported ? "export " : ""}${t.code}`).join("\n") + "\n\n" : "") + header.implementation + footer.implementation);
		const operationTargets = tagOperations.map((operation) => {
			const wrappedMockOutputs = operation.mockOutputs.map((m) => ({
				type: m.type,
				implementation: {
					function: m.implementation.function,
					handler: m.implementation.handlerName ? m.implementation.handler + header.implementationMock + m.implementation.handlerName + footer.implementationMock : m.implementation.handler,
					handlerName: m.implementation.handlerName
				},
				imports: m.imports,
				strictMockSchemaTypeNames: m.strictMockSchemaTypeNames,
				strictMockSchemaKinds: m.strictMockSchemaKinds
			}));
			return {
				operationName: operation.operationName,
				imports: operation.imports,
				implementation: operation.implementation,
				mockOutputs: wrappedMockOutputs.map((m) => flattenMockOutput(m)),
				mockOutputsFull: wrappedMockOutputs,
				mutators: operation.mutator ? [operation.mutator] : void 0,
				clientMutators: operation.clientMutators,
				formData: operation.formData ? [operation.formData] : void 0,
				formUrlEncoded: operation.formUrlEncoded ? [operation.formUrlEncoded] : void 0,
				paramsSerializer: operation.paramsSerializer ? [operation.paramsSerializer] : void 0,
				paramsFilter: operation.paramsFilter ? [operation.paramsFilter] : void 0,
				fetchReviver: operation.fetchReviver ? [operation.fetchReviver] : void 0
			};
		});
		result[tag] = {
			helpers: {
				implementation: helperImplementation,
				sharedTypes,
				typeNames,
				valueNames
			},
			operations: operationTargets
		};
	}
	return result;
}
//#endregion
//#region src/writers/tags-operations-mode.ts
const SUPPORTED_CLIENTS = new Set([
	OutputClient.REACT_QUERY,
	OutputClient.SVELTE_QUERY,
	OutputClient.VUE_QUERY,
	OutputClient.SWR,
	OutputClient.FETCH
]);
function assertClientSupportsTagsOperations(client, mode) {
	if (typeof client !== "string" || !SUPPORTED_CLIENTS.has(client)) {
		const clientLabel = typeof client === "string" ? client : "custom";
		throw new Error(`Output mode '${mode}' is not supported with the '${clientLabel}' client. It requires operations that compile to standalone functions (react-query, svelte-query, vue-query, swr, fetch); '${clientLabel}' groups operations into a shared structure. Use 'tags' or 'tags-split' instead.`);
	}
}
/**
* `tags-operations` mode: one file per operation, nested under a per-tag
* directory (`<dir>/<tag>/<operation><ext>`), each containing both the
* operation's types and its runtime implementation. A per-tag barrel
* (`<dir>/<tag>/index<ext>`) re-exports every operation file so existing
* `import from '<build>/<tag>'`-style imports keep working.
*/
async function writeTagsOperationsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap }) {
	assertClientSupportsTagsOperations(output.client, "tags-operations");
	const { filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = generateTargetForTagsOperations(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const schemaCustomImportPath = getSchemasImportPath(output.schemas);
	const schemasPathRelative = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(nodePath.join(dirname, "tag", filename + extension), getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname, true) : "../" + filename + ".schemas" + getImportExtension(extension, output.tsconfig);
	const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : nodePath.join(dirname, filename + ".schemas" + getImportExtension(extension, output.tsconfig));
	const schemasPath = !output.schemas && needSchema ? nodePath.join(dirname, filename + ".schemas" + extension) : void 0;
	if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const mockIndexEntries = [];
	const allGeneratedPaths = (await Promise.all(tagEntries.map(async ([tag, { helpers, operations }]) => {
		try {
			const tagDir = nodePath.join(dirname, tag);
			const helperFilename = `${tag}.helpers${extension}`;
			const helperPath = nodePath.join(tagDir, helperFilename);
			const hasHelpers = helpers.implementation.trim().length > 0;
			const helperImportExtension = getImportExtension(extension, output.tsconfig);
			const helperImportPath = "./" + tag + ".helpers" + helperImportExtension;
			if (hasHelpers) await writeGeneratedFile(helperPath, header + helpers.implementation);
			const operationFilePaths = await Promise.all(operations.map(async (operation) => {
				const operationFilename = kebab(operation.operationName);
				const implementationPath = nodePath.join(tagDir, `${operationFilename}${extension}`);
				const importsForBuilder = generateImportsForBuilder(output, operation.imports.filter((imp) => {
					const searchWords = [imp.alias, imp.name].filter((part) => Boolean(part?.length)).join("|");
					if (!searchWords) return false;
					return new RegExp(String.raw`\b(${searchWords})\b`, "g").test(operation.implementation);
				}), schemasPathRelative, schemaTagMap);
				let data = header;
				if (hasHelpers) data += buildTagHelpersImport(helpers, helperImportPath, operation.implementation);
				data += builder.imports({
					client: output.client,
					implementation: operation.implementation,
					imports: importsForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					hasGlobalMutator: !!output.override.mutator,
					hasTagsMutator: Object.values(output.override.tags).some((tagOverride) => !!tagOverride?.mutator),
					hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
					packageJson: output.packageJson,
					output
				});
				if (operation.mutators) data += generateMutatorImports({
					mutators: operation.mutators,
					implementation: operation.implementation,
					oneMore: true
				});
				if (operation.clientMutators) data += generateMutatorImports({
					mutators: operation.clientMutators,
					oneMore: true
				});
				if (operation.formData) data += generateMutatorImports({
					mutators: operation.formData,
					oneMore: true
				});
				if (operation.formUrlEncoded) data += generateMutatorImports({
					mutators: operation.formUrlEncoded,
					oneMore: true
				});
				if (operation.paramsSerializer) data += generateMutatorImports({
					mutators: operation.paramsSerializer,
					oneMore: true
				});
				if (operation.paramsFilter) data += generateMutatorImports({
					mutators: operation.paramsFilter,
					oneMore: true
				});
				if (operation.fetchReviver) data += generateMutatorImports({
					mutators: operation.fetchReviver,
					oneMore: true
				});
				data += "\n\n";
				if (operation.implementation.includes("NonReadonly<")) {
					data += getOrvalGeneratedTypes();
					data += "\n";
				}
				if (operation.implementation.includes("TypedResponse<")) {
					data += getTypedResponse();
					data += "\n";
				}
				data += operation.implementation;
				await writeGeneratedFile(implementationPath, data);
				const extraPaths = [];
				for (const mockOutput of operation.mockOutputsFull) {
					if (!mockOutput.implementation.handlerName) continue;
					const rawEntry = output.mock.generators.find((g) => {
						if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
						return g.type === mockOutput.type;
					});
					if (!rawEntry) continue;
					const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
					const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
					const kebabOperation = kebab(operation.operationName);
					const mockFilePath = nodePath.join(mockDir, tag, kebabOperation + "." + mockExtension + extension);
					const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
					const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
					const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation.function + mockOutput.implementation.handler, finalizeMockOptions) : mockOutput.implementation.function + mockOutput.implementation.handler;
					const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
					const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap);
					let mockData = header;
					mockData += builder.importsMock({
						implementation: finalizedMockImplementation,
						imports: importsMockForBuilder,
						projectName,
						hasSchemaDir: !!output.schemas,
						isAllowSyntheticDefaultImports,
						options: isFunction(rawEntry) ? void 0 : rawEntry
					});
					mockData += `\n${finalizedMockImplementation}`;
					await writeGeneratedFile(mockFilePath, mockData);
					extraPaths.push(mockFilePath);
					let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
					if (!indexEntry) {
						indexEntry = {
							ext: mockExtension,
							mockDir,
							operations: []
						};
						mockIndexEntries.push(indexEntry);
					}
					if (!indexEntry.operations.some((o) => o.tag === tag && o.opName === kebabOperation)) indexEntry.operations.push({
						tag,
						opName: kebabOperation,
						handlerName: mockOutput.implementation.handlerName
					});
				}
				return {
					operationFilename,
					paths: [implementationPath, ...extraPaths]
				};
			}));
			const indexPaths = [];
			if (output.indexFiles) {
				const importExtension = getImportExtension(extension, output.tsconfig);
				const barrelContent = operationFilePaths.map(({ operationFilename }) => `export * from './${operationFilename}${importExtension}';\n`).join("");
				const indexPath = nodePath.join(tagDir, `index${extension}`);
				await writeGeneratedFile(indexPath, barrelContent);
				indexPaths.push(indexPath);
			}
			return [
				...hasHelpers ? [helperPath] : [],
				...operationFilePaths.flatMap(({ paths }) => paths),
				...indexPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing tag ${tag} => ${String(error)}`, { cause: error });
		}
	}))).flat();
	const mockIndexPaths = [];
	if (output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, operations } of mockIndexEntries) {
			const indexPath = nodePath.join(mockDir, `index.${ext}${extension}`);
			await writeGeneratedFile(indexPath, operations.toSorted((a, b) => a.tag.localeCompare(b.tag) || a.opName.localeCompare(b.opName)).map(({ tag, opName, handlerName }) => {
				const localMockPath = joinSafe("./", tag, opName + "." + ext + mockImportExtension);
				const alias = `${pascal(tag)}${pascal(opName)}MockHandler`;
				return ext === OutputMockType.MSW ? `export { ${handlerName} as ${alias} } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
			}).join(""));
			mockIndexPaths.push(indexPath);
		}
	}
	let rootIndexPath;
	if (output.indexFiles) {
		const importExtension = getImportExtension(extension, output.tsconfig);
		const rootBarrelContent = tagEntries.map(([tag]) => `export * from './${tag}/index${importExtension}';\n`).join("");
		rootIndexPath = nodePath.join(dirname, `index${extension}`);
		await writeGeneratedFile(rootIndexPath, rootBarrelContent);
	}
	return [
		...schemasPath ? [schemasPath] : [],
		...rootIndexPath ? [rootIndexPath] : [],
		...allGeneratedPaths,
		...mockIndexPaths
	];
}
//#endregion
//#region src/writers/tags-operations-split-mode.ts
/**
* `tags-operations-split` mode: two files per operation, nested under a
* per-tag directory (`<dir>/<tag>/<operation><ext>` for the runtime
* implementation, `<dir>/<tag>/<operation>.schemas<ext>` for the component
* schemas that operation's implementation references), plus a per-tag
* barrel (`<dir>/<tag>/index<ext>`) re-exporting both files for every
* operation so existing `import from '<build>/<tag>'`-style imports keep
* working.
*/
async function writeTagsOperationsSplitMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap }) {
	assertClientSupportsTagsOperations(output.client, "tags-operations-split");
	const { filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = generateTargetForTagsOperations(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const schemaCustomImportPath = getSchemasImportPath(output.schemas);
	const schemasPathRelative = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(nodePath.join(dirname, "tag", filename + extension), getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname, true) : "../" + filename + ".schemas" + getImportExtension(extension, output.tsconfig);
	const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : nodePath.join(dirname, filename + ".schemas" + getImportExtension(extension, output.tsconfig));
	const globalSchemasPath = !output.schemas && needSchema ? nodePath.join(dirname, filename + ".schemas" + extension) : void 0;
	if (globalSchemasPath) await writeGeneratedFile(globalSchemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const mockIndexEntries = [];
	const allGeneratedPaths = (await Promise.all(tagEntries.map(async ([tag, { helpers, operations }]) => {
		try {
			const tagDir = nodePath.join(dirname, tag);
			const helperFilename = `${tag}.helpers${extension}`;
			const helperPath = nodePath.join(tagDir, helperFilename);
			const hasHelpers = helpers.implementation.trim().length > 0;
			const helperImportExtension = getImportExtension(extension, output.tsconfig);
			const helperImportPath = "./" + tag + ".helpers" + helperImportExtension;
			if (hasHelpers) await writeGeneratedFile(helperPath, header + helpers.implementation);
			const operationFilePaths = await Promise.all(operations.map(async (operation) => {
				const operationFilename = kebab(operation.operationName);
				const implementationPath = nodePath.join(tagDir, `${operationFilename}${extension}`);
				const operationSchemasFilename = `${operationFilename}.schemas${extension}`;
				const operationSchemasPath = nodePath.join(tagDir, operationSchemasFilename);
				const operationSchemasImportPath = "./" + operationFilename + ".schemas" + helperImportExtension;
				const implementationImports = operation.imports.filter((imp) => {
					const searchWords = [imp.alias, imp.name].filter((part) => Boolean(part?.length)).join("|");
					if (!searchWords) return false;
					return new RegExp(String.raw`\b(${searchWords})\b`, "g").test(operation.implementation);
				});
				const operationSchemas = resolveTransitiveSchemas(implementationImports.filter((imp) => !imp.importPath).map((imp) => imp.name), builder.schemas);
				const referencedSchemaNames = new Set(operationSchemas.map((s) => s.name));
				const hasOperationSchemas = operationSchemas.length > 0;
				if (hasOperationSchemas) await writeGeneratedFile(operationSchemasPath, header + generateModelsInline(operationSchemas));
				const importsForBuilder = generateImportsForBuilder(output, implementationImports.map((imp) => {
					if (imp.importPath) return imp;
					if (!referencedSchemaNames.has(imp.name)) return imp;
					return {
						...imp,
						importPath: operationSchemasImportPath
					};
				}), schemasPathRelative, schemaTagMap);
				let data = header;
				if (hasHelpers) data += buildTagHelpersImport(helpers, helperImportPath, operation.implementation);
				data += builder.imports({
					client: output.client,
					implementation: operation.implementation,
					imports: importsForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					hasGlobalMutator: !!output.override.mutator,
					hasTagsMutator: Object.values(output.override.tags).some((tagOverride) => !!tagOverride?.mutator),
					hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
					packageJson: output.packageJson,
					output
				});
				if (operation.mutators) data += generateMutatorImports({
					mutators: operation.mutators,
					implementation: operation.implementation,
					oneMore: true
				});
				if (operation.clientMutators) data += generateMutatorImports({
					mutators: operation.clientMutators,
					oneMore: true
				});
				if (operation.formData) data += generateMutatorImports({
					mutators: operation.formData,
					oneMore: true
				});
				if (operation.formUrlEncoded) data += generateMutatorImports({
					mutators: operation.formUrlEncoded,
					oneMore: true
				});
				if (operation.paramsSerializer) data += generateMutatorImports({
					mutators: operation.paramsSerializer,
					oneMore: true
				});
				if (operation.paramsFilter) data += generateMutatorImports({
					mutators: operation.paramsFilter,
					oneMore: true
				});
				if (operation.fetchReviver) data += generateMutatorImports({
					mutators: operation.fetchReviver,
					oneMore: true
				});
				data += "\n\n";
				if (operation.implementation.includes("NonReadonly<")) {
					data += getOrvalGeneratedTypes();
					data += "\n";
				}
				if (operation.implementation.includes("TypedResponse<")) {
					data += getTypedResponse();
					data += "\n";
				}
				data += operation.implementation;
				await writeGeneratedFile(implementationPath, data);
				const extraPaths = [];
				for (const mockOutput of operation.mockOutputsFull) {
					if (!mockOutput.implementation.handlerName) continue;
					const rawEntry = output.mock.generators.find((g) => {
						if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
						return g.type === mockOutput.type;
					});
					if (!rawEntry) continue;
					const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
					const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
					const kebabOperation = kebab(operation.operationName);
					const mockFilePath = nodePath.join(mockDir, tag, kebabOperation + "." + mockExtension + extension);
					const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
					const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
					const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation.function + mockOutput.implementation.handler, finalizeMockOptions) : mockOutput.implementation.function + mockOutput.implementation.handler;
					const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
					const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap);
					let mockData = header;
					mockData += builder.importsMock({
						implementation: finalizedMockImplementation,
						imports: importsMockForBuilder,
						projectName,
						hasSchemaDir: !!output.schemas,
						isAllowSyntheticDefaultImports,
						options: isFunction(rawEntry) ? void 0 : rawEntry
					});
					mockData += `\n${finalizedMockImplementation}`;
					await writeGeneratedFile(mockFilePath, mockData);
					extraPaths.push(mockFilePath);
					let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
					if (!indexEntry) {
						indexEntry = {
							ext: mockExtension,
							mockDir,
							operations: []
						};
						mockIndexEntries.push(indexEntry);
					}
					if (!indexEntry.operations.some((o) => o.tag === tag && o.opName === kebabOperation)) indexEntry.operations.push({
						tag,
						opName: kebabOperation,
						handlerName: mockOutput.implementation.handlerName
					});
				}
				return {
					operationFilename,
					hasOperationSchemas,
					operationSchemasFilename,
					paths: [
						implementationPath,
						...hasOperationSchemas ? [operationSchemasPath] : [],
						...extraPaths
					]
				};
			}));
			const indexPaths = [];
			if (output.indexFiles) {
				const importExtension = getImportExtension(extension, output.tsconfig);
				const barrelContent = operationFilePaths.map(({ operationFilename }) => `export * from './${operationFilename}${importExtension}';\n`).join("");
				const indexPath = nodePath.join(tagDir, `index${extension}`);
				await writeGeneratedFile(indexPath, barrelContent);
				indexPaths.push(indexPath);
			}
			return [
				...hasHelpers ? [helperPath] : [],
				...operationFilePaths.flatMap(({ paths }) => paths),
				...indexPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing tag ${tag} => ${String(error)}`, { cause: error });
		}
	}))).flat();
	const mockIndexPaths = [];
	if (output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, operations } of mockIndexEntries) {
			const indexPath = nodePath.join(mockDir, `index.${ext}${extension}`);
			await writeGeneratedFile(indexPath, operations.toSorted((a, b) => a.tag.localeCompare(b.tag) || a.opName.localeCompare(b.opName)).map(({ tag, opName, handlerName }) => {
				const localMockPath = joinSafe("./", tag, opName + "." + ext + mockImportExtension);
				const alias = `${pascal(tag)}${pascal(opName)}MockHandler`;
				return ext === OutputMockType.MSW ? `export { ${handlerName} as ${alias} } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
			}).join(""));
			mockIndexPaths.push(indexPath);
		}
	}
	let rootIndexPath;
	if (output.indexFiles) {
		const importExtension = getImportExtension(extension, output.tsconfig);
		const rootBarrelContent = tagEntries.map(([tag]) => `export * from './${tag}/index${importExtension}';\n`).join("");
		rootIndexPath = nodePath.join(dirname, `index${extension}`);
		await writeGeneratedFile(rootIndexPath, rootBarrelContent);
	}
	return [
		...globalSchemasPath ? [globalSchemasPath] : [],
		...rootIndexPath ? [rootIndexPath] : [],
		...allGeneratedPaths,
		...mockIndexPaths
	];
}
//#endregion
export { BODY_TYPE_NAME, DefaultTag, EnumGeneration, ErrorWithTag, FormDataArrayHandling, GetterPropType, LogLevels, NAMED_COMPONENT_SECTIONS, NamingConvention, OutputClient, OutputHttpClient, OutputMockType, OutputMode, PropertySortOrder, RefComponentSuffix, SHARED_DIR, SchemaType, SupportedFormatter, TEMPLATE_TAG_REGEX, URL_REGEX, VERBS_WITH_BODY, Verbs, addDependency, assertClientSupportsTagsOperations, asyncReduce, buildAngularParamsFilterExpression, buildDynamicScope, buildInlineDynamicScope, buildSchemaTagMap, buildTagHelpersImport, camel, camelPathParamName, collectReferencedComponents, combineSchemas, compareVersions, conventionName, count, createDebugger, createLogger, createSuccessMessage, createTypeAliasIfNeeded, dedupeUnionType, dynamicAnchorToParamName, dynamicAnchorsToUniqueParamNames, dynamicImport, escape, escapeRegExp, extractBoundAliasInfo, filterByContentType, filteredVerbs, fixCrossDirectoryImports, fixRegularSchemaImports, generalJSTypes, generalJSTypesWithArray, generateAxiosOptions, generateBodyMutatorConfig, generateBodyOptions, generateComponentDefinition, generateDependencyImports, generateFactory, generateFormDataAndUrlEncodedFunction, generateImports, generateModelInline, generateModelsInline, generateMutator, generateMutatorConfig, generateMutatorImports, generateMutatorRequestOptions, generateOptions, generateParameterDefinition, generateQueryParamsAxiosConfig, generateSchemasDefinition, generateTarget, generateTargetForTags, generateTargetForTagsOperations, generateVerbImports, generateVerbOptions, generateVerbsOptions, getAngularFilteredParamsCallExpression, getAngularFilteredParamsExpression, getAngularFilteredParamsHelperBody, getAngularObjectParamStrategies, getArray, getBaseUrlRuntimeImports, getBodiesByContentType, getBody, getCombinedEnumValue, getDefaultContentType, getDynamicAnchorIndex, getDynamicAnchorName, getEnum, getEnumDescriptions, getEnumImplementation, getEnumNames, getEnumUnionFromSchema, getExtension, getFileInfo, getFormDataFieldFileType, getFullRoute, getImportExtension, getIsBodyVerb, getKey, getMockFileExtensionByTypeName, getNumberWord, getObject, getOperationId, getOperationTagKey, getOrvalGeneratedTypes, getParameters, getParams, getParamsInPath, getPropertyAccessor, getPropertySafe, getProps, getQueryParams, getRefInfo, getResReqTypes, getResponse, getResponseTypeCategory, getRoute, getRouteAsArray, getScalar, getSchemasImportPath, getSuccessResponseType, getTagKey, getTypedResponse, getWarningCount, isBinaryContentType, isBinaryScalarSchema, isBoolean, isComponentRef, isDirectory, isDynamicReference, isFakerMock, isFunction, isModule, isMswMock, isNullish, isNumber, isNumeric, isObject, isOperationInTagBucket, isReference, isSchema, isString, isStringLike, isSyntheticDefaultImportsAllow, isUrl, isVerb, isVerbose, jsDoc, jsStringEscape, jsStringLiteralEscape, kebab, keyValuePairsToJsDoc, log, logError, logVerbose, logWarning, makeRouteSafe, mergeDeep, mismatchArgsMessage, pascal, removeFilesAndEmptyFolders, resetWarnings, resolveDiscriminators, resolveDynamicRef, resolveExampleRefs, resolveInstalledVersion, resolveInstalledVersions, resolveObject, resolveRef, resolveTransitiveSchemas, resolveValue, sanitize, sanitizePathParamName, setVerbose, snake, sortByPriority, splitSchemasByType, startMessage, stringify, toColonRoutePath, toObjectString, path_exports as upath, upper, wrapRouteParameters, writeGeneratedFile, writeModelInline, writeModelsInline, writeSchema, writeSchemas, writeSchemasTagsSplit, writeSingleMode, writeSplitMode, writeSplitTagsMode, writeTagsMode, writeTagsOperationsMode, writeTagsOperationsSplitMode };

//# sourceMappingURL=index.mjs.map