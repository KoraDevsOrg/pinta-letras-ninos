import { AudioService } from "./services/audio.js";
import { LetterPaintModule } from "./modules/letterPaint.js";
import { MagicPairsModule } from "./modules/magicPairs.js";
import { WordBuilderModule } from "./modules/wordBuilder.js";

document.addEventListener("DOMContentLoaded", () => {
  const audioService = new AudioService();

  // 1. Inicializar los 3 Módulos
  const letterPaint = new LetterPaintModule(audioService);
  const magicPairs = new MagicPairsModule(audioService);
  const wordBuilder = new WordBuilderModule(audioService);

  // 2. Registro Central de Vistas
  const views = {
    letterPaint: {
      title: "Pinta por Letras",
      section: document.getElementById("letterPaintSection"),
      onOpen: () => letterPaint.resizeCanvas()
    },
    magicPairs: {
      title: "Parejas Mágicas",
      section: document.getElementById("magicPairsSection"),
      onOpen: () => magicPairs.startNewGame()
    },
    wordBuilder: {
      title: "Arma la Palabra",
      section: document.getElementById("wordBuilderSection"),
      onOpen: () => wordBuilder.nextWord()
    }
  };

  // 3. Controlador del Menú Lateral (Drawer)
  const sideDrawer = document.getElementById("sideDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnOpenDrawer = document.getElementById("btnOpenDrawer");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawerItems = document.querySelectorAll(".drawer-item");
  const currentSectionTitle = document.getElementById("currentSectionTitle");

  function openDrawer() {
    sideDrawer.classList.add("open");
    drawerBackdrop.classList.add("active");
    sideDrawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    sideDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("active");
    sideDrawer.setAttribute("aria-hidden", "true");
  }

  btnOpenDrawer.addEventListener("click", openDrawer);
  btnCloseDrawer.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  function switchGame(targetKey) {
    const view = views[targetKey];
    if (!view || !view.section) return;

    Object.values(views).forEach(v => {
      v.section.style.display = "none";
    });
    view.section.style.display = "block";

    if (currentSectionTitle) currentSectionTitle.textContent = view.title;

    drawerItems.forEach(item => {
      item.classList.toggle("active", item.dataset.target === targetKey);
    });

    closeDrawer();
    if (view.onOpen) view.onOpen();
  }

  drawerItems.forEach(item => {
    item.addEventListener("click", () => {
      if (item.classList.contains("disabled")) return;
      switchGame(item.dataset.target);
    });
  });
});
