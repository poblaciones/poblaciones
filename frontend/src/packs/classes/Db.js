import axiosClient from '@/common/js/axiosClient';
import ActiveMetadata from '../../backoffice/classes/ActiveMetadata';
import DbAdminBase from '@/common/classes/DbAdminBase';

export default Db;

function Db() {
	DbAdminBase.call(this);
};

Db.prototype = Object.create(DbAdminBase.prototype);
Db.prototype.constructor = Db;

Db.prototype.GetClippingRegions = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetClippingRegions',
		{}, 'obtener la lista de regiones');
};

Db.prototype.GetBoundaries = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetBoundaries',
		{}, 'obtener la lista de delimitaciones');
};

Db.prototype.UpdateBoundary = function (boundary) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateBoundary',
		{ b: boundary }, 'actualizar la delimitación').then(function () {

		});
};

Db.prototype.DeleteBoundary = function (boundary) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteBoundary',
		{ b: boundary.Id }, 'eliminar la delimitación').then(function () {

		});
};

// La versión se guarda completa en una sola operación (incluida la lista de
// regiones asociadas): el popup de edición no persiste nada hasta que se
// confirma con 'Guardar'.
Db.prototype.UpdateBoundaryVersion = function (boundaryVersion) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateBoundaryVersion',
		{ v: boundaryVersion }, 'actualizar la versión');
};

Db.prototype.DeleteBoundaryVersion = function (boundaryVersion) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteBoundaryVersion',
		{ v: boundaryVersion.Id }, 'eliminar la versión').then(function () {

		});
};

// Reordenar delimitaciones dentro de un mismo grupo (intercambia el Order
// con la vecina): mismo criterio que MetricsTab.vue para variables, en vez
// de dejar que el usuario reordene la grilla por nombre.
Db.prototype.MoveBoundaryUp = function (boundary) {
	return axiosClient.postPromise(window.host + '/services/packs/MoveBoundaryUp',
		{ b: boundary.Id }, 'mover la delimitación');
};

Db.prototype.MoveBoundaryDown = function (boundary) {
	return axiosClient.postPromise(window.host + '/services/packs/MoveBoundaryDown',
		{ b: boundary.Id }, 'mover la delimitación');
};

Db.prototype.UpdateClippingRegion = function (region) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateClippingRegion',
		{ r: region }, 'actualizar la región').then(function () {

		});
};

Db.prototype.DeleteClippingRegion = function (region) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteClippingRegion',
		{ r: region.Id }, 'eliminar la región').then(function () {

		});
};

// Analiza el archivo ya subido por partes (ver GeoPackageUpload): valida
// que contenga una única capa y, si es así, devuelve sus columnas para el
// mapeo. Si contiene más de una, el servidor responde con { Error: '...' }
// en lugar de Columns.
Db.prototype.VerifyGeoPackage = function (bucketId) {
	return axiosClient.getPromise(window.host + '/services/packs/VerifyGeoPackage',
		{ b: bucketId }, 'analizar el archivo geográfico');
};

// Alta de una región nueva a partir de un GeoPackage ya subido y mapeado:
// es un proceso de varios pasos (ver Stepper). Una región creada no vuelve
// a admitir cambiar su archivo ni su mapeo: para eso hay que eliminarla y
// crear una nueva.
Db.prototype.GetStartClippingRegionImportUrl = function () {
	return window.host + '/services/packs/StartImportClippingRegion';
};

Db.prototype.GetStepClippingRegionImportUrl = function () {
	return window.host + '/services/packs/StepImportClippingRegion';
};

Db.prototype.GetClippingRegionGeographies = function (clippingRegionId) {
	return axiosClient.getPromise(window.host + '/services/packs/GetClippingRegionGeographies',
		{ r: clippingRegionId }, 'obtener las geografías asociadas');
};

Db.prototype.DeleteClippingRegionGeography = function (item) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteClippingRegionGeography',
		{ i: item.Id }, 'eliminar la asociación').then(function () {

		});
};

// Calcula las intersecciones entre la región y cada geografía elegida
// (proceso pesado, por eso es un Stepper): se dispara como acción de
// grilla sobre una región ya existente, nunca desde un popup de edición
// todavía no confirmado.
Db.prototype.GetStartClippingRegionGeographyCalculateUrl = function () {
	return window.host + '/services/packs/StartCalculateClippingRegionGeography';
};

Db.prototype.GetStepClippingRegionGeographyCalculateUrl = function () {
	return window.host + '/services/packs/StepCalculateClippingRegionGeography';
};

Db.prototype.GetGeographyClippingRegions = function (geographyId) {
	return axiosClient.getPromise(window.host + '/services/packs/GetGeographyClippingRegions',
		{ g: geographyId }, 'obtener las regiones asociadas');
};

Db.prototype.GetClippingRegionItems = function (clippingRegionId, offset, pageSize) {
	return axiosClient.getPromise(window.host + '/services/packs/GetClippingRegionItems',
		{ r: clippingRegionId, o: offset, l: pageSize }, 'obtener los ítems');
};

Db.prototype.GetClippingRegionGeographyIntersectionItems = function (crgId, offset, pageSize) {
	return axiosClient.getPromise(window.host + '/services/packs/GetClippingRegionGeographyIntersectionItems',
		{ c: crgId, o: offset, l: pageSize }, 'obtener los ítems');
};

Db.prototype.GetGeographyTupleCalculatedItems = function (tupleId, offset, pageSize) {
	return axiosClient.getPromise(window.host + '/services/packs/GetGeographyTupleCalculatedItems',
		{ t: tupleId, o: offset, l: pageSize }, 'obtener los ítems');
};

Db.prototype.GetStartGeographyClippingRegionsCalculateUrl = function () {
	return window.host + '/services/packs/StartCalculateGeographyClippingRegions';
};

Db.prototype.GetStepGeographyClippingRegionsCalculateUrl = function () {
	return window.host + '/services/packs/StepCalculateGeographyClippingRegions';
};

// Listado propio de 'packs' (con Level, igual que ClippingRegion): se usa
// tanto para la grilla administrativa como para el picker de 'padre' al
// dar de alta una nueva geografía.
Db.prototype.GetGeographies = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetGeographies',
		{}, 'obtener la lista de geografías');
};

Db.prototype.UpdateGeography = function (geography) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateGeography',
		{ g: geography }, 'actualizar la geografía').then(function () {

		});
};

Db.prototype.DeleteGeography = function (geography) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteGeography',
		{ g: geography.Id }, 'eliminar la geografía').then(function () {

		});
};

// Alta a partir de un GeoPackage ya subido y mapeado (ver GeoPackageUpload
// y ClippingRegionPopup): mismo criterio, no admite cambiar el archivo
// después de creada.
Db.prototype.GetStartGeographyImportUrl = function () {
	return window.host + '/services/packs/StartImportGeography';
};

Db.prototype.GetStepGeographyImportUrl = function () {
	return window.host + '/services/packs/StepImportGeography';
};

// Listado liviano (Id/Caption) para el select de Gradient dentro del
// popup de Geography; también alimenta el listado administrativo de
// Gradient, que no necesita jerarquía (a diferencia de Boundary/
// ClippingRegion/Geography).
Db.prototype.GetGradients = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetGradients',
		{}, 'obtener la lista de gradientes');
};

// A diferencia de VerifyGeoPackage (capas vectoriales con columnas de
// negocio a mapear), el archivo de un gradiente es una grilla de tiles ya
// estructurada: el servidor solo valida una única tabla y devuelve el
// zoom máximo disponible (no hay Columns ni mapeo).
Db.prototype.VerifyGradientPackage = function (bucketId) {
	return axiosClient.getPromise(window.host + '/services/packs/VerifyGradientPackage',
		{ b: bucketId }, 'analizar el archivo de gradiente');
};

Db.prototype.UpdateGradient = function (gradient) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateGradient',
		{ g: gradient }, 'actualizar el gradiente').then(function () {

		});
};

Db.prototype.DeleteGradient = function (gradient) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteGradient',
		{ g: gradient.Id }, 'eliminar el gradiente').then(function () {

		});
};

Db.prototype.GetStartGradientImportUrl = function () {
	return window.host + '/services/packs/StartImportGradient';
};

Db.prototype.GetStepGradientImportUrl = function () {
	return window.host + '/services/packs/StepImportGradient';
};

// Sin jerarquía ni archivo: catálogos simples, análogos a BoundaryGroup.
Db.prototype.GetMetricGroups = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetMetricGroups',
		{}, 'obtener la lista de categorías de indicadores');
};

Db.prototype.UpdateMetricGroup = function (metricGroup) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateMetricGroup',
		{ g: metricGroup }, 'actualizar la categoría').then(function () {

		});
};

Db.prototype.DeleteMetricGroup = function (metricGroup) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteMetricGroup',
		{ g: metricGroup.Id }, 'eliminar la categoría').then(function () {

		});
};

Db.prototype.GetMetricProviders = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetMetricProviders',
		{}, 'obtener la lista de orígenes de indicadores');
};

Db.prototype.UpdateMetricProvider = function (metricProvider) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateMetricProvider',
		{ p: metricProvider }, 'actualizar el origen').then(function () {

		});
};

Db.prototype.DeleteMetricProvider = function (metricProvider) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteMetricProvider',
		{ p: metricProvider.Id }, 'eliminar el origen').then(function () {

		});
};

// GeographyTuple vincula los ítems de una geografía con su equivalente en
// una revisión anterior (p. ej. cuando cambia el nombre o el esquema de
// una división geográfica entre censos), para poder comparar series entre
// ediciones. PreviousLowerGeography es un nivel más detallado de la
// geografía anterior, usado como respaldo cuando no hay una
// correspondencia exacta contra PreviousGeography. La relación en sí
// (Geography/PreviousGeography/PreviousLowerGeography) se guarda simple;
// los ítems calculados (GeographyTupleItems) son responsabilidad de la
// acción de grilla 'Calcular' (Stepper), nunca del popup de edición.
// IMPORTANTE: esta entidad todavía no existe en el ORM (ver notas en
// GeographyTuples.vue); estos servicios no tienen contraparte hoy.
Db.prototype.GetGeographyTuples = function () {
	return axiosClient.getPromise(window.host + '/services/packs/GetGeographyTuples',
		{}, 'obtener la lista de equivalencias');
};

Db.prototype.UpdateGeographyTuple = function (geographyTuple) {
	return axiosClient.postPromise(window.host + '/services/packs/UpdateGeographyTuple',
		{ t: geographyTuple }, 'actualizar la equivalencia').then(function () {

		});
};

Db.prototype.DeleteGeographyTuple = function (geographyTuple) {
	return axiosClient.postPromise(window.host + '/services/packs/DeleteGeographyTuple',
		{ t: geographyTuple.Id }, 'eliminar la equivalencia').then(function () {

		});
};

// Recalcula los ítems por intersección geométrica (proceso pesado, por
// eso es un Stepper): borra los ítems calculados previamente para esta
// tupla y los vuelve a generar, sin tocar la relación en sí. Se puede
// correr las veces que haga falta, a diferencia del resto de los procesos
// de importación (acá no hay archivo de por medio: se recalcula contra
// geometrías que ya existen en el sistema).
Db.prototype.GetStartGeographyTupleCalculateUrl = function () {
	return window.host + '/services/packs/StartCalculateGeographyTuple';
};

Db.prototype.GetStepGeographyTupleCalculateUrl = function () {
	return window.host + '/services/packs/StepCalculateGeographyTuple';
};

Db.prototype.LoadMetadata = function (metadata) {
	return axiosClient.getPromise(window.host + '/services/packs/GetMetadata',
		{ m: metadata.Id }, 'obtener los metadatos').then(function (data) {
			var ret = new ActiveMetadata(null, data.Metadata, data);
			return ret;
		});
};
