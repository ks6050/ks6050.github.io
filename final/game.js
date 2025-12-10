const player = document.getElementById("player");
const heartsDiv = document.getElementById("hearts");
const xpVal = document.getElementById("xpVal");
const lvlVal = document.getElementById("lvl");
const timerEl = document.getElementById("timer");
const levelUpScreen = document.getElementById("levelUp");
const endScreen = document.getElementById("endScreen");
const endMsg = document.getElementById("endMsg");
const upSpeed = document.getElementById("upSpeed");
const upProj = document.getElementById("upProj");
const upFire = document.getElementById("upFire");


//initial stats
let px = innerWidth / 2;
let py = innerHeight / 2;
let moveX = 0;
let moveY = 0;
let speed = 4;
let facingX = 1;
let facingY = 0;
let projectileCount = 1;
let shotInterval = 500; //ms
let health = 5;
let xp = 0;
let level = 1;
let xpNeed = 5;
let paused = false;
let ended = false;

//arrays to store objects
let enemies = [];
let projectiles = [];
let enemyShots = [];
let xpOrbs = [];

//draw hearts
function drawHearts() {
  heartsDiv.innerHTML = "";
  for (let i = 0; i < health; i++) {
    const img = new Image();
    img.src = "heart.png";
    heartsDiv.appendChild(img);
  }
}

//input
let up = false, down = false, left = false, right = false;

onkeydown = e => {
  if (e.key === "w") up = true;
  if (e.key === "s") down = true;
  if (e.key === "a") left = true;
  if (e.key === "d") right = true;
};

onkeyup = e => {
  if (e.key === "w") up = false;
  if (e.key === "s") down = false;
  if (e.key === "a") left = false;
  if (e.key === "d") right = false;
};


//enemy spawn
function spawnEnemy(seconds) {
  let type = "melee";

//after 1 minutes, allow ranged to spawn
if (seconds >= 60) {
  const rand = Math.random();
  if (rand < 0.5) {
    type = "melee";
  } else {
    type = "ranged";
  }
}

const img = new Image();

//Set image
if (type === "melee") {
  img.src = "melee.png";
} else {
  img.src = "ranged.png";
}

img.className = "enemy";
document.body.appendChild(img);


  let x, y;
  const side = Math.floor(Math.random() * 4);
  if (side === 0) { x = Math.random() * innerWidth; y = -60; }
  if (side === 1) { x = Math.random() * innerWidth; y = innerHeight + 60; }
  if (side === 2) { x = -60; y = Math.random() * innerHeight; }
  if (side === 3) { x = innerWidth + 60; y = Math.random() * innerHeight; }

  enemies.push({ el: img, x, y, type, lastShot: 0 });
}

function spawnXP(x, y) {
  const orb = new Image();
  orb.src = "xp.png";
  orb.className = "xpOrb";
  document.body.appendChild(orb);
  xpOrbs.push({ el: orb, x, y });
}

//shooting

//create projectile
function createPlayerBullet(x, y, angle, speedVal) {
  const img = new Image();
  img.src = "playerShot.png";
  img.className = "projectile";
  document.body.appendChild(img);

  projectiles.push({el: img, x, y, vx: Math.cos(angle) * speedVal, vy: Math.sin(angle) * speedVal});
}

//fire bullets in a fan based on projectileCount
function firePlayerProjectiles() {
  const len = Math.hypot(facingX, facingY);
  if (len === 0) return;
  const pxCenter = px;
  const pyCenter = py;
  const baseAngle = Math.atan2(facingY, facingX);
  const bulletSpeed = 6;
  //2–7 projectiles = fan in front
  if (projectileCount > 1) {
    const totalSpread = Math.PI / 3; // 60 degrees
    const step = totalSpread / (projectileCount - 1);
    const startAngle = baseAngle - totalSpread / 2;
    for (let i = 0; i < projectileCount; i++) {
      const angle = startAngle + step * i;
      createPlayerBullet(pxCenter, pyCenter, angle, bulletSpeed);
    }
  }
  //1 projectile = straight ahead
  else {
    createPlayerBullet(pxCenter, pyCenter, baseAngle, bulletSpeed);
  }
}

//level up
function showLevelUp() {
  paused = true;
  levelUpScreen.classList.add("show");
}
function closeLevelUp() {
  levelUpScreen.classList.remove("show");
  paused = false;
}

//movement speed upgrade
upSpeed.onclick = () => {
  speed += 1;
  closeLevelUp();
};

//projectile count upgrade
upProj.onclick = () => {
  projectileCount++;
  closeLevelUp();
};

//fire rate upgrade
upFire.onclick = () => {
  shotInterval = Math.max(200, shotInterval - 200);
  closeLevelUp();
};

//game end
function endGame(win) {
  ended = true;
  paused = true;
  endMsg.textContent = win ? "You survived!" : "Game Over";
  endScreen.classList.add("show");
}

//loop
let startTime = 0;
let lastSpawn = 0;
let lastShot = 0;

function loop(t) {
  window.addEventListener("click", startMusicOnce);
  function startMusicOnce() {
      const music = document.getElementById("bgMusic");
      music.volume = 0.5;
      music.play();
      window.removeEventListener("click", startMusicOnce);
  }

  if (!startTime) {
    startTime = t;
    drawHearts();
    return requestAnimationFrame(loop);
  }

  const elapsed = t - startTime;
  const seconds = Math.floor(elapsed / 1000);
  timerEl.textContent = seconds + "s";

  if (!paused && !ended) {
    //3 minute win
    if (elapsed > 180000) {
      endGame(true);
    }

    //movement update
    let moveX = 0;
    let moveY = 0;

    if (left) {
      moveX -= 1;
    }
    if (right) {
      moveX += 1;
    }
    if (up) {
      moveY -= 1;
    }
    if (down) {
      moveY += 1;
    }

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len; 
      moveY /= len;

      px += moveX * speed;
      py += moveY * speed;

      facingX = moveX;
      facingY = moveY;
    }

    player.style.left = px + "px";
    player.style.top = py + "px";

    //auto shoot
    if (t - lastShot > shotInterval) {
      lastShot = t;
      firePlayerProjectiles();
    }

    //spawn enemy
    const spawnInterval = Math.max(1200 - Math.floor(seconds / 60) * 400, 200);
    if (t - lastSpawn > spawnInterval) {
      lastSpawn = t;
      spawnEnemy(seconds);
    }

    //enemy update
    enemies.forEach((e, idx) => {
      const dx = px - e.x;
      const dy = py - e.y;
      const len = Math.hypot(dx, dy);
      const vx = dx / len;
      const vy = dy / len;

      if (e.type === "melee") {
        e.x += vx * 1.2;
        e.y += vy * 1.2;
      } else {
        e.x += vx * 0.6;
        e.y += vy * 0.6;

        if (t - e.lastShot > 1500) {
          e.lastShot = t;

          const shot = new Image();
          shot.src = "enemyShot.png";
          shot.className = "enemyShot";
          document.body.appendChild(shot);

          enemyShots.push({
            el: shot,
            x: e.x,
            y: e.y,
            vx,
            vy
          });
        }
      }

      e.el.style.left = e.x + "px";
      e.el.style.top = e.y + "px";

      //player damage
      if (Math.hypot(px - e.x, py - e.y) < 40) {
        health--;
        drawHearts();
        spawnXP(e.x, e.y);
        e.el.remove();
        enemies.splice(idx, 1);
        if (health <= 0) endGame(false);
      }
    });

    //player projectiles
    projectiles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.el.style.left = p.x + "px";
      p.el.style.top = p.y + "px";

      enemies.forEach((e, j) => {
        if (Math.hypot(p.x - e.x, p.y - e.y) < 35) {
          spawnXP(e.x, e.y);
          e.el.remove();
          enemies.splice(j, 1);
          p.el.remove();
          projectiles.splice(idx, 1);
        }
      });
    });


    //enemy projectiles
    enemyShots.forEach((s, idx) => {
      s.x += s.vx * 3;
      s.y += s.vy * 3;
      s.el.style.left = s.x + "px";
      s.el.style.top = s.y + "px";

      if (Math.hypot(px - s.x, py - s.y) < 30) {
        health--;
        drawHearts();
        s.el.remove();
        enemyShots.splice(idx, 1);
        if (health <= 0) endGame(false);
      }
    });

    //xp pickup
    xpOrbs.forEach((o, idx) => {
      o.el.style.left = o.x + "px";
      o.el.style.top = o.y + "px";

      if (Math.hypot(px - o.x, py - o.y) < 50) {
        xp++;
        xpVal.textContent = xp;
        o.el.remove();
        xpOrbs.splice(idx, 1);

        if (!paused && xp >= xpNeed) {
          xp -= xpNeed;
          xpNeed += 5;
          level++;
          lvlVal.textContent = level;

          health = 5;
          drawHearts();

          showLevelUp();
        }
      }
    });
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
