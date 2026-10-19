// Hooks de módulo para cargar los fuentes reales bajo Node sin webpack.
//
// resolve():
//   - '@/...' -> archivo real bajo src/ (se prueba exacto, '.js', '.vue').
//   - imports relativos sin extensión (estilo webpack) -> ídem.
//   - paquetes de terceros con comportamiento de navegador (vue, vuex,
//     vue-router) y la fachada de validadores (vuelidate) -> _stubs/.
//   - .css e imágenes -> módulo vacío (los resuelve webpack).
//
// load():
//   - .vue -> se sirve solo el contenido de <script>...</script> como ESM.
//   - .js bajo src/ -> el package.json del proyecto no declara "type", así
//     que se indica el formato según el contenido: CommonJS si usa
//     module.exports, ESM en caso contrario.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(testsDir, '..');
const sourceRoot = path.resolve(moduleRoot, '..');
const stubsDir = path.join(testsDir, '_stubs');

const stubbedPackages = {
	'vue': 'vue.mjs',
	'vuex': 'vuex.mjs',
	'vue-router': 'vue-router.mjs',
	'vuelidate/lib/validators': 'vuelidate-validators.mjs',
};

function stubUrl(fileName) {
	return pathToFileURL(path.join(stubsDir, fileName)).href;
}

function resolveWithExtension(basePath) {
	for (const candidate of [basePath, basePath + '.js', basePath + '.vue']) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return null;
}

export function resolve(specifier, context, nextResolve) {
	if (/\.(css|png|svg|gif)$/.test(specifier)) {
		return { url: stubUrl('empty.mjs'), shortCircuit: true };
	}
	if (stubbedPackages[specifier]) {
		return { url: stubUrl(stubbedPackages[specifier]), shortCircuit: true };
	}
	if (specifier.startsWith('@/')) {
		const target = resolveWithExtension(path.join(sourceRoot, specifier.substring(2)));
		if (target === null) {
			throw new Error('Alias no resuelto: ' + specifier);
		}
		return { url: pathToFileURL(target).href, shortCircuit: true };
	}
	if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL
		&& context.parentURL.startsWith('file://') && path.extname(specifier) === '') {
		const parentPath = fileURLToPath(context.parentURL);
		const target = resolveWithExtension(path.resolve(path.dirname(parentPath), specifier));
		if (target !== null) {
			return { url: pathToFileURL(target).href, shortCircuit: true };
		}
	}
	return nextResolve(specifier, context);
}

function extractVueScript(source) {
	const match = source.match(/<script>([\s\S]*?)<\/script>/);
	if (!match) {
		throw new Error('El .vue no contiene bloque <script>');
	}
	return match[1];
}

export function load(url, context, nextLoad) {
	if (!url.startsWith('file://')) {
		return nextLoad(url, context);
	}
	const filePath = fileURLToPath(url);
	const isProjectSource = filePath.startsWith(sourceRoot + path.sep) && !filePath.startsWith(testsDir)
		&& !filePath.includes(path.sep + 'tests' + path.sep) && !filePath.includes('node_modules');
	if (!isProjectSource) {
		return nextLoad(url, context);
	}
	if (filePath.endsWith('.vue')) {
		return { format: 'module', source: extractVueScript(fs.readFileSync(filePath, 'utf8')), shortCircuit: true };
	}
	if (filePath.endsWith('.js')) {
		const source = fs.readFileSync(filePath, 'utf8');
		if (source.includes('module.exports')) {
			return nextLoad(url, { ...context, format: 'commonjs' });
		}
		return { format: 'module', source: source, shortCircuit: true };
	}
	return nextLoad(url, context);
}
