import type { Router } from 'vue-router'
import { MAP_ROUTERR } from '../constant'
import { useAppStoreWithOut } from '/@/store/modules/app'

export function setupRouterGuard(router: Router) {
  createPageGuard(router)
  createPageLoadingGuard(router)
}

/**
 * Hooks for handling page state
 * @param router vue-router
 */
function createPageGuard(router: Router) {
  const loadedPageMap = new Map<string, boolean>()
  router.beforeEach(async (to) => {
    to.meta.loaded = !!loadedPageMap.get(to.path)
    return true
  })
  router.afterEach((to) => {
    if (to.path !== MAP_ROUTERR)
      window.location.hash = ''
    loadedPageMap.set(to.path, true)
  })
}

/**
 * Used to handle page loading status
 * @param router vue-router
 */
function createPageLoadingGuard(router: Router) {
  const appStore = useAppStoreWithOut()
  router.beforeEach(async (to) => {
    if (to.meta.loaded)
      return true
    appStore.setPageLoadingAction(true)
    return true
  })
  router.afterEach(async () => {
    setTimeout(() => {
      appStore.setPageLoadingAction(false)
    }, 220)
    return true
  })
}
