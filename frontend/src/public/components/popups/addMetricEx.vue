<template>
	<Modal :title="title" ref="showPopup" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor" maxHeight="95%" :maxWidth="1310">
		<div class="scroll-navigation-container">
			<!-- Flechas de navegación (solo escritorio) -->
			<button v-if="!isMobile"
							class="arrow left"
							:disabled="atStart"
							@click="scrollBy(-1)">
				◀
			</button>

			<!-- Contenedor principal con scroll horizontal -->
			<div ref="scrollContainer" class="horizontal-scroll-container" @scroll="onScroll">
				<!-- Contenedor de página que contiene grupos de paneles -->
				<div class="page-container">
					<!-- Grupos de paneles organizados visualmente como en la imagen -->
					<div class="panel-group" v-for="(group, groupIndex) in panelGroups" :key="'group-'+groupIndex">
						<div v-for="(panel, panelIndex) in group"
								 :key="'panel-'+panelIndex"
								 class="panel"
								 :class="{'panel-large': panel.large, 'panel-medium': panel.medium, 'panel-small': panel.small}">
							<div class="panel-title">
								<i class="material-icons" v-if="panel.Icon">{{ panel.Icon }}</i>
								{{ panel.Name }}
							</div>
							<div class="panel-content">
								<div v-for="item in panel.Items"
										 :key="item.Id"
										 @click="select(item)"
										 :class="[(item.Header ? 'item-header' : 'item-metric')]">
									<div>{{ item.Name }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<button v-if="!isMobile"
							class="arrow right"
							:disabled="atEnd"
							@click="scrollBy(1)">
				▶
			</button>
		</div>
	</Modal>
</template>

<script>
	import Modal from '@/public/components/popups/modal';
	import arr from '@/common/framework/arr';

	export default {
		name: 'addMetricPopup',
		components: { Modal },
		props: ['backgroundColor'],

		data() {
			return {
				tree: [],
				workId: null,
				selected: null,
				atStart: true,
				atEnd: false,
				resizeObserver: null,
				title: 'Agregar indicador',
				isMobile: false,
				panelsPerGroup: 5, // Cuántos paneles por grupo
			};
		},

		computed: {
			// Organizar los paneles en grupos para el layout visual
			panelGroups() {
				if (!this.tree || this.tree.length === 0) return [];

				// Asignar tamaños simulados a los paneles (en producción esto vendría de los datos)
				const panelsWithSize = this.tree.map((panel, index) => {
					// Asignar tamaños de manera alternada para simular el layout de la imagen
					const size = index % 4;
					return {
						...panel,
						large: size === 0,     // Panel grande (A, D en la imagen)
						medium: size === 1 || size === 2, // Panel mediano (B, C, E en la imagen)
						small: size === 3      // Panel pequeño
					};
				});

				// Dividir en grupos para scroll horizontal
				const groups = [];
				const itemsPerPage = this.isMobile ? 3 : this.panelsPerGroup;

				for (let i = 0; i < panelsWithSize.length; i += itemsPerPage) {
					groups.push(panelsWithSize.slice(i, i + itemsPerPage));
				}

				return groups;
			}
		},

		mounted() {
			this.checkIfMobile();
			window.addEventListener('resize', this.checkIfMobile);

			this.$nextTick(() => {
				this.updateScrollState();

				// Configurar ResizeObserver para actualizar el estado de scroll
				if (window.ResizeObserver) {
					this.resizeObserver = new ResizeObserver(() => {
						this.updateScrollState();
					});
					if (this.$el.querySelector('.scroll-navigation-container')) {
						this.resizeObserver.observe(this.$el.querySelector('.scroll-navigation-container'));
					}
				}
			});
		},

		beforeDestroy() {
			window.removeEventListener('resize', this.checkIfMobile);

			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
			}
		},

		methods: {
			checkIfMobile() {
				this.isMobile = window.innerWidth < 768;
				this.panelsPerGroup = this.isMobile ? 2 : 5;
			},

			scrollBy(direction) {
				const container = this.$refs.scrollContainer;
				if (!container) return;

				const scrollAmount = container.clientWidth * 0.8;
				container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });

				// Actualizar estado después del scroll
				setTimeout(() => {
					this.updateScrollState();
				}, 500);
			},

			onScroll() {
				this.updateScrollState();
			},

			updateScrollState() {
				const container = this.$refs.scrollContainer;
				if (!container) return;

				this.atStart = container.scrollLeft <= 10;
				this.atEnd = (container.scrollWidth - container.scrollLeft - container.clientWidth) <= 10;
			},

			select(item) {
				if (!item) return;

				this.hide();

				if (this.workId) {
					window.SegMap.AddMetricByIdAndWork(item.Id, this.workId);
				} else if (item.Type === 'B') {
					window.SegMap.AddBoundaryById(item.Id, item.Name);
				} else {
					window.SegMap.AddMetricById(item.Id);
				}
			},

			show(tree, workId, title) {
				if (!window.fabMetrics) {
					alert('fabmetrics no recibidas');
					return;
				}

				this.title = title || 'Agregar indicador';
				this.workId = workId;

				// Llenar los datos
				arr.Fill(this.tree, window.fabMetrics);
				if (this.tree.length > 0) {
					arr.RemoveAt(this.tree, 0);
					arr.RemoveAt(this.tree, 0);
				}

				this.$nextTick(() => {
					this.updateScrollState();
				});

				this.$refs.showPopup.show();
			},

			hide() {
				this.$refs.showPopup.hide();
			}
		}
	};
</script>

<style scoped>
	.scroll-navigation-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 500px; /* Altura fija para el contenedor, evita expansión vertical */
		max-height: 80vh;
	}

	.horizontal-scroll-container {
		flex: 1;
		overflow-x: auto;
		overflow-y: hidden;
		white-space: nowrap;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		padding: 10px 0;
		height: 100%;
	}

	.page-container {
		display: inline-flex;
		height: 100%;
	}

	.panel-group {
		display: inline-flex;
		flex-wrap: wrap;
		align-content: flex-start;
		width: 900px; /* Ancho aproximado para 5 paneles */
		height: 100%;
		padding: 0 10px;
		box-sizing: border-box;
		vertical-align: top;
	}

	/* Panel sizes to mimic the image layout */
	.panel {
		display: inline-block;
		vertical-align: top;
		width: calc(33.333% - 16px);
		margin: 8px;
		border: 1px solid #e2e2e2;
		border-radius: 8px;
		overflow: hidden;
		background: white;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		white-space: normal;
		height: calc(50% - 16px);
	}

	.panel-large {
		width: calc(50% - 16px);
		height: calc(100% - 16px);
	}

	.panel-medium {
		width: calc(33.333% - 16px);
		height: calc(50% - 16px);
	}

	.panel-small {
		width: calc(25% - 16px);
		height: calc(33.333% - 16px);
	}

	.panel-title {
		font-size: 16px;
		padding: 10px;
		background-color: #f8f8f8;
		border-bottom: 1px solid #e2e2e2;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.panel-content {
		padding: 8px;
		height: calc(100% - 45px);
		overflow-y: auto;
	}

	.item-header {
		font-weight: bold;
		font-size: 13px;
		padding: 4px;
		color: #666;
	}

	.item-metric {
		font-size: 14px;
		background-color: #ededed;
		margin-bottom: 3px;
		border-radius: 5px;
		padding: 6px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

		.item-metric:hover {
			background-color: #ccc;
		}

	/* Flechas de navegación */
	.arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 5;
		background: white;
		border: 1px solid #ccc;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 5px rgba(0,0,0,0.1);
	}

		.arrow:disabled {
			opacity: 0.5;
			cursor: default;
		}

		.arrow.left {
			left: -18px;
		}

		.arrow.right {
			right: -18px;
		}

	/* Scrollbar estilizado */
	.horizontal-scroll-container::-webkit-scrollbar {
		height: 6px;
	}

	.horizontal-scroll-container::-webkit-scrollbar-thumb {
		background-color: rgba(0,0,0,0.2);
		border-radius: 3px;
	}

	.horizontal-scroll-container::-webkit-scrollbar-track {
		background-color: rgba(0,0,0,0.05);
	}

	/* Ajustes para móvil */
	@media (max-width: 767px) {
		.panel-group {
			width: 100vw;
			padding: 0 5px;
		}

		.panel {
			width: calc(50% - 10px);
			margin: 5px;
			height: auto;
			min-height: 150px;
		}

		.panel-large, .panel-medium, .panel-small {
			width: calc(50% - 10px);
			height: auto;
		}

		.scroll-navigation-container {
			height: 400px;
		}
	}
</style>
