const SAMPLES_PER_UNIT = 20;
const RANGE_PER_UNIT = 1;
const BLOCK_DISPLAY_SIZE = 1;

class GridManager {


    constructor(gl, numOctaves) {
        this.gl = gl;
        this.terrainMeshes = [];

        numOctaves = 2;

        this.numberOfSamples = [SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE, 1, SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE];
        let domainSize = BLOCK_DISPLAY_SIZE * RANGE_PER_UNIT;
        this.blockDomainSize = [domainSize, 1, domainSize];
        this.blockDisplayDims = [BLOCK_DISPLAY_SIZE, 0, BLOCK_DISPLAY_SIZE];
        this.xInc = this.blockDisplayDims[0] / (this.numberOfSamples[0] - 1);
        this.zInc = this.blockDisplayDims[2] / (this.numberOfSamples[2] - 1);
        this.numOctaves = numOctaves;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let dX = j * domainSize;
                let dZ = i * domainSize;
                let rX = j * BLOCK_DISPLAY_SIZE;
                let rZ = i * BLOCK_DISPLAY_SIZE;

                let display = [rX, 0, rZ];
                let perlinSpace = [dX, 0, dZ]
                // console.log("\n\n****************\n\n" + i + ", " + j)
                // console.log("Display: " + display);
                // console.log("PerlinSpace: " + perlinSpace)

                this._generateBlock(display, perlinSpace)
            }
        }

        // this._generateBlock([0, 0, .1], [0, 0, 0]);
        // this._generateBlock([domainSize, 0, .1], [BLOCK_DISPLAY_SIZE, 0, 0])

    }

    _generateBlock(rangeOrigin, domainOrigin) {
        let gridDomainArray;
        var perlinMap;

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

        let sFreq = 1;
        let sAmp = 1;

        for (let currOctave = 0; currOctave < this.numOctaves; currOctave++) {
            let portion = 1 / (Math.pow(2, this.numOctaves - currOctave - 1))
            gridDomainArray = [this.blockDomainSize[0] * portion, this.blockDomainSize[1] * portion, this.blockDomainSize[2] * portion];
            // console.log(rangeOrigin);
            // console.log(this.blockDisplayDims);
            // console.log(domainOrigin);
            // console.log(gridDomainArray)
            perlinMap = this._generateMapping(rangeOrigin, this.blockDisplayDims, domainOrigin, gridDomainArray);
            // console.log("\n\n***********\n\nOctave: " + currOctave + " | portion " + portion + " domain: " + gridDomainArray)
            for (let i = 0; i < this.numberOfSamples[0]; i++) {
                for (let j = 0; j < this.numberOfSamples[2]; j++) {
                    let x = vertices[i][j][0];
                    let z = vertices[i][j][2];

                    let mapped = perlinMap.map([x, .1, z]);
                    let v = sAmp * perlin.sample(mapped[0], mapped[1], mapped[2]);
                    vertices[i][j][1] += v;

                    //console.log("x,z: (" + x + "," + z + ") -> (" + mapped[0] + ", " + mapped[2] + ") w/ value: " + v)
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