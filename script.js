/**
 * Neon Sphere Survival - Core Game Logic
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreValue');
const highScoreEl = document.getElementById('highScoreValue');
const timeEl = document.getElementById('timeValue');
const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const finalTimeEl = document.getElementById('finalTime');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Game State
let state = 'START';
let score = 0;
let highScore = localStorage.getItem('neonSphereHighScore') || 0;
let startTime = 0;
let currentTime = 0;
let lastTime = 0;
let enemies = [];
let collectibles = [];
let particles = [];
let player = null;
let spawnTimer = 0;
let collectibleTimer = 0;

const SPAWN_INTERVAL = 1000;
const COLLECTIBLE_INTERVAL = 3000;

// Constants
const PLAYER_RADIUS = 15;
const ENEMY_RADIUS_MIN = 10;
const ENEMY_RADIUS_MAX = 30;
const COLLECTIBLE_RADIUS = 8;
const INITIAL_ENEMY_COUNT = 3;

const COLORS = {
    player: '#38bdf8',
    enemy: '#f43f5e',
    collectible: '#fbbf24',
    particle: '#ffffff'
};

// Update high score display immediately
highScoreEl.innerText = highScore;

/**
 * Entity Classes
 */
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }
}

class Player extends Ball {
    constructor() {
        super(canvas.width / 2, canvas.height / 2, PLAYER_RADIUS, COLORS.player);
        this.targetX = this.x;
        this.targetY = this.y;
    }

    update() {
        this.x += (this.targetX - this.x) * 0.15;
        this.y += (this.targetY - this.y) * 0.15;
    }
}

class Enemy extends Ball {
    constructor(x, y, radius, dx, dy) {
        super(x, y, radius, COLORS.enemy);
        this.dx = dx;
        this.dy = dy;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.dx *= -1;
            this.x = this.x - this.radius < 0 ? this.radius : canvas.width - this.radius;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.dy *= -1;
            this.y = this.y - this.radius < 0 ? this.radius : canvas.height - this.radius;
        }
    }
}

class Collectible extends Ball {
    constructor(x, y) {
        super(x, y, COLLECTIBLE_RADIUS, COLORS.collectible);
        this.pulse = 0;
    }

    draw() {
        this.pulse += 0.1;
        const currentRadius = this.radius + Math.sin(this.pulse) * 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        this.dx = (Math.random() - 0.5) * 10;
        this.dy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.alpha -= this.decay;
    }
}

/**
 * Game Mechanics
 */
function init() {
    resize();
    player = new Player();
    enemies = [];
    collectibles = [];
    particles = [];
    score = 0;
    currentTime = 0;
    spawnTimer = 0;
    collectibleTimer = 0;
    
    scoreEl.innerText = score;
    highScoreEl.innerText = highScore;

    for (let i = 0; i < INITIAL_ENEMY_COUNT; i++) {
        spawnEnemy();
    }
}

function spawnEnemy() {
    const radius = Math.random() * (ENEMY_RADIUS_MAX - ENEMY_RADIUS_MIN) + ENEMY_RADIUS_MIN;
    let x, y;
    
    do {
        x = Math.random() * (canvas.width - radius * 2) + radius;
        y = Math.random() * (canvas.height - radius * 2) + radius;
    } while (Math.hypot(x - player.x, y - player.y) < radius + player.radius + 150);

    const speed = 2 + (currentTime / 10000);
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    
    enemies.push(new Enemy(x, y, radius, dx, dy));
}

function spawnCollectible() {
    let x, y;
    const radius = COLLECTIBLE_RADIUS;
    
    do {
        x = Math.random() * (canvas.width - radius * 2) + radius;
        y = Math.random() * (canvas.height - radius * 2) + radius;
    } while (Math.hypot(x - player.x, y - player.y) < 100);

    collectibles.push(new Collectible(x, y));
}

function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Main Loop
 */
function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === 'PLAYING') {
        currentTime += deltaTime;
        spawnTimer += deltaTime;
        collectibleTimer += deltaTime;

        if (spawnTimer > SPAWN_INTERVAL) {
            spawnEnemy();
            spawnTimer = 0;
            score += 5; // Passive score gain
            updateScore();
        }

        if (collectibleTimer > COLLECTIBLE_INTERVAL) {
            spawnCollectible();
            collectibleTimer = 0;
        }

        // Update & Draw Player
        player.update();
        player.draw();

        // Update & Draw Collectibles
        collectibles = collectibles.filter(c => {
            c.draw();
            const dist = Math.hypot(player.x - c.x, player.y - c.y);
            if (dist < player.radius + c.radius) {
                score += 50;
                updateScore();
                createExplosion(c.x, c.y, COLORS.collectible, 10);
                return false;
            }
            return true;
        });

        // Update & Draw Enemies
        enemies.forEach((enemy) => {
            enemy.update();
            enemy.draw();

            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < player.radius + enemy.radius) {
                gameOver();
            }
        });

        // Update HUD
        timeEl.innerText = (currentTime / 1000).toFixed(1) + 's';
    }

    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

function updateScore() {
    scoreEl.innerText = score;
    if (score > highScore) {
        highScore = score;
        highScoreEl.innerText = highScore;
        localStorage.setItem('neonSphereHighScore', highScore);
    }
}

function startGame() {
    state = 'PLAYING';
    startTime = performance.now();
    lastTime = startTime;
    overlay.classList.remove('active');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    init();
}

function gameOver() {
    state = 'GAMEOVER';
    createExplosion(player.x, player.y, COLORS.player, 30);
    createExplosion(player.x, player.y, COLORS.enemy, 20);
    
    overlay.classList.add('active');
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = score;
    bestScoreEl.innerText = highScore;
    finalTimeEl.innerText = (currentTime / 1000).toFixed(1) + 's';
}

/**
 * Event Listeners
 */
window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
    if (player) {
        player.targetX = e.clientX;
        player.targetY = e.clientY;
    }
});

window.addEventListener('touchstart', (e) => {
    if (player && e.touches[0]) {
        player.targetX = e.touches[0].clientX;
        player.targetY = e.touches[0].clientY;
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (player && e.touches[0]) {
        player.targetX = e.touches[0].clientX;
        player.targetY = e.touches[0].clientY;
        e.preventDefault();
    }
}, { passive: false });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start Animation Loop
requestAnimationFrame(animate);
