<template>
  <md-dialog :md-active.sync="openDialog">
    <md-dialog-title>{{ title }}</md-dialog-title>
		<md-dialog-content>
			<div class="md-layout">
				<div class="md-layout-item md-size-100 md-small-size-100">
					{{ text }}.
				</div>
				<div class="md-layout-item md-size-100 md-small-size-100">
					<md-table v-model="listValues" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="save(item); " class="selectable" md-label="Nombre">{{ item.Caption }}</md-table-cell>
						</md-table-row>
					</md-table>
				</div>
			</div>
		</md-dialog-content>

		<md-dialog-actions>
			<md-button @click="save('')">Cancelar</md-button>
			<md-button class="md-primary" :disabled="true">Aceptar</md-button>
		</md-dialog-actions>
  </md-dialog>
</template>
<script>
import Context from "@/backoffice/classes/Context";

export default {
  name: "listSelectionPopup",
  mounted() {},
  data() {
    return {
      title: "",
      text: "",
      result: "",
      listValues: [],
      retCancel: true,
      openDialog: false
    };
  },
	props: {
	},
  computed: {},
  methods: {
		show(title, text, result, listValues, allItem) {
      this.title = title;
      this.text = text;
			this.result = result;
			if (allItem) {
				this.listValues = [{ Id: -1, Caption: '[ TODOS ]' }].concat(listValues);
			} else {
				this.listValues = listValues;
			}
      this.openDialog = true;
    },
    save(item) {
      this.openDialog = false;
      this.retCancel = true;
      this.result = item;
      this.$emit("selected", this.result);
    }
  },
  components: {}
};
</script>

<style lang="scss" scoped>

</style>
