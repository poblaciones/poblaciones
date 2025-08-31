import str from '@/common/framework/str';

import ActionManagerBase from './ActionManagerBase';

export default ContentActions;

function ContentActions(session) {
	ActionManagerBase.call(this, session, 'Content');
};

ContentActions.prototype = Object.create(ActionManagerBase.prototype);

ContentActions.prototype.AddMetric = function (metricId) {
	this.RegisterAction('AddMetric', metricId);
	this.Summary.MetricAdded();
};

ContentActions.prototype.AddBaseMetric = function (metricId) {
	this.RegisterAction('AddBaseMetric', metricId);
	this.Summary.BaseMetricAdded();
};

ContentActions.prototype.AddBoundary = function (boundaryId) {
	this.RegisterAction('AddBoundary', boundaryId);
	this.Summary.BoundaryAdded();
};

ContentActions.prototype.RemoveBoundary = function (boundaryId) {
	this.RegisterAction('RemoveBoundary', boundaryId);
};

ContentActions.prototype.SelectVariable = function (variableId) {
	this.RegisterAction('SelectVariable', variableId);
};


ContentActions.prototype.SelectBoundarySerie = function (serie) {
	if (!serie) {
		return;
	}
	this.RegisterActionChange('SelectBoundarySerie', serie.Version.Name);
	this.Summary.SerieSelected(serie.Version.Name);
};

ContentActions.prototype.SelectSerie = function (serie) {
	if (!serie) {
		return;
	}
	this.RegisterActionChange('SelectSerie', serie.Version.Name);
	this.Summary.SerieSelected(serie.Version.Name);
};


ContentActions.prototype.SelectBoundarySerie = function (serie) {
	if (!serie) {
		return;
	}
	this.RegisterActionChange('SelectBoundarySerie', serie.Name);
	this.Summary.SerieSelected(serie.Name);
};

ContentActions.prototype.RemoveBaseMetric = function (metricId) {
	this.RegisterAction('RemoveBaseMetric', metricId);
};

ContentActions.prototype.RemoveMetric = function (metricId) {
	this.RegisterAction('RemoveMetric', metricId);
};

ContentActions.prototype.SelectFeature = function (fid, metricId = null, variableId = null) {
	this.RegisterAction('SelectFeature', { featureId: fid, metricId: metricId, variableId: variableId});
	this.Summary.FeatureSelected();
};

ContentActions.prototype.SelectRegion = function (regionIds) {
	this.RegisterAction('SelectRegions', regionIds);
	this.Summary.RegionSelected();
};

ContentActions.prototype.ClearRegions = function (regionIds) {
	this.RegisterAction('ClearRegions', regionIds);
};

ContentActions.prototype.SelectCircle = function (circle) {
	this.RegisterAction('SelectCircle', circle );
	this.Summary.CircleSelected();
};

ContentActions.prototype.ClearCircle = function () {
	this.RegisterAction('ClearCircle', null);
};

ContentActions.prototype.OpenMetadata = function () {
	this.RegisterAction('Metadata', null);
	this.Summary.Metadata();
};

ContentActions.prototype.Download = function (format) {
	this.RegisterAction('Download', format);
	this.Summary.Download();
};
