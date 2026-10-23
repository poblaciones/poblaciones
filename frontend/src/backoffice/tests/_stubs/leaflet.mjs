// Doble de Leaflet: lo mínimo que los módulos ejecutan al importarse. Los tests
// no ejercitan mapas; GridLayer.extend devuelve una clase vacía.
const L = {
	GridLayer: { extend() { return class GridLayerStub {}; }, prototype: {} },
	Icon: { Default: { prototype: { _getIconUrl: function () {} }, mergeOptions() {} } },
	extend(target, ...sources) { return Object.assign(target, ...sources); },
};

export default L;
