<template>
	<div v-if="open && work" class="wmp-overlay" @click.self="hide">
		<div class="wmp-dialog" role="dialog" aria-modal="true">
			<div class="wmp-header" :style="headerStyle">
				<span class="wmp-title">{{ title }}</span>
				<button class="wmp-close" @click="hide" aria-label="Cerrar">×</button>
			</div>
			<div class="wmp-body">
				<table class="wmp-table">
					<tbody>
						<tr>
							<td class="wmp-label">Título</td>
							<td>{{ work.Metadata.Name }}</td>
						</tr>
						<tr v-if="work.Metadata.Authors">
							<td class="wmp-label">Autores</td>
							<td>{{ work.Metadata.Authors }}</td>
						</tr>
						<tr v-if="work.Metadata.ReleaseDate">
							<td class="wmp-label">Publicación</td>
							<td>{{ formattedReleaseDate }}</td>
						</tr>
						<tr v-if="work.Metadata.Abstract">
							<td class="wmp-label">Resumen</td>
							<td>{{ work.Metadata.Abstract }}</td>
						</tr>
						<tr v-if="work.Url">
							<td class="wmp-label">Dirección</td>
							<td><a :href="work.Url" target="_blank" rel="noopener">{{ work.Url }}</a></td>
						</tr>
						<tr v-if="work.Metadata.Name">
							<td class="wmp-label">Cita (APA)</td>
							<td class="wmp-citation">
								<span v-html="citationHtml"></span>
								<button class="wmp-copy" @click="copy(citationText)">Copiar</button>
							</td>
						</tr>
						<tr v-if="work.Metadata.License">
							<td class="wmp-label">Licencia</td>
							<td><creativeCommons :license="work.Metadata.License" /></td>
						</tr>
						<tr v-if="work.Metadata.Files && work.Metadata.Files.length">
							<td class="wmp-label">Adjuntos</td>
							<td>
								<span v-for="file in work.Metadata.Files" :key="file.Id" class="wmp-file">
									<a v-if="file.Web" :href="file.Web" target="_blank" rel="noopener">{{ file.Caption }}</a>
									<span v-else>{{ file.Caption }}</span>
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
	import apa from '@/common/js/citationAPA';
	import creativeCommons from '@/map/components/controls/creativeCommons.vue';

	export default {
		name: 'WorkMetadataPopup',
		components: { creativeCommons },
		props: {
			backgroundColor: { type: String, default: '#00A0D2' }
		},
		data() {
			return {
				open: false,
				work: null,
				title: 'Información'
			};
		},
		computed: {
			headerStyle() {
				return { backgroundColor: this.backgroundColor };
			},
			// Año de ReleaseDate (formato ISO 'YYYY-MM-DD'); null si no aplica.
			year() {
				var s = this.work && this.work.Metadata ? this.work.Metadata.ReleaseDate : null;
				return (s && s.length >= 4 && s[4] === '-') ? s.slice(0, 4) : null;
			},
			formattedReleaseDate() {
				var s = this.work.Metadata.ReleaseDate;
				if (!s || s.length < 10 || s[4] !== '-') return s || '';
				return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4);
			},
			citationHtml() {
				var m = this.work ? this.work.Metadata : null;
				if (!m || !m.Name) return '';
				return apa.onlineMapCitation(this.htmlEncode(m.Authors), this.htmlEncode(this.year), this.htmlEncode(m.Name), this.work.Url);
			},
			citationText() {
				var m = this.work ? this.work.Metadata : null;
				if (!m || !m.Name) return '';
				return apa.onlineMapCitation(m.Authors, this.year, m.Name, this.work.Url, true);
			}
		},
		methods: {
			// Firma invocada por workPanel: show(work.Current).
			show(work) {
				this.work = work || null;
				this.title = 'Información';
				this.open = true;
			},
			hide() {
				this.open = false;
			},
			htmlEncode(s) {
				if (s == null) return '';
				return document.createElement('a').appendChild(document.createTextNode(s)).parentNode.innerHTML;
			},
			copy(text) {
				if (navigator.clipboard) navigator.clipboard.writeText(text);
			}
		}
	};
</script>

<style scoped>
	.wmp-overlay {
		position: fixed;
		inset: 0;
		background: rgba(38, 50, 56, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3000;
	}
	.wmp-dialog {
		background: #fff;
		border-radius: 8px;
		width: 560px;
		max-width: calc(100vw - 32px);
		max-height: 82vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
	}
	.wmp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		color: #fff;
	}
	.wmp-title { font-size: 15px; font-weight: 600; }
	.wmp-close {
		background: none;
		border: none;
		color: #fff;
		font-size: 22px;
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
		opacity: 0.85;
	}
	.wmp-close:hover { opacity: 1; }
	.wmp-body { padding: 16px; overflow: auto; }
	.wmp-table { width: 100%; border-collapse: collapse; font-size: 14px; color: #37474f; }
	.wmp-table td { padding: 7px 8px; vertical-align: top; border-bottom: 1px solid #eceff1; line-height: 1.4; }
	.wmp-label { width: 120px; color: #78909c; font-weight: 600; white-space: nowrap; }
	.wmp-table a { color: #1976d2; text-decoration: none; word-break: break-all; }
	.wmp-table a:hover { text-decoration: underline; }
	.wmp-citation { display: flex; align-items: flex-start; gap: 8px; }
	.wmp-copy {
		flex: 0 0 auto;
		border: 1px solid #cfd8dc;
		background: #f5f7f8;
		border-radius: 4px;
		font-size: 12px;
		padding: 2px 8px;
		cursor: pointer;
		color: #455a64;
	}
	.wmp-copy:hover { background: #eceff1; }
	.wmp-file { display: inline-block; margin-right: 12px; }
</style>
