<template>
  <div v-if="image" class="logoDiv">
    <img class="logoIcon" :src="image" />
  </div>
</template>

<script>
import axios from "axios";
import err from "@/common/js/err";

export default {
  name: "logoFloat",
  props: ["work"],
  data() {
    return {
      image: null
    };
  },
  mounted() {
    // Obtiene el file de la Imagen
    this.getInstitutionWatermark();
  },
  methods: {
    getInstitutionWatermark() {
      const loc = this;
      return axios
        .get(window.host + "/services/works/GetInstitutionWatermark", {
          params: {
            w: loc.work.Current.Id,
            iwmid: loc.work.Current.WatermarkId
          }
        })
        .then(function(res) {
          loc.image = res.data;
        })
        .catch(function(error) {
          err.errDialog(
            "GetInstitutionWatermark",
            "obtener el logo de la institución"
          );
        });
    }
  }
};
</script>

<style scoped>
.logoDiv {
  opacity: 75%;
  bottom: 2.5rem;
  right: 46px;
  z-index: 1;
  position: absolute;
  background: seashell;
  border-radius: 0.8rem;
  padding: 0.3rem;
  display: flex;
  height: 100%;
  width: auto;
  max-width: 50%;
  max-height: 6rem;
  overflow: hidden;
  object-fit: scale-down;
  justify-content: center;
}
.logoIcon {
  height: auto;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
}
</style>

