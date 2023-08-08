import * as d3 from 'd3'

import {
  geoArea as d3_geoArea,
  geoIdentity as d3_geoIdentity,
  geoStream as d3_geoStream,
} from 'd3-geo'

import turf_Area from '@turf/area'
import turf_Length from '@turf/length'
import turf_line_arc from '@turf/line-arc'
import {
  lineString as turf_lineString,
  point as turf_point,
} from '@turf/helpers'
import turf_line_to_polygon from '@turf/line-to-polygon'

import '/@/leaflet/typhoon'

import {
  geoVecAdd,
  geoVecAngle,
  geoVecLength,
} from '/@/geo/vector'
import type { GeoJSON } from './types'
import { GeometryTypeEnum } from '/@/enums/geometryTypeEnum'

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

export function layerInfo(feature: any) {
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
  const radius = cradius / 100
  const pointNum = 90
  const endAngle = startAngle + 90
  const points: Array<Array<number>> = []
  let sin
  let cos
  let x: number
  let y: number
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

export const typhoonLevel: Array<string> = [
  '#fff',
  '#fff',
  '#fff',
  '#fff',
  '#fff',
  '#fff',
  '#52c41a',
  '#52c41a',
  '#1677ff',
  '#1677ff',
  '#fadb14',
  '#fadb14',
  '#fa8c16',
  '#fa8c16',
  '#eb2f96',
  '#eb2f96',
  '#f5222d',
  '#f5222d',
  '#f5222d',
  '#f5222d',
]

export const typhoonStatus: any = {
  台风: '#FF9800',
  强台风: '#E91E63',
  超强台风: '#D50000',
  热带风暴: '#3F51B5',
  强热带风暴: '#FFC107',
}

const radiusInfo: any = {
  radius7: ['七级', 'rgb(0, 176, 15)'],
  radius10: ['十级', 'rgb(248, 213, 0)'],
  radius12: ['十二级', 'rgb(255, 0, 0)'],
}

const nationalColor: any = {
  中国: '#F44336',
  中国香港: '#9C27B0',
  中国台湾: '#2196F3',
  日本: '#009688',
  美国: '#FF9800',
}

/**
 * 台风所属的所有地图图层
 */
let typhooLineLayers: any
let typhooPolygonLayers: any
let typhooMakerLayers: any

function init(map: any, renderer: any) {
  typhooLineLayers = L.featureGroup(null, { renderer }).addTo(map)
  typhooPolygonLayers = L.featureGroup(null, { renderer }).addTo(map)
  typhooMakerLayers = L.featureGroup(null, { renderer }).addTo(map)
}

export function redrawTyphoon(url: string, map: any, renderer: any) {
  init(map, renderer)
  const lines: Array<any> = []
  const polygons: Array<any> = []
  const makers: Array<any> = []
  const request = new XMLHttpRequest()
  request.onreadystatechange = function () { // 状态发生变化时，函数被回调
    if (request.readyState === 4) { // 成功完成
      // 判断响应结果:
      if (request.status === 200) {
        const { name, points, tfid } = JSON.parse(request.response)
        let coordinates = []
        let index = points.length - 1
        let bindPopupContent
        coordinates = points.map((point: any) => {
          let marker
          bindPopupContent = `<p style=""><b>${name}</b> ${getDate(point.time)}</p>
            <p>风速风力: ${point.speed} 米/秒,<b style="color: ${typhoonLevel[point.power.replace(/(^\s*)|(\s*$)/g, '') ? point.power : 0]}">${point.power.replace(/(^\s*)|(\s*$)/g, '') ? point.power : 0}级(${point.strong})</b></p>
            <p>移速移向: ${point.movespeed} 公里/小时,${point.movedirection}</p>
            <p>中心气压: ${point.pressure} 百帕</p>
            <p>纬度: ${Number(point.lat)} 经度: ${Number(point.lng)}</p>`
          const radius7 = point.radius7 ? point.radius7.split('|') : ''
          const radius10 = point.radius10 ? point.radius10.split('|') : ''
          const radius12 = point.radius12 ? point.radius12.split('|') : ''

          bindPopupContent += Array.isArray(radius7) ? `<p>七级半径: ${Math.min(...radius7)}~${Math.max(...radius7)}</p>` : ''
          bindPopupContent += Array.isArray(radius10) ? `<p>十级半径: ${Math.min(...radius10)}~${Math.max(...radius10)}</p>` : ''
          bindPopupContent += Array.isArray(radius12) ? `<p>十二级半径: ${Math.min(...radius12)}~${Math.max(...radius12)}</p>` : ''
          if (index-- === 0) {
            bindPopupContent += point.ckposition ? `<p>参考位置: <b>${point.ckposition}</b></p>` : ''
            bindPopupContent += point.jl ? `<p>未来趋势: <b>${point.jl}</b></p>` : ''

            const icon = L.divIcon({
              html: `<img src="${typhoonGif}">`,
              iconSize: [40, 40],
              className: 'typhoon-marker-gif',
            })

            marker = L.marker(L.latLng(Number(point.lat), Number(point.lng)), {
              icon,
            }).bindTooltip(`
            <b style="color: ${typhoonStatus[point.strong]}">${name}</b> (${getDate(point.time)})`,
            { permanent: true })
            const startAngle = [0, 90, 180, 270]

            for (const key of Object.keys(point)) {
              if (key.includes('radius') && point[key]) {
                const radius = point[key].split('|')
                const lat = Number(point.lat)
                const lng = Number(point.lng)
                const pt = turf_point([lng, lat])

                // 0: 东北, 1: 东南，2: 西南, 3: 西北
                const ne = turf_line_arc(pt, Number(radius[0]), startAngle[0], 89.9) // 东北
                const se = turf_line_arc(pt, Number(radius[1]), startAngle[1], 179.9) // 东南
                const nw = turf_line_arc(pt, Number(radius[2]), startAngle[3], 360.1) // 西北
                const sw = turf_line_arc(pt, Number(radius[3]), startAngle[2], 269.9) // 西南

                const geoJSONS = [ne, se, sw, nw]
                const typhoonCircleCoords: Array<any> = []
                geoJSONS.forEach((geoJSON) => {
                  typhoonCircleCoords.push(...geoJSON.geometry.coordinates)
                })

                const style = {
                  smoothFactor: 0.1,
                  fillColor: radiusInfo[key][1],
                  color: radiusInfo[key][1],
                  weight: 1,
                  className: 'typhoon-circle',
                  fillOpacity: 0.4,
                  renderer,
                }

                const lineAll = turf_lineString(typhoonCircleCoords)
                const polygon = L.GeoJSON.geometryToLayer(turf_line_to_polygon(lineAll))
                  .setStyle(style)
                  .bindPopup(
                    `
                    <p>${radiusInfo[key][0]}风圈</p>
                    <p>西北:${radius[2]} | 东北:${radius[0]}</p>
                    <p>西南:${radius[3]} | 东南:${radius[1]}</p>
                    `,
                  )
                polygons.push(polygon)
                drawForecast(point.forecast, map)
              }
            }
          }
          else {
            marker = drawTyphoonMarker(point, 6)
            if (index + 1 === points.length - 1)
              marker.bindTooltip(`${tfid}${name}`, { permanent: true })
          }
          marker.bindPopup(bindPopupContent)
          makers.push(marker)

          return [Number(point.lat), Number(point.lng)]
        })
        const weight = 2
        const line = L.polyline(coordinates, { className: 'path-my', weight })
        lineMouse(line, weight)
        lines.push(line)
        lines.forEach((layer) => {
          typhooLineLayers.addLayer(layer)
        })
        polygons.forEach((layer) => {
          typhooPolygonLayers.addLayer(layer)
        })
        makers.forEach((layer) => {
          typhooMakerLayers.addLayer(layer)
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

function lineMouse(line: any, weight: number) {
  line
    .on('mouseover', ({ sourceTarget }) => {
      const newWeight = weight + weight
      sourceTarget.setStyle({ weight: newWeight })
    })
    .on('mouseout', ({ sourceTarget }) => {
      sourceTarget.setStyle({ weight })
    })
}

function drawTyphoonMarker(point: any, weight: number): any {
  const level = point.power.replace(/(^\s*)|(\s*$)/g, '') ? point.power : 0
  const color = typhoonLevel[level]
  return L.circle(L.latLng(Number(point.lat), Number(point.lng)), {
    color,
    weight,
  })
    .on('mouseover', ({ sourceTarget }) => {
      const newWeight = weight + weight
      sourceTarget.setStyle({ weight: newWeight })
    })
    .on('mouseout', ({ sourceTarget }) => {
      sourceTarget.setStyle({ weight })
    })
}

function getDate(time: string): string {
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}时`
}

function drawForecast(forecast: Array<any>, map: any) {
  if (!forecast.length)
    return
  const lines: Array<any> = []
  const makers: Array<any> = []
  forecast.forEach(({ tm, forecastpoints }) => {
    const latlngs = forecastpoints.map((point: any) => {
      const marker = drawTyphoonMarker(point, 6)
      const bindPopupContent = `
      <p><b style="color:${nationalColor[tm]}">${tm}</b> 
      ${getDate(point.time)} 预报</p>
      <p>最大风速: ${point.speed}/秒</p>
      <p>风&nbsp;&nbsp;&nbsp;力: ${point.power.replace(/(^\s*)|(\s*$)/g, '') ? point.power : 0}级</p>
      `
      marker.bindPopup(bindPopupContent)
      makers.push(marker)
      return [Number(point.lat), Number(point.lng)]
    })
    const weight = 1
    const line = L.polyline(latlngs, { weight, dashArray: [10, 6], color: nationalColor[tm] })
    lineMouse(line, weight)
    lines.push(line)
  })
  lines.forEach((layer) => {
    typhooLineLayers.addLayer(layer)
  })
  makers.forEach((layer) => {
    typhooMakerLayers.addLayer(layer)
  })
}
