<script lang="ts" setup>
import { useMouse } from '@vueuse/core'
import D3Force from '/@/components/D3Force/scr/D3Force.vue'

const { x, y } = useMouse()
</script>

<template>
  <!--  <Coordinate label="x" :value="x" /> -->
  <!--  <Coordinate label="y" :value="y" /> -->
  <D3Force />
</template>

<style scoped></style>
