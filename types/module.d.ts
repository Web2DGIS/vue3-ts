declare module 'leaflet'
declare module L {
  function latLng(x, y)
  function bounds(_northEast, _southWest)
  function geoJSON(geoJson, options)
  const GeoJSON: {
    geometryToLayer
  } 
  function marker(latlng: any, options?: any)
  function divIcon(options?: any)
  function circle(latlng: any, options?: any)
  function polygon(latlngs: any, options?: any)
}
declare module 'd3*'
declare module '@turf*'
declare module 'rbush'
declare module 'lodash-es/throttle'

declare module 'virtual:*' {
  const result: any;
  export default result;
}

declare module 'uuid' {
  uuid4v()
}
