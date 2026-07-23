import { describe, it, expect } from './_harness.mjs';
import { buildBoundaryInfo } from '@/map/components/widgets/sideToolbar/selectorTooltips';

describe('buildBoundaryInfo: sin padre y sin población, no hay tooltip (el panel no ofrece el botón i)');

it('devuelve null', () => {
	expect(buildBoundaryInfo({ Name: 'Tandil', Population: 0 }, null, null)).toBeNull();
});

describe('buildBoundaryInfo: sección de Población');

it('sin PopulationVersion en el container, el label queda como "Población" (sin cambios)', () => {
	const info = buildBoundaryInfo({ Name: 'Tandil', Population: 120000 }, null, 'Buenos Aires');
	const section = info.Sections.find(s => s.Label.indexOf('Población') === 0);
	expect(section.Label).toBe('Población');
});

it('con PopulationVersion en el container (el boundary/tipo de delimitación), concatena el año entre paréntesis', () => {
	const info = buildBoundaryInfo({ Name: 'Tandil', Population: 120000 }, { Name: 'Partidos', PopulationVersion: '2022' }, 'Buenos Aires');
	const section = info.Sections.find(s => s.Label.indexOf('Población') === 0);
	expect(section.Label).toBe('Población (2022)');
	expect(section.Text).toBeTruthy();
});

it('PopulationVersion en el item (la hoja) no tiene efecto: el dato es del boundary, no de cada región', () => {
	const info = buildBoundaryInfo({ Name: 'Tandil', Population: 120000, PopulationVersion: '2022' }, null, 'Buenos Aires');
	const section = info.Sections.find(s => s.Label.indexOf('Población') === 0);
	expect(section.Label).toBe('Población');
});

describe('buildBoundaryInfo: demás secciones, sin cambios');

it('agrega Tipo de delimitación y Pertenece a cuando corresponde', () => {
	const info = buildBoundaryInfo({ Name: 'Tandil', Population: 120000 }, { Name: 'Partidos' }, 'Buenos Aires');
	expect(info.Title).toBe('Tandil');
	expect(info.Sections[0]).toEqual({ Label: 'Tipo de delimitación', Text: 'Partidos' });
	expect(info.Sections[1]).toEqual({ Label: 'Pertenece a', Text: 'Buenos Aires' });
});
