<template>
	<div class="toolbar no-print" style="display: block">
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
		<button v-if="hasGeolocation()" type="button" class="btn btn-default btn-xs"
							title="Ubicación actual" v-on:click="geolocate()"><i class="far fa-dot-circle"/></button>
	</div>
		<div class="btn-group">
			<button v-for="(mode, index) in selectionModes()" :key="mode.Name" type="button"
							v-on:click="setMode(index)" v-on:mouseup="setMode(index)"
							class="btn btn-default btn-xs" :class="getActive(index)" :title="mode.Name"><i :class="mode.Icon"/></button>
		</div>

		<div class="pull-right">
			<span class="dropdown">
				<button type="button" class="btn btn-default btn-xs" v-if="Use.UseEmbedding" data-toggle="dropdown" title="Compartir">
					<i class="fas fa-share-alt" />
				</button>
				<div class="addthis_toolbox addthis_default_style addthis_32x32_style">
					<a class="addthis_button_preferred_1"></a>
					<a class="addthis_button_preferred_2"></a>
					<a class="addthis_button_preferred_3"></a>
					<a class="addthis_button_preferred_4"></a>
					<a class="addthis_button_compact"></a>
				</div>
				<ul class="shareIt dropdown-menu">
					<li>
						<div class="dToolboxBox">
							<button type="button" class="btn btn-default btn-xs" title="Embeber mapa actual" v-on:click="showEmbeddedMapPopUp()">
								<i class="fas fa-link"/>
							</button>
						</div>
					</li>
					<li>
						<div class="dToolboxBox">
							<div class="addthis_inline_share_toolbox"></div>
						</div>
					</li>
				</ul>
			</span>
			<button type="button" class="btn btn-default btn-xs" title="Guía de uso" v-on:click="showTutorial()">
				<help-circle-icon title="Guía de uso" />
			</button>
			<button v-if='Use.UseFavorites && user.Logged' type="button" class="btn btn-default btn-xs" title="Agregar a favoritos" v-on:click="setFavorite()">
				<i class="far fa-heart" />
			</button>

			<button v-if='!user.Logged' type="button" class="btn btn-default btn-xs" title="Ingresar/Registrarse"
							v-on:click="authenticate.redirectLogin()"><i class="fas fa-sign-in-alt"></i></button>
			<span v-else="" class="dropdown">
				<button type="button"
								id="dropdownMenuButton" class="btn btn-default btn-xs dropdown-toggle"
								data-toggle="dropdown" >
					<i class="fas fa-user" :title="userTooltip" />

					<ul class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
						<li><a @click="authenticate.redirectBackoffice" href="/users">Mis cartografías</a></li>
						<li v-if="user.Privileges === 'A'"><a href="/admins" @click="authenticate.redirectAdmin">Administración</a></li>
						<li v-if="false"><a href="/users#/account">Cuenta</a></li>
						<li class="divider"></li>
						<li><a @click="authenticate.logoff">Cerrar sesión</a></li>
					</ul>
				</button>
			</span>
		</div>
		<div style="clear: both"></div>
    <tour ref="Tour"></tour>
    <embedded ref="Embedded"></embedded>
  </div>
</template>

<script>
import dom from '@/common/js/dom';
import HelpCircleIcon from 'vue-material-design-icons/HelpCircle.vue';
import tour from '@/public/components/popups/tour';
import MapExport from '@/public/classes/MapExport';
import embedded from '@/public/components/popups/embedded';
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
		HelpCircleIcon,
		embedded,
	},
	methods: {
		selectionModes() {
			if (this.frame && this.frame.Zoom >= 10) {
				return [
					{ Name: 'Navegar el mapa', Icon: 'far fa-hand-paper' },
					{ Name: 'Seleccionar una zona', Icon: 'fa fa-circle-notch' }];
			} else {
				return [];
			}
		},
		showTutorial() {
			this.$refs.Tour.toggleModal();
		},
		showEmbeddedMapPopUp() {
			this.$refs.Embedded.toggleModal();
		},
		captureMapImage(format) {
			var mapExport = new MapExport(this.currentWork);
			mapExport.ExportImage(format);
		},
		captureMapPdf(landscape) {
			var mapExport = new MapExport(this.currentWork);
			mapExport.ExportPdf(landscape);
		},
		hasGeolocation() {
			return navigator && navigator.geolocation;
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
			if(this.toolbarStates.selectionMode === mode) {
				return ' active';
			}
			return '';
		}
	},
	computed: {
		Use() {
			return this.config;
		},
		authenticate() {
			return a;
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

			switch(mode) {
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
.toolbar {
  background-color: #fff;
  padding: 8px;
  border: 1px solid transparent;
  -webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 1px rgba(0,0,0,0.1);
}

.dToolboxBox {
  pointer-events: auto;
  width: 27px;
  background-color: White;
  padding-left: 4px;
  padding-top: 4px;
}
.dropCapture {
	margin-top: 7px;
  margin-left: -8px;
}
.shareIt {
  min-width: 37px;
  margin-top: 8px;
  margin-left: -5px;
}
</style>
