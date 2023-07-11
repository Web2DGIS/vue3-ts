export function geoVecLength(a: Array<number>, b: Array<number>): number {
  return Math.sqrt(geoVecLengthSquare(a, b))
}

export function geoVecLengthSquare(a: Array<number>, b: Array<number>): number {
  b = b || [0, 0]
  const x = a[0] - b[0]
  const y = a[1] - b[1]
  return (x * x) + (y * y)
}

// Return the counterclockwise angle in the range (-pi, pi)
// between the positive X axis and the line intersecting a and b.
export function geoVecAngle(a: Array<number>, b: Array<number>): number {
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}

// vector addition
export function geoVecAdd(a: Array<number>, b: Array<number>): Array<number> {
  return [a[0] + b[0], a[1] + b[1]]
}

// vector subtraction
export function geoVecSubtract(a: Array<number>, b: Array<number>) {
  return [a[0] - b[0], a[1] - b[1]]
}

// 2D cross product of OA and OB vectors, returns magnitude of Z vector
// Returns a positive value, if OAB makes a counter-clockwise turn,
// negative for clockwise turn, and zero if the points are collinear.
export function geoVecCross(a: Array<number>, b: Array<number>, origin?: Array<number>) {
  origin = origin || [0, 0]
  const p = geoVecSubtract(a, origin)
  const q = geoVecSubtract(b, origin)
  return (p[0]) * (q[1]) - (p[1]) * (q[0])
}

// linear interpolation
export function geoVecInterp(a: Array<number>, b: Array<number>, t: number) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ]
}
