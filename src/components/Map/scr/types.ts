export interface GeoJSON {
  v?: any
  id: string
  wid: string
  type: string
  geometry: Geometry
  properties: Properties | any
}

export interface Geometry {
  type: string
  coordinates: Array<Array<number>>
}

export interface Properties {
  id: string
  uid: string
  name: string
  user: string
  type: string
  version: string
  landuse: string
  'name:zh': string
  timestamp: string
}

export interface Content {
  map: {
    getZoom: () => {}
    latLngToLayerPoint: (latLng: any) => {}
  }
  JSON?: any
}

export interface Point {
  x: number
  y: number
}

export interface LatLng {
  lat: number
  lng: number
}

export interface Bounds {
  max: Point
  min: Point
}
