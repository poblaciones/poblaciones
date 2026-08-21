<template>
  <div>
		<div v-if="Dataset">
			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" title="Descargar"></stepper>
			<relocate v-if="showingErrors" @relocated="relocated" ref="Relocate"></relocate>
			<fix-code v-if="showingErrors" @fixed="fixedCode" ref="FixCode"></fix-code>
			<fix-polygon v-if="showingErrors" @fixed="fixedPolygon" ref="FixPolygon"></fix-polygon>
			<import-popup ref="importPopup"></import-popup>
			<dictionary-popup v-if="!showingErrors" ref="dictionaryPopup"></dictionary-popup>
			<column-popup v-if="!showingErrors" ref="columnEdit" @completed="columnEdited"></column-popup>
			<values-popup v-if="!showingErrors && valuesPopupReset" ref="valuesPopup"></values-popup>
			<column-header-menu v-if="!showingErrors" ref="columnMenu"
													@sortAsc="menuSortAsc" @sortDesc="menuSortDesc" @sortNone="menuSortNone"
													@autoRecode="menuAutoRecode" @modify="menuModify"
													@categories="menuCategories" @delete="menuDelete" />
			<mp-confirm title="Eliminar columna"
									:text="deleteColumnText"
									confirm-text="Eliminar"
									ref="confirmColumnDialog"
									@confirm="deleteColumnConfirmed" />
			<mp-confirm title="Eliminar filas"
									text="Se removerán las filas seleccionadas. Si deseara luego recuperar estas filas deberá volver a importar los datos al dataset."
									confirm-text="Eliminar"
									ref="confirmDialog"
									@confirm="deleteOnClick" />
			<div v-if="!showingErrors" class="topGridToolbar">
				<md-button v-if="Work.CanEdit()" @click="newRow">
					<md-icon>add_circle_outline</md-icon> Nueva fila
				</md-button>
				<md-button v-if="Work.CanEdit()" @click="newColumn">
					<md-icon>add_circle_outline</md-icon> Nueva columna
				</md-button>
				<md-button v-if="Work.CanEdit()" @click="upload()">
					<md-icon>cloud_upload</md-icon> Importar
				</md-button>
			</div>
			<JqxGrid ref="activeGrid"
							 :width="gridwidth"
							 :height="(showingErrors ? 300 : 350)"
							 @bindingcomplete="bindingcomplete($event)"
							 :virtualmode="true"
							 :pageable="usePagedGrid"
							 :pagermode="('advanced')"
							 :pagesizeoptions="['25', '50', '100', '500']"
							 :pagesize="(usePagedGrid && !showingErrors ? 50 : 500)"
							 :rendergridrows="rendergridrows"
							 @rowselect="selectionChanged"
							 @rowunselect="selectionChanged"
							 @columnresized="attachHeaderMenus"
							 @columnreordered="attachHeaderMenus"
							 editmode="dblclick"
							 :editable="Work.CanEdit()"
							 :showfilterrow="true"
							 :rowsheight="22"
							 :filterable="true"
							 :columnsresize="true"
							 :showsortmenuitems="false"
							 :columnsmenu="false"
							 :sortable="true"
							 theme="metro"
							 selectionmode="multiplerowsextended"
							 :localization="localization"
							 :handlekeyboardnavigation="handlekeyboardnavigation" />
			<div class="gridStatusBar">{{ statusBarText }}</div>
			<div class="gridStatusBar">{{ problemText }}</div>
			<div :style="(showingErrors ? 'margin-bottom: -20px' : '')">
				<md-button v-if="showingErrors" @click="skipAllOnClick" :disabled="skipAllDisabled">
					<md-icon>fast_forward</md-icon> Omitir todas
				</md-button>
				<md-button v-if="showingErrors" @click="skipOnClick" :disabled="skipDisabled">
					<md-icon>skip_next</md-icon> Omitir fila(s)
				</md-button>
				<template v-if="showingErrors">
					<md-button v-if="Work.CanEdit()" @click="confirmDelete" :disabled="deleteDisabled">
						<md-icon>delete</md-icon> Borrar
					</md-button>
					<template v-if="georeferenceParameters.type == 'location'">
						<template v-if="georeferenceParameters.end.latitude">
							<md-button @click="relocate(georeferenceParameters.start)" :disabled="relocateDisabled">
								<md-icon>edit_location</md-icon> Relocalizar inicio
							</md-button>
							<md-button @click="relocate(georeferenceParameters.end)" :disabled="relocateDisabled">
								<md-icon>edit_location</md-icon> Relocalizar fin
							</md-button>
						</template>
						<md-button v-else @click="relocate(georeferenceParameters.start)" :disabled="relocateDisabled">
							<md-icon>edit_location</md-icon> Relocalizar
						</md-button>
					</template>
					<template v-if="georeferenceParameters.type == 'code'">
						<template v-if="georeferenceParameters.end.codes">
							<md-button @click="fixCode(georeferenceParameters.start)" :disabled="fixDisabled">
								<md-icon>edit</md-icon> Corregir código (inicio)
							</md-button>
							<md-button @click="fixCode(georeferenceParameters.end)" :disabled="fixDisabled">
								<md-icon>edit</md-icon> Corregir código (fin)
							</md-button>
						</template>
						<md-button v-else @click="fixCode(georeferenceParameters.start)" :disabled="fixDisabled">
							<md-icon>edit</md-icon> Corregir código
						</md-button>
					</template>
					<template v-if="georeferenceParameters.type == 'shape'">
						<md-button @click="fixPolygon()" :disabled="fixDisabled">
							<md-icon>edit</md-icon> Corregir polígono
						</md-button>
					</template>
					<md-button @click="excelBtnOnClick()">
						<md-icon>file_download</md-icon> Exportar a Excel
					</md-button>
					<md-button @click="csvBtnOnClick()">
						<md-icon>file_download</md-icon> Exportar a CSV
					</md-button>
				</template>
				<template v-else>
					<md-button v-if="Work.CanEdit()" @click="confirmDelete" :disabled="deleteDisabled">
						<md-icon>delete</md-icon> Borrar filas
					</md-button>
					<md-button @click="openDictionary">
						<md-icon>label</md-icon> Diccionario
					</md-button>
					<md-button @click="createGrid()">
						<md-icon>refresh</md-icon> Actualizar
					</md-button>
					<mp-dropdown-button label="Descargar" icon="download">
						<md-menu-item @click="startDownload('c')">CSV (.CSV)</md-menu-item>
						<md-menu-item @click="startDownload('x')">Excel (.XLSX)</md-menu-item>
						<md-menu-item @click="startDownload('s')">SPSS (.SAV)</md-menu-item>
						<md-menu-item @click="startDownload('t')">Stata (.DTA)</md-menu-item>
						<md-menu-item @click="startDownload('r')">R (.RDATA)</md-menu-item>
						<md-menu-item v-if="isShapesPolygon" @click="startDownload('gw')">GeoPackage (.GPKG)</md-menu-item>
						<md-menu-item v-if="isShapesPolygon" @click="startDownload('hw')">Shapefile (.SHP)</md-menu-item>
					</mp-dropdown-button>
				</template>
			</div>
		</div>
  </div>
</template>
<script>

import Relocate from './Relocate.vue';
import FixPolygon from './FixPolygon.vue';
import FixCode from './FixCode.vue';
import DataPager from "@/backoffice/classes/DataPager";
import ImportPopup from "@/backoffice/views/Dataset/ImportPopup";
import DictionaryPopup from "@/backoffice/views/Dataset/DictionaryPopup.vue";
import ColumnPopup from "@/backoffice/views/Dataset/ColumnPopup.vue";
import ValuesPopup from "@/backoffice/views/Dataset/ValuesPopup.vue";
import ColumnHeaderMenu from "./ColumnHeaderMenu.vue";
import MpDropdownButton from "./MpDropdownButton.vue";
import str from '@/common/framework/str';
import err from '@/common/framework/err';
import Localization from "@/backoffice/classes/Localization";

import JqxGrid from "jqwidgets-scripts/jqwidgets-vue/vue_jqxgrid.vue";
// https://www.jqwidgets.com/vue/vue-grid/

var columnFormatEnum = require("@/common/enums/columnFormatEnum");

export default {
  name: "activeGrid",
	components: {
		JqxGrid,
		FixCode,
		FixPolygon,
		ImportPopup,
		DictionaryPopup,
		ColumnPopup,
		ValuesPopup,
		ColumnHeaderMenu,
		MpDropdownButton,
		Relocate
  },
	props: {
		georeferenceParameters: { type: Object },
		showingErrors: false,
		gridwidth: {
			type: Number,
			default: 700
		}
  },
	mounted() {
		if (this.Dataset !== null && this.Dataset.Columns !== null) {
			this.createGrid();
		}
	},
  computed: {
    Dataset() {
      return window.Context.CurrentDataset;
    },
    Work() {
      return window.Context.CurrentWork;
    },
    Grid() {
      return this.$refs.activeGrid;
    },
		usePagedGrid() {
			return true; //this.showingErrors;
		},
		isShapesPolygon() {
			return this.Dataset.properties.Type == 'S';
		}
  },
  methods: {
    tooltiprenderer(element) {
      let id = `toolTipContainer${this.counter}`;
      element[0].id = id;
      var content = this.Dataset.GetLabelFromVariable(element[0].innerText);
      // eslint-disable-next-line
      setTimeout(_ =>
        jqwidgets.createInstance(`#${id}`, "jqxTooltip", {
          position: "mouse",
          content: content
        })
      );
      this.counter++;
    },
    bindingcomplete() {
			this.isBinding = false;
			this.updateCount();
			if (!this.showingErrors) {
				this.attachHeaderMenus();
			}
      if (this.requiresBinding) {
        this.requiresBinding = false;
        this.createGrid();
      }
		},
		validateCellEdit(cell, value) {
			// 1. se fija si cambió... si es igual, sale
			var column = this.Dataset.GetColumnFromVariable(cell.datafield);
			var previousValue = cell.value;
			if ('' + previousValue === '' + value) {
				return true;
			}
			// 2. valida
			if (column.Format === columnFormatEnum.NUMBER) {
				// numérico
				if (value !== '' && !str.isNumericFlex(value)) {
					return {
						result: false, message: "El valor debe ser numérico."
					};
				}
			} else if (column.Format === columnFormatEnum.STRING) {
				if (value && value.length > column.FieldWidth) {
					if (column.FieldWidth == 1) {
						return {
							result: false, message: "El valor no puede tener más de un caracter."
						};
					}
					return {
						result: false, message: "El valor no puede exceder los " + column.FieldWidth + " caracteres."
					};
				}
			}
			// cell.format: d0, '', d5 ()
			// return { result: false, message: "Quantity should be in the 0-100 interval" };

			// 3. graba
			if ('' + (previousValue === null ? '' : previousValue) !== '' + value) {
				var loc = this;
				loc.showWait();
				var setValues = [{ columnId: column.Id, value: value }];
				if (column.Format === columnFormatEnum.NUMBER && ('' + value).trim() === '') {
					setValues[0].value = null;
				}
				var currentId = this.getIdByIndex(cell.row);
				this.Dataset.UpdateRowValues(currentId, setValues).then(function () {
					loc.hideWait();
				}).catch(function () {
					loc.Grid.setcellvalue(cell.row, cell.datafield, previousValue);
					loc.DataPager.Clear();
					loc.hideWait();
				});
			}

			return true;
		},
		confirmDelete() {
			this.$refs.confirmDialog.show();
		},
		getStartDownloadUrl() {
			return window.host + '/services/backoffice/StartDatasetDownload';
		},
		getStepDownloadUrl() {
			return window.host + '/services/backoffice/StepDatasetDownload';
		},
		urlArgs(type) {
			return 't=' + type + '&d=' + this.Dataset.properties.Id + '&w=' + this.Work.properties.Id;
		},
		getFileUrl(type) {
			return window.host + '/services/backoffice/GetDatasetFile?' + this.urlArgs(type);
		},
		sendFile(type) {
			let a = document.createElement('a');
			a.style = 'display: none';
			document.body.appendChild(a);
			a.href = this.getFileUrl(type);
			a.click();
			document.body.removeChild(a);
		},
		startDownload(format) {
			var loc = this;
			var stepper = this.$refs.stepper;
			stepper.startUrl = this.getStartDownloadUrl();
			stepper.stepUrl = this.getStepDownloadUrl();
			stepper.args = { 'd': this.Dataset.properties.Id, 't': format };
			stepper.Start().then(function() {
				loc.sendFile(format);
				stepper.Close();
				});
		},
		relocate(coord) {
			// obtiene el lat/long de la fila seleccionada
			var row = this.getSelectedRowData();
			var lat = coord.latitude;
			var lon = coord.longitude;
			this.currentGeorreferenceEdit = coord;
			var latDataFields = this.Dataset.GetDataFieldByColumnId(this.showingErrors, lat);
			var lonDataFields = this.Dataset.GetDataFieldByColumnId(this.showingErrors, lon);
			this.$refs.Relocate.show(this.parseCoord(row[latDataFields.name]), this.parseCoord(row[lonDataFields.name]));
		},
		parseCoord(value) {
			var ret = ('' + value).replace(",", ".");
			if (ret == "") {
				return ret;
			} if (ret.includes('°')) {
				return this.convertToDecimal(ret);
			} else {
				return parseFloat(ret);
			}
		},
		convertToDecimal(dms) {
			dms = str.Replace(dms, ',', '.').toUpperCase();

			var deg = dms.substr(0, dms.indexOf('°'));
			var mins = dms.substr(dms.indexOf('°') + 1, dms.indexOf("'") - dms.indexOf('°') - 1);
			var secs = dms.substr(dms.indexOf("'") + 1, dms.indexOf('"') - dms.indexOf("'") - 1);

			var sign = 1 - 2 * (dms.includes('W') || dms.includes('S') || dms.includes('O'));
			return sign * (parseFloat(deg) + parseFloat(mins) / 60 + parseFloat(secs) / 3600);
		},
		relocated() {
			var loc = this;
			var lat = this.currentGeorreferenceEdit.latitude;
			var lon = this.currentGeorreferenceEdit.longitude;
			var setValues = [
									{ columnId: lat, value: this.$refs.Relocate.newLat },
									{ columnId: lon, value: this.$refs.Relocate.newLon }
									];
			loc.showWait();
			var latDataFields = loc.Dataset.GetDataFieldByColumnId(loc.showingErrors, lat);
			var lonDataFields = loc.Dataset.GetDataFieldByColumnId(loc.showingErrors, lon);

			this.updateSelectedRowValue(latDataFields.name, loc.$refs.Relocate.newLat);
			this.updateSelectedRowValue(lonDataFields.name, loc.$refs.Relocate.newLon);

			this.Dataset.UpdateRowValues(this.selectedId(), setValues).then(function() {
				loc.hideWait();
			}).catch(function () {
				loc.hideWait();
			});
		},
		fixPolygon() {
			var row = this.getSelectedRowData();
			this.$refs.FixPolygon.show(row[codeDataField.name]);
		},
		fixCode(codeRef) {
			var row = this.getSelectedRowData();
			this.currentGeorreferenceEdit = codeRef;
			var code = codeRef.codes;
			var codeDataField = this.Dataset.GetDataFieldByColumnId(this.showingErrors, code);
			this.$refs.FixCode.show(row[codeDataField.name]);
		},
		fixedCode() {
			var codeRef = this.currentGeorreferenceEdit;
			var setValues = { columnId: codeRef.codes, value: this.$refs.FixCode.newValue };
			this.UpdateValue(setValues);
		},
		fixedPolygon() {
			var newValue = this.$refs.FixPolygon.newValue;
			var setValues = { columnId: this.georeferenceParameters.polygon, value: newValue };
			this.UpdateValue(setValues);
		},
		UpdateValue(setValues) {
			var loc = this;
			loc.showWait();
			var dataField = loc.Dataset.GetDataFieldByColumnId(loc.showingErrors, setValues.columnId);
			this.updateSelectedRowValue(dataField.name, setValues.value);
			this.Dataset.UpdateRowValues(this.selectedId(), [setValues]).then(function () {
				loc.hideWait();
			}).catch(function () {
				loc.hideWait();
			});
		},
		updateSelectedRowValue(field, value) {
			var index = this.getSelectedRowIndex();
			this.Grid.setcellvalue(index, field, value);
			this.DataPager.Clear();
		},
    selectionChanged() {
      let grid = this.Grid;
      let rowIndexes = grid.getselectedrowindexes();
			this.deleteDisabled = rowIndexes.length === 0;
      this.skipDisabled = rowIndexes.length === 0;
      this.relocateDisabled = rowIndexes.length !== 1;
      this.fixDisabled = rowIndexes.length !== 1;
      this.updateCount();
    },
    updateCount(rowCount) {
      if (rowCount === undefined) {
        rowCount = this.Grid.getdatainformation().rowscount;
      }
      let selectedRows = 0;
			this.skipAllDisabled = (rowCount === 0);
			try {
        selectedRows = this.Grid.getselectedrowindexes().length;
      } catch (err) {}

      let sel = selectedRows < 2 ? "" : selectedRows + " de ";
			if (this.showingErrors) {
				if (selectedRows === 1) {
					var row = this.getSelectedRowData();
					this.problemText = '';
					if (row) {
						this.problemText = row['internal__Err'];
					}
				}
			}
      if (rowCount === 1) {
        this.statusBarText = "1 fila.";
			} else {
			  let formatted = rowCount.toLocaleString("es");
        this.statusBarText = sel + formatted + " filas.";
      }
    },
    upload() {
      this.$refs.importPopup.show();
    },
		openDictionary() {
			this.$refs.dictionaryPopup.show();
		},
		newColumn() {
			var loc = this;
			window.Context.Factory.GetCopy('Column', function (data) {
				loc.$refs.columnEdit.show(data);
			});
		},
		columnEdited() {
			this.reloadColumns();
		},
		reloadColumns() {
			this.$refs.invoker.doMessage('Obteniendo información del dataset', this.Dataset,
				this.Dataset.ReloadColumns);
		},
		// Instala en cada encabezado de columna un botón que abre el menú propio.
		// El menú nativo de jqxGrid queda desactivado (columnsmenu=false) y se
		// reemplaza por éste, que suma las acciones de columna a las de orden.
		attachHeaderMenus() {
			var loc = this;
			this.$nextTick(function () {
				var host = loc.$refs.activeGrid;
				if (!host || !host.$el) {
					return;
				}
				var headers = host.$el.querySelectorAll('.jqx-grid-column-header');
				for (var i = 0; i < headers.length; i++) {
					loc.attachOneHeaderMenu(headers[i]);
				}
			});
		},
		attachOneHeaderMenu(header) {
			if (header.getAttribute('data-mp-menu') === '1') {
				return;
			}
			if (!header.querySelector('span')) {
				return;
			}
			// jqx posiciona cada encabezado con position:absolute y left explícito;
			// no debe modificarse su position, que ya sirve de bloque contenedor.
			// El botón se agrega dentro del contenedor interno del encabezado.
			var inner = header.firstElementChild || header;
			header.setAttribute('data-mp-menu', '1');
			var loc = this;
			var btn = document.createElement('div');
			btn.className = 'mpColumnMenuButton';
			btn.title = 'Acciones de la columna';
			btn.addEventListener('mousedown', function (e) {
				e.stopPropagation();
				e.preventDefault();
			});
			btn.addEventListener('click', function (e) {
				e.stopPropagation();
				e.preventDefault();
				loc.openColumnMenu(btn);
			});
			inner.appendChild(btn);
		},
		openColumnMenu(btn) {
			// El encabezado se busca en el momento del clic: jqx vuelve a renderizar
			// su contenido al ordenar o reordenar columnas, de modo que una
			// referencia guardada al instalar el botón puede quedar obsoleta.
			var header = btn.parentNode;
			while (header && !(header.classList &&
					header.classList.contains('jqx-grid-column-header'))) {
				header = header.parentNode;
			}
			var span = (header ? header.querySelector('span') : null);
			if (!span) {
				return;
			}
			// El nombre de variable se toma del texto del span, que setRenderer
			// escribe como str.EscapeHtml(col.text), es decir la variable exacta.
			// No se usa el atributo title: allí setRenderer arma el tooltip, que
			// cuando la columna tiene etiqueta es 'Variable - Etiqueta'.
			// Tampoco se recorta, porque el nombre puede contener espacios
			// significativos y dejaría de corresponder con la columna.
			var variable = (span.textContent !== undefined ? span.textContent : span.innerText);
			var column = this.Dataset.GetColumnFromVariable(variable);
			this.$refs.columnMenu.show(column, btn.getBoundingClientRect(),
					this.currentSortDirection(column));
		},
		// El orden vigente se consulta a la grilla, para que la tilde del menú
		// sea correcta también después de recargar o de ordenar por otra vía.
		currentSortDirection(column) {
			try {
				var info = this.Grid.getsortinformation();
				if (info && info.sortcolumn === column.Variable && info.sortdirection) {
					if (info.sortdirection.ascending) {
						return 'asc';
					}
					if (info.sortdirection.descending) {
						return 'desc';
					}
				}
				return null;
			} catch (e) {
				return this.sortState[column.Variable] || null;
			}
		},
		menuSortAsc(column) {
			this.sortState = Object.assign({}, this.sortState);
			this.sortState[column.Variable] = 'asc';
			this.Grid.sortby(column.Variable, 'asc');
		},
		menuSortDesc(column) {
			this.sortState = Object.assign({}, this.sortState);
			this.sortState[column.Variable] = 'desc';
			this.Grid.sortby(column.Variable, 'desc');
		},
		menuSortNone(column) {
			this.sortState = Object.assign({}, this.sortState);
			delete this.sortState[column.Variable];
			this.Grid.removesort();
		},
		menuModify(column) {
			this.$refs.columnEdit.show(column);
		},
		menuCategories(column) {
			var loc = this;
			var values = this.Dataset.Labels[column.Id];
			if (values === undefined) {
				values = [];
			}
			this.valuesPopupReset = true;
			this.$nextTick(function () {
				loc.$refs.valuesPopup.show(column, values, loc.Work.CanEdit(),
					function () {
						loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByLabelChange(column);
						loc.valuesPopupReset = false;
						loc.reloadColumns();
					}, loc.destroyValuesCallback);
			});
		},
		destroyValuesCallback() {
			this.valuesPopupReset = false;
		},
		menuAutoRecode(column) {
			var loc = this;
			this.$refs.invoker.call(function (closeInvoke) {
				loc.Dataset.GetDistinctColumnValues(column.Id).then(function (res) {
					loc.valuesPopupReset = true;
					loc.$nextTick(function () {
						loc.$refs.valuesPopup.showAutoRecode(column, res, loc.destroyValuesCallback);
						closeInvoke();
					});
				});
			});
		},
		menuDelete(column) {
			this.pendingDeleteColumn = column;
			this.deleteColumnText = 'La columna \u00ab' + column.Variable + '\u00bb junto con sus datos ser\u00e1 eliminada. ' +
				'Si deseara luego recuperar estos valores deber\u00e1 volver a importar los datos al dataset.';
			var loc = this;
			this.$nextTick(function () {
				loc.$refs.confirmColumnDialog.show();
			});
		},
		deleteColumnConfirmed() {
			var loc = this;
			var ids = [this.pendingDeleteColumn.Id];
			loc.showWait();
			this.Dataset.DeleteColumns(ids).then(function () {
				loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByDeletedDataColumnIds(ids);
				loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByDeletedCutColumnsIds(ids);
				loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByDeletedSequenceIds(ids);
				loc.pendingDeleteColumn = null;
				loc.hideWait();
				loc.reloadColumns();
			}).catch(function () {
				loc.hideWait();
			});
		},
    createGrid() {
      if (this.isBinding) {
        this.requiresBinding = true;
        return;
      }
      this.DataPager.Clear();
      this.statusBarText = "";
      if (this.Dataset.Columns !== null) {
				this.Grid.columns = this.Dataset.GetColumnsForJqxGrid(this.showingErrors, this.validateCellEdit);

        this.isBinding = true;
        this.Grid.source = this.getAdapter();
      } else {
        this.Grid.columns = [];
        this.Grid.source = null;
      }
		},
    getAdapter() {
      const loc = this;
      let source = {
        datatype: "json",
        id: "internal__Id",
        url: this.showingErrors
          ? this.Dataset.GetErrorsUrl()
          : this.Dataset.GetDataUrl(),
        root: "Data",
        datafields: this.Dataset.GetDataFieldsForJqxGrid(this.showingErrors),
        filter() {
          loc.$refs.activeGrid.updatebounddata("filter");
        },
        sort() {
          loc.$refs.activeGrid.updatebounddata("sort");
        },
        beforeprocessing(data) {
          loc.source.totalrecords = data.TotalRows;
          loc.updateCount(data.TotalRows);
        },
        cache: false,
        loadServerData: this.fetchData
      };
      /*			source.updaterow = function(rowid, rowdata, commit) {
						// synchronize with the server - send update command
						// call commit with parameter true if the synchronization with the server is successful
						// and with parameter false if the synchronization failed.
					alert('entró por commit');
					commit(true);
				};*/
      this.source = source;
      // eslint-disable-next-line
      var dataAdapter = new jqx.dataAdapter(source);
      return dataAdapter;
    },
    fetchData(postdata, source, callback) {
      const loc = this;
      var adapter = loc.$refs.activeGrid.source;
			var callback2 = function() { loc.selectionChanged(); };
			if (this.usePagedGrid) {
				this.DataPager.FetchDirect(postdata, adapter, source, callback, callback2);
			} else {
				this.DataPager.Fetch(postdata, adapter, source, callback, callback2);
			}
		},
		excelBtnOnClick() {
			this.Grid.exportdata("xls", "dataset", true, null, false, this.Work.GetGridExportUrl());
    },
    csvBtnOnClick() {
			this.Grid.exportdata("csv", "dataset", true, null, false, this.Work.GetGridExportUrl());
    },
		deleteAllRows() {
			this.Grid.clear();
			this.DataPager.Clear();
			this.Grid.clearselection();
			this.createGrid();
			this.selectionChanged();
			this.updateCount();
		},
		deleteSelection() {
			var selected = this.gridNativeSelectedIds();
			var rowscount = this.Grid.getdatainformation().rowscount;
			for (let i = 0; i < selected.length; i++) {
				this.Grid.deleterow(selected[i]);
		  }
			this.DataPager.Clear();
      this.Grid.clearselection();
			if (rowscount === selected.length || selected.length === this.Grid.pagesize) {
				// por un error de la grilla cuando remueve todos
				// queda con información inválida.
				this.createGrid();
			}
			this.selectionChanged();
			this.updateCount();
		},
		clearSelection() {
			if (this.Grid) {
				this.Grid.clearselection();
				this.selectionChanged();
			}
		},
		newRow() {
			var loc = this;
			loc.showWait();
			this.Dataset.CreateRow().then(function (rowId) {
				loc.refreshOnClick();
				// El refresh dispara una carga asíncrona (isBinding pasa a true y
				// vuelve a false en bindingcomplete). Se espera a que termine para
				// recién ahí calcular la última página y saltar a ella.
				loc.waitBinding(function () {
					loc.jumpToLastPageAndSelect(rowId);
				});
			}).catch (function (error) {
				loc.hideWait();
				err.err('AddRow', error);
			});
		},
		// Espera a que termine el binding en curso (createGrid o gotopage
		// disparan una carga asíncrona que se resuelve en bindingcomplete,
		// donde isBinding vuelve a false).
		waitBinding(callback, attempts) {
			attempts = (attempts === undefined ? 40 : attempts);
			var loc = this;
			if (!this.isBinding) {
				callback();
				return;
			}
			if (attempts <= 0) {
				this.hideWait();
				return;
			}
			setTimeout(function () {
				loc.waitBinding(callback, attempts - 1);
			}, 50);
		},
		jumpToLastPageAndSelect(rowId) {
			var loc = this;
			var pagesize = (this.Grid && this.Grid.pagesize) || 50;
			var total = (this.source && this.source.totalrecords) || 0;
			var lastPage = Math.max(0, Math.ceil(total / pagesize) - 1);
			// Si la nueva fila ya cae en la página que se está mostrando (la
			// única, o la que quedó tras el refresh), no hace falta paginar.
			if (lastPage === 0) {
				var index = loc.findRowIndexById(rowId);
				if (index !== -1) {
					loc.selectRowByPos(index);
				}
				loc.hideWait();
				return;
			}
			this.isBinding = true;
			this.Grid.gotopage(lastPage);
			this.waitBinding(function () {
				var index2 = loc.findRowIndexById(rowId);
				if (index2 !== -1) {
					loc.selectRowByPos(index2);
				}
				loc.hideWait();
			});
		},
		findRowIndexById(rowId) {
			try {
				var rows = this.Grid.getrows();
				for (var i = 0; i < rows.length; i++) {
					if ('' + rows[i]['internal__Id'] === '' + rowId) {
						return (rows[i].boundindex !== undefined ? rows[i].boundindex : i);
					}
				}
			} catch (e) {
				// noop: si la API de la grilla no responde como se espera, se
				// deja de intentar en lugar de romper la creación de la fila.
			}
			return -1;
		},
		selectRowByPos(i) {
			this.Grid.clearselection();
			this.Grid.selectrow(i);
			this.Grid.ensurerowvisible(i);
		},
    deleteOnClick() {
      let selectedRows = this.selectedIds();
      let gridNativeSelectedIds = this.gridNativeSelectedIds();
      let loc = this;
      loc.showWait();
			this.Dataset.DeleteRows(selectedRows).then(function() {
	      loc.deleteSelection();
        loc.hideWait();
			}).catch(function () { loc.hideWait(); });
    },
    handlekeyboardnavigation(event) {
      let key = event.charCode
        ? event.charCode
        : event.keyCode
        ? event.keyCode
        : 0;
      const ENTER = 13;
      const DELETE = 46;
      /*if (key === DELETE && !this.deleteDisabled) {
				this.confirmDelete();
			} */
      return false;
    },
    showWait() {
      this.Grid.showloadelement();
    },
    hideWait() {
      this.Grid.hideloadelement();
    },
		selectedId() {
			var ids = this.selectedIds();
			if (ids.length === 0) {
				return null;
			} else {
				return ids[0];
			}
		},
		getSelectedRowIndex() {
			let selectedRowsIndexes = this.getSelectedRowIndexes();
			if (selectedRowsIndexes.length > 0) {
				return selectedRowsIndexes[0];
			} else {
				throw new Error('No hay filas seleccionadas.');
			}
		},
		getSelectedRowIndexes() {
			let selectedRows = this.Grid.getselectedrowindexes();
			var rowscount = this.Grid.getdatainformation().rowscount;
		  let ret = [];
      for (let i = 0; i < selectedRows.length; i++) {
        let selectedrowindex = selectedRows[i];
				 if (selectedrowindex >= 0 && selectedrowindex < rowscount) {
						ret.push(selectedrowindex);
					}
			}
      return ret;
    },
		selectedIds() {
      let selectedRows = this.getSelectedRowIndexes();
      let ret = [];
      for (let i = 0; i < selectedRows.length; i++) {
        let selectedrowindex = selectedRows[i];
				ret.push(this.getIdByIndex(selectedrowindex));
      }
      return ret;
		},
		getIdByIndex(rowIndex) {
			let data = this.Grid.getrowdata(rowIndex);
			return data[this.source.id];
		},
		getSelectedRowData() {
      let selectedRows = this.getSelectedRowIndexes();
      for (let i = 0; i < selectedRows.length; i++) {
        let selectedrowindex = selectedRows[i];
        return this.Grid.getrowdata(selectedrowindex);
      }
      return [];
    },
    gridNativeSelectedIds() {
      let selectedRows = this.getSelectedRowIndexes();
      let ret = [];
      for (let i = 0; i < selectedRows.length; i++) {
        let selectedrowindex = selectedRows[i];
        let id = this.Grid.getrowid(selectedrowindex);
        ret.push(id);
      }
      return ret;
    },
    skipOnClick() {
      let selectedRows = this.selectedIds();
      let gridNativeSelectedIds = this.gridNativeSelectedIds();
      let loc = this;
      loc.showWait();
      this.Dataset.SkipRows(selectedRows).then(function() {
				loc.deleteSelection();
				loc.hideWait();
			}).catch(function () { loc.hideWait(); });
    },
		skipAllOnClick() {
			let loc = this;
			loc.showWait();
			this.Dataset.SkipAllRows().then(function () {
				loc.deleteAllRows();
				loc.skipAllDisabled = true;
				loc.hideWait();
				loc.$emit('submitGrid');
			}).catch(function () { loc.hideWait(); });
		},
    refreshOnClick() {
      this.createGrid();
		},
    rendergridrows(obj) {
			var rows = obj.data;
			return rows;
    }
  },
  data() {
    return {
      localization: new Localization().Get(),
      counter: 0,
			relocateDisabled: true,
      deleteDisabled: true,
			skipDisabled: true,
			skipAllDisabled: true,
      fixDisabled: true,
      isBinding: false,
      requiresBinding: false,
      statusBarText: "",
			problemText: "",
			valuesPopupReset: false,
			pendingDeleteColumn: null,
			deleteColumnText: "",
			sortState: {},
			currentGeorreferenceEdit: {},
      DataPager: new DataPager()
    };
  },
  watch: {
    "Dataset.Columns"() {
			if (this.Dataset.Columns !== null && this.showingErrors === false) {
        this.createGrid();
      }
    }
  }
};
</script>

<style rel='stylesheet/scss' lang='scss' scoped>
.topGridToolbar {
	margin-bottom: 8px;
}

</style>

<style>
.jqx-popup {
    z-index: 5001!important;
}
/* Botón de menú propio en el encabezado. Se apoya en que jqx ya declara
   position:absolute en .jqx-grid-column-header. El triángulo se dibuja con
   borders para no depender de imágenes del tema. */
.mpColumnMenuButton {
	position: absolute;
	right: 0px;
	top: 0px;
	width: 18px !important;
	height: 100%;
	cursor: pointer;
	z-index: 5;
}
.mpColumnMenuButton:after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	margin-left: -4px;
	margin-top: -2px;
	border-left: 4px solid transparent;
	border-right: 4px solid transparent;
	border-top: 5px solid #555;
}
.mpColumnMenuButton:hover {
	background-color: rgba(0, 0, 0, 0.08);
}
/* El indicador de orden se muestra como tilde dentro del menú propio, así que
   se ocultan los íconos que jqx agrega en el encabezado (evita el segundo
   triángulo y que desplace al botón de menú). */
.jqx-grid-column-header[data-mp-menu='1'] .iconscontainer {
	display: none !important;
}

/* jqx achica el título con calc(100% - 20px) cuando la columna tiene orden o
   filtro, para dejar lugar a esos íconos; como están ocultos, se restituye el
   ancho y se reserva solo el espacio del botón de menú. */
.jqx-grid-column-header[data-mp-menu='1'] > div > div:first-child,
.jqx-grid-column-header[data-mp-menu='1'][sort] > div > div:first-child,
.jqx-grid-column-header[data-mp-menu='1'][filter] > div > div:first-child,
.jqx-grid-column-header[data-mp-menu='1'][filter][sort] > div > div:first-child {
	width: 100% !important;
	padding-right: 18px;
	box-sizing: border-box;
}
</style>
