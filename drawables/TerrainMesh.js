class TerrainMesh {
    constructor(gl, vertices) {
        this.gl = gl;
        let points = [];
        let normals = [];
        for (let i = 0; i < vertices.length - 1; i++) {
            for (let j = 0; j < vertices[i].length - 1; j++) {
                let p1 = vertices[i][j];
                let p2 = vertices[i + 1][j];
                let p3 = vertices[i + 1][j + 1]
                let p4 = vertices[i][j + 1];

                points.push(p1, p2, p3, p1, p3, p4);
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

        let color = [.3, .5, .9, 1];
        let colors = [];
        for (let i = 0; i < points.length; i++) {
            colors.push(color);
        }

        this.numVertices = points.length;

        this.vBuff = loadBuffer(this.gl, flatten(points), this.gl.STATIC_DRAW);
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