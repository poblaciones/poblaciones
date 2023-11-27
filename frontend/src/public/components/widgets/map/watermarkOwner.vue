<template>
  <div v-if="imageUrl" class="exp-hiddable-block logoDiv logoDivLeft" @click="institutionClicked"
       :style="(!url ? 'pointer-events: none' : 'cursor: pointer')">
    <img class="logoIcon" :src="imageUrl" :title="name" />
  </div>
</template>

<script>
import axios from "axios";
import err from "@/common/framework/err";

export default {
  name: "watermarkOwner",
    props:
    {
			float: {
				type: String,
				default: 'right'
			},
      name: '',
      url: '',
      image: ''
    },
  data() {
    return {
      imageObtained: null
    };
  },
  mounted() {

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
  }
};
</script>

<style scoped>
	.logoDivLeft {
		left: 98px;
		bottom: 15px;
		z-index: 500;
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

