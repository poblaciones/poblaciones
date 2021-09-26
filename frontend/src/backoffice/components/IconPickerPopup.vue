<template>
	<div>
		<md-dialog :md-active.sync="openPopup" @md-closed="onClosed">
			<invoker ref="invoker"></invoker>
			<md-dialog-title>
				Seleccione un ícono
			</md-dialog-title>

			<md-dialog-content>
				<md-tabs ref="tabs" @md-changed="setTab" :md-active-tab="currentTab">
					<md-tab md-label="Map Icons" style="padding: 0px" id="mapIcons">
						<mp-icon-font-panel v-model="symbolMapIcons" collection="flaticons" @selectIconDoubleClick="save"></mp-icon-font-panel>
						<div style="padding-top: 20px" v-if="symbolMapIcons">
							Tag: {{ symbolMapIcons }} <mp-copy :text="symbolMapIcons" />
						</div>
					</md-tab>
					<md-tab md-label="Fontawesome" style="padding: 0px" id="fontAwesome">
						<mp-icon-font-panel v-model="symbolFa" collection="fontawesome" @selectIconDoubleClick="save"></mp-icon-font-panel>
						<div style="padding-top: 20px" v-if="symbolFa">
							Tag: {{ symbolFa }} <mp-copy :text="symbolFa" />
						</div>
					</md-tab>
					<md-tab md-label="Personalizados" style="padding: 0px" id="custom">
						<mp-icon-font-panel v-model="symbolCustom" style="height: 190px" @selectIconDoubleClick="save"
													ref="customIcon" collection="custom" :customList="customList"></mp-icon-font-panel>

						<div class="md-layout">
							<div class="md-layout-item md-size-50">
								<mp-image-upload :showPreview="false" @changed="createIcon"
																 v-model="newImage" />
								<md-button style="margin-top: 0px" @click="deleteIcon">
									<md-icon>delete</md-icon>
									Eliminar
								</md-button>
							</div>
							<div class="md-layout-item md-size-15 tagLabel" v-show="symbolCustom !== null && symbolCustom !== ''">
								Tag: <mp-copy :text="symbolCustom" /> usu-
							</div>
							<div class="tagText">
								<mp-text v-show="symbolCustom !== null && symbolCustom !== ''"
												 v-model="symbolCustomPartial" @update="updateIcon" :maxlength="35" />
							</div>
							<div class='md-layout-item md-size-100 helper'>
								Formato recomendado: PNG 64x64. Puede obtener más íconos gratuitamente de <a href='https://www.flaticon.es/' target='_blank'>https://www.flaticon.es/</a>
							</div>
						</div>
					</md-tab>
				</md-tabs>
			</md-dialog-content>

			<md-dialog-actions>
					<md-button @click="openPopup = false">Cancelar</md-button>
					<md-button class="md-primary" @click="save()">Aceptar</md-button>

			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import MpIconFontPanel from '@/backoffice/components/MpIconFontPanel';
import arr from '@/common/framework/arr';
import str from '@/common/framework/str';

export default {
	name: 'IconPickerPopup',
		components: {
			MpIconFontPanel
		},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		customList() {
			return this.Work.Icons;
		}
	},
	data() {
		return {
			openPopup: false,
			symbolFa: null,
			symbolMapIcons: null,
			symbolCustom: '',
			symbolCustomPartial: '',
			newImage: null,
			currentTab: 'mapIcons',
		};
	},
	methods: {
		show(symbol) {
			if (symbol) {
				if (symbol.startsWith('usu-')) {
					this.currentTab = 'custom';
					this.symbolCustom = symbol;
				} else if (symbol.startsWith('fa-')) {
					this.currentTab = 'fontAwesome';
					this.symbolFa = symbol;
				} else if (symbol.startsWith('mp-')) {
					this.currentTab = 'mapIcons';
					this.symbolMapIcons = symbol;
				};
			}
			this.openPopup = true;
		},
		save() {
			var value;
			if (this.currentTab == 'mapIcons') {
				value = this.symbolMapIcons;
			} else if (this.currentTab == 'fontAwesome') {
				value = this.symbolFa;
			} else if (this.currentTab == 'custom') {
				value = this.symbolCustom;
			}
			if (!value) {
				alert('Debe seleccionar un ícono');
				return;
			}
			this.$emit('input', value);
			this.$emit('iconSelected', value);
			this.close();
		},
		close() {
			this.openPopup = false;
		},
		setTab(id) {
			if (this.currentTab != id) {
				this.currentTab = id;
			}
		},
		sanitize(file) {
			file = file.toLowerCase();
			file = file.replace(' ', '_');
			file = file.replace('-', '_');
			file = file.replace(/\W/g, '');
			file = file.replace('_', '-');
			if (file.length > 40) {
				file = file.substr(0, 40);
			}
			return file;
		},
		getNewName(file) {
			var name = "usu-";
			if (file === null) {
				file = '';
			}
			var dot = file.lastIndexOf('.');
			if (dot > 0) {
				file = file.substr(0, dot);
			}
			file = this.sanitize(file);
			name += file;
			var n = 1;
			var baseName = name;
			while (this.icon_exists(name)) {
				name = baseName + "_" + n;
				n++;
			}
			return name;
		},
		icon_exists(name) {
			for (var n = 0; n < this.Work.Icons.length; n++) {
				if (this.Work.Icons[n].Caption === name) {
					return true;
				}
			}
			return false;
		},
		updateIcon(name) {
			var name = "usu-" + this.sanitize(name);
			var id = this.$refs.customIcon.selectedId;
			this.$refs.invoker.doSave(this.Work, this.Work.UpdateIcon,
				id, name).then(function (data) {
				});
		},
		createIcon(iconImage, filename) {
			var loc = this;
			var name = this.getNewName(filename);
			this.$refs.invoker.doSave(this.Work, this.Work.CreateIcon,
				name, iconImage).then(function (data) {
					arr.Add(loc.Work.Icons, { Id: data.Id, Caption: name, Image: iconImage });
					loc.symbolCustom = name;
				});
		},
		deleteIcon() {
			var loc = this;
			var id = this.$refs.customIcon.selectedId;
			this.$refs.invoker.message = 'Eliminando...';
			this.$refs.invoker.confirmDo('Eliminar ícono', 'El ícono seleccionada será eliminado',
				this.Work, this.Work.DeleteIcon, id);
		},
		onClosed() {

		}
	},
	watch: {
		'symbolCustom'() {
			if (this.symbolCustom !== "usu-" + this.symbolCustomPartial) {
				this.symbolCustomPartial = this.symbolCustom.substr(4);
			}
		},
		'symbolCustomPartial'() {
			if (this.symbolCustom !== "usu-" + this.symbolCustomPartial) {
				var id = this.$refs.customIcon.selectedId;
				var icon = arr.GetById(this.Work.Icons, id);
				this.symbolCustom = "usu-" + this.symbolCustomPartial;
				icon.Caption = this.symbolCustom;
			}
		}
	}
};
</script>

<style rel='stylesheet/scss' lang='scss' scoped>
	.tagText {
		transform: scale(0.75);
		width: 200px;
		display: inline-table;
		padding-right: 60px;
		margin-top: -15px;
		margin-left: -38px !important;
		overflow: hidden;
	}
	.tagLabel {
		margin-top: 10px;
	}
</style>
