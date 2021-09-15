<template>
	<div>
		<title-bar title="Nuevo dataset" />
		<div class="app-container">

			<invoker ref="invoker"></invoker>
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-content>
							<div>
								<mp-simple-text @enter="performNewDataset"
	label="Indique el nombre del dataset" ref="datasetInput" helper="Ej. Escuelas primarias."
																placeholder="Nuevo dataset..." :maxlength="100" v-model="newDatasetName"
									></mp-simple-text>

							</div>
							<md-button class="md-raised" @click="performNewDataset">
								Crear dataset
							</md-button>
						</md-card-content>
					</md-card>
				</div>
		</div>
	</div>
	</div>
</template>

<script>

export default {
	name: 'newDatasets',
	components: {
	},
	data() {
		return {
			newDatasetName: ''
			};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
	},
	mounted() {
		var loc = this;
		this.$nextTick(() => {
					this.$refs.datasetInput.focus();
				});
		this.$refs.datasetInput.input.$el.onkeydown = function(e) {
			if (e.keyCode === 13) {
				loc.performNewDataset();
				return false;
			}
    };
	},
	methods: {
		performNewDataset() {
			var loc = this;
			if (this.newDatasetName.trim().length === 0) {
				alert('Debe indicar un nombre.');
				this.$nextTick(() => {
					this.$refs.datasetInput.focus();
				});
				return;
			}
			this.$refs.invoker.doMessage('Creando dataset', this.Work,
														this.Work.CreateNewDataset,
														this.newDatasetName.trim())
										.then(function() {
												loc.$refs.invoker.doMessage('Obteniendo dataset', window.Db, window.Db.RebindAndFocusLastDataset, loc.$router);
										});
		},
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>

