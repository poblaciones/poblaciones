// Hooks de módulo para cargar los fuentes reales de backoffice y common bajo
// Node sin webpack.
//
// resolve(): '@/...' y los imports relativos sin extensión (estilo webpack) se
//            resuelven probando exacto, '.js' y '.vue'; los paquetes de
//            UI/red se reemplazan por sus dobles.
// load():    los fuentes mezclan CommonJS (module.exports) y ESM (export
//            default); se indica a Node el formato de cada uno según su
//            contenido, ya que el package.json del proyecto no declara "type".
//            Los ESM que usan require() inline reciben un require propio.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sourceRoot, stubbedPackages, testsDir } from './_paths.mjs';

const REQUIRE_SHIM = "import { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);\n";

function resolveWithExtension(basePath) {
	for (const candidate of [basePath, basePath + '.js', basePath + '.vue']) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return null;
}

function isInside(directory, filePath) {
	const relative = path.relative(directory, filePath);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isProjectSource(filePath) {
	if (!isInside(sourceRoot, filePath)) {
		return false;
	}
	return !filePath.includes(path.sep + 'tests' + path.sep) && !filePath.includes('node_modules');
}

function toResolved(target) {
	return { url: pathToFileURL(target).href, shortCircuit: true };
}

export function resolve(specifier, context, nextResolve) {
	if (stubbedPackages[specifier]) {
		return toResolved(stubbedPackages[specifier]);
	}
	if (specifier.startsWith('@/')) {
		const target = resolveWithExtension(path.join(sourceRoot, specifier.substring(2)));
		if (target === null) {
			throw new Error('Alias no resuelto: ' + specifier);
		}
		return toResolved(target);
	}
	if (specifier.startsWith('.') && context.parentURL && context.parentURL.startsWith('file://')) {
		const parentDirectory = path.dirname(fileURLToPath(context.parentURL));
		const target = resolveWithExtension(path.resolve(parentDirectory, specifier));
		if (target !== null) {
			return toResolved(target);
		}
	}
	return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
	if (!url.startsWith('file://')) {
		return nextLoad(url, context);
	}
	const filePath = fileURLToPath(url);
	if (isProjectSource(filePath) && filePath.endsWith('.js')) {
		const source = fs.readFileSync(filePath, 'utf8');
		if (source.includes('module.exports')) {
			return nextLoad(url, { ...context, format: 'commonjs' });
		}
		if (source.includes('require(')) {
			return { format: 'module', source: REQUIRE_SHIM + source, shortCircuit: true };
		}
		return { format: 'module', source: source, shortCircuit: true };
	}
	return nextLoad(url, context);
}
