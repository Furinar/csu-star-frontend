/**
 * Node custom loader: resolve "@/..." and extensionless relative .ts imports.
 * Used with --experimental-strip-types so shipped modules can be imported in tests.
 */
import { existsSync } from "node:fs";
import { dirname, join, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function tryCandidates(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveSpecifier(specifier, parentURL) {
  if (specifier.startsWith("@/")) {
    return tryCandidates(join(ROOT, specifier.slice(2)));
  }

  // Extensionless relative / absolute paths (TypeScript style)
  if (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    isAbsolute(specifier)
  ) {
    if (/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier)) {
      return null; // let default resolve handle fully-qualified
    }
    let base;
    if (isAbsolute(specifier)) {
      base = specifier;
    } else if (parentURL) {
      base = join(dirname(fileURLToPath(parentURL)), specifier);
    } else {
      return null;
    }
    return tryCandidates(base);
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const absolute = resolveSpecifier(specifier, context.parentURL);
  if (absolute) {
    return {
      shortCircuit: true,
      url: pathToFileURL(absolute).href,
    };
  }
  return nextResolve(specifier, context);
}
