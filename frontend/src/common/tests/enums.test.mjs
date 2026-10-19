import { describe, it, expect } from './_harness.mjs';
import columnFormatEnum from '@/common/enums/columnFormatEnum';
import tokenTypeEnum from '@/common/enums/tokenTypeEnum';

describe('enums: valores que comparte el cliente con el servidor');

it('columnFormatEnum define STRING = 1 y NUMBER = 5, y está congelado', () => {
	expect(columnFormatEnum.STRING).toBe(1);
	expect(columnFormatEnum.NUMBER).toBe(5);
	expect(Object.isFrozen(columnFormatEnum)).toBeTruthy();
});

it('tokenTypeEnum define los cuatro tipos de token', () => {
	expect(tokenTypeEnum.Activation).toBe('A');
	expect(tokenTypeEnum.ChangeEmail).toBe('E');
	expect(tokenTypeEnum.LostPassword).toBe('L');
	expect(tokenTypeEnum.Permission).toBe('P');
});
