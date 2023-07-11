declare module 'leaflet'
declare module L {
  function latLng(x, y)
  function bounds(_northEast, _southWest)
  function geoJSON(geoJson, options)
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
