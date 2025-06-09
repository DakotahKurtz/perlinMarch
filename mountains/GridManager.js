const SAMPLES_PER_UNIT = 30;
const RANGE_PER_UNIT = 2;
const BLOCK_DISPLAY_SIZE = 1;
const RENDER_DISTANCE = 5;

class GridManager {


    constructor(gl, numOctaves) {
        this.gl = gl;
        this.terrainMeshes = [];
        let arr = new Array();
        arr[0] = 4;
        console.log(arr[0]);
        arr[-1] = 3;
        console.log(arr[-1])

        numOctaves = 4;

        this.numberOfSamples = [SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE, 1, SAMPLES_PER_UNIT * BLOCK_DISPLAY_SIZE];
        this.domainBlockDim = BLOCK_DISPLAY_SIZE * RANGE_PER_UNIT;
        this.domainBlockSizeArr = [this.domainBlockDim, 1, this.domainBlockDim];
        this.blockDisplayDims = [BLOCK_DISPLAY_SIZE, 0, BLOCK_DISPLAY_SIZE];
        this.xInc = this.blockDisplayDims[0] / (this.numberOfSamples[0] - 1);
        this.zInc = this.blockDisplayDims[2] / (this.numberOfSamples[2] - 1);
        this.numOctaves = numOctaves;

        // for (let i = 0; i < 30; i++) {
        //     for (let j = 0; j < 30; j++) {
        //         // let dX = j * this.domainBlockSize;
        //         // let dZ = i * this.domainBlockSize;
        //         let rX = j * BLOCK_DISPLAY_SIZE;
        //         let rZ = i * BLOCK_DISPLAY_SIZE;

        //         let display = [rX, 0, rZ];
        //         //let perlinSpace = [dX, 0, dZ]
        //         // console.log("\n\n****************\n\n" + i + ", " + j)
        //         // console.log("Display: " + display);
        //         // console.log("PerlinSpace: " + perlinSpace)

        //         this._generateBlock(display, i, j)
        //     }
        // }

        // this._generateBlock([0, 0, .1], [0, 0, 0]);
        // this._generateBlock([domainSize, 0, .1], [BLOCK_DISPLAY_SIZE, 0, 0])

    }

    _generateBlock(rangeOrigin, row, column) {


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
        let sAmp = 2;
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

        this.terrainMeshes.push(new TerrainMesh(this.gl, vertices));
    }

    getVisibleMeshes(cameraPos, lookAt, viewAngle) {
        this.terrainMeshes = [];
        let x = Math.floor(Math.floor(cameraPos[0]) / BLOCK_DISPLAY_SIZE);
        let z = Math.floor(Math.floor(cameraPos[2]) / BLOCK_DISPLAY_SIZE);

        console.log(cameraPos)
        console.log("Over block: ", x, z);

        for (let i = z - RENDER_DISTANCE; i <= z + RENDER_DISTANCE; i++) {
            for (let j = x - RENDER_DISTANCE; j <= x + RENDER_DISTANCE; j++) {
                this._generateBlock([j * BLOCK_DISPLAY_SIZE, 0, i * BLOCK_DISPLAY_SIZE], i, j)

            }
        }


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