<template>
	<span>{{ displayValue }}</span>
</template>

<script>
import TWEEN from '@tweenjs/tween.js';
import h from '@/public/js/helper';

export default {
	name: 'animatedNumber',
	props: {
		format: {
      type: String,
      required: false
    },
    value: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      displayValue: 0,
			fix: 0
    };
  },
  watch: {
    value(endValue, startValue) {
      this.tween(startValue, endValue);
    }
  },
  mounted() {
    this.tween(0, this.value);
  },
  methods: {
		resolveFormat() {
			var fix = 0;
			if(this.format === 'km') {
				this.fix = 1;
				return h.formatKm;
			} else if (this.format && this.format.substr(0, 1) === '%') {
				this.fix = 2;
				return h.formatPercent;
			} else {
				return h.formatNum;
			}
		},
    tween(startValue, endValue) {
      var loc = this;
			var format = this.resolveFormat();
			if (endValue === '' || endValue === '-' || endValue === 'n/d' || startValue === '' || startValue === 'n/d' || startValue === '-') {
				loc.displayValue = h.quickFormat(format, fix, endValue);
				return;
			}
      function animate () {
        if (TWEEN.update()) {
          requestAnimationFrame(animate);
        }
      }

      new TWEEN.Tween({ tweeningValue: startValue })
        .to({ tweeningValue: endValue }, 500)
        .onUpdate(function (object) {
						var number = h.quickFormat(format, loc.fix, object.tweeningValue);
						loc.displayValue = number;
        })
        .start();

      animate();
    }
  }
};
</script>
