<template>
	<div v-if="Dataset">
		<invoker ref="invoker"></invoker>
		<div style="margin-right: 300px">
				Las funciones para datos multinivel permiten crear más fácilmente indicadores
				en varios niveles de agregación (ej. cobertura de agua corriente por provincias y por departamentos).
		</div>
		<div class="md-layout">
			<div class="md-layout-item">
				<md-table v-model="list" md-card="" v-if="list" style="min-width: 500px;">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell md-label="Vincular">
							<md-switch v-model="item.Bounded" class="md-primary" :disabled="!canEdit || (item.ds.properties.MultilevelMatrix !== null && Dataset !== null && Dataset.properties.MultilevelMatrix !== null && item.ds.properties.MultilevelMatrix !== Dataset.properties.MultilevelMatrix)"
											 @change="value => handleToggle(value, item)"></md-switch>
						</md-table-cell>
						<md-table-cell md-label="Dataset">{{ item.Caption }}</md-table-cell>
					</md-table-row>
				</md-table>
			</div>
		</div>
	</div>
</template>

<script>

export default {
	name: 'multilevelTab',
	components: {
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		list() {
			return this.Dataset.MultilevelMatrix;
		},
		canEdit() {
			if (this.Work) {
				return this.Work.CanEdit();
			} else {
				return false;
			}
		}
	},
	data() {
		return {

		};
	},
	methods: {
		handleToggle(value, item) {
			var loc = this;
			var keep1 = loc.Dataset.properties.MultilevelMatrix;
			var keep2 = item.ds.properties.MultilevelMatrix;
			if (value === false) {
				item.ds.properties.MultilevelMatrix = null;
				if (this.Dataset.GetMultilevelDatasets().length === 0) {
					this.Dataset.properties.MultilevelMatrix = null;
				}
			} else {
				// Si le puso valor positivo
				if (this.Dataset.GetMultilevelDatasets().length === 0) {
					this.Dataset.AcquireMultilevelMatrix();
				}
				item.ds.properties.MultilevelMatrix = this.Dataset.properties.MultilevelMatrix;
			}
			// Graba ambos valores
			this.$refs.invoker.do(this.Dataset,
						this.Dataset.UpdateMultilevelMatrix,
						this.Dataset.properties.Id,
						this.Dataset.properties.MultilevelMatrix,
						item.ds.properties.Id,
						item.ds.properties.MultilevelMatrix).catch(function() {
							loc.Dataset.properties.MultilevelMatrix = keep1;
							item.ds.properties.MultilevelMatrix = keep2;
							item.Bounded = !value;
							});
		},
	}
};
</script>

