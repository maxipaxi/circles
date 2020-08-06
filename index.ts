let canvasElem = document.getElementById("canvas") as HTMLCanvasElement;
let canvasBounds = canvasElem.getBoundingClientRect();
let ctx = canvasElem.getContext("2d")!;

interface GameMode {
  handleClick(): void;
  draw(): void;
  update(): void;
}
class YouWinScreen implements GameMode {
  private leftButton: Button;
  private rightButton: Button;
  constructor() {
    this.leftButton = randomBonusButton(-1);
    this.rightButton = randomBonusButton(1);
  }
  handleClick() {
    if (clicksButton(this.leftButton)) this.leftButton?.bonus.effect();
    if (clicksButton(this.rightButton)) this.rightButton?.bonus.effect();
  }
  draw() {
    ctx.font = "30px Comic Sans MS";
    let met = ctx.measureText("You won! Woo");
    ctx.fillText(
      "You won! Woo",
      (canvasBounds.width - met.width) / 2,
      canvasBounds.height / 2 - 30
    );

    drawButton(this.leftButton);
    drawButton(this.rightButton);
  }
  update() {}
}
class Playing implements GameMode {
  handleClick() {}
  draw() {
    circles.forEach((c) => {
      if (c.isPlayer()) ctx.strokeStyle = "#0000ff";
      else ctx.strokeStyle = "#ff0000";
      c.draw();
    });
  }
  update() {
    handleInput();
    updateCircles();
    checkCollisions();
    checkWinning();
  }
}
let currentGameMode: GameMode = new Playing();

class Circle {
  constructor(
    private x: number,
    private y: number,
    private vx: number,
    private vy: number,
    private r: number,
    private player: boolean
  ) {}
  isPlayer() {
    return this.player;
  }
  copy() {
    return new Circle(this.x, this.y, this.vx, this.vy, this.r, this.player);
  }
  update() {
    this.x += this.vx;
    if (this.x - this.r < 0 || this.x + this.r >= canvasBounds.width) {
      this.vx = -this.vx;
      this.x = clamp(this.x, 0 + this.r, canvasBounds.width - this.r);
    }
    this.y += this.vy;
    if (this.y - this.r < 0 || this.y + this.r >= canvasBounds.height) {
      this.vy = -this.vy;
      this.y = clamp(this.y, 0 + this.r, canvasBounds.height - this.r);
    }
  }
  increaseSize() {
    this.r += 5;
  }
  collidesWith(c2: Circle) {
    return Math.hypot(this.x - c2.x, this.y - c2.y) < this.r + c2.r;
  }
  spawnPopCircle(dx: number, dy: number) {
    circles.push(
      new Circle(
        this.x + 30 * dx,
        this.y + 30 * dy,
        dx * Math.random(),
        dy * Math.random(),
        this.r,
        this.player
      )
    );
  }
  absorb(smallIndex: number) {
    let pSize = this.player ? popSize : POP_SIZE;
    let absorb = this.player ? absorbSpeed : LEVELS[currentLevel].absorbSpeed;
    if (circles[smallIndex].r < 0.2) absorb = 0.2;
    this.r += absorb;
    circles[smallIndex].r -= absorb;
    if (this.r > pSize) {
      this.r /= 5;
      this.spawnPopCircle(-1, -1);
      this.spawnPopCircle(-1, 1);
      this.spawnPopCircle(1, -1);
      this.spawnPopCircle(1, 1);
    }
    if (circles[smallIndex].r <= 0) circles.splice(smallIndex, 1);
  }
  thrustIfPlayer() {
    if (this.player && this.r > 0.5) {
      let dx = INV_CONTROLS * (mousePos.x - this.x);
      let dy = INV_CONTROLS * (mousePos.y - this.y);
      let dist = Math.hypot(dx, dy);
      let nx = dx / dist;
      let ny = dy / dist;
      this.vx += nx * thrustSpeed;
      this.vy += ny * thrustSpeed;
      this.r -= 0.5;
      circles.push(
        new Circle(
          this.x - nx * this.r,
          this.y - ny * this.r,
          -this.vx,
          -this.vy,
          0.5,
          true
        )
      );
    }
  }
  handleCollision(i: number, j: number) {
    if (this.r > circles[j].r) {
      this.absorb(j);
    } else {
      circles[j].absorb(i);
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

const POP_SIZE = 75;
let absorbSpeed = 0.1;
let popSize = POP_SIZE;
let thrustSpeed = 0.1;
const INITIAL_PLAYER = new Circle(
  canvasBounds.width / 2,
  canvasBounds.height / 2,
  0,
  0,
  25,
  true
);

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

function initializeNextLevel() {
  currentLevel++;
  circles = [];
  for (let i = 0; i < LEVELS[currentLevel].initialCircles.length; i++) {
    circles.push(
      new Circle(
        Math.random() * canvasBounds.width,
        Math.random() * canvasBounds.height,
        Math.random(),
        Math.random(),
        LEVELS[currentLevel].initialCircles[i],
        false
      )
    );
  }
  circles.push(INITIAL_PLAYER.copy());
  currentGameMode = new Playing();
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
      INITIAL_PLAYER.increaseSize();
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

const INV_CONTROLS = -1;

const MARGIN = 10;

interface Button {
  x: number;
  y: number;
  r: number;
  bonus: Bonus;
}

function checkWinning() {
  let hasWon = circles.every((c) => c.isPlayer());
  if (hasWon && circles.length > 0) {
    handleWinning();
  }
}

function handleWinning() {
  currentGameMode = new YouWinScreen();
}

function randomBonusButton(left: number) {
  return {
    x: canvasBounds.width / 2 - left * (50 + MARGIN),
    y: canvasBounds.height / 2 + 45,
    r: 50,
    bonus: BONUSES[~~(Math.random() * BONUSES.length)],
  };
}

function checkCollisions() {
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      if (circles[i].collidesWith(circles[j])) {
        circles[i].handleCollision(i, j);
      }
    }
  }
}

function updateCircles() {
  circles.forEach((c) => {
    c.update();
  });
}

function handleInput() {
  if (mouseDown) {
    for (let ci = 0; ci < circles.length; ci++) {
      let c = circles[ci];
      c.thrustIfPlayer();
    }
  }
}

function clicksButton(b: Button) {
  return Math.hypot(b.x - mousePos.x, b.y - mousePos.y) < b.r;
}

function drawButton(b: Button) {
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
  currentGameMode.draw();
}

const FPS = 30;
const SLEEP = 1000 / FPS;

function gameLoop() {
  let before = Date.now();
  currentGameMode.update();
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
    currentGameMode.handleClick();
  },
  false
);

console.log("Working");
