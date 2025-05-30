"use strict";






var then = 0;
var animID;
var isPlaying = false;
const pressedKeys = {}
var cameraAtInc = .1;
var angleInc = .05;
var z = 0.1;
var dim = 3;
const perlin = new Perlin2D();
var numberOfSamples = 50;
var threshold = .55;
var displayDimension = 3;

var depthChangeInc = .1
var noiseDisplay;
var marchingSquares;
var sampleSize = 6;
var rOrigin = [0, 0, z];


var generateMap = (dO, dDim, rO, rDim) => {
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


window.onload = () => {
    var canvas = document.getElementById("gl-canvas");

    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }



    var programDataSparse = new ProgramData(gl, "vertex-shader-sparse", "fragment-shader-sparse",
        ["vPosition", "a_color"],);



    var sparseUniforms = {
        "modelView": 0,
        "projection": 0,
        "objectMatrix": flatten(identity()),
    }

    var programUniformCorrespondence = (program, uniforms) => {
        for (const [name] of Object.entries(uniforms)) {
            program.getUniformInfo(name);
        }

        return {
            program: program,
            uniforms: uniforms,
            drawableObjects: []
        }
    }

    var DrawableTypes = {
        "Sparse": programUniformCorrespondence(programDataSparse, sparseUniforms),
    }



    //let samples = generateSamples(dim, z);


    let sampleRange = [sampleSize, sampleSize, 0];

    var perlinMap = generateMap([0, 0, 0], [displayDimension, displayDimension, 1], rOrigin, sampleRange);
    let numSamples = [numberOfSamples, numberOfSamples, 1];
    noiseDisplay = new NoiseDisplay(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold, true);
    marchingSquares = new MarchingSquares(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold,);




    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var aspect = canvas.width / canvas.height;

    var cameraLocation = [0, 0, 12];
    var lookingAt = [0, 0, 0];
    var camera = new Camera(cameraLocation, lookingAt, [0, 1, 0]);
    var boundingNear = .3;
    var boundingFar = 100;
    var viewAngle = 30;
    let mvMatrix = camera.getViewMatrix();
    let eye = camera.getPosition();

    let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);


    programDataSparse.use();
    sparseUniforms["modelView"] = flatten(mvMatrix);
    sparseUniforms["projection"] = flatten(pMatrix);
    manageControls();

    startAnimation();

    function startAnimation() {
        if (isPlaying) {
            cancelAnimationFrame(animID);
        }
        isPlaying = true;
        animID = requestAnimationFrame(render);
    }


    function render(now) {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        sparseUniforms["modelView"] = flatten(camera.getViewMatrix());

        DrawableTypes["Sparse"].drawableObjects.push(
            DrawableObject(noiseDisplay, programDataSparse,
                [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],),
            DrawableObject(marchingSquares, programDataSparse,
                [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT),],)
        )

        DrawableTypes["Sparse"].drawableObjects.forEach((drawableObject) => {
            setUniforms(sparseUniforms, programDataSparse);
            drawableObject.draw();
        });

        DrawableTypes["Sparse"].drawableObjects = [];



        let sampleRange = [sampleSize, sampleSize, 0];
        rOrigin[2] += .003;

        perlinMap = generateMap([0, 0, 0], [displayDimension, displayDimension, 1], rOrigin, sampleRange);
        let numSamples = [numberOfSamples, numberOfSamples, 1];
        noiseDisplay = new NoiseDisplay(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold, false);
        marchingSquares = new MarchingSquares(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold,);
        // noiseDisplay.updateSamples(generateSamples(dim, z))

        animID = requestAnimationFrame(render);
    }



    function LookAtBox(camera) {
        let size = .2;
        let position = camera.lookingAt;
        return DrawableObject(new TransparentBox(gl, size, position), programDataSparse,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
        );
    }

    function manageControls() {


        document.addEventListener('keydown', (event) => {
            pressedKeys[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            delete pressedKeys[event.key];
        });



        document.addEventListener('keydown', function (event) {





            if (event.key == '0') {
                camera.setLocked(!camera.isLocked());
            }

            var tInc = .01;

            if (pressedKeys["t"]) {
                switch (event.key) {
                    case ("ArrowLeft"):
                        threshold -= .01;
                        break;
                    case ("ArrowRight"):
                        threshold += .01;
                        break;
                    case ("ArrowUp"):
                        numberOfSamples += 1;
                        break;
                    case ("ArrowDown"):
                        numberOfSamples -= 1;
                        break;
                    case ("i"):
                        sampleSize -= .01;
                        break;
                    case ("o"):
                        sampleSize += .01;
                        break;
                    case ("w"):
                        rOrigin[1] += tInc;
                        break;
                    case ("a"):
                        rOrigin[0] -= tInc;
                        break;
                    case ("s"):
                        rOrigin[1] -= tInc;
                        break;
                    case ("d"):
                        rOrigin[0] += tInc;
                        break;
                    case ("1"):
                        rOrigin[2] += tInc;
                        break;
                    case ("2"):
                        rOrigin[2] -= tInc;


                }



                let sampleRange = [sampleSize, sampleSize, 0];

                perlinMap = generateMap([0, 0, 0], [displayDimension, displayDimension, 1], rOrigin, sampleRange);
                let numSamples = [numberOfSamples, numberOfSamples, 1];
                noiseDisplay = new NoiseDisplay(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold, true);
                marchingSquares = new MarchingSquares(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold,);

                console.log("Origin: " + rOrigin + " | sampleRange: " + sampleRange + " | thresh: " + threshold)
            }

            else if (pressedKeys["Shift"]) {
                //adjustControlArray(event, lookingAt, lookInc);

                switch (event.key) {
                    case ("ArrowLeft"):
                        camera.rotateTheta(angleInc);
                        break;
                    case ("ArrowRight"):
                        camera.rotateTheta(-angleInc);
                        break;
                    case ("ArrowDown"):
                        camera.rotatePhi(-angleInc);
                        break;
                    case ("ArrowUp"):
                        camera.rotatePhi(angleInc);
                        break;
                    case ("f"):
                    case ("F"):
                        camera.forward(cameraAtInc)
                        break;
                    case ("b"):
                    case ("B"):
                        camera.backward(cameraAtInc)
                        break;
                    case ("r"):
                    case ("R"):
                        camera.right(cameraAtInc)
                        break;
                    case ("l"):
                    case ("L"):
                        camera.left(cameraAtInc)
                        break;
                    case ("i"):
                    case ("I"):
                        camera.updateFocusDepth(1 - depthChangeInc);
                        break;
                    case ("o"):
                    case ("O"):
                        camera.updateFocusDepth(1 + depthChangeInc);
                        break;
                    case ("n"):
                    case ("N"):
                        boundingNear += boundingInc;
                        break;
                    case ("e"):
                    case ("E"):
                        boundingFar += boundingInc;
                        break;
                    case ("a"):
                    case ("A"):
                        viewAngle -= angleInc;
                        break;

                }
            }
            else {
                //adjustControlArray(event, cameraLocation, cameraAtInc);

                switch (event.key) {
                    case ("ArrowLeft"):
                        camera.updatePosition([-cameraAtInc, 0, 0]);
                        break;
                    case ("ArrowRight"):
                        camera.updatePosition([cameraAtInc, 0, 0]);
                        break;
                    case ("ArrowDown"):
                        camera.updatePosition([0, -cameraAtInc, 0]);
                        break;
                    case ("ArrowUp"):
                        camera.updatePosition([0, cameraAtInc, 0]);
                        break;
                    case ("f"):
                    case ("F"):
                        camera.updatePosition([0, 0, -cameraAtInc]);
                        break;
                    case ("b"):
                    case ("B"):
                        camera.updatePosition([0, 0, cameraAtInc]);
                        break;
                    case ("n"):
                    case ("N"):
                        boundingNear -= boundingInc;
                        break;
                    case ("e"):
                    case ("E"):
                        boundingFar -= boundingInc;
                        break;
                    case ("a"):
                    case ("A"):
                        viewAngle = Math.min(355, viewAngle + angleInc);
                        break;
                }

            }


            //startAnimation();
            render();
        });
    }
}








function adjustControlArray(event, array, inc) {


    switch (event.key) {
        case ("ArrowLeft"):
            array[0] -= inc;
            break;
        case ("ArrowRight"):
            array[0] += inc;
            break;
        case ("ArrowDown"):
            array[1] -= inc;
            break;
        case ("ArrowUp"):
            array[1] += inc;
            break;
        case ("f"):
        case ("F"):
            array[2] -= inc;
            break;
        case ("b"):
        case ("B"):
            array[2] += inc;
            break;
    }


}