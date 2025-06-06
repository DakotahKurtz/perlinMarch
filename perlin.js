var permutation = [151, 160, 137, 91, 90, 15,                 // Hash lookup table as defined by Ken Perlin.  This is a randomly
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,    // arranged array of all numbers from 0-255 inclusive.
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];

class Perlin2D {

    constructor() {
        let swaps = 0;
        for (let i = 0; i < swaps; i++) {
            let a = getRandomInt(0, 255);
            let b = (a + 1) % 256;
            let v = permutation[a];
            permutation[a] = permutation[b];
            permutation[b] = v;

        }
        this.p = [];
        for (let i = 0; i < 512; i++) {
            this.p.push(permutation[i % 256])
        }

    }



    generateSamples(startPos, deltaPos, samplesDim) {

        let samples = [];
        for (let i = 0; i < samplesDim[0]; i++) {
            let layer = [];
            let x = startPos[0] + deltaPos[0] * i;
            for (let j = 0; j < samplesDim[1]; j++) {
                let c = [];
                let y = startPos[1] + deltaPos[1] * j;

                for (let k = 0; k < samplesDim[2]; k++) {
                    let z = startPos[2] + deltaPos[2] * k;
                    c.push(this._perlin(y, x, z));
                }
                layer.push(c)
            }
            samples.push(layer);
        }

        if (samplesDim[2] == 1) {
            return this._flattened(samples);
        }

        return samples;
    }

    _flattened(samples) {
        let flat = [];

        for (let i = 0; i < samples.length; i++) {
            let r = [];
            for (let j = 0; j < samples[i].length; j++) {
                r.push(samples[i][j][0]);
            }
            flat.push(r)
        }
        return flat;
    }

    sample(x, y, z) {
        return this._perlin(x, y, z);
    }

    _perlin(x, y, z) {
        let xi = x & 255;
        let yi = y & 255;
        let zi = z & 255;
        let xf = x - Math.floor(x);
        let yf = y - Math.floor(y);
        let zf = z - Math.floor(z);

        let u = this.smoothing(xf);
        let v = this.smoothing(yf);
        let w = this.smoothing(zf);

        let aaa, aba, aab, abb, baa, bba, bab, bbb;

        var inc = (v) => {
            v++;
            return v;
        }

        aaa = this.p[this.p[this.p[xi] + yi] + zi];
        aba = this.p[this.p[this.p[xi] + inc(yi)] + zi];
        aab = this.p[this.p[this.p[xi] + yi] + inc(zi)];
        abb = this.p[this.p[this.p[xi] + inc(yi)] + inc(zi)];
        baa = this.p[this.p[this.p[inc(xi)] + yi] + zi];
        bba = this.p[this.p[this.p[inc(xi)] + inc(yi)] + zi];
        bab = this.p[this.p[this.p[inc(xi)] + yi] + inc(zi)];
        bbb = this.p[this.p[this.p[inc(xi)] + inc(yi)] + inc(zi)];
        //console.log(aaa, aba, aab, abb, baa, bba, bab, bbb)

        let x1, x2, y1, y2;
        x1 = this.lerp(
            this.grad(aaa, xf, yf, zf),
            this.grad(baa, xf - 1, yf, zf),
            u
        );
        x2 = this.lerp(
            this.grad(aba, xf, yf - 1, zf),
            this.grad(bba, xf - 1, yf - 1, zf),
            u
        );
        y1 = this.lerp(x1, x2, v);
        x1 = this.lerp(
            this.grad(aab, xf, yf, zf - 1),
            this.grad(bab, xf - 1, yf, zf - 1),
            u
        );
        x2 = this.lerp(
            this.grad(abb, xf, yf - 1, zf - 1),
            this.grad(bbb, xf - 1, yf - 1, zf - 1),
            u
        );
        y2 = this.lerp(x1, x2, v);
        return (this.lerp(y1, y2, w) + 1) / 2
    }

    grad(hash, x, y, z) {
        switch (hash & 0xF) {
            case 0x0: return x + y;
            case 0x1: return -x + y;
            case 0x2: return x - y;
            case 0x3: return -x - y;
            case 0x4: return x + z;
            case 0x5: return -x + z;
            case 0x6: return x - z;
            case 0x7: return -x - z;
            case 0x8: return y + z;
            case 0x9: return -y + z;
            case 0xA: return y - z;
            case 0xB: return -y - z;
            case 0xC: return y + x;
            case 0xD: return -y + z;
            case 0xE: return y - x;
            case 0xF: return -y - z;
            default: return 0; // never happens
        }
    }

    lerp(a, b, x) {
        return a + x * (b - a);
    }





    dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1];
    }



    normalize2D(v) {
        let d = Math.sqrt((v[0] * v[0]) + (v[1] * v[1]));
        return [v[0] / d, v[1] / d];
    }

    smoothing(t) {
        return 6 * t * t * t * t * t - 15 * t * t * t * t + 10 * t * t * t;
    }

}