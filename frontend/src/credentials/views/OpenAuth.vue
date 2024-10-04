<template>
	<form ref="theForm" method="POST" target="openAuthWin" action="/">
		<input type="hidden" name="returnUrl" value="/login" />
		<input type="hidden" name="reg_terms" :value="terms" />
		<input type="hidden" name="loginUrl" :value="target" />
	</form>
</template>

<script>

export default {
	name: 'OpenAuth',
	components: {
	},
	mounted() {
		},
	props: {
		terms: ''
	},
	data() {
		return {
			keepWindow: null
		};
	},
	computed: {
		target() {
			if (this.$route.query.to) {
				return this.$route.query.to;
			} else {
				return window.mainHost + '/users/#/';
			}
		}
	},
	methods: {
		show(url, checkTerms) {
			if (checkTerms && !this.terms) {
				alert("Debe aceptar los 'Términos y condiciones' para poder continuar.");
				return;
			}
			this.$refs.theForm.action = url;
			if (this.keepWindow != null) { this.keepWindow.close(); }
			var w = window.open('about:blank', 'openAuthWin',
				'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width=600,height=450,'
				// + 'left = 312,top = 234'
			);
			this.keepWindow = w;
			this.$refs.theForm.submit();
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>


</style>
