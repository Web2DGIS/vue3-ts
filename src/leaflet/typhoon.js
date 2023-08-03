(function () {
  L.Typhoon = L.Polygon.extend({
    initialize(t, e, i) {
      L.Polygon.prototype.initialize.call(this, e), this._latlng = L.latLng(t), this._circle = e, this._style = i
    },
    options: { fill: !0 },
    projectLatlngs() {
      try {
        const e = this._latlng
        this._point = this._map.latLngToLayerPoint(e)
        const t_northeast = this._getLngRadius(this._getLatRadius(this._circle.ne * 1000))
        const i_northeast = this._map.latLngToLayerPoint([e.lat, e.lng - t_northeast])
        this._radius_northeast = Math.max(this._point.x - i_northeast.x, 1)
        const t_southeast = this._getLngRadius(this._getLatRadius(this._circle.se * 1000))
        const i_southeast = this._map.latLngToLayerPoint([e.lat, e.lng - t_southeast])
        this._radius_southeast = Math.max(this._point.x - i_southeast.x, 1)
        const t_southwest = this._getLngRadius(this._getLatRadius(this._circle.sw * 1000))
        const i_southwest = this._map.latLngToLayerPoint([e.lat, e.lng - t_southwest])
        this._radius_southwest = Math.max(this._point.x - i_southwest.x, 1)
        const t_northwest = this._getLngRadius(this._getLatRadius(this._circle.nw * 1000))
        const i_northwest = this._map.latLngToLayerPoint([e.lat, e.lng - t_northwest])
        this._radius_northwest = Math.max(this._point.x - i_northwest.x, 1)
      }
      catch (e) {
        this._radius_northeast = null
        this._radius_southeast = null
        this._radius_southwest = null
        this._radius_northwest = null
      }
    },
    getTyphoonPath() {
      if (this._radius_northeast && this._radius_southeast && this._radius_southwest && this._radius_northwest) {
        const t = this._point
        const e_northeast = this._radius_northeast
        let path_svg = `M${t.x},${t.y - e_northeast}`
        let path_vml = `M${t.x},${t.y - e_northeast}`
        path_svg += `A${e_northeast},${e_northeast},0,0,1,${t.x + e_northeast},${t.y}`
        path_vml += ` ae ${t.x},${t.y} ${e_northeast},${e_northeast} ${65535 * 450},${-5898150}`
        const e_southeast = this._radius_southeast
        path_svg += `L${t.x + e_southeast},${t.y}`
        path_svg += `A${e_southeast},${e_southeast},0,0,1,${t.x},${t.y + e_southeast}`
        path_vml += ` ae ${t.x},${t.y} ${e_southeast},${e_southeast} ${65535 * 360},${-5898150}`
        const e_southwest = this._radius_southwest
        path_svg += `L${t.x},${t.y + e_southwest}`
        path_svg += `A${e_southwest},${e_southwest},0,0,1,${t.x - e_southwest},${t.y}`
        path_vml += ` ae ${t.x},${t.y} ${e_southwest},${e_southwest} ${65535 * 270},${-5898150}`
        const e_northwest = this._radius_northwest
        path_svg += `L${t.x - e_northwest},${t.y}`
        path_svg += `A${e_northwest},${e_northwest},0,0,1,${t.x},${t.y - e_northwest}z`
        path_vml += ` ae ${t.x},${t.y} ${e_northwest},${e_northwest} ${65535 * 180},${-5898150}X`
        this.svgPath = L.Browser.svg ? path_svg : path_vml
        return L.Browser.svg ? path_svg : path_vml
      }
      return ''
    },
    beforeAdd(map) {
      this._renderer = map.getRenderer(this)
    },
    onAdd(map) {
      this.projectLatlngs()
      this.getTyphoonPath()
      this._renderer._initPath(this)
      this._reset()
      this._path.setAttribute('d', this.svgPath)
      this._renderer._addPath(this)
      this._setStyle(this._style)
    },

    _setStyle(style) {
      L.setOptions(this, style)
      if (this._renderer)
        this._renderer._updateStyle(this)

      return this
    },
    _getLatRadius(r) {
      return r / 40075017 * 360
    },
    _getLngRadius(lr) {
      return lr / Math.cos(Math.PI / 180 * this._latlng.lat)
    },
  })

  L.typhoon = function (t, e, i) {
    return new L.Typhoon(t, e, i)
  }
})()
