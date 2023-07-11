import * as d3 from 'd3'

import { ThemeEnum } from '/@/enums/themeEnum'
import dark from '/@/assets/svg/theme/dark.svg'
import light from '/@/assets/svg/theme/light.svg'

const themeIcon = [dark, light]

export function themeControl() {
  function getPrefersDark(): boolean {
    return window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  let prefersDark = getPrefersDark()

  function settingTheme() {
    prefersDark = !prefersDark
    const icon = prefersDark ? themeIcon[0] : themeIcon[1]
    const dataTheme = prefersDark ? ThemeEnum.DARK : ThemeEnum.LIGHT
    d3.select('html').attr('data-theme', dataTheme)
    d3.select('a.setting-theme')
      .select('img')
      .attr('src', icon)
  }

  function render(container: HTMLElement) {
    const icon = prefersDark ? themeIcon[0] : themeIcon[1]
    const dataTheme = prefersDark ? ThemeEnum.DARK : ThemeEnum.LIGHT
    d3.select('html').attr('data-theme', dataTheme)
    const button = d3.select(container)
      .append('a')
      .attr('class', 'setting-theme')
    button.append('img').attr('src', icon)
    button.on('click', settingTheme)
    return container
  }

  return render
}
