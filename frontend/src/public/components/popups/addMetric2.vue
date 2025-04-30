<template>
	<Modal :title="title" ref="showPopup" bodyClass="fixedBody" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor" maxHeight="95%" :maxWidth="1220">

		<div style="height: 100%">


			<!-- Contenedor scrollable -->
			<div class="scroll-wrapper">
				<!-- Flechas (solo escritorio) -->
				<button v-if="!isMobile"
								class="arrow left"
								:disabled="atStart"
								@click="scrollBy(-1)">
					◀
				</button>
				<div ref="scrollContainer"
						 class="scroll-container">
					<div class="container">
						<figure>
							<div class="" v-for="(panel, index) in tree"
									 :key="index">
								<div class="panTitle">
									<i class="lined-icon material-icons">{{ panel.Icon }}</i>
									{{ panel.Name }}
								</div>
								<div v-for="(item) in panel.Items"
										 @click="select(item)" :key="item.Id"
										 :class="[(item.Header ? 'itemHeader' : 'hand itemMetric')]">
									<div>{{ item.Name }}</div>
								</div>
								<div class="itemMetric" style="margin-right: -15px; height: 0px; background-color: transparent; ">
								</div>

							</div>
						</figure>
					</div>
				</div>
				<button v-if="!isMobile"
								class="arrow right"
								:disabled="atEnd"
								@click="scrollBy(1)">
					▶
				</button>
			</div>
		</div>
	</Modal>
</template>


<script>
import h from '@/public/js/helper';
import arr from '@/common/framework/arr';
import Modal from '@/public/components/popups/modal';

export default {
	name: 'addMetricPopup',
	data() {
		return {
			list: [],
			tree: [],
			eventmounted: false,
			workId: null,
			selected: null,
			activeIndex: 0,
			atStart: true,
			atEnd: false,
			resizeObserver: null,
			title: '',
			panels: [
				{ title: 'Panel 1', content: 'Contenido del panel 1. Texto largo para probar scroll vertical. '.repeat(20) },
				{ title: 'Panel 2', content: 'Contenido del panel 2. '.repeat(10) },
				{ title: 'Panel 3', content: 'Más contenido. '.repeat(15) },
			],
			isMobile: false,
		};
	},
	props: [
		'backgroundColor'
	],
	components: {
		Modal
		},
		mounted() {
			this.checkIfMobile();
			window.addEventListener('resize', this.checkIfMobile);
			window.addEventListener('resize', this.updateScrollState);
			window.addEventListener('keydown', this.keyProcess);
			this.updateScrollState();
		},

		beforeDestroy() {
			window.removeEventListener('keydown', this.keyProcess);
			window.removeEventListener('resize', this.checkIfMobile);
			this.$refs.scrollContainer.removeEventListener('scroll', this.onScroll);
			window.removeEventListener('resize', this.updateScrollState);
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
			}
		},
		methods: {
			keyProcess(e) {
				if ((e.key === "ArrowRight" || e.key === "ArrowDown") && !this.atEnd) {
					this.scrollBy(1);
				}
				if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && !this.atStart) {
					this.scrollBy(-1);
				}
				if (e.key === "Escape") {
					this.hide();
				}

			},
			checkIfMobile() {
				this.isMobile = window.innerWidth < 768;
			},
			scrollTo(index) {
				const el = this.$refs.scrollContainer.children[index];
				if (el) {
					el.scrollIntoView({ behavior: 'smooth', inline: 'start' });
				}
				this.updateScrollState();
			},
			scrollBy(direction) {
				const container = this.$refs.scrollContainer;
				const width = container.offsetWidth - 10;
				container.scrollBy({ left: width * direction, behavior: 'smooth' });
			},

			onScroll() {
				const container = this.$refs.scrollContainer;
				const children = Array.from(container.children);
				let closest = 0;
				let minOffset = Infinity;

				children.forEach((child, index) => {
					const offset = Math.abs(child.getBoundingClientRect().left - container.getBoundingClientRect().left);
					if (offset < minOffset) {
						minOffset = offset;
						closest = index;
					}
				});

				this.activeIndex = closest;
				this.updateScrollState();
			},
			updateScrollState() {
				const container = this.$refs.scrollContainer;
				if (!container) {
					return;
				}
				this.atStart = container.scrollLeft < 10;
				this.atEnd = Math.abs(container.scrollLeft + container.clientWidth - container.scrollWidth) < 2;
			},
		leave(item) {
			if (this.selected === item) {
				this.selected = null;
			}
		},
		select(item) {
			this.selected = item;
			if (item !== null) {
				this.hide();
				if (this.workId) {
					window.SegMap.AddMetricByIdAndWork(item.Id, this.workId);
				} else if (item.Type === 'B') {
					window.SegMap.AddBoundaryById(item.Id, item.Name);
				} else {
					window.SegMap.AddMetricById(item.Id);
				}
			}
		},
		show(tree, workId) {
			if (!tree) {
				tree = [];
			}
			if (!window.fabMetrics) {
				alert('fabmetrics no recibidas');
				exit;
			}
			if (!this.eventmounted) {
				this.$nextTick(() => {
					this.$refs.scrollContainer.addEventListener('scroll', this.onScroll);
					// Observa el cambio de tamaño del contenedor del scroll
					if (window.ResizeObserver) {
						this.resizeObserver = new ResizeObserver(() => {
							// Podés recalcular scroll o simplemente confiar en CSS
							this.updateScrollState();
						});
						this.resizeObserver.observe(this.$el.querySelector('.scroll-wrapper'));
					}
				});
			}
			this.title = 'Agregar indicador';
			this.workId = workId;
			arr.Fill(this.tree, window.fabMetrics);
			arr.RemoveAt(this.tree, 0);
			arr.RemoveAt(this.tree, 0);

			this.$refs.showPopup.show();
		},
		hide() {
			this.$refs.showPopup.hide();
		},
		joinVersions(versions) {
			var ret = '';
			for(var n = 0; n < versions.length; n++) {
				if (ret !== '') ret += ', ';
				ret += versions[n].Name;
			}
			return ret;
		}
	},
	computed: {
	}
};
</script>

<style scoped>
	.lined-icon {
		padding-right: 8px;
		float: left;
		margin-top: 4px;
		padding-left: 6px;
		vertical-align: middle;
	}
.row-header {
		background-color: #efefef;
		text-transform: uppercase;
		font-size: 1.2rem;
		pointer-events: none;
	}

		.row-header > td {
			padding: 2px 6px;
		}

	.metricCell {
		padding-top: 10px;
		padding-bottom: 10px;
	}

	.listContainer {
		padding: 15px;
	}

	.selectedRow {
		background-color: #66615b;
		color: hsla(0,0%,100%,.7);
	}
	.itemHeader {
		text-align: center;
		background-color: #beddeb;
		font-size: 13px;
	}

	.itemMetric {
		font-size: 18px;
		font-weight: 100;
		background-color: #ededed;
		margin-bottom: 3px;
		margin-top: 3px;
		padding-left: 5px !important;
		border-radius: 5px;
		padding: 2px;
	}

	.panel-container {
		width: 100%;
		overflow: hidden;
	}

	/* Tabs */
	.tabs {
		display: flex;
		justify-content: center;
		margin-bottom: 10px;
	}

		.itemMetric:hover {
			background: #ccc;
		}

	/* Scroll area */
	.scroll-wrapper {
		display: flex;
		height: 100%;
		flex-direction: row;
		position: relative;
	}

	.scroll-container {
		height: 100%;
				margin-left: 10px;
		overflow-x: auto;
		scroll-behavior: smooth;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
	}

	.panel {
		max-width: 100%;
		display: grid;
		margin-top: 10px;
		break-inside: avoid;
		/* margin-bottom: 60px; */
		/* border: 1px solid black; */
	}

	figure {
		display: grid;
	}

		figure > div:first-of-type {
			grid-row: 1 / -1;
			grid-column: 1;
		}

	.container {
		column-count: 3;
		column-gap: 20px;
		height: 100%;
	}

	/* Flechas */
	.arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: white;
		border: 1px solid #ccc;
		padding: 6px;
		cursor: pointer;
		z-index: 1;
	}
		.arrow:disabled {
			opacity: 0.5;
			cursor: default;
			pointer-events: none;
		}
	@media (min-width: 768px) {
		.panel {
			flex: 0 0 100%; /* Se ven 2 paneles en pantalla, podés cambiar esto */
		}
	}
		.arrow.left {
			left: -8px;
		}

		.arrow.right {
			right: -17px;
		}

	/* Esconde scrollbar si querés */
	.scroll-container::-webkit-scrollbar {
		display: none;
	}

	.scroll-container {
		-ms-overflow-style: none; /* IE 10+ */
		scrollbar-width: none; /* Firefox */
	}
	.panTitle {
		font-size: 26px;
		font-weight: 100;
		text-transform: uppercase;
		text-align: left;
		background-color: #e5e5e5;
		line-height: 1.2em;
		color: #6a6a6a;
		padding-left: 10px;
		padding-right: 10px;
		padding-top: 20px;
		margin-bottom: 10px;
		margin-top: 10px;
		padding-bottom: 10px;
		border-radius: 12px;
	}
</style>
