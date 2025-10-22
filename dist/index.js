import { Lines } from "./lines";
import { Points } from "./points";
import { Shapes } from "./shapes";
import { debounce } from "./utils";
import vertex from "./shader/vertex/default.glsl";
import dot from "./shader/fragment/dot.glsl";
import point from "./shader/fragment/point.glsl";
import puck from "./shader/fragment/puck.glsl";
import simpleCircle from "./shader/fragment/simple-circle.glsl";
import square from "./shader/fragment/square.glsl";
import polygon from "./shader/fragment/polygon.glsl";
export * from "./types";
const shader = {
    vertex,
    fragment: {
        dot,
        point,
        puck,
        simpleCircle,
        square,
        polygon,
    },
};
export class Glify {
    constructor() {
        /**
         * Coordinate order follows the World Geodetic System (WGS84) standard
         * as defined by the National Geospatial-Intelligence Agency (NGA):
         * https://earth-info.nga.mil/php/download.php?file=coord-wgs84
         *
         * This standard is adopted by GeoJSON specification:
         * https://geojson.org/
         *
         * Coordinates are always [longitude, latitude] in WGS84/GeoJSON
         */
        this.longitudeKey = 0; // WGS84/GeoJSON standard: [longitude, latitude]
        this.latitudeKey = 1; // WGS84/GeoJSON standard: [longitude, latitude]
        this.clickSetupMaps = [];
        this.contextMenuSetupMaps = [];
        this.hoverSetupMaps = [];
        this.shader = shader;
        this.Points = Points;
        this.Shapes = Shapes;
        this.Lines = Lines;
        this.pointsInstances = [];
        this.shapesInstances = [];
        this.linesInstances = [];
    }
    /**
     * Set coordinate order to [longitude, latitude] - WGS84/GeoJSON standard
     * This is the default and recommended format
     */
    longitudeFirst() {
        this.longitudeKey = 0;
        this.latitudeKey = 1;
        return this;
    }
    /**
     * Set coordinate order to [latitude, longitude] - Legacy format
     * Use only for data that doesn't follow WGS84/GeoJSON standards
     */
    latitudeFirst() {
        this.latitudeKey = 0;
        this.longitudeKey = 1;
        return this;
    }
    getCoordinateOrder() {
        return this.longitudeKey === 0 ? "lngFirst" : "latFirst";
    }
    /**
     * Set coordinate order for data parsing
     * @param order - "lngFirst" for WGS84/GeoJSON standard [longitude, latitude]
     *                "latFirst" for legacy format [latitude, longitude]
     */
    setCoordinateOrder(order) {
        if (order === "lngFirst") {
            return this.longitudeFirst();
        }
        else {
            return this.latitudeFirst();
        }
    }
    get instances() {
        return [
            ...this.pointsInstances,
            ...this.linesInstances,
            ...this.shapesInstances,
        ];
    }
    points(settings) {
        const points = new this.Points({
            setupClick: this.setupClick.bind(this),
            setupContextMenu: this.setupContextMenu.bind(this),
            setupHover: this.setupHover.bind(this),
            latitudeKey: this.latitudeKey,
            longitudeKey: this.longitudeKey,
            vertexShaderSource: () => {
                return this.shader.vertex;
            },
            fragmentShaderSource: () => {
                return this.shader.fragment.point;
            },
            ...settings,
        });
        this.pointsInstances.push(points);
        return points;
    }
    lines(settings) {
        const lines = new this.Lines({
            setupClick: this.setupClick.bind(this),
            setupContextMenu: this.setupContextMenu.bind(this),
            setupHover: this.setupHover.bind(this),
            latitudeKey: this.latitudeKey,
            longitudeKey: this.longitudeKey,
            vertexShaderSource: () => {
                return this.shader.vertex;
            },
            fragmentShaderSource: () => {
                return this.shader.fragment.polygon;
            },
            ...settings,
        });
        this.linesInstances.push(lines);
        return lines;
    }
    shapes(settings) {
        const shapes = new this.Shapes({
            setupClick: this.setupClick.bind(this),
            setupContextMenu: this.setupContextMenu.bind(this),
            setupHover: this.setupHover.bind(this),
            latitudeKey: this.latitudeKey,
            longitudeKey: this.longitudeKey,
            vertexShaderSource: () => {
                return this.shader.vertex;
            },
            fragmentShaderSource: () => {
                return this.shader.fragment.polygon;
            },
            ...settings,
        });
        this.shapesInstances.push(shapes);
        return shapes;
    }
    setupClick(map) {
        if (this.clickSetupMaps.includes(map))
            return;
        this.clickSetupMaps.push(map);
        map.on("click", (e) => {
            let hit;
            hit = this.Points.tryClick(e, map, this.pointsInstances);
            if (hit !== undefined)
                return hit;
            hit = this.Lines.tryClick(e, map, this.linesInstances);
            if (hit !== undefined)
                return hit;
            hit = this.Shapes.tryClick(e, map, this.shapesInstances);
            if (hit !== undefined)
                return hit;
        });
    }
    setupContextMenu(map) {
        if (this.contextMenuSetupMaps.includes(map))
            return;
        this.contextMenuSetupMaps.push(map);
        map.on("contextmenu", (e) => {
            e.originalEvent.preventDefault(); // Prevent the default context menu from showing
            let hit;
            hit = this.Points.tryContextMenu(e, map, this.pointsInstances);
            if (hit !== undefined)
                return hit;
            hit = this.Lines.tryContextMenu(e, map, this.linesInstances);
            if (hit !== undefined)
                return hit;
            hit = this.Shapes.tryContextMenu(e, map, this.shapesInstances);
            if (hit !== undefined)
                return hit;
        });
    }
    setupHover(map, hoverWait, immediate) {
        if (this.hoverSetupMaps.includes(map))
            return;
        this.hoverSetupMaps.push(map);
        map.on("mousemove", debounce((e) => {
            this.Points.tryHover(e, map, this.pointsInstances);
            this.Lines.tryHover(e, map, this.linesInstances);
            this.Shapes.tryHover(e, map, this.shapesInstances);
        }, hoverWait !== null && hoverWait !== void 0 ? hoverWait : 0, immediate));
    }
}
export const glify = new Glify();
export default glify;
if (typeof window !== "undefined" && window.L) {
    // @ts-expect-error exporting it to window
    window.L.glify = glify;
    // @ts-expect-error exporting it to window
    window.L.Glify = Glify;
}
// Export runtime classes and functions
export { Points } from "./points";
export { Lines } from "./lines";
export { Shapes } from "./shapes";
export { LineFeatureVertices } from "./line-feature-vertices";
export { CanvasOverlay } from "./canvas-overlay";
export { BaseGlLayer } from "./base-gl-layer";
export { MapMatrix } from "./map-matrix";
export { latLonToPixel, pixelInCircle, locationDistance, debounce } from "./utils";
