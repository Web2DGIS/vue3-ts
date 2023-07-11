<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue'
import { AppProvider } from '/@/components/Application'
import { useTitle } from './hooks/web/useTitle'

useTitle()
</script>

<template>
  <ConfigProvider>
    <AppProvider>
      <router-view />
    </AppProvider>
  </ConfigProvider>
</template>

<style scoped></style>
