// Initialize the game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game properties
let gameSpeed = 1;
let score = 0;
const levelLength = 1000; // Number of candlesticks to complete the level
let gameOver = false;

// Player properties
const player = {
    x: canvas.width / 2 - 15, // Center horizontally (15 is half the player width)
    y: canvas.height / 2, // Start in the middle of the screen vertically
    width: 30,
    height: 30,
    jumpForce: 12, // Reduced from 20 to 12
    velocityY: 0,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 2 // Reduced from 4 to 2 for better control
};

// Candlestick properties
const candlesticks = [];
const candlestickWidth = 30;
const candlestickGap = 10;
const maxCandlesticks = Math.ceil(canvas.width / (candlestickWidth + candlestickGap)) + 1;

// Scale factor for candle height
const candleHeightScale = 5;

// Add a new property for the starting platform
const startingPlatform = {
    x: 0,
    y: canvas.height / 2 + 50, // Adjust this value to position the platform vertically
    width: 0, // This will be set dynamically
    height: 20,
    timer: 20000 // 20 seconds in milliseconds
};

// Add camera properties
const camera = {
    y: 0,
    height: canvas.height
};

// Add these variables near the top of your file, after other variable declarations
const initialCandleHeight = 30; // Increased from 20
const maxCandleHeight = 400; // Increased from 200
const initialHeightVariation = 15; // Increased from 10
const maxHeightVariation = 200; // Increased from 100

// Add this new variable to control how quickly the candle heights increase
const heightProgressionRate = 0.3; // Changed from 0.5 to 0.3

// Update the generateCandlesticks function
function generateCandlesticks() {
    const lastCandle = candlesticks[candlesticks.length - 1];
    const startX = lastCandle ? lastCandle.x + candlestickWidth + candlestickGap : canvas.width;

    while (candlesticks.length < maxCandlesticks) {
        // Use a non-linear progression for faster height increase
        const progress = Math.pow(Math.min(score / (levelLength * heightProgressionRate), 1), 0.7);
        const currentMaxHeight = initialCandleHeight + (maxCandleHeight - initialCandleHeight) * progress;
        const currentHeightVariation = initialHeightVariation + (maxHeightVariation - initialHeightVariation) * progress;

        const lastClose = lastCandle ? lastCandle.close : canvas.height / 2;
        const open = lastClose;
        const close = open + (Math.random() - 0.5) * currentHeightVariation * 2;
        const high = Math.max(open, close) + Math.random() * currentHeightVariation;
        const low = Math.min(open, close) - Math.random() * currentHeightVariation;
        
        const candleX = startX + (candlesticks.length - (lastCandle ? candlesticks.length - 1 : 0)) * (candlestickWidth + candlestickGap);
        
        // Set the width of the starting platform to reach the first candle
        if (candlesticks.length === 0) {
            startingPlatform.width = candleX - startingPlatform.x;
        }
        
        candlesticks.push({
            x: candleX,
            open: open,
            close: close,
            high: Math.min(high, open + currentMaxHeight / 2),
            low: Math.max(low, open - currentMaxHeight / 2)
        });
    }
}

// Initialize candlesticks
generateCandlesticks();

// Game loop
function gameLoop() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update camera position
    updateCamera();
    ctx.setTransform(1, 0, 0, 1, 0, -camera.y); // Apply camera transformation

    // Update starting platform timer
    startingPlatform.timer -= 16; // Assuming 60 FPS (1000ms / 60 ≈ 16ms)

    // Draw background and update candlesticks
    drawBackgroundAndUpdateCandlesticks();

    // Update player position
    updatePlayer();

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw score and progress
    drawScoreAndProgress();

    // Increase game speed
    gameSpeed = 1 + (score / levelLength) * 2;

    // Check for level completion
    if (score >= levelLength) {
        gameOver = true;
        drawGameOver(true);
        return;
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// New function to update camera position
function updateCamera() {
    const cameraTopY = camera.y;
    const cameraBottomY = camera.y + camera.height;
    const playerTopY = player.y;
    const playerBottomY = player.y + player.height;

    // Follow player upwards
    if (playerTopY < cameraTopY + camera.height * 0.3) {
        camera.y = playerTopY - camera.height * 0.3;
    }
    // Follow player downwards
    else if (playerBottomY > cameraBottomY - camera.height * 0.3) {
        camera.y = playerBottomY - camera.height + camera.height * 0.3;
    }

    // Ensure camera doesn't go below the ground
    camera.y = Math.max(0, camera.y);
}

// Draw background with candlesticks and update their positions
function drawBackgroundAndUpdateCandlesticks() {
    ctx.fillStyle = '#1a1a1a'; // Dark background
    ctx.fillRect(0, camera.y, canvas.width, camera.height);

    // Draw starting platform if the timer hasn't expired
    if (startingPlatform.timer > 0) {
        ctx.fillStyle = 'blue';
        
        // Find the first candle that intersects with the platform
        const firstIntersectingCandle = candlesticks.find(candle => candle.x <= startingPlatform.width);
        
        if (firstIntersectingCandle) {
            // If there's an intersecting candle, adjust the platform width
            startingPlatform.width = firstIntersectingCandle.x;
        }
        
        ctx.fillRect(startingPlatform.x, startingPlatform.y - camera.y, startingPlatform.width, startingPlatform.height);

        // Draw countdown timer on the platform
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        const secondsLeft = Math.ceil(startingPlatform.timer / 1000);
        ctx.fillText(`${secondsLeft}`, startingPlatform.width / 2, startingPlatform.y - camera.y + 15);
    }

    // Draw connecting line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    // Move and draw candlesticks
    for (let i = candlesticks.length - 1; i >= 0; i--) {
        const candle = candlesticks[i];
        candle.x -= gameSpeed;

        // Remove candlesticks that are off-screen
        if (candle.x + candlestickWidth < 0) {
            candlesticks.splice(i, 1);
            score++;
            continue;
        }

        // Draw candlestick
        const isGreen = candle.close > candle.open;
        ctx.fillStyle = isGreen ? '#4CAF50' : '#F44336';
        ctx.fillRect(candle.x, Math.min(candle.open, candle.close) - camera.y, candlestickWidth, Math.abs(candle.close - candle.open));
        ctx.fillRect(candle.x + candlestickWidth / 2 - 2, candle.low - camera.y, 4, candle.high - candle.low);

        // Draw connecting line
        if (i === candlesticks.length - 1) {
            ctx.moveTo(candle.x + candlestickWidth / 2, candle.close - camera.y);
        } else {
            ctx.lineTo(candle.x + candlestickWidth / 2, candle.close - camera.y);
        }
    }

    ctx.stroke();

    // Generate new candlesticks if needed
    if (candlesticks.length < maxCandlesticks) {
        generateCandlesticks();
    }
}

// Update player position and handle collisions
function updatePlayer() {
    // Apply gravity (slightly increased to compensate for lower jump force)
    player.velocityY += 0.4; // Increased from 0.2 to 0.4
    player.y += player.velocityY;

    // Limit the maximum falling speed
    const maxFallSpeed = 6; // Slightly increased from 5 to 6
    if (player.velocityY > maxFallSpeed) {
        player.velocityY = maxFallSpeed;
    }

    // Check for collision with starting platform only if the timer hasn't expired
    if (startingPlatform.timer > 0) {
        if (
            player.x + player.width > startingPlatform.x &&
            player.x < startingPlatform.x + startingPlatform.width &&
            player.y + player.height > startingPlatform.y &&
            player.y + player.height < startingPlatform.y + startingPlatform.height
        ) {
            player.y = startingPlatform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            player.jumpCount = 0;
        }
    }

    // Check for collisions with candlesticks (platforms)
    candlesticks.forEach(candle => {
        const candleTop = Math.min(candle.open, candle.close);
        if (
            player.x + player.width > candle.x &&
            player.x < candle.x + candlestickWidth &&
            player.y + player.height > candleTop &&
            player.y + player.height < candleTop + 10
        ) {
            player.y = candleTop - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            player.jumpCount = 0; // Reset jump count when landing
        }
    });

    // Keep player centered horizontally
    player.x = canvas.width / 2 - player.width / 2;

    // Check if player has fallen below the bottom of the screen
    if (player.y > canvas.height) {
        gameOver = true;
    }
}

// Handle jump
function jump() {
    if (player.jumpCount < player.maxJumps) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
        player.jumpCount++;
        
        // Adjust jump force for the second jump
        if (player.jumpCount === 2) {
            player.velocityY = -player.jumpForce * 0.8; // Slightly weaker second jump
        }
    }
}

// Draw game over screen
function drawGameOver(victory = false) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    
    if (victory) {
        ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 40);
    } else {
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
    }

    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Press Space or Tap to Restart', canvas.width / 2, canvas.height / 2 + 60);
}

// Restart game
function restartGame() {
    gameSpeed = 1;
    score = 0;
    gameOver = false;
    player.x = canvas.width / 2 - player.width / 2; // Reset to center horizontally
    player.y = canvas.height / 2; // Reset to middle of the screen vertically
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpCount = 0;
    startingPlatform.timer = 20000; // Reset the starting platform timer to 20 seconds
    startingPlatform.width = 0; // Reset the starting platform width
    candlesticks.length = 0;
    generateCandlesticks();
    gameLoop();
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === ' ') {
        if (gameOver) {
            restartGame();
        } else {
            jump();
        }
    }
});

// Touch controls
canvas.addEventListener('touchstart', () => {
    if (gameOver) {
        restartGame();
    } else {
        jump();
    }
});

// Start the game loop
gameLoop();

// New function to draw score and progress
function drawScoreAndProgress() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, 70);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    const progress = Math.min(Math.floor((score / levelLength) * 100), 100);
    ctx.fillText(`Progress: ${progress}%`, 20, 60);

    // Draw progress bar
    const barWidth = 200;
    const barHeight = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(canvas.width - barWidth - 20, 25, barWidth, barHeight);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.fillRect(canvas.width - barWidth - 20, 25, barWidth * (progress / 100), barHeight);
}

// Add these variables at the top of your file, after other variable declarations
let cameraX = 0;
let cameraY = 0;
const cameraSmoothing = 0.1; // Adjust this value to change the smoothness (0.05 to 0.2 works well)

// Update the game loop function (usually called update() or similar)
function update() {
    // Existing player update code...

    // Update camera position
    const targetCameraX = player.x - canvas.width / 2;
    const targetCameraY = player.y - canvas.height / 2;
    
    cameraX += (targetCameraX - cameraX) * cameraSmoothing;
    cameraY += (targetCameraY - cameraY) * cameraSmoothing;

    // Clamp camera to level boundaries if needed
    // cameraX = Math.max(0, Math.min(cameraX, levelWidth - canvas.width));
    // cameraY = Math.max(0, Math.min(cameraY, levelHeight - canvas.height));
}

// Update the draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save(); // Save the current transformation state
    ctx.translate(-cameraX, -cameraY); // Apply camera transformation

    // Draw level elements (platforms, background, etc.)
    // ...

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw other game elements
    // ...

    ctx.restore(); // Restore the original transformation state
}
