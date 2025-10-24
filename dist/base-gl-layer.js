import { CanvasOverlay } from "./canvas-overlay";
import { notProperlyDefined } from "./errors";
import { MapMatrix } from "./map-matrix";
export const defaultPane = "overlayPane";
export const defaultHoverWait = 250;
export const defaults = {
    pane: defaultPane,
};
export class BaseGlLayer {
    get mapCenterPixels() {
        if (!this._mapCenterPixels) {
            try {
                this._mapCenterPixels = this.map.project(this.map.getCenter(), 0);
            }
            catch (err) {
                this._mapCenterPixels = { x: -0, y: -0 };
            }
        }
        return this._mapCenterPixels;
    }
    get data() {
        if (!this.settings.data) {
            throw new Error(notProperlyDefined("settings.data"));
        }
        return this.settings.data;
    }
    get pane() {
        var _a;
        return (_a = this.settings.pane) !== null && _a !== void 0 ? _a : defaultPane;
    }
    get hoverWait() {
        var _a;
        return (_a = this.settings.hoverWait) !== null && _a !== void 0 ? _a : defaultHoverWait;
    }
    get sensitivity() {
        if (typeof this.settings.sensitivity !== "number") {
            throw new Error(notProperlyDefined("settings.sensitivity"));
        }
        return this.settings.sensitivity;
    }
    get sensitivityHover() {
        if (typeof this.settings.sensitivityHover !== "number") {
            throw new Error(notProperlyDefined("settings.sensitivityHover"));
        }
        return this.settings.sensitivityHover;
    }
    get color() {
        var _a;
        return (_a = this.settings.color) !== null && _a !== void 0 ? _a : null;
    }
    get opacity() {
        var _a;
        return (_a = this.settings.opacity) !== null && _a !== void 0 ? _a : 0.5;
    }
    get className() {
        var _a;
        return (_a = this.settings.className) !== null && _a !== void 0 ? _a : "";
    }
    get preserveDrawingBuffer() {
        var _a;
        return (_a = this.settings.preserveDrawingBuffer) !== null && _a !== void 0 ? _a : false;
    }
    get vertexShaderSource() {
        if (!this.settings.vertexShaderSource) {
            throw new Error(notProperlyDefined("settings.vertexShaderSource"));
        }
        return this.settings.vertexShaderSource;
    }
    get fragmentShaderSource() {
        if (!this.settings.fragmentShaderSource) {
            throw new Error(notProperlyDefined("settings.fragmentShaderSource"));
        }
        return this.settings.fragmentShaderSource;
    }
    get shaderVariables() {
        if (!this.settings.shaderVariables) {
            throw new Error(notProperlyDefined("settings.shaderVariables"));
        }
        return this.settings.shaderVariables;
    }
    get map() {
        if (!this.settings.map) {
            throw new Error(notProperlyDefined("settings.map"));
        }
        return this.settings.map;
    }
    get longitudeKey() {
        if (typeof this.settings.longitudeKey !== "number") {
            throw new Error(notProperlyDefined("settings.longitudeKey"));
        }
        return this.settings.longitudeKey;
    }
    get latitudeKey() {
        if (typeof this.settings.latitudeKey !== "number") {
            throw new Error(notProperlyDefined("settings.latitudeKey"));
        }
        return this.settings.latitudeKey;
    }
    constructor(settings) {
        var _a, _b;
        this.bytes = 0;
        this.buffers = {};
        this.attributeLocations = {};
        this.uniformLocations = {};
        this.settings = { ...BaseGlLayer.defaults, ...settings };
        this.active = true;
        this.vertexShader = null;
        this.fragmentShader = null;
        this.program = null;
        this.matrix = null;
        this.vertices = null;
        this.vertexLines = null;
        this.mapMatrix = new MapMatrix();
        const preserveDrawingBuffer = Boolean(settings.preserveDrawingBuffer);
        const layer = (this.layer = new CanvasOverlay((context) => {
            return this.drawOnCanvas(context);
        }, this.pane).addTo(this.map));
        if (!layer.canvas) {
            throw new Error(notProperlyDefined("layer.canvas"));
        }
        const canvas = (this.canvas = layer.canvas);
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        canvas.style.position = "absolute";
        if (this.className) {
            canvas.className += " " + this.className;
        }
        this.gl = ((_b = (_a = canvas.getContext("webgl2", { preserveDrawingBuffer })) !== null && _a !== void 0 ? _a : canvas.getContext("webgl", { preserveDrawingBuffer })) !== null && _b !== void 0 ? _b : canvas.getContext("experimental-webgl", {
            preserveDrawingBuffer,
        }));
        if (this.settings.setupClick) {
            this.settings.setupClick(this.map);
        }
        if (this.settings.setupContextMenu) {
            this.settings.setupContextMenu(this.map);
        }
        if (this.settings.setupHover) {
            this.settings.setupHover(this.map, this.hoverWait);
        }
    }
    attachShaderVariables(byteCount) {
        const variableCount = this.getShaderVariableCount();
        if (variableCount === 0) {
            return this;
        }
        const { gl, settings } = this;
        const { shaderVariables } = settings;
        let offset = 0;
        for (const name in shaderVariables) {
            if (!shaderVariables.hasOwnProperty(name))
                continue;
            const shaderVariable = shaderVariables[name];
            const loc = this.getAttributeLocation(name);
            if (loc < 0) {
                throw new Error("shader variable " + name + " not found");
            }
            gl.vertexAttribPointer(loc, shaderVariable.size, gl[shaderVariable.type], !!shaderVariable.normalize, this.bytes * byteCount, offset * byteCount);
            offset += shaderVariable.size;
            gl.enableVertexAttribArray(loc);
        }
        return this;
    }
    getShaderVariableCount() {
        var _a;
        return Object.keys((_a = this.settings.shaderVariables) !== null && _a !== void 0 ? _a : {}).length;
    }
    setData(data) {
        this.settings = { ...this.settings, data };
        return this.render();
    }
    setup() {
        const settings = this.settings;
        if (settings.click && settings.setupClick) {
            settings.setupClick(this.map);
        }
        if (settings.contextMenu && settings.setupContextMenu) {
            settings.setupContextMenu(this.map);
        }
        if (settings.hover && settings.setupHover) {
            settings.setupHover(this.map, this.hoverWait);
        }
        return this.setupVertexShader().setupFragmentShader().setupProgram();
    }
    setupVertexShader() {
        const { gl, settings } = this;
        const vertexShaderSource = typeof settings.vertexShaderSource === "function"
            ? settings.vertexShaderSource()
            : settings.vertexShaderSource;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) {
            throw new Error("Not able to create vertex");
        }
        if (!vertexShaderSource) {
            throw new Error(notProperlyDefined("settings.vertexShaderSource"));
        }
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        this.vertexShader = vertexShader;
        return this;
    }
    setupFragmentShader() {
        const gl = this.gl;
        const settings = this.settings;
        const fragmentShaderSource = typeof settings.fragmentShaderSource === "function"
            ? settings.fragmentShaderSource()
            : settings.fragmentShaderSource;
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) {
            throw new Error("Not able to create fragment");
        }
        if (!fragmentShaderSource) {
            throw new Error(notProperlyDefined("settings.fragmentShaderSource"));
        }
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        this.fragmentShader = fragmentShader;
        return this;
    }
    setupProgram() {
        // link shaders to create our program
        const { gl, vertexShader, fragmentShader } = this;
        const program = gl.createProgram();
        if (!program) {
            throw new Error("Not able to create program");
        }
        if (!vertexShader) {
            throw new Error(notProperlyDefined("this.vertexShader"));
        }
        if (!fragmentShader) {
            throw new Error(notProperlyDefined("this.fragmentShader"));
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        this.program = program;
        return this;
    }
    addTo(map) {
        this.layer.addTo(map !== null && map !== void 0 ? map : this.map);
        this.active = true;
        return this.render();
    }
    remove(indices) {
        if (indices === undefined) {
            this.removeInstance();
            this.map.removeLayer(this.layer);
            this.active = false;
        }
        else {
            const features = this.settings.data.features || this.settings.data;
            indices = indices instanceof Array ? indices : [indices];
            if (typeof indices === "number") {
                indices = [indices];
            }
            indices
                .sort((a, b) => {
                return a - b;
            })
                .reverse()
                .forEach((index) => {
                features.splice(index, 1);
            });
            this.render();
        }
        return this;
    }
    insert(features, index) {
        const featuresArray = Array.isArray(features) ? features : [features];
        const featuresData = this.settings.data.features || this.settings.data;
        for (let i = 0; i < featuresArray.length; i++) {
            featuresData.splice(index + i, 0, featuresArray[i]);
        }
        return this.render();
    }
    update(feature, index) {
        const featuresData = this.settings.data.features || this.settings.data;
        if (Array.isArray(feature)) {
            for (let i = 0; i < feature.length; i++) {
                featuresData[index + i] = feature[i];
            }
        }
        else {
            featuresData[index] = feature;
        }
        return this.render();
    }
    getBuffer(name) {
        if (!this.buffers[name]) {
            const buffer = this.gl.createBuffer();
            if (!buffer) {
                throw new Error("Not able to create buffer");
            }
            this.buffers[name] = buffer;
        }
        return this.buffers[name];
    }
    getAttributeLocation(name) {
        if (!this.program) {
            throw new Error(notProperlyDefined("this.program"));
        }
        if (this.attributeLocations[name] !== undefined) {
            return this.attributeLocations[name];
        }
        return (this.attributeLocations[name] = this.gl.getAttribLocation(this.program, name));
    }
    getUniformLocation(name) {
        if (!this.program) {
            throw new Error(notProperlyDefined("this.program"));
        }
        if (this.uniformLocations[name] !== undefined) {
            return this.uniformLocations[name];
        }
        const loc = this.gl.getUniformLocation(this.program, name);
        if (!loc) {
            throw new Error("Cannot find location");
        }
        return (this.uniformLocations[name] = loc);
    }
    click(e, feature) {
        if (!this.settings.click)
            return;
        const result = this.settings.click(e, feature);
        if (result !== undefined) {
            return result;
        }
    }
    contextMenu(e, feature) {
        if (!this.settings.contextMenu)
            return;
        const result = this.settings.contextMenu(e, feature);
        if (result !== undefined) {
            return result;
        }
    }
    hover(e, feature) {
        if (!this.settings.hover)
            return;
        const result = this.settings.hover(e, feature);
        if (result !== undefined) {
            return result;
        }
    }
    hoverOff(e, feature) {
        if (!this.settings.hoverOff)
            return;
        this.settings.hoverOff(e, feature);
    }
}
BaseGlLayer.defaults = defaults;
