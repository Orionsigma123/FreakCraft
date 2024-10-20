// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable alpha for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the scene
renderer.setClearColor(0x87CEEB, 1); // Sky blue color

// Generate a simple block world using Perlin noise
const blockSize = 1;
const worldWidth = 50; // Increase for larger worlds
const worldHeight = 50; // Increase for larger worlds
const noiseScale = 0.1; // Adjust for terrain smoothness
const simplex = new SimplexNoise();

// Function to create a block
function createBlock(x, y, z, color) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    scene.add(block);
}

// Generate the world using Perlin noise and ensure no holes
for (let x = 0; x < worldWidth; x++) {
    for (let z = 0; z < worldHeight; z++) {
        // Get height based on noise value
        const height = Math.floor(simplex.noise2D(x * noiseScale, z * noiseScale) * 5); // Max height of 5 blocks
        const blockType = height > 0 ? 0x00ff00 : 0x8B4513; // Green for grass, brown for dirt
        for (let y = 0; y <= height; y++) {
            createBlock(x, y, z, blockType);
        }
    }
}

// Position the camera to be just above the ground
camera.position.set(25, 1.5, 25); // Adjust height to be just above the blocks

// Player controls
const playerSpeed = 0.1;
const jumpForce = 0.2; // Jumping force
let velocity = new THREE.Vector3(0, 0, 0);
let isJumping = false;
const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Function to lock the mouse pointer
function lockPointer() {
    document.body.requestPointerLock();
}

// Lock the pointer on mouse click
document.body.addEventListener('click', lockPointer);

// Mouse movement for looking around
let pitch = 0; // Up and down rotation
let yaw = 0; // Left and right rotation
const lookSensitivity = 0.1; // Sensitivity for vertical look

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement) {
        yaw -= event.movementX * lookSensitivity; // Look left/right
        pitch -= event.movementY * lookSensitivity; // Look up/down

        // Clamp pitch to prevent flipping
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        // Apply camera rotation smoothly
        camera.rotation.set(pitch, yaw, 0); // Set rotation based on pitch and yaw
    }
});

// Handle movement
function updatePlayer() {
    velocity.set(0, 0, 0); // Reset velocity

    if (keys['KeyS']) { // Move backward (S)
        velocity.z = playerSpeed; // Move forward
    } else if (keys['KeyW']) { // Move forward (W)
        velocity.z = -playerSpeed; // Move backward
    }

    if (keys['KeyA']) { // Move left
        velocity.x = -playerSpeed;
    } else if (keys['KeyD']) { // Move right
        velocity.x = playerSpeed;
    }

    // Jumping logic
    if (keys['Space'] && !isJumping) {
        isJumping = true;
        velocity.y = jumpForce; // Initial jump velocity
    }

    // Apply gravity
    if (camera.position.y > 1.5) {
        velocity.y -= 0.01; // Gravity effect
    } else {
        isJumping = false; // Reset jumping when hitting the ground
        camera.position.y = 1.5; // Ensure the camera stays above ground
        velocity.y = 0; // Reset vertical velocity when on the ground
    }

    // Move the camera based on the direction it's facing
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get the direction the camera is facing
    direction.y = 0; // Ignore vertical direction for horizontal movement
    direction.normalize(); // Normalize direction to ensure consistent speed

    // Update camera position based on direction
    camera.position.x += direction.x * -velocity.z; // Reverse movement for forward
    camera.position.z += direction.z * -velocity.z; // Reverse movement for forward
    camera.position.y += velocity.y; // Update vertical position

    // Collision detection to prevent phasing through blocks
    camera.position.x = Math.max(0, Math.min(camera.position.x, worldWidth - 1)); // Constrain camera within bounds
    camera.position.z = Math.max(0, Math.min(camera.position.z, worldHeight - 1));
    
    // Check collision with ground (simple method)
    const groundHeight = Math.floor(simplex.noise2D(camera.position.x * noiseScale, camera.position.z * noiseScale) * 5); // Check height at camera position
    if (camera.position.y < groundHeight + 1.5) {
        camera.position.y = groundHeight + 1.5; // Place the camera on top of the ground
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updatePlayer(); // Update player movement
    renderer.render(scene, camera);
}

// Start animation
animate();
