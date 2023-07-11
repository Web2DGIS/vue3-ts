<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PageLayout',
  setup() {
  },
})
</script>

<template>
  <router-view>
    <template #default="{ Component, route }">
      <transition
        mode="out-in"
        appear
      >
        <keep-alive>
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </template>
  </router-view>
</template>

<style scoped>
</style>
