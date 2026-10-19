import { describe, it, expect } from './_harness.mjs';
import speech from '@/common/js/speech';

function daysAgoAtMidnight(days) {
	const date = new Date();
	date.setDate(date.getDate() - days);
	date.setHours(0, 0, 0, 0);
	return date.toISOString();
}

describe('speech: GetValidaDate y FormatWorkInfo');

it('GetValidaDate devuelve null si no hay ninguna fecha', () => {
	expect(speech.GetValidaDate({ MetadataLastOnline: null, Updated: null })).toBeNull();
});

it('GetValidaDate devuelve la edición si no hay publicación o si es posterior a ella', () => {
	expect(speech.GetValidaDate({ MetadataLastOnline: null, Updated: '2024-05-01' })).toBe('2024-05-01');
	expect(speech.GetValidaDate({ MetadataLastOnline: '2024-04-01', Updated: '2024-05-01' })).toBe('2024-05-01');
});

it('GetValidaDate devuelve la publicación si la edición no es posterior, incluso sin edición', () => {
	expect(speech.GetValidaDate({ MetadataLastOnline: '2024-06-01', Updated: '2024-05-01' })).toBe('2024-06-01');
	expect(speech.GetValidaDate({ MetadataLastOnline: '2024-06-01', Updated: null })).toBe('2024-06-01');
});

it('FormatWorkInfo devuelve vacío si no hay fechas', () => {
	expect(speech.FormatWorkInfo({ MetadataLastOnline: null, Updated: null })).toBe('');
});

it('FormatWorkInfo informa "Editada" con el usuario de edición cuando prevalece la edición', () => {
	const item = { MetadataLastOnline: null, Updated: daysAgoAtMidnight(30), UpdateUser: 'Ana', LastOnlineUser: 'Luis' };
	const text = speech.FormatWorkInfo(item);
	expect(/^Editada el \d{2}\/\d{2}\/\d{4} por Ana$/.test(text)).toBeTruthy();
});

it('FormatWorkInfo informa "Publicada" con el usuario de publicación cuando prevalece la publicación', () => {
	const item = { MetadataLastOnline: daysAgoAtMidnight(30), Updated: null, UpdateUser: 'Ana', LastOnlineUser: 'Luis' };
	const text = speech.FormatWorkInfo(item);
	expect(/^Publicada el \d{2}\/\d{2}\/\d{4} por Luis$/.test(text)).toBeTruthy();
});

describe('speech: LogInfoText (fechas relativas en castellano)');

it('dentro de las últimas 24 horas usa un texto relativo', () => {
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
	const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
	expect(speech.LogInfoText(fiveMinutesAgo, 'Ana', 'Editada')).toBe('Editada hace 5 minutos por Ana');
	expect(speech.LogInfoText(threeHoursAgo, null, 'Editada')).toBe('Editada hace 3 horas');
});

it('desde ayer a las 0:00 usa "ayer" sin la hora', () => {
	expect(speech.LogInfoText(daysAgoAtMidnight(1), 'Ana', 'Editada')).toBe('Editada ayer por Ana');
});

it('dentro de la última semana usa el nombre del día, sin "pasado" ni la hora', () => {
	const text = speech.LogInfoText(daysAgoAtMidnight(3), 'Ana', 'Publicada');
	expect(/^Publicada el [a-záéíóú]+ por Ana$/.test(text)).toBeTruthy();
});

it('más allá de una semana usa la fecha numérica precedida por "el"', () => {
	const text = speech.LogInfoText(daysAgoAtMidnight(30), null, 'Editada');
	expect(/^Editada el \d{2}\/\d{2}\/\d{4}$/.test(text)).toBeTruthy();
});
