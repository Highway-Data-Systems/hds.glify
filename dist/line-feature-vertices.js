import { LatLng } from "leaflet";
export class LineFeatureVertices {
    get length() {
        return this.array.length;
    }
    constructor(settings) {
        this.pixels = [];
        this.latLngs = [];
        this.settings = settings;
        this.vertexCount = 0;
        this.array = [];
    }
    fillFromCoordinates(coordinates) {
        var _a;
        const { color, opacity, project, latitudeKey, longitudeKey, mapCenterPixels, } = this.settings;
        for (let i = 0; i < coordinates.length; i++) {
            if (Array.isArray(coordinates[i][0])) {
                this.fillFromCoordinates(coordinates[i]);
                continue;
            }
            const flatterCoordinates = coordinates;
            const latLng = new LatLng(flatterCoordinates[i][latitudeKey], flatterCoordinates[i][longitudeKey]);
            this.latLngs.push(latLng);
            const pixel = project(latLng, 0);
            this.pixels.push(pixel);
            this.push(pixel.x - mapCenterPixels.x, pixel.y - mapCenterPixels.y, color.r, color.g, color.b, (_a = color.a) !== null && _a !== void 0 ? _a : opacity);
            if (i !== 0 && i !== coordinates.length - 1) {
                this.vertexCount += 1;
            }
            this.vertexCount += 1;
        }
    }
    push(...args) {
        this.array.push(...args);
    }
}
