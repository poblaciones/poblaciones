// Hooks de módulo para cargar los fuentes reales de common bajo Node sin webpack.
//
// resolve(): '@/...' -> archivo real bajo src/ (probando exacto, '.js', '.vue').
// load():    los módulos de common mezclan CommonJS (module.exports) y ESM
//            (export default): se indica a Node el formato de cada uno según su
//            contenido, ya que el package.json del proyecto no declara "type".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const commonRoot = path.resolve(testsDir, '..');
const sourceRoot = path.resolve(commonRoot, '..');

function resolveWithExtension(basePath) {
	for (const candidate of [basePath, basePath + '.js', basePath + '.vue']) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return null;
}

export function resolve(specifier, context, nextResolve) {
	if (specifier.startsWith('@/')) {
		const target = resolveWithExtension(path.join(sourceRoot, specifier.substring(2)));
		if (target === null) {
			throw new Error('Alias no resuelto: ' + specifier);
		}
		return { url: pathToFileURL(target).href, shortCircuit: true };
	}
	return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
	if (!url.startsWith('file://')) {
		return nextLoad(url, context);
	}
	const filePath = fileURLToPath(url);
	const isCommonSource = filePath.startsWith(commonRoot) && !filePath.startsWith(testsDir);
	if (isCommonSource && filePath.endsWith('.js')) {
		const source = fs.readFileSync(filePath, 'utf8');
		if (source.includes('module.exports')) {
			return nextLoad(url, { ...context, format: 'commonjs' });
		}
		return { format: 'module', source: source, shortCircuit: true };
	}
	return nextLoad(url, context);
}
