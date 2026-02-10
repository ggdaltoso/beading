import type { AnalysisResult } from "../types";

interface ColorPanelProps {
  analysisResult: AnalysisResult;
  highlightedColor: string | null;
  onHoverColor: (hex: string | null) => void;
}

function ColorPanel({
  analysisResult,
  highlightedColor,
  onHoverColor,
}: ColorPanelProps) {
  const sorted = [...analysisResult.colorCounts].sort(
    (a, b) => b.count - a.count,
  );

  const total = sorted.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div
      className="flex flex-col gap-2 p-4"
      onMouseLeave={() => onHoverColor(null)}
    >
      <h2 className="text-lg font-semibold">Bead Colors</h2>
      <p className="text-sm text-gray-500">{total} beads total</p>

      <ul className="flex flex-col gap-1">
        {sorted.map(({ beadColor, count }) => {
          const isHighlighted = highlightedColor === beadColor.hex;
          const isDimmed =
            highlightedColor !== null && highlightedColor !== beadColor.hex;

          return (
            <li
              key={beadColor.hex}
              className={`flex items-center gap-3 rounded px-2 py-1 cursor-pointer transition-all ${
                isHighlighted ? "bg-blue-100" : ""
              } ${isDimmed ? "opacity-30" : ""}`}
              onMouseEnter={() => onHoverColor(beadColor.hex)}
            >
              <span
                className="inline-block h-6 w-6 shrink-0 rounded-full border border-gray-300"
                style={{ backgroundColor: beadColor.hex }}
              />
              <span className="flex-1 text-sm">{beadColor.name}</span>
              <span className="text-sm tabular-nums text-gray-600">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ColorPanel;
