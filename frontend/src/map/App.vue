<template>
	<div>
		<fs v-model="fullscreen" :teleport="teleport" :page-only="pageOnly">
			<WorkPanel v-if="!Embedded.HideWorkPanel" :work="work" ref="workPanel" :backgroundColor="workColor" />
			<BoundaryPanel v-if="!Embedded.HideWorkPanel" :boundary="boundary" ref="boundaryPanel" :backgroundColor="workColor" />

			<WaitMessage ref="showWaitMessage" :backgroundColor="workColor" />
			<div class="embeddedNoOpener"></div>
			<div style="height:0px;width:0px;overflow:hidden">
				<i class="flaticon-001-cruiser-voyage"></i>
			</div>
			<div class="embedded" @click="embeddedClick" v-if="Embedded.Readonly"
					 :style="(Embedded.OpenOnClick ? 'cursor: pointer;' : '')"
					 :title="(Embedded.OpenOnClick ? 'Abrir en Poblaciones (nueva ventana)' : '')"></div>
			<div id="holder" style="overflow-x: hidden">
				<PopupsPanel :backgroundColor="workColor" />

				<div id="panMain" class="" style="position: relative; width: 100%; display: flex; z-index: 0; height: 100%; overflow: hidden">
					<Toolbar :metrics="metrics" :frame="frame" :user="user" v-show="!Embedded.Readonly"
									 :work="work" :config="config" :toolbarStates="toolbarStates"
									 class="exp-hiddable-block" />

					<CollapseButtonRight id="panRightButton" v-show="!Embedded.HideSummaryPanel && !Embedded.Readonly"
															 :collapsed='toolbarStates.collapsed'
															 @click="doToggle"
															 v-if="clippingStarted"
															 tooltip="panel de estadísticas"
															 class="rightButton exp-hiddable-block"
															 :style="collapseButtonOffset" />
					<div id="panRight" class="animatedFlyAway floatRightPanel" v-touch:swipe.right="panRightSwipeClose"
							 :style="rightPanelOverflow">
						<SummaryPanel :metrics="metrics" id="panSummary" :config="config"
													:clipping="clipping" :frame="frame" :user="user" ref="summaryPanel" :work="work"
													:toolbarStates="toolbarStates"></SummaryPanel>
					</div>
					<SideToolbar v-show="Use.UseNewFabButton" ref="sideToolbar" @selectedItem="selectedItem" @deselectedItem="deselectedItem" @selectedGroup="selectedGroup" @placeSelected="placeSelected" :backgroundColor="workColor"
											 :indicators="sideIndicators" :boundaries="sideBoundaries" :metrics="metrics"
											 :clipping="clipping" :sidebarPosition="sidebarPosition" @update:sidebarPosition="changeSidebarPosition"></SideToolbar>
					<LeftPanel ref='leftPanel' />
					<MapPanel />
					<SuggestionsPanel ref="suggestionsPanel" v-if="!Embedded.Active"></SuggestionsPanel>
					<MapType ref="mapSelector" class="exp-hiddable-block" v-show="!Embedded.Readonly" :toolbarStates="toolbarStates" :sidebarPosition="sidebarPosition" :style="oldStyleIndent"></MapType>

					<MetricsButton v-if="!Use.UseNewFabButton" v-show="!Embedded.HideAddMetrics" ref="fabPanel" :backgroundColor="workColor" id="fab-panel" class="exp-hiddable-unset mapsOvercontrols" />
					<RecommendBoundaries v-if="!Use.UseNewFabButton" style="position: absolute; left: -27px; top: 15px; z-index: 500" ref="fabBoundaries" class="exp-hiddable-unset" :backgroundColor="workColor" />

					<div v-if="work.Current && work.Current.Metadata" class="logosBox">
						<template v-for="institution in work.Current.Metadata.Institutions">
							<WatermarkFloat v-if="institution.WatermarkId" :key="institution.Id" :institution="institution" :work="work" />
						</template>
					</div>
					<div v-if="boundaryMetadata" class="logosBox">
						<template v-for="institution in boundaryMetadata.Institutions">
							<WatermarkFloat v-if="institution.WatermarkId" :key="institution.Id" :institution="institution" :boundary="boundary" />
						</template>
					</div>
					<WatermarkOwner v-if="ownerLogo && ownerLogo.Image"
													:url="ownerLogo.Url"
													:image="ownerLogo.Image"
													:name="ownerLogo.Name" />
					<EditButton v-if="work.Current && !Embedded.Active && work.Current.CanEdit" ref="editPanel" class="exp-hiddable-unset" :backgroundColor="workColor" :work="work" />
					<FullScreenButton v-if="!Embedded.Readonly && mapLoaded && !$isMobile()" class="exp-hiddable-unset" :fullscreen="fullscreen" />

					<MapLegend v-if="!Embedded.HideSummaryPanel && !Embedded.Readonly && mapLoaded && !$isMobile()" v-show="Use.UseNewFabButton" class="exp-hiddable-unset"
										 :metrics="metrics" :toolbarStates="toolbarStates" />
					<ClippingLegend v-if="!Embedded.HideSummaryPanel && !Embedded.Readonly" class="exp-hiddable-unset" :style="(!Use.UseNewFabButton ? 'visibility: hidden' : '')"
													:clipping="clipping" :toolbarStates="toolbarStates" />
				</div>
				<div id="panLabelCalculus" style="display: block; width: 0px; height: 0px; overflow: hidden"></div>
				<a id="downloadAnchor" style="display: none;" download></a>
			</div>
		</fs>
	</div>
</template>

<script>
	import WaitMessage from '@/map/components/popups/waitMessage';
	import SegmentedMap from '@/map/classes/SegmentedMap';
	import StartMap from '@/map/classes/StartMap';
	import EscapeCloseHandler from '@/map/classes/EscapeCloseHandler';
	import SidebarPositionCookie from '@/map/classes/SidebarPositionCookie';
	import LeafletApi from '@/map/leaflet/LeafletApi';
	import WorkPanel from '@/map/components/panels/workPanel';
	import BoundaryPanel from '@/map/components/panels/boundaryPanel';
	import PopupsPanel from '@/map/components/panels/popupsPanel';
	import MapExport from '@/map/classes/MapExport';
	import MapPanel from '@/map/components/panels/mapPanel';
	import MetricsButton from '@/map/components/widgets/map/metricsButton';
	import RecommendBoundaries from '@/map/components/widgets/map/recommendBoundaries';
	import Toolbar from '@/map/components/widgets/summary/toolbar';

	import LeftPanel from '@/map/components/panels/leftPanel';
	import EditButton from '@/map/components/widgets/map/editButton';
	import FullScreenButton from '@/map/components/widgets/map/fullScreenButton';
	import MapLegend from '@/map/components/widgets/map/mapLegend';
	import ClippingLegend from '@/map/components/widgets/map/clippingLegend';
	import SummaryPanel from '@/map/components/panels/summaryPanel';
	import WatermarkFloat from '@/map/components/widgets/map/watermarkFloat';
	import WatermarkOwner from '@/map/components/widgets/map/WatermarkOwner';
	import MapType from '@/map/components/widgets/map/mapType';
	import SuggestionsPanel from '@/map/components/widgets/map/suggestionsPanel';
	import SideToolbar from '@/map/components/widgets/sideToolbar/sideToolbar';
	import CollapseButtonRight from '@/map/components/controls/collapseButtonRight';

	import Split from 'split.js';
	import axios from 'axios';
	import Vue from 'vue';
	import arr from '@/common/framework/arr';
	import err from '@/common/framework/err';
	import web from '@/common/framework/web';
	import dom from '@/common/framework/dom';

	import session from '@/common/framework/session';
	import authentication from '@/common/js/authentication';

	// Helpers del selector (ajustá la ruta a donde ubiques estos archivos).
	import { addIndicatorSubtitles, addBoundarySubtitles } from '@/map/components/widgets/sideToolbar/selectorSubtitles';
	import { attachInfo, buildIndicatorInfo, buildBoundaryInfo } from '@/map/components/widgets/sideToolbar/selectorTooltips';

	import { component } from 'vue-fullscreen';

	export default {
		name: 'app',
		components: {
			SummaryPanel,
			MapPanel,
			WaitMessage,
			EditButton,
			FullScreenButton,
			MapLegend,
			Toolbar,
			ClippingLegend,
			LeftPanel,
			MetricsButton,
			RecommendBoundaries,
			SuggestionsPanel,
			PopupsPanel,
			WorkPanel,
			BoundaryPanel,
			MapType,
			SideToolbar,
			WatermarkFloat,
			WatermarkOwner,
			CollapseButtonRight,
			fs: component,
		},
		created() {
			window.Popups = {};
			window.Panels = {
				Content: {
					FeatureInfo: null, FeatureList: null, FeatureNavigation: this.featureNavigation
				}
			};
			window.Use = {};
			window.Embedded = this.LoadEmbeddedSettings();
			window.ToggleFullscreen = this.toggleFullscreen;
		},
		data() {
			return {
				fullscreen: false,
				teleport: true,
				pageOnly: false,
				mapLoaded: false,

				suggestionCheckInterval: null,
				queryingSuggestions: false,

				oldStyleIndent: '',
				// 'top' | 'middle' | 'bottom'. Posición del panel lateral (sideToolbar),
				// persistida en cookie (ver SidebarPositionCookie).
				sidebarPosition: new SidebarPositionCookie().Get(),

				selfCheckTimer: null,
				workStartupSetter: null,
				splitPanels: null,
				featureNavigation: { Key: null, Values: [], GettingKey: null },
				toolbarStates: {
					selectionMode: 'PAN', tutorialOpened: 0, showLabels: true, showElevation: false,
					collapsed: false, repositionSearch: false, leftPanelVisible: false,
					legendMinimized: false,
					basemapMetrics: [

					],
					hasElevation: false
				},
				flyRightTimeoutId: null,
				clipping: {
					IsUpdating: false,
					Region: {
						SelectedLevelIndex: 0,
						Levels: [],
						Canvas: null
					},
					Feature: {
						Summary: {
							Id: 0,
							Name: '',
							TypeName: '',
							Location: { Lat: 0.0, Lon: 0.0, },
							Population: 0,
							Households: 0,
							Children: 0,
							AreaKm2: 0,
						},
						SelectedLevelIndex: 0,
						Levels: [],
						Canvas: null
					}
				},
				user: {
					Logged: false
				},
				frame: {
					Envelope: {
						Min: { Lat: 0.0, Lon: 0.0, },
						Max: { Lat: 0.0, Lon: 0.0, },
					},
					Zoom: 0,
					ClippingRegionIds: null,
					ClippingCircle: null
				},
				metrics: [],
				// Árboles de catálogo para el panel lateral.
				// App.vue los puebla en loadFabData y los pasa como props a SideToolbar.
				sideIndicators: [],
				sideBoundaries: [],
				config: {},
				work: { Current: null },
				boundary: { Current: null },
				workToLoad: false
			};
		},
		beforeDestroy() {
			if (this.suggestionCheckInterval) {
				clearInterval(this.suggestionCheckInterval);
			}
		},
		mounted() {
			this.toolbarStates.collapsed = true;
			this.SplitPanelsRefresh();
			this.BindEvents();
			var loc = this;
			window.Popups.WaitMessage = this.$refs.showWaitMessage;
			this.GetServer().then(
				function (serverConfiguration) {
					return loc.GetConfiguration(serverConfiguration.data);
				}).then(function () {
					if (loc.Embedded.HideLabels) {
						loc.toolbarStates.showLabels = false;
					}
					if (loc.Embedded.Readonly) {
						var css1 = dom.getCssRule(document, '.leaflet-control-zoom');
						css1.style.display = 'none';
					}
					var start = new StartMap(loc.work, loc.boundary, loc, loc.SetupMap);
					start.Start();
				});
			window.Panels.Left = this.$refs.leftPanel;
		},
		computed: {
			collapseButtonOffset() {
				return this.toolbarStates.collapsed
					? "right: 0px; "
					: "right: max(351px, calc(30% + 9px)); z-index: 1020!important;";
			},
			clippingStarted() {
				return this.clipping.Region.Summary && !this.clipping.Region.Summary.Empty;
			},
			rightPanelOverflow() {
				return (this.clippingStarted ? 'overflow-y: hidden;' : 'overflow-y: hidden; border: 0px');
			},
			workColor() {
				if (this.work && this.work.Current &&
					this.work.Current.Metadata &&
					this.work.Current.Metadata.Institutions &&
					this.work.Current.Metadata.Institutions.length > 0 &&
					this.work.Current.Metadata.Institutions[0].Color) {
					return '#' + this.work.Current.Metadata.Institutions[0].Color;
				}
				return '#00A0D2';
			},
			ownerLogo() {
				return this.config.OwnerLogo;
			},
			boundaryMetadata() {
				if (!this.boundary.Current) {
					return null;
				}
				var current = this.boundary.Current;
				return current.Versions[current.SelectedVersionIndex].Metadata;
			},
			Embedded() {
				return window.Embedded;
			},
			Use() {
				return window.Use;
			},
		},
		methods: {
			IsPreview() {
				var path = window.location.href;
				return path.indexOf('&pv=1#') > 0;
			},
			placeSelected(item) {
				window.SegMap.Clipping.SetClippingRegion(item.Id, true, false, false);
			},
			selectedItem(item) {
				if (item.Type === 'B' || item.Type === 'C') {
					// Alta de una región de recorte; en selección múltiple se acumula.
					window.SegMap.Clipping.SetClippingRegion(item.Id, true, false, item.Append === true);
				} else {
					window.SegMap.AddMetricById(item.Id);
				}
			},
			deselectedItem(item) {
				if (item.Type === 'B') {
					// Capa de delimitación agregada con "Ver en el mapa".
					var boundary = window.SegMap.Metrics.GetBoundaryById(item.Id);
					if (boundary) {
						boundary.Remove();
					}
				} else if (item.Type === 'C') {
					window.SegMap.Clipping.ResetClippingRegion(item.Id);
				} else {
					var metric = window.SegMap.Metrics.GetMetricById(item.Id);
					if (metric) {
						metric.Remove();
					}
				}
			},
			selectedGroup(group) {
				// "Ver todas en el mapa": agrega la capa completa de la delimitación
				// usando el Id del boundary (no de los boundaryItem).
				window.SegMap.AddBoundaryById(group.Id);
			},
			panRightSwipeClose(direction, event) {
				if (
					(event.srcElement && (
						event.srcElement.className === 'vue-slider-dot-handle' ||
						event.srcElement.className === 'vue-slider-process' ||
						event.srcElement.className === 'vue-slider vue-slider-ltr')) ||
					window.getSelection().toLocaleString().length > 0) {
					return;
				}
				this.doToggle();
			},
			toggleFullscreen() {
				this.fullscreen = !this.fullscreen;
			},
			checkForSuggestions() {
				var loc = this;
				if (loc.queryingSuggestions || loc.$refs.suggestionsPanel.visible) {
					return;
				}
				loc.queryingSuggestions = true;
				window.SegMap.Suggestions.requestSuggestions().then(function (result) {
					if (result) {
						// Mostrar panel de sugerencias
						arr.Fill(loc.$refs.sideToolbar.suggestions, result.suggestions);
						loc.$refs.suggestionsPanel.show(result.suggestions, result.reason);
					}
				}).finally(function () {
					loc.queryingSuggestions = false;
				});
			},
			GetConfiguration(serverConfiguration) {
				const loc = this;
				var params = {};
				if (window.self !== window.top && !this.IsPreview()) {
					var topUrl = (window.location.ancestorOrigin && window.location.ancestorOrigin.length > 0 ?
						window.location.ancestorOrigin[0] : document.referrer);
					if (!topUrl || document.location.href.startsWith(topUrl)) {
						topUrl = '<unknown>';
					}
					params.t = topUrl;
					params.c = document.location.href;
				}
				var args = StartMap.ResolveWorkIdFromUrl();
				params.w = args.workId;
				params.l = args.link;

				return axios.get(serverConfiguration.Server + '/services/GetConfiguration', session.AddSession(serverConfiguration.Server, {
					params: params
				})).then(function (res) {
					session.ReceiveSession(serverConfiguration.Server, res);
					res.data.DynamicServer = serverConfiguration.Server;
					window.mainHost = res.data.MainServer;
					window.host = res.data.DynamicServer;
					loc.config = res.data;
					loc.config.IsMobile = loc.$isMobile();
					loc.user = res.data.User;
					loc.toolbarStates.hasElevation = (loc.config.ElevationUrl != null);
					arr.AddRange(loc.toolbarStates.basemapMetrics, loc.config.BasemapMetrics);

					if (!Embedded.Active && (loc.config.Suggestions.useSuggestions && (
						loc.config.Suggestions.selectedUsers.length == 0 || loc.config.Suggestions.selectedUsers.includes(loc.user.User)))) {
						loc.suggestionCheckInterval = setInterval(() => {
							loc.checkForSuggestions();
						}, 15000); // Cada 15 segundos
					}
					if (web.getParameterByName('leaflet') != null) {
						loc.config.MapsAPI = 'leaflet';
					}
					if (args.workId) {
						if (res.data.CanAccessContent === false) {
							if (loc.user.User !== '') {
								alert('El usuario actual (' + loc.user.User + ') no dispone de acceso para este contenido. Deberá identificarse con otra cuenta para poder ingresar.');
							}
							authentication.redirectLogin();
						} else {
							// puede accederlo
							if (res.data.ContentAttributes.Title) {
								window.DefaultTitle = res.data.ContentAttributes.Title;
								document.title = window.DefaultTitle;
							}
							if (res.data.ContentAttributes.Description) {
								document.querySelector('meta[name="description"]').setAttribute("content", res.data.ContentAttributes.Description);
							}
						}
					}
				}).catch(function (error) {
					err.errDialog('GetConfiguration', 'conectarse con el servidor', error);
				});
			},
			GetServer() {
				var params = {};
				return axios.get(window.host + '/services/GetTransactionServer', session.AddSession(window.host, {
					params: params
				})).then(function (res) {
					session.ReceiveSession(window.host, res);
					return res;
				}).catch(function (error) {
					err.errDialog('GetTransactionServer', 'conectarse con el servidor', error);
				});
			},
			embeddedClick() {
				if (window.Embedded.OpenOnClick) {
					window.Embedded.OpenNewWindow();
				}
			},
			LoadEmbeddedSettings() {
				var ret = {
					Compact: web.getParameterByName('co') != null,
					Active: web.getParameterByName('emb') != null || this.inIframe(),
					OpenNewWindow: function () {
						var url = window.location.href;
						// quita lo que tenga entre ? y #
						var i1 = url.indexOf('?');
						var i2 = url.indexOf('#');
						var newUrl;
						if (i1 && i2) {
							newUrl = url.substring(0, i1) + url.substring(i2);
						} else {
							newUrl = url;
						}
						window.open(newUrl, '_blank');
					}
				};
				ret.Readonly = web.getParameterByName('ro') != null;
				ret.IsPreview = web.getParameterByName('pv') != null;
				if (ret.IsPreview) {
					ret.Readonly = true;
					ret.Compact = true;
					ret.HideLabels = true;
					ret.DisableClippingSelection = true;
				}
				if (ret.Compact) {
					ret.HideSearch = true;
					ret.HideSummaryPanel = true;
					ret.HideAddMetrics = true;
					ret.HideWorkPanel = true;
					ret.DisableClippingSelection = true;
				} else {
					ret.HideSearch = ret.Readonly || web.getParameterByName('ns') != null;
					ret.HideSummaryPanel = web.getParameterByName('np') != null;
					ret.HideAddMetrics = ret.Readonly || web.getParameterByName('na') != null;
					ret.DisableClippingSelection = ret.HideSummaryPanel;
				}
				if (ret.Readonly && web.getParameterByName('oc') != null) {
					ret.OpenOnClick = true;
				}
				return ret;
			},
			inIframe() {
				try {
					return window.self !== window.top;
				} catch (e) {
					return true;
				}
			},
			BindEvents() {
				var loc = this;
				this.RegisterErrorHandler();
				window.onpopstate = function (event) {
					if (EscapeCloseHandler.ConsumePendingBack()) {
						if (window.SegMap) {
							window.SegMap.SaveRoute.ResyncRoute();
						}
						return;
					}
					if (event.state !== null) {
						var start = new StartMap(loc.work, loc.boundary, loc, loc.SetupMap);
						start.Start();
						//loc.UpdateMapsControls();
					}
				};
				window.onresize = function (event) {
					if (loc.$refs.workPanel) {
						loc.$refs.workPanel.onResize();
					}
					if (loc.$refs.boundaryPanel) {
						loc.$refs.boundaryPanel.onResize();
					}
					if (window.SegMap) {
						window.SegMap.CheckSmallDevice();
					}
					if (loc.$refs.summaryPanel) {
						if (loc.$refs.summaryPanel.$el.offsetWidth > 320 && !loc.toolbarStates.collapsed) {
							loc.toolbarStates.collapsed = true;
							loc.SplitPanelsRefresh();
							loc.toolbarStates.collapsed = false;
							loc.SplitPanelsRefresh();
						}
					}
				};
				window.onload = function (event) {
					if (loc.$refs.workPanel) {
						loc.$refs.workPanel.onResize();
					}
					if (loc.$refs.boundaryPanel) {
						loc.$refs.boundaryPanel.onResize();
					}
				};
			},
			SetupMap(afterLoaded) {
				if (window.SegMap) {
					if (window.SegMap.MapIsInitialized) {
						afterLoaded();
					} else {
						window.SegMap.afterCallback2 = afterLoaded;
					}
					return;
				}
				var mapApi = new LeafletApi();
				var segMap = new SegmentedMap(mapApi, this.frame, this.clipping, this.toolbarStates, this.metrics, this.config);
				segMap.Work = this.work;
				segMap.afterCallback = afterLoaded;
				window.SegMap = segMap;
				if (!window.Embedded.Compact) {
					this.loadFabMetrics();
				}
				segMap.SaveRoute.DisableOnce = true;
				mapApi.Initialize();
				segMap.SetSelectionMode("PAN");
				if (!window.Embedded.ReadOnly) {
					segMap.StartClickSelecting();
				}
				if (window.Embedded.HideLabels) {
					segMap.Labels.Hide();
				}
				if (window.Embedded.IsPreview) {
					var mapExport = new MapExport(this.work.Current);
					mapExport.ExportPreview();
				} else {
					window.SegMap.CheckSmallDevice();
				}
				this.$refs.mapSelector.InitializeMapControl();
				this.mapLoaded = true;
			},
			RegisterErrorHandler() {
				Vue.config.errorHandler = err.HandleError;
				window.onerror = err.HandleError;
			},
			doToggle() {
				this.toolbarStates.collapsed = !this.toolbarStates.collapsed;
				window.SegMap.Session.UI.ToggleRightPanel(!this.toolbarStates.collapsed);
			},
			changeSidebarPosition(position) {
				this.sidebarPosition = position;
				new SidebarPositionCookie().Set(position);
			},
			loadFabMetrics() {
				// Modo nuevo (panel lateral): dos llamadas, una por panel.
				if (this.Use.UseNewFabButton && !this.Embedded.HideAddMetrics) {
					this.loadFabData();
					return;
				}
				const loc = this;
				axios.get(window.host + '/services/metrics/GetFabMetrics', session.AddSession(window.host, {
					params: {
						w: window.SegMap.Signatures.FabMetrics,
						h: window.SegMap.Signatures.Suffix
					}
				})).then(function (res) {
					session.ReceiveSession(window.host, res);
					loc.oldStyleIndent = 'position: relative; left: 70px; top: -5px;';
					loc.$refs.fabPanel.fabMetrics = res.data.Metrics;
					loc.$refs.fabBoundaries.fabMetrics = res.data.Boundaries;
					window.fabMetrics = res.data.Metrics;
					window.SegMap.Catalog.Receive(res.data);
				}).catch(function (error) {
					err.errDialog('LoadFabMetrics', 'obtener los indicadores de datos públicos', error);
				});
			},
			loadFabData() {
				const loc = this;
				loc.oldStyleIndent = '';
				const params = session.AddSession(window.host, {
					params: {
						w: window.SegMap.Signatures.FabMetrics,
						h: window.SegMap.Signatures.Suffix
					}
				});
				// 1) Indicadores (árbol). La ruta general se cachea local; la de usuario no,
				//    por eso se usan endpoints distintos según si hay sesión iniciada.
				var indicatorsEndpoint = (loc.user && loc.user.Logged) ? 'GetUserFabIndicators' : 'GetFabIndicators';
				axios.get(window.host + '/services/metrics/' + indicatorsEndpoint, params).then(function (res) {
					session.ReceiveSession(window.host, res);
					const data = res.data; // árbol: [{ Id, Name, Icon, Items }]
					addIndicatorSubtitles(data);
					attachInfo(data, buildIndicatorInfo);
					arr.AddRange(loc.sideIndicators, data);
					window.SegMap.Catalog.ReceiveMetrics(data);
				}).catch(function (error) {
					err.errDialog('LoadFabIndicators', 'obtener los indicadores', error);
				});
				// 2) Delimitaciones (árbol). Si seguís sirviéndolas desde GetFabMetrics,
				//    cambiá la URL y tomá res.data.Boundaries en lugar de res.data.
				axios.get(window.host + '/services/metrics/GetFabBoundaries', params).then(function (res) {
					session.ReceiveSession(window.host, res);
					const data = res.data; // árbol: [{ Id, Name, Items: [tipo...] }]
					addBoundarySubtitles(data);
					attachInfo(data, buildBoundaryInfo);
					arr.AddRange(loc.sideBoundaries, data);
					window.SegMap.Catalog.ReceiveBoundaries(data);
				}).catch(function (error) {
					err.errDialog('LoadFabBoundaries', 'obtener las delimitaciones', error);
				});
			},
			SplitPanelsRefresh() {
				return;
				if (this.toolbarStates.collapsed) {
					if (this.splitPanels !== null) {
						this.splitPanels.destroy();
						this.splitPanels = null;
					}
				}
				else {
					if (this.splitPanels === null) {
						var width = window.innerWidth;
						var prop = 320 / width * 100;
						if (prop < 30) { prop = 30; }
						if (prop > 50) { prop = 95; }

						this.splitPanels = Split(['#panMain', '#panRight'], {
							sizes: [100 - prop, prop],
							minSizes: [10, 320],
							expandToMin: true,
							gutterSize: 5,
							onDrag: function () { window.SegMap.TriggerResize(); },
							onDragEnd: function () { window.SegMap.TriggerResize(); }
						});
					}
				}
				if (window.SegMap) {
					window.SegMap.TriggerResize();
				}
			},
		},
		watch: {
			'toolbarStates.collapsed'(value) {
				var s = document.getElementById('panRight');

				if (this.flyRightTimeoutId) {
					clearTimeout(this.flyRightTimeoutId);
					this.flyRightTimeoutId = null;
				}
				if (!value) {
					// mostrar
					s.style.display = 'flex';
					this.flyRightTimeoutId = setTimeout(() => {
						s.classList.remove('animatedFlyRight');
					}, 10);
					// Mientras el panel de estadísticas estuvo colapsado y la leyenda
					// minimizada, RefreshSummaries no se ejecutó (ver SegmentedMap.js);
					// al mostrar el panel, se trae lo que haya quedado pendiente.
					if (window.SegMap) {
						window.SegMap.RefreshSummaries();
					}
				} else {
					// ocultar
					s.classList.add('animatedFlyRight');
					this.flyRightTimeoutId = setTimeout(() => {
						s.style.display = 'none';
					}, 300);
				}
				this.SplitPanelsRefresh();
			},
			'toolbarStates.legendMinimized'(value) {
				// Misma razón que arriba: si se expande la leyenda estando el panel
				// de estadísticas colapsado, se trae lo que haya quedado pendiente.
				if (!value && this.toolbarStates.collapsed && window.SegMap) {
					window.SegMap.RefreshSummaries();
				}
			},
		}
	};

</script>
