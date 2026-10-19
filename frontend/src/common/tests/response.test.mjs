import { describe, it, expect } from './_harness.mjs';
import response from '@/common/framework/response';

describe('response: estados del servidor');

it('expone las constantes OK y ERROR', () => {
	expect(response.OK).toBe('OK');
	expect(response.ERROR).toBe('ERROR');
});

it('IsOK es true solo para el estado OK', () => {
	expect(response.IsOK('OK')).toBeTruthy();
	expect(response.IsOK('ERROR')).toBeFalsy();
	expect(response.IsOK(undefined)).toBeFalsy();
});

it('IsError es true para cualquier estado distinto de OK, incluso uno ausente', () => {
	expect(response.IsError('ERROR')).toBeTruthy();
	expect(response.IsError('otro')).toBeTruthy();
	expect(response.IsError(undefined)).toBeTruthy();
	expect(response.IsError('OK')).toBeFalsy();
});
