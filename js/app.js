import { AudioService } from "./services/audio.js";
import { LetterPaintModule } from "./modules/letterPaint.js";

document.addEventListener("DOMContentLoaded", () => {
  const audioService = new AudioService();

  // 1. Inicializar Módulo de Pintar por Letras
  const letterPaint = new LetterPaintModule(audioService);

  // 2. Registro de Módulos (Diseñado para escalar con nuevos juegos fácilmente)
  const views = {
    letterPaint: {
      title: "Pinta por Letras HD",
      section: document.getElementById("letterPaintSection"),
      onOpen: () => letterPaint.resizeCanvas()
    }
    // Para agregar un juego futuro:
    // abcPuzzle: { title: "Rompecabezas ABC", section: document.getElementById("abcSection"), onOpen: () => puzzle.init() }
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
      if (v.section) v.section.style.display = "none";
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
