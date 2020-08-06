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
let absorbSpeed = 0.1;
let popSize = POP_SIZE;
let thrustSpeed = 0.1;
const INITIAL_PLAYER = {
  x: canvasBounds.width / 2,
  y: canvasBounds.height / 2,
  r: 25,
  vx: 0,
  vy: 0,
  player: true,
};

let circles: Circle[] = [];

interface Level {
  absorbSpeed: number;
  initialCircles: number[];
}

const LEVELS: Level[] = [
  {
    absorbSpeed: 0.1,
    initialCircles: [],
  },
  {
    absorbSpeed: 0.1,
    initialCircles: [10],
  },
  {
    absorbSpeed: 0.1,
    initialCircles: [15, 15, 15, 15],
  },
];
let currentLevel = -1;
let leftButton: Button | null = null;
let rightButton: Button | null = null;

function initializeNextLevel() {
  currentLevel++;
  for (let i = 0; i < LEVELS[currentLevel].initialCircles.length; i++) {
    circles.push({
      x: Math.random() * canvasBounds.width,
      y: Math.random() * canvasBounds.height,
      r: LEVELS[currentLevel].initialCircles[i],
      vx: Math.random(),
      vy: Math.random(),
      player: false,
    });
  }
  circles.push({ ...INITIAL_PLAYER });
  leftButton = null;
  rightButton = null;
}
initializeNextLevel();

interface Bonus {
  name: string;
  effect: () => void;
}

const BONUSES = [
  {
    name: "Absorb faster",
    effect: () => {
      absorbSpeed += 0.1;
      initializeNextLevel();
    },
  },
  {
    name: "Pop size",
    effect: () => {
      popSize += 5;
      initializeNextLevel();
    },
  },
  {
    name: "Thrust speed",
    effect: () => {
      thrustSpeed += 0.1;
      initializeNextLevel();
    },
  },
  {
    name: "Initial size",
    effect: () => {
      INITIAL_PLAYER.r += 5;
      initializeNextLevel();
    },
  },
];

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
  let absorb = big.player ? absorbSpeed : LEVELS[currentLevel].absorbSpeed;
  let pSize = big.player ? popSize : POP_SIZE;
  if (circles[smallIndex].r < 0.2) absorb = 0.2;
  big.r += absorb;
  circles[smallIndex].r -= absorb;
  if (big.r > pSize) {
    big.r /= 5;
    spawnPopCircle(big, -1, -1);
    spawnPopCircle(big, -1, 1);
    spawnPopCircle(big, 1, -1);
    spawnPopCircle(big, 1, 1);
  }
  if (circles[smallIndex].r <= 0) circles.splice(smallIndex, 1);
}

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
        c.vx += nx * thrustSpeed;
        c.vy += ny * thrustSpeed;
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
  if (hasWon && circles.length > 0) {
    circles = [];
    leftButton = {
      x: canvasBounds.width / 2 - 50 - MARGIN,
      y: canvasBounds.height / 2 + 45,
      r: 50,
      bonus: BONUSES[~~(Math.random() * BONUSES.length)],
    };
    rightButton = {
      x: canvasBounds.width / 2 + 50 + MARGIN,
      y: canvasBounds.height / 2 + 45,
      r: 50,
      bonus: BONUSES[~~(Math.random() * BONUSES.length)],
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
  r: number;
  bonus: Bonus;
}

function clicksButton(b: Button | null) {
  return b !== null && Math.hypot(b.x - mousePos.x, b.y - mousePos.y) < b.r;
}

function drawButton(b: Button | null) {
  if (b === null) return;
  ctx.strokeStyle = "#000000";
  ctx.font = "15px Comic Sans MS";
  let met = ctx.measureText(b.bonus.name);
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillText(b.bonus.name, b.x - met.width / 2, b.y + 5);
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
    if (clicksButton(leftButton)) leftButton?.bonus.effect();
    if (clicksButton(rightButton)) rightButton?.bonus.effect();
  },
  false
);

console.log("Working");
