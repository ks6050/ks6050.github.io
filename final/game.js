const player = document.getElementById("player");

// starting pos (center)
let x = window.innerWidth / 2 - player.clientWidth / 2;
let y = window.innerHeight / 2 - player.clientHeight / 2;

const keys = {};
const speed = 4;

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(k)) {
    e.preventDefault();
    keys[k] = true;
  }
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(k)) {
    keys[k] = false;
  }
});

function update() {
  if (keys["w"]) y -= speed;
  if (keys["s"]) y += speed;
  if (keys["a"]) x -= speed;
  if (keys["d"]) x += speed;

  // window bounds
  const maxX = window.innerWidth - player.clientWidth;
  const maxY = window.innerHeight - player.clientHeight;

  if (x < 0) x = 0;
  if (x > maxX) x = maxX;
  if (y < 0) y = 0;
  if (y > maxY) y = maxY;

  player.style.left = x + "px";
  player.style.top = y + "px";

  requestAnimationFrame(update);
}

update();
