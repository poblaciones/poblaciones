<template>
  <div>
    <div v-if="type == 0">
      No especificada.
    </div>
    <div v-else style="line-height: 1.2em; font-size: 0.75em;">
			<img :src='image' alt='Creative Commons' title='Creative Commons' style='float: left; margin-top: 3px; margin-right: 6px'/>
      Esta obra está bajo una licencia de Creative Commons.<br>
      Para ver una copia de esta licencia, visite:<br>
        <a :href='url' style="word-break: break-word;" target='_blank'>{{ url }}</a>.
    </div>
  </div>
</template>

<script>

import CreativeCommons from '@/common/js/creativeCommons';

export default {
	name: 'creativeCommons',
	props: [
		'license'
	],
	data() {
		return {
			type: 0,
			image: '',
			url: '' };
	},
  mounted() {
    this.decodeLicense();
	},
	watch: {
		license(v) {
			this.decodeLicense();
		}
	},
  methods: {
    decodeLicense() {
			if (this.license === '' || this.license === null) {
				this.url = '';
				this.image = '';
				this.type = 0;
			} else {
				var entity = JSON.parse(this.license);
				this.url = CreativeCommons.ResolveUrl(entity);
				this.image = CreativeCommons.GetLicenseImageByUrl(this.url);
				this.type = entity['licenseType'];
			}
    }
  }
};
</script>

<style scoped>
</style>

