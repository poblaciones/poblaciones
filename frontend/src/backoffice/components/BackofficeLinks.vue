<template>
	<div class="adminButton">
		<md-button @click="onPublish" v-if="Work.CanEdit() && (Work.HasChanges() || Work.properties.pendingChanges == 1)" class="md-raised">
			<md-icon>public</md-icon> Publicar cambios
		</md-button>
		<md-button @click="goMap" v-if="url" class="md-raised">
			<md-icon>map</md-icon> Visitar mapa {{ (Work.HasChanges() ? 'actual' : '') }}
		</md-button>
		<stepper ref="stepper">
		</stepper>
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import str from '@/common/js/str';

export default {
	name: 'backofficeLinks',
	components: {
	},
	data() {
		return {	};
	},
	computed: {
		Work() { return window.Context.CurrentWork; },
		user() {
			return window.Context.User;
		},
		url() {
			return this.Work.properties.Metadata.Url;		
		}
	},
	methods: {
		absoluteMap(url) {
			return str.AbsoluteUrl(url);
		},
		goMap() {
				var url = this.url;
				window.open(url, '_blank');
		},
		onPublish() {
			var counts = this.Work.UpdateDatasetGeorreferencedCount();
			if (counts.DatasetCount > counts.GeorreferencedCount) {
				alert('Todos los datasets deben estar georreferenciados para poder realizarse la publicación.');
				return;
			}
			var loc = this;
			this.$refs.stepper.startUrl = window.Db.GetStartWorkPublishUrl(this.Work.properties.Id);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkPublishUrl();
			this.$refs.stepper.setTitle('Publicando');
			this.$refs.stepper.Start().then(function () {
					loc.Work.WorkPublished();
					window.Db.ReBindWork(loc.Work.properties.Id);
			});
		},
	},
	watch: {
		'Work.pendingChanges'() {
			
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.adminButton {
	float: right;
	font-size: 12px;
	margin-right: 6px;
	margin-top: -12px;
}
</style>

