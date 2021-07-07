<template>
	<div>
		<invoker ref="invoker"></invoker>
		<ValuesPopup v-if="valuesPopupReset" ref="valuesPopup"></ValuesPopup>
		<ColumnPopup ref="edit" @completed="completeEditOnClick"></ColumnPopup>

		<calculated-metric-wizard ref="calculatedMetricWizard">
		</calculated-metric-wizard>

		<div class="md-layout md-gutter">
			<div style="position: relative">
				<div v-if="Work.CanEdit()" style="position: absolute; left: 850px">
					<md-button @click="upOnClick()" class="md-icon-button" :disabled="upDisabled">
						<md-icon>arrow_upward</md-icon>
					</md-button>
					<br />
					<md-button @click="downOnClick()" class="md-icon-button" :disabled="downDisabled">
						<md-icon>arrow_downward</md-icon>
					</md-button>
				</div>
				<mp-confirm ref="confirmDialog"
										title="Eliminar variables"
										text="Las variables seleccionadas junto con sus datos serán eliminados. Si deseara luego recuperar estos valores deberá volver a importar los datos al dataset."
										confirm-text="Eliminar"
										@confirm="deleteOnClick" />
				<JqxGrid ref="columnsGrid" :width="850" :source="dataAdapter" :columns="columns" :columnsresize="true"
								 :columnsreorder="true" @rowselect="selectionChanged" @rowunselect="selectionChanged"
								 @rowdoubleclick="showModify" :handlekeyboardnavigation="handlekeyboardnavigation"
								 selectionmode='multiplerowsextended' :localization="localization">
				</JqxGrid>
				<div class="gridStatusBar">{{ statusBarText }}</div>
				<div>
					<md-button v-if="canEdit" @click="showNew()">
						<md-icon>add_circle_outline</md-icon>
						Nueva
					</md-button>
					<md-button v-if="canEdit" @click="showModify()" :disabled="modifyDisabled">
						<md-icon>edit</md-icon>
						Modificar
					</md-button>
					<md-button v-if="canEdit" @click="startAutoRecode" :disabled="autoRecodeDisabled">
						<md-icon>toc</md-icon>
						Auto-recodificar
					</md-button>
					<md-button v-if="calculateEnabled" @click="calculateNewMetric">
						<md-icon>search</md-icon>
						Rastreo
					</md-button>
					<md-button v-if="canEdit" @click="confirmDelete" :disabled="deleteDisabled">
						<md-icon>delete</md-icon>
						Eliminar
					</md-button>
					<md-button @click="valuesOnClick()" :disabled="valuesDisabled">
						<md-icon>ballot</md-icon>
						Categorías
					</md-button>
					<md-button @click="excelBtnOnClick()">
						<md-icon>import_export</md-icon>
						Exportar a Excel
					</md-button>
					<md-button @click="csvBtnOnClick()">
						<md-icon>import_export</md-icon>
						Exportar a CSV
					</md-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
// https://material.io/tools/icons/?style=baseline
import ValuesPopup from './ValuesPopup.vue';
import arr from '@/common/framework/arr';
import ColumnPopup from './ColumnPopup.vue';
import Localization from '@/backoffice/classes/Localization';
import CalculatedMetricWizard from './CalculatedWizard/CalculatedWizard.vue';
import JqxGrid from 'jqwidgets-scripts/jqwidgets-vue/vue_jqxgrid.vue';
import JqxTooltip from 'jqwidgets-scripts/jqwidgets-vue/vue_jqxtooltip.vue';
// https://www.jqwidgets.com/vue/vue-grid/
var columnFormatEnum = require("@/common/enums/columnFormatEnum");

export default {
	name: 'columnsGrid',
	components: {
		JqxGrid,
		ValuesPopup,
		CalculatedMetricWizard,
		ColumnPopup
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		Grid() {
			return this.$refs.columnsGrid;
		},
		calculateEnabled() {
			return window.Context.Configuration.UseCalculated;
		},
		canEdit() {
			if (window.Context.CurrentWork) {
				return window.Context.CurrentWork.CanEdit();
			} else {
				return false;
			}
		},
	},
	mounted() {
		this.loadData();
	},
	beforeCreate() {
		this.source = {
								localdata: [],
								datatype: 'array',
								id: 'Id',
								datafields:
										[
												{ name: 'Id', type: 'number', map: '0' },
												{ name: 'Variable', type: 'string', map: '1' },
												{ name: 'Summary', type: 'number', map: '2' },
												{ name: 'Format', type: 'string', map: '3' },
												{ name: 'Measure', type: 'string', map: '4' },
												{ name: 'Alignment', type: 'string', map: '5' },
												{ name: 'Decimals', type: 'number', map: '6' },
												{ name: 'ColumnWidth', type: 'number', map: '7' },
												{ name: 'FieldWidth', type: 'number', map: '8' },
												{ name: 'Label', type: 'string', map: '9' },
												{ name: 'ValueLabels', type: 'string', map: '10' },
										]
						};
	},
	methods: {
		Match(list, value) {
			var ret = arr.GetById(list, value, null);
			if (ret === null) {
				return 'No reconocido';
			} else {
				return ret.Caption;
			}
		},
		FormatToString(format) {
			return this.Match(this.Dataset.ValidFormats(), format);
		},
		MeasureToString(measure) {
			return  this.Match(this.Dataset.ValidMeasures(), measure);
		},
		AlignmentToString(alignment) {
			return  this.Match(this.Dataset.ValidAlignments(), alignment);
		},
		calculateNewMetric() {
			if (!this.Dataset.properties.Geocoded) {
				alert('Para definir un indicador calculado es necesario antes georreferenciar el dataset.');
				return;
			}
			this.$refs.calculatedMetricWizard.show();
		},
		getData() {
			if (this.Dataset === null) {
				return [];
			}
			if (this.Dataset.Columns === null || this.Dataset.Columns.length === 0) {
				return [];
			}

			let data = [];
			for(let i = 0; i < this.Dataset.Columns.length; i++) {
				let datasetColumn = this.Dataset.Columns[i];
				var row = [		datasetColumn.Id,
											datasetColumn.Variable,
											(datasetColumn.UseInSummary ? 'Sí' : 'No'),
											this.FormatToString(datasetColumn.Format),
											this.MeasureToString(datasetColumn.Measure),
											this.AlignmentToString(datasetColumn.Alignment),
											datasetColumn.Decimals,
											datasetColumn.ColumnWidth,
											datasetColumn.FieldWidth,
											datasetColumn.Label];
				// completa con los labels
				var labels = '';
				if (this.Dataset.Labels && Object.keys(this.Dataset.Labels).length > 0) {
					let dict = this.Dataset.Labels[datasetColumn.Id];
					if (dict && dict.length > 0) {
						labels = '{' + dict[0]['Value'] + ', ' + dict[0]['Caption'] + '} ...';
					}
				}
				row.push(labels);
				data.push(row);
			}
			return data;
		},
		selectionChanged() {
			let grid = this.Grid;
			let rowIndexes = this.selectedIndexes();
			this.modifyDisabled = (rowIndexes.length !== 1);
			this.valuesDisabled = (rowIndexes.length !== 1);
			this.deleteDisabled = (rowIndexes.length === 0);
			this.upDisabled = (rowIndexes.length === 0 || rowIndexes[0] === 0);
      let rowCount = (this.source ? this.source.totalrecords : 0);
			this.downDisabled = (rowIndexes.length === 0 || rowIndexes[rowIndexes.length - 1] === rowCount - 1);
			this.autoRecodeDisabled = (rowIndexes.length !== 1 || !this.allSelectedAreString());
			this.updateCount();
		},
		allSelectedAreString() {
			let selectedRows = this.selectedIds();
			let ret = [];
			for(let i = 0; i < selectedRows.length; i++) {
				let col = this.Dataset.GetColumnById(selectedRows[i]);
				if (col.Format !== columnFormatEnum.STRING) {
					return false;
				}
			}
			return true;
		},
		selectedIds() {
			let selectedRows = this.Grid.getselectedrowindexes();
			let ret = [];
			for(let i = 0; i < selectedRows.length; i++) {
				let selectedrowindex = selectedRows[i];
				let id = this.Grid.getrowid(selectedrowindex);
				ret.push(id);
			}
			return ret;
		},
		selectedIndexes() {
			let selectedRows = this.Grid.getselectedrowindexes();
			let ret = [];
			for(let i = 0; i < selectedRows.length; i++) {
				ret.push(selectedRows[i]);
			}
			return ret.sort(function(a, b) { return a - b; });
		},
		selectedId() {
			let selectedRows = this.selectedIds();
			if (selectedRows.length === 0) {
				return null;
			} else {
				return selectedRows[0];
			}
		},
		selectedColumn() {
			let selectedRowId = this.selectedId();
			if (selectedRowId === null) {
				return null;
			} else {
				return this.Dataset.GetColumnById(selectedRowId);
			}
		},
		updateCount(rowCount) {
			if (!rowCount) {
				rowCount = this.Grid.getdatainformation().rowscount;
			}
			let selectedRows = this.Grid.getselectedrowindexes();
			let sel = (selectedRows.length < 2 ? '' : selectedRows.length + ' de ');
			if (rowCount === 1) {
				this.statusBarText = '1 fila.';
			} else {
				let formatted = rowCount.toLocaleString('es');
				this.statusBarText = sel + formatted + ' filas.';
			}
    },

		excelBtnOnClick() {
				this.Grid.exportdata('xls', 'variables');
		},
		csvBtnOnClick() {
				this.Grid.exportdata('csv', 'variables');
		},
		downOnClick() {
			this.keepOrderState();
			let selectedRows = this.selectedIndexes();
			for(let i = selectedRows.length - 1; i >= 0; i--) {
				let selectedrowindex = selectedRows[i];
				this.swapOrder(selectedrowindex, selectedrowindex + 1);
			}
			this.loadData();
			this.saveOrderChanges();
		},
		upOnClick() {
			this.keepOrderState();
			let selectedRows = this.selectedIndexes();
			for(let i = 0; i < selectedRows.length; i++) {
				let selectedrowindex = selectedRows[i];
				this.swapOrder(selectedrowindex, selectedrowindex - 1);
			}
			this.loadData();
			this.saveOrderChanges();
		},
		swapOrder(row1, row2) {
			let col1 = this.Dataset.Columns[row1];
			let col2 = this.Dataset.Columns[row2];
			let order1 = col1.Order;
			let order2 = col2.Order;
			// Hace el swap
			col1.Order = order2;
			col2.Order = order1;
			this.Dataset.Columns[row1] = col2;
			this.Dataset.Columns[row2] = col1;
			// Guarda en la lista
			this.orderChangedList[col1.Id] = col1.Order;
			this.orderChangedList[col2.Id] = col2.Order;
			// Cambia la selección
			this.Grid.selectrow(row2);
			this.Grid.unselectrow(row1);
		},
		saveOrderChanges() {
			var loc = this;
			loc.showWait();
			if (loc.orderCancel !== null) {
				loc.orderCancel('cancelled');
			}
			loc.orderCancel = this.Dataset.SetColumnOrder(this.orderChangedList, function () {
				loc.hideWait();
				loc.orderCancel = null;
			}, loc.revertState);
		},
		revertState(err) {
			if (err === 'cancelled') {
				return;
			}
			this.orderCancel = null;
			this.Grid.clearselection();
			let newCols = [];
			for(let i = 0; i < this.orderRestoreColumns.length; i++) {
				let col = this.orderRestoreColumns[i].col;
				col.Order = this.orderRestoreColumns[i].order;
				newCols.push(col);
			}
			for(let i = 0; i < this.orderSelectedIndexes.length; i++) {
				this.Grid.selectrow(this.orderSelectedIndexes[i]);
			}
			this.Dataset.Columns = newCols;
			this.loadData();
			this.showError(err);
		},
		keepOrderState() {
			if (this.orderCancel !== null) {
				return;
			}
			this.orderSelectedIndexes = this.selectedIndexes();
			this.orderRestoreColumns = [];
			for(let i = 0; i < this.Dataset.Columns.length; i++) {
				this.orderRestoreColumns.push({ col: this.Dataset.Columns[i], order: this.Dataset.Columns[i].Order });
			}
			this.orderChangedList = {};
		},
		handlekeyboardnavigation(event) {
			if (this.canEdit === false) {
				return false;
			}
      let key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
			const UP = 38;
			const ENTER = 13;
			const DOWN = 40;
			const DELETE = 46;
			if (event.ctrlKey) {
				if (key === UP) {
					if (!this.upDisabled && this.Work.CanEdit()) {
						this.upOnClick();
					}
					return true;
				} else if (key === DOWN && this.Work.CanEdit()) {
					if (!this.downDisabled) {
						this.downOnClick();
					}
					return true;
				}
			} else if (key === DELETE && !this.deleteDisabled && this.Work.CanEdit()) {
				this.confirmDelete();
			} else if (key === ENTER && !this.modifyDisabled) {
				this.showModify();
			}
      return false;
    },
		confirmDelete() {
			this.$refs.confirmDialog.show();
		},
		deleteOnClick() {
			let loc = this;
			let selectedRows = this.selectedIds();

			loc.showWait();
			this.Dataset.DeleteColumns(selectedRows).then(function () {
				loc.hideWait();
				loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByDeletedDataColumnIds(selectedRows);
				loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByDeletedCutColumnsIds(selectedRows);
				loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByDeletedSequenceIds(selectedRows);
				loc.Grid.clearselection();
				loc.Grid.deleterow(selectedRows);
				loc.updateCount();
				loc.Dataset.ReloadColumns();
			}).catch(function() { loc.hideWait(); });
		},
		valuesOnClick() {
			var loc = this;
			var column = this.selectedColumn();
			var values = this.Dataset.Labels[column.Id];
			if (values === undefined) {
				values = [];
			}
			this.valuesPopupReset = true;
			this.$nextTick(() => {
				this.$refs.valuesPopup.show(column, values, this.canEdit,
						function () {
							loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByLabelChange(column);
							loc.loadData();
							loc.valuesPopupReset = false;
				}, loc.destroyCallback);
			});
		},
		destroyCallback() {
			this.valuesPopupReset = false;
		},
		startAutoRecode() {
			var loc = this;
			var col = loc.selectedColumn();
			// Obtiene los valores
      this.$refs.invoker.call(function(closeInvoke) {
						loc.Dataset.GetDistinctColumnValues(col.Id)
							.then(function(res) {
									loc.valuesPopupReset = true;
									loc.$nextTick(() => {
										loc.$refs.valuesPopup.showAutoRecode(col, res, loc.destroyCallback);
										closeInvoke();
									});
								});
							});
		},
		completeEditOnClick() {
			this.showWait();
			this.loadData();
		},
		showError(text) {
			this.hideWait();
			alert('No se ha podido realizar la operación. ' + text);
		},
		showNew() {
			var loc = this;
			window.Context.Factory.GetCopy('Column', function (data) {
				loc.$refs.edit.show(data);
			});
		},
		showModify() {
			let selectedRow = this.selectedId();
			if (selectedRow === null) {
				return;
			}
			let col = this.Dataset.GetColumnById(selectedRow);
			this.$refs.edit.show(col);
		},
		refreshOnClick() {
			this.showWait();
			this.statusBarText = '';
			this.Dataset.ReloadColumns();
		},
		loadData() {
			this.source.localdata = this.getData();
			this.source.totalrecords = this.source.localdata.length;
			this.Grid.updatebounddata();
			this.hideWait();
			this.updateCount();
		},
		showWait() {
			this.Grid.showloadelement();
		},
		hideWait() {
			this.Grid.hideloadelement();
		},
		numberrenderer(row, column, value) {
				return '<div style="text-align: center; margin-top: 9px;">' + (1 + value) + '</div>';
		},
		columnsrenderer(value) {
			return '<div style="text-align: center; cursor: pointer; margin-top: 9px;">' + value + '</div>';
		}
	},
	data() {
		return {
				orderChangedList: {},
				orderSelectedIndexes: [],
				orderRestoreColumns: [],
				orderCancel: null,
				localization: new Localization().Get(),
				activateEdit: false,
				// eslint-disable-next-line
				dataAdapter: new jqx.dataAdapter(this.source),
				statusBarText: '',
				upDisabled: true,
				downDisabled: true,
				valuesPopupReset: false,
				CurrentVarName: '',
				CurrentVarLabel: '',
				CurrentUseInSummary: false,
				autoRecodeDisabled: true,
				modifyDisabled: true,
				deleteDisabled: true,
				valuesDisabled: true,
				columns: [{
						text: '', pinned: true, exportable: false, columntype: 'number', cellclassname: 'jqx-widget-header', cellsrenderer: this.numberrenderer
					},{
						text: 'Variable', datafield: 'Variable', cellsalign: 'left', renderer: this.columnsrenderer, width: 90, type: 'string'
					},{
						text: 'Resumen', datafield: 'Summary', cellsalign: 'center', renderer: this.columnsrenderer, width: 70, type: 'bool'
					},{
						text: 'Tipo', datafield: 'Format', cellsalign: 'center', renderer: this.columnsrenderer, width: 70, type: 'string'
					},{
						text: 'Ancho', datafield: 'FieldWidth', cellsalign: 'center', renderer: this.columnsrenderer, width: 55, type: 'int'
					},{
						text: 'Decimales', datafield: 'Decimals', cellsalign: 'center', renderer: this.columnsrenderer, width: 70, type: 'int'
					},{
						text: 'Etiqueta', datafield: 'Label', cellsalign: 'left', renderer: this.columnsrenderer, width: 120, type: 'string'
					},{
						text: 'Categorías', cellsalign: 'left', datafield: 'ValueLabels', renderer: this.columnsrenderer, width: 90
					},{
						text: 'Columnas', datafield: 'ColumnWidth', cellsalign: 'center', renderer: this.columnsrenderer, width: 70, type: 'int'
					},{
						text: 'Alineación', datafield: 'Alignment', cellsalign: 'center', renderer: this.columnsrenderer, width: 70, type: 'string'
					},{
						text: 'Medida', datafield: 'Measure', cellsalign: 'center', renderer: this.columnsrenderer, width: 70, type: 'string'
					}]
		};
	},
	watch: {
		Dataset () {
			this.loadData();
		},
		'Dataset.Columns' (columns) {
			this.loadData();
		}
	}
};
</script>

<style rel='stylesheet/scss' lang='scss' scoped>
</style>
