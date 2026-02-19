export function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Detect the block size of a pixel art image by scanning rows and columns
 * for runs of uniform color, then computing the GCD of all run lengths.
 */
export function detectBlockSize(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  let result = 0;

  const sameColor = (i1: number, i2: number): boolean =>
    data[i1] === data[i2] &&
    data[i1 + 1] === data[i2 + 1] &&
    data[i1 + 2] === data[i2 + 2];

  // Scan sampled rows
  const rowCount = Math.min(40, height);
  for (let s = 0; s < rowCount; s++) {
    const row = Math.floor((s * height) / rowCount);
    let runLen = 1;
    for (let col = 1; col < width; col++) {
      const curr = (row * width + col) * 4;
      const prev = (row * width + col - 1) * 4;
      if (sameColor(curr, prev)) {
        runLen++;
      } else {
        result = result === 0 ? runLen : gcd(result, runLen);
        runLen = 1;
      }
    }
    result = result === 0 ? runLen : gcd(result, runLen);
  }

  // Scan sampled columns
  const colCount = Math.min(40, width);
  for (let s = 0; s < colCount; s++) {
    const col = Math.floor((s * width) / colCount);
    let runLen = 1;
    for (let row = 1; row < height; row++) {
      const curr = (row * width + col) * 4;
      const prev = ((row - 1) * width + col) * 4;
      if (sameColor(curr, prev)) {
        runLen++;
      } else {
        result = result === 0 ? runLen : gcd(result, runLen);
        runLen = 1;
      }
    }
    result = result === 0 ? runLen : gcd(result, runLen);
  }

  return Math.max(1, result);
}
