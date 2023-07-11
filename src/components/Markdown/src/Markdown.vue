<script lang="ts">
import type { Ref } from 'vue'
import { defineComponent, nextTick, onBeforeUnmount, onDeactivated, ref, unref, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

import { onMountedOrActivated } from '../../../../packages/hooks/src/onMountedOrActivated'

export default defineComponent({
  inheritAttrs: false,
  props: {
    height: { type: Number, default: 360 },
    value: { type: String, default: '' },
  },
  emits: ['change', 'get', 'update:value'],
  setup(props, { attrs, emit }) {
    const wrapRef = ref(null)
    const vditorRef = ref(null) as Ref<Vditor | null>
    const initedRef = ref(false)

    const valueRef = ref(props.value || '')

    watch(
      () => initedRef.value,
      (inited) => {
        if (!inited)
          return

        instance
          .getVditor()
          ?.setTheme('classic', 'light', 'github')
      },
      {
        immediate: true,
        flush: 'post',
      },
    )

    watch(
      () => props.value,
      (v) => {
        if (v !== valueRef.value)
          instance.getVditor()?.setValue(v)

        valueRef.value = v
      },
    )

    function init() {
      const wrapEl = unref(wrapRef)
      if (!wrapEl)
        return
      const bindValue = { ...attrs, ...props }
      const insEditor = new Vditor(wrapEl, {
        theme: 'light' as any,
        mode: 'sv',
        fullscreen: {
          index: 520,
        },
        preview: {
          theme: {
            current: 'light',
          },
          hljs: {
            style: 'github',
          },
          actions: [],
        },
        input: (v) => {
          valueRef.value = v
          emit('update:value', v)
          emit('change', v)
        },
        after: () => {
          nextTick(() => {
            vditorRef.value = insEditor
            initedRef.value = true
            emit('get', instance)
          })
        },
        blur: () => {
        },
        ...bindValue,
        cache: {
          enable: false,
        },
      })
    }

    function destroy() {
      const vditorInstance = unref(vditorRef)
      if (!vditorInstance)
        return
      try {
        vditorInstance?.destroy?.()
      }
      catch (error) {
        //
      }
      vditorRef.value = null
      initedRef.value = false
    }

    const instance = {
      getVditor: (): Vditor => vditorRef.value!,
    }

    onMountedOrActivated(init)

    onBeforeUnmount(destroy)
    onDeactivated(destroy)

    return {
      wrapRef,
      ...instance,
    }
  },
})
</script>

<template>
  <div ref="wrapRef" />
</template>

<style></style>
