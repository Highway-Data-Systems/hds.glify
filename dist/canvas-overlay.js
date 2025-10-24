/*
originally taken from: http://www.sumbera.com/gist/js/leaflet/canvas/L.CanvasOverlay.js, added and customized as part of this lib because of need from library
 Generic  Canvas Overlay for leaflet,
 Stanislav Sumbera, April , 2014

 - added userDrawFunc that is called when Canvas need to be redrawn
 - added few useful params fro userDrawFunc callback
 - fixed resize map bug
 inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat
 */
import { Point, Layer, Util, Browser, Bounds, DomUtil, LatLng, } from "leaflet";
export class CanvasOverlay extends Layer {
    get map() {
        return this._map;
    }
    set map(map) {
        this._map = map;
    }
    constructor(userDrawFunc, pane) {
        super();
        this._userDrawFunc = userDrawFunc;
        this._frame = null;
        this._redrawCallbacks = [];
        this._pane = pane;
        this.options = {};
    }
    drawing(userDrawFunc) {
        this._userDrawFunc = userDrawFunc;
        return this;
    }
    params(options) {
        Util.setOptions(this, options);
        return this;
    }
    redraw(callback) {
        if (typeof callback === "function") {
            this._redrawCallbacks.push(callback);
        }
        if (this._frame === null) {
            this._frame = Util.requestAnimFrame(this._redraw, this);
        }
        return this;
    }
    isAnimated() {
        return Boolean(this.map.options.zoomAnimation && Browser.any3d);
    }
    onAdd(map) {
        var _a;
        this.map = map;
        const canvas = (this.canvas =
            (_a = this.canvas) !== null && _a !== void 0 ? _a : document.createElement("canvas"));
        const size = map.getSize();
        const animated = this.isAnimated();
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.className = `leaflet-zoom-${animated ? "animated" : "hide"}`;
        const pane = map.getPane(this._pane);
        if (!pane) {
            throw new Error("unable to find pane");
        }
        pane.appendChild(this.canvas);
        //FIXME: glify.shapes disappear on zoom, show up again on moveend...?
        // when "leaflet-smooth-zoom" package is used, works fine and actually improves UX
        // see https://github.com/robertleeplummerjr/Leaflet.glify/issues/132 for more info
        // map.on("zoom", this._reset, this);
        map.on("moveend", this._reset, this);
        map.on("resize", this._resize, this);
        if (animated) {
            map.on("zoomanim", Layer ? this._animateZoom : this._animateZoomNoLayer, this);
        }
        this._reset();
        return this;
    }
    onRemove(map) {
        if (this.canvas) {
            const pane = map.getPane(this._pane);
            if (!pane) {
                throw new Error("unable to find pane");
            }
            pane.removeChild(this.canvas);
        }
        //FIXME: map.off("zoom", this._reset, this);
        map.off("moveend", this._reset, this);
        map.off("resize", this._resize, this);
        if (this.isAnimated()) {
            map.off("zoomanim", Layer ? this._animateZoom : this._animateZoomNoLayer, this);
        }
        return this;
    }
    addTo(map) {
        if (!this.canvas) {
            //Resolves an issue where the canvas is not added to the map, discovered in a jsdom testing environment
            this.canvas = document.createElement("canvas");
        }
        map.addLayer(this);
        return this;
    }
    _resize(resizeEvent) {
        if (this.canvas) {
            this.canvas.width = resizeEvent.newSize.x;
            this.canvas.height = resizeEvent.newSize.y;
        }
    }
    _reset() {
        if (this.canvas) {
            const topLeft = this.map.containerPointToLayerPoint([0, 0]);
            DomUtil.setPosition(this.canvas, topLeft);
        }
        this._redraw();
    }
    _redraw() {
        const { map, canvas } = this;
        if (map) {
            const size = map.getSize();
            const bounds = map.getBounds();
            const zoomScale = (size.x * 180) / (20037508.34 * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
            const zoom = map.getZoom();
            const topLeft = new LatLng(bounds.getNorth(), bounds.getWest());
            const offset = this._unclampedProject(topLeft, 0);
            if (canvas) {
                this._userDrawFunc({
                    bounds,
                    canvas,
                    offset,
                    scale: Math.pow(2, zoom),
                    size,
                    zoomScale,
                    zoom,
                });
            }
            while (this._redrawCallbacks.length > 0) {
                const callback = this._redrawCallbacks.shift();
                if (callback) {
                    callback(this);
                }
            }
        }
        this._frame = null;
    }
    _animateZoom(e) {
        const { map, canvas } = this;
        const scale = map.getZoomScale(e.zoom, map.getZoom());
        const offset = this._unclampedLatLngBoundsToNewLayerBounds(map.getBounds(), e.zoom, e.center).min;
        if (canvas && offset) {
            DomUtil.setTransform(canvas, offset, scale);
        }
    }
    _animateZoomNoLayer(e) {
        const { map, canvas } = this;
        if (canvas) {
            const scale = map.getZoomScale(e.zoom, map.getZoom());
            const offset = map
                // @ts-expect-error experimental
                ._getCenterOffset(e.center)
                ._multiplyBy(-scale)
                // @ts-expect-error  experimental
                .subtract(map._getMapPanePos());
            DomUtil.setTransform(canvas, offset, scale);
        }
    }
    _unclampedProject(latlng, zoom) {
        var _a;
        // imported partly from https://github.com/Leaflet/Leaflet/blob/1ae785b73092fdb4b97e30f8789345e9f7c7c912/src/geo/projection/Projection.SphericalMercator.js#L21
        // used because they clamp the latitude
        const { crs } = this.map.options;
        // @ts-expect-error experimental
        const { R } = crs.projection;
        const d = Math.PI / 180;
        const lat = latlng.lat;
        const sin = Math.sin(lat * d);
        const projectedPoint = new Point(R * latlng.lng * d, (R * Math.log((1 + sin) / (1 - sin))) / 2);
        const scale = (_a = crs === null || crs === void 0 ? void 0 : crs.scale(zoom)) !== null && _a !== void 0 ? _a : 0;
        // @ts-expect-error experimental
        return crs.transformation._transform(projectedPoint, scale);
    }
    _unclampedLatLngBoundsToNewLayerBounds(latLngBounds, zoom, center) {
        // imported party from https://github.com/Leaflet/Leaflet/blob/84bc05bbb6e4acc41e6f89ff7421dd7c6520d256/src/map/Map.js#L1500
        // used because it uses crs.projection.project, which clamp the latitude
        // @ts-expect-error experimental
        const topLeft = this.map._getNewPixelOrigin(center, zoom);
        return new Bounds([
            this._unclampedProject(latLngBounds.getSouthWest(), zoom).subtract(topLeft),
            this._unclampedProject(latLngBounds.getNorthWest(), zoom).subtract(topLeft),
            this._unclampedProject(latLngBounds.getSouthEast(), zoom).subtract(topLeft),
            this._unclampedProject(latLngBounds.getNorthEast(), zoom).subtract(topLeft),
        ]);
    }
}
