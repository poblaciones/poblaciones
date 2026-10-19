import { describe, it, expect } from './_harness.mjs';
import creativeCommons from '@/common/js/creativeCommons';

describe('creativeCommons: ResolveUrl');

it('arma la URL base con la versión', () => {
	const entity = { licenseType: 1, licenseVersion: '4.0', licenseCommercial: 1, licenseOpen: 'always' };
	expect(creativeCommons.ResolveUrl(entity)).toBe('https://creativecommons.org/licenses/by/4.0');
});

it('licenseType 0 (número o texto) significa sin licencia: devuelve vacío', () => {
	expect(creativeCommons.ResolveUrl({ licenseType: 0 })).toBe('');
	expect(creativeCommons.ResolveUrl({ licenseType: '0' })).toBe('');
});

it('agrega -nc salvo que licenseCommercial sea 1 (número o texto)', () => {
	const base = { licenseType: 1, licenseVersion: '4.0', licenseOpen: 'always' };
	expect(creativeCommons.ResolveUrl({ ...base, licenseCommercial: 0 })).toBe('https://creativecommons.org/licenses/by-nc/4.0');
	expect(creativeCommons.ResolveUrl({ ...base, licenseCommercial: '1' })).toBe('https://creativecommons.org/licenses/by/4.0');
	expect(creativeCommons.ResolveUrl({ ...base })).toBe('https://creativecommons.org/licenses/by-nc/4.0');
});

it('licenseOpen "never" agrega -nd y "same" agrega -sa', () => {
	const base = { licenseType: 1, licenseVersion: '2.5', licenseCommercial: 1 };
	expect(creativeCommons.ResolveUrl({ ...base, licenseOpen: 'never' })).toBe('https://creativecommons.org/licenses/by-nd/2.5');
	expect(creativeCommons.ResolveUrl({ ...base, licenseOpen: 'same' })).toBe('https://creativecommons.org/licenses/by-sa/2.5');
});

it('combina -nc con -nd y con -sa', () => {
	const base = { licenseType: 1, licenseVersion: '3.0', licenseCommercial: 0 };
	expect(creativeCommons.ResolveUrl({ ...base, licenseOpen: 'never' })).toBe('https://creativecommons.org/licenses/by-nc-nd/3.0');
	expect(creativeCommons.ResolveUrl({ ...base, licenseOpen: 'same' })).toBe('https://creativecommons.org/licenses/by-nc-sa/3.0');
});

describe('creativeCommons: UrlIsCC y GetLicenseImageByUrl');

it('UrlIsCC reconoce las cuatro formas de dominio (http/https, con o sin www)', () => {
	expect(creativeCommons.UrlIsCC('http://creativecommons.org/x')).toBeTruthy();
	expect(creativeCommons.UrlIsCC('http://www.creativecommons.org/x')).toBeTruthy();
	expect(creativeCommons.UrlIsCC('https://creativecommons.org/x')).toBeTruthy();
	expect(creativeCommons.UrlIsCC('https://www.creativecommons.org/x')).toBeTruthy();
	expect(creativeCommons.UrlIsCC('https://otro.org/licenses/by/4.0/')).toBeFalsy();
});

it('GetLicenseImageByUrl devuelve la imagen de la licencia según su segmento', () => {
	expect(creativeCommons.GetLicenseImageByUrl('https://creativecommons.org/licenses/by/4.0/')).toBe('/static/img/licenses/cc/by.png');
	expect(creativeCommons.GetLicenseImageByUrl('https://creativecommons.org/licenses/by-nc-sa/4.0/')).toBe('/static/img/licenses/cc/by-nc-sa.png');
	expect(creativeCommons.GetLicenseImageByUrl('https://creativecommons.org/licenses/by-nd/2.5/ar/')).toBe('/static/img/licenses/cc/by-nd.png');
});

it('GetLicenseImageByUrl admite otra extensión', () => {
	expect(creativeCommons.GetLicenseImageByUrl('https://creativecommons.org/licenses/by/4.0/', 'svg')).toBe('/static/img/licenses/cc/by.svg');
});

it('GetLicenseImageByUrl devuelve vacío si la URL no es de Creative Commons o no tiene un tipo conocido', () => {
	expect(creativeCommons.GetLicenseImageByUrl('https://otro.org/licenses/by/4.0/')).toBe('');
	expect(creativeCommons.GetLicenseImageByUrl('https://creativecommons.org/publicdomain/zero/1.0/')).toBe('');
});
