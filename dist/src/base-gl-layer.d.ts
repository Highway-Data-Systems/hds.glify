import { LeafletMouseEvent, Map } from "leaflet";
import { IColor, IBaseGlLayerSettings, IShaderVariable, ColorCallback } from "./types-base";
import { IPixel } from "./pixel";
import { CanvasOverlay, ICanvasOverlayDrawEvent } from "./canvas-overlay";
import { MapMatrix } from "./map-matrix";
export declare const defaultPane = "overlayPane";
export declare const defaultHoverWait = 250;
export declare const defaults: Partial<IBaseGlLayerSettings>;
export declare abstract class BaseGlLayer<T extends IBaseGlLayerSettings = IBaseGlLayerSettings> {
    bytes: number;
    active: boolean;
    fragmentShader: any;
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    layer: CanvasOverlay;
    mapMatrix: MapMatrix;
    matrix: WebGLUniformLocation | null;
    program: WebGLProgram | null;
    settings: Partial<IBaseGlLayerSettings>;
    vertexShader: WebGLShader | null;
    vertices: any;
    vertexLines: any;
    private _mapCenterPixels?;
    buffers: {
        [name: string]: WebGLBuffer;
    };
    attributeLocations: {
        [name: string]: number;
    };
    uniformLocations: {
        [name: string]: WebGLUniformLocation;
    };
    static defaults: Partial<IBaseGlLayerSettings>;
    abstract render(): this;
    abstract removeInstance(this: any): this;
    get mapCenterPixels(): IPixel;
    get data(): any;
    get pane(): string;
    get hoverWait(): number;
    get sensitivity(): number;
    get sensitivityHover(): number;
    get color(): ColorCallback | IColor | string | number[] | null;
    get opacity(): number;
    get className(): string;
    get preserveDrawingBuffer(): boolean;
    get vertexShaderSource(): (() => string) | string;
    get fragmentShaderSource(): (() => string) | string;
    get shaderVariables(): {
        [name: string]: IShaderVariable;
    };
    get map(): Map;
    get longitudeKey(): number;
    get latitudeKey(): number;
    constructor(settings: Partial<IBaseGlLayerSettings>);
    abstract drawOnCanvas(context: ICanvasOverlayDrawEvent): this;
    attachShaderVariables(byteCount: number): this;
    getShaderVariableCount(): number;
    setData(data: any): this;
    setup(): this;
    setupVertexShader(): this;
    setupFragmentShader(): this;
    setupProgram(): this;
    addTo(map?: Map): this;
    remove(indices?: number | number[]): this;
    insert(features: any | any[], index: number): this;
    update(feature: any | any[], index: number): this;
    getBuffer(name: string): WebGLBuffer;
    getAttributeLocation(name: string): number;
    getUniformLocation(name: string): WebGLUniformLocation;
    click(e: LeafletMouseEvent, feature: any): boolean | undefined;
    contextMenu(e: LeafletMouseEvent, feature: any): boolean | undefined;
    hover(e: LeafletMouseEvent, feature: any): boolean | undefined;
    hoverOff(e: LeafletMouseEvent, feature: any): void;
}
//# sourceMappingURL=base-gl-layer.d.ts.map