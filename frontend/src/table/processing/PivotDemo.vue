<template>
	<div class="pivot-demo">
		<!-- Notificaciones -->
		<transition name="slide-down">
			<div v-if="notification.show" :class="['notification', 'notification-' + notification.type]">
				<span class="notification-icon">
					<span v-if="notification.type === 'success'">✅</span>
					<span v-if="notification.type === 'error'">❌</span>
					<span v-if="notification.type === 'warning'">⚠️</span>
				</span>
				<span class="notification-message">{{ notification.message }}</span>
			</div>
		</transition>

		<div class="demo-header">
			<h2>Tabla</h2>
			<div class="demo-actions">
				<button @click="exportData" :disabled="!pivotInstance || loading" class="btn btn-secondary">
					Exportar CSV
				</button>
				<button @click="exportExcel" :disabled="!pivotInstance || loading" class="btn btn-secondary">
					Exportar Excel
				</button>
				<button @click="newTable" :disabled="!pivotInstance || loading" class="btn btn-danger">
					Nueva tabla
				</button>
			</div>
		</div>

		<pivot-table
			:pivot="pivotInstance"
			:auto-refresh="false"
			:decimals="2"
			@data-refreshed="onDataRefreshed"
			@error="onError"
			ref="pivotTable"
		/>
	</div>
</template>

<script>
import PivotTable from './PivotTable.vue';
import Pivot from './Pivot.js';
import { ParseQuery, ComposeQuery, SectionsFromPivot } from './pivotRoute.js';

export default {
	name: 'PivotDemo',

	components: {
		PivotTable
	},
		mounted() {
			this.loadPivot();
		},
	data() {
		return {
			pivotInstance: null,
			loading: false,
			notification: {
				show: false,
				message: '',
				type: 'success' // success, error, warning
			}
		};
	},

	methods: {
		loadPivot() {
			var loc = this;
			loc.loading = true;

			var pivot = new Pivot();
			var sections = ParseQuery(this.$route ? this.$route.query : null);

			pivot.RestoreFromSections(sections).then(function () {
				// Si la ruta no traía nada, la grilla queda vacía con su indicación.
				return pivot.Render();
			}).then(function () {
				loc.pivotInstance = pivot;
				loc.loading = false;
				loc.syncRoute();
			}).catch(function (err) {
				loc.loading = false;
				console.error('Error al cargar pivot:', err);
				loc.showNotification('Error al cargar pivot: ' + (err.message || err), 'error');
			});
		},
		// Refleja el estado actual del pivot en la query de la ruta (sobre /view),
		// mediante router.replace (misma ruta, distinta query: no recrea la vista).
		syncRoute() {
			if (!this.pivotInstance || !this.$router) return;
			var query = ComposeQuery(SectionsFromPivot(this.pivotInstance));
			if (JSON.stringify(this.$route.query) !== JSON.stringify(query)) {
				this.$router.replace({ query: query }).catch(function () { /* navegación redundante */ });
			}
		},
		exportData() {
			if (this.$refs.pivotTable) {
				this.$refs.pivotTable.exportToCSV();
			}
		},
		exportExcel() {
			if (this.$refs.pivotTable) {
				this.$refs.pivotTable.exportToExcel();
			}
		},
		newTable() {
			if (!this.pivotInstance) return;
			if (!window.confirm('¿Crear una tabla nueva? Se quitarán las filas, columnas y filtros actuales.')) return;
			this.pivotInstance.Clear();
			this.pivotInstance.Render();
			this.syncRoute();
		},
		onDataRefreshed(pivot) {
			this.syncRoute();
		},
		onError(error) {
			console.error('Error en pivot:', error);
		},
		showNotification(message, type) {
			var loc = this;
			loc.notification.message = message;
			loc.notification.type = type || 'success';
			loc.notification.show = true;

			// Auto-ocultar después de 3 segundos
			setTimeout(function() {
				loc.notification.show = false;
			}, 3000);
		}
	}
};
</script>

<style scoped>
.pivot-demo {
	margin: 0 auto;
	padding: 40px;
}

.demo-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30px;
	padding-bottom: 15px;
	border-bottom: 2px solid #e0e0e0;
}

.demo-header h2 {
	margin: 0;
	color: #1976d2;
}

.demo-actions {
	display: flex;
	gap: 10px;
}

.btn {
	padding: 10px 20px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.3s ease;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-primary {
	background-color: #1976d2;
	color: white;
}

.btn-primary:hover:not(:disabled) {
	background-color: #1565c0;
}

/* nuevo */
.btn-success {
	background-color: #388e3c;
	color: white;
}

.btn-success:hover:not(:disabled) {
	background-color: #2e7d32;
}

.btn-secondary {
	background-color: #757575;
	color: white;
}

.btn-secondary:hover:not(:disabled) {
	background-color: #616161;
}

.btn-danger {
	background-color: #d32f2f;
	color: white;
}

.btn-danger:hover:not(:disabled) {
	background-color: #c62828;
}

.demo-config {
	background-color: #fff;
	padding: 20px;
	border-radius: 4px;
	margin-bottom: 30px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-config h3 {
	margin: 0 0 20px 0;
	color: #424242;
	font-size: 18px;
}

.config-group {
	margin-bottom: 15px;
}

.config-group label {
	display: block;
	margin-bottom: 5px;
	color: #616161;
	font-size: 13px;
	font-weight: 500;
}

.form-control {
	width: 100%;
	padding: 8px 12px;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	font-size: 14px;
	transition: border-color 0.3s ease;
}

.form-control:focus {
	outline: none;
	border-color: #1976d2;
}

@media (max-width: 768px) {
	.demo-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 15px;
	}

	.demo-actions {
		width: 100%;
		flex-wrap: wrap;
	}

	.btn {
		flex: 1;
		min-width: 120px;
	}
}

/* nuevo */
/* Notificaciones */
.notification {
	position: fixed;
	top: 20px;
	right: 20px;
	padding: 15px 20px;
	border-radius: 4px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	display: flex;
	align-items: center;
	gap: 10px;
	z-index: 9999;
	max-width: 400px;
	animation: slideIn 0.3s ease;
}

@keyframes slideIn {
	from {
		transform: translateX(100%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

.notification-success {
	background-color: #4caf50;
	color: white;
}

.notification-error {
	background-color: #f44336;
	color: white;
}

.notification-warning {
	background-color: #ff9800;
	color: white;
}

.notification-icon {
	font-size: 20px;
}

.notification-message {
	font-size: 14px;
	font-weight: 500;
}

.slide-down-enter-active, .slide-down-leave-active {
	transition: all 0.3s ease;
}

.slide-down-enter, .slide-down-leave-to {
	transform: translateX(100%);
	opacity: 0;
}
</style>
