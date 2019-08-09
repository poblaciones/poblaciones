<template>
	<div>
		<div>
			<table class="localTable">
				<tbody>
					<tr>
						<td>Título:</td>
						<td>{{ version.Work.Name }}</td>
					</tr>
					<tr>
						<td>Dataset:</td>
						<td>{{ level.Dataset.Name }}</td>
					</tr>
					<tr v-if="version.Work.Abstract">
						<td>Resumen:</td>
						<td>{{ version.Work.Abstract }}</td>
					</tr>
					<tr>
						<td style="width: 120px;">Dirección:</td>
						<td>
							<a target="_blank" :href="version.Work.Url">{{ version.Work.Url }}</a>
						</td>
					</tr>
					<tr>
						<td>{{ (version.Work.Type === 'P' ? 'Procesamiento' : 'Autores') }}:</td>
						<td>{{ version.Work.Authors }}</td>
					</tr>
          <tr v-if="version.Work.ReleaseDate">
            <td>Publicación:</td>
            <td>{{ version.Work.ReleaseDate }}</td>
          </tr>
          <tr>
            <td>Licencia:</td>
            <td>
              <creativeCommons :license="version.Work.License"/>
            </td>
          </tr>
					<tr>
						<td>Nivel:</td>
						<td v-if="version.Levels.length > 1">
							<select v-model="downloadLevel">
								<option v-for="(level, index) in version.Levels" :key="level.Id" :value="index">{{ level.Name }}</option>
							</select>
						</td>
						<td v-else="">{{ level.Name }}</td>
					</tr>
					<!--<tr> //TODO: -->
					<!--	<td>Cita:</td>-->
					<!--	<td>(Armar algo simil APA… no sé si tiene sentido)</td>-->
					<!--</tr>-->

             <tr>
            <td>Metadatos:</td>
            <td>
              <a target="_blank" :href="resolveMetadataUrl()">
                <file-pdf-icon title="Descargar"/> Descargar
              </a>
            </td>
          </tr>
					<tr v-if="version.Work.Files && version.Work.Files.length > 0">
						<td>Adjuntos:</td>
						<td>
							<span v-for="file in version.Work.Files" :key="file.Id">
									<a target="_blank" :href="resolveFileUrl(file)">
                    <file-pdf-icon title="Descargar"/> {{ file.Caption }}
                  </a>
							</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>


<script>
import h from '@/public/js/helper';
import FilePdfIcon from 'vue-material-design-icons/FilePdf.vue';
import creativeCommons from '@/public/components/widgets/creativeCommons.vue';
import str from '@/common/js/str';

export default {
	name: 'metricMetadataPopup',
	props: [
		'metric',
	],
	components: {
    creativeCommons,
    FilePdfIcon
	},
	data() {
		return {
			downloadLevel: 0,
		};
	},
  methods: {
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.version.Work.MetadataId + '&f=' + file.FileId;
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.version.Work.MetadataId + '&d=' + this.level.Dataset.Id + '&w=' + this.version.Work.Id;
		},
	},
	computed:
	{
		version() {
			return this.metric.SelectedVersion();
		},
		level() {
			return this.version.Levels[this.downloadLevel];
			}
		}
	};
</script>
<style scoped>
</style>
