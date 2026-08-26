import { Validator } from '../lib/Validator/Validator.js';
import { makeFilesystem } from './make-filesystem.js';
const withStrictSpecification = (specification, version) => {
    if (!specification || typeof specification !== 'object') {
        return undefined;
    }
    if (version === '2.0' && specification.swagger === '2.0') {
        return specification;
    }
    if ((version === '3.0' || version === '3.1' || version === '3.2') && typeof specification.openapi === 'string') {
        return specification;
    }
    return undefined;
};
/**
 * Validates an OpenAPI document
 */
export function validate(value, options) {
    try {
        const filesystem = makeFilesystem(value);
        const validator = new Validator();
        const result = validator.validate(filesystem, options);
        /**
         * Currently contains no asynchronous logic, but returns a Promise
         * to preserve API compatibility and allow async logic in the future.
         */
        if (result.valid) {
            const specification = withStrictSpecification(validator.specification, validator.version);
            if (!specification) {
                return Promise.resolve({
                    valid: false,
                    errors: [
                        {
                            message: `Validated OpenAPI ${validator.version} document is missing required top-level version field.`,
                        },
                    ],
                    schema: result.schema,
                    specification: validator.specification,
                    version: validator.version,
                });
            }
            return Promise.resolve({
                ...result,
                specification,
                version: validator.version,
            });
        }
        return Promise.resolve({
            valid: false,
            errors: result.errors,
            schema: result.schema,
            specification: validator.specification,
            version: validator.version,
        });
    }
    catch (err) {
        return Promise.reject(err);
    }
}
