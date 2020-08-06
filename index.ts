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

const POP_SIZE = 75;

let circles: Circle[] = [
  {
    x: canvasBounds.width / 2,
    y: canvasBounds.height / 2,
    r: 25,
    vx: 0,
    vy: 0,
    player: true,
  },
];

const LEVELS = [
  [
    //    (POP_SIZE - 25) / 3,
    //    (POP_SIZE - 25) / 3,
    //    (POP_SIZE - 25) / 3,
    //    (POP_SIZE - 25) / 3,
  ],
];
let currentLevel = 0;

//*
for (let i = 0; i < LEVELS[currentLevel].length; i++) {
  circles.push({
    x: Math.random() * canvasBounds.width,
    y: Math.random() * canvasBounds.height,
    r: LEVELS[currentLevel][i],
    vx: Math.random(),
    vy: Math.random(),
    player: false,
  });
}
// */

let mousePos = { x: 0, y: 0 };
let mouseDown = false;

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

function popCircle(big: Circle, smallIndex: number) {
  let eaten = 0.1;
  if (circles[smallIndex].r < 0.2) eaten = 0.2;
  big.r += 0.1;
  circles[smallIndex].r -= 0.1;
  if (big.r > POP_SIZE) {
    big.r /= 5;
    spawnPopCircle(big, -1, -1);
    spawnPopCircle(big, -1, 1);
    spawnPopCircle(big, 1, -1);
    spawnPopCircle(big, 1, 1);
  }
  if (circles[smallIndex].r <= 0) circles.splice(smallIndex, 1);
}

let leftButton: Button | null = null;
let rightButton: Button | null = null;

function update() {
  if (mouseDown) {
    for (let ci = 0; ci < circles.length; ci++) {
      let c = circles[ci];
      if (c.player && c.r > 0.5) {
        let dx = INV_CONTROLS * (mousePos.x - c.x);
        let dy = INV_CONTROLS * (mousePos.y - c.y);
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
        if (circles[i].r > circles[j].r) {
          popCircle(circles[i], j);
        } else {
          popCircle(circles[j], i);
        }
      }
    }
  }
  let hasWon = circles.every((c) => c.player);
  if (hasWon) {
    circles = [];
    leftButton = {
      x: canvasBounds.width / 2 - 100 - MARGIN,
      y: canvasBounds.height / 2,
      size: 100,
      text: "Absorb faster",
    };
    rightButton = {
      x: canvasBounds.width / 2 + MARGIN,
      y: canvasBounds.height / 2,
      size: 100,
      text: "Grow bigger",
    };
  }
}

function drawCircle(c: Circle) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
  ctx.stroke();
}

const MARGIN = 10;

interface Button {
  x: number;
  y: number;
  size: number;
  text: string;
  effect?: () => void;
}

function drawButton(b: Button | null) {
  if (b === null) return;
  ctx.strokeStyle = "#000000";
  ctx.font = "15px Comic Sans MS";
  let met = ctx.measureText(b.text);
  ctx.strokeRect(b.x, b.y, 100, 100);
  ctx.fillText(b.text, b.x + (b.size - met.width) / 2, b.y + b.size / 2);
}

function draw() {
  ctx.clearRect(0, 0, canvasBounds.width, canvasBounds.height);
  if (circles.length == 0) {
    ctx.font = "30px Comic Sans MS";
    let met = ctx.measureText("You won! Woo");
    ctx.fillText(
      "You won! Woo",
      (canvasBounds.width - met.width) / 2,
      canvasBounds.height / 2 - 30
    );

    drawButton(leftButton);
    drawButton(rightButton);
  } else {
    circles.forEach((c) => {
      if (c.player) ctx.strokeStyle = "#0000ff";
      else ctx.strokeStyle = "#ff0000";
      drawCircle(c);
    });
  }
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
  "mousemove",
  (evt) => {
    mousePos = {
      x: evt.clientX - canvasBounds.left,
      y: evt.clientY - canvasBounds.top,
    };
  },
  false
);

canvasElem.addEventListener(
  "mouseup",
  (evt) => {
    mouseDown = false;
  },
  false
);

canvasElem.addEventListener(
  "mousedown",
  (evt) => {
    mouseDown = true;
  },
  false
);

console.log("Working");
