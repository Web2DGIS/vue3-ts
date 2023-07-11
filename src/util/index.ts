import type { App, Component } from 'vue'
import { utilDetect } from './detect'
import { fixRTLTextForSvg, rtlRegex } from './svgPathsRtlFIx'

// https://github.com/vant-ui/vant/issues/8302
interface EventShim {
  new (...args: any[]): {
    $props: {
      onClick?: (...args: any[]) => void
    }
  }
}

export type WithInstall<T> = T & {
  install(app: App): void
} & EventShim
export type CustomComponent = Component & { displayName?: string }

export function withInstall<T extends CustomComponent>(component: T, alias?: string) {
  (component as Record<string, unknown>).install = (app: App) => {
    const compName = component.name || component.displayName
    if (!compName)
      return
    app.component(compName, component)
    if (alias)
      app.config.globalProperties[alias] = component
  }
  return component as WithInstall<T>
}

export function utilStringQs(str: string): any {
  let i = 0
  while (i < str.length && (str[i] === '?' || str[i] === '#')) i++
  str = str.slice(i)

  return str.split('&').reduce((obj: any, pair: string) => {
    const parts = pair.split('=')
    if (parts.length === 2)
      obj[parts[0]] = (parts[1] === null) ? '' : decodeURIComponent(parts[1])

    return obj
  }, {})
}

export function utilQsString(obj: any, noencode: boolean): string {
  // encode everything except special characters used in certain hash parameters:
  // "/" in map states, ":", ",", {" and "}" in background
  function softEncode(s: string) {
    return encodeURIComponent(s).replace(/(%2F|%3A|%2C|%7B|%7D)/g, decodeURIComponent)
  }

  return Object.keys(obj).sort().map((key) => {
    return `${encodeURIComponent(key)}=${
          noencode ? softEncode(obj[key]) : encodeURIComponent(obj[key])}`
  }).join('&')
}

// Flattens two level array into a single level
// var a = [[1,2,3],[4,5,6],[7]];
// utilArrayFlatten(a);
//   [1,2,3,4,5,6,7];
export function utilArrayFlatten(a: Array<any>) {
  return a.reduce((acc, val) => {
    return acc.concat(val)
  }, [])
}

// Returns an Array with all the duplicates removed
// var a = [1,1,2,3,3];
// utilArrayUniq(a)
//   [1,2,3]
export function utilArrayUniq(a: Array<any>) {
  return Array.from(new Set(a))
}

export function utilDisplayName(entity: any): string {
  const nameKey = 'name:zh'
  return entity[nameKey] || entity.name || ''
}

export function utilDisplayNameForPath(entity: any): string {
  let name = utilDisplayName(entity)
  const isFirefox = utilDetect().browser.toLowerCase().includes('firefox')
  const isNewChromium = Number(utilDetect().version.split('.')[0]) >= 96.0
  if (isFirefox && !isNewChromium && name && rtlRegex.test(name))
    name = fixRTLTextForSvg(name)

  return name
}
