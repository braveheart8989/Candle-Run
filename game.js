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
    height: 20,
    color: 'blue',
    visible: true  // New property to control visibility
};

// Player properties
const player = {
    x: canvas.width / 2 - 15,
    y: startPlatform.y - 30, // Update this line
    width: 20,  // Smaller player for mobile
    height: 20,
    jumpForce: 12,
    velocityY: 0,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 3,
    color: 'blue'
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
        ctx.fillRect(startPlatform.x, startPlatform.y - camera.y, startPlatform.width, startPlatform.height);
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
    const playerTopY = player.y;
    const playerBottomY = player.y + player.height;

    // Increase sensitivity for both upward and downward tracking
    const trackingThreshold = camera.height * 0.3; // Reduced from 0.4 to 0.3 for quicker response
    const trackingSpeed = 0.2; // Increased from 0.1 to 0.2 for faster camera movement

    if (playerTopY < cameraTopY + trackingThreshold) {
        // Faster upward camera movement
        camera.y += (playerTopY - (cameraTopY + trackingThreshold)) * trackingSpeed;
    } 
    else if (playerBottomY > cameraBottomY - trackingThreshold) {
        // Faster downward camera movement
        camera.y += (playerBottomY - (cameraBottomY - trackingThreshold)) * trackingSpeed;
    }

    // Remove the vertical deadzone to allow for more precise tracking
    // if (Math.abs(camera.y - player.y) < 5) {
    //     camera.y = player.y;
    // }

    // Ensure the camera doesn't go below the ground level
    camera.y = Math.max(0, camera.y);
}

function updatePlayer() {
    player.velocityY += 0.4;
    player.y += player.velocityY;

    const maxFallSpeed = 6;
    if (player.velocityY > maxFallSpeed) {
        player.velocityY = maxFallSpeed;
    }

    let onPlatform = false;
    let lowestCandleY = -Infinity;

    // Check collision with start platform only if it's visible
    if (startPlatform.visible &&
        player.x + player.width > startPlatform.x &&
        player.x < startPlatform.x + startPlatform.width &&
        player.y + player.height > startPlatform.y &&
        player.y + player.height < startPlatform.y + startPlatform.height
    ) {
        player.y = startPlatform.y - player.height;
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
            player.x + player.width > candle.x &&
            player.x < candle.x + candlestickWidth &&
            player.y + player.height > candleTop &&
            player.y + player.height < candleTop + 10
        ) {
            if (!onPlatform && player.velocityY > 0) {
                // Increase rewards by 4x
                const mulEarned = (Math.random() * (MAX_MUL_PER_JUMP - MIN_MUL_PER_JUMP) + MIN_MUL_PER_JUMP) * 4;
                totalMULEarned += parseFloat(mulEarned.toFixed(6));
            }
            player.y = candleTop - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            player.jumpCount = 0;
            onPlatform = true;
        }
    });

    player.x = canvas.width / 2 - player.width / 2;

    // Check if player has fallen below the lowest candle
    if (player.y > lowestCandleY + 200) {
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
        if (startPlatform.visible && player.y === startPlatform.y - player.height) {
            startPlatform.visible = false;
        }
    }
}

// Update the game loop
function gameLoop() {
    if (!gameStarted) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    updatePlayer();
    
    if (!gameOver) {
        // Generate candlesticks if needed
        if (candlesticks.length === 0) {
            generateCandlesticks();
        }
        
        // Move candlesticks
        for (const candle of candlesticks) {
            candle.x -= gameSpeed;
        }
        
        // Remove off-screen candlesticks and generate new ones
        if (candlesticks[0].x + candlestickWidth < 0) {
            candlesticks.shift();
            score++; // Keep this for level progression
            generateCandlesticks();
        }
        
        // Increase game speed
        gameSpeed = isMobile() ? 1 + (score / levelLength) : 1.5 + (score / levelLength) * 2;

        // Check for level completion
        if (score >= levelLength) {
            gameOver = true;
            showGameOver(true);
            return;
        }
    }
    
    // Apply camera transformation
    ctx.save();
    ctx.translate(0, -camera.y);
    
    // Draw game elements
    drawCandlesticks();
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Restore canvas state
    ctx.restore();
    
    // Update score and progress bar (draw these after restoring canvas state)
    updateScoreAndProgress();
    
    // Update price scale
    updatePriceScale();

    // Request next frame if the game is not over
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
    canvas.width = gameContainer.clientWidth - 60; // Subtract the width of the price scale
    canvas.height = gameContainer.clientHeight;
    
    // Adjust player position
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2;
    
    // Set start platform size and position
    startPlatform.width = player.width * 7;  // 3 times wider on each side, plus player width
    startPlatform.x = canvas.width / 2 - startPlatform.width / 2;  // Center the platform
    startPlatform.y = canvas.height / 2 + 100;
    
    // Set player's vertical position relative to the platform
    player.y = startPlatform.y - player.height;

    // Adjust camera position
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

    gameOverTitle.textContent = victory ? 'Level Complete!' : 'Game Over';
    rewardsText.textContent = `$MUL Rewards: ${totalMULEarned.toFixed(6)}`;
    const usdValue = (totalMULEarned * MUL_CURRENT_PRICE).toFixed(2);
    usdValueText.textContent = `(Approx. $${usdValue} USD)`;

    gameOverScreen.style.display = 'flex';
}

// Add this helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
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

// Modify the resetGame function
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
}

// Modify the startGame function to ensure it sets up the game properly
function startGame() {
    gameStarted = true;
    gameOver = false;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameUI').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';
    resetGame();
    requestAnimationFrame(gameLoop);
}

// Add this event listener for the start game button
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn').addEventListener('click', startGame);
document.getElementById('homeBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameUI').style.display = 'none';
    resetGame();
});

// Instead, add this line to set up the initial canvas size
setCanvasSize();

