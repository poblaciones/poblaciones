import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import mapAttribution from '@/common/js/mapAttribution';

const YEAR = new Date().getFullYear();
const OPEN = "<span class='copyright' style='padding: 0px'><span class='copyrightText'>";
const CONTACT = "<a class='copyrightText exp-hiddable-unset' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments contacto'></i> Contacto</a>";

describe('mapAttribution: GetCopyright');

it('embebido y activo: el crédito es un enlace a poblaciones.org, sin enlace de contacto', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: true };
	expect(mapAttribution.GetCopyright(false)).toBe(
		OPEN + "<a class='copyrightText' href='https://poblaciones.org/' target='_blank'> © 2019-" + YEAR + ' CONICET / ODSA-UCA</a></span></span>');
});

it('embebido pero inactivo y en escritorio: agrega el enlace de contacto', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: false };
	expect(mapAttribution.GetCopyright(false)).toBe(OPEN + ' © 2019-' + YEAR + ' CONICET / ODSA-UCA</a>' + CONTACT + '</span></span>');
});

it('en móvil omite el rango de años y el contacto', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: false };
	expect(mapAttribution.GetCopyright(true)).toBe(OPEN + ' © CONICET / ODSA-UCA</a></span></span>');
});

it('sin objeto Embedded no hay enlace ni contacto', () => {
	setupBrowser();
	expect(mapAttribution.GetCopyright(false)).toBe(OPEN + ' © 2019-' + YEAR + ' CONICET / ODSA-UCA</a></span></span>');
});

it('el enlace a Términos y Condiciones no aparece en ningún caso (hoy la cadena se arma pero no se agrega)', () => {
	const browser = setupBrowser();
	browser.window.Embedded = { Active: false };
	expect(mapAttribution.GetCopyright(false).indexOf('terminos')).toBe(-1);
});
