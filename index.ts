let canvasElem = document.getElementById("canvas") as HTMLCanvasElement;
let canvasBounds = canvasElem.getBoundingClientRect();
let ctx = canvasElem.getContext("2d")!;

interface Circle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  player: boolean;
}

let circles: Circle[] = [
  {
    x: 100,
    y: 75,
    r: 25,
    vx: 1,
    vy: 0.4,
    player: true,
  },
];

//*
for (let i = 0; i < 1; i++) {
  circles.push({
    x: Math.random() * canvasBounds.width,
    y: Math.random() * canvasBounds.height,
    r: (Math.random() - Math.random()) * 25 + 25,
    vx: Math.random(),
    vy: Math.random(),
    player: false,
  });
}
// */

let inputs: { x: number; y: number }[] = [];

function clamp(x: number, min: number, max: number) {
  if (x > max) return max;
  if (x < min) return min;
  return x;
}

function updateCircle(c: Circle) {
  c.x += c.vx;
  if (c.x - c.r < 0 || c.x + c.r >= canvasBounds.width) {
    c.vx = -c.vx;
    c.x = clamp(c.x, 0 + c.r, canvasBounds.width - c.r);
  }
  c.y += c.vy;
  if (c.y - c.r < 0 || c.y + c.r >= canvasBounds.height) {
    c.vy = -c.vy;
    c.y = clamp(c.y, 0 + c.r, canvasBounds.height - c.r);
  }
}

function collides(c1: Circle, c2: Circle) {
  return Math.hypot(c1.x - c2.x, c1.y - c2.y) < c1.r + c2.r;
}
const THRUST = 0.1;

function spawnPopCircle(c: Circle, dx: number, dy: number) {
  circles.push({
    ...c,
    x: c.x + 30 * dx,
    y: c.y + 30 * dy,
    vx: dx * Math.random(),
    vy: dy * Math.random(),
  });
}

const INV_CONTROLS = -1;

function update() {
  while (inputs.length > 0) {
    let i = inputs.shift()!;
    for (let ci = 0; ci < circles.length; ci++) {
      let c = circles[ci];
      if (c.player && c.r > 0.5) {
        let dx = INV_CONTROLS * (i.x - c.x);
        let dy = INV_CONTROLS * (i.y - c.y);
        let dist = Math.hypot(dx, dy);
        let nx = dx / dist;
        let ny = dy / dist;
        c.vx += nx * THRUST;
        c.vy += ny * THRUST;
        c.r -= 0.5;
        circles.push({
          r: 0.5,
          x: c.x - nx * c.r,
          y: c.y - ny * c.r,
          vx: -c.vx,
          vy: -c.vy,
          player: true,
        });
      }
    }
  }
  circles.forEach((c) => {
    updateCircle(c);
  });
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      if (collides(circles[i], circles[j])) {
        let ri = circles[i].r;
        let rj = circles[j].r;
        if (ri > rj) {
          circles[i].r += 0.1;
          circles[j].r -= 0.1;
          if (circles[i].r > 75) {
            circles[i].r /= 5;
            spawnPopCircle(circles[i], -1, -1);
            spawnPopCircle(circles[i], -1, 1);
            spawnPopCircle(circles[i], 1, -1);
            spawnPopCircle(circles[i], 1, 1);
          }
          if (circles[j].r <= 0) circles.splice(j, 1);
        } else {
          circles[i].r -= 0.1;
          circles[j].r += 0.1;
          if (circles[j].r > 75) circles[j].r = circles[j].r / 5;
          if (circles[i].r <= 0) circles.splice(i, 1);
        }
      }
    }
  }
}

function drawCircle(c: Circle) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, canvasBounds.width, canvasBounds.height);
  circles.forEach((c) => {
    if (c.player) ctx.strokeStyle = "#0000ff";
    else ctx.strokeStyle = "#ff0000";
    drawCircle(c);
  });
}

const FPS = 30;
const SLEEP = 1000 / FPS;

function gameLoop() {
  let before = Date.now();
  update();
  draw();
  let after = Date.now();
  let sleep = SLEEP - (after - before);
  if (sleep < 5) console.log("Stayed up all night!");
  setTimeout(() => gameLoop(), sleep);
}
gameLoop();

canvasElem.addEventListener(
  "click",
  (evt) => {
    let mousePos = {
      x: evt.clientX - canvasBounds.left,
      y: evt.clientY - canvasBounds.top,
    };
    inputs.push(mousePos);
  },
  false
);

console.log("Working");
