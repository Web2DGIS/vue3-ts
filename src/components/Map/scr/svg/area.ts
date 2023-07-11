import { geoPath as d3_geoPath } from 'd3-geo'
import type { Bounds, Content, GeoJSON } from '../types'
import { area, dataKey } from '../helpers'

export function svgAreas(projection: any, content: Content) {
  const { map, JSON } = content

  const zoomAreaField: any = {
    16: {
      field: 'building',
    },
  }

  function drawAreas(selection: any, entities: Array<GeoJSON>, bounds: Bounds) {
    JSON.clearLayers()
    const areas: any[] = entities.filter(filter)

    for (let i = 0; i < areas.length; i++)
      areas[i].area = Math.abs(area(areas[i]))
    areas.sort((a: any, b: any) => { return a.area - b.area })

    // area clipPath
    const path = d3_geoPath()
      .projection(projection)
    let clipPaths = selection
      .selectAll('defs')
      .selectAll('.clipPath-osm')
      .data(areas, dataKey)

    const clipPathsEnter = clipPaths.enter()
      .append('clipPath')
      .attr('class', 'clipPath-osm')
      .attr('id', (entity: GeoJSON) => {
        return `hy-${entity.wid}-clippath`
      })

    clipPathsEnter
      .append('path')

    clipPaths = clipPaths.merge(clipPathsEnter)
      .selectAll('path')
      .attr('d', path)

    JSON.addData(areas)

    JSON.eachLayer((layer: any) => {
      layer._path.setAttribute('clip-path', `url(#hy-${layer.feature.wid}-clippath)`)
    })

    function filter(entity: GeoJSON): boolean {
      const layer = L.GeoJSON.geometryToLayer(entity)
      const latLngs = layer.getLatLngs()
      const points: Array<any> = []
      latLngs.forEach((lls: any) => {
        lls.forEach((latlng: any) => {
          const point = map.latLngToLayerPoint(latlng)
          points.push(point)
        })
      })
      const clipPolygon = L.PolyUtil.clipPolygon(points, bounds)
      const _zoomAreaField = zoomAreaField[map.getZoom()]
      const field = _zoomAreaField ? entity.properties[_zoomAreaField.field] : undefined

      return clipPolygon.length > 0 && (!_zoomAreaField || !field)
    }
  }

  return drawAreas
}
