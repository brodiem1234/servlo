"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";

export type PricebookSuggestion = {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  category: string | null;
  is_service: boolean;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: PricebookSuggestion) => void;
  items: PricebookSuggestion[];
  placeholder?: string;
  className?: string;
};

export function PricebookAutocomplete({
  value,
  onChange,
  onSelect,
  items,
  placeholder = "Description",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const suggestions =
    query.length >= 1
      ? items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              (item.category ?? "").toLowerCase().includes(query) ||
              (item.description ?? "").toLowerCase().includes(query)
          )
          .slice(0, 8)
      : [];

  // Close when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIdx(0);
  }, [suggestions.length]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions[highlightedIdx]) {
      e.preventDefault();
      onSelect(suggestions[highlightedIdx]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (value.length >= 1) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {items.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            title="Browse pricebook"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-[var(--accent-color)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            <BookOpen size={13} aria-hidden />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full z-40 mt-1 max-h-56 w-full min-w-[220px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-xl"
        >
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              role="option"
              aria-selected={idx === highlightedIdx}
              onMouseEnter={() => setHighlightedIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-xs ${
                idx === highlightedIdx
                  ? "bg-[var(--accent-color)] text-white"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight truncate">{item.name}</p>
                {item.category && (
                  <p className={`text-[10px] mt-0.5 truncate ${idx === highlightedIdx ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                    {item.category} · {item.is_service ? "Service" : "Product"}
                  </p>
                )}
              </div>
              <span className={`shrink-0 font-semibold tabular-nums ${idx === highlightedIdx ? "text-white" : "text-[var(--text-secondary)]"}`}>
                ${item.unit_price.toFixed(2)}/{item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
