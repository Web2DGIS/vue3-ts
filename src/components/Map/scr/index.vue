<script lang="tsx">
import { defineComponent, onMounted, ref, unref } from 'vue'

import * as d3 from 'd3'
import { geoTransform as d3_geoTransform } from 'd3-geo'
import RBush from 'rbush'
import * as L from 'leaflet'
import 'leaflet-minimap'

import { v4 as uuidv4 } from 'uuid'
import { svgTagClasses } from './tag/tag_classes'
import { miniTileLayer, tileLayers } from './tileLayers'

import login from '/@/assets/images/logo.png'
import typhoonGif from '/@/assets/gif/typhoon.gif'
import { behaviorHash } from '/@/hooks/core/useHash'
import { GeometryTypeEnum } from '/@/enums/geometryTypeEnum'
import { svgAreas, svgDefs, svgLabels, svgLines, svgPoints } from './svg'
import { themeControl } from './control'

import { geojson, typhoon, typhoonLevel } from '/@/data'

import typhoonDetectiveLine from '/@/data/typhoonDetectiveLine.json'

import { layerInfo } from './helpers'

export default defineComponent({
  name: 'LeafletMap',
  setup() {
    const map = ref<any>(null)
    const mapContainer = ref(null)

    const areas = ref<Array<any>>([])
    const lines = ref<Array<any>>([])
    const points = ref<Array<any>>([])
    const legendRef = ref<any>(null)

    const renderer = ref<any>(null)

    const svgArea = ref<any>()
    const svgLine = ref<any>()
    const svgPoint = ref<any>()
    const svgLabel = ref<any>()
    const areaJSON = ref<any>(null)
    const lineJSON = ref<any>(null)

    const svg = ref<any | null>(null)
    const rect = ref<DOMRect | null>(null)

    const typhoonCenters = ref<Array<any>>([])

    const tagClasses = svgTagClasses()

    function areaJSONStyle(feature: any): any {
      return {
        className: `area ${feature.wid} ${tagClasses(feature)}`,
      }
    }

    function lineJSONStyle(feature: any): any {
      return {
        className: `line  ${feature.wid} ${tagClasses(feature)}`,
      }
    }

    onMounted(() => {
      if (d3.select('svg.svg-defs')
        .selectAll('marker')
        .empty()) {
        const defs = svgDefs()
        defs(d3.select('#app').append('svg').attr('class', 'svg-defs'))
      }

      rect.value = d3.select(mapContainer.value)
        .node()
        .getBoundingClientRect()
      map.value = L.map(mapContainer.value, {
        zoom: 4,
        minZoom: 2,
        maxZoom: 24,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 500,
        center: [33.83, 120.15],
      })
      const _map: any = unref(map)
      const hash = behaviorHash({ map: _map })

      hash()

      init(_map)

      redraw()
      _map.on('moveend', () => {
        redraw()
      })
    })

    function projectPoint(x: any, y: any) {
      const point = unref(map).latLngToLayerPoint(L.latLng(y, x))
      this.stream.point(point.x, point.y)
    }

    const projection = d3_geoTransform({
      point: projectPoint,
    })

    function init(map: any) {
      // init dataSource
      switchLayer()

      tileLayers.forEach((layer) => {
        L.tileLayer(layer.url, layer.options)
          .addTo(map)
      })
      L.control.scale().addTo(map)
      new L.Control.MiniMap(
        L.tileLayer(miniTileLayer.url),
        { toggleDisplay: true },
      ).addTo(map)

      const settingControl = L.control({
        position: 'topright',
      })

      settingControl.onAdd = () => {
        const settings = L.DomUtil.create('div', 'setting')
        const render = themeControl()
        return render(settings)
      }
      settingControl.addTo(map)

      const legend = L.control({
        position: 'bottomleft',
      })
      legend.onAdd = () => {
        const legend = L.DomUtil.create('div', 'legend')
        legend.innerHTML = `<img src=${login}>`
        legendRef.value = d3.select(legend)
        return legend
      }
      legend.addTo(map)

      renderer.value = L.svg({ padding: 0.1 }).addTo(map)
      svg.value = d3.select(map.getPanes().overlayPane)
        .select('svg')
        .attr('pointer-events', 'auto')

      // init lineLayer
      lineJSON.value = L.geoJSON(null, {
        renderer: unref(renderer),
        style: lineJSONStyle,
      }).on('click', (e: any) => {
        layerInfo(e.layer.feature)
      }).addTo(map)
      // init areaLayer
      areaJSON.value = L.geoJSON(null, {
        renderer: unref(renderer),
        style: areaJSONStyle,
      }).on('click', (e: any) => {
        layerInfo(e.layer.feature)
      }).addTo(map)
      const _svg = unref(svg)
      // init svg -> g.points...
      _svg.append('g')
        .attr('class', 'points')

      _svg.append('g').attr('class', 'onewaygroup')
      _svg.append('g').attr('class', 'labels')
      _svg.append('defs').attr('class', 'surface-defs')

      svgArea.value = svgAreas(projection, { map, JSON: unref(areaJSON) })
      svgLine.value = svgLines(projection, { map, JSON: unref(lineJSON) })
      svgPoint.value = svgPoints({ map })
      svgLabel.value = svgLabels(projection, { map })
    }

    // 求出方位半径方向上弧形经纬度
    const getPoints = (center, cradius, startAngle) => {
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

    function redraw() {
      const _map = unref(map)
      const _svg = unref(svg)
      const lineJson = unref(lineJSON)
      lineJson.clearLayers()
      let as = []
      let ls = []
      let pts = []
      const { _northEast, _southWest } = _map.getBounds()
      const _southWestXY = _map.latLngToLayerPoint(_southWest)
      const _northEastXY = _map.latLngToLayerPoint(_northEast)
      const bbox = {
        minX: _southWestXY.x,
        minY: _northEastXY.y,
        maxX: _northEastXY.x,
        maxY: _southWestXY.y,
      }
      const clipExtent = [[bbox.minX, bbox.minY], [bbox.maxX, bbox.maxY]]
      if (_map.getZoom() >= 17) {
        const tree = new RBush()
        const rb: Array<any>
          = unref(points).map((point) => {
            const { geometry } = point
            const { x, y } = map.value.latLngToLayerPoint(
              L.latLng(
                geometry.coordinates[1],
                geometry.coordinates[0],
              ),
            )
            return {
              maxX: x,
              maxY: y,
              minX: x,
              minY: y,
              point,
            }
          })
        tree.load(rb)
        pts = tree.search(bbox).map((d: any) => {
          return unref(d.point)
        })
      }

      if (_map.getZoom() >= 16) {
        as = unref(areas)
        ls = unref(lines)
      }

      const typhoonGeoJSON = []

      unref(typhoonCenters).forEach((center) => {
        if (_map.hasLayer(center))
          _map.removeLayer(center)
      })

      typhoon.forEach((e) => {
        const { name, enname, points } = e
        const t = {
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

        t.geometry.coordinates = points.map((point) => {
          let marker
          let bindPopupCentext = `<p style=""><b>${name}</b> ${point.time}</p>
                <p style="color: ${typhoonLevel[point.strong]}">${point.power}级(${point.strong})</p>
                <p>纬度: ${Number(point.lat)} 经度: ${Number(point.lng)}</p>`
          if (index-- === 0) {
            bindPopupCentext += ` <p>未来趋势: <b>${point.jl}</b></p>`
            const icon = L.divIcon({
              html: `<img src="${typhoonGif}">`,
              iconSize: [40, 40],
              className: 'typhoon-marker-gif',
            })
            marker = L.marker(L.latLng(Number(point.lat), Number(point.lng)), {
              icon,
            })
              .bindTooltip(name, { permanent: true })
            const startAngle = [0, 90, 180, 270]
            const { radius7, radius10, radius12 } = point

            if (radius7) {
              const radius7s = point.radius7.split('|')
              const r7Ne = getPoints([Number(point.lat), Number(point.lng)], Number(radius7s[0]), startAngle[0])
              const r7Nw = getPoints([Number(point.lat), Number(point.lng)], Number(radius7s[1]), startAngle[1])
              const r7Sw = getPoints([Number(point.lat), Number(point.lng)], Number(radius7s[2]), startAngle[2])
              const r7Se = getPoints([Number(point.lat), Number(point.lng)], Number(radius7s[3]), startAngle[3])
              const polygon7 = L.polygon([
                ...r7Ne, ...r7Nw, ...r7Sw, ...r7Se,
              ], { smoothFactor: 0.1, fillColor: 'rgb(0, 176, 15)', color: 'rgb(0, 176, 15)', weight: 1 }).addTo(_map)
              unref(typhoonCenters).push(polygon7)
            }

            if (radius10) {
              const radius10s = point.radius10.split('|')
              const r10Ne = getPoints([Number(point.lat), Number(point.lng)], Number(radius10s[0]), startAngle[0])
              const r10Nw = getPoints([Number(point.lat), Number(point.lng)], Number(radius10s[1]), startAngle[1])
              const r10Sw = getPoints([Number(point.lat), Number(point.lng)], Number(radius10s[2]), startAngle[2])
              const r10Se = getPoints([Number(point.lat), Number(point.lng)], Number(radius10s[3]), startAngle[3])
              const polygon7 = L.polygon([
                ...r10Ne, ...r10Nw, ...r10Sw, ...r10Se,
              ], { color: 'rgb(248, 213, 0)', weight: 1 }).addTo(_map)
              unref(typhoonCenters).push(polygon7)
            }

            if (radius12) {
              const radius12s = point.radius12.split('|')
              const r12Ne = getPoints([Number(point.lat), Number(point.lng)], Number(radius12s[0]), startAngle[0])
              const r12Nw = getPoints([Number(point.lat), Number(point.lng)], Number(radius12s[1]), startAngle[1])
              const r12Sw = getPoints([Number(point.lat), Number(point.lng)], Number(radius12s[2]), startAngle[2])
              const r12Se = getPoints([Number(point.lat), Number(point.lng)], Number(radius12s[3]), startAngle[3])
              const polygon7 = L.polygon([
                ...r12Ne, ...r12Nw, ...r12Sw, ...r12Se,
              ], { smoothFactor: 0.1, fillColor: 'rgb(255, 0, 0)', color: 'rgb(255, 0, 0)', weight: 1 }).addTo(_map)
              unref(typhoonCenters).push(polygon7)
            }
          }
          else {
            marker = L.circle(L.latLng(Number(point.lat), Number(point.lng)), {
              color: typhoonLevel[point.strong],
              weight: 6,
            })
          }

          marker
            .bindPopup(bindPopupCentext)
            .addTo(_map)
          unref(typhoonCenters).push(marker)
          return [Number(point.lng), Number(point.lat)]
        })
        typhoonGeoJSON.push(t)
      })

      const bounds = getBounds()

      const _svgArea = unref(svgArea)
      _svgArea(_svg, as, bounds)

      const _svgLine = unref(svgLine)
      _svgLine(_svg, [...ls, ...typhoonDetectiveLine, ...typhoonGeoJSON], bounds, clipExtent)

      const _svgPoint = unref(svgPoint)
      _svgPoint(_svg, pts)

      const _svgLabel = unref(svgLabel)
      _svgLabel(_svg, [...typhoonDetectiveLine, ...as, ...pts], clipExtent)
    }

    function getBounds() {
      const _map = unref(map)
      const { _northEast, _southWest } = _map.getBounds()
      const northEastPoint = _map.latLngToLayerPoint(_northEast)
      const southWestPoint = _map.latLngToLayerPoint(_southWest)
      return L.bounds(northEastPoint, southWestPoint)
    }

    const jsonData = geojson
    function switchLayer() {
      jsonData.forEach((feature) => {
        const index = feature.id ? feature.id.indexOf('/') : ''
        if (feature.id && index !== -1)
          feature.wid = `w${feature.id.substring(index + 1, feature.id.length)}`
        else
          feature.wid = `w${uuidv4()}`

        switch (feature.geometry.type) {
          case GeometryTypeEnum.POINT:
            unref(points).push(feature)
            break
          case GeometryTypeEnum.POLYGON:
            unref(areas).push(feature)
            break
          case GeometryTypeEnum.LINE_STRING:
            unref(lines).push(feature)
            break
          default:
            break
        }
      })
    }

    return () => {
      return (
        <div id='map-container' ref={mapContainer} />
      )
    }
  },
})
</script>

<style lang="less">
@import 'leaflet-minimap/dist/Control.MiniMap.min.css';

#map-container {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--map-bg-color);
  inset: 0;

  &,
  .legend,
  .leaflet-control-scale-line,
  .leaflet-control-container a {
    transition: all .6s;
  }

  .legend {
    display: block;
    max-height: 400px;
    overflow-x: scroll;
    border-radius: 4px;
    background-color: var(--bg-color);
    background-image: linear-gradient(155deg, var(--wh-color-primary), transparent 24%);
    box-shadow: 0 0 15px rgba(0, 0, 0, .2);
    color: var(--text-color);
    font-size: 10px;

    & p {
      margin: 0;
      padding: 2px 6px;

      & span {
        margin-right: 4px;
      }
    }

    & img {
      display: block;
      width: 86px;
      height: auto;
      margin: 6px;
    }
  }

  .setting {
    a {
      width: 30px;
      height: 30px;
      padding: 4px;
      border: 2px solid var(--border-color);
      border-radius: 2px;
      background-color: var(--bg-color);
      background-image: linear-gradient(155deg, var(--wh-color-primary), transparent 24%);
      color: var(--text-color);
      font-size: 24px;
      line-height: 30px;

      img {
        display: inline-block;
        width: 30px;
        height: auto;
      }
    }
  }

  .leaflet-control-scale-line {
    border-color: var(--border-color);
    background: var(--bg-color);
    color: var(--text-color);
    text-shadow: 1px 1px var(--bg-color);
  }

  .leaflet-bar a {
    background: var(--bg-color);
    color: var(--text-color);
  }

  .leaflet-control-minimap {
    border: var(--border-color) solid;
    background: var(--bg-color);
  }

  .leaflet-control-attribution {
    background: var(--bg-color);
  }
}
</style>
