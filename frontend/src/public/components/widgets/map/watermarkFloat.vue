<template>
  <div v-if="image" class="logoDiv" @click="institutionClicked"
			 :style="(!institution.Url ? 'pointer-events: none; ' : 'cursor: pointer; ') +
            (useStreetMap ? 'right: 145px' : '')">
    <img class="logoIcon" :src="image" :title="institution.Name" />
  </div>
</template>

<script>
import axios from "axios";
import err from "@/common/framework/err";

export default {
  name: "watermarkFloat",
    props: ["work",
            "institution"  ],
  data() {
    return {
      image: null
    };
  },
  mounted() {
    // Obtiene el file de la Imagen
    this.getInstitutionWatermark();
  },
  computed: {
    useStreetMap() {
      return window.SegMap.Configuration.MapsAPI === 'google';
    },
  },
  methods: {
		institutionClicked() {
			window.open(this.institution.Url);
		},
    getInstitutionWatermark() {
      const loc = this;
      return axios
        .get(window.host + "/services/works/GetInstitutionWatermark", {
          params: {
            w: loc.work.Current.Id,
            iwmid: loc.institution.WatermarkId
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
		background-color: transparent;
		display: flex;
		width: auto;
		object-fit: scale-down;
		justify-content: center;
		margin-left: 13px;
		box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
	}

.logoIcon {
  height: auto;
  width: auto;
  max-width: 64px;
  max-height: 100%;
  margin: auto;
	background-color: rgba(255, 255, 255, 0.75);
  border: 2px solid rgba(255, 255, 255, 0);
  border-radius: 4px;
}
</style>

