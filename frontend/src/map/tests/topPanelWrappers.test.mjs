import { describe, it, expect } from './_harness.mjs';
import { mountLite } from './fixtures.mjs';
import WorkPanel from '@/map/components/panels/workPanel';
import BoundaryPanel from '@/map/components/panels/boundaryPanel';

describe('workPanel: arma las props genéricas de topPanel a partir del work activo');

it('sin work activo, metadata es null y addToMapItems queda vacío', () => {
	const panel = mountLite(WorkPanel, { props: { work: { Current: null } } });
	expect(panel.metadata).toBeNull();
	expect(panel.addToMapItems).toEqual([]);
	expect(panel.addToMapId).toBeNull();
});

it('con work activo, expone Metadata/Metrics/Id del work como metadata/addToMapItems/addToMapId', () => {
	const work = {
		Current: {
			Id: 83401,
			Metadata: { Name: 'Censo 2020' },
			Metrics: [{ Id: 1, LocalVersions: [{ Name: '2020' }] }],
		},
	};
	const panel = mountLite(WorkPanel, { props: { work: work } });
	expect(panel.metadata).toBe(work.Current.Metadata);
	expect(panel.addToMapItems).toBe(work.Current.Metrics);
	expect(panel.addToMapId).toBe(83401);
});

describe('boundaryPanel: arma las props genéricas de topPanel a partir de la delimitación activa');

it('sin delimitación activa, metadata es null y addToMapItems queda vacío', () => {
	const panel = mountLite(BoundaryPanel, { props: { boundary: { Current: null } } });
	expect(panel.metadata).toBeNull();
	expect(panel.addToMapItems).toEqual([]);
});

it('con delimitación activa, arma un único item con Id/Name/Type/Versions y usa el Metadata de la versión seleccionada', () => {
	const boundary = {
		Current: {
			Id: 45,
			Name: 'Barrios',
			SelectedVersionIndex: 1,
			Versions: [
				{ Id: 1, Name: '2018', Metadata: { Name: 'Vieja' } },
				{ Id: 2, Name: '2022', Metadata: { Name: 'Barrios de Tandil' } },
			],
		},
	};
	const panel = mountLite(BoundaryPanel, { props: { boundary: boundary } });
	expect(panel.metadata).toBe(boundary.Current.Versions[1].Metadata);
	expect(panel.addToMapItems).toEqual([{
		Id: 45,
		Name: 'Barrios',
		Type: 'B',
		Versions: boundary.Current.Versions,
	}]);
});
