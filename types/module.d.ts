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
  function polyline(latlngs: any, options?: any)
  function featureGroup(layers?: Array<any>|null, options?: any)
  function geoJSON(layers?: Array<any>|null, options?: any)
  const PolyUtil: any
  const LineUtil: any
}

declare module 'virtual:*' {
  const result: any;
  export default result;
}
