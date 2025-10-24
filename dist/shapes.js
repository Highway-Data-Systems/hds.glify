import earcut from "earcut";
import PolygonLookup from "polygon-lookup";
import geojsonFlatten from "geojson-flatten";
import { geoJSON, LatLng } from "leaflet";
import { BaseGlLayer, } from "./base-gl-layer";
import * as Color from "./color";
import { latLonToPixel } from "./utils";
import { notProperlyDefined } from "./errors";
import glify from "./index";
import { getChosenColor } from "./color";
export const defaults = {
    color: Color.random,
    className: "",
    opacity: 0.5,
    borderOpacity: 1,
    shaderVariables: {
        vertex: {
            type: "FLOAT",
            start: 0,
            size: 2,
        },
        color: {
            type: "FLOAT",
            start: 2,
            size: 4,
        },
    },
    border: false,
};
export class Shapes extends BaseGlLayer {
    get centerProjectedPixels() {
        const geoJSONLayer = geoJSON(this.settings.data);
        const bounds = geoJSONLayer.getBounds();
        try {
            const centerLatLng = bounds.getCenter();
            const centerProjectedPixels = this.map.project(centerLatLng, 0);
            return centerProjectedPixels;
        }
        catch (error) {
            return { x: 0, y: 0 };
        }
    }
    get border() {
        if (typeof this.settings.border !== "boolean") {
            throw new Error(notProperlyDefined("settings.border"));
        }
        return this.settings.border;
    }
    get borderOpacity() {
        if (typeof this.settings.borderOpacity !== "number") {
            throw new Error(notProperlyDefined("settings.borderOpacity"));
        }
        return this.settings.borderOpacity;
    }
    constructor(settings) {
        super(settings);
        this.bytes = 6;
        this.polygonLookup = null;
        this.hoveringFeatures = [];
        this.settings = { ...Shapes.defaults, ...settings };
        if (!settings.data) {
            throw new Error(notProperlyDefined("settings.data"));
        }
        if (!settings.map) {
            throw new Error(notProperlyDefined("settings.map"));
        }
        this.setup().render();
    }
    render() {
        this.resetVertices();
        // triangles or point count
        const { canvas, gl, layer, vertices, mapMatrix } = this;
        const vertexBuffer = this.getBuffer("vertex");
        const vertexArray = new Float32Array(vertices);
        const byteCount = vertexArray.BYTES_PER_ELEMENT;
        const vertexLocation = this.getAttributeLocation("vertex");
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, byteCount * this.bytes, 0);
        gl.enableVertexAttribArray(vertexLocation);
        //  gl.disable(gl.DEPTH_TEST);
        // ----------------------------
        // look up the locations for the inputs to our shaders.
        this.matrix = this.getUniformLocation("matrix");
        // Set the matrix to some that makes 1 unit 1 pixel.
        gl.viewport(0, 0, canvas.width, canvas.height);
        mapMatrix.setSize(canvas.width, canvas.height);
        gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
        this.attachShaderVariables(byteCount);
        layer.redraw();
        return this;
    }
    resetVertices() {
        this.vertices = [];
        this.vertexLines = [];
        this.polygonLookup = new PolygonLookup();
        const { vertices, vertexLines, polygonLookup, map, border, opacity, borderOpacity, // TODO: Make lookup for each shape priority, then fallback
        color, data, 
        // mapCenterPixels,
        centerProjectedPixels, } = this;
        let pixel;
        let index;
        let features;
        let feature;
        let colorFn = null;
        let chosenColor;
        let coordinates;
        let featureIndex = 0;
        let triangles;
        let indices;
        let flat;
        let dim;
        switch (data.type) {
            case "Feature":
                polygonLookup.loadFeatureCollection({
                    type: "FeatureCollection",
                    features: [data],
                });
                features = geojsonFlatten(data);
                break;
            case "MultiPolygon": {
                const geometry = {
                    type: "MultiPolygon",
                    coordinates: data.coordinates,
                };
                polygonLookup.loadFeatureCollection({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            properties: {},
                            geometry,
                        },
                    ],
                });
                features = geojsonFlatten(data);
                break;
            }
            default:
                polygonLookup.loadFeatureCollection(data);
                features = data.features;
        }
        const featureMax = features.length;
        if (!color) {
            throw new Error(notProperlyDefined("settings.color"));
        }
        else if (typeof color === "function") {
            colorFn = color;
        }
        // -- data
        for (; featureIndex < featureMax; featureIndex++) {
            feature = features[featureIndex];
            triangles = [];
            // use colorFn function here if it exists
            if (colorFn !== null) {
                chosenColor = colorFn(featureIndex, feature);
            }
            else {
                chosenColor = color;
            }
            chosenColor = getChosenColor(chosenColor);
            const alpha = typeof chosenColor.a === "number" ? chosenColor.a : opacity;
            coordinates = (feature.geometry || feature).coordinates;
            //coordinates Array Structure depends on whether feature is multipart or not.
            //Multi: [ [[],[],[]...], [[],[],[]...], [[],[],[]...]... ], Single: [ [[],[],[]...] ]
            //Wrap Single Array to treat two types with same method
            if (feature.geometry.type !== "MultiPolygon") {
                coordinates = [coordinates];
            }
            if (coordinates.length == 0 ||
                !Array.isArray(coordinates[0]) ||
                !Array.isArray(coordinates[0][0])) {
                continue;
            }
            for (let num in coordinates) {
                flat = earcut.flatten(coordinates[num]);
                indices = earcut(flat.vertices, flat.holes, flat.dimensions);
                dim = coordinates[num][0][0].length;
                const { longitudeKey, latitudeKey } = this;
                for (let i = 0, iMax = indices.length; i < iMax; i++) {
                    index = indices[i];
                    if (typeof flat.vertices[0] === "number") {
                        triangles.push(flat.vertices[index * dim + longitudeKey], flat.vertices[index * dim + latitudeKey]);
                    }
                    else {
                        throw new Error("unhandled polygon");
                    }
                }
                for (let i = 0, iMax = triangles.length; i < iMax; i) {
                    pixel = map.project(new LatLng(triangles[i++], triangles[i++]), 0);
                    vertices.push(pixel.x - centerProjectedPixels.x, pixel.y - centerProjectedPixels.y, chosenColor.r, chosenColor.g, chosenColor.b, alpha);
                }
                if (border) {
                    const lines = [];
                    let holeIndex = 0;
                    for (let i = 1, iMax = flat.vertices.length - 2; i < iMax; i = i + 2) {
                        // Skip draw between hole and non-hole vertext
                        if ((i + 1) / 2 !== flat.holes[holeIndex]) {
                            lines.push(flat.vertices[i], flat.vertices[i - 1]);
                            lines.push(flat.vertices[i + 2], flat.vertices[i + 1]);
                        }
                        else {
                            holeIndex++;
                        }
                    }
                    for (let i = 0, iMax = lines.length; i < iMax; i) {
                        pixel = latLonToPixel(lines[i++], lines[i++]);
                        vertexLines.push(pixel.x - centerProjectedPixels.x, pixel.y - centerProjectedPixels.y, chosenColor.r, chosenColor.g, chosenColor.b, borderOpacity);
                    }
                }
            }
        }
        return this;
    }
    removeInstance() {
        const index = glify.shapesInstances.findIndex((element) => element.layer._leaflet_id === this.layer._leaflet_id);
        if (index !== -1) {
            glify.shapesInstances.splice(index, 1);
        }
        return this;
    }
    drawOnCanvas(e) {
        if (!this.gl)
            return this;
        const { scale, offset, canvas } = e;
        const { mapMatrix, gl, vertices, settings, vertexLines, border, 
        // mapCenterPixels,
        centerProjectedPixels } = this;
        // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
        mapMatrix
            .setSize(canvas.width, canvas.height)
            .scaleTo(scale)
            .translateTo(-offset.x + centerProjectedPixels.x, -offset.y + centerProjectedPixels.y);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
        // -- attach matrix value to 'mapMatrix' uniform in shader
        gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
        if (border) {
            const vertexLinesBuffer = this.getBuffer("vertexLines");
            const vertexLinesTypedArray = new Float32Array(vertexLines);
            const size = vertexLinesTypedArray.BYTES_PER_ELEMENT;
            const vertex = this.getAttributeLocation("vertex");
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexLinesBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertexLinesTypedArray, gl.STATIC_DRAW);
            if (this.settings.shaderVariables !== null) {
                this.attachShaderVariables(size);
            }
            gl.vertexAttribPointer(vertex, 3, gl.FLOAT, false, size * this.bytes, 0);
            gl.enableVertexAttribArray(vertex);
            gl.enable(gl.DEPTH_TEST);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.drawArrays(gl.LINES, 0, vertexLines.length / this.bytes);
            const vertexBuffer = this.getBuffer("vertex");
            const verticesTypedArray = new Float32Array(vertices);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, verticesTypedArray, gl.STATIC_DRAW);
            if (settings.shaderVariables !== null) {
                this.attachShaderVariables(size);
            }
            gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * this.bytes, 0);
            gl.enableVertexAttribArray(vertex);
            gl.enable(gl.DEPTH_TEST);
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / this.bytes);
        return this;
    }
    // attempts to click the top-most Shapes instance
    static tryClick(e, map, instances) {
        let foundPolygon = null;
        let foundShapes = null;
        instances.forEach(function (_instance) {
            if (!_instance.active)
                return;
            if (_instance.map !== map)
                return;
            if (!_instance.polygonLookup)
                return;
            const polygon = _instance.polygonLookup.search(e.latlng.lng, e.latlng.lat);
            if (polygon) {
                foundShapes = _instance;
                foundPolygon = polygon;
            }
        });
        if (foundShapes && foundPolygon) {
            const result = foundShapes.click(e, foundPolygon);
            return result !== undefined ? result : undefined;
        }
    }
    // attempts to click the top-most Shapes instance
    static tryContextMenu(e, map, instances) {
        let foundPolygon = null;
        let foundShapes = null;
        instances.forEach(function (_instance) {
            if (!_instance.active)
                return;
            if (_instance.map !== map)
                return;
            if (!_instance.polygonLookup)
                return;
            const polygon = _instance.polygonLookup.search(e.latlng.lng, e.latlng.lat);
            if (polygon) {
                foundShapes = _instance;
                foundPolygon = polygon;
            }
        });
        if (foundShapes && foundPolygon) {
            const result = foundShapes.contextMenu(e, foundPolygon);
            return result !== undefined ? result : undefined;
        }
    }
    // hovers all touching Shapes instances
    static tryHover(e, map, instances) {
        const results = [];
        instances.forEach(function (instance) {
            const { hoveringFeatures } = instance;
            if (!instance.active)
                return;
            if (instance.map !== map)
                return;
            if (!instance.polygonLookup)
                return;
            const oldHoveredFeatures = hoveringFeatures;
            const newHoveredFeatures = [];
            instance.hoveringFeatures = newHoveredFeatures;
            const feature = instance.polygonLookup.search(e.latlng.lng, e.latlng.lat);
            if (feature) {
                if (!newHoveredFeatures.includes(feature)) {
                    newHoveredFeatures.push(feature);
                }
                const result = instance.hover(e, feature);
                if (result !== undefined) {
                    results.push(result);
                }
            }
            for (let i = 0; i < oldHoveredFeatures.length; i++) {
                const feature = oldHoveredFeatures[i];
                if (!newHoveredFeatures.includes(feature)) {
                    instance.hoverOff(e, feature);
                }
            }
        });
        return results;
    }
}
Shapes.defaults = defaults;
