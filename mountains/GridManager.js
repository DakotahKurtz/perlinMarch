// const SAMPLES_PER_UNIT = 100;
// const RANGE_PER_UNIT = 2;
// const BLOCK_DISPLAY_SIZE = 3;

class GridManager {


    constructor(gl, numOctaves) {
        this.gl = gl;
        this.terrainMeshes = [];

        this.numberOfSamples = [SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE, SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE, 1];
        let domainSize = BLOCK_DISPLAY_SIZE * RANGE_PER_UNIT;
        this.blockDomainSize = [domainSize, domainSize, 0];
        this.blockDisplayDims = [BLOCK_DISPLAY_SIZE, BLOCK_DISPLAY_SIZE, 0];
        this.xInc = this.blockDisplayDims[0] / (this.numberOfSamples[0] - 1);
        this.zInc = this.blockDisplayDims[1] / (this.numberOfSamples[1] - 1);
        this.numOctaves = numOctaves;

        this._generateBlock([0, 0, .1]);

    }

    _generateBlock(rangeOrigin) {
        let gridDomainArray;
        var perlinMap;

        let vertices = [];

        for (let i = 0; i < this.numberOfSamples[0]; i++) {
            let r = [];
            for (let j = 0; j < this.numberOfSamples[1]; j++) {
                let x = this.xInc * j;
                let z = this.zInc * i;

                r.push([x, 0, z])
            }
            vertices.push(r);
        }

        let sFreq = 1;
        let sAmp = 1;

        for (let currOctave = 0; currOctave < this.numOctaves; currOctave++) {
            let portion = 1 / (Math.pow(2, this.numOctaves - currOctave - 1))
            gridDomainArray = [this.blockDomainSize[0] * portion, this.blockDomainSize[1] * portion, this.blockDomainSize[2] * portion];
            perlinMap = this._generateMapping([0, 0, 0], this.blockDisplayDims, rangeOrigin, gridDomainArray);
            console.log("\n\n***********\n\nOctave: " + currOctave + " | portion " + portion + " domain: " + gridDomainArray)
            for (let i = 0; i < this.numberOfSamples[0]; i++) {
                for (let j = 0; j < this.numberOfSamples[1]; j++) {
                    let x = vertices[i][j][0];
                    let z = vertices[i][j][2];

                    let mapped = perlinMap.map([x, z, .1]);
                    let v = sAmp * perlin.sample(mapped[0], mapped[1], mapped[2]);
                    vertices[i][j][1] += v;
                    // console.log("i, j: " + i + "," + j)
                    // console.log("x,y,z: " + x, vertices[i][j][1], z);
                    // console.log("Mapped: " + mapped[0], mapped[1], mapped[2])
                }
            }
            sAmp *= .5;
        }

        this.terrainMeshes.push(new TerrainMesh(this.gl, vertices));
    }

    getVisibleMeshes() {
        // for now, all meshes
        return this.terrainMeshes;
    }

    _generateMapping(dO, dDim, rO, rDim) {
        if (dDim[2] == 0) {
            dDim[2] = 1;
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