export class ImageProcessorService {
  static colorDistance(c1, c2) {
    return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
  }

  static getContrastColor(rgb) {
    const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
    return yiq >= 130 ? "#111827" : "#ffffff";
  }

  static runKMeans(pixels, k) {
    let centroids = [];
    const step = Math.floor(pixels.length / k);
    for (let i = 0; i < k; i++) centroids.push([...pixels[i * step]]);

    for (let iter = 0; iter < 5; iter++) {
      const clusters = Array.from({ length: k }, () => []);
      pixels.forEach(p => {
        let best = 0;
        let minD = Infinity;
        centroids.forEach((c, idx) => {
          const d = this.colorDistance(p, c);
          if (d < minD) { minD = d; best = idx; }
        });
        clusters[best].push(p);
      });

      centroids = clusters.map((cluster, idx) => {
        if (cluster.length === 0) return centroids[idx];
        const sum = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
        return [
          Math.round(sum[0] / cluster.length),
          Math.round(sum[1] / cluster.length),
          Math.round(sum[2] / cluster.length)
        ];
      });
    }
    return centroids;
  }

  static processToGrid(img, gridSize, activeAlphabet) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = gridSize;
    tempCanvas.height = gridSize;
    const tCtx = tempCanvas.getContext("2d");

    const minSide = Math.min(img.width, img.height);
    const sx = (img.width - minSide) / 2;
    const sy = (img.height - minSide) / 2;
    tCtx.drawImage(img, sx, sy, minSide, minSide, 0, 0, gridSize, gridSize);

    const imgData = tCtx.getImageData(0, 0, gridSize, gridSize).data;
    const pixels = [];
    for (let i = 0; i < imgData.length; i += 4) {
      pixels.push([imgData[i], imgData[i + 1], imgData[i + 2]]);
    }

    const centroids = this.runKMeans(pixels, activeAlphabet.length);

    const palette = centroids.map((rgb, idx) => ({
      letter: activeAlphabet[idx],
      rgb,
      hex: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
      contrastText: this.getContrastColor(rgb),
      remaining: 0
    }));

    const grid = [];
    for (let r = 0; r < gridSize; r++) {
      const row = [];
      for (let c = 0; c < gridSize; c++) {
        const idx = (r * gridSize + c) * 4;
        const pixelRGB = [imgData[idx], imgData[idx + 1], imgData[idx + 2]];

        let closestIdx = 0;
        let minDist = Infinity;
        palette.forEach((p, pIdx) => {
          const d = this.colorDistance(pixelRGB, p.rgb);
          if (d < minDist) { minDist = d; closestIdx = pIdx; }
        });

        palette[closestIdx].remaining++;

        row.push({
          letter: palette[closestIdx].letter,
          color: palette[closestIdx].hex,
          textColor: palette[closestIdx].contrastText,
          painted: false
        });
      }
      grid.push(row);
    }

    return {
      grid,
      palette: palette.filter(p => p.remaining > 0)
    };
  }
    }
