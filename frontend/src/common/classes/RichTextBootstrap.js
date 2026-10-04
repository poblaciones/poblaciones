import MpText from '@/common/components/MpText';

/**
 * Registra mp-text, el único componente que carga el editor de texto enriquecido (CKEditor).
 * Está separado de CommonBootstrap para que credentials y table, que no lo usan, no lo incluyan en su paquete.
 */
export default class RichTextBootstrap {
	static Register(Vue) {
		Vue.component('mp-text', MpText);
	}
}
