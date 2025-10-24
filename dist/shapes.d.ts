import PolygonLookup from "polygon-lookup";
import { LeafletMouseEvent, Map } from "leaflet";
import { Feature, FeatureCollection, GeoJsonProperties, MultiPolygon, Polygon } from "geojson";
import { BaseGlLayer } from "./base-gl-layer";
import { IBaseGlLayerSettings } from "./types-base";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";
export interface IShapesSettings extends IBaseGlLayerSettings {
    border?: boolean;
    borderOpacity?: number;
    data: Feature | FeatureCollection | MultiPolygon;
}
export declare const defaults: Partial<IShapesSettings>;
export declare class Shapes extends BaseGlLayer {
    static defaults: Partial<IShapesSettings>;
    static maps: Map[];
    settings: Partial<IShapesSettings>;
    bytes: number;
    polygonLookup: PolygonLookup | null;
    get centerProjectedPixels(): import("leaflet").Point;
    get border(): boolean;
    get borderOpacity(): number;
    constructor(settings: Partial<IShapesSettings>);
    render(): this;
    resetVertices(): this;
    removeInstance(): this;
    drawOnCanvas(e: ICanvasOverlayDrawEvent): this;
    static tryClick(e: LeafletMouseEvent, map: Map, instances: Shapes[]): boolean | undefined;
    static tryContextMenu(e: LeafletMouseEvent, map: Map, instances: Shapes[]): boolean | undefined;
    hoveringFeatures: Array<Feature<Polygon, GeoJsonProperties> | Feature<MultiPolygon, GeoJsonProperties>>;
    static tryHover(e: LeafletMouseEvent, map: Map, instances: Shapes[]): Array<boolean | undefined>;
}
//# sourceMappingURL=shapes.d.ts.map