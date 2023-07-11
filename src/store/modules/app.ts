import { defineStore } from 'pinia'
import { store } from '/@/store'

interface AppState {
  pageLoading: boolean
}
let timeId: any
export const useAppStore = defineStore({
  id: 'app',
  state: (): AppState => ({
    pageLoading: false,
  }),
  getters: {
    getPageLoading(state): boolean {
      return state.pageLoading
    },
  },
  actions: {
    setPageLoading(loading: boolean): void {
      this.pageLoading = loading
    },
    async setPageLoadingAction(loading: boolean): Promise<void> {
      if (loading) {
        clearTimeout(timeId)
        timeId = setTimeout(() => {
          this.setPageLoading(loading)
        }, 50)
      }
      else {
        this.setPageLoading(loading)
        clearTimeout(timeId)
      }
    },
  },
})

// Need to be used outside the setup
export function useAppStoreWithOut() {
  return useAppStore(store)
}
