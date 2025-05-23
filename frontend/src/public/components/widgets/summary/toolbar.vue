<template>
	<div class="no-print" style="display: block; background-color: #fff; padding: 8px; border: 1px solid transparent; -webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, 0.18); box-shadow: 0 1px 1px rgba(0,0,0,0.18);">
		<div class="btn-group">
			<button type="button"
							id="dropdownCaptureButton" class="btn btn-default btn-xs dropdown-toggle"
							style="border-top-right-radius: 0px; border-bottom-right-radius: 0px;"
							data-toggle="dropdown">
				<i class="fas fa-camera" title="Guardar como" />
				<ul class="dropdown-menu dropdown-menu-left dropCapture" aria-labelledby="dropdownCaptureButton">
					<li><a @click="captureMapImage('jpeg')">Guardar como JPG</a></li>
					<li><a @click="captureMapImage('png')">Guardar como PNG</a></li>
					<li class="divider"></li>
					<li><a @click="captureMapPdf(false)">Guardar como PDF</a></li>
					<li><a @click="captureMapPdf(true)">Guardar como PDF (apaisado)</a></li>
				</ul>
			</button>
			<button type="button" class="btn btn-default btn-xs"
							:title="(toolbarStates.showLabels ? 'Ocultar etiquetas del mapa' : 'Mostrar etiquetas del mapa')" @click="toggleLabels()" :class="getLabelsActive()">
				<i class="fas fa-tags" />
			</button>

			<button type="button" v-for="basemapMetric in basemapMetrics" :key="basemapMetric.Id" class="btn btn-default btn-xs"
							:title="(basemapMetric.Visible ? 'Ocultar ' : 'Mostrar ') + basemapMetric.Caption"
							@click="toggleBasemapMetric(basemapMetric)" :class="getBasemapMetricActive(basemapMetric)">
				<i class="fas fa-tags" />
			</button>

			<button v-if="hasGeolocation() && !Embedded.Active" type="button" class="btn btn-default btn-xs"
							title="Ubicación actual" @click="geolocate()">
				<i class="far fa-dot-circle" />
			</button>
		</div>

		<div class="btn-group">
			<button v-for="mode in selectionModes" :key="mode.Name" type="button"
							@click="setMode(mode.Action)" @mouseup="setMode(mode.Action)"
							class="btn btn-default btn-xs" :class="getActive(mode.Action)"
							:title="mode.Name">
				<i :class="mode.Icon" />
			</button>
		</div>

		<div class="pull-right" v-if="!Embedded.Active">
			<mp-dropdown-menu :items="shareItems" @itemClick="shareSelected" :floatRight="false" v-if="Use.UseEmbedding"
												icon="fas fa-share-alt" :styleRounded="true" tooltip="Compartir" @dropDownOpened="dropDownOpened" />

			<mp-dropdown-menu :items="helpItems" @itemClick="helpSelected" :floatRight="false"
												icon="fas fa-question-circle" :styleRounded="true" tooltip="Ayuda"  />

			<button v-if='Use.UseFavorites && user.Logged' type="button" class="btn btn-default btn-xs" title="Agregar a favoritos" @click="setFavorite()">
				<i class="far fa-heart" />
			</button>
			<span v-if='!user.Logged' class="dropdown">
				<button type="button"
								id="dropdownMenuButton" class="btn btn-default btn-xs dropdown-toggle"
								data-toggle="dropdown" title="Ingresar/Registrarse">
					<i class="fas fa-sign-in-alt" />

					<ul class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
						<li><a :href="authenticate.loginUrl()" title="Ingresar" @click="authenticate.redirectLogin">Ingresar</a></li>
						<li><a :href="authenticate.registerUrl()" title="Registrarse" @click="authenticate.redirectRegister">Registrarse</a></li>
						<li class="divider"></li>
						<li><a @click="authenticate.redirectHome()" :href="authenticate.homeUrl()">Inicio</a></li>
					</ul>
				</button>
			</span>
			<span v-else="" class="dropdown">

				<button type="button"
								id="dropdownMenuButton" class="btn btn-default btn-xs dropdown-toggle"
								data-toggle="dropdown">
					<i class="fas fa-user" :title="userTooltip" />
					<ul class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
						<li><a @click="authenticate.redirectBackoffice" href="/users">Mis cartografías</a></li>
						<li v-if="isAdminReader"><a href="/admins" @click="authenticate.redirectAdmin">Administración</a></li>
						<li v-if="isAdminReader" class="divider"></li>
						<li v-if="isAdminReader"><a @click="switchMapProvider">Cambiar a {{ altProvider }}</a></li>
						<li v-if="false"><a href="/users#/account">Cuenta</a></li>
						<li class="divider"></li>
						<li><a @click="authenticate.redirectHome()" :href="authenticate.homeUrl()">Inicio</a></li>
						<li class="divider"></li>
						<li><a @click="authenticate.logoff">Cerrar sesión</a></li>
					</ul>
				</button>
			</span>
		</div>
			<div style="clear: both"></div>
			<tour ref="Tour"></tour>
		</div>
</template>

<script>
	import arr from '@/common/framework/arr';
	import tour from '@/public/components/popups/tour';

	import MapExport from '@/public/classes/MapExport';
	import a from '@/common/js/authentication';

	export default {
		name: 'toolbar',
		data() {
			return {
				currentGradientOpacity: 0.35
			};
		},
		props: [
			'frame',
			'user',
			'config',
			'work',
			'toolbarStates',
			'metrics'
		],
		components: {
			tour,
		},
		methods: {
			switchMapProvider() {
				window.SegMap.SwitchSessionProvider().then(function () {
					location.reload();
				});
			},
			showTutorial() {
				this.$refs.Tour.toggleModal();
			},
			showEmbeddedMapPopUp() {
				window.Popups.Embedding.show();
			},
			captureMapImage(format) {
				var mapExport = new MapExport(this.work.Current);
				mapExport.ExportImage(format);
			},
			captureMapPdf(landscape) {
				var mapExport = new MapExport(this.work.Current);
				mapExport.ExportPdf(landscape);
			},
			shareSelected(item) {
				switch (item.key) {
					case 'EMBED':
						this.showEmbeddedMapPopUp();
						break;
					default:
				}
			},
			helpSelected(item) {
				switch (item.key) {
					case 'BIENVENIDA':
						this.showTutorial();
						break;
					case 'GUIA-USO':
						window.open(this.helpLinks.ReadGuideLink.Url, '_blank');
						break;
					case 'GUIA-CARGA':
						window.open(this.helpLinks.UploadGuideLink.Url, '_blank');
						break;
					case 'TUTORIALES':
						window.open(this.helpLinks.TutorialsLink.Url, '_blank');
						break;
					case 'CONTACTO':
						window.open(this.helpLinks.ContactLink.Url, '_blank');
						break;
					case 'ABOUT':
						window.open(this.helpLinks.AboutLink.Url, '_blank');
						break;
					default:
				}
			},
			dropDownOpened() {
				setTimeout(() => {
					a2a.init_all();
				}, 100);			},
			hasGeolocation() {
				return navigator && navigator.geolocation;
			},
			toggleLabels() {
				window.SegMap.ToggleShowLabels();
			},
			toggleBasemapMetric(basemapMetric) {
				window.SegMap.ToggleBasemapMetric(basemapMetric);
			},
			geolocate() {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function (position) {
						var coord = { Lat: position.coords.latitude, Lon: position.coords.longitude };
						window.SegMap.SetMyLocation(coord);
					});
				}
			},
			setFavorite() {
				alert('no implementado');
			},
			setMode(mode) {
				window.SegMap.SetSelectionMode(mode);
			},
			getActive(mode) {
				if (this.toolbarStates.selectionMode === mode) {
					return ' active';
				}
				return '';
			},
			getBasemapMetricActive(basemapMetricActive) {
				if (basemapMetricActive.Visible) {
					return ' active';
				} else {
					return ' unselected';
				}
			},
			getLabelsActive(mode) {
				if (this.toolbarStates.showLabels) {
					return ' active';
				}
				return ' unselected';
			},
		},
		computed: {
			Use() {
				return this.config;
			},
			Embedded() {
				return window.Embedded;
			},
			basemapMetrics() {
				return this.toolbarStates.basemapMetrics;
			},
			helpLinks() {
				if (this.config) {
					return this.config.Help;
				} else {
					return {};
				}
			},
 			shareItems() {
					var ret = [];
					// opciones
					ret.push({ label: 'Copiar link', key: 'COPYLINK', icon: 'fas fa-copy', liClass: 'a2a_kit', aClass: 'a2a_button_copy_link' });
					ret.push({ label: 'Insertar (embeber)', key: 'EMBED', icon: 'fas fa-link' });
					ret.push({ separator: true });
					ret.push({ label: 'X', key: 'X', icon: 'X', liClass: 'a2a_kit', aClass: 'a2a_button_twitter' });
					ret.push({ label: 'Facebook', key: 'FACEBOOK', icon: 'fab fa-facebook', liClass: 'a2a_kit', aClass: 'a2a_button_facebook' });
					ret.push({ label: 'LinkedIn', key: 'LINKEDIN', icon: 'fab fa-linkedin', liClass: 'a2a_kit', aClass: 'a2a_button_linkedin' });
					ret.push({ label: 'WhatsApp', key: 'WS', icon: 'fab fa-whatsapp', liClass: 'a2a_kit', aClass: 'a2a_button_whatsapp' });

					return ret;
			},
			helpItems() {
				var ret = [];
				// opciones
				ret.push({ label: 'Bienvenida', key: 'BIENVENIDA' });
				if (!this.helpLinks) {
					return ret;
				}
				if (this.helpLinks.ReadGuideLink || this.helpLinks.UploadGuideLink) {
					ret.push({ separator: true });
				}
				if (this.helpLinks.ReadGuideLink) {
					ret.push({ label: this.helpLinks.ReadGuideLink.Caption, key: 'GUIA-USO', icon: 'fas fa-file-pdf' });
				}
				if (this.helpLinks.UploadGuideLink) {
					ret.push({ label: this.helpLinks.UploadGuideLink.Caption, key: 'GUIA-CARGA', icon: 'fas fa-file-pdf' });
				}
				if (this.helpLinks.TutorialsLink) {
					ret.push({ separator: true });
					ret.push({ label: this.helpLinks.TutorialsLink.Caption, key: 'TUTORIALES', icon: 'fab fa-youtube' });
				}
				if (this.helpLinks.AboutLink) {
					ret.push({ separator: true });
					ret.push({ label: this.helpLinks.AboutLink.Caption, key: 'ABOUT' });
				}
				if (this.helpLinks.ContactLink) {
					ret.push({ separator: true });
					ret.push({ label: this.helpLinks.ContactLink.Caption, key: 'CONTACTO' });
				}
				return ret;
			},
			altProvider() {
				return (this.config.MapsAPI == 'leaflet' ? 'Google Maps' : 'Leaflet');
			},
			authenticate() {
				return a;
			},
			isAdminReader() {
				return this.user.Privileges === 'A' || this.user.Privileges === 'E' || this.user.Privileges === 'L';
			},
			userTooltip() {
				if (!this.user.Logged) {
					return '';
				}
				var ret = this.user.Firstname + ' ' + this.user.Lastname;
				ret = ret.trim();
				if (ret) {
					ret += '\n';
				}
				ret += this.user.User;
				return ret;
			},
			selectionModes() {
				var ret = [];
				if (this.frame && this.frame.Zoom >= 10) {
					ret.push(
						{ Action: 'BUFFER', Name: 'Seleccionar una zona arrastrando en el mapa.', Icon: 'fa fa-circle-notch' });
				}
				// Agrega las herramientas para dibujar
				// Para eso se basa en las listas existentes del work
				if (this.work.Current && this.Use.UseAnnotations) {
					// Se fija qué funciona permite las listas permitidas
					// Las acciones pueden hacerse si es editor de la cartografía o si el permiso
					// para invitados es A o E.
					var annotationTypes = {
						'M': { Action: 'MARKER', Name: 'Anotar punto', Icon: 'fas fa-map-marker-alt' },   // Punto
						'L': { Action: 'LINE', Name: 'Anotar línea', Icon: 'fas fa-slash' },            // Línea
						'P': { Action: 'POLYGON', Name: 'Anotar polígono', Icon: 'fas fa-draw-polygon' },  // Polígono
						'C': { Action: 'COMMENT', Name: 'Agregar comentario', Icon: 'fas fa-comment' },    // Comentario
						'Q': { Action: 'QUESTION', Name: 'Agregar pregunta', Icon: 'fas fa-question' } // Pregunta
					};
					if (this.work.Current.Annotations.length == 0) {
						// ofrece todos los tipos
						if (this.work.Current.CanEdit) {
							for (const [key, value] of Object.entries(annotationTypes)) {
								ret.push(value);
							}
						}
					} else {
						// ofrece solo las permitidas
						for (var annotationList of this.work.Current.Annotations) {
							for (const [key, value] of Object.entries(annotationTypes)) {
								// Va sumando los types editables
								if (this.work.Current.CanEdit || annotationList.AllowedTypes.includes(key)) {
									ret.push(value);
								}
							}
						}
					}
				}
				if (ret.length > 0) {
					// Agrega el neutro
					arr.InsertAt(ret, 0, { Action: 'PAN', Name: 'Navegar el mapa', Icon: 'far fa-hand-paper' });
				}
				return ret;
			}
		},
		watch: {
			'toolbarStates.tutorialOpened'(opened) {
				this.$refs.Tour.toggleModal();
			},
			'toolbarStates.selectionMode'(mode) {

				window.SegMap.EndSelecting();
				window.SegMap.StopDrawing();

				switch (mode) {
					case 'PAN':
						// go back to default mode
						window.map.style.cursor = 'auto';
						window.SegMap.MapsApi.Annotations.setMode('select');
						window.SegMap.StartClickSelecting();
						break;
					case 'BUFFER':
						// startCircleMode
						window.SegMap.MapsApi.Annotations.setMode('select');
						window.SegMap.BeginDrawingCircle();
						break;
					case 'MARKER':
						//window.SegMap.MapsAPI.Annotations.addElement('marker');
						window.SegMap.MapsApi.Annotations.setMode('draw-marker');
						break;
					case 'LINE':
						window.SegMap.MapsApi.Annotations.setMode('draw-polyline');
			//			window.SegMap.MapsAPI.Annotations.addElement('polyline');
						break;
					case 'POLYGON':
						window.SegMap.MapsApi.Annotations.setMode('draw-polygon');
			//		window.SegMap.MapsAPI.Annotations.addElement('polygon');
						break;
					case 'COMMENT':
						window.SegMap.MapsApi.Annotations.setMode('draw-comment');
						break;
					case 'QUESTION':
						window.SegMap.MapsApi.Annotations.setMode('draw-question');
						break;
				}
			}
		}
	};
</script>

<style scoped>
	.shareItem {
		padding: 8px 15px!important;
	}
	.shareTopItem {
		padding: 0px 2px 2px 1px !important;
	}
	.rel {
		position: relative;
	}
	.lia {
		padding: 8px 15px;
	}
	.topright {
		position: absolute;
		right: 10px;
		top: 12px;
		color: rgb(170, 170, 170);
		font-size: 12px;
	}
	.embedButton {
		font-size: 13px;
		margin-bottom: -2px;
	}
	.shareBox {
		filter: grayscale(.9);
		transform: scale(.95);
	}
</style>

