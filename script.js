 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2D Procedural Minecraft-like Game</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
        }
        canvas {
            border: 1px solid #000;
            background-color: #87CEFA; /* Sky color */
            cursor: crosshair;
        }
        #playButton {
            margin: 20px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }
        #inventory {
            display: none;
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #000;
            background-color: white;
        }
        .item {
            margin: 5px 0;
        }
        .indicator {
            width: 5px;
            height: 5px;
            background-color: yellow;
            position: absolute;
            display: none; /* Hide initially */
            transform: rotate(0deg);
            transition: transform 0.1s;
        }
    </style>
</head>
<body>
    <h1>2D Procedural Minecraft-like Game</h1>
    <button id="playButton">Play</button>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div id="inventory">
        <h3>Inventory</h3>
        <div class="item">Wood: <span id="woodCount">0</span></div>
    </div>
    <div class="indicator" id="collectIndicator"></div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const TILE_SIZE = 40;
        const VIEW_DISTANCE = 10; // Number of tiles to load in view
        const PLAYER_SIZE = TILE_SIZE;
        const WORLD_HEIGHT = 200; // For generating height

        // Tile colors
        const TILES = {
            0: '#8B4513',  // Dirt
            1: '#32CD32',  // Grass
            2: '#4682B4',  // Water
            3: '#228B22',  // Tree
        };

        const player = {
            x: Math.floor(VIEW_DISTANCE / 2),
            y: Math.floor(VIEW_DISTANCE / 2),
            color: 'red',
            size: PLAYER_SIZE,
        };

        let inventory = {
            wood: 0,
        };

        let world = [];
        let collecting = false;
        let collectTimeout;
        let collectDistance = 3;
        let collectIndicator = document.getElementById('collectIndicator');
        let collectTargetX, collectTargetY;

        // Generate Perlin noise-like pattern for tiles
        function generatePerlinNoise(width, height, scale = 5) {
            const noiseGrid = [];
            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const noiseValue = Math.sin((x + y) / scale);  // Simple noise generation
                    row.push(noiseValue);
                }
                noiseGrid.push(row);
            }
            return noiseGrid;
        }

        // Generate the world with trees and water
        function generateWorld(centerX, centerY) {
            const noiseGrid = generatePerlinNoise(VIEW_DISTANCE * 2, VIEW_DISTANCE * 2, scale=10);
            const worldChunk = [];

            for (let y = 0; y < VIEW_DISTANCE * 2; y++) {
                const row = [];
                for (let x = 0; x < VIEW_DISTANCE * 2; x++) {
                    let tileType;
                    const noiseValue = noiseGrid[y][x];
                    const depth = centerY + y - VIEW_DISTANCE; // Depth calculation for darkness

                    if (noiseValue < -0.5) {
                        tileType = 2;  // Water
                    } else if (noiseValue < 0.0) {
                        tileType = 0;  // Dirt
                    } else if (Math.random() < 0.1) { // 10% chance for trees
                        tileType = 3;  // Tree
                    } else {
                        tileType = 1;  // Grass
                    }
                    row.push(tileType);
                }
                worldChunk.push(row);
            }
            return worldChunk;
        }

        // Draw the world and player
        function drawWorld() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const startX = Math.max(0, player.x - VIEW_DISTANCE);
            const startY = Math.max(0, player.y - VIEW_DISTANCE);

            for (let y = 0; y < VIEW_DISTANCE * 2; y++) {
                for (let x = 0; x < VIEW_DISTANCE * 2; x++) {
                    const tile = world[y][x];
                    ctx.fillStyle = TILES[tile];
                    ctx.fillRect((x + startX) * TILE_SIZE, (y + startY) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
            // Draw the player
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, PLAYER_SIZE, PLAYER_SIZE);
        }

        // Move the player one block in the direction
        function movePlayer(dx, dy) {
            const newX = player.x + dx;
            const newY = player.y + dy;

            // Check if the new position is valid
            if (newX >= 0 && newY >= 0 && newX < VIEW_DISTANCE * 2 && newY < VIEW_DISTANCE * 2) {
                player.x = newX;
                player.y = newY;
                drawWorld();
            }
        }

        // Collect wood
        function startCollecting() {
            const distanceX = player.x - collectTargetX;
            const distanceY = player.y - collectTargetY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance <= collectDistance) {
                collecting = true;
                collectIndicator.style.display = 'block';
                collectIndicator.style.left = ${(collectTargetX * TILE_SIZE) + (TILE_SIZE / 2)}px;
                collectIndicator.style.top = ${(collectTargetY * TILE_SIZE) + (TILE_SIZE / 2)}px;

                collectTimeout = setTimeout(() => {
                    inventory.wood += 1;
                    document.getElementById('woodCount').innerText = inventory.wood;
                    world[collectTargetY][collectTargetX] = 1; // Remove the tree
                    collecting = false;
                    collectIndicator.style.display = 'none';
                    drawWorld();
                }, 3000); // 3 seconds
            }
        }

        function stopCollecting() {
            collecting = false;
            clearTimeout(collectTimeout);
            collectIndicator.style.display = 'none';
        }

        // Place wood block
        function placeWood() {
            if (inventory.wood > 0) {
                const tileX = Math.floor(player.x);
                const tileY = Math.floor(player.y);

                if (world[tileY] && world[tileY][tileX] === 1) { // Only place on grass
                    world[tileY][tileX] = 0; // Place wood
                    inventory.wood -= 1;
                    document.getElementById('woodCount').innerText = inventory.wood;
                    drawWorld();
                }
            }
        }

        // Start the game
        document.getElementById('playButton').addEventListener('click', () => {
            world = generateWorld(player.x, player.y);  // Generate initial world
            drawWorld();  // Draw the world

            // Start keyboard event listeners
            document.addEventListener('keydown', (event) => {
                switch (event.key) {
                    case 'w':
                        movePlayer(0, -1);
                        break;
                    case 'a':
                        movePlayer(-1, 0);
                        break;
                    case 's':
                        movePlayer(0, 1);
                        break;
                    case 'd':
                        movePlayer(1, 0);
                        break;
                    case 'e':
                        toggleInventory();
                        break;
                }
            });

            // Mouse event listeners
            canvas.addEventListener('mousedown', (event) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = Math.floor((event.clientX - rect.left) / TILE_SIZE);
                const mouseY = Math.floor((event.clientY - rect.top) / TILE_SIZE);
                collectTargetX = mouseX + player.x - VIEW_DISTANCE;
                collectTargetY = mouseY + player.y - VIEW_DISTANCE;

                if (world[collectTargetY] && world[collectTargetY][collectTargetX] === 3) {
                    startCollecting();
                }
            });

            canvas.addEventListener('mouseup', stopCollecting);
            canvas.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Prevent context menu
                placeWood();
            });

            // Show inventory when opened
            function toggleInventory() {
                const inventoryDiv = document.getElementById('inventory');
                inventoryDiv.style.display = inventoryDiv.style.display === 'none' ? 'block' : 'none';
            }
        });
    </script>
</body>
</html>
