import { describe, it, expect } from "vitest";
import { gcd, detectBlockSize } from "./gridDetection";

/**
 * Create a synthetic pixel art image as a Uint8ClampedArray.
 * `grid` is a 2D array of [R, G, B] colors representing logical blocks.
 * Each block is `blockSize x blockSize` real pixels.
 */
function createSyntheticImage(
  grid: [number, number, number][][],
  blockSize: number,
): { data: Uint8ClampedArray; width: number; height: number } {
  const gridRows = grid.length;
  const gridCols = grid[0].length;
  const width = gridCols * blockSize;
  const height = gridRows * blockSize;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let gr = 0; gr < gridRows; gr++) {
    for (let gc = 0; gc < gridCols; gc++) {
      const [r, g, b] = grid[gr][gc];
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const px = gc * blockSize + dx;
          const py = gr * blockSize + dy;
          const idx = (py * width + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  return { data, width, height };
}

const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

describe("gcd", () => {
  it("computes gcd of two numbers", () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(36, 24)).toBe(12);
    expect(gcd(7, 3)).toBe(1);
    expect(gcd(100, 100)).toBe(100);
  });
});

describe("detectBlockSize", () => {
  it("detects blockSize=12 in a simple 2x2 grid (checkerboard)", () => {
    const grid = [
      [BLACK, WHITE],
      [WHITE, BLACK],
    ];
    const { data, width, height } = createSyntheticImage(grid, 12);
    expect(detectBlockSize(data, width, height)).toBe(12);
  });

  it("detects blockSize=10 in a 4x4 grid", () => {
    const grid = [
      [BLACK, WHITE, BLACK, WHITE],
      [WHITE, BLACK, WHITE, BLACK],
      [BLACK, WHITE, BLACK, WHITE],
      [WHITE, BLACK, WHITE, BLACK],
    ];
    const { data, width, height } = createSyntheticImage(grid, 10);
    expect(detectBlockSize(data, width, height)).toBe(10);
  });

  it("detects blockSize when first row has consecutive same-color blocks", () => {
    // Row 0: WHITE WHITE WHITE BLACK — first run is 3 blocks wide
    // The GCD should still find the block size because other rows have single-block runs
    const grid = [
      [WHITE, WHITE, WHITE, BLACK],
      [BLACK, WHITE, BLACK, WHITE],
      [WHITE, BLACK, WHITE, BLACK],
      [BLACK, WHITE, WHITE, BLACK],
    ];
    const { data, width, height } = createSyntheticImage(grid, 15);
    expect(detectBlockSize(data, width, height)).toBe(15);
  });

  it("detects blockSize=1 for a 1:1 pixel art (no upscaling)", () => {
    const grid = [
      [BLACK, WHITE],
      [WHITE, BLACK],
    ];
    const { data, width, height } = createSyntheticImage(grid, 1);
    expect(detectBlockSize(data, width, height)).toBe(1);
  });

  it("detects blockSize in a panda-like 8x8 grid with blockSize=12", () => {
    // Simulates the panda face pattern
    const B = BLACK;
    const W = WHITE;
    const grid = [
      [B, W, W, B, W, W, B, W],
      [W, W, W, W, W, W, W, W],
      [W, B, W, W, W, W, B, W],
      [W, B, W, W, W, W, B, W],
      [W, W, W, B, B, W, W, W],
      [W, W, B, W, W, B, W, W],
      [W, W, W, B, B, W, W, W],
      [B, W, W, W, W, W, W, B],
    ];
    const { data, width, height } = createSyntheticImage(grid, 12);
    expect(detectBlockSize(data, width, height)).toBe(12);
  });

  it("handles uniform image (all one color)", () => {
    const grid = [
      [WHITE, WHITE, WHITE],
      [WHITE, WHITE, WHITE],
      [WHITE, WHITE, WHITE],
    ];
    // All pixels are the same, so runs span full rows/columns.
    // GCD of (width) and (height) when blockSize=10: GCD(30,30) = 30
    // This is expected — we can't distinguish block size in a uniform image
    const { data, width, height } = createSyntheticImage(grid, 10);
    const detected = detectBlockSize(data, width, height);
    // Should be a multiple of the actual block size (can't know better without color variation)
    expect(detected % 10).toBe(0);
  });

  it("detects blockSize with non-square grid (wider than tall)", () => {
    const grid = [
      [BLACK, WHITE, BLACK, WHITE, BLACK, WHITE],
      [WHITE, BLACK, WHITE, BLACK, WHITE, BLACK],
    ];
    const { data, width, height } = createSyntheticImage(grid, 8);
    expect(detectBlockSize(data, width, height)).toBe(8);
  });

  it("detects blockSize with 3 colors", () => {
    const RED: [number, number, number] = [255, 0, 0];
    const grid = [
      [BLACK, WHITE, RED],
      [RED, BLACK, WHITE],
      [WHITE, RED, BLACK],
    ];
    const { data, width, height } = createSyntheticImage(grid, 20);
    expect(detectBlockSize(data, width, height)).toBe(20);
  });
});
