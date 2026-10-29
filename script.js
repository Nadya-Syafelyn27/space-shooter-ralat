
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const finalScore = document.getElementById("finalScore");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let W = 0;
let H = 0;
let running = false;
let score = 0;
let lives = 3;
let lastTime = 0;
let shootTimer = 0;
let enemyTimer = 0;
let pointerDown = false;

let bullets = [];
let enemies = [];
let stars = [];

const player = {
  x: 0,
  y: 0,
  w: 30,
  h: 38,
  speed: 1
};

// UKURAN LAYAR
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  player.y = H - 100;
  player.x = Math.max(20, Math.min(W - 20, player.x || W / 2));

  stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 90 + 25
  }));

  drawStars(0);
drawPlayer();
}

// RESET GAME
function resetGame() {
  score = 0;
  lives = 3;

  bullets = [];
  enemies = [];

  shootTimer = 0;
  enemyTimer = 0;
  lastTime = 0;
  pointerDown = false;

  player.x = W / 2;
  player.y = H - 100;

  scoreText.textContent = score;
  livesText.textContent = lives;
}

// MULAI GAME
function startGame() {
  running = true;
  resetGame();

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

// GAME OVER
function gameOver() {
  running = false;
  pointerDown = false;

  finalScore.textContent = score;
  gameOverScreen.classList.remove("hidden");
}

// GERAKKAN PESAWAT DENGAN JARI
function movePlayer(e) {
  if (!running) return;

  const rect = canvas.getBoundingClientRect();

  player.x = e.clientX - rect.left;
  player.x = Math.max(
    player.w / 2,
    Math.min(W - player.w / 2, player.x)
  );
}

// SENTUH LAYAR = MULAI MENEMBAK
canvas.addEventListener("pointerdown", (e) => {
  if (!running) return;

  e.preventDefault();
  pointerDown = true;

  movePlayer(e);

  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (_) {}
});

canvas.addEventListener("pointermove", (e) => {
  if (!running || !pointerDown) return;

  e.preventDefault();
  movePlayer(e);
});

function stopTouch() {
  pointerDown = false;
}

canvas.addEventListener("pointerup", stopTouch);
canvas.addEventListener("pointercancel", stopTouch);
canvas.addEventListener("lostpointercapture", stopTouch);

// TEMBAK PELURU
function shoot() {
  bullets.push({
    x: player.x,
    y: player.y - 22,
    speed: 480
  });
}

// MUSUH MUNCUL DARI ATAS
function spawnEnemy() {
  enemies.push({
    x: 20 + Math.random() * Math.max(1, W - 40),
    y: -30,
    size: 18,
    speed: 100 + Math.random() * 100
  });
}

// GAMBAR PESAWAT
function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Cahaya mesin
  ctx.fillStyle = "#a879ff";
  ctx.shadowColor = "#8b5cff";
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(-7, 13);
  ctx.lineTo(0, 28 + Math.random() * 5);
  ctx.lineTo(7, 13);
  ctx.fill();

  // Badan pesawat
  ctx.fillStyle = "#45f3ff";
  ctx.shadowColor = "#45f3ff";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(0, -21);
  ctx.lineTo(15, 15);
  ctx.lineTo(5, 10);
  ctx.lineTo(0, 15);
  ctx.lineTo(-5, 10);
  ctx.lineTo(-15, 15);
  ctx.closePath();
  ctx.fill();

  // Kokpit
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 5;

  ctx.beginPath();
  ctx.ellipse(0, -5, 3, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// GAMBAR MUSUH
function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  ctx.fillStyle = "#ff3d81";
  ctx.shadowColor = "#ff174f";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(0, enemy.size);
  ctx.lineTo(-enemy.size, -enemy.size / 2);
  ctx.lineTo(-enemy.size / 2, -enemy.size);
  ctx.lineTo(enemy.size / 2, -enemy.size);
  ctx.lineTo(enemy.size, -enemy.size / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-5, -5, 3, 3);
  ctx.fillRect(2, -5, 3, 3);

  ctx.restore();
}

// LATAR BELAKANG BINTANG
function drawStars(dt) {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, W, H);

  for (const star of stars) {
    if (running) {
      star.y += star.speed * dt;

      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * W;
      }
    }

    ctx.fillStyle = "#c6c5ff";
    ctx.globalAlpha = 0.4 + star.size / 4;

    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  ctx.globalAlpha = 1;
}

// CEK TABRAKAN
function hit(a, b, distance) {
  return Math.hypot(a.x - b.x, a.y - b.y) < distance;
}

// LOOP UTAMA GAME
function update(time) {
  requestAnimationFrame(update);

  const dt = lastTime
    ? Math.min((time - lastTime) / 1000, 0.04)
    : 0;

  lastTime = time;

  drawStars(dt);

  if (!running) {
    drawPlayer();
    return;
  }

  // TEMBAK OTOMATIS SELAMA JARI MENEMPEL
  if (pointerDown) {
    shootTimer -= dt;

    if (shootTimer <= 0) {
      shoot();
      shootTimer = 0.22;
    }
  } else {
    shootTimer = 0;
  }

  // GERAKKAN PELURU
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    b.y -= b.speed * dt;

    if (b.y < -10) {
      bullets.splice(i, 1);
    }
  }

  // MUNCULKAN MUSUH
  enemyTimer += dt;

  if (enemyTimer >= 0.7) {
    spawnEnemy();
    enemyTimer = 0;
  }

  // GERAKKAN MUSUH
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    enemy.y += enemy.speed * dt;

    // MUSUH LOLOS KE BAWAH
    if (enemy.y > H + 30) {
      enemies.splice(i, 1);
      lives--;
      livesText.textContent = lives;

      if (lives <= 0) {
        gameOver();
        break;
      }

      continue;
    }

    // PESAWAT MENABRAK MUSUH
    if (
      hit(
        { x: player.x, y: player.y },
        enemy,
        enemy.size + 13
      )
    ) {
      enemies.splice(i, 1);
      lives--;
      livesText.textContent = lives;

      if (lives <= 0) {
        gameOver();
        break;
      }

      continue;
    }

    // PELURU MENGENAI MUSUH
    let destroyed = false;

    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];

      if (hit(bullet, enemy, enemy.size + 5)) {
        bullets.splice(j, 1);
        enemies.splice(i, 1);

        score += 10;
        scoreText.textContent = score;

        destroyed = true;
        break;
      }
    }

    if (destroyed) continue;
  }

  // GAMBAR PELURU
  ctx.save();

  ctx.fillStyle = "#45f3ff";
  ctx.shadowColor = "#45f3ff";
  ctx.shadowBlur = 12;

  for (const bullet of bullets) {
    ctx.fillRect(bullet.x - 2, bullet.y - 9, 4, 15);
  }

  ctx.restore();

  // GAMBAR MUSUH
  for (const enemy of enemies) {
    drawEnemy(enemy);
  }

  // GAMBAR PESAWAT
  drawPlayer();
}

// TOMBOL MULAI DAN ULANGI
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

window.addEventListener("resize", resize);

// JALANKAN GAME
resize();
requestAnimationFrame(update);
