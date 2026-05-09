"use client";

import { useRef, useEffect, useState, useCallback } from "react";

type Tool = "draw" | "text" | "rect" | "circle";

type Point = { x: number; y: number };

type Stroke =
  | { tool: "draw"; points: Point[]; color: string; size: number }
  | { tool: "text"; point: Point; text: string; color: string; size: number }
  | { tool: "rect"; start: Point; end: Point; color: string; size: number }
  | { tool: "circle"; start: Point; end: Point; color: string; size: number };

const PRESET_COLORS = [
  { label: "Red", value: "#ef4444" },
  { label: "Yellow", value: "#facc15" },
  { label: "Green", value: "#22c55e" },
  { label: "White", value: "#ffffff" },
  { label: "Blue", value: "#3b82f6" },
];

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

export interface PhotoAnnotatorProps {
  photoUrl: string;
  onSave: (annotatedDataUrl: string) => void;
  onClose: () => void;
}

export function PhotoAnnotator({ photoUrl, onSave, onClose }: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);

  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#ef4444");
  const [penSize, setPenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0); // trigger re-renders for undo button

  const dragStartRef = useRef<Point | null>(null);
  const currentPathRef = useRef<Point[]>([]);
  const previewStrokeRef = useRef<Stroke | null>(null);

  // Redraw everything from strokes array
  const redraw = useCallback((extraStroke?: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the base image
    const img = imageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    const allStrokes = extraStroke
      ? [...strokesRef.current, extraStroke]
      : strokesRef.current;

    for (const s of allStrokes) {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (s.tool === "draw") {
        if (s.points.length < 2) {
          // Single dot
          ctx.beginPath();
          ctx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(s.points[0].x, s.points[0].y);
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].x, s.points[i].y);
          }
          ctx.stroke();
        }
      } else if (s.tool === "rect") {
        const w = s.end.x - s.start.x;
        const h = s.end.y - s.start.y;
        ctx.strokeRect(s.start.x, s.start.y, w, h);
      } else if (s.tool === "circle") {
        const rx = Math.abs(s.end.x - s.start.x) / 2;
        const ry = Math.abs(s.end.y - s.start.y) / 2;
        const cx = (s.start.x + s.end.x) / 2;
        const cy = (s.start.y + s.end.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.tool === "text") {
        const fontSize = Math.max(14, s.size * 4);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 3;
        ctx.fillText(s.text, s.point.x, s.point.y);
      }

      ctx.restore();
    }
  }, []);

  // Load image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      redraw();
    };
    img.onerror = () => {
      // Fallback: try without crossOrigin
      const img2 = new Image();
      img2.onload = () => {
        imageRef.current = img2;
        redraw();
      };
      img2.src = photoUrl;
    };
    img.src = photoUrl;
  }, [photoUrl, redraw]);

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getCanvasPos(e);

    if (tool === "text") {
      const text = window.prompt("Enter annotation text:");
      if (!text) return;
      const stroke: Stroke = { tool: "text", point: pos, text, color, size: penSize };
      strokesRef.current.push(stroke);
      setStrokeCount((c) => c + 1);
      redraw();
      return;
    }

    setIsDrawing(true);
    dragStartRef.current = pos;
    currentPathRef.current = [pos];
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !dragStartRef.current) return;
    const pos = getCanvasPos(e);

    if (tool === "draw") {
      currentPathRef.current.push(pos);
      const preview: Stroke = {
        tool: "draw",
        points: [...currentPathRef.current],
        color,
        size: penSize,
      };
      redraw(preview);
    } else if (tool === "rect") {
      const preview: Stroke = {
        tool: "rect",
        start: dragStartRef.current,
        end: pos,
        color,
        size: penSize,
      };
      previewStrokeRef.current = preview;
      redraw(preview);
    } else if (tool === "circle") {
      const preview: Stroke = {
        tool: "circle",
        start: dragStartRef.current,
        end: pos,
        color,
        size: penSize,
      };
      previewStrokeRef.current = preview;
      redraw(preview);
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !dragStartRef.current) return;
    const pos = getCanvasPos(e);
    setIsDrawing(false);

    if (tool === "draw") {
      currentPathRef.current.push(pos);
      const stroke: Stroke = {
        tool: "draw",
        points: [...currentPathRef.current],
        color,
        size: penSize,
      };
      strokesRef.current.push(stroke);
      setStrokeCount((c) => c + 1);
    } else if (tool === "rect") {
      const stroke: Stroke = {
        tool: "rect",
        start: dragStartRef.current,
        end: pos,
        color,
        size: penSize,
      };
      strokesRef.current.push(stroke);
      setStrokeCount((c) => c + 1);
    } else if (tool === "circle") {
      const stroke: Stroke = {
        tool: "circle",
        start: dragStartRef.current,
        end: pos,
        color,
        size: penSize,
      };
      strokesRef.current.push(stroke);
      setStrokeCount((c) => c + 1);
    }

    currentPathRef.current = [];
    dragStartRef.current = null;
    previewStrokeRef.current = null;
    redraw();
  }

  function handleUndo() {
    strokesRef.current.pop();
    setStrokeCount((c) => Math.max(0, c - 1));
    redraw();
  }

  function handleClear() {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onSave(dataUrl);
  }

  const toolButtons: { id: Tool; label: string; title: string }[] = [
    { id: "draw", label: "✏️", title: "Freehand draw" },
    { id: "text", label: "T", title: "Add text" },
    { id: "rect", label: "⬜", title: "Rectangle" },
    { id: "circle", label: "⭕", title: "Circle" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-[var(--bg-secondary)] shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Annotate Photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-2">
          {/* Tool buttons */}
          <div className="flex items-center gap-1">
            {toolButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                title={btn.title}
                onClick={() => setTool(btn.id)}
                className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold transition-colors ${
                  tool === btn.id
                    ? "bg-[var(--accent-color)] text-white"
                    : "bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--border)]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[var(--border)]" />

          {/* Preset colors */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c.value ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            {/* Custom color picker */}
            <label title="Custom color" className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--border)] hover:border-white">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute -inset-2 h-12 w-12 cursor-pointer opacity-0"
              />
              <span className="flex h-full w-full items-center justify-center text-[8px] text-[var(--text-muted)]">+</span>
            </label>
          </div>

          <div className="h-5 w-px bg-[var(--border)]" />

          {/* Pen size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Size</span>
            <input
              type="range"
              min={2}
              max={12}
              value={penSize}
              onChange={(e) => setPenSize(Number(e.target.value))}
              className="w-20 accent-[var(--accent-color)]"
            />
            <span className="w-4 text-center text-xs text-[var(--text-primary)]">{penSize}</span>
          </div>

          <div className="h-5 w-px bg-[var(--border)]" />

          {/* Undo / Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Undo"
              disabled={strokeCount === 0}
              onClick={handleUndo}
              className="flex h-8 items-center gap-1 rounded bg-[var(--bg-primary)] px-2 text-xs text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-40"
            >
              ↩ Undo
            </button>
            <button
              type="button"
              title="Clear all"
              disabled={strokeCount === 0}
              onClick={handleClear}
              className="flex h-8 items-center gap-1 rounded bg-[var(--bg-primary)] px-2 text-xs text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-40"
            >
              🗑 Clear
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-black p-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block max-h-full max-w-full rounded"
            style={{
              cursor: tool === "text" ? "text" : tool === "draw" ? "crosshair" : "crosshair",
              touchAction: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Save Annotation
          </button>
        </div>
      </div>
    </div>
  );
}
