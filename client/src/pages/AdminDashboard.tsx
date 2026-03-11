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
  Search,
  Send,
  Shield,
  ShieldOff,
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
  const [filterColumn, setFilterColumn] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

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

      const matchColumn =
        filterColumn === "all" || row.card.columnStatus === filterColumn;

      const matchAgent =
        filterAgent === "all" || row.card.userId.toString() === filterAgent;

      return matchSearch && matchColumn && matchAgent;
    });
  }, [allCardsQuery.data, search, filterColumn, filterAgent]);

  // Unique agents for filter
  const agents = useMemo(() => {
    if (!allCardsQuery.data) return [];
    const map = new Map<number, string>();
    for (const row of allCardsQuery.data) {
      if (!map.has(row.card.userId)) {
        map.set(
          row.card.userId,
          row.profileNickname || row.profileFirstName || row.userName || `User #${row.card.userId}`
        );
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allCardsQuery.data]);

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
        <div className="flex gap-2">
          <Select value={filterColumn} onValueChange={setFilterColumn}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              {Object.entries(COLUMN_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[160px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="ตัวแทน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคน</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id.toString()}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(COLUMN_CONFIG).map(([key, cfg]) => {
          const count = (allCardsQuery.data ?? []).filter(
            (r) => r.card.columnStatus === key
          ).length;
          return (
            <div
              key={key}
              className={`rounded-lg border px-3 py-2 ${cfg.bgColor}`}
            >
              <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                {cfg.icon}
                <span className="text-xs font-medium">{cfg.title}</span>
              </div>
              <p className={`text-lg font-bold mt-0.5 ${cfg.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Cards list */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-2">
          {filteredCards.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              ไม่พบข้อมูล
            </div>
          )}
          {filteredCards.map((row) => {
            const cfg = COLUMN_CONFIG[row.card.columnStatus as ColumnStatus];
            const agentName =
              row.profileNickname ||
              (row.profileFirstName
                ? `${row.profileFirstName} ${row.profileLastName ?? ""}`
                : row.userName ?? "ไม่ทราบ");
            return (
              <Card key={row.card.id} className="border">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">
                          {row.card.policyNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${cfg.color} ${cfg.bgColor} border-current`}
                        >
                          {cfg.icon}
                          <span className="ml-1">{cfg.title}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {row.card.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{agentName}</p>
                      {row.profileAgentCode && (
                        <p className="text-[10px] text-muted-foreground">
                          รหัส: {row.profileAgentCode}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
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

  const handleToggleRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setRoleMutation.mutate({ userId, role: newRole });
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
          <CardTitle className="text-base">สมาชิกที่ Login แล้ว</CardTitle>
          <CardDescription>จัดการสิทธิ์ Admin ให้สมาชิกในทีม</CardDescription>
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
          <TabsTrigger value="cards">เคสทั้งหมด</TabsTrigger>
          <TabsTrigger value="users">จัดการสมาชิก</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-4">
          <AdminCardsView />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <AdminUsersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
