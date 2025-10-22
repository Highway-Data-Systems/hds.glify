import { Map } from "leaflet";
import { Lines } from "./lines";
import { Points } from "./points";
import { Shapes } from "./shapes";
import { IPointsSettings, ILinesSettings, IShapesSettings } from "./types";
export * from "./types";
export declare class Glify {
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
    longitudeKey: number;
    latitudeKey: number;
    clickSetupMaps: Map[];
    contextMenuSetupMaps: Map[];
    hoverSetupMaps: Map[];
    shader: {
        vertex: string;
        fragment: {
            dot: string;
            point: string;
            puck: string;
            simpleCircle: string;
            square: string;
            polygon: string;
        };
    };
    Points: typeof Points;
    Shapes: typeof Shapes;
    Lines: typeof Lines;
    pointsInstances: Points[];
    shapesInstances: Shapes[];
    linesInstances: Lines[];
    /**
     * Set coordinate order to [longitude, latitude] - WGS84/GeoJSON standard
     * This is the default and recommended format
     */
    longitudeFirst(): this;
    /**
     * Set coordinate order to [latitude, longitude] - Legacy format
     * Use only for data that doesn't follow WGS84/GeoJSON standards
     */
    latitudeFirst(): this;
    getCoordinateOrder(): "latFirst" | "lngFirst";
    /**
     * Set coordinate order for data parsing
     * @param order - "lngFirst" for WGS84/GeoJSON standard [longitude, latitude]
     *                "latFirst" for legacy format [latitude, longitude]
     */
    setCoordinateOrder(order: "latFirst" | "lngFirst"): this;
    get instances(): Array<Points | Lines | Shapes>;
    points(settings: Partial<IPointsSettings>): Points;
    lines(settings: Partial<ILinesSettings>): Lines;
    shapes(settings: Partial<IShapesSettings>): Shapes;
    setupClick(map: Map): void;
    setupContextMenu(map: Map): void;
    setupHover(map: Map, hoverWait?: number, immediate?: false): void;
}
export declare const glify: Glify;
export default glify;
export { Points } from "./points";
export { Lines } from "./lines";
export { Shapes } from "./shapes";
export { LineFeatureVertices } from "./line-feature-vertices";
export { CanvasOverlay } from "./canvas-overlay";
export { BaseGlLayer } from "./base-gl-layer";
export { MapMatrix } from "./map-matrix";
export { latLonToPixel, pixelInCircle, locationDistance, debounce } from "./utils";
//# sourceMappingURL=index.d.ts.map