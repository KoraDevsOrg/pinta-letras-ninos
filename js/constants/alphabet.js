export const FULL_ALPHABET = Object.freeze([
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z"
]);

export function getResolutionConfig(size) {
  switch (size) {
    case 40:
      return { gridSize: 40, alphabetCount: 26 }; // Abecedario completo A-Z
    case 24:
      return { gridSize: 24, alphabetCount: 16 };
    case 32:
    default:
      return { gridSize: 32, alphabetCount: 20 };
  }
}

// Generador de imagen de prueba (Gatito pixelado)
export function createSampleCatCanvas() {
  const sample = document.createElement("canvas");
  sample.width = 32;
  sample.height = 32;
  const sCtx = sample.getContext("2d");

  sCtx.fillStyle = "#fed7aa";
  sCtx.fillRect(0, 0, 32, 32);

  // Orejas
  sCtx.fillStyle = "#1e293b";
  sCtx.beginPath();
  sCtx.moveTo(7, 4); sCtx.lineTo(12, 14); sCtx.lineTo(4, 14); sCtx.fill();
  sCtx.moveTo(25, 4); sCtx.lineTo(28, 14); sCtx.lineTo(20, 14); sCtx.fill();

  // Cabeza y cuerpo
  sCtx.fillStyle = "#0f172a";
  sCtx.beginPath();
  sCtx.arc(16, 15, 10, 0, Math.PI * 2);
  sCtx.fill();

  sCtx.beginPath();
  sCtx.arc(16, 26, 9, 0, Math.PI * 2);
  sCtx.fill();

  // Ojos
  sCtx.fillStyle = "#22c55e";
  sCtx.fillRect(11, 13, 3, 3);
  sCtx.fillRect(18, 13, 3, 3);

  // Pupilas
  sCtx.fillStyle = "#000000";
  sCtx.fillRect(12, 13, 1, 3);
  sCtx.fillRect(19, 13, 1, 3);

  // Nariz
  sCtx.fillStyle = "#f43f5e";
  sCtx.fillRect(15, 17, 2, 2);

  return sample;
}
