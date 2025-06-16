class TerrainMesh {
    constructor(gl, vertices, defaultColor = [90 / 255, 120 / 255, 80 / 255, 1]) {
        this.gl = gl;
        let squares = [];
        let normals = [];
        let colors = [];


        let steepColor = [180 / 255, 197 / 255, 209 / 255, 1];
        let snowColor = [225 / 255, 230 / 255, 240 / 255, 1];

        for (let i = 0; i < vertices.length - 1; i++) {
            for (let j = 0; j < vertices[i].length - 1; j++) {
                let p1 = vertices[i][j];
                let p2 = vertices[i + 1][j];
                let p3 = vertices[i + 1][j + 1]
                let p4 = vertices[i][j + 1];

                squares.push(p1, p2, p3, p1, p3, p4);
                let n1 = calculateNormals(p1, p2, p3);
                let n2 = calculateNormals(p1, p3, p4);
                normals.push(
                    normalize(n1[0]),
                    normalize(n1[1]),
                    normalize(n1[2]),
                    normalize(n2[0]),
                    normalize(n2[1]),
                    normalize(n2[2])
                )

            }

        }

        const snowAltitude = 1.2;
        const grassAltidude = .9;
        let diff = subtractArr(snowColor, defaultColor);
        const cDiff = [diff.x, diff.y, diff.z, 1];

        var lerp = (v) => {
            let prop = (v - grassAltidude) / (snowAltitude - grassAltidude);
            let c = addVectors(defaultColor, scaleVector(cDiff, prop));
            return [c[0], c[1], c[2], 1];
        }

        var getColor = (index) => {

            if (squares[index][1] > snowAltitude) {
                return snowColor;
            }
            if (squares[index][1] < grassAltidude) {
                if (Math.abs(dot(normals[index], [0, 1, 0])) < .42) {
                    return steepColor;
                }
                return defaultColor
            }
            else {
                return lerp(squares[index][1])
            }
        }

        for (let i = 0; i < squares.length; i++) {
            colors.push(getColor(i))
        }





        this.numVertices = squares.length;

        this.vBuff = loadBuffer(this.gl, flatten(squares), this.gl.STATIC_DRAW);
        this.nBuff = loadBuffer(this.gl, flatten(normals), this.gl.STATIC_DRAW);
        this.cBuff = loadBuffer(this.gl, flatten(colors), this.gl.STATIC_DRAW);
    }

    getNumVertices() {
        return this.numVertices;
    }

    getType() {
        return this.gl.TRIANGLES
    }

    getBuffers() {
        return [this.vBuff, this.nBuff, this.cBuff];
    }

    draw(programInfo, bufferAttributes) {
        let buffers = this.getBuffers();

        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }

        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }
}