// Fábricas compartidas por las suites de ActiveDataset.
import ActiveDataset from '@/backoffice/classes/ActiveDataset';

export const BASE = 'https://api.example.org/services/backoffice/';

export function makeWork(datasets) {
	return {
		changed: 0,
		WorkChanged() {
			this.changed++;
		},
		Datasets: datasets || [],
		MetricVersions: {
			refreshed: 0,
			Refresh() {
				this.refreshed++;
			},
		},
	};
}

export function makeActive(propertyOverrides, work) {
	const properties = Object.assign({ Id: 5, Caption: 'Dataset', Type: 'R', MultilevelMatrix: null }, propertyOverrides);
	return new ActiveDataset(work || makeWork(), properties);
}

export function makeColumn(id, variable, format, overrides) {
	return Object.assign({
		Id: id, Variable: variable, Caption: variable, Label: '', Format: format, Decimals: 0, Alignment: 0, ColumnWidth: 10,
	}, overrides);
}

export function captionsOf(list) {
	return list.map(function (item) { return item.Caption; });
}

export function idsOf(list) {
	return list.map(function (item) { return item.Id; });
}
