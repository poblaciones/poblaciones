// Hooks de módulo para correr los fuentes del visor bajo Node sin webpack.
//
// resolve():
//   - '@/map/...'  -> archivo real del módulo (raíz = carpeta padre de tests/).
//   - '@/common/...' y paquetes npm de UI -> stubs en tests/_stubs/.
//   - imports relativos sin extensión (estilo webpack) -> se prueba el path
//     exacto, luego +'.js', luego +'.vue'.
//
// load():
//   - .vue  -> se sirve solo el contenido de <script>...</script> como ESM.
//   - .js del módulo -> se fuerza format 'module'; los require() inline se
//     reescriben a globalThis.__stubRequire. Si el archivo es CommonJS
//     (module.exports, caso helper.js) se lo envuelve para exportar default.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(testsDir, '..');
const stubsDir = path.join(testsDir, '_stubs');

const packageStubs = {
	'vue': 'vue.mjs',
	'axios': 'axios.mjs',
	'svg.js': 'svgjs.mjs',
	'html2canvas': 'html2canvas.mjs',
	'canvg': 'canvg.mjs',
	'vue-clickaway': 'vue-clickaway.mjs',
	'leaflet': 'leaflet.mjs',
	'@tweenjs/tween.js': 'tween.mjs',
	'js-cookie': 'js-cookie.mjs',
};

const commonStubs = {
	'@/common/framework/str': 'str.mjs',
	'@/common/framework/arr': 'arr.mjs',
	'@/common/framework/err': 'err.mjs',
	'@/common/framework/color': 'color.mjs',
	'@/common/framework/promises': 'promises.mjs',
	'@/common/framework/session': 'session.mjs',
	'@/common/js/iconManager': 'iconManager.mjs',
	'@/common/js/axiosProgressBar.js': 'axiosProgressBar.mjs',
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
	// Los .svg de @/common no existen como módulo fuera de webpack.
	if (specifier.startsWith('@/common/') && specifier.endsWith('.svg')) {
		return { url: stubUrl('mdi-icon.mjs'), shortCircuit: true };
	}
	if (specifier.startsWith('vue-material-design-icons/')) {
		return { url: stubUrl('mdi-icon.mjs'), shortCircuit: true };
	}
	if (packageStubs[specifier]) {
		return { url: stubUrl(packageStubs[specifier]), shortCircuit: true };
	}
	if (commonStubs[specifier]) {
		return { url: stubUrl(commonStubs[specifier]), shortCircuit: true };
	}
	if (specifier.startsWith('@/map/')) {
		const target = resolveWithExtension(path.join(moduleRoot, specifier.substring('@/map/'.length)));
		if (target === null) {
			throw new Error('Alias no resuelto: ' + specifier);
		}
		return { url: pathToFileURL(target).href, shortCircuit: true };
	}
	if (specifier.startsWith('./') || specifier.startsWith('../')) {
		const parentPath = fileURLToPath(context.parentURL);
		const base = path.resolve(path.dirname(parentPath), specifier);
		if (path.extname(base) === '') {
			const target = resolveWithExtension(base);
			if (target !== null) {
				return { url: pathToFileURL(target).href, shortCircuit: true };
			}
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

function rewriteInlineRequires(source) {
	return source.replace(/\brequire\(/g, 'globalThis.__stubRequire(');
}

function wrapCommonJs(source) {
	return 'const module = { exports: {} };\nconst exports = module.exports;\n'
		+ rewriteInlineRequires(source)
		+ '\nexport default module.exports;\n';
}

export function load(url, context, nextLoad) {
	if (!url.startsWith('file://')) {
		return nextLoad(url, context);
	}
	const filePath = fileURLToPath(url);
	if (!filePath.startsWith(moduleRoot) || filePath.startsWith(testsDir)) {
		return nextLoad(url, context);
	}
	if (filePath.endsWith('.svg')) {
		// webpack los resuelve como componentes Vue (vue-svg-loader). Acá
		// alcanza con un componente vacío: no se prueba el render.
		return { format: 'module', source: 'export default { name: "svg-stub", render: () => null };', shortCircuit: true };
	}
	if (filePath.endsWith('.vue')) {
		const script = extractVueScript(fs.readFileSync(filePath, 'utf8'));
		return { format: 'module', source: rewriteInlineRequires(script), shortCircuit: true };
	}
	if (filePath.endsWith('.js')) {
		const source = fs.readFileSync(filePath, 'utf8');
		if (source.includes('module.exports')) {
			return { format: 'module', source: wrapCommonJs(source), shortCircuit: true };
		}
		return { format: 'module', source: rewriteInlineRequires(source), shortCircuit: true };
	}
	return nextLoad(url, context);
}
