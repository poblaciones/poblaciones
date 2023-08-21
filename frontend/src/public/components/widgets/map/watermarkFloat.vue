<template>
  <div v-if="imageUrl" :class="'exp-hiddable-block logoDiv ' + (float == 'left' ? 'logoDivLeft' : 'logoDivRight')" @click="institutionClicked"
       :style="(!url ? 'pointer-events: none' : 'cursor: pointer')">
    <img class="logoIcon" :src="imageUrl" :title="name" />
  </div>
</template>

<script>
import axios from "axios";
import err from "@/common/framework/err";

export default {
  name: "watermarkFloat",
    props:
    {
			float: {
				type: String,
				default: 'right'
			},
      name: '',
      url: '',
      image: '',
      waterMarkId: null,
    },
  data() {
    return {
      imageObtained: null
    };
  },
  mounted() {
    // obtiene el file de la imagen
    if (this.waterMarkId) {
			this.getInstitutionWatermark();
    }
  },
  computed: {
    imageUrl() {
      if (this.image) {
        return this.image;
      } else {
        return this.imageObtained;
      }
    }
  },
  methods: {
		institutionClicked() {
			window.open(this.url);
		},
    getInstitutionWatermark() {
      const loc = this;
      return axios
        .get(window.host + "/services/works/GetInstitutionWatermark", {
          params: {
            w: loc.work.Current.Id,
            iwmid: this.waterMarkId
          }
        })
        .then(function(res) {
          loc.imageObtained = res.data;
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
	.logoDivLeft {
		left: 98px;
		bottom: 15px;
		z-index: 500;
	}
	.logoDivRight {
		bottom: 23px;
		right: 54px;
		z-index: 1000;
	}

	.logoDiv {
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

