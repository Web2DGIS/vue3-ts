export const tileLayers = [
  {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    url: 'https://api.mapbox.com/styles/v1/openstreetmap/ckasmteyi1tda1ipfis6wqhuq/tiles/256/{z}/{x}/{y}?access_token={access_token}',
    options: {
      access_token: 'pk.eyJ1IjoiaHlzZSIsImEiOiJjbGVwcWg0bDkwZXNlM3pvNXNleWUzcTQ0In0.S3VTf9vqYTAAF725ukcDjQ',
      key: 'Position Assist Overlay',
    },
  },
]

export const miniTileLayer = {
  url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token={access_token}',
  options: {
    access_token: 'pk.eyJ1IjoiaHlzZSIsImEiOiJjbGVwcWg0bDkwZXNlM3pvNXNleWUzcTQ0In0.S3VTf9vqYTAAF725ukcDjQ',
  },
}
