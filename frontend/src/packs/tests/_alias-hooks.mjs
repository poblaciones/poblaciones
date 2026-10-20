// Hooks de módulo para cargar los fuentes reales bajo Node sin webpack.
//
// resolve():
//   - '@/...' -> archivo real bajo src/ (se prueba exacto, '.js', '.vue').
//   - imports relativos sin extensión (estilo webpack) -> ídem.
//   - paquetes de terceros con comportamiento de navegador (vue, vuex,
//     vue-router, axios, vue2-dropzone, vue-clickaway) y la fachada de validadores
//     (vuelidate) -> _stubs/.
//   - .css e imágenes -> módulo vacío (los resuelve webpack).
//   - archivos del proyecto declarados en `unavailableSources` (todavía no
//     provistos) -> marcador que falla con un mensaje explícito si algún
//     código intenta usarlo (ver _stubs/unavailable.mjs). Se importan para
//     registrarse, pero ninguna prueba ejecuta su contenido.
//
// load():
//   - .vue -> se sirve solo el contenido de <script>...</script> como ESM.
//   - .js bajo src/ -> el package.json del proyecto no declara "type", así
//     que se indica el formato según el contenido: CommonJS si usa
//     module.exports, ESM en caso contrario.
//   - Los fuentes ESM que llaman a require() (webpack lo admite en módulos
//     ESM) reciben un require real; los alias '@/' y los assets los
//     resuelve _register-alias.mjs.
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
	'axios': 'axios.cjs',
	'vue2-dropzone': 'component.mjs',
	'vue-clickaway': 'vue-clickaway.mjs',
};

// Rutas bajo src/ (sin extensión) de archivos del proyecto aún no provistos.
// Al incorporar el archivo real, se elimina su entrada y se ejecuta el real.
const unavailableSources = new Set([
	'map/js/helper',
	'backoffice/views/Account/HomeMenu',
	'backoffice/views/Account/AccountPopup',
	'backoffice/views/Account/ReviewPopup',
]);

function unavailableUrl(absolutePath) {
	const relative = path.relative(sourceRoot, absolutePath).split(path.sep).join('/').replace(/\.(js|vue)$/, '');
	if (!unavailableSources.has(relative)) {
		return null;
	}
	return stubUrl('unavailable.mjs') + '?file=' + encodeURIComponent(relative);
}

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
			const placeholder = unavailableUrl(path.join(sourceRoot, specifier.substring(2)));
			if (placeholder !== null) {
				return { url: placeholder, shortCircuit: true };
			}
			throw new Error('Alias no resuelto: ' + specifier);
		}
		return { url: pathToFileURL(target).href, shortCircuit: true };
	}
	if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL
		&& context.parentURL.startsWith('file://')) {
		const parentPath = fileURLToPath(context.parentURL);
		const absolute = path.resolve(path.dirname(parentPath), specifier);
		const hasExtension = path.extname(specifier) === '.js' || path.extname(specifier) === '.vue';
		const target = resolveWithExtension(absolute);
		if (target !== null && (path.extname(specifier) === '' || hasExtension)) {
			return { url: pathToFileURL(target).href, shortCircuit: true };
		}
		if (target === null) {
			const placeholder = unavailableUrl(absolute);
			if (placeholder !== null) {
				return { url: placeholder, shortCircuit: true };
			}
		}
	}
	return nextResolve(specifier, context);
}

const REQUIRE_SHIM = "import { createRequire as __createRequire } from 'node:module';\n"
	+ 'const require = __createRequire(import.meta.url);\n';

function withRequire(source) {
	return /\brequire\(/.test(source) ? REQUIRE_SHIM + source : source;
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
		return { format: 'module', source: withRequire(extractVueScript(fs.readFileSync(filePath, 'utf8'))), shortCircuit: true };
	}
	if (filePath.endsWith('.js')) {
		const source = fs.readFileSync(filePath, 'utf8');
		if (source.includes('module.exports')) {
			return nextLoad(url, { ...context, format: 'commonjs' });
		}
		return { format: 'module', source: withRequire(source), shortCircuit: true };
	}
	return nextLoad(url, context);
}
