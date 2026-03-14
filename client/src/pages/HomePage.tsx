import { useAuth } from "@/_core/hooks/useAuth";
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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { useState, useMemo, useRef } from "react";

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
  imageUrl?: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(event?.imageUrl ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.imageUrl ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.calendar.uploadImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.url);
      setUploadingImage(false);
    },
    onError: () => setUploadingImage(false),
  });

  const createMutation = trpc.calendar.create.useMutation({
    onSuccess: () => { utils.calendar.list.invalidate(); onSaved(); onClose(); },
  });
  const updateMutation = trpc.calendar.update.useMutation({
    onSuccess: () => { utils.calendar.list.invalidate(); onSaved(); onClose(); },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Upload: strip data URL prefix
      const base64 = dataUrl.split(",")[1];
      setUploadingImage(true);
      uploadImageMutation.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      imageUrl: imageUrl ?? undefined,
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
      <DialogContent className="w-full max-w-md mx-auto flex flex-col max-h-[90dvh] p-0 gap-0">
        {/* Fixed header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle>{event ? "แก้ไข Event" : "เพิ่ม Event ใหม่"}</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 grid gap-4">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="ev-title">ชื่อ Event *</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ประชุมทีม, อบรม AIA..."
            />
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="ev-date">วันที่ *</Label>
            <Input
              id="ev-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          {/* All Day toggle */}
          <div className="flex items-center gap-3">
            <Switch id="ev-allday" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="ev-allday" className="cursor-pointer">ทั้งวัน (All Day)</Label>
          </div>

          {/* Time */}
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

          {/* Color */}
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

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">หมายเหตุ</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            />
          </div>

          {/* Image upload */}
          <div className="grid gap-1.5">
            <Label>รูปภาพ Event</Label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imagePreview}
                  alt="event preview"
                  className="w-full max-h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm">กำลังอัปโหลด...</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm">คลิกเพื่อเลือกรูปภาพ</span>
                <span className="text-xs">JPG, PNG, WEBP (สูงสุด 5MB)</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Fixed footer */}
        <DialogFooter className="px-5 py-4 border-t shrink-0 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending}>ยกเลิก</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !eventDate || uploadingImage}
          >
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

  const openAdd = (dateStr?: string) => {
    setEditingEvent(null);
    setSelectedDate(dateStr ?? null);
    setShowForm(true);
  };
  const openEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setSelectedDate(null);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              className="px-3 py-1.5 hover:bg-accent transition-colors"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 text-sm font-semibold min-w-[140px] text-center">
              {THAI_MONTHS[currentMonth - 1]} {currentYear + 543} BE
            </span>
            <button
              className="px-3 py-1.5 hover:bg-accent transition-colors"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>วันนี้</Button>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => openAdd()}>
            <Plus className="h-4 w-4 mr-1" />
            เพิ่ม Event
          </Button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {THAI_DAYS_SHORT.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y h-[calc(100%-36px)]">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - firstDow + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const dateStr = isCurrentMonth ? toDateStr(currentYear, currentMonth, dayNum) : "";
            const isToday = dateStr === todayStr;
            const dow = idx % 7;
            const dayEvents = dateStr ? (eventMap[dateStr] ?? []) : [];

            return (
              <div
                key={idx}
                className={`min-h-[80px] p-1 flex flex-col gap-0.5 ${
                  isCurrentMonth ? "bg-background hover:bg-accent/20" : "bg-muted/20"
                } ${isAdmin && isCurrentMonth ? "cursor-pointer" : ""}`}
                onClick={() => isAdmin && isCurrentMonth && openAdd(dateStr)}
              >
                {/* Day number */}
                <div className="flex justify-end">
                  {isCurrentMonth && (
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : dow === 0
                          ? "text-red-500"
                          : dow === 6
                          ? "text-blue-500"
                          : "text-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const c = COLOR_MAP[(ev.color as EventColor)] ?? COLOR_MAP.blue;
                    return (
                      <div
                        key={ev.id}
                        className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight ${c.badge} group relative`}
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                        <span className="truncate flex-1">
                          {ev.startTime && !ev.allDay ? `${ev.startTime} ` : ""}
                          {ev.title}
                        </span>
                        {isAdmin && (
                          <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                            <button
                              className="p-0.5 rounded hover:bg-black/10"
                              onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                            <button
                              className="p-0.5 rounded hover:bg-red-100 text-red-600"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: ev.id }); }}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 3} อื่นๆ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        {(Object.entries(COLOR_MAP) as [EventColor, (typeof COLOR_MAP)[EventColor]][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
            <span className="text-xs text-muted-foreground capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* Event form dialog */}
      {showForm && (
        <EventFormDialog
          open={showForm}
          onClose={closeForm}
          initialDate={selectedDate ?? undefined}
          event={editingEvent}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
