import { nextTick, onActivated, onMounted } from 'vue'

/**
 * 任意类型的异步函数
 */
type AnyPromiseFunction = (...arg: any[]) => PromiseLike<any>

/**
 * 任意类型的普通函数
 */
type AnyNormalFunction = (...arg: any[]) => any

/**
 * 任意类型的函数
 */
type AnyFunction = AnyNormalFunction | AnyPromiseFunction

/**
 * 在 OnMounted 或者 OnActivated 时触发
 * @param hook 任何函数（包括异步函数）
 */
function onMountedOrActivated(hook: AnyFunction) {
  let mounted: boolean

  onMounted(() => {
    hook()
    nextTick(() => {
      mounted = true
    })
  })

  onActivated(() => {
    if (mounted)
      hook()
  })
}

export { onMountedOrActivated }
