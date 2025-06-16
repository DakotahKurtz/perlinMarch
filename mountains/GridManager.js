const SAMPLES_PER_UNIT = 100;
const RANGE_PER_UNIT = 40;
const BLOCK_DISPLAY_SIZE = 3;
const RENDER_DISTANCE = 10;

class GridManager {


    constructor(gl, numOctaves) {
        this.gl = gl;
        this.terrainMeshes = new Map();


        numOctaves = 6;

        this.numberOfSamples = [SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE, 1, SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE];
        this.domainBlockDim = BLOCK_DISPLAY_SIZE * RANGE_PER_UNIT;
        this.domainBlockSizeArr = [this.domainBlockDim, 1, this.domainBlockDim];
        this.blockDisplayDims = [BLOCK_DISPLAY_SIZE, 0, BLOCK_DISPLAY_SIZE];
        this.xInc = this.blockDisplayDims[0] / (this.numberOfSamples[0] - 1);
        this.zInc = this.blockDisplayDims[2] / (this.numberOfSamples[2] - 1);
        this.numOctaves = numOctaves;


    }

    _generateTestBlock(rangeOrigin, row, column, color) {

        let vertices = [];

        for (let i = 0; i < this.numberOfSamples[0]; i++) {
            let r = [];
            for (let j = 0; j < this.numberOfSamples[2]; j++) {
                let x = rangeOrigin[0] + this.xInc * j;
                let z = rangeOrigin[2] + this.zInc * i;

                r.push([x, 0, z])
            }
            vertices.push(r);
        }



        return new TerrainMesh(this.gl, vertices, color);

    }

    _generateBlock(rangeOrigin, row, column, color) {


        let vertices = [];

        for (let i = 0; i < this.numberOfSamples[0]; i++) {
            let r = [];
            for (let j = 0; j < this.numberOfSamples[2]; j++) {
                let x = rangeOrigin[0] + this.xInc * j;
                let z = rangeOrigin[2] + this.zInc * i;

                r.push([x, 0, z])
            }
            vertices.push(r);
        }

        let gridDomainArray;
        let perlinMap;
        let sAmp = 1;
        let portion;
        let domainOrigin;

        for (let currOctave = 0; currOctave < this.numOctaves; currOctave++) {
            portion = 1 / (Math.pow(2, this.numOctaves - currOctave - 1))
            gridDomainArray = [this.domainBlockSizeArr[0] * portion, this.domainBlockSizeArr[1] * portion, this.domainBlockSizeArr[2] * portion];
            domainOrigin = [column * portion * this.domainBlockDim, 0, row * portion * this.domainBlockDim]
            perlinMap = this._generateMapping(rangeOrigin, this.blockDisplayDims, domainOrigin, gridDomainArray);
            for (let i = 0; i < this.numberOfSamples[0]; i++) {
                for (let j = 0; j < this.numberOfSamples[2]; j++) {
                    let x = vertices[i][j][0];
                    let z = vertices[i][j][2];

                    let mapped = perlinMap.map([x, .1, z]);
                    let v = sAmp * perlin.sample(mapped[0], mapped[1], mapped[2]);
                    vertices[i][j][1] += v;
                }
            }
            sAmp *= .5;
        }

        return new TerrainMesh(this.gl, vertices, color);
    }

    _rotate(v, theta) {
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        return [v[0] * c + v[1] * -s, v[0] * s + v[1] * c];
    }

    _compare(v1, v2) {
        if (v1 > v2) {
            return 1;
        } else if (v1 < v2) {
            return -1;
        }
        return 0;
    }

    _lineBetween(x1, z1, x2, z2, storage) {
        let start = this._getGrid(x1, z1);
        let end = this._getGrid(x2, z2);

        let i0 = start[0];
        let j0 = start[1];
        let i1 = end[0];
        let j1 = end[1];

        // console.log("line Between " + [i0, j0] + ", and " + [i1, j1])

        // storage.push([j1, i1]);
        // return;


        let di = this._compare(i1, i0);
        let dj = this._compare(j1, j0);

        let dx = x2 - x1;
        let dz = z2 - z1;

        let dimension = BLOCK_DISPLAY_SIZE;
        let tDeltaZ = (dj == 0) ? Number.MAX_VALUE : Math.abs(dimension / dz);
        let tDeltaX = (di == 0) ? Number.MAX_VALUE : Math.abs(dimension / dx);

        let zBoundary = (dj > 0) ? (j0 + 1) * dimension : j0 * dimension;
        let xBoundary = (di > 0) ? (i0 + 1) * dimension : i0 * dimension;



        let tMaxX = 0;
        let tMaxZ = 0;
        let djZero = false;
        let diZero = false;

        if (dj == 0) {
            djZero = true;
        } else {
            tMaxX = Math.abs((xBoundary - x1) / dx);
        }
        if (di == 0) {
            diZero = true;
        } else {
            tMaxZ = Math.abs((zBoundary - z1) / dz);
        }

        // console.log("dj,di,dz,dx: " + dj, di, dz, dx);
        // console.log("tDeltaX,Z: " + tDeltaX, tDeltaZ)
        // console.log("x,zBounds: " + xBoundary, zBoundary);
        //console.log("tMaxX,Z: " + tMaxX, tMaxZ)

        let i = i0;
        let j = j0;

        storage.push([i, j]);
        let it = 0;
        let lim = 100;
        if (djZero) {
            let length = Math.floor(RENDER_DISTANCE / dimension);
            for (let c = 0; c < length; c++) {
                storage.push([i0 + c * di, j0,]);
            }
        } else if (diZero) {
            let length = Math.floor(RENDER_DISTANCE / dimension)
            for (let r = 0; r < length; r++) {
                storage.push([i0, j0 + r * dj,]);
            }
        } else {

            while (it <= lim && (i != i1 || j != j1)) {
                if (tMaxX < tMaxZ) {
                    i += di;
                    tMaxX += tDeltaX
                } else {
                    j += dj;
                    tMaxZ += tDeltaZ;
                }
                storage.push([i, j]);
                it++;
            }
        }
        if (it >= lim) {
            console.log("\n\nMISSED TARGET\n\n")
        }


        // console.log(storage)
    }

    _getGrid(x, y) {
        return [Math.floor(Math.floor(x) / BLOCK_DISPLAY_SIZE), Math.floor(Math.floor(y) / BLOCK_DISPLAY_SIZE)];
    }

    getVisibleMeshes(cameraPos, lookAt, viewAngle) {

        let visible = [];
        let indices = [];

        let x = cameraPos[0];
        let z = cameraPos[2];

        viewAngle += Math.PI / 4;


        let subtract = subtractArr(lookAt, cameraPos);
        subtract = [subtract.x, subtract.z];
        let direction = scaleVector(normalizeArr(subtract), RENDER_DISTANCE);


        let ccW = this._rotate(direction, viewAngle / 2);
        let cW = this._rotate(direction, -viewAngle / 2);





        let grid = this._getGrid(x, z);
        let end = this._getGrid(x + direction[0], z + direction[1])
        let left = this._getGrid(x + ccW[0], z + ccW[1]);
        let right = this._getGrid(x + cW[0], z + cW[1]);
        let testBlocks = [];
        testBlocks.push([grid[0], grid[1]])
        testBlocks.push([end[0], end[1]])
        testBlocks.push(left);
        testBlocks.push(right);

        // console.log("CamPos: " + cameraPos)
        // console.log("LookAt: " + lookAt)
        // console.log("dir: " + subtract)
        // console.log("norm Direction: " + direction)
        // console.log("ccW: " + ccW)
        // console.log("cW: " + cW)
        // console.log("start -> end ", grid, end);
        // console.log("start -> end: " + [x, z], [x + direction[0], z + direction[1]])


        // for (let index = 0; index < testBlocks.length; index++) {
        //     let i = testBlocks[index][0];
        //     let j = testBlocks[index][1];

        //     let mesh = this._generateBlock([i * BLOCK_DISPLAY_SIZE, 0, j * BLOCK_DISPLAY_SIZE], j, i, [1, 0, 0, 1]);
        //     visible.push(mesh);
        // }

        //this._lineBetween(x, z, x + direction[0], z + direction[1], indices);
        this._lineBetween(x, z, x + ccW[0], z + ccW[1], indices);
        this._lineBetween(x, z, x + cW[0], z + cW[1], indices);
        this._lineBetween(x + ccW[0], z + ccW[1], x + cW[0], z + cW[1], indices);

        // console.log(indices);

        let set = new Set();
        let unique = [];
        let lowestR = Number.MAX_VALUE;
        let highestR = -Number.MAX_VALUE;
        indices.forEach(index => {
            let s = index[0].toString() + index[1].toString();
            if (!set.has(s)) {
                set.add(s);
                unique.push([index[0], index[1]])
                lowestR = Math.min(lowestR, index[0]);
                highestR = Math.max(highestR, index[0]);
            }
        });


        let rows = highestR - lowestR;
        // console.log("Rows, lowest: " + rows, lowestR);


        let range = [];
        for (let i = 0; i <= rows; i++) {
            range.push([Number.MAX_VALUE, -Number.MAX_VALUE]);
        }


        for (let i = 0; i < unique.length; i++) {
            let r = unique[i][0];
            let c = unique[i][1];

            let rangeIndex = r - lowestR;
            // console.log(rangeIndex, r)
            range[rangeIndex][0] = Math.min(range[rangeIndex][0], c);
            range[rangeIndex][1] = Math.max(range[rangeIndex][1], c);
        }


        for (let i = 0; i < rows; i++) {
            let r = i + lowestR;
            for (let j = range[i][0]; j <= range[i][1]; j++) {
                if (this.terrainMeshes.has(r.toString() + j.toString())) {
                    visible.push(this.terrainMeshes.get(r.toString() + j.toString()))
                } else {

                    let mesh = this._generateBlock([r * BLOCK_DISPLAY_SIZE, 0, j * BLOCK_DISPLAY_SIZE,], j, r)
                    visible.push(mesh);
                    this.terrainMeshes.set(r.toString() + j.toString(), mesh);
                }

            }
        }






        // for (let index = 0; index < indices.length; index++) {
        //     let i = indices[index][0];
        //     let j = indices[index][1];
        //     if (this.terrainMeshes.has(i.toString() + j.toString())) {
        //         visible.push(this.terrainMeshes.get(i.toString() + j.toString()))
        //     } else {
        //         let mesh = this._generateBlock([i * BLOCK_DISPLAY_SIZE, 0, j * BLOCK_DISPLAY_SIZE,], j, i)
        //         visible.push(mesh);
        //         this.terrainMeshes.set(i.toString() + j.toString(), mesh);
        //     }
        // }

        // let block = this._getGrid(x, z);
        // visible.push(this._generateBlock([block[1] * BLOCK_DISPLAY_SIZE, 0, block[0] * BLOCK_DISPLAY_SIZE], block[0], block[1]))


        return visible;
    }

    _generateMapping(dO, dDim, rO, rDim) {
        if (dDim[1] == 0) {
            dDim[1] = 1;
        }
        var scaleX = rDim[0] / dDim[0];
        var scaleY = rDim[1] / dDim[1];
        var scaleZ = rDim[2] / dDim[2];

        return {
            map: (arr) => {
                let tX = arr[0] - dO[0];
                let tY = arr[1] - dO[1];
                let tZ = arr[2] - dO[2];

                let sX = tX * scaleX;
                let sY = tY * scaleY;
                let sZ = tZ * scaleZ;

                return [sX + rO[0], sY + rO[1], sZ + rO[2]];
            }
        }
    }
}