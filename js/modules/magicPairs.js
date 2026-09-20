import { KIDS_THEMES_DATA } from "../data/kidsWords.js";

export class MagicPairsModule {
  constructor(audioService) {
    this.audio = audioService;

    this.cards = [];
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
    this.matchedPairs = 0;
    this.totalPairs = 4;
    this.currentCategory = "all";

    // Elementos DOM
    this.gridEl = document.getElementById("pairsGrid");
    this.themeSelect = document.getElementById("pairsThemeSelect");
    this.diffSelect = document.getElementById("pairsDiffSelect");
    this.btnReset = document.getElementById("btnResetPairs");

    this._bindEvents();
  }

  _bindEvents() {
    this.btnReset.addEventListener("click", () => this.startNewGame());
    this.themeSelect.addEventListener("change", (e) => {
      this.currentCategory = e.target.value;
      this.startNewGame();
    });
    this.diffSelect.addEventListener("change", (e) => {
      this.totalPairs = parseInt(e.target.value, 10);
      this.startNewGame();
    });
  }

  startNewGame() {
    this.gridEl.innerHTML = "";
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
    this.matchedPairs = 0;

    // 1. Filtrar por categoría seleccionada
    let pool = KIDS_THEMES_DATA;
    if (this.currentCategory !== "all") {
      pool = KIDS_THEMES_DATA.filter(item => item.category === this.currentCategory);
    }

    // 2. Elegir items al azar
    const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, this.totalPairs);

    // 3. Crear pares: Una carta con la Imagen/Icono grande y otra con la Palabra escrita
    const deck = [];
    selected.forEach((item, index) => {
      // Carta Imagen
      deck.push({
        pairId: `pair-${index}`,
        type: "image",
        data: item,
        html: `
          <div class="pair-icon-large">${item.icon}</div>
          <div class="pair-sub-hint">¿Qué es?</div>
        `
      });

      // Carta Palabra
      deck.push({
        pairId: `pair-${index}`,
        type: "word",
        data: item,
        html: `
          <div class="pair-word-text" style="color: ${item.color};">${item.word}</div>
          <div class="pair-sub-hint">¡Léela!</div>
        `
      });
    });

    // Mezclar cartas
    deck.sort(() => Math.random() - 0.5);

    // Ajustar columnas de la cuadrícula según cantidad de cartas
    this.gridEl.className = this.totalPairs === 6 ? "pairs-grid grid-6" : "pairs-grid grid-4";

    // Dibujar cartas en pantalla
    deck.forEach(cardData => {
      const cardEl = document.createElement("div");
      cardEl.className = "magic-card";
      cardEl.dataset.pairId = cardData.pairId;

      cardEl.innerHTML = `
        <div class="magic-card-inner">
          <div class="magic-card-front">✨</div>
          <div class="magic-card-back">${cardData.html}</div>
        </div>
      `;

      cardEl.addEventListener("click", () => this._handleCardClick(cardEl, cardData));
      this.gridEl.appendChild(cardEl);
    });

    this.audio.speakPhrase("¡Encuentra las parejas mágicas!");
  }

  _handleCardClick(cardEl, cardData) {
    if (this.lockBoard || cardEl === this.firstCard) return;
    if (cardEl.classList.contains("matched") || cardEl.classList.contains("flipped")) return;

    cardEl.classList.add("flipped");

    // Pronunciar siempre la palabra con voz dulce
    this.audio.speakPhrase(cardData.data.word);

    if (!this.firstCard) {
      this.firstCard = cardEl;
      this.firstCardData = cardData;
      return;
    }

    this.secondCard = cardEl;
    this.secondCardData = cardData;
    this._checkForMatch();
  }

  _checkForMatch() {
    const isMatch = this.firstCard.dataset.pairId === this.secondCard.dataset.pairId;

    if (isMatch) {
      this.lockBoard = true;
      this.audio.playPop();

      setTimeout(() => {
        this.firstCard.classList.add("matched");
        this.secondCard.classList.add("matched");
        this.matchedPairs++;

        this.audio.speakPhrase(`¡Genial! ${this.firstCardData.data.word}`);
        this._resetTurn();

        if (this.matchedPairs === this.totalPairs) {
          setTimeout(() => {
            this.audio.playCelebration();
            this.audio.speakPhrase("¡Fantástico! ¡Completaste todas las parejas mágicas!");
          }, 600);
        }
      }, 400);
    } else {
      this.lockBoard = true;
      setTimeout(() => {
        this.firstCard.classList.remove("flipped");
        this.secondCard.classList.remove("flipped");
        this._resetTurn();
      }, 1100);
    }
  }

  _resetTurn() {
    this.firstCard = null;
    this.secondCard = null;
    this.firstCardData = null;
    this.secondCardData = null;
    this.lockBoard = false;
  }
}
