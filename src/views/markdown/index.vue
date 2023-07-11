<script lang="ts">
import { defineComponent, ref } from 'vue'
import { MarkDown, MarkDownViewer } from '/@/components/Markdown/index'

export default defineComponent({
  components: { MarkDown, MarkDownViewer },
  setup() {
    const valueRef = ref(`
# 标题h1

##### 标题h5

**加粗**
*斜体*
~~删除线~~
[链接](https://github.com/vbenjs/vue-vben-admin)
↓分割线↓

---


* 无序列表1
  * 无序列表1.1

1. 有序列表1
2. 有序列表2

* [ ] 任务列表1
* [x] 任务列表2

> 引用示例

\`\`\`js
// 代码块:
(() => {
  var htmlRoot = document.getElementById('htmlRoot');
  var theme = window.localStorage.getItem('__APP__DARK__MODE__');
  if (htmlRoot && theme) {
    htmlRoot.setAttribute('data-theme', theme);
    theme = htmlRoot = null;
  }
})();
\`\`\`

| 表格 | 示例 | 🎉️ |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |
`)

    function handleChange(v: string) {
      valueRef.value = v
    }

    return {
      value: valueRef.value,
      handleChange,
    }
  },
})
</script>

<template>
  <div p-2>
    <div>
      <MarkDown v-model:value="value" @change="handleChange" />
    </div>
    <div mt-2>
      <MarkDownViewer v-model:value="value" />
    </div>
  </div>
</template>

<style scoped>

</style>
