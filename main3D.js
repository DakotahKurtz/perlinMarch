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
let sampleSize = 1;
var numberOfSamples = 30;
var threshold = .5;
var displayDimension = 1;
var displayGrid = [displayDimension, displayDimension, displayDimension];

var depthChangeInc = .1
var noiseDisplay;
var rOrigin = [0, 0, z];
var lightPosition = vec4(.5, .5, 0, 1);

var worldLight = lighting(
    [.6, .6, .6, 1],
    [.6, .6, .6, 1],
    [.9, .9, .9, 1],
)

var cubeMaterials = materials(
    lighting(
        [.6, .6, .6, 1],
        [.6, .6, .6, 1],
        [.9, .9, .9, 1]),
    15);


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



    var programDataPhong = new ProgramData(gl, "vertex-shader-phong", "fragment-shader-phong",
        ["vPosition", "vNormal", "a_color"],);
    var programDataSparse = new ProgramData(gl, "vertex-shader-sparse", "fragment-shader-sparse",
        ["vPosition", "a_color"],);



    var phongUniforms = {
        "modelView": 0,
        "projection": 0,
        "objectMatrix": flatten(identity()),
        "ambientProduct": 0,
        "diffuseProduct": 0,
        "specularProduct": 0,
        "lightPosition": 0,
        "shininess": 0,
        "eyePosition": 0,
    }

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
        "Phong": programUniformCorrespondence(programDataPhong, phongUniforms),
        "Sparse": programUniformCorrespondence(programDataSparse, sparseUniforms),
    }


    let sampleRange = [sampleSize, sampleSize, sampleSize];

    var perlinMap = generateMap([0, 0, 0], [displayDimension, displayDimension, displayDimension], rOrigin, sampleRange);
    let numSamples = [numberOfSamples, numberOfSamples, numberOfSamples];
    // noiseDisplay = new NoiseDisplay(gl, perlin, perlinMap.map, numSamples, displayDimension, threshold, true);
    let marchingCubes;


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var aspect = canvas.width / canvas.height;

    var cameraLocation = [.5, .5, 5];
    var lookingAt = [.5, .5, 0];
    var camera = new Camera(cameraLocation, lookingAt, [0, 1, 0]);
    var boundingNear = .3;
    var boundingFar = 100;
    var viewAngle = 30;
    let mvMatrix = camera.getViewMatrix();
    let eye = camera.getPosition();

    let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);


    sparseUniforms["modelView"] = flatten(mvMatrix);
    sparseUniforms["projection"] = flatten(pMatrix);
    phongUniforms["modelView"] = flatten(mvMatrix);
    phongUniforms["projection"] = flatten(pMatrix);
    manageControls();

    startAnimation();

    function startAnimation() {
        if (isPlaying) {
            cancelAnimationFrame(animID);
        }
        isPlaying = true;
        animID = requestAnimationFrame(render);
    }

    function setMaterials(uniformData, materials, worldLight) {
        let ambientProduct = mult(materials.ambient, worldLight.ambient);
        let diffuseProduct = mult(materials.diffuse, worldLight.diffuse);
        let specularProduct = mult(materials.specular, worldLight.specular);
        uniformData["ambientProduct"] = flatten(ambientProduct);
        uniformData["diffuseProduct"] = flatten(diffuseProduct);
        uniformData["specularProduct"] = flatten(specularProduct);
        uniformData["shininess"] = materials.shininess;

    }


    function render(now) {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // phongUniforms["modelView"] = flatten(camera.getViewMatrix());

        numSamples = [numberOfSamples, numberOfSamples, numberOfSamples]
        sampleRange = [sampleSize, sampleSize, sampleSize];
        perlinMap = generateMap([0, 0, 0], [displayDimension, displayDimension, displayDimension], rOrigin, sampleRange);

        marchingCubes = new MarchingCubes(gl, perlin, perlinMap.map, numSamples, displayGrid, threshold);




        // DrawableTypes["Phong"].drawableObjects.push(
        // DrawableObject(marchingCubes, programDataSparse,
        //     [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)], cubeMaterials,),
        // )

        eye = camera.getPosition();
        phongUniforms["eyePosition"] = flatten(eye);
        phongUniforms["lightPosition"] = flatten(lightPosition);


        DrawableTypes["Phong"].drawableObjects.push(
            LookAtBox(camera),
            DrawableObject(marchingCubes, programDataPhong,
                [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
                cubeMaterials,),
        )

        phongUniforms["modelView"] = flatten(camera.getViewMatrix());

        DrawableTypes["Phong"].drawableObjects.forEach((drawableObject) => {
            programDataPhong.use();
            setMaterials(phongUniforms, drawableObject.materials, worldLight)

            setUniforms(phongUniforms, programDataPhong);
            drawableObject.draw();
        });

        DrawableTypes["Phong"].drawableObjects = [];

        //animID = requestAnimationFrame(render);
    }



    function LookAtBox(camera) {
        let size = .2;
        let position = camera.lookingAt;
        return DrawableObject(new TransparentBox(gl, size, position), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            cubeMaterials);
    }

    function manageControls() {


        document.addEventListener('keydown', (event) => {
            pressedKeys[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            delete pressedKeys[event.key];
        });



        document.addEventListener('keydown', function (event) {


            if (event.key == '9') {
                console.log(camera.getLog())
            }


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

                console.log("numSamples: " + numSamples + "Origin: " + rOrigin + " | sampleRange: " + sampleRange + " | thresh: " + threshold)
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


            startAnimation();
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

