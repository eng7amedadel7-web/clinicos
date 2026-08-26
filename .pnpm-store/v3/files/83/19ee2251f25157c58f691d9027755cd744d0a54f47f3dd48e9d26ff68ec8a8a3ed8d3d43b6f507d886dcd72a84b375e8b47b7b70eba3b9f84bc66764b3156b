import path from "node:path";
import { GetterPropType, camel, generateMutatorImports, getFileInfo, getFullRoute, getKey, getParamsInPath, getPropertyAccessor, isObject, isString, jsDoc, jsStringEscape, pascal, upath } from "@orval/core";
import { generateClient, generateFetchHeader } from "@orval/fetch";
import { generateZod, getZodImportSource } from "@orval/zod";
//#region src/index.ts
const getZodSchemaImportStatement = (variant) => variant === "mini" ? `import * as zod from '${getZodImportSource(variant)}';` : `import { z as zod } from '${getZodImportSource(variant)}';`;
const getHeader = (option, info) => {
	if (!option) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
};
const getAnnotations = (verb) => {
	switch (verb) {
		case "get":
		case "head": return "{ readOnlyHint: true, destructiveHint: false }";
		case "post": return "{ destructiveHint: false }";
		case "put": return "{ destructiveHint: false, idempotentHint: true }";
		case "patch": return "{ destructiveHint: false }";
		case "delete": return "{ idempotentHint: true }";
		default: return "";
	}
};
const getSpecInfo = (context) => context.spec.info ?? {
	title: "API",
	version: "1.0.0"
};
const getMcpHeader = ({ verbOptions, output }) => {
	const targetInfo = getFileInfo(output.target);
	const schemasPath = isObject(output.schemas) ? output.schemas.path : isString(output.schemas) ? output.schemas : void 0;
	const schemaInfo = schemasPath ? getFileInfo(schemasPath) : void 0;
	const isZodSchemaOutput = isObject(output.schemas) && output.schemas.type === "zod";
	const basePath = schemaInfo?.dirname;
	const relativeSchemaImportPath = basePath ? isZodSchemaOutput && output.indexFiles ? upath.getRelativeImportPath(targetInfo.path, basePath, true) : upath.getRelativeImportPath(targetInfo.path, basePath) : "./" + targetInfo.filename + ".schemas";
	return [`import {\n  ${new Set(Object.values(verbOptions).flatMap((verbOption) => {
		const imports = [];
		const pascalOperationName = pascal(verbOption.typeName);
		if (verbOption.queryParams) imports.push(`${pascalOperationName}Params`);
		if (verbOption.body.imports[0]?.name) imports.push(verbOption.body.imports[0]?.name);
		return imports;
	})).values().toArray().join(",\n  ")}\n} from '${relativeSchemaImportPath}';
`, `import {\n  ${new Set(Object.values(verbOptions).flatMap((verbOption) => verbOption.operationName)).values().toArray().join(",\n  ")}\n} from './http-client';
  `].join("\n") + "\n";
};
const generateMcp = (verbOptions) => {
	const handlerArgsTypes = [];
	const originalParamNames = getParamsInPath(verbOptions.pathRoute);
	const pathParamsType = verbOptions.params.map((param, index) => {
		const paramName = originalParamNames[index];
		const paramType = param.implementation.split(": ")[1];
		return `    ${getKey(paramName)}: ${paramType}`;
	}).join(",\n");
	if (pathParamsType) handlerArgsTypes.push(`  pathParams: {\n${pathParamsType}\n  };`);
	if (verbOptions.queryParams) handlerArgsTypes.push(`  queryParams: ${verbOptions.queryParams.schema.name};`);
	if (verbOptions.body.definition) handlerArgsTypes.push(`  bodyParams${verbOptions.body.isOptional ? "?" : ""}: ${verbOptions.body.definition};`);
	const handlerArgsName = `${verbOptions.operationName}Args`;
	const handlerArgsImplementation = handlerArgsTypes.length > 0 ? `
export type ${handlerArgsName} = {
${handlerArgsTypes.join("\n")}
}
` : "";
	const fetchParams = [];
	if (verbOptions.params.length > 0) {
		const pathParamsArgs = originalParamNames.map((paramName) => `args.pathParams${getPropertyAccessor(paramName)}`).join(", ");
		fetchParams.push(pathParamsArgs);
	}
	for (const prop of verbOptions.props) if (prop.type === GetterPropType.BODY) fetchParams.push("args.bodyParams");
	else if (prop.type === GetterPropType.QUERY_PARAM) fetchParams.push("args.queryParams");
	const handlersImplementation = [handlerArgsImplementation, `
export const ${`${verbOptions.operationName}Handler`} = async (${handlerArgsTypes.length > 0 ? `args: ${handlerArgsName}, ` : ""}options?: RequestInit) => {
  const res = await ${verbOptions.operationName}(${fetchParams.length > 0 ? `${fetchParams.join(", ")}, ` : ""}options);

  if (res.status >= 400) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(res.data ?? null),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(res.data ?? null),
      },
    ],
    structuredContent: res.data,
  };
};`].join("");
	return {
		implementation: handlersImplementation ? `${handlersImplementation}\n` : "",
		imports: []
	};
};
const generateServer = (verbOptions, output, context) => {
	const info = getSpecInfo(context);
	const { extension, dirname } = getFileInfo(output.target);
	const serverPath = path.join(dirname, `server${extension}`);
	const header = getHeader(output.override.header, info);
	const mcpServerOptions = output.override.mcp.server;
	const hasResponseSchema = output.override.zod.generate.response && !output.override.zod.generateEachHttpStatus;
	const toolImplementations = Object.values(verbOptions).map((verbOption) => {
		const pascalOperationName = pascal(verbOption.typeName);
		const inputSchemaTypes = [];
		if (verbOption.params.length > 0) inputSchemaTypes.push(`pathParams: ${pascalOperationName}Params`);
		if (verbOption.queryParams) inputSchemaTypes.push(`queryParams: ${pascalOperationName}QueryParams`);
		if (verbOption.body.definition) inputSchemaTypes.push(`bodyParams: ${pascalOperationName}Body${verbOption.body.isOptional ? ".optional()" : ""}`);
		const inputSchemaImplementation = inputSchemaTypes.length > 0 ? `\n    inputSchema: {\n      ${inputSchemaTypes.join(",\n      ")}\n    },` : "";
		const outputSchemaImplementation = hasResponseSchema ? `\n    outputSchema: ${pascalOperationName}Response,` : "";
		const annotationsValue = getAnnotations(verbOption.verb);
		const annotationsImplementation = annotationsValue ? `\n    annotations: ${annotationsValue},` : "";
		const titleImplementation = verbOption.summary ? `\n    title: '${jsStringEscape(verbOption.summary)}',` : "";
		const operationDescription = verbOption.originalOperation.description;
		const descriptionValue = (operationDescription && operationDescription.length > 0 ? operationDescription : verbOption.summary) ?? "";
		const descriptionImplementation = descriptionValue ? `\n    description: '${jsStringEscape(descriptionValue)}',` : "";
		const handlerCallImplementation = inputSchemaTypes.length > 0 ? `(args) => ${verbOption.operationName}Handler(args, options)` : `() => ${verbOption.operationName}Handler(options)`;
		return `
tools.${verbOption.operationName} = server.registerTool(
  '${jsStringEscape(verbOption.operationName)}',
  {${titleImplementation}${descriptionImplementation}${inputSchemaImplementation}${outputSchemaImplementation}${annotationsImplementation}
  },
  ${handlerCallImplementation}
);`;
	}).join("\n");
	const importToolSchemasImplementation = `import {\n${Object.values(verbOptions).flatMap((verbOption) => {
		const imports = [];
		const pascalOperationName = pascal(verbOption.typeName);
		if (verbOption.headers) imports.push(`  ${pascalOperationName}Header`);
		if (verbOption.params.length > 0) imports.push(`  ${pascalOperationName}Params`);
		if (verbOption.queryParams) imports.push(`  ${pascalOperationName}QueryParams`);
		if (verbOption.body.definition) imports.push(`  ${pascalOperationName}Body`);
		if (hasResponseSchema) imports.push(`  ${pascalOperationName}Response`);
		return imports;
	}).join(",\n")}\n} from './tool-schemas.zod';`;
	const importHandlersImplementation = `import {\n${Object.values(verbOptions).filter((verbOption) => toolImplementations.includes(`${verbOption.operationName}Handler`)).map((verbOption) => `  ${verbOption.operationName}Handler`).join(`,\n`)}\n} from './handlers';`;
	const createMcpServerImplementation = `
const createMcpServer = (options?: RequestInit): { server: McpServer; tools: Record<string, RegisteredTool> } => {
  const server = new McpServer({
    name: '${camel(info.title)}Server',
    version: '1.0.0',
  });
  const tools: Record<string, RegisteredTool> = {};
${toolImplementations}

  return { server, tools };
};
`;
	const serverFunctionName = mcpServerOptions?.name ?? "customServer";
	const relativeServerPath = mcpServerOptions ? upath.getRelativeImportPath(serverPath, mcpServerOptions.path) : "";
	const importSpecifier = mcpServerOptions?.default ? serverFunctionName : `{ ${serverFunctionName} }`;
	const importDependenciesImplementation = `import {
  McpServer,
  type RegisteredTool,
} from '@modelcontextprotocol/sdk/server/mcp.js';

${mcpServerOptions ? `import ${importSpecifier} from '${relativeServerPath}';` : `import {
  StdioServerTransport
} from '@modelcontextprotocol/sdk/server/stdio.js';`}
`;
	const customServerConnectImplementation = `\n${serverFunctionName}(createMcpServer);\n`;
	return [{
		content: [
			header,
			importDependenciesImplementation,
			importHandlersImplementation,
			importToolSchemasImplementation,
			createMcpServerImplementation,
			mcpServerOptions ? customServerConnectImplementation : `
const { server } = createMcpServer();
const transport = new StdioServerTransport();

server.connect(transport).then(() => {
  console.error('MCP server running on stdio');
}).catch(console.error);
`
		].join("\n"),
		path: serverPath
	}];
};
const generateZodFiles = async (verbOptions, output, context) => {
	const { extension, dirname } = getFileInfo(output.target);
	const header = getHeader(output.override.header, getSpecInfo(context));
	const zods = await Promise.all(Object.values(verbOptions).map(async (verbOption) => generateZod(verbOption, {
		route: verbOption.route,
		pathRoute: verbOption.pathRoute,
		override: output.override,
		context,
		output: output.target
	}, output.client)));
	const mutatorsImports = generateMutatorImports({ mutators: new Map(zods.flatMap((z) => z.mutators ?? []).map((m) => [m.name, m])).values().toArray() });
	let content = `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n${mutatorsImports}\n`;
	const zodPath = path.join(dirname, `tool-schemas.zod${extension}`);
	content += zods.map((zod) => zod.implementation).join("\n");
	return [{
		content,
		path: zodPath
	}];
};
const generateHttpClientFiles = async (verbOptions, output, context) => {
	const { path: targetPath, extension, dirname, filename } = getFileInfo(output.target);
	const header = getHeader(output.override.header, getSpecInfo(context));
	const clients = await Promise.all(Object.values(verbOptions).map(async (verbOption) => {
		return generateClient(verbOption, {
			route: getFullRoute(verbOption.route, context.spec.servers, output.baseUrl),
			pathRoute: verbOption.pathRoute,
			override: output.override,
			context,
			output: output.target
		}, output.client, output);
	}));
	const clientImplementation = clients.map((client) => client.implementation).join("\n");
	const isZodSchemaOutput = isObject(output.schemas) && output.schemas.type === "zod";
	const schemasPath = isObject(output.schemas) ? output.schemas.path : isString(output.schemas) ? output.schemas : void 0;
	const basePath = schemasPath ? getFileInfo(schemasPath).dirname : void 0;
	const relativeSchemasPath = basePath ? isZodSchemaOutput && output.indexFiles ? upath.getRelativeImportPath(targetPath, basePath, true) : upath.getRelativeImportPath(targetPath, basePath) : "./" + filename + ".schemas";
	const importNames = clients.flatMap((client) => client.imports).map((imp) => imp.name);
	const importImplementation = `import { ${new Set(importNames).values().toArray().join(",\n")} } from '${relativeSchemasPath}';`;
	const rawFetchHeader = generateFetchHeader({
		title: "",
		isRequestOptions: false,
		isMutator: false,
		noFunction: false,
		isGlobalMutator: false,
		provideIn: false,
		hasAwaitedType: false,
		output,
		verbOptions,
		clientImplementation
	});
	return [{
		content: [
			header,
			importImplementation,
			typeof rawFetchHeader === "string" ? rawFetchHeader : [rawFetchHeader.implementation, ...(rawFetchHeader.sharedTypes ?? []).map((t) => `${t.exported ? "export " : ""}${t.code}`)].join("\n"),
			clientImplementation
		].join("\n"),
		path: path.join(dirname, `http-client${extension}`)
	}];
};
const generateExtraFiles = async (verbOptions, output, context) => {
	const server = generateServer(verbOptions, output, context);
	const [zods, httpClients] = await Promise.all([generateZodFiles(verbOptions, output, context), generateHttpClientFiles(verbOptions, output, context)]);
	return [
		...server,
		...zods,
		...httpClients
	];
};
const mcpClientBuilder = {
	client: generateMcp,
	header: getMcpHeader,
	extraFiles: generateExtraFiles
};
const builder = () => () => mcpClientBuilder;
//#endregion
export { builder, builder as default, generateExtraFiles, generateMcp, generateServer, getMcpHeader };

//# sourceMappingURL=index.mjs.map