import * as d3 from 'd3'
import truncate from '@turf/truncate'
import type { Content, GeoJSON } from '../types'

export function svgPoints(content: Content) {
  const { map } = content

  // use pointer events on supported platforms; fallback to mouse events
  const _pointerPrefix: string = 'PointerEvent' in window ? 'pointer' : 'mouse'

  function markerPath(selection: any, klass: string) {
    selection.attr('class', klass)
      .attr('transform', 'translate(-8, -23)')
      .attr('d', 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z')
  }

  function eventTarget(d3_event: any): any {
    const datum: object = d3_event.target && d3_event.target.__data__
    if (typeof datum !== 'object')
      return null
    return datum
  }

  // function boundContains(map: any, coordinates: Array<number>): boolean {
  //   return map.getBounds()
  //     .contains(L.latLng(coordinates[1], coordinates[0]))
  // }

  function svgPointTransform(map: any, point: any): string {
    const latLng = L.latLng(
      point.geometry.coordinates[1],
      point.geometry.coordinates[0],
    )
    const { x, y } = map
      .latLngToLayerPoint(latLng)
    return `translate(${x}, ${y})`
  }

  function sortY(a: any, b: any) {
    return a.geometry.coordinates[1] - b.geometry.coordinates[1]
  }

  function drawPoints(selection: any, entities: Array<GeoJSON>) {
    // function renderAsPoint(entity: any) {
    //   const { geometry } = entity
    //   return map.getZoom() >= 16 && geometry.type === 'Point'
    //    && (boundContains(map, geometry.coordinates))
    // }

    // const points = entities.filter(renderAsPoint)

    entities.sort(sortY)

    const drawLayer = selection.selectAll('.points')
    let groups = drawLayer.selectAll('g.point')
      .data(entities)

    groups.exit().remove()

    const enter = groups.enter()
      .append('g')
      .attr('class', (d: any) => {
        return `node point ${d.wid}`
      })

    enter.append('path')
      .on(`${_pointerPrefix}over.hover`, (d: any) => {
        d.target.classList.add('hover')
      })
      .on(`${_pointerPrefix}out.hover`, (d: any) => {
        d.target.classList.remove('hover')
      })
      .on(`${_pointerPrefix}down.hover`, (d: any) => {
        const target = eventTarget(d)
        const _legendRef = d3.select('.legend')
        _legendRef.selectAll('p').remove()
        Object.keys(target.properties).forEach((key) => {
          const p = _legendRef.append('p').attr('class', 'ele')
          p.append('span').text(`${key}:`)
          p.append('b').text(target.properties[key])
        })

        const p = _legendRef.append('p').attr('class', 'ele')
        const newPoint = truncate(target, { precision: 6 })
        p.append('span').text(`经度: ${newPoint.geometry.coordinates[0]}`)
        p.append('span').text(`纬度: ${newPoint.geometry.coordinates[1]}`)
      })
      .call(markerPath, 'shadow')

    enter.append('ellipse')
      .attr('cx', 0.5)
      .attr('cy', 1)
      .attr('rx', 6.5)
      .attr('ry', 3)
      .attr('class', 'stroke')

    enter.append('path')
      .call(markerPath, 'stroke')

    enter.append('use')
      .attr('transform', 'translate(-5.5, -20)')
      .attr('class', 'icon')
      .attr('width', '12px')
      .attr('height', '12px')

    groups
      = groups.merge(enter)
        .attr('transform', (d: any): string => {
          return svgPointTransform(map, d)
        })

    groups.select('.shadow')
    groups.select('.stroke')
  }

  return drawPoints
}
