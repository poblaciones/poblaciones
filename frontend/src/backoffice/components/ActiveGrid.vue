<template>
  <div>
    <div v-if="Dataset">
			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" title="Descargar"></stepper>
			<relocate v-if="showingErrors" @relocated="relocated" ref="Relocate"></relocate>
			<fix v-if="showingErrors" @fixed="fixed" ref="Fix"></fix>
			<import-popup ref="importPopup"></import-popup>
      <mp-confirm
        title="Eliminar filas"
        text="Se removerán las filas seleccionadas. Si deseara luego recuperar estas filas deberá volver a importar los datos al dataset."
				confirm-text="Eliminar"
        ref="confirmDialog"
        @confirm="deleteOnClick"
      />

      <JqxGrid
        ref="activeGrid"
        :width="700"
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
				editmode="dblclick"
				:editable="Work.CanEdit()"
        :showfilterrow="true"
				:rowsheight="22"
        :filterable="true"
        :columnsresize="true"
        :sortable="true"
				theme="metro"
        selectionmode="multiplerowsextended"
        :localization="localization"
        :handlekeyboardnavigation="handlekeyboardnavigation"
      />
      <div class="gridStatusBar">{{ statusBarText }}</div>
      <div class="gridStatusBar">{{ problemText }}</div>

      <div :style="(showingErrors ? 'margin-bottom: -20px' : 'margin-top: 20px')">
        <md-button v-if="Work.CanEdit() && !showingErrors" @click="upload()">
          <md-icon>cloud_upload</md-icon> Importar
        </md-button>

        <md-button v-if="showingErrors" @click="skipOnClick" :disabled="skipDisabled">
          <md-icon>skip_next</md-icon> Omitir fila(s)
        </md-button>

        <md-button v-if="Work.CanEdit()" @click="confirmDelete" :disabled="deleteDisabled">
          <md-icon>delete</md-icon> Borrar fila(s)
        </md-button>

				<md-button v-if="showingErrors && latlon && latlon.lat" @click="relocate()" :disabled="relocateDisabled">
					<md-icon>edit_location</md-icon> Relocalizar
				</md-button>

				<md-button v-if="showingErrors && code" @click="fix(!polygon)" :disabled="fixDisabled">
					<md-icon>edit</md-icon> Corregir
				</md-button>

				<md-button v-if="!showingErrors" @click="createGrid()">
          <md-icon>refresh</md-icon> Actualizar
        </md-button>

				<md-button v-if="!showingErrors" @click="startDownload('s')">
					<md-icon>import_export</md-icon> Descargar .SAV
				</md-button>

				<md-button v-if="!showingErrors" @click="startDownload('c')">
					<md-icon>import_export</md-icon> Descargar .CSV
				</md-button>

        <md-button v-if="showingErrors" @click="excelBtnOnClick()">
          <md-icon>import_export</md-icon> Exportar a Excel
        </md-button>

        <md-button v-if="showingErrors" @click="csvBtnOnClick()">
          <md-icon>import_export</md-icon> Exportar a CSV
        </md-button>
      </div>
    </div>
  </div>
</template>
<script>

import Relocate from './Relocate.vue';
import axios from "axios";
import Fix from './Fix.vue';
import DataPager from "@/backoffice/classes/DataPager";
import ImportPopup from "@/backoffice/views/Dataset/ImportPopup";

import Localization from "@/backoffice/classes/Localization";
import JqxGrid from "jqwidgets-scripts/jqwidgets-vue/vue_jqxgrid.vue";
import JqxTooltip from "jqwidgets-scripts/jqwidgets-vue/vue_jqxtooltip.vue";
// https://www.jqwidgets.com/vue/vue-grid/

export default {
  name: "activeGrid",
		components: {
		JqxGrid,
		Fix,
		ImportPopup,
		Relocate
  },
  props: {
    showingErrors: false,
		latlon: Object,
		code: Number,
		polygon: Boolean,
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
      if (this.requiresBinding) {
        this.requiresBinding = false;
        this.createGrid();
      }
		},
		validateCellEdit(cell, value) {
			// 1. se fija si cambió... si es igual, sale
			var column = this.Dataset.GetColumnFromVariable(cell.datafield);
			var setValues = [{ columnId: column.Id, value: value }];
			var previousValue = this.Grid.getcellvalue(cell.row, cell.datafield);
			if ('' + previousValue === '' + value) {
				return true;
			}
			// 2. valida

			// cell.format: d0, '', d5 ()
			// return { result: false, message: "Quantity should be in the 0-100 interval" };

			// 3. graba
			if ('' + previousValue !== '' + value) {
				var loc = this;
				loc.showWait();
				this.Dataset.UpdateRowValues(this.selectedId(), setValues).then(function () {
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
			return window.host + '/services/backoffice/StartDownload';
		},
		getStepDownloadUrl() {
			return window.host + '/services/backoffice/StepDownload';
		},
		urlArgs(type) {
			return 't=' + type + '&d=' + this.Dataset.properties.Id + '&w=' + this.Work.properties.Id;
		},
		getFileUrl(type) {
			return window.host + '/services/backoffice/GetFile?' + this.urlArgs(type);
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
		relocate() {
			// obtiene el lat/long de la fila seleccionada
			var row = this.getSelectedRowData();
			var lat = this.latlon.lat;
			var lon = this.latlon.lon;
			var latDataFields = this.Dataset.GetDataFieldByColumnId(this.showingErrors, lat);
			var lonDataFields = this.Dataset.GetDataFieldByColumnId(this.showingErrors, lon);
			this.$refs.Relocate.show(parseFloat(row[latDataFields.name]), parseFloat(row[lonDataFields.name]));
		},
		relocated() {
			var loc = this;
			var lat = this.latlon.lat;
			var lon = this.latlon.lon;
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
		fix(fixingCode) {
			var row = this.getSelectedRowData();
			var code = this.code;
			var codeDataField = this.Dataset.GetDataFieldByColumnId(this.showingErrors, this.code);
			this.$refs.Fix.show(row[codeDataField.name], fixingCode);
		},
		fixed() {
			var loc = this;
			var setValues = [
									{ columnId: this.code, value: this.$refs.Fix.newValue },
									];
			loc.showWait();
			var codeDataField = loc.Dataset.GetDataFieldByColumnId(loc.showingErrors, this.code);
			this.updateSelectedRowValue(codeDataField.name, loc.$refs.Fix.newValue);

			this.Dataset.UpdateRowValues(this.selectedId(), setValues).then(function() {
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
      this.Grid.exportdata("xls", "dataset");
    },
    csvBtnOnClick() {
      this.Grid.exportdata("csv", "dataset");
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
        let data = this.Grid.getrowdata(selectedrowindex);
        let id = data[this.source.id];
        ret.push(id);
      }
      return ret;
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
      fixDisabled: true,
      isBinding: false,
      requiresBinding: false,
      statusBarText: "",
			problemText: "",
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
</style>

<style>
.jqx-popup {
    z-index: 5001!important;
}
</style>
