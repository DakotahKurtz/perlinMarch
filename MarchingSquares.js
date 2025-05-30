class MarchingSquares {
    constructor(gl, noiseFunction, noiseMap, numSamples, displaySize, threshold) {
        this.gl = gl;
        this.noiseFunction = noiseFunction;
        this.map = noiseMap;
        this.numSamples = numSamples;

        this.points = [];

        this.inc = displaySize / (this.numSamples[0] + 1);
        this.gridValues = [];

        for (let i = 0; i < this.numSamples[0]; i++) {
            let r = [];
            let v = [];
            for (let j = 0; j < this.numSamples[1]; j++) {
                let loc = this._gridToCoords(i, j, 0);
                let m = this.map(loc);
                v.push(noiseFunction.sample(m[0], m[1], m[2]))
                r.push(loc);

            }
            this.gridValues.push(v);
            this.points.push(r);
        }



        //this.values = noiseFunction.generateSamples(sampleFrequency[0], sampleFrequency[1], sampleFrequency[2]);
        // this.squareDim = displayDim / (1 + sampleFrequency[2][0]);

        this.threshold = threshold;

        this.connectionRules = {
            "0001": [0, 3, 2, 3],
            "0010": [1, 2, 2, 3],
            "0011": [1, 2, 3, 0],
            "0100": [0, 1, 1, 2],
            "0110": [0, 1, 2, 3],
            "0111": [0, 1, 0, 3],
            "1000": [0, 1, 0, 3],
            "1001": [1, 0, 3, 2],
            "1011": [0, 1, 1, 2],
            "1100": [0, 3, 1, 2],
            "1101": [1, 2, 2, 3],
            "1110": [0, 3, 3, 2],
        }

        let vertices = this.march(threshold);

        let color = [0, 0, 0, 1];
        let colors = [];

        for (let i = 0; i < vertices.length; i++) {
            colors.push(color)
        }

        this.numVertices = vertices.length;

        this.vBuff = loadBuffer(this.gl, flatten(vertices), this.gl.STATIC_DRAW);
        this.cBuff = loadBuffer(this.gl, flatten(colors), this.gl.STATIC_DRAW);


    }

    getType() {
        return this.gl.LINES;
    }

    draw(programInfo, bufferAttributes) {
        let buffers = this.getBuffers();

        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }

        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    getBuffers() {
        return [this.vBuff, this.cBuff];
    }

    getNumVertices() {
        return this.numVertices;
    }

    addVec2(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1]]
    }

    scaleVec2(v, s) {
        return [v[0] * s, v[1] * s]
    }

    _gridToCoords(i, j, k) {
        return [(i + 1) * this.inc, (j + 1) * this.inc, 0];

    }

    march(threshold) {
        var vertices = [];



        let recordThresh = (v) => {
            if (v >= threshold) {
                return "1"
            } else {
                return "0"
            }
        }

        let handleSpecialCase = (s, i, j) => {
            if (s == "1010") {
                // find midpoint
                let p1 = this._gridToCoords(i, j, 0);
                let p2 = this._gridToCoords(i + 1, j + 1, 0);
                let midpoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
                let m = this.map(midpoint);
                let v = this.noiseFunction.sample(m[0], m[1], m[2]);

                if (v < this.threshold) {
                    return [[0, 1, 0, 3], [1, 2, 3, 2]];

                } else {
                    return [[0, 1, 1, 2], [0, 3, 3, 2]];
                }
            } else {
                let p1 = this._gridToCoords(i, j, 0);
                let p2 = this._gridToCoords(i + 1, j + 1, 0);
                let midpoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
                let m = this.map(midpoint);
                let v = this.noiseFunction.sample(m[0], m[1], m[2]);
                if (v < this.threshold) {
                    return [[0, 1, 1, 2], [0, 3, 3, 2]];

                } else {
                    return [[0, 1, 0, 3], [1, 2, 3, 2]];

                }
            }
        }

        let locate = (p, i, j) => {
            if (p == 0) {
                return [i, j]
            } else if (p == 1) {
                return [i, j + 1]
            } else if (p == 2) {
                return [i + 1, j + 1]
            } else {
                return [i + 1, j]
            }
        }

        let interpolate = (a, b, i, j) => {
            let p1 = locate(a, i, j);
            let p2 = locate(b, i, j);

            let v1 = this.gridValues[p1[0]][p1[1]];
            let v2 = this.gridValues[p2[0]][p2[1]];

            let l1 = this.points[p1[0]][p1[1]]
            let l2 = this.points[p2[0]][p2[1]];

            let alpha = (v1 - this.threshold) / (v1 - v2);
            let dist = this.addVec2(l2, this.scaleVec2(l1, -1));

            let interpolated = this.addVec2(l1, this.scaleVec2(dist, alpha));
            return [interpolated[0], interpolated[1], 0];

        }

        for (let i = 0; i < this.numSamples[0] - 1; i++) {
            for (let j = 0; j < this.numSamples[1] - 1; j++) {
                let s = "";

                s += recordThresh(this.gridValues[i][j]);
                s += recordThresh(this.gridValues[i][j + 1]);
                s += recordThresh(this.gridValues[i + 1][j + 1]);
                s += recordThresh(this.gridValues[i + 1][j]);


                switch (s) {
                    case "0000":
                    case "1111": {
                        break;

                    }
                    case "1010":
                    case "0101":
                        {
                            let connections = handleSpecialCase(s, i, j);
                            let v1 = interpolate(connections[0][0], connections[0][1], i, j);
                            let v2 = interpolate(connections[0][2], connections[0][3], i, j);
                            let v3 = interpolate(connections[1][0], connections[1][1], i, j);
                            let v4 = interpolate(connections[1][2], connections[1][3], i, j);

                            vertices.push(v1, v2, v3, v4);
                            break;
                        }
                    default:
                        {
                            let connections = this.connectionRules[s];
                            let v1 = interpolate(connections[0], connections[1], i, j);
                            let v2 = interpolate(connections[2], connections[3], i, j)

                            vertices.push(v1, v2);

                        }

                }

            }
        }

        // for (let i = 0; i < values.length - 1; i++) {
        //     for (let j = 0; j < values.length - 1; j++) {
        //         let s = "";
        //         s += recordThresh(values[i][j]);
        //         s += recordThresh(values[i][j + 1]);
        //         s += recordThresh(values[i + 1][j + 1]);
        //         s += recordThresh(values[i + 1][j]);

        //         console.log(s)

        //         switch (s) {
        //             case "0000":
        //             case "1111": {
        //                 break;

        //             }
        //             case "1010":
        //             case "0101":
        //                 {
        //                     let connections = handleSpecialCase(s);
        //                     let v1 = interpolate(connections[0][0], connections[0][1], i, j);
        //                     let v2 = interpolate(connections[0][2], connections[0][3], i, j);
        //                     let v3 = interpolate(connections[1][0], connections[1][1], i, j);
        //                     let v4 = interpolate(connections[1][2], connections[1][3], i, j);

        //                     vertices.push(v1, v2, v3, v4);
        //                     break;
        //                 }
        //             default:
        //                 {
        //                     let connections = this.connectionRules[s];
        //                     let v1 = interpolate(connections[0], connections[1], i, j);
        //                     let v2 = interpolate(connections[2], connections[3], i, j)

        //                     vertices.push(v1, v2);

        //                 }

        //         }


        //     }
        //}

        return vertices;
    }
}