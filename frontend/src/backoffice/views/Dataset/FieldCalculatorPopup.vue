<template>
	<div v-if="Dataset">
		<md-dialog :md-active.sync="activateEdit" class="mp-dialog-fixed-sm">
			<md-dialog-title>Calcular</md-dialog-title>
			<md-dialog-content v-if="column && activateEdit">
				<invoker ref="invoker"></invoker>
				<p class="calculatorNotice">
					Los valores de la columna «{{ column.Variable }}» serán reemplazados por el resultado de la operación.
				</p>
				<div class="md-layout">
					<div class="md-layout-item md-size-100">
						<mp-select label="Operación" :list="operations" list-key="Id" :model-key="true"
											 v-model="operationKey" @selected="operationChanged" :helper="operation.Description" />
					</div>
					<div v-for="(operand, index) in operands" :key="operationKey + '_' + index" class="md-layout md-gutter">
						<div class="md-layout-item" :class="(operand.Source === valueSource ? 'md-size-50' : 'md-size-100')">
							<mp-select :label="operation.Labels[index]" :list="optionsFor(index)" list-key="Id" :model-key="true"
												 v-model="operand.Source" @selected="operandSelected(index)" />
						</div>
						<div class="md-layout-item md-size-50" v-if="operand.Source === valueSource" style="margin-top: -7px;">
							<mp-simple-text :ref="'valueText' + index" label="Valor" :type="inputTypeFor(index)" v-model="operand.Value" @enter="save" />
						</div>
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Calcular</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import FieldOperations from '@/backoffice/classes/FieldOperations';

var fieldOperations = new FieldOperations();

export default {
	name: 'FieldCalculatorPopup',
	data() {
		return {
			activateEdit: false,
			column: null,
			isText: false,
			operationKey: null,
			operands: [],
			valueSource: FieldOperations.OperandSource.VALUE
		};
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		operations() {
			return fieldOperations.GetAll(this.Dataset, this.isText);
		},
		operation() {
			return fieldOperations.GetByKey(this.operationKey);
		}
	},
	methods: {
		show(column, isText) {
			this.column = column;
			this.isText = isText;
			var operation = fieldOperations.GetDefault(isText);
			this.operationKey = operation.Key;
			this.operands = fieldOperations.NewOperands(operation);
			this.activateEdit = true;
		},
		operationChanged() {
			this.operands = fieldOperations.NewOperands(this.operation);
		},
		optionsFor(index) {
			return fieldOperations.GetOperandOptions(this.Dataset, this.operation, index);
		},
		operandSelected(index) {
			var loc = this;
			if (this.operands[index].Source !== this.valueSource) {
				return;
			}
			// El cuadro de texto se crea recién al elegir [Valor] o [Texto]
			this.$nextTick(function () {
				var refs = loc.$refs['valueText' + index];
				var component = (Array.isArray(refs) ? refs[0] : refs);
				var input = (component && component.$el ? component.$el.querySelector('input') : null);
				if (input) {
					input.focus();
				}
			});
		},
		inputTypeFor(index) {
			if (this.operation.Types[index] === FieldOperations.OperandType.NUMBER) {
				return 'number';
			}
			return 'text';
		},
		save() {
			var loc = this;
			var message = fieldOperations.Validate(this.operation, this.operands);
			if (message !== '') {
				alert(message);
				return;
			}
			var encoded = fieldOperations.BuildOperands(this.operation, this.operands);
			this.$refs.invoker.doMessage('Calculando los valores', this.Dataset, this.Dataset.CalculateColumn,
				this.column, this.operation.Key, encoded).then(function () {
				loc.activateEdit = false;
				loc.$emit('completed');
			});
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.calculatorNotice {
	margin-top: 0;
}

</style>
