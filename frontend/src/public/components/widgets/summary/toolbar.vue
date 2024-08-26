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

			<button v-if="hasGeolocation() && !Embedded.Active" type="button" class="btn btn-default btn-xs"
							title="Ubicación actual" @click="geolocate()">
				<i class="far fa-dot-circle" />
			</button>
		</div>

		<div class="btn-group">
			<button v-for="(mode, index) in selectionModes()" :key="mode.Name" type="button"
							@click="setMode(index)" @mouseup="setMode(index)"
							class="btn btn-default btn-xs" :class="getActive(index)"
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
	import dom from '@/common/framework/dom';
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
			'currentWork',
			'toolbarStates',
			'metrics'
		],
		components: {
			tour,
		},
		methods: {
			selectionModes() {
				if (this.frame && this.frame.Zoom >= 10) {
					return [
						{ Name: 'Navegar el mapa', Icon: 'far fa-hand-paper' },
						{ Name: 'Seleccionar una zona arrastrando en el mapa.', Icon: 'fa fa-circle-notch' }];
				} else {
					return [];
				}
			},
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
				var mapExport = new MapExport(this.currentWork);
				mapExport.ExportImage(format);
			},
			captureMapPdf(landscape) {
				var mapExport = new MapExport(this.currentWork);
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
						window.open(this.helpLinks.ReadGuideLink, '_blank');
						break;
					case 'GUIA-CARGA':
						window.open(this.helpLinks.UploadGuideLink, '_blank');
						break;
					case 'TUTORIALES':
						window.open(this.helpLinks.TutorialsLink, '_blank');
						break;
					case 'CONTACTO':
						window.open(this.helpLinks.ContactLink, '_blank');
						break;
					case 'ABOUT':
						window.open(this.helpLinks.AboutLink, '_blank');
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
					ret.push({ label: 'Guía para consulta de información', key: 'GUIA-USO', icon: 'fas fa-file-pdf' });
				}
				if (this.helpLinks.UploadGuideLink) {
					ret.push({ label: 'Guía para la creación de mapas', key: 'GUIA-CARGA', icon: 'fas fa-file-pdf' });
				}
				if (this.helpLinks.TutorialsLink) {
					ret.push({ separator: true });
					ret.push({ label: 'Tutoriales', key: 'TUTORIALES', icon: 'fab fa-youtube' });
				}
				if (this.helpLinks.AboutLink) {
					ret.push({ separator: true });
					ret.push({ label: 'Acerca de Poblaciones', key: 'ABOUT' });
				}
				if (this.helpLinks.ContactLink) {
					ret.push({ separator: true });
					ret.push({ label: 'Contacto', key: 'CONTACTO' });
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
					case 0:
						// go back to default mode
						window.map.style.cursor = 'auto';
						window.SegMap.StartClickSelecting();
						break;
					case 1:
						// startCircleMode
						window.SegMap.BeginDrawingCircle();
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

