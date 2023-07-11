import type { Segments } from '../helpers'
import { svgMarkerSegments } from '../helpers'
import type { Bounds, Content, GeoJSON } from '../types'
import { utilArrayFlatten } from '/@/util'

export function svgLines(projection: any, content: Content) {
  const { map, JSON } = content

  function drawLines(
    selection: any,
    entities: Array<GeoJSON>,
    bounds: Bounds,
    clipExtent: Array<Array<number>>,
  ) {
    JSON.clearLayers()
    const liens = entities.filter(filter).sort(waystack)

    JSON.addData(liens)

    function waystack(a: GeoJSON, b: GeoJSON) {
      let scoreA = 0
      let scoreB = 0
      const highway_stack: any = {
        motorway: 0,
        motorway_link: 1,
        trunk: 2,
        trunk_link: 3,
        primary: 4,
        primary_link: 5,
        secondary: 6,
        tertiary: 7,
        unclassified: 8,
        residential: 9,
        service: 10,
        footway: 11,
      }
      if (a.properties.highway)
        scoreA -= highway_stack[a.properties.highway]
      if (b.properties.highway)
        scoreB -= highway_stack[b.properties.highway]
      return scoreA - scoreB
    }

    // line oneway
    const segments: Array<any> = []
    JSON.eachLayer((layer: any) => {
      const { feature } = layer
      if (feature.properties.oneway || feature.properties.waterway) {
        const onewaySegments = svgMarkerSegments(
          projection,
          clipExtent,
          35,
          () => {
            return feature.properties.oneway === '-1'
          },
          () => {
            return feature.properties.oneway === 'reversible'
              || feature.properties.oneway === 'alternating'
          })
        const onewaydata = onewaySegments(feature)
        if (onewaydata.length)
          segments.push(onewaydata)
      }
    })
    const onewaydata = utilArrayFlatten(segments)
    const onewaygroup = selection.select('g.onewaygroup')
    let markers = onewaygroup.selectAll('path')
      .data(
        () => { return onewaydata },
        (d: Segments) => { return [d.id, d.index] },
      )

    markers.exit()
      .remove()

    markers = markers.enter()
      .append('path')
      .attr('class', 'oneway')
      .merge(markers)
      .attr('marker-mid', 'url(#oneway-marker)')
      .attr('d', (d: any) => {
        return d.d
      })

    function filter(geoJSON: GeoJSON) {
      const layer = L.GeoJSON.geometryToLayer(geoJSON)
      const latLngs = layer.getLatLngs()
      for (let i = 0, j = i + 1; j < latLngs.length;) {
        const start = map.latLngToLayerPoint(latLngs[i++])
        const end = map.latLngToLayerPoint(latLngs[j++])
        const boundsPoints = L.LineUtil.clipSegment(start, end, bounds)
        if (boundsPoints.length)
          return true
      }
      return false
    }
  }

  return drawLines
}
