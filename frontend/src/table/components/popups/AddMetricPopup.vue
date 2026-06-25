<template>
	<div v-if="open" class="amp-overlay" @click.self="hide">
		<div class="amp-dialog" role="dialog" aria-modal="true">
			<div class="amp-header" :style="headerStyle">
				<span class="amp-title">{{ title }}</span>
				<button class="amp-close" @click="hide" aria-label="Cerrar">×</button>
			</div>
			<div class="amp-body">
				<p v-if="!list.length" class="amp-empty">Este trabajo no tiene indicadores para agregar.</p>
				<ul v-else class="amp-list">
					<li v-for="item in list" :key="item.Id"
							class="indicator-item hand"
							@click="select(item)">
						<div class="indicator-content">
							<div class="indicator-info">
								<div class="indicator-name">{{ item.Name }}</div>
								<div v-if="item.Versions && item.Versions.length" class="indicator-meta">{{ joinVersions(item.Versions) }}</div>
							</div>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'AddMetricPopup',
		props: {
			backgroundColor: { type: String, default: '#00A0D2' }
		},
		data() {
			return {
				open: false,
				list: [],
				workId: null,
				title: 'Agregar indicador'
			};
		},
		computed: {
			headerStyle() {
				return { backgroundColor: this.backgroundColor };
			}
		},
		methods: {
			// Firma invocada por workPanel: show(work.Current.Metrics, work.Current.Id).
			show(list, workId, title) {
				this.list = Array.isArray(list) ? list : [];
				this.workId = workId != null ? workId : null;
				this.title = title || 'Agregar indicador';
				this.open = true;
			},
			hide() {
				this.open = false;
			},
			select(item) {
				if (!item || item.Header) return;
				this.hide();
				// App.vue conoce la pivot; el popup solo declara la intención.
				this.$emit('add-metric', item.Id);
			},
			joinVersions(versions) {
				var names = [];
				for (var i = 0; i < versions.length; i++) names.push(versions[i].Name);
				return names.join(', ');
			}
		}
	};
</script>

<style scoped>
	.amp-overlay {
		position: fixed;
		inset: 0;
		background: rgba(38, 50, 56, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3000;
	}
	.amp-dialog {
		background: #fff;
		border-radius: 8px;
		width: 520px;
		max-width: calc(100vw - 32px);
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
	}
	.amp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		color: #fff;
	}
	.amp-title { font-size: 15px; font-weight: 600; }
	.amp-close {
		background: none;
		border: none;
		color: #fff;
		font-size: 22px;
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
		opacity: 0.85;
	}
	.amp-close:hover { opacity: 1; }
	.amp-body { padding: 8px; overflow: auto; }
	.amp-empty { padding: 24px 16px; color: #78909c; font-size: 14px; text-align: center; }
	.amp-list { list-style: none; margin: 0; padding: 0; }

	.hand { cursor: pointer; }
	.indicator-item {
		padding: 10px 12px;
		border-radius: 6px;
		transition: background-color 0.12s;
	}
	.indicator-item:hover { background-color: #eee; }
	.indicator-content { display: flex; align-items: center; gap: 12px; }
	.indicator-info { flex: 1; min-width: 0; }
	.indicator-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px; line-height: 1.3; }
	.indicator-meta { font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
