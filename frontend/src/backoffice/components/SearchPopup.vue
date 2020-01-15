<template>
	<md-dialog :md-active.sync="openDialog">
		<md-dialog-title>Seleccionar región</md-dialog-title>
		<md-dialog-content>
			<div class='md-layout'>
				<div class='md-layout-item md-size-100 md-small-size-100'>
					<md-field class="md-toolbar-section-end" style="min-height: unset; padding-top: 0px;">
						<md-input ref="inputName" placeholder="Buscar..." v-model="filter" @input="doSearch" />
					</md-field>
					<md-list>
						<md-list-item v-for="item in autolist" v-bind:key="item.id" :value="item.id"
													@click="select(item)">
							<div class="md-list-item-text">
								<div>{{ item.extra }}</div>
								<div>{{ item.caption }}</div>
							</div>
						</md-list-item>
					</md-list>
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="openDialog = false">Cancelar</md-button>
			<md-button class="md-primary" @click="save()">Aceptar</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>
<script>
	import Context from "@/backoffice/classes/Context";
	import Search from '@/public/classes/Search';

	export default {
		name: "searchPopup",
		mounted() {

		},
		data() {
			return {
				autolist: [],
				retCancel: null,
				openDialog: false,
				searchType: 'r',
				filter: null,
			};
		},
		computed: {
			Work() {
				return window.Context.CurrentWork;
			},
		},
		methods: {
			show() {
				this.search = new Search(this, this.Work.StartupExtraInfo.LookupVersion, this.searchType);
				this.filter = '';
				this.autolist = [];
				this.openDialog = true;
				setTimeout(() => {
					this.$refs.inputName.$el.focus();
				}, 100);
			},
			select(item) {
				this.openDialog = false;
				this.$emit('selected', item);
			},
			doSearch() {
				if (this.filter && this.filter.length > 2) {
					this.search.StartSearch(this.filter);
				} else {
					this.autolist = [];
				}
			}
		},
		components: {
		}
	};
</script>

<style lang="scss" scoped>
	.md-list {
		width: 400px;
		height: 200px;
		max-width: 100%;
		overflow-y: auto;
		padding: 0px;
		margin-top: 12px;
		display: inline-block;
		vertical-align: top;
		border: 1px solid rgba(#000, .12);
	}
	.md-list-item {
		border-bottom: 1px solid rgba(0, 0, 0, 0.12);
	}
	.md-list-item-content {
		display: unset;
	}
	.md-list-item-text :nth-child(1) {
		font-size: 13px;
		color: darkgrey;
	}
	.md-list-item-text :nth-child(2), .md-list-item-text :nth-child(3) {
		font-size: 16px;
		padding-top: 2px;
	}
</style>
