import { useState, useRef, useCallback } from "react";
import { ImageCanvas } from "./components/ImageCanvas";
import ColorPanel from "./components/ColorPanel";
import type { AnalysisResult } from "./types";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blockSize, setBlockSize] = useState(16);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [highlightedColor, setHighlightedColor] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old URL to avoid memory leaks
    if (imageUrl) URL.revokeObjectURL(imageUrl);

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setAnalysisResult(null);
    setHighlightedColor(null);

    // Read natural dimensions
    const img = new Image();
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
    };
    img.src = url;
  };

  const handleAnalysis = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
  }, []);

  const handleHoverColor = useCallback((hex: string | null) => {
    setHighlightedColor(hex);
  }, []);

  const cols = naturalWidth > 0 ? Math.floor(naturalWidth / blockSize) : 0;
  const rows = naturalHeight > 0 ? Math.floor(naturalHeight / blockSize) : 0;
  const total = cols * rows;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Beading</h1>
          <p className="text-gray-500 mt-1">
            Square-stitch &amp; pixel art planner
          </p>
        </header>

        {/* File input */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium"
          >
            Open image
          </button>
        </div>

        {/* Slider + grid info */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Block size:
            </label>
            <input
              type="range"
              min={1}
              max={64}
              step={1}
              value={blockSize}
              onChange={(e) => setBlockSize(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
            <span className="text-sm text-gray-600 tabular-nums w-12">
              {blockSize}px
            </span>
          </div>
          {imageUrl && naturalWidth > 0 && (
            <p className="text-sm text-gray-500">
              Grid: {cols} x {rows} = {total} GridPixels
            </p>
          )}
        </div>

        {/* Canvas + Color panel */}
        {imageUrl && (
          <div className="flex flex-row flex-wrap gap-6">
            <div className="shrink-0">
              <ImageCanvas
                imageUrl={imageUrl}
                blockSize={blockSize}
                onAnalysis={handleAnalysis}
                highlightedColor={highlightedColor}
              />
            </div>
            {analysisResult && (
              <div className="flex-1 min-w-[240px]">
                <ColorPanel
                  analysisResult={analysisResult}
                  highlightedColor={highlightedColor}
                  onHoverColor={handleHoverColor}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
