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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ImagePlus, X, CalendarPlus, Clock, Calendar } from "lucide-react";
import { useState, useMemo, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type OrgTag = "AIA" | "912" | "FinAlly" | "Heartworker" | "Financiaka" | "MergeMingle";
type CourseTag = "Products" | "ULP" | "Recruit" | "CS" | "FA" | "MDRT" | "Prestige" | "IT";

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
  orgTag?: string | null;
  courseTag?: string | null;
  createdBy: number;
};

const ORG_TAGS: { value: OrgTag; label: string; color: string; dot: string; badge: string; bar: string }[] = [
  { value: "AIA",        label: "AIA",         color: "red",    dot: "bg-red-500",     badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",         bar: "bg-red-500" },
  { value: "912",        label: "912",         color: "purple", dot: "bg-purple-500",  badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", bar: "bg-purple-500" },
  { value: "FinAlly",    label: "FinAlly",     color: "blue",   dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",       bar: "bg-blue-500" },
  { value: "Heartworker",label: "Heartworker", color: "green",  dot: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", bar: "bg-emerald-500" },
  { value: "Financiaka", label: "Financiaka",  color: "amber",  dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",   bar: "bg-amber-500" },
  { value: "MergeMingle",label: "MergeMingle", color: "orange", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300", bar: "bg-orange-500" },
];

const COURSE_TAGS: CourseTag[] = ["Products", "ULP", "Recruit", "CS", "FA", "MDRT", "Prestige", "IT"];

function getOrgStyle(orgTag?: string | null) {
  const org = ORG_TAGS.find(o => o.value === orgTag);
  return org ?? { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", bar: "bg-blue-500", color: "blue" };
}

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
  const [orgTag, setOrgTag] = useState<OrgTag | "">(event?.orgTag as OrgTag ?? "");
  // Parse existing courseTag JSON array or empty array
  const [courseTags, setCourseTags] = useState<CourseTag[]>(() => {
    if (!event?.courseTag) return [];
    try { return JSON.parse(event.courseTag) as CourseTag[]; } catch { return []; }
  });
  const toggleCourseTag = (ct: CourseTag) => {
    setCourseTags(prev =>
      prev.includes(ct) ? prev.filter(t => t !== ct) : [...prev, ct]
    );
  };
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
    // Derive color from orgTag automatically
    const derivedColor = orgTag ? (getOrgStyle(orgTag).color as EventColor) : color;
    const payload = {
      title: title.trim(),
      description: description || undefined,
      eventDate,
      startTime: allDay ? undefined : (startTime || undefined),
      endTime: allDay ? undefined : (endTime || undefined),
      color: derivedColor,
      allDay: allDay ? 1 : 0,
      imageUrl: imageUrl ?? undefined,
      orgTag: orgTag || undefined,
      courseTags: courseTags.length > 0 ? courseTags : undefined,
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

          {/* Org Tag */}
          <div className="grid gap-1.5">
            <Label>องค์กร</Label>
            <div className="flex flex-wrap gap-2">
              {ORG_TAGS.map((org) => (
                <button
                  key={org.value}
                  type="button"
                  onClick={() => setOrgTag(orgTag === org.value ? "" : org.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    orgTag === org.value
                      ? `${org.dot} text-white border-transparent`
                      : "bg-transparent border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${org.dot}`} />
                  {org.label}
                </button>
              ))}
            </div>
            {orgTag && (
              <p className="text-xs text-muted-foreground">สีของ event จะถูกกำหนดอัตโนมัติตามองค์กร</p>
            )}
          </div>

          {/* Course Tag (multi-select) */}
          <div className="grid gap-1.5">
            <Label>หมวดคอร์ส <span className="text-xs text-muted-foreground font-normal">(เลือกได้หลายอัน)</span></Label>
            <div className="flex flex-wrap gap-2">
              {COURSE_TAGS.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => toggleCourseTag(ct)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    courseTags.includes(ct)
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-transparent border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
            {courseTags.length > 0 && (
              <p className="text-xs text-muted-foreground">เลือกแล้ว: {courseTags.join(", ")}</p>
            )}
          </div>

          {/* Color (only shown when no orgTag) + Add to Calendar */}
          <div className="grid gap-1.5">
            {!orgTag && <Label>สี</Label>}
            <div className="flex items-center gap-2">
              {!orgTag && (
              <Select value={color} onValueChange={(v) => setColor(v as EventColor)}>
                <SelectTrigger className="flex-1">
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
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-xs"
                disabled={!title.trim() || !eventDate}
                onClick={() => {
                  // Build .ics content
                  const dtDate = eventDate.replace(/-/g, "");
                  let dtStart: string;
                  let dtEnd: string;
                  if (allDay) {
                    dtStart = `DTSTART;VALUE=DATE:${dtDate}`;
                    dtEnd = `DTEND;VALUE=DATE:${dtDate}`;
                  } else {
                    const st = (startTime || "00:00").replace(":", "") + "00";
                    const et = (endTime || startTime || "01:00").replace(":", "") + "00";
                    dtStart = `DTSTART:${dtDate}T${st}`;
                    dtEnd = `DTEND:${dtDate}T${et}`;
                  }
                  const uid = `${Date.now()}@finally-app`;
                  const desc = description ? description.replace(/\n/g, "\\n") : "";
                  const ics = [
                    "BEGIN:VCALENDAR",
                    "VERSION:2.0",
                    "PRODID:-//FinAlly//Calendar//TH",
                    "BEGIN:VEVENT",
                    `UID:${uid}`,
                    dtStart,
                    dtEnd,
                    `SUMMARY:${title.trim()}`,
                    desc ? `DESCRIPTION:${desc}` : "",
                    imageUrl ? `ATTACH:${imageUrl}` : "",
                    "END:VEVENT",
                    "END:VCALENDAR",
                  ].filter(Boolean).join("\r\n");
                  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.trim().replace(/[^a-zA-Z0-9ก-๙]/g, "_")}.ics`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Add to Calendar
              </Button>
            </div>
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

// ─── Event Detail Dialog ────────────────────────────────────────────────────
type EventDetailProps = {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  isAdmin: boolean;
  onEdit: (ev: CalendarEvent) => void;
  onDelete: (id: number) => void;
};

function EventDetailDialog({ open, onClose, event: ev, isAdmin, onEdit, onDelete }: EventDetailProps) {
  if (!ev) return null;

  const c = COLOR_MAP[(ev.color as EventColor) ?? "blue"];

  const formatDateFull = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const thaiYear = y + 543;
    const monthName = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][m - 1];
    const dayName = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"][new Date(y, m - 1, d).getDay()];
    return `วัน${dayName}ที่ ${d} ${monthName} ${thaiYear}`;
  };

  const timeLabel = ev.allDay === 1
    ? "ทั้งวัน"
    : ev.startTime
      ? `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ""} น.`
      : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Color bar at top */}
          <div className={`h-1.5 w-full ${c.bar}`} />

          {/* Poster image */}
          {ev.imageUrl && (
            <img
              src={ev.imageUrl}
              alt={ev.title}
              className="w-full object-cover max-h-[300px]"
            />
          )}

          <div className="p-5 space-y-4">
            {/* Title */}
            <DialogHeader>
              <DialogTitle className="text-lg leading-snug">{ev.title}</DialogTitle>
            </DialogHeader>

            {/* Date & time */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatDateFull(ev.eventDate)}</span>
              </div>
              {timeLabel && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{timeLabel}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {ev.description && (
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                {ev.description}
              </p>
            )}
          </div>
        </div>

        {/* Fixed footer with action buttons */}
        <div className="flex items-center gap-2 px-5 py-4 border-t flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => downloadICS(ev)}
          >
            <CalendarPlus className="h-4 w-4" />
            Add to Calendar
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => { onClose(); onEdit(ev); }}
              >
                <Pencil className="h-4 w-4" />
                แก้ไข
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => { onDelete(ev.id); onClose(); }}
              >
                <Trash2 className="h-4 w-4" />
                ลบกิจกรรม
              </Button>
            </>
          )}

          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Calendar Page ───────────────────────────────────────────────────────
export default function HomePage() {
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-based

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [filterOrg, setFilterOrg] = useState<OrgTag | null>(null);
  const [filterCourse, setFilterCourse] = useState<CourseTag | null>(null);

  const utils = trpc.useUtils();
  const { data: events = [] } = trpc.calendar.list.useQuery({ year: currentYear, month: currentMonth });
  const deleteMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => utils.calendar.list.invalidate(),
  });

  // Parse courseTag JSON array helper
  const parseCourseTagsFromEvent = (ev: CalendarEvent): string[] => {
    if (!ev.courseTag) return [];
    try { return JSON.parse(ev.courseTag) as string[]; } catch { return [ev.courseTag]; }
  };

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return (events as CalendarEvent[]).filter(ev => {
      if (filterOrg && ev.orgTag !== filterOrg) return false;
      if (filterCourse) {
        const tags = parseCourseTagsFromEvent(ev);
        if (!tags.includes(filterCourse)) return false;
      }
      return true;
    });
  }, [events, filterOrg, filterCourse]);

  // Build event map: dateStr → events[]
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of filteredEvents) {
      if (!map[ev.eventDate]) map[ev.eventDate] = [];
      map[ev.eventDate].push(ev as CalendarEvent);
    }
    return map;
  }, [filteredEvents]);

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
  const openDetail = (ev: CalendarEvent) => {
    setViewingEvent(ev);
  };
  const closeDetail = () => {
    setViewingEvent(null);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 max-w-[960px] mx-auto w-full">
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
        <Button size="sm" onClick={() => openAdd()}>
          <Plus className="h-4 w-4 mr-1" />
          เพิ่ม Event
        </Button>
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
                  isCurrentMonth ? "bg-background hover:bg-accent/20 cursor-pointer" : "bg-muted/20"
                }`}
                onClick={() => isCurrentMonth && openAdd(dateStr)}
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
                    const style = ev.orgTag ? getOrgStyle(ev.orgTag) : (COLOR_MAP[(ev.color as EventColor)] ?? COLOR_MAP.blue);
                    return (
                      <div
                        key={ev.id}
                        className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight ${style.badge} cursor-pointer hover:brightness-95 active:brightness-90 transition-all`}
                        onClick={(e) => { e.stopPropagation(); openDetail(ev as CalendarEvent); }}
                        title="คลิกเพื่อดูรายละเอียด"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                        <span className="truncate flex-1">
                          {ev.startTime && !ev.allDay ? `${ev.startTime} ` : ""}
                          {ev.title}
                        </span>
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

      {/* Filter bars */}
      <div className="flex flex-col gap-2 shrink-0">
        {/* Org filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-12 shrink-0">องค์กร</span>
          <button
            onClick={() => setFilterOrg(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              filterOrg === null ? "bg-foreground text-background border-transparent" : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            ทั้งหมด
          </button>
          {ORG_TAGS.map((org) => (
            <button
              key={org.value}
              onClick={() => setFilterOrg(filterOrg === org.value ? null : org.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                filterOrg === org.value
                  ? `${org.dot} text-white border-transparent`
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${org.dot}`} />
              {org.label}
            </button>
          ))}
        </div>
        {/* Course filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-12 shrink-0">คอร์ส</span>
          <button
            onClick={() => setFilterCourse(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              filterCourse === null ? "bg-foreground text-background border-transparent" : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            ทั้งหมด
          </button>
          {COURSE_TAGS.map((ct) => (
            <button
              key={ct}
              onClick={() => setFilterCourse(filterCourse === ct ? null : ct)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                filterCourse === ct
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {ct}
            </button>
          ))}
        </div>
      </div>

      {/* ── Upcoming Events Timeline ─────────────────────────────── */}
      <UpcomingTimeline filterOrg={filterOrg} filterCourse={filterCourse} />

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

      {/* Event detail dialog */}
      <EventDetailDialog
        open={!!viewingEvent}
        onClose={closeDetail}
        event={viewingEvent}
        isAdmin={true}
        onEdit={(ev) => openEdit(ev)}
        onDelete={(id) => deleteMutation.mutate({ id })}
      />
    </div>
  );
}

// ─── Upcoming Events Timeline ─────────────────────────────────────────────────
function downloadICS(ev: CalendarEvent) {
  const dtDate = ev.eventDate.replace(/-/g, "");
  let dtStart: string;
  let dtEnd: string;
  if (ev.allDay === 1) {
    dtStart = `DTSTART;VALUE=DATE:${dtDate}`;
    dtEnd = `DTEND;VALUE=DATE:${dtDate}`;
  } else {
    const st = (ev.startTime || "00:00").replace(":", "") + "00";
    const et = (ev.endTime || ev.startTime || "01:00").replace(":", "") + "00";
    dtStart = `DTSTART:${dtDate}T${st}`;
    dtEnd = `DTEND:${dtDate}T${et}`;
  }
  const uid = `${ev.id}-${Date.now()}@finally-app`;
  const desc = ev.description ? ev.description.replace(/\n/g, "\\n") : "";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FinAlly//Calendar//TH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    dtStart,
    dtEnd,
    `SUMMARY:${ev.title}`,
    desc ? `DESCRIPTION:${desc}` : "",
    ev.imageUrl ? `ATTACH:${ev.imageUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function UpcomingTimeline({ filterOrg, filterCourse }: { filterOrg: OrgTag | null; filterCourse: CourseTag | null }) {
  const { data: allEvents = [], isLoading } = trpc.calendar.upcoming.useQuery();

  // Apply same filters as calendar grid
  const events = allEvents.filter((ev) => {
    const typedEv = ev as CalendarEvent;
    if (filterOrg && typedEv.orgTag !== filterOrg) return false;
    if (filterCourse) {
      const tags: string[] = (() => {
        if (!typedEv.courseTag) return [];
        try { return JSON.parse(typedEv.courseTag) as string[]; } catch { return [typedEv.courseTag]; }
      })();
      if (!tags.includes(filterCourse)) return false;
    }
    return true;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const formatDateFull = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const thaiYear = y + 543;
    const monthName = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][m - 1];
    const dayName = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"][new Date(y, m - 1, d).getDay()];
    return `วัน${dayName}ที่ ${d} ${monthName} ${thaiYear}`;
  };

  const getBadge = (dateStr: string) => {
    if (dateStr === todayStr) return { text: "วันนี้", cls: "bg-primary text-primary-foreground" };
    if (dateStr === tomorrowStr) return { text: "พรุ่งนี้", cls: "bg-amber-500 text-white" };
    return null;
  };

  if (isLoading) {
    return (
      <div className="shrink-0 space-y-4 pb-6">
        <h2 className="text-base font-bold">กิจกรรมที่กำลังจะมาถึง</h2>
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border shadow-sm">
            <div className="aspect-[16/9] bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="shrink-0 py-8 text-center text-sm text-muted-foreground">
        ยังไม่มีกิจกรรมที่กำลังจะมาถึง
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-5 pb-6">
      <h2 className="text-base font-bold">กิจกรรมที่กำลังจะมาถึง</h2>
      {events.map((ev) => {
        const c = COLOR_MAP[(ev.color as EventColor) ?? "blue"];
        const badge = getBadge(ev.eventDate);
        const timeLabel = ev.allDay === 1
          ? "ทั้งวัน"
          : ev.startTime
            ? `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ""} น.`
            : null;

        return (
          <div key={ev.id} className="rounded-2xl overflow-hidden border shadow-sm bg-card">
            {/* Poster image — full width */}
            {ev.imageUrl ? (
              <img
                src={ev.imageUrl}
                alt={ev.title}
                className="w-full object-cover max-h-[360px]"
              />
            ) : (
              /* Placeholder banner with color */
              <div className={`w-full h-32 flex items-center justify-center ${c.bar} opacity-20`} />
            )}

            {/* Details */}
            <div className="p-4 space-y-2">
              {/* Date + badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDateFull(ev.eventDate)}
                </span>
                {badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.text}
                  </span>
                )}
                {timeLabel && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
                    {timeLabel}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold leading-snug">{ev.title}</h3>

              {/* Description */}
              {ev.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {ev.description}
                </p>
              )}

              {/* Add to Calendar button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 w-full sm:w-auto"
                  onClick={() => downloadICS(ev as CalendarEvent)}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
