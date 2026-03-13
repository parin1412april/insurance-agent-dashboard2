import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type CalendarEvent = {
  id: number;
  title: string;
  description?: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  color: string;
  allDay: number;
  createdBy: number;
};

type EventColor = "blue" | "red" | "green" | "orange" | "purple" | "amber";

const COLOR_MAP: Record<EventColor, { dot: string; badge: string; bar: string }> = {
  blue:   { dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",   bar: "bg-blue-500" },
  red:    { dot: "bg-red-500",    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",       bar: "bg-red-500" },
  green:  { dot: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", bar: "bg-emerald-500" },
  orange: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300", bar: "bg-orange-500" },
  purple: { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", bar: "bg-purple-500" },
  amber:  { dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", bar: "bg-amber-500" },
};

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const THAI_DAYS_SHORT = ["อา","จ","อ","พ","พฤ","ศ","ส"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Event Form Dialog ────────────────────────────────────────────────────────
type EventFormProps = {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  event?: CalendarEvent | null;
  onSaved: () => void;
};

function EventFormDialog({ open, onClose, initialDate, event, onSaved }: EventFormProps) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventDate, setEventDate] = useState(event?.eventDate ?? initialDate ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [color, setColor] = useState<EventColor>((event?.color as EventColor) ?? "blue");
  const [allDay, setAllDay] = useState(event?.allDay === 1);

  const createMutation = trpc.calendar.create.useMutation({
    onSuccess: () => { utils.calendar.list.invalidate(); onSaved(); onClose(); },
  });
  const updateMutation = trpc.calendar.update.useMutation({
    onSuccess: () => { utils.calendar.list.invalidate(); onSaved(); onClose(); },
  });

  const handleSubmit = () => {
    if (!title.trim() || !eventDate) return;
    const payload = {
      title: title.trim(),
      description: description || undefined,
      eventDate,
      startTime: allDay ? undefined : (startTime || undefined),
      endTime: allDay ? undefined : (endTime || undefined),
      color,
      allDay: allDay ? 1 : 0,
    };
    if (event) {
      updateMutation.mutate({ id: event.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? "แก้ไข Event" : "เพิ่ม Event ใหม่"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ev-title">ชื่อ Event *</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ประชุมทีม, อบรม AIA..." />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-date">วันที่ *</Label>
            <Input id="ev-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="ev-allday" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="ev-allday" className="cursor-pointer">ทั้งวัน (All Day)</Label>
          </div>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-start">เวลาเริ่ม</Label>
                <Input id="ev-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ev-end">เวลาสิ้นสุด</Label>
                <Input id="ev-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>สี</Label>
            <Select value={color} onValueChange={(v) => setColor(v as EventColor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(COLOR_MAP) as EventColor[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${COLOR_MAP[c].dot}`} />
                      <span className="capitalize">{c}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">หมายเหตุ</Label>
            <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={isPending || !title.trim() || !eventDate}>
            {isPending ? "กำลังบันทึก..." : event ? "บันทึก" : "เพิ่ม Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Calendar Page ───────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-based

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: events = [] } = trpc.calendar.list.useQuery({ year: currentYear, month: currentMonth });
  const deleteMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => utils.calendar.list.invalidate(),
  });

  // Build event map: dateStr → events[]
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.eventDate]) map[ev.eventDate] = [];
      map[ev.eventDate].push(ev as CalendarEvent);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDow = getFirstDayOfWeek(currentYear, currentMonth); // 0=Sun
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentYear(y => y - 1); setCurrentMonth(12); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentYear(y => y + 1); setCurrentMonth(1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToday = () => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth() + 1); };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const handleDayClick = (dateStr: string) => {
    if (!isAdmin) return;
    setSelectedDate(dateStr);
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEditEvent = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    setEditingEvent(ev);
    setShowForm(true);
  };

  const handleDeleteEvent = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    if (confirm(`ลบ "${ev.title}" ?`)) deleteMutation.mutate({ id: ev.id });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {THAI_MONTHS[currentMonth - 1]}{" "}
            <span className="text-muted-foreground font-normal text-xl">
              {currentYear + 543} BE
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" onClick={() => { setEditingEvent(null); setSelectedDate(todayStr); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่ม Event
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={goToday}>วันนี้</Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              className="px-3 py-1.5 hover:bg-accent transition-colors"
              onClick={prevMonth}
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              className="px-3 py-1.5 hover:bg-accent transition-colors"
              onClick={nextMonth}
              aria-label="เดือนถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {THAI_DAYS_SHORT.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-semibold tracking-wide ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - firstDow + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const dateStr = isCurrentMonth ? toDateStr(currentYear, currentMonth, dayNum) : "";
            const isToday = dateStr === todayStr;
            const dayEvents = (isCurrentMonth && eventMap[dateStr]) ? eventMap[dateStr] : [];
            const dow = idx % 7; // 0=Sun, 6=Sat

            return (
              <div
                key={idx}
                onClick={() => isCurrentMonth && handleDayClick(dateStr)}
                className={[
                  "border-r border-b last:border-r-0 p-1.5 flex flex-col gap-0.5 min-h-[100px] transition-colors",
                  isCurrentMonth ? (isAdmin ? "cursor-pointer hover:bg-accent/30" : "cursor-default") : "bg-muted/20 opacity-50",
                  isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : "",
                  dow === 0 ? "bg-red-50/30 dark:bg-red-950/10" : "",
                  dow === 6 ? "bg-blue-50/30 dark:bg-blue-950/10" : "",
                ].join(" ")}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={[
                      "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-primary text-primary-foreground font-bold" : "",
                      !isCurrentMonth ? "text-muted-foreground/40" : dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-foreground",
                    ].join(" ")}
                  >
                    {isCurrentMonth ? dayNum : ""}
                  </span>
                </div>

                {/* Events */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const c = COLOR_MAP[(ev.color as EventColor)] ?? COLOR_MAP.blue;
                    return (
                      <div
                        key={ev.id}
                        className={`group flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium truncate ${c.badge}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`} />
                        <span className="truncate flex-1">
                          {ev.startTime && !ev.allDay ? `${ev.startTime} ` : ""}
                          {ev.title}
                        </span>
                        {isAdmin && (
                          <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => handleEditEvent(e, ev)}
                              className="opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-black/10"
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteEvent(e, ev)}
                              className="opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-red-200"
                            >
                              <Trash2 className="h-2.5 w-2.5 text-red-600" />
                            </button>
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} เพิ่มเติม</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pb-1">
        {!isAdmin && (
          <span className="italic">ดูได้อย่างเดียว — เฉพาะ Admin เพิ่ม/แก้ไข Event ได้</span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {(Object.keys(COLOR_MAP) as EventColor[]).map((c) => (
            <div key={c} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${COLOR_MAP[c].dot}`} />
              <span className="capitalize">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Form Dialog */}
      {showForm && (
        <EventFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
          initialDate={selectedDate ?? todayStr}
          event={editingEvent}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
