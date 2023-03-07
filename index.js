const MENU = 0;
const INTERMISSION = 1;
const GAME = 2;
const LOST = 3;
const WON = 4;

const MOTION_COOLDOWN = .1;

const WIN_SCORE = 50;

const INITIAL_GAME_DURATION = 10;
const INTERMISSION_DURATION = 3;

const COLORS = [
    "red",
    "green",
    "blue",
    "yellow",
    "pink",
    "brown",
    "purple",
    "magenta",
    "lime"
];

const canvas  = document.getElementById("game");
const canvasCtx = canvas.getContext("2d");

const catSprite = document.getElementById("cat");
const sadCatSprite = document.getElementById("cat-sad");
const happyCatSprite = document.getElementById("cat-happy");
const arrowUpSprite = document.getElementById("arrow-up");
const arrowDownSprite = document.getElementById("arrow-down");
const arrowRightSprite = document.getElementById("arrow-right");
const arrowLeftSprite = document.getElementById("arrow-left");
const playSprite = document.getElementById("play");

const isTouchEnabled = "ontouchstart" in document.documentElement;

const tiles = [];

let gameDuration = INITIAL_GAME_DURATION;

let title;

let currentColor;

let score = 0;
let highscore = Number.parseInt(localStorage.getItem("highscore") || "0");

let state;

let catX = 0;
let catY = 0;

function saveHighscore() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("highscore", highscore.toString());
    }
}

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function clearTiles() {
    for (let i = 0; i < 100; i++) {
        tiles[i] = undefined;
    }
}

function randomizeTiles() {
    for (let i = 0; i < 100; i++) {
        tiles[i] = getRandomColor();
    }
}

function onlyCurrentColorTiles() {
    for (let i = 0; i < 100; i++) {
        if (tiles[i] != currentColor) {
            tiles[i] = undefined;
        }
    }
}

function getTileAt(x, y) {
    return tiles[x + y * 10];
}

function renderTiles() {
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            let color = getTileAt(x, y);
            if (color) {
                canvasCtx.fillStyle = color;
                canvasCtx.fillRect(x * 32, y * 32, 32, 32);
            }
        }
    }
}

function renderCat() {
    canvasCtx.drawImage(state == LOST ? sadCatSprite : state == WON ? happyCatSprite : catSprite, catX * 32 + 4, catY * 32 + 4);
}

function renderTitle() {
    if (title) {
        canvasCtx.fillStyle = "white";
        canvasCtx.font = "24px serif";
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "top";
        canvasCtx.fillText(title, 160, 4);
    }
}

function renderCurrentColor() {
    if (state == GAME) {
        canvasCtx.fillStyle = "white";
        canvasCtx.fillRect(148, 36, 24, 24);
        canvasCtx.fillStyle = currentColor;
        canvasCtx.fillRect(149, 37, 22, 22);
    }
}

function renderScore() {
    canvasCtx.fillStyle = "white";
    canvasCtx.font = "16px serif";
    canvasCtx.textAlign = "end";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText("Счёт: " + score, 312, 312);
}

function renderHighscore() {
    canvasCtx.fillStyle = "white";
    canvasCtx.font = "16px serif";
    canvasCtx.textAlign = "start";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText("Рекорд: " + highscore, 4, 312);
}

function renderArrows() {
    canvasCtx.drawImage(arrowUpSprite, 104, 296);
    canvasCtx.drawImage(arrowDownSprite, 136, 296);
    canvasCtx.drawImage(arrowLeftSprite, 168, 296);
    canvasCtx.drawImage(arrowRightSprite, 200, 296);
}

function renderPlayButton() {
    canvasCtx.drawImage(playSprite, 148, 148);
}

function render() {
    canvasCtx.clearRect(0, 0, 320, 320);
    renderTiles();
    renderCat();
    renderTitle();
    renderCurrentColor();
    renderScore();
    renderHighscore();
    if (isTouchEnabled) {
        renderArrows();
        if (state == MENU || state == LOST || state == WON) {
            renderPlayButton();
        }
    }
}

let lastMoved = 0;
function move(x, y) {
    let now = new Date().getTime();
    if (now - lastMoved < MOTION_COOLDOWN * 1000 || (state != GAME && state != INTERMISSION)) {
        return;
    }
    catX += x;
    catY += y;
    lastMoved = now;
    render();
}

function moveDown() {
    if (catY < 9) {
        move(0, 1);
    }
}

function moveUp() {
    if (catY > 0) {
        move(0, -1);
    }
}

function moveRight() {
    if (catX < 9) {
        move(1, 0);
    }
}

function moveLeft() {
    if (catX > 0) {
        move(-1, 0);
    }
}

function timer(info, seconds, callback) {
    title = info + ": " + Math.floor(seconds);
    render();
    setTimeout(--seconds > 0 ? () => timer(info, seconds, callback) : callback, seconds + 1 >= 1 ? 1000 : (seconds + 1) * 1000);
}

function win() {
    state = WON;
    saveHighscore();
    title = "Победа";
    canMove = false;
    clearTiles();
    render();
}

function lose() {
    state = LOST;
    saveHighscore();
    title = "Игра окончена";
    canMove = false;
    clearTiles();
    render();
}

function next() {
    if (getTileAt(catX, catY) == currentColor) {
        score++;
        gameDuration = INITIAL_GAME_DURATION - Math.min(score / (WIN_SCORE / 10), 3);
        if (score >= WIN_SCORE) {
            win();
        }
        else {
            intermission();
        }
    }
    else {
        lose();
    }
}

function game() {
    state = GAME;
    currentColor = getRandomColor();
    randomizeTiles();
    render();
    timer("Встань на цвет", gameDuration, next);
}

function intermission() {
    state = INTERMISSION;
    onlyCurrentColorTiles();
    render();
    timer("Перерыв", INTERMISSION_DURATION, game);
}

function menu() {
    state = MENU;
    title = isTouchEnabled ? "Нажми чтобы начать" : "Нажми Enter чтобы начать";
    render();
}

function reset() {
    score = 0;
    gameDuration = INITIAL_GAME_DURATION;
    intermission();
}

function play() {
    switch (state) {
        case MENU:
            intermission();
            break;
        case LOST:
        case WON:
            reset();
            break;
    }
}

if (isTouchEnabled) {
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        let touch = e.touches[0] || e.changedTouches[0];
        let rect = canvas.getBoundingClientRect();
        let x = (touch.clientX - rect.x) / rect.width * 320;
        let y = (touch.clientY - rect.y) / rect.height * 320;
        if (y > 288 && y < 320) {
            if (x > 96 && x < 128) {
                moveUp();
            }
            else if (x > 128 && x < 160) {
                moveDown();
            }
            else if (x > 160 && x < 192) {
                moveLeft();
            }
            else if (x > 192 && x < 224) {
                moveRight();
            }
        }
        else if (x > 144 && x < 176 && y > 144 && y < 176) {
            play();
        }
    }, false);
}
else {
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "ArrowUp":
                moveUp();
                break;
            case "ArrowDown":
                moveDown();
                break;
            case "ArrowRight":
                moveRight();
                break;
            case "ArrowLeft":
                moveLeft();
                break;
            case "Enter":
                play();
                break;
        }
    });
}

title = "Загрузка...";
renderTitle();
window.onload = menu;
