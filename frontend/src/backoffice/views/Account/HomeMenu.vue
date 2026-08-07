<template>
	<div class="homeMenu">
		<md-menu md-size="medium" md-align-trigger md-direction="bottom-end">
			<md-button class="md-icon-button actionIcon" md-menu-trigger>
				<md-icon>home</md-icon>
				<md-tooltip md-direction="bottom">Inicio</md-tooltip>
			</md-button>
			<md-menu-content>
				<md-menu-item class="smallerMenu" @click="openLink({ Url: homepage })">
					<md-icon>home</md-icon>
					<span>Inicio</span>
				</md-menu-item>

				<md-divider v-if="showAdminSection"></md-divider>
				<md-menu-item v-if="helpLinks.ReadGuideLink" class="smallerMenu" @click="openLink(helpLinks.ReadGuideLink)">
					<md-icon>picture_as_pdf</md-icon>
					<span>{{ helpLinks.ReadGuideLink.Caption }}</span>
				</md-menu-item>
				<md-menu-item v-if="helpLinks.TableGuideLink && usePivot" class="smallerMenu" @click="openLink(helpLinks.TableGuideLink)">
					<md-icon>picture_as_pdf</md-icon>
					<span>{{ helpLinks.TableGuideLink.Caption }}</span>
				</md-menu-item>
				<md-menu-item v-if="helpLinks.UploadGuideLink" class="smallerMenu" @click="openLink(helpLinks.UploadGuideLink)">
					<md-icon>picture_as_pdf</md-icon>
					<span>{{ helpLinks.UploadGuideLink.Caption }}</span>
				</md-menu-item>

				<md-divider v-if="showAdminSection"></md-divider>
				<md-menu-item v-if="isAdminReader && helpLinks.AdminGuideLink" class="smallerMenu" @click="openLink(helpLinks.AdminGuideLink)">
					<md-icon>picture_as_pdf</md-icon>
					<span>{{ helpLinks.AdminGuideLink.Caption }}</span>
				</md-menu-item>
				<md-menu-item v-if="isAdminReader && helpLinks.AdminPacksGuideLink" class="smallerMenu" @click="openLink(helpLinks.AdminPacksGuideLink)">
					<md-icon>picture_as_pdf</md-icon>
					<span>{{ helpLinks.AdminPacksGuideLink.Caption }}</span>
				</md-menu-item>
				<md-menu-item v-if="isAdminMaster && helpLinks.AdminLogsGuideLink" class="smallerMenu" @click="openLink(helpLinks.AdminLogsGuideLink)">
					<md-icon>picture_as_pdf</md-icon>
					<span>{{ helpLinks.AdminLogsGuideLink.Caption }}</span>
				</md-menu-item>

				<md-divider v-if="helpLinks.TutorialsLink"></md-divider>
				<md-menu-item v-if="helpLinks.TutorialsLink" class="smallerMenu" @click="openLink(helpLinks.TutorialsLink)">
					<md-icon>ondemand_video</md-icon>
					<span>{{ helpLinks.TutorialsLink.Caption }}</span>
				</md-menu-item>

				<md-divider v-if="helpLinks.AboutLink"></md-divider>
				<md-menu-item v-if="helpLinks.AboutLink" class="smallerMenu" @click="openLink(helpLinks.AboutLink)">
					<md-icon>info</md-icon>
					<span>{{ helpLinks.AboutLink.Caption }}</span>
				</md-menu-item>

				<md-divider v-if="helpLinks.ContactLink"></md-divider>
				<md-menu-item v-if="helpLinks.ContactLink" class="smallerMenu" @click="openLink(helpLinks.ContactLink)">
					<md-icon>mail</md-icon>
					<span>{{ helpLinks.ContactLink.Caption }}</span>
				</md-menu-item>
			</md-menu-content>
		</md-menu>
	</div>
</template>

<script>

export default {
	name: 'HomeMenu',
	computed: {
		user() {
			return window.Context.User;
		},
		helpLinks() {
			return (window.Context.Configuration && window.Context.Configuration.Help) || {};
		},
		homepage() {
			return window.Context.Configuration.HomePage;
		},
		usePivot() {
			return window.Context.Configuration.UsePivot;
		},
		isAdminReader() {
			return this.user && (this.user.Privileges === 'A' || this.user.Privileges === 'E' || this.user.Privileges === 'L');
		},
		isAdminMaster() {
			return this.user && this.user.Privileges === 'A';
		},
		showAdminSection() {
			return (this.isAdminReader && (this.helpLinks.AdminGuideLink || this.helpLinks.AdminPacksGuideLink))
				|| (this.isAdminMaster && this.helpLinks.AdminLogsGuideLink);
		}
	},
	methods: {
		openLink(link) {
			window.open(link.Url, '_blank');
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.homeMenu {
		display: flex;
		margin-right: 6px;
		margin-left: 6px;
		align-items: center;
	}
	.actionIcon .md-icon {
		color: #fff !important;
	}

</style>
