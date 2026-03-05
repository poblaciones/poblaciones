<template>
	  <transition name="slide-up">
      <div v-if="visible" class="suggestions-panel">
        <div class="suggestions-header">
          <div>💡 También puede interesarle...
          <button class="btn-close" @click="hide" style="float:right">
            <span aria-hidden="true">×</span>
          </button>
          </div>
       </div>
        <div class="suggestions-list">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.Id"
            class="suggestion-item"
            @click="accept(suggestion)"
          >
            <span class="suggestion-icon">{{ suggestion.Icon }}</span>
            <div class="suggestion-content">
              <span class="suggestion-label">{{ suggestion.Label }}</span>
              <div class="suggestion-meta">
                <span class="badge">{{ suggestion.ScorePercent }}% relevancia</span>
                <span class="text-muted small">{{ suggestion.Reason }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';
import arr from '@/common/framework/arr';

  export default {
    name: 'suggestionsPanel.vue',
    components: {
    },
    data() {
      return {
        visible: false,
        suggestions: [],
        triggerReason: null,
        showTime: null
      };
    },
    props: [],
    computed: {},
    methods: {
      show(suggestions, reason) {
        this.suggestions = suggestions;
        this.triggerReason = reason;
        this.visible = true;
        this.showTime = Date.now();
      },

      hide() {
        this.visible = false;
        this.suggestions = [];
      },

      accept(suggestion) {
        var decisionTime = Date.now() - this.showTime;
        window.SegMap.Suggestions.SendFeedback(suggestion.Id, true, decisionTime);
        this.applySuggestion(suggestion);
        this.hide();
      },

      reject() {
        var decisionTime = Date.now() - this.showTime;
        var ids = arr.GetIds();
        window.SegMap.Suggestions.SendFeedbackMany(ids, false, decisionTime);
        this.applySuggestion(suggestion);
        this.hide();
      },

      applySuggestion(suggestion) {
        switch (suggestion.Type) {
          case 'metric':
            window.SegMap.AddMetricById(suggestion.Value);
            break;
          case 'variable':
            window.SegMap.AddMetricById(suggestion.MetricId);
            break;
          case 'region':
            window.SegMap.Clipping.SetClippingRegion(suggestion.Value, true, false, false);
            break;
          case 'boundary':
            window.SegMap.AddBoundaryById(suggestion.Value);
            break;
        }
      },
    },
  };
</script>

<style scoped>
.suggestions-panel {
  position: fixed;
  bottom: 20px;
  left: 110px;
  width: 300px;
  max-height: 400px;
  background: white;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.btn-close {
	background: none;
	border: none;
	font-size: 20px;
	line-height: 1;
	color: #999;
	cursor: pointer;
	padding: 0;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 3px;
	transition: all 0.2s;
}

	.btn-close:hover {
		background: #f0f0f0;
		color: #666;
	}

.badge {
  background: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-right: 8px;
}
	.suggestions-header {
		padding: 8px;
		font-size: 15px;
		background-color: #e7e7e7;
	}
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
