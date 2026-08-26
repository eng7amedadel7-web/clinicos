import { ClientBuilder, ClientDependenciesBuilder, ClientFooterBuilder, ClientGeneratorsBuilder, ClientHeaderBuilder, ClientTitleBuilder, GeneratorOptions, GeneratorVerbOptions } from "@orval/core";

//#region src/index.d.ts
declare const getAxiosDependencies: ClientDependenciesBuilder;
declare const getAxiosFactoryDependencies: ClientDependenciesBuilder;
declare const generateAxiosTitle: ClientTitleBuilder;
declare const generateAxiosHeader: ClientHeaderBuilder;
declare const generateAxiosFooter: ClientFooterBuilder;
declare const generateAxios: (verbOptions: GeneratorVerbOptions, options: GeneratorOptions, isFactoryMode?: boolean) => {
  implementation: string;
  imports: import("@orval/core").GeneratorImport[];
  returnType: (title?: string) => string;
};
declare const generateAxiosFactory: ClientBuilder;
declare const generateAxiosFunctions: ClientBuilder;
interface AxiosBuilderOptions {
  type?: 'axios' | 'axios-functions';
}
declare const builder: ({
  type
}?: AxiosBuilderOptions) => () => ClientGeneratorsBuilder;
//#endregion
export { AxiosBuilderOptions, builder, builder as default, generateAxios, generateAxiosFactory, generateAxiosFooter, generateAxiosFunctions, generateAxiosHeader, generateAxiosTitle, getAxiosDependencies, getAxiosFactoryDependencies };
//# sourceMappingURL=index.d.mts.map