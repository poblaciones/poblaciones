<template>
	<div ref="layerSelector"
			 class="layer-selector"
			 :class="['state-' + expansionState]"
			 @keydown.esc="minimizeLayer">
		<!-- Estado Cerrado -->
		<div v-if="expansionState === 0"
				 class="layer-toggle"
				 @click="expandLayer">
			<svg width="24" height="24" viewBox="0 0 24 24" class="layer-icon">
				<path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="#5F6368" />
			</svg>
			<span>Capas</span>
		</div>

		<!-- Estado Parcialmente Abierto -->
		<div v-if="expansionState === 1"
				 class="layer-partial-expanded">
			<div class="layer-quick-options">
				<div v-for="layer in quickLayers"
						 :key="layer.id"
						 class="quick-layer-item"
						 @click="toggleLayer(layer.id)">
					<svg width="24" height="24" :viewBox="`0 0 24 24`">
						<use :xlink:href="`#icon-${layer.id}`" />
					</svg>
					<span>{{ layer.name }}</span>
				</div>
				<div class="more-options"
						 @click="fullyExpandLayer">
					Más
				</div>
			</div>
		</div>

		<!-- Estado Completamente Expandido -->
		<div v-if="expansionState === 2"
				 class="layer-fully-expanded">
			<div class="layer-details-header">
				<h2>Detalles del mapa</h2>
				<button class="close-button"
								@click="minimizeLayer">
					✕
				</button>
			</div>

			<div class="layer-sections">
				<div class="layer-section">
					<h3>Capas</h3>
					<div class="layer-grid">
						<div v-for="layer in detailedLayers"
								 :key="layer.id"
								 class="layer-item"
								 @click="toggleLayer(layer.id)">
							<svg width="24" height="24" :viewBox="`0 0 24 24`">
								<use :xlink:href="`#icon-${layer.id}`" />
							</svg>
							<span>{{ layer.name }}</span>
						</div>
					</div>
				</div>

				<div class="layer-section">
					<h3>Herramientas del mapa</h3>
					<div class="layer-grid">
						<div v-for="tool in mapTools"
								 :key="tool.id"
								 class="layer-item">
							<svg width="24" height="24" :viewBox="`0 0 24 24`">
								<use :xlink:href="`#icon-${tool.id}`" />
							</svg>
							<span>{{ tool.name }}</span>
						</div>
					</div>
				</div>

				<div class="layer-section">
					<h3>Tipo de mapa</h3>
					<div class="map-type-options">
						<div v-for="type in mapTypes"
								 :key="type.id"
								 class="map-type-item"
								 @click="selectMapType(type.id)">
							<svg width="24" height="24" :viewBox="`0 0 24 24`">
								<use :xlink:href="`#icon-${type.id}`" />
							</svg>
							<span>{{ type.name }}</span>
						</div>
						<label class="globe-view">
							<input type="checkbox" /> Vista con el globo
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- SVG Icons -->
		<svg style="display:none">
			<symbol id="icon-transporte-publico" viewBox="0 0 24 24">
				<path d="M12 2c-4.42 0-8 .5-8 4v10.5A2.5 2.5 0 0 0 6.5 19L5 20.5v.5h2l2-2h2v-5H4V6h16v8h2v-8c0-3.5-3.58-4-8-4zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM9 12V7h6v5H9z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-trafico" viewBox="0 0 24 24">
				<path d="M20 10h-6V7h6v3zm2-5H2v12h20V5zm-6 9h-6v-3h6v3z" fill="#5F6368" />
				<circle cx="9" cy="13" r="1.5" fill="#5F6368" />
				<circle cx="15" cy="13" r="1.5" fill="#5F6368" />
			</symbol>

			<symbol id="icon-bicicleta" viewBox="0 0 24 24">
				<path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.7.7c1.2 1.2 3 1.2 4.2 0 .4-.4.4-1 0-1.4L16.1 3c-.4-.4-1-.4-1.4 0-1.2 1.2-1.2 3 0 4.2l.7.7-4.6 4.6h-3v-2.3h2V9H2.5V5.5h2V7h6.3L4.5 14.5H1v-3H0v4h7.5V12l3.3-3.3zm7.7 7c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-relieve" viewBox="0 0 24 24">
				<path d="M14 6l-3.8 5 3 4H5V6h9zm6 10h-9l3-4-3-5h9v9z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-street-view" viewBox="0 0 24 24">
				<path d="M12 4a4 4 0 0 1 4 4c0 2.21-1.79 4-4 4s-4-1.79-4-4a4 4 0 0 1 4-4zm0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-incendios" viewBox="0 0 24 24">
				<path d="M11.25 2.25a9 9 0 0 0-5.56 16.13l1.79-1.78A6.75 6.75 0 1 1 16.5 12h-3.06l-1.56 3.75A4.5 4.5 0 1 1 12 7.5h1.5L15 4.5A7.5 7.5 0 1 0 11.25 2.25z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-calidad-aire" viewBox="0 0 24 24">
				<path d="M14.5 10.5A2.5 2.5 0 0 0 12 8h-1.5v4H12a2.5 2.5 0 0 0 2.5-2.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14h-1.5v2H12v-2zm-3-2H7v-2h2v2zm6 0h-2v-2h2v2z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-mapa-predeterminado" viewBox="0 0 24 24">
				<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-satelite" viewBox="0 0 24 24">
				<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-7l-2 2h4l-2-2z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-duracion-viaje" viewBox="0 0 24 24">
				<path d="M11.5 2.75a8.75 8.75 0 100 17.5 8.75 8.75 0 000-17.5zM9 16.5v-9l7 4.5-7 4.5z" fill="#5F6368" />
			</symbol>

			<symbol id="icon-medir" viewBox="0 0 24 24">
				<path d="M21 6H3a1 1 0 00-1 1v10a1 1 0 001 1h18a1 1 0 001-1V7a1 1 0 00-1-1zm-1 10H4V8h16v8z" fill="#5F6368" />
				<path d="M5 10h2v4H5zm3 0h2v4H8zm3 0h2v4h-2z" fill="#5F6368" />
			</symbol>
		</svg>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				expansionState: 0, // 0: cerrado, 1: parcial, 2: completo
				quickLayers: [
					{ id: 'relieve', name: 'Relieve' },
					{ id: 'trafico', name: 'Tráfico' },
					{ id: 'transporte-publico', name: 'Transporte público' },
					{ id: 'bicicleta', name: 'En bicicleta' }
				],
				detailedLayers: [
					{ id: 'relieve', name: 'Relieve' },
					{ id: 'trafico', name: 'Tráfico' },
					{ id: 'transporte-publico', name: 'Transporte público' },
					{ id: 'bicicleta', name: 'En bicicleta' },
					{ id: 'incendios', name: 'Incendios' },
					{ id: 'calidad-aire', name: 'Calidad del aire' },
					{ id: 'street-view', name: 'Street View' }
				],
				mapTools: [
					{ id: 'duracion-viaje', name: 'Duración del viaje' },
					{ id: 'medir', name: 'Medir' }
				],
				mapTypes: [
					{ id: 'mapa-predeterminado', name: 'Predeterminado' },
					{ id: 'satelite', name: 'Satélite' }
				]
			};
		},
		methods: {
			expandLayer() {
				this.expansionState = 1;
				this.$nextTick(() => {
					document.addEventListener('click', this.handleOutsideClick);
				});
			},
			fullyExpandLayer() {
				this.expansionState = 2;
				this.$nextTick(() => {
					document.addEventListener('click', this.handleOutsideClick);
				});
			},
			minimizeLayer() {
				this.expansionState = 0;
				document.removeEventListener('click', this.handleOutsideClick);
			},
			handleOutsideClick(event) {
				if (this.$refs.layerSelector &&
					!this.$refs.layerSelector.contains(event.target)) {
					this.minimizeLayer();
				}
			},
			toggleLayer(layerId) {
				console.log(`Capa ${layerId} toggled`);
			},
			selectMapType(typeId) {
				console.log(`Tipo de mapa ${typeId} seleccionado`);
			}
		},
		beforeUnmount() {
			document.removeEventListener('click', this.handleOutsideClick);
		}
	};
</script>

<style scoped>
	.layer-selector {
		position: absolute;
		top: 60px;
		left: 10px;
		z-index: 1000;
		transition: all 0.3s ease;
		font-family: Arial, sans-serif;
	}

	.state-0 .layer-toggle {
		background: white;
		padding: 8px 12px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.state-1 .layer-partial-expanded {
		background: white;
		border-radius: 4px;
		box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		display: flex;
		padding: 8px;
	}

	.state-2 .layer-fully-expanded {
		background: white;
		width: 300px;
		border-radius: 4px;
		box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		padding: 16px;
	}

	.layer-quick-options {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.quick-layer-item, .layer-item, .map-type-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}

		.quick-layer-item:hover, .layer-item:hover, .map-type-item:hover {
			background-color: #f0f0f0;
		}

	.more-options {
		cursor: pointer;
		color: #1a73e8;
		font-weight: bold;
	}

	.layer-details-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 20px;
		cursor: pointer;
	}

	.layer-section {
		margin-bottom: 16px;
	}

		.layer-section h3 {
			margin-bottom: 8px;
			color: #5f6368;
			font-size: 14px;
		}

	.layer-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.map-type-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.globe-view {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 8px;
	}

	.layer-icon {
		width: 24px;
		height: 24px;
	}
</style>
