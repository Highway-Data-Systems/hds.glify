export class MapMatrix {
    constructor() {
        this.array = new Float32Array(16);
    }
    setSize(width, height) {
        this.array.set([
            2 / width,
            0,
            0,
            0,
            0,
            -2 / height,
            0,
            0,
            0,
            0,
            0,
            0,
            -1,
            1,
            0,
            1,
        ]);
        return this;
    }
    translateTo(x, y) {
        const { array } = this;
        // translation is in last column of matrix
        array[12] = array[0] * x - 1;
        array[13] = array[5] * y + 1;
        return this;
    }
    scaleTo(scale) {
        const { array } = this;
        // scaling x and y, which is just scaling first two columns of matrix
        array[0] *= scale;
        array[5] *= scale;
        return this;
    }
}
