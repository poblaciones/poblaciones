<template>
  <md-dialog class="list-dialog" :md-active.sync="openDialog">
    <md-dialog-title>{{ title }}</md-dialog-title>
    <md-dialog-content>
      <div class="md-layout">
        <div class="md-layout-item md-size-100 md-small-size-100">
          {{ text }}.
        </div>
        <md-list ref="listName">
          <md-list-item @click="save(item)" v-for="item in listValues" :key="item">{{ item }}</md-list-item>
        </md-list>
      </div>
    </md-dialog-content>
    <md-dialog-actions>
      <md-button @click="save('')">Cancelar</md-button>
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
  props: {},
  computed: {},
  methods: {
    show(title, text, result, listValues) {
      this.title = title;
      this.text = text;
      this.result = result;
      this.listValues = listValues;
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
.md-list {
  width: 400px;
  height: 400px;
  max-width: 100%;
  overflow-y: auto;
  padding: 0px;
  margin-top: 12px;
  display: inline-block;
  vertical-align: top;
  border: 1px solid rgba(#000, 0.12);
}
.md-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.md-list-item-content {
  display: unset;
}
.md-list-item-text :nth-child(1) {
  font-size: 13px;
  color: darkgrey;
}
.md-list-item-text :nth-child(2),
.md-list-item-text :nth-child(3) {
  font-size: 13px;
  padding-top: 1px;
}
.list-dialog{
  min-width: 200px !important;
  width: 25% !important;
}
</style>
