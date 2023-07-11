import { geoPath as d3_geoPath } from 'd3-geo'
import { utilDisplayName, utilDisplayNameForPath } from '/@/util'
import { GeometryTypeEnum } from '/@/enums/geometryTypeEnum'
import RBush from 'rbush'
import { geoPathLength, geoPolygonIntersectsPolygon } from '/@/geo/geom'
import { geoVecInterp, geoVecLength } from '/@/geo/vector'
import { dataKey } from '../helpers'

export function svgLabels(projection: any, context: any) {
  const path = d3_geoPath(projection)

  const { map } = context

  let _entitybboxes: any = {}
  const _rdrawn = new RBush()
  const _textWidthCache: any = {}
  const _rskipped = new RBush()

  // Listed from highest to lowest priority
  const labelStack = [
    [GeometryTypeEnum.LINE_STRING, 'aeroway', '*', 12],
    [GeometryTypeEnum.LINE_STRING, 'highway', 'motorway', 12],
    [GeometryTypeEnum.LINE_STRING, 'highway', 'trunk', 12],
    [GeometryTypeEnum.LINE_STRING, 'highway', 'primary', 12],
    [GeometryTypeEnum.LINE_STRING, 'highway', 'secondary', 12],
    [GeometryTypeEnum.LINE_STRING, 'highway', 'tertiary', 12],
    [GeometryTypeEnum.LINE_STRING, 'highway', '*', 12],
    [GeometryTypeEnum.LINE_STRING, 'railway', '*', 12],
    [GeometryTypeEnum.LINE_STRING, 'waterway', '*', 12],
    [GeometryTypeEnum.POLYGON, 'aeroway', '*', 12],
    [GeometryTypeEnum.POLYGON, 'amenity', '*', 12],
    [GeometryTypeEnum.POLYGON, 'building', '*', 12],
    [GeometryTypeEnum.POLYGON, 'historic', '*', 12],
    [GeometryTypeEnum.POLYGON, 'leisure', '*', 12],
    [GeometryTypeEnum.POLYGON, 'man_made', '*', 12],
    [GeometryTypeEnum.POLYGON, 'natural', '*', 12],
    [GeometryTypeEnum.POLYGON, 'shop', '*', 12],
    [GeometryTypeEnum.POLYGON, 'tourism', '*', 12],
    [GeometryTypeEnum.POLYGON, 'camp_site', '*', 12],
    [GeometryTypeEnum.POINT, 'aeroway', '*', 10],
    [GeometryTypeEnum.POINT, 'amenity', '*', 10],
    [GeometryTypeEnum.POINT, 'building', '*', 10],
    [GeometryTypeEnum.POINT, 'historic', '*', 10],
    [GeometryTypeEnum.POINT, 'leisure', '*', 10],
    [GeometryTypeEnum.POINT, 'man_made', '*', 10],
    [GeometryTypeEnum.POINT, 'natural', '*', 10],
    [GeometryTypeEnum.POINT, 'shop', '*', 10],
    [GeometryTypeEnum.POINT, 'tourism', '*', 10],
    [GeometryTypeEnum.POINT, 'camp_site', '*', 10],
    [GeometryTypeEnum.LINE_STRING, 'ref', '*', 12],
    [GeometryTypeEnum.POLYGON, 'ref', '*', 12],
    [GeometryTypeEnum.POINT, 'ref', '*', 10],
    [GeometryTypeEnum.LINE_STRING, 'name', '*', 12],
    [GeometryTypeEnum.POLYGON, 'name', '*', 12],
    [GeometryTypeEnum.POINT, 'name', '*', 10],
  ]

  function get(array: Array<any>, prop: string) {
    return function (_d: any, i: number) { return array[i][prop] }
  }

  function textWidth(text: string, size: number, elem?: SVGTextContentElement): number {
    let c = _textWidthCache[size]
    if (!c)
      c = _textWidthCache[size] = {}

    if (c[text]) {
      return c[text]
    }
    else if (elem) {
      c[text] = elem.getComputedTextLength()
      return c[text]
    }
    else {
      const str = encodeURIComponent(text).match(/%[CDEFcdef]/g)
      if (str === null)
        return size / 3 * 2 * text.length

      else
        return size / 3 * (2 * text.length + str.length)
    }
  }

  function drawLinePaths(selection: any, entities: any, classes: string, labels: Array<any>) {
    const paths = selection.selectAll('path')
      .data(entities, dataKey)

    // exit
    paths.exit()
      .remove()

    // enter/update
    paths.enter()
      .append('path')
      .style('stroke-width', get(labels, 'font-size'))
      .attr('id', (d: any) => { return `labelpath-${d.wid}` })
      .attr('class', classes)
      .merge(paths)
      .attr('d', get(labels, 'lineString'))
  }

  function drawLineLabels(selection: any, entities: any, classes: string, labels: Array<any>) {
    const texts = selection.selectAll(`text.${classes}`)
      .data(entities, dataKey)

    texts
      .exit()
      .remove()

    texts.enter()
      .append('text')
      .attr('class', (d: any, i: number) => { return `${classes} ${labels[i].classes} ${d.wid}` })
      .append('textPath')
      .attr('class', 'textpath')

    // update
    selection.selectAll(`text.${classes}`).selectAll('.textpath')
      .data(entities, dataKey)
      .attr('startOffset', '50%')
      .attr('xlink:href', (d: any) => { return `#labelpath-${d.wid}` })
      .text((d: any) => { return utilDisplayNameForPath(d.properties) })
  }

  function drawPointLabels(selection: any, entities: Array<any>, classes: string, labels: Array<any>) {
    const texts = selection.selectAll(`text.${classes}`)
      .data(entities, dataKey)

    texts.exit()
      .remove()

    texts.enter()
      .append('text')
      .attr('class', (d: any, i: number) => {
        return `${classes} ${labels[i].classes} ${d.wid}`
      })
      .merge(texts)
      .attr('x', get(labels, 'x'))
      .attr('y', get(labels, 'y'))
      .style('text-anchor', get(labels, 'textAnchor'))
      .text((d: any) => { return utilDisplayName(d.properties) })
      .each((d: any, i: number) => {
        textWidth(utilDisplayName(d.properties), labels[i].height, this)
      })
  }

  function drawAreaLabels(selection: any, entities: Array<any>, classes: string, labels: Array<any>) {
    entities = entities.filter(hasText)
    labels = labels.filter(hasText)
    drawPointLabels(selection, entities, classes, labels)

    function hasText(_d: any, i: number) {
      return labels[i].hasOwnProperty('x') && labels[i].hasOwnProperty('y')
    }
  }

  function drawLabels(selection: any, entities: Array<any>, clipExtent: Array<Array<number>>) {
    const labelable: Array<any> = []
    const renderNodeAs: any = {}
    let i, k, entity, geometry: any
    for (i = 0; i < labelStack.length; i++)
      labelable.push([])

    _rdrawn.clear()
    _rskipped.clear()
    _entitybboxes = {}

    for (i = 0; i < entities.length; i++) {
      entity = entities[i]
      geometry = entity.geometry.type
      if (geometry === GeometryTypeEnum.POINT) {
        let markerPadding
        renderNodeAs[entity.wid] = GeometryTypeEnum.POINT
        if (map.getZoom() >= 18)
          markerPadding = 20

        else
          markerPadding = 0

        const coord = map.latLngToLayerPoint(
          L.latLng(entity.geometry.coordinates[1],
            entity.geometry.coordinates[0]),
        )
        const nodePadding = 10

        const bbox = {
          minX: coord.x - nodePadding,
          minY: coord.y - nodePadding - markerPadding,
          maxX: coord.x + nodePadding,
          maxY: coord.y + nodePadding,
        }
        doInsert(bbox, `${entity.wid}P`)
      }
      if (!utilDisplayName(entity.properties))
        continue

      for (k = 0; k < labelStack.length; k++) {
        const matchKey = labelStack[k][1]
        const matchVal = labelStack[k][2]
        const matchGeom = labelStack[k][0]
        const hasVal = entity.properties[matchKey]

        if (geometry === matchGeom && hasVal && (matchVal === '*' || matchVal === hasVal)) {
          labelable[k].push(entity)
          break
        }
      }
    }

    const positions: any = {
      Point: [],
      Polygon: [],
      LineString: [],
    }

    const labelled: any = {
      Point: [],
      Polygon: [],
      LineString: [],
    }

    for (k = 0; k < labelable.length; k++) {
      const fontSize: number = labelStack[k][3]

      for (i = 0; i < labelable[k].length; i++) {
        entity = labelable[k][i]
        geometry = entity.geometry.type

        const getName = (geometry === GeometryTypeEnum.LINE_STRING) ? utilDisplayNameForPath : utilDisplayName
        const name = getName(entity.properties)
        const width = name && textWidth(name, fontSize)
        let p = null
        if (geometry === GeometryTypeEnum.POINT) {
          const renderAs = renderNodeAs[entity.wid]
          p = getPointLabel(entity, width, fontSize, renderAs)
        }
        else if (geometry === GeometryTypeEnum.LINE_STRING) {
          p = getLineLabel(entity, width, fontSize)
        }
        else if (geometry === GeometryTypeEnum.POLYGON) {
          p = getAreaLabel(entity, width, fontSize)
        }

        if (p) {
          p.classes = `${geometry} tag-${labelStack[k][1]}`
          positions[geometry].push(p)
          labelled[geometry].push(entity)
        }
      }
    }

    function getPointLabel(entity: any, width: number, height: number, geometry: string): any {
      const y = (geometry === GeometryTypeEnum.POINT ? -12 : 0)
      const pointOffsets: any = {
        ltr: [15, y, 'start'],
        rtl: [-15, y, 'end'],
      }

      const coord = map.latLngToLayerPoint(L.latLng(
        entity.geometry.coordinates[1],
        entity.geometry.coordinates[0],
      ))

      const textPadding = 2
      const offset = pointOffsets.ltr
      const p = {
        height,
        width,
        x: coord.x + offset[0],
        y: coord.y + offset[1],
        textAnchor: offset[2],
      }

      // insert a collision box for the text label..
      const bbox = {
        minX: p.x - textPadding,
        minY: p.y - (height / 2) - textPadding,
        maxX: p.x + width + textPadding,
        maxY: p.y + (height / 2) + textPadding,
      }

      if (tryInsert([bbox], entity.wid, true))
        return p
    }

    function getAreaLabel(entity: any, width: number, height: number) {
      const centroid = path.centroid(entity)
      const area = L.GeoJSON.geometryToLayer(entity)
      const { _northEast, _southWest } = area.getBounds()
      const northEastXY = map.latLngToLayerPoint(_northEast)
      const southWestXY = map.latLngToLayerPoint(_southWest)
      const areaWidth = northEastXY.x - southWestXY.x
      if (Number.isNaN(centroid[0]) || areaWidth < 20)
        return
      const iconSize = 17
      const padding = 2
      const p: any = {}

      if (addLabel(0))
        return p

      function addIcon() {
        const iconX = centroid[0] - (iconSize / 2)
        const iconY = centroid[1] - (iconSize / 2)
        const bbox = {
          minX: iconX,
          minY: iconY,
          maxX: iconX + iconSize,
          maxY: iconY + iconSize,
        }

        if (tryInsert([bbox], `${entity.id}I`, true)) {
          p.transform = `translate(${iconX},${iconY})`
          return true
        }
        return false
      }

      function addLabel(yOffset: number) {
        if (width && areaWidth >= width + 20) {
          const labelX = centroid[0]
          const labelY = centroid[1] + yOffset
          const bbox = {
            minX: labelX - (width / 2) - padding,
            minY: labelY - (height / 2) - padding,
            maxX: labelX + (width / 2) + padding,
            maxY: labelY + (height / 2) + padding,
          }

          if (tryInsert([bbox], entity.id, true)) {
            p.x = labelX
            p.y = labelY
            p.textAnchor = 'middle'
            p.height = height
            return true
          }
        }
        return false
      }
    }

    function getLineLabel(entity: any, width: number, height: number) {
      const viewport = [
        [clipExtent[0][0], clipExtent[0][1]],
        [clipExtent[0][0], clipExtent[1][1]],
        [clipExtent[1][0], clipExtent[1][1]],
        [clipExtent[1][0], clipExtent[0][1]],
        [clipExtent[0][0], clipExtent[0][1]],
      ]
      const points = entity.geometry.coordinates.map((e: Array<number>) => {
        const { x, y } = map.latLngToLayerPoint(L.latLng(e[1], e[0]))
        return [x, y]
      })
      const length = geoPathLength(points)

      if (length < width + 20)
        return

      // % along the line to attempt to place the label
      const lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70,
        25, 75, 20, 80, 15, 95, 10, 90, 5, 95]
      const padding = 3

      for (let i = 0; i < lineOffsets.length; i++) {
        const offset = lineOffsets[i]
        const middle = offset / 100 * length
        const start = middle - width / 2

        if (start < 0 || start + width > length)
          continue

        let sub = subpath(points, start, start + width)
        if (!sub || !geoPolygonIntersectsPolygon(viewport, sub, true))
          continue

        if (reverse(sub))
          sub = sub.reverse()

        const bboxes = []
        const boxsize = (height + 2) / 2

        for (let j = 0; j < sub.length - 1; j++) {
          const a = sub[j]
          const b = sub[j + 1]
          // split up the text into small collision boxes
          const num = Math.max(1, Math.floor(geoVecLength(a, b) / boxsize / 2))

          for (let box = 0; box < num; box++) {
            const p = geoVecInterp(a, b, box / num)
            const x0 = p[0] - boxsize - padding
            const y0 = p[1] - boxsize - padding
            const x1 = p[0] + boxsize + padding
            const y1 = p[1] + boxsize + padding

            bboxes.push({
              minX: Math.min(x0, x1),
              minY: Math.min(y0, y1),
              maxX: Math.max(x0, x1),
              maxY: Math.max(y0, y1),
            })
          }
        }

        if (tryInsert(bboxes, entity.wid, false)) { // accept this one
          return {
            'font-size': height + 2,
            'lineString': lineString(sub),
            'startOffset': `${offset}%`,
          }
        }
      }

      function reverse(p: Array<any>): boolean {
        const angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0])
        return !(p[0][0] < p[p.length - 1][0] && angle < Math.PI / 2 && angle > -Math.PI / 2)
      }

      function lineString(points: Array<any>) {
        return `M${points.join('L')}`
      }

      function subpath(points: Array<any>, from: number, to: number) {
        let sofar = 0
        let start, end, i0, i1

        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i]
          const b = points[i + 1]
          const current = geoVecLength(a, b)
          let portion
          if (!start && sofar + current >= from) {
            portion = (from - sofar) / current
            start = [
              a[0] + portion * (b[0] - a[0]),
              a[1] + portion * (b[1] - a[1]),
            ]
            i0 = i + 1
          }
          if (!end && sofar + current >= to) {
            portion = (to - sofar) / current
            end = [
              a[0] + portion * (b[0] - a[0]),
              a[1] + portion * (b[1] - a[1]),
            ]
            i1 = i + 1
          }
          sofar += current
        }

        const result = points.slice(i0, i1)
        result.unshift(start)
        result.push(end)
        return result
      }
    }

    // force insert a singular bounding box
    // singular box only, no array, id better be unique
    function doInsert(bbox: any, id: string) {
      bbox.id = id

      const oldbox = _entitybboxes[id]
      if (oldbox)
        _rdrawn.remove(oldbox)

      _entitybboxes[id] = bbox
      _rdrawn.insert(bbox)
    }

    function tryInsert(bboxes: Array<any>, id: string, saveSkipped: boolean) {
      let skipped = false

      for (let i = 0; i < bboxes.length; i++) {
        const bbox = bboxes[i]
        bbox.id = id

        if (_rdrawn.collides(bbox)) {
          skipped = true
          break
        }
      }

      _entitybboxes[id] = bboxes

      if (skipped) {
        if (saveSkipped)
          _rskipped.load(bboxes)
      }
      else {
        _rdrawn.load(bboxes)
      }

      return !skipped
    }

    const layer = selection.selectAll('.labels')
    layer.selectAll('.labels-group')
      .data(['halo', 'label'])
      .enter()
      .append('g')
      .attr('class', (d: string) => { return `labels-group ${d}` })

    const halo = layer.selectAll('.labels-group.halo')
    const label = layer.selectAll('.labels-group.label')

    // points
    drawPointLabels(label, labelled.Point, 'pointlabel', positions.Point)
    drawPointLabels(halo, labelled.Point, 'pointlabel', positions.Point)

    // lines
    drawLinePaths(layer, labelled.LineString, '', positions.LineString)
    drawLineLabels(label, labelled.LineString, 'linelabel', positions.LineString)
    drawLineLabels(halo, labelled.LineString, 'linelabel-halo', positions.LineString)

    // areas
    drawAreaLabels(label, labelled.Polygon, 'arealabel', positions.Polygon)
    drawAreaLabels(halo, labelled.Polygon, 'arealabel-halo', positions.Polygon)
  }

  return drawLabels
}
