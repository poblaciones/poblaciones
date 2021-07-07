<template>
  <div v-if="Dataset">
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Variable</md-dialog-title>
			<md-dialog-content v-if="variable">
				<invoker ref="invoker"></invoker>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Nombre" ref="inputName" :maxlength="64"
														v-model="variable.Variable" @enter="save" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Etiqueta" :maxlength="255"
														v-model="variable.Label" @enter="save" />
					</div>

					<div class="md-layout-item md-size-50" v-if="!variable.Id">
						<div class="mp-label labelSeparator">Tipo</div>
						<md-radio v-model="variable.Format" class="md-primary" :value="1">Texto</md-radio>
						<md-radio v-model="variable.Format" class="md-primary" :value="5">Numérica</md-radio>
					</div>

					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Ancho" :disabled="!variableIsString" type="number" :minimum="1" :maximum="32767"
														v-model="variable.FieldWidth" @enter="save" />
					</div>
					<div class="md-layout-item md-size-50" v-if="!variableIsString" >
						<mp-simple-text label="Decimales" type="number" :minimum="0" :maximum="16"
														v-model="variable.Decimals" @enter="save" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Columnas a mostrar" type="number" :minimum="1" :maximum="50"
														v-model="variable.ColumnWidth" @enter="save" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-select label="Alineación" :list="Dataset.ValidAlignments()" :modelKey="true"
											 v-model="variable.Alignment" @enter="save" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-select label="Medida" :list="currentValidMeasures" :modelKey="true"
											 v-model="variable.Measure" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch v-model="variable.UseInSummary" class="md-primary">
							Mostrar en ficha de resumen
						</md-switch>
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import VariableNameValidator from '@/backoffice/classes/VariableNameValidator';

var columnFormatEnum = require("@/common/enums/columnFormatEnum");

export default {
  name: "ColumnPopup",
  data() {
    return {
			activateEdit: false,
			variable: null,
    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
    Dataset() {
      return window.Context.CurrentDataset;
		},
		variableIsString() {
			return this.variable.Format === columnFormatEnum.STRING;
		},
		currentValidMeasures() {
			if (this.variable.Format === columnFormatEnum.STRING) {
				return this.Dataset.ValidMeasuresString();
			} else {
				return this.Dataset.ValidMeasures();
			}
		}
  },
  methods: {
		show(col) {
			this.originalVariable = col;
			this.variable = f.clone(col);
			var ele = arr.GetById(this.Dataset.ValidFormats(), this.variable.Format, null);
			this.variable.FormatFormatted = (ele === null ? 'No reconocido' : ele.Caption);
			this.activateEdit = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 250);
		},
		save() {
			var loc = this;
			var validator = new VariableNameValidator();
			var msg = validator.Validate(this.variable.Variable);
			if (msg !== '') {
				alert(msg);
				return;
			}
			this.$refs.invoker.do(this.Dataset, this.Dataset.SaveColumn,
							this.variable).then(function(data) {
								loc.variable.Caption = data.Caption;
								loc.variable.Order = data.Order;
								if (loc.variable.Id === null) {
									loc.variable.Id = data.Id;
									loc.Dataset.Columns.push(loc.variable);
								} else {
									arr.ReplaceById(loc.Dataset.Columns, loc.variable.Id, loc.variable);
								}
								if (loc.originalVariable.Label !== loc.variable.Label ||
									loc.originalVariable.Variable !== loc.variable.Variable)
								{
									loc.Dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByLabelChange(loc.variable);
								}
								loc.activateEdit = false;
								loc.$emit('completed');
			});
		}
  },
  components: {

  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
