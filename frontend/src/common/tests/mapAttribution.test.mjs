import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import mapAttribution from '@/common/js/mapAttribution';

const YEAR = new Date().getFullYear();
const OPEN = "<span class='copyright' style='padding: 0px'><span class='copyrightText'>";
const TERMS = ". <a class='copyrightText exp-hiddable-unset' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>";
const CONTACT = ". <a class='copyrightText exp-hiddable-unset' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments contacto'></i> Contacto</a>";

describe('mapAttribution: GetCopyright');

it('embebido y activo: el crédito es un enlace a poblaciones.org, con términos y sin contacto', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: true };
	expect(mapAttribution.GetCopyright(false)).toBe(
		OPEN + "<a class='copyrightText' href='https://poblaciones.org/' target='_blank'> © 2019-" + YEAR + ' CONICET / ODSA-UCA</a>' + TERMS + '</span></span>');
});

it('embebido pero inactivo y en escritorio: agrega términos y enlace de contacto', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: false };
	expect(mapAttribution.GetCopyright(false)).toBe(OPEN + ' © 2019-' + YEAR + ' CONICET / ODSA-UCA</a>' + TERMS + CONTACT + '</span></span>');
});

it('en móvil omite el rango de años, los términos y el contacto', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: false };
	expect(mapAttribution.GetCopyright(true)).toBe(OPEN + ' © CONICET / ODSA-UCA</a></span></span>');
});

it('sin objeto Embedded agrega los términos y no el contacto', () => {
	setupBrowser();
	expect(mapAttribution.GetCopyright(false)).toBe(OPEN + ' © 2019-' + YEAR + ' CONICET / ODSA-UCA</a>' + TERMS + '</span></span>');
});

it('el enlace a Términos y Condiciones aparece en escritorio y no en móvil', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: false };
	expect(mapAttribution.GetCopyright(false).indexOf('terminos') === -1).toBeFalsy();
	expect(mapAttribution.GetCopyright(true).indexOf('terminos')).toBe(-1);
});
