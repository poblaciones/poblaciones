<template>
  <div>
		<invoker ref="invoker"></invoker>
		<tree-picker-popup ref="parentPicker" @selected="onParentSelected"></tree-picker-popup>
		<tree-picker-popup ref="metadataSharePicker" @selected="onSharedMetadataRegionSelected"></tree-picker-popup>
		<md-dialog v-if="clippingRegion" class="medium-extra-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Región</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout">
					<div class="md-layout-item md-size-100">
						<div class="full-row-separator">Descripción</div>
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit"
														helper="Nombre de la entidad mapeada, ej. Provincias, Departamentos"
														v-model="clippingRegion.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-30">
						<mp-simple-text label="Versión" :canEdit="canEdit"
														helper="Para distinguir ediciones de una misma región, ej. 2010, 2022"
														v-model="clippingRegion.Version" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100" v-if="isNew">
						<div class="mp-label">Región padre (opcional)</div>
						<div class="helper">
							Ej. la región padre de Departamentos sería Provincias. Si no elige ninguna, la
							región queda en el nivel raíz del país.
						</div>
						<div class="mp-readonly-value">
							<div class="mp-readonly-text">
								{{
 parentCaption
								}}
							</div>
							<md-button v-if="canEdit" class="md-icon-button" @click="pickParent">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Elegir</md-tooltip>
							</md-button>
							<md-button v-if="canEdit && clippingRegion.Parent" class="md-icon-button" @click="clippingRegion.Parent = null">
								<md-icon>clear</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</div>
					</div>

					<div class="md-layout-item md-size-40" v-if="false">
						<mp-simple-text label="Campo de código"
														helper="Columna del archivo usada como código de sus ítems al importar"
														v-model="clippingRegion.FieldCodeName" />
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew && canEdit">
						<div class="mp-label">Archivo geográfico (GeoPackage)</div>
						<geo-package-upload ref="geoPackage" :fields="importFields" />
					</div>

					<div class="md-layout-item md-size-100">
						<div class="full-row-separator">Presentación en el mapa</div>
					</div>
					<div class="md-layout-item md-size-30">
						<mp-simple-text label="Ícono" v-model="clippingRegion.Symbol" :canEdit="canEdit"
														helper="Icono de FontAwesome o de MapIcons para etiquetas en el mapa"
														@enter="save" />
					</div>
					<div class="md-layout-item md-size-10">
						<div class="mp-label" style="padding-top: 14px;">Color</div>
						<mp-color-picker :canEdit="canEdit" :ommitHexaSign="true" v-model="clippingRegion.Color" />
					</div>
					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Zoom mínimo" :canEdit="canEdit" type="number"
														helper="Mínimo para mostrar el nombre de sus ítems como etiqueta"
														v-model="clippingRegion.LabelsMinZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Zoom máximo" :canEdit="canEdit" type="number"
														helper="Hasta qué nivel de zoom se muestra esa etiqueta"
														v-model="clippingRegion.LabelsMaxZoom" @enter="save" />
					</div>

					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Prioridad" :canEdit="canEdit" type="number"
														helper="A mayor prioridad, más precedencia al resolver superposiciones"
														v-model="clippingRegion.Priority" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100">
						<div class="full-row-separator">Indexación</div>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="useInSearch">
							Buscador: ofrecer este nivel al autocompletar el ingreso de regiones y en el buscador del mapa*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="clippingRegion.IndexCode">
							Códigos: indexar los códigos (además de las descripciones) de los ítems para búsquedas*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="clippingRegion.IsCrawlerIndexer">
							Usarlo como criterio de segmentación hacia crawlers*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100 helper">
						* Si modifica estos valores debe actualizar el caché de regiones utilizando la opción
						Configuración &gt; Cachés &gt; Regiones y delimitaciones &gt; Actualizar en el módulo
						de 'Logs y Mantenimiento' (sitio/logs).
					</div>

					<div class="md-layout-item md-size-100" v-if="!isNew">
						<div class="full-row-separator">Metadatos</div>
					</div>
					<div class="md-layout-item md-size-30" v-if="!isNew" style="padding-top: 10px;">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="hasOwnMetadata">
							Usa metadatos propios
						</md-switch>
					</div>
					<div class="md-layout-item md-size-70" v-if="!isNew && !hasOwnMetadata">
						<div class="mp-label">Comparte metadatos con</div>
						<div class="mp-readonly-value">
							<div class="mp-readonly-text">
								{{
 sharedMetadataCaption
								}}
							</div>
							<md-button v-if="canEdit" class="md-icon-button" @click="pickSharedMetadataRegion">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Elegir</md-tooltip>
							</md-button>
						</div>
					</div>
				</div>
			</md-dialog-content>
			<stepper ref="stepper" title="Creando región" @completed="importCompleted" @closed="stepperClosed"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';
import color from '@/common/framework/color';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup';
import GeoPackageUpload from '@/packs/components/GeoPackageUpload';

export default {
  name: "ClippingRegionPopup",
  data() {
    return {
			activateEdit: false,
			clippingRegion: null,
			useInSearch: 0,
			importResult: null,
			// Sección Metadatos (solo edición): la entidad no guarda si el
			// metadata es propio o compartido como un campo aparte, así que se
			// resuelve comparando MetadataId contra el resto del listado (ver
			// resolveMetadataSharing). originalHasOwnMetadata guarda cómo
			// arrancó, para saber si hay que crear un metadata en blanco al
			// guardar (ver applyMetadataSharing). sharedWithRegion es el ancla
			// usada para guardar (alcanza con una región para conocer el
			// MetadataId a reutilizar); allRegionsFlat es la última consulta al
			// listado completo, usada para mostrar en sharedMetadataCaption a
			// TODAS las regiones que comparten ese metadato, no solo el ancla.
			hasOwnMetadata: true,
			originalHasOwnMetadata: true,
			sharedWithRegion: null,
			allRegionsFlat: [],
    };
  },
  computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		cancelCaption() {
			if (this.canEdit) {
				return 'Cancelar';
			}
			return 'Cerrar';
		},
		isNew() {
			return !this.clippingRegion.Id;
		},
		parentCaption() {
			if (this.clippingRegion.Parent) {
				return this.clippingRegion.Parent.Caption;
			}
			return 'Ninguna';
		},
		// Lista todas las regiones (con su versión) que comparten el mismo
		// Metadata que 'sharedWithRegion', excluyendo esta misma región: no
		// alcanza con mostrar el ancla, es útil ver con quiénes más se
		// comparte. El fallback cubre el instante entre elegir en el picker y
		// que allRegionsFlat se haya vuelto a resolver.
		sharedMetadataCaption() {
			if (!this.sharedWithRegion) {
				return 'Ninguna';
			}
			var loc = this;
			var metadataId = this.sharedWithRegion.MetadataId;
			var matches = this.allRegionsFlat.filter(function (region) {
				return region.MetadataId === metadataId && region.Id !== loc.clippingRegion.Id;
			});
			if (matches.length === 0) {
				matches = [this.sharedWithRegion];
			}
			return matches.map(function (region) { return loc.formatRegionCaption(region); }).join(', ');
		},
		// El código del padre solo hace falta mapearlo cuando la región va a
		// tener una categoría padre: sin eso, cada ítem del archivo no tendría
		// con qué ítem padre vincularse.
		importFields() {
			var fields = [
				{ key: 'code', label: 'Código', required: true },
				{ key: 'caption', label: 'Nombre', required: false },
			];
			if (this.clippingRegion.Parent) {
				fields.push({ key: 'parentCode', label: 'Código del padre', required: true });
			}
			return fields;
		},
  },
  methods: {
		show(clippingRegion) {
			this.clippingRegion = f.clone(clippingRegion);
			// El picker de color necesita siempre un valor con el que arrancar;
			// sin esto, una región sin Color asignado todavía rompería el chip.
			if (!this.clippingRegion.Color) {
				this.clippingRegion.Color = color.GetRandomDefaultColor();
			}
			this.activateEdit = true;
			this.useInSearch = !clippingRegion.NoAutocomplete;
			this.resolveMetadataSharing();
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		// Determina, al abrir una región existente, si sus metadatos son
		// propios o coinciden con los de otra región (compartidos): lo infiere
		// comparando MetadataId contra el resto del listado, ya que no hay un
		// campo aparte que lo indique. sharedWithRegion queda apuntando a la
		// primera coincidencia (alcanza como ancla para guardar); para mostrar
		// se usan todas (ver sharedMetadataCaption).
		resolveMetadataSharing() {
			this.hasOwnMetadata = true;
			this.sharedWithRegion = null;
			if (this.isNew || !this.clippingRegion.MetadataId) {
				this.originalHasOwnMetadata = this.hasOwnMetadata;
				return;
			}
			var loc = this;
			window.Context.ClippingRegions.GetAll(function (data) {
				loc.allRegionsFlat = data;
				var match = data.find(function (region) {
					return region.Id !== loc.clippingRegion.Id && region.MetadataId === loc.clippingRegion.MetadataId;
				});
				if (match) {
					loc.hasOwnMetadata = false;
					loc.sharedWithRegion = { Id: match.Id, Caption: match.Caption, Version: match.Version, MetadataId: match.MetadataId };
				}
				loc.originalHasOwnMetadata = loc.hasOwnMetadata;
			});
		},
		pickSharedMetadataRegion() {
			var loc = this;
			window.Context.ClippingRegions.GetAll(function (data) {
				loc.allRegionsFlat = data;
				loc.$refs.metadataSharePicker.show(
					'Elegir con qué región comparte los metadatos', data, [loc.clippingRegion.Id]);
			});
		},
		onSharedMetadataRegionSelected(item) {
			this.sharedWithRegion = { Id: item.Id, Caption: item.Caption, Version: item.Version, MetadataId: item.MetadataId };
		},
		// Mismo criterio que TreePickerPopup::formatCaption, para distinguir
		// ediciones de una misma región (ej. varias "Provincias").
		formatRegionCaption(region) {
			if (region.Version) {
				return region.Caption + ' (' + region.Version + ')';
			}
			return region.Caption;
		},
		pickParent() {
			var loc = this;
			window.Context.ClippingRegions.GetAll(function (data) {
				var excludeIds = [];
				if (loc.clippingRegion.Id) {
					excludeIds = [loc.clippingRegion.Id];
				}
				loc.$refs.parentPicker.show('Elegir categoría padre', data, excludeIds);
			});
		},
		onParentSelected(item) {
			// El item que llega del picker es el nodo completo del árbol
			// (con sus descendientes y el Metadata de cada uno anidados):
			// guardarlo tal cual haría que el alta viaje con el árbol
			// entero adentro. Solo hace falta el Id para guardar y el
			// Caption/Version para mostrarlo.
			this.clippingRegion.Parent = { Id: item.Id, Caption: item.Caption, Version: item.Version };
		},
		save() {
			if (this.clippingRegion.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			if (!this.isNew && !this.hasOwnMetadata && !this.sharedWithRegion) {
				alert('Debe elegir con qué región comparte los metadatos.');
				return;
			}
			if (this.isNew) {
				this.saveNew();
			} else {
				this.saveEdit();
			}
		},
		saveEdit() {
			var loc = this;
			this.clippingRegion.NoAutocomplete = !this.useInSearch;
			this.applyMetadataSharing();

			this.$refs.invoker.doSave(window.Db, window.Db.UpdateClippingRegion,
							this.clippingRegion).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.clippingRegion);
			});
		},
		// Traduce el switch/picker a lo que espera el servidor: la entidad no
		// tiene un campo propio para 'usa metadatos propios', así que se
		// resuelve mandando a qué Metadata debe apuntar. Si comparte, referencia
		// el Metadata de la otra región (sin tocar sus datos: el servidor solo
		// reconecta por Id). Si pasó de compartido a propio, se manda null para
		// que el servidor genere uno en blanco al guardar, igual que en el alta
		// (ver ClippingRegionService::UpdateClippingRegion). Si ya era propio y
		// no cambió, no se toca: sigue siendo el Metadata completo que ya traía.
		applyMetadataSharing() {
			if (!this.hasOwnMetadata && this.sharedWithRegion) {
				this.clippingRegion.Metadata = { Id: this.sharedWithRegion.MetadataId };
			} else if (this.hasOwnMetadata && !this.originalHasOwnMetadata) {
				this.clippingRegion.Metadata = null;
			}
		},
		saveNew() {
			if (!this.$refs.geoPackage.isReady()) {
				alert('Debe completar el archivo GeoPackage y el mapeo de columnas antes de continuar.');
				return;
			}
			this.clippingRegion.NoAutocomplete = !this.useInSearch;
			var payload = this.$refs.geoPackage.getPayload();
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartClippingRegionImportUrl();
			stepper.stepUrl = window.Db.GetStepClippingRegionImportUrl();
			stepper.args = {
				c: JSON.stringify(this.clippingRegion),
				b: payload.bucketId,
				m: JSON.stringify(payload.mapping),
			};
			stepper.Start();
		},
		importCompleted() {
			// Solo guarda el resultado: el cierre del popup ocurre en
			// stepperClosed, cuando el usuario ya vio la pantalla de resultado
			// del Stepper (para no taparle el éxito o el error con el cierre).
			this.importResult = this.$refs.stepper.result;
		},
		stepperClosed(success) {
			if (success) {
				this.activateEdit = false;
				this.$emit('completed', this.importResult);
			}
		}
  },
  components: {
		TreePickerPopup,
		GeoPackageUpload,
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
