<template>
	<!-- Al cambiar el contenido de los pasos de forma sustancial, conviene
	     versionar setting-key (p. ej. 'SeenNoticeChangesV5_v2') para
	     que el aviso vuelva a mostrarse una vez más. -->
	<content-wizard ref="wizard" :steps="steps" dark-mode
									user-since="2026-08-08T00:00:00"
								  until="2027-02-02T23:59:59" setting-key="SeenNoticeChangesV5" />
</template>

<script>
import ContentWizard from '@/common/components/ContentWizard';

// Rutas estáticas de las capturas de pantalla. Colocar los archivos en
// frontend/static/img/backoffice-refactor/ con estos nombres, o ajustar
// las rutas de 'previewImage' en steps() más abajo.
const IMG_BASE = '/static/img/notice-changes-v5/';

export default {
	name: 'NoticeChangesV5',
	components: { ContentWizard },
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		// Contenido de los pasos. Hardcodeado porque es un aviso puntual del
		// refactor, no un tutorial dependiente de datos del servidor.
		steps() {
			return [
				{
					Id: 1,
					Name: 'Actualización - v5.0',
					Alignment: 'L',
					previewImage: IMG_BASE + 'step1-changes.png',
					Content: '<p>Hicimos algunos cambios en la pantalla de edición de cartografías para simplificarla.</p> '
						+ '<p>Te mostramos rápidamente dónde quedó cada cosa.</p>'
				},
				{
					Id: 2,
					Name: 'Personalizar y Estadísticas',
					Alignment: 'R',
					previewImage: IMG_BASE + 'step2-topbar-actions.png',
					Content: '<p><b>Personalizar</b> y <b>Estadísticas</b> ahora se abren desde los íconos de la '
						+ 'barra superior, en lugar del menú lateral.</p><p><b>Personalizar</b> permite incorporar indicadores adicionales y elegir cómo se inicia el mapa.</p>'
				},
				{
					Id: 3,
					Name: 'Compartir',
					Alignment: 'L',
					previewImage: IMG_BASE + 'step3-share.png',
					Content: '<p><b>Visibilidad</b> y <b>Permisos</b> se unificaron en el botón '
						+ '<b>Compartir</b> de la barra superior.</p><p></p>'
				},
				{
					Id: 4,
					Name: 'Tu cuenta',
					Alignment: 'R',
					previewImage: IMG_BASE + 'step4-profile-menu.png',
					Content: '<p>Hacé clic en tu foto de perfil, arriba a la derecha, para cerrar sesión, '
						+ 'solicitar una revisión o ver los detalles de tu cuenta.</p><p>Desde los detalles de tu cuenta podés cambiar tu contraseña y otros datos personales.</p>'
				},
				{
					Id: 5,
					Name: 'Publicar',
					Alignment: 'L',
					previewImage: IMG_BASE + 'step5-sidebar-bottom.png',
					Content: '<p><b>Información</b> sigue en el menú lateral, pero ahora en la parte '
						+ 'inferior. </p><p>Ahí se encuentra la descripción de la autoría, '
						+ 'las fuentes y licencia utilizada además de otros metadatos de la cartografía, y el botón de <b>Publicar</b>.</p> '
				}
			];
		}
	},
	mounted() {
		/*if (this.isJustCreatedWork()) {
			// No se muestra en cartografías recién creadas, pero tampoco se
			// marca como vista: se ofrecerá la próxima vez que entre a una
			// cartografía existente.
			return;
		}*/
		this.$refs.wizard.checkOpen();
	},
	methods: {
		isJustCreatedWork() {
			var justCreatedId = window.sessionStorage.getItem('justCreatedWorkId');
			return !!(justCreatedId && this.Work && ('' + justCreatedId) === ('' + this.Work.properties.Id));
		}
	}
};
</script>
