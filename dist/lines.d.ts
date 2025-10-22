import { Map, LeafletMouseEvent } from "leaflet";
import { Feature, FeatureCollection, LineString, MultiLineString } from "geojson";
import { BaseGlLayer } from "./base-gl-layer";
import { IBaseGlLayerSettings } from "./types-base";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";
import { LineFeatureVertices } from "./line-feature-vertices";
export type WeightCallback = (i: number, feature: any) => number;
export interface ILinesSettings extends IBaseGlLayerSettings {
    data: FeatureCollection<LineString | MultiLineString>;
    weight: WeightCallback | number;
    sensitivity?: number;
    sensitivityHover?: number;
    eachVertex?: (vertices: LineFeatureVertices) => void;
}
export declare class Lines extends BaseGlLayer<ILinesSettings> {
    static defaults: Partial<ILinesSettings>;
    scale: number;
    bytes: number;
    allVertices: number[];
    allVerticesTyped: Float32Array;
    vertices: LineFeatureVertices[];
    aPointSize: number;
    settings: Partial<ILinesSettings>;
    get weight(): WeightCallback | number;
    constructor(settings: Partial<ILinesSettings>);
    render(): this;
    resetVertices(): this;
    removeInstance(): this;
    drawOnCanvas(e: ICanvasOverlayDrawEvent): this;
    static tryClick(e: LeafletMouseEvent, map: Map, instances: Lines[]): boolean | undefined;
    static tryContextMenu(e: LeafletMouseEvent, map: Map, instances: Lines[]): boolean | undefined;
    hoveringFeatures: Array<Feature<LineString | MultiLineString>>;
    static tryHover(e: LeafletMouseEvent, map: Map, instances: Lines[]): Array<boolean | undefined>;
}
//# sourceMappingURL=lines.d.ts.map