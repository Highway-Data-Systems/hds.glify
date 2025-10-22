import { geoJSON } from "leaflet";
import { BaseGlLayer, } from "./base-gl-layer";
import * as color from "./color";
import { LineFeatureVertices } from "./line-feature-vertices";
import { latLngDistance, inBounds } from "./utils";
import glify from "./index";
import { getChosenColor } from "./color";
const defaults = {
    data: {
        type: "FeatureCollection",
        features: [],
    },
    color: color.random,
    className: "",
    opacity: 0.5,
    weight: 2,
    sensitivity: 0.1,
    sensitivityHover: 0.03,
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
};
export class Lines extends BaseGlLayer {
    get weight() {
        if (!this.settings.weight) {
            throw new Error("settings.weight not correctly defined");
        }
        return this.settings.weight;
    }
    constructor(settings) {
        super(settings);
        this.scale = Infinity;
        this.bytes = 6;
        this.allVertices = [];
        this.allVerticesTyped = new Float32Array(0);
        this.vertices = [];
        this.aPointSize = -1;
        this.hoveringFeatures = [];
        this.settings = { ...Lines.defaults, ...settings };
        if (!settings.data) {
            throw new Error('"data" is missing');
        }
        this.active = true;
        this.setup().render();
    }
    render() {
        this.resetVertices();
        const { canvas, gl, layer, mapMatrix } = this;
        const vertexBuffer = this.getBuffer("vertex");
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        const size = this.allVerticesTyped.BYTES_PER_ELEMENT;
        gl.bufferData(gl.ARRAY_BUFFER, this.allVerticesTyped, gl.STATIC_DRAW);
        const vertexLocation = this.getAttributeLocation("vertex");
        gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, size * this.bytes, 0);
        gl.enableVertexAttribArray(vertexLocation);
        //  gl.disable(gl.DEPTH_TEST);
        // ----------------------------
        // look up the locations for the inputs to our shaders.
        this.matrix = this.getUniformLocation("matrix");
        this.aPointSize = this.getAttributeLocation("pointSize");
        // Set the matrix to some that makes 1 unit 1 pixel.
        mapMatrix.setSize(canvas.width, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
        this.attachShaderVariables(size);
        layer.redraw();
        return this;
    }
    resetVertices() {
        const { map, opacity, color, weight, latitudeKey, longitudeKey, data, bytes, settings, mapCenterPixels, } = this;
        const { eachVertex } = settings;
        const { features } = data;
        const featureMax = features.length;
        let feature;
        let colorFn = null;
        let weightFn = null;
        let chosenColor;
        let featureIndex = 0;
        let coordinates;
        if (typeof color === "function") {
            colorFn = color;
        }
        if (typeof weight === "function") {
            weightFn = weight;
        }
        const project = map.project.bind(map);
        // -- data
        const vertices = [];
        for (; featureIndex < featureMax; featureIndex++) {
            feature = features[featureIndex];
            // use colorFn function here if it exists
            if (colorFn) {
                chosenColor = colorFn(featureIndex, feature);
            }
            else {
                chosenColor = color;
            }
            chosenColor = getChosenColor(chosenColor);
            const chosenWeight = weightFn
                ? weightFn(featureIndex, feature)
                : weight;
            //coorinates Array Structure depends on whether feature is multipart or not.
            //Multi: [ [[],[],[]...], [[],[],[]...], [[],[],[]...]... ], Single: [ [[],[],[]...] ]
            //Wrap Single Array to treat two types with same method
            coordinates = (feature.geometry || feature).coordinates;
            if (feature.geometry.type !== "MultiLineString") {
                coordinates = [coordinates];
            }
            for (const coordinate of coordinates) {
                const featureVertices = new LineFeatureVertices({
                    project,
                    latitudeKey,
                    longitudeKey,
                    color: chosenColor,
                    weight: chosenWeight,
                    opacity,
                    mapCenterPixels,
                });
                featureVertices.fillFromCoordinates(coordinate);
                vertices.push(featureVertices);
                if (eachVertex) {
                    eachVertex(featureVertices);
                }
            }
        }
        /*
        Transforming lines according to the rule:
        1. Take one line (single feature)
        [[0,0],[1,1],[2,2]]
        2. Split the line in segments, duplicating all coordinates except first and last one
        [[0,0],[1,1],[2,2]] => [[0,0],[1,1],[1,1],[2,2]]
        3. Do this for all lines and put all coordinates in array
        */
        const size = vertices.length;
        const allVertices = [];
        for (let i = 0; i < size; i++) {
            const vertexArray = vertices[i].array;
            const length = vertexArray.length / bytes;
            for (let j = 0; j < length; j++) {
                const vertexIndex = j * bytes;
                if (j !== 0 && j !== length - 1) {
                    allVertices.push(vertexArray[vertexIndex], vertexArray[vertexIndex + 1], vertexArray[vertexIndex + 2], vertexArray[vertexIndex + 3], vertexArray[vertexIndex + 4], vertexArray[vertexIndex + 5]);
                }
                allVertices.push(vertexArray[vertexIndex], vertexArray[vertexIndex + 1], vertexArray[vertexIndex + 2], vertexArray[vertexIndex + 3], vertexArray[vertexIndex + 4], vertexArray[vertexIndex + 5]);
            }
        }
        this.vertices = vertices;
        this.allVertices = allVertices;
        this.allVerticesTyped = new Float32Array(allVertices);
        return this;
    }
    removeInstance() {
        const index = glify.linesInstances.findIndex((element) => element.layer._leaflet_id === this.layer._leaflet_id);
        if (index !== -1) {
            glify.linesInstances.splice(index, 1);
        }
        return this;
    }
    drawOnCanvas(e) {
        if (!this.gl)
            return this;
        const { gl, data, canvas, mapMatrix, matrix, allVertices, vertices, weight, aPointSize, bytes, mapCenterPixels, } = this;
        const { scale, offset, zoom } = e;
        this.scale = scale;
        const pointSize = Math.max(zoom - 4.0, 4.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.vertexAttrib1f(aPointSize, pointSize);
        mapMatrix.setSize(canvas.width, canvas.height).scaleTo(scale);
        if (zoom > 18) {
            mapMatrix.translateTo(-offset.x + mapCenterPixels.x, -offset.y + mapCenterPixels.y);
            // -- attach matrix value to 'mapMatrix' uniform in shader
            gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
            gl.drawArrays(gl.LINES, 0, allVertices.length / bytes);
        }
        else if (typeof weight === "number") {
            // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
            for (let yOffset = -weight; yOffset <= weight; yOffset += 0.5) {
                for (let xOffset = -weight; xOffset <= weight; xOffset += 0.5) {
                    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
                    mapMatrix.translateTo(-offset.x + mapCenterPixels.x + xOffset / scale, -offset.y + mapCenterPixels.y + yOffset / scale);
                    // -- attach matrix value to 'mapMatrix' uniform in shader
                    gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
                    gl.drawArrays(gl.LINES, 0, allVertices.length / bytes);
                }
            }
        }
        else if (typeof weight === "function") {
            let allVertexCount = 0;
            const { features } = data;
            for (let i = 0; i < vertices.length; i++) {
                const featureVertices = vertices[i];
                const { vertexCount } = featureVertices;
                const weightValue = weight(i, features[i]);
                // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
                for (let yOffset = -weightValue; yOffset <= weightValue; yOffset += 0.5) {
                    for (let xOffset = -weightValue; xOffset <= weightValue; xOffset += 0.5) {
                        // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
                        mapMatrix.translateTo(-offset.x + mapCenterPixels.x + xOffset / scale, -offset.y + mapCenterPixels.y + yOffset / scale);
                        // -- attach matrix value to 'mapMatrix' uniform in shader
                        gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
                        gl.drawArrays(gl.LINES, allVertexCount, vertexCount);
                    }
                }
                allVertexCount += vertexCount;
            }
        }
        return this;
    }
    // attempts to click the top-most Lines instance
    static tryClick(e, map, instances) {
        let foundFeature = null;
        let foundLines = null;
        instances.forEach((instance) => {
            const { latitudeKey, longitudeKey, sensitivity, weight, scale, active } = instance;
            if (!active)
                return;
            if (instance.map !== map)
                return;
            function checkClick(coordinate, prevCoordinate, feature, chosenWeight) {
                const distance = latLngDistance(e.latlng.lng, e.latlng.lat, prevCoordinate[longitudeKey], prevCoordinate[latitudeKey], coordinate[longitudeKey], coordinate[latitudeKey]);
                if (distance <= sensitivity + chosenWeight / scale) {
                    foundFeature = feature;
                    foundLines = instance;
                }
            }
            instance.data.features.forEach((feature, i) => {
                const chosenWeight = typeof weight === "function" ? weight(i, feature) : weight;
                const { coordinates, type } = feature.geometry;
                if (type === "LineString") {
                    for (let i = 1; i < coordinates.length; i++) {
                        checkClick(coordinates[i], coordinates[i - 1], feature, chosenWeight);
                    }
                }
                else if (type === "MultiLineString") {
                    // TODO: Unit test
                    for (let i = 0; i < coordinates.length; i++) {
                        const coordinate = coordinates[i];
                        for (let j = 0; j < coordinate.length; j++) {
                            if (j === 0 && i > 0) {
                                const prevCoordinates = coordinates[i - 1];
                                const lastPositions = prevCoordinates[prevCoordinates.length - 1];
                                checkClick(lastPositions, coordinates[i][j], feature, chosenWeight);
                            }
                            else if (j > 0) {
                                checkClick(coordinates[i][j], coordinates[i][j - 1], feature, chosenWeight);
                            }
                        }
                    }
                }
            });
        });
        if (foundLines && foundFeature) {
            const result = foundLines.click(e, foundFeature);
            return result !== undefined ? result : undefined;
        }
    }
    // attempts to click the top-most Lines instance
    static tryContextMenu(e, map, instances) {
        let foundFeature = null;
        let foundLines = null;
        instances.forEach((instance) => {
            const { latitudeKey, longitudeKey, sensitivity, weight, scale, active } = instance;
            if (!active)
                return;
            if (instance.map !== map)
                return;
            function checkContextMenu(coordinate, prevCoordinate, feature, chosenWeight) {
                const distance = latLngDistance(e.latlng.lng, e.latlng.lat, prevCoordinate[longitudeKey], prevCoordinate[latitudeKey], coordinate[longitudeKey], coordinate[latitudeKey]);
                if (distance <= sensitivity + chosenWeight / scale) {
                    foundFeature = feature;
                    foundLines = instance;
                }
            }
            instance.data.features.forEach((feature, i) => {
                const chosenWeight = typeof weight === "function" ? weight(i, feature) : weight;
                const { coordinates, type } = feature.geometry;
                if (type === "LineString") {
                    for (let i = 1; i < coordinates.length; i++) {
                        checkContextMenu(coordinates[i], coordinates[i - 1], feature, chosenWeight);
                    }
                }
                else if (type === "MultiLineString") {
                    // TODO: Unit test
                    for (let i = 0; i < coordinates.length; i++) {
                        const coordinate = coordinates[i];
                        for (let j = 0; j < coordinate.length; j++) {
                            if (j === 0 && i > 0) {
                                const prevCoordinates = coordinates[i - 1];
                                const lastPositions = prevCoordinates[prevCoordinates.length - 1];
                                checkContextMenu(lastPositions, coordinates[i][j], feature, chosenWeight);
                            }
                            else if (j > 0) {
                                checkContextMenu(coordinates[i][j], coordinates[i][j - 1], feature, chosenWeight);
                            }
                        }
                    }
                }
            });
        });
        if (foundLines && foundFeature) {
            const result = foundLines.contextMenu(e, foundFeature);
            return result !== undefined ? result : undefined;
        }
    }
    // hovers all touching Lines instances
    static tryHover(e, map, instances) {
        const results = [];
        instances.forEach((instance) => {
            const { sensitivityHover, latitudeKey, longitudeKey, data, hoveringFeatures, weight, scale, } = instance;
            function checkHover(coordinate, prevCoordinate, feature, chosenWeight) {
                const distance = latLngDistance(e.latlng.lng, e.latlng.lat, prevCoordinate[longitudeKey], prevCoordinate[latitudeKey], coordinate[longitudeKey], coordinate[latitudeKey]);
                if (distance <= sensitivityHover + chosenWeight / scale) {
                    if (!newHoveredFeatures.includes(feature)) {
                        newHoveredFeatures.push(feature);
                    }
                    if (!oldHoveredFeatures.includes(feature)) {
                        return true;
                    }
                }
                return false;
            }
            if (!instance.active)
                return;
            if (map !== instance.map)
                return;
            const oldHoveredFeatures = hoveringFeatures;
            const newHoveredFeatures = [];
            instance.hoveringFeatures = newHoveredFeatures;
            // Check if e.latlng is inside the bbox of the features
            const bounds = geoJSON(data.features).getBounds();
            if (inBounds(e.latlng, bounds)) {
                data.features.forEach((feature, i) => {
                    const chosenWeight = typeof weight === "function" ? weight(i, feature) : weight;
                    const { coordinates, type } = feature.geometry;
                    let isHovering = false;
                    if (type === "LineString") {
                        for (let i = 1; i < coordinates.length; i++) {
                            isHovering = checkHover(coordinates[i], coordinates[i - 1], feature, chosenWeight);
                            if (isHovering)
                                break;
                        }
                    }
                    else if (type === "MultiLineString") {
                        // TODO: Unit test
                        for (let i = 0; i < coordinates.length; i++) {
                            const coordinate = coordinates[i];
                            for (let j = 0; j < coordinate.length; j++) {
                                if (j === 0 && i > 0) {
                                    const prevCoordinates = coordinates[i - 1];
                                    const lastPositions = prevCoordinates[prevCoordinates.length - 1];
                                    isHovering = checkHover(lastPositions, coordinates[i][j], feature, chosenWeight);
                                    if (isHovering)
                                        break;
                                }
                                else if (j > 0) {
                                    isHovering = checkHover(coordinates[i][j], coordinates[i][j - 1], feature, chosenWeight);
                                    if (isHovering)
                                        break;
                                }
                            }
                        }
                    }
                    if (isHovering) {
                        const result = instance.hover(e, feature);
                        if (result !== undefined) {
                            results.push(result);
                        }
                    }
                });
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
Lines.defaults = defaults;
