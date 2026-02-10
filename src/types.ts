export interface BeadColor {
  name: string;
  hex: string;
}

export interface GridPixel {
  row: number;
  col: number;
  hex: string;
  beadColor: BeadColor;
}

export interface AnalysisResult {
  gridWidth: number;
  gridHeight: number;
  gridPixels: GridPixel[][];
  colorCounts: { beadColor: BeadColor; count: number }[];
}
