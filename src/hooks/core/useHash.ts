import _throttle from 'lodash-es/throttle'
import * as d3 from 'd3'
import { utilQsString, utilStringQs } from '../../util'
import { utilObjectOmit } from '../../util/object'
import { prefs } from '../../util/preferences'
import { MAP_LOCATION } from '../../enums/cacheEnum'

export function behaviorHash(context?: any) {
  const map: any = context.map
  let _cachedHash: any = null
  const _latitudeLimit = 90 - 1e-8

  function computedHashParameters(): object {
    const center: any = map.getCenter()
    const zoom: number = map.getZoom()
    const precision: number = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2))
    const oldParams: any = utilObjectOmit(utilStringQs(window.location.hash), ['comment', 'source', 'hashtags', 'walkthrough'])
    const newParams: any = {}

    delete oldParams.id
    newParams.map = `${zoom.toFixed(2)}/${center.lat.toFixed(precision)}/${center.lng.toFixed(precision)}`

    return Object.assign(oldParams, newParams)
  }

  function computedHash(): string {
    return `#${utilQsString(computedHashParameters(), true)}`
  }

  function updateHashIfNeeded() {
    const latestHash: string = computedHash()
    if (_cachedHash !== latestHash) {
      _cachedHash = latestHash
      window.history.replaceState(null, '', latestHash)
      const q = utilStringQs(latestHash)
      if (q.map)
        prefs('map-location', q.map)
    }
  }

  const _throttledUpdate = _throttle(updateHashIfNeeded, 500)

  function hashchange() {
    // ignore spurious hashchange events
    if (window.location.hash === _cachedHash)
      return
    _cachedHash = window.location.hash
    const q = utilStringQs(_cachedHash)
    const mapArgs = (q.map || '').split('/').map(Number)
    if (mapArgs.length < 3 || mapArgs.some(Number.isNaN)) {
      updateHashIfNeeded()
    }
    else {
      // don't update if the new hash already reflects the state of iD
      if (_cachedHash === computedHash())
        return
      map.setView([Math.min(_latitudeLimit, Math.max(-_latitudeLimit, mapArgs[1])), mapArgs[2]], mapArgs[0])
    }
  }

  function behavior() {
    map.on('moveend', _throttledUpdate)
    d3.select(window).on('hashchange.behaviorHash', hashchange)
    const q = utilStringQs(window.location.hash)

    if (q.map) {
      behavior.hadLocation = true
    }
    else if (prefs(MAP_LOCATION)) {
      const mapArgs = prefs(MAP_LOCATION).split('/').map(Number)
      map.setView([Math.min(_latitudeLimit, Math.max(-_latitudeLimit, mapArgs[1])), mapArgs[2]], mapArgs[0])

      updateHashIfNeeded()

      behavior.hadLocation = true
    }

    hashchange()
  }

  behavior.off = function () {
    _throttledUpdate.cancel()
    map.off('moveend', _throttledUpdate)
    window.location.hash = ''
  }

  return behavior
}
