/*
 * Colapso vertical animado para bloques que se muestran y ocultan con v-show o v-if (el alto natural no se conoce de
 * antemano). Anima alto, relleno vertical y opacidad. Los márgenes y los bordes del hijo no se animan.
 * Uso: <mp-collapse><div v-show="visible">...</div></mp-collapse>
 */
export const DURACION_COLAPSO_MS = 250;
const CURVA = 'cubic-bezier(0.4, 0, 0.2, 1)';

// El overflow oculto no recorta los descendientes con position absolute cuyo bloque contenedor está fuera del elemento
// (las barras de metricValues); clip-path sí.
function recortarAlAlto(elemento) {
	elemento.style.overflow = 'hidden';
	elemento.style.clipPath = 'inset(0)';
}

function liberarRecorte(elemento) {
	elemento.style.overflow = '';
	elemento.style.clipPath = '';
}

function puedeAnimar(elemento) {
	if (typeof elemento.animate !== 'function') {
		return false;
	}
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Alto del contenido (sin relleno ni borde), relleno vertical y opacidad tal como están en pantalla.
// La altura se anima siempre como content-box, porque con border-box el relleno impediría llegar a cero.
function medirEnPantalla(elemento) {
	var estilo = window.getComputedStyle(elemento);
	var rellenoArriba = parseFloat(estilo.paddingTop);
	var rellenoAbajo = parseFloat(estilo.paddingBottom);
	return {
		alto: elemento.clientHeight - rellenoArriba - rellenoAbajo,
		rellenoArriba: rellenoArriba,
		rellenoAbajo: rellenoAbajo,
		opacidad: estilo.opacity
	};
}

function medirNatural(elemento) {
	var enPantalla = medirEnPantalla(elemento);
	enPantalla.alto = elemento.scrollHeight - enPantalla.rellenoArriba - enPantalla.rellenoAbajo;
	enPantalla.opacidad = '1';
	return enPantalla;
}

function estadoColapsado() {
	return { alto: 0, rellenoArriba: 0, rellenoAbajo: 0, opacidad: '0' };
}

function fotograma(estado) {
	return {
		height: estado.alto + 'px',
		paddingTop: estado.rellenoArriba + 'px',
		paddingBottom: estado.rellenoAbajo + 'px',
		opacity: estado.opacidad,
		boxSizing: 'content-box'
	};
}

// Una animación en curso se corta desde el estado que tiene en pantalla, no desde cero.
function detenerAnimacionEnCurso(elemento) {
	if (!elemento.mpCollapseAnimacion) {
		return null;
	}
	var estadoEnPantalla = medirEnPantalla(elemento);
	elemento.mpCollapseAnimacion.cancel();
	elemento.mpCollapseAnimacion = null;
	liberarRecorte(elemento);
	return estadoEnPantalla;
}

// La salida mantiene el estado final hasta que Vue oculta el elemento: sin eso se vería un cuadro con el alto completo.
function animar(elemento, desde, hasta, relleno, terminar) {
	var animacion = elemento.animate(
		[fotograma(desde), fotograma(hasta)],
		{ duration: DURACION_COLAPSO_MS, easing: CURVA, fill: relleno }
	);
	elemento.mpCollapseAnimacion = animacion;
	animacion.onfinish = function () {
		terminar();
		animacion.cancel();
		elemento.mpCollapseAnimacion = null;
		liberarRecorte(elemento);
	};
}

function mostrar(elemento, terminar) {
	var desde = detenerAnimacionEnCurso(elemento);
	if (!puedeAnimar(elemento)) {
		terminar();
		return;
	}
	// Con el recorte aplicado antes de medir, el alto incluye los márgenes de los hijos y coincide con el animado.
	recortarAlAlto(elemento);
	if (desde === null) {
		desde = estadoColapsado();
	}
	animar(elemento, desde, medirNatural(elemento), 'none', terminar);
}

function ocultar(elemento, terminar) {
	var desde = detenerAnimacionEnCurso(elemento);
	if (!puedeAnimar(elemento)) {
		terminar();
		return;
	}
	recortarAlAlto(elemento);
	if (desde === null) {
		desde = medirEnPantalla(elemento);
		desde.opacidad = '1';
	}
	animar(elemento, desde, estadoColapsado(), 'forwards', terminar);
}

export default {
	name: 'mpCollapse',
	functional: true,
	render: function (h, contexto) {
		return h('transition', { props: { css: false }, on: { enter: mostrar, leave: ocultar } }, contexto.children);
	}
};
