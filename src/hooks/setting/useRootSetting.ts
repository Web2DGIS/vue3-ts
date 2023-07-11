import { computed } from 'vue'
import { useAppStore } from '/@/store/modules/app'

export function useRootSetting() {
  const appStore = useAppStore()

  const getPageLoading = computed(() => appStore.getPageLoading)

  return {
    getPageLoading,
  }
}
