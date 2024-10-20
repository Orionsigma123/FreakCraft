let scene, camera, renderer, controls;
const blockSize = 1;
const worldSize = 16;
let raycaster, mouse;

init();
animate();

function init() {
    // Scene and Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 10;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add a basic light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);

    // Mouse controls
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Procedural World Generation (Flat terrain for simplicity)
    generateWorld();

    // Event listeners for mouse clicks (left for placing, right for breaking)
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
}

function generateWorld() {
    // Generate simple flat terrain of blocks
    for (let x = 0; x < worldSize; x++) {
        for (let z = 0; z < worldSize; z++) {
            const block = createBlock();
            block.position.set(x * blockSize, 0, z * blockSize);
            scene.add(block);
        }
    }
}

function createBlock() {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const block = new THREE.Mesh(geometry, material);
    block.userData.isBlock = true; // Custom property to identify blocks
    return block;
}

function onMouseDown(event) {
    if (event.button === 0) {
        // Left click to place block
        placeBlock();
    } else if (event.button === 2) {
        // Right click to break block
        breakBlock();
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function placeBlock() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectedBlock = intersects[0].object;
        const newBlock = createBlock();

        // Place the new block on top of the intersected block
        newBlock.position.copy(intersectedBlock.position).add(intersects[0].face.normal);
        newBlock.position.round(); // Align to grid
        scene.add(newBlock);
    }
}

function breakBlock() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectedBlock = intersects[0].object;
        if (intersectedBlock.userData.isBlock) {
            scene.remove(intersectedBlock);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
