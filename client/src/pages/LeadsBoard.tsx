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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import canvasConfetti from "canvas-confetti";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GripVertical,
  Loader2,
  Pencil,
  Phone,
  Plus,
  ThumbsDown,
  Trash2,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDroppable } from "@dnd-kit/core";

// ── Types ─────────────────────────────────────────────────────────────
type LeadColumnStatus =
  | "new_lead"
  | "contacted"
  | "fact_finding"
  | "follow_up"
  | "closed_won"
  | "closed_lost";

type Lead = {
  id: number;
  userId: number;
  name: string;
  phone: string;
  tags: string;
  expectedPremium: number;
  columnStatus: LeadColumnStatus;
  lastMovedAt: Date | string;
  notes: string | null;
  profileImageUrl: string | null;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// ── Column Config ─────────────────────────────────────────────────────
const COLUMN_CONFIG: Record<
  LeadColumnStatus,
  {
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    headerText: string;
  }
> = {
  new_lead: {
    title: "New Lead",
    icon: <Plus className="h-3.5 w-3.5" />,
    color: "text-sky-700 dark:text-sky-300",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    headerText: "รายชื่อใหม่",
  },
  contacted: {
    title: "Contacted",
    icon: <Phone className="h-3.5 w-3.5" />,
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    headerText: "ติดต่อ/นัดหมายแล้ว",
  },
  fact_finding: {
    title: "Fact-Finding & Quoted",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    color: "text-violet-700 dark:text-violet-300",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    headerText: "วิเคราะห์/เสนอแผน",
  },
  follow_up: {
    title: "Follow-up / Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    headerText: "รอตัดสินใจ",
  },
  closed_won: {
    title: "Closed Won",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    headerText: "ปิดการขาย 🏆",
  },
  closed_lost: {
    title: "Closed Lost",
    icon: <ThumbsDown className="h-3.5 w-3.5" />,
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    headerText: "ปฏิเสธ/เลื่อนไปก่อน",
  },
};

// Predefined tag options with colors
const TAG_OPTIONS = [
  { label: "สนใจสุขภาพ", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { label: "ลดหย่อนภาษี", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { label: "ประกันเด็ก", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300" },
  { label: "VIP", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { label: "ประกันชีวิต", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  { label: "ออมทรัพย์", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
  { label: "ประกันอุบัติเหตุ", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  { label: "จากแอด", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
  { label: "คนรู้จัก", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
  { label: "TikTok", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
];

function getTagColor(tag: string): string {
  const found = TAG_OPTIONS.find((t) => t.label === tag);
  return found?.color ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

// ── SLA helpers ───────────────────────────────────────────────────────
function getSLADays(lastMovedAt: Date | string): number {
  const moved = new Date(lastMovedAt).getTime();
  const now = Date.now();
  return Math.floor((now - moved) / (1000 * 60 * 60 * 24));
}

function getSLABorder(lead: Lead): string {
  // Only apply SLA to non-terminal columns
  if (lead.columnStatus === "closed_won" || lead.columnStatus === "closed_lost") return "";
  const days = getSLADays(lead.lastMovedAt);
  if (days >= 7) return "border-red-500 dark:border-red-500 border-2";
  if (days >= 3) return "border-yellow-400 dark:border-yellow-400 border-2";
  return "";
}

// ── Confetti ──────────────────────────────────────────────────────────
function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio: number, opts: object) {
    canvasConfetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// ── Lead Card Component ───────────────────────────────────────────────
function LeadCard({
  lead,
  onEdit,
  onDelete,
  isDragging = false,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: `lead-${lead.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const tags = useMemo(() => {
    try {
      return JSON.parse(lead.tags) as string[];
    } catch {
      return [];
    }
  }, [lead.tags]);

  const slaBorder = getSLABorder(lead);
  const slaDays = getSLADays(lead.lastMovedAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 shadow-sm space-y-2 cursor-default select-none ${slaBorder} ${isDragging ? "shadow-xl rotate-2" : ""}`}
    >
      {/* Header row: drag handle + name + actions */}
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          aria-label="ลาก"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-primary leading-tight truncate">{lead.name}</p>
          {lead.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(lead)}
            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
            aria-label="แก้ไข"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
            aria-label="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expected premium */}
      {lead.expectedPremium > 0 && (
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" />
          ฿{lead.expectedPremium.toLocaleString()}
        </div>
      )}

      {/* Notes preview */}
      {lead.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{lead.notes}</p>
      )}

      {/* SLA warning */}
      {slaDays >= 3 && lead.columnStatus !== "closed_won" && lead.columnStatus !== "closed_lost" && (
        <div
          className={`flex items-center gap-1 text-[10px] font-medium ${slaDays >= 7 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}
        >
          <AlertTriangle className="h-3 w-3" />
          {slaDays >= 7 ? `แช่อยู่ ${slaDays} วัน — ต้องติดตามด่วน!` : `แช่อยู่ ${slaDays} วัน`}
        </div>
      )}
    </div>
  );
}

// ── Droppable Column ──────────────────────────────────────────────────
function LeadColumn({
  colKey,
  leads,
  onEdit,
  onDelete,
  onAddLead,
}: {
  colKey: LeadColumnStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onAddLead: (status: LeadColumnStatus) => void;
}) {
  const cfg = COLUMN_CONFIG[colKey];
  const { setNodeRef, isOver } = useDroppable({ id: `col-${colKey}` });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className={`rounded-t-xl px-4 py-3 border border-b-0 ${cfg.bgColor}`}>
        <div className={`flex items-center gap-2 ${cfg.color}`}>
          {cfg.icon}
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm">{cfg.title}</span>
            <span className="block text-[10px] opacity-70">{cfg.headerText}</span>
          </div>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20">
            {leads.length}
          </span>
          <button
            onClick={() => onAddLead(colKey)}
            className={`${cfg.color} hover:opacity-70 transition-opacity`}
            aria-label="เพิ่มผู้มุ่งหวัง"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`rounded-b-xl border border-t-0 min-h-[200px] p-2 space-y-2 flex-1 transition-colors ${
          isOver ? "bg-primary/5 border-primary/30" : "bg-muted/30"
        }`}
      >
        <SortableContext
          items={leads.map((l) => `lead-${l.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-8 opacity-60">
              ยังไม่มีผู้มุ่งหวัง
            </div>
          )}
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ── Lead Form Dialog ──────────────────────────────────────────────────
type LeadFormData = {
  name: string;
  phone: string;
  tags: string[];
  expectedPremium: string;
  columnStatus: LeadColumnStatus;
  notes: string;
};

function LeadFormDialog({
  open,
  onClose,
  onSave,
  initialData,
  initialStatus,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: LeadFormData) => void;
  initialData?: Lead | null;
  initialStatus?: LeadColumnStatus;
  isLoading?: boolean;
}) {
  const [form, setForm] = useState<LeadFormData>(() => ({
    name: initialData?.name ?? "",
    phone: initialData?.phone ?? "",
    tags: initialData ? (() => { try { return JSON.parse(initialData.tags); } catch { return []; } })() : [],
    expectedPremium: initialData?.expectedPremium ? String(initialData.expectedPremium) : "",
    columnStatus: initialData?.columnStatus ?? initialStatus ?? "new_lead",
    notes: initialData?.notes ?? "",
  }));

  // Reset form when dialog opens
  const prevOpen = useRef(open);
  if (prevOpen.current !== open) {
    prevOpen.current = open;
    if (open) {
      setForm({
        name: initialData?.name ?? "",
        phone: initialData?.phone ?? "",
        tags: initialData ? (() => { try { return JSON.parse(initialData.tags); } catch { return []; } })() : [],
        expectedPremium: initialData?.expectedPremium ? String(initialData.expectedPremium) : "",
        columnStatus: initialData?.columnStatus ?? initialStatus ?? "new_lead",
        notes: initialData?.notes ?? "",
      });
    }
  }

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const [customTag, setCustomTag] = useState("");
  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setCustomTag("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "แก้ไขผู้มุ่งหวัง" : "เพิ่มผู้มุ่งหวังใหม่"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1">
            <Label>ชื่อ-นามสกุล *</Label>
            <Input
              placeholder="เช่น สมชาย ใจดี"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label>เบอร์โทรศัพท์</Label>
            <Input
              placeholder="เช่น 081-234-5678"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          {/* Expected Premium */}
          <div className="space-y-1">
            <Label>มูลค่าเบี้ยที่คาดหวัง (บาท/ปี)</Label>
            <Input
              type="number"
              placeholder="เช่น 25000"
              value={form.expectedPremium}
              onChange={(e) => setForm((f) => ({ ...f, expectedPremium: e.target.value }))}
            />
          </div>

          {/* Column Status */}
          <div className="space-y-1">
            <Label>สถานะ</Label>
            <Select
              value={form.columnStatus}
              onValueChange={(v) => setForm((f) => ({ ...f, columnStatus: v as LeadColumnStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(COLUMN_CONFIG) as [LeadColumnStatus, typeof COLUMN_CONFIG[LeadColumnStatus]][]).map(([k, cfg]) => (
                  <SelectItem key={k} value={k}>
                    {cfg.title} — {cfg.headerText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>ป้ายกำกับ (Tags)</Label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => toggleTag(t.label)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    form.tags.includes(t.label)
                      ? `${t.color} border-transparent ring-2 ring-primary/40`
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Custom tag */}
            <div className="flex gap-2">
              <Input
                placeholder="เพิ่ม tag เอง..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomTag}>
                เพิ่ม
              </Button>
            </div>
            {/* Selected custom tags */}
            {form.tags.filter((t) => !TAG_OPTIONS.find((o) => o.label === t)).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {form.tags
                  .filter((t) => !TAG_OPTIONS.find((o) => o.label === t))
                  .map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 flex items-center gap-1"
                    >
                      {t}
                      <button onClick={() => toggleTag(t)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>บันทึก / หมายเหตุ</Label>
            <Textarea
              placeholder="รายละเอียดเพิ่มเติม..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initialData ? "บันทึก" : "เพิ่มผู้มุ่งหวัง"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function LeadsBoard() {
  const leadsQuery = trpc.leads.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setDialogOpen(false);
      toast.success("เพิ่มผู้มุ่งหวังสำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setDialogOpen(false);
      toast.success("บันทึกสำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("ลบสำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<LeadColumnStatus>("new_lead");

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const allLeads = (leadsQuery.data ?? []) as Lead[];

  // Group by column
  const leadsByColumn = useMemo(() => {
    const grouped: Record<LeadColumnStatus, Lead[]> = {
      new_lead: [],
      contacted: [],
      fact_finding: [],
      follow_up: [],
      closed_won: [],
      closed_lost: [],
    };
    for (const lead of allLeads) {
      const col = lead.columnStatus as LeadColumnStatus;
      if (grouped[col]) grouped[col].push(lead);
    }
    return grouped;
  }, [allLeads]);

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    const id = parseInt(activeId.replace("lead-", ""), 10);
    return allLeads.find((l) => l.id === id) ?? null;
  }, [activeId, allLeads]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const leadId = parseInt(String(active.id).replace("lead-", ""), 10);
      const lead = allLeads.find((l) => l.id === leadId);
      if (!lead) return;

      // Determine target column
      let targetCol: LeadColumnStatus | null = null;
      const overId = String(over.id);
      if (overId.startsWith("col-")) {
        targetCol = overId.replace("col-", "") as LeadColumnStatus;
      } else if (overId.startsWith("lead-")) {
        const ovLeadId = parseInt(overId.replace("lead-", ""), 10);
        const ovLead = allLeads.find((l) => l.id === ovLeadId);
        if (ovLead) targetCol = ovLead.columnStatus;
      }

      if (targetCol && targetCol !== lead.columnStatus) {
        // Optimistic update
        utils.leads.list.setData(undefined, (old) => {
          if (!old) return old;
          return (old as Lead[]).map((l) =>
            l.id === leadId ? { ...l, columnStatus: targetCol!, lastMovedAt: new Date().toISOString() } : l
          ) as any;
        });

        updateStatusMutation.mutate(
          { id: leadId, columnStatus: targetCol },
          {
            onSuccess: () => {
              if (targetCol === "closed_won") {
                fireConfetti();
                toast.success("🏆 ปิดการขายสำเร็จ! ยินดีด้วยครับ!");
              }
            },
          }
        );
      }
    },
    [allLeads, updateStatusMutation, utils]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // handled in dragEnd
    },
    []
  );

  const handleAddLead = (status: LeadColumnStatus) => {
    setEditingLead(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("ต้องการลบผู้มุ่งหวังนี้หรือไม่?")) return;
    deleteMutation.mutate({ id });
  };

  const handleSave = (data: LeadFormData) => {
    const premium = parseInt(data.expectedPremium, 10) || 0;
    if (editingLead) {
      updateMutation.mutate({
        id: editingLead.id,
        name: data.name,
        phone: data.phone,
        tags: data.tags,
        expectedPremium: premium,
        columnStatus: data.columnStatus,
        notes: data.notes,
      });
    } else {
      createMutation.mutate({
        name: data.name,
        phone: data.phone,
        tags: data.tags,
        expectedPremium: premium,
        columnStatus: data.columnStatus,
        notes: data.notes,
      });
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // Summary stats
  const totalLeads = allLeads.length;
  const closedWon = leadsByColumn.closed_won.length;
  const totalPremium = leadsByColumn.closed_won.reduce((sum, l) => sum + l.expectedPremium, 0);
  const pipelinePremium = allLeads
    .filter((l) => l.columnStatus !== "closed_lost")
    .reduce((sum, l) => sum + l.expectedPremium, 0);

  if (leadsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ติดตามผู้มุ่งหวัง</h1>
          <p className="text-sm text-muted-foreground">CRM สำหรับติดตาม Pipeline ของลูกค้า</p>
        </div>
        <Button onClick={() => handleAddLead("new_lead")} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          เพิ่มผู้มุ่งหวัง
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">{totalLeads}</p>
          <p className="text-xs text-muted-foreground">ผู้มุ่งหวังทั้งหมด</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{closedWon}</p>
          <p className="text-xs text-muted-foreground">ปิดการขายแล้ว</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {totalPremium > 0 ? `฿${(totalPremium / 1000).toFixed(0)}K` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">เบี้ยที่ปิดได้</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {pipelinePremium > 0 ? `฿${(pipelinePremium / 1000).toFixed(0)}K` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Pipeline รวม</p>
        </div>
      </div>

      {/* SLA legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-yellow-400" />
          <span>แช่ 3–6 วัน</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-red-500" />
          <span>แช่ 7+ วัน (ด่วน!)</span>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 flex-1">
          {(Object.keys(COLUMN_CONFIG) as LeadColumnStatus[]).map((colKey) => (
            <LeadColumn
              key={colKey}
              colKey={colKey}
              leads={leadsByColumn[colKey]}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddLead={handleAddLead}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <LeadCard
              lead={activeLead}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Form dialog */}
      <LeadFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingLead}
        initialStatus={defaultStatus}
        isLoading={isMutating}
      />
    </div>
  );
}
