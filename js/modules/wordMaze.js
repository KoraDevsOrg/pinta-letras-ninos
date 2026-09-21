import { MAZE_PHRASES } from "../data/mazePhrases.js";

export class WordMazeModule {
  constructor(audioService) {
    this.audio = audioService;

    this.cols = 9;
    this.rows = 9;
    this.grid = [];
    this.player = { x: 0, y: 0 };
    this.avatars = ["⭐", "🦄", "🚀", "👑", "🦸‍♂️", "🐱"];
    this.currentAvatar = "⭐";

    this.targetPhrase = "";
    this.targetLetters = []; // [{ char, x, y, collected, order }]
    this.currentLetterIndex = 0;
    this.currentCategory = "all";

    // Elementos DOM
    this.canvas = document.getElementById("mazeCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.slotsContainer = document.getElementById("mazePhraseSlots");
    this.categorySelect = document.getElementById("mazeCategorySelect");
    this.avatarSelect = document.getElementById("mazeAvatarSelect");
    this.btnCustomPhrase = document.getElementById("btnCustomPhrase");
    this.btnReset = document.getElementById("btnResetMaze");
    this.hintEl = document.getElementById("mazePhraseHint");

    this._bindEvents();
  }

  _bindEvents() {
    this.categorySelect.addEventListener("change", (e) => {
      this.currentCategory = e.target.value;
      this.startNewMaze();
    });

    this.avatarSelect.addEventListener("change", (e) => {
      this.currentAvatar = e.target.value;
      this.draw();
    });

    this.btnReset.addEventListener("click", () => this.startNewMaze());

    this.btnCustomPhrase.addEventListener("click", () => {
      const custom = prompt("Escribe la frase o palabra para tu pequeña (sin caracteres especiales):", "ERES MI PRINCESA");
      if (custom && custom.trim().length > 0) {
        const cleaned = custom.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, "");
        if (cleaned.replace(/ /g, "").length >= 3) {
          this.loadPhrase(cleaned, "¡Frase mágica de la familia!");
        } else {
          alert("Por favor escribe una frase de al menos 3 letras.");
        }
      }
    });

    // Controles táctiles en pantalla (D-Pad)
    document.getElementById("btnMazeUp").addEventListener("click", () => this._movePlayer(0, -1));
    document.getElementById("btnMazeDown").addEventListener("click", () => this._movePlayer(0, 1));
    document.getElementById("btnMazeLeft").addEventListener("click", () => this._movePlayer(-1, 0));
    document.getElementById("btnMazeRight").addEventListener("click", () => this._movePlayer(1, 0));

    // Atajos con flechas de teclado (computadora o tablet con teclado)
    window.addEventListener("keydown", (e) => {
      if (document.getElementById("wordMazeSection").style.display === "none") return;
      if (e.key === "ArrowUp") this._movePlayer(0, -1);
      if (e.key === "ArrowDown") this._movePlayer(0, 1);
      if (e.key === "ArrowLeft") this._movePlayer(-1, 0);
      if (e.key === "ArrowRight") this._movePlayer(1, 0);
    });

    window.addEventListener("resize", () => this._resizeCanvas());
  }

  _resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width - 8, 380);
    this.canvas.width = size * window.devicePixelRatio;
    this.canvas.height = size * window.devicePixelRatio;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.draw();
  }

  startNewMaze() {
    let pool = MAZE_PHRASES;
    if (this.currentCategory !== "all") {
      pool = MAZE_PHRASES.filter(p => p.category === this.currentCategory);
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.loadPhrase(chosen.text, chosen.hint);
  }

  loadPhrase(text, hint) {
    this.targetPhrase = text;
    this.hintEl.textContent = hint || "¡Encuentra las letras en el laberinto!";
    this.currentLetterIndex = 0;

    // Solo recolectamos letras (los espacios se muestran completados de fábrica)
    this.lettersOnly = text.replace(/ /g, "").split("");

    this._generateMaze();
    this._distributeLetters();
    this._renderSlots();
    this._resizeCanvas();

    this.audio.speakPhrase("¡Encuentra las letras para formar la frase!");
  }

  // Generador de laberinto perfecto (Algoritmo Recursive Backtracker)
  _generateMaze() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          r, c,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false
        });
      }
      this.grid.push(row);
    }

    const stack = [];
    const current = this.grid[0][0];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
      const cell = stack[stack.length - 1];
      const neighbors = this._getUnvisitedNeighbors(cell);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this._removeWalls(cell, next);
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    this.player = { x: 0, y: 0 };
  }

  _getUnvisitedNeighbors(cell) {
    const { r, c } = cell;
    const neighbors = [];
    if (r > 0 && !this.grid[r - 1][c].visited) neighbors.push(this.grid[r - 1][c]);
    if (r < this.rows - 1 && !this.grid[r + 1][c].visited) neighbors.push(this.grid[r + 1][c]);
    if (c > 0 && !this.grid[r][c - 1].visited) neighbors.push(this.grid[r][c - 1]);
    if (c < this.cols - 1 && !this.grid[r][c + 1].visited) neighbors.push(this.grid[r][c + 1]);
    return neighbors;
  }

  _removeWalls(a, b) {
    const x = a.c - b.c;
    if (x === 1) { a.walls.left = false; b.walls.right = false; }
    else if (x === -1) { a.walls.right = false; b.walls.left = false; }

    const y = a.r - b.r;
    if (y === 1) { a.walls.top = false; b.walls.bottom = false; }
    else if (y === -1) { a.walls.bottom = false; b.walls.top = false; }
  }

  // Colocar las letras en diferentes casillas del laberinto
  _distributeLetters() {
    this.targetLetters = [];
    const availableCells = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // No colocar en la celda inicial del jugador
        if (r === 0 && c === 0) continue;
        availableCells.push({ r, c });
      }
    }

    // Mezclar celdas disponibles
    availableCells.sort(() => Math.random() - 0.5);

    this.lettersOnly.forEach((char, index) => {
      const cell = availableCells[index % availableCells.length];
      this.targetLetters.push({
        char,
        x: cell.c,
        y: cell.r,
        collected: false,
        index
      });
    });
  }

  _renderSlots() {
    this.slotsContainer.innerHTML = "";
    let letterCount = 0;

    for (let i = 0; i < this.targetPhrase.length; i++) {
      const ch = this.targetPhrase[i];
      if (ch === " ") {
        const space = document.createElement("div");
        space.className = "maze-slot-space";
        this.slotsContainer.appendChild(space);
      } else {
        const slot = document.createElement("div");
        slot.className = "maze-slot";
        slot.id = `maze-slot-${letterCount}`;
        slot.innerHTML = `<span class="slot-ghost">${ch}</span>`;
        this.slotsContainer.appendChild(slot);
        letterCount++;
      }
    }
    this._highlightCurrentTargetSlot();
  }

  _highlightCurrentTargetSlot() {
    document.querySelectorAll(".maze-slot").forEach(s => s.classList.remove("active-target"));
    const activeSlot = document.getElementById(`maze-slot-${this.currentLetterIndex}`);
    if (activeSlot) activeSlot.classList.add("active-target");
  }

  _movePlayer(dx, dy) {
    const currentCell = this.grid[this.player.y][this.player.x];

    // Verificar si hay pared en esa dirección
    if (dy === -1 && currentCell.walls.top) return;
    if (dy === 1 && currentCell.walls.bottom) return;
    if (dx === -1 && currentCell.walls.left) return;
    if (dx === 1 && currentCell.walls.right) return;

    this.player.x += dx;
    this.player.y += dy;

    this._checkLetterPickup();
    this.draw();
  }

  _checkLetterPickup() {
    // Verificar si la casilla tiene la letra actual esperada
    const nextExpected = this.targetLetters.find(
      l => l.index === this.currentLetterIndex && !l.collected
    );

    if (nextExpected && nextExpected.x === this.player.x && nextExpected.y === this.player.y) {
      nextExpected.collected = true;

      // Sonido y pronunciación
      this.audio.playPop();
      this.audio.speakLetter(nextExpected.char);

      // Rellenar casilla
      const slot = document.getElementById(`maze-slot-${this.currentLetterIndex}`);
      if (slot) {
        slot.classList.add("filled");
        slot.innerHTML = `<span>${nextExpected.char}</span>`;
      }

      this.currentLetterIndex++;
      this._highlightCurrentTargetSlot();

      // ¿Completó toda la frase?
      if (this.currentLetterIndex === this.lettersOnly.length) {
        setTimeout(() => this._celebrateWin(), 350);
      }
    }
  }

  _celebrateWin() {
    this.audio.playCelebration();
    this.audio.speakPhrase(`¡Maravilloso! ¡Dice: ${this.targetPhrase}!`);
    setTimeout(() => {
      alert(`🎉 ¡FELICIDADES! 🎉\nHas descubierto la frase mágica:\n"${this.targetPhrase}"`);
    }, 400);
  }

  draw() {
    if (!this.grid.length) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cellW = this.canvas.width / this.cols;
    const cellH = this.canvas.height / this.rows;

    // 1. Dibujar caminos y paredes del laberinto
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const x = c * cellW;
        const y = r * cellH;

        // Suelo
        this.ctx.fillStyle = "#121927";
        this.ctx.fillRect(x, y, cellW, cellH);

        // Paredes
        this.ctx.strokeStyle = "#3b82f6";
        this.ctx.lineWidth = Math.max(2, 3 * (this.canvas.width / 400));
        this.ctx.lineCap = "round";

        this.ctx.beginPath();
        if (cell.walls.top) { this.ctx.moveTo(x, y); this.ctx.lineTo(x + cellW, y); }
        if (cell.walls.right) { this.ctx.moveTo(x + cellW, y); this.ctx.lineTo(x + cellW, y + cellH); }
        if (cell.walls.bottom) { this.ctx.moveTo(x + cellW, y + cellH); this.ctx.lineTo(x, y + cellH); }
        if (cell.walls.left) { this.ctx.moveTo(x, y + cellH); this.ctx.lineTo(x, y); }
        this.ctx.stroke();
      }
    }

    // 2. Dibujar letras coleccionables en el laberinto
    this.targetLetters.forEach(l => {
      if (l.collected) return;
      const lx = l.x * cellW + cellW / 2;
      const ly = l.y * cellH + cellH / 2;

      const isCurrentTarget = l.index === this.currentLetterIndex;

      // Círculo brillante de la letra
      this.ctx.fillStyle = isCurrentTarget ? "#f59e0b" : "#1e293b";
      this.ctx.beginPath();
      this.ctx.arc(lx, ly, cellW * 0.38, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = isCurrentTarget ? "#fde047" : "#475569";
      this.ctx.lineWidth = isCurrentTarget ? 2.5 : 1;
      this.ctx.stroke();

      // Letra
      this.ctx.fillStyle = isCurrentTarget ? "#000000" : "#cbd5e1";
      this.ctx.font = `bold ${Math.floor(cellW * 0.44)}px sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(l.char, lx, ly + 1);
    });

    // 3. Dibujar al personaje / avatar
    const px = this.player.x * cellW + cellW / 2;
    const py = this.player.y * cellH + cellH / 2;

    this.ctx.font = `${Math.floor(cellW * 0.65)}px sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.currentAvatar, px, py);
  }
      }
