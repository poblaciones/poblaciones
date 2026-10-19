import { describe, it, expect } from './_harness.mjs';
import color from '@/common/framework/color';

describe('color: lectura de componentes');

it('ParseColorParts lee r, g, b de un hexadecimal con o sin #', () => {
	expect(color.ParseColorParts('#FF8000')).toEqual([255, 128, 0]);
	expect(color.ParseColorParts('FF8000')).toEqual([255, 128, 0]);
});

it('ParseColorParts incluye el canal alfa cuando el color tiene 8 dígitos', () => {
	expect(color.ParseColorParts('#FF800080')).toEqual([255, 128, 0, 128]);
});

it('ParseColorPartsRGB devuelve un objeto, con a solo si hay alfa', () => {
	expect(color.ParseColorPartsRGB('#0A0B0C')).toEqual({ r: 10, g: 11, b: 12 });
	expect(color.ParseColorPartsRGB('#0A0B0C0D')).toEqual({ r: 10, g: 11, b: 12, a: 13 });
});

describe('color: claridad');

it('IsLightColor es true recién cuando el promedio de canales supera 220', () => {
	expect(color.IsLightColor('#FFFFFF')).toBeTruthy();
	expect(color.IsLightColor('#DDDDDD')).toBeTruthy();
	expect(color.IsLightColor('#DCDCDC')).toBeFalsy();
	expect(color.IsLightColor('#000000')).toBeFalsy();
});

it('IsAlmostLightColor usa el umbral 180 e IsReallyLightColor el 234', () => {
	expect(color.IsAlmostLightColor('#B5B5B5')).toBeTruthy();
	expect(color.IsAlmostLightColor('#B4B4B4')).toBeFalsy();
	expect(color.IsReallyLightColor('#EBEBEB')).toBeTruthy();
	expect(color.IsReallyLightColor('#EAEAEA')).toBeFalsy();
});

it('un color vacío o nulo nunca es claro', () => {
	expect(color.IsLightColor('')).toBeFalsy();
	expect(color.IsLightColor(null)).toBeFalsy();
	expect(color.IsLightColor(undefined)).toBeFalsy();
});

describe('color: generación');

it('MakeColor arma el hexadecimal truncando los decimales y rellenando con ceros', () => {
	expect(color.MakeColor(255.9, 0, 15)).toBe('#ff000f');
});

it('toHex rellena con un cero los valores de un solo dígito', () => {
	expect(color.toHex(5)).toBe('05');
	expect(color.toHex(255)).toBe('ff');
});

it('ReduceColor multiplica cada canal y trunca', () => {
	expect(color.ReduceColor('#FF8000', 0.5)).toBe('#7f4000');
	expect(color.ReduceColor('#FFFFFF', 1)).toBe('#ffffff');
});

it('GetColorPalete ofrece 27 colores sin repetir', () => {
	const palette = color.GetColorPalete();
	expect(palette).toHaveLength(27);
	const distinct = new Set(palette);
	expect(distinct.size).toBe(27);
});

it('GetRandomDefaultColor elige un elemento de la paleta según Math.random', () => {
	const palette = color.GetColorPalete();
	const originalRandom = Math.random;
	try {
		Math.random = function () { return 0; };
		expect(color.GetRandomDefaultColor()).toBe(palette[0]);
		Math.random = function () { return 0.999; };
		expect(color.GetRandomDefaultColor()).toBe(palette[26]);
	} finally {
		Math.random = originalRandom;
	}
});
