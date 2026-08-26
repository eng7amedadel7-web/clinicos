import nodePath from "node:path";
import { camelPathParamName, generateMutatorImports, getFileInfo, getImportExtension, getKey, getOperationTagKey, getOrvalGeneratedTypes, getParamsInPath, isObject, isOperationInTagBucket, jsDoc, logWarning, pascal, sanitizePathParamName, toColonRoutePath, upath } from "@orval/core";
import { generateZod, getZodImportSource } from "@orval/zod";
import fs from "fs-extra";
//#region src/handler-merge.ts
/**
* AST-based reconciliation of an existing hono handler file.
*
* The `smart` handler strategy regenerates only the regions orval owns — its own
* imports (names + module specifier) and the `zValidator(...)` arguments of each
* handler — while leaving every user-authored construct untouched: custom imports,
* middleware passed to `factory.createHandlers(...)`, the `async (c) => { ... }`
* body, and any top-level helpers, constants, types, or comments.
*
* We edit the original source text in place using node offsets from the
* TypeScript compiler API, so formatting and comments of untouched regions are
* preserved. On any parse failure we return the source unchanged — user code is
* never destroyed by a parser hiccup.
*/
/**
* `typescript` is an optional peer dependency, imported lazily. Consumers who do
* not have it installed — and every non-hono or `skip` code path — never trigger
* the import; `smart`/`full` fall back to `skip` when it is unavailable. Loading
* the consumer's own typescript also avoids shipping a second copy of it.
*/
let ts;
let typeScriptAvailable;
const ensureTypeScript = async () => {
	if (typeScriptAvailable === void 0) try {
		const mod = await import("typescript");
		ts = mod.default ?? mod;
		typeScriptAvailable = true;
	} catch {
		typeScriptAvailable = false;
	}
	return typeScriptAvailable;
};
const VALIDATOR_TARGETS = new Set([
	"header",
	"param",
	"query",
	"json",
	"form",
	"response"
]);
const parse = (source) => {
	const sourceFile = ts.createSourceFile("handler.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const diagnostics = sourceFile.parseDiagnostics;
	if (diagnostics && diagnostics.length > 0) return void 0;
	return sourceFile;
};
const findHandlers = (sourceFile) => {
	const handlers = [];
	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		for (const declaration of statement.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name)) continue;
			const name = declaration.name.text;
			if (!name.endsWith("Handlers")) continue;
			const init = declaration.initializer;
			if (init && ts.isCallExpression(init) && ts.isPropertyAccessExpression(init.expression) && init.expression.name.text === "createHandlers") handlers.push({
				name,
				call: init
			});
		}
	}
	return handlers;
};
const importedNames = (declaration) => {
	const bindings = declaration.importClause?.namedBindings;
	if (!bindings || !ts.isNamedImports(bindings)) return [];
	return bindings.elements.map((element) => element.name.text);
};
const moduleText = (declaration) => ts.isStringLiteral(declaration.moduleSpecifier) ? declaration.moduleSpecifier.text : "";
/**
* A "plain" named import — no default binding, no namespace (`* as x`), and no
* aliases (`x as y`). Only plain named imports are safe for orval to rewrite;
* default / namespace / aliased / mixed imports are user-authored and must be
* left untouched.
*/
const isPlainNamedImport = (declaration) => {
	const clause = declaration.importClause;
	if (!clause || clause.name) return false;
	const bindings = clause.namedBindings;
	if (!bindings || !ts.isNamedImports(bindings)) return false;
	return bindings.elements.every((element) => element.propertyName === void 0);
};
const setEquals = (a, b) => a.length === b.length && a.every((value) => b.includes(value));
const escapeRegExp = (value) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
/**
* The local binding name an imported symbol is bound to, honouring aliases —
* e.g. `import { zValidator as zv }` → `'zv'`. Returns undefined when the symbol
* is not imported. Used so a handler that aliases `zValidator` is detected and
* its new validators are inserted under the same alias (never an unimported name).
*/
const localNameFor = (importDeclarations, importedName, module) => {
	for (const declaration of importDeclarations) {
		if (moduleText(declaration) !== module) continue;
		const bindings = declaration.importClause?.namedBindings;
		if (!bindings || !ts.isNamedImports(bindings)) continue;
		for (const element of bindings.elements) if ((element.propertyName?.text ?? element.name.text) === importedName) return element.name.text;
	}
};
const renderImport = ({ names, module }) => names.length <= 1 ? `import { ${names.join("")} } from '${module}';` : `import {\n  ${names.join(",\n  ")}\n} from '${module}';`;
const lineStart = (source, position) => source.lastIndexOf("\n", position - 1) + 1;
/** Whether only whitespace sits between the line start and `position`. */
const startsLine = (source, position) => /^\s*$/.test(source.slice(lineStart(source, position), position));
const reconcileHandlerFile = async (source, desired) => {
	if (!await ensureTypeScript()) return source;
	const sourceFile = parse(source);
	if (!sourceFile) return source;
	const edits = [];
	const importDeclarations = sourceFile.statements.filter((statement) => ts.isImportDeclaration(statement));
	const handlers = findHandlers(sourceFile);
	const existingNames = new Set(handlers.map((handler) => handler.name));
	const pendingInsertions = [];
	const byModule = (module) => module ? importDeclarations.find((declaration) => moduleText(declaration) === module) : void 0;
	const plainExact = (signature) => signature.length === 0 ? void 0 : importDeclarations.find((declaration) => isPlainNamedImport(declaration) && setEquals(importedNames(declaration), signature));
	const removeImportEdit = (declaration) => {
		let end = declaration.getEnd();
		if (source.slice(end, end + 2) === "\r\n") end += 2;
		else if (source[end] === "\n") end += 1;
		edits.push({
			start: declaration.getStart(sourceFile),
			end,
			text: ""
		});
	};
	const isImportedBare = (name) => importDeclarations.some((declaration) => {
		const clause = declaration.importClause;
		if (!clause) return false;
		if (clause.name?.text === name) return true;
		return importedNames(declaration).includes(name);
	});
	/**
	* Reconcile an orval-owned import to `names`. We only rewrite/remove a PLAIN
	* named import whose names are ALL orval-owned (per `isOrvalName`). A
	* user-authored import (aliased / namespace / default / mixed) is never
	* rewritten; instead, when `augment` is provided, we add any orval name that
	* is genuinely needed as a bare reference but isn't yet importable bare — e.g.
	* a newly appended handler's context, or a newly-inserted validator's schema.
	*/
	const reconcileImport = (existing, names, module, isOrvalName, augment, collectRenames) => {
		if (!existing) {
			const toInsert = (augment ? names.filter((name) => augment(name)) : names).filter((name) => !isImportedBare(name));
			if (toInsert.length > 0) pendingInsertions.push(renderImport({
				names: toInsert,
				module
			}));
			return;
		}
		if (!(isPlainNamedImport(existing) && importedNames(existing).every((name) => isOrvalName(name)))) {
			if (augment) {
				const missing = names.filter((name) => augment(name) && !isImportedBare(name));
				if (missing.length > 0) pendingInsertions.push(renderImport({
					names: missing,
					module
				}));
			}
			return;
		}
		if (names.length === 0) {
			removeImportEdit(existing);
			return;
		}
		if (setEquals(importedNames(existing), names) && moduleText(existing) === module) return;
		if (collectRenames) for (const old of importedNames(existing)) {
			const next = names.find((name) => name !== old && name.toLowerCase() === old.toLowerCase());
			if (next) collectRenames.set(old, next);
		}
		edits.push({
			start: existing.getStart(sourceFile),
			end: existing.getEnd(),
			text: renderImport({
				names,
				module
			})
		});
	};
	const validatorModule = desired.imports.validator?.module ?? "";
	const zValidatorName = validatorModule ? localNameFor(importDeclarations, "zValidator", validatorModule) ?? "zValidator" : "zValidator";
	const requiredSchemas = /* @__PURE__ */ new Set();
	const removedValidatorRanges = [];
	for (const desiredHandler of desired.handlers) {
		const parsed = handlers.find((handler) => handler.name === desiredHandler.handlerName);
		if (parsed) reconcileValidators(sourceFile, source, parsed.call, desiredHandler.validators, edits, zValidatorName, requiredSchemas, removedValidatorRanges);
	}
	const schemaRenames = /* @__PURE__ */ new Map();
	const toAppend = desired.handlers.filter((handler) => !existingNames.has(handler.handlerName));
	let bodySource = source;
	for (const declaration of importDeclarations) {
		const start = declaration.getStart(sourceFile);
		const end = declaration.getEnd();
		bodySource = bodySource.slice(0, start) + " ".repeat(end - start) + bodySource.slice(end);
	}
	const referencedBare = (name) => new RegExp(String.raw`(?<!\.)\b${escapeRegExp(name)}\b`).test(bodySource);
	const inAppendedStub = (name) => toAppend.some((handler) => handler.stub.includes(name));
	const needsBareContext = (name) => referencedBare(name) || inAppendedStub(name);
	const needsBareZod = (name) => referencedBare(name) || requiredSchemas.has(name) || inAppendedStub(name);
	const contextNames = desired.imports.context.names.filter((name) => needsBareContext(name));
	const zodLower = new Set((desired.imports.zod?.names ?? []).map((name) => name.toLowerCase()));
	const factoryModule = desired.imports.factory.module;
	reconcileImport(byModule(factoryModule) ?? plainExact(["createFactory"]), desired.imports.factory.names, factoryModule, (name) => name === "createFactory");
	reconcileImport(byModule(validatorModule) ?? plainExact(["zValidator"]), desired.imports.validator ? ["zValidator"] : [], validatorModule, (name) => name === "zValidator");
	reconcileImport(byModule(desired.imports.context.module) ?? plainExact(contextNames), contextNames, desired.imports.context.module, (name) => desired.imports.context.names.includes(name), needsBareContext);
	const zodModule = desired.imports.zod?.module ?? "";
	const zodNames = desired.imports.zod?.names ?? [];
	reconcileImport(byModule(zodModule) ?? plainExact(zodNames), zodNames, zodModule, (name) => zodLower.has(name.toLowerCase()), needsBareZod, schemaRenames);
	if (schemaRenames.size > 0) {
		const inSkippedRange = (pos) => importDeclarations.some((declaration) => pos >= declaration.getStart(sourceFile) && pos < declaration.getEnd()) || removedValidatorRanges.some(([start, end]) => pos >= start && pos < end);
		const renameReferences = (node) => {
			if (ts.isIdentifier(node)) {
				const replacement = schemaRenames.get(node.text);
				if (replacement) {
					const parent = node.parent;
					const isMemberName = ts.isPropertyAccessExpression(parent) && parent.name === node;
					const isDeclarationName = ts.isVariableDeclaration(parent) && parent.name === node || ts.isParameter(parent) && parent.name === node || ts.isBindingElement(parent) && parent.name === node || ts.isPropertyAssignment(parent) && parent.name === node || ts.isPropertySignature(parent) && parent.name === node;
					const start = node.getStart(sourceFile);
					if (!isMemberName && !isDeclarationName && !inSkippedRange(start)) edits.push({
						start,
						end: node.getEnd(),
						text: replacement
					});
				}
			}
			ts.forEachChild(node, renameReferences);
		};
		renameReferences(sourceFile);
	}
	if (pendingInsertions.length > 0) {
		const lastImport = importDeclarations.at(-1);
		let insertPos = 0;
		if (lastImport) {
			const newline = source.indexOf("\n", lastImport.getEnd());
			insertPos = newline === -1 ? source.length : newline + 1;
		}
		edits.push({
			start: insertPos,
			end: insertPos,
			text: pendingInsertions.map((line) => `${line}\n`).join("")
		});
	}
	if (toAppend.length > 0) edits.push({
		start: source.length,
		end: source.length,
		text: toAppend.map((handler) => handler.stub).join("")
	});
	return applyEdits(source, edits);
};
const reconcileValidators = (sourceFile, source, call, desiredValidators, edits, zValidatorName, requiredSchemas, removedRanges) => {
	const existing = [];
	for (const arg of call.arguments) if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression) && arg.expression.text === zValidatorName) {
		const target = arg.arguments[0];
		if (arg.arguments.length > 0 && ts.isStringLiteralLike(target) && VALIDATOR_TARGETS.has(target.text)) existing.push({
			target: target.text,
			arg
		});
	}
	const desiredByTarget = new Map(desiredValidators.map((validator) => [validator.target, validator]));
	const existingByTarget = new Set(existing.map((item) => item.target));
	for (const item of existing) if (!desiredByTarget.has(item.target)) {
		const edit = removeArgumentEdit(sourceFile, source, item.arg);
		edits.push(edit);
		removedRanges.push([edit.start, edit.end]);
	}
	const missing = desiredValidators.filter((validator) => !existingByTarget.has(validator.target));
	if (missing.length > 0) {
		const insertPos = validatorInsertPos(sourceFile, source, call);
		const text = missing.map((validator) => {
			requiredSchemas.add(validator.schema);
			return `  ${zValidatorName}('${validator.target}', ${validator.schema}),\n`;
		}).join("");
		edits.push({
			start: insertPos,
			end: insertPos,
			text
		});
	}
};
/** Position to insert new validators: the line start of the trailing handler. */
const validatorInsertPos = (sourceFile, source, call) => {
	const handler = call.arguments.findLast((arg) => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg));
	if (handler) {
		const start = handler.getStart(sourceFile);
		return startsLine(source, start) ? lineStart(source, start) : start;
	}
	return call.getEnd() - 1;
};
const removeArgumentEdit = (sourceFile, source, arg) => {
	const argStart = arg.getStart(sourceFile);
	const start = startsLine(source, argStart) ? lineStart(source, argStart) : argStart;
	const commaIdx = source.indexOf(",", arg.getEnd());
	let end = commaIdx === -1 ? arg.getEnd() : commaIdx + 1;
	while (source[end] === " " || source[end] === "	") end += 1;
	if (source.slice(end, end + 2) === "\r\n") end += 2;
	else if (source[end] === "\n") end += 1;
	return {
		start,
		end,
		text: ""
	};
};
const applyEdits = (source, edits) => {
	let result = source;
	for (const edit of edits.toSorted((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
	return result;
};
/**
* Extracts the inner body of each handler's `async (c) => { ... }` block, keyed
* by handler name. Used by the `full` strategy to splice user bodies back into a
* freshly-regenerated wrapper. Returns `undefined` when the source can't be
* parsed (or typescript is unavailable) — distinct from an empty map (parsed, no
* handlers) — so callers can preserve the file instead of dropping its bodies.
*/
const extractHandlerBodies = async (source) => {
	if (!await ensureTypeScript()) return void 0;
	const sourceFile = parse(source);
	if (!sourceFile) return void 0;
	const bodies = /* @__PURE__ */ new Map();
	for (const { name, call } of findHandlers(sourceFile)) {
		const handler = call.arguments.findLast((arg) => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg));
		if (handler?.body && ts.isBlock(handler.body)) {
			const bodyStart = handler.body.getStart(sourceFile) + 1;
			const bodyEnd = handler.body.getEnd() - 1;
			bodies.set(name, source.slice(bodyStart, bodyEnd));
		}
	}
	return bodies;
};
//#endregion
//#region src/route.ts
const getRoute = (route) => toColonRoutePath(route, sanitizePathParamName);
//#endregion
//#region src/index.ts
const getZodSchemaImportStatement = (variant) => variant === "mini" ? `import * as zod from '${getZodImportSource(variant)}';` : `import { z as zod } from '${getZodImportSource(variant)}';`;
let warnedMissingTypeScript = false;
const ZVALIDATOR_SOURCE = fs.readFileSync(nodePath.join(import.meta.dirname, "zValidator.ts")).toString("utf8");
const HONO_DEPENDENCIES = [{
	exports: [
		{
			name: "Hono",
			values: true
		},
		{ name: "Context" },
		{ name: "Env" }
	],
	dependency: "hono"
}];
/**
* generateModuleSpecifier generates the specifier that _from_ would use to
* import _to_. This is syntactical and does not validate the paths.
*
* @param from The filesystem path to the importer.
* @param to If a filesystem path, it and _from_ must be use the same frame of
* reference, such as process.cwd() or both be absolute. If only one is
* absolute, the other must be relative to process.cwd().
*
* Otherwise, treated as a package name and returned directly.
*
* @param tsconfig Optional tsconfig used to derive the runtime import
* extension. Under `module: 'nodenext'/'node16'` the source extension (e.g.
* `.ts`) is rewritten to its runtime equivalent (e.g. `.js`); otherwise the
* extension is dropped to match the rest of orval.
*
* @return A module specifier that can be used at _from_ to import _to_.
*/
const generateModuleSpecifier = (from, to, tsconfig) => {
	if (to.startsWith(".") || nodePath.isAbsolute(to)) {
		const resolvedFrom = nodePath.resolve(from);
		const resolvedTo = nodePath.resolve(to);
		const relative = upath.getRelativeImportPath(resolvedFrom, resolvedTo);
		const sourceExt = nodePath.extname(to);
		return `${relative}${sourceExt ? getImportExtension(sourceExt, tsconfig) : ""}`;
	}
	return to;
};
const getHonoDependencies = () => HONO_DEPENDENCIES;
const getHonoHeader = ({ verbOptions, output, tag, clientImplementation }) => {
	const targetInfo = getFileInfo(output.target, { extension: output.fileExtension });
	let handlers;
	const importHandlers = Object.values(verbOptions).filter((verbOption) => clientImplementation.includes(`${verbOption.operationName}Handlers`));
	if (output.override.hono.handlers) {
		const handlerFileInfo = getFileInfo(output.override.hono.handlers);
		handlers = importHandlers.map((verbOption) => {
			const isSplitDir = output.mode === "tags-split";
			const tag = getOperationTagKey(verbOption);
			const handlersPath = upath.relativeSafe(nodePath.join(targetInfo.dirname, isSplitDir ? tag : ""), nodePath.join(handlerFileInfo.dirname, `./${verbOption.operationName}`));
			return `import { ${verbOption.operationName}Handlers } from '${handlersPath}';`;
		}).join("\n");
	} else handlers = `import {\n${importHandlers.map((verbOption) => ` ${verbOption.operationName}Handlers`).join(`, \n`)}\n} from './${tag ?? targetInfo.filename}.handlers';`;
	return `${handlers}\n\nconst app = new Hono()\n`;
};
const getHonoFooter = () => ";\n\nexport default app;\n";
const generateHonoRoute = ({ operationName, verb }, pathRoute) => {
	const path = getRoute(pathRoute);
	return `\n  .${verb.toLowerCase()}('${path}', ...${operationName}Handlers)`;
};
const generateHono = (verbOptions, options) => {
	if (options.override.hono.compositeRoute) return {
		implementation: "",
		imports: []
	};
	return {
		implementation: `${generateHonoRoute(verbOptions, options.pathRoute)}\n`,
		imports: [
			...verbOptions.params.flatMap((param) => param.imports),
			...verbOptions.body.imports,
			...verbOptions.queryParams ? [{ name: verbOptions.queryParams.schema.name }] : []
		]
	};
};
/**
* getHonoHandlers generates TypeScript code for the given verbs and reports
* whether the code requires zValidator.
*/
const DEFAULT_HANDLER_BODY = "\n\n  ";
const FORM_CONTENT_TYPES = new Set(["multipart/form-data", "application/x-www-form-urlencoded"]);
/**
* Whether a request body uses a form encoding. Hono validates these with
* `zValidator('form', …)` against `c.req.parseBody()`, not `'json'`.
*/
const isFormBody = (body) => FORM_CONTENT_TYPES.has(body.contentType);
/**
* getDesiredValidators returns the `zValidator` targets (and their PascalCase zod
* schema identifiers) required by a verb, in canonical order. This is the single
* source of truth shared by fresh generation and the `smart` reconcile.
*/
const getDesiredValidators = (verbOption, validator) => {
	if (!validator) return [];
	const pascalTypeName = pascal(verbOption.typeName);
	const validators = [];
	if (verbOption.headers) validators.push({
		target: "header",
		schema: `${pascalTypeName}Header`
	});
	if (verbOption.params.length > 0) validators.push({
		target: "param",
		schema: `${pascalTypeName}Params`
	});
	if (verbOption.queryParams) validators.push({
		target: "query",
		schema: `${pascalTypeName}QueryParams`
	});
	if (verbOption.body.definition) validators.push({
		target: isFormBody(verbOption.body) ? "form" : "json",
		schema: `${pascalTypeName}Body`
	});
	if (validator !== "hono" && verbOption.response.originalSchema?.["200"]?.content?.["application/json"]) validators.push({
		target: "response",
		schema: `${pascalTypeName}Response`
	});
	return validators;
};
const getHonoHandlers = (...opts) => {
	let code = "";
	let hasZValidator = false;
	for (const { handlerName, contextTypeName, verbOption, validator, bodyOverride } of opts) {
		const currentValidator = getDesiredValidators(verbOption, validator).map((v) => `zValidator('${v.target}', ${v.schema}),\n`).join("");
		code += `
export const ${handlerName} = factory.createHandlers(
${currentValidator}async (c: ${contextTypeName}) => {${bodyOverride ?? DEFAULT_HANDLER_BODY}},
);`;
		hasZValidator ||= currentValidator !== "";
	}
	return [code, hasZValidator];
};
const getZvalidatorImports = (verbOptions, importPath, isHonoValidator) => {
	const specifiers = [];
	for (const { typeName, headers, params, queryParams, body, response } of verbOptions) {
		const pascalTypeName = pascal(typeName);
		if (headers) specifiers.push(`${pascalTypeName}Header`);
		if (params.length > 0) specifiers.push(`${pascalTypeName}Params`);
		if (queryParams) specifiers.push(`${pascalTypeName}QueryParams`);
		if (body.definition) specifiers.push(`${pascalTypeName}Body`);
		if (!isHonoValidator && response.originalSchema?.["200"]?.content?.["application/json"] != void 0) specifiers.push(`${pascalTypeName}Response`);
	}
	return specifiers.length === 0 ? "" : `import {\n${specifiers.join(",\n")}\n} from '${importPath}'`;
};
const getVerbOptionGroupByTag = (verbOptions) => {
	const grouped = {};
	for (const value of Object.values(verbOptions)) {
		const tag = getOperationTagKey(value);
		if (!grouped[tag]) grouped[tag] = [];
		grouped[tag].push(value);
	}
	return grouped;
};
/** Computes the orval-owned imports a handler file should contain. */
const buildDesiredImports = ({ verbList, path, validatorModule, zodModule, contextModule, validator, tsconfig }) => {
	const contextNames = verbList.map((verb) => `${pascal(verb.typeName)}Context`);
	const zodNames = verbList.flatMap((verb) => getDesiredValidators(verb, validator).map((v) => v.schema));
	const hasValidators = zodNames.length > 0;
	return {
		factory: {
			names: ["createFactory"],
			module: "hono/factory"
		},
		validator: hasValidators && validatorModule != void 0 ? {
			names: ["zValidator"],
			module: generateModuleSpecifier(path, validatorModule, tsconfig)
		} : void 0,
		context: {
			names: contextNames,
			module: generateModuleSpecifier(path, contextModule, tsconfig)
		},
		zod: hasValidators ? {
			names: zodNames,
			module: generateModuleSpecifier(path, zodModule, tsconfig)
		} : void 0
	};
};
/** Generates a complete handler file from scratch (no existing file to merge). */
const generateFreshHandlerFile = ({ verbList, path, header, validatorModule, zodModule, contextModule, validator, bodyFor, tsconfig }) => {
	const [handlerCode, hasZValidator] = getHonoHandlers(...verbList.map((verbOption) => ({
		handlerName: `${verbOption.operationName}Handlers`,
		contextTypeName: `${pascal(verbOption.typeName)}Context`,
		verbOption,
		validator,
		bodyOverride: bodyFor?.(verbOption.operationName)
	})));
	const imports = ["import { createFactory } from 'hono/factory';"];
	if (hasZValidator && validatorModule != void 0) imports.push(`import { zValidator } from '${generateModuleSpecifier(path, validatorModule, tsconfig)}';`);
	imports.push(`import { ${verbList.map((verb) => `${pascal(verb.typeName)}Context`).join(",\n")} } from '${generateModuleSpecifier(path, contextModule, tsconfig)}';`);
	if (hasZValidator) imports.push(getZvalidatorImports(verbList, generateModuleSpecifier(path, zodModule, tsconfig), validatorModule === "@hono/zod-validator"));
	return `${header}${imports.filter((imp) => imp !== "").join("\n")}\n\nconst factory = createFactory();${handlerCode}`;
};
/**
* Generates or updates a handler file according to `strategy`:
*
* - a non-existent file is always freshly generated;
* - `skip` leaves an existing file byte-for-byte unchanged;
* - `full` rebuilds the preamble + validator chain and splices back user bodies
*   (drops custom imports/middleware/helpers — the thin-handler model);
* - `smart` non-destructively reconciles orval-owned imports + validators and
*   appends handlers for new operations, preserving all user-authored code.
*/
const generateHandlerFile = async ({ verbs, path, header, validatorModule, zodModule, contextModule, strategy, tsconfig }) => {
	const validator = validatorModule === "@hono/zod-validator" ? "hono" : validatorModule != void 0;
	const verbList = Object.values(verbs);
	if (!fs.existsSync(path)) return generateFreshHandlerFile({
		verbList,
		path,
		header,
		validatorModule,
		zodModule,
		contextModule,
		validator,
		tsconfig
	});
	const source = await fs.readFile(path, "utf8");
	if (strategy === "skip") return source;
	if (!await ensureTypeScript()) {
		if (!warnedMissingTypeScript) {
			warnedMissingTypeScript = true;
			logWarning(`hono handlerGenerationStrategy '${strategy}' requires the optional peer dependency "typescript", which is not installed. Existing handler files are left unchanged (as with 'skip'). Install typescript to enable handler reconciliation.`);
		}
		return source;
	}
	if (strategy === "full") {
		const bodies = await extractHandlerBodies(source);
		if (!bodies) return source;
		return generateFreshHandlerFile({
			verbList,
			path,
			header,
			validatorModule,
			zodModule,
			contextModule,
			validator,
			bodyFor: (operationName) => bodies.get(`${operationName}Handlers`),
			tsconfig
		});
	}
	return reconcileHandlerFile(source, {
		imports: buildDesiredImports({
			verbList,
			path,
			validatorModule,
			zodModule,
			contextModule,
			validator,
			tsconfig
		}),
		handlers: verbList.map((verbOption) => ({
			handlerName: `${verbOption.operationName}Handlers`,
			validators: getDesiredValidators(verbOption, validator),
			stub: getHonoHandlers({
				handlerName: `${verbOption.operationName}Handlers`,
				contextTypeName: `${pascal(verbOption.typeName)}Context`,
				verbOption,
				validator
			})[0]
		}))
	});
};
const generateHandlerFiles = async (verbOptions, output, context, validatorModule) => {
	const header = getHeader(output.override.header, getSpecInfo(context));
	const { extension, dirname, filename } = getFileInfo(output.target, { extension: output.fileExtension });
	const strategy = output.override.hono.handlerGenerationStrategy;
	if (output.override.hono.handlers) return Promise.all(Object.values(verbOptions).map(async (verbOption) => {
		const tag = getOperationTagKey(verbOption);
		const path = nodePath.join(output.override.hono.handlers ?? "", `./${verbOption.operationName}` + extension);
		let zodModule;
		let contextModule;
		if (output.mode === "tags") {
			zodModule = nodePath.join(dirname, `${tag}.zod${extension}`);
			contextModule = nodePath.join(dirname, `${tag}.context${extension}`);
		} else if (output.mode === "tags-split") {
			zodModule = nodePath.join(dirname, tag, tag + ".zod" + extension);
			contextModule = nodePath.join(dirname, tag, tag + ".context" + extension);
		} else {
			zodModule = nodePath.join(dirname, `${filename}.zod${extension}`);
			contextModule = nodePath.join(dirname, `${filename}.context${extension}`);
		}
		return {
			content: await generateHandlerFile({
				path,
				header,
				verbs: [verbOption],
				validatorModule,
				zodModule,
				contextModule,
				strategy,
				tsconfig: output.tsconfig
			}),
			path
		};
	}));
	if (output.mode === "tags" || output.mode === "tags-split") {
		const groupByTags = getVerbOptionGroupByTag(verbOptions);
		return Promise.all(Object.entries(groupByTags).map(async ([tag, verbs]) => {
			const handlerPath = output.mode === "tags" ? nodePath.join(dirname, `${tag}.handlers${extension}`) : nodePath.join(dirname, tag, tag + ".handlers" + extension);
			return {
				content: await generateHandlerFile({
					path: handlerPath,
					header,
					verbs,
					validatorModule,
					zodModule: output.mode === "tags" ? nodePath.join(dirname, `${tag}.zod${extension}`) : nodePath.join(dirname, tag, tag + ".zod" + extension),
					contextModule: output.mode === "tags" ? nodePath.join(dirname, `${tag}.context${extension}`) : nodePath.join(dirname, tag, tag + ".context" + extension),
					strategy,
					tsconfig: output.tsconfig
				}),
				path: handlerPath
			};
		}));
	}
	const handlerPath = nodePath.join(dirname, `${filename}.handlers${extension}`);
	return [{
		content: await generateHandlerFile({
			path: handlerPath,
			header,
			verbs: Object.values(verbOptions),
			validatorModule,
			zodModule: nodePath.join(dirname, `${filename}.zod${extension}`),
			contextModule: nodePath.join(dirname, `${filename}.context${extension}`),
			strategy,
			tsconfig: output.tsconfig
		}),
		path: handlerPath
	}];
};
const getContext = (verbOption) => {
	let paramType = "";
	if (verbOption.params.length > 0) paramType = `param: {\n ${getParamsInPath(verbOption.pathRoute).map((name) => {
		const param = verbOption.params.find((p) => p.name === camelPathParamName(name));
		const definition = param?.definition.split(":")[1];
		const required = param?.required ?? false;
		return { definition: `${getKey(sanitizePathParamName(name))}${required ? "" : "?"}:${definition}` };
	}).map((property) => property.definition).join(",\n    ")},\n },`;
	const queryType = verbOption.queryParams ? `query: ${verbOption.queryParams.schema.name},` : "";
	const bodyType = verbOption.body.definition ? `${isFormBody(verbOption.body) ? "form" : "json"}: ${verbOption.body.definition},` : "";
	const hasIn = !!paramType || !!queryType || !!bodyType;
	return `export type ${pascal(verbOption.typeName)}Context<E extends Env = any> = Context<E, '${getRoute(verbOption.pathRoute)}'${hasIn ? `, { in: { ${paramType}${queryType}${bodyType} }, out: { ${paramType}${queryType}${bodyType} } }` : ""}>`;
};
const getHeader = (option, info) => {
	if (!option) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
};
const getSpecInfo = (context) => context.spec.info ?? {
	title: "API",
	version: "1.0.0"
};
const generateContextFile = ({ path, verbs, schemaModule, tsconfig }) => {
	let content = `import type { Context, Env } from 'hono';\n\n`;
	const contexts = verbs.map((verb) => getContext(verb));
	const imps = new Set(verbs.flatMap((verb) => {
		const imports = [];
		if (verb.params.length > 0) imports.push(...verb.params.flatMap((param) => param.imports));
		if (verb.queryParams) imports.push({ name: verb.queryParams.schema.name });
		if (verb.body.definition) imports.push(...verb.body.imports);
		return imports;
	}).map((imp) => imp.name).filter((imp) => contexts.some((context) => context.includes(imp))));
	if (contexts.some((context) => context.includes("NonReadonly<"))) {
		content += getOrvalGeneratedTypes();
		content += "\n";
	}
	if (imps.size > 0) content += `import type {\n${[...imps].toSorted().join(",\n  ")}\n} from '${generateModuleSpecifier(path, schemaModule, tsconfig)}';\n\n`;
	content += contexts.join("\n");
	return content;
};
const generateContextFiles = (verbOptions, output, context, schemaModule) => {
	const header = getHeader(output.override.header, getSpecInfo(context));
	const { extension, dirname, filename } = getFileInfo(output.target, { extension: output.fileExtension });
	if (output.mode === "tags" || output.mode === "tags-split") {
		const groupByTags = getVerbOptionGroupByTag(verbOptions);
		return Object.entries(groupByTags).map(([tag, verbs]) => {
			const path = output.mode === "tags" ? nodePath.join(dirname, `${tag}.context${extension}`) : nodePath.join(dirname, tag, tag + ".context" + extension);
			return {
				content: `${header}${generateContextFile({
					verbs,
					path,
					schemaModule,
					tsconfig: output.tsconfig
				})}`,
				path
			};
		});
	}
	const path = nodePath.join(dirname, `${filename}.context${extension}`);
	return [{
		content: `${header}${generateContextFile({
			verbs: Object.values(verbOptions),
			path,
			schemaModule,
			tsconfig: output.tsconfig
		})}`,
		path
	}];
};
const generateZodFiles = async (verbOptions, output, context) => {
	const { extension, dirname, filename } = getFileInfo(output.target, { extension: output.fileExtension });
	const header = getHeader(output.override.header, getSpecInfo(context));
	if (output.mode === "tags" || output.mode === "tags-split") {
		const groupByTags = getVerbOptionGroupByTag(verbOptions);
		return (await Promise.all(Object.entries(groupByTags).map(async ([tag, verbs]) => {
			const zods = await Promise.all(verbs.map(async (verbOption) => generateZod(verbOption, {
				route: verbOption.route,
				pathRoute: verbOption.pathRoute,
				override: output.override,
				context,
				output: output.target
			}, output.client)));
			if (zods.every((z) => z.implementation === "")) return {
				content: "",
				path: ""
			};
			const mutatorsImports = generateMutatorImports({
				mutators: new Map(zods.flatMap((z) => z.mutators ?? []).map((m) => [m.name, m])).values().toArray(),
				oneMore: output.mode === "tags-split"
			});
			let content = `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n${mutatorsImports}\n`;
			const zodPath = output.mode === "tags" ? nodePath.join(dirname, `${tag}.zod${extension}`) : nodePath.join(dirname, tag, tag + ".zod" + extension);
			content += zods.map((zod) => zod.implementation).join("\n");
			return {
				content,
				path: zodPath
			};
		}))).filter((context) => context.content !== "");
	}
	const zods = await Promise.all(Object.values(verbOptions).map(async (verbOption) => generateZod(verbOption, {
		route: verbOption.route,
		pathRoute: verbOption.pathRoute,
		override: output.override,
		context,
		output: output.target
	}, output.client)));
	const mutatorsImports = generateMutatorImports({ mutators: new Map(zods.flatMap((z) => z.mutators ?? []).map((m) => [m.name, m])).values().toArray() });
	let content = `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n${mutatorsImports}\n`;
	const zodPath = nodePath.join(dirname, `${filename}.zod${extension}`);
	content += zods.map((zod) => zod.implementation).join("\n");
	return [{
		content,
		path: zodPath
	}];
};
const generateZvalidator = (output, context) => {
	const header = getHeader(output.override.header, getSpecInfo(context));
	let validatorPath = output.override.hono.validatorOutputPath;
	if (!output.override.hono.validatorOutputPath) {
		const { extension, dirname, filename } = getFileInfo(output.target, { extension: output.fileExtension });
		validatorPath = nodePath.join(dirname, `${filename}.validator${extension}`);
	}
	return {
		content: `${header}${ZVALIDATOR_SOURCE}`,
		path: validatorPath
	};
};
const generateCompositeRoutes = (verbOptions, output, context) => {
	const targetInfo = getFileInfo(output.target, { extension: output.fileExtension });
	const compositeRouteInfo = getFileInfo(output.override.hono.compositeRoute);
	const header = getHeader(output.override.header, getSpecInfo(context));
	const routes = Object.values(verbOptions).map((verbOption) => {
		return generateHonoRoute(verbOption, verbOption.pathRoute);
	}).join("");
	const importHandlers = Object.values(verbOptions);
	let ImportHandlersImplementation;
	if (output.override.hono.handlers) {
		const handlerFileInfo = getFileInfo(output.override.hono.handlers);
		ImportHandlersImplementation = importHandlers.map((verbOption) => verbOption.operationName).map((operationName) => {
			return `import { ${`${operationName}Handlers`} } from '${generateModuleSpecifier(compositeRouteInfo.path, nodePath.join(handlerFileInfo.dirname, `./${operationName}${targetInfo.extension}`), output.tsconfig)}';`;
		}).join("\n");
	} else {
		const tags = importHandlers.map((verbOption) => getOperationTagKey(verbOption));
		ImportHandlersImplementation = tags.filter((t, i) => tags.indexOf(t) === i).map((tag) => {
			const importHandlerNames = importHandlers.filter((verbOption) => isOperationInTagBucket(verbOption, tag)).map((verbOption) => ` ${verbOption.operationName}Handlers`).join(`, \n`);
			const handlerFilePath = output.mode === "tags-split" ? nodePath.join(targetInfo.dirname, tag, `${tag}.handlers${targetInfo.extension}`) : nodePath.join(targetInfo.dirname, `${tag}.handlers${targetInfo.extension}`);
			return `import {\n${importHandlerNames}\n} from '${generateModuleSpecifier(compositeRouteInfo.path, handlerFilePath, output.tsconfig)}';`;
		}).join("\n");
	}
	return [{
		content: `${header}import { Hono } from 'hono';
${ImportHandlersImplementation}

const app = new Hono()${routes};

export default app;
`,
		path: output.override.hono.compositeRoute || ""
	}];
};
const generateExtraFiles = async (verbOptions, output, context) => {
	const { path, pathWithoutExtension, extension } = getFileInfo(output.target, { extension: output.fileExtension });
	const validator = generateZvalidator(output, context);
	let schemaModule;
	if (output.schemas != void 0) schemaModule = getFileInfo(isObject(output.schemas) ? output.schemas.path : output.schemas).dirname;
	else if (output.mode === "single") schemaModule = path;
	else schemaModule = `${pathWithoutExtension}.schemas${extension}`;
	const contexts = generateContextFiles(verbOptions, output, context, schemaModule);
	const compositeRoutes = output.override.hono.compositeRoute ? generateCompositeRoutes(verbOptions, output, context) : [];
	const [handlers, zods] = await Promise.all([generateHandlerFiles(verbOptions, output, context, validator.path), generateZodFiles(verbOptions, output, context)]);
	return [
		...handlers,
		...contexts,
		...zods,
		...output.override.hono.validator && output.override.hono.validator !== "hono" ? [validator] : [],
		...compositeRoutes
	];
};
const honoClientBuilder = {
	client: generateHono,
	dependencies: getHonoDependencies,
	header: getHonoHeader,
	footer: getHonoFooter,
	extraFiles: generateExtraFiles
};
const builder = () => () => honoClientBuilder;
//#endregion
export { builder, builder as default, generateExtraFiles, generateHandlerFile, generateHono, getHonoDependencies, getHonoFooter, getHonoHeader };

//# sourceMappingURL=index.mjs.map