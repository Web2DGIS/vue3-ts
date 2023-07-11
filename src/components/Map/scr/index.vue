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
import { behaviorHash } from '/@/hooks/core/useHash'
import { GeometryTypeEnum } from '/@/enums/geometryTypeEnum'
import { svgAreas, svgDefs, svgLabels, svgLines, svgPoints } from './svg'
import { themeControl } from './control'

import { geojson } from '/@/data'

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
        zoom: 5,
        minZoom: 2,
        maxZoom: 24,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 500,
        center: [30.66071, 104.06167],
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
        render(settings)
        return settings
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

      const bounds = getBounds()

      const _svgArea = unref(svgArea)
      _svgArea(_svg, as, bounds)

      const _svgLine = unref(svgLine)
      _svgLine(_svg, ls, bounds, clipExtent)

      const _svgPoint = unref(svgPoint)
      _svgPoint(_svg, pts)

      const _svgLabel = unref(svgLabel)
      _svgLabel(_svg, [...ls, ...as, ...pts], clipExtent)
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
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--map-bg-color);

  &, .legend, .leaflet-control-scale-line, .leaflet-control-container a {
    transition: all .6s;
  }

  .legend {
    display: block;
    max-height: 400px;
    overflow-x: scroll;
    border-radius: 4px;
    background-color: var(--bg-color);
    background-image: linear-gradient(155deg,var(--wh-color-primary),transparent 24%);
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
      background-image: linear-gradient(155deg,var(--wh-color-primary),transparent 24%);
      color: var(--text-color);
      font-size: 24px;
      line-height: 30px;

      i {
        color: var(--setting-theme-i-color);
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
