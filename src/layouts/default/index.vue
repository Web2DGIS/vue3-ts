<script lang="ts">
import { Layout } from 'ant-design-vue'
import { computed, defineComponent } from 'vue'
import LayoutContent from './content/index.vue'
import { useDesign } from '/@/hooks/web/useDesign'

export default defineComponent({
  components: {
    Layout,
    LayoutContent,
  },
  setup() {
    const { prefixCls } = useDesign('default-layout')
    const layoutClass = computed(() => {
      const cls: string[] = ['ant-layout']
      cls.push('ant-layout-has-sider')
      return cls
    })
    return {
      prefixCls,
      layoutClass,
    }
  },
})
</script>

<template>
  <Layout :class="prefixCls">
    <Layout :class="[layoutClass]">
      <LayoutContent />
    </Layout>
  </Layout>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-default-layout';

.@{prefix-cls} {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background-color: @content-bg;
}
</style>
