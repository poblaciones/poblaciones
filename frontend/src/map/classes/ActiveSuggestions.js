import BoundariesComposer from '@/map/composers/BoundariesComposer';

import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';

export default ActiveSuggestions;


function ActiveSuggestions(config, navigationId) {
	this.minScore = config.minScore || 0.3;
	this.maxSuggestions = config.maxSuggestions || 5;

	this.navigationId = navigationId;
	this.sessionFingerprint = this.generateFingerprint();
	this.contentActionsCount = 0;
	this.recentActions = [];
	this.lastActionTime = Date.now();
}

ActiveSuggestions.prototype.generateFingerprint = function () {
	return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

ActiveSuggestions.prototype.RegisterAction = function (actionType, actionName, actionValue) {
	if (!this.Enabled()) {
		return;
	}
	this.lastActionTime = Date.now();

	if (actionType === 'Content') {
		this.contentActionsCount++;
	}

	this.recentActions.push({
		type: actionType,
		name: actionName,
		value: actionValue
	});

	if (this.recentActions.length > 5) {
		this.recentActions.shift();
	}
};

ActiveSuggestions.prototype.prepareParams = function () {
	var regionIds = [];
	if (window.SegMap.Clipping.FrameHasNoClipping() === false && window.SegMap.frame.ClippingRegionIds) {
		regionIds = window.SegMap.frame.ClippingRegionIds;
	}
	// Obtiene los Ids de lo activo
	var boundaryIds = [];
	var metricIds = [];
	var variablesIds = [];
	for (var n = 0; n < window.SegMap.Metrics.metrics.length; n++) {
		var activeSelectedElement = window.SegMap.Metrics.metrics[n];
		if (activeSelectedElement.isBoundary) {
			boundaryIds.push(activeSelectedElement.properties.Id);
		} else if (!activeSelectedElement.isBaseMetric) {
			metricIds.push(activeSelectedElement.properties.Metric.Id);
			if (activeSelectedElement.HasSelectedVariable()) {
				variablesIds.push(activeSelectedElement.SelectedVariable().Id);
			}
		}
	}
	// Listo
	return {
		navigation_id: this.navigationId,
		session_fingerprint: this.sessionFingerprint,
		current_metrics: metricIds,
		current_variables: variablesIds,
		current_clipping_regions: regionIds,
		current_boundaries: boundaryIds,
		current_zoom: window.SegMap.frame.Zoom,

		recent_actions: this.recentActions,
		content_actions_count: this.contentActionsCount,
		time_since_last_action_ms: Date.now() - this.lastActionTime,
		is_mobile: window.innerWidth < 768,
		screen_width: window.innerWidth
	};
};

ActiveSuggestions.prototype.formatSuggestions = function (suggestions) {
	var loc = this;
	return suggestions.map(function (s) {
		return {
			Id: s.Id,
			Type: s.Type,
			Value: s.Value,
			MetricId: s.MetricId,
			Action: s.Action,
			Score: s.Score,
			Reason: s.Reason,
			Rank: s.Rank,
			Label: loc.formatSuggestionLabel(s),
			Icon: loc.getSuggestionIcon(s.Type),
			ScorePercent: Math.round(s.Score * 100)
		};
	});
};

ActiveSuggestions.prototype.formatSuggestionLabel = function (suggestion) {
	switch (suggestion.Type) {
		case 'metric':
			return 'Ver ' + suggestion.Caption;
		case 'variable':
			return 'Explorar: ' + suggestion.Caption;
		case 'region':
			return 'Ir a ' + suggestion.Caption;
		case 'boundary':
			return 'Incorporar ' + suggestion.Caption;
		default:
			return 'Sugerencia';
	}
};

ActiveSuggestions.prototype.getSuggestionIcon = function (type) {
	var icons = {
		metric: '📊',
		variable: '🔍',
		region: '📍',
		boundary: '🗺️'
	};
	return icons[type] || '💡';
};

ActiveSuggestions.prototype.requestSuggestions = function () {
	if (!this.Enabled()) {
		throw new Error('Sugerencias no habilitadas');
	}

	var context = this.prepareParams();
	var loc = this;
	return window.SegMap.Post(window.host + '/services/suggestions/GetSuggestions', {
		context,
	}).then(function (res) {

		var data = res.data;
		if (data.should_suggest && data.suggestions.length > 0) {
			var filtered = data.suggestions
				.filter(function (s) { return s.Score >= loc.minScore; })
				.slice(0, loc.maxSuggestions);

			if (filtered.length > 0) {
				return {
					suggestions: loc.formatSuggestions(filtered),
					reason: data.trigger_reason
				};
			}
		}
		return null;

	}).catch(function (error) {
		err.errDialog('GetSuggestions', 'obtener sugerencias para el usuario', error);
	});
};

ActiveSuggestions.prototype.Enabled = function () {
	if (!this.config || !this.config.useSuggestions) {
		return false;
	} else if (loc.config.Suggestions.selectedUsers.length == 0) {
		return true;
	} else {
		return this.config.selectedUsers.includes(window.Context.User.User);
	}
};

ActiveSuggestions.prototype.SendFeedback = function (suggestionId, accepted, timeToDecisionMs) {
	if (!this.Enabled()) {
		throw new Error('Sugerencias no habilitadas');
	}

	var args = {
		suggestion_id: suggestionId,
		accepted: accepted,
		time_to_decision_ms: timeToDecisionMs || null
	};

	return window.SegMap.Post(window.host + '/services/suggestions/RegisterFeedback', args ).then(function (res) {
		return;
	}).catch(function (error) {
		err.errDialog('RegisterFeedback', 'registrar el uso de sugerencias', error);
	});
};

ActiveSuggestions.prototype.SendFeedbackMany = function (suggestionIds, accepted, timeToDecisionMs) {
	var args = {
		suggestion_ids: suggestionIds,
		accepted: accepted,
		time_to_decision_ms: timeToDecisionMs || null
	};
	return window.SegMap.Post(window.host + '/services/suggestions/RegisterFeedbackMany', {
		params: args,
	}).then(function (res) {
		return;
	}).catch(function (error) {
		err.errDialog('RegisterFeedback', 'registrar el uso de sugerencias', error);
	});
};

