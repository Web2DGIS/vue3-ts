import { geoVecCross, geoVecInterp, geoVecLength, geoVecSubtract } from './vector'

export function geoPathLength(path: Array<any>): number {
  let length = 0
  for (let i = 0; i < path.length - 1; i++)
    length += geoVecLength(path[i], path[i + 1])

  return length
}

export function geoPolygonIntersectsPolygon(outer: Array<Array<any>>, inner: Array<any>, checkSegments: boolean): boolean {
  function testPoints(outer: Array<any>, inner: Array<any>) {
    return inner.some((point) => {
      return geoPointInPolygon(point, outer)
    })
  }
  return testPoints(outer, inner) || (!!checkSegments && geoPathHasIntersections(outer, inner))
}

// Return the intersection point of 2 line segments.
// From https://github.com/pgkelley4/line-segments-intersect
// This uses the vector cross product approach described below:
//  http://stackoverflow.com/a/565282/786339
export function geoLineIntersection(a: Array<any>, b: Array<any>) {
  const p = [a[0][0], a[0][1]]
  const p2 = [a[1][0], a[1][1]]
  const q = [b[0][0], b[0][1]]
  const q2 = [b[1][0], b[1][1]]
  const r = geoVecSubtract(p2, p)
  const s = geoVecSubtract(q2, q)
  const uNumerator = geoVecCross(geoVecSubtract(q, p), r)
  const denominator = geoVecCross(r, s)

  if (uNumerator && denominator) {
    const u = uNumerator / denominator
    const t = geoVecCross(geoVecSubtract(q, p), s) / denominator

    if ((t >= 0) && (t <= 1) && (u >= 0) && (u <= 1))
      return geoVecInterp(p, p2, t)
  }

  return null
}

export function geoPathHasIntersections(path1: Array<any>, path2: Array<any>): boolean {
  for (let i = 0; i < path1.length - 1; i++) {
    for (let j = 0; j < path2.length - 1; j++) {
      const a = [path1[i], path1[i + 1]]
      const b = [path2[j], path2[j + 1]]
      const hit = geoLineIntersection(a, b)
      if (hit)
        return true
    }
  }
  return false
}

// Return whether point is contained in polygon.
//
// `point` should be a 2-item array of coordinates.
// `polygon` should be an array of 2-item arrays of coordinates.
//
// From https://github.com/substack/point-in-polygon.
// ray-casting algorithm based on
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
//
export function geoPointInPolygon(point: Array<number>, polygon: Array<any>): boolean {
  const x = point[0]
  const y = point[1]
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect)
      inside = !inside
  }

  return inside
}
