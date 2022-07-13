const checkMobile = () => {
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        // true for mobile device
        document.body.classList.add('isMobile')
    }else {
        document.body.classList.remove('isMobile')
    }
}

checkMobile()

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
let rightImg;

// const GOLDEN_COLOR = new BABYLON.Color3(1, 0.76, 0.35);
const GOLDEN_COLOR = new BABYLON.Color3(0.65, 0.41, 0);

const contentOverlay = document.getElementById('contentOverlay');
const frontBigImg = document.getElementById('front-image');
const backBigImg = document.getElementById('back-image');
const rightBigImg = document.getElementById('right-image');
const leftBigImg = document.getElementById('left-image');
const video = document.getElementById('video');
const bgContainer = document.getElementById('bgContainer');

let mouseX, scene = null, cubeModel = null, isMouseDown = false, isDragging = false, cubeFaceMat = false, rotation = 0, step = (Math.PI/4.00), envVolume = 0.03, gl = null, gl2 = null;

let meshArrayGlow = [],
meshArrayGlow2 = [],
meshArrayNotGlow = [],
materialsToAnimate = [],
cubeMesh = null,
animateCube = false,
oldCubeRotation = 0,
oldCubeRotationStep = 0,
clickableMeshes = [],
mirror = null,
mirrorOverlayPlane = null,
lightBelowCube = null

let timePointerDown, timePointerUp, camera;

let hasDragEnded = true;
// Add your code here matching the playground format
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.0, 0.0, 0.0, 1);
    //scene.createDefaultCamera(true);
    scene.environmentIntensity = 1;
    //BABYLON.MeshBuilder.CreateBox("box", {});

    //load Modelf
    BABYLON.SceneLoader.Append("./assets/", "rare-cube-with-clickables.glb", scene, function (meshes) {

        gl = new BABYLON.GlowLayer("glow", scene, { 
            mainTextureSamples: 16,
            blurKernelSize: 320
        });

        gl.intensity = 1.8;

        // gl.intensity = 0;
        // gl2.intensity = 0;

        cubeModel = scene.meshes[0];
        cubeModel.rotationQuaternion = null
        scene.meshes[0].scaling = new BABYLON.Vector3(1, 1, 1);       
        if(document.body.classList.contains('isMobile')) {
            scene.meshes[0].scaling = new BABYLON.Vector3(.45, .45, .45);
        }
        scene.meshes[0].position = new BABYLON.Vector3(0,0,0);
        gl.customEmissiveColorSelector = function(element, subMesh, material, result) {
            if (element.name === "White edge") {
                result.set(1, 0.76, 0.35, 1);
            }else if(element.name == 'Plane.005') {
                result.set(0.3, 0.19, 0, 1);
            }else {
                result.set(0, 0, 0, 0);
            }
        }
        scene.meshes.forEach(element => {
            if(element.name == 'Green edge' || element.name == 'White edge') {
                meshArrayGlow.push(element)
                if(element.name == 'White edge') {
                    // element.material.color = new BABYLON.Color3(1, 0.76, 0.35);
                    // element.material.albedoColor = new BABYLON.Color3(0, 0, 0);
                    // element.material._emissiveColor = new BABYLON.Color3(0.3, 0.19, 0);
                    element.material._emissiveColor = new BABYLON.Color3(0, 0, 0);
                    element.material.albedoColor = new BABYLON.Color3(0.3, 0.19, 0);
                    // element.material._reflectivityColor = GOLDEN_COLOR;
                }
                if(element.name == 'Green edge') {
                    element.material._emissiveColor = new BABYLON.Color3(0, 0, 0);
                    element.material.albedoColor = GOLDEN_COLOR;
                }
            }else {
                meshArrayNotGlow.push(element)
            }
            if(element.name == 'Plane.005') {
                element.material.albedoColor = new BABYLON.Color3(0, 0, 0);
                element.material._emissiveColor = new BABYLON.Color3(0.3, 0.19, 0);
                element.material.emissiveIntensity = .9
                element.material.roughness = 0
            }
            if(element.name == 'concrete_floor')
                element.isVisible = false
            if(element.name == 'Plane')
                element.isVisible = false
            if(element.name == 'Plane.001' || element.name == 'Plane.002' || element.name == 'Plane.003' || element.name == 'Plane.004') {
                if(element.name == 'Plane.001') {
                    const data = {
                        'clickable' : element,
                        'actor' : scene.getMeshByName("image cube_primitive2")
                    }
                    clickableMeshes.push(data)
                }
                if(element.name == 'Plane.002') {
                    const data = {
                        'clickable' : element,
                        'actor' : scene.getMeshByName("image cube_primitive0")
                    }
                    clickableMeshes.push(data)
                }
                if(element.name == 'Plane.003') {
                    const data = {
                        'clickable' : element,
                        'actor' : scene.getMeshByName("image cube_primitive3")
                    }
                    clickableMeshes.push(data)
                }
                if(element.name == 'Plane.004') {//left
                    const data = {
                        'clickable' : element,
                        'actor' : scene.getMeshByName("image cube_primitive1")
                    }
                    clickableMeshes.push(data)
                }
            }
        });
        // const mainAnim = scene.getAnimationGroupByName("All Animations");
        // mainAnim.play()
        // const cubeFaceMat = scene.getMaterialByName("glass");
        // console.log(cubeFaceMat);
        // cubeFaceMat.alpha = 0.

        scene.materials.forEach(element => {
            if(element.name == '__GLTFLoader._default') {
                element.hasAlpha = true
                element.alpha = 0
                element.MATERIAL_ALPHABLEND = true
                element.transparencyMode = element.MATERIAL_ALPHABLEND
            }
            if(element.name == 'Material.005' || element.name == 'Material.006' || element.name == 'Material.007' || element.name == 'Material.008') {
                // // materialsToAnimate.push(element)
                element.environmentIntensity = 1
                element.emissiveIntensity = 1
                element.specularIntensity = 0
                element.hasAlpha = true
                element.alpha = .999
                element.alphaCutOff = 1
                element.MATERIAL_ALPHABLEND = true
                element.transparencyMode = element.MATERIAL_ALPHABLEND
                element.alphaMode = BABYLON.Engine.ALPHA_PREMULTIPLIED;

            }else {
                
                element.roughness = 0.055
            }
            
            if(element.name == 'Material.001') {
                // element.emissiveIntensity = 3;
                element.metallic = 1
            }        
        });
        
        let hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./assets/environment-texture.env", scene);
        scene.environmentTexture = hdrTexture;
       
        let frontImg = new BABYLON.Texture("./assets/Front.jpg", scene);
        frontImg.invertY = true;

        rightImg = new BABYLON.VideoTexture("video", "./assets/video-right-sm-1.mp4", scene, true);
        rightImg.video.muted = true;
        //rightImg.invertY = true;
        let leftImg = new BABYLON.Texture("./assets/Left.jpg", scene);
        // leftImg.invertY = true;
        
        let backImg = new BABYLON.Texture("./assets/Back.jpg", scene);
        // backImg.invertY = true;
        // var leftImgSpec = new BABYLON.Texture("./assets/signature-specularmap.jpg", scene);
        // leftImgSpec.invertY = true;
        // var rightImg = new BABYLON.Texture("./assets/Right.jpg", scene);
        // // rightImg.invertX = true;
        scene.getMaterialByName('Material.005')._emissiveTexture = leftImg;
        scene.getMaterialByName('Material.005')._albedoTexture = leftImg;
        scene.getMaterialByName('Material.005').roughness = 0.15

        scene.getMaterialByName('Material.006')._emissiveTexture = frontImg;
        scene.getMaterialByName('Material.006')._albedoTexture = frontImg;
        // scene.getMaterialByName('Material.005').emissiveIntensity = 1.0;
        scene.getMaterialByName('Material.006').roughness = 0.15
        
        scene.getMaterialByName("Material.007")._emissiveTexture = rightImg;
        scene.getMaterialByName("Material.007")._albedoTexture = rightImg;
        scene.getMaterialByName('Material.007').emissiveIntensity = 1.0;
        
        scene.getMaterialByName("Material.008")._emissiveTexture = backImg;
        scene.getMaterialByName("Material.008")._albedoTexture = backImg;
        scene.getMaterialByName('Material.008').emissiveIntensity = 1.0;
        // Mirror
        
        
        if(document.body.classList.contains('isMobile')) {
            lightBelowCube = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-7.5, 0, 0), new BABYLON.Vector3(8, -8, 0), Math.PI / 2, 20, scene);
            lightBelowCube.intensity = 0.7;
        }else {
            lightBelowCube = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 0, 0), new BABYLON.Vector3(8, -8, 0), Math.PI / 2, 20, scene);
            lightBelowCube.intensity = 0.5;
        }
        
        cubeMesh = scene.getMeshByName("Cube");
        // Mirror
        mirror = BABYLON.Mesh.CreateBox("Mirror", 1.0, scene);
        mirror.scaling = new BABYLON.Vector3(500.0, 1, 500.0);
        mirror.material = new BABYLON.StandardMaterial("mirror", scene);
        mirror.material.color = new BABYLON.Color3.FromHexString("#000000");
        // mirror.material.emissiveIntensity = 0.4;
        mirror.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", {ratio: 1}, scene, true);
        if(document.body.classList.contains('isMobile')) {
            mirror.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -.26);
        }else {
            mirror.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -.49);
        }
        mirror.material.reflectionTexture.renderList = meshArrayNotGlow.concat(meshArrayGlow);
        mirror.material.reflectionTexture.level = 0.5;
        mirror.material.reflectionTexture.adaptiveBlurKernel = 24;
        mirror.material.specularColor = new BABYLON.Color3(0, 0, 0);
        // mirror.bumpTexture = new BABYLON.Texture("./assets/Seamless_Concrete_Floor_Texture_NORMAL.jpg", scene);
        // mirror.material.diffuseTexture = new BABYLON.Texture("./assets/Seamless_Concrete_Floor_Texture_NORMAL.jpg", scene);
        mirror.material.specularTexture = new BABYLON.Texture("./assets/Seamless_Concrete_Floor_Texture_NORMAL.jpg", scene);
        mirror.material.specularTexture.uScale = 16;
        mirror.material.specularTexture.vScale = 16;
        mirror.position = new BABYLON.Vector3(0, -5, 0);
        mirror.environmentIntensity = 0	
        gl.addExcludedMesh(mirror);
        materialsToAnimate.push(mirror.material)
        
        mirrorOverlayPlane = BABYLON.Mesh.CreateBox("ground", 1.0, scene);
        mirrorOverlayPlane.scaling = new BABYLON.Vector3(500.0, .1, 500.0);
        if(document.body.classList.contains('isMobile')) {
            mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.4, 0);
        }else {
            mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.5, 0);
        }
        mirrorOverlayPlane.rotation.y = -Math.PI/2
        
        var pbr = new BABYLON.StandardMaterial("pbr", scene);
        mirrorOverlayPlane.material = pbr;

        pbr.diffuseTexture = new BABYLON.Texture("./assets/concrete-polished.jpg", scene);
        pbr.diffuseTexture.uScale = 32;
        pbr.diffuseTexture.vScale = 32;
        pbr.specularTexture = new BABYLON.Texture("./assets/concrete-polished.jpg", scene);
        pbr.specularTexture.uScale = 32;
        pbr.specularTexture.vScale = 32;

        // pbr.albedoTexture.uScale = 16;
        // pbr.albedoTexture.vScale = 16;
        pbr.metallic = 0.5;
        pbr.roughness = 0.4;
        pbr.hasAlpha = true
        pbr.alpha = 0.8
        pbr.environmentIntensity = 0
        // // Main material	

        // // Fog
        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogColor = scene.clearColor;
        scene.fogStart = 30.0;
        scene.fogEnd = 130.0;
        
        //check device orientation
        if(sizes.width / sizes.height >= 1) {
            console.log('landscape');
            
            scene.meshes[0].scaling = new BABYLON.Vector3(0.8,0.8,0.8);
            mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.8, 0);
            mirror.material.reflectionTexture.mirrorPlane.d = -.4
        }else if(sizes.width / sizes.height <= 1) {
            console.log('portrait');

            scene.meshes[0].scaling = new BABYLON.Vector3(.45,.45,.45);
            mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.4, 0);
            mirror.material.reflectionTexture.mirrorPlane.d = -.26
        }

        // console.log(scene.meshes[0]);
    });

    camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    const c = Math.PI /2.0;
    camera.radius = 2.0;
    camera.lowerBetaLimit = c;
    camera.upperBetaLimit = c;

    camera.idleRotationWaitTime = 6000;
    camera.panningAxis = new BABYLON.Vector3(0,0,0);
    camera.angularSensibilityX = 10000;
    camera.angularSensibilityY = 10000;

    // camera.attachControl(canvas, true);
    // camera.inputs.remove(camera.inputs.attached.mousewheel);

    return scene;
};

scene = createScene(); //Call the createScene function

setTimeout(() => {
    animateCube = true
}, 1500);

//Audio
var music = new BABYLON.Sound("music", "./assets/envAudio.wav", scene,null, {
    volume: envVolume,
    loop: true
});

let musicPlayed = false

const mouseClick = new BABYLON.Sound("mouseClick", "./assets/mouse-click.wav", scene,null, {
volume: 0.2
});

//Audio
let animationIntervalTimer = 150
let animationCounter = 0
let animInterval = null
let totalAnimCount = 0


// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {

    TWEEN.update();

    if(cubeModel && animateCube){
        cubeModel.rotation.y += 0.002
    }

    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});

function toggleContentOverlay(){

    leftBigImg.children[0].pause();
    contentOverlay.style.opacity = 0;
    contentOverlay.style.zIndex = -1;

}


// Mouse interactions

let x = 0.0;
let easing = 0.01;
let modelRotation = 0
let autoRotateTimeout = null

scene.onPointerDown = function(event){
    isMouseDown = true
    mouseX = event.clientX
    animateCube = false
}

function animateCubeRotation(angle) {
    let rotateAngle = angle
    const direction = angle/Math.abs(angle)
    let cycles = Math.floor(cubeModel.rotation.y/(2*Math.PI))
    if(angle == 0) {
        const cubeTempAngle = cubeModel.rotation.y%(2*Math.PI)

        const closest = [0, (2*Math.PI)].reduce((a, b) => {
            return Math.abs(b - cubeTempAngle) < Math.abs(a - cubeTempAngle) ? b : a;
        });

        rotateAngle = closest
    }

    // console.log(cycles,(cycles*(2*Math.PI))+rotateAngle,rotateAngle,cubeModel.rotation.y);
    
    gsap.fromTo(cubeModel.rotation, 
        {
            y: cubeModel.rotation.y
        },
        {
            y: (cycles*(2*Math.PI))+rotateAngle,
            duration: 2,
            ease: "power2.out"
        }
    )
    new TWEEN.Tween(camera)
    .to({radius : 1.8 }, 2000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
}

let pointerUpAnimating = false

scene.onPointerUp = function () {
    let toAnimateCamera = false,
    angle = 0

    isMouseDown = false
    
    if(document.body.classList.contains('isMobile')) {
        isDragging = false
    }else {
        if(isDragging) {
            setTimeout(() => {
                isDragging = false
            }, 10);
        }
    }
    
    console.log('up', isDragging, isMouseDown);
    if(!isDragging){

        var pickResult = scene.pick(scene.pointerX, scene.pointerY);

        if (pickResult.hit && !isDragging) {
            
            if(camera.radius != 1.8) {
                const clickedMeshName = pickResult.pickedMesh.name;
                if(clickedMeshName === "Plane.004"){//front panel
                    toAnimateCamera = true
                    angle = 0
                }else if(clickedMeshName === "Plane.002"){
                    toAnimateCamera = true
                    angle = Math.PI/2
                }else if(clickedMeshName === "Plane.003"){//back panel
                    toAnimateCamera = true
                    angle = Math.PI
                }else if(clickedMeshName === "Plane.001"){
                    toAnimateCamera = true
                    angle = 3*Math.PI/2
                    rightImg.video.currentTime = 0
                    rightImg.video.muted = false
                }else {
                    toAnimateCamera = false
                }

                if(toAnimateCamera) {
                    camera.detachControl(canvas, true);
                    animateCubeRotation(angle)
                }
            }else {
                if(camera.radius == 1.8) {
                    autoRotateTimeout = setTimeout(() => {
                        animateCube = true
                        rightImg.video.muted = true
                    }, 2500);
                }
            }

        }else {
            if(camera.radius != 2) {
                new TWEEN.Tween(camera)
                .to({radius : 2.0 }, 2000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start(); 
                autoRotateTimeout = setTimeout(() => {
                    animateCube = true
                    rightImg.video.muted = true
                }, 2500);
            }
        }

    }else{
        new TWEEN.Tween(camera)
        .to({radius : 2.0 }, 200)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    }


    if(rightImg) {
        rightImg.video.play();
    }

}

function idlBehav() {
    animateCube = true
}

let moveIdleTimer = null

scene.onPointerMove = function(event){
    console.log("pointer");
    if(camera.radius == 15 && !isDragging) {
        clearTimeout(moveIdleTimer)
        moveIdleTimer = setTimeout(idlBehav, 2000);
    }

    if(isMouseDown) {
        clearTimeout(autoRotateTimeout)
        isDragging = true
        bgContainer.classList.add('active')
    }else {
        bgContainer.classList.remove('active')
    }
    
    const delta = -(event.offsetX - mouseX)
    /*if(Math.abs(delta) > 0.01){
        isDragging = true;
    }*/
    
    if(isDragging){
        animateCube = false
        // const rotation = (cubeModel.rotation.y - (0.25 * delta * 100) - x);
        modelRotation = cubeModel.rotation.y + ((delta * 0.06));

        const animation = gsap.fromTo(cubeModel.rotation, 
            {
                y: cubeModel.rotation.y
            },
            {
                y: modelRotation,
                duration: 1.8,
                ease: "power2.out"
            }
        )
        
    }else {
        
        if(clickableMeshes.length > 0) {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            let selectedMesh = null
            if(pickResult.hit) {
                const clickedMeshName = pickResult.pickedMesh?.name;
                clickableMeshes.forEach(element => {
                    if(clickedMeshName === element.clickable.name){
                        selectedMesh = element
                        // element.actor.material._emissiveColor = new BABYLON.Color3(0, 0.68, 0.64);
                    }else {
                        // element.actor.material._emissiveColor = new BABYLON.Color3(1, 1, 1);
                    }
                });
    
                if(selectedMesh != null) {
                    if (clickedMeshName === selectedMesh.clickable.name) {
                        gl.customEmissiveColorSelector = function(element, subMesh, material, result) {
                            
                            if(element.name == selectedMesh.actor.name) {
                                result.set(0.17, 0.13, 0, 0);
                            }else if (element.name === "White edge") {
                                result.set(1, 0.76, 0.35, 1);
                            }else if(element.name == 'Plane.005') {
                                result.set(0.3, 0.19, 0, 1);
                            }else {
                                result.set(0, 0, 0, 0);
                            }
                        }
                    }
                }
            }else {
                gl.customEmissiveColorSelector = function(element, subMesh, material, result) {
                    if (element.name === "White edge") {
                        result.set(1, 0.76, 0.35, 1);
                    }else if(element.name == 'Plane.005') {
                        result.set(0.3, 0.19, 0, 1);
                    }else {
                        result.set(0, 0, 0, 0);
                    }
                }
    
            }
        }

    }
    mouseX = event.offsetX;

}

const checkObjectSizePositions = () => {
    checkMobile()
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    if(scene != null && cubeModel != null) {
        if(document.body.classList.contains('isMobile')){
        
            lightBelowCube.position.x = -7.5
            if(sizes.width / sizes.height >= 1) {
                console.log('landscape');
                
                scene.meshes[0].scaling = new BABYLON.Vector3(0.8,0.8,0.8);
                mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.8, 0);
                mirror.material.reflectionTexture.mirrorPlane.d = -.4
            }else if(sizes.width / sizes.height <= 1) {
                console.log('portrait');

                scene.meshes[0].scaling = new BABYLON.Vector3(.45,.45,.45);
                mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.4, 0);
                mirror.material.reflectionTexture.mirrorPlane.d = -.26
            }
        }else {
            scene.meshes[0].scaling = new BABYLON.Vector3(1,1,1);
            mirrorOverlayPlane.position = new BABYLON.Vector3(0, -1.5, 0);
            mirror.material.reflectionTexture.mirrorPlane.d = -.49
            lightBelowCube.position.x = -4
        }
    }
}

window.addEventListener('resize', checkObjectSizePositions)