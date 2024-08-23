<template>
	<div v-if="newMetric.Type">
		<md-dialog :md-active.sync="openPopup" :md-click-outside-to-close="false">

			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" @closed="stepperClosed" @completed="stepperCompleted" :title="'Realizando ' + action"></stepper>

			<md-dialog-title>
				Asistente de {{ action }}
				<div class="stepProgress">

				</div>
			</md-dialog-title>

			<md-dialog-content :class="disabledOnStepping">
				<div style="padding-top: 18px; min-height: 280px;">
					<step-distance-welcome v-show="currentStep == 'stepDistanceWelcome'" ref="stepDistanceWelcome" :newMetric="newMetric"  @raiseNext="next" />
					<step-area-welcome v-show="currentStep == 'stepAreaWelcome'" ref="stepAreaWelcome" :newMetric="newMetric"  @raiseNext="next" />
					<step-metric v-show="currentStep == 'stepMetric'" ref="stepMetric" :newMetric="newMetric" @raiseNext="next" @raisePrev="prev" />
					<step-source v-show="currentStep == 'stepSource'" ref="stepSource" :newMetric="newMetric" @raiseNext="next" @raisePrev="prev" />
					<step-distance-output v-show="currentStep == 'stepDistanceOutput'" ref="stepDistanceOutput" :newMetric="newMetric" />
					<step-area-output v-show="currentStep == 'stepAreaOutput'" ref="stepAreaOutput" :newMetric="newMetric" />
				</div>
			</md-dialog-content>

			<md-dialog-actions :class="disabledOnStepping">
				<div v-if="columnExists" style='color:red;margin:auto'>Sobreescribiendo</div>
				<div>
					<md-button @click="openPopup = false" style="float: left">Cancelar</md-button>
					<md-button class="md-primary" :disabled="step == 1 || processing" @click="prev()">Anterior</md-button>
					<md-button class="md-primary" :disabled="processing" v-if="!isLast" @click="next()">Siguiente</md-button>
					<md-button class="md-primary" v-if="isLast" @click="save">Finalizar</md-button>
				</div>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import StepAreaWelcome from './StepAreaWelcome';
import StepDistanceWelcome from './StepDistanceWelcome';
import StepMetric from './StepMetric';
import StepSource from './StepSource';
import StepAreaOutput from './StepAreaOutput';
import StepDistanceOutput from './StepDistanceOutput';


export default {
	name: 'calculateMetric',
	components: {
		StepAreaWelcome,
		StepDistanceWelcome,
		StepMetric,
		StepSource,
		StepAreaOutput,
		StepDistanceOutput,
	},
	data() {
		return {
			step: 1,
			newMetric: {},
			openPopup: false,
			stepperRunning: false,
			processing: false,
			clientProcessing: [],
			steps: {
				'area': ['stepAreaWelcome', 'stepMetric', 'stepSource', 'stepAreaOutput'],
				'distance': ['stepDistanceWelcome', 'stepMetric', 'stepSource', 'stepDistanceOutput']
			}
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
		columnExists() {
			return (this.$refs.stepSource && this.$refs.stepSource.columnExists);
		},
		isLast() {
			return this.calculateStep(this.step + 1) === null;
		},
		maxSteps() {
			if (this.step == 1) {
				return '';
			} else {
				return ' de ' + (this.steps[this.newMetric.Type].length + 1);
			}
		},
		action() {
			if (this.newMetric.Type == 'distance') {
				return 'rastreo';
			} else {
				return 'conteo';
			}
		},
		disabledOnStepping() {
			return (this.stepperRunning ? 'disabledDiv' : '');
		},
		currentStep() {
			return this.calculateStep(this.step);
		},
	},
	mounted() {
		this.newMetric = this.initNewMetric();
	},
	methods: {
		initNewMetric() {
			let defaultHasDescription = false;
			return {
				SourceMetric: {},
				DefaultHasDescription: defaultHasDescription,
				SelectedVersion: null,
				SelectedLevel: null,
				SelectedVariable: null,

				Id: null,
				Type: '',
				Output: {
					HasDescription: defaultHasDescription,
					HasValue: true,
					HasCoords: true,
					HasMaxDistance: false,
					MaxDistance: 10,
				},
				OutputArea: {
					HasSumValue: false,
					HasMaxValue: false,
					HasMinValue: false,
					HasCount: false,
					IsInclusionPoint: false,
					InclusionDistance: 2,
				},
				Source: {
					ValueLabelIds: [],
					VariableId: null,
				},
			};
		},
		calculateStep(step) {
			var steps = this.steps[this.newMetric.Type];
			if (step - 1 < steps.length) {
				return steps[step - 1];
			} else {
				return null;
			}
		},
		next(assyncPassed) {
			var loc = this;
			var currentStepControl = this.$refs[this.currentStep];
			if (currentStepControl.asyncValidate && !assyncPassed) {
				loc.processing = true;
				currentStepControl.asyncValidate().then(function (passed) {
					loc.processing = false;
					return loc.next(passed);
				}).catch(function (ret) {
					loc.processing = false;
					return ret;
					});
				return;
			}

			if (!this.validate()) {
				return;
			}
			if (this.step < this.steps[this.newMetric.Type].length) {
				this.step++;
				this.focusCurrentStep(true);
			}
		},
		prev() {
			if(this.step > 1) {
				this.step--;
				this.focusCurrentStep(false);
			}
		},
		focusCurrentStep(next) {
			var currentStepControl = this.$refs[this.currentStep];
			if (currentStepControl.focus)
				currentStepControl.focus(next);
		},
		defineType(type) {
			if (this.newMetric.Type != type) {
				this.newMetric = this.initNewMetric();
			}
			this.newMetric.Type = type;
		},
		show(typeDistance = false) {
			this.step = 1;
			this.stepperRunning = false;
			this.processing = false;
			this.defineType(typeDistance ? 'distance' : 'area');
			this.openPopup = true;
		},
		save() {
			if (!this.validate()) {
				return;
			}
			this.Work.WorkChanged();
			let stepper = this.$refs.stepper;
			this.clientProcessing = [];
			stepper.startUrl = this.Dataset.CalculateNewMetricUrl(this.newMetric.Type);
			stepper.stepUrl = this.Dataset.StepCalculateNewMetricUrl(this.newMetric.Type);
			stepper.args = this.args();
			stepper.clientSteps = this.defineClientSteps();
			this.stepperRunning = true;
			stepper.Start();
		},
		args() {
			this.newMetric.Source.MetricId = this.newMetric.SourceMetric.Metric.Id;
			this.newMetric.Source.VersionId = this.newMetric.SelectedVersion.Version.Id;
			this.newMetric.Source.LevelId = this.newMetric.SelectedLevel.Id;

			var labelIds = JSON.stringify(this.newMetric.Source.ValueLabelIds);
			this.newMetric.Source.ValueLabelIds = null;
			var compact = this.compactIdList(labelIds);
			var ret = {
					k: this.Dataset.properties.Id,
					s: JSON.stringify(this.newMetric.Source),
					labelsCompact: compact.values,
					labelsDict: JSON.stringify(compact.dict),
			};

			if (this.newMetric.Type == 'area') {
				ret.o = JSON.stringify(this.newMetric.OutputArea);
			} else {
				ret.o = JSON.stringify(this.newMetric.Output);
			}
			// Definir
			return ret;
		},
		compactIdList(labelIds) {
			var dict = [];
			var start;
			var gain = 0;
			var values = labelIds;
			var key = 'a';
			var keyOverhead = 7;
			var start = labelIds.indexOf(',');
			if (start < 0) {
				start = 1;
			}
			while (true) {
				var lastGain = 0;
				var lastLength = 0;
				for (var n = 2; n < values.length - start - 1; n++) {
					var chunk = values.substr(start, n);
					var newValues = values.replaceAll(chunk, key);
					var gain = values.length - newValues.length;
					if (gain < lastGain) {
						break;
					} else {
						lastGain = gain;
						lastLength = n;
					}
				}
				if (lastGain > 0 && lastGain > lastLength + keyOverhead) {
					var chunk = values.substr(start, lastLength);
					values = values.replaceAll(chunk, key);
					dict.push({ k: key, v: chunk });
					key = String.fromCharCode(key.charCodeAt() + 1);
				} else {
					break;
				}
			}
			return { dict: dict, values: values };
		},
		stepperCompleted() {
			this.Dataset.ScaleGenerator.Clear();
		},
		stepperClosed() {
			this.stepperRunning = false;
			let stepper = this.$refs.stepper;
			if (stepper.complete) {
				this.openPopup = false;
			}
		},
		GetLevelAndVariable(variableId) {
			for (var level of this.Dataset.MetricVersionLevels) {
				for (var variable of level.Variables) {
					if (variable.Id === variableId) {
						return { Level: level, Variable: variable };
					}
				}
			}
			throw new Error('No se ha podido obtener el indicador creado.');
		},
		parseVariables(variableIdList) {
			var varsArr = variableIdList.split(",");
			var ret = [];
			for (var varId of varsArr) {
				ret.push(this.GetLevelAndVariable(parseInt(varId)));
			}
			return ret;
		},
		GetLargestNTilesCut(size, groups) {
			for (var n = size; n >= 1; n--) {
				var elements = groups[n].ntiles.length;
				if (elements === n - 1 && groups[n].ntiles[elements - 1] !== null) {
					return n;
				}
			}
			return 0;
		},
		fetchDistributions() {
			var loc = this;
			var varList = loc.parseVariables(loc.$refs.stepper.result);
			this.clientProcessing = [];
			var getters = [];
			for (var varItem of varList) {
				getters.push(loc.createDistributionsFetcher(varItem));
			}
			return Promise.all(getters);
		},
		createDistributionsFetcher(item) {
			var loc = this;
			return loc.Dataset.ScaleGenerator.GetAndCacheColumnDistributions(item.Level, item.Variable).then(
				function (data) {
					var n = loc.GetLargestNTilesCut(5, data.Groups);
					if (n > 1) {
						item.Variable.Symbology.CutMode = 'T';
						item.Variable.Symbology.Round = 0;
						item.Variable.Symbology.Categories = n;
					} else {
						item.Variable.Symbology.CutMode = 'S';
					}
					loc.clientProcessing.push(item);
				});
		},
		applySymbologies() {
			var savers = [];
			var loc = this;
			for (var varItem of this.clientProcessing) {
				savers.push(loc.Dataset.ScaleGenerator.RegenAndSaveVariable(varItem.Level, varItem.Variable));
			}
			return Promise.all(savers);
		},
		defineClientSteps() {
			var steps = [];
			steps.push({
				status: 'Obteniendo resultados',
				do: this.Dataset.ReloadColumns,
				container: this.Dataset
			});
			steps.push({
				status: 'Calculando distribuciones',
				do: this.fetchDistributions,
				container: this
			});
			steps.push({
				status: 'Aplicando simbologías',
				do: this.applySymbologies,
				container: this
			});
			return steps;
		},
		validate() {
			var currentStepControl = this.$refs[this.currentStep];
			if (currentStepControl.validate) {
				return currentStepControl.validate();
			} else {
				return true;
			}
		},
	},
};
</script>

<style scoped>
	.stepProgress
	{
		float: right;
	}
</style>

