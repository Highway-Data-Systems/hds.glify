import { IPointsSettings, ILinesSettings, IShapesSettings } from './types-base';
import { Points } from './points';
import { Lines } from './lines';
import { Shapes } from './shapes';
export interface IGlify {
    longitudeKey: number;
    latitudeKey: number;
    clickSetupMaps: any[];
    contextMenuSetupMaps: any[];
    hoverSetupMaps: any[];
    shader: any;
    Points: typeof Points;
    Shapes: typeof Shapes;
    Lines: typeof Lines;
    pointsInstances: Points[];
    shapesInstances: Shapes[];
    linesInstances: Lines[];
    longitudeFirst(): this;
    latitudeFirst(): this;
    readonly instances: (Points | Lines | Shapes)[];
    points(settings: Partial<IPointsSettings>): Points;
    lines(settings: Partial<ILinesSettings>): Lines;
    shapes(settings: Partial<IShapesSettings>): Shapes;
    setupClick(map: any): void;
    setupContextMenu(map: any): void;
    setupHover(map: any, hoverWait?: number, immediate?: false): void;
    getCoordinateOrder(): any;
    setCoordinateOrder(order: any): this;
}
export type GlifyInstance = Points | Lines | Shapes;
//# sourceMappingURL=types-glify.d.ts.map