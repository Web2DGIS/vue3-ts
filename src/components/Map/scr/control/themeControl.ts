import * as d3 from 'd3'

import { ThemeEnum } from '/@/enums/themeEnum'

const themeIcon = ['i-line-md:moon-rising-filled-loop', 'i-line-md:moon-filled-alt-to-sunny-filled-loop-transition']

export function themeControl() {
  function getPrefersDark(): boolean {
    return window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  let prefersDark = getPrefersDark()

  function settingTheme() {
    prefersDark = !prefersDark
    const dataTheme = prefersDark ? ThemeEnum.DARK : ThemeEnum.LIGHT
    d3.select('html').attr('data-theme', dataTheme)
    d3.select('a.setting-theme')
      .select('i')
      .attr('class', prefersDark
        ? themeIcon[0]
        : themeIcon[1])
  }

  function render(container: HTMLElement) {
    const dataTheme = prefersDark ? themeIcon[0] : themeIcon[1]
    const button = d3.select(container)
      .append('a')
      .attr('class', 'setting-theme')
    button.append('i').attr('class', dataTheme)
    button.on('click', settingTheme)
    settingTheme()
  }

  return render
}
