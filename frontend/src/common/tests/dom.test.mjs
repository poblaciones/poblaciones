import { describe, it, expect } from './_harness.mjs';
import { setupBrowser, makeElement, captureConsole } from './fixtures.mjs';
import dom from '@/common/framework/dom';

// window.location.href del doble: https://example.org/app/?a=1
const SAME_ORIGIN_CSS = 'https://example.org/css/estilo.css';
const OTHER_ORIGIN_CSS = 'https://cdn.otro.org/estilo.css';

function makeSheet(localName, href, rules, useLegacyRules) {
	const sheet = { ownerNode: { localName: localName, href: href } };
	if (useLegacyRules) {
		sheet.rules = rules;
	} else {
		sheet.cssRules = rules;
	}
	return sheet;
}

describe('dom: getCssRule');

it('encuentra una regla por selector en una hoja <style> embebida', () => {
	const rule = { selectorText: '.titulo' };
	const browser = setupBrowser({ styleSheets: [makeSheet('style', null, [{ selectorText: '.otro' }, rule])] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBe(rule);
});

it('lee también hojas <link> del mismo origen', () => {
	const rule = { selectorText: '.titulo' };
	const browser = setupBrowser({ styleSheets: [makeSheet('link', SAME_ORIGIN_CSS, [rule])] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBe(rule);
});

it('ignora las hojas de otro origen', () => {
	const browser = setupBrowser({ styleSheets: [makeSheet('link', OTHER_ORIGIN_CSS, [{ selectorText: '.titulo' }])] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBeNull();
});

it('usa la propiedad rules cuando la hoja no tiene cssRules', () => {
	const rule = { selectorText: '.titulo' };
	const browser = setupBrowser({ styleSheets: [makeSheet('style', null, [rule], true)] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBe(rule);
});

it('ignora las hojas cuyo nodo no es <style> ni <link>, o no tiene nodo', () => {
	const rule = { selectorText: '.titulo' };
	const browser = setupBrowser({ styleSheets: [makeSheet('div', null, [rule]), { cssRules: [rule] }] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBeNull();
});

it('devuelve null si ninguna regla coincide', () => {
	const browser = setupBrowser({ styleSheets: [makeSheet('style', null, [{ selectorText: '.otro' }])] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBeNull();
});

it('sigue con la siguiente hoja cuando la primera no tiene la regla', () => {
	const rule = { selectorText: '.titulo' };
	const browser = setupBrowser({ styleSheets: [makeSheet('style', null, []), makeSheet('style', null, [rule])] });
	expect(dom.getCssRule(browser.document, '.titulo')).toBe(rule);
});

describe('dom: origen de las hojas');

it('isSameOrigin compara protocolo, host y puerto', () => {
	expect(dom.isSameOrigin('https://a.org/x', 'https://a.org/y')).toBeTruthy();
	expect(dom.isSameOrigin('https://a.org/x', 'http://a.org/x')).toBeFalsy();
	expect(dom.isSameOrigin('https://a.org:8443/x', 'https://a.org/x')).toBeFalsy();
	expect(dom.isSameOrigin('https://a.org/x', 'https://b.org/x')).toBeFalsy();
});

it('parseURL devuelve null y registra el error ante una URL inválida', () => {
	let parsed = 'sin ejecutar';
	const logged = captureConsole(function () {
		parsed = dom.parseURL('esto no es una url');
	});
	expect(parsed).toBeNull();
	expect(logged.errors).toHaveLength(1);
});

it('isSameOrigin es false si alguna de las dos URL no se puede interpretar', () => {
	let result = true;
	captureConsole(function () {
		result = dom.isSameOrigin('invalida', 'https://a.org/x');
	});
	expect(result).toBeFalsy();
});

describe('dom: clases CSS sobre elementos del documento');

function makeDocumentWithBoxes() {
	const first = makeElement(['box', 'vieja']);
	const second = makeElement(['box', 'vieja', 'is-selected']);
	setupBrowser({ byClass: { box: [first, second] } });
	return { first, second };
}

it('addClass agrega la clase a todos los elementos que tienen la clase buscada', () => {
	const boxes = makeDocumentWithBoxes();
	dom.addClass('box', 'nueva');
	expect(boxes.first.classList.contains('nueva')).toBeTruthy();
	expect(boxes.second.classList.contains('nueva')).toBeTruthy();
});

it('removeClass quita la clase y devuelve los elementos afectados', () => {
	const boxes = makeDocumentWithBoxes();
	const affected = dom.removeClass('box', 'vieja');
	expect(boxes.first.classList.contains('vieja')).toBeFalsy();
	expect(affected).toHaveLength(2);
});

it('swapClasses agrega una clase y quita la otra', () => {
	const boxes = makeDocumentWithBoxes();
	dom.swapClasses('box', 'nueva', 'vieja');
	expect(boxes.first.classList.toArray()).toEqual(['box', 'nueva']);
});

it('removeClassAddText quita la clase y reemplaza el contenido', () => {
	const boxes = makeDocumentWithBoxes();
	dom.removeClassAddText('box', 'vieja', 'texto');
	expect(boxes.first.classList.contains('vieja')).toBeFalsy();
	expect(boxes.first.innerHTML).toBe('texto');
});

it('addClassRemoveText agrega la clase y vacía el contenido', () => {
	const boxes = makeDocumentWithBoxes();
	boxes.first.innerHTML = 'algo';
	dom.addClassRemoveText('box', 'nueva');
	expect(boxes.first.classList.contains('nueva')).toBeTruthy();
	expect(boxes.first.innerHTML).toBe('');
});

it('una clase sin elementos no hace nada', () => {
	setupBrowser();
	dom.addClass('inexistente', 'nueva');
	expect(dom.removeClass('inexistente', 'x')).toHaveLength(0);
});

describe('dom: estilos');

it('setStyleAttributeByClass asigna el estilo a todos los elementos', () => {
	const boxes = makeDocumentWithBoxes();
	dom.setStyleAttributeByClass('box', 'color', 'red');
	expect(boxes.first.style.color).toBe('red');
	expect(boxes.second.style.color).toBe('red');
});

it('setStyleAttributeByClass con filtro omite los elementos que tienen esa clase', () => {
	const boxes = makeDocumentWithBoxes();
	dom.setStyleAttributeByClass('box', 'color', 'red', 'is-selected');
	expect(boxes.first.style.color).toBe('red');
	expect(boxes.second.style.color).toBe(undefined);
});

it('setDisplayByClass y setVisibilityByClass ajustan display y visibility', () => {
	const boxes = makeDocumentWithBoxes();
	dom.setDisplayByClass('box', 'none');
	dom.setVisibilityByClass('box', 'hidden');
	expect(boxes.first.style.display).toBe('none');
	expect(boxes.first.style.visibility).toBe('hidden');
});

it('setDisplayByClassNotSelected no toca los elementos is-selected', () => {
	const boxes = makeDocumentWithBoxes();
	dom.setDisplayByClassNotSelected('box', 'none');
	expect(boxes.first.style.display).toBe('none');
	expect(boxes.second.style.display).toBe(undefined);
});

it('setStyleAttributeById asigna el estilo al elemento con ese id', () => {
	const target = makeElement();
	setupBrowser({ byId: { panel: target } });
	dom.setStyleAttributeById('panel', 'width', '10px');
	expect(target.style.width).toBe('10px');
});

describe('dom: operaciones por lista');

it('addClassesByList y removeClassesByList aplican cada par class/extraclass', () => {
	const boxes = makeDocumentWithBoxes();
	dom.addClassesByList([{ class: 'box', extraclass: 'a' }, { class: 'box', extraclass: 'b' }]);
	expect(boxes.first.classList.toArray()).toEqual(['box', 'vieja', 'a', 'b']);
	dom.removeClassesByList([{ class: 'box', extraclass: 'a' }]);
	expect(boxes.first.classList.contains('a')).toBeFalsy();
	expect(boxes.first.classList.contains('b')).toBeTruthy();
});

it('setStyleAttributesByList distingue ids (prefijo #) de clases, y unset restaura los valores', () => {
	const panel = makeElement();
	const first = makeElement(['box']);
	setupBrowser({ byId: { panel: panel }, byClass: { box: [first] } });
	const classSet = [
		{ class: '#panel', attribute: 'display', set: 'none', restore: 'block' },
		{ class: 'box', attribute: 'opacity', set: '0.5', restore: '1' },
	];
	dom.setStyleAttributesByList(classSet);
	expect(panel.style.display).toBe('none');
	expect(first.style.opacity).toBe('0.5');
	dom.unsetStyleAttributesByList(classSet);
	expect(panel.style.display).toBe('block');
	expect(first.style.opacity).toBe('1');
});
