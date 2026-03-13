/**
 * DrumDatePicker — iOS-style scroll drum picker with Day | Month | Year columns.
 * value / onChange use "YYYY-MM-DD" string format (same as input[type=date]).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const ITEM_H = 44; // px per row
const VISIBLE = 5; // rows visible (must be odd)
const CENTER = Math.floor(VISIBLE / 2); // 2

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── Single drum column ────────────────────────────────────────────────────────
function DrumColumn({
  items,
  selectedIndex,
  onSelect,
  labelFn,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  labelFn: (v: number) => string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  // Scroll to selected index
  const scrollTo = useCallback(
    (index: number, smooth = true) => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({
        top: index * ITEM_H,
        behavior: smooth ? "smooth" : "instant",
      });
    },
    []
  );

  // Init scroll position without animation
  useEffect(() => {
    scrollTo(selectedIndex, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When selectedIndex changes from parent (e.g. month change adjusts day)
  useEffect(() => {
    scrollTo(selectedIndex, true);
  }, [selectedIndex, scrollTo]);

  // Snap on scroll end
  const handleScrollEnd = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const raw = el.scrollTop / ITEM_H;
    const snapped = Math.round(raw);
    const idx = clamp(snapped, 0, items.length - 1);
    scrollTo(idx, true);
    onSelect(idx);
  }, [items.length, onSelect, scrollTo]);

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startScroll.current = listRef.current?.scrollTop ?? 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !listRef.current) return;
    const dy = startY.current - e.touches[0].clientY;
    listRef.current.scrollTop = startScroll.current + dy;
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    handleScrollEnd();
  };

  // Mouse drag (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startScroll.current = listRef.current?.scrollTop ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !listRef.current) return;
    const dy = startY.current - e.clientY;
    listRef.current.scrollTop = startScroll.current + dy;
  };
  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    handleScrollEnd();
  };

  const containerH = VISIBLE * ITEM_H;
  const paddingItems = CENTER; // invisible padding rows top & bottom

  return (
    <div
      className="relative flex-1 overflow-hidden select-none"
      style={{ height: containerH }}
    >
      {/* Fade top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: CENTER * ITEM_H,
          background: "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
        }}
      />
      {/* Highlight bar */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y border-border/60 bg-muted/40"
        style={{ top: CENTER * ITEM_H, height: ITEM_H }}
      />
      {/* Fade bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: CENTER * ITEM_H,
          background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
        }}
      />

      <ul
        ref={listRef}
        className="overflow-y-scroll overscroll-contain"
        style={{
          height: containerH,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Top padding */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <li key={`top-${i}`} style={{ height: ITEM_H }} />
        ))}

        {items.map((val, idx) => (
          <li
            key={val}
            className={cn(
              "flex items-center justify-center text-sm font-medium transition-all cursor-pointer",
              idx === selectedIndex
                ? "text-foreground text-base font-semibold"
                : "text-muted-foreground"
            )}
            style={{ height: ITEM_H }}
            onClick={() => {
              onSelect(idx);
              scrollTo(idx, true);
            }}
          >
            {labelFn(val)}
          </li>
        ))}

        {/* Bottom padding */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <li key={`bot-${i}`} style={{ height: ITEM_H }} />
        ))}
      </ul>
    </div>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────
interface DrumDatePickerProps {
  value?: string; // "YYYY-MM-DD" or ""
  onChange?: (value: string) => void; // "YYYY-MM-DD"
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export function DrumDatePicker({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  className,
}: DrumDatePickerProps) {
  // Parse initial value
  const parse = (v?: string) => {
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split("-").map(Number);
      return { year: y, month: m, day: d };
    }
    const today = new Date();
    return {
      year: today.getFullYear() - 30,
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
  };

  const [sel, setSel] = useState(() => parse(value));

  // Sync when value prop changes externally
  useEffect(() => {
    if (value) setSel(parse(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = getDaysInMonth(sel.year, sel.month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const emit = useCallback(
    (next: typeof sel) => {
      const safeDay = clamp(next.day, 1, getDaysInMonth(next.year, next.month));
      const pad = (n: number, len = 2) => String(n).padStart(len, "0");
      onChange?.(`${next.year}-${pad(next.month)}-${pad(safeDay)}`);
    },
    [onChange]
  );

  const setDay = (idx: number) => {
    const next = { ...sel, day: days[idx] };
    setSel(next);
    emit(next);
  };
  const setMonth = (idx: number) => {
    const newMonth = months[idx];
    const maxDay = getDaysInMonth(sel.year, newMonth);
    const next = { ...sel, month: newMonth, day: clamp(sel.day, 1, maxDay) };
    setSel(next);
    emit(next);
  };
  const setYear = (idx: number) => {
    const newYear = years[idx];
    const maxDay = getDaysInMonth(newYear, sel.month);
    const next = { ...sel, year: newYear, day: clamp(sel.day, 1, maxDay) };
    setSel(next);
    emit(next);
  };

  const dayIdx = days.indexOf(sel.day);
  const monthIdx = months.indexOf(sel.month);
  const yearIdx = years.indexOf(sel.year);

  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl border bg-background overflow-hidden",
        className
      )}
      style={{ height: VISIBLE * ITEM_H }}
    >
      {/* Day */}
      <DrumColumn
        items={days}
        selectedIndex={dayIdx < 0 ? 0 : dayIdx}
        onSelect={setDay}
        labelFn={(v) => String(v).padStart(2, "0")}
      />
      {/* Month */}
      <DrumColumn
        items={months}
        selectedIndex={monthIdx < 0 ? 0 : monthIdx}
        onSelect={setMonth}
        labelFn={(v) => THAI_MONTHS[v - 1]}
      />
      {/* Year */}
      <DrumColumn
        items={years}
        selectedIndex={yearIdx < 0 ? 0 : yearIdx}
        onSelect={setYear}
        labelFn={(v) => String(v + 543)} // Buddhist Era
      />
    </div>
  );
}
