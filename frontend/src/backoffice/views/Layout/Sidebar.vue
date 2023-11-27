<template>
	<div>
		<sidebar-menu :menu="menuItems" theme="white-theme" style="padding-bottom: 9px;"
									:collapsed="false" @collapse="onCollapse" @itemClick="onItemClick" :showChild="true" />
		<import-popup ref="importPopup"></import-popup>
		<stepper ref="stepper"></stepper>
	</div>


</template>

<script>
import ImportPopup from "@/backoffice/views/Dataset/ImportPopup";
import { SidebarMenu } from 'vue-sidebar-menu';
import { mapGetters } from 'vuex';
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css';
import str from '@/common/framework/str';
import arr from '@/common/framework/arr';

// Doc:
// https://github.com/yaminncco/vue-sidebar-menu

export default {
  components: {
		ImportPopup,
    SidebarMenu,
  },
  methods: {
    replaceParams(text) {
      if (this.Work !== null) {
        text = str.Replace(text, ':workId', this.Work.properties.Id);
      }
      return text;
    },
		 onCollapse(collapsed) {
      this.$emit('collapsed', collapsed);
    },
    onItemClick(event, item) {
      this.$emit('itemClick', event, item);
    },
		createMenuFromRoute(route) {
			var men = { title: route.name,
									href: this.replaceParams(route.path),
                  icon: (route.icon ? route.icon : 'fa fa-user') };
			if (men.title === 'Fuentes secundarias' && this.Work.IsPublicData()) {
				men.title = 'Fuentes';
			}
			var alias = [];
			if (route.children) {
				for (var c of route.children) {
					alias.push(this.replaceParams(c.path));
				}
				if (c.alias) {
					for (var a of c.alias) {
						alias.push(this.replaceParams(a));
					}
				}
				if (alias.length > 0) {
					men.alias = alias;
				}
			}
			if (this.Work.CanEdit() === false) {
				if (men.title === 'Nuevo dataset' || (men.title === 'Datasets' &&
							window.Context.CurrentWork.Datasets.length == 0)) {
					route.hidden = true;
				}
			}
			return men;
		},
		sortComparer(a, b) {
			if (a.properties.MultilevelMatrix !== b.properties.MultilevelMatrix) {
				return ('' + a.properties.MultilevelMatrix).localeCompare('' + b.properties.MultilevelMatrix);
			} else {
				var ag = (a.properties.Geography === null ? 0 : a.properties.Geography.MinZoom);
				var bg = (b.properties.Geography === null ? 0 : b.properties.Geography.MinZoom);
				if (ag === bg) {
					return ('' + a.properties.Caption).localeCompare('' + b.properties.Caption);
				} else {
					return ag - bg;
				}
			}
		},
		addDatasets(ret) {
			var sorted = arr.SortCopy(window.Context.CurrentWork.Datasets, this.sortComparer);

			for(var i = 0; i < sorted.length; i++) {
				var dataset = sorted[i];
        var link = '/cartographies/:workId/datasets/' + dataset.properties.Id;
				var replaced = this.replaceParams(link);
				var item = {
						href: replaced,
						title: dataset.properties.Caption,
						icon: 'fa fa-table',
						alias: [replaced + '/variables', replaced + '/georeference', replaced + '/data',
										replaced + '/metrics', replaced + '/identity', replaced + '/multilevel']
						};
				var badge = this.createBadge(dataset);
				if (badge !== null) {
					item.badge = badge;
				}
				if (item.title === '') {
					item.title = '(Sin título)';
				}
				ret.push(item);
			}
		},
		showUpload() {
			this.$refs.importPopup.show(true);
		},
		publish() {
			var counts = this.Work.UpdateDatasetGeorreferencedCount();
			if (counts.DatasetCount > counts.GeorreferencedCount) {
				alert('Todos los datasets deben estar georreferenciados para poder realizarse la publicación.');
				return;
			}
			var loc = this;
			this.$refs.stepper.startUrl = window.Db.GetStartWorkPublishUrl(this.Work.properties.Id);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkPublishUrl();
			this.$refs.stepper.visitTarget = this.Work.PreviewTarget();
			this.$refs.stepper.setTitle('Publicando');
			this.$refs.stepper.Start().then(function () {
				loc.Work.WorkPublished();
				window.Db.RebindCurrentWork();
			});
		},
		createBadge(dataset) {
			if (dataset.properties.MultilevelMatrix === null &&
					dataset.properties.Geocoded) {
					return null;
			}
			var badge =  { text: '',
											class: 'vsm-badge default-badge badgeall badgewith',
											attributes: { title: '' }};
			if (dataset.properties.MultilevelMatrix !== null) {
				badge.text = '';//G' + dataset.properties.MultilevelMatrix;
				badge.class += ' badge' + ((parseInt(dataset.properties.MultilevelMatrix) - 1) % 10);
			}
			if (dataset.properties.Geocoded == false) {
				badge.class += ' warningIcon';
				badge.attributes.title = 'El dataset no ha sido georreferenciado';
			}
			return badge;
		},
		createBadgeUpload() {
			var badge = {
				text: '',
				class: 'vsm-badge badgeWhite default-badge badgeall badgewith fas fa-cloud-upload-alt',
				attributes: {
					title: 'Subir archivo', onclick: 'window.openUpload(); return false;'
				}
			};
			return badge;
		},
		createBadgePublish() {
			var badge = {
				text: '',
				class: 'vsm-badge badgeWhite default-badge badgeall badgewith fas fa-globe-americas',
				attributes: {
					title: 'Publicar',
					onclick: 'window.openPublish(); return false;'
				}
			};
			if (!this.Work.HasChanges()) {
				badge.attributes.title = 'No hay cambios para publicar';
				badge.attributes.onclick = '';
				badge.class = 'badgeDisabled ' + badge.class;
			}
			return badge;
		}
  },
	mounted() {
		var loc = this;
		window.openUpload = function () {
			loc.showUpload();
		};
		window.openPublish = function () {
			loc.publish();
		};
	},
  computed: {
    ...mapGetters([
      'sidebar'
    ]),
    Work () {
			return window.Context.CurrentWork;
		},
    menuItems() {
			var ret = [];
			var lastGroup = '';
			for(var n = 0; n < this.$router.options.routes.length; n++) {
				var route = this.$router.options.routes[n];
				if (lastGroup !== route.group && route.group !== undefined) {
					var header = { title: route.group,
													header: true };
					ret.push(header);
					lastGroup = route.group;
				}
				var men = this.createMenuFromRoute(route);
				if (route.name == 'Bienvenida') {
					route.hidden = !this.Work.IsPublicData();
				}
				if (!route.hidden) {
					ret.push(men);
				}
				if (route.name === 'Nuevo dataset') {
					men.badge = this.createBadgeUpload();
					this.addDatasets(ret);
				}
				if (route.name === 'Personalizar') {
					men.badge = this.createBadgePublish();
				}
			}
			return ret;
    },
  }
};
</script>


<style rel="stylesheet/scss" lang="scss">
.warningIcon:after {
   content: '\f06a';
   font-family: 'Font Awesome 5 Free';
   font-weight: 900;
   font-style: normal;
   margin:0px 0px 0px 0px;
   text-decoration:none;
}
.warningIcon {
	background-color: #f3f095!important;
}
.badgewith {
		min-width: 18px;
	}
.badgeall {
	color: #525151!important;
}

.badge0 {
	background-color: #7cda26!important;
}
.badge1 {
	background-color: #d27dc7!important;
}
.badge2 {
	background-color: #bbbb00!important;
}
.badge3 {
	background-color: #4747ff!important;
}
.badge4 {
	background-color: #b1b2ff!important;
}
.badge5 {
	background-color: #ff00ff!important;
}
.badge6 {
	background-color: #b1b1b1!important;
}
.badge7 {
	background-color: #008700!important;
}
.badge8 {
	background-color: #00c5c5!important;
}
.badge9 {
	background-color: #c5a400!important;
}

.badgeWhite {
	background-color: white!important;
	border: 1px solid #e2e2e2;
}

.badgeDisabled {
	cursor: default;
	background-color: #e0e0e0 !important;
	color: #888 !important;
}

.v-sidebar-menu
{
	position: relative;
	margin-top: 55px !important;
	width: unset !important;
}

.v-sidebar-menu.white-theme .vsm-item.first-item.active-item>.vsm-link>.vsm-icon
{
	background-color: unset;
	color: #262626;
}

.v-sidebar-menu.white-theme .vsm-item.first-item>.vsm-link>.vsm-icon
{
	background-color: unset;
	color: #262626;
}

.v-sidebar-menu .vsm-item.active-item>.vsm-link, .v-sidebar-menu .vsm-item.parent-active-item>.vsm-link
{
	background-color: #fafafa;
}
.v-sidebar-menu.white-theme.vsm-default .vsm-link:hover
{
  text-decoration: none;
  background-color: #f0f0f0;
	-webkit-box-shadow: 6px 0 0 0 #f0f0f0 inset;
	box-shadow: inset 6px 0 0 0 #c0c0c0;
}

.v-sidebar-menu .vsm-header {
  margin-top: 8px;
  margin-bottom: 4px;
}

.v-sidebar-menu.white-theme .vsm-item.first-item.active-item>.vsm-link,
.v-sidebar-menu.white-theme .vsm-item.first-item.parent-active-item>.vsm-link
{
	-webkit-box-shadow: 6px 0 0 0 #00A0D2 inset;
	box-shadow: inset 6px 0 0 0 #00A0D2;
}

.v-sidebar-menu .vsm-link
{
	font-size: 14px;
}

.vsm-title
{
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

</style>
