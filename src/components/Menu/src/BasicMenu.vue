<script lang="ts">
import { defineComponent } from 'vue'
import { basicProps } from './props'

export default defineComponent({
  name: 'BasicMenu',
  props: basicProps,
  emits: ['menuClick'],
  setup(props, { emit }) {
    const { items } = props

    async function handleMenuClick({ key }: { key: string }) {
      const { beforeClickFn } = props
      if (beforeClickFn && typeof beforeClickFn === 'function') {
        const flag = await beforeClickFn(key)
        if (!flag)
          return
      }
      emit('menuClick', key)
    }

    return {
      handleMenuClick,
      items,
    }
  },
})
</script>

<template>
  <div class="basic-menu" @click="handleMenuClick" />
</template>

<style></style>
