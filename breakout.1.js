document.addEventListener('DOMContentLoaded', function() {
    const highContent = document.getElementById('high-content');
    const scoreContent = document.getElementById('score-content');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const startContainer = document.querySelector('.start-container');
    const startBtn = document.getElementById('start-btn');
    const difficulty = document.getElementById('difficulty');

    canvas.width = 800;
    canvas.height = 600;
    canvas.style.backgroundColor = 'black';

    let highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
    let currentScore = 0;
    let gameStarted = false;
    let animationFrameId;
    let paddlePowerUp = false;
    let multiBallPowerUp = false;
    let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2 }];
    let paddleHeight = 10;
    let paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;

    const bricks = [];
    const brickShapes = ['rectangle', 'circle', 'triangle'];
    const brickScores = { rectangle: 1, circle: 2, triangle: 3 };

    // Generate random shapes for bricks
    const brickRows = 5;
    const brickColumns = 9;
    const brickWidth = (canvas.width - (brickColumns - 1) * brickPadding - 2 * brickOffsetLeft) / brickColumns;
    const brickHeight = 20;

    for (let c = 0; c < brickColumns; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRows; r++) {
            const shape = brickShapes[Math.floor(Math.random() * brickShapes.length)];
            bricks[c][r] = { x: 0, y: 0, status: 1, shape, score: brickScores[shape], powerUp: Math.random() < 0.1 };
        }
    }

    function drawBrick(b, x, y) {
        ctx.beginPath();
        switch (b.shape) {
            case 'rectangle':
                ctx.rect(x, y, brickWidth, brickHeight);
                break;
            case 'circle':
                ctx.arc(x + brickWidth / 2, y + brickHeight / 2, brickHeight / 2, 0, Math.PI * 2);
                break;
            case 'triangle':
                ctx.moveTo(x, y + brickHeight);
                ctx.lineTo(x + brickWidth / 2, y);
                ctx.lineTo(x + brickWidth, y + brickHeight);
                ctx.closePath();
                break;
        }
        ctx.fillStyle = getBrickColor();
        ctx.fill();
        if (b.powerUp) {
            ctx.fillStyle = 'red';
            ctx.fillRect(x + 10, y + 5, brickWidth - 20, brickHeight - 10);
        }
    }

    function drawBricks() {
        for (let c = 0; c < brickColumns; c++) {
            for (let r = 0; r < brickRows; r++) {
                const b = bricks[c][r];
                if (b.status == 1) {
                    const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                    const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                    bricks[c][r].x = brickX;
                    bricks[c][r].y = brickY;
                    drawBrick(b, brickX, brickY);
                }
            }
        }
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    function drawScore() {
        scoreContent.textContent = `Score: ${currentScore}`;
        ctx.font = "16px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Score: " + currentScore, 8, 20);
    }

    function drawHighScore() {
        highContent.textContent = `High Score: ${highScore}`;
        ctx.font = "16px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("High Score: " + highScore, canvas.width - 130, 20);
    }

    function drawBall(ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    function collisionDetection() {
        balls.forEach((ball) => {
            for (let c = 0; c < brickColumns; c++) {
                for (let r = 0; r < brickRows; r++) {
                    const b = bricks[c][r];
                    if (b.status == 1) {
                        if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                            ball.dy = -ball.dy;
                            b.status = 0;
                            currentScore += b.score;

                            if (b.powerUp) {
                                activateMultiBallPowerUp();
                            }

                            if (currentScore == brickRows * brickColumns * 3) {
                                alert("YOU WIN, CONGRATULATIONS!");
                                resetGame();
                            }
                        }
                    }
                }
            }
        });
    }

    function activateMultiBallPowerUp() {
        if (!multiBallPowerUp) {
            multiBallPowerUp = true;
            const newBalls = balls.map(ball => ({
                x: ball.x, y: ball.y, dx: ball.dx, dy: ball.dy * -1
            }));
            balls = balls.concat(newBalls);
        }

        setTimeout(() => multiBallPowerUp = false, 15000); // Deactivate after 15 seconds
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        balls.forEach(drawBall);
        drawPaddle();
        drawScore();
        drawHighScore();
        collisionDetection();

        balls.forEach((ball) => {
            if (ball.x + ball.dx > canvas.width - 10 || ball.x + ball.dx < 10) {
                ball.dx = -ball.dx;
            }

            if (ball.y + ball.dy < 10) {
                ball.dy = -ball.dy;
            } else if (ball.y + ball.dy > canvas.height - 10) {
                if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                    ball.dy = -ball.dy;
                } else {
                    balls = balls.filter(b => b !== ball);
                }
            }

            ball.x += ball.dx;
            ball.y += ball.dy;
        });

        if (balls.length === 0) {
            if (gameStarted) {
                cancelAnimationFrame(animationFrameId);
                gameOver();
                return;
            }
        }

        if (rightPressed && paddleX < canvas.width - paddleWidth) {
            paddleX += 7;
        } else if (leftPressed && paddleX > 0) {
            paddleX -= 7;
        }

        animationFrameId = requestAnimationFrame(draw);
    }

    function keyDownHandler(e) {
        if (e.key == "Right" || e.key == "ArrowRight") {
            rightPressed = true;
        } else if (e.key == "Left" || e.key == "ArrowLeft") {
            leftPressed = true;
        }
    }

    function keyUpHandler(e) {
        if (e.key == "Right" || e.key == "ArrowRight") {
            rightPressed = false;
        } else if (e.key == "Left" || e.key == "ArrowLeft") {
            leftPressed = false;
        }
    }

    function mouseMoveHandler(e) {
        const relativeX = e.clientX - canvas.offsetLeft;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
        }
    }

    function gameOver() {
        alert("GAME OVER");
        resetGame();
    }

    function resetGame() {
        currentScore = 0;
        gameStarted = true;
        balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2 }];
        paddleX = (canvas.width - paddleWidth) / 2;
        bricks.forEach((col) => col.forEach((brick) => {
            brick.status = 1;
            brick.shape = brickShapes[Math.floor(Math.random() * brickShapes.length)];
            brick.score = brickScores[brick.shape];
            brick.powerUp = Math.random() < 0.1;
        }));
        scoreContent.textContent = `Score: ${currentScore}`;
        draw();
    }

    function getBrickColor() {
        const level = difficulty.value;
        switch (level) {
            case 'easy':
                return 'orange';
            case 'medium':
                return 'green';
            case 'hard':
                return 'yellow';
            default:
                return 'grey';
        }
    }

    startBtn.addEventListener('click', function() {
        if (!gameStarted) {
            gameStarted = true;
            startContainer.style.display = 'none';
            resetGame();
        }
    });

    difficulty.addEventListener('change', function() {
        resetGame();
    });

    document.addEventListener('keydown', keyDownHandler, false);
    document.addEventListener('keyup', keyUpHandler, false);
    canvas.addEventListener('mousemove', mouseMoveHandler, false);

    resetGame(); // Initial reset to start the game
});
