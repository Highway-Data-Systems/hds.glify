import { Feature, Point as GeoPoint } from "geojson";
import { BaseGlLayer } from "./base-gl-layer";
import { IPointsSettings, IPointVertex, ICanvasOverlayDrawEvent } from "./types-base";
import { LeafletMouseEvent, Map, LatLng } from "leaflet";
export declare class Points extends BaseGlLayer<IPointsSettings> {
    static defaults: Partial<IPointsSettings>;
    static maps: never[];
    bytes: number;
    latLngLookup: {
        [key: string]: IPointVertex[];
    };
    allLatLngLookup: IPointVertex[];
    vertices: number[];
    typedVertices: Float32Array;
    dataFormat: "Array" | "GeoJson.FeatureCollection";
    settings: Partial<IPointsSettings>;
    active: boolean;
    get size(): ((i: number, latLng: LatLng | null) => number) | number | null;
    constructor(settings: Partial<IPointsSettings>);
    render(): this;
    getPointLookup(key: string): IPointVertex[];
    addLookup(lookup: IPointVertex): this;
    resetVertices(): this;
    removeInstance(): this;
    pointSize(pointIndex: number): number;
    drawOnCanvas(e: ICanvasOverlayDrawEvent): this;
    lookup(coords: LatLng): IPointVertex | null;
    static closest(targetLocation: LatLng, points: IPointVertex[], map: Map): IPointVertex | null;
    static tryClick(e: LeafletMouseEvent, map: Map, instances: Points[]): boolean | undefined;
    static tryContextMenu(e: LeafletMouseEvent, map: Map, instances: Points[]): boolean | undefined;
    hoveringFeatures: Array<Feature<GeoPoint>>;
    static tryHover(e: LeafletMouseEvent, map: Map, instances: Points[]): Array<boolean | undefined>;
}
//# sourceMappingURL=points.d.ts.map