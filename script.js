// script.js

let scene, camera, renderer;
let player = { height: 1.8, speed: 0.1, turnSpeed: Math.PI * 0.01 };
let keys = { forward: false, backward: false, left: false, right: false };

// Simplex noise for terrain generation
let noise = new SimplexNoise();

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Add basic lighting
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10).normalize();
    scene.add(light);

    // Setup controls
    document.addEventListener('keydown', (event) => handleKey(event, true));
    document.addEventListener('keyup', (event) => handleKey(event, false));
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    
    // Generate terrain
    generateTerrain();

    camera.position.set(0, player.height, 5);
}

function handleKey(event, isPressed) {
    switch (event.code) {
        case 'KeyW': keys.forward = isPressed; break;
        case 'KeyS': keys.backward = isPressed; break;
        case 'KeyA': keys.left = isPressed; break;
        case 'KeyD': keys.right = isPressed; break;
    }
}

function onMouseMove(event) {
    // Handle mouse movement for camera rotation
    let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    camera.rotation.y -= movementX * player.turnSpeed;
    camera.rotation.x -= movementY * player.turnSpeed;
    
    // Limit vertical camera rotation
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

function generateTerrain() {
    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let loader = new THREE.TextureLoader();
    let blockTexture = loader.load('Textures/grass.png'); // Ensure you have the texture in the folder
    let material = new THREE.MeshBasicMaterial({ map: blockTexture });

    for (let x = -10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            let height = Math.floor(noise.noise2D(x / 10, z / 10) * 5);
            for (let y = 0; y < height; y++) {
                let block = new THREE.Mesh(geometry, material);
                block.position.set(x, y, z);
                scene.add(block);
            }
        }
    }
}

function onClick(event) {
    // Detect block clicked on
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        let block = intersects[0].object;
        scene.remove(block);  // Simulate block breaking
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Player movement
    if (keys.forward) camera.position.z -= player.speed * Math.cos(camera.rotation.y);
    if (keys.backward) camera.position.z += player.speed * Math.cos(camera.rotation.y);
    if (keys.left) camera.position.x -= player.speed * Math.sin(camera.rotation.y);
    if (keys.right) camera.position.x += player.speed * Math.sin(camera.rotation.y);

    renderer.render(scene, camera);
}
