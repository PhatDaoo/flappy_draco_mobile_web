// --- CẤU HÌNH ---
let board;
let context;

// Kích thước game nội bộ (Nhỏ để nhẹ máy)
let boardWidth = 320; 
let boardHeight = 568; 

// Draco
let dracoWidth = 60; 
let dracoHeight = 60;
let dracoX = boardWidth / 8;
let dracoY = boardHeight / 2;
let draco = { x: dracoX, y: dracoY, width: dracoWidth, height: dracoHeight, rotation: 0 };

// Vật lý
let velocityX = -3; 
let velocityY = 0;
let gravity = 0.25; 
let jumpStrength = -6;

// Cột
let pipeArray = [];
let pipeWidth = 50;
let pipeHeight = 400; 
let pipeGap = 150; // Khoảng cách khe hở
let pipeY = 0; // <--- ĐÃ THÊM LẠI BIẾN NÀY (QUAN TRỌNG)

// Game State
let score = 0;
let frameCount = 0;
let gameState = "START"; 
let dracoImg1 = new Image();
let dracoImg2 = new Image();
let currentSprite;

// --- KHỞI TẠO ---
window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    context.imageSmoothingEnabled = false; // Tắt làm mịn để tăng tốc

    dracoImg1.src = 'dd.png';
    dracoImg2.src = 'cc.png';
    currentSprite = dracoImg1;

    requestAnimationFrame(update);
    setInterval(placePipes, 1400); // Sinh cột mỗi 1.4 giây

    // Xử lý Input
    board.addEventListener("touchstart", function(e) {
        if (e.cancelable) e.preventDefault(); 
        handleInput();
    }, {passive: false});

    board.addEventListener("mousedown", handleInput);
    document.addEventListener("keydown", function(e) {
        if (e.code == "Space" || e.code == "ArrowUp") handleInput();
    });
}

// --- LOGIC CHÍNH ---
function update() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, boardWidth, boardHeight);

    // 1. LOGIC
    if (gameState === "PLAYING") {
        
        // Draco rơi
        velocityY += gravity;
        draco.y += velocityY;
        
        // Góc xoay
        if (velocityY < 0) draco.rotation = -0.3;
        else if (velocityY > 0) draco.rotation += 0.05;
        if (draco.rotation > 1.2) draco.rotation = 1.2;

        // Chạm đất
        if (draco.y + draco.height > boardHeight) {
            gameState = "GAMEOVER";
        }

        // Xử lý Cột
        for (let i = 0; i < pipeArray.length; i++) {
            let pipe = pipeArray[i];
            pipe.x += velocityX;

            // Cộng điểm
            if (!pipe.passed && draco.x > pipe.x + pipe.width) {
                score += 0.5;
                pipe.passed = true;
            }

            // Va chạm
            if (detectCollision(draco, pipe)) {
                gameState = "GAMEOVER";
            }
        }

        // Xóa cột đã trôi qua
        if (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
            pipeArray.shift();
        }

    } else if (gameState === "START") {
        // Bay nhấp nhô màn hình chờ
        draco.y = boardHeight/2 + Math.sin(Date.now()/200) * 5;
    }

    // Animation Sprite
    frameCount++;
    if (frameCount % 10 < 5) currentSprite = dracoImg1;
    else currentSprite = dracoImg2;
    if (gameState === "GAMEOVER") currentSprite = dracoImg1;

    // 2. VẼ (RENDER)
    
    // Vẽ Cột (Sửa logic vẽ để đảm bảo hiện cột)
    context.fillStyle = "#2ecc71";
    context.strokeStyle = "#1e8449"; // Viền xanh đậm
    context.lineWidth = 2;

    for (let i = 0; i < pipeArray.length; i++) {
        let p = pipeArray[i];
        // Chỉ vẽ nếu cột chưa trôi hết ra ngoài bên trái
        if (p.x + pipeWidth > 0) { 
            context.fillRect(Math.floor(p.x), Math.floor(p.y), pipeWidth, pipeHeight);
            context.strokeRect(Math.floor(p.x), Math.floor(p.y), pipeWidth, pipeHeight);
        }
    }

    // Vẽ Draco
    context.save();
    context.translate(Math.floor(draco.x + draco.width/2), Math.floor(draco.y + draco.height/2));
    context.rotate(draco.rotation);
    if (currentSprite.complete) {
        context.drawImage(currentSprite, -dracoWidth/2, -dracoHeight/2, dracoWidth, dracoHeight);
    }
    context.restore();

    // Vẽ UI
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 3; 

    if (gameState === "START") {
        context.font = "bold 40px Courier";
        context.textAlign = "center";
        context.strokeText("TAP TO START", boardWidth/2, boardHeight/2 + 80);
        context.fillText("TAP TO START", boardWidth/2, boardHeight/2 + 80);
        
        context.font = "bold 50px Courier";
        context.strokeText("FLAPPY", boardWidth/2, boardHeight/2 - 50);
        context.fillText("FLAPPY", boardWidth/2, boardHeight/2 - 50);
    } 
    else if (gameState === "GAMEOVER") {
        context.font = "bold 50px Courier";
        context.textAlign = "center";
        context.strokeText("GAME OVER", boardWidth/2, boardHeight/2);
        context.fillText("GAME OVER", boardWidth/2, boardHeight/2);
        
        context.font = "30px Courier";
        context.fillText("Score: " + Math.floor(score), boardWidth/2, boardHeight/2 + 50);
        context.fillText("Tap to Retry", boardWidth/2, boardHeight/2 + 100);
    } 
    else {
        context.font = "bold 50px Courier";
        context.textAlign = "left";
        context.strokeText(Math.floor(score), 20, 60);
        context.fillText(Math.floor(score), 20, 60);
    }
}

function placePipes() {
    if (gameState !== "PLAYING") return;

    // Tính toán vị trí Y ngẫu nhiên (Giờ đã có biến pipeY để tính đúng)
    let randomY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    
    // Cột trên
    pipeArray.push({
        x: boardWidth,
        y: randomY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    });
    // Cột dưới
    pipeArray.push({
        x: boardWidth,
        y: randomY + pipeHeight + pipeGap,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    });
}

function handleInput() {
    if (gameState === "START") {
        gameState = "PLAYING";
    } else if (gameState === "PLAYING") {
        velocityY = jumpStrength;
    } else if (gameState === "GAMEOVER") {
        // Reset game
        draco.y = dracoY;
        pipeArray = [];
        score = 0;
        velocityY = 0;
        draco.rotation = 0;
        gameState = "START";
    }
}

function detectCollision(a, b) {
    let padding = 5; 
    return a.x + padding < b.x + b.width &&
           a.x + a.width - padding > b.x &&
           a.y + padding < b.y + b.height &&
           a.y + a.height - padding > b.y;
}