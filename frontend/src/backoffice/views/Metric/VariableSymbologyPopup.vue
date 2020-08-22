<template>
	<div>
	<md-dialog :md-active.sync="showDialog" :md-click-outside-to-close="false">
		<md-dialog-title>{{ title }}</md-dialog-title>
		<md-dialog-content>
		<invoker ref="invoker"></invoker>

		<value-popup ref="valuePopup">
		</value-popup>

		<div v-if="Dataset && Variable">
		<div class="md-layout md-gutter">
			<div class="md-layout-item md-size-100" v-if="!Variable.DataColumnIsCategorical">
				<md-card>
					<md-card-content>
						<div class="md-layout">
							<div class="md-layout-item md-size-100">
								<div class="separator">
										Modalidad
									</div>
								<md-radio v-model="Variable.Symbology.CutMode" :disabled="!canEdit" class="md-primary" value="S">Simple</md-radio>
								<span v-if="Variable.Data !== 'N'">
									<md-radio v-model="Variable.Symbology.CutMode" :disabled="!canEdit" class="md-primary" value="J" style="margin-left: 20px">Jenks</md-radio>
									<md-radio v-model="Variable.Symbology.CutMode" :disabled="!canEdit" class="md-primary" value="T">Ntiles</md-radio>
									<md-radio v-model="Variable.Symbology.CutMode" :disabled="!canEdit" class="md-primary" value="M">Manual</md-radio>
								</span>
								<md-radio v-model="Variable.Symbology.CutMode" class="md-primary" style="float: right; margin-right: 10px;" :disabled="!canEdit || Dataset.Labels.length === 0" value="V">Categorías</md-radio>
							</div>
							<div class="md-layout-item md-size-100" style="margin-bottom: 10px;">
								<md-divider></md-divider>
							</div>
							<div class="md-layout-item md-size-100">
								<div class="mp-right-toolbar">
									<md-button class="md-icon-button" title="Copiar simbología" @click="copySymbology">
										<md-icon>content_copy</md-icon>
									</md-button>
									<md-button v-if="canEdit" title="Pegar simbología" class="md-icon-button" @click="pasteSymbology">
										<md-icon>content_paste</md-icon>
									</md-button>
								</div>
								<div v-if="CutMode === 'S'">
									<div class="helper">Color</div>
										<mp-color-picker :canEdit="canEdit" :ommitHexaSign="true"
													v-model="singleColor" />
								</div>

								<div v-if="CutMode === 'J' || CutMode === 'M'
									 || CutMode === 'T'">
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-45">
										<mp-simple-text :canEdit="canEdit"
													:label="'Cantidad de ' + CategoriesLabel + ' (máx. 10)'"
													type="number"
													v-model="Variable.Symbology.Categories"
											/>
									</div>
									<div class="md-layout-item md-size-5">
										&nbsp;
									</div>
									<div class="md-layout-item md-size-35" v-if="CutMode !== 'M'">
										<mp-select :canEdit="canEdit" :list="roundValues"
													:model-key="true" label="Redondeo"
													v-model="Variable.Symbology.Round"
											/>
									</div>
								</div>
							</div>
							<div v-if="CutMode === 'V'">
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-80">
										<mp-select label='Variable de categorías' :canEdit='canEdit' style='padding-right: 40px;'
												v-model='Variable.Symbology.CutColumn'
												list-key='Id'
												:list='Dataset.GetNumericWithLabelColumns()'
												:render='formatColumn'
												helper='Seleccione la variable de la cual tomar las categorías'
										/>
									</div>
								</div>
							</div>

						</div>
					</div>
					</md-card-content>
				</md-card>
			</div>
			<div class="md-layout-item md-size-50" v-if="CutMode !== 'S'">
				<md-card>
					<md-card-content class="fixeHeightCard">
					<div class="md-layout">
						<div class="md-layout-item md-size-100" >
							<div class="separator">{{ CategoriesLabel }}</div>
							<md-list style="overflow-y: auto;" :style="(this.CutMode === 'V' ? 'height: 156px;':'height: 185px;')">
								<md-list-item v-for="item in Variable.Values" :key="item.Id"
															:value="item.Id" class="itemSmall">
									<mp-color-picker :canEdit="canEdit" :isDisabledObject="item"
													:ommitHexaSign="true" @selected="colorSelected(item.Value !== null)" v-model="item.FillColor"
																	 style="width: 45px; padding-top: 0px" />
									<span class="md-list-item-text">{{ item.Caption }}</span>
									<md-button v-if="canEdit && (CutMode === 'M' || item.Value === null)" class="md-icon-button md-list-action"
											@click="editValue(item)">
										<md-icon>edit</md-icon>
									</md-button>
								</md-list-item>
							</md-list>
							<div v-if="this.CutMode === 'V'" class="md-helper-text helper" style="margin-top: 8px">
								Para agregar o modificar categorías, utilice la opción Categorías en la solapa Variables.
							</div>
						</div>
					</div>
					</md-card-content>
				</md-card>
			</div>
			<div class="md-layout-item md-size-50" v-if="CutMode !== 'S'">
				<md-card>
					<md-card-content class="fixeHeightCard">
					<div class="md-layout md-gutter">

						<div class="md-layout-item md-size-100">
							<div class="mp-right-toolbar mp-bottom-toolbar">
								<md-button v-if="canEdit" title="Pegar coloreo" class="md-icon-button" @click="pasteColors">
									<md-icon>content_paste</md-icon>
								</md-button>
							</div>
							<md-field>
								<label>Estilo</label>
								<md-select :disabled="!canEdit" v-model="Variable.Symbology.Pattern">
									<md-option v-for='i in patterns' :key='i.key' :value='i.key'>
										{{ i.value }}
									</md-option>
								</md-select>
							</md-field>
						</div>

						<div class="md-layout-item md-size-100">
							<div class="helper" style="margin-bottom: -10px">Colores</div>
							<md-radio v-model="Variable.Symbology.PaletteType" :disabled="!canEdit" class="md-primary" value="P">Paleta</md-radio>
							<md-radio v-model="Variable.Symbology.PaletteType" :disabled="!canEdit" class="md-primary" value="G">Gradiente</md-radio>
						</div>

						<div class="md-layout-item md-size-100" style="position: relative;">
							<div v-if="Variable.Symbology.PaletteType === 'P'" style="margin-top: -5px;">
								<span v-if="Variable.Symbology.Rainbow !== null && Variable.Symbology.Rainbow < 15 " class="palette selectedPalette"
									:style="'background-position: 0px ' + paletteOffset(Variable.Symbology.Rainbow) + 'px;'">
								</span>
								<div v-if="Variable.Symbology.Rainbow !== null && Variable.Symbology.Rainbow !== 100 && Variable.Symbology.Rainbow >= 30" class="selectedPalette"
									v-html="renderPalette(paletteNumberToKey(Variable.Symbology.Rainbow), true)">
								</div>

								<md-field style="max-width: 265px">
									<label>Paleta</label>
									<md-select :disabled="!canEdit" v-model="Variable.Symbology.Rainbow" class="paletteDropdown" ref="paletteSelect">

										<md-optgroup label="Básicas">
											<md-option v-for="palette in palettes.basicPalettes" class="max30" :key="palette.Id" :value="palette.Id">
												-<span class="palette paletteItem palettePos"
															 :style="'background-position: 0px ' + paletteOffset(palette.Id) + 'px;'">
												</span>
											</md-option>
										</md-optgroup>
										<md-optgroup label="Secuenciales">
											<md-option v-for="palette in palettes.sequential" class="max30" :key="palette.Id" :value="palette.Id">
												-<div v-html="renderPalette(palette.Caption)"></div>
											</md-option>
										</md-optgroup>
										<md-optgroup label="Divergentes">
											<md-option v-for="palette in palettes.diverging" class="max30" :key="palette.Id" :value="palette.Id">
												-<div v-html="renderPalette(palette.Caption)"></div>
											</md-option>
										</md-optgroup>
										<md-optgroup label="Nominales">
											<md-option v-for="palette in palettes.qualitative" class="max30" :key="palette.Id" :value="palette.Id">
												-<div v-html="renderPalette(palette.Caption)"></div>
											</md-option>
										</md-optgroup>
										<md-option :key="100" :value="100">Personalizada</md-option>
									</md-select>
								</md-field>
								<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.RainbowReverse" @change="reverseCustom">
									Invertir paleta
								</md-switch>
							</div>

							<div v-show="Variable.Symbology.PaletteType === 'G'">
								<div class="helper">Rango</div>
								<mp-color-picker :canEdit="Work.CanEdit()" :ommitHexaSign="true"
																 vertical-align="top" v-model="Variable.Symbology.ColorFrom" />

								<md-button v-if="Work.CanEdit()" class="md-icon-button"
								title="Invertir colores del gradiente" @click="swapColors">
									<md-icon>swap_horiz</md-icon>
								</md-button>

								<mp-color-picker :canEdit="Work.CanEdit()" :ommitHexaSign="true"
																 vertical-align="top" v-model="Variable.Symbology.ColorTo" />
							</div>
						</div>
					</div>
					</md-card-content>
				</md-card>
			</div>
		</div>
	</div>
		</md-dialog-content>
		<md-dialog-actions>
			<template v-if="canEdit">
				<md-button @click="hide">Cancelar</md-button>
				<md-button class="md-primary" @click="Save">Guardar</md-button>
			</template>
			<md-button v-else @click="hide">Cerrar</md-button>
		</md-dialog-actions>

		</md-dialog>
		<md-dialog-prompt
				:md-active.sync="activateNullValueLabel"
				v-model="nullValueLabel"
				md-title="Descripción"
				md-input-maxlength="50"
				md-input-placeholder="Descripción..."
				md-confirm-text="Aceptar"
				md-cancel-text="Cancelar"
				@md-confirm="updateNullValueLabel">
		</md-dialog-prompt>
	</div>
</template>


<script>

import axios from 'axios';
import f from '@/backoffice/classes/Formatter';
import ValuePopup from './ValuePopup.vue';

const DEFAULT_SINGLE_COLOR = '0ce800';

const DEFAULT_FROM_COLOR = '0ce800';
const DEFAULT_TO_COLOR = 'fb0000';

const colorbrewer = require('colorbrewer');


export default {
  name: 'variableGroups',
  methods: {
		swapColors() {
			var t = this.Variable.Symbology.ColorFrom;
			this.Variable.Symbology.ColorFrom = this.Variable.Symbology.ColorTo;
			this.Variable.Symbology.ColorTo = t;
		},
		copySymbology() {
			// Prepara la info
			var data = this.Dataset.ScaleGenerator.CopySymbology(this.Variable, this.singleColor, this.customColors);
			// Listo
			var text = JSON.stringify(data);
			// La copia
			window.Db.ServerClipboardCopy(text);
		},
		pasteSymbology() {
			var loc = this;
			window.Db.ServerClipboardPaste().then(function(data) {
				if (data.text === null) {
					alert('No hay valores disponibles. Para pegar una simbología debe realizar \'copiar simbología\' en otro indicador.');
				} else
					var newClone = f.clone(loc.Variable);
					var newData = JSON.parse(data.text);
					loc.Dataset.ScaleGenerator.ApplySymbology(loc.Level, newClone, newData);
					var keepOriginalVariable = loc.originalVariable;
					loc.receiveVariable(newClone);
					loc.originalVariable = keepOriginalVariable;
					loc.RegenCategories();
			});
		},
		pasteColors() {
			var loc = this;
			window.Db.ServerClipboardPaste().then(function(data) {
				if (data.text === null) {
					alert('No hay valores disponibles. Para pegar el coloreo debe copiar la simbología de otro indicador.');
				} else {
					loc.Dataset.ScaleGenerator.ApplyColors(loc.Level, loc.Variable, JSON.parse(data.text));
					if (loc.Variable.Symbology.CustomColors) {
						loc.customColors = JSON.parse(loc.Variable.Symbology.CustomColors);
					} else {
						loc.customColors = [];
					}
					loc.RegenCategories();
				}
				});
		},
		formatColumn(column) {
			return f.formatColumn(column);
		},
		editValue(item) {
			var n = this.Variable.Values.indexOf(item);
			var previous = (n === 0 || this.Variable.Values[n - 1].Value === null ? null : this.Variable.Values[n - 1]);
			var isLast = (n === this.Variable.Values.length - 1);
			var isNull = (item.Value === null);
			if (isNull) {
				this.nullValueLabel = item.Caption;
				this.activateNullValueLabel = true;
			} else {
				this.$refs.valuePopup.show(this.Variable, this.customColors, item, previous, isLast);
			}
		},
		updateNullValueLabel() {
			this.Variable.Values[0].Caption = this.nullValueLabel;
		},
		colorSelected(switchToCustom) {
			var hasNulls = (this.Variable.Values.length > 0 && this.Variable.Values[0].Value === null);
			var nullOffset = (hasNulls ? 1 : 0);
			for(var n = nullOffset; n < this.Variable.Values.length; n++) {
				this.customColors[n - nullOffset] = this.Variable.Values[n].FillColor;
			}
			if (switchToCustom) {
				this.Variable.Symbology.Rainbow = 100;
				this.Variable.Symbology.PaletteType = 'P';
			}
		},
		RegenCategories() {
			this.Variable.Symbology.CustomColors = JSON.stringify(this.customColors);
			return this.Dataset.ScaleGenerator.RegenVariableCategories(this.Level, this.Variable);
		},
		paletteOffset(paletteId) {
			return -(paletteId * 32);
		},
		show(level, variable) {
			// Se pone visible
			this.Level = level;
			this.singleColor = DEFAULT_SINGLE_COLOR;
			this.receiveVariable(variable);
			this.checkDefaults();
			this.showDialog = true;
		},
		receiveVariable(variable) {
			this.originalVariable = variable;
			this.Variable = f.clone(variable);
			if (this.Variable.Symbology.CustomColors) {
				this.customColors = JSON.parse(this.Variable.Symbology.CustomColors);
			} else {
				this.customColors = [];
			}
			if (this.Variable.Data === 'N' && (this.CutMode === "J" || this.CutMode === "T" || this.CutMode === "M")) {
				this.Variable.Symbology.CutMode = 'S';
			}
			if (this.CutMode === 'S') {
				if (this.Variable.Values.length > 0) {
					this.singleColor = this.Variable.Values[0].FillColor;
				}
			}
		},
		reverseCustom() {
			if (this.Variable.Symbology.PaletteType === 'P' && this.Variable.Symbology.Rainbow === 100) {
				// Invierte los colores
				for(var n = 0; n < this.Variable.Values.length / 2; n++) {
					var target = (this.Variable.Values.length - 1) - n;
					var tmp = this.Variable.Values[n].FillColor;
					this.Variable.Values[n].FillColor = this.Variable.Values[target].FillColor;
					this.Variable.Values[target].FillColor = tmp;
				}
				this.colorSelected();
			}
		},
		checkDefaults() {
			if (this.Variable.Symbology.ColorFrom === null) {
				this.Variable.Symbology.ColorFrom = DEFAULT_FROM_COLOR;
				this.Variable.Symbology.ColorTo = DEFAULT_TO_COLOR;
			}
			if (this.CutMode === null) {
				this.Variable.Symbology.CutMode = 'S';
			}
		},
		hide() {
			this.showDialog = false;
		},
		ValidateRepetedRanges() {
			var known = {};
			for (var i = 0; i < this.Variable.Values.length; i++) {
				var v = this.Variable.Values[i];
				if (known[v.value]) {
					return v.Value + ' - ' + v.Caption;
				}
				known[v.Value] = true;
			}
			return '';
		},
		ValidateIncreasing() {
			if (this.CutMode === 'V' ||
				this.CutMode === 'S') {
				return true;
			}
			var last = null;
			for (var i = 0; i < this.Variable.Values.length; i++) {
				var v = this.Variable.Values[i];
				if (v.value !== null && last !== null &&
						v.value > last) {
						alert('Los rangos deben encontrarse en orden creciente y no superponerse.');
						return false;
				}
				last = v.Value;
			}
			return true;
		},
		ValidateRanges() {
			// Valida si hay mayores a uno posterior
			if (!this.ValidateIncreasing()) {
				return false;
			}
			// Valida si hay dos values iguales
			var val = this.ValidateRepetedRanges();
			if (val === '') {
				return true;
			}
			var text = '';
			if (this.CutMode === 'V') {
				alert ('Dos etiquetas de valores refieren al mismo valor (' + val + ').');
			} else {
				alert ('Dos rangos de valores se superponen (' + val + ').');
			}
			return false;
		},
		Save() {
			if (this.Variable.Data === null) {
				alert("Debe indicar una variable para el valor para la fórmula.");
				this.currentTab = 'tab-formula';
				return;
			}
			if (!this.ValidateRanges()) {
				return;
			}
			var loc = this;
			this.Variable.Symbology.CustomColors = JSON.stringify(this.customColors);
			if (this.CutMode === 'S') {
				var caption = 'Total';
				var color = this.singleColor;
				if (this.Variable.Values.length === 0) {
					var value = this.Dataset.ScaleGenerator.CreateValue(caption, 1, color, 1);
					this.Variable.Values.push(value);
				}
				this.Variable.Values[0].Caption = caption;
				this.Variable.Values[0].FillColor = color;
			}

			if (JSON.stringify(this.originalVariable) === JSON.stringify(this.Variable)) {
				loc.hide();
			} else {
				this.$refs.invoker.do(this.Dataset,
						this.Dataset.UpdateVariable, this.Level, this.Variable).then(function() {
						loc.hide();
						});
			}
		},
		DisplayError(errMessage) {
			this.error = 'El proceso no ha podido ser completado. ' + errMessage;
		},
		paletteNumberToKey(n) {
			return this.Dataset.ScaleGenerator.paletteNumberToKey(n);
		},
		renderPalette(item, skipPalettePos) {
			var palette = colorbrewer[item];
			var html = "<div style='display: flex;' class='paletteItem" + (skipPalettePos ? "" : " palettePos") + "'>";
			var keys = Object.keys(palette);
			var last = keys[keys.length - 1];
			var width = 240;
			var elements = palette[last];
			var size = width / elements.length;
			for (var n = 0; n < elements.length; n++) {
				html += "<div style='height: 25px; width: " + size + "px; background-color: " + elements[n] + "'></div>";
			}
			return html + "</div>";
		}
  },
	computed: {
	 Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		canEdit() {
			if (this.Work) {
				return this.Work.CanEdit();
			} else {
				return false;
			}
		},
		title() {
			if (this.Level) {
				var varCaption = '';
				if (this.Variable.Data) {
					varCaption = this.Dataset.formatTwoColumnVariableTooltip(this.Variable.Data, this.Variable.DataColumn);
					if (varCaption !== '') varCaption = ' - ' + varCaption;
				}
				return this.Level.MetricVersion.Metric.Caption + varCaption;
			} else {
				return '';
			}
		},
		CutMode() {
			return this.Variable.Symbology.CutMode;
		},
		CategoriesLabel() {
			return (this.CutMode === 'V' ? 'categorías' : 'cortes');
		},
		roundValues () {
			return [
				{ Id: '1000', Caption: '1000' },
				{ Id: '100', Caption: '100' },
				{ Id: '10', Caption: '10' },
				{ Id: '5', Caption: '5' },
				{ Id: '2.5', Caption: '2,5' },
				{ Id: '0', Caption: 'Ninguno' },
				{ Id: '1', Caption: '#' },
				{ Id: '0.1', Caption: '#,#' },
				];
		},
		palettes() {
			return this.Dataset.ScaleGenerator.Palettes;
		},
		patterns() {
			return [{ value: 'Pleno', key: 0 },
							{ value: 'Contorno', key: 1 },
							{ value: 'Semáforo', key: 2 },
							{ value: 'Cañería de agua', key: 3  },
							{ value: 'Cañería de cloaca', key: 4 },
							{ value: 'Cañería de gas', key: 5 },
							//{ value: 'Tendido eléctrico', key: 6 },
							{ value: 'Diagonal', key: 7 },
							{ value: 'Horizontal', key: 8 },
							{ value: 'Diagonal invertida', key: 9 },
							{ value: 'Vertical', key: 10 },
							{ value: 'Puntos', key: 11 }];
		}
	},
	components: {
		ValuePopup
	},
	data() {
		return {
			Level: null,
			Variable: null,
			showDialog: false,
			activateNullValueLabel: false,
			nullValueLabel: '',
			isOpen: false,
			originalVariable: null,
			customColors: [],
			singleColor: '0ce800'
		};
	},
	watch: {
		'Variable.Symbology.CutMode'() {
			this.RegenCategories();
		},
		'Variable.Symbology.CutColumn'() {
			this.RegenCategories();
		},
		'Variable.Symbology.Categories'() {
			if (this.Variable.Symbology.Categories > 10) {
				this.Variable.Symbology.Categories = 10;
			} else if (this.Variable.Symbology.Categories < 2) {
				this.Variable.Symbology.Categories = 2;
			}
			this.RegenCategories();
		},
		'Variable.Symbology.Round'() {
			this.RegenCategories();
		},
		'Variable.Symbology.ColorFrom'() {
			if (this.Variable.Symbology.PaletteType === 'G') {
				this.RegenCategories();
			}
		},
		'Variable.Symbology.ColorTo'() {
			if (this.Variable.Symbology.PaletteType === 'G') {
				this.RegenCategories();
			}
		},
		'Variable.Symbology.PaletteType'() {
			if (this.Variable.Symbology.CutMode !== 'S') {
				this.RegenCategories();
			}
		},
		'Variable.Symbology.Rainbow'() {
			if (this.Variable.Symbology.PaletteType === 'P') {
				this.RegenCategories();
			}
		},
		'Variable.Symbology.RainbowReverse'() {
			this.RegenCategories();
		},
	}
};
</script>

<style lang="scss">
.selectedPalette {
	z-index: 10;
	pointer-events: none;
	position: absolute;
	height: 27px;
	overflow: hidden;
	width: calc(100% - 48px);
	top: 20px;
}

.palettePos {
	position: absolute;
	top: 4px;
}

.paletteItem {
	border: 1px solid #dadada;
	width: 240px;
}

.palette {
	background-image: url('../../../common/assets/palette.png');
	height: 27px;
	background-size: 240px 480px;
	background-repeat: repeat-y;
}

.itemSmall {
height: 42px;
}

.fixeHeightCard {
	height: 250px;
}
.max30 {
	height: 35px;
}
.paletteDropdown md-select-menu md-menu-content-bottom-start md-menu-content-small md-menu-content {
		width: 100px!important;
	}
</style>

