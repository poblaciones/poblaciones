<template>
	<div>
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100">
									<mp-text :canEdit="Work.CanEdit()" label="Título" :maxlength="150"
													 helper="Nombre de la cartografía, indicando opcionalmente la cobertura,
														fuente o período. Ej. Patrones de migración interprovincial 2001-2010."
													 :required="true" @update="UpdateTitle"
													 v-model="metadata.Title" />
								</div>
								<div class="md-layout-item md-size-90 md-small-size-100">

										<mp-text :canEdit="Work.CanEdit()" label="Descripción" :multiline="true" :maxlength="400"
													 :rows="3" helper="Breve descripción del contenido. Ej. Se presentan resultados de una investigación sobre migración en la Argentina a partir de variaciones intercensales de población en edad activa." @update="Update"
											v-model="metadata.Abstract" />
								</div>
								<div class="md-layout-item md-size-100">
									<div class="md-layout md-gutter gutterBottom" v-if="metadata.Url">
										<div class="md-layout-item md-size-30 md-xsmall-size-100">
											<label class="with-area">Dirección:</label>
										</div>
										<div class="md-layout-item md-size-60">
											<a v-if="metadata.LastOnline" style="color: #989797;" :href="absoluteMap(appendAccessLink(metadata.Url))" target="_blank">{{ absoluteMap(appendAccessLink(metadata.Url)) }}</a>
											<span v-else>{{ absoluteMap(appendAccessLink(metadata.Url)) }} (sin publicar)</span>
										</div>
									</div>
									<div class="md-layout md-gutter gutterBottom" v-if="metadata.Url && Work.ArkUrl">
										<div class="md-layout-item md-size-30 md-xsmall-size-100">
											<label class="with-area">Ark:</label>
										</div>
										<div class="md-layout-item md-size-60">
											<a v-if="metadata.LastOnline" style="color: #989797;" :href="Work.ArkUrl" target="_blank">{{ Work.ArkUrl }}</a>
											<span v-else>{{ Work.ArkUrl }} (sin publicar)</span>
											<mp-help :positionInline="true" :text="`<p><b>¿Qué son los identificadores ARK?</b></p><p>
													Al igual que los DOI, los ARK son identificadores persistentes creados para evitar la pérdida de validez de referencias en internet a lo largo del tiempo.
													</p><p>
													Poblaciones ofrece gratuitamente ARKs para las cartografías alojadas. De esta forma, los contenidos pueden ser vinculados en la web con un identificador corto y estable apoyado en la infraestructura de la ARK Alliance.
													</p><p>
													Más información: <a href='https://arks.org/' target='_blank'>https://arks.org/</a>
													</p>`" />
										</div>
									</div>
									<div class="md-layout md-gutter">
										<div class="md-layout-item md-size-30 md-xsmall-size-100">
											<label class="with-area">Metadatos:</label>
										</div>
										<div class="md-layout-item md-size-60">
											<a style="color: #989797;" :href="resolveMetadataUrl()" target="_blank">
												<i class="far fa-file-pdf" /> Descargar
											</a>
										</div>
									</div>

									<div class="md-layout md-gutter gutterTop" v-if="metadata.OnlineSince">
										<div class="md-layout-item md-size-30 md-xsmall-size-100">
											Puesta online:
										</div>
										<div class="md-layout-item md-size-60">
											{{ formatDate(metadata.OnlineSince) }}
										</div>
									</div>

									<div class="md-layout md-gutter gutterTop" v-if="metadata.LastOnline">
										<div class="md-layout-item md-size-30 md-xsmall-size-100">
											<label class="with-area">Última actualización:</label>
										</div>
										<div class="md-layout-item md-size-60">
											{{ formatDate(metadata.LastOnline) }}
										</div>
									</div>
								</div>

							</div>

				</div>
			</div>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">

							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-40 md-small-size-100">
									<mp-text :canEdit="Work.CanEdit()" label="Cobertura" @update="Update"
														helper="Alcance geográfico de la información. Ej. Total país, Provincia de Salta."
														v-model="metadata.CoverageCaption" :maxlength="200" />
									<mp-text :canEdit="Work.CanEdit()" label="Período" @update="Update" :maxlength="50"
														helper="Alcance temporal de la información. Ej. 2010, 2003-2007."
														v-model="metadata.PeriodCaption" />
								</div>
								<div class="md-layout-item md-size-10 md-small-size-0">
								</div>
								<div class="md-layout-item md-size-40 md-small-size-100">
									<mp-text :canEdit="Work.CanEdit()" label="Frecuencia" :maxlength="100" @update="Update"
															helper="Ciclo de actualización. Ej. Anual, trimestral, por demanda."
															v-model="metadata.Frequency" />
								</div>
							</div>
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';

export default {
name: 'Contenido',
	data() {
		return {
			list: null,
			interactiveSelect: false
		};
	},
	computed: {
		metadata() {
			return window.Context.CurrentWork.properties.Metadata;
		},
		Work() {
			return window.Context.CurrentWork;
		},
	},
	methods: {
		absoluteMap(url) {
			return str.AbsoluteUrl(url);
		},
		resolveMetadataUrl() {
	    return window.host + '/services/backoffice/GetMetadataPdf?w=' + this.Work.properties.Id;
		},
		appendAccessLink(url) {
			if (this.Work.properties.AccessLink) {
				return url + '/' + this.Work.properties.AccessLink;
			} else {
				return url;
			}
		},
		formatDate(date) {
				return f.formatDate(date);
		},
		cancelAbstract(oldValue) {
				this.metadata.Abstract = oldValue;
		},
		UpdateDropDown() {
			if (this.interactiveSelect) {
				this.Update();
			}
		},
		UpdateTitle() {
			var loc = this;
		  this.$refs.invoker.doSave(this.Work,
														this.Work.UpdateMetadata).then(function() {
							window.Db.RenameWork(loc.Work.properties.Id, loc.metadata.Title);
    	});
		  return true;
		},
		Update() {
			var loc = this;
		  this.$refs.invoker.doBackground(this.Work,
														this.Work.UpdateMetadata);
      return true;
		}
	},
	components: {
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.with-area{
		padding-left: 0 !important;
}


</style>

