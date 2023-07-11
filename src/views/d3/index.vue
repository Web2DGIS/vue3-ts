<script lang="ts">
import D3Force from '/@/components/D3Force/scr/D3Force.vue'
import D3ColorLegend from '/@/components/D3ColorLegend/src/D3ColorLegend.vue'

export default {
  components: { D3ColorLegend, D3Force },
}
</script>

<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <a class="card">
          <D3Force />
        </a>
      </div>
      <div class="col">
        <a class="card">
          <D3ColorLegend />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
