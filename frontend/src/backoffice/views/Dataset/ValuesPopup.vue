<template>
	<div>
		<md-dialog :md-active.sync="openPopup" @md-closed="onClosed">
			<invoker ref="invoker"></invoker>
			<md-dialog-title>
				Categorías
			</md-dialog-title>

			<md-dialog-content>
				<div v-html="message"></div>

				<div v-if="doingAutoRecode" class="md-layout md-size-100">
					<div class="md-layout-item md-size-35">
						<mp-simple-text label="Nombre de la nueva variable"
										v-model="newName" @enter="save" />
					</div>
					<div class="md-layout-item md-size-10">
					</div>
					<div class="md-layout-item md-size-55">
						<mp-simple-text label="Etiqueta de la nueva variable"
											v-model="newLabel" @enter="save" />
					</div>
				</div>

				<div class="md-layout md-gutter">
					<div style="position: relative; padding-left: 10px;">
						<div v-if="canEdit && Work.CanEdit()" style="position: absolute; right: -10px">
							<md-button @click="upOnClick()" class="md-icon-button" :disabled="upDisabled">
								<md-icon>arrow_upward</md-icon>
							</md-button>
							<br/>
							<md-button @click="downOnClick()" class="md-icon-button" :disabled="downDisabled">
								<md-icon>arrow_downward</md-icon>
							</md-button>
						</div>

						<JqxGrid ref="valuesGrid" :width="490" :height="250" :source="dataAdapter" :columns="columns" :columnsresize="true"
										:columnsreorder="true" @rowselect="selectionChanged" @rowunselect="selectionChanged"
										@rowdoubleclick="showModify" :handlekeyboardnavigation="handlekeyboardnavigation"
									selectionmode='multiplerowsextended' :localization="localization">
						</JqxGrid>

						<div class="gridStatusBar">{{ statusBarText }}</div>
						<div>
							<md-button v-if="this.canEdit && this.doingAutoRecode === false" @click="create()">
								<md-icon>add_circle_outline</md-icon>
								Agregar
							</md-button>

							<md-button v-if="this.canEdit" @click="showModify()" :disabled="modifyDisabled">
								<md-icon>edit</md-icon>
								Modificar
							</md-button>

							<md-button v-if="this.canEdit" @click="deleteOnClick()" :disabled="deleteDisabled">
								<md-icon>delete</md-icon>
								Eliminar
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
			</md-dialog-content>

			<md-dialog-actions>
				<div v-if="this.canEdit">
					<md-button @click="openPopup = false">Cancelar</md-button>
					<md-button class="md-primary" @click="save()">Aceptar</md-button>
				</div>
				<div v-else>
						<md-button @click="openPopup = false">Cerrar</md-button>
				</div>

			</md-dialog-actions>
		</md-dialog>

		<md-dialog :md-active.sync="activateEdit">
			<md-dialog-title>Etiquetas</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout-item md-size-75">
					<mp-simple-text label="Valor"
								v-model="CurrentVarValue" ref="inputValue" @enter="completeEditOnClick" />
				</div>
				<div v-if="!this.doingAutoRecode" class="md-layout-item md-size-100">
					<mp-simple-text label="Etiqueta" ref="inputLabel"
							v-model="CurrentVarLabel" @enter="completeEditOnClick" />
				</div>
				<div v-else="" class="md-layout-item md-size-100">
					<label>Etiqueta: {{ CurrentVarLabel }} </label>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="completeEditOnClick">Aceptar</md-button>
			</md-dialog-actions>
		</md-dialog>

	</div>
</template>

<script>
// https://material.io/tools/icons/?style=baseline
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/js/arr';
import str from '@/common/js/str';
import Localization from '@/backoffice/classes/Localization';
import JqxGrid from 'jqwidgets-scripts/jqwidgets-vue/vue_jqxgrid.vue';
import JqxTooltip from 'jqwidgets-scripts/jqwidgets-vue/vue_jqxtooltip.vue';
// https://www.jqwidgets.com/vue/vue-grid/
var columnFormatEnum = require("@/common/enums/columnFormatEnum");

export default {
	name: 'valuesPopup',
	components: {
		JqxGrid,
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		Grid() {
			return this.$refs.valuesGrid;
		},
	},
	beforeCreate() {
		this.source = {
								localdata: [],
								datatype: 'array',
								id: 'Id',
								datafields:
										[
												{ name: 'Id', type: 'number' },
												{ name: 'Value', type: 'string' },
												{ name: 'Caption', type: 'string' },
												{ name: 'Order', type: 'string' },
												{ name: 'Count', type: 'number' },
												{ name: 'Dirty', type: 'number' }
										]
						};
	},
	methods: {
		getData() {
			if (this.bindData === null || this.bindData.length === 0) {
				return [];
			}
			var data = [];
			for(var i = 0; i < this.bindData.length; i++) {
				var row = this.bindData[i];
				var item = {'Id':	row.Id,
										'Value': row.Value,
										'Caption': row.Caption,
										'Order': row.Order,
										'Count': (row.Count === undefined ? -1 : row.Count),
										'Dirty': 0 };
				data.push(item);
			}
			return data;
		},
		selectionChanged() {
			var grid = this.Grid;
			var rowIndexes = this.selectedIndexes();
			this.modifyDisabled = (rowIndexes.length !== 1);
			this.deleteDisabled = (rowIndexes.length === 0);
			this.upDisabled = (rowIndexes.length === 0 || rowIndexes[0] === 0);
      var rowCount = (this.source ? this.source.totalrecords : 0);
			this.downDisabled = (rowIndexes.length === 0 || rowIndexes[rowIndexes.length - 1] === rowCount - 1);
			this.updateCount();
		},
		selectedIds() {
			var selectedRows = this.Grid.getselectedrowindexes();
			var ret = [];
			for(var i = 0; i < selectedRows.length; i++) {
				var selectedrowindex = selectedRows[i];
				var id = this.Grid.getrowid(selectedrowindex);
				ret.push(id);
			}
			return ret;
		},
		selectedIndexes() {
			var selectedRows = this.Grid.getselectedrowindexes();
			var ret = [];
			for(var i = 0; i < selectedRows.length; i++) {
				ret.push(selectedRows[i]);
			}
			return ret.sort(function(a, b) { return a - b; });
		},
		selectedIndex() {
			var selectedRows = this.selectedIndexes();
			if (selectedRows.length === 0) {
				return null;
			} else {
				return selectedRows[0];
			}
		},
		selectedId() {
			var selectedRows = this.selectedIds();
			if (selectedRows.length === 0) {
				return null;
			} else {
				return selectedRows[0];
			}
		},
		selectedValueLabel() {
			var selectedRowId = this.selectedIndex();
			if (selectedRowId === null) {
				return null;
			} else {
				return this.source.localdata[selectedRowId];
			}
		},
		updateCount(rowCount) {
			if (!this.Grid) {
				return;
			}
			if (!rowCount) {
				rowCount = this.Grid.getdatainformation().rowscount;
			}
			var selectedRows = this.Grid.getselectedrowindexes();
			var sel = (selectedRows.length < 2 ? '' : selectedRows.length + ' de ');
			if (rowCount === 1) {
				this.statusBarText = '1 etiqueta.';
			} else {
				var formatted = rowCount.toLocaleString('es');
				this.statusBarText = sel + formatted + ' etiquetas.';
			}
    },
		excelBtnOnClick() {
				this.Grid.exportdata('xls', 'etiquetas');
		},
		csvBtnOnClick() {
				this.Grid.exportdata('csv', 'etiquetas');
		},
		downOnClick() {
			var selectedRows = this.selectedIndexes();
			for(var i = selectedRows.length - 1; i >= 0; i--) {
				var selectedrowindex = selectedRows[i];
				this.swapOrder(selectedrowindex, selectedrowindex + 1);
			}
			this.refreshData();
		},
		upOnClick() {
			var selectedRows = this.selectedIndexes();
			for(var i = 0; i < selectedRows.length; i++) {
				var selectedrowindex = selectedRows[i];
				this.swapOrder(selectedrowindex, selectedrowindex - 1);
			}
			this.refreshData();
		},
		onClosed() {
			if (this.destroyCallback !== null) {
				this.destroyCallback();
			}
		},
		swapOrder(row1, row2) {
			var valueLabel1 = this.source.localdata[row1];
			var valueLabel2 = this.source.localdata[row2];
			var order1 = valueLabel1.Order;
			var order2 = valueLabel2.Order;
			var value1 = valueLabel1.Value;
			var value2 = valueLabel2.Value;
			// Hace el swap
			valueLabel1.Order = order2;
			valueLabel2.Order = order1;
			valueLabel1.Dirty = 1;
			valueLabel2.Dirty = 1;
			if (this.doingAutoRecode) {
				valueLabel1.Value = value2;
				valueLabel2.Value = value1;
			}
			this.source.localdata[row1] = valueLabel2;
			this.source.localdata[row2] = valueLabel1;
			// Cambia la selección
			this.Grid.selectrow(row2);
			this.Grid.unselectrow(row1);
		},
		handlekeyboardnavigation(event) {
			if (!this.canEdit) {
				return false;
			}
      var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
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
				this.deleteOnClick();
			} else if (key === ENTER && !this.modifyDisabled && this.Work.CanEdit()) {
				this.showModify();
			}
      return false;
    },
		deleteOnClick() {
			var loc = this;
			var selectedRows = this.selectedIndexes();
			for(var n = selectedRows.length - 1; n >= 0; n--) {
				if (this.source.localdata[selectedRows[n]].Id !== null)
					this.deletedList.push(this.source.localdata[selectedRows[n]].Id);
				arr.RemoveAt(this.source.localdata, selectedRows[n]);
			}
			this.refreshData();
			loc.Grid.clearselection();
		},
		getMaxOrder() {
			var max = 1;
			for(var n = 0; n < this.source.localdata.length; n++) {
				if (this.source.localdata[n].Order > max) {
					max = this.source.localdata[n].Order;
				}
			}
			return max;
		},
		repeatedValue() {
			for(var n = 0; n < this.source.localdata.length; n++) {
				if (this.CurrentVarValue === this.source.localdata[n].Value) {
					if (this.CurrentIsNew) {
						return true;
					} else {
						var selected = this.selectedValueLabel();
						if (selected !== this.source.localdata[n]) {
							return true;
						}
					}
				}
			}
			return false;
		},
		completeEditOnClick() {
			this.CurrentVarValue = this.CurrentVarValue.trim();
			if (this.doingAutoRecode === false && this.repeatedValue()) {
				alert("Ya existe un elemento para el valor '" + this.CurrentVarValue + "'.");
				return;
			}
			if (this.column.Format == columnFormatEnum.STRING) {
				// texto
				if (this.CurrentVarValue.length > this.column.FieldWidth) {
					alert("La longitud del valor debe ser menor o igual a " + this.column.FieldWidth + " caracteres.");
					return;
				}
			} else if (this.column.Format == columnFormatEnum.NUMBER) {
				// numérico
				if (this.CurrentVarValue.indexOf('.') >= 0 || this.CurrentVarValue.indexOf(',') >= 0) {
					alert("El valor debe ser un número entero (sin decimales).");
					return;
				}
				if (this.CurrentVarValue.indexOf('-') >= 0) {
					alert("El valor debe ser un número entero positivo.");
					return;
				}
				if (str.isNumeric(this.CurrentVarValue) === false) {
					alert("El valor debe ser numérico.");
					return;
				}
			}
			var selected;
			if (this.CurrentIsNew) {
				selected = { Id: 0,
										Value: this.CurrentVarValue,
										Caption: this.CurrentVarLabel,
										Order: this.getMaxOrder() + 1,
										Count: 0,
										Dirty: 1 };
				this.source.localdata.push(selected);
				this.refreshData();
				this.Grid.clearselection();
				this.Grid.selectrow(this.source.localdata.length - 1);
		} else {
				selected = this.selectedValueLabel();
				selected.Value = this.CurrentVarValue;
				selected.Caption = this.CurrentVarLabel;
				selected.Dirty = 1;
				this.refreshData();
			}
			this.activateEdit = false;
		},
		showError(text) {
			this.hideWait();
			alert('No se ha podido realizar la operación. ' + text);
		},
		create() {
			this.CurrentVarValue = '';
			this.CurrentVarLabel = '';
			this.CurrentIsNew = true;
			this.activateEdit = true;
			setTimeout(() => {
				this.$refs.inputValue.focus();
			}, 100);
		},
		showModify() {
			var selectedRow = this.selectedIndex();
			if (selectedRow === null) {
				return;
			}
			var col = this.source.localdata[selectedRow];
			this.CurrentVarValue = col.Value;
			this.CurrentVarLabel = col.Caption;
			this.CurrentIsNew = false;
			this.activateEdit = true;
			setTimeout(() => {
				this.$refs.inputLabel.focus();
			}, 100);
		},
		getDirtyList() {
			var ret = [];
			for(var n = 0; n < this.source.localdata.length; n++) {
				if (this.source.localdata[n].Dirty === 1) {
					ret.push(this.source.localdata[n]);
				}
			}
			return ret;
		},
		save() {
			var loc = this;
			if (this.doingAutoRecode) {
				if (this.Dataset.GetColumnFromVariable(loc.newName, false) !== null) {
					alert('Ya existe una variable con ese nombre de variable.');
					return;
				}
			}
			this.$refs.invoker.call( function(closeInvoke) {
					if (loc.doingAutoRecode) {
						loc.Dataset.AutoRecodeValues(loc.column, loc.source.localdata, loc.newName, loc.newLabel).then(
								function(data) {
									loc.Dataset.ReloadColumns();
									loc.openPopup = false;
									closeInvoke();
							});
					} else {
						loc.Dataset.UpdateLabels(loc.column, loc.getDirtyList(), loc.deletedList).then(function(data) {
									loc.Dataset.Labels[loc.column.Id] = data;
									loc.reloadRowCallback(data);
									loc.openPopup = false;
									closeInvoke();
							});
					}
			});
	  },
		loadData() {
			this.source.localdata = this.getData();
			this.source.totalrecords = this.source.localdata.length;
			if (this.doingAutoRecode) {
				this.Grid.showcolumn('Count');
			} else {
				this.Grid.hidecolumn('Count');
			}
			this.Grid.updatebounddata();
			this.hideWait();
			this.updateCount();
		},
		refreshData() {
			this.Grid.updatebounddata();
			this.hideWait();
			this.updateCount();
		},
		show(column, valueList, canEdit, reloadCallback, destroyCallback) {
			this.canEdit = canEdit;
			this.column = column;
			this.bindData = f.clone(valueList);
			this.reloadRowCallback = reloadCallback;
			this.destroyCallback = destroyCallback;
			if (this.doingAutorecode) {
				this.message = "<p>La variable seleccionada serán utilizada para crear una variable numérica con etiquetas.</p>"
												+"<p>Este proceso reemplazará los valores de texto por números secuenciales (1, 2, 3, ..) generando "
												+"etiquetas para los valores con los textos actuales.</p>";
			} else {
				this.message = "<p>Especifique las etiquetas que desea utilizar para la variable selecionada.</p>";
			}
			this.openPopup = true;
			this.$nextTick(() => {
				this.loadData();
			});
		},
		showGeographyValues(valueList, destroyCallback) {
			this.canEdit = false;
			this.column = null;
			this.bindData = valueList;
			this.reloadRowCallback = null;
			this.destroyCallback = destroyCallback;
			this.openPopup = true;
			this.$nextTick(() => {
				this.loadData();
			});
		},
		showAutoRecode(column, valueList, destroyCallback) {
			this.doingAutoRecode = true;

			this.newName = this.Dataset.GetNewUniqueVariableName(column.Variable + '_recodificada');

			this.newLabel = column.Label;
			this.show(column, valueList, true, null, destroyCallback);
		},
		showWait() {
			this.Grid.showloadelement();
		},
		hideWait() {
			this.Grid.hideloadelement();
		},
	},
	data() {
		return {
				column: null,
				canEdit: true,
				localization: new Localization().Get(),
				activateEdit: false,
				openPopup: false,
				reloadRowCallback: null,
				destroyCallback: null,
				newName: null,
				newLabel: null,
				doingAutoRecode: false,
				deletedList: [],
				// eslint-disable-next-line
				dataAdapter: new jqx.dataAdapter(this.source),
				statusBarText: '',
				upDisabled: true,
				downDisabled: true,
				CurrentIsNew: false,
				CurrentVarValue: '',
				CurrentVarLabel: '',
				bindData: null,
				message: '',
				modifyDisabled: true,
				deleteDisabled: true,
				valuesDisabled: true,
				columns: [ {
						text: 'Valor', datafield: 'Value', cellsalign: 'left', width: 120, type: 'string'
					},{
						text: 'Etiqueta', datafield: 'Caption', cellsalign: 'left', width: 270, type: 'string'
					},{
						text: 'Ocurrencias', datafield: 'Count', cellsalign: 'center', width: 80, type: 'int'
					}]
		};
	},
};
</script>

<style rel='stylesheet/scss' lang='scss' scoped>
</style>
