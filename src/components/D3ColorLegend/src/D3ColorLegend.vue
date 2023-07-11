<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import * as d3 from 'd3'
import { legend } from './legend'

export default defineComponent({
  name: 'D3ColorLegend',
  setup() {
    const svgRef = ref(null)

    onMounted(() => {
      const container = svgRef.value
      legend({
        color: d3.scaleSqrt([-10, 10, 20, 30, 40], ['#bae0ff', '#69b1ff', '#52c41a', '#fa541c', '#f5222d']),
        container,
        options: {
          title: '温度 (°C)',
        },
      })
    })

    return {
      svgRef,
    }
  },
})
</script>

<template>
  <div ref="svgRef" class="" />
</template>

<style scoped>

</style>
