// Identidad de instancia de las capas que van a la lista de métricas. No
// alcanza con el Id del indicador o de la delimitación: el mismo puede estar
// agregado dos veces, mirando versiones distintas. El contador es único para
// ActiveMetric y ActiveBoundary, que conviven en esa lista, así que vive acá
// y no en ninguna de las dos jerarquías (no se conocen entre sí).
var last = 0;

export default function nextLayerUid() {
	return ++last;
};
