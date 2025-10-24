import { LatLngBounds, Point, Layer, Bounds, LatLng, ZoomAnimEvent, Map, ResizeEvent, LayerOptions } from "leaflet";
export interface ICanvasOverlayDrawEvent {
    canvas: HTMLCanvasElement;
    bounds: LatLngBounds;
    offset: Point;
    scale: number;
    size: Point;
    zoomScale: number;
    zoom: number;
}
export type IUserDrawFunc = (event: ICanvasOverlayDrawEvent) => void;
export type RedrawCallback = (instance: CanvasOverlay) => void;
export declare class CanvasOverlay extends Layer {
    _userDrawFunc: IUserDrawFunc;
    _redrawCallbacks: RedrawCallback[];
    canvas?: HTMLCanvasElement;
    _pane: string;
    _frame?: number | null;
    _leaflet_id?: number;
    options: LayerOptions;
    get map(): Map;
    set map(map: Map);
    constructor(userDrawFunc: IUserDrawFunc, pane: string);
    drawing(userDrawFunc: IUserDrawFunc): this;
    params(options: any): this;
    redraw(callback?: RedrawCallback): this;
    isAnimated(): boolean;
    onAdd(map: Map): this;
    onRemove(map: Map): this;
    addTo(map: Map): this;
    _resize(resizeEvent: ResizeEvent): void;
    _reset(): void;
    _redraw(): void;
    _animateZoom(e: ZoomAnimEvent): void;
    _animateZoomNoLayer(e: ZoomAnimEvent): void;
    _unclampedProject(latlng: LatLng, zoom: number): Point;
    _unclampedLatLngBoundsToNewLayerBounds(latLngBounds: LatLngBounds, zoom: number, center: LatLng): Bounds;
}
//# sourceMappingURL=canvas-overlay.d.ts.map