// Orval's zod client (split mode) emits the SAME exported name twice for any
// operation that has a PATH parameter: a zod const in generated/api.ts and a
// TS type in generated/types/*.ts. Re-exporting both from the package index
// then fails with TS2308. Until upstream fixes this, rename the zod consts to
// a `<Name>Schema` suffix so the TS type from types/ stays the public name.
// This runs as part of `pnpm --filter @workspace/api-spec run codegen`, right
// after orval, so regenerated output is always patched.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const generatedDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..", "..", "api-zod", "src", "generated",
);
const apiFile = path.join(generatedDir, "api.ts");
const typesDir = path.join(generatedDir, "types");

// Collect every exported type name from the split types directory.
const typeNames = new Set();
for (const file of readdirSync(typesDir)) {
  if (!file.endsWith(".ts")) continue;
  const source = readFileSync(path.join(typesDir, file), "utf8");
  for (const match of source.matchAll(/^export (?:type|interface) (\w+)/gm)) {
    typeNames.add(match[1]);
  }
}

let source = readFileSync(apiFile, "utf8");
let renamed = 0;
// A zod const collides when its name is also exported as a type. Only exact
// whole-token matches are renamed, so `GetOperationsListQueryParams` never
// touches `GetOperationsListParams`.
for (const name of [...typeNames].sort()) {
  const declaration = new RegExp(`export const ${name} = `, "g");
  if (!declaration.test(source)) continue;
  source = source.replaceAll(new RegExp(`\\b${name}\\b`, "g"), `${name}Schema`);
  renamed += 1;
  console.log(`[fix-zod-path-param-collision] renamed const ${name} -> ${name}Schema`);
}

writeFileSync(apiFile, source);
console.log(`[fix-zod-path-param-collision] ${renamed} collision(s) fixed`);
