<template>
  <div>
    <div class="md-layout">
			<ActiveGrid :showingErrors="false"></ActiveGrid>
    </div>
  </div>
</template>

<script>
import ActiveGrid from '@/backoffice/components/ActiveGrid';

export default {
  components: {
    ActiveGrid
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-layout-item .md-size-25 {
  padding: 0 !important;
}
</style>
