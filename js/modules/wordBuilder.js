import { KIDS_THEMES_DATA } from "../data/kidsWords.js";

export class WordBuilderModule {
  constructor(audioService) {
    this.audio = audioService;

    this.currentWordItem = null;
    this.letters = [];
    this.slotted = [];
    this.streak = 0;
    this.currentCategory = "all";

    // Elementos DOM
    this.iconEl = document.getElementById("builderIcon");
    this.hintEl = document.getElementById("builderHint");
    this.slotsContainer = document.getElementById("builderSlots");
    this.poolContainer = document.getElementById("builderPool");
    this.streakEl = document.getElementById("builderStreakText");
    this.btnHear = document.getElementById("btnHearWord");
    this.btnClear = document.getElementById("btnBuilderClear");
    this.btnNext = document.getElementById("btnBuilderNext");
    this.themeSelect = document.getElementById("builderThemeSelect");

    this._bindEvents();
  }

  _bindEvents() {
    this.btnHear.addEventListener("click", () => {
      if (this.currentWordItem) this.audio.speakPhrase(this.currentWordItem.word);
    });

    this.btnClear.addEventListener("click", () => this._resetSlots());
    this.btnNext.addEventListener("click", () => this.nextWord());

    this.themeSelect.addEventListener("change", (e) => {
      this.currentCategory = e.target.value;
      this.nextWord();
    });
  }

  nextWord() {
    this._resetUI();

    let pool = KIDS_THEMES_DATA;
    if (this.currentCategory !== "all") {
      pool = KIDS_THEMES_DATA.filter(item => item.category === this.currentCategory);
    }

    this.currentWordItem = pool[Math.floor(Math.random() * pool.length)];

    // Mostrar icono del héroe/princesa
    this.iconEl.textContent = this.currentWordItem.icon;
    this.hintEl.textContent = this.currentWordItem.hint;

    const chars = this.currentWordItem.word.split("");
    this.letters = chars.map((char, index) => ({ id: `letter-${index}`, char }));

    // Crear casillas receptoras
    chars.forEach((char, idx) => {
      const slot = document.createElement("div");
      slot.className = "builder-slot";
      slot.dataset.expected = char;
      slot.dataset.index = idx;
      // Mostrar la letra en gris tenue como guía visual inicial
      slot.innerHTML = `<span class="slot-ghost">${char}</span>`;
      this.slotsContainer.appendChild(slot);
    });

    // Fichas desordenadas abajo
    let scrambled = [...this.letters].sort(() => Math.random() - 0.5);
    if (scrambled.map(l => l.char).join("") === this.currentWordItem.word && scrambled.length > 1) {
      scrambled.reverse();
    }

    scrambled.forEach(item => {
      const chip = document.createElement("button");
      chip.className = "builder-letter-chip";
      chip.textContent = item.char;
      chip.dataset.id = item.id;
      chip.addEventListener("click", () => this._handleChipClick(item, chip));
      this.poolContainer.appendChild(chip);
    });

    // Pronunciar la palabra al iniciar el reto
    this.audio.speakPhrase(this.currentWordItem.word);
  }

  _handleChipClick(item, chipEl) {
    if (chipEl.classList.contains("disabled")) return;

    // Pronunciar el sonido de la letra individual
    this.audio.speakLetter(item.char);
    this.audio.playPop();

    // Colocar en el primer hueco vacío
    const emptySlot = this.slotsContainer.querySelector(".builder-slot:not(.filled)");
    if (!emptySlot) return;

    chipEl.classList.add("disabled");
    emptySlot.classList.add("filled");

    const placedLetter = document.createElement("span");
    placedLetter.className = "placed-letter";
    placedLetter.textContent = item.char;

    // Al tocar una letra ya colocada, se devuelve al banco
    placedLetter.addEventListener("click", () => {
      placedLetter.remove();
      emptySlot.classList.remove("filled");
      chipEl.classList.remove("disabled");
      this.slotted = this.slotted.filter(s => s.item.id !== item.id);
      this.slotsContainer.classList.remove("wrong");
    });

    emptySlot.appendChild(placedLetter);
    this.slotted.push({ item, slot: emptySlot });

    // Si llenó todas las casillas, validar
    if (this.slotted.length === this.letters.length) {
      this._checkCompleteWord();
    }
  }

  _checkCompleteWord() {
    const formed = Array.from(this.slotsContainer.querySelectorAll(".placed-letter"))
      .map(el => el.textContent)
      .join("");

    if (formed === this.currentWordItem.word) {
      this.slotsContainer.classList.add("correct");
      this.audio.playCelebration();
      this.audio.speakPhrase(`¡Excelente! ¡Dice ${this.currentWordItem.word}!`);

      this.streak++;
      this.streakEl.textContent = `${this.streak} 🔥`;

      this.btnClear.style.display = "none";
      this.btnNext.style.display = "block";
    } else {
      this.slotsContainer.classList.add("wrong");
      this.audio.speakPhrase("Casi... Inténtalo de nuevo.");
      this.streak = 0;
      this.streakEl.textContent = `0 🔥`;
    }
  }

  _resetSlots() {
    const placed = this.slotsContainer.querySelectorAll(".placed-letter");
    placed.forEach(p => p.remove());

    const slots = this.slotsContainer.querySelectorAll(".builder-slot");
    slots.forEach(s => s.classList.remove("filled"));

    this.slotsContainer.className = "builder-slots";
    this.slotted = [];

    const chips = this.poolContainer.querySelectorAll(".builder-letter-chip");
    chips.forEach(c => c.classList.remove("disabled"));
  }

  _resetUI() {
    this.slotsContainer.innerHTML = "";
    this.poolContainer.innerHTML = "";
    this.slotted = [];
    this.slotsContainer.className = "builder-slots";
    this.btnClear.style.display = "block";
    this.btnNext.style.display = "none";
  }
      }
