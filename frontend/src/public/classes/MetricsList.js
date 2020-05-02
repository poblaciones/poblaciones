import arr from '@/common/js/arr';

export default MetricsList;

function MetricsList(map, selectedMetricCollection) {
	this.map = map;
	this.metrics = selectedMetricCollection;

	this.BaseGeoShapesSegment = [];
	this.BaseLocationsSegment = [];
	this.GeoShapesSegment = [];
	this.PatternsSegment = [];
	this.LocationsSegment = [];
	this.LabelsSegment = [];
	this.ClippingSegment = [];

	this.segments = [
		this.LabelsSegment,
		this.BaseGeoShapesSegment,
		this.GeoShapesSegment,
		this.PatternsSegment,
		this.BaseLocationsSegment,
		this.LocationsSegment,
		this.ClippingSegment
	];
};
MetricsList.prototype.AddStandardMetric = function (activeMetric) {
	this.InsertStandardMetric(activeMetric, 0);
	window.SegMap.SaveRoute.UpdateRoute();
};
MetricsList.prototype.AppendStandardMetric = function (activeMetric) {
	this.InsertStandardMetric(activeMetric, this.metrics.length);
	window.SegMap.SaveRoute.UpdateRoute();
};
MetricsList.prototype.InsertStandardMetric = function (activeMetric, i) {
	this.doInsert(activeMetric, i, true);
};
MetricsList.prototype.InsertBaseMetric = function (activeMetric, i) {
	this.doInsert(activeMetric, i, false);
};
MetricsList.prototype.AppendNonStandardMetric = function (activeMetric) {
	this.InsertNonStandardMetric(activeMetric, this.metrics.length);
};
MetricsList.prototype.InsertNonStandardMetric = function (activeMetric, i) {
	this.doInsert(activeMetric, i, false);
};

MetricsList.prototype.doInsert = function (activeMetric, i, insertInMetrics) {
	activeMetric.ResolveSegment();
	var segment = activeMetric.$Segment;
	if (i === -1) {
		i = segment.length;
	}
	if (activeMetric.Visible()) {
		var segmentPos = this.CalculateSegmentPosition(segment, i);
		arr.InsertAt(segment, segmentPos, activeMetric);
		if (this.map.MapsApi !== null) {
			var mapPos = this.CalculateMapPosition(segment, segmentPos);
			this.map.MapsApi.InsertSelectedMetricOverlay(activeMetric, mapPos);
		}
	}
	if (insertInMetrics) {
		arr.InsertAt(this.metrics, i, activeMetric);
		this.updateMetricIndexes();
		activeMetric.UpdateSummary();
		activeMetric.UpdateRanking();
	}
};

MetricsList.prototype.CalculateSegmentPosition = function (segment, index) {
	for (let i = segment.length - 1; i >= 0; i--) {
		if (segment[i].index < index) {
			return i;
		}
	}
	return segment.length;
};

MetricsList.prototype.CalculateMapPosition = function (segment, segmentPos) {
	var ret = 0;
	for (var i = 0; i < this.segments.length; i++) {
		if (this.segments[i] === segment) {
			break;
		}
		ret += this.segments[i].length;
	}
	return ret + segmentPos;
};

MetricsList.prototype.ClearSegment = function (segment) {
	for (var m = segment.length - 1; m >= 0; m--) {
		this.doRemove(segment[m]);
	}
};
MetricsList.prototype.ClearUserMetrics = function () {
	this.ClearSegment(this.GeoShapesSegment);
	this.ClearSegment(this.PatternsSegment);
	this.ClearSegment(this.LocationsSegment);
};


MetricsList.prototype.GetMetricById = function (metricId) {
	for (var i = 0; i < this.metrics.length; i++) {
		if (this.metrics[i].properties.Metric.Id == metricId) {
			return this.metrics[i];
		}
	}
	return null;
};

MetricsList.prototype.updateMetricIndexes = function () {
	for (var i = 0; i < this.metrics.length; i++) {
		this.metrics[i].index = i;
	}
};

MetricsList.prototype.MoveFrom = function (oldIndex, newIndex) {
	var activeMetric = this.metrics[oldIndex];
	this.Move(activeMetric, newIndex);
};

MetricsList.prototype.Move = function (activeMetric, newIndex) {
	if (activeMetric.index === newIndex) {
		return;
	}
	this.doRemove(activeMetric);
	this.InsertStandardMetric(activeMetric, newIndex);
};
MetricsList.prototype.UpdateMetric = function (activeMetric) {
	var isStandard = (this.metrics).indexOf(activeMetric) !== -1;
	var index = activeMetric.index;
	this.doRemove(activeMetric);
	if (isStandard) {
		this.InsertStandardMetric(activeMetric, index);
	} else {
		this.InsertNonStandardMetric(activeMetric, index);
	}
};

MetricsList.prototype.Remove = function (activeMetric, doNotUpdateRoute) {
	this.doRemove(activeMetric);
	if (!doNotUpdateRoute) {
		window.SegMap.SaveRoute.UpdateRoute();
	}
};

MetricsList.prototype.doRemove = function (activeMetric) {
	activeMetric.index = -1;
	this.removeFromSegment(activeMetric);
	arr.Remove(this.metrics, activeMetric);
	this.updateMetricIndexes();
};

MetricsList.prototype.removeFromSegment = function (activeMetric) {
	if (activeMetric.$Segment == null) { return; }

	if (this.map.MapsApi != null) {
		var segmentPos = activeMetric.$Segment.indexOf(activeMetric);
		if (segmentPos !== -1) {
			var mapPos = this.CalculateMapPosition(activeMetric.$Segment, segmentPos);
			this.map.MapsApi.RemoveOverlay(mapPos);
		}
	}
	arr.Remove(activeMetric.$Segment, activeMetric);
	activeMetric.$Segment = null;
};

MetricsList.prototype.ZoomChanged = function () {
	for (var i = 0; i < this.metrics.length; i++) {
		if (this.metrics[i].UpdateLevel()) {
			this.metrics[i].UpdateMap();
		}
	}

};

