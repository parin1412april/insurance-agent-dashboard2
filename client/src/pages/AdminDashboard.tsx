import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  Filter,
  Loader2,
  Phone,
  Plus,
  Search,
  Send,
  Shield,
  ShieldOff,
  ShieldPlus,
  ThumbsDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ColumnStatus =
  | "waiting_memo"
  | "editing_memo"
  | "memo_sent"
  | "pending_review"
  | "approved";

const COLUMN_CONFIG: Record<
  ColumnStatus,
  { title: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  waiting_memo: {
    title: "รอ Memo",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  editing_memo: {
    title: "กำลังแก้ Memo",
    icon: <FileEdit className="h-3.5 w-3.5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  memo_sent: {
    title: "ส่ง Memo แล้ว",
    icon: <Send className="h-3.5 w-3.5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  pending_review: {
    title: "รอการพิจารณา",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
  },
  approved: {
    title: "อนุมัติ",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
};

// ── Admin Cards View ─────────────────────────────────────────────────
function AdminCardsView() {
  const allCardsQuery = trpc.admin.allCards.useQuery();
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredCards = useMemo(() => {
    if (!allCardsQuery.data) return [];
    return allCardsQuery.data.filter((row) => {
      const matchSearch =
        !search ||
        row.card.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
        row.card.description.toLowerCase().includes(search.toLowerCase()) ||
        (row.profileNickname ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (row.profileFirstName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (row.profileLastName ?? "").toLowerCase().includes(search.toLowerCase());

      const matchAgent =
        filterAgent === "all" || row.card.userId.toString() === filterAgent;

      const matchStatus =
        filterStatus === "all" || row.card.columnStatus === filterStatus;

      return matchSearch && matchAgent && matchStatus;
    });
  }, [allCardsQuery.data, search, filterAgent, filterStatus]);

  // Unique agents for filter
  const agents = useMemo(() => {
    if (!allCardsQuery.data) return [];
    const map = new Map<number, { label: string }>();
    for (const row of allCardsQuery.data) {
      if (!map.has(row.card.userId)) {
        // Build label: firstName agentCode (e.g. "ปรินทร์ 696780")
        const namePart = row.profileFirstName || row.profileNickname || row.userName || `User #${row.card.userId}`;
        const codePart = row.profileAgentCode ? ` ${row.profileAgentCode}` : "";
        map.set(row.card.userId, { label: `${namePart}${codePart}` });
      }
    }
    return Array.from(map.entries()).map(([id, { label }]) => ({ id, label }));
  }, [allCardsQuery.data]);

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const grouped: Record<ColumnStatus, typeof filteredCards> = {
      waiting_memo: [],
      editing_memo: [],
      memo_sent: [],
      pending_review: [],
      approved: [],
    };
    for (const row of filteredCards) {
      const col = row.card.columnStatus as ColumnStatus;
      if (grouped[col]) grouped[col].push(row);
    }
    return grouped;
  }, [filteredCards]);

  if (allCardsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขกรมธรรม์, รายละเอียด, ชื่อตัวแทน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="สถานะเคส" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกเคส</SelectItem>
            <SelectItem value="waiting_memo">⏰ รอ Memo</SelectItem>
            <SelectItem value="editing_memo">📝 กำลังแก้ Memo</SelectItem>
            <SelectItem value="memo_sent">📤 ส่ง Memo แล้ว</SelectItem>
            <SelectItem value="pending_review">⚠️ รอการพิจารณา</SelectItem>
            <SelectItem value="approved">✅ อนุมัติ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-[180px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="ตัวแทน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(Object.entries(COLUMN_CONFIG) as [ColumnStatus, typeof COLUMN_CONFIG[ColumnStatus]][]).filter(([colKey]) => {
          return filterStatus === "all" || filterStatus === colKey;
        }).map(([colKey, cfg]) => {
          const colCards = cardsByColumn[colKey];
          return (
            <div key={colKey} className={filterStatus === "all" ? "flex-shrink-0 w-72" : "flex-shrink-0 w-full max-w-2xl"}>
              {/* Column header */}
              <div className={`rounded-t-xl px-4 py-3 border border-b-0 ${cfg.bgColor}`}>
                <div className={`flex items-center gap-2 ${cfg.color}`}>
                  {cfg.icon}
                  <span className="font-semibold text-sm">{cfg.title}</span>
                  <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60`}>
                    {colCards.length}
                  </span>
                </div>
              </div>
              {/* Cards */}
              <div className="rounded-b-xl border border-t-0 bg-muted/30 min-h-[200px] p-2 space-y-2">
                {colCards.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-6">
                    ไม่มีเคส
                  </div>
                )}
                {colCards.map((row) => (
                  <div
                    key={row.card.id}
                    className="rounded-lg border bg-card p-3 shadow-sm space-y-2"
                  >
                    <p className="font-bold text-sm text-primary">
                      {row.card.policyNumber}
                    </p>
                    <p className="text-xs text-card-foreground whitespace-pre-wrap break-words">
                      {row.card.description}
                    </p>
                    {(row.profileFirstName || row.profileAgentCode) && (
                      <div className="pt-2 border-t border-border/50">
                        {(row.profileFirstName || row.profileLastName) && (
                          <p className="text-xs font-medium text-muted-foreground">
                            {[row.profileFirstName, row.profileLastName].filter(Boolean).join(" ")}
                          </p>
                        )}
                        {(row.profileStatus || row.profileAgentCode) && (
                          <p className="text-xs font-bold text-muted-foreground">
                            {[row.profileStatus, row.profileAgentCode].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Users View ─────────────────────────────────────────────────
function AdminUsersView() {
  const { user: currentUser } = useAuth();
  const usersQuery = trpc.admin.allUsers.useQuery();
  const setRoleMutation = trpc.admin.setRole.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      toast.success("อัพเดทสิทธิ์สำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  const setRoleByEmailMutation = trpc.admin.setRoleByEmail.useMutation({
    onSuccess: (data) => {
      usersQuery.refetch();
      if (data.status === "updated") {
        toast.success("เพิ่มสิทธิ์ Admin สำเร็จ");
        setShowAddAdmin(false);
        setAdminEmail("");
      } else if (data.status === "not_found") {
        toast.error("ไม่พบ email นี้ในระบบ (ผู้ใช้ยังไม่ได้ Login เข้าระบบ)");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // Whitelist emails
  const whitelistQuery = trpc.admin.whitelistEmails.list.useQuery();
  const addWhitelistMutation = trpc.admin.whitelistEmails.add.useMutation({
    onSuccess: () => {
      whitelistQuery.refetch();
      toast.success("เพิ่ม email สำเร็จ");
      setShowAddEmail(false);
      setNewEmail({ email: "", name: "" });
    },
    onError: (err) => toast.error(err.message),
  });
  const removeWhitelistMutation = trpc.admin.whitelistEmails.remove.useMutation({
    onSuccess: () => {
      whitelistQuery.refetch();
      toast.success("ลบ email สำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState({ email: "", name: "" });
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const handleToggleRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setRoleMutation.mutate({ userId, role: newRole });
  };

  const handleAddAdminByEmail = () => {
    if (!adminEmail.trim()) {
      toast.error("กรุณากรอก email");
      return;
    }
    setRoleByEmailMutation.mutate({ email: adminEmail.trim(), role: "admin" });
  };

  if (usersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users with roles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">สมาชิกที่ Login แล้ว</CardTitle>
              <CardDescription>จัดการสิทธิ์ Admin ให้สมาชิกในทีม กดปุ่มโล่เพื่อสลับสิทธิ์</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddAdmin(true)}>
              <ShieldPlus className="mr-1.5 h-4 w-4" />
              เพิ่ม Admin ด้วย Email
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(usersQuery.data ?? []).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="text-sm font-medium">{u.name || "ไม่ระบุชื่อ"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : null}
                    {u.role}
                  </Badge>
                  {u.id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRole(u.id, u.role)}
                      disabled={setRoleMutation.isPending}
                      title={u.role === "admin" ? "ถอดสิทธิ์ Admin" : "ให้สิทธิ์ Admin"}
                    >
                      {u.role === "admin" ? (
                        <ShieldOff className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Whitelist emails */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Whitelist Emails</CardTitle>
              <CardDescription>
                Email ที่อนุญาตให้ Login เข้าระบบ
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddEmail(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              เพิ่ม Email
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {(whitelistQuery.data ?? []).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm"
                >
                  <div>
                    <span className="font-medium">{w.email}</span>
                    {w.name && (
                      <span className="text-muted-foreground ml-2">
                        ({w.name})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={w.isActive ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {w.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => {
                        if (window.confirm(`ลบ ${w.email} ออกจาก whitelist?`)) {
                          removeWhitelistMutation.mutate({ id: w.id });
                        }
                      }}
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Admin by Email Dialog */}
      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม Admin ด้วย Email</DialogTitle>
            <DialogDescription>
              ระบุ email ของสมาชิกที่ต้องการให้เป็น Admin (สมาชิกต้อง Login เข้าระบบอย่างน้อย 1 ครั้งก่อน)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email</Label>
              <Input
                id="adminEmail"
                placeholder="email@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddAdminByEmail();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdmin(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddAdminByEmail}
              disabled={setRoleByEmailMutation.isPending || !adminEmail.trim()}
            >
              {setRoleByEmailMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ให้สิทธิ์ Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Email Dialog */}
      <Dialog open={showAddEmail} onOpenChange={setShowAddEmail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม Email ใน Whitelist</DialogTitle>
            <DialogDescription>
              เพิ่ม email ที่อนุญาตให้ login เข้าระบบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="email@example.com"
                value={newEmail.email}
                onChange={(e) =>
                  setNewEmail({ ...newEmail, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="ชื่อ (ไม่บังคับ)"
                value={newEmail.name}
                onChange={(e) =>
                  setNewEmail({ ...newEmail, name: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmail(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() =>
                addWhitelistMutation.mutate({
                  email: newEmail.email,
                  name: newEmail.name || undefined,
                })
              }
              disabled={addWhitelistMutation.isPending || !newEmail.email}
            >
              {addWhitelistMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              เพิ่ม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Lead Column Status & Config (Admin view) ───────────────────────────
type LeadColumnStatus =
  | "new_lead"
  | "contacted"
  | "fact_finding"
  | "follow_up"
  | "closed_won"
  | "closed_lost";

const LEAD_COLUMN_CONFIG: Record<
  LeadColumnStatus,
  { title: string; icon: React.ReactNode; color: string; bgColor: string; headerText: string }
> = {
  new_lead: { title: "New Lead", icon: <Plus className="h-3.5 w-3.5" />, color: "text-sky-700", bgColor: "bg-sky-50", headerText: "รายชื่อใหม่" },
  contacted: { title: "Contacted", icon: <Phone className="h-3.5 w-3.5" />, color: "text-blue-700", bgColor: "bg-blue-50", headerText: "ติดต่อ/นัดหมายแล้ว" },
  fact_finding: { title: "Fact-Finding", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-violet-700", bgColor: "bg-violet-50", headerText: "วิเคราะห์/เสนอแผน" },
  follow_up: { title: "Follow-up", icon: <Clock className="h-3.5 w-3.5" />, color: "text-amber-700", bgColor: "bg-amber-50", headerText: "รอตัดสินใจ" },
  closed_won: { title: "Closed Won", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-700", bgColor: "bg-emerald-50", headerText: "ปิดการขาย 🏆" },
  closed_lost: { title: "Closed Lost", icon: <ThumbsDown className="h-3.5 w-3.5" />, color: "text-rose-700", bgColor: "bg-rose-50", headerText: "ปฏิเสธ/เลื่อนไปก่อน" },
};

const LEAD_TAG_OPTIONS = [
  { label: "สนใจสุขภาพ", color: "bg-green-100 text-green-800" },
  { label: "ลดหย่อนภาษี", color: "bg-blue-100 text-blue-800" },
  { label: "ประกันเด็ก", color: "bg-pink-100 text-pink-800" },
  { label: "VIP", color: "bg-yellow-100 text-yellow-800" },
  { label: "ประกันชีวิต", color: "bg-purple-100 text-purple-800" },
  { label: "ออมทรัพย์", color: "bg-teal-100 text-teal-800" },
  { label: "ประกันอุบัติเหตุ", color: "bg-orange-100 text-orange-800" },
  { label: "จากแอด", color: "bg-indigo-100 text-indigo-800" },
  { label: "คนรู้จัก", color: "bg-slate-100 text-slate-800" },
  { label: "TikTok", color: "bg-rose-100 text-rose-800" },
];

function getLeadTagColor(tag: string): string {
  const found = LEAD_TAG_OPTIONS.find((t) => t.label === tag);
  return found?.color ?? "bg-gray-100 text-gray-800";
}

type AdminLeadRow = {
  lead: {
    id: number;
    userId: number;
    name: string;
    phone: string;
    tags: string;
    expectedPremium: number;
    columnStatus: string;
    lastMovedAt: Date | string;
    notes: string | null;
    profileImageUrl: string | null;
    sortOrder: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  userName: string | null;
  userEmail: string | null;
  profileNickname: string | null;
  profileFirstName: string | null;
  profileLastName: string | null;
  profileAgentCode: string | null;
};

// ── Admin Leads View ─────────────────────────────────────────────────
function AdminLeadsView() {
  const allLeadsQuery = trpc.admin.allLeads.useQuery();
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredLeads = useMemo(() => {
    if (!allLeadsQuery.data) return [] as AdminLeadRow[];
    return (allLeadsQuery.data as AdminLeadRow[]).filter((row) => {
      const matchSearch =
        !search ||
        row.lead.name.toLowerCase().includes(search.toLowerCase()) ||
        row.lead.phone.toLowerCase().includes(search.toLowerCase()) ||
        (row.profileFirstName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (row.profileNickname ?? "").toLowerCase().includes(search.toLowerCase());
      const matchAgent = filterAgent === "all" || row.lead.userId.toString() === filterAgent;
      const matchStatus = filterStatus === "all" || row.lead.columnStatus === filterStatus;
      return matchSearch && matchAgent && matchStatus;
    });
  }, [allLeadsQuery.data, search, filterAgent, filterStatus]);

  const agents = useMemo(() => {
    if (!allLeadsQuery.data) return [];
    const map = new Map<number, { label: string }>();
    for (const row of allLeadsQuery.data as AdminLeadRow[]) {
      if (!map.has(row.lead.userId)) {
        const namePart = row.profileFirstName || row.profileNickname || row.userName || `User #${row.lead.userId}`;
        const codePart = row.profileAgentCode ? ` ${row.profileAgentCode}` : "";
        map.set(row.lead.userId, { label: `${namePart}${codePart}` });
      }
    }
    return Array.from(map.entries()).map(([id, { label }]) => ({ id, label }));
  }, [allLeadsQuery.data]);

  const leadsByColumn = useMemo(() => {
    const grouped: Record<LeadColumnStatus, AdminLeadRow[]> = {
      new_lead: [], contacted: [], fact_finding: [], follow_up: [], closed_won: [], closed_lost: [],
    };
    for (const row of filteredLeads) {
      const col = row.lead.columnStatus as LeadColumnStatus;
      if (grouped[col]) grouped[col].push(row);
    }
    return grouped;
  }, [filteredLeads]);

  const totalLeads = filteredLeads.length;
  const closedWon = leadsByColumn.closed_won.length;
  const totalPremium = leadsByColumn.closed_won.reduce((s, r) => s + r.lead.expectedPremium, 0);
  const pipelinePremium = filteredLeads
    .filter((r) => r.lead.columnStatus !== "closed_lost")
    .reduce((s, r) => s + r.lead.expectedPremium, 0);

  if (allLeadsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, เบอร์โทร, ชื่อตัวแทน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="new_lead">🆕 New Lead</SelectItem>
            <SelectItem value="contacted">📞 Contacted</SelectItem>
            <SelectItem value="fact_finding">📊 Fact-Finding</SelectItem>
            <SelectItem value="follow_up">⏳ Follow-up</SelectItem>
            <SelectItem value="closed_won">✅ Closed Won</SelectItem>
            <SelectItem value="closed_lost">❌ Closed Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-[180px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="ตัวแทน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(Object.entries(LEAD_COLUMN_CONFIG) as [LeadColumnStatus, typeof LEAD_COLUMN_CONFIG[LeadColumnStatus]][]).filter(([colKey]) => {
          return filterStatus === "all" || filterStatus === colKey;
        }).map(([colKey, cfg]) => {
          const colLeads = leadsByColumn[colKey];
          return (
            <div key={colKey} className={filterStatus === "all" ? "flex-shrink-0 w-72" : "flex-shrink-0 w-full max-w-2xl"}>
              <div className={`rounded-t-xl px-4 py-3 border border-b-0 ${cfg.bgColor}`}>
                <div className={`flex items-center gap-2 ${cfg.color}`}>
                  {cfg.icon}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm">{cfg.title}</span>
                    <span className="block text-[10px] opacity-70">{cfg.headerText}</span>
                  </div>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60">{colLeads.length}</span>
                </div>
              </div>
              <div className="rounded-b-xl border border-t-0 bg-muted/30 min-h-[200px] p-2 space-y-2">
                {colLeads.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-6">ไม่มีรายการ</div>
                )}
                {colLeads.map((row) => {
                  const tags = (() => { try { return JSON.parse(row.lead.tags) as string[]; } catch { return []; } })();
                  const agentName = row.profileFirstName
                    ? [row.profileFirstName, row.profileLastName].filter(Boolean).join(" ")
                    : row.profileNickname || row.userName || `User #${row.lead.userId}`;
                  return (
                    <div key={row.lead.id} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
                      <p className="font-bold text-sm text-primary leading-tight truncate">{row.lead.name}</p>
                      {row.lead.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />{row.lead.phone}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span key={tag} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getLeadTagColor(tag)}`}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {row.lead.expectedPremium > 0 && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <TrendingUp className="h-3 w-3" />฿{row.lead.expectedPremium.toLocaleString()}
                        </div>
                      )}
                      {row.lead.notes && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{row.lead.notes}</p>
                      )}
                      <div className="pt-1.5 border-t border-border/50">
                        <p className="text-[10px] font-medium text-muted-foreground">ตัวแทน: {agentName}{row.profileAgentCode ? ` (${row.profileAgentCode})` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมเคสของทีมทั้งหมด และจัดการสิทธิ์
        </p>
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">ติดตามเคส</TabsTrigger>
          <TabsTrigger value="leads">ติดตามผู้มุ่งหวัง</TabsTrigger>
          <TabsTrigger value="users">จัดการสมาชิก</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-4">
          <AdminCardsView />
        </TabsContent>
        <TabsContent value="leads" className="mt-4">
          <AdminLeadsView />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <AdminUsersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
