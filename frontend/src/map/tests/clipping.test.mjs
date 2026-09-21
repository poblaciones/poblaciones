import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import Clipping from '@/map/classes/Clipping';

function makeClipping(regions) {
	setupWindow();
	return new Clipping({ ClippingRegionIds: [1] }, { Region: { Summary: { Regions: regions } } });
}

describe('Clipping.GetClippingName / GetClippingTypeName');

it('con una sola región, devuelve su Name y su TypeName', () => {
	const clipping = makeClipping([{ Id: 1, Name: 'San Fabián', TypeName: 'Localidad' }]);
	expect(clipping.GetClippingName()).toBe('San Fabián');
	expect(clipping.GetClippingTypeName()).toBe('Localidad');
});

it('con varias regiones, junta los Name y los TypeName con coma', () => {
	const clipping = makeClipping([
		{ Id: 1, Name: 'San Fabián', TypeName: 'Localidad' },
		{ Id: 2, Name: 'Ñuble', TypeName: 'Región' },
	]);
	expect(clipping.GetClippingName()).toBe('San Fabián, Ñuble');
	expect(clipping.GetClippingTypeName()).toBe('Localidad, Región');
});

it('sin regiones, o con Name null, GetClippingName devuelve null', () => {
	expect(makeClipping([]).GetClippingName()).toBeNull();
	expect(makeClipping([{ Id: 1, Name: null, TypeName: 'Localidad' }]).GetClippingName()).toBeNull();
});

describe('Clipping.ProcessClipping: registra el reciente con el TypeName como subtítulo');

it('llama a Recents.RegisterClippingRegion con el nombre y el/los TypeName, para distinguir regiones homónimas', () => {
	const segMap = setupWindow();
	const registerCalls = [];
	segMap.Recents = { RegisterClippingRegion(ids, name, subtitle) { registerCalls.push({ ids, name, subtitle }); } };
	segMap.UpdateMapLevels = function () {};

	const fakeThis = {
		frame: { ClippingRegionIds: [10, 20] },
		clipping: {},
		GetClippingName: Clipping.prototype.GetClippingName,
		GetClippingTypeName: Clipping.prototype.GetClippingTypeName,
		FitCurrentRegion() {},
		SetClippingCanvas() {},
	};
	const data = {
		Canvas: null,
		Summary: {
			Regions: [
				{ Id: 10, Name: 'San Fabián', TypeName: 'Localidad' },
				{ Id: 20, Name: 'San Fabián', TypeName: 'Comuna' },
			],
		},
	};

	Clipping.prototype.ProcessClipping.call(fakeThis, data, false, false);

	expect(registerCalls).toHaveLength(1);
	expect(registerCalls[0].name).toBe('San Fabián, San Fabián');
	expect(registerCalls[0].subtitle).toBe('Localidad, Comuna');
});

it('sin nombre (Region.Summary sin regiones), no registra ningún reciente', () => {
	const segMap = setupWindow();
	const registerCalls = [];
	segMap.Recents = { RegisterClippingRegion(ids, name, subtitle) { registerCalls.push({ ids, name, subtitle }); } };
	segMap.UpdateMapLevels = function () {};

	const fakeThis = {
		frame: { ClippingRegionIds: [10] },
		clipping: {},
		GetClippingName: Clipping.prototype.GetClippingName,
		GetClippingTypeName: Clipping.prototype.GetClippingTypeName,
		FitCurrentRegion() {},
		SetClippingCanvas() {},
	};
	const data = { Canvas: null, Summary: { Regions: [] } };

	Clipping.prototype.ProcessClipping.call(fakeThis, data, false, false);

	expect(registerCalls).toHaveLength(0);
});
