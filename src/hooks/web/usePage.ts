import type { RouteLocationRaw, Router } from 'vue-router'
import { useRouter } from 'vue-router'
import { PageEnum } from '/@/enums/pageEnum'
import { unref } from 'vue'
import { REDIRECT_NAME } from '/@/router/constant'

export type PathAsPageEnum<T> = T extends { path: string } ? T & { path: PageEnum } : T
export type RouteLocationRawEx = PathAsPageEnum<RouteLocationRaw>

function handleError(e: Error) {
  console.error(e)
}

export function useGo(_router?: Router) {
  const { push, replace } = _router || useRouter()
  function go(opt: RouteLocationRawEx = PageEnum.BASE_HOME, isReplace = false) {
    if (!opt)
      return

    isReplace ? replace(opt).catch(handleError) : push(opt).catch(handleError)
  }
  return go
}

export function useRedo(_router?: Router) {
  const { replace, currentRoute } = _router || useRouter()
  const { query, params = {}, name, fullPath } = unref(currentRoute.value)
  function redo(): Promise<boolean> {
    return new Promise((resolve) => {
      if (name === REDIRECT_NAME) {
        resolve(false)
        return
      }
      if (name && Object.keys(params).length) {
        params._origin_params = JSON.stringify(params ?? {})
        params._redirect_type = 'name'
        params.path = String(name)
      }
      else {
        params._redirect_type = 'path'
        params.path = fullPath
      }
      replace({ name: REDIRECT_NAME, params, query }).then(() => resolve(true))
    })
  }
  return redo
}
