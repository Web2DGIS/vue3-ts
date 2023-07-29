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
import { typhoonLevel } from '/@/data'

import typhoonGif from '/@/assets/gif/typhoon.gif'

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
    info.key = '面积'
    info.value = `${turf_Area(feature).toFixed(4)} m²`
  }
  if (geometry.type === GeometryTypeEnum.LINE_STRING) {
    info.key = '长度'
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

export function getPoints(center: Array<number>, cradius: number, startAngle: number):
Array<Array<number>> {
  const radius = cradius / 90
  const pointNum = 90
  const endAngle = startAngle + 90
  const points = []
  let sin
  let cos
  let x
  let y
  let angle

  for (let i = 0; i <= pointNum; i++) {
    angle = startAngle + (endAngle - startAngle) * i
      / pointNum
    sin = Math.sin(angle * Math.PI / 180)
    cos = Math.cos(angle * Math.PI / 180)
    x = center[0] + radius * sin
    y = center[1] + radius * cos
    points.push([x, y])
  }
  return points
}

const typhoonCenters: Array<any> = []
export function redrawTyphoon(url: string, _map: any) {
  const request = new XMLHttpRequest()
  request.onreadystatechange = function () { // 状态发生变化时，函数被回调
    if (request.readyState === 4) { // 成功完成
      // 判断响应结果:
      if (request.status === 200) {
        const { name, enname, points } = JSON.parse(request.response)
        const geoJSON = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: undefined,
          },
          properties: {
            name,
            enname,
            highway: 'typhoon',
          },
          wid: `typhoon-${enname}`,
        }
        let index = points.length - 1
        let bindPopupCentext
        geoJSON.geometry.coordinates = points.map((point: any) => {
          let marker
          bindPopupCentext = `<p style=""><b>${name}</b> ${point.time}</p>
            <p style="color: ${typhoonLevel[point.strong]}">${point.power}级(${point.strong})</p>
            <p>纬度: ${Number(point.lat)} 经度: ${Number(point.lng)}</p>`
          if (index-- === 0) {
            bindPopupCentext += `<p>未来趋势: <b>${point.jl}</b></p>`
            const icon = L.divIcon({
              html: `<img src="${typhoonGif}">`,
              iconSize: [40, 40],
              className: 'typhoon-marker-gif',
            })
            marker = L.marker(L.latLng(Number(point.lat), Number(point.lng)), {
              icon,
            }).bindTooltip(`<b style="color: ${typhoonLevel[point.strong]}">${name}</b> ${point.time}`, { permanent: true })
            const startAngle = [0, 90, 180, 270]

            const numColor: any = {
              radius7: 'rgb(0, 176, 15)',
              radius10: 'rgb(248, 213, 0)',
              radius12: 'rgb(248, 213, 0)',
            }

            for (const key of Object.keys(point)) {
              if (key.includes('radius') && point[key]) {
                const radius = point[key].split('|')
                const lat = Number(point.lat)
                const lng = Number(point.lng)
                const ne = getPoints([lat, lng], Number(radius[0]), startAngle[0])
                const nw = getPoints([lat, lng], Number(radius[1]), startAngle[1])
                const rw = getPoints([lat, lng], Number(radius[2]), startAngle[2])
                const re = getPoints([lat, lng], Number(radius[3]), startAngle[3])
                const polygon = L.polygon([
                  ...ne, ...nw, ...rw, ...re,
                ], { smoothFactor: 0.1, fillColor: numColor[key], color: numColor[key], weight: 1 }).addTo(_map)
                typhoonCenters.push(polygon)
              }
            }
          }
          else {
            marker = L.circle(L.latLng(Number(point.lat), Number(point.lng)), {
              color: typhoonLevel[point.strong],
              weight: 6,
            })
          }
          marker.bindPopup(bindPopupCentext)
          typhoonCenters.push(marker)

          return [Number(point.lng), Number(point.lat)]
        })
        L.GeoJSON.geometryToLayer(geoJSON).addTo(_map)
        typhoonCenters.forEach((e) => {
          e.addTo(_map)
        })
      }
    }
    else {
      // HTTP请求还在继续...
    }
  }

  request.open('GET', url)
  request.send()
}
