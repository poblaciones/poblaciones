<template>
  <div v-if="image" class="logoDiv" @click="institutionClicked"
			 :style="(!work.Current.Metadata.Institution.Url ? 'pointer-events: none' : 'cursor: pointer')">
    <img class="logoIcon" :src="image" :title="work.Current.Metadata.Institution.Name" />
  </div>
</template>

<script>
import axios from "axios";
import err from "@/common/js/err";

export default {
  name: "watermarkFloat",
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
		institutionClicked() {
			window.open(this.work.Current.Metadata.Institution.Url);
		},
    getInstitutionWatermark() {
      const loc = this;
      return axios
        .get(window.host + "/services/works/GetInstitutionWatermark", {
          params: {
            w: loc.work.Current.Id,
            iwmid: loc.work.Current.Metadata.Institution.WatermarkId
          }
        })
        .then(function(res) {
          loc.image = res.data;
        })
        .catch(function(error) {
          err.errDialog(
            "GetInstitutionWatermark",
            "obtener la imagen de la institución"
          );
        });
    }
  }
};
</script>

<style scoped>
.logoDiv {
	bottom: 21px;
	right: 48px;
	position: absolute;
	background-color: transparent;
	border-radius: 6px;
	display: flex;
	height: 100%;
	width: auto;
	max-width: 70%;
	max-height: 64px;
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
	background-color: rgba(255, 255, 255, 0.75);
  border: 4px solid rgba(255, 255, 255, 0);
}
</style>

