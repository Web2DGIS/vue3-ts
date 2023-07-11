<script lang="ts" setup>
import type { Ref } from 'vue'
import { defineProps, onBeforeUnmount, onDeactivated, ref, unref, watch } from 'vue'
import VditorPreview from 'vditor/dist/method.min'
import { onMountedOrActivated } from '../../../../packages/hooks/src/onMountedOrActivated'

const props = defineProps({
  value: { type: String },
  class: { type: String },
})
const viewerRef = ref(null)
const vditorPreviewRef = ref(null) as Ref<VditorPreview | null>

function init() {
  const viewerEl = unref(viewerRef)
  vditorPreviewRef.value = VditorPreview.preview(viewerEl, props.value, {
    mode: 'light',
    theme: {
      // 设置内容主题
      current: 'light',
    },
    hljs: {
      // 设置代码块主题
      style: 'github',
    },
  })
}

watch(
  () => props.value,
  (v, oldValue) => {
    v !== oldValue && init()
  },
)

function destroy() {
  const vditorInstance = unref(vditorPreviewRef)
  if (!vditorInstance)
    return
  try {
    vditorInstance?.destroy?.()
  }
  catch (error) {
    //
  }
  vditorPreviewRef.value = null
}

onMountedOrActivated(init)

onBeforeUnmount(destroy)
onDeactivated(destroy)
</script>

<template>
  <div id="markdownViewer" ref="viewerRef" :class="$props.class" />
</template>
