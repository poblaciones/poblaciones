<template>
	<md-dialog :md-active.sync="openPopup" :md-click-outside-to-close="false" class="largeDialog">
		<md-dialog-title>
			Georreferenciando
		</md-dialog-title>

		<md-dialog-content>
			<div>
				<p>
					Algunos elementos del dataset no han podido ser georreferenciados correctamente. Revise los problemas
					identificados y seleccione la acción que corresponda para poder completar el proceso.
				</p>
				<div class="md-layout md-gutter">
					<ActiveGrid ref="grid" :showingErrors="true" :gridwidth="800" @submitGrid="save"
											:georeferenceParameters="georeferenceParameters"></ActiveGrid>
				</div>
			</div>
		</md-dialog-content>

		<md-dialog-actions>
			<div>
				<md-button @click="openPopup = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Continuar</md-button>
			</div>

		</md-dialog-actions>
	</md-dialog>
</template>

<script>
	import ActiveGrid from '@/backoffice/components/ActiveGrid';

	export default {
		name: 'georeferenceStatusPopup',
		components: {
			ActiveGrid,
		},
		computed: {
			Dataset() {
				return window.Context.CurrentDataset;
			},
		},
		methods: {
			show() {
				this.openPopup = true;
			},
			save() {
				this.openPopup = false;
				this.$emit('georeferenceRequested');
				return;
			},
		},
		props: {
			georeferenceParameters: { type: Object}
		},
		data() {
			return {
				openPopup: false,
			};
		}
	};
</script>

<style lang="scss">

</style>
