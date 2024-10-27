// Initialize the game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game properties
let gameSpeed = 1.5;
let score = 0;
const levelLength = 1000;
let gameOver = false;

// Add this new platform object
const startPlatform = {
    x: 0,  // This will be set in setCanvasSize
    y: canvas.height / 2 + 100,
    width: 0,  // This will be set in setCanvasSize
    height: 10, // Slightly reduced from 12
    color: 'blue',
    visible: true,
    cornerRadius: 5 // Slightly reduced from 6
};

// Player properties
const player = {
    x: canvas.width / 2,
    y: startPlatform.y - 20, // Adjusted for smaller size
    radius: 15, // Reduced from 20
    jumpForce: 12,
    velocityY: 0,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 3,
    color: '#FF6B6B',
    rotation: 0,
    name: 'Ted' // Added name property
};

// Candlestick properties
const candlesticks = [];
const candlestickWidth = 20;  // Smaller candlesticks for mobile
const candlestickGap = 5;
const maxCandlesticks = Math.ceil(canvas.width / (candlestickWidth + candlestickGap)) + 1;

// Camera properties
const camera = {
    y: 0,
    height: canvas.height
};

// Debug function
function debugLog(message) {
    console.log(message);
    const debugElement = document.getElementById('debug');
    if (debugElement) {
        debugElement.innerHTML += message + '<br>';
    }
}

// Add these constants back
const initialCandleHeight = 50;
const maxCandleHeight = 300;
const initialHeightVariation = 30;
const maxHeightVariation = 150;
const heightProgressionRate = 0.5;
const outlierChance = 0.03;
const outlierMultiplier = 3;

// Add this to the game properties at the top of the file
let platformsJumped = 0;

// Add these constants at the top of the file with other game properties
const groupChance = 0.2; // 20% chance of starting a group
const maxGroupSize = 5; // Maximum number of candles in a group
const groupGapMultiplier = 0.3; // How close together the candles in a group are

// Add this new variable near the top of the file with other game properties
let jumpedFromStartPlatform = false;

// Add these constants at the top of the file
const MUL_TOTAL_SUPPLY = 100000000;
const MUL_CURRENT_PRICE = 0.01634;
const MAX_USD_REWARD_PER_LEVEL = 5;

// Calculate the maximum $MUL reward per level
const MAX_MUL_REWARD_PER_LEVEL = MAX_USD_REWARD_PER_LEVEL / MUL_CURRENT_PRICE;

// Add this variable to track the total $MUL earned
let totalMULEarned = 0;

// Modify these constants at the top of the file
const MIN_MUL_PER_JUMP = 0.004; // Increased from 0.001
const MAX_MUL_PER_JUMP = 0.020; // Increased from 0.005

// Add this at the beginning of the file
let gameStarted = false;

// Add these variables near the top of the file
let minPrice = Infinity;
let maxPrice = -Infinity;
const priceScaleElement = document.getElementById('priceScale');

// Add this function to update the price scale
function updatePriceScale() {
    const visibleCandles = candlesticks.filter(candle => 
        candle.x + candlestickWidth > 0 && candle.x < canvas.width
    );

    if (visibleCandles.length === 0) return;

    const localMin = Math.min(...visibleCandles.map(c => Math.min(c.open, c.close, c.high, c.low)));
    const localMax = Math.max(...visibleCandles.map(c => Math.max(c.open, c.close, c.high, c.low)));

    minPrice = Math.min(minPrice, localMin);
    maxPrice = Math.max(maxPrice, localMax);

    const range = maxPrice - minPrice;
    const steps = 10; // Increased from 5 to 10
    const stepSize = range / (steps - 1);

    priceScaleElement.innerHTML = '';
    for (let i = 0; i < steps; i++) {
        const price = maxPrice - i * stepSize;
        const priceElement = document.createElement('div');
        priceElement.textContent = price.toFixed(4); // Increased precision from 2 to 4 decimal places
        priceScaleElement.appendChild(priceElement);
    }
}

function getCandlestickGap() {
    const progress = Math.min(score / levelLength, 1);
    const maxGap = candlestickGap + (200 - candlestickGap) * progress;
    return candlestickGap + Math.random() * (maxGap - candlestickGap);
}

function generateCandlesticks() {
    const lastCandle = candlesticks[candlesticks.length - 1];
    const startX = lastCandle ? lastCandle.x + candlestickWidth + getCandlestickGap() : canvas.width;

    let inGroup = false;
    let groupSize = 0;

    while (candlesticks.length < maxCandlesticks) {
        const progress = Math.pow(Math.min(score / (levelLength * heightProgressionRate), 1), 0.7);
        const currentMaxHeight = initialCandleHeight + (maxCandleHeight - initialCandleHeight) * progress;
        const currentHeightVariation = initialHeightVariation + (maxHeightVariation - initialHeightVariation) * progress;

        const lastClose = candlesticks.length > 0 ? candlesticks[candlesticks.length - 1].close : canvas.height / 2;
        const open = lastClose;
        let close, high, low;

        const isOutlier = Math.random() < outlierChance;
        const isGreen = Math.random() < 0.5;
        const wickMultiplier = 1 + Math.random() * 2;

        // Generate candle body and wicks (existing code)
        if (isOutlier) {
            const outlierHeight = currentHeightVariation * outlierMultiplier;
            if (isGreen) {
                close = open - outlierHeight;
                high = close - Math.random() * outlierHeight * wickMultiplier;
                low = open + Math.random() * outlierHeight * wickMultiplier;
            } else {
                close = open + outlierHeight;
                high = open - Math.random() * outlierHeight * wickMultiplier;
                low = close + Math.random() * outlierHeight * wickMultiplier;
            }
        } else {
            const bodyHeight = Math.random() * currentHeightVariation;
            const wickExtension = currentHeightVariation * wickMultiplier;
            if (isGreen) {
                close = open - bodyHeight;
                high = close - Math.random() * wickExtension;
                low = open + Math.random() * wickExtension;
            } else {
                close = open + bodyHeight;
                high = open - Math.random() * wickExtension;
                low = close + Math.random() * wickExtension;
            }
        }

        // Determine if we should start a new group
        if (!inGroup && Math.random() < groupChance) {
            inGroup = true;
            groupSize = Math.floor(Math.random() * (maxGroupSize - 2)) + 2; // Ensure at least 2 candles in a group
        }

        // Calculate x position
        let candleX;
        if (inGroup) {
            const groupGap = getCandlestickGap() * groupGapMultiplier;
            candleX = candlesticks.length > 0 ? candlesticks[candlesticks.length - 1].x + candlestickWidth + groupGap : startX;
            groupSize--;
            if (groupSize === 0) {
                inGroup = false;
            }
        } else {
            candleX = startX + (candlesticks.length - (lastCandle ? candlesticks.length - 1 : 0)) * (candlestickWidth + getCandlestickGap());
        }

        candlesticks.push({
            x: candleX,
            open: open,
            close: close,
            high: Math.min(high, canvas.height),
            low: Math.max(low, 0),
            isOutlier: isOutlier,
            isGreen: isGreen
        });

        // Update min and max prices
        minPrice = Math.min(minPrice, Math.min(open, close, high, low));
        maxPrice = Math.max(maxPrice, Math.max(open, close, high, low));
    }
}

function drawCandlesticks() {
    // Draw the start platform only if it's visible
    if (startPlatform.visible) {
        ctx.fillStyle = startPlatform.color;
        roundedRect(ctx, startPlatform.x, startPlatform.y - camera.y, startPlatform.width, startPlatform.height, startPlatform.cornerRadius);
        ctx.fill();
    }

    // Draw candlesticks
    for (const candle of candlesticks) {
        // Use consistent colors for red and green candles
        const redColor = '#FF0000';  // Bright red
        const greenColor = '#00FF00';  // Bright green
        const bodyColor = candle.isGreen ? greenColor : redColor;
        
        const bodyTop = Math.min(candle.open, candle.close) - camera.y;
        const bodyBottom = Math.max(candle.open, candle.close) - camera.y;
        const bodyHeight = Math.abs(candle.close - candle.open);
        
        // Draw body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(candle.x, bodyTop, candlestickWidth, bodyHeight);

        // Draw wicks
        ctx.beginPath();
        ctx.strokeStyle = bodyColor; // Use the same color as the body for the wick
        ctx.lineWidth = 2;
        
        // Limit the wick length
        const maxWickLength = bodyHeight * 0.5; // 50% of the body height
        const topWickEnd = Math.max(candle.high, Math.min(candle.open, candle.close) - maxWickLength) - camera.y;
        const bottomWickEnd = Math.min(candle.low, Math.max(candle.open, candle.close) + maxWickLength) - camera.y;
        
        ctx.moveTo(candle.x + candlestickWidth / 2, bodyTop);
        ctx.lineTo(candle.x + candlestickWidth / 2, topWickEnd);
        
        ctx.moveTo(candle.x + candlestickWidth / 2, bodyBottom);
        ctx.lineTo(candle.x + candlestickWidth / 2, bottomWickEnd);
        
        ctx.stroke();
    }
}

// Add these functions back

function updateCamera() {
    const cameraTopY = camera.y;
    const cameraBottomY = camera.y + camera.height;
    const playerTopY = player.y - player.radius;
    const playerBottomY = player.y + player.radius;

    // Increase sensitivity for both upward and downward tracking
    const trackingThreshold = camera.height * 0.3;
    const trackingSpeed = 0.2;

    if (playerTopY < cameraTopY + trackingThreshold) {
        // Faster upward camera movement
        camera.y += (playerTopY - (cameraTopY + trackingThreshold)) * trackingSpeed;
    } 
    else if (playerBottomY > cameraBottomY - trackingThreshold) {
        // Faster downward camera movement
        camera.y += (playerBottomY - (cameraBottomY - trackingThreshold)) * trackingSpeed;
    }

    // Ensure the camera doesn't go below the ground level
    camera.y = Math.max(0, camera.y);
}

// Add this near the top with other game properties
const coins = [];

// Add this coin particle class
class Coin {
    constructor(x, y, value, candleX) {
        this.x = x;
        this.y = y;
        this.initialY = y;
        this.candleX = candleX;
        this.value = value;
        this.size = 16;
        
        // Explosion animation properties - stronger upward bias
        const angle = (Math.random() * Math.PI/3) + Math.PI/3; // Angle between 60 and 120 degrees (more upward)
        const speed = 4 + Math.random() * 3; // Increased upward speed
        this.velocityY = -speed * Math.sin(angle); // Stronger upward velocity
        this.velocityX = speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1); // Random left/right
        this.gravity = 0.12; // Reduced gravity for longer air time
        this.friction = 0.99; // Reduced friction for smoother motion
        
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.opacity = 1;
        this.scale = 1;
        this.collected = false;
        this.targetX = 0;
        this.targetY = 0;
        this.time = 0;
        
        // Track absolute position instead of relative to candle
        this.absoluteX = x;
        this.absoluteY = y;
    }

    update(timeScale = 1) {
        this.time += 0.5 * timeScale;
        
        if (this.collected) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            this.x += dx * 0.02 * timeScale;
            this.y += dy * 0.02 * timeScale;
            this.scale -= 0.005 * timeScale;
            this.opacity -= 0.008 * timeScale;
            return this.opacity > 0;
        } else {
            // Apply physics with time scaling
            this.velocityY += this.gravity * timeScale;
            this.velocityX *= Math.pow(this.friction, timeScale);
            this.velocityY *= Math.pow(this.friction, timeScale);
            
            // Update absolute position with time scaling
            this.absoluteX += this.velocityX * timeScale;
            this.absoluteY += this.velocityY * timeScale;
            
            // Update display position
            this.x = this.absoluteX - gameSpeed * timeScale;
            this.y = this.absoluteY;
            
            // Rotate with time scaling
            this.rotation += this.rotationSpeed * timeScale;
            
            if (this.velocityY > 1 && this.time > 90) {
                this.collected = true;
                const scoreElement = document.getElementById('score');
                const scoreRect = scoreElement.getBoundingClientRect();
                this.targetX = scoreRect.left + scoreRect.width / 2;
                this.targetY = scoreRect.top + scoreRect.height / 2;
            }
            
            return true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - camera.y); // Adjust for camera position
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;

        // Draw coin with subtle gradient
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        
        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size / 2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw M symbol for $MUL
        ctx.fillStyle = '#B25900';
        ctx.font = 'bold 14px Arial'; // Increased from 12px
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 0, 0);

        ctx.restore();
    }
}

// Add this function to spawn coins
let lastCoinTime = 0;
const COIN_SPAWN_COOLDOWN = 500; // Minimum time (ms) between coin spawns

function spawnCoins(x, y, value) {
    const currentTime = Date.now();
    if (currentTime - lastCoinTime < COIN_SPAWN_COOLDOWN) {
        return;
    }
    
    lastCoinTime = currentTime;
    
    // Randomly choose to spawn 1 or 2 coins
    const numCoins = Math.random() < 0.5 ? 1 : 2;
    
    for (let i = 0; i < numCoins; i++) {
        const coinX = x + (Math.random() - 0.5) * 5;
        const coinY = y + (Math.random() - 0.5) * 5;
        coins.push(new Coin(
            coinX,
            coinY,
            value / numCoins, // Split value between coins
            x
        ));
    }
}

// Add this function to create a floating score text
function createFloatingText(x, y, value) {
    const text = {
        x: x,
        y: y,
        value: `+${value.toFixed(6)}`,
        opacity: 1,
        scale: 1
    };
    
    // Add to a new array for floating texts if you don't have one
    if (!window.floatingTexts) window.floatingTexts = [];
    window.floatingTexts.push(text);
}

// Modify the updatePlayer function to spawn coins on landing
function updatePlayer(timeScale = 1) {
    player.velocityY += 0.4 * timeScale;
    player.y += player.velocityY * timeScale;

    const maxFallSpeed = 6;
    if (player.velocityY > maxFallSpeed) {
        player.velocityY = maxFallSpeed;
    }

    let onPlatform = false;
    let lowestCandleY = -Infinity;

    // Check collision with start platform only if it's visible
    if (startPlatform.visible &&
        player.x + player.radius > startPlatform.x &&
        player.x - player.radius < startPlatform.x + startPlatform.width &&
        player.y + player.radius > startPlatform.y &&
        player.y + player.radius < startPlatform.y + startPlatform.height
    ) {
        player.y = startPlatform.y - player.radius;
        player.velocityY = 0;
        player.isJumping = false;
        player.jumpCount = 0;
        onPlatform = true;
    }

    // Check collision with candlesticks
    candlesticks.forEach(candle => {
        const candleTop = Math.min(candle.open, candle.close);
        const candleBottom = Math.max(candle.open, candle.close);
        lowestCandleY = Math.max(lowestCandleY, candleBottom);

        if (
            player.x + player.radius > candle.x &&
            player.x - player.radius < candle.x + candlestickWidth &&
            player.y + player.radius > candleTop &&
            player.y + player.radius < candleTop + 10
        ) {
            if (!onPlatform && player.velocityY > 0) {
                const mulEarned = (Math.random() * (MAX_MUL_PER_JUMP - MIN_MUL_PER_JUMP) + MIN_MUL_PER_JUMP) * 4;
                totalMULEarned += parseFloat(mulEarned.toFixed(6));
                // Spawn coins when earning rewards
                spawnCoins(player.x, player.y, mulEarned);
                createFloatingText(player.x, player.y - player.radius, mulEarned);
            }
            player.y = candleTop - player.radius;
            player.velocityY = 0;
            player.isJumping = false;
            player.jumpCount = 0;
            onPlatform = true;
        }
    });

    // Update and remove finished coin animations
    for (let i = coins.length - 1; i >= 0; i--) {
        if (!coins[i].update(timeScale)) {
            coins.splice(i, 1);
        }
    }

    player.x = canvas.width / 2;

    // Check if player has fallen below the lowest candle
    if (player.y - player.radius > lowestCandleY + 200) {
        if (!gameOver) {
            gameOver = true;
            showGameOver(false);
        }
    }

    // Continue updating player position even after game over
    if (!gameOver) {
        updateCamera();
    }
}

function jump() {
    if (player.jumpCount < player.maxJumps) {
        player.velocityY = -player.jumpForce * (isMobile() ? 0.8 : 1);  // Reduced jump force on mobile
        player.isJumping = true;
        player.jumpCount++;
        
        if (player.jumpCount === 2) {
            player.velocityY *= 0.9;
        } else if (player.jumpCount === 3) {
            player.velocityY *= 0.8;
        }

        // If this is the first jump and the player is on the start platform, make it disappear
        if (startPlatform.visible && player.y === startPlatform.y - player.radius) {
            startPlatform.visible = false;
        }
    }
}

// Add these constants near the top of the file
const FRAME_RATE = 60;
const FRAME_DURATION = 1000 / FRAME_RATE;
let lastFrameTime = 0;

// Update the gameLoop function with higher speed values
function gameLoop(timestamp) {
    if (!timestamp) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    const timeScale = Math.min(deltaTime / FRAME_DURATION, 2.0);
    
    lastFrameTime = timestamp;

    if (!gameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameOver) {
        // Increased base speeds and progression
        gameSpeed = isMobile() ? 
            2.5 + (score / levelLength) * 1.5 : // Increased from 1.5 to 2.5
            3.0 + (score / levelLength) * 3;    // Increased from 2.0 to 3.0
            
        // Move candlesticks with timeScale
        for (const candle of candlesticks) {
            candle.x -= gameSpeed * timeScale;
        }
    }
    
    // Update player and camera
    updatePlayer(timeScale);
    updateCamera();
    
    // Generate candlesticks if needed
    if (!gameOver) {
        if (candlesticks.length === 0) {
            generateCandlesticks();
        }
        
        if (candlesticks[0].x + candlestickWidth < 0) {
            candlesticks.shift();
            score++;
            generateCandlesticks();
        }
        
        if (score >= levelLength) {
            gameOver = true;
            showGameOver(true);
            return;
        }
    }
    
    // Draw game elements
    ctx.save();
    ctx.translate(0, -camera.y);
    
    drawCandlesticks();
    drawShrimp(player.x, player.y, player.radius);
    
    // Draw coins
    for (const coin of coins) {
        coin.draw(ctx);
    }
    
    ctx.restore();
    
    // Update UI
    updateScoreAndProgress();
    updatePriceScale();

    // Continue game loop
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Add a new function to update the score and progress
function updateScoreAndProgress() {
    const scoreElement = document.getElementById('score');
    const progressBar = document.getElementById('progress-bar');

    if (scoreElement) {
        scoreElement.textContent = totalMULEarned.toFixed(6);
    }

    const progressPercentage = Math.min(score / levelLength * 100, 100);
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
    }

    // Update claim button state
    updateClaimButton();
}

// Add event listeners for controls
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (!gameStarted) {
            startGame();
        } else if (gameOver) {
            location.reload();
        } else {
            jump();
        }
    }
});

// Add this new touch event listener for the entire document
document.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if (!gameStarted) {
        startGame();
    } else if (gameOver) {
        location.reload();
    } else {
        jump();
    }
});

// Call setCanvasSize initially
setCanvasSize();

// Start the game loop
generateCandlesticks(); // Generate initial candlesticks
requestAnimationFrame(gameLoop);

// Add this function to check if the device is mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Modify the canvas size setting
function setCanvasSize() {
    const gameContainer = document.getElementById('gameContainer');
    canvas.width = gameContainer.clientWidth - 60;
    canvas.height = gameContainer.clientHeight;
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    
    // Adjust platform width for smaller Ted
    startPlatform.width = player.radius * 10;  // Adjusted multiplier for smaller size
    startPlatform.x = canvas.width / 2 - startPlatform.width / 2;
    startPlatform.y = canvas.height / 2 + 100;
    
    player.y = startPlatform.y - player.radius;

    camera.height = canvas.height;
}

// Call this function on window resize
window.addEventListener('resize', setCanvasSize);

// Add these variables at the top of the file
let isPlayAgainHovered = false;
let isHomeHovered = false;

// Modify the drawGameOver function
function showGameOver(victory = false) {
    gameOver = true;
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const rewardsText = document.getElementById('rewardsText');
    const usdValueText = document.getElementById('usdValueText');

    gameOverTitle.textContent = victory ? "Ted's Level Complete!" : 'Game Over';
    rewardsText.textContent = `$MUL Rewards: ${totalMULEarned.toFixed(6)}`;
    const usdValue = (totalMULEarned * MUL_CURRENT_PRICE).toFixed(2);
    usdValueText.textContent = `(Approx. $${usdValue} USD)`;

    gameOverScreen.style.display = 'flex';
}

// Add this helper function to draw rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Add this new function to handle mouse movement
function handleGameOverMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const buttonWidth = Math.min(200, canvas.width * 0.4);
    const buttonHeight = Math.min(60, canvas.height * 0.1);
    const buttonSpacing = buttonHeight * 0.5;

    const titleFontSize = Math.min(40, canvas.width / 10);
    const textFontSize = Math.min(24, canvas.width / 20);
    const titleY = canvas.height * 0.3;
    const rewardsY = titleY + titleFontSize * 1.5;
    const usdY = rewardsY + textFontSize * 1.5;

    const isMobile = canvas.width < 768;

    let playAgainX, playAgainY, homeX, homeY;

    if (isMobile) {
        playAgainX = canvas.width / 2;
        playAgainY = usdY + textFontSize * 2 + buttonHeight / 2;
        homeX = canvas.width / 2;
        homeY = playAgainY + buttonHeight + buttonSpacing;
    } else {
        playAgainX = canvas.width / 2 - buttonWidth / 2 - buttonSpacing / 2;
        playAgainY = usdY + textFontSize * 2 + buttonHeight / 2;
        homeX = canvas.width / 2 + buttonWidth / 2 + buttonSpacing / 2;
        homeY = playAgainY;
    }

    // Check if mouse is over Play Again button
    isPlayAgainHovered = x >= playAgainX - buttonWidth / 2 &&
        x <= playAgainX + buttonWidth / 2 &&
        y >= playAgainY - buttonHeight / 2 &&
        y <= playAgainY + buttonHeight / 2;

    // Check if mouse is over Home button
    isHomeHovered = x >= homeX - buttonWidth / 2 &&
        x <= homeX + buttonWidth / 2 &&
        y >= homeY - buttonHeight / 2 &&
        y <= homeY + buttonHeight / 2;

    // Redraw the game over screen if hover state changed
    if (isPlayAgainHovered || isHomeHovered) {
        showGameOver(score >= levelLength);
    }
}

// Modify the handleGameOverClick function
function handleGameOverClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const buttonWidth = Math.min(200, canvas.width * 0.4);
    const buttonHeight = Math.min(60, canvas.height * 0.1);
    const buttonSpacing = buttonHeight * 0.5;

    const titleFontSize = Math.min(40, canvas.width / 10);
    const textFontSize = Math.min(24, canvas.width / 20);
    const titleY = canvas.height * 0.3;
    const rewardsY = titleY + titleFontSize * 1.5;
    const usdY = rewardsY + textFontSize * 1.5;

    const isMobile = canvas.width < 768;

    let playAgainX, playAgainY, homeX, homeY;

    if (isMobile) {
        playAgainX = canvas.width / 2;
        playAgainY = usdY + textFontSize * 2 + buttonHeight / 2;
        homeX = canvas.width / 2;
        homeY = playAgainY + buttonHeight + buttonSpacing;
    } else {
        playAgainX = canvas.width / 2 - buttonWidth / 2 - buttonSpacing / 2;
        playAgainY = usdY + textFontSize * 2 + buttonHeight / 2;
        homeX = canvas.width / 2 + buttonWidth / 2 + buttonSpacing / 2;
        homeY = playAgainY;
    }

    // Check if Play Again button is clicked
    if (x >= playAgainX - buttonWidth / 2 &&
        x <= playAgainX + buttonWidth / 2 &&
        y >= playAgainY - buttonHeight / 2 &&
        y <= playAgainY + buttonHeight / 2) {
        resetGame();
        startGame();
    }

    // Check if Home button is clicked
    if (x >= homeX - buttonWidth / 2 &&
        x <= homeX + buttonWidth / 2 &&
        y >= homeY - buttonHeight / 2 &&
        y <= homeY + buttonHeight / 2) {
        gameStarted = false;
        gameOver = false;
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameUI').style.display = 'none';
        resetGame();
    }

    // Remove event listeners
    canvas.removeEventListener('click', handleGameOverClick);
    canvas.removeEventListener('touchend', handleGameOverClick);
    canvas.removeEventListener('mousemove', handleGameOverMouseMove);
}

// Modify the resetGame function to clear coins
function resetGame() {
    score = 0;
    totalMULEarned = 0;
    gameSpeed = 1.5;
    candlesticks.length = 0;
    player.y = startPlatform.y - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpCount = 0;
    startPlatform.visible = true;
    camera.y = 0;
    setCanvasSize();
    generateCandlesticks();
    coins.length = 0; // Clear any existing coins
    if (window.floatingTexts) window.floatingTexts.length = 0;
    updateClaimButton();
}

// Modify the startGame function to not hide/show gameUI
function startGame() {
    gameStarted = true;
    gameOver = false;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    resetGame();
    lastFrameTime = 0; // Reset the frame time
    requestAnimationFrame(gameLoop);
}

// Add this event listener for the start game button
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn').addEventListener('click', startGame);
document.getElementById('homeBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    resetGame();
});

// Instead, add this line to set up the initial canvas size
setCanvasSize();

// Update the drawShrimp function
function drawShrimp(x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    
    // Rotate based on velocity
    const targetRotation = player.velocityY * 0.1;
    player.rotation += (targetRotation - player.rotation) * 0.1;
    ctx.rotate(player.rotation);

    // Main body (curved)
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.bezierCurveTo(
        -radius, -radius * 0.5,
        radius, -radius * 0.5,
        radius, 0
    );
    ctx.bezierCurveTo(
        radius, radius * 0.5,
        -radius, radius * 0.5,
        -radius, 0
    );
    ctx.fillStyle = player.color;
    ctx.strokeStyle = '#FF4040';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.bezierCurveTo(
        -radius * 1.5, -radius * 0.3,
        -radius * 1.8, 0,
        -radius * 1.5, radius * 0.3
    );
    ctx.stroke();

    // Legs (small curved lines)
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const xOffset = -radius * 0.5 + (i * radius * 0.5);
        ctx.moveTo(xOffset, radius * 0.2);
        ctx.bezierCurveTo(
            xOffset, radius * 0.6,
            xOffset + radius * 0.2, radius * 0.6,
            xOffset + radius * 0.2, radius * 0.8
        );
        ctx.stroke();
    }

    // Draw big human-like eyes
    const eyeSize = radius * 0.4;
    const eyeX = radius * 0.5;
    const eyeY = -radius * 0.2;

    // White of the eyes
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF4040';
    ctx.stroke();

    // Pupils
    ctx.beginPath();
    ctx.fillStyle = 'black';
    const pupilSize = eyeSize * 0.5;
    ctx.arc(eyeX + pupilSize * 0.2, eyeY, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.beginPath();
    ctx.fillStyle = 'white';
    const highlightSize = eyeSize * 0.2;
    ctx.arc(eyeX - pupilSize * 0.2, eyeY - pupilSize * 0.2, highlightSize, 0, Math.PI * 2);
    ctx.fill();

    // Add eyelashes (3 small lines above the eye)
    ctx.beginPath();
    ctx.strokeStyle = '#FF4040';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
        const lashX = eyeX + (i * eyeSize * 0.4);
        ctx.moveTo(lashX, eyeY - eyeSize);
        ctx.lineTo(lashX, eyeY - eyeSize * 1.4);
    }
    ctx.stroke();

    ctx.restore();
}

// Add this to the gameLoop function after drawing coins
// Update and draw floating texts
if (window.floatingTexts) {
    for (let i = window.floatingTexts.length - 1; i >= 0; i--) {
        const text = window.floatingTexts[i];
        text.y -= 1;
        text.opacity -= 0.02;
        
        if (text.opacity <= 0) {
            window.floatingTexts.splice(i, 1);
            continue;
        }
        
        ctx.save();
        ctx.globalAlpha = text.opacity;
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text.value, text.x, text.y);
        ctx.restore();
    }
}

// Add this after setCanvasSize()
function drawStartScreenTed() {
    const tedCanvas = document.getElementById('tedCanvas');
    const tedCtx = tedCanvas.getContext('2d');
    
    // Clear the canvas
    tedCtx.clearRect(0, 0, tedCanvas.width, tedCanvas.height);
    
    // Draw Ted in the center of the canvas
    const tedRadius = 40;
    const centerX = tedCanvas.width / 2;
    const centerY = tedCanvas.height / 2;
    
    // Save context state
    tedCtx.save();
    tedCtx.translate(centerX, centerY);
    
    // Draw Ted using the existing drawShrimp function logic
    // Main body (curved)
    tedCtx.beginPath();
    tedCtx.moveTo(-tedRadius, 0);
    tedCtx.bezierCurveTo(
        -tedRadius, -tedRadius * 0.5,
        tedRadius, -tedRadius * 0.5,
        tedRadius, 0
    );
    tedCtx.bezierCurveTo(
        tedRadius, tedRadius * 0.5,
        -tedRadius, tedRadius * 0.5,
        -tedRadius, 0
    );
    tedCtx.fillStyle = player.color;
    tedCtx.strokeStyle = '#FF4040';
    tedCtx.lineWidth = 2;
    tedCtx.stroke();
    tedCtx.fill();

    // Tail
    tedCtx.beginPath();
    tedCtx.moveTo(-tedRadius, 0);
    tedCtx.bezierCurveTo(
        -tedRadius * 1.5, -tedRadius * 0.3,
        -tedRadius * 1.8, 0,
        -tedRadius * 1.5, tedRadius * 0.3
    );
    tedCtx.stroke();

    // Legs
    for (let i = 0; i < 3; i++) {
        tedCtx.beginPath();
        const xOffset = -tedRadius * 0.5 + (i * tedRadius * 0.5);
        tedCtx.moveTo(xOffset, tedRadius * 0.2);
        tedCtx.bezierCurveTo(
            xOffset, tedRadius * 0.6,
            xOffset + tedRadius * 0.2, tedRadius * 0.6,
            xOffset + tedRadius * 0.2, tedRadius * 0.8
        );
        tedCtx.stroke();
    }

    // Eyes
    const eyeSize = tedRadius * 0.4;
    const eyeX = tedRadius * 0.5;
    const eyeY = -tedRadius * 0.2;

    // White of the eyes
    tedCtx.beginPath();
    tedCtx.fillStyle = 'white';
    tedCtx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    tedCtx.fill();
    tedCtx.strokeStyle = '#FF4040';
    tedCtx.stroke();

    // Pupils
    tedCtx.beginPath();
    tedCtx.fillStyle = 'black';
    const pupilSize = eyeSize * 0.5;
    tedCtx.arc(eyeX + pupilSize * 0.2, eyeY, pupilSize, 0, Math.PI * 2);
    tedCtx.fill();

    // Eye highlights
    tedCtx.beginPath();
    tedCtx.fillStyle = 'white';
    const highlightSize = eyeSize * 0.2;
    tedCtx.arc(eyeX - pupilSize * 0.2, eyeY - pupilSize * 0.2, highlightSize, 0, Math.PI * 2);
    tedCtx.fill();

    // Eyelashes
    tedCtx.beginPath();
    tedCtx.strokeStyle = '#FF4040';
    tedCtx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
        const lashX = eyeX + (i * eyeSize * 0.4);
        tedCtx.moveTo(lashX, eyeY - eyeSize);
        tedCtx.lineTo(lashX, eyeY - eyeSize * 1.4);
    }
    tedCtx.stroke();

    // Add a smile
    tedCtx.beginPath();
    tedCtx.strokeStyle = '#FF4040';
    tedCtx.lineWidth = 2;
    tedCtx.arc(tedRadius * 0.3, tedRadius * 0.1, tedRadius * 0.3, 0, Math.PI);
    tedCtx.stroke();

    tedCtx.restore();
}

// Call drawStartScreenTed when the page loads
window.addEventListener('load', drawStartScreenTed);

// Add near the top with other game properties
let canClaimRewards = false;

// Add this function to update the claim button state
function updateClaimButton() {
    const claimButton = document.getElementById('claimRewardsBtn');
    if (totalMULEarned > 0) {
        claimButton.classList.remove('disabled');
        canClaimRewards = true;
    } else {
        claimButton.classList.add('disabled');
        canClaimRewards = false;
    }
}

// Add event listener for claim button
document.getElementById('claimRewardsBtn').addEventListener('click', function() {
    if (!canClaimRewards) return;
    
    // Here you would typically integrate with your rewards claiming system
    alert(`Claimed ${totalMULEarned.toFixed(6)} $MUL!`);
    
    // Reset rewards after claiming
    totalMULEarned = 0;
    updateScoreAndProgress();
});

// Add this function near the other UI-related functions
function handleInviteFriends() {
    // Create the share data with new message
    const shareData = {
        title: "Ted's Candle Run",
        text: "You're invited to play Ted's Candle Run – the trading-inspired game where you earn $MUL rewards as you play! Get a 15% boost in rewards with this link.",
        url: window.location.href
    };

    // Check if the Web Share API is available
    if (navigator.share) {
        navigator.share(shareData)
            .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback for browsers that don't support Web Share API
        const tempInput = document.createElement('input');
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Game link copied to clipboard! Share it with your friends!');
    }
}

// Add this event listener after other event listeners
document.getElementById('inviteFriendsBtn').addEventListener('click', handleInviteFriends);

