import { type ValidateFunction } from 'ajv';
import { type OpenApiVersion } from '../../configuration/index.js';
import type { Filesystem, ThrowOnErrorOption, UnknownObject, ValidationOutcome } from '../../types/index.js';
export declare class Validator {
    version: OpenApiVersion;
    static supportedVersions: ("2.0" | "3.0" | "3.1" | "3.2")[];
    protected ajvValidators: Record<string, ValidateFunction>;
    protected errors: string;
    protected specificationVersion: string;
    protected specificationType: string;
    specification: UnknownObject;
    private isMutableRecord;
    /**
     * Checks whether a specification is valid and all references can be resolved.
     */
    validate(filesystem: Filesystem, options?: ThrowOnErrorOption): ValidationOutcome;
    /**
     * Ajv JSON schema validator
     */
    getAjvValidator(version: OpenApiVersion): ValidateFunction;
}
//# sourceMappingURL=Validator.d.ts.map