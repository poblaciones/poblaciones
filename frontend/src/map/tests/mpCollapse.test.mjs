import { describe, it, expect } from './_harness.mjs';
import MpCollapse, { DURACION_COLAPSO_MS } from '@/map/components/controls/mpCollapse';

// El componente solo traduce los hooks de <transition> a animaciones de alto, relleno vertical y opacidad
// (Web Animations). Acá se ejercita con un elemento y una animación simulados: lo que se verifica es la
// secuencia de keyframes, el recorte mientras dura la animación y el orden entre terminar() y cancel().

function prepararVentana(movimientoReducido) {
	globalThis.window = {
		matchMedia() { return { matches: movimientoReducido }; },
		getComputedStyle(elemento) {
			return {
				opacity: elemento.opacidad,
				paddingTop: elemento.rellenoArriba + 'px',
				paddingBottom: elemento.rellenoAbajo + 'px',
			};
		},
	};
}

// alto: del contenido; el relleno vertical se suma en clientHeight y scrollHeight, como en el navegador.
function crearElemento(alto, rellenoArriba, rellenoAbajo) {
	const elemento = {
		clientHeight: alto + rellenoArriba + rellenoAbajo,
		scrollHeight: alto + rellenoArriba + rellenoAbajo,
		rellenoArriba: rellenoArriba,
		rellenoAbajo: rellenoAbajo,
		opacidad: '1',
		style: { overflow: '', clipPath: '' },
		animaciones: [],
	};
	elemento.animate = function (keyframes, opciones) {
		const animacion = {
			keyframes: keyframes,
			opciones: opciones,
			canceladas: 0,
			onfinish: null,
			cancel() { this.canceladas += 1; },
		};
		elemento.animaciones.push(animacion);
		return animacion;
	};
	return elemento;
}

function fotograma(alto, rellenoArriba, rellenoAbajo, opacidad) {
	return {
		height: alto + 'px',
		paddingTop: rellenoArriba + 'px',
		paddingBottom: rellenoAbajo + 'px',
		opacity: opacidad,
		boxSizing: 'content-box',
	};
}

function obtenerTransition() {
	let llamada = null;
	const h = function (etiqueta, datos, hijos) {
		llamada = { etiqueta: etiqueta, datos: datos, hijos: hijos };
		return llamada;
	};
	MpCollapse.render(h, { children: ['bloque'] });
	return llamada;
}

describe('mpCollapse: transición');

it('renderiza un transition sin clases CSS, con hooks de entrada y salida', () => {
	const transition = obtenerTransition();
	expect(transition.etiqueta).toBe('transition');
	expect(transition.datos.props.css).toBe(false);
	expect(typeof transition.datos.on.enter).toBe('function');
	expect(typeof transition.datos.on.leave).toBe('function');
	expect(transition.hijos).toEqual(['bloque']);
});

it('al mostrar anima de alto 0 al alto natural y recorta mientras dura', () => {
	prepararVentana(false);
	const elemento = crearElemento(120, 0, 0);
	let terminadas = 0;
	obtenerTransition().datos.on.enter(elemento, function () { terminadas += 1; });
	const animacion = elemento.animaciones[0];
	expect(animacion.keyframes).toEqual([fotograma(0, 0, 0, '0'), fotograma(120, 0, 0, '1')]);
	expect(animacion.opciones.duration).toBe(DURACION_COLAPSO_MS);
	expect(animacion.opciones.fill).toBe('none');
	expect(elemento.style.overflow).toBe('hidden');
	expect(elemento.style.clipPath).toBe('inset(0)');
	expect(terminadas).toBe(0);
});

it('al mostrar un elemento con relleno vertical lo anima junto con el alto, sin contarlo en el alto', () => {
	prepararVentana(false);
	const elemento = crearElemento(120, 16, 4);
	obtenerTransition().datos.on.enter(elemento, function () {});
	expect(elemento.animaciones[0].keyframes).toEqual([fotograma(0, 0, 0, '0'), fotograma(120, 16, 4, '1')]);
});

it('al terminar la entrada libera el recorte, cancela la animación y avisa a Vue', () => {
	prepararVentana(false);
	const elemento = crearElemento(120, 0, 0);
	let terminadas = 0;
	obtenerTransition().datos.on.enter(elemento, function () { terminadas += 1; });
	elemento.animaciones[0].onfinish();
	expect(terminadas).toBe(1);
	expect(elemento.style.overflow).toBe('');
	expect(elemento.style.clipPath).toBe('');
	expect(elemento.animaciones[0].canceladas).toBe(1);
});

it('al ocultar anima del alto actual a 0 y mantiene el estado final hasta ocultar', () => {
	prepararVentana(false);
	const elemento = crearElemento(90, 0, 0);
	obtenerTransition().datos.on.leave(elemento, function () {});
	const animacion = elemento.animaciones[0];
	expect(animacion.keyframes).toEqual([fotograma(90, 0, 0, '1'), fotograma(0, 0, 0, '0')]);
	expect(animacion.opciones.fill).toBe('forwards');
});

it('al ocultar un elemento con relleno vertical parte del alto del contenido y del relleno', () => {
	prepararVentana(false);
	const elemento = crearElemento(90, 16, 0);
	obtenerTransition().datos.on.leave(elemento, function () {});
	expect(elemento.animaciones[0].keyframes).toEqual([fotograma(90, 16, 0, '1'), fotograma(0, 0, 0, '0')]);
});

it('al terminar la salida avisa a Vue (que oculta el elemento) antes de cancelar la animación', () => {
	prepararVentana(false);
	const elemento = crearElemento(90, 0, 0);
	let canceladasAlAvisar = -1;
	obtenerTransition().datos.on.leave(elemento, function () {
		canceladasAlAvisar = elemento.animaciones[0].canceladas;
	});
	elemento.animaciones[0].onfinish();
	expect(canceladasAlAvisar).toBe(0);
	expect(elemento.animaciones[0].canceladas).toBe(1);
	expect(elemento.style.overflow).toBe('');
	expect(elemento.style.clipPath).toBe('');
});

describe('mpCollapse: casos límite');

it('con movimiento reducido no anima y avisa de inmediato', () => {
	prepararVentana(true);
	const elemento = crearElemento(120, 0, 0);
	let terminadas = 0;
	const hooks = obtenerTransition().datos.on;
	hooks.enter(elemento, function () { terminadas += 1; });
	hooks.leave(elemento, function () { terminadas += 1; });
	expect(terminadas).toBe(2);
	expect(elemento.animaciones).toHaveLength(0);
	expect(elemento.style.overflow).toBe('');
	expect(elemento.style.clipPath).toBe('');
});

it('sin Web Animations avisa de inmediato', () => {
	prepararVentana(false);
	const elemento = crearElemento(120, 0, 0);
	elemento.animate = undefined;
	let terminadas = 0;
	obtenerTransition().datos.on.enter(elemento, function () { terminadas += 1; });
	expect(terminadas).toBe(1);
});

it('una entrada que interrumpe una salida parte del alto, el relleno y la opacidad que había en pantalla', () => {
	prepararVentana(false);
	const elemento = crearElemento(100, 16, 0);
	const hooks = obtenerTransition().datos.on;
	hooks.leave(elemento, function () {});
	elemento.clientHeight = 56;
	elemento.rellenoArriba = 8;
	elemento.opacidad = '0.4';
	hooks.enter(elemento, function () {});
	expect(elemento.animaciones[0].canceladas).toBe(1);
	// Al cancelar, el elemento recupera su medida natural.
	expect(elemento.animaciones[1].keyframes[0]).toEqual(fotograma(48, 8, 0, '0.4'));
});

it('una salida que interrumpe una entrada parte del alto, el relleno y la opacidad que había en pantalla', () => {
	prepararVentana(false);
	const elemento = crearElemento(100, 0, 0);
	const hooks = obtenerTransition().datos.on;
	hooks.enter(elemento, function () {});
	elemento.clientHeight = 70;
	elemento.opacidad = '0.7';
	hooks.leave(elemento, function () {});
	expect(elemento.animaciones[0].canceladas).toBe(1);
	expect(elemento.animaciones[1].keyframes).toEqual([fotograma(70, 0, 0, '0.7'), fotograma(0, 0, 0, '0')]);
});
