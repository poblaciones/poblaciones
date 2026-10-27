// Hooks de módulo para cargar los fuentes reales de backoffice y common bajo
// Node sin webpack.
//
// resolve(): '@/...' y los imports relativos sin extensión (estilo webpack) se
//            resuelven probando exacto, '.js' y '.vue'; los paquetes de
//            UI/red se reemplazan por sus dobles.
//            Los .vue se sirven con su bloque <script> únicamente y las
//            imágenes importadas como módulos devuelven su nombre de archivo.
// load():    los fuentes mezclan CommonJS (module.exports) y ESM (export
//            default); se indica a Node el formato de cada uno según su
//            contenido, ya que el package.json del proyecto no declara "type".
//            Los ESM que usan require() inline reciben un require propio.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { genericAliasPrefixes, genericStub, genericStubPrefixes, isStylesheet, sourceRoot, stubbedAliases, stubbedFiles, stubbedPackages } from './_paths.mjs';

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

function isImage(filePath) {
	return ['.png', '.gif', '.jpg', '.jpeg', '.svg'].includes(path.extname(filePath).toLowerCase());
}

function toResolved(target) {
	if (stubbedFiles[target]) {
		return { url: pathToFileURL(stubbedFiles[target]).href, shortCircuit: true };
	}
	return { url: pathToFileURL(target).href, shortCircuit: true };
}

export function resolve(specifier, context, nextResolve) {
	if (stubbedPackages[specifier]) {
		return toResolved(stubbedPackages[specifier]);
	}
	for (const prefix of genericStubPrefixes) {
		if (specifier.startsWith(prefix)) {
			return toResolved(genericStub);
		}
	}
	if (isStylesheet(specifier)) {
		return toResolved(genericStub);
	}
	if (stubbedAliases[specifier]) {
		return toResolved(stubbedAliases[specifier]);
	}
	for (const prefix of genericAliasPrefixes) {
		if (specifier.startsWith(prefix)) {
			return toResolved(genericStub);
		}
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

function extractScript(vueSource) {
	const match = /<script[^>]*>([\s\S]*?)<\/script>/.exec(vueSource);
	if (match === null) {
		return 'export default {};';
	}
	return match[1];
}

export function load(url, context, nextLoad) {
	if (!url.startsWith('file://')) {
		return nextLoad(url, context);
	}
	const filePath = fileURLToPath(url);
	if (isImage(filePath)) {
		return { format: 'module', source: 'export default ' + JSON.stringify(path.basename(filePath)) + ';', shortCircuit: true };
	}
	if (isProjectSource(filePath) && filePath.endsWith('.vue')) {
		const script = extractScript(fs.readFileSync(filePath, 'utf8'));
		let header = '';
		if (script.includes('require(')) {
			header = REQUIRE_SHIM;
		}
		return { format: 'module', source: header + script, shortCircuit: true };
	}
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
