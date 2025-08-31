<template>
	<Modal :title="title" ref="showAnnotations" @ok="onSave" @cancel="onCancel" :clickOutsideToClose="false"
				 :showCancel="true" :showOk="true" :backgroundColor="backgroundColor">
		<div v-if="element">
			<div v-if="element.Type != 'C' && element.Type != 'Q'" class="form-group">
				<label for="name">Nombre:</label>
				<input type="text" ref="description" v-model="element.Description">
			</div>
			<div class="form-group">
				<label for="description">Descripción:</label>
				<textarea v-model="element.DescriptionLong"></textarea>
			</div>
			<div class="form-group">
				<label for="color">Color:</label>
				<input type="color" v-model="element.Color">
			</div>
			<div class="form-group">
				<label for="list">Lista:</label>
				<select v-model="element.AnnotationId">
					<option v-for="item in lists" :key="item.Value" :value="item.Value">{{ item.Caption }}</option>
				</select>
			</div>
		</div>
	</Modal>
</template>


<script>
import h from '@/map/js/helper';
import str from '@/common/framework/str';
import Modal from '@/map/components/popups/modal';

export default {
	name: 'annotationItemPopup',
	props: [
		'backgroundColor'
	],
	components: {
		Modal
	},
	data() {
		return {
			metadata: null,
			element: {},
			sourceElement: {},
			title: 'Editar',
			closePromise: null,
			lists: []
		};
	},
  methods: {
		show(element) {
			var loc = this;
			if (element.Id && !element.Id.startsWith('temp-')) {
				this.title = "Editar";
			} else {
				this.title = "Agregar";
			}
			this.sourceElement = element;
			this.element = this.clone(element);
			this.lists = this.resolveLists();

			if (!this.element.AnnotationId) {
				this.element.AnnotationId = this.lists[0].Value;
			}
			loc.$refs.showAnnotations.show();
			setTimeout(() => {
				loc.$refs.description.focus();
			}, 100);

			var returnPromise = new Promise(resolve => {
				loc.closePromise = resolve;
			});
			return returnPromise;
		},
		onSave() {
			this.sourceElement.Description = this.element.Description;
			this.sourceElement.DescriptionLong = this.element.DescriptionLong;
			this.sourceElement.Color = this.element.Color;
			this.sourceElement.AnnotationId = this.element.AnnotationId;
			this.closePromise(this.sourceElement);
			this.$refs.showAnnotations.close();
		},
		onCancel() {
			this.$refs.showAnnotations.close();
		},
		clone(o) {
			return JSON.parse(JSON.stringify(o));
		},
		resolveLists() {
			var ret = [];
			if (!this.element || !window.SegMap || !window.SegMap.Annotations) {
				return ret;
			}
			for (var ann of window.SegMap.Annotations) {
				if (ann.properties.AllowedTypes.includes(this.element.Type)) {
					ret.push({ Value: ann.properties.Id, Caption: ann.properties.Caption });
				}
			}
			if (ret.length == 0) {
				ret.push({ Value: -1, Caption: 'Nueva lista' });
			}
			return ret;
		}
	},
	computed: {

	}
};
</script>
<style scoped>

	label {
		width: 120px;
	}
</style>
