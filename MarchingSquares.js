class MarchingSquares {
    constructor(gl, noiseFunction, noiseMap, numSamples, displaySize, threshold) {
        this.gl = gl;
        this.noiseFunction = noiseFunction;
        this.map = noiseMap;
        this.numSamples = numSamples;
        this.inc = displaySize / (this.numSamples[0] - 1);

        this.points = [];
        this.gridValues = [];
        for (let j = this.numSamples[1] - 1; j >= 0; j--) {
            let r = [];
            let v = [];
            for (let i = 0; i < this.numSamples[0]; i++) {

                let loc = [i * this.inc, j * this.inc, 0];
                let m = this.map(loc);
                v.push(noiseFunction.sample(m[0], m[1], m[2]))

                r.push(loc);



            }
            this.gridValues.push(v);
            this.points.push(r);
        }

        this.threshold = threshold;

        this.connectionRules = {
            "0001": [3, 0, 3, 2],
            "0010": [2, 1, 2, 3],
            "0100": [1, 0, 1, 2],
            "1000": [0, 1, 0, 3],

            "1100": [0, 3, 1, 2],
            "1001": [0, 1, 3, 2],
            "0011": [3, 0, 2, 1],
            "0110": [1, 0, 2, 3],

            "0111": [1, 0, 3, 0],
            "1011": [0, 1, 2, 1],
            "1101": [1, 2, 3, 2],
            "1110": [0, 3, 2, 3],
        }

        let flatVertices = this.march(threshold);

        let vertices = [];
        for (let i = 0; i < flatVertices.length; i++) {
            vertices.push([flatVertices[i][0], flatVertices[i][1], 0])
        }

        let color = [1, 0, 0, 1];
        let colors = [];
        let lowColor = [1, 1, 1, 1];
        let highColor = [1, 0, 0, 1];
        let r = [highColor[0] - lowColor[0], highColor[1] - lowColor[1], highColor[2] - lowColor[2]];

        for (let i = 0; i < vertices.length; i++) {
            colors.push(color)
            // let mapped = this.map([vertices[i][0], vertices[i][1], vertices[i][2]])

            // let sample = this.noiseFunction.sample(mapped[0], mapped[1], mapped[2]);
            // console.log(sample);
            // let scaled = scaleVector(r, sample);
            // let c = addVectors(scaled, [lowColor[0], lowColor[1], lowColor[2]])
            // colors.push([c[0], c[1], c[2], 1]);
        }

        this.numVertices = vertices.length;


        this.vBuff = loadBuffer(this.gl, flatten(vertices), this.gl.STATIC_DRAW);
        this.cBuff = loadBuffer(this.gl, flatten(colors), this.gl.STATIC_DRAW);


    }

    getType() {
        return this.gl.TRIANGLES;
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



    march(threshold) {
        var vertices = [];

        let interpolateTriangle = (connections, i, j, pi, pj) => {

            let v1 = interpolate(connections[0], connections[1], i, j);
            let v2 = interpolate(connections[2], connections[3], i, j);
            let v3 = this.points[pi][pj];

            return [v1, v2, v3];
        }

        let recordThresh = (v) => {
            if (v >= threshold) {
                return "1"
            } else {
                return "0"
            }
        }

        let handleSpecialCase = (s, i, j) => {
            if (s == "1010") {
                let p1 = this.points[i][j];
                let p2 = this.points[i + 1][j + 1]
                let midpoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
                let m = this.map(midpoint);
                let v = this.noiseFunction.sample(m[0], m[1], m[2]);

                if (v < this.threshold) {
                    return [interpolateTriangle([0, 1, 0, 3], i, j, i, j), interpolateTriangle([2, 1, 2, 3], i, j, (i + 1), (j + 1))]

                } else {

                    let v1 = interpolate(0, 1, i, j);
                    let v2 = interpolate(2, 1, i, j);
                    let v3 = interpolate(2, 3, i, j);
                    let v4 = interpolate(0, 3, i, j);


                    return [
                        [p1, v4, v1],
                        [v1, v4, v3],
                        [v1, v3, v2],
                        [v2, v3, p2]
                    ];
                }
            } else {

                let p1 = this.points[i][j + 1];
                let p2 = this.points[i + 1][j]
                let midpoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
                let m = this.map(midpoint);
                let v = this.noiseFunction.sample(m[0], m[1], m[2]);
                if (v < this.threshold) {
                    return [interpolateTriangle([1, 0, 1, 2], i, j, i, (j + 1)), interpolateTriangle([3, 0, 3, 2], i, j, (i + 1), j)];

                } else {

                    let v1 = interpolate(1, 0, i, j);
                    let v2 = interpolate(1, 2, i, j);
                    let v3 = interpolate(3, 2, i, j);
                    let v4 = interpolate(3, 0, i, j);

                    return [
                        [p1, v1, v2],
                        [v2, v1, v3],
                        [v3, v1, v4],
                        [v3, v4, p2]
                    ]
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

        let getMissing = (c) => {
            for (let i = 0; i < 4; i++) {
                if (!c.includes(i)) {
                    return i;
                }
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
            return [interpolated[0], interpolated[1]];

        }

        for (let i = 0; i < this.numSamples[0] - 1; i++) {
            for (let j = 0; j < this.numSamples[1] - 1; j++) {
                let s = "";

                s += recordThresh(this.gridValues[i][j]);
                s += recordThresh(this.gridValues[i][j + 1]);
                s += recordThresh(this.gridValues[i + 1][j + 1]);
                s += recordThresh(this.gridValues[i + 1][j]);


                switch (s) {
                    case "0000": {
                        break;
                    }
                    case "1111": {
                        let p1 = this.points[i][j];
                        let p2 = this.points[i + 1][j];
                        let p3 = this.points[i + 1][j + 1];
                        let p4 = this.points[i][j + 1];
                        vertices.push(
                            p1, p2, p3,
                            p1, p3, p4,
                        );
                        break;
                    }
                    case "1010":
                    case "0101":
                        {
                            let triangles = handleSpecialCase(s, i, j);
                            // let v1 = interpolate(connections[0][0], connections[0][1], i, j);
                            // let v2 = interpolate(connections[0][2], connections[0][3], i, j);
                            // let v3 = interpolate(connections[1][0], connections[1][1], i, j);
                            // let v4 = interpolate(connections[1][2], connections[1][3], i, j);
                            for (let i = 0; i < triangles.length; i++) {
                                vertices.push(triangles[i][0], triangles[i][1], triangles[i][2])
                            }
                            // vertices.push(v1, v2, v3, v4);
                            break;
                        }
                    case "1000":
                    case "0100":
                    case "0010":
                    case "0001": {
                        let connections = this.connectionRules[s];

                        let p = locate(connections[0], i, j)
                        let triangle = interpolateTriangle(connections, i, j, p[0], p[1])

                        vertices.push(triangle[0], triangle[1], triangle[2]);
                        break;
                    }
                    case "1100":
                    case "0110":
                    case "0011":
                    case "1001": {
                        let connections = this.connectionRules[s];
                        let v1 = interpolate(connections[0], connections[1], i, j);
                        let v2 = interpolate(connections[2], connections[3], i, j);
                        let p1 = locate(connections[0], i, j);
                        let p2 = locate(connections[2], i, j);
                        let v3 = this.points[p1[0]][p1[1]];
                        let v4 = this.points[p2[0]][p2[1]];

                        vertices.push(
                            v3, v2, v4,
                            v3, v1, v2,

                        )
                        break;

                    }
                    default:
                        {
                            let connections = this.connectionRules[s];
                            let v1 = interpolate(connections[0], connections[1], i, j);
                            let v2 = interpolate(connections[2], connections[3], i, j)
                            let p1 = locate(connections[0], i, j);
                            let p2 = locate(connections[2], i, j);
                            let missing = getMissing(connections);
                            let p3 = locate(missing, i, j);

                            let v3 = this.points[p1[0]][p1[1]];
                            let v4 = this.points[p2[0]][p2[1]];
                            let v5 = this.points[p3[0]][p3[1]];

                            vertices.push(
                                v1, v3, v5,
                                v1, v2, v5,
                                v2, v4, v5,
                            );
                            break;
                        }

                }

            }
        }



        return vertices;
    }
}