class NoiseDisplay {
    constructor(gl, perlin, perlinMap, numSamples, displaySize, threshold, showGradient) {
        this.gl = gl;
        this.perlin = perlin;
        this.map = perlinMap;
        this.numSamples = numSamples;


        this.displaySize = displaySize;
        this.showGradient = showGradient;

        this.threshold = threshold;
        this.cBelow = [101 / 255, 157 / 255, 247 / 255, 1];
        this.cAbove = [250 / 255, 110 / 255, 100 / 255, 1];

        this.vertices = [];
        let inc = displaySize / (this.numSamples[0] - 1);

        for (let i = 0; i < this.numSamples[0]; i++) {
            for (let j = 0; j < this.numSamples[1]; j++) {
                this.vertices.push([(i) * inc, (j) * inc, 0]);
            }
        }
        this.updateColor();


        this.vertices.push([0, -.1, 0]);
        this.vertices.push([displaySize, -.1, 0])
        this.vertices.push([-.1, displaySize, 0])


        this.vBuff = loadBuffer(this.gl, new Float32Array(flatten(this.vertices)), this.gl.STATIC_DRAW);


        this.numVertices = this.vertices.length;


    }

    updateColor() {
        this.colors = []
        if (this.showGradient) {
            this.colors = this.colorGradient();

        } else {
            this.colors = this.initThreshold();

        }
        this.colors.push([0, 0, 0, 1])
        this.colors.push([0, 1, 1, 1])
        this.colors.push([0, 0, 1, 1])

        this.cBuff = loadBuffer(this.gl, flatten(this.colors), this.gl.STATIC_DRAW);
    }

    updateSamples(samples) {
        this.samples = samples;

        this.updateColor();



    }

    colorGradient() {
        console.log(this.vertices.length);

        let colors = [];
        let r = [this.cAbove[0] - this.cBelow[0], this.cAbove[1] - this.cBelow[1], this.cAbove[2] - this.cBelow[2]];

        for (let i = 0; i < this.vertices.length; i++) {
            let mapped = this.map(this.vertices[i]);
            let sample = this.perlin.sample(mapped[0], mapped[1], mapped[2]);
            let shapedSample = (Math.min(sample, this.threshold) / this.threshold);
            shapedSample = shapedSample * shapedSample * shapedSample;
            let scaled = scaleVector(r, shapedSample);
            let c = addVectors(scaled, [this.cBelow[0], this.cBelow[1], this.cBelow[2]])
            colors.push([c[0], c[1], c[2], 1]);
        }

        return colors;
    }

    setThreshold(t) {

        this.threshold = t;
        if (this.showGradient) {
            this.updateColor();
        }

    }

    draw(programInfo, bufferAttributes) {
        let buffers = this.getBuffers();

        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }

        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    getType() {
        return this.gl.POINTS;
    }

    getBuffers() {
        return [this.vBuff, this.cBuff];
    }

    getNumVertices() {
        return this.numVertices;
    }

    initThreshold() {
        let colors = [];

        for (let i = 0; i < this.vertices.length; i++) {
            let mapped = this.map(this.vertices[i]);

            let sample = this.perlin.sample(mapped[0], mapped[1], mapped[2]);
            if (sample < this.threshold) {
                colors.push(this.cBelow);
            } else {
                colors.push(this.cAbove);
            }
        }


        return colors;
    }
}