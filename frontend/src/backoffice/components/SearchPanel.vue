<template>
	<div class='md-layout'>
		<div class='md-layout-item md-size-100'>
				<md-field class="md-toolbar-section-end" style="min-height: unset; padding-top: 0px;">
					<md-input ref="inputName" placeholder="Buscar..." v-model="filter" @input="doSearch" />
					<md-icon>search</md-icon>
				</md-field>
				<md-list style="width: 100%">
					<md-list-item v-for="item in autolist" :key="item.Id" :value="item.Id"
												@click="select(item)">
						<div class="md-list-item-text">
							<div>{{ item.Extra }}</div>
							<div>{{ item.Caption }}</div>
						</div>
					</md-list-item>
				</md-list>
			</div>
			<invoker ref="invoker"></invoker>
		</div>
</template>
<script>
	import Search from '@/map/classes/Search';

	export default {
		name: "SearchPanel",
		components: {
		},
		data() {
			return {
				autolist: [],
				retCancel: null,
				openDialog: false,
				filter: null,
			};
		},
		props: {
			searchType: String,
			currentWork: null,
			getDraftMetrics: {
				type: Boolean,
				default: true,
			},
		},
		computed: {
			Work() {
				return window.Context.CurrentWork;
			},
		},
		mounted() {
			this.prepare();
		},
		methods: {
			prepare() {
				this.search = new Search(this, this.Work.Startup.LookupSignature, this.searchType, this.getDraftMetrics, true, this.currentWork);
				this.filter = '';
				this.autolist = [];
			},
			select(item) {
				if (!item.Id) {
					return;
				}
				this.$emit('selected', item);
			},
			focus() {
				var loc = this;
				setTimeout(() => {
					loc.$refs.inputName.$el.focus();
				}, 100);
			},
			doSearch() {
				if (this.filter && this.filter.length > 2) {
					this.$refs.invoker.doMessage('Buscando', this.search, this.search.StartSearch, this.filter);
				} else {
					this.autolist = [];
				}
			}
		},
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
