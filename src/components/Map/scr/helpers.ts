import * as d3 from 'd3'

import {
  geoArea as d3_geoArea,
  geoIdentity as d3_geoIdentity,
  geoStream as d3_geoStream,
} from 'd3-geo'

import turf_Area from '@turf/area'
import turf_Length from '@turf/length'

import {
  geoVecAdd,
  geoVecAngle,
  geoVecLength,
} from '/@/geo/vector'
import type { GeoJSON } from './types'
import { GeometryTypeEnum } from '/@/enums/geometryTypeEnum'

export interface Segments {
  d: string
  id: string
  index: number
}

export function svgMarkerSegments(
  projection: any,
  clipExtent: Array<Array<number>>,
  dt: number,
  shouldReverse: any,
  bothDirections: any,
): (entity: GeoJSON) => Array<Segments> {
  return function (entity: GeoJSON) {
    let i = 0
    let offset = dt
    const segments: Array<Segments> = []
    const clip = d3_geoIdentity().clipExtent(clipExtent).stream
    const coordinates = [...entity.geometry.coordinates]
    let a: Array<number> | null, b: Array<number> | null
    if (shouldReverse(entity))
      coordinates.reverse()

    d3_geoStream({
      type: 'LineString',
      coordinates,
    }, projection.stream(clip({
      lineStart() {},
      lineEnd() { a = null },
      point(x: number, y: number) {
        b = [x, y]

        if (a) {
          let span = geoVecLength(a, b) - offset
          if (span >= 0) {
            const heading = geoVecAngle(a, b)
            const dx = dt * Math.cos(heading)
            const dy = dt * Math.sin(heading)
            let p = [
              a[0] + offset * Math.cos(heading),
              a[1] + offset * Math.sin(heading),
            ]

            // gather coordinates
            const coord: Array<Array<number>> = [a, p]
            for (span -= dt; span >= 0; span -= dt) {
              p = geoVecAdd(p, [dx, dy])
              coord.push(p)
            }
            coord.push(b)

            // generate svg paths
            let segment = ''
            let j
            for (j = 0; j < coord.length; j++)
              segment += `${(j === 0 ? 'M' : 'L') + coord[j][0]},${coord[j][1]}`
            segments.push({ id: entity.wid, index: i++, d: segment })
            if (bothDirections(entity)) {
              segment = ''
              for (j = coord.length - 1; j >= 0; j--)
                segment += `${(j === coord.length - 1 ? 'M' : 'L') + coord[j][0]},${coord[j][1]}`
              segments.push({ id: entity.wid, index: i++, d: segment })
            }
          }
          offset = -span
        }

        a = b
      },
    })))

    return segments
  }
}

export function dataKey(entity: GeoJSON): string {
  return `${entity.wid}v${(entity.v || 0)}`
}

export function area(entity: GeoJSON) {
  let area = d3_geoArea(entity)
  if (area > 2 * Math.PI) {
    entity.geometry.coordinates[0] = entity.geometry.coordinates[0].reverse()
    area = d3_geoArea(entity)
  }
  return Number.isNaN(area) ? 0 : area
}

export function layerInfo(feature: GeoJSON) {
  const { properties, geometry } = feature
  const legend = d3.select('.legend')

  const info: any = {}
  if (geometry.type === GeometryTypeEnum.POLYGON) {
    info.key = '面积: '
    info.value = `${turf_Area(feature).toFixed(4)} m²`
  }
  if (geometry.type === GeometryTypeEnum.LINE_STRING) {
    info.key = '长度: '
    info.value = `${turf_Length(feature, { units: 'kilometers' }).toFixed(4)} 公里`
  }
  properties[info.key] = info.value
  const data = Object.keys(properties)

  const list = legend.selectAll('p')
    .data(
      data,
      (d: string, i: number) => {
        return [d, i]
      },
    )

  list.exit()
    .remove()

  const enter = list.enter()
    .append('p')
    .attr('class', 'ele')
    .order()

  enter
    .append('span')
    .text((d: string) => { return `${d}: ` })

  enter
    .append('b')
    .text((d: string) => { return properties[d] })
}
