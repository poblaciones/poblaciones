<template>
	<div class="toolbar no-print" style="display: block">
	<div class="btn-group">
		<button type="button" class="btn btn-default btn-xs"
							title="Guardar como PNG..." v-on:click="captureFullPng()"><i class="fas fa-camera"/></button>
		<button type="button" class="btn btn-default btn-xs" v-if="Use.UseCreatePdf"
							title="Guardar como PDF..." v-on:click="captureMapPdf(metrics)"><i class="fas fa-file-pdf"/></button>
		<button v-if="hasGeolocation()" type="button" class="btn btn-default btn-xs"
							title="Ubicación actual" v-on:click="geolocate()"><i class="far fa-dot-circle"/></button>
		<button v-if="Use.UseGradients" type="button" class="btn btn-default btn-xs"
							:title="'Máscara poblacional ' + currentGradientOpacity" v-on:click="changeGradientOpacity(.25)"><i class="fas fa-satellite"/></button>
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
			<button v-if='Use.UseFavorites && user.Logged' type="button" class="btn btn-default btn-xs" title="Agregar a favoritos..." v-on:click="setFavorite()">
				<i class="far fa-heart" />
			</button>

			<button v-if='!user.Logged' type="button" class="btn btn-default btn-xs" title="Ingresar/Registrarse"
							v-on:click="authenticate.redirectLogin()"><i class="fas fa-sign-in-alt"></i></button>
			<span v-else="" class="dropdown">
				<button type="button"
								id="dropdownMenuButton" class="btn btn-default btn-xs dropdown-toggle"
								data-toggle="dropdown" :title="userTooltip">
					<i class="fas fa-user" />

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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HelpCircleIcon from 'vue-material-design-icons/HelpCircle.vue';
import tour from '@/public/components/popups/tour';
import embedded from '@/public/components/popups/embedded';
import h from '@/public/js/helper';
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
		ignore(ele) {
			return (ele.nodeName === 'IFRAME');
		},
		capturePng() {
			var loc = this;
			window.SegMap.MapsApi.gMap.set('disableDefaultUI', true);
			window.setTimeout(function() {
				var mapObj = loc.changeOverflowById(document.getElementById('map'), 'unset');
				html2canvas(mapObj, { useCORS: true, ignoreElements: loc.ignore }).then(function(canvas) {
					loc.changeOverflowById(mapObj, 'hidden');
					loc.generatePng(canvas);
				});
			}, 100);
		},
		changeDisplayById(idObj, newValue) {
			if (idObj !== null){
				idObj.style.display = newValue;
			}
			return idObj;
		},
		changeDisplayByClass(classname, newValue) {
			var classObjs = document.getElementsByClassName(classname);
			for (var i = 0; i < classObjs.length; i++) {
				classObjs[i].style.display = newValue;
			}
			return classObjs;
		},
		swapClasses(classname, classToAdd, classToRemove) {
			var classObjs = document.getElementsByClassName(classname);
			for (var i = 0; i < classObjs.length; i++) {
				classObjs[i].classList.add(classToAdd);
				classObjs[i].classList.remove(classToRemove);
			}
		},
		removeClassAddText(classname, classToRemove, textToAdd){
			var classObjs= document.getElementsByClassName(classname);
			for (var i = 0; i < classObjs.length; i++) {
				classObjs[i].classList.remove(classToRemove);
				classObjs[i].innerHTML = textToAdd;
			}
			return classObjs;
		},
		addClassRemoveText(classObjs, classToAdd){
			for (var i = 0; i < classObjs.length; i++) {
				classObjs[i].classList.add(classToAdd);
				classObjs[i].innerHTML = '';
			}
		},
		changeOverflowById(idObj, newValue){
			idObj.style.overflow = newValue;
			return idObj;
		},
		generatePng(canvas, metrics){
			window.SegMap.MapsApi.gMap.set('disableDefaultUI', false);
			var a = document.createElement('a');
			// toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
			a.href = canvas.toDataURL('image/png');
			a.download = 'mapa.png';
			document.body.appendChild(a);
			a.click();
			a.parentNode.removeChild(a);
		},
		generatePdf(canvas, metrics) {
			window.SegMap.MapsApi.gMap.set('disableDefaultUI', false);
			var doc = new jsPDF({ orientation: 'landscape' });
			var img = canvas.toDataURL('image/png');
			var imgHeightMax = 175;
			var imgWidthMax = 270;
			var imgPosition = 25;

			doc.setFontSize(20);
			doc.text(15, 15, 'Poblaciones');
			if(metrics.length > 0) {
				var metricNames = metrics.map(m => m.properties.Metric.Name);
				doc.setFontSize(10);
				doc.text(15, 20, metricNames.join(' - '));
			} else {
				imgPosition = 20;
				imgHeightMax = 180;
			}
			var imgHeight = imgHeightMax;
			var imgWidth =  parseInt(imgHeight * (canvas.width / canvas.height), 10);
			if (imgWidth > imgWidthMax){
				imgWidth = imgWidthMax;
				imgHeight =  parseInt(imgWidth * (canvas.height / canvas.width), 10);
			}
			doc.addImage(img,'PNG', 15, imgPosition, imgWidth, imgHeight, 'map', 'NONE');
			doc.setFontSize(8);
			doc.text(15, 205, window.location.href);
			doc.save("mapaPoblaciones.pdf");
		},
		prepareMapAndExport(exportFunction, metrics){
			var loc = this;
			window.SegMap.MapsApi.gMap.set('disableDefaultUI', true);
			window.setTimeout(function() {
				var bodyObj = loc.changeOverflowById(document.body, 'visible');
				var holderObj = loc.changeOverflowById(document.querySelector('#holder'), 'visible');

				loc.changeDisplayByClass("exp-hiddable-block", "none");

				var gotas = loc.swapClasses('moderateHr', 'fa-circle', 'fa-tint');


				var fabPanel = loc.changeDisplayById(document.querySelector('#fab-panel'), 'none');
				var editButton = loc.changeDisplayById(document.querySelector('#edit-button'), 'none');
				var dropdown = loc.changeDisplayByClass('dropdown', 'none');

				var btnGroup = loc.changeDisplayByClass(document.getElementsByClassName('btn-group pull-right'), 'none');
				var circulos = loc.removeClassAddText('exp-variable-bullets', 'fa-circle', '&#9679;');

				//var gotas = loc.removeClassAddText('exp-category-bullets', 'fa-tint', '&#9679;');
				var gotas = loc.swapClasses('exp-category-bullets', 'fa-circle', 'fa-tint');

				var contacto= loc.removeClassAddText('contacto','fa-comments', '&#128172;');

				html2canvas(bodyObj, { useCORS: true, ignoreElements: loc.ignore }).then(function(canvas) {
				/*	loc.changeOverflowById(bodyObj, 'hidden');
					loc.changeOverflowById(holderObj, 'hidden');

					loc.changeDisplayByClass("exp-hiddable-block", "block");

					loc.changeDisplayById(fabPanel, 'flex');
					loc.changeDisplayById(editButton, 'unset');

					loc.changeDisplayByClass(dropdown, 'unset');
					loc.changeDisplayByClass(btnGroup, 'unset');
					loc.addClassRemoveText(exp-variable-bullets, 'fa-circle');
					loc.addClassRemoveText(exp-category-bullets, 'fa-tint');
					loc.addClassRemoveText(contacto, 'fa-comments');
					*/
					exportFunction(canvas, metrics);
				});
			}, 100);
		},
		captureFullPng() {
			this.prepareMapAndExport(this.generatePng, []);
		},
		captureMapPdf(metrics) {
			this.prepareMapAndExport(this.generatePdf, metrics);
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
		},
		changeGradientOpacity(delta) {
			var result = this.currentGradientOpacity + delta;
			if (result > 1) {
				result = 0.1;
			}
			this.currentGradientOpacity = result;
			var rule = h.getCssRule(document, '.gAlpha');
			if (rule) {
				rule.style.opacity = result;
			}
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
  -webkit-box-shadow: 0 0px 1px rgba(0, 0, 0, 0.7);
  box-shadow: 0 0px 1px rgba(0,0,0,.7);
}

.dToolboxBox {
  pointer-events: auto;
  width: 27px;
  background-color: White;
  padding-left: 4px;
  padding-top: 4px;
}
.shareIt {
  min-width: 37px;
  margin-top: 8px;
  margin-left: -5px;
}
</style>
