import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  GripVertical,
  Loader2,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ── Column definitions ───────────────────────────────────────────────
type ColumnStatus =
  | "waiting_memo"
  | "editing_memo"
  | "memo_sent"
  | "pending_review"
  | "approved";

interface ColumnDef {
  id: ColumnStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: "waiting_memo",
    title: "รอ Memo",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    id: "editing_memo",
    title: "กำลังแก้ Memo",
    icon: <FileEdit className="h-4 w-4" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "memo_sent",
    title: "ส่ง Memo แล้ว",
    icon: <Send className="h-4 w-4" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    id: "pending_review",
    title: "รอการพิจารณา",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: "approved",
    title: "อนุมัติ",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
];

// ── Types ────────────────────────────────────────────────────────────
interface KanbanCardData {
  id: number;
  userId: number;
  policyNumber: string;
  description: string;
  columnStatus: ColumnStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sortable Card ────────────────────────────────────────────────────
function SortableCard({
  card,
  onDelete,
  columnDef,
}: {
  card: KanbanCardData;
  onDelete: (id: number) => void;
  columnDef: ColumnDef;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card, columnId: card.columnStatus },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all p-3 ${columnDef.borderColor}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-xs font-bold tracking-wide ${columnDef.color}`}>
              {card.policyNumber}
            </span>
            <button
              onClick={() => onDelete(card.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Overlay Card (shown while dragging) ──────────────────────────────
function OverlayCard({ card }: { card: KanbanCardData }) {
  const colDef = COLUMNS.find((c) => c.id === card.columnStatus) ?? COLUMNS[0];
  return (
    <div className={`bg-white rounded-lg border-2 shadow-xl p-3 w-64 ${colDef.borderColor}`}>
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold tracking-wide ${colDef.color}`}>
            {card.policyNumber}
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words line-clamp-3 mt-1">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Droppable Kanban Column ─────────────────────────────────────────
function KanbanColumn({
  column,
  cards,
  onDelete,
  onAddCard,
}: {
  column: ColumnDef;
  cards: KanbanCardData[];
  onDelete: (id: number) => void;
  onAddCard: (columnStatus: ColumnStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  const cardIds = cards.map((c) => `card-${c.id}`);

  return (
    <div
      className={`flex flex-col rounded-xl border ${column.borderColor} ${column.bgColor} min-w-[260px] w-[260px] shrink-0 transition-all ${
        isOver ? "ring-2 ring-primary/30 scale-[1.01]" : ""
      }`}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${column.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className={column.color}>{column.icon}</span>
          <h3 className={`text-sm font-semibold ${column.color}`}>{column.title}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${column.bgColor} ${column.color} border ${column.borderColor}`}>
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(column.id)}
          className={`${column.color} hover:bg-white/60 rounded-md p-1 transition-colors`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards area - this is the droppable zone */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-220px)]">
        <div ref={setNodeRef} className="p-2 space-y-2 min-h-[80px]">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                onDelete={onDelete}
                columnDef={column}
              />
            ))}
          </SortableContext>
          {cards.length === 0 && (
            <div className={`flex items-center justify-center h-16 text-xs rounded-lg border-2 border-dashed transition-colors ${
              isOver ? "border-primary/40 bg-primary/5 text-primary/60" : "border-transparent text-muted-foreground/50"
            }`}>
              ลากการ์ดมาวางที่นี่
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Helper: find which column an id belongs to ──────────────────────
function findColumnForId(
  id: string,
  cards: KanbanCardData[]
): ColumnStatus | null {
  // Check if it's a column id
  if (id.startsWith("column-")) {
    const colId = id.replace("column-", "") as ColumnStatus;
    if (COLUMNS.some((c) => c.id === colId)) return colId;
  }
  // Check if it's a card id
  if (id.startsWith("card-")) {
    const cardId = parseInt(id.replace("card-", ""), 10);
    const card = cards.find((c) => c.id === cardId);
    if (card) return card.columnStatus;
  }
  return null;
}

// ── Main Kanban Board ────────────────────────────────────────────────
export default function KanbanBoard() {
  const utils = trpc.useUtils();
  const cardsQuery = trpc.kanban.list.useQuery();
  const createMutation = trpc.kanban.create.useMutation({
    onSuccess: () => {
      utils.kanban.list.invalidate();
      toast.success("สร้างการ์ดสำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });
  const moveMutation = trpc.kanban.move.useMutation({
    onSuccess: () => utils.kanban.list.invalidate(),
    onError: (err) => {
      toast.error(err.message);
      utils.kanban.list.invalidate();
    },
  });
  const deleteMutation = trpc.kanban.delete.useMutation({
    onSuccess: () => {
      utils.kanban.list.invalidate();
      toast.success("ลบการ์ดสำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createColumn, setCreateColumn] = useState<ColumnStatus>("waiting_memo");
  const [newCard, setNewCard] = useState({ policyNumber: "", description: "" });

  // Local state for optimistic drag
  const [localCards, setLocalCards] = useState<KanbanCardData[] | null>(null);

  const cards = (localCards ?? cardsQuery.data ?? []) as KanbanCardData[];

  const cardsByColumn = useMemo(() => {
    const map: Record<ColumnStatus, KanbanCardData[]> = {
      waiting_memo: [],
      editing_memo: [],
      memo_sent: [],
      pending_review: [],
      approved: [],
    };
    for (const card of cards) {
      if (map[card.columnStatus]) {
        map[card.columnStatus].push(card);
      }
    }
    return map;
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id.toString();
    if (!id.startsWith("card-")) return;
    const cardId = parseInt(id.replace("card-", ""), 10);
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setActiveCard(card);
      setLocalCards([...cards]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localCards) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (!activeId.startsWith("card-")) return;

    const overColumn = findColumnForId(overId, localCards);
    if (!overColumn) return;

    const activeCardId = parseInt(activeId.replace("card-", ""), 10);
    const currentCard = localCards.find((c) => c.id === activeCardId);
    if (!currentCard || currentCard.columnStatus === overColumn) return;

    setLocalCards((prev) =>
      (prev ?? []).map((c) =>
        c.id === activeCardId ? { ...c, columnStatus: overColumn } : c
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (localCards && activeCard) {
      const activeId = active.id.toString();
      if (activeId.startsWith("card-")) {
        const cardId = parseInt(activeId.replace("card-", ""), 10);

        // Determine final column
        let finalColumn: ColumnStatus = activeCard.columnStatus;
        if (over) {
          const overCol = findColumnForId(over.id.toString(), localCards);
          if (overCol) finalColumn = overCol;
        }

        // Also check from localCards state (which was updated in dragOver)
        const movedCard = localCards.find((c) => c.id === cardId);
        if (movedCard) {
          finalColumn = movedCard.columnStatus;
        }

        if (finalColumn !== activeCard.columnStatus) {
          moveMutation.mutate({
            id: cardId,
            columnStatus: finalColumn,
            sortOrder: 0,
          });
        }
      }
    }

    setActiveCard(null);
    setLocalCards(null);
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setLocalCards(null);
  };

  const handleAddCard = (columnStatus: ColumnStatus) => {
    setCreateColumn(columnStatus);
    setNewCard({ policyNumber: "", description: "" });
    setShowCreateDialog(true);
  };

  const handleCreateSubmit = () => {
    if (!newCard.policyNumber.trim() || !newCard.description.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    createMutation.mutate(
      {
        policyNumber: newCard.policyNumber.trim(),
        description: newCard.description.trim(),
        columnStatus: createColumn,
      },
      { onSuccess: () => setShowCreateDialog(false) }
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm("ต้องการลบการ์ดนี้ใช่หรือไม่?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (cardsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">ติดตามสถานะเคส</h1>
          <p className="text-sm text-muted-foreground">ลากการ์ดเพื่ออัพเดทสถานะ</p>
        </div>
        <Button onClick={() => handleAddCard("waiting_memo")} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มเคสใหม่
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={cardsByColumn[col.id]}
              onDelete={handleDelete}
              onAddCard={handleAddCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <OverlayCard card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Create Card Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มเคสใหม่</DialogTitle>
            <DialogDescription>
              กรอกเลขกรมธรรม์และรายละเอียดที่ต้องการติดตาม
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">เลขกรมธรรม์</Label>
              <Input
                id="policyNumber"
                placeholder="เช่น T249198676"
                value={newCard.policyNumber}
                onChange={(e) =>
                  setNewCard({ ...newCard, policyNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียดที่ต้องการติดตาม</Label>
              <Textarea
                id="description"
                placeholder="เช่น ลูกค้าเข้าตรวจสุขภาพวันนี้ 2 มี.ค. ส่งเอกสารประวัติสุขภาพเข้าไปทางอีเมลวันศุกร์ที่ 27 มี.ค. แล้ว..."
                value={newCard.description}
                onChange={(e) =>
                  setNewCard({ ...newCard, description: e.target.value })
                }
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              สร้างเคส
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
