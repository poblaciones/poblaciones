import { describe, it, expect } from './_harness.mjs';
import Localization from '@/backoffice/classes/Localization';

const localization = new Localization().Get();

describe('Localization: Get');

it('define siete nombres de día en cada variante, empezando por el domingo', () => {
	expect(localization.days.names).toHaveLength(7);
	expect(localization.days.namesAbbr).toHaveLength(7);
	expect(localization.days.namesShort).toHaveLength(7);
	expect(localization.days.names[0]).toBe('Domingo');
	expect(localization.firstDay).toBe(0);
});

it('define doce meses más el decimotercero vacío de los calendarios lunares', () => {
	expect(localization.months.names).toHaveLength(13);
	expect(localization.months.namesAbbr).toHaveLength(13);
	expect(localization.months.names[12]).toBe('');
	expect(localization.months.namesAbbr[12]).toBe('');
});

it('usa coma decimal y símbolo de moneda antes del importe', () => {
	expect(localization.decimalseparator).toBe(',');
	expect(localization.currencysymbolposition).toBe('antes');
});

it('cada llamada devuelve un objeto nuevo', () => {
	expect(new Localization().Get() === new Localization().Get()).toBeFalsy();
});
