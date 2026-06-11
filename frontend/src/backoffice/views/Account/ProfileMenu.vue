<template>
	<div class="profileMenu">
		<md-menu md-size="medium" md-align-trigger md-direction="bottom-end">
			<md-button class="md-icon-button avatarButton" md-menu-trigger>
				<div class="avatar">{{ initials }}</div>
				<md-tooltip md-direction="bottom">{{ displayName }}</md-tooltip>
			</md-button>
			<md-menu-content>
				<div class="menuHeader">
					<div class="menuName">{{ displayName }}</div>
					<div class="menuEmail">{{ email }}</div>
				</div>
				<md-menu-item @click="openAccount">
					<md-icon>account_circle</md-icon>
					<span>Detalles de cuenta</span>
				</md-menu-item>
				<md-menu-item v-if="hasWork && Work.CanEdit()" @click="openReview">
					<md-icon>fact_check</md-icon>
					<span>Solicitar revisión</span>
				</md-menu-item>
				<md-divider></md-divider>
				<md-menu-item @click="logoff">
					<md-icon>logout</md-icon>
					<span>Cerrar sesión</span>
				</md-menu-item>
			</md-menu-content>
		</md-menu>
		<account-popup ref="accountPopup"></account-popup>
		<review-popup v-if="hasWork" ref="reviewPopup"></review-popup>
	</div>
</template>

<script>
import a from '@/common/js/authentication';
import AccountPopup from '@/backoffice/views/Account/AccountPopup.vue';
import ReviewPopup from '@/backoffice/views/Account/ReviewPopup.vue';

export default {
	name: 'ProfileMenu',
	components: {
		AccountPopup,
		ReviewPopup
	},
	computed: {
		user() {
			return window.Context.User;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		hasWork() {
			return window.Context.CurrentWork != null;
		},
		displayName() {
			if (!this.user) { return ''; }
			var name = ((this.user.Firstname || '') + ' ' + (this.user.Lastname || '')).trim();
			return name !== '' ? name : this.user.User;
		},
		email() {
			return this.user ? this.user.User : '';
		},
		initials() {
			if (!this.user) { return ''; }
			var a = (this.user.Firstname || this.user.User || '?').trim();
			var b = (this.user.Lastname || '').trim();
			return (a.charAt(0) + (b ? b.charAt(0) : '')).toUpperCase();
		}
	},
	methods: {
		openAccount() {
			this.$refs.accountPopup.show();
		},
		openReview() {
			this.$refs.reviewPopup.show();
		},
		logoff() {
			a.logoff();
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.profileMenu {
	display: flex;
	align-items: center;
	margin-left: 6px;
}

.avatarButton {
	margin: 0;
}

.avatar {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background-color: #fff;
	color: #00A0D2;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	font-weight: 500;
}

.menuHeader {
	padding: 8px 16px 8px 16px;
	border-bottom: 1px solid #eee;
	min-width: 200px;
}

.menuName {
	font-weight: 500;
}

.menuEmail {
	font-size: 12px;
	color: rgba(0, 0, 0, 0.54);
}
</style>

<!-- Corrección de alineación del menú: vue-material centra el contenido
     por defecto; se fuerza alineación a la izquierda globalmente. -->
<style rel="stylesheet/scss" lang="scss">
.md-menu-content .md-list-item-content {
	justify-content: flex-start !important;
}
</style>
