import { useEffect, useRef, useCallback } from "react";
import type { AnalysisResult, BeadColor, GridPixel } from "../types";
import { BEAD_COLORS } from "../data/beadColors";
import { detectBlockSize } from "../utils/gridDetection";

interface ImageCanvasProps {
  imageUrl: string;
  blockSize: number;
  onAnalysis: (result: AnalysisResult) => void;
  onBlockSizeDetected: (size: number) => void;
  highlightedColor: string | null;
}

const MAX_PREVIEW = 500;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function nearestBead(r: number, g: number, b: number): BeadColor {
  // Normalize near-black
  if (r < 30 && g < 30 && b < 30) {
    r = 0;
    g = 0;
    b = 0;
  }
  // Normalize near-white
  if (r > 225 && g > 225 && b > 225) {
    r = 255;
    g = 255;
    b = 255;
  }

  let best: BeadColor = BEAD_COLORS[0];
  let bestDist = Infinity;

  for (const bc of BEAD_COLORS) {
    const [br, bg, bb] = hexToRgb(bc.hex);
    const dist = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = bc;
    }
  }

  return best;
}

export function ImageCanvas({
  imageUrl,
  blockSize,
  onAnalysis,
  onBlockSizeDetected,
  highlightedColor,
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisRef = useRef<AnalysisResult | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);

  const drawOverlay = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      analysis: AnalysisResult,
      scale: number,
      highlighted: string | null
    ) => {
      const cols = analysis.gridWidth;
      const rows = analysis.gridHeight;
      const cellW = (blockSize * scale);
      const cellH = (blockSize * scale);

      // Draw highlight overlay for non-matching cells
      if (highlighted) {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const gp = analysis.gridPixels[row][col];
            if (gp.beadColor.hex !== highlighted) {
              ctx.fillStyle = "rgba(255,255,255,0.75)";
              ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
            }
          }
        }
      }

      // Draw grid lines
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;

      const canvasW = ctx.canvas.width;
      const canvasH = ctx.canvas.height;

      for (let c = 0; c <= cols; c++) {
        const x = Math.round(c * cellW);
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvasH);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const y = Math.round(r * cellH);
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvasW, y + 0.5);
        ctx.stroke();
      }
    },
    [blockSize]
  );

  // Main analysis effect: runs when imageUrl or blockSize changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;

      const natW = img.naturalWidth;
      const natH = img.naturalHeight;

      // Compute display scale so largest dimension <= MAX_PREVIEW
      const scale = Math.min(MAX_PREVIEW / natW, MAX_PREVIEW / natH, 1);
      scaleRef.current = scale;

      const dispW = Math.round(natW * scale);
      const dispH = Math.round(natH * scale);

      canvas.width = dispW;
      canvas.height = dispH;

      // Draw image scaled to preview size
      ctx.drawImage(img, 0, 0, dispW, dispH);

      // Hidden canvas at full resolution for pixel reading
      const hiddenCanvas = document.createElement("canvas");
      hiddenCanvas.width = natW;
      hiddenCanvas.height = natH;
      const hCtx = hiddenCanvas.getContext("2d");
      if (!hCtx) return;
      hCtx.drawImage(img, 0, 0, natW, natH);
      const fullData = hCtx.getImageData(0, 0, natW, natH);

      // Auto-detect block size on first load and notify parent
      const detected = detectBlockSize(fullData.data, natW, natH);
      onBlockSizeDetected(detected);

      // Compute grid dimensions from original image pixels
      const cols = Math.floor(natW / blockSize);
      const rows = Math.floor(natH / blockSize);

      const gridPixels: GridPixel[][] = [];
      const countMap = new Map<string, { beadColor: BeadColor; count: number }>();

      for (let row = 0; row < rows; row++) {
        const rowArr: GridPixel[] = [];
        for (let col = 0; col < cols; col++) {
          // Center pixel of this block in original image coords
          const cx = Math.floor(col * blockSize + blockSize / 2);
          const cy = Math.floor(row * blockSize + blockSize / 2);
          const idx = (cy * natW + cx) * 4;

          const r = fullData.data[idx];
          const g = fullData.data[idx + 1];
          const b = fullData.data[idx + 2];

          const bead = nearestBead(r, g, b);
          const pixelHex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

          rowArr.push({ row, col, hex: pixelHex, beadColor: bead });

          const existing = countMap.get(bead.hex);
          if (existing) {
            existing.count++;
          } else {
            countMap.set(bead.hex, { beadColor: bead, count: 1 });
          }
        }
        gridPixels.push(rowArr);
      }

      const colorCounts = Array.from(countMap.values()).sort(
        (a, b) => b.count - a.count
      );

      const result: AnalysisResult = {
        gridWidth: cols,
        gridHeight: rows,
        gridPixels,
        colorCounts,
      };

      analysisRef.current = result;
      onAnalysis(result);

      // Draw overlay on the display canvas
      drawOverlay(ctx, result, scale, null);
    };

    img.src = imageUrl;
  }, [imageUrl, blockSize, onAnalysis, onBlockSizeDetected, drawOverlay]);

  // Highlight effect: runs when highlightedColor changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const analysis = analysisRef.current;
    if (!canvas || !img || !analysis) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw base image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Redraw overlay with highlight
    drawOverlay(ctx, analysis, scaleRef.current, highlightedColor);
  }, [highlightedColor, drawOverlay]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-300 rounded max-w-full"
    />
  );
}
