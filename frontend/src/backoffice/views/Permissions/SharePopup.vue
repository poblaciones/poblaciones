<template>
	<div>
		<md-dialog :md-active.sync="open" class="sharePopup">
			<md-dialog-title>
				Compartir
			</md-dialog-title>
			<invoker ref="invoker"></invoker>
			<md-dialog-content>

				<!-- Alta de personas -->
				<div v-if="Work.CanAdmin()" class="addRow">
					<div class="addRow-field">
						<md-field class="emailField">
							<label>Añadir personas</label>
							<md-input v-model="user" ref="usuario" type="email" placeholder=""
												@keyup.enter.native="onAdd" />
						</md-field>
					</div>
					<div class="addRow-level">
						<md-field>
							<label>Nivel</label>
							<md-select v-model="level">
								<md-option value="V">Puede ver</md-option>
								<md-option value="E">Puede editar</md-option>
								<md-option value="A">Puede administrar</md-option>
							</md-select>
						</md-field>
					</div>
					<md-button class="md-primary md-raised addRow-button"
										 :disabled="user.trim() === ''" @click="onAdd">
						Agregar
					</md-button>
				</div>
				<md-checkbox v-if="Work.CanAdmin()" class="md-primary notifyCheck" v-model="sendEmail">
					Notificar a las personas
				</md-checkbox>

				<!-- Personas con acceso -->
				<div class="sectionTitle">Personas con acceso</div>
				<md-list class="peopleList">
					<md-list-item v-for="item in list" :key="item.User.Email" class="personRow">
						<div class="personAvatar">{{ initials(item.User) }}</div>
						<div class="personInfo">
							<span class="personName">{{ formatUser(item.User) }}</span>
							<span class="permissionLabel">{{ formatPermission(item.Permission) }}</span>
						</div>
						<md-button v-if="Work.CanAdmin()" class="md-icon-button deleteBtn" @click="onDelete(item)">
							<md-icon>delete</md-icon>
							<md-tooltip md-direction="left">Quitar permiso</md-tooltip>
						</md-button>
					</md-list-item>
				</md-list>

				<!-- Acceso general -->
				<div class="sectionTitle">Acceso general</div>

				<div class="accessRow" @click="Work.CanEdit() && setMode(1)">
					<md-radio v-model="visibilityMode" :disabled="!Work.CanEdit()"
										class="md-primary" @change="UpdateClearLink" :value="1" />
					<div class="accessText">
						<div class="accessTitle">Público</div>
						<div class="accessSub" v-html="stableUrlHref"></div>
					</div>
				</div>

				<div v-if="!Work.properties.IsIndexed" class="accessRow"
						 @click="Work.CanEdit() && setMode(2)">
					<md-radio v-model="visibilityMode" :disabled="!Work.CanEdit()"
										class="md-primary" @change="UpdateSetLink" :value="2" />
					<div class="accessText">
						<div class="accessTitle">Enlace</div>
						<div class="accessSub">
							<span v-html="accessLinkUrlHref"></span>
							<template v-if="visibilityMode == 2 && Work.properties.Metadata.Url">
								<a href="#" v-clipboard="() => accessLinkUrl" @click.prevent="" class="linkAction">Copiar</a>
								<a href="#" @click.prevent="RegenLink" class="linkAction">Cambiar</a>
							</template>
						</div>
					</div>
				</div>

				<div class="accessRow" @click="Work.CanEdit() && setMode(3)">
					<md-radio v-model="visibilityMode" :disabled="!Work.CanEdit()"
										class="md-primary" @change="UpdateClearLink" :value="3" />
					<div class="accessText">
						<div class="accessTitle">Privado</div>
						<div class="accessSub">Solo visible para quienes tengan permisos asignados.</div>
					</div>
				</div>

			</md-dialog-content>
			<md-dialog-actions>
				<md-button class="md-primary md-raised" @click="open = false">Listo</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import str from '@/common/framework/str';

export default {
	name: 'SharePopup',
	data() {
		return {
			open: false,
			user: '',
			level: 'E',
			sendEmail: true,
			visibilityMode: 0
		};
	},
	computed: {
		Work() { return window.Context.CurrentWork; },
		list() { return this.Work.Permissions; },
		accessLinkUrl() {
			if (this.Work.properties.Metadata.Url) {
				if (this.Work.properties.AccessLink) {
					return str.AbsoluteUrl(this.Work.properties.Metadata.Url) + '/' + this.Work.properties.AccessLink;
				} else if (this.Work.properties.LastAccessLink) {
					return str.AbsoluteUrl(this.Work.properties.Metadata.Url) + '/' + this.Work.properties.LastAccessLink;
				}
				return '(no utilizado)';
			}
			return '(disponible al publicarse)';
		},
		stableUrlHref() {
			if (this.Work.properties.Metadata.Url) {
				var url = str.PatternUrl(this.Work.properties.Metadata.Url,
					window.Context.Configuration.ShortUrlPattern, null);
				if (this.Work.properties.Metadata.LastOnline) {
					return "<a href='" + url + "' target='_blank'>" + url + '</a>';
				}
				return url;
			}
			return '(disponible al publicarse)';
		},
		accessLinkUrlHref() {
			if (this.Work.properties.Metadata.Url && this.Work.properties.AccessLink) {
				var url = this.accessLinkUrl;
				if (this.Work.properties.Metadata.LastOnline) {
					return "<a href='" + url + "' target='_blank'>" + url + '</a>';
				}
				return url;
			}
			return this.accessLinkUrl;
		},
		generalLink() {
			if (this.visibilityMode === 2 && this.Work.properties.AccessLink) {
				return this.accessLinkUrl;
			}
			if (this.Work.properties.Metadata.Url) {
				return str.PatternUrl(this.Work.properties.Metadata.Url,
					window.Context.Configuration.ShortUrlPattern, null);
			}
			return '';
		}
	},
	methods: {
		show() {
			this.user = '';
			this.level = 'E';
			this.sendEmail = true;
			this.CalculateMode();
			this.open = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.usuario.$el.focus();
			}, 100);
		},
		setMode(mode) {
			this.visibilityMode = mode;
		},
		initials(user) {
			var a = (user.Firstname || user.Email || '?').trim();
			var b = (user.Lastname || '').trim();
			return (a.charAt(0) + (b ? b.charAt(0) : '')).toUpperCase();
		},
		formatUser(user) {
			var name = ((user.Firstname || '') + ' ' + (user.Lastname || '')).trim();
			return name !== '' ? name + ' (' + user.Email + ')' : user.Email;
		},
		formatPermission(permission) {
			return { V: 'Puede ver', E: 'Puede editar', A: 'Puede administrar' }[permission] || 'Indeterminado';
		},
		onAdd() {
			if (this.user.trim() === '') { return; }
			var loc = this;
			this.$refs.invoker.doSave(this.Work, this.Work.AddPermission,
				this.user, this.level, this.sendEmail)
				.then(function () {
					loc.user = '';
					loc.level = 'E';
				});
		},
		onDelete(item) {
			if (this.Work.IsLastAdministrator(item)) {
				alert('Debe asignar otro administrador antes de poder remover al último administrador de ' + this.Work.ThisWorkLabel() + '.');
				return;
			}
			this.$refs.invoker.message = 'Quitando permiso...';
			this.$refs.invoker.confirmDo('Quitar permiso', 'El permiso será eliminado',
				this.Work, this.Work.DeletePermission, item);
		},
		CalculateMode() {
			if (this.Work.properties.IsPrivate) { this.visibilityMode = 3; return; }
			this.visibilityMode = this.Work.properties.AccessLink ? 2 : 1;
		},
		RegenLink() {
			if (!confirm('Al cambiar el enlace quienes posean la ruta actual ya no podrán accederla.\n\n¿Está seguro?')) { return; }
			this.Work.properties.LastAccessLink = null;
			this.Work.properties.AccessLink = null;
			this.Work.properties.AccessLink = '?';
			this.doUpdate();
		},
		UpdateClearLink() {
			if (this.Work.properties.AccessLink !== null) {
				this.Work.properties.LastAccessLink = this.Work.properties.AccessLink;
				this.Work.properties.AccessLink = null;
			}
			this.doUpdate();
		},
		UpdateSetLink() {
			if (!this.Work.properties.AccessLink) {
				this.Work.properties.AccessLink = this.Work.properties.LastAccessLink || '?';
				this.Work.properties.LastAccessLink = null;
			}
			this.doUpdate();
		},
		doUpdate() {
			var loc = this;
			this.Work.properties.IsPrivate = this.visibilityMode === 3;
			var receiveLink = (this.Work.properties.AccessLink === '?');
			this.$refs.invoker.doSave(this.Work, this.Work.UpdateVisibility)
				.then(function (data) {
					if (receiveLink) { loc.Work.properties.AccessLink = data['link']; }
				});
		}
	},
	watch: {
		Work() { this.CalculateMode(); }
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.addRow {
	display: flex;
	align-items: flex-start;
	gap: 8px;

	border: 2px solid #0fa1d0;
    border-radius: 8px;
    padding-left: 10px;
    margin-bottom: 12px;
    padding-top: 7px;
}
.addRow-field { flex: 1 1 auto; }
.addRow-level { flex: 0 0 148px; }
.addRow-button { margin-top: 10px; flex-shrink: 0; }

.emailField {
	margin-top: 0 !important;
}

.notifyCheck {
	margin: 0 0 4px 8px;
}

.sectionTitle {
	font-weight: 500;
	font-size: 14px;
	margin: 28px 0 8px 0;
	color: rgba(0,0,0,0.6);
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.peopleList {
	padding: 0 !important;
}

.personRow {
	padding: 4px 0 !important;
	min-height: 44px !important;
}

.personAvatar {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background-color: #00A0D2;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 13px;
	flex-shrink: 0;
	margin-right: 10px;
}

.personInfo {
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	min-width: 0;
}
.personName {
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.permissionLabel {
	font-size: 12px;
	color: rgba(0,0,0,0.54);
}

.deleteBtn {
	flex-shrink: 0;
	margin: 0;
}

.accessRow {
	display: flex;
	align-items: flex-start;
	margin: 8px 0;
	cursor: pointer;
}
.accessRow .md-radio {
	margin: 2px 6px 0 0;
	flex-shrink: 0;
}
.accessText { flex: 1; }
.accessTitle { font-size: 14px; }
.accessSub {
	font-size: 13px;
	color: rgba(0,0,0,0.6);
	word-break: break-all;
}

.linkAction {
	font-size: 12px;
	margin-left: 8px;
	white-space: nowrap;
}

.copyLink {
	margin-right: auto;
	color: #00A0D2 !important;
}
</style>

<style rel="stylesheet/scss" lang="scss">
.sharePopup .md-dialog-container {
	max-width: 640px;
	width: 640px;
}
</style>
