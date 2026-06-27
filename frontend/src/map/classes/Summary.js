import LocationsComposer from '@/map/composers/LocationsComposer';
import DataShapeComposer from '@/map/composers/DataShapeComposer';
import SegmentsComposer from '@/map/composers/SegmentsComposer';
import ActiveMetric from './ActiveMetric';
import Compare from './Compare.js';
import Vue from 'vue';

import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';


export default Summary;

function Summary(selectedMetric) {
	// Pone lo específico
	this.metric = selectedMetric;
};

Summary.prototype.getValueFormatted = function (value, decimals) {
		if (this.metric.properties.SummaryMetric === 'N') {
			return h.formatNum(value, decimals);
		} else if (this.metric.properties.SummaryMetric === 'T') {
			return h.formatPercentNumber(value);
		} else if (this.metric.properties.SummaryMetric === 'I') {
			return h.formatPercentNumber(value);
		} else if (this.metric.properties.SummaryMetric === 'P') {
			return h.formatPercentNumber(value);
		} else if (this.metric.properties.SummaryMetric === 'K') {
			return h.formatKm(value);
		} else if (this.metric.properties.SummaryMetric === 'H') {
			return h.formatKm(value);
		} else if (this.metric.properties.SummaryMetric === 'A') {
			return h.formatPercentNumber(value);
		} else if (this.metric.properties.SummaryMetric === 'D') {
			return h.formatKm(value);
		} else {
			return '';
		}
	};

Summary.prototype.getFormat = function (variable) {
	var format = 'num';
	switch (this.metric.properties.SummaryMetric) {
		case 'D':
		case 'N':
		case 'T':
			format = 'num';
			break;
		case 'K':
		case 'H':
			format = 'km';
			break;
		case 'P':
		case 'A':
			format = '%';
			break;
		case 'I':
			switch (variable.NormalizationScale) {
				case 100:
					format = '%100';
					break;
				case 1:
					format = '%1';
					break;
				case 1000:
					format = '%1000';
					break;
				case 10000:
					format = '%10000';
					break;
				case 100000:
					format = '%100000';
					break;
			}
	}
	return format;
};

Summary.prototype.getValueHeader = function (variable) {
	var delta = (this.metric.Compare.Active ? 'Δ ' : '');
	switch (this.metric.properties.SummaryMetric) {
		case 'K':
			return 'Km<sup>2</sup>';
		case 'H':
			return 'Ha';
		case 'A':
			return '% Km<sup>2</sup>';
		case 'P':
			return 'COL %';
		case 'I':
			return h.getColumnHeader(variable, this.metric.Compare.Active);
		case 'D':
			return 'N/Km<sup>2</sup>';
		case 'T':
			return 'T';
		case 'N':
			return 'N';
		default:
			return '?';
	}
};

Summary.prototype.getValue = function (variable, variableValueLabels, values, labels) {
	if (this.metric.Compare.Active && this.metric.properties.SummaryMetric === 'I') {
		var tuple = this.getValueTuple(variable, values, labels);
		var compareTuple = h.buildValueTuple(variable, {
			Value:    values.ValueCompare,
			Total:    values.TotalCompare,
			ValueGap: values.ValueCompareGap,
			TotalGap: values.TotalCompareGap
		});
		var useProportionalDelta = this.metric.Compare.UseProportionalDelta(this.metric.SelectedVariable());
		return h.calculateCompareValue(useProportionalDelta, tuple, compareTuple);
	} else {
		return h.calculateValue(this.getValueTuple(variable, values, labels));
	}
};

Summary.prototype.getTotal = function (variable, variableValueLabels) {
	// calcula el total para barras azules
	var loc = this;
	var percTotal = 0;
	for (var label of variableValueLabels) {
		percTotal += Number(Math.abs(loc.getValue(variable, variableValueLabels, label.Values, variableValueLabels)));
	};
	// calcula el total general
	var total = null, value = 0, totalCompare = null, valueCompare = null;
	var labels = variableValueLabels;
	labels.forEach(function (label) {
		var tuple = loc.getValueTuple(variable, label.Values, labels);
		if (tuple.normalization !== undefined) {
			total = (total == null ? 0 : total) + tuple.normalization;
		}
		if (tuple.normalizationCompare !== undefined) {
			totalCompare = (total == null ? 0 : totalCompare) + tuple.normalizationCompare;
		}
		if (tuple.valueCompare !== undefined) {
			valueCompare = (valueCompare == null ? 0 : valueCompare) + tuple.valueCompare;
		}
		value += Number(tuple.value);
	});
	var totalTuple = { value: value, normalization: total };
	var aniTotal = 100;
	if (this.metric.properties.SummaryMetric == 'I' && this.metric.Compare.Active) {
		// calcula la diferencia en puntos porcentajes o %
		var compareTuple = { value: valueCompare, normalization: totalCompare };
		var useProportionalDelta = this.metric.Compare.UseProportionalDelta(this.metric.SelectedVariable());
		aniTotal = h.calculateCompareValue(useProportionalDelta, totalTuple, compareTuple);
	} else if (this.metric.properties.SummaryMetric !== 'P' && this.metric.properties.SummaryMetric !== 'A') {
		aniTotal = h.calculateValue(totalTuple);
	}
	// devuelve el par
	return {
		aniTotal: aniTotal,
		percTotal: percTotal
	};
};

/* privada */
Summary.prototype.getValueTuple = function (variable, values, labels) {
	var area = Number(values.Km2);
	var N = values.Value;
	if (variable.IsGap)
		N += (values.ValueGap ?? 0);
	if (this.metric.properties.SummaryMetric === 'N') {
		return { value: N };
	} else if (this.metric.properties.SummaryMetric === 'T') {
		if (!variable.IsGap || (variable.IsGap && variable.HasGapSameTotal))
			return { value: values.Total };
		else
			return { value: values.Total + values.TotalGap };
	} else if (this.metric.properties.SummaryMetric === 'P') {
		let tot = 0;
		labels.forEach(function (label) {
			var tvalue = label.Values.Value;
			if (variable.IsGap)
				tvalue += (label.Values.ValueGap ?? 0);
			tot += Math.abs(Number(tvalue));
		});
		return { value: Math.abs(N), normalization: tot / 100 };
	} else if (this.metric.properties.SummaryMetric === 'K') {
		return { value: area };
	} else if (this.metric.properties.SummaryMetric === 'I') {
		var tuple = h.buildValueTuple(variable, values);
		if (this.metric.Compare.Active) {
			var compareTuple = h.buildValueTuple(variable, {
				Value: values.ValueCompare,
				Total: values.TotalCompare,
				ValueGap: values.ValueCompareGap,
				TotalGap: values.TotalCompareGap
			});
			tuple.valueCompare          = compareTuple.value;
			tuple.normalizationCompare  = compareTuple.normalization;
			if (variable.IsGap) {
				tuple.valueCompareGap         = compareTuple.valueGap;
				tuple.normalizationCompareGap = compareTuple.normalizationGap;
			}
		}
		return tuple;
	} else if (this.metric.properties.SummaryMetric === 'H') {
		return { value: area, normalization: 0.01 };
	} else if (this.metric.properties.SummaryMetric === 'A') {
		var tot2 = 0;
		labels.forEach(function (label) {
			tot2 += Number(label.Values.Km2);
		});
		return { value: area, normalization: tot2 / 100 };
	} else if (this.metric.properties.SummaryMetric === 'D') {
		return { value: N, normalization: area };
	} else {
		return { value: 0 };
	}
};
