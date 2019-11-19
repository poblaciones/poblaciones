<template>
	<div class="toolbar no-print" style="display: block">
	<div class="btn-group">
		<button type="button" class="btn btn-default btn-xs"
							title="Guardar como PNG..." v-on:click="capturePng()"><i class="fas fa-camera"/></button>
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
      <button type="button" class="btn btn-default btn-xs" data-toggle="dropdown" title="Compartir">
        <i class="fas fa-share-alt"/>
      </button>
      <ul class="shareIt dropdown-menu">
        <li>
          <div class="dToolboxBox">
            <div class="addthis_inline_share_toolbox"></div>
          </div>
        </li>
      </ul>
    </span>

      <button type="button" class="btn btn-default btn-xs" title="Guía de uso" v-on:click="showTutorial()">
        <help-circle-icon title="Guía de uso"/>
      </button>

      <button v-if='this.useExtraToolbar()' type="button" class="btn btn-default btn-xs" title="Agregar a favoritos..." v-on:click="setFavorite()">
				<i class="far fa-heart"/>
			</button>

			<button v-if='this.useExtraToolbar()' type="button" class="btn btn-default btn-xs" v-on:click="login()">Ingresar</button>
		</div>
		<div style="clear: both"></div>
    <tour ref="Tour"></tour>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';
import HelpCircleIcon from 'vue-material-design-icons/HelpCircle.vue';
import tour from '@/public/components/popups/tour';

export default {
	name: 'toolbar',
	props: [
		'frame',
		'toolbarStates'
	],
	components: {
    tour,
    HelpCircleIcon
	},
	methods: {
		selectionModes() {
			if (this.frame.Zoom >= 10) {
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
    useExtraToolbar() {
      return window.UISettings_ExtraToolbar;
    },
		ignore(ele) {
			return (ele.nodeName === 'IFRAME');
		},
		capturePng() {
			var loc = this;
			window.SegMap.MapsApi.gMap.set('disableDefaultUI', true);
			window.setTimeout(function() {
				var mapObj = document.getElementById('map');
				mapObj.style.overflow = 'unset';
				html2canvas(mapObj, { useCORS: true, ignoreElements: loc.ignore }).then(function(canvas) {
					mapObj.style.overflow = 'hidden';
					window.SegMap.MapsApi.gMap.set('disableDefaultUI', false);
					var a = document.createElement('a');
					// toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
					a.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
					a.download = 'mapa.png';
					document.body.appendChild(a);
					a.click();
					a.parentNode.removeChild(a);
				});
			}, 100);
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
		login() {
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
